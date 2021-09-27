import { IDatabaseConnection } from "@js-soft/docdb-access-abstractions"
import { ILoggerFactory } from "@js-soft/logging-abstractions"
import { sleep } from "@js-soft/ts-utils"
import { AccountController, IConfigOverwrite, Transport } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest } from "../../core/AbstractTest"
import { TestUtil } from "../../core/TestUtil"

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

                const accounts = await TestUtil.provideAccounts(transport, 2, SyncControllerTest.name)
                ;[sender, recipient] = accounts

                await TestUtil.addRelationship(sender, recipient)
            })

            it("sync should return existing promise when called twice", async function () {
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
                await sender.close()
                await recipient.close()
            })
        })
    }
}
