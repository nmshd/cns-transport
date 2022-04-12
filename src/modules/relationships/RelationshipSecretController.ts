import { Serializable } from "@js-soft/ts-serval"
import {
    CoreBuffer,
    CryptoCipher,
    CryptoExchangeKeypair,
    CryptoRelationshipPublicRequest,
    CryptoRelationshipPublicResponse,
    CryptoRelationshipRequestSecrets,
    CryptoRelationshipSecrets,
    CryptoSecretKey,
    CryptoSignature,
    CryptoSignaturePublicKey
} from "@nmshd/crypto"
import { ControllerName, CoreCrypto, CoreId } from "../../core"
import { CoreUtil } from "../../core/CoreUtil"
import { TransportErrors } from "../../core/TransportErrors"
import { TransportIds } from "../../core/TransportIds"
import { AccountController } from "../accounts/AccountController"
import { Identity } from "../accounts/data/Identity"
import { CachedRelationshipTemplate } from "../relationshipTemplates/local/CachedRelationshipTemplate"
import { RelationshipTemplatePublicKey } from "../relationshipTemplates/transmission/RelationshipTemplatePublicKey"
import { SecretContainerCipher } from "../secrets/data/SecretContainerCipher"
import { SecretController } from "../secrets/SecretController"

export class RelationshipSecretController extends SecretController {
    private readonly cache: Map<CoreId, CryptoRelationshipRequestSecrets | CryptoRelationshipSecrets> = new Map<
        CoreId,
        CryptoRelationshipRequestSecrets | CryptoRelationshipSecrets
    >()

    public constructor(parent: AccountController) {
        super(parent, ControllerName.RelationshipSecret)
    }

    private async getSecret(
        relationshipSecretId: CoreId
    ): Promise<CryptoRelationshipRequestSecrets | CryptoRelationshipSecrets> {
        const secretIdAsString: string = relationshipSecretId.toString()
        const cachedSecrets = this.cache.get(relationshipSecretId)
        if (cachedSecrets) {
            return cachedSecrets
        }

        const secretContainer = await this.loadActiveSecretByName(secretIdAsString)
        if (!secretContainer) {
            throw TransportErrors.general
                .recordNotFound("CryptoRelationshipRequestSecrets | CryptoRelationshipSecrets", secretIdAsString)
                .logWith(this._log)
        }

        if (
            !(secretContainer.secret instanceof CryptoRelationshipRequestSecrets) &&
            !(secretContainer.secret instanceof CryptoRelationshipSecrets)
        ) {
            throw TransportErrors.secrets.wrongSecretType(secretIdAsString).logWith(this._log)
        }
        const secret = secretContainer.secret
        this.cache.set(relationshipSecretId, secret)
        return secret
    }

    public async createRequestorSecrets(
        template: CachedRelationshipTemplate,
        relationshipSecretId: CoreId
    ): Promise<CryptoRelationshipPublicRequest> {
        const secrets = await CryptoRelationshipRequestSecrets.fromPeer(
            template.templateKey,
            template.identity.publicKey
        )
        await this.storeSecret(secrets, relationshipSecretId.toString(), "")

        const publicRequest = secrets.toPublicRequest()
        return publicRequest
    }

    public async createTemplatorSecrets(
        relationshipSecretId: CoreId,
        template: CachedRelationshipTemplate,
        publicRequestCrypto: CryptoRelationshipPublicRequest
    ): Promise<SecretContainerCipher> {
        const templateKeyId = template.templateKey.id.toString()
        const exchangeKeypairContainer = await this.loadActiveSecretByName(templateKeyId)

        if (!exchangeKeypairContainer) {
            throw TransportErrors.general.recordNotFound(CryptoExchangeKeypair, templateKeyId).logWith(this._log)
        }

        if (!(exchangeKeypairContainer.secret instanceof CryptoExchangeKeypair)) {
            throw TransportErrors.secrets.wrongSecretType(templateKeyId).logWith(this._log)
        }

        const exchangeKeypair = exchangeKeypairContainer.secret

        const secrets = await CryptoRelationshipSecrets.fromRelationshipRequest(publicRequestCrypto, exchangeKeypair)

        const secretContainer = await this.storeSecret(secrets, relationshipSecretId.toString())
        return secretContainer
    }

    public async getPublicResponse(relationshipSecretId: CoreId): Promise<CryptoRelationshipPublicResponse> {
        const secret = await this.loadActiveSecretByName(relationshipSecretId.toString())
        if (!secret) {
            throw TransportErrors.general
                .recordNotFound(CryptoRelationshipSecrets, relationshipSecretId.toString())
                .logWith(this._log)
        }

        if (!(secret.secret instanceof CryptoRelationshipSecrets)) {
            throw TransportErrors.secrets.wrongSecretType(secret.id.toString()).logWith(this._log)
        }
        const publicResponse = secret.secret.toPublicResponse()
        return publicResponse
    }

    public async convertSecrets(
        relationshipSecretId: CoreId,
        response: CryptoRelationshipPublicResponse
    ): Promise<SecretContainerCipher> {
        const request = await this.getSecret(relationshipSecretId)
        if (request instanceof CryptoRelationshipSecrets) {
            throw TransportErrors.secrets.wrongSecretType().logWith(this._log)
        }

        const secrets = await CryptoRelationshipSecrets.fromRelationshipResponse(response, request)

        const container = await this.succeedSecretWithName(secrets, relationshipSecretId.toString())

        this.cache.set(relationshipSecretId, secrets)
        return container
    }

