import { Serializable, SerializableAsync } from "@js-soft/ts-serval"
import { CoreBuffer } from "@nmshd/crypto"
import { TransportErrors } from "./TransportErrors"

export class CoreUtil {
    public static toBuffer(
        content: string | SerializableAsync | Serializable | CoreBuffer | ArrayBuffer | Uint8Array,
        verbose = false
    ): CoreBuffer {
        let buffer
        if (content instanceof CoreBuffer) {
            return content
        } else if (typeof content === "string") {
            buffer = CoreBuffer.fromUtf8(content)
        } else if (content instanceof SerializableAsync || content instanceof Serializable) {
            buffer = CoreBuffer.fromUtf8(content.serialize(verbose))
        } else if (content instanceof ArrayBuffer || content instanceof Uint8Array) {
            buffer = new CoreBuffer(content)
        } else {
            throw TransportErrors.util.wrongContentForBuffer()
        }
        return buffer
    }

    public static toSerializable(value: Object): Serializable | SerializableAsync {
        if (value instanceof SerializableAsync) {
            return value
        } else if (value instanceof Serializable) {
            return value
        }

        return Serializable.fromUnknown(value)
    }
}
