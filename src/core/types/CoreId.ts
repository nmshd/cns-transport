import { serialize, serializeOnly, type, validate } from "@js-soft/ts-serval"
import { Random, RandomCharacterRange } from "../../util/Random"
import { CoreSerializable, ICoreSerializable } from "../CoreSerializable"
import { TransportErrors } from "../TransportErrors"

export interface ICoreId extends ICoreSerializable {
    id: string
}

/**
 * A CoreId is any kind of identifier we have in the system.
 */
@type("CoreId")
@serializeOnly("id", "string")
export class CoreId extends CoreSerializable implements ICoreId {
    @validate()
    @serialize()
    public id: string

    public override toString(): string {
        return this.id
    }

    public equals(id: CoreId): boolean {
        return this.id === id.toString()
    }

    public static async generate(prefix = ""): Promise<CoreId> {
        if (prefix.length > 6) {
            throw TransportErrors.util.tooLongCoreIdPrefix(prefix)
        }

        const random = await Random.string(20 - prefix.length, RandomCharacterRange.Alphanumeric)
        return this.from(prefix.toUpperCase() + random)
    }

    public static from(value: ICoreId | string): CoreId {
        return this.fromAny(value)
    }

    protected static override preFrom(value: any): any {
        if (typeof value === "string") {
            return { id: value }
        }

        return value
    }

    public override serialize(): string {
        return this.id
    }
}
