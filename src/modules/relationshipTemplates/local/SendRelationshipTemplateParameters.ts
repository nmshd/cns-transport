import { ISerializable, Serializable, serialize, type, validate } from "@js-soft/ts-serval"
import { CoreDate, CoreSerializable, ICoreSerializable } from "../../../core"
import { CachedRelationshipTemplate } from "./CachedRelationshipTemplate"

export interface ISendRelationshipTemplateParameters extends ICoreSerializable {
    content: ISerializable
    expiresAt: CoreDate
    maxNumberOfRelationships?: number
}

@type("SendRelationshipTemplateParameters")
export class SendRelationshipTemplateParameters
    extends CoreSerializable
    implements ISendRelationshipTemplateParameters
{
    @validate()
    @serialize()
    public content: Serializable

    @validate()
    @serialize()
    public expiresAt: CoreDate

    @validate({ nullable: true, customValidator: CachedRelationshipTemplate.validateMaxNumberOfRelationships })
    @serialize()
    public maxNumberOfRelationships?: number

    public static from(value: ISendRelationshipTemplateParameters): SendRelationshipTemplateParameters {
        return super.fromT(value, SendRelationshipTemplateParameters)
    }

    public static deserialize(value: string): SendRelationshipTemplateParameters {
        return super.deserializeT(value, SendRelationshipTemplateParameters)
    }
}
