import { JSONWrapper, Serializable } from "@js-soft/ts-serval"
import { CoreBuffer } from "@nmshd/crypto"
import {
    AccountController,
    CoreDate,
    File,
    FileReference,
    RelationshipChangeStatus,
    RelationshipChangeType,
    RelationshipStatus,
    TokenContentRelationshipTemplate,
    Transport
} from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest, TestUtil } from "../testHelpers"

export class End2EndTest extends AbstractTest {
    public static maxTimeoutTest = 120000
    public static maxTimeoutStep = 25000

    public testAccountCreation(): Mocha.Suite {
        const that = this
        return describe("AccountTest", function () {
            let transport: Transport

            before(async function () {
                transport = new Transport(that.connection, that.config, that.eventBus, that.loggerFactory)
                that.logger.info(`Test Start ${this.currentTest?.fullTitle()}`)
                await transport.init()
                await TestUtil.clearAccounts(that.connection)
            })

            // eslint-disable-next-line jest/expect-expect
            it("should close an account", async function () {
                const account = await TestUtil.createAccount(transport, End2EndTest.name)
                await account.close()
            }).timeout(End2EndTest.maxTimeoutStep)
        })
    }

    public testRelationshipAccept(): Mocha.Suite {
        const that = this

        return describe("RelationshipTest: Accept", function () {
            let transport: Transport
            let from: AccountController
            let to: AccountController

            this.timeout(End2EndTest.maxTimeoutTest)

            before(async function () {
                transport = new Transport(that.connection, that.config, that.eventBus, that.loggerFactory)

                that.logger.info(`Test Start ${this.currentTest?.fullTitle()}`)

                await TestUtil.clearAccounts(that.connection)

                await transport.init()

                const accounts = await TestUtil.provideAccounts(transport, 2, End2EndTest.name)
                from = accounts[0]
                to = accounts[1]
            })

            it("should create new relationship between two accounts", async function () {
                const templateFrom = await from.relationshipTemplates.sendRelationshipTemplate({
                    content: {
                        mycontent: "template"
                    },
                    expiresAt: CoreDate.utc().add({ minutes: 5 }),
                    maxNumberOfAllocations: 1
                })

                const templateToken = TokenContentRelationshipTemplate.from({
                    templateId: templateFrom.id,
                    secretKey: templateFrom.secretKey
                })

                const token = await from.tokens.sendToken({
                    content: templateToken,
                    expiresAt: CoreDate.utc().add({ hours: 12 }),
                    ephemeral: false
                })

                const tokenRef = token.truncate()

                const receivedToken = await to.tokens.loadPeerTokenByTruncated(tokenRef, false)

                if (!(receivedToken.cache!.content instanceof TokenContentRelationshipTemplate)) {
                    throw new Error("token content not instanceof TokenContentRelationshipTemplate")
                }

                const templateTo = await to.relationshipTemplates.loadPeerRelationshipTemplate(
                    receivedToken.cache!.content.templateId,
                    receivedToken.cache!.content.secretKey
                )

                expect(templateTo.cache!.content).instanceOf(JSONWrapper)
                const templateContent = templateTo.cache!.content as JSONWrapper
                expect(templateContent.value).has.property("mycontent")
                expect(templateContent.value.mycontent).equals("template")

                // Send Request
                const request = await to.relationships.sendRelationship({
                    template: templateTo,
                    content: {
                        mycontent: "request"
                    }
                })
                const relationshipId = request.id

                const templateRequestContent = request.cache!.template.cache!.content as JSONWrapper
                expect(templateRequestContent.value).has.property("mycontent")
                expect(templateRequestContent.value.mycontent).equals("template")

                expect(request.cache!.template.id.toString()).to.equal(templateTo.id.toString())
                expect(request.cache!.template.isOwn).to.equal(false)
                expect(request.cache!.creationChange.type).to.equal(RelationshipChangeType.Creation)
                expect(request.cache!.creationChange.status).to.equal(RelationshipChangeStatus.Pending)
                expect(request.status).to.equal(RelationshipStatus.Pending)

                // Accept relationship
                const syncedRelationships = await TestUtil.syncUntilHasRelationships(from)
                expect(syncedRelationships).to.have.lengthOf(1)
                const pendingRelationship = syncedRelationships[0]

                expect(pendingRelationship.cache!.template.id.toString()).to.equal(templateTo.id.toString())
                expect(pendingRelationship.cache!.template.isOwn).to.equal(true)

                const templateResponseContent = pendingRelationship.cache!.template.cache!.content as JSONWrapper
                expect(templateResponseContent.value).has.property("mycontent")
                expect(templateResponseContent.value.mycontent).equals("template")

                expect(pendingRelationship.cache!.creationChange.type).to.equal(RelationshipChangeType.Creation)
                expect(pendingRelationship.cache!.creationChange.status).to.equal(RelationshipChangeStatus.Pending)
                expect(pendingRelationship.status).to.equal(RelationshipStatus.Pending)

                const acceptedRelationshipFromSelf = await from.relationships.acceptChange(
                    pendingRelationship.cache!.creationChange,
                    {
                        mycontent: "acceptContent"
                    }
                )
                expect(acceptedRelationshipFromSelf.id.toString()).to.equal(relationshipId.toString())
                expect(acceptedRelationshipFromSelf.status).to.equal(RelationshipStatus.Active)
                expect(acceptedRelationshipFromSelf.cache!.creationChange.status).to.equal(
                    RelationshipChangeStatus.Accepted
                )
                expect(acceptedRelationshipFromSelf.peer).to.exist
                expect(acceptedRelationshipFromSelf.peer.address.toString()).to.equal(
                    acceptedRelationshipFromSelf.cache!.creationChange.request.createdBy.toString()
                )

                const acceptedContentSelf = acceptedRelationshipFromSelf.cache!.creationChange.response?.content as any
                expect(acceptedContentSelf).instanceOf(JSONWrapper)
                expect(acceptedContentSelf.value.mycontent).to.equal("acceptContent")

                // Get accepted relationship
                const syncedRelationshipsPeer = await TestUtil.syncUntilHasRelationships(to)
                expect(syncedRelationshipsPeer).to.have.lengthOf(1)
                const acceptedRelationshipPeer = syncedRelationshipsPeer[0]

                expect(acceptedRelationshipPeer.id.toString()).to.equal(relationshipId.toString())
                expect(acceptedRelationshipPeer.status).to.equal(RelationshipStatus.Active)
                expect(acceptedRelationshipPeer.cache!.creationChange.status).to.equal(
                    RelationshipChangeStatus.Accepted
                )
                expect(acceptedRelationshipPeer.peer).to.exist
                expect(acceptedRelationshipPeer.peer.address.toString()).to.equal(
                    templateTo.cache?.identity.address.toString()
                )

                const acceptedContentPeer = acceptedRelationshipPeer.cache!.creationChange.response?.content as any
                expect(acceptedContentPeer).instanceOf(JSONWrapper)
                expect(acceptedContentPeer.value.mycontent).to.equal("acceptContent")
            }).timeout(End2EndTest.maxTimeoutStep)

            after(async function () {
                await from.close()
                await to.close()
            })
        })
    }

