import { ISerializableAsync, serialize, type, validate } from "@js-soft/ts-serval"
import { CoreBuffer, CryptoSecretKey, ICryptoSecretKey } from "@nmshd/crypto"
import { CoreId, CoreSerializableAsync, TransportErrors } from "../../../core"

export interface IFileReference extends ISerializableAsync {
    id: CoreId
    key: ICryptoSecretKey
}

@type("FileReference")
export class FileReference extends CoreSerializableAsync implements IFileReference {
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

    public static async fromTruncated(value: string): Promise<FileReference> {
        const truncatedBuffer = CoreBuffer.fromBase64URL(value)
        const splitted = truncatedBuffer.toUtf8().split("|")

        if (splitted.length !== 3) {
            throw TransportErrors.files.invalidTruncatedReference()
        }

        try {
            const id = CoreId.from(splitted[0])
            const alg = parseInt(splitted[1])
            const key = splitted[2]
            const secretKey = await CryptoSecretKey.from({
                algorithm: alg,
                secretKey: CoreBuffer.fromBase64URL(key)
            })

            return await FileReference.from({
                id: CoreId.from(id),
                key: secretKey
            })
        } catch (e) {
            throw TransportErrors.files.invalidTruncatedReference()
        }
    }

    public static async from(value: IFileReference | string): Promise<FileReference> {
        return await super.fromT(value, FileReference)
    }

    public static async deserialize(value: string): Promise<FileReference> {
        return await super.deserializeT(value, FileReference)
    }
}
