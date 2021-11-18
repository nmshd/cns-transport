import { AccountController, Relationship, Transport } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest, TestUtil } from "../testHelpers"

export class PerformanceOpenRequests extends AbstractTest {
    public run(): void {
        const that = this

        describe("Performant Fetch of Open Requests", function () {
            let transport: Transport
            let recipient: AccountController

            this.timeout(200000)

            before(async function () {
                transport = new Transport(that.connection, that.config, that.loggerFactory)

                await TestUtil.clearAccounts(that.connection)

                await transport.init()

                that.logger.trace("Creating account...")
                const accounts = await TestUtil.provideAccounts(transport, 1, PerformanceOpenRequests.name)
                that.logger.trace("Account created.")

                recipient = accounts[0]
            })

            it("should query multiple times for open requests", async function () {
                const promises: Promise<Relationship[]>[] = []
                for (let i = 0, l = 1000; i < l; i++) {
                    that.logger.trace(`Creating Template #${i}`)
                    promises.push(TestUtil.syncUntilHasRelationships(recipient))
                }
                that.logger.trace("All Templates created. Awaiting all responses...")
                await Promise.all(promises)
                that.logger.trace("All Responses returned. Checking responses...")
                for (let i = 0, l = promises.length; i < l; i++) {
                    expect((await promises[i]).length).to.exist
                }
                that.logger.trace("All Responses are ok.")
            }).timeout(180000)

            after(async function () {
                await recipient.close()
            })
        })
    }
}