    public async deleteSecretForRequest(peerIdentity: Identity): Promise<boolean> {
        const secret = await this.loadActiveSecretByName(`request_to_${peerIdentity.address}`)
        if (!secret) {
            return false
        }
        return await this.deleteSecretById(secret.id)
    }

    public async decryptTemplate(cipher: CryptoCipher, secretKey: CryptoSecretKey): Promise<CoreBuffer> {
        const decrypted: CoreBuffer = await CoreCrypto.decrypt(cipher, secretKey)
        return decrypted
    }

    public async verifyTemplate(
        buffer: CoreBuffer,
        signature: CryptoSignature,
        templatorDeviceKey: CryptoSignaturePublicKey
    ): Promise<boolean> {
        return await CoreCrypto.verify(buffer, signature, templatorDeviceKey)
    }

    public async encryptRequest(
        relationshipSecretId: CoreId,
        content: Serializable | string | CoreBuffer
    ): Promise<CryptoCipher> {
        const buffer = CoreUtil.toBuffer(content)
        const secrets = await this.getSecret(relationshipSecretId)

        if (!(secrets instanceof CryptoRelationshipRequestSecrets)) {
            throw TransportErrors.secrets.wrongSecretType(secrets.id).logWith(this._log)
        }

        return await secrets.encryptRequest(buffer)
    }

    public async encrypt(relationshipSecretId: CoreId, content: Serializable | string): Promise<CryptoCipher> {
        const buffer = CoreUtil.toBuffer(content)
        const secrets = await this.getSecret(relationshipSecretId)

        if (!(secrets instanceof CryptoRelationshipSecrets)) {
            throw TransportErrors.secrets.wrongSecretType(secrets.id).logWith(this._log)
        }

        return await secrets.encrypt(buffer)
    }

    public async decryptRequest(relationshipSecretId: CoreId, cipher: CryptoCipher): Promise<CoreBuffer> {
        const secrets = await this.getSecret(relationshipSecretId)

        if (!(secrets instanceof CryptoRelationshipRequestSecrets) && !(secrets instanceof CryptoRelationshipSecrets)) {
            throw TransportErrors.secrets.wrongSecretType(relationshipSecretId.toString()).logWith(this._log)
        }

        return await secrets.decryptRequest(cipher)
    }

    public async createTemplateKey(): Promise<RelationshipTemplatePublicKey> {
        const templateKeyId = await TransportIds.relationshipTemplateKey.generate()
        const key = await this.createExchangeKey(`${templateKeyId.toString()}`)
        const publicKey = key[0]
        return RelationshipTemplatePublicKey.from({
            id: templateKeyId,
            algorithm: publicKey.algorithm,
            publicKey: publicKey.publicKey
        })
    }

    public async decryptPeer(
        relationshipSecretId: CoreId,
        cipher: CryptoCipher,
        omitCounterCheck = false
    ): Promise<CoreBuffer> {
        const secrets = await this.getSecret(relationshipSecretId)

        if (!(secrets instanceof CryptoRelationshipSecrets)) {
            throw TransportErrors.secrets.wrongSecretType(secrets.id).logWith(this._log)
        }

        return await secrets.decryptPeer(cipher, omitCounterCheck)
    }

    public async hasCryptoRelationshipSecrets(relationshipSecretId: CoreId): Promise<boolean> {
        const secrets = await this.getSecret(relationshipSecretId)
        return secrets instanceof CryptoRelationshipSecrets
    }

    public async decryptOwn(relationshipSecretId: CoreId, cipher: CryptoCipher): Promise<CoreBuffer> {
        const secrets = await this.getSecret(relationshipSecretId)

        if (!(secrets instanceof CryptoRelationshipSecrets)) {
            throw TransportErrors.secrets.wrongSecretType(secrets.id).logWith(this._log)
        }

        return await secrets.decryptOwn(cipher)
    }

    public async sign(
        relationshipSecretId: CoreId,
        content: Serializable | string | CoreBuffer
    ): Promise<CryptoSignature> {
        const bufferToSign = CoreUtil.toBuffer(content)
        const secrets = await this.getSecret(relationshipSecretId)
        return await secrets.sign(bufferToSign)
    }

    public async verifyOwn(
        relationshipSecretId: CoreId,
        content: Serializable | string | CoreBuffer,
        signature: CryptoSignature
    ): Promise<boolean> {
        const bufferToVerify = CoreUtil.toBuffer(content)
        const secrets = await this.getSecret(relationshipSecretId)
        return await secrets.verifyOwn(bufferToVerify, signature)
    }

    public async verifyPeer(
        relationshipSecretId: CoreId,
        content: Serializable | string | CoreBuffer,
        signature: CryptoSignature
    ): Promise<boolean> {
        const bufferToVerify = CoreUtil.toBuffer(content)

        const secrets = await this.getSecret(relationshipSecretId)
        if (secrets instanceof CryptoRelationshipRequestSecrets) {
            throw TransportErrors.secrets.wrongSecretType(secrets.id).logWith(this._log)
        }

        const valid = await secrets.verifyPeer(bufferToVerify, signature)
        return valid
    }
}
