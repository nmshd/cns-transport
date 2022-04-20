import { ISerializable, ISerializableAsync, SerializableAsync, serialize, type, validate } from "@js-soft/ts-serval"
import { CoreAddress, CoreDate, CoreSerializableAsync, ICoreAddress } from "../../../../core"
import { ICoreDate } from "../../../../core/types/CoreDate"
import { CoreId, ICoreId } from "../../../../core/types/CoreId"
import { BackboneGetRelationshipsChangesSingleChangeResponse } from "../../backbone/BackboneGetRelationshipsChanges"

export interface IRelationshipChangeRequest {
    createdBy: ICoreAddress
    createdByDevice: ICoreId
    createdAt: ICoreDate
    content?: ISerializable
}

@type("RelationshipChangeRequest")
export class RelationshipChangeRequest extends CoreSerializableAsync implements IRelationshipChangeRequest {
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
    ): Promise<RelationshipChangeRequest> {
        return await this.from({
            createdBy: CoreAddress.from(backboneChange.createdBy),
            createdByDevice: CoreId.from(backboneChange.createdByDevice),
            createdAt: CoreDate.from(backboneChange.createdAt),
            content: content
        })
    }

    public static async from(value: IRelationshipChangeRequest): Promise<RelationshipChangeRequest> {
        return await super.fromT(value, RelationshipChangeRequest)
    }

    public static async deserialize(value: string): Promise<RelationshipChangeRequest> {
        return await super.deserializeT(value, RelationshipChangeRequest)
    }
}
