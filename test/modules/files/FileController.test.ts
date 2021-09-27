import { CoreBuffer } from "@nmshd/crypto"
import { AccountController, Core, CoreDate, CoreId, File } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest } from "../../core/AbstractTest"
import { TestUtil } from "../../core/TestUtil"

export class FileControllerTest extends AbstractTest {
    public run(): void {
        const that = this

        describe("FileController", function () {
            let coreLib: Core
            let sender: AccountController
            let recipient: AccountController
            let tempId1: CoreId
            let tempId2: CoreId
            let tempDate: CoreDate

            this.timeout(150000)

            function expectValidFiles(sentFile: File, receivedFile: File, nowMinusSeconds: CoreDate) {
                expect(sentFile.id.toString()).equals(receivedFile.id.toString())
                expect(sentFile.cache).to.exist
                expect(sentFile.cachedAt?.isSameOrAfter(nowMinusSeconds)).to.be.true
                expect(sentFile.cache?.createdBy.toString()).equals(sender.identity.address.toString())
                expect(sentFile.cache?.owner.toString()).equals(sender.identity.address.toString())
                expect(sentFile.cache?.createdByDevice.toString()).equals(sender.activeDevice.id.toString())
                expect(sentFile.cache?.createdAt.isSameOrAfter(nowMinusSeconds)).to.be.true
                expect(receivedFile.cache).to.exist
                expect(receivedFile.cachedAt?.isSameOrAfter(nowMinusSeconds)).to.be.true
                expect(receivedFile.cache?.createdBy.toString()).equals(sender.identity.address.toString())
                expect(receivedFile.cache?.createdByDevice.toString()).equals(sender.activeDevice.id.toString())
                expect(receivedFile.cache?.createdAt.isSameOrAfter(nowMinusSeconds)).to.be.true
                expect(receivedFile.cache?.expiresAt.equals(sentFile.cache!.expiresAt)).to.be.true
                expect(sentFile.cache!.description).equals(receivedFile.cache!.description)
                expect(sentFile.cache!.title).equals(receivedFile.cache!.title)
                expect(sentFile.cache!.filemodified?.toString()).equals(receivedFile.cache!.filemodified?.toString())
                expect(sentFile.cache!.filename).equals(receivedFile.cache!.filename)
                expect(sentFile.cache!.filesize).equals(receivedFile.cache!.filesize)
                expect(sentFile.cache!.mimetype).equals(receivedFile.cache!.mimetype)
                expect(sentFile.cache!.owner.toString()).equals(receivedFile.cache!.owner.toString())
                expect(sentFile.cache!.ownerSignature.toBase64()).equals(receivedFile.cache!.ownerSignature.toBase64())
                expect(sentFile.cache!.plaintextHash.toBase64()).equals(receivedFile.cache!.plaintextHash.toBase64())
                expect(sentFile.cache!.cipherHash.toBase64()).equals(receivedFile.cache!.cipherHash.toBase64())
                expect(sentFile.cache!.cipherKey.toBase64()).equals(receivedFile.cache!.cipherKey.toBase64())
            }

            before(async function () {
                coreLib = new Core(that.connection, that.config, that.loggerFactory)

                await TestUtil.clearAccounts(that.connection)

                await coreLib.init()

                const accounts = await TestUtil.provideAccounts(coreLib, 2, FileControllerTest.name)
                sender = accounts[0]
                recipient = accounts[1]
            })

            it("should send and receive a File", async function () {
                tempDate = CoreDate.utc().subtract(that.tempDateThreshold)
                const content = CoreBuffer.fromUtf8("Test")
                const sentFile = await TestUtil.uploadFile(sender, content)

                const reference = (await sentFile.toFileReference()).truncate()
                const receivedFile = await recipient.files.loadPeerFileByTruncated(reference)
                tempId1 = sentFile.id

                expectValidFiles(sentFile, receivedFile, tempDate)
            }).timeout(15000)

            it("should get the cached File", async function () {
                const sentFile = await sender.files.getFile(tempId1)
                const receivedFile = await recipient.files.getFile(tempId1)
                expect(sentFile).to.exist
                expect(receivedFile).to.exist
                expectValidFiles(sentFile!, receivedFile!, tempDate)
            })

            it("should send and receive a second File", async function () {
                tempDate = CoreDate.utc().subtract(that.tempDateThreshold)
                const content = CoreBuffer.fromUtf8("Test2")
                const sentFile = await TestUtil.uploadFile(sender, content)

                const reference = (await sentFile.toFileReference()).truncate()
                const receivedFile = await recipient.files.loadPeerFileByTruncated(reference)
                tempId2 = sentFile.id

                expectValidFiles(sentFile, receivedFile, tempDate)
            }).timeout(15000)

            it("should send and receive a third File", async function () {
                tempDate = CoreDate.utc().subtract(that.tempDateThreshold)
                const content = CoreBuffer.fromUtf8("Test3")
                const sentFile = await TestUtil.uploadFile(sender, content)

                const reference = (await sentFile.toFileReference()).truncate()
                const receivedFile = await recipient.files.loadPeerFileByTruncated(reference)

                expectValidFiles(sentFile, receivedFile, tempDate)
            }).timeout(15000)

            it("should get the cached files", async function () {
                const sentFiles = await sender.files.getFiles()
                const receivedFiles = await recipient.files.getFiles()
                expect(sentFiles).to.be.of.length(3)
                expect(receivedFiles).to.be.of.length(3)
                expect(sentFiles[0].id.toString()).equals(tempId1.toString())
                expect(sentFiles[1].id.toString()).equals(tempId2.toString())
                expectValidFiles(sentFiles[0], receivedFiles[0], tempDate)
                expectValidFiles(sentFiles[1], receivedFiles[1], tempDate)
            })

            it("should set and get additional metadata", async function () {
                const creationTime = CoreDate.utc()
                await sender.files.setFileMetadata(tempId1, { myprop: true })

                const file = (await sender.files.getFile(tempId1))!
                expect(file.metadata).to.exist
                expect(file.metadata["myprop"]).equals(true)
                expect(file.metadataModifiedAt).to.exist
                expect(file.metadataModifiedAt!.isSameOrBefore(creationTime.add({ seconds: 1 }))).to.be.true
                expect(file.metadataModifiedAt!.isSameOrAfter(creationTime.subtract({ seconds: 2 }))).to.be.true
            })

            after(async function () {
                await sender.close()
                await recipient.close()
            })
        })
    }
}
