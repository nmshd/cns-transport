/* eslint-disable jest/no-commented-out-tests */
// TODO: JSSNMSHDD-2491 (find a good place for this tests)

/*

import {
    AccountController,
    ClientResult,
    CreateDatawalletModificationsRequestItem,
    IConfigOverwrite,
    ILoggerFactory
} from "@nmshd/transport"
import { IDatabaseConnection } from "@js-soft/docdb-access-abstractions"
import { sleep } from "@js-soft/ts-utils"
import chai, { expect } from "chai"
import chaiQuantifiers from "chai-quantifiers"
import { StartSyncRunResponse, StartSyncRunStatus } from "../../../src/modules/sync/backbone/StartSyncRun"
import { SyncClient } from "../../../src/modules/sync/backbone/SyncClient"
import { AbstractTest, TestUtil } from "../../testHelpers"

chai.use(chaiQuantifiers)

export class BackboneConcurrencyTests extends AbstractTest {
    constructor(config: IConfigOverwrite, connection: IDatabaseConnection, loggerFactory: ILoggerFactory) {
        super({ ...config, datawalletEnabled: true }, connection, loggerFactory)
    }

    public async run() {
        const that = this

         describe("MessageSync", async function () {
            this.timeout("200s")

            it("should not allow pushing datawallet modifications during active sync run", async function() {
                const a1 = await that.createIdentityWithOneDevice()
                const { device1: b1, device2: b2 } = await that.createIdentityWithTwoDevices()
                const syncClientB1 = createSyncClient(b1)
                const syncClientB2 = createSyncClient(b2)

                await TestUtil.addRelationship(a1, b1)
                await TestUtil.sendMessage(a1, b1)

                await sleep(2000)

                await syncClientB1.startSyncRun()
                const resultOfCreate = await syncClientB2.createDatawalletModifications({
                    modifications: [new CreateDatawalletModificationsRequestItemBuilder().build()]
                })

                expect(resultOfCreate.isError).to.be.true
                expect(resultOfCreate.error.code).to.equal(
                    "error.platform.validation.datawallet.cannotPushDatawalletModificationsDuringActiveSyncRun"
                )
            })

            it(`while finalization of a sync run is in progress, an incoming start sync
            run request should wait for finalization to finish`, async () => {
                let successfulStarts = 0
                let successfulFinalizations = 0

                const runTest = async () => {
                    const a1 = await that.createIdentityWithOneDevice()
                    const { device1: b1, device2: b2 } = await that.createIdentityWithTwoDevices()
                    const syncClientB1 = createSyncClient(b1)
                    const syncClientB2 = createSyncClient(b2)

                    await TestUtil.addRelationship(a1, b1)
                    await TestUtil.sendMessage(a1, b1)

                    await sleep(2000)

                    const startedSyncRun = (await syncClientB1.startSyncRun()).value!.syncRun
                    const externalEventsOfSyncRun = await syncClientB1.getAllExternalEventsOfSyncRun(startedSyncRun.id)

                    await sleep(10000)

                    const finalizeSyncRunPromise = syncClientB1.finalizeSyncRun(startedSyncRun.id, {
                        datawalletModifications: [],
                        externalEventResults: externalEventsOfSyncRun.map((e) => ({ externalEventId: e.id }))
                    })
                    await sleep(10)
                    const startSyncRunPromise = syncClientB2.startSyncRun()

                    const finalizeSyncRunResult = await finalizeSyncRunPromise
                    const startSyncRunResult = await startSyncRunPromise

                    if (finalizeSyncRunResult.isSuccess) {
                        successfulFinalizations++
                        // When finalization was successful, this means that the request was started before the
                        // request for starting a new sync run. This means that the request for starting a new
                        // sync run waits until the finalization is finished. Therefore the request is successful.
                        // But since the previous one has processed all external events, no new sync run is started.
                        expect(startSyncRunResult.isSuccess).to.be.true
                        expect(startSyncRunResult.value.status).to.equal("NoNewEvents")
                    }

                    if (
                        startSyncRunResult.isSuccess &&
                        startSyncRunResult.value.status === StartSyncRunStatus.Created
                    ) {
                        successfulStarts++
                        // When a new sync run was started, this means that the old one was canceled.
                        // Therefore the finalization request should have failed.
                        expect(finalizeSyncRunResult.isError).to.be.true
                        expect(finalizeSyncRunResult.error.code).to.equal(
                            "error.platform.validation.syncRun.syncRunAlreadyFinalized"
                        )
                    }
                }

                await Promise.all([
                    runTest(),
                    runTest(),
                    runTest(),
                    runTest(),
                    runTest(),
                    runTest(),
                    runTest(),
                    runTest(),
                    runTest(),
                    runTest()
                ])

                console.log("Successful starts:", successfulStarts)
                console.log("Successful finalizations:", successfulFinalizations)
            })

            it("should only start one sync run on multiple calls", async function() {
                const a1 = await that.createIdentityWithOneDevice()

                const numberOfDevices = 10
                const b = await that.createIdentityWithNDevices(numberOfDevices)
                const b1 = b[0]

                await TestUtil.addRelationship(a1, b1)
                await TestUtil.sendMessage(a1, b1)

                await sleep(2000)

                const startSyncRunPromises = b.map((bn) => createSyncClient(bn).startSyncRun())
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
    private collection = "aCollection"
    private objectIdentifier = "anIdentifier"
    private type = "Create"
    private encryptedPayload = "AAAA"
    private payloadCategory = "technicalData"

    public build(): CreateDatawalletModificationsRequestItem {
        return {
            collection: this.collection,
            objectIdentifier: this.objectIdentifier,
            type: this.type,
            encryptedPayload: this.encryptedPayload,
            payloadCategory: this.payloadCategory
        }
    }
}

function createSyncClient(accountController: AccountController) {
    return new TestableSyncClient(accountController)
}

class TestableSyncClient extends SyncClient {
    constructor(accountController: AccountController) {
        super(accountController.config, accountController.authenticator)
    }

    public async getAllExternalEventsOfSyncRun(id: string) {
        return await (await this.getExternalEventsOfSyncRun(id)).value.collect()
    }
}

*/
