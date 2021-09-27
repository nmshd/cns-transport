import { serialize, type, validate } from "@js-soft/ts-serval"
import { CoreBuffer, CryptoSecretKey, ICryptoSecretKey } from "@nmshd/crypto"
import { CoreErrors, CoreId, CoreSerializableAsync, ICoreId, ICoreSerializableAsync } from "../../../core"

export interface ITokenReference extends ICoreSerializableAsync {
    id: ICoreId
    key: ICryptoSecretKey
}

@type("TokenReference")
export class TokenReference extends CoreSerializableAsync implements ITokenReference {
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

    public static async fromTruncated(value: string): Promise<TokenReference> {
        const truncatedBuffer = CoreBuffer.fromBase64URL(value)
        const splitted = truncatedBuffer.toUtf8().split("|")

        if (splitted.length !== 3) {
            throw CoreErrors.tokens.invalidTruncatedReference()
        }
        try {
            const id = CoreId.from(splitted[0])
            const alg = parseInt(splitted[1])
            const key = splitted[2]
            const secretKey = await CryptoSecretKey.from({
                algorithm: alg,
                secretKey: CoreBuffer.fromBase64URL(key)
            })

            return await TokenReference.from({
                id: id,
                key: secretKey
            })
        } catch (e) {
            throw CoreErrors.tokens.invalidTruncatedReference()
        }
    }

    public static async from(value: ITokenReference | string): Promise<TokenReference> {
        return await super.fromT(value, TokenReference)
    }

    public static async deserialize(value: string): Promise<TokenReference> {
        try {
            return await super.deserializeT(value, TokenReference)
        } catch (e) {
            return await this.from(value)
        }
    }
}
