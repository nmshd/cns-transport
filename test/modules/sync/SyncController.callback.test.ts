import { IDatabaseConnection } from "@js-soft/docdb-access-abstractions"
import { ILoggerFactory } from "@js-soft/logging-abstractions"
import { AccountController, IConfigOverwrite } from "@nmshd/transport"
import { expect } from "chai"
import _ from "lodash"
import { AbstractTest, TestUtil } from "../../testHelpers"

interface CallbackObject {
    percentage: number
    process: string
}

export class SyncControllerCallbackTest extends AbstractTest {
    public constructor(config: IConfigOverwrite, connection: IDatabaseConnection, loggerFactory: ILoggerFactory) {
        super({ ...config, datawalletEnabled: true }, connection, loggerFactory)
    }

    public run(): void {
        const that = this

        describe("SyncControllerCallback", function () {
            let a1: AccountController | undefined
            let b1: AccountController | undefined
            let b2: AccountController | undefined

            this.timeout(150000)

            it("should execute the callback during syncEverything", async function () {
                a1 = await that.createIdentityWithOneDevice(SyncControllerCallbackTest.name)
                const { device1: b1, device2: b2 } = await that.createIdentityWithTwoDevices(
                    SyncControllerCallbackTest.name
                )

                await TestUtil.addRelationship(a1, b1)

                await TestUtil.sendMessage(a1, b1)
                await TestUtil.syncUntilHasMessages(a1, 1)

                const events: CallbackObject[] = []

                await b2.syncEverything((percentage: number, process: string) => {
                    events.push({ percentage, process })
                })

                expect(events).to.have.lengthOf(30)

                const grouped = _.groupBy(events, "process")
                for (const key in grouped) {
                    const percentages = grouped[key].map((e) => e.percentage)
                    expect(percentages).to.contain(0)
                    expect(percentages).to.contain(100)
                }
            }).timeout(150000)

            after(async function () {
                await a1?.close()
                await b1?.close()
                await b2?.close()
            })
        })
    }
}
