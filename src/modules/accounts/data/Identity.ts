import { serialize, type, validate } from "@js-soft/ts-serval"
import { CryptoSignaturePublicKey, ICryptoSignaturePublicKey } from "@nmshd/crypto"
import { CoreSerializableAsync, ICoreSerializableAsync } from "../../../core/CoreSerializableAsync"
import { CoreAddress } from "../../../core/types/CoreAddress"

export interface IIdentity extends ICoreSerializableAsync {
    address: CoreAddress
    publicKey: ICryptoSignaturePublicKey
    realm: Realm
}

export enum Realm {
    Dev = "dev",
    Stage = "id0",
    Prod = "id1"
}

@type("Identity")
export class Identity extends CoreSerializableAsync implements IIdentity {
    @validate()
    @serialize()
    public address: CoreAddress

    @validate()
    @serialize()
    public publicKey: CryptoSignaturePublicKey

    @validate()
    @serialize()
    public realm: Realm

    public static async from(value: IIdentity): Promise<Identity> {
        return await super.fromT(value, Identity)
    }
}
