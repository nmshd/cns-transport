import { CryptoEncryption, CryptoSecretKey } from "@nmshd/crypto"
import { CoreId, CoreSerializable, TokenReference } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest } from "../../testHelpers"

export class TokenReferenceTest extends AbstractTest {
    public run(): void {
        describe("TokenReference", function () {
            this.timeout(1000)
            it("should serialize and deserialize correctly (verbose)", async function () {
                const reference = TokenReference.from({
                    key: await CryptoEncryption.generateKey(),
                    id: await CoreId.generate()
                })
                expect(reference).instanceOf(CoreSerializable)
                expect(reference).instanceOf(TokenReference)
                expect(reference.key).instanceOf(CryptoSecretKey)
                expect(reference.id).instanceOf(CoreId)
                const serialized = reference.serialize()
                expect(serialized).to.be.a("string")
                expect(serialized).to.equal(
                    `{"@type":"TokenReference","id":"${reference.id.toString()}","key":${reference.key.serialize(
                        false
                    )}}`
                )
                const deserialized = TokenReference.deserialize(serialized)
                expect(deserialized).instanceOf(CoreSerializable)
                expect(deserialized).instanceOf(TokenReference)
                expect(deserialized.key).instanceOf(CryptoSecretKey)
                expect(deserialized.id).instanceOf(CoreId)
                expect(deserialized.key.toBase64()).to.equal(reference.key.toBase64())
                expect(deserialized.id.toString()).to.equal(reference.id.toString())
            })

            it("should serialize and deserialize correctly (no type information)", async function () {
                const reference = TokenReference.from({
                    key: await CryptoEncryption.generateKey(),
                    id: await CoreId.generate()
                })
                expect(reference).instanceOf(CoreSerializable)
                expect(reference).instanceOf(TokenReference)
                expect(reference.key).instanceOf(CryptoSecretKey)
                expect(reference.id).instanceOf(CoreId)
                const serialized = reference.serialize()
                expect(serialized).to.be.a("string")
                const deserialized = TokenReference.deserialize(serialized)
                expect(deserialized).instanceOf(CoreSerializable)
                expect(deserialized).instanceOf(TokenReference)
                expect(deserialized.key).instanceOf(CryptoSecretKey)
                expect(deserialized.id).instanceOf(CoreId)
                expect(deserialized.key.toBase64()).to.equal(reference.key.toBase64())
                expect(deserialized.id.toString()).to.equal(reference.id.toString())
            })

            it("should serialize and deserialize correctly (from unknown type)", async function () {
                const reference = TokenReference.from({
                    key: await CryptoEncryption.generateKey(),
                    id: await CoreId.generate()
                })
                expect(reference).instanceOf(CoreSerializable)
                expect(reference).instanceOf(TokenReference)
                expect(reference.key).instanceOf(CryptoSecretKey)
                expect(reference.id).instanceOf(CoreId)
                const serialized = reference.serialize()
                expect(serialized).to.be.a("string")
                expect(serialized).to.equal(
                    `{"@type":"TokenReference","id":"${reference.id.toString()}","key":${reference.key.serialize(
                        false
                    )}}`
                )
                const deserialized = CoreSerializable.deserializeUnknown(serialized) as TokenReference
                expect(deserialized).instanceOf(CoreSerializable)
                expect(deserialized).instanceOf(TokenReference)
                expect(deserialized.key).instanceOf(CryptoSecretKey)
                expect(deserialized.id).instanceOf(CoreId)
                expect(deserialized.key.toBase64()).to.equal(reference.key.toBase64())
                expect(deserialized.id.toString()).to.equal(reference.id.toString())
            })

            it("should truncate and read in correctly", async function () {
                const reference = TokenReference.from({
                    key: await CryptoEncryption.generateKey(),
                    id: await CoreId.generate()
                })
                const truncated = reference.truncate()
                expect(truncated.length).lessThan(115).above(80)
                const deserialized = TokenReference.fromTruncated(truncated)
                expect(deserialized).instanceOf(CoreSerializable)
                expect(deserialized).instanceOf(TokenReference)
                expect(deserialized.key).instanceOf(CryptoSecretKey)
                expect(deserialized.id).instanceOf(CoreId)
                expect(deserialized.key.toBase64()).to.equal(reference.key.toBase64())
                expect(deserialized.id.toString()).to.equal(reference.id.toString())
            })
        })
    }
}
