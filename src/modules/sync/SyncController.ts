import { IDatabaseCollection, IDatabaseMap } from "@js-soft/docdb-access-abstractions"
import {
    ControllerName,
    CoreDate,
    CoreError,
    CoreId,
    RequestError,
    TransportController,
    TransportErrors,
    TransportLoggerFactory
} from "../../core"
import { AccountController } from "../accounts/AccountController"
import { BackboneDatawalletModification } from "./backbone/BackboneDatawalletModification"
import { BackboneSyncRun } from "./backbone/BackboneSyncRun"
import { CreateDatawalletModificationsRequestItem } from "./backbone/CreateDatawalletModifications"
import { FinalizeSyncRunRequestExternalEventResult } from "./backbone/FinalizeSyncRun"
import { StartSyncRunStatus, SyncRunType } from "./backbone/StartSyncRun"
import { SyncClient } from "./backbone/SyncClient"
import { ChangedItems } from "./ChangedItems"
import { DatawalletModificationMapper } from "./DatawalletModificationMapper"
import { CacheFetcher, DatawalletModificationsProcessor } from "./DatawalletModificationsProcessor"
import { ExternalEventsProcessor } from "./ExternalEventsProcessor"
import { DatawalletModification } from "./local/DatawalletModification"
import { DeviceMigrations } from "./migrations/DeviceMigrations"
import { IdentityMigrations } from "./migrations/IdentityMigrations"
import { WhatToSync } from "./WhatToSync"

export class SyncController extends TransportController {
    private client: SyncClient
    private syncInfo: IDatabaseMap
    private readonly supportedDatawalletVersion: number

    public constructor(
        parent: AccountController,
        private readonly unpushedDatawalletModifications: IDatabaseCollection,
        private readonly datawalletEnabled: boolean
    ) {
        super(ControllerName.Sync, parent)
        this.supportedDatawalletVersion = this.config.supportedDatawalletVersion
    }

    public async init(): Promise<SyncController> {
        await super.init()

        this.client = new SyncClient(this.config, this.parent.authenticator)
        this.syncInfo = await this.db.getMap("SyncInfo")

        return this
    }

    private currentSync?: LocalSyncRun
    private currentSyncRun?: BackboneSyncRun

    // TODO: JSSNMSHDD-2475 (return changed items from syncDatawallet)
    public async sync(): Promise<ChangedItems>
    public async sync(whatToSync: "OnlyDatawallet"): Promise<void>
    public async sync(whatToSync: "Everything"): Promise<ChangedItems>
    public async sync(whatToSync: WhatToSync): Promise<ChangedItems | void>
    public async sync(whatToSync: WhatToSync = "Everything"): Promise<ChangedItems | void> {
        if (this.currentSync?.includes(whatToSync)) {
            return await this.currentSync.promise
        }

        if (this.currentSync && !this.currentSync.includes(whatToSync)) {
            await this.currentSync.promise
            return await this.sync(whatToSync)
        }

        const syncPromise = this._sync(whatToSync)
        this.currentSync = new LocalSyncRun(syncPromise, whatToSync)

        try {
            return await this.currentSync.promise
        } finally {
            if (this.datawalletEnabled && (await this.unpushedDatawalletModifications.exists())) {
                await this.syncDatawallet().catch((e) => this.log.error(e))
            }

            this.currentSync = undefined
        }
    }

    private async _sync(whatToSync: WhatToSync): Promise<ChangedItems | void> {
        if (whatToSync === "OnlyDatawallet") {
            return await this.syncDatawallet()
        }

        const syncRunWasStarted = await this.startExternalEventsSyncRun()
        if (!syncRunWasStarted) {
            await this.syncDatawallet()
            await this.setLastCompletedSyncTime()
            return new ChangedItems()
        }

        await this.applyIncomingDatawalletModifications()
        const result = await this.applyIncomingExternalEvents()
        await this.finalizeExternalEventsSyncRun(result.results)
        await this.setLastCompletedSyncTime()

        if (result.results.some((r) => r.errorCode !== undefined)) {
            throw new CoreError(
                "error.transport.errorWhileApplyingExternalEvents",
                result.results
                    .filter((r) => r.errorCode !== undefined)
                    .map((r) => r.errorCode)
                    .join(" | ")
            ).logWith(this.log)
        }

        return result.changedItems
    }

