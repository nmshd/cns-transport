import { Serializable } from "@js-soft/ts-serval"
import { CryptoEncryption, CryptoSecretKey } from "@nmshd/crypto"
import { BackboneIds, CoreId, RelationshipTemplateReference } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest } from "../../testHelpers"

export class RelationshipTemplateReferenceTest extends AbstractTest {
    public run(): void {
        describe("RelationshipTemplateReference", function () {
            this.timeout(1000)
            it("should serialize and deserialize correctly (verbose)", async function () {
                const reference = RelationshipTemplateReference.from({
                    key: await CryptoEncryption.generateKey(),
                    id: await BackboneIds.relationshipTemplate.generateUnsafe()
                })
                expect(reference).instanceOf(Serializable)
                expect(reference).instanceOf(RelationshipTemplateReference)
                expect(reference.key).instanceOf(CryptoSecretKey)
                expect(reference.id).instanceOf(CoreId)
                const serialized = reference.serialize()
                expect(serialized).to.be.a("string")
                expect(serialized).to.equal(
                    `{"@type":"RelationshipTemplateReference","id":"${reference.id.toString()}","key":${reference.key.serialize(
                        false
                    )}}`
                )
                const deserialized = RelationshipTemplateReference.deserialize(serialized)
                expect(deserialized).instanceOf(Serializable)
                expect(deserialized).instanceOf(RelationshipTemplateReference)
                expect(deserialized.key).instanceOf(CryptoSecretKey)
                expect(deserialized.id).instanceOf(CoreId)
                expect(deserialized.key.toBase64()).to.equal(reference.key.toBase64())
                expect(deserialized.id.toString()).to.equal(reference.id.toString())
            })

            it("should serialize and deserialize correctly (no type information)", async function () {
                const reference = RelationshipTemplateReference.from({
                    key: await CryptoEncryption.generateKey(),
                    id: await BackboneIds.relationshipTemplate.generateUnsafe()
                })
                expect(reference).instanceOf(Serializable)
                expect(reference).instanceOf(RelationshipTemplateReference)
                expect(reference.key).instanceOf(CryptoSecretKey)
                expect(reference.id).instanceOf(CoreId)
                const serialized = reference.serialize()
                expect(serialized).to.be.a("string")
                const deserialized = RelationshipTemplateReference.deserialize(serialized)
                expect(deserialized).instanceOf(Serializable)
                expect(deserialized).instanceOf(RelationshipTemplateReference)
                expect(deserialized.key).instanceOf(CryptoSecretKey)
                expect(deserialized.id).instanceOf(CoreId)
                expect(deserialized.key.toBase64()).to.equal(reference.key.toBase64())
                expect(deserialized.id.toString()).to.equal(reference.id.toString())
            })

            it("should serialize and deserialize correctly (from unknown type)", async function () {
                const reference = RelationshipTemplateReference.from({
                    key: await CryptoEncryption.generateKey(),
                    id: await BackboneIds.relationshipTemplate.generateUnsafe()
                })
                expect(reference).instanceOf(Serializable)
                expect(reference).instanceOf(RelationshipTemplateReference)
                expect(reference.key).instanceOf(CryptoSecretKey)
                expect(reference.id).instanceOf(CoreId)
                const serialized = reference.serialize()
                expect(serialized).to.be.a("string")
                expect(serialized).to.equal(
                    `{"@type":"RelationshipTemplateReference","id":"${reference.id.toString()}","key":${reference.key.serialize(
                        false
                    )}}`
                )
                const deserialized = Serializable.deserializeUnknown(serialized) as RelationshipTemplateReference
                expect(deserialized).instanceOf(Serializable)
                expect(deserialized).instanceOf(RelationshipTemplateReference)
                expect(deserialized.key).instanceOf(CryptoSecretKey)
                expect(deserialized.id).instanceOf(CoreId)
                expect(deserialized.key.toBase64()).to.equal(reference.key.toBase64())
                expect(deserialized.id.toString()).to.equal(reference.id.toString())
            })

            it("should truncate and read in correctly", async function () {
                const reference = RelationshipTemplateReference.from({
                    key: await CryptoEncryption.generateKey(),
                    id: await BackboneIds.relationshipTemplate.generateUnsafe()
                })
                const truncated = reference.truncate()
                expect(truncated.length).lessThan(115).above(80)
                const deserialized = RelationshipTemplateReference.fromTruncated(truncated)
                expect(deserialized).instanceOf(Serializable)
                expect(deserialized).instanceOf(RelationshipTemplateReference)
                expect(deserialized.key).instanceOf(CryptoSecretKey)
                expect(deserialized.id).instanceOf(CoreId)
                expect(deserialized.key.toBase64()).to.equal(reference.key.toBase64())
                expect(deserialized.id.toString()).to.equal(reference.id.toString())
            })
        })
    }
}