    public testRelationshipReject(): Mocha.Suite {
        const that = this

        return describe("RelationshipTest: Reject", function () {
            let transport: Transport

            let from: AccountController
            let to: AccountController

            this.timeout(End2EndTest.maxTimeoutTest)

            before(async function () {
                transport = new Transport(that.connection, that.config, that.eventBus, that.loggerFactory)
                that.logger.info(`Test Start ${this.currentTest?.fullTitle()}`)

                await TestUtil.clearAccounts(that.connection)

                await transport.init()

                const accounts = await TestUtil.provideAccounts(transport, 2, End2EndTest.name)
                from = accounts[0]
                to = accounts[1]
            })

            it("should reject a relationship between two accounts", async function () {
                const templateFrom = await from.relationshipTemplates.sendRelationshipTemplate({
                    content: {
                        mycontent: "template"
                    },
                    expiresAt: CoreDate.utc().add({ minutes: 5 }),
                    maxNumberOfAllocations: 1
                })

                const templateToken = TokenContentRelationshipTemplate.from({
                    templateId: templateFrom.id,
                    secretKey: templateFrom.secretKey
                })

                const token = await from.tokens.sendToken({
                    content: templateToken,
                    expiresAt: CoreDate.utc().add({ hours: 12 }),
                    ephemeral: false
                })

                const tokenRef = token.truncate()

                const receivedToken = await to.tokens.loadPeerTokenByTruncated(tokenRef, false)

                if (!(receivedToken.cache!.content instanceof TokenContentRelationshipTemplate)) {
                    throw new Error("token content not instanceof TokenContentRelationshipTemplate")
                }

                const templateTo = await to.relationshipTemplates.loadPeerRelationshipTemplate(
                    receivedToken.cache!.content.templateId,
                    receivedToken.cache!.content.secretKey
                )

                expect(templateTo.cache!.content).instanceOf(JSONWrapper)
                const templateContent = templateTo.cache!.content as JSONWrapper
                expect(templateContent.value).has.property("mycontent")
                expect(templateContent.value.mycontent).equals("template")

                const request = await to.relationships.sendRelationship({
                    template: templateTo,
                    content: {
                        mycontent: "request"
                    }
                })
                const relationshipId = request.id

                const templateRequestContent = request.cache!.template.cache!.content as JSONWrapper
                expect(templateRequestContent.value).has.property("mycontent")
                expect(templateRequestContent.value.mycontent).equals("template")

                expect(request.cache!.template.id.toString()).to.equal(templateTo.id.toString())
                expect(request.cache!.template.isOwn).to.equal(false)
                expect(request.cache!.creationChange.type).to.equal(RelationshipChangeType.Creation)
                expect(request.cache!.creationChange.status).to.equal(RelationshipChangeStatus.Pending)
                expect(request.status).to.equal(RelationshipStatus.Pending)

                // Reject relationship
                const syncedRelationships = await TestUtil.syncUntilHasRelationships(from)
                expect(syncedRelationships).to.have.lengthOf(1)
                const pendingRelationship = syncedRelationships[0]
                expect(pendingRelationship.cache!.template.id.toString()).to.equal(templateTo.id.toString())
                expect(pendingRelationship.cache!.template.isOwn).to.equal(true)

                const templateResponseContent = pendingRelationship.cache!.template.cache!.content as JSONWrapper
                expect(templateResponseContent.value).has.property("mycontent")
                expect(templateResponseContent.value.mycontent).equals("template")

                expect(pendingRelationship.cache!.creationChange.type).to.equal(RelationshipChangeType.Creation)
                expect(pendingRelationship.cache!.creationChange.status).to.equal(RelationshipChangeStatus.Pending)
                expect(pendingRelationship.status).to.equal(RelationshipStatus.Pending)

                const rejectedRelationshipFromSelf = await from.relationships.rejectChange(
                    pendingRelationship.cache!.creationChange,
                    {
                        mycontent: "rejectContent"
                    }
                )
                expect(rejectedRelationshipFromSelf.id.toString()).to.equal(relationshipId.toString())
                expect(rejectedRelationshipFromSelf.status).to.equal(RelationshipStatus.Rejected)
                expect(rejectedRelationshipFromSelf.cache!.creationChange.status).to.equal(
                    RelationshipChangeStatus.Rejected
                )
                expect(rejectedRelationshipFromSelf.peer).to.exist
                expect(rejectedRelationshipFromSelf.peer.address.toString()).to.equal(
                    rejectedRelationshipFromSelf.cache!.creationChange.request.createdBy.toString()
                )

                const rejectionContentSelf = rejectedRelationshipFromSelf.cache!.creationChange.response?.content as any
                expect(rejectionContentSelf).instanceOf(JSONWrapper)
                expect(rejectionContentSelf.value.mycontent).to.equal("rejectContent")

                // Get accepted relationship
                const syncedRelationshipsPeer = await TestUtil.syncUntilHasRelationships(to)
                expect(syncedRelationshipsPeer).to.have.lengthOf(1)
                const rejectedRelationshipPeer = syncedRelationshipsPeer[0]
                expect(rejectedRelationshipPeer.status).to.equal(RelationshipStatus.Rejected)

                expect(rejectedRelationshipPeer.id.toString()).to.equal(relationshipId.toString())
                expect(rejectedRelationshipPeer.status).to.equal(RelationshipStatus.Rejected)
                expect(rejectedRelationshipPeer.cache!.creationChange.status).to.equal(
                    RelationshipChangeStatus.Rejected
                )
                expect(rejectedRelationshipPeer.peer).to.exist
                expect(rejectedRelationshipPeer.peer.address.toString()).to.equal(
                    templateTo.cache?.identity.address.toString()
                )

                const rejectionContentPeer = rejectedRelationshipPeer.cache!.creationChange.response?.content as any
                expect(rejectionContentPeer).instanceOf(JSONWrapper)
                expect(rejectionContentPeer.value.mycontent).to.equal("rejectContent")
            }).timeout(End2EndTest.maxTimeoutStep)

            after(async function () {
                await from.close()
                await to.close()
            })
        })
    }

