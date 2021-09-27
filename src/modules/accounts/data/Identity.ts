import { serialize, type, validate } from "@js-soft/ts-serval"
import { CryptoSignaturePublicKey, ICryptoSignaturePublicKey } from "@nmshd/crypto"
import { CoreSerializableAsync, ICoreSerializableAsync } from "../../../core/CoreSerializableAsync"
import { CoreAddress } from "../../../core/types/CoreAddress"
import { CoreDate } from "../../../core/types/CoreDate"

export interface IIdentity extends ICoreSerializableAsync {
    address: CoreAddress
    publicKey: ICryptoSignaturePublicKey
    realm: Realm
    name: string
    description: string
    createdAt: CoreDate
    type: IdentityType
}

export const enum IdentityType {
    UNKNOWN = "unknown",
    PERSON = "person",
    CORPORATION = "corporation",
    FREELANCER = "freelancer"
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

    @validate()
    @serialize()
    public name: string

    @validate()
    @serialize()
    public description: string

    @validate()
    @serialize()
    public createdAt: CoreDate

    @validate()
    @serialize()
    public type: IdentityType

    public static async from(value: IIdentity): Promise<Identity> {
        return await super.fromT(value, Identity)
    }
}
