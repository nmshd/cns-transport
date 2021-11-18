import { IDatabaseConnection } from "@js-soft/docdb-access-abstractions"
import { ILoggerFactory } from "@js-soft/logging-abstractions"
import { sleep } from "@js-soft/ts-utils"
import {
    AccountController,
    ClientResult,
    CoreDate,
    CoreId,
    IConfigOverwrite,
    Paginator,
    Transport
} from "@nmshd/transport"
import { expect } from "chai"
import { BackboneDatawalletModification } from "../../../src/modules/sync/backbone/BackboneDatawalletModification"
import { BackboneExternalEvent } from "../../../src/modules/sync/backbone/BackboneExternalEvent"
import {
    CreateDatawalletModificationsRequest,
    CreateDatawalletModificationsResponse
} from "../../../src/modules/sync/backbone/CreateDatawalletModifications"
import {
    FinalizeDatawalletVersionUpgradeRequest,
    FinalizeDatawalletVersionUpgradeResponse,
    FinalizeExternalEventSyncRequest
} from "../../../src/modules/sync/backbone/FinalizeSyncRun"
import { GetDatawalletResponse } from "../../../src/modules/sync/backbone/GetDatawallet"
import { GetDatawalletModificationsRequest } from "../../../src/modules/sync/backbone/GetDatawalletModifications"
import {
    StartSyncRunRequest,
    StartSyncRunResponse,
    StartSyncRunStatus
} from "../../../src/modules/sync/backbone/StartSyncRun"
import { ISyncClient } from "../../../src/modules/sync/backbone/SyncClient"
import { AbstractTest } from "../../testHelpers/AbstractTest"
import { FakePaginationDataSource } from "../../testHelpers/FakePaginationDataSource"
import { TestUtil } from "../../testHelpers/TestUtil"

export class FakeSyncClient implements ISyncClient {
    public createDatawalletModificationsRequest?: CreateDatawalletModificationsRequest
    public getDatawalletModificationsRequest?: GetDatawalletModificationsRequest
    public finalizeDatawalletVersionUpgradeRequest?: FinalizeDatawalletVersionUpgradeRequest
    public startSyncRunRequest?: StartSyncRunRequest | undefined
    public startSyncRun(request?: StartSyncRunRequest): Promise<ClientResult<StartSyncRunResponse>> {
        this.startSyncRunRequest = request

        return Promise.resolve(
            ClientResult.ok<StartSyncRunResponse>({
                status: StartSyncRunStatus.Created,
                syncRun: {
                    id: "",
                    expiresAt: CoreDate.utc().add({ minutes: 1 }).toISOString(),
                    createdAt: CoreDate.utc().toISOString(),
                    createdBy: "",
                    index: 0,
                    eventCount: 0,
                    createdByDevice: ""
                }
            })
        )
    }

    public finalizeExternalEventSync(
        _id: string,
        _request: FinalizeExternalEventSyncRequest
    ): Promise<
        ClientResult<import("../../../src/modules/sync/backbone/FinalizeSyncRun").FinalizeExternalEventSyncResponse>
    > {
        throw new Error("Method not implemented.")
    }

    public finalizeDatawalletVersionUpgrade(
        id: string,
        request: FinalizeDatawalletVersionUpgradeRequest
    ): Promise<ClientResult<FinalizeDatawalletVersionUpgradeResponse>> {
        this.finalizeDatawalletVersionUpgradeRequest = request

        return Promise.resolve(
            ClientResult.ok<FinalizeDatawalletVersionUpgradeResponse>({
                datawalletModifications: [],
                newDatawalletVersion: request.newDatawalletVersion
            })
        )
    }

    public getExternalEventsOfSyncRun(_syncRunId: string): Promise<ClientResult<Paginator<BackboneExternalEvent>>> {
        throw new Error("Method not implemented.")
    }

    public getDatawallet(): Promise<ClientResult<GetDatawalletResponse>> {
        return Promise.resolve(
            ClientResult.ok<GetDatawalletResponse>({
                version: 1
            })
        )
    }

    public getDatawalletModifications(
        request: GetDatawalletModificationsRequest
    ): Promise<ClientResult<Paginator<BackboneDatawalletModification>>> {
        this.getDatawalletModificationsRequest = request

        return Promise.resolve(
            ClientResult.ok(
                new Paginator(
                    [],
                    { pageNumber: 1, pageSize: 0, totalPages: 0, totalRecords: 0 },
                    FakePaginationDataSource.empty<BackboneDatawalletModification>()
                )
            )
        )
    }

