import { AccountController, Transport } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest } from "../../core/AbstractTest"
import { TestUtil } from "../../core/TestUtil"

export class ListRelationshipMessagesTest extends AbstractTest {
    public run(): void {
        const that = this

        describe("List Relationship Messages", function () {
            let transport: Transport
            let recipient: AccountController
            let sender1: AccountController
            let sender2: AccountController

            this.timeout(200000)

            before(async function () {
                transport = new Transport(that.connection, that.config, that.loggerFactory)
                await TestUtil.clearAccounts(that.connection)
                await transport.init()

                const accounts = await TestUtil.provideAccounts(transport, 3, ListRelationshipMessagesTest.name)

                recipient = accounts[0]
                sender1 = accounts[1]
                sender2 = accounts[2]

                await TestUtil.addRelationship(recipient, sender1)
                await TestUtil.addRelationship(recipient, sender2)

                await TestUtil.sendMessage(sender1, recipient)
                await TestUtil.sendMessage(sender2, recipient)
            })

            it("should sync messages over all relationships", async function () {
                const messageList = await TestUtil.syncUntilHasMessages(recipient, 2)
                expect(messageList).to.have.lengthOf(2)

                const messageListDb = await recipient.messages.getMessages()
                expect(messageListDb).to.have.lengthOf(2)
            }).timeout(60000)

            it("should sync messages over all relationships again and return 0 messages", async function () {
                const messageList = (await recipient.syncEverything()).messages
                expect(messageList).to.have.lengthOf(0)
            }).timeout(60000)

            it("should list messages over all relationships", async function () {
                const messageList = await recipient.messages.getReceivedMessages()
                expect(messageList.length).equals(2)
            }).timeout(60000)

            it("sender messages should be 0", async function () {
                const messageList = await sender1.messages.getReceivedMessages()
                expect(messageList.length).equals(0)
            }).timeout(60000)

            after(async function () {
                await recipient.close()
                await sender1.close()
                await sender2.close()
            })
        })
    }
}
