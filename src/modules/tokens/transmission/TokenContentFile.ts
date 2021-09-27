import { serialize, type, validate } from "@js-soft/ts-serval"
import { CryptoSecretKey, ICryptoSecretKey } from "@nmshd/crypto"
import { CoreId, CoreSerializableAsync, ICoreId, ICoreSerializableAsync } from "../../../core"

export interface ITokenContentFile extends ICoreSerializableAsync {
    fileId: ICoreId
    secretKey: ICryptoSecretKey
}

@type("TokenContentFile")
export class TokenContentFile extends CoreSerializableAsync implements ITokenContentFile {
    @validate()
    @serialize()
    public fileId: CoreId

    @validate()
    @serialize()
    public secretKey: CryptoSecretKey

    public static async from(value: ITokenContentFile): Promise<TokenContentFile> {
        return await super.fromT(value, TokenContentFile)
    }

    public static async deserialize(value: string): Promise<TokenContentFile> {
        return await super.deserializeT(value, TokenContentFile)
    }
}
