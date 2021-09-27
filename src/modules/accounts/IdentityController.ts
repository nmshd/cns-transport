import { CoreBuffer, CryptoSignature, CryptoSignaturePrivateKey, CryptoSignaturePublicKey } from "@nmshd/crypto"
import { ControllerName, CoreAddress, CoreController, CoreCrypto, CoreDate, CoreErrors } from "../../core"
import { AccountController } from "../accounts/AccountController"
import { DeviceSecretType } from "../devices/DeviceSecretController"
import { Identity, IdentityType, Realm } from "./data/Identity"

export class IdentityController extends CoreController {
    public get address(): CoreAddress {
        return this._identity.address
    }

    public get publicKey(): CryptoSignaturePublicKey {
        return this._identity.publicKey
    }

    public get realm(): Realm {
        return this._identity.realm
    }

    public get name(): string {
        return this._identity.name
    }

    public get description(): string {
        return this._identity.description
    }

    public get createdAt(): CoreDate {
        return this._identity.createdAt
    }

    public get type(): IdentityType {
        return this._identity.type
    }

    public get identity(): Identity {
        return this._identity
    }
    private _identity: Identity

    public constructor(parent: AccountController) {
        super(ControllerName.Identity, parent)
    }

    public async init(identity?: Identity): Promise<IdentityController> {
        await super.init()

        if (!identity) {
            throw CoreErrors.identity.identityNotSet().logWith(this._log)
        }
        this._identity = identity

        return this
    }

    public isMe(address: CoreAddress): boolean {
        return this.address.equals(address)
    }

    public async update(name: string, description: string): Promise<void> {
        this.identity.name = name
        this.identity.description = description
        await this.parent.info.set("identity", this.identity)
    }

    public async sign(content: CoreBuffer): Promise<CryptoSignature> {
        const privateKeyContainer = await this.parent.activeDevice.secrets.loadSecret(
            DeviceSecretType.IdentitySignature
        )
        if (!privateKeyContainer || !(privateKeyContainer.secret instanceof CryptoSignaturePrivateKey)) {
            throw CoreErrors.secrets.secretNotFound(DeviceSecretType.IdentitySignature).logWith(this._log)
        }
        const privateKey = privateKeyContainer.secret

        const signature = await CoreCrypto.sign(content, privateKey)
        privateKey.clear()
        return signature
    }

    public async verify(content: CoreBuffer, signature: CryptoSignature): Promise<boolean> {
        const valid = await CoreCrypto.verify(content, signature, this.publicKey)
        return valid
    }
}
