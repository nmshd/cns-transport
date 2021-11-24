import { DatabaseType } from "@js-soft/docdb-access-abstractions"
import stringify from "json-stringify-safe"
import { RelationshipChangeType } from ".."
import { BackboneGetRelationshipsChangesResponse } from "../modules/relationships/backbone/BackboneGetRelationshipsChanges"
import { RelationshipChange } from "../modules/relationships/transmission/changes/RelationshipChange"
import { RelationshipChangeStatus } from "../modules/relationships/transmission/changes/RelationshipChangeStatus"
import { CoreError } from "./CoreError"
import { TransportVersion } from "./types/TransportVersion"

class Controller {
    public alreadyInitialized(controllerName: string) {
        return new CoreError(
            "error.transport.controller.alreadyInitialized",
            `The controller ${controllerName} was already initialized.`
        )
    }

    public contentPropertyUndefined(contentProperty: string) {
        return new CoreError(
            "error.transport.controller.contentPropertyUndefined",
            `The property ${contentProperty} is undefined.`
        )
    }
}

class Crypto {
    public invalidVersion(version: TransportVersion) {
        return new CoreError("error.transport.crypto.invalidVersion", `The version ${version} is not supported.`)
    }

    public invalidSecretType() {
        return new CoreError("error.transport.crypto.invalidSecretType", "The secret type is invalid.")
    }
}

class RelationshipTemplates {}

class Relationships {
    public responseCryptoIsMissing() {
        return new CoreError("error.transport.relationships.responseCryptoIsMissing", "The response crypto is missing.")
    }

    public requestContainsWrongTemplateId() {
        return new CoreError(
            "error.transport.relationships.requestContainsWrongTemplateId",
            "The relationship request contains a wrong template id."
        )
    }

    public responseContainsWrongRequestId() {
        return new CoreError(
            "error.transport.relationships.requestContainsWrongRequestId",
            "The relationship response contains a wrong request id."
        )
    }

    public wrongChangeStatus(status: RelationshipChangeStatus) {
        return new CoreError(
            "error.transport.relationships.wrongChangeStatus",
            `The relationship change has the wrong status (${status}) to run this operation`
        )
    }

    public wrongChangeType(type: RelationshipChangeType) {
        return new CoreError(
            "error.transport.relationships.wrongChangeType",
            `The relationship change has the wrong type (${type}) to run this operation`
        )
    }

    public changeResponseMissing(changeId: string) {
        return new CoreError(
            "error.transport.relationships.changeResponseMissing",
            `The response of the relationship change (${changeId}) is missing`
        )
    }

    public emptyOrInvalidContent(change?: RelationshipChange | BackboneGetRelationshipsChangesResponse) {
        return new CoreError(
            "error.transport.relationships.wrongOrEmptyContent",
            `The relationship change ${change?.id} requires a content property or its content property is invalid`
        )
    }
}

class Logging {
    public loggerNotInitialized() {
        return new CoreError(
            "error.transport.logging.loggerNotInitialized",
            "The logger factory is not yet initialized"
        )
    }
}

class CoreDateErrors {
    public noIsoStringMethod() {
        return new CoreError(
            "error.transport.date.noIsoMethod",
            "The provided object doesn't have an iso string method"
        )
    }

    public undefined() {
        return new CoreError(
            "error.transport.date.undefined",
            "The provided object is undefined and cannot be deserialized."
        )
    }
}

class Random {
    public minLessThanZero() {
        return new CoreError("error.transport.util.random.minLessThanZero", "minlength must not be less than zero")
    }

    public inputTooLong() {
        return new CoreError("error.transport.util.random.inputTooLong", "Input exceeds maximum length of 256!")
    }

    public maxTooHigh() {
        return new CoreError("error.transport.util.random.maxTooHigh", "Max must be below 22.")
    }

    public mnBiggerThatMax() {
        return new CoreError("error.code.util.random.minBiggerThanMax", "Max must be larger than min.")
    }

    public rangeTooBig() {
        return new CoreError(
            "error.transport.util.random.rangeTooBig",
            "The range between the numbers is too big, 32 bit is the maximum -> 4294967296"
        )
    }

    public intLength() {
        return new CoreError("error.transport.util.random.length", "Length must be between 1 and 21.")
    }
}

class Util {
    public passwordMinLengthTooShort() {
        return new CoreError(
            "error.transport.passwordMinLengthTooShort",
            "Minimum password length for a strong password should be 8 characters."
        )
    }

    public wrongContentForBuffer() {
        return new CoreError(
            "error.transport.wrongContentForBuffer",
            "The given content cannot be transformed to buffer."
        )
    }

    public tooLongCoreIdPrefix(prefix: string) {
        return new CoreError("error.transport.coreid.tooLongPrefix", `The prefix "${prefix}" is too long`)
    }

    public readonly date = new CoreDateErrors()
    public readonly random = new Random()
    public readonly logging = new Logging()
    public readonly crypto = new Crypto()
}