    public async createDatawalletModifications(
        request: CreateDatawalletModificationsRequest
    ): Promise<ClientResult<CreateDatawalletModificationsResponse>> {
        this.createDatawalletModificationsRequest = request

        const response: CreateDatawalletModificationsResponse = {
            newIndex: request.modifications.length - 1,
            modifications: []
        }

        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < request.modifications.length; i++) {
            response.modifications.push({
                id: (await CoreId.generate()).serialize(),
                index: response.modifications.length,
                createdAt: CoreDate.utc().toISOString()
            })
        }

        return ClientResult.ok<CreateDatawalletModificationsResponse>(response)
    }
}

export class SyncControllerTest extends AbstractTest {
    public constructor(config: IConfigOverwrite, connection: IDatabaseConnection, loggerFactory: ILoggerFactory) {
        super({ ...config, datawalletEnabled: true }, connection, loggerFactory)
    }

    public run(): void {
        const that = this

        describe("SyncController", function () {
            let transport: Transport

            let sender: AccountController
            let recipient: AccountController

            this.timeout(150000)

            before(async function () {
                transport = new Transport(that.connection, that.config, that.loggerFactory)
                await TestUtil.clearAccounts(that.connection)
                await transport.init()
            })

            it("creating a new identity sets the identityDatawalletVersion to the supportedDatawalletVersion", async function () {
                const syncClient = new FakeSyncClient()

                const account = await TestUtil.createAccount(transport, SyncControllerTest.name, (container) => {
                    container.getSyncClient = () => syncClient
                })

                expect(syncClient.finalizeDatawalletVersionUpgradeRequest!.newDatawalletVersion).to.equal(
                    account.config.supportedDatawalletVersion
                )
            })

            it("all datawallet modifications are created with the configured supportedDatawalletVersion", async function () {
                const syncClient = new FakeSyncClient()

                const account = await TestUtil.createAccount(transport, SyncControllerTest.name, (container) => {
                    container.getSyncClient = () => syncClient
                })

                await account.tokens.sendToken({
                    content: { someProperty: "someValue" },
                    expiresAt: CoreDate.utc().add({ minutes: 1 }),
                    ephemeral: false
                })

                await account.syncDatawallet()

                for (const modification of syncClient.createDatawalletModificationsRequest!.modifications) {
                    expect(modification.datawalletVersion).to.equal(account.config.supportedDatawalletVersion)
                }
            })

            it("syncDatawallet upgrades identityDatawalletVersion to supportedDatawalletVersion", async function () {
                const syncClient = new FakeSyncClient()

                const account = await TestUtil.createAccount(transport, SyncControllerTest.name, (container) => {
                    container.getSyncClient = () => syncClient
                })

                TestUtil.defineMigrationToVersion(2, account)

                account.config.supportedDatawalletVersion = 2

                await account.syncDatawallet()

                expect(syncClient.startSyncRunRequest).to.exist
                expect(syncClient.finalizeDatawalletVersionUpgradeRequest).to.exist
                expect(syncClient.finalizeDatawalletVersionUpgradeRequest!.newDatawalletVersion).to.equal(2)
            })

            it("sync should return existing promise when called twice", async function () {
                const [sender, recipient] = await TestUtil.provideAccounts(transport, 2, SyncControllerTest.name)
                await TestUtil.addRelationship(sender, recipient)

                await TestUtil.sendMessage(sender, recipient)

                await sleep(200)

                const results = await Promise.all([
                    recipient.syncEverything(),
                    recipient.syncEverything(),
                    recipient.syncEverything()
                ])

                expect(results[0].messages).to.have.lengthOf(1)
                expect(results[1].messages).to.have.lengthOf(1)
                expect(results[2].messages).to.have.lengthOf(1)

                const messages = await recipient.messages.getMessages()
                expect(messages).to.have.lengthOf(1)
            }).timeout(15000)

            after(async function () {
                if (sender) await sender.close() // eslint-disable-line @typescript-eslint/no-unnecessary-condition
                if (recipient) await recipient.close() // eslint-disable-line @typescript-eslint/no-unnecessary-condition
            })
        })
    }
}
