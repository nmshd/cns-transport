import { serialize, type, validate } from "@js-soft/ts-serval"
import { CryptoSignaturePublicKey, ICryptoSignaturePublicKey } from "@nmshd/crypto"
import { CoreSerializable, ICoreSerializable } from "../../../core/CoreSerializable"
import { CoreAddress } from "../../../core/types/CoreAddress"
import { CoreDate } from "../../../core/types/CoreDate"

export interface IIdentity extends ICoreSerializable {
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
export class Identity extends CoreSerializable implements IIdentity {
    @validate()
    @serialize()
    public address: CoreAddress

    @validate()
    @serialize()
    public publicKey: CryptoSignaturePublicKey

    @validate()
    @serialize()
    public realm: Realm

    /**
     * @deprecated
     */
    @validate({ nullable: true })
    @serialize()
    public name: string

    /**
     * @deprecated
     */
    @validate({ nullable: true })
    @serialize()
    public description: string

    /**
     * @deprecated
     */
    @validate({ nullable: true })
    @serialize()
    public createdAt: CoreDate

    /**
     * @deprecated
     */
    @validate({ nullable: true })
    @serialize()
    public type: string

    public static from(value: IIdentity): Identity {
        const identity = super.fromT(value, Identity)

        // TODO: Remove these default values once we're sure that nobody is accessing the deprecated properties anymore
        identity.name = ""
        identity.description = ""
        identity.type = "unknown"
        identity.createdAt = CoreDate.from("2020-01-01T00:00:00Z")
        return identity
    }
}