class Device {
    public deviceNotSet() {
        return new CoreError("error.transport.device.deviceNotSet", "The device must be set")
    }

    public notOnboardedYet() {
        return new CoreError(
            "error.transport.devices.notOnboardedYet",
            "The device is not onboarded yet and has no public key."
        )
    }

    public alreadyOnboarded() {
        return new CoreError("error.transport.devices.alreadyOnboarded", "The device has already been onboarded.")
    }
}

class Messages {
    public plaintextMismatch(ownAddress: string) {
        return new CoreError(
            "error.transport.messages.plaintextMismatch",
            `The own address ${ownAddress} was not named as a recipient within the signed MessagePlaintext. A replay attack might be the cause of this.`
        )
    }

    public signatureListMismatch(address: string) {
        return new CoreError(
            "error.transport.messages.signatureListMismatch",
            `The signature list didn't contain an entry for address ${address}.`
        )
    }

    public signatureNotValid() {
        return new CoreError(
            "error.transport.messages.signatureNotValid",
            "The digital signature on this message for peer key is invalid. An impersonination attack might be the cause of this."
        )
    }
    public noRecipientsSet() {
        return new CoreError("error.transport.messages.noRecipientsSet", "No recipients set.")
    }

    public ownAddressNotInList(messageId: string) {
        return new CoreError(
            "error.transport.messages.ownAddressNotInList",
            `The recipients list of message ${messageId} didn't contain an entry for the own address. This message should not have been received.`
        )
    }

    public noMatchingRelationship(senderAddress: string) {
        return new CoreError(
            "error.transport.messages.noMatchingRelationship",
            `A relationship with sender ${senderAddress} does not exist. This might be spam.`
        )
    }

    public noSecretKeyForOwnMessage(envelopeId: string) {
        return new CoreError(
            `No secret key found for own message ${envelopeId}`,
            "The message could not be decrypted, because no secret key was found for it."
        )
    }
}

class Identity {
    public realmLength() {
        return new CoreError("error.transport.identity.realmLength", "Realm must be of length 3.")
    }

    public identityNotSet() {
        return new CoreError("error.transport.identity.identityNotSet", "The identity must be set")
    }

    public noAddressReceived() {
        return new CoreError(
            "error.transport.identity.noAddressReceived",
            "The backbone did not create an address for the created device."
        )
    }

    public addressMismatch() {
        return new CoreError(
            "error.transport.identity.addressMismatch",
            "The backbone address does not match the local address."
        )
    }
}

class Secrets {
    public lengthMismatch() {
        return new CoreError(
            "error.transport.secrets.lengthMismatch",
            "Length mismatch between old number of secrets and new ones."
        )
    }

    public wrongBaseKeyType(baseKeyType: string) {
        return new CoreError(
            "error.transport.secrets.wrongBaseKeyType",
            `Given BaseKey type "${baseKeyType}" is not supported!`
        )
    }

    public wrongSecretType(secretId?: string) {
        return new CoreError("error.transport.secrets.wrongBaseKeyType", "Given Secret type is not supported!", {
            secretId: secretId
        })
    }

    public secretNotFound(type: string) {
        return new CoreError("error.transport.secrets.secretNotFound", `secret "${type}" not found`)
    }
}

class Challenges {
    public challengeTypeRequiredRelationship() {
        return new CoreError(
            "error.transport.challenges.challengeTypeRequiredRelationship",
            "The challenge type ist relationship but the relationship is undefined"
        )
    }
}

class Datawallet {
    public encryptedPayloadIsNoCipher() {
        return new CoreError(
            "error.transport.datawallet.encryptedPayloadIsNoCipher",
            "The given encrypted payload is no cipher."
        )
    }

    public unsupportedModification(type: "unsupportedCacheChangedModificationCollection", data: any) {
        const errorCode = "error.transport.datawallet.unsupportedModification"
        const formattedData = data ? stringify(data) : ""

        switch (type) {
            case "unsupportedCacheChangedModificationCollection":
                return new CoreError(
                    errorCode,
                    `The following collections were received in CacheChanged datawallet modifications but are not supported by the current version of this library: ${formattedData}.`
                )

            default:
                throw new Error(`Given type '${type}' is not supported.`)
        }
    }

    public insufficientSupportedDatawalletVersion(supportedVersion: number, requiredVersion: number) {
        return new CoreError(
            "error.transport.datawallet.insufficientSupportedDatawalletVersion",
            `The SupportedDatawalletVersion '${supportedVersion}' is too low. A minimum version of '${requiredVersion}' is required.`
        )
    }

    public currentBiggerThanTarget(current: number, target: number) {
        return new CoreError(
            "error.transport.datawallet.currentBiggerThanTarget",
            `The current datawallet version '${current}' is bigger than the target version '${target}'.`
        )
    }

