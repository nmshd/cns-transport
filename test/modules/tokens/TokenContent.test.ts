import { JSONWrapperAsync, SerializableAsync } from "@js-soft/ts-serval"
import { CryptoEncryption, CryptoSecretKey } from "@nmshd/crypto"
import {
    AccountController,
    CoreDate,
    CoreId,
    DeviceSharedSecret,
    TokenContentDeviceSharedSecret,
    TokenContentFile,
    TokenContentRelationshipTemplate,
    Transport
} from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest } from "../../testHelpers/AbstractTest"
import { TestUtil } from "../../testHelpers/TestUtil"

export class TokenContentTest extends AbstractTest {
    public run(): void {
        const that = this
        describe("TokenContent", function () {
            let transport: Transport
            let account: AccountController

            this.timeout(20000)

            before(async function () {
                transport = new Transport(
                    that.connection,
                    { ...that.config, datawalletEnabled: true },
                    that.loggerFactory
                )
                await TestUtil.clearAccounts(that.connection)

                await transport.init()

                const accounts = await TestUtil.provideAccounts(transport, 3, TokenContentTest.name)

                account = accounts[0]
            })

            describe("Any Content", function () {
                it("should send the token", async function () {
                    const value: any = await SerializableAsync.from({ any: "content", submitted: true })
                    expect(value).instanceOf(JSONWrapperAsync)

                    await account.tokens.sendToken({
                        expiresAt: CoreDate.utc().add({ days: 5 }),
                        content: value,
                        ephemeral: false
                    })
                })

                it("should correctly store the token (sender)", async function () {
                    const tokens = await account.tokens.getTokens()
                    expect(tokens).lengthOf(1)
                    const token = tokens[0]
                    const content = token.cache!.content as any
                    expect(content).instanceOf(JSONWrapperAsync)
                    expect(content.value.any).equals("content")
                    expect(content.value.submitted).equals(true)
                })

                it("should correctly serialize the tokens (sender)", async function () {
                    const tokens = await account.tokens.getTokens()
                    expect(tokens).lengthOf(1)
                    const token = tokens[0]
                    const object = token.toJSON() as any
                    expect(object.cache.content).to.exist
                    expect(object.cache.content.any).equals("content")
                    expect(object.cache.content.submitted).equals(true)
                })
            })

            describe("TokenContentRelationshipTemplate", function () {
                it("should serialize and deserialize correctly (verbose)", async function () {
                    const token = await TokenContentRelationshipTemplate.from({
                        secretKey: await CryptoEncryption.generateKey(),
                        templateId: await CoreId.generate()
                    })
                    expect(token).instanceOf(SerializableAsync)
                    expect(token).instanceOf(TokenContentRelationshipTemplate)
                    expect(token.secretKey).instanceOf(CryptoSecretKey)
                    expect(token.templateId).instanceOf(CoreId)
                    const serialized = token.serialize()
                    expect(serialized).to.be.a("string")
                    expect(serialized).to.equal(
                        `{"@type":"TokenContentRelationshipTemplate","secretKey":${token.secretKey.serialize(
                            false
                        )},"templateId":"${token.templateId.toString()}"}`
                    )
                    const deserialized = await TokenContentRelationshipTemplate.deserialize(serialized)
                    expect(deserialized).instanceOf(SerializableAsync)
                    expect(deserialized).instanceOf(TokenContentRelationshipTemplate)
                    expect(deserialized.secretKey).instanceOf(CryptoSecretKey)
                    expect(deserialized.templateId).instanceOf(CoreId)
                    expect(deserialized.secretKey.toBase64()).to.equal(token.secretKey.toBase64())
                    expect(deserialized.templateId.toString()).to.equal(token.templateId.toString())
                })

                it("should serialize and deserialize correctly (no type information)", async function () {
                    const token = await TokenContentRelationshipTemplate.from({
                        secretKey: await CryptoEncryption.generateKey(),
                        templateId: await CoreId.generate()
                    })
                    expect(token).instanceOf(SerializableAsync)
                    expect(token).instanceOf(TokenContentRelationshipTemplate)
                    expect(token.secretKey).instanceOf(CryptoSecretKey)
                    expect(token.templateId).instanceOf(CoreId)
                    const serialized = token.serialize()
                    expect(serialized).to.be.a("string")
                    const deserialized = await TokenContentRelationshipTemplate.deserialize(serialized)
                    expect(deserialized).instanceOf(SerializableAsync)
                    expect(deserialized).instanceOf(TokenContentRelationshipTemplate)
                    expect(deserialized.secretKey).instanceOf(CryptoSecretKey)
                    expect(deserialized.templateId).instanceOf(CoreId)
                    expect(deserialized.secretKey.toBase64()).to.equal(token.secretKey.toBase64())
                    expect(deserialized.templateId.toString()).to.equal(token.templateId.toString())
                })

                it("should serialize and deserialize correctly (from unknown type)", async function () {
                    const token = await TokenContentRelationshipTemplate.from({
                        secretKey: await CryptoEncryption.generateKey(),
                        templateId: await CoreId.generate()
                    })
                    expect(token).instanceOf(SerializableAsync)
                    expect(token).instanceOf(TokenContentRelationshipTemplate)
                    expect(token.secretKey).instanceOf(CryptoSecretKey)
                    expect(token.templateId).instanceOf(CoreId)
                    const serialized = token.serialize()
                    expect(serialized).to.be.a("string")
                    expect(serialized).to.equal(
                        `{"@type":"TokenContentRelationshipTemplate","secretKey":${token.secretKey.serialize(
                            false
                        )},"templateId":"${token.templateId.toString()}"}`
                    )
                    const deserialized = (await SerializableAsync.deserializeUnknown(
                        serialized
                    )) as TokenContentRelationshipTemplate
                    expect(deserialized).instanceOf(SerializableAsync)
                    expect(deserialized).instanceOf(TokenContentRelationshipTemplate)
                    expect(deserialized.secretKey).instanceOf(CryptoSecretKey)
                    expect(deserialized.templateId).instanceOf(CoreId)
                    expect(deserialized.secretKey.toBase64()).to.equal(token.secretKey.toBase64())
                    expect(deserialized.templateId.toString()).to.equal(token.templateId.toString())
                })
            })

            describe("TokenContentDeviceSharedSecret", function () {
                it("should serialize and deserialize correctly (verbose)", async function () {
                    const device = await account.devices.sendDevice({
                        name: "test",
                        description: "test",
                        isAdmin: true
                    })
                    await account.syncDatawallet()
                    const sharedSecret = await account.devices.getSharedSecret(device.id)
                    const token = await TokenContentDeviceSharedSecret.from({
                        sharedSecret: sharedSecret
                    })
                    expect(token).instanceOf(SerializableAsync)
                    expect(token).instanceOf(TokenContentDeviceSharedSecret)
                    expect(token.sharedSecret).instanceOf(DeviceSharedSecret)
                    const serialized = token.serialize()
                    expect(serialized).to.be.a("string")
                    expect(serialized).to.equal(
                        `{"@type":"TokenContentDeviceSharedSecret","sharedSecret":${token.sharedSecret.serialize(
                            false
                        )}}`
                    )
                    const deserialized = await TokenContentDeviceSharedSecret.deserialize(serialized)
                    expect(deserialized).instanceOf(SerializableAsync)
                    expect(deserialized).instanceOf(TokenContentDeviceSharedSecret)
                    expect(deserialized.sharedSecret).instanceOf(DeviceSharedSecret)
                    await TestUtil.onboardDevice(transport, deserialized.sharedSecret)
                })

                it("should serialize and deserialize correctly (no type information)", async function () {
                    const device = await account.devices.sendDevice({
                        name: "test",
                        description: "test",
                        isAdmin: true
                    })
                    await account.syncDatawallet()
                    const sharedSecret = await account.devices.getSharedSecret(device.id)
                    const token = await TokenContentDeviceSharedSecret.from({
                        sharedSecret: sharedSecret
                    })
                    expect(token).instanceOf(SerializableAsync)
                    expect(token).instanceOf(TokenContentDeviceSharedSecret)
                    expect(token.sharedSecret).instanceOf(DeviceSharedSecret)
                    const serialized = token.serialize()
                    expect(serialized).to.be.a("string")
                    const deserialized = await TokenContentDeviceSharedSecret.deserialize(serialized)
                    expect(deserialized).instanceOf(SerializableAsync)
                    expect(deserialized).instanceOf(TokenContentDeviceSharedSecret)
                    expect(deserialized.sharedSecret).instanceOf(DeviceSharedSecret)
                    await TestUtil.onboardDevice(transport, deserialized.sharedSecret)
                })

                it("should serialize and deserialize correctly (from unknown type)", async function () {
                    const device = await account.devices.sendDevice({
                        name: "test",
                        description: "test",
                        isAdmin: true
                    })
                    await account.syncDatawallet()
                    const sharedSecret = await account.devices.getSharedSecret(device.id)
                    const token = await TokenContentDeviceSharedSecret.from({
                        sharedSecret: sharedSecret
                    })
                    expect(token).instanceOf(SerializableAsync)
                    expect(token).instanceOf(TokenContentDeviceSharedSecret)
                    expect(token.sharedSecret).instanceOf(DeviceSharedSecret)
                    const serialized = token.serialize()
                    expect(serialized).to.be.a("string")
                    expect(serialized).to.equal(
                        `{"@type":"TokenContentDeviceSharedSecret","sharedSecret":${token.sharedSecret.serialize(
                            false
                        )}}`
                    )
                    const deserialized = (await SerializableAsync.deserializeUnknown(
                        serialized
                    )) as TokenContentDeviceSharedSecret
                    expect(deserialized).instanceOf(SerializableAsync)
                    expect(deserialized).instanceOf(TokenContentDeviceSharedSecret)
                    expect(deserialized.sharedSecret).instanceOf(DeviceSharedSecret)
                    await TestUtil.onboardDevice(transport, deserialized.sharedSecret)
                })
            })

            describe("TokenContentFile", function () {
                it("should serialize and deserialize correctly (verbose)", async function () {
                    const token = await TokenContentFile.from({
                        secretKey: await CryptoEncryption.generateKey(),
                        fileId: await CoreId.generate()
                    })
                    expect(token).instanceOf(SerializableAsync)
                    expect(token).instanceOf(TokenContentFile)
                    expect(token.secretKey).instanceOf(CryptoSecretKey)
                    expect(token.fileId).instanceOf(CoreId)
                    const serialized = token.serialize()
                    expect(serialized).to.be.a("string")
                    expect(serialized).to.equal(
                        `{"@type":"TokenContentFile","fileId":"${token.fileId.toString()}","secretKey":${token.secretKey.serialize(
                            false
                        )}}`
                    )
                    const deserialized = await TokenContentFile.deserialize(serialized)
                    expect(deserialized).instanceOf(SerializableAsync)
                    expect(deserialized).instanceOf(TokenContentFile)
                    expect(deserialized.secretKey).instanceOf(CryptoSecretKey)
                    expect(deserialized.fileId).instanceOf(CoreId)
                    expect(deserialized.secretKey.toBase64()).to.equal(token.secretKey.toBase64())
                    expect(deserialized.fileId.toString()).to.equal(token.fileId.toString())
                })

                it("should serialize and deserialize correctly (no type information)", async function () {
                    const token = await TokenContentFile.from({
                        secretKey: await CryptoEncryption.generateKey(),
                        fileId: await CoreId.generate()
                    })
                    expect(token).instanceOf(SerializableAsync)
                    expect(token).instanceOf(TokenContentFile)
                    expect(token.secretKey).instanceOf(CryptoSecretKey)
                    expect(token.fileId).instanceOf(CoreId)
                    const serialized = token.serialize()
                    expect(serialized).to.be.a("string")
                    const deserialized = await TokenContentFile.deserialize(serialized)
                    expect(deserialized).instanceOf(SerializableAsync)
                    expect(deserialized).instanceOf(TokenContentFile)
                    expect(deserialized.secretKey).instanceOf(CryptoSecretKey)
                    expect(deserialized.fileId).instanceOf(CoreId)
                    expect(deserialized.secretKey.toBase64()).to.equal(token.secretKey.toBase64())
                    expect(deserialized.fileId.toString()).to.equal(token.fileId.toString())
                })

                it("should serialize and deserialize correctly (from unknown type)", async function () {
                    const token = await TokenContentFile.from({
                        secretKey: await CryptoEncryption.generateKey(),
                        fileId: await CoreId.generate()
                    })
                    expect(token).instanceOf(SerializableAsync)
                    expect(token).instanceOf(TokenContentFile)
                    expect(token.secretKey).instanceOf(CryptoSecretKey)
                    expect(token.fileId).instanceOf(CoreId)
                    const serialized = token.serialize()
                    expect(serialized).to.be.a("string")
                    expect(serialized).to.equal(
                        `{"@type":"TokenContentFile","fileId":"${token.fileId.toString()}","secretKey":${token.secretKey.serialize(
                            false
                        )}}`
                    )
                    const deserialized = (await SerializableAsync.deserializeUnknown(serialized)) as TokenContentFile
                    expect(deserialized).instanceOf(SerializableAsync)
                    expect(deserialized).instanceOf(TokenContentFile)
                    expect(deserialized.secretKey).instanceOf(CryptoSecretKey)
                    expect(deserialized.fileId).instanceOf(CoreId)
                    expect(deserialized.secretKey.toBase64()).to.equal(token.secretKey.toBase64())
                    expect(deserialized.fileId.toString()).to.equal(token.fileId.toString())
                })
            })

            after(async function () {
                await account.close()
            })
        })
    }
}