    public testRelationshipRevoke(): Mocha.Suite {
        const that = this

        return describe("RelationshipTest: Revoke", function () {
            let transport: Transport
            let templator: AccountController
            let requestor: AccountController

            this.timeout(End2EndTest.maxTimeoutTest)

            beforeEach(async function () {
                transport = new Transport(that.connection, that.config, that.eventBus, that.loggerFactory)

                that.logger.info(`Test Start ${this.currentTest?.fullTitle()}`)

                await TestUtil.clearAccounts(that.connection)

                await transport.init()

                const accounts = await TestUtil.provideAccounts(transport, 2, End2EndTest.name)
                templator = accounts[0]
                requestor = accounts[1]
            })

            it("should revoke a relationship between two accounts", async function () {
                const templateTemplator = await templator.relationshipTemplates.sendRelationshipTemplate({
                    content: {
                        mycontent: "template"
                    },
                    expiresAt: CoreDate.utc().add({ minutes: 5 }),
                    maxNumberOfAllocations: 1
                })

                const templateToken = TokenContentRelationshipTemplate.from({
                    templateId: templateTemplator.id,
                    secretKey: templateTemplator.secretKey
                })

                const token = await templator.tokens.sendToken({
                    content: templateToken,
                    expiresAt: CoreDate.utc().add({ hours: 12 }),
                    ephemeral: false
                })

                const tokenRef = token.truncate()

                const receivedToken = await requestor.tokens.loadPeerTokenByTruncated(tokenRef, false)

                if (!(receivedToken.cache!.content instanceof TokenContentRelationshipTemplate)) {
                    throw new Error("token content not instanceof TokenContentRelationshipTemplate")
                }

                const templateRequestor = await requestor.relationshipTemplates.loadPeerRelationshipTemplate(
                    receivedToken.cache!.content.templateId,
                    receivedToken.cache!.content.secretKey
                )

                expect(templateRequestor.cache!.content).instanceOf(JSONWrapper)
                const templateContent = templateRequestor.cache!.content as JSONWrapper
                expect(templateContent.value).has.property("mycontent")
                expect(templateContent.value.mycontent).equals("template")

                const request = await requestor.relationships.sendRelationship({
                    template: templateRequestor,
                    content: {
                        mycontent: "request"
                    }
                })

                const templateRequestContent = request.cache!.template.cache!.content as JSONWrapper
                expect(templateRequestContent.value).has.property("mycontent")
                expect(templateRequestContent.value.mycontent).equals("template")

                const relationshipId = request.id

                expect(request.cache!.template.id.toString()).to.equal(templateRequestor.id.toString())
                expect(request.cache!.template.isOwn).to.equal(false)
                expect(request.cache!.creationChange.type).to.equal(RelationshipChangeType.Creation)
                expect(request.cache!.creationChange.status).to.equal(RelationshipChangeStatus.Pending)
                expect(request.status).to.equal(RelationshipStatus.Pending)

                // Revoke relationship
                const syncedRelationships = await TestUtil.syncUntilHasRelationships(templator)
                expect(syncedRelationships).to.have.lengthOf(1)
                const pendingRelationship = syncedRelationships[0]
                expect(pendingRelationship.status).to.equal(RelationshipStatus.Pending)

                expect(pendingRelationship.cache!.template.id.toString()).to.equal(templateRequestor.id.toString())
                expect(pendingRelationship.cache!.template.isOwn).to.equal(true)

                const templateResponseContent = pendingRelationship.cache!.template.cache!.content as JSONWrapper
                expect(templateResponseContent.value).has.property("mycontent")
                expect(templateResponseContent.value.mycontent).equals("template")

                expect(pendingRelationship.cache!.creationChange.type).to.equal(RelationshipChangeType.Creation)
                expect(pendingRelationship.cache!.creationChange.status).to.equal(RelationshipChangeStatus.Pending)
                expect(pendingRelationship.status).to.equal(RelationshipStatus.Pending)

                const revokedRelationshipSelf = await requestor.relationships.revokeChange(
                    pendingRelationship.cache!.creationChange,
                    {
                        mycontent: "revokeContent"
                    }
                )
                expect(revokedRelationshipSelf.status).to.equal(RelationshipStatus.Revoked)

                expect(revokedRelationshipSelf.id.toString()).to.equal(relationshipId.toString())
                expect(revokedRelationshipSelf.status).to.equal(RelationshipStatus.Revoked)
                expect(revokedRelationshipSelf.cache!.creationChange.status).to.equal(RelationshipChangeStatus.Revoked)
                expect(revokedRelationshipSelf.peer).to.exist
                expect(revokedRelationshipSelf.peer.address.toString()).to.equal(
                    revokedRelationshipSelf.cache!.template.cache?.identity.address.toString()
                )
                const revocationContentSelf = revokedRelationshipSelf.cache!.creationChange.response?.content as any
                expect(revocationContentSelf).instanceOf(JSONWrapper)
                expect(revocationContentSelf.value.mycontent).to.equal("revokeContent")

                // Get revoked relationship
                const syncedRelationshipsPeer = await TestUtil.syncUntilHasRelationships(templator)
                expect(syncedRelationshipsPeer).to.have.lengthOf(1)
                const revokedRelationshipPeer = syncedRelationshipsPeer[0]
                expect(revokedRelationshipPeer.status).to.equal(RelationshipStatus.Revoked)
                expect(revokedRelationshipPeer.id.toString()).to.equal(relationshipId.toString())
                expect(revokedRelationshipPeer.status).to.equal(RelationshipStatus.Revoked)
                expect(revokedRelationshipPeer.cache!.creationChange.status).to.equal(RelationshipChangeStatus.Revoked)
                expect(revokedRelationshipPeer.peer).to.exist
                expect(revokedRelationshipPeer.peer.address.toString()).to.equal(
                    revokedRelationshipPeer.cache!.creationChange.request.createdBy.toString()
                )

                const revocationContentPeer = revokedRelationshipPeer.cache!.creationChange.response?.content as any
                expect(revocationContentPeer).instanceOf(JSONWrapper)
                expect(revocationContentPeer.value.mycontent).to.equal("revokeContent")
            }).timeout(End2EndTest.maxTimeoutStep)

            it("should handle an incoming relationship request which was already revoked by the sender", async function () {
                const templateTemplator = await templator.relationshipTemplates.sendRelationshipTemplate({
                    content: {
                        mycontent: "template"
                    },
                    expiresAt: CoreDate.utc().add({ minutes: 5 }),
                    maxNumberOfAllocations: 1
                })

                const templateToken = TokenContentRelationshipTemplate.from({
                    templateId: templateTemplator.id,
                    secretKey: templateTemplator.secretKey
                })

                const token = await templator.tokens.sendToken({
                    content: templateToken,
                    expiresAt: CoreDate.utc().add({ hours: 12 }),
                    ephemeral: false
                })

                const tokenRef = token.truncate()

                const receivedToken = await requestor.tokens.loadPeerTokenByTruncated(tokenRef, false)

                const receivedTemplateToken = TokenContentRelationshipTemplate.from(
                    receivedToken.cache!.content as TokenContentRelationshipTemplate
                )

                const templateRequestor = await requestor.relationshipTemplates.loadPeerRelationshipTemplate(
                    receivedTemplateToken.templateId,
                    receivedTemplateToken.secretKey
                )

                expect(templateRequestor.cache!.content).instanceOf(JSONWrapper)
                const templateContent = templateRequestor.cache!.content as JSONWrapper
                expect(templateContent.value).has.property("mycontent")
                expect(templateContent.value.mycontent).equals("template")

                const pendingRelationship = await requestor.relationships.sendRelationship({
                    template: templateRequestor,
                    content: {
                        mycontent: "request"
                    }
                })

                // Revoke relationship
                const revokedRelationshipSelf = await requestor.relationships.revokeChange(
                    pendingRelationship.cache!.creationChange,
                    {
                        mycontent: "revokeContent"
                    }
                )
                expect(revokedRelationshipSelf.status).to.equal(RelationshipStatus.Revoked)
                const revocationContentSelf = revokedRelationshipSelf.cache!.creationChange.response?.content as any
                expect(revocationContentSelf).instanceOf(JSONWrapper)
                expect(revocationContentSelf.value.mycontent).to.equal("revokeContent")

                // Get revoked relationship
                const syncedRelationshipsPeer = await TestUtil.syncUntilHasRelationships(templator)
                expect(syncedRelationshipsPeer).to.have.lengthOf(1)
                const revokedRelationshipPeer = syncedRelationshipsPeer[0]
                expect(revokedRelationshipPeer.status).to.equal(RelationshipStatus.Revoked)

                const revocationContentPeer = revokedRelationshipPeer.cache!.creationChange.response?.content as any
                expect(revocationContentPeer).instanceOf(JSONWrapper)
                expect(revocationContentPeer.value.mycontent).to.equal("revokeContent")
            }).timeout(End2EndTest.maxTimeoutStep)

            after(async function () {
                await templator.close()
                await requestor.close()
            })
        })
    }

