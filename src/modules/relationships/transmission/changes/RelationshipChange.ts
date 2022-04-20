import { ISerializable, serialize, type, validate } from "@js-soft/ts-serval"
import { CoreSerializableAsync, ICoreSerializableAsync } from "../../../../core"
import { CoreId, ICoreId } from "../../../../core/types/CoreId"
import { BackboneGetRelationshipsChangesResponse } from "../../backbone/BackboneGetRelationshipsChanges"
import { IRelationshipChangeRequest, RelationshipChangeRequest } from "./RelationshipChangeRequest"
import { IRelationshipChangeResponse, RelationshipChangeResponse } from "./RelationshipChangeResponse"
import { RelationshipChangeStatus } from "./RelationshipChangeStatus"
import { RelationshipChangeType } from "./RelationshipChangeType"

export interface IRelationshipChange extends ICoreSerializableAsync {
    id: ICoreId
    relationshipId: ICoreId
    request: IRelationshipChangeRequest
    response?: IRelationshipChangeResponse
    status: RelationshipChangeStatus
    type: RelationshipChangeType
}

@type("RelationshipChangeRequest")
export class RelationshipChange extends CoreSerializableAsync implements IRelationshipChange {
    @validate()
    @serialize()
    public id: CoreId

    @validate()
    @serialize()
    public relationshipId: CoreId

    @validate()
    @serialize()
    public request: RelationshipChangeRequest

    @validate({ nullable: true })
    @serialize()
    public response?: RelationshipChangeResponse

    @validate()
    @serialize()
    public status: RelationshipChangeStatus

    @validate()
    @serialize()
    public type: RelationshipChangeType

    public static async fromBackbone(
        backboneChange: BackboneGetRelationshipsChangesResponse,
        requestContent?: ISerializable,
        responseContent?: ISerializable
    ): Promise<RelationshipChange> {
        const relationshipChange = await this.from({
            id: CoreId.from(backboneChange.id),
            relationshipId: CoreId.from(backboneChange.relationshipId),
            type: backboneChange.type,
            status: backboneChange.status,
            request: await RelationshipChangeRequest.fromBackbone(backboneChange.request, requestContent)
        })

        if (backboneChange.response) {
            relationshipChange.response = await RelationshipChangeResponse.fromBackbone(
                backboneChange.response,
                responseContent
            )
        }

        return relationshipChange
    }

    public static async from(value: IRelationshipChange): Promise<RelationshipChange> {
        return await super.fromT(value, RelationshipChange)
    }

    public static async deserialize(value: string): Promise<RelationshipChange> {
        return await super.deserializeT(value, RelationshipChange)
    }
}
