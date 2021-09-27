import { serialize, type, validate } from "@js-soft/ts-serval"
import {
    CryptoSecretKey,
    CryptoSignaturePrivateKey,
    CryptoSignaturePublicKey,
    ICryptoSecretKey,
    ICryptoSignaturePrivateKey,
    ICryptoSignaturePublicKey
} from "@nmshd/crypto"
import { CoreSerializableAsync, ICoreSerializableAsync } from "../../../core"
import { Realm } from "./Identity"

export interface IIdentitySecretCredentials extends ICoreSerializableAsync {
    publicKey?: ICryptoSignaturePublicKey
    realm: Realm
    synchronizationKey: ICryptoSecretKey
    privateKey?: ICryptoSignaturePrivateKey
}

@type("IdentitySecretCredentials")
export class IdentitySecretCredentials extends CoreSerializableAsync implements IIdentitySecretCredentials {
    @validate()
    @serialize()
    public realm: Realm

    @validate({ nullable: true })
    @serialize()
    public publicKey?: CryptoSignaturePublicKey

    @validate()
    @serialize()
    public synchronizationKey: CryptoSecretKey

    @validate({ nullable: true })
    @serialize()
    public privateKey?: CryptoSignaturePrivateKey

    public static async from(value: IIdentitySecretCredentials): Promise<IdentitySecretCredentials> {
        return await super.fromT(value, IdentitySecretCredentials)
    }
}
