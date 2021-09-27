import { serialize, type, validate } from "@js-soft/ts-serval"
import { CryptoSecretKey, ICryptoSecretKey } from "@nmshd/crypto"
import { nameof } from "ts-simple-nameof"
import { CoreDate, CoreSynchronizable, ICoreDate, ICoreSynchronizable } from "../../../core"
import { TokenReference } from "../transmission/TokenReference"
import { CachedToken, ICachedToken } from "./CachedToken"

export interface IToken extends ICoreSynchronizable {
    secretKey: ICryptoSecretKey
    isOwn: boolean
    cache?: ICachedToken
    cachedAt?: ICoreDate
    metadata?: any
    metadataModifiedAt?: ICoreDate
}

@type("Token")
export class Token extends CoreSynchronizable implements IToken {
    public readonly technicalProperties = [
        "@type",
        "@context",
        nameof<Token>((r) => r.secretKey),
        nameof<Token>((r) => r.isOwn)
    ]

    public readonly metadataProperties = [nameof<Token>((r) => r.metadata), nameof<Token>((r) => r.metadataModifiedAt)]

    @validate()
    @serialize()
    public secretKey: CryptoSecretKey

    @validate()
    @serialize()
    public isOwn: boolean

    @validate({ nullable: true })
    @serialize()
    public cache?: CachedToken

    @validate({ nullable: true })
    @serialize()
    public cachedAt?: CoreDate

    @validate({ nullable: true })
    @serialize()
    public metadata?: any

    @validate({ nullable: true })
    @serialize()
    public metadataModifiedAt?: CoreDate

    public static async from(value: IToken): Promise<Token> {
        return await super.fromT(value, Token)
    }

    public static async deserialize(value: string): Promise<Token> {
        return await super.deserializeT(value, Token)
    }

    public async toTokenReference(): Promise<TokenReference> {
        return await TokenReference.from({
            id: this.id,
            key: this.secretKey
        })
    }

    public async truncate(): Promise<string> {
        const tokenReference = await this.toTokenReference()
        return tokenReference.truncate()
    }

    public setCache(cache: CachedToken): this {
        this.cache = cache
        this.cachedAt = CoreDate.utc()
        return this
    }

    public setMetadata(metadata: any): void {
        this.metadata = metadata
        this.metadataModifiedAt = CoreDate.utc()
    }
}
