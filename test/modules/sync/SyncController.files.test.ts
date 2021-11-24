import { IDatabaseConnection } from "@js-soft/docdb-access-abstractions"
import { ILoggerFactory } from "@js-soft/logging-abstractions"
import { CoreBuffer } from "@nmshd/crypto"
import { CoreDate, IConfigOverwrite } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest, TestUtil } from "../../testHelpers"

export class FileSyncTest extends AbstractTest {
    public constructor(config: IConfigOverwrite, connection: IDatabaseConnection, loggerFactory: ILoggerFactory) {
        super({ ...config, datawalletEnabled: true }, connection, loggerFactory)
    }

    public run(): void {
        const that = this

        describe("FileSync", function () {
            this.timeout("200s")

            before(async function () {
                await TestUtil.clearAccounts(that.connection)
            })

            it("syncDatawallet should sync files", async function () {
                const { device1, device2 } = await that.createIdentityWithTwoDevices(FileSyncTest.name)

                const fileOnDevice1 = await device1.files.sendFile({
                    description: "A description",
                    expiresAt: CoreDate.utc().add({ minutes: 2 }),
                    filename: "aFilename.txt",
                    mimetype: "text/plain",
                    title: "A File Title",
                    buffer: CoreBuffer.fromUtf8("Some file content")
                })
                await device1.syncDatawallet()

                let fileOnDevice2 = await device2.files.getFile(fileOnDevice1.id)

                expect(fileOnDevice2, "because the device hasn't synchronized its datawallet yet.").to.be.undefined

                await device2.syncDatawallet()

                fileOnDevice2 = await device2.files.getFile(fileOnDevice1.id)
                expect(fileOnDevice2).to.exist
                expect(fileOnDevice2?.cache).to.exist
                expect(fileOnDevice2!.toJSON()).excluding("cachedAt").to.eql(fileOnDevice1.toJSON())
            })
        })
    }
}
