import { serialize, type, validate } from "@js-soft/ts-serval"
import {
    CryptoCipher,
    CryptoRelationshipPublicResponse,
    ICryptoCipher,
    ICryptoRelationshipPublicResponse
} from "@nmshd/crypto"
import { CoreSerializableAsync, ICoreSerializableAsync } from "../../../../core"

export interface IRelationshipCreationChangeResponseCipher extends ICoreSerializableAsync {
    cipher: ICryptoCipher
    publicResponseCrypto?: ICryptoRelationshipPublicResponse
}

@type("RelationshipCreationChangeResponseCipher")
export class RelationshipCreationChangeResponseCipher
    extends CoreSerializableAsync
    implements IRelationshipCreationChangeResponseCipher
{
    @validate()
    @serialize()
    public cipher: CryptoCipher

    @validate({ nullable: true })
    @serialize()
    public publicResponseCrypto?: CryptoRelationshipPublicResponse

    public static async from(
        value: IRelationshipCreationChangeResponseCipher
    ): Promise<RelationshipCreationChangeResponseCipher> {
        return await super.fromT(value, RelationshipCreationChangeResponseCipher)
    }

    public static async fromBase64(value: string): Promise<RelationshipCreationChangeResponseCipher> {
        return await super.fromBase64T(value, RelationshipCreationChangeResponseCipher)
    }

    public static async deserialize(value: string): Promise<RelationshipCreationChangeResponseCipher> {
        return await super.deserializeT(value, RelationshipCreationChangeResponseCipher)
    }
}
