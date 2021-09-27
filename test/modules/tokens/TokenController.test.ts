import { JSONWrapperAsync, SerializableAsync } from "@js-soft/ts-serval"
import { CryptoEncryption, CryptoSecretKey } from "@nmshd/crypto"
import {
    AccountController,
    Core,
    CoreDate,
    CoreId,
    Token,
    TokenContentFile,
    TokenContentRelationshipTemplate
} from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest } from "../../core/AbstractTest"
import { TestUtil } from "../../core/TestUtil"

export class TokenControllerTest extends AbstractTest {
    public run(): void {
        const that = this

        describe("TokenController", function () {
            let coreLib: Core

            let sender: AccountController
            let recipient: AccountController
            let tempId1: CoreId
            let tempId2: CoreId
            let tempDate: CoreDate

            this.timeout(150000)

            function testTokens(sentToken: Token, receivedToken: Token, nowMinusSeconds: CoreDate) {
                expect(sentToken.id.toString()).equals(receivedToken.id.toString())
                expect(sentToken.cache).to.exist
                expect(sentToken.cachedAt?.isSameOrAfter(nowMinusSeconds)).to.be.true
                expect(sentToken.cache?.content).instanceOf(SerializableAsync)
                expect(sentToken.cache?.createdBy.toString()).equals(sender.identity.address.toString())
                expect(sentToken.cache?.createdByDevice.toString()).equals(sender.activeDevice.id.toString())
                expect(sentToken.cache?.createdAt.isSameOrAfter(nowMinusSeconds)).to.be.true
                expect(receivedToken.cache).to.exist
                expect(receivedToken.cachedAt?.isSameOrAfter(nowMinusSeconds)).to.be.true
                expect(receivedToken.cache?.content).instanceOf(SerializableAsync)
                expect(receivedToken.cache?.createdBy.toString()).equals(sender.identity.address.toString())
                expect(receivedToken.cache?.createdByDevice.toString()).equals(sender.activeDevice.id.toString())
                expect(receivedToken.cache?.createdAt.isSameOrAfter(nowMinusSeconds)).to.be.true
                expect(receivedToken.cache?.expiresAt.toISOString()).equals(sentToken.cache?.expiresAt.toISOString())
            }

            before(async function () {
                coreLib = new Core(that.connection, that.config, that.loggerFactory)
                await TestUtil.clearAccounts(that.connection)

                await coreLib.init()

                const accounts = await TestUtil.provideAccounts(coreLib, 2, TokenControllerTest.name)
                sender = accounts[0]
                recipient = accounts[1]
            })

            it("should send and receive a TokenContent as String", async function () {
                tempDate = CoreDate.utc().subtract(that.tempDateThreshold)
                const expiresAt = CoreDate.utc().add({ minutes: 5 })
                const content = await SerializableAsync.from({ content: "TestToken" })
                const sentToken = await sender.tokens.sendToken({
                    content,
                    expiresAt,
                    ephemeral: false
                })
                const reference = (await sentToken.toTokenReference()).truncate()
                const receivedToken = await recipient.tokens.loadPeerTokenByTruncated(reference, false)
                tempId1 = sentToken.id

                testTokens(sentToken, receivedToken, tempDate)
                expect(sentToken.cache?.expiresAt.toISOString()).equals(expiresAt.toISOString())
                expect(sentToken.cache?.content).instanceOf(SerializableAsync)
                expect(receivedToken.cache?.content).instanceOf(JSONWrapperAsync)
                expect((sentToken.cache?.content.toJSON() as any).content).equals("TestToken")
                expect((receivedToken.cache?.content as any).content).equals((sentToken.cache?.content as any).content)
            }).timeout(15000)

            it("should get the cached token", async function () {
                const sentToken = await sender.tokens.getToken(tempId1)
                const receivedToken = await recipient.tokens.getToken(tempId1)
                expect(sentToken).to.exist
                expect(receivedToken).to.exist
                testTokens(sentToken!, receivedToken!, tempDate)
            })

            it("should send and receive a TokenContentFile", async function () {
                const expiresAt = CoreDate.utc().add({ minutes: 5 })
                const content = await TokenContentFile.from({
                    fileId: await CoreId.generate(),
                    secretKey: await CryptoEncryption.generateKey()
                })
                const sentToken = await sender.tokens.sendToken({
                    content,
                    expiresAt,
                    ephemeral: false
                })
                const reference = (await sentToken.toTokenReference()).truncate()
                const receivedToken = await recipient.tokens.loadPeerTokenByTruncated(reference, false)
                tempId2 = sentToken.id

                testTokens(sentToken, receivedToken, tempDate)
                expect(sentToken.cache?.expiresAt.toISOString()).equals(expiresAt.toISOString())
                expect(sentToken.cache?.content).instanceOf(TokenContentFile)
                expect((sentToken.cache?.content as TokenContentFile).fileId).instanceOf(CoreId)
                expect((sentToken.cache?.content as TokenContentFile).secretKey).instanceOf(CryptoSecretKey)
                expect(receivedToken.cache?.content).instanceOf(TokenContentFile)
                expect((receivedToken.cache?.content as TokenContentFile).fileId).instanceOf(CoreId)
                expect((receivedToken.cache?.content as TokenContentFile).secretKey).instanceOf(CryptoSecretKey)
                expect((sentToken.cache?.content as TokenContentFile).fileId.toString()).equals(
                    content.fileId.toString()
                )
                expect((sentToken.cache?.content as TokenContentFile).secretKey.toBase64()).equals(
                    content.secretKey.toBase64()
                )
                expect((receivedToken.cache?.content as TokenContentFile).fileId.toString()).equals(
                    (sentToken.cache?.content as TokenContentFile).fileId.toString()
                )
                expect((receivedToken.cache?.content as TokenContentFile).secretKey.toBase64()).equals(
                    (sentToken.cache?.content as TokenContentFile).secretKey.toBase64()
                )
            }).timeout(15000)

            it("should send and receive a TokenContentRelationshipTemplate", async function () {
                const expiresAt = CoreDate.utc().add({ minutes: 5 })
                const content = await TokenContentRelationshipTemplate.from({
                    templateId: await CoreId.generate(),
                    secretKey: await CryptoEncryption.generateKey()
                })
                const sentToken = await sender.tokens.sendToken({
                    content,
                    expiresAt,
                    ephemeral: false
                })
                const reference = (await sentToken.toTokenReference()).truncate()
                const receivedToken = await recipient.tokens.loadPeerTokenByTruncated(reference, false)

                testTokens(sentToken, receivedToken, tempDate)
                expect(sentToken.cache?.expiresAt.toISOString()).equals(expiresAt.toISOString())
                expect(sentToken.cache?.content).instanceOf(TokenContentRelationshipTemplate)
                expect((sentToken.cache?.content as TokenContentRelationshipTemplate).templateId).instanceOf(CoreId)
                expect((sentToken.cache?.content as TokenContentRelationshipTemplate).secretKey).instanceOf(
                    CryptoSecretKey
                )
                expect(receivedToken.cache?.content).instanceOf(TokenContentRelationshipTemplate)
                expect((receivedToken.cache?.content as TokenContentRelationshipTemplate).templateId).instanceOf(CoreId)
                expect((receivedToken.cache?.content as TokenContentRelationshipTemplate).secretKey).instanceOf(
                    CryptoSecretKey
                )
                expect((sentToken.cache?.content as TokenContentRelationshipTemplate).templateId.toString()).equals(
                    content.templateId.toString()
                )
                expect((sentToken.cache?.content as TokenContentRelationshipTemplate).secretKey.toBase64()).equals(
                    content.secretKey.toBase64()
                )
                expect((receivedToken.cache?.content as TokenContentRelationshipTemplate).templateId.toString()).equals(
                    (sentToken.cache?.content as TokenContentRelationshipTemplate).templateId.toString()
                )
                expect((receivedToken.cache?.content as TokenContentRelationshipTemplate).secretKey.toBase64()).equals(
                    (sentToken.cache?.content as TokenContentRelationshipTemplate).secretKey.toBase64()
                )
            }).timeout(15000)

            it("should get the cached tokens", async function () {
                const sentTokens = await sender.tokens.getTokens()
                const receivedTokens = await recipient.tokens.getTokens()
                expect(sentTokens).to.be.of.length(3)
                expect(receivedTokens).to.be.of.length(3)
                expect(sentTokens[0].id.toString()).equals(tempId1.toString())
                expect(sentTokens[1].id.toString()).equals(tempId2.toString())
                testTokens(sentTokens[0], receivedTokens[0], tempDate)
                testTokens(sentTokens[1], receivedTokens[1], tempDate)
            })

            after(async function () {
                await sender.close()
                await recipient.close()
            })
        })
    }
}
