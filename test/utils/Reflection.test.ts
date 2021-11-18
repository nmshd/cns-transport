import { Serializable } from "@js-soft/ts-serval"
import {
    CoreBuffer,
    CryptoCipher,
    CryptoExchangeKeypair,
    CryptoExchangePrivateKey,
    CryptoExchangeSecrets,
    CryptoPrivateStateReceive,
    CryptoPrivateStateTransmit,
    CryptoPublicState,
    CryptoRelationshipPublicRequest,
    CryptoRelationshipRequestSecrets,
    CryptoRelationshipSecrets,
    CryptoSecretKey,
    CryptoSignature,
    CryptoSignatureKeypair,
    CryptoSignaturePrivateKey,
    CryptoSignaturePublicKey
} from "@nmshd/crypto"
import {
    CachedRelationshipTemplate,
    Device,
    File,
    FileMetadata,
    FileReference,
    Identity,
    Message,
    MessageEnvelope,
    MessageEnvelopeRecipient,
    MessagePlain,
    MessageSigned,
    Relationship,
    RelationshipCreationChangeRequestCipher,
    RelationshipCreationChangeRequestContent,
    RelationshipCreationChangeRequestSigned,
    RelationshipCreationChangeResponseCipher,
    RelationshipCreationChangeResponseContent,
    RelationshipCreationChangeResponseSigned,
    RelationshipTemplate,
    RelationshipTemplateContent,
    RelationshipTemplatePublicKey,
    RelationshipTemplateSigned,
    Token,
    TokenContentRelationshipTemplate
} from "@nmshd/transport"
import { expect } from "chai"
import { AbstractUnitTest } from "../testHelpers/AbstractUnitTest"

export class ReflectionTest extends AbstractUnitTest {
    public static cryptoClassNames: string[] = [
        CryptoCipher.name,
        CryptoSecretKey.name,
        CryptoExchangeKeypair.name,
        CryptoExchangePrivateKey.name,
        CryptoExchangePrivateKey.name,
        CryptoExchangeSecrets.name,
        CryptoRelationshipPublicRequest.name,
        CryptoRelationshipPublicRequest.name,
        CryptoRelationshipRequestSecrets.name,
        CryptoRelationshipSecrets.name,
        CryptoSignatureKeypair.name,
        CryptoSignaturePrivateKey.name,
        CryptoSignaturePublicKey.name,
        CryptoSignature.name,
        CryptoPrivateStateReceive.name,
        CryptoPrivateStateTransmit.name,
        CryptoPublicState.name,
        CoreBuffer.name,
        "CryptoSerializableAsync"
    ]

    public static transportClassNames: string[] = [
        Device.name,
        Identity.name,
        FileMetadata.name,
        FileReference.name,
        File.name,
        MessageEnvelope.name,
        MessageEnvelopeRecipient.name,
        MessagePlain.name,
        "MessageSignature",
        MessageSigned.name,
        Message.name,
        CachedRelationshipTemplate.name,
        Relationship.name,
        RelationshipTemplate.name,
        RelationshipCreationChangeRequestCipher.name,
        RelationshipCreationChangeRequestContent.name,
        RelationshipCreationChangeRequestSigned.name,
        RelationshipCreationChangeResponseCipher.name,
        RelationshipCreationChangeResponseContent.name,
        RelationshipCreationChangeResponseSigned.name,
        RelationshipTemplateContent.name,
        RelationshipTemplatePublicKey.name,
        RelationshipTemplateSigned.name,
        Token.name,
        TokenContentRelationshipTemplate.name
    ]

    public run(): void {
        const that = this
        describe("ReflectionTest", function () {
            it("should find all Crypto classes", function () {
                const reflectionKeys = Reflect.getMetadataKeys(Serializable, "types")
                const notFoundClasses: string[] = []
                for (const className of ReflectionTest.cryptoClassNames) {
                    if (!reflectionKeys.includes(className)) {
                        notFoundClasses.push(className)
                        that.logger.error(`Class ${className} not registered`)
                    }
                }
                expect(notFoundClasses).to.have.lengthOf(
                    0,
                    `Required classes ${notFoundClasses} are not registered within Serializable reflection classes.`
                )
            })

            it("should find all TransportLib classes", function () {
                const reflectionKeys = Reflect.getMetadataKeys(Serializable, "types")
                const notFoundClasses: string[] = []

                for (const className of ReflectionTest.transportClassNames) {
                    if (!reflectionKeys.includes(className)) {
                        notFoundClasses.push(className)
                        that.logger.error(`Class ${className} not registered`)
                    }
                }
                expect(notFoundClasses).to.have.lengthOf(
                    0,
                    `Required classes ${notFoundClasses} are not registered within Serializable reflection classes.`
                )
            })
        })
    }
}
