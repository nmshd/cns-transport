import { CryptoEncryption, CryptoSecretKey } from "@nmshd/crypto"
import { CoreId, CoreSerializableAsync, FileReference, TransportIds } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest } from "../../testHelpers"

export class FileReferenceTest extends AbstractTest {
    public run(): void {
        describe("FileReference", function () {
            this.timeout(1000)

            it("should serialize and deserialize correctly (verbose)", async function () {
                const reference = await FileReference.from({
                    key: await CryptoEncryption.generateKey(),
                    id: await TransportIds.fileReference.generate()
                })
                expect(reference).instanceOf(CoreSerializableAsync)
                expect(reference).instanceOf(FileReference)
                expect(reference.key).instanceOf(CryptoSecretKey)
                expect(reference.id).instanceOf(CoreId)
                const serialized = reference.serialize()
                expect(serialized).to.be.a("string")
                expect(serialized).to.equal(
                    `{"@type":"FileReference","id":"${reference.id.toString()}","key":${reference.key.serialize(
                        false
                    )}}`
                )
                const deserialized = await FileReference.deserialize(serialized)
                expect(deserialized).instanceOf(CoreSerializableAsync)
                expect(deserialized).instanceOf(FileReference)
                expect(deserialized.key).instanceOf(CryptoSecretKey)
                expect(deserialized.id).instanceOf(CoreId)
                expect(deserialized.key.toBase64()).to.equal(reference.key.toBase64())
                expect(deserialized.id.toString()).to.equal(reference.id.toString())
            })

            it("should serialize and deserialize correctly (no type information)", async function () {
                const reference = await FileReference.from({
                    key: await CryptoEncryption.generateKey(),
                    id: await TransportIds.fileReference.generate()
                })
                expect(reference).instanceOf(CoreSerializableAsync)
                expect(reference).instanceOf(FileReference)
                expect(reference.key).instanceOf(CryptoSecretKey)
                expect(reference.id).instanceOf(CoreId)
                const serialized = reference.serialize()
                expect(serialized).to.be.a("string")
                const deserialized = await FileReference.deserialize(serialized)
                expect(deserialized).instanceOf(CoreSerializableAsync)
                expect(deserialized).instanceOf(FileReference)
                expect(deserialized.key).instanceOf(CryptoSecretKey)
                expect(deserialized.id).instanceOf(CoreId)
                expect(deserialized.key.toBase64()).to.equal(reference.key.toBase64())
                expect(deserialized.id.toString()).to.equal(reference.id.toString())
            })

            it("should serialize and deserialize correctly (from unknown type)", async function () {
                const reference = await FileReference.from({
                    key: await CryptoEncryption.generateKey(),
                    id: await TransportIds.fileReference.generate()
                })
                expect(reference).instanceOf(CoreSerializableAsync)
                expect(reference).instanceOf(FileReference)
                expect(reference.key).instanceOf(CryptoSecretKey)
                expect(reference.id).instanceOf(CoreId)
                const serialized = reference.serialize()
                expect(serialized).to.be.a("string")
                expect(serialized).to.equal(
                    `{"@type":"FileReference","id":"${reference.id.toString()}","key":${reference.key.serialize(
                        false
                    )}}`
                )
                const deserialized = (await CoreSerializableAsync.deserializeUnknown(serialized)) as FileReference
                expect(deserialized).instanceOf(CoreSerializableAsync)
                expect(deserialized).instanceOf(FileReference)
                expect(deserialized.key).instanceOf(CryptoSecretKey)
                expect(deserialized.id).instanceOf(CoreId)
                expect(deserialized.key.toBase64()).to.equal(reference.key.toBase64())
                expect(deserialized.id.toString()).to.equal(reference.id.toString())
            })

            it("should truncate and read in correctly", async function () {
                const reference = await FileReference.from({
                    key: await CryptoEncryption.generateKey(),
                    id: await TransportIds.fileReference.generate()
                })
                const truncated = reference.truncate()
                expect(truncated.length).lessThan(115).above(80)
                const deserialized = await FileReference.fromTruncated(truncated)
                expect(deserialized).instanceOf(CoreSerializableAsync)
                expect(deserialized).instanceOf(FileReference)
                expect(deserialized.key).instanceOf(CryptoSecretKey)
                expect(deserialized.id).instanceOf(CoreId)
                expect(deserialized.key.toBase64()).to.equal(reference.key.toBase64())
                expect(deserialized.id.toString()).to.equal(reference.id.toString())
            })
        })
    }
}