    private async syncDatawallet() {
        if (!this.datawalletEnabled) {
            return
        }

        const datawalletInfo = (await this.client.getDatawallet()).value
        const identityDatawalletVersion = datawalletInfo.version

        if (this.supportedDatawalletVersion < identityDatawalletVersion) {
            throw TransportErrors.datawallet
                .insufficientSupportedDatawalletVersion(this.supportedDatawalletVersion, identityDatawalletVersion)
                .logWith(this.log)
        }

        this.log.trace("Synchronization of Datawallet events started...")

        try {
            await this.applyIncomingDatawalletModifications()
            await this.pushLocalDatawalletModifications()

            await this.setLastCompletedDatawalletSyncTime()
        } catch (e: unknown) {
            const outdatedErrorCode = "error.platform.validation.datawallet.insufficientSupportedDatawalletVersion"
            if (!(e instanceof RequestError) || e.code !== outdatedErrorCode) throw e

            throw TransportErrors.datawallet
                .insufficientSupportedDatawalletVersion(this.supportedDatawalletVersion, identityDatawalletVersion)
                .logWith(this.log)
        }

        this.log.trace("Synchronization of Datawallet events ended...")

        await this.checkDatawalletVersion(identityDatawalletVersion)
    }

    private async checkDatawalletVersion(identityDatawalletVersion: number) {
        if (this.supportedDatawalletVersion < identityDatawalletVersion) {
            throw TransportErrors.datawallet
                .insufficientSupportedDatawalletVersion(this.supportedDatawalletVersion, identityDatawalletVersion)
                .logWith(this.log)
        }

        if (this.supportedDatawalletVersion > identityDatawalletVersion) {
            await this.upgradeIdentityDatawalletVersion(identityDatawalletVersion, this.supportedDatawalletVersion)
        }

        const deviceDatawalletVersion = this.parent.activeDevice.device.datawalletVersion ?? 0
        if (deviceDatawalletVersion !== identityDatawalletVersion) {
            await this.upgradeDeviceDatawalletVersion(deviceDatawalletVersion, this.supportedDatawalletVersion)
        }
    }

    private async upgradeIdentityDatawalletVersion(identityDatawalletVersion: number, targetDatawalletVersion: number) {
        if (identityDatawalletVersion === targetDatawalletVersion) return

        if (this.supportedDatawalletVersion < targetDatawalletVersion) {
            throw TransportErrors.datawallet
                .insufficientSupportedDatawalletVersion(targetDatawalletVersion, identityDatawalletVersion)
                .logWith(this.log)
        }

        if (identityDatawalletVersion > targetDatawalletVersion) {
            throw TransportErrors.datawallet
                .currentBiggerThanTarget(identityDatawalletVersion, targetDatawalletVersion)
                .logWith(this.log)
        }

        const identityMigrations = new IdentityMigrations(this.parent)
        while (identityDatawalletVersion < targetDatawalletVersion) {
            identityDatawalletVersion++

            await this.startDatawalletVersionUpgradeSyncRun()

            const migrationFunction = (identityMigrations as any)[`v${identityDatawalletVersion}`] as
                | Function
                | undefined
            if (!migrationFunction) {
                throw TransportErrors.datawallet.noMigrationAvailable(identityDatawalletVersion).logWith(this.log)
            }

            await migrationFunction.call(identityMigrations)

            await this.finalizeDatawalletVersionUpgradeSyncRun(identityDatawalletVersion)
        }
    }

    private async upgradeDeviceDatawalletVersion(deviceDatawalletVersion: number, targetDatawalletVersion: number) {
        if (deviceDatawalletVersion === targetDatawalletVersion) return

        if (this.supportedDatawalletVersion < targetDatawalletVersion) {
            throw TransportErrors.datawallet
                .insufficientSupportedDatawalletVersion(targetDatawalletVersion, deviceDatawalletVersion)
                .logWith(this.log)
        }

        if (deviceDatawalletVersion > targetDatawalletVersion) {
            throw TransportErrors.datawallet
                .currentBiggerThanTarget(deviceDatawalletVersion, targetDatawalletVersion)
                .logWith(this.log)
        }

        const deviceMigrations = new DeviceMigrations(this.parent)
        while (deviceDatawalletVersion < targetDatawalletVersion) {
            deviceDatawalletVersion++

            const migrationFunction = (deviceMigrations as any)[`v${deviceDatawalletVersion}`] as Function | undefined
            if (!migrationFunction) {
                throw TransportErrors.datawallet.noMigrationAvailable(deviceDatawalletVersion).logWith(this.log)
            }

            await migrationFunction.call(deviceMigrations)

            await this.parent.activeDevice.update({ datawalletVersion: deviceDatawalletVersion })
        }
    }

