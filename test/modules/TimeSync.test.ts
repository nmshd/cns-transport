import { AccountController, CoreDate, Transport } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest, TestUtil } from "../testHelpers"

export class TimeSyncTest extends AbstractTest {
    public run(): void {
        const that = this

        describe("TimeSyncTest", function () {
            let transport: Transport

            let recipient: AccountController

            let localTime: CoreDate
            let serverTime: CoreDate

            this.timeout(200000)

            before(async function () {
                transport = new Transport(that.connection, that.config, that.loggerFactory)

                await TestUtil.clearAccounts(that.connection)
                await transport.init()

                localTime = CoreDate.utc()
                const accounts = await TestUtil.provideAccounts(transport, 1, TimeSyncTest.name)
                recipient = accounts[0]
                serverTime = recipient.activeDevice.createdAt
            })

            it("local Testrunner's time should be in sync with Backbone", function () {
                that.logger.info(
                    `Testrunner Time: ${localTime.toISOString()} BackboneTime: ${serverTime.toISOString()}`
                )

                expect(localTime.isWithin(that.tempDateThreshold, that.tempDateThreshold, serverTime)).to.be.true
            })

            after(async function () {
                await recipient.close()
            })
        })
    }
}
