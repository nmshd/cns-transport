import { serialize, type, validate } from "@js-soft/ts-serval"
import { CryptoSecretKey, ICryptoSecretKey } from "@nmshd/crypto"
import { CoreId, CoreSerializableAsync, ICoreId, ICoreSerializableAsync } from "../../../core"

export interface ITokenContentRelationshipTemplate extends ICoreSerializableAsync {
    templateId: ICoreId
    secretKey: ICryptoSecretKey
}

@type("TokenContentRelationshipTemplate")
export class TokenContentRelationshipTemplate
    extends CoreSerializableAsync
    implements ITokenContentRelationshipTemplate
{
    @validate()
    @serialize()
    public templateId: CoreId

    @validate()
    @serialize()
    public secretKey: CryptoSecretKey

    public static async from(value: ITokenContentRelationshipTemplate): Promise<TokenContentRelationshipTemplate> {
        return await super.fromT(value, TokenContentRelationshipTemplate)
    }

    public static async deserialize(value: string): Promise<TokenContentRelationshipTemplate> {
        return await super.deserializeT(value, TokenContentRelationshipTemplate)
    }
}
