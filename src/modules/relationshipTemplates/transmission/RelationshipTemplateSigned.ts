import { serialize, type, validate } from "@js-soft/ts-serval"
import { CryptoSignature, ICryptoSignature } from "@nmshd/crypto"
import { CoreSerializableAsync, ICoreSerializableAsync } from "../../../core"

export interface IRelationshipTemplateSigned extends ICoreSerializableAsync {
    serializedTemplate: string
    deviceSignature: ICryptoSignature
}

@type("RelationshipTemplateSigned")
export class RelationshipTemplateSigned extends CoreSerializableAsync implements IRelationshipTemplateSigned {
    @validate()
    @serialize()
    public serializedTemplate: string

    @validate()
    @serialize()
    public deviceSignature: CryptoSignature

    public static async from(value: IRelationshipTemplateSigned): Promise<RelationshipTemplateSigned> {
        return await super.fromT(value, RelationshipTemplateSigned)
    }

    public static async deserialize(value: string): Promise<RelationshipTemplateSigned> {
        return await super.deserializeT(value, RelationshipTemplateSigned)
    }
}
