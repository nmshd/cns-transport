import {
    CoreBuffer,
    CryptoSecretKey,
    CryptoSignature,
    CryptoSignaturePrivateKey,
    CryptoSignaturePublicKey
} from "@nmshd/crypto"
import { ControllerName, CoreController, CoreCrypto, CoreDate, CoreErrors, CoreId, CredentialsBasic } from "../../core"
import { AccountController } from "../accounts/AccountController"
import { DeviceSecretController, DeviceSecretType } from "./DeviceSecretController"
import { Device, DeviceType } from "./local/Device"
import { DeviceSecretCredentials } from "./local/DeviceSecretCredentials"

export class DeviceController extends CoreController {
    public get secrets(): DeviceSecretController {
        return this._secrets
    }
    private _secrets: DeviceSecretController

    public get id(): CoreId {
        return this.device.id
    }

    public get publicKey(): CryptoSignaturePublicKey | undefined {
        return this.device.publicKey
    }

    public get certificate(): string | undefined {
        return this.device.certificate
    }

    public get name(): string {
        return this.device.name
    }

    public get description(): string | undefined {
        return this.device.description
    }

    public get operatingSystem(): string | undefined {
        return this.device.operatingSystem
    }

    public get createdAt(): CoreDate {
        return this.device.createdAt
    }

    public get type(): DeviceType {
        return this.device.type
    }

    private _device?: Device
    public get device(): Device {
        if (!this._device) throw CoreErrors.device.deviceNotSet()
        return this._device
    }
    public get deviceOrUndefined(): Device | undefined {
        return this._device
    }

    public constructor(parent: AccountController) {
        super(ControllerName.Device, parent)
    }

    public async init(baseKey?: CryptoSecretKey, device?: Device): Promise<DeviceController> {
        await super.init()

        if (!device) {
            throw CoreErrors.device.deviceNotSet().logWith(this._log)
        }
        if (!baseKey) {
            throw CoreErrors.secrets.secretNotFound("BaseKey").logWith(this._log)
        }
        this._device = device

        this._secrets = await new DeviceSecretController(this.parent, baseKey).init()

        return this
    }

    public async changePassword(newPassword: string): Promise<void> {
        const oldPassword: string = (await this.getCredentials()).password
        await this.parent.deviceAuthClient.changeDevicePassword({
            oldPassword: oldPassword,
            newPassword: newPassword
        })

        try {
            const credentialContainer = await this.secrets.loadSecret(DeviceSecretType.DeviceCredentials)
            if (!credentialContainer) {
                throw new Error("There was an error while accessing the device_credentials secret.")
            }
            const credentials: DeviceSecretCredentials = credentialContainer.secret as DeviceSecretCredentials
            credentials.password = newPassword

            await this.secrets.storeSecret(credentials, DeviceSecretType.DeviceCredentials)
        } catch (e) {
            // TODO: JSSNMSHDD-2473 (rollback if password saving failed)
            this.log.warn(
                `We've changed the device password on the backboen but weren't able to store it to the database. The new password is '${newPassword}'.`
            )
            throw e
        }
    }

    public async update(name: string, description: string): Promise<void> {
        this.device.name = name
        this.device.description = description
        await this.parent.info.set("device", this.device)
    }

    public async sign(content: CoreBuffer): Promise<CryptoSignature> {
        const privateKeyContainer = await this.secrets.loadSecret(DeviceSecretType.DeviceSignature)
        if (!privateKeyContainer || !(privateKeyContainer.secret instanceof CryptoSignaturePrivateKey)) {
            throw CoreErrors.secrets.secretNotFound(DeviceSecretType.DeviceSignature).logWith(this._log)
        }
        const privateKey = privateKeyContainer.secret
        const signature = await CoreCrypto.sign(content, privateKey)
        privateKey.privateKey.clear()

        return signature
    }

    public async verify(content: CoreBuffer, signature: CryptoSignature): Promise<boolean> {
        if (!this.publicKey) {
            throw CoreErrors.device.notOnboardedYet().logWith(this._log)
        }
        return await CoreCrypto.verify(content, signature, this.publicKey)
    }

    public async getCredentials(): Promise<CredentialsBasic> {
        const credentialContainer = await this.secrets.loadSecret(DeviceSecretType.DeviceCredentials)

        if (!credentialContainer) {
            throw CoreErrors.secrets.secretNotFound(DeviceSecretType.DeviceCredentials).logWith(this._log)
        }

        if (!(credentialContainer.secret instanceof DeviceSecretCredentials)) {
            throw CoreErrors.secrets.wrongSecretType(DeviceSecretType.DeviceCredentials).logWith(this._log)
        }

        const credentials = credentialContainer.secret
        if (!credentials.username || !credentials.password) {
            throw CoreErrors.secrets.wrongSecretType(DeviceSecretType.DeviceCredentials).logWith(this._log)
        }

        return {
            username: credentials.username,
            password: credentials.password
        }
    }
}