    private async applyIncomingDatawalletModifications() {
        const getDatawalletModificationsResult = await this.client.getDatawalletModifications({
            localIndex: await this.getLocalDatawalletModificationIndex()
        })

        const encryptedIncomingModifications = await getDatawalletModificationsResult.value.collect()
        if (encryptedIncomingModifications.length === 0) {
            return
        }

        const incomingModifications = await this.decryptDatawalletModifications(encryptedIncomingModifications)

        this.log.trace(`${incomingModifications.length} incoming modifications found`)

        const datawalletModificationsProcessor = new DatawalletModificationsProcessor(
            incomingModifications,
            new CacheFetcher(
                this.parent.files,
                this.parent.messages,
                this.parent.relationshipTemplates,
                this.parent.relationships,
                this.parent.tokens
            ),
            this._db,
            TransportLoggerFactory.getLogger(DatawalletModificationsProcessor)
        )

        await datawalletModificationsProcessor.execute()

        this.log.trace(`${incomingModifications.length} incoming modifications executed`, incomingModifications)

        await this.updateLocalDatawalletModificationIndex(encryptedIncomingModifications.sort(descending)[0].index)
    }

    private async decryptDatawalletModifications(
        encryptedModifications: BackboneDatawalletModification[]
    ): Promise<DatawalletModification[]> {
        const decryptedModifications: DatawalletModification[] = []

        for (const encryptedModification of encryptedModifications) {
            const decryptedPayload = await this.parent.activeDevice.secrets.decryptDatawalletModificationPayload(
                encryptedModification.encryptedPayload,
                encryptedModification.index
            )
            const decryptedModification = await DatawalletModificationMapper.fromBackboneDatawalletModification(
                encryptedModification,
                decryptedPayload,
                this.config.supportedDatawalletVersion
            )
            decryptedModifications.push(decryptedModification)
        }

        return decryptedModifications
    }

    private async pushLocalDatawalletModifications() {
        const { backboneModifications, localModificationIds } = await this.prepareLocalDatawalletModificationsForPush()

        if (backboneModifications.length === 0) {
            return
        }

        const result = await this.client.createDatawalletModifications({
            localIndex: await this.getLocalDatawalletModificationIndex(),
            modifications: backboneModifications
        })

        await this.deleteUnpushedDatawalletModifications(localModificationIds)
        await this.updateLocalDatawalletModificationIndex(result.value.newIndex)
    }

    private async prepareLocalDatawalletModificationsForPush() {
        const backboneModifications: CreateDatawalletModificationsRequestItem[] = []
        const localModificationIds: CoreId[] = []

        if (!this.datawalletEnabled) {
            return { backboneModifications, localModificationIds }
        }

        const localDatawalletModifications = await this.parseArray(
            await this.unpushedDatawalletModifications.list(),
            DatawalletModification
        )

        const localIndex = await this.getLocalDatawalletModificationIndex()
        let calculatedIndex = typeof localIndex !== "number" ? 0 : localIndex + 1
        for (const localModification of localDatawalletModifications) {
            const encryptedPayload = await this.parent.activeDevice.secrets.encryptDatawalletModificationPayload(
                localModification,
                calculatedIndex++
            )
            const backboneModification = DatawalletModificationMapper.toCreateDatawalletModificationsRequestItem(
                localModification,
                encryptedPayload
            )

            localModificationIds.push(localModification.localId)
            backboneModifications.push(backboneModification)
        }
        return { backboneModifications, localModificationIds }
    }

    private async deleteUnpushedDatawalletModifications(localModificationIds: CoreId[]) {
        for (const localModificationId of localModificationIds) {
            await this.unpushedDatawalletModifications.delete({ localId: localModificationId.toString() })
        }
    }

    public async setInititalDatawalletVersion(version: number): Promise<void> {
        await this.startDatawalletVersionUpgradeSyncRun()
        await this.finalizeDatawalletVersionUpgradeSyncRun(version)
    }

    private async startExternalEventsSyncRun(): Promise<boolean> {
        const result = await this.client.startSyncRun({ type: SyncRunType.ExternalEventSync })

        if (result.value.status === StartSyncRunStatus.NoNewEvents) {
            return false
        }

        this.currentSyncRun = result.value.syncRun ?? undefined
        return this.currentSyncRun !== undefined
    }

