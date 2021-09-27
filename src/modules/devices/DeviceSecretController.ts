import { IDatabaseMap } from "@js-soft/docdb-access-abstractions"
import { SerializableAsync } from "@js-soft/ts-serval"
import {
    CoreBuffer,
    CryptoCipher,
    CryptoExchangeKeypair,
    CryptoExchangePrivateKey,
    CryptoSecretKey,
    CryptoSignatureKeypair,
    CryptoSignaturePrivateKey,
    ICoreBuffer,
    ICryptoCipher
} from "@nmshd/crypto"
import { CoreCrypto, CoreDate, CoreErrors } from "../../core"
import { ControllerName, CoreController } from "../../core/CoreController"
import { CoreIds } from "../../core/CoreIds"
import { AccountController } from "../accounts/AccountController"
import { ISecretContainerCipher, SecretContainerCipher } from "../secrets/data/SecretContainerCipher"
import { SecretContainerPlain } from "../secrets/data/SecretContainerPlain"
import { DatawalletModification } from "../sync/local/DatawalletModification"
import { Device } from "./local/Device"
import { DeviceSecretCredentials } from "./local/DeviceSecretCredentials"
import { DeviceSharedSecret } from "./transmission/DeviceSharedSecret"

export enum DeviceSecretType {
    IdentitySynchronizationMaster = "identity_synchronization_master",
    IdentitySignature = "identity_signature",
    SharedSecretBaseKey = "shared_basekey",
    DeviceSecretBaseKey = "secret_basekey",
    DeviceSignature = "device_signature",
    DeviceCredentials = "device_credentials"
}

/**
 * The SecretController which acts as a single touchpoint to access any secret within the runtime.
 * Each access can be audited.
 *
 */
export class DeviceSecretController extends CoreController {
    private secrets: IDatabaseMap

    private static readonly secretContext: string = "DEVICE01"

    private readonly baseKey?: CryptoSecretKey

    public constructor(parent: AccountController, baseKey: CryptoSecretKey) {
        super(ControllerName.DeviceSecret, parent)
        this.baseKey = baseKey
    }

    public async init(): Promise<DeviceSecretController> {
        await super.init()

        this.secrets = await this.db.getMap("DeviceSecrets")

        return this
    }

    public async storeSecret(
        secret:
            | DeviceSecretCredentials
            | CryptoExchangeKeypair
            | CryptoExchangePrivateKey
            | CryptoSignatureKeypair
            | CryptoSignaturePrivateKey
            | CryptoSecretKey,
        name: string
    ): Promise<SecretContainerCipher> {
        const plainString: string = secret.serialize()
        const plainBuffer: CoreBuffer = CoreBuffer.fromUtf8(plainString)

        const encryptionKey: CryptoSecretKey = await CoreCrypto.deriveKeyFromBase(
            this.getBaseKey(),
            1,
            DeviceSecretController.secretContext
        )

        const cipher: ICryptoCipher = await CoreCrypto.encrypt(plainBuffer, encryptionKey)
        const date: CoreDate = CoreDate.utc()
        const secretContainerInterface: ISecretContainerCipher = {
            cipher: cipher,
            createdAt: date,
            name: name,
            id: await CoreIds.secret.generate(),
            validFrom: date,
            active: true
        }
        const container: SecretContainerCipher = await SecretContainerCipher.from(secretContainerInterface)

        this.log.trace(
            `Created device secret id:${container.id} name:${container.name} on ${container.createdAt.toISOString()}.`
        )

        await this.secrets.set(name, container.toJSON())

        return container
    }

    public async loadSecret(name: string): Promise<SecretContainerPlain | undefined> {
        const secretObj = await this.secrets.get(name)
        if (!secretObj) return

        const baseKey: CryptoSecretKey = this.getBaseKey()
        const secret: SecretContainerCipher = await SecretContainerCipher.from(secretObj)
        const decryptionKey: CryptoSecretKey = await CoreCrypto.deriveKeyFromBase(
            baseKey,
            1,
            DeviceSecretController.secretContext
        )
        const plainBuffer: ICoreBuffer = await CoreCrypto.decrypt(secret.cipher, decryptionKey)
        const plainString: string = plainBuffer.toUtf8()

        const decryptedSecret = await SerializableAsync.deserializeUnknown(plainString)

        const plainSecret: SecretContainerPlain = await SecretContainerPlain.from({
            id: secret.id,
            createdAt: secret.createdAt,
            name: secret.name,
            secret: decryptedSecret,
            validFrom: secret.validFrom,
            validTo: secret.validTo,
            active: secret.active
        })
        this.log.trace(
            `Accessed device secret id:${plainSecret.id} name:${plainSecret.name} on ${CoreDate.utc().toISOString()}.`
        )
        return plainSecret
    }

