// TODO: JSSNMSHDD-2491 (find a good place for this tests)

import { IDatabaseConnection } from "@js-soft/docdb-access-abstractions"
import { ILoggerFactory } from "@js-soft/logging-abstractions"
import { sleep } from "@js-soft/ts-utils"
import {
    AccountController,
    ClientResult,
    CreateDatawalletModificationsRequestItem,
    IConfigOverwrite
} from "@nmshd/transport"
import chai, { expect } from "chai"
import chaiQuantifiers from "chai-quantifiers"
import { StartSyncRunResponse, SyncRunType } from "../../../src/modules/sync/backbone/StartSyncRun"
import { SyncClient } from "../../../src/modules/sync/backbone/SyncClient"
import { AbstractTest, TestUtil } from "../../testHelpers"

chai.use(chaiQuantifiers)

export class BackboneConcurrencyTests extends AbstractTest {
    public constructor(config: IConfigOverwrite, connection: IDatabaseConnection, loggerFactory: ILoggerFactory) {
        super({ ...config, datawalletEnabled: true }, connection, loggerFactory)
    }

    public run(): void {
        const that = this

        describe("BackboneConcurrency", function () {
            this.timeout("200s")

            it("should not allow pushing datawallet modifications during active sync run", async function () {
                const a1 = await that.createIdentityWithOneDevice(BackboneConcurrencyTests.name)
                const { device1: b1, device2: b2 } = await that.createIdentityWithTwoDevices(
                    BackboneConcurrencyTests.name
                )
                const syncClientB1 = createSyncClient(b1)
                const syncClientB2 = createSyncClient(b2)

                await TestUtil.addRelationship(a1, b1)
                await TestUtil.sendMessage(a1, b1)

                await sleep(2000)

                const localIndex = await (b1 as any).synchronization.getLocalDatawalletModificationIndex()

                await syncClientB1.startSyncRun({ type: SyncRunType.ExternalEventSync })
                const resultOfCreate = await syncClientB2.createDatawalletModifications({
                    modifications: [new CreateDatawalletModificationsRequestItemBuilder().build()],
                    localIndex
                })

                expect(resultOfCreate.isError).to.be.true
                expect(resultOfCreate.error.code).to.equal(
                    "error.platform.validation.datawallet.cannotPushDatawalletModificationsDuringActiveSyncRun"
                )
            })

            it.only("should only start one sync run on multiple calls", async function () {
                const a1 = await that.createIdentityWithOneDevice(BackboneConcurrencyTests.name)

                const numberOfDevices = 20
                const b = await that.createIdentityWithNDevices(BackboneConcurrencyTests.name, numberOfDevices)
                const b1 = b[0]

                await TestUtil.addRelationship(a1, b1)
                await TestUtil.sendMessage(a1, b1)

                await sleep(2000)

                const startSyncRunPromises = b.map((bn) =>
                    createSyncClient(bn).startSyncRun({
                        type: SyncRunType.ExternalEventSync
                    })
                )
                const startSyncRunResults = await Promise.all(startSyncRunPromises)

                const successes = startSyncRunResults.filter((r) => r.isSuccess)
                const errors = startSyncRunResults.filter((r) => r.isError)

                expect(successes).to.have.lengthOf(1)
                expect(errors).to.have.lengthOf(numberOfDevices - 1)

                expect(errors).to.containAll(
                    (e: ClientResult<StartSyncRunResponse>) =>
                        e.error.code ===
                        "error.platform.validation.syncRun.cannotStartSyncRunWhenAnotherSyncRunIsRunning"
                )
            })
        })
    }
}

class CreateDatawalletModificationsRequestItemBuilder {
    private readonly collection = "aCollection"
    private readonly objectIdentifier = "anIdentifier"
    private readonly type = "Create"
    private readonly encryptedPayload = "AAAA"
    private readonly payloadCategory = "technicalData"

    public build(): CreateDatawalletModificationsRequestItem {
        return {
            collection: this.collection,
            objectIdentifier: this.objectIdentifier,
            type: this.type,
            encryptedPayload: this.encryptedPayload,
            payloadCategory: this.payloadCategory,
            datawalletVersion: 1
        }
    }
}

function createSyncClient(accountController: AccountController) {
    return new TestableSyncClient(accountController)
}

class TestableSyncClient extends SyncClient {
    public constructor(accountController: AccountController) {
        super(accountController.config, accountController.authenticator)
    }

    public async getAllExternalEventsOfSyncRun(id: string) {
        return await (await this.getExternalEventsOfSyncRun(id)).value.collect()
    }
}