    public testMessage(): Mocha.Suite {
        const that = this

        return describe("MessageTest", function () {
            let transport: Transport

            let from: AccountController
            let to: AccountController

            this.timeout(End2EndTest.maxTimeoutTest)

            before(async function () {
                transport = new Transport(that.connection, that.config, that.eventBus, that.loggerFactory)

                that.logger.info(`Test Start ${this.currentTest?.fullTitle()}`)

                await TestUtil.clearAccounts(that.connection)

                await transport.init()

                const accounts = await TestUtil.provideAccounts(transport, 2, End2EndTest.name)

                from = accounts[0]
                to = accounts[1]
                await TestUtil.addRelationship(from, to)
            })

            it("should send a message between the accounts", async function () {
                const message = await from.messages.sendMessage({
                    recipients: [to.identity.address],
                    content: { body: "Test Body", subject: "Test Subject" }
                })

                expect(message).to.exist
            }).timeout(End2EndTest.maxTimeoutStep)

            after(async function () {
                await from.close()
                await to.close()
            })
        })
    }

    public testToken(): Mocha.Suite {
        const that = this

        return describe("TokenTest", function () {
            let transport: Transport

            let from: AccountController

            this.timeout(End2EndTest.maxTimeoutTest)

            before(async function () {
                transport = new Transport(that.connection, that.config, that.eventBus, that.loggerFactory)

                that.logger.info(`Test Start ${this.currentTest?.fullTitle()}`)

                await TestUtil.clearAccounts(that.connection)

                await transport.init()

                const accounts = await TestUtil.provideAccounts(transport, 1, End2EndTest.name)
                from = accounts[0]
            })

            it("should create a token and read it afterwards", async function () {
                const token = await from.tokens.sendToken({
                    content: Serializable.fromAny({ content: "someContent" }),
                    expiresAt: CoreDate.utc().add({ minutes: 10 }),
                    ephemeral: false
                })

                expect(token).to.exist
            }).timeout(End2EndTest.maxTimeoutStep)

            after(async function () {
                await from.close()
            })
        })
    }

