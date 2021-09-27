import { serialize, type, validate } from "@js-soft/ts-serval"
import { CryptoSignature, ICryptoSignature } from "@nmshd/crypto"
import { CoreSerializableAsync, ICoreSerializableAsync } from "../../../../core"

export interface IRelationshipCreationChangeRequestSigned extends ICoreSerializableAsync {
    serializedRequest: string
    deviceSignature: ICryptoSignature
    relationshipSignature: ICryptoSignature
}

@type("RelationshipCreationChangeRequestSigned")
export class RelationshipCreationChangeRequestSigned
    extends CoreSerializableAsync
    implements IRelationshipCreationChangeRequestSigned
{
    @validate()
    @serialize()
    public serializedRequest: string

    @validate()
    @serialize()
    public deviceSignature: CryptoSignature

    @validate()
    @serialize()
    public relationshipSignature: CryptoSignature

    public static async from(
        value: IRelationshipCreationChangeRequestSigned
    ): Promise<RelationshipCreationChangeRequestSigned> {
        return await super.fromT(value, RelationshipCreationChangeRequestSigned)
    }

    public static async deserialize(value: string): Promise<RelationshipCreationChangeRequestSigned> {
        return await super.deserializeT(value, RelationshipCreationChangeRequestSigned)
    }
}
