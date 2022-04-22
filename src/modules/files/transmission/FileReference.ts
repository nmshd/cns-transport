import { serialize, type, validate } from "@js-soft/ts-serval"
import { CoreBuffer, CryptoSecretKey, ICryptoSecretKey } from "@nmshd/crypto"
import { CoreId, CoreSerializable, ICoreSerializable, TransportErrors } from "../../../core"

export interface IFileReference extends ICoreSerializable {
    id: CoreId
    key: ICryptoSecretKey
}

@type("FileReference")
export class FileReference extends CoreSerializable implements IFileReference {
    @validate()
    @serialize()
    public id: CoreId

    @validate()
    @serialize()
    public key: CryptoSecretKey

    public truncate(): string {
        const truncatedReference = CoreBuffer.fromUtf8(
            `${this.id.toString()}|${this.key.algorithm}|${this.key.secretKey.toBase64URL()}`
        )
        return truncatedReference.toBase64URL()
    }

    public static fromTruncated(value: string): FileReference {
        const truncatedBuffer = CoreBuffer.fromBase64URL(value)
        const splitted = truncatedBuffer.toUtf8().split("|")

        if (splitted.length !== 3) {
            throw TransportErrors.files.invalidTruncatedReference()
        }

        try {
            const id = CoreId.from(splitted[0])
            const alg = parseInt(splitted[1])
            const key = splitted[2]
            const secretKey = CryptoSecretKey.from({
                algorithm: alg,
                secretKey: CoreBuffer.fromBase64URL(key)
            })

            return FileReference.from({
                id: CoreId.from(id),
                key: secretKey
            })
        } catch (e) {
            throw TransportErrors.files.invalidTruncatedReference()
        }
    }

    public static from(value: IFileReference | string): FileReference {
        return this.fromAny(value)
    }
}
