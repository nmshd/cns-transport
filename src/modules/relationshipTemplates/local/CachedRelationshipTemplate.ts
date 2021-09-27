import { ISerializableAsync, SerializableAsync, serialize, type, validate } from "@js-soft/ts-serval"
import { ICryptoExchangePublicKey } from "@nmshd/crypto"
import {
    CoreAddress,
    CoreDate,
    CoreSerializableAsync,
    ICoreAddress,
    ICoreDate,
    ICoreSerializableAsync
} from "../../../core"
import { CoreId, ICoreId } from "../../../core/types/CoreId"
import { Identity, IIdentity } from "../../accounts/data/Identity"
import { RelationshipTemplatePublicKey } from "../transmission/RelationshipTemplatePublicKey"

export interface ICachedRelationshipTemplate extends ICoreSerializableAsync {
    identity: IIdentity
    createdBy: ICoreAddress
    createdByDevice: ICoreId
    content: ISerializableAsync
    createdAt: ICoreDate
    expiresAt?: ICoreDate
    maxNumberOfRelationships?: number
    templateKey: ICryptoExchangePublicKey
}

@type("CachedRelationshipTemplate")
export class CachedRelationshipTemplate extends CoreSerializableAsync implements ICachedRelationshipTemplate {
    @validate()
    @serialize()
    public identity: Identity

    @validate()
    @serialize()
    public createdBy: CoreAddress

    @validate()
    @serialize()
    public createdByDevice: CoreId

    @validate()
    @serialize()
    public templateKey: RelationshipTemplatePublicKey

    @validate()
    @serialize()
    public content: SerializableAsync

    @validate()
    @serialize()
    public createdAt: CoreDate

    @validate({ nullable: true })
    @serialize()
    public expiresAt?: CoreDate

    @validate({ nullable: true, customValidator: CachedRelationshipTemplate.validateMaxNumberOfRelationships })
    @serialize()
    public maxNumberOfRelationships?: number

    public static async from(value: ICachedRelationshipTemplate): Promise<CachedRelationshipTemplate> {
        return await super.fromT(value, CachedRelationshipTemplate)
    }

    public static async deserialize(value: string): Promise<CachedRelationshipTemplate> {
        return await super.deserializeT(value, CachedRelationshipTemplate)
    }

    public static validateMaxNumberOfRelationships(value?: number): string {
        if (value === undefined) {
            return ""
        }

        if (value <= 0) {
            return "maxNumberOfRelationships must be greater than 0"
        }

        return ""
    }
}
