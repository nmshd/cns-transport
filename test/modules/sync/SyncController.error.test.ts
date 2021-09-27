import { IDatabaseConnection } from "@js-soft/docdb-access-abstractions"
import { ILoggerFactory } from "@js-soft/logging-abstractions"
import { CoreDate, IConfigOverwrite } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest, TestUtil } from "../../core"

export class SyncControllerErrorTest extends AbstractTest {
    public constructor(config: IConfigOverwrite, connection: IDatabaseConnection, loggerFactory: ILoggerFactory) {
        super({ ...config, datawalletEnabled: true }, connection, loggerFactory)
    }

    public run(): void {
        const that = this

        describe("SyncController.error", function () {
            this.timeout("200s")

            before(async function () {
                await TestUtil.clearAccounts(that.connection)
            })

            it("applying external events on templatorDevice2 should fail when templatorDevice1 has not synced its datawallet", async function () {
                const requestorDevice = await that.createIdentityWithOneDevice(SyncControllerErrorTest.name)

                const { device1: templatorDevice1, device2: templatorDevice2 } =
                    await that.createIdentityWithTwoDevices(SyncControllerErrorTest.name)

                const templateOnTemplatorDevice = await templatorDevice1.relationshipTemplates.sendRelationshipTemplate(
                    {
                        content: { someTemplateContent: "someTemplateContent" },
                        expiresAt: CoreDate.utc().add({ minutes: 5 }),
                        maxNumberOfRelationships: 1
                    }
                )
                // The templatorDevice1 doesn't sync the datawallet after creating the template.
                // The external event triggered by creating a relationship will throw an error
                // in the ExternalEventsProcessor of templatorDevice2, because the template
                // doesn't exist on templatorDevice2

                const templateOnRequestorDevice =
                    await requestorDevice.relationshipTemplates.loadPeerRelationshipTemplate(
                        templateOnTemplatorDevice.id,
                        templateOnTemplatorDevice.secretKey
                    )

                await requestorDevice.relationships.sendRelationship({
                    template: templateOnRequestorDevice,
                    content: { someMessageContent: "someMessageContent" }
                })

                const error = await TestUtil.syncUntilHasError(templatorDevice2)
                expect(error.code).to.equal("error.core.errorWhileApplyingExternalEvents")
                expect(error.message).to.match(
                    /error.core.errorWhileApplyingExternalEvents: 'error.core.recordNotFound'/
                )
            })
        })
    }
}
