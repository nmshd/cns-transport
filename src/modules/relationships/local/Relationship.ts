import { serialize, type, validate } from "@js-soft/ts-serval"
import { nameof } from "ts-simple-nameof"
import { CoreDate, CoreErrors, CoreId, CoreSynchronizable, ICoreId, ICoreSynchronizable } from "../../../core"
import { Identity, IIdentity } from "../../accounts/data/Identity"
import { IRelationshipTemplate } from "../../relationshipTemplates/local/RelationshipTemplate"
import { BackboneGetRelationshipsResponse } from "../backbone/BackboneGetRelationships"
import { IRelationshipChange } from "../transmission/changes/RelationshipChange"
import { RelationshipChangeResponse } from "../transmission/changes/RelationshipChangeResponse"
import { RelationshipStatus } from "../transmission/RelationshipStatus"
import { CachedRelationship } from "./CachedRelationship"

export interface IRelationship extends ICoreSynchronizable {
    relationshipSecretId: ICoreId
    peer: IIdentity
    status: RelationshipStatus

    cache?: CachedRelationship
    cachedAt?: CoreDate

    metadata?: any
    metadataModifiedAt?: CoreDate
}

@type("Relationship")
export class Relationship extends CoreSynchronizable implements IRelationship {
    public readonly technicalProperties = [
        "@type",
        "@context",
        nameof<Relationship>((r) => r.relationshipSecretId),
        nameof<Relationship>((r) => r.peer),
        nameof<Relationship>((r) => r.status)
    ]

    public readonly metadataProperties = [
        nameof<Relationship>((r) => r.metadata),
        nameof<Relationship>((r) => r.metadataModifiedAt)
    ]

    @validate()
    @serialize()
    public relationshipSecretId: CoreId

    @validate()
    @serialize()
    public peer: Identity

    @validate()
    @serialize()
    public status: RelationshipStatus

    @validate({ nullable: true })
    @serialize()
    public cache?: CachedRelationship

    @validate({ nullable: true })
    @serialize()
    public cachedAt?: CoreDate

    @validate({ nullable: true })
    @serialize()
    public metadata?: any

    @validate({ nullable: true })
    @serialize()
    public metadataModifiedAt?: CoreDate

    public static async fromRequestSent(
        id: CoreId,
        template: IRelationshipTemplate,
        peer: IIdentity,
        creationChange: IRelationshipChange,
        relationshipSecretId: CoreId
    ): Promise<Relationship> {
        const cache = await CachedRelationship.from({
            changes: [creationChange],
            template: template
        })
        return await Relationship.from({
            id: id,
            peer: peer,
            status: RelationshipStatus.Pending,
            cache: cache,
            cachedAt: CoreDate.utc(),
            relationshipSecretId: relationshipSecretId
        })
    }

    public static async fromCreationChangeReceived(
        response: BackboneGetRelationshipsResponse,
        template: IRelationshipTemplate,
        peer: IIdentity,
        creationChange: IRelationshipChange,
        relationshipSecretId: CoreId
    ): Promise<Relationship> {
        const cache = await CachedRelationship.from({
            changes: [creationChange],
            template: template
        })
        return await Relationship.from({
            id: CoreId.from(response.id),
            relationshipSecretId: relationshipSecretId,
            peer: peer,
            status: RelationshipStatus.Pending,
            cache: cache,
            cachedAt: CoreDate.utc()
        })
    }

    public toActive(response: RelationshipChangeResponse): void {
        if (!this.cache) {
            throw CoreErrors.general.cacheEmpty(Relationship, this.id.toString())
        }

        this.cache.changes[0].response = response
        this.status = RelationshipStatus.Active
    }

    public toRejected(response: RelationshipChangeResponse): void {
        if (!this.cache) {
            throw CoreErrors.general.cacheEmpty(Relationship, this.id.toString())
        }

        this.cache.changes[0].response = response
        this.status = RelationshipStatus.Rejected
    }

    public toRevoked(response: RelationshipChangeResponse): void {
        if (!this.cache) {
            throw CoreErrors.general.cacheEmpty(Relationship, this.id.toString())
        }

        this.cache.changes[0].response = response
        this.status = RelationshipStatus.Revoked
    }

    public static async from(value: IRelationship): Promise<Relationship> {
        return await super.fromT(value, Relationship)
    }

    public static async deserialize(value: string): Promise<Relationship> {
        return await super.deserializeT(value, Relationship)
    }

    public setCache(cache: CachedRelationship): this {
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
