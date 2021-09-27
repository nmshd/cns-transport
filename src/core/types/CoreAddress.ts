import { serialize, serializeOnly, type, validate } from "@js-soft/ts-serval"
import { CoreSerializable, ICoreSerializable } from "../CoreSerializable"

export interface ICoreAddress extends ICoreSerializable {
    address: string
}

/**
 * A CoreAddress is the primariy technical identitier of an account.
 */
@type("CoreAddress")
@serializeOnly("address", "string")
export class CoreAddress extends CoreSerializable {
    @validate()
    @serialize()
    public address: string

    public static from(value: ICoreAddress | string): CoreAddress {
        if (typeof value === "string") {
            return super.fromT({ address: value }, CoreAddress)
        }

        return super.fromT(value, CoreAddress)
    }

    public static deserialize(value: string): CoreAddress {
        try {
            return super.deserializeT(value, CoreAddress)
        } catch (e) {
            return this.from(value)
        }
    }

    public equals(address?: CoreAddress): boolean {
        if (address === undefined) return false

        return this.address === address.toString()
    }

    public toString(): string {
        return this.address
    }

    public serialize(): string {
        return this.address
    }
}
