import { ISerializableAsync, SerializableAsync, serialize, type, validate } from "@js-soft/ts-serval"
import { CoreId, CoreSerializableAsync, ICoreId, ICoreSerializableAsync } from "../../../../core"

export interface IRelationshipCreationChangeResponseContent extends ICoreSerializableAsync {
    content: ISerializableAsync
    relationshipId: ICoreId
}

@type("RelationshipCreationChangeResponseContent")
export class RelationshipCreationChangeResponseContent
    extends CoreSerializableAsync
    implements IRelationshipCreationChangeResponseContent
{
    @validate()
    @serialize()
    public content: SerializableAsync

    @validate()
    @serialize()
    public relationshipId: CoreId

    public static async from(
        value: IRelationshipCreationChangeResponseContent
    ): Promise<RelationshipCreationChangeResponseContent> {
        return await super.fromT(value, RelationshipCreationChangeResponseContent)
    }

    public static async deserialize(value: string): Promise<RelationshipCreationChangeResponseContent> {
        return await super.deserializeT(value, RelationshipCreationChangeResponseContent)
    }
}
