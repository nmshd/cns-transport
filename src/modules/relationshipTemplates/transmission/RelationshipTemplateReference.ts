import { type, ValidationError } from "@js-soft/ts-serval"
import { BackboneIds, IReference, Reference } from "../../../core"

export interface IRelationshipTemplateReference extends IReference {}

@type("RelationshipTemplateReference")
export class RelationshipTemplateReference extends Reference implements IRelationshipTemplateReference {
    protected static override preFrom(value: any): any {
        if (value?.id && BackboneIds.relationshipTemplate.validate(value.id)) {
            throw new ValidationError(RelationshipTemplateReference.name, "id", "id must start with `RLT`")
        }

        return value
    }

    public static override from(value: IRelationshipTemplateReference | string): RelationshipTemplateReference {
        return super.from(value)
    }
}
