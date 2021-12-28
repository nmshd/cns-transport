import { AccountController, Identity, Transport } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest, TestUtil } from "../../testHelpers"

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

            it("should return default values for empty identity properties", function () {
                const id = account.identity.identity.toJSON() as any
                expect(id.name).eq("")
                expect(id.description).eq("")
                expect(id.createdAt).eq("2020-01-01T00:00:00.000Z")
                expect(id.type).eq("unknown")
                const identity = Identity.from(id)
                expect(identity).to.exist
            })

            it("should be able to read in Identity without deprecated data", function () {
                const id = account.identity.identity.toJSON() as any
                delete id.name
                delete id.description
                delete id.createdAt
                delete id.type
                const identity = Identity.from(id)
                expect(identity).to.exist
            })

            after(async function () {
                await account.close()
            })
        })
    }
}
