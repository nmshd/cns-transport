import { JSONWrapperAsync, SerializableAsync } from "@js-soft/ts-serval"
import { AccountController, RelationshipChangeRequest, Transport } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest } from "../../core/AbstractTest"
import { TestUtil } from "../../core/TestUtil"

export class RelationshipsCustomContentTest extends AbstractTest {
    public run(): void {
        const that = this

        describe("Relationships Custom Content", function () {
            let transport: Transport

            let sender: AccountController
            let recipient: AccountController

            this.timeout(150000)

            before(async function () {
                transport = new Transport(that.connection, that.config, that.loggerFactory)

                await TestUtil.clearAccounts(that.connection)

                await transport.init()

                const accounts = await TestUtil.provideAccounts(transport, 2, RelationshipsCustomContentTest.name)
                sender = accounts[0]
                recipient = accounts[1]
            })

            it("should create a relationship with custom content", async function () {
                const tokenReference = await TestUtil.sendRelationshipTemplateAndToken(sender)
                const template = await TestUtil.fetchRelationshipTemplateFromTokenReference(recipient, tokenReference)
                const customContent = await SerializableAsync.from({
                    content: "TestToken"
                })
                const relRecipient = await TestUtil.sendRelationship(recipient, template, customContent)
                const relRecipientRequest = relRecipient.cache!.creationChange.request

                const relSender = await TestUtil.syncUntilHasRelationships(sender)
                const relSenderRequest = relSender[0].cache!.creationChange.request

                expect(relRecipientRequest).instanceOf(RelationshipChangeRequest)
                expect(relSenderRequest).instanceOf(RelationshipChangeRequest)

                expect(relRecipientRequest.content).instanceOf(JSONWrapperAsync)
                const recipientToken = relRecipientRequest.content as JSONWrapperAsync
                expect(relSenderRequest.content).instanceOf(JSONWrapperAsync)
                const senderToken = relSenderRequest.content as JSONWrapperAsync

                expect((recipientToken.toJSON() as any).content).equals("TestToken")
                expect((senderToken.toJSON() as any).content).equals("TestToken")
            }).timeout(15000)

            after(async function () {
                await sender.close()
                await recipient.close()
            })
        })
    }
}
