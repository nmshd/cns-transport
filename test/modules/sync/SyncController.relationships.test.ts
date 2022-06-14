import { IDatabaseConnection } from "@js-soft/docdb-access-abstractions"
import { ILoggerFactory } from "@js-soft/logging-abstractions"
import { CoreDate, IConfigOverwrite, RelationshipStatus } from "@nmshd/transport"
import chai, { expect } from "chai"
import chaiExclude from "chai-exclude"
import { AbstractTest, TestUtil } from "../../testHelpers"

chai.use(chaiExclude)

export class RelationshipSyncTest extends AbstractTest {
    public constructor(config: IConfigOverwrite, connection: IDatabaseConnection, loggerFactory: ILoggerFactory) {
        super({ ...config, datawalletEnabled: true }, connection, loggerFactory)
    }

    public run(): void {
        const that = this

        describe("RelationshipSync", function () {
            this.timeout("200s")

            before(async function () {
                await TestUtil.clearAccounts(that.connection)
            })

            it("syncDatawallet should sync relationships", async function () {
                const templatorDevice = await that.createIdentityWithOneDevice(RelationshipSyncTest.name)

                const { device1: requestorDevice1, device2: requestorDevice2 } =
                    await that.createIdentityWithTwoDevices(RelationshipSyncTest.name)

                const templateOnTemplatorDevice = await templatorDevice.relationshipTemplates.sendRelationshipTemplate({
                    content: { someTemplateContent: "someTemplateContent" },
                    expiresAt: CoreDate.utc().add({ minutes: 5 }),
                    maxNumberOfAllocations: 1
                })

                const templateOnRequestorDevice1 =
                    await requestorDevice1.relationshipTemplates.loadPeerRelationshipTemplate(
                        templateOnTemplatorDevice.id,
                        templateOnTemplatorDevice.secretKey
                    )

                const createdRelationship = await requestorDevice1.relationships.sendRelationship({
                    template: templateOnRequestorDevice1,
                    content: { someMessageContent: "someMessageContent" }
                })

                await requestorDevice1.syncDatawallet()

                let relationshipOnRequestorDevice2 = await requestorDevice2.relationships.getRelationship(
                    createdRelationship.id
                )
                expect(relationshipOnRequestorDevice2).to.be.undefined

                await requestorDevice2.syncDatawallet()

                relationshipOnRequestorDevice2 = await requestorDevice2.relationships.getRelationship(
                    createdRelationship.id
                )
                expect(relationshipOnRequestorDevice2).to.not.be.undefined
                expect(relationshipOnRequestorDevice2?.cache).to.not.be.undefined

                expect(relationshipOnRequestorDevice2!.toJSON())
                    .excludingEvery("cachedAt")
                    .to.eql(createdRelationship.toJSON())

                await TestUtil.syncUntilHasRelationships(templatorDevice)

                const relationshipOnTemplatorDevice = await templatorDevice.relationships.getRelationship(
                    createdRelationship.id
                )
                await templatorDevice.relationships.acceptChange(relationshipOnTemplatorDevice!.cache!.creationChange, {
                    someResponseContent: "someResponseContent"
                })

                let relationshipOnRequestorDevice1 = (await requestorDevice2.relationships.getRelationship(
                    createdRelationship.id
                ))!
                expect(relationshipOnRequestorDevice1.status).to.eql(RelationshipStatus.Pending)

                await TestUtil.syncUntilHasRelationship(requestorDevice1, relationshipOnRequestorDevice1.id)

                relationshipOnRequestorDevice1 = (await requestorDevice1.relationships.getRelationship(
                    relationshipOnRequestorDevice1.id
                ))!
                expect(relationshipOnRequestorDevice1.status).to.eql(RelationshipStatus.Active)

                relationshipOnRequestorDevice2 = await requestorDevice2.relationships.getRelationship(
                    relationshipOnRequestorDevice1.id
                )
                expect(relationshipOnRequestorDevice2!.status).to.eql(RelationshipStatus.Pending)

                await requestorDevice2.syncDatawallet()

                relationshipOnRequestorDevice2 = await requestorDevice2.relationships.getRelationship(
                    relationshipOnRequestorDevice1.id
                )
                expect(relationshipOnRequestorDevice2!.status).to.eql(RelationshipStatus.Active)
            })

            it("syncDatawallet should sync relationships without fetching first", async function () {
                const templatorDevice = await that.createIdentityWithOneDevice(RelationshipSyncTest.name)

                const { device1: requestorDevice1, device2: requestorDevice2 } =
                    await that.createIdentityWithTwoDevices(RelationshipSyncTest.name)

                const templateOnTemplatorDevice = await templatorDevice.relationshipTemplates.sendRelationshipTemplate({
                    content: { someTemplateContent: "someTemplateContent" },
                    expiresAt: CoreDate.utc().add({ minutes: 5 }),
                    maxNumberOfAllocations: 1
                })

                const templateOnRequestorDevice1 =
                    await requestorDevice1.relationshipTemplates.loadPeerRelationshipTemplate(
                        templateOnTemplatorDevice.id,
                        templateOnTemplatorDevice.secretKey
                    )

                const createdRelationship = await requestorDevice1.relationships.sendRelationship({
                    template: templateOnRequestorDevice1,
                    content: { someMessageContent: "someMessageContent" }
                })

                await requestorDevice1.syncDatawallet()

                let relationshipOnRequestorDevice2 = await requestorDevice2.relationships.getRelationship(
                    createdRelationship.id
                )
                expect(relationshipOnRequestorDevice2).to.be.undefined

                const relationships = await TestUtil.syncUntilHasRelationships(templatorDevice)

                const relationshipOnTemplatorDevice = relationships[0]
                await templatorDevice.relationships.acceptChange(relationshipOnTemplatorDevice.cache!.creationChange, {
                    someResponseContent: "someResponseContent"
                })

                let relationshipOnRequestorDevice1 = await requestorDevice2.relationships.getRelationship(
                    createdRelationship.id
                )
                expect(relationshipOnRequestorDevice1).to.be.undefined

                await TestUtil.syncUntilHasRelationship(requestorDevice2, createdRelationship.id)

                relationshipOnRequestorDevice1 = (await requestorDevice2.relationships.getRelationship(
                    createdRelationship.id
                ))!
                expect(relationshipOnRequestorDevice1.status).to.eql(RelationshipStatus.Active)

                relationshipOnRequestorDevice2 = await requestorDevice1.relationships.getRelationship(
                    createdRelationship.id
                )
                expect(relationshipOnRequestorDevice2!.status).to.eql(RelationshipStatus.Pending)

                await requestorDevice1.syncDatawallet()

                relationshipOnRequestorDevice2 = await requestorDevice1.relationships.getRelationship(
                    createdRelationship.id
                )
                expect(relationshipOnRequestorDevice2!.status).to.eql(RelationshipStatus.Active)
            })

            it("syncDatawallet should sync relationships with two templators", async function () {
                const requestorDevice = await that.createIdentityWithOneDevice(RelationshipSyncTest.name)

                const { device1: templatorDevice1, device2: templatorDevice2 } =
                    await that.createIdentityWithTwoDevices(RelationshipSyncTest.name)

                const templateOnTemplatorDevice = await templatorDevice1.relationshipTemplates.sendRelationshipTemplate(
                    {
                        content: { someTemplateContent: "someTemplateContent" },
                        expiresAt: CoreDate.utc().add({ minutes: 5 }),
                        maxNumberOfAllocations: 1
                    }
                )
                await templatorDevice1.syncDatawallet()

                const templateOnRequestorDevice1 =
                    await requestorDevice.relationshipTemplates.loadPeerRelationshipTemplate(
                        templateOnTemplatorDevice.id,
                        templateOnTemplatorDevice.secretKey
                    )

                const createdRelationship = await requestorDevice.relationships.sendRelationship({
                    template: templateOnRequestorDevice1,
                    content: { someMessageContent: "someMessageContent" }
                })

                await requestorDevice.syncDatawallet()

                const relationshipOnTemplatorDevice2 = await templatorDevice2.relationships.getRelationship(
                    createdRelationship.id
                )
                expect(relationshipOnTemplatorDevice2).to.be.undefined

                const relationshipOnTemplatorDevice1 = await templatorDevice1.relationships.getRelationship(
                    createdRelationship.id
                )
                expect(relationshipOnTemplatorDevice1).to.be.undefined

                await TestUtil.syncUntilHasRelationships(templatorDevice2)

                const relationshipOnTemplatorDevice = await templatorDevice2.relationships.getRelationship(
                    createdRelationship.id
                )
                await templatorDevice2.relationships.acceptChange(
                    relationshipOnTemplatorDevice!.cache!.creationChange,
                    {
                        someResponseContent: "someResponseContent"
                    }
                )

                await templatorDevice2.syncDatawallet()

                let relationshipOnRequestorDevice1 = (await templatorDevice1.relationships.getRelationship(
                    createdRelationship.id
                ))!
                expect(relationshipOnRequestorDevice1).to.be.undefined

                await templatorDevice1.syncDatawallet()

                relationshipOnRequestorDevice1 = (await templatorDevice1.relationships.getRelationship(
                    createdRelationship.id
                ))!
                expect(relationshipOnRequestorDevice1.status).to.eql(RelationshipStatus.Active)

                await TestUtil.syncUntilHasRelationship(requestorDevice, relationshipOnRequestorDevice1.id)

                relationshipOnRequestorDevice1 = (await requestorDevice.relationships.getRelationship(
                    relationshipOnRequestorDevice1.id
                ))!
                expect(relationshipOnRequestorDevice1.status).to.eql(RelationshipStatus.Active)
            })

            it("syncDatawallet should sync relationship templates", async function () {
                const { device1, device2 } = await that.createIdentityWithTwoDevices(RelationshipSyncTest.name)

                const templateOnDevice1 = await device1.relationshipTemplates.sendRelationshipTemplate({
                    content: { someTemplateContent: "someTemplateContent" },
                    expiresAt: CoreDate.utc().add({ minutes: 5 })
                })
                await device1.syncDatawallet()

                let templateOnDevice2 = await device2.relationshipTemplates.getRelationshipTemplate(
                    templateOnDevice1.id
                )
                expect(templateOnDevice2).to.be.undefined

                await device2.syncDatawallet()

                templateOnDevice2 = await device2.relationshipTemplates.getRelationshipTemplate(templateOnDevice1.id)
                expect(templateOnDevice2).to.exist
                expect(templateOnDevice2?.cache).to.exist
                expect(templateOnDevice2!.toJSON()).excluding("cachedAt").to.eql(templateOnDevice1.toJSON())
            })
        })
    }
}
