import { ISerializableAsync, SerializableAsync, serialize, type, validate } from "@js-soft/ts-serval"
import { CoreSerializableAsync, ICoreSerializableAsync } from "../../../core"
import { Identity, IIdentity } from "../../accounts/data/Identity"
import { IRelationshipTemplatePublicKey, RelationshipTemplatePublicKey } from "./RelationshipTemplatePublicKey"

export interface IRelationshipTemplateContent extends ICoreSerializableAsync {
    identity: IIdentity
    templateKey: IRelationshipTemplatePublicKey
    content: ISerializableAsync
}

@type("RelationshipTemplateContent")
export class RelationshipTemplateContent extends CoreSerializableAsync implements IRelationshipTemplateContent {
    @validate()
    @serialize()
    public identity: Identity

    @validate()
    @serialize()
    public templateKey: RelationshipTemplatePublicKey

    @validate()
    @serialize()
    public content: SerializableAsync

    public static async from(value: IRelationshipTemplateContent): Promise<RelationshipTemplateContent> {
        return await super.fromT(value, RelationshipTemplateContent)
    }

    public static async deserialize(value: string): Promise<RelationshipTemplateContent> {
        return await super.deserializeT(value, RelationshipTemplateContent)
    }
}
