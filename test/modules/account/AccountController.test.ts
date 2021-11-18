import { AccountController, Transport } from "@nmshd/transport"
import { AbstractTest } from "../../testHelpers/AbstractTest"
import { TestUtil } from "../../testHelpers/TestUtil"

export class AccountControllerTest extends AbstractTest {
    public run(): void {
        const that = this

        describe("AccountController", function () {
            let transport: Transport

            let account: AccountController
            this.timeout(15000)

            before(async function () {
                transport = new Transport(that.connection, that.config, that.loggerFactory)
                await TestUtil.clearAccounts(that.connection)

                await transport.init()

                const accounts = await TestUtil.provideAccounts(transport, 1, AccountControllerTest.name)
                account = accounts[0]
            })

            // eslint-disable-next-line jest/expect-expect
            it("should init a second time", async function () {
                await account.init()
            }).timeout(15000)

            after(async function () {
                await account.close()
            })
        })
    }
}
