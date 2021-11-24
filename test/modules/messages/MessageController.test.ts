import { AccountController, CoreDate, CoreId, Message, MessageController, Transport } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest, TestUtil } from "../../testHelpers"

export class MessageControllerTest extends AbstractTest {
    public run(): void {
        const that = this

        describe("MessageController", function () {
            let transport: Transport

            let sender: AccountController
            let recipient: AccountController
            let tempId1: CoreId
            let tempId2: CoreId
            let tempDate: CoreDate
            let relationshipId: CoreId

            this.timeout(150000)

            function expectValidMessages(sentMessage: Message, receivedMessage: Message, nowMinusSeconds: CoreDate) {
                expect(sentMessage.id.toString()).equals(receivedMessage.id.toString())
                const sentRelIds = sentMessage.relationshipIds.map((id) => id.toString())
                const receivedRelIds = receivedMessage.relationshipIds.map((id) => id.toString())
                expect(sentRelIds.join()).equals(receivedRelIds.join())
                expect(sentMessage.cache).to.exist
                expect(sentMessage.cachedAt?.isSameOrAfter(nowMinusSeconds)).to.be.true
                expect(sentMessage.cache?.createdBy.toString()).equals(sender.identity.address.toString())
                expect(sentMessage.cache?.createdByDevice.toString()).equals(sender.activeDevice.id.toString())
                expect(sentMessage.cache?.createdAt.isSameOrAfter(nowMinusSeconds)).to.be.true
                expect(receivedMessage.cache).to.exist
                expect(receivedMessage.cachedAt?.isSameOrAfter(nowMinusSeconds)).to.be.true
                expect(receivedMessage.cache?.createdBy.toString()).equals(sender.identity.address.toString())
                expect(receivedMessage.cache?.createdByDevice.toString()).equals(sender.activeDevice.id.toString())
                expect(receivedMessage.cache?.createdAt.isSameOrAfter(nowMinusSeconds)).to.be.true
                expect(sentMessage.cache!.recipients.map((r) => r.toString())).has.members(
                    receivedMessage.cache!.recipients.map((r) => r.toString())
                )
                expect(sentMessage.cache!.attachments.map((r) => r.toString())).has.members(
                    receivedMessage.cache!.attachments.map((r) => r.toString())
                )
                expect(sentMessage.cache!.receivedByEveryone).equals(receivedMessage.cache!.receivedByEveryone)
                expect(sentMessage.cache!.content.serialize()).equals(receivedMessage.cache!.content.serialize())
            }

            before(async function () {
                transport = new Transport(that.connection, that.config, that.loggerFactory)

                await TestUtil.clearAccounts(that.connection)

                await transport.init()

                const accounts = await TestUtil.provideAccounts(transport, 2, MessageController.name)
                sender = accounts[0]
                recipient = accounts[1]
                const rels = await TestUtil.addRelationship(sender, recipient)
                relationshipId = rels[0].id
            })

            it("should send and receive a Message", async function () {
                tempDate = CoreDate.utc().subtract(that.tempDateThreshold)
                const sentMessage = await TestUtil.sendMessage(sender, recipient)

                const messages = await TestUtil.syncUntilHasMessages(recipient, 1)
                const receivedMessage = messages[0]

                tempId1 = sentMessage.id

                expectValidMessages(sentMessage, receivedMessage, tempDate)
            }).timeout(15000)

            it("should get the cached Message", async function () {
                const sentMessage = await sender.messages.getMessage(tempId1)
                const receivedMessage = await recipient.messages.getMessage(tempId1)
                expect(sentMessage).to.exist
                expect(receivedMessage).to.exist
                expectValidMessages(sentMessage!, receivedMessage!, tempDate)
            })

            it("should send and receive a second Message", async function () {
                tempDate = CoreDate.utc().subtract(that.tempDateThreshold)
                const sentMessage = await TestUtil.sendMessage(sender, recipient)

                const messages = await TestUtil.syncUntilHasMessages(recipient, 1)
                const receivedMessage = messages[0]
                tempId2 = sentMessage.id

                expectValidMessages(sentMessage, receivedMessage, tempDate)
            }).timeout(15000)

            it("should send and receive a third Message", async function () {
                tempDate = CoreDate.utc().subtract(that.tempDateThreshold)
                const sentMessage = await TestUtil.sendMessage(sender, recipient)

                const messages = await TestUtil.syncUntilHasMessages(recipient, 1)
                const receivedMessage = messages[0]

                const relationship = await recipient.relationships.getRelationshipToIdentity(
                    receivedMessage.cache!.createdBy
                )
                expectValidMessages(sentMessage, receivedMessage, tempDate)
                expect(receivedMessage.relationshipIds[0].toString()).to.equal(relationship!.id.toString())
                expect(sentMessage.relationshipIds[0].toString()).to.equal(relationship!.id.toString())
                expect(receivedMessage.cache!.recipients[0].receivedByDevice?.toString()).equals(
                    recipient.activeDevice.id.toString()
                )
            }).timeout(15000)

            // eslint-disable-next-line jest/expect-expect
            it("should sync the receivedDates of Message", async function () {
                // TODO: JSSNMSHDD-2490 (activate if backend supports updating)
                /*
                const messages = await sender.messages.syncEverything()
                const deviceId = recipient.device.id.toString()
                expect(messages.length).equals(3)
                expect(messages[0].cache?.recipients[0].receivedAt).to.exist
                expect(messages[0].cache?.recipients[0].receivedAt?.isWithin({ seconds: 5 })).to.be.true
                expect(messages[0].cache?.recipients[0].receivedByDevice?.toString()).equals(deviceId)
                expect(messages[1].cache?.recipients[0].receivedAt).to.exist
                expect(messages[1].cache?.recipients[0].receivedAt?.isWithin({ seconds: 5 })).to.be.true
                expect(messages[1].cache?.recipients[0].receivedByDevice?.toString()).equals(deviceId)
                expect(messages[2].cache?.recipients[0].receivedAt).to.exist
                expect(messages[2].cache?.recipients[0].receivedAt?.isWithin({ seconds: 5 })).to.be.true
                expect(messages[2].cache?.recipients[0].receivedByDevice?.toString()).equals(deviceId)
                const message = await sender.messages.fetchMessage(messages[0].id)
                expect(message.cache?.recipients[0].receivedAt).to.exist
                expect(message.cache?.recipients[0].receivedAt?.isWithin({ seconds: 5 })).to.be.true
                expect(message.cache?.recipients[0].receivedByDevice?.toString()).equals(deviceId)
                */
            }).timeout(15000)

            it("should get the cached messages", async function () {
                const sentMessages = await sender.messages.getMessages()
                const receivedMessages = await recipient.messages.getMessages()
                expect(sentMessages).to.be.of.length(3)
                expect(receivedMessages).to.be.of.length(3)
                expect(sentMessages[0].id.toString()).equals(tempId1.toString())
                expect(sentMessages[1].id.toString()).equals(tempId2.toString())
                expectValidMessages(sentMessages[0], receivedMessages[0], tempDate)
                expectValidMessages(sentMessages[1], receivedMessages[1], tempDate)
            })

            it("should set and get additional metadata", async function () {
                const creationTime = CoreDate.utc()
                await sender.messages.setMessageMetadata(tempId1, { myprop: true })

                const file = (await sender.messages.getMessage(tempId1))!
                expect(file.metadata).to.exist
                expect(file.metadata["myprop"]).equals(true)
                expect(file.metadataModifiedAt).to.exist
                expect(file.metadataModifiedAt!.isSameOrBefore(creationTime.add({ seconds: 1 }))).to.be.true
                expect(file.metadataModifiedAt!.isSameOrAfter(creationTime.subtract({ seconds: 5 }))).to.be.true
            })

            it("should get the messages by address (sender)", async function () {
                const messages = await sender.messages.getMessagesByAddress(recipient.identity.address)
                expect(messages).lengthOf(3)
            })

            it("should get the messages by relationship (sender)", async function () {
                const messages = await sender.messages.getMessagesByRelationshipId(relationshipId)
                expect(messages).lengthOf(3)
            })

            it("should get the messages by address (recipient)", async function () {
                const messages = await recipient.messages.getMessagesByAddress(sender.identity.address)
                expect(messages).lengthOf(3)
            })

            it("should get the messages by relationship (recipient)", async function () {
                const messages = await recipient.messages.getMessagesByRelationshipId(relationshipId)
                expect(messages).lengthOf(3)
            })

            after(async function () {
                await sender.close()
                await recipient.close()
            })
        })
    }
}
