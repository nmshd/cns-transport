import { serialize, type, validate } from "@js-soft/ts-serval"
import { CryptoSignature, ICryptoSignature } from "@nmshd/crypto"
import { CoreSerializableAsync, ICoreSerializableAsync } from "../../../../core"

export interface IRelationshipCreationChangeResponseSigned extends ICoreSerializableAsync {
    serializedResponse: string
    deviceSignature: ICryptoSignature
    relationshipSignature: ICryptoSignature
}

@type("RelationshipCreationChangeResponseSigned")
export class RelationshipCreationChangeResponseSigned
    extends CoreSerializableAsync
    implements IRelationshipCreationChangeResponseSigned
{
    @validate()
    @serialize()
    public serializedResponse: string

    @validate()
    @serialize()
    public deviceSignature: CryptoSignature

    @validate()
    @serialize()
    public relationshipSignature: CryptoSignature

    public static async from(
        value: IRelationshipCreationChangeResponseSigned
    ): Promise<RelationshipCreationChangeResponseSigned> {
        return await super.fromT(value, RelationshipCreationChangeResponseSigned)
    }

    public static async deserialize(value: string): Promise<RelationshipCreationChangeResponseSigned> {
        return await super.deserializeT(value, RelationshipCreationChangeResponseSigned)
    }
}
