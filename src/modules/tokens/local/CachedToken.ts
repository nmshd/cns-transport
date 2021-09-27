import { ISerializableAsync, SerializableAsync, serialize, type, validate } from "@js-soft/ts-serval"
import {
    CoreAddress,
    CoreDate,
    CoreId,
    CoreSerializableAsync,
    ICoreAddress,
    ICoreDate,
    ICoreId,
    ICoreSerializableAsync
} from "../../../core"

export interface ICachedToken extends ICoreSerializableAsync {
    createdBy: ICoreAddress
    createdAt: ICoreDate
    expiresAt: ICoreDate
    content: ISerializableAsync
    createdByDevice: ICoreId
}

@type("CachedToken")
export class CachedToken extends CoreSerializableAsync implements ICachedToken {
    @validate()
    @serialize()
    public createdBy: CoreAddress

    @validate()
    @serialize()
    public createdAt: CoreDate

    @validate()
    @serialize()
    public expiresAt: CoreDate

    @validate()
    @serialize()
    public content: SerializableAsync

    @validate()
    @serialize()
    public createdByDevice: CoreId

    public static async from(value: ICachedToken): Promise<CachedToken> {
        return await super.fromT(value, CachedToken)
    }

    public static async deserialize(value: string): Promise<CachedToken> {
        return await super.deserializeT(value, CachedToken)
    }
}
