import { AccountController, Transport } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest, TestUtil } from "../../testHelpers"

export class RejectAcceptTest extends AbstractTest {
    public run(): void {
        const that = this

        describe("Reject and accept relationship / send message", function () {
            let transport: Transport

            let sender: AccountController
            let recipient: AccountController

            this.timeout(150000)

            before(async function () {
                transport = new Transport(that.connection, that.config, that.loggerFactory)
                await TestUtil.clearAccounts(that.connection)

                await transport.init()

                const accounts = await TestUtil.provideAccounts(transport, 2, RejectAcceptTest.name)
                sender = accounts[0]
                recipient = accounts[1]

                await TestUtil.addRejectedRelationship(sender, recipient)
                await TestUtil.addRelationship(sender, recipient)
            })

            it("should send a message", async function () {
                await TestUtil.sendMessage(sender, recipient)

                const messageList = await TestUtil.syncUntilHasMessages(recipient, 1)
                expect(messageList.length).equals(1)
            }).timeout(15000)

            after(async function () {
                await sender.close()
                await recipient.close()
            })
        })
    }
}
