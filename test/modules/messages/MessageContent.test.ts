import { ISerializableAsync, JSONWrapperAsync, SerializableAsync, serialize, type, validate } from "@js-soft/ts-serval"
import { AccountController, CoreAddress, ICoreAddress, Transport } from "@nmshd/transport"
import { expect } from "chai"
import { TestUtil } from "../../core"
import { AbstractTest } from "../../testHelpers"

export class MessageContentTest extends AbstractTest {
    public run(): void {
        const that = this

        describe("MessageContent", function () {
            let transport: Transport
            let recipient1: AccountController
            let recipient2: AccountController
            let sender: AccountController

            this.timeout(40000)

            before(async function () {
                transport = new Transport(that.connection, that.config, that.loggerFactory)

                await TestUtil.clearAccounts(that.connection)

                await transport.init()

                const accounts = await TestUtil.provideAccounts(transport, 3, MessageContentTest.name)

                recipient1 = accounts[0]
                recipient2 = accounts[1]
                sender = accounts[2]

                await TestUtil.addRelationship(sender, recipient1)
                await TestUtil.addRelationship(sender, recipient2)
            })

            describe("Any Content", function () {
                it("should send the message", async function () {
                    const value: any = await SerializableAsync.from({ any: "content", submitted: true })
                    expect(value).instanceOf(JSONWrapperAsync)
                    await TestUtil.sendMessage(sender, recipient1, value)
                })
                it("should correctly store the message (sender)", async function () {
                    const messages = await sender.messages.getMessagesByAddress(recipient1.identity.address)
                    expect(messages).lengthOf(1)
                    const message = messages[0]
                    const content = message.cache!.content as any
                    expect(content).instanceOf(JSONWrapperAsync)
                    expect(content.value.any).equals("content")
                    expect(content.value.submitted).equals(true)
                })

                it("should correctly serialize the message (sender)", async function () {
                    const messages = await sender.messages.getMessagesByAddress(recipient1.identity.address)
                    expect(messages).lengthOf(1)
                    const message = messages[0]
                    const object = message.toJSON() as any
                    expect(object.cache.content).to.exist
                    expect(object.cache.content.any).equals("content")
                    expect(object.cache.content.submitted).equals(true)
                })

                it("should correctly store the message (recipient)", async function () {
                    const messagesSync = await TestUtil.syncUntilHasMessages(recipient1)
                    expect(messagesSync).lengthOf(1)
                    const messages = await recipient1.messages.getMessagesByAddress(sender.identity.address)
                    expect(messages).lengthOf(1)
                    const message = messages[0]
                    const content = message.cache!.content as any
                    expect(content).instanceOf(JSONWrapperAsync)
                    expect(content.value.any).equals("content")
                    expect(content.value.submitted).equals(true)
                })

                it("should correctly serialize the message (recipient)", async function () {
                    const messages = await recipient1.messages.getMessagesByAddress(sender.identity.address)
                    expect(messages).lengthOf(1)
                    const message = messages[0]
                    const object = message.toJSON() as any
                    expect(object.cache.content).to.exist
                    expect(object.cache.content.any).equals("content")
                    expect(object.cache.content.submitted).equals(true)
                })
            })

            describe("Mail", function () {
                it("should send the message", async function () {
                    const value: Mail = await Mail.from({
                        body: "Test",
                        subject: "Test Subject",
                        to: [recipient1.identity.address]
                    })
                    const message = await TestUtil.sendMessage(sender, recipient1, value)

                    expect(message).to.exist
                })
                it("should correctly store the me4ssage (sender)", async function () {
                    const messages = await sender.messages.getMessagesByAddress(recipient1.identity.address)
                    expect(messages).lengthOf(2)
                    const message = messages[1]
                    expect(message.cache!.content).instanceOf(Mail)
                    const content: Mail = message.cache!.content as Mail
                    expect(content.body).equals("Test")
                    expect(content.subject).equals("Test Subject")
                    expect(content.to).to.be.an("Array")
                    expect(content.to[0]).instanceOf(CoreAddress)
                    expect(content.to[0].toString()).equals(recipient1.identity.address.toString())
                })

                it("should correctly store the message (recipient)", async function () {
                    const messagesSync = await TestUtil.syncUntilHasMessages(recipient1)
                    expect(messagesSync).lengthOf(1)
                    const messages = await recipient1.messages.getMessagesByAddress(sender.identity.address)
                    expect(messages).lengthOf(2)
                    const message = messages[1]
                    const content: Mail = message.cache!.content as Mail
                    expect(content.body).equals("Test")
                    expect(content.subject).equals("Test Subject")
                    expect(content.to).to.be.an("Array")
                    expect(content.to[0]).instanceOf(CoreAddress)
                    expect(content.to[0].toString()).equals(recipient1.identity.address.toString())
                })
            })

            after(async function () {
                await recipient1.close()
                await recipient2.close()
                await sender.close()
            })
        })
    }
}

interface IMail extends ISerializableAsync {
    to: ICoreAddress[]
    cc?: ICoreAddress[]
    subject: string
    body: string
}

@type("Mail")
class Mail extends SerializableAsync implements IMail {
    @serialize({ type: CoreAddress })
    @validate()
    public to: CoreAddress[]

    @serialize({ type: CoreAddress })
    @validate({ nullable: true })
    public cc: CoreAddress[] = []

    @serialize()
    @validate()
    public subject: string

    @serialize()
    @validate()
    public body: string

    public static async from(value: IMail): Promise<Mail> {
        if (typeof value.cc === "undefined") {
            value.cc = []
        }
        if (typeof value.body === "undefined" && (value as any).content) {
            value.body = (value as any).content
            delete (value as any).content
        }
        const obj: Mail = await super.fromT(value, Mail)
        return obj
    }
}
