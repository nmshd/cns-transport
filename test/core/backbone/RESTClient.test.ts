import { AccountController, Core } from "@nmshd/transport"
import { AbstractTest } from "../AbstractTest"
import { TestUtil } from "../TestUtil"

export class RESTClientTest extends AbstractTest {
    public run(): void {
        const that = this

        describe("RESTClientTest", function () {
            let coreLib: Core

            let testAccount: AccountController

            this.timeout(150000)

            before(async function () {
                coreLib = new Core(that.connection, that.config, that.loggerFactory)

                await TestUtil.clearAccounts(that.connection)

                await coreLib.init()

                const accounts = await TestUtil.provideAccounts(coreLib, 1, RESTClientTest.name)
                testAccount = accounts[0]
            })

            // eslint-disable-next-line jest/expect-expect
            it("should parse request params correctly", async function () {
                // TODO: JSSNMSHDD-2488 (test serializing of request params)
            }).timeout(60000)

            after(async function () {
                await testAccount.close()
            })
        })
    }
}
