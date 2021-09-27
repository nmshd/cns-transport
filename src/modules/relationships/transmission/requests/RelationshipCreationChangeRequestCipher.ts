import { serialize, type, validate } from "@js-soft/ts-serval"
import {
    CryptoCipher,
    CryptoRelationshipPublicRequest,
    ICryptoCipher,
    ICryptoRelationshipPublicRequest
} from "@nmshd/crypto"
import { CoreSerializableAsync, ICoreSerializableAsync } from "../../../../core"

export interface IRelationshipCreationChangeRequestCipher extends ICoreSerializableAsync {
    cipher: ICryptoCipher
    publicRequestCrypto: ICryptoRelationshipPublicRequest
}

@type("RelationshipCreationChangeRequestCipher")
export class RelationshipCreationChangeRequestCipher
    extends CoreSerializableAsync
    implements IRelationshipCreationChangeRequestCipher
{
    @validate()
    @serialize()
    public cipher: CryptoCipher

    @validate()
    @serialize()
    public publicRequestCrypto: CryptoRelationshipPublicRequest

    public static async from(
        value: IRelationshipCreationChangeRequestCipher
    ): Promise<RelationshipCreationChangeRequestCipher> {
        return await super.fromT(value, RelationshipCreationChangeRequestCipher)
    }

    public static async fromBase64(value: string): Promise<RelationshipCreationChangeRequestCipher> {
        return await super.fromBase64T<RelationshipCreationChangeRequestCipher>(
            value,
            RelationshipCreationChangeRequestCipher
        )
    }

    public static async deserialize(value: string): Promise<RelationshipCreationChangeRequestCipher> {
        return await super.deserializeT(value, RelationshipCreationChangeRequestCipher)
    }
}