    public noMigrationAvailable(version: number) {
        return new CoreError(
            "error.core.datawallet.noMigrationAvailable",
            `There is no migration available for the datawallet version '${version}'.`
        )
    }
}

class Files {
    public plaintextHashMismatch() {
        return new CoreError(
            "error.transport.files.plaintextHashMismatch",
            "The actual hash of the plaintext does not match the given plaintextHash. Something went wrong while encrypting/decrypting the file."
        )
    }

    public cipherMismatch() {
        return new CoreError(
            "error.transport.files.cipherMismatch",
            "The actual hash of the cipher does not match the given cipherHash. Something went wrong while storing/transmitting the file."
        )
    }

    public invalidMetadata(id: string) {
        return new CoreError("error.transport.files.invalidMetadata", `The metadata of file id "${id}" is invalid.`)
    }

    public invalidTruncatedReference() {
        return new CoreError("error.transport.files.invalidTruncatedReference", "invalid truncated reference")
    }

    public fileContentUndefined() {
        return new CoreError("error.transport.files.fileContentUndefined", "The given file content is undefined.")
    }

    public maxFileSizeExceeded(fileSize: number, platformMaxFileSize: number) {
        return new CoreError(
            "error.transport.files.maxFileSizeExceeded",
            `The given file content size (${fileSize}) exceeds the max file size the backbone accepts (${platformMaxFileSize}).`
        )
    }
}

class Tokens {
    public invalidTruncatedReference() {
        return new CoreError("error.transport.tokens.invalidTruncatedReference", "invalid truncated reference")
    }

    public invalidTokenContent(id: string) {
        return new CoreError(
            "error.transport.tokens.invalidTokenContent",
            `The content of token ${id} is not of type TokenContent`
        )
    }
}

class General {
    public invalidDatawalletVersion() {
        return new CoreError(
            "error.transport.general.invalidDatawalletVersion",
            "The given identity version is invalid. The value must be 0 or higher."
        )
    }

    public baseUrlNotSet() {
        return new CoreError("error.transport.general.baseUrlNotSet", "The baseUrl was not set.")
    }

    public platformClientIdNotSet() {
        return new CoreError("error.transport.general.platformClientNotSet", "The platform clientSecret was not set.")
    }

    public platformClientSecretNotSet() {
        return new CoreError("error.transport.general.platformClientNotSet", "The platform clientId was not set.")
    }

    public platformClientInvalid() {
        return new CoreError(
            "error.transport.general.platformClientInvalid",
            "The combination of platform clientId and clientSecret is invalid."
        )
    }

    public cacheEmpty(entityName: string | Function, id: string) {
        return new CoreError(
            "error.transport.general.cacheEmpty",
            `The cache of ${entityName instanceof Function ? entityName.name : entityName} with id "${id}" is empty.`,
            id
        )
    }

    public incompatibleBackbone() {
        return new CoreError("error.transport.incompatibleBackbone", "The backbone sent an invalid payload.")
    }

    public signatureNotValid(type?: string) {
        return new CoreError(
            "error.transport.signatureNotValid",
            `The ${type ? `${type}-` : ""}signature is not valid.`
        )
    }

    public recordNotFound(entityName: string | Function, entityId: string) {
        return new CoreError(
            "error.transport.recordNotFound",
            `'${entityName instanceof Function ? entityName.name : entityName}' not found.`,
            entityId
        )
    }

    public notImplemented() {
        return new CoreError("error.transport.notImplemented", "The method is not yet implemented.")
    }

    public typeNotInReflection(type: string) {
        return new CoreError(
            "error.transport.typeNotInReflectionClass",
            `The type ${type} was not in the reflection classes. You might have to install a module first.`
        )
    }

    public datawalletNotAvailable() {
        return new CoreError(
            "error.transport.datawalletNotAvailable",
            "The datawallet is not available (yet?) and was requested."
        )
    }

    public unsupportedDatabaseTypeForQuery(databaseType: DatabaseType, query: Function) {
        return new CoreError(
            "error.transport.unsupportedDatabaseTypeForQuery",
            `The query '${query.name}' does not (yet?) support the database type '${databaseType}'.`
        )
    }

    public notAllowedCombinationOfDeviceSharedSecretAndAccount() {
        return new CoreError(
            "error.transport.account",
            "The combination of deviceSharedSecret, existing identity or device is not allowed."
        )
    }
}

export class TransportErrors {
    public static readonly controller = new Controller()
    public static readonly relationships = new Relationships()
    public static readonly util = new Util()
    public static readonly general = new General()
    public static readonly identity = new Identity()
    public static readonly messages = new Messages()
    public static readonly secrets = new Secrets()
    public static readonly device = new Device()
    public static readonly files = new Files()
    public static readonly challenges = new Challenges()
    public static readonly datawallet = new Datawallet()
    public static readonly tokens = new Tokens()
    public static readonly relationshipTemplates = new RelationshipTemplates()
}
