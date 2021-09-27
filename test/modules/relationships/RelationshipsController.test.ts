import {
    AccountController,
    CachedRelationship,
    Core,
    CoreDate,
    CoreId,
    Identity,
    Relationship,
    RelationshipChangeRequest,
    RelationshipChangeResponse,
    RelationshipChangeStatus,
    RelationshipChangeType,
    RelationshipStatus,
    RelationshipTemplate
} from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest } from "../../core/AbstractTest"
import { TestUtil } from "../../core/TestUtil"

export class RelationshipsControllerTest extends AbstractTest {
    public run(): void {
        const that = this

        describe("RelationshipsController", function () {
            let coreLib: Core

            let sender: AccountController
            let recipient1: AccountController
            let relId1: CoreId
            let recipient2: AccountController
            let recipient3: AccountController
            let senderRel: Relationship
            let recipientRel: Relationship
            let tempDate: CoreDate

            this.timeout(150000)

            function expectValidActiveFreshRelationship(
                relationship: Relationship,
                ownAccount: AccountController,
                peerAccount: AccountController,
                creationTime: CoreDate
            ) {
                expect(relationship.id).instanceOf(CoreId)
                expect(relationship.status).to.equal(RelationshipStatus.Active)
                expect(relationship.peer).instanceOf(Identity)
                expect(relationship.peer.address.equals(peerAccount.identity.address)).to.be.true

                expect(relationship.cache!.template).instanceOf(RelationshipTemplate)
                expect(relationship.cache!.changes).to.be.of.length(1)

                expect(relationship.cache).instanceOf(CachedRelationship)
                expect(relationship.cachedAt).instanceOf(CoreDate)
                expect(relationship.cachedAt!.isWithin(that.tempDateThreshold, that.tempDateThreshold, creationTime)).to
                    .be.true

                const creation = relationship.cache!.changes[0]
                expect(creation.relationshipId.toString()).equals(relationship.id.toString())
                expect(creation.status).to.equal(RelationshipChangeStatus.Accepted)
                expect(creation.type).to.equal(RelationshipChangeType.Creation)

                expect(creation.request).instanceOf(RelationshipChangeRequest)
                expect(
                    creation.request.createdAt.isWithin(that.tempDateThreshold, that.tempDateThreshold, creationTime)
                ).to.be.true
                if (creation.request.createdBy.equals(ownAccount.identity.address)) {
                    expect(creation.request.createdBy.toString()).equals(ownAccount.identity.address.toString())
                    expect(creation.response?.createdBy.toString()).equals(peerAccount.identity.address.toString())
                } else {
                    expect(creation.response?.createdBy.toString()).equals(ownAccount.identity.address.toString())
                    expect(creation.request.createdBy.toString()).equals(peerAccount.identity.address.toString())
                }

                expect(creation.response).instanceOf(RelationshipChangeResponse)
                expect(
                    creation.response!.createdAt.isWithin(that.tempDateThreshold, that.tempDateThreshold, creationTime)
                ).to.be.true

                expect(relationship.cache!.lastMessageReceivedAt).to.not.exist
                expect(relationship.cache!.lastMessageSentAt).to.not.exist
                expect(relationship.relationshipSecretId).to.exist
            }

            before(async function () {
                coreLib = new Core(that.connection, that.config, that.loggerFactory)

                await TestUtil.clearAccounts(that.connection)

                await coreLib.init()

                const accounts = await TestUtil.provideAccounts(coreLib, 4, RelationshipsControllerTest.name)
                sender = accounts[0]
                recipient1 = accounts[1]
                recipient2 = accounts[2]
                recipient3 = accounts[3]
            })

            it("should return an empty relationships array", async function () {
                const relationships = await sender.relationships.getRelationships()
                expect(relationships).be.of.length(0)
            })

            it("should create a relationship and get it afterwards by the address", async function () {
                tempDate = CoreDate.utc()
                await TestUtil.addRelationship(sender, recipient1)
                senderRel = (await sender.relationships.getActiveRelationshipToIdentity(recipient1.identity.address))!
                relId1 = senderRel.id
                recipientRel = (await recipient1.relationships.getActiveRelationshipToIdentity(
                    sender.identity.address
                ))!
                expect(senderRel).to.exist
                expect(recipientRel).to.exist
                expect(senderRel.id.toString()).to.equal(recipientRel.id.toString())
            }).timeout(15000)

            it("should set all the required relationship properties", function () {
                expectValidActiveFreshRelationship(senderRel, sender, recipient1, tempDate)
                expect(senderRel.metadata).to.not.exist
                expect(senderRel.metadataModifiedAt).to.not.exist
                expectValidActiveFreshRelationship(recipientRel, recipient1, sender, tempDate)
                expect(recipientRel.metadata).to.not.exist
                expect(recipientRel.metadataModifiedAt).to.not.exist
            })

            it("should set and get additional metadata", async function () {
                await sender.relationships.setRelationshipMetadata(senderRel, { myprop: true })
                const senderRel2 = (await sender.relationships.getRelationship(senderRel.id))!
                expectValidActiveFreshRelationship(senderRel2, sender, recipient1, tempDate)
                expect(senderRel2.metadata).to.exist
                expect(senderRel2.metadata["myprop"]).equals(true)
                expect(senderRel2.metadataModifiedAt).to.exist
                expect(senderRel2.metadataModifiedAt!.isWithin(that.tempDateThreshold)).to.be.true
            })

            describe("Requestor", function () {
                it("should get the cached relationships", async function () {
                    const relationships = await sender.relationships.getRelationships()
                    expect(relationships).be.of.length(1)
                    const rel1 = relationships[0]
                    expect(rel1.cache).to.exist
                    expect(rel1.cachedAt).to.exist
                })

                it("should access the relationship cache by using get", async function () {
                    const relationship = await sender.relationships.getRelationship(relId1)
                    expectValidActiveFreshRelationship(relationship!, sender, recipient1, tempDate)
                })

                it("should create a new relationship to another recipient", async function () {
                    tempDate = CoreDate.utc()
                    await TestUtil.addRelationship(sender, recipient2)
                    senderRel = (await sender.relationships.getActiveRelationshipToIdentity(
                        recipient2.identity.address
                    ))!
                    expectValidActiveFreshRelationship(senderRel, sender, recipient2, tempDate)
                })
            })

            describe("Templator", function () {
                it("should get the cached relationships", async function () {
                    const relationships = await recipient1.relationships.getRelationships()
                    expect(relationships).be.of.length(1)
                    const rel1 = relationships[0]
                    expect(rel1.cache).to.exist
                    expect(rel1.cachedAt).to.exist
                })

                it("should access the relationship cache by using get", async function () {
                    const relationship = await recipient1.relationships.getRelationship(relId1)
                    expectValidActiveFreshRelationship(relationship!, recipient1, sender, tempDate)
                })

                it("should create a new relationship to another recipient", async function () {
                    tempDate = CoreDate.utc()
                    await TestUtil.addRelationship(recipient1, recipient2)
                    senderRel = (await recipient1.relationships.getActiveRelationshipToIdentity(
                        recipient2.identity.address
                    ))!
                    expectValidActiveFreshRelationship(senderRel, recipient1, recipient2, tempDate)
                })

                it("should have cached the relationship to another recipient", async function () {
                    const relationships = await recipient1.relationships.getRelationships()
                    expect(relationships).to.be.of.length(2)
                    const rel1 = relationships[0]
                    expect(rel1.cache).to.exist
                    expect(rel1.cachedAt).to.exist
                    const rel2 = relationships[1]
                    expectValidActiveFreshRelationship(rel2, recipient1, recipient2, tempDate)
                })
            })

            after(async function () {
                await sender.close()
                await recipient1.close()
                await recipient2.close()
                await recipient3.close()
            })
        })
    }
}
