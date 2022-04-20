import { ISerializableAsync, SerializableAsync, serialize, type, validate } from "@js-soft/ts-serval"
import { CoreAddress, CoreDate, CoreSerializableAsync, ICoreAddress, ICoreSerializableAsync } from "../../../../core"
import { ICoreDate } from "../../../../core/types/CoreDate"
import { CoreId, ICoreId } from "../../../../core/types/CoreId"
import { BackboneGetRelationshipsChangesSingleChangeResponse } from "../../backbone/BackboneGetRelationshipsChanges"

export interface IRelationshipChangeResponse extends ICoreSerializableAsync {
    createdBy: ICoreAddress
    createdByDevice: ICoreId
    createdAt: ICoreDate
    content?: ISerializableAsync
}

@type("RelationshipChangeResponse")
export class RelationshipChangeResponse extends CoreSerializableAsync implements IRelationshipChangeResponse {
    @validate()
    @serialize()
    public createdBy: CoreAddress

    @validate()
    @serialize()
    public createdByDevice: CoreId

    @validate()
    @serialize()
    public createdAt: CoreDate

    @validate({ nullable: true })
    @serialize()
    public content?: SerializableAsync

    public static async fromBackbone(
        backboneChange: BackboneGetRelationshipsChangesSingleChangeResponse,
        content?: ISerializableAsync
    ): Promise<RelationshipChangeResponse> {
        return await this.from({
            createdBy: CoreAddress.from(backboneChange.createdBy),
            createdByDevice: CoreId.from(backboneChange.createdByDevice),
            createdAt: CoreDate.from(backboneChange.createdAt),
            content: content
        })
    }

    public static async from(value: IRelationshipChangeResponse): Promise<RelationshipChangeResponse> {
        return await super.fromT(value, RelationshipChangeResponse)
    }

    public static async deserialize(value: string): Promise<RelationshipChangeResponse> {
        return await super.deserializeT(value, RelationshipChangeResponse)
    }
}