    public testFiles(): void {
        const that = this

        describe("FileTest", function () {
            let transport: Transport

            let from: AccountController
            let to: AccountController

            this.timeout(End2EndTest.maxTimeoutTest)

            before(async function () {
                transport = new Transport(that.connection, that.config, that.eventBus, that.loggerFactory)

                that.logger.info(`Test Start ${this.currentTest?.fullTitle()}`)

                await TestUtil.clearAccounts(that.connection)

                await transport.init()

                const accounts = await TestUtil.provideAccounts(transport, 2, End2EndTest.name)

                from = accounts[0]
                to = accounts[1]
            })

            it("should upload a file directly and download it afterwards", async function () {
                const content: CoreBuffer = CoreBuffer.fromUtf8("abcd")

                const file: File = await TestUtil.uploadFile(from, content)
                const ref: any = file.toFileReference().toJSON()

                const parcelRef: FileReference = FileReference.from(ref)

                const downloadedFile: File = await to.files.loadPeerFileByReference(parcelRef)

                const downloadedContent: CoreBuffer = await to.files.downloadFileContent(downloadedFile)

                expect(content.toArray()).to.have.members(downloadedContent.toArray())
            }).timeout(End2EndTest.maxTimeoutStep)

            it("should again upload a file directly and download it afterwards from the same account", async function () {
                const content: CoreBuffer = CoreBuffer.fromUtf8("abcd")

                const file: File = await TestUtil.uploadFile(from, content)

                const ref: any = file.toFileReference().toJSON()

                const parcelRef: FileReference = FileReference.from(ref)

                const downloadedFile: File = await from.files.loadPeerFileByReference(parcelRef)

                const downloadedContent: CoreBuffer = await from.files.downloadFileContent(downloadedFile)

                expect(content.toArray()).to.have.members(downloadedContent.toArray())
            }).timeout(End2EndTest.maxTimeoutStep)

            after(async function () {
                await from.close()
                await to.close()
            })
        })
    }

    public run(): void {
        this.testAccountCreation()
        this.testRelationshipRevoke()
        this.testRelationshipReject()
        this.testRelationshipAccept()
        this.testMessage()
        this.testToken()
        this.testFiles()
    }
}
