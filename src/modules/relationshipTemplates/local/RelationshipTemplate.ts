import { serialize, type, validate } from "@js-soft/ts-serval"
import { CryptoSecretKey, ICryptoSecretKey } from "@nmshd/crypto"
import { nameof } from "ts-simple-nameof"
import { CoreSynchronizable, ICoreSynchronizable } from "../../../core"
import { CoreDate, ICoreDate } from "../../../core/types/CoreDate"
import { CachedRelationshipTemplate, ICachedRelationshipTemplate } from "./CachedRelationshipTemplate"

export interface IRelationshipTemplate extends ICoreSynchronizable {
    secretKey: ICryptoSecretKey
    isOwn: boolean
    cache?: ICachedRelationshipTemplate
    cachedAt?: ICoreDate
    metadata?: any
    metadataModifiedAt?: ICoreDate
}

@type("RelationshipTemplate")
export class RelationshipTemplate extends CoreSynchronizable implements IRelationshipTemplate {
    public readonly technicalProperties = [
        "@type",
        "@context",
        nameof<RelationshipTemplate>((r) => r.secretKey),
        nameof<RelationshipTemplate>((r) => r.isOwn)
    ]

    public readonly metadataProperties = [
        nameof<RelationshipTemplate>((r) => r.metadata),
        nameof<RelationshipTemplate>((r) => r.metadataModifiedAt)
    ]

    @validate()
    @serialize()
    public secretKey: CryptoSecretKey

    @validate()
    @serialize()
    public isOwn: boolean

    @validate({ nullable: true })
    @serialize()
    public cache?: CachedRelationshipTemplate

    @validate({ nullable: true })
    @serialize()
    public cachedAt?: CoreDate

    @validate({ nullable: true })
    @serialize()
    public metadata?: any

    @validate({ nullable: true })
    @serialize()
    public metadataModifiedAt?: CoreDate

    public static async from(value: IRelationshipTemplate): Promise<RelationshipTemplate> {
        return await super.fromT(value, RelationshipTemplate)
    }

    public static async deserialize(value: string): Promise<RelationshipTemplate> {
        return await super.deserializeT(value, RelationshipTemplate)
    }

    public setCache(cache: CachedRelationshipTemplate): this {
        this.cache = cache
        this.cachedAt = CoreDate.utc()
        return this
    }

    public setMetadata(metadata: any): this {
        this.metadata = metadata
        this.metadataModifiedAt = CoreDate.utc()
        return this
    }
}
