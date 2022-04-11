import { ISerializable, Serializable, serialize, validate } from "@js-soft/ts-serval"
import { CoreAddress, CoreDate, CoreSerializable, ICoreAddress, ICoreSerializable } from "../../../../core"
import { ICoreDate } from "../../../../core/types/CoreDate"
import { CoreId, ICoreId } from "../../../../core/types/CoreId"
import { BackboneGetRelationshipsChangesSingleChangeResponse } from "../../backbone/BackboneGetRelationshipsChanges"

export interface IRelationshipChangeResponse extends ICoreSerializable {
    createdBy: ICoreAddress
    createdByDevice: ICoreId
    createdAt: ICoreDate
    content?: ISerializable
}

export class RelationshipChangeResponse extends CoreSerializable implements IRelationshipChangeResponse {
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
    public content?: Serializable

    public static fromBackbone(
        backboneChange: BackboneGetRelationshipsChangesSingleChangeResponse,
        content?: ISerializable
    ): RelationshipChangeResponse {
        return this.from({
            createdBy: CoreAddress.from(backboneChange.createdBy),
            createdByDevice: CoreId.from(backboneChange.createdByDevice),
            createdAt: CoreDate.from(backboneChange.createdAt),
            content: content
        })
    }

    public static from(value: IRelationshipChangeResponse): RelationshipChangeResponse {
        return super.fromT(value, RelationshipChangeResponse)
    }

    public static deserialize(value: string): RelationshipChangeResponse {
        return super.deserializeT(value, RelationshipChangeResponse)
    }
}
