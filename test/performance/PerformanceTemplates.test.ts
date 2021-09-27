import { AccountController, Core, CoreDate, RelationshipTemplate } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest } from "../core/AbstractTest"
import { TestUtil } from "../core/TestUtil"

export class PerformanceTemplates extends AbstractTest {
    private async createTemplate(from: AccountController) {
        const templateFrom = await from.relationshipTemplates.sendRelationshipTemplate({
            content: {
                mycontent: "template"
            },
            expiresAt: CoreDate.utc().add({ hours: 12 }),
            maxNumberOfRelationships: 1
        })
        return templateFrom
    }

    public run(): void {
        const that = this

        describe("Performant Creation of Templates", function () {
            let coreLib: Core
            let recipient: AccountController

            this.timeout(200000)

            before(async function () {
                coreLib = new Core(that.connection, that.config, that.loggerFactory)

                await TestUtil.clearAccounts(that.connection)

                await coreLib.init()

                that.logger.trace("Creating account...")
                const accounts = await TestUtil.provideAccounts(coreLib, 1, PerformanceTemplates.name)
                that.logger.trace("Account created.")

                recipient = accounts[0]
            })

            it("should create multiple concurrent relationship templates for an account", async function () {
                const promises: Promise<RelationshipTemplate>[] = []
                for (let i = 0, l = 100; i < l; i++) {
                    that.logger.trace(`Creating Template #${i}`)
                    promises.push(that.createTemplate(recipient))
                }
                that.logger.trace("All Templates created. Awaiting all responses...")
                await Promise.all(promises)
                that.logger.trace("All Responses returned. Checking responses...")
                for (let i = 0, l = promises.length; i < l; i++) {
                    expect((await promises[i]).id).to.exist
                }
                that.logger.trace("All Responses are ok.")
            }).timeout(60000)

            after(async function () {
                await recipient.close()
            })
        })
    }
}
