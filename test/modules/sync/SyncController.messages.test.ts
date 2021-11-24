import { IDatabaseConnection } from "@js-soft/docdb-access-abstractions"
import { ILoggerFactory } from "@js-soft/logging-abstractions"
import { IConfigOverwrite } from "@nmshd/transport"
import chai, { expect } from "chai"
import chaiExclude from "chai-exclude"
import { AbstractTest, TestUtil } from "../../testHelpers"

chai.use(chaiExclude)

export class MessageSyncTest extends AbstractTest {
    public constructor(config: IConfigOverwrite, connection: IDatabaseConnection, loggerFactory: ILoggerFactory) {
        super({ ...config, datawalletEnabled: true }, connection, loggerFactory)
    }

    public run(): void {
        const that = this

        describe("MessageSync", function () {
            this.timeout("200s")

            before(async function () {
                await TestUtil.clearAccounts(that.connection)
            })

            it("default case A1 -> B1: sync should receive message on main device", async function () {
                const a1 = await that.createIdentityWithOneDevice(MessageSyncTest.name)
                const b1 = await that.createIdentityWithOneDevice(MessageSyncTest.name)

                await TestUtil.addRelationship(a1, b1)

                const a1Message = await TestUtil.sendMessage(a1, b1)

                await TestUtil.syncUntilHasMessages(b1)

                const b1Messages = await b1.messages.getMessages()
                expect(b1Messages[0].toJSON())
                    .excludingEvery(["cachedAt", "isOwn", "receivedAt", "receivedByDevice"])
                    .to.eql(a1Message.toJSON())
            })

            it("default case A1 -> B2: sync should receive message on an onboarded device", async function () {
                const a1 = await that.createIdentityWithOneDevice(MessageSyncTest.name)
                const { device1: b1, device2: b2 } = await that.createIdentityWithTwoDevices(MessageSyncTest.name)

                await TestUtil.addRelationship(a1, b1)

                const a1Message = await TestUtil.sendMessage(a1, b1)

                await TestUtil.syncUntilHasMessages(b2)

                const b2Messages = await b2.messages.getMessages()
                expect(b2Messages[0].toJSON())
                    .excludingEvery(["cachedAt", "isOwn", "receivedAt", "receivedByDevice"])
                    .to.eql(a1Message.toJSON())
            })

            it("default case A2 -> B1: an onboarded device should be able to send messages", async function () {
                const { device1: a1, device2: a2 } = await that.createIdentityWithTwoDevices(MessageSyncTest.name)

                const b1 = await that.createIdentityWithOneDevice(MessageSyncTest.name)

                await TestUtil.addRelationship(a1, b1)
                await a2.syncDatawallet()

                const a2Message = await TestUtil.sendMessage(a2, b1)

                await TestUtil.syncUntilHasMessages(b1)

                const b1Messages = await b1.messages.getMessages()
                expect(b1Messages[0].toJSON())
                    .excludingEvery(["cachedAt", "isOwn", "receivedAt", "receivedByDevice"])
                    .to.eql(a2Message.toJSON())
            })

            it("concurrent send A1 -> B1, A2 -> B1: sync should receive messages sent parallel to the same identity on all devices", async function () {
                const { device1: a1, device2: a2 } = await that.createIdentityWithTwoDevices(MessageSyncTest.name)
                const { device1: b1, device2: b2 } = await that.createIdentityWithTwoDevices(MessageSyncTest.name)

                await TestUtil.addRelationship(a1, b1)
                await a2.syncEverything()
                await b2.syncEverything()

                // A1 and A2 both send a message to B
                const sendPromises = [TestUtil.sendMessage(a1, b1), TestUtil.sendMessage(a2, b1)]
                const sentMessages = await Promise.all(sendPromises)
                const a1SentMessage = sentMessages[0]
                const a2SentMessage = sentMessages[1]

                // B1 fetches both messages
                await TestUtil.syncUntilHasMessages(b1, 2)

                const b1MessageFromA1 = await b1.messages.getMessage(a1SentMessage.id)
                const b1MessageFromA2 = await b1.messages.getMessage(a2SentMessage.id)

                expect(b1MessageFromA1).to.exist
                expect(b1MessageFromA2).to.exist

                expect(b1MessageFromA1!.toJSON())
                    .excludingEvery(["cachedAt", "isOwn", "receivedAt", "receivedByDevice"])
                    .to.eql(a1SentMessage.toJSON())
                expect(b1MessageFromA2!.toJSON())
                    .excludingEvery(["cachedAt", "isOwn", "receivedAt", "receivedByDevice"])
                    .to.eql(a2SentMessage.toJSON())

                // B2 syncs its datawallet
                await b2.syncDatawallet()
                const b2MessageFromA1 = await b1.messages.getMessage(a1SentMessage.id)
                const b2MessageFromA2 = await b1.messages.getMessage(a2SentMessage.id)

                expect(b2MessageFromA1).to.exist
                expect(b2MessageFromA2).to.exist

                expect(b2MessageFromA1!.toJSON())
                    .excludingEvery(["cachedAt", "isOwn", "receivedAt", "receivedByDevice"])
                    .to.eql(a1SentMessage.toJSON())
                expect(b2MessageFromA2!.toJSON())
                    .excludingEvery(["cachedAt", "isOwn", "receivedAt", "receivedByDevice"])
                    .to.eql(a2SentMessage.toJSON())
            })

            it("concurrent receive A1 -> B1, A2 -> B1: only one active sync run is allowed", async function () {
                const { device1: a1, device2: a2 } = await that.createIdentityWithTwoDevices(MessageSyncTest.name)
                const { device1: b1, device2: b2 } = await that.createIdentityWithTwoDevices(MessageSyncTest.name)

                await TestUtil.addRelationship(a1, b1)
                await a2.syncEverything()
                await b2.syncEverything()

                // A1 and A2 both send a message to B
                const sendPromises = [TestUtil.sendMessage(a1, b1), TestUtil.sendMessage(a2, b1)]
                const sentMessages = await Promise.all(sendPromises)
                const a1SentMessage = sentMessages[0]
                const a2SentMessage = sentMessages[1]

                // A1 pushes its message to the datawallet
                await a1.syncDatawallet()

                // A2 synchronizes the message of A1 to its local datawallet
                // and pushes its own message to the datawallet
                await a2.syncDatawallet()

                // A1 synchronizes the message of A2 to its local datawallet
                await a1.syncDatawallet()

                // B1 receives both messages
                await TestUtil.syncUntilHasMessages(b1, 2)
                const b1MessageFromA1 = await b1.messages.getMessage(a1SentMessage.id)
                const b1MessageFromA2 = await b1.messages.getMessage(a2SentMessage.id)

                expect(b1MessageFromA1).to.exist
                expect(b1MessageFromA2).to.exist

                expect(b1MessageFromA1!.toJSON())
                    .excludingEvery(["cachedAt", "isOwn", "receivedAt", "receivedByDevice"])
                    .to.eql(a1SentMessage.toJSON())
                expect(b1MessageFromA2!.toJSON())
                    .excludingEvery(["cachedAt", "isOwn", "receivedAt", "receivedByDevice"])
                    .to.eql(a2SentMessage.toJSON())

                // B2 synchronizes the received messages to its local datawallet
                await b2.syncDatawallet()

                const b2MessageFromA1 = await b2.messages.getMessage(a1SentMessage.id)
                const b2MessageFromA2 = await b2.messages.getMessage(a2SentMessage.id)

                expect(b2MessageFromA1).to.exist
                expect(b2MessageFromA2).to.exist

                expect(b2MessageFromA1!.toJSON()).excludingEvery(["cachedAt"]).to.eql(b1MessageFromA1!.toJSON())
                expect(b2MessageFromA2!.toJSON()).excludingEvery(["cachedAt"]).to.eql(b1MessageFromA2!.toJSON())

                // A1 receives the updated messages (receivedAt dates were set)
                await TestUtil.syncUntilHasMessages(a1, 2)

                // TODO: JSSNMSHDD-2490 (remove the following two lines as soon as external events for receivedAt are sent again
                await a1.messages.updateCache([a1SentMessage.id.toString(), a2SentMessage.id.toString()])
                await a1.syncDatawallet()

                const a1MessageFromA1 = await a1.messages.getMessage(a1SentMessage.id)
                const a1MessageFromA2 = await a1.messages.getMessage(a2SentMessage.id)

                expect(a1MessageFromA1).to.exist
                expect(a1MessageFromA2).to.exist

                expect(a1MessageFromA1!.cache?.recipients[0].receivedAt).to.exist
                expect(a1MessageFromA2!.cache?.recipients[0].receivedAt).to.exist

                // A2 receives the CacheChanged modifications and updates its cache
                await a2.syncDatawallet()

                const a2MessageFromA1 = await a2.messages.getMessage(a1SentMessage.id)
                const a2MessageFromA2 = await a2.messages.getMessage(a2SentMessage.id)

                expect(a2MessageFromA1).to.exist
                expect(a2MessageFromA2).to.exist

                expect(a2MessageFromA1!.cache?.recipients[0].receivedAt).to.exist
                expect(a2MessageFromA2!.cache?.recipients[0].receivedAt).to.exist
            })

            it("syncDatawallet should sync sent messages", async function () {
                const recipient = await that.createIdentityWithOneDevice(MessageSyncTest.name)

                const { device1: senderDevice1, device2: senderDevice2 } = await that.createIdentityWithTwoDevices(
                    MessageSyncTest.name
                )

                await TestUtil.addRelationship(recipient, senderDevice1)

                const messageOnDevice1 = await senderDevice1.messages.sendMessage({
                    recipients: [recipient.identity.address],
                    content: { someMessageContent: "someMessageContent" }
                })
                await senderDevice1.syncDatawallet()

                let messageOnDevice2 = await senderDevice2.messages.getMessage(messageOnDevice1.id)
                expect(messageOnDevice2).to.be.undefined

                await senderDevice2.syncDatawallet()

                messageOnDevice2 = await senderDevice2.messages.getMessage(messageOnDevice1.id)
                expect(messageOnDevice2?.cache).to.exist

                expect(messageOnDevice2!.toJSON()).excluding("cachedAt").to.eql(messageOnDevice1.toJSON())
            })
        })
    }
}
