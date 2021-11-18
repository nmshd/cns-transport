import { IDatabaseConnection } from "@js-soft/docdb-access-abstractions"
import { ILoggerFactory } from "@js-soft/logging-abstractions"
import { sleep } from "@js-soft/ts-utils"
import { AccountController, CoreDate, IConfigOverwrite, Transport } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest, FakeSyncClient, TestUtil } from "../../testHelpers"

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