    private async startDatawalletVersionUpgradeSyncRun() {
        const result = await this.client.startSyncRun({ type: SyncRunType.DatawalletVersionUpgrade })

        this.currentSyncRun = result.value.syncRun ?? undefined
        return this.currentSyncRun !== undefined
    }

    private async applyIncomingExternalEvents() {
        const getExternalEventsResult = await this.client.getExternalEventsOfSyncRun(this.currentSyncRun!.id.toString())

        if (getExternalEventsResult.isError) {
            throw getExternalEventsResult.error
        }

        const externalEvents = await getExternalEventsResult.value.collect()

        const externalEventProcessor = new ExternalEventsProcessor(
            this.parent.messages,
            this.parent.relationships,
            externalEvents
        )
        await externalEventProcessor.execute()

        return { results: externalEventProcessor.results, changedItems: externalEventProcessor.changedItems }
    }

    private async finalizeExternalEventsSyncRun(
        externalEventResults: FinalizeSyncRunRequestExternalEventResult[]
    ): Promise<void> {
        if (!this.currentSyncRun) {
            throw new Error("There is no active sync run to finalize")
        }

        const { backboneModifications, localModificationIds } = await this.prepareLocalDatawalletModificationsForPush()

        await this.client.finalizeExternalEventSync(this.currentSyncRun.id.toString(), {
            datawalletModifications: backboneModifications,
            externalEventResults: externalEventResults
        })

        await this.deleteUnpushedDatawalletModifications(localModificationIds)

        const oldDatawalletModificationIndex = await this.getLocalDatawalletModificationIndex()
        const newDatawalletModificationIndex = (oldDatawalletModificationIndex || -1) + backboneModifications.length
        await this.updateLocalDatawalletModificationIndex(newDatawalletModificationIndex)

        this.currentSyncRun = undefined
    }

    private async finalizeDatawalletVersionUpgradeSyncRun(newDatawalletVersion: number): Promise<void> {
        if (!this.currentSyncRun) {
            throw new Error("There is no active sync run to finalize")
        }

        const { backboneModifications, localModificationIds } = await this.prepareLocalDatawalletModificationsForPush()

        await this.client.finalizeDatawalletVersionUpgrade(this.currentSyncRun.id.toString(), {
            newDatawalletVersion,
            datawalletModifications: backboneModifications
        })

        await this.deleteUnpushedDatawalletModifications(localModificationIds)

        const oldDatawalletModificationIndex = await this.getLocalDatawalletModificationIndex()
        const newDatawalletModificationIndex = (oldDatawalletModificationIndex || -1) + backboneModifications.length
        await this.updateLocalDatawalletModificationIndex(newDatawalletModificationIndex)

        this.currentSyncRun = undefined
    }

    private async getLocalDatawalletModificationIndex() {
        const index = await this.syncInfo.get("localDatawalletModificationIndex")
        return index
    }

    private async updateLocalDatawalletModificationIndex(newIndex: number) {
        await this.syncInfo.set("localDatawalletModificationIndex", newIndex)
    }

    private async getSyncTimeByName(name: "Datawallet" | "Everything"): Promise<CoreDate | undefined> {
        const time = await this.syncInfo.get(`SyncTime-${name}`)
        const date = time ? CoreDate.from(time) : undefined
        return date
    }

    private async setSyncTimeByName(name: "Datawallet" | "Everything") {
        const dateString = CoreDate.utc().toISOString()
        await this.syncInfo.set(`SyncTime-${name}`, dateString)
    }

    public async getLastCompletedSyncTime(): Promise<CoreDate | undefined> {
        return await this.getSyncTimeByName("Everything")
    }

    public async getLastCompletedDatawalletSyncTime(): Promise<CoreDate | undefined> {
        return await this.getSyncTimeByName("Datawallet")
    }

    private async setLastCompletedSyncTime() {
        await this.setSyncTimeByName("Everything")
    }

    private async setLastCompletedDatawalletSyncTime() {
        await this.setSyncTimeByName("Datawallet")
    }
}

function descending(modification1: BackboneDatawalletModification, modification2: BackboneDatawalletModification) {
    return modification2.index - modification1.index
}

class LocalSyncRun {
    public constructor(public readonly promise: Promise<ChangedItems | void>, public readonly whatToSync: WhatToSync) {}

    public includes(whatToSync: WhatToSync) {
        if (this.whatToSync === "Everything") {
            return true
        }

        return whatToSync === "OnlyDatawallet"
    }
}
