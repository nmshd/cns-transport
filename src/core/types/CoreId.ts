import { serialize, serializeOnly, validate } from "@js-soft/ts-serval"
import { Random, RandomCharacterRange } from "../../util/Random"
import { CoreErrors } from "../CoreErrors"
import { CoreSerializable, ICoreSerializable } from "../CoreSerializable"

export interface ICoreId extends ICoreSerializable {
    id: string
}

/**
 * A CoreId is any kind of identifier we have in the system.
 */
@serializeOnly("id", "string")
export class CoreId extends CoreSerializable implements ICoreId {
    @validate()
    @serialize()
    public id: string

    public toString(): string {
        return this.id
    }

    public equals(id: CoreId): boolean {
        return this.id === id.toString()
    }

    public static async generate(prefix = ""): Promise<CoreId> {
        if (prefix.length > 6) {
            throw CoreErrors.util.tooLongCoreIdPrefix(prefix)
        }

        const random = await Random.string(20 - prefix.length, RandomCharacterRange.Alphanumeric)
        return this.from(prefix.toUpperCase() + random)
    }

    public static from(value: ICoreId | string): CoreId {
        if (typeof value === "string" || value instanceof String) {
            return super.fromT({ id: value }, CoreId)
        }

        return super.fromT(value, CoreId)
    }

    public static deserialize(value: string): CoreId {
        return this.from(value)
    }

    public serialize(): string {
        return this.id
    }
}
