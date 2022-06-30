import { type, ValidationError } from "@js-soft/ts-serval"
import { BackboneIds, IReference, Reference } from "../../../core"

export interface ITokenReference extends IReference {}

@type("TokenReference")
export class TokenReference extends Reference implements ITokenReference {
    protected static override preFrom(value: any): any {
        if (value?.id && BackboneIds.token.validate(value.id)) {
            throw new ValidationError(TokenReference.name, "id", "id must start with `TOK`")
        }

        return value
    }

    public static override from(value: ITokenReference | string): TokenReference {
        return super.from(value)
    }
}
