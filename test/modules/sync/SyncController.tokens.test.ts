import { IDatabaseConnection } from "@js-soft/docdb-access-abstractions"
import { ILoggerFactory } from "@js-soft/logging-abstractions"
import { CoreDate, IConfigOverwrite } from "@nmshd/transport"
import chai, { expect } from "chai"
import chaiExclude from "chai-exclude"
import { AbstractTest, TestUtil } from "../../testHelpers"

chai.use(chaiExclude)

export class TokenSyncTest extends AbstractTest {
    public constructor(config: IConfigOverwrite, connection: IDatabaseConnection, loggerFactory: ILoggerFactory) {
        super({ ...config, datawalletEnabled: true }, connection, loggerFactory)
    }

    public run(): void {
        const that = this

        describe("TokenSync", function () {
            this.timeout("200s")

            before(async function () {
                await TestUtil.clearAccounts(that.connection)
            })

            it("syncDatawallet should sync tokens", async function () {
                const { device1, device2 } = await that.createIdentityWithTwoDevices(TokenSyncTest.name)

                const tokenOnDevice1 = await device1.tokens.sendToken({
                    content: { someTokenContent: "someTokenContent" },
                    expiresAt: CoreDate.utc().add({ minutes: 5 }),
                    ephemeral: false
                })
                await device1.syncDatawallet()

                let tokenOnDevice2 = await device2.tokens.getToken(tokenOnDevice1.id)
                expect(tokenOnDevice2).to.be.undefined

                await device2.syncDatawallet()

                tokenOnDevice2 = await device2.tokens.getToken(tokenOnDevice1.id)
                expect(tokenOnDevice2).to.exist
                expect(tokenOnDevice2?.cache).to.exist

                tokenOnDevice2 = await device2.tokens.getToken(tokenOnDevice1.id)
                expect(tokenOnDevice2!.toJSON()).excluding("cachedAt").to.eql(tokenOnDevice1.toJSON())
            })
        })
    }
}
