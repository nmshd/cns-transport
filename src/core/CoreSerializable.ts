import { ISerializable, Serializable, type } from "@js-soft/ts-serval"
import { CoreBuffer } from "@nmshd/crypto"

export interface ICoreSerializable extends ISerializable {}

/**
 * CoreSerializable is the local pendant of the Serializable class which
 * automatically validates, serializes, deserializes and validates again.
 *
 * With the synchronous class, the deserialize methods (from and deserialize)
 * are called synchronous. Please be aware, that CoreSerializable classes should
 * have no CoreSerializableAsync properties.
 */

@type("CoreSerializable")
export class CoreSerializable extends Serializable implements ISerializable {
    public toBase64(): string {
        return CoreBuffer.fromUtf8(this.serialize()).toBase64URL()
    }

    public static from(value: ICoreSerializable, type: new () => CoreSerializable): CoreSerializable {
        return super.fromT(value, type)
    }

    public static fromT<T>(value: ICoreSerializable, type: new () => T): T {
        return super.fromT(value, type)
    }

    public static fromBase64T<T>(value: string, type: new () => T): T {
        const serialized = CoreBuffer.fromBase64URL(value).toUtf8()
        return CoreSerializable.deserializeT(serialized, type)
    }

    public static fromBase64Unknown(value: string): Serializable {
        const serialized = CoreBuffer.fromBase64URL(value).toUtf8()
        return Serializable.deserializeUnknown(serialized)
    }
}
