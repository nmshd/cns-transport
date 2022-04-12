import { serialize, type, validate } from "@js-soft/ts-serval"
import { CoreBuffer, CryptoSecretKey, ICryptoSecretKey } from "@nmshd/crypto"
import { CoreId, CoreSerializable, ICoreId, ICoreSerializable, TransportErrors } from "../../../core"

export interface ITokenReference extends ICoreSerializable {
    id: ICoreId
    key: ICryptoSecretKey
}

@type("TokenReference")
export class TokenReference extends CoreSerializable implements ITokenReference {
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

    public static fromTruncated(value: string): TokenReference {
        const truncatedBuffer = CoreBuffer.fromBase64URL(value)
        const splitted = truncatedBuffer.toUtf8().split("|")

        if (splitted.length !== 3) {
            throw TransportErrors.tokens.invalidTruncatedReference()
        }
        try {
            const id = CoreId.from(splitted[0])
            const alg = parseInt(splitted[1])
            const key = splitted[2]
            const secretKey = CryptoSecretKey.from({
                algorithm: alg,
                secretKey: CoreBuffer.fromBase64URL(key)
            })

            return TokenReference.from({
                id: id,
                key: secretKey
            })
        } catch (e) {
            throw TransportErrors.tokens.invalidTruncatedReference()
        }
    }

    public static from(value: ITokenReference | string): TokenReference {
        return this.fromAny(value)
    }
}
