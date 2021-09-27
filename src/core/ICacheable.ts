import { nameof } from "ts-simple-nameof"
import { CoreSynchronizable } from "./CoreSynchronizable"

export interface ICacheable {
    cache?: any
}

export function isCacheable(object: unknown): object is ICacheable {
    if (!(object instanceof CoreSynchronizable)) {
        return false
    }

    const hasCacheProperty = Object.prototype.hasOwnProperty.call(
        object.toJSON(),
        nameof<ICacheable>((o) => o.cache)
    )

    return hasCacheProperty
}