    public async deleteSecret(name: string): Promise<boolean> {
        const secretObj = await this.secrets.get(name)
        if (!secretObj) {
            return false
        }
        await this.secrets.delete(name)
        this.log.trace(
            `Deleted device secret id:${secretObj.id} name:${secretObj.name} on ${CoreDate.utc().toISOString()}.`
        )
        return true
    }

    public async createDeviceSharedSecret(
        device: Device,
        deviceIndex: number,
        includeIdentityPrivateKey = false
    ): Promise<DeviceSharedSecret> {
        const synchronizationKey = await this.loadSecret(DeviceSecretType.IdentitySynchronizationMaster)
        if (!synchronizationKey || !(synchronizationKey.secret instanceof CryptoSecretKey)) {
            throw CoreErrors.secrets.secretNotFound("SynchronizationKey").logWith(this._log)
        }

        const baseKey = await this.loadSecret(DeviceSecretType.SharedSecretBaseKey)
        if (!baseKey || !(baseKey.secret instanceof CryptoSecretKey)) {
            throw CoreErrors.secrets.secretNotFound("baseKey").logWith(this._log)
        }

        let identityPrivateKey
        if (includeIdentityPrivateKey) {
            identityPrivateKey = await this.loadSecret(DeviceSecretType.IdentitySignature)
            if (!identityPrivateKey || !(identityPrivateKey.secret instanceof CryptoSignaturePrivateKey)) {
                throw CoreErrors.secrets.secretNotFound("IdentityKey").logWith(this._log)
            }
        }

        const deviceSharedSecret = await DeviceSharedSecret.from({
            id: device.id,
            createdAt: device.createdAt,
            createdByDevice: device.createdByDevice,
            deviceIndex: deviceIndex,
            secretBaseKey: baseKey.secret,
            name: device.name,
            description: device.description,
            synchronizationKey: synchronizationKey.secret,
            identityPrivateKey: identityPrivateKey?.secret as CryptoSignaturePrivateKey,
            username: device.username,
            password: device.initialPassword!,
            identity: this.parent.identity.identity
        })

        // TODO: JSSNMSHDD-2474 (Rollback on error)
        return deviceSharedSecret
    }

    public async encryptDatawalletModificationPayload(
        event: DatawalletModification,
        index: number
    ): Promise<string | undefined> {
        if (!event.payload) {
            return undefined
        }

        const serializedEvent = CoreBuffer.fromUtf8(JSON.stringify(event.payload))
        const privSync = await this.loadSecret(DeviceSecretType.IdentitySynchronizationMaster)
        if (!privSync || !(privSync.secret instanceof CryptoSecretKey)) {
            throw CoreErrors.secrets.secretNotFound(DeviceSecretType.IdentitySynchronizationMaster).logWith(this._log)
        }

        const encryptionKey = await CoreCrypto.deriveKeyFromBase(privSync.secret, index, "DataSync")

        const cipher = await CoreCrypto.encrypt(serializedEvent, encryptionKey)
        privSync.secret.clear()
        return cipher.toBase64()
    }

    public async decryptDatawalletModificationPayload(
        payloadCipherBase64: string | null,
        index: number
    ): Promise<object | undefined> {
        if (!payloadCipherBase64) {
            return undefined
        }

        const payloadCipher = await CryptoCipher.fromBase64(payloadCipherBase64)

        const privSync = await this.loadSecret(DeviceSecretType.IdentitySynchronizationMaster)
        if (!privSync || !(privSync.secret instanceof CryptoSecretKey)) {
            throw CoreErrors.secrets.secretNotFound(DeviceSecretType.IdentitySynchronizationMaster).logWith(this._log)
        }

        const decryptionKey = await CoreCrypto.deriveKeyFromBase(privSync.secret, index, "DataSync")

        const plaintext = await CoreCrypto.decrypt(payloadCipher, decryptionKey)
        privSync.secret.clear()

        const deserializedObject = JSON.parse(plaintext.toUtf8())

        return deserializedObject
    }

    private getBaseKey(): CryptoSecretKey {
        if (!this.baseKey) {
            throw CoreErrors.general
                .recordNotFound(CryptoSecretKey, DeviceSecretType.SharedSecretBaseKey)
                .logWith(this._log)
        }

        return this.baseKey
    }
}
