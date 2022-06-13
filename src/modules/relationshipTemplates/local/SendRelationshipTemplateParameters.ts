import { ISerializable, Serializable, serialize, type, validate, ValidationError } from "@js-soft/ts-serval"
import { nameof } from "ts-simple-nameof"
import { CoreDate, CoreSerializable, ICoreSerializable } from "../../../core"
import { CachedRelationshipTemplate } from "./CachedRelationshipTemplate"

export interface ISendRelationshipTemplateParameters extends ICoreSerializable {
    content: ISerializable
    expiresAt: CoreDate
    maxNumberOfAllocations?: number

    /**
     * @deprecated use `maxNumberOfAllocations` instead
     * @see maxNumberOfAllocations
     */
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

    @validate({ nullable: true, customValidator: CachedRelationshipTemplate.validateMaxNumberOfAllocations })
    @serialize()
    public maxNumberOfAllocations?: number

    /**
     * @deprecated use `maxNumberOfAllocations` instead
     * @see maxNumberOfAllocations
     */
    @validate({ nullable: true, customValidator: CachedRelationshipTemplate.validateMaxNumberOfRelationships })
    @serialize()
    public maxNumberOfRelationships?: number

    protected static override postFrom<T extends Serializable>(value: T): T {
        if (!(value instanceof SendRelationshipTemplateParameters)) throw new Error("this should never happen")

        if (value.maxNumberOfAllocations && value.maxNumberOfRelationships) {
            throw new ValidationError(
                SendRelationshipTemplateParameters.name,
                nameof<SendRelationshipTemplateParameters>((x) => x.maxNumberOfAllocations),
                `You cannot specify both ${nameof<SendRelationshipTemplateParameters>(
                    (x) => x.maxNumberOfAllocations
                )} and ${nameof<SendRelationshipTemplateParameters>((x) => x.maxNumberOfRelationships)}.`
            )
        }

        return value
    }

    public static from(value: ISendRelationshipTemplateParameters): SendRelationshipTemplateParameters {
        return this.fromAny(value)
    }
}
