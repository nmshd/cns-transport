import { ISerializable, Serializable, serialize, type, validate } from "@js-soft/ts-serval"
import { CoreSerializable, ICoreSerializable } from "../../../core"
import { Identity, IIdentity } from "../../accounts/data/Identity"
import { IRelationshipTemplatePublicKey, RelationshipTemplatePublicKey } from "./RelationshipTemplatePublicKey"

export interface IRelationshipTemplateContent extends ICoreSerializable {
    identity: IIdentity
    templateKey: IRelationshipTemplatePublicKey
    content: ISerializable
}

@type("RelationshipTemplateContent")
export class RelationshipTemplateContent extends CoreSerializable implements IRelationshipTemplateContent {
    @validate()
    @serialize()
    public identity: Identity

    @validate()
    @serialize()
    public templateKey: RelationshipTemplatePublicKey

    @validate()
    @serialize()
    public content: Serializable

    public static from(value: IRelationshipTemplateContent): RelationshipTemplateContent {
        return this.fromAny(value)
    }
}
