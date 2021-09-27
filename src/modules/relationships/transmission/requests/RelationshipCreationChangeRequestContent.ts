import { ISerializableAsync, SerializableAsync, serialize, type, validate } from "@js-soft/ts-serval"
import { CoreId, CoreSerializableAsync, ICoreId, ICoreSerializableAsync } from "../../../../core"
import { Identity, IIdentity } from "../../../accounts/data/Identity"

export interface IRelationshipCreationChangeRequestContent extends ICoreSerializableAsync {
    identity: IIdentity
    content: ISerializableAsync
    templateId: ICoreId
}

@type("RelationshipCreationChangeRequestContent")
export class RelationshipCreationChangeRequestContent
    extends CoreSerializableAsync
    implements IRelationshipCreationChangeRequestContent
{
    @validate()
    @serialize()
    public identity: Identity

    @validate()
    @serialize()
    public content: SerializableAsync

    @validate()
    @serialize()
    public templateId: CoreId

    public static async from(
        value: IRelationshipCreationChangeRequestContent
    ): Promise<RelationshipCreationChangeRequestContent> {
        return await super.fromT(value, RelationshipCreationChangeRequestContent)
    }

    public static async deserialize(value: string): Promise<RelationshipCreationChangeRequestContent> {
        return await super.deserializeT(value, RelationshipCreationChangeRequestContent)
    }
}
