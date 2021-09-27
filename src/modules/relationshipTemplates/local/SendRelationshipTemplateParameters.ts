import { ISerializableAsync, SerializableAsync, serialize, type, validate } from "@js-soft/ts-serval"
import { CoreDate, CoreSerializableAsync, ICoreSerializableAsync } from "../../../core"
import { CachedRelationshipTemplate } from "./CachedRelationshipTemplate"

export interface ISendRelationshipTemplateParameters extends ICoreSerializableAsync {
    content: ISerializableAsync
    expiresAt: CoreDate
    maxNumberOfRelationships?: number
}

@type("SendRelationshipTemplateParameters")
export class SendRelationshipTemplateParameters
    extends CoreSerializableAsync
    implements ISendRelationshipTemplateParameters
{
    @validate()
    @serialize()
    public content: SerializableAsync

    @validate()
    @serialize()
    public expiresAt: CoreDate

    @validate({ nullable: true, customValidator: CachedRelationshipTemplate.validateMaxNumberOfRelationships })
    @serialize()
    public maxNumberOfRelationships?: number

    public static async from(value: ISendRelationshipTemplateParameters): Promise<SendRelationshipTemplateParameters> {
        return await super.fromT(value, SendRelationshipTemplateParameters)
    }

    public static async deserialize(value: string): Promise<SendRelationshipTemplateParameters> {
        return await super.deserializeT(value, SendRelationshipTemplateParameters)
    }
}
