import { ISerializable, Serializable, serialize, type, validate } from "@js-soft/ts-serval"
import { CoreId, CoreSerializable, ICoreId, ICoreSerializable } from "../../../../core"
import { Identity, IIdentity } from "../../../accounts/data/Identity"

export interface IRelationshipCreationChangeRequestContent extends ICoreSerializable {
    identity: IIdentity
    content: ISerializable
    templateId: ICoreId
}

@type("RelationshipCreationChangeRequestContent")
export class RelationshipCreationChangeRequestContent
    extends CoreSerializable
    implements IRelationshipCreationChangeRequestContent
{
    @validate()
    @serialize()
    public identity: Identity

    @validate()
    @serialize()
    public content: Serializable

    @validate()
    @serialize()
    public templateId: CoreId

    public static from(value: IRelationshipCreationChangeRequestContent): RelationshipCreationChangeRequestContent {
        return this.fromAny(value)
    }
}
