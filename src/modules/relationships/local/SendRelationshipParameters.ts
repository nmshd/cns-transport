import { ISerializableAsync, SerializableAsync, serialize, type, validate } from "@js-soft/ts-serval"
import { CoreSerializableAsync, ICoreSerializableAsync } from "../../../core"
import { IRelationshipTemplate, RelationshipTemplate } from "../../relationshipTemplates/local/RelationshipTemplate"

export interface ISendRelationshipParameters extends ICoreSerializableAsync {
    content: ISerializableAsync
    template: IRelationshipTemplate
}

@type("SendRelationshipParameters")
export class SendRelationshipParameters extends CoreSerializableAsync implements ISendRelationshipParameters {
    @validate()
    @serialize()
    public content: SerializableAsync

    @validate()
    @serialize()
    public template: RelationshipTemplate

    public static async from(value: ISendRelationshipParameters): Promise<SendRelationshipParameters> {
        return await super.fromT(value, SendRelationshipParameters)
    }

    public static async deserialize(value: string): Promise<SendRelationshipParameters> {
        return await super.deserializeT(value, SendRelationshipParameters)
    }
}
