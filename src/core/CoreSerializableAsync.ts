import { ISerializableAsync, SerializableAsync, type } from "@js-soft/ts-serval"
import { CoreBuffer } from "@nmshd/crypto"

export interface ICoreSerializableAsync extends ISerializableAsync {}

/**
 * CoreSerializableAsync is the local pendant of the SerializableAsync class which
 * automatically validates, serializes, deserializes and validates again.
 *
 * With the asynchronous class, the deserialize methods (from and deserialize)
 * are called asynchronous (returning a Promise). You should only use CoreSerializableAsync
 * classes if properties with CoreSerializableAsync types are used.
 */
@type("CoreSerializableAsync")
export class CoreSerializableAsync extends SerializableAsync implements ISerializableAsync {
    public toBase64(): string {
        return CoreBuffer.fromUtf8(this.serialize()).toBase64URL()
    }

    public static async from(
        value: ICoreSerializableAsync,
        type: new () => CoreSerializableAsync
    ): Promise<CoreSerializableAsync> {
        return await (super.from(value, type) as Promise<CoreSerializableAsync>)
    }

    public static async fromT<T>(value: ICoreSerializableAsync, type: new () => T): Promise<T> {
        return await super.fromT(value, type)
    }

    public static async fromBase64T<T>(value: string, type: new () => T): Promise<T> {
        const serialized = CoreBuffer.fromBase64URL(value).toUtf8()
        return await CoreSerializableAsync.deserializeT(serialized, type)
    }

    public static async fromBase64Unknown(value: string): Promise<SerializableAsync> {
        const serialized = CoreBuffer.fromBase64URL(value).toUtf8()
        return await SerializableAsync.deserializeUnknown(serialized)
    }
}
