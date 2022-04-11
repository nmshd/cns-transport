import { ISerializable, Serializable, serialize, type, validate } from "@js-soft/ts-serval"
import { CoreId, CoreSerializable, ICoreId, ICoreSerializable } from "../../../../core"

export interface IRelationshipCreationChangeResponseContent extends ICoreSerializable {
    content: ISerializable
    relationshipId: ICoreId
}

@type("RelationshipCreationChangeResponseContent")
export class RelationshipCreationChangeResponseContent
    extends CoreSerializable
    implements IRelationshipCreationChangeResponseContent
{
    @validate()
    @serialize()
    public content: Serializable

    @validate()
    @serialize()
    public relationshipId: CoreId

    public static from(value: IRelationshipCreationChangeResponseContent): RelationshipCreationChangeResponseContent {
        return super.fromT(value, RelationshipCreationChangeResponseContent)
    }

    public static deserialize(value: string): RelationshipCreationChangeResponseContent {
        return super.deserializeT(value, RelationshipCreationChangeResponseContent)
    }
}
