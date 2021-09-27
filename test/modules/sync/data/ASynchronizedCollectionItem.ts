import { serialize, validate } from "@js-soft/ts-serval"
import { CoreId, CoreSynchronizable, ICoreSerializableAsync } from "@nmshd/transport"
import { nameof } from "ts-simple-nameof"

export interface IASynchronizedCollectionItem extends ICoreSerializableAsync {
    id: CoreId

    someTechnicalStringProperty?: string
    someTechnicalNumberProperty?: number
    someTechnicalBooleanProperty?: boolean

    someUserdataStringProperty?: string
    someUserdataNumberProperty?: number
    someUserdataBooleanProperty?: boolean

    someMetadataStringProperty?: string
    someMetadataNumberProperty?: number
    someMetadataBooleanProperty?: boolean
}

export class ASynchronizedCollectionItem extends CoreSynchronizable implements IASynchronizedCollectionItem {
    public readonly technicalProperties = [
        nameof<ASynchronizedCollectionItem>((r) => r.someTechnicalStringProperty),
        nameof<ASynchronizedCollectionItem>((r) => r.someTechnicalNumberProperty),
        nameof<ASynchronizedCollectionItem>((r) => r.someTechnicalBooleanProperty)
    ]

    public readonly userdataProperties = [
        nameof<ASynchronizedCollectionItem>((r) => r.someUserdataStringProperty),
        nameof<ASynchronizedCollectionItem>((r) => r.someUserdataNumberProperty),
        nameof<ASynchronizedCollectionItem>((r) => r.someUserdataBooleanProperty)
    ]

    public readonly metadataProperties = [
        nameof<ASynchronizedCollectionItem>((r) => r.someMetadataStringProperty),
        nameof<ASynchronizedCollectionItem>((r) => r.someMetadataNumberProperty),
        nameof<ASynchronizedCollectionItem>((r) => r.someMetadataBooleanProperty)
    ]

    @serialize()
    @validate()
    public id: CoreId

    @serialize()
    @validate({ nullable: true })
    public someTechnicalStringProperty?: string
    @serialize()
    @validate({ nullable: true })
    public someTechnicalNumberProperty?: number
    @serialize()
    @validate({ nullable: true })
    public someTechnicalBooleanProperty?: boolean

    @serialize()
    @validate({ nullable: true })
    public someUserdataStringProperty?: string
    @serialize()
    @validate({ nullable: true })
    public someUserdataNumberProperty?: number
    @serialize()
    @validate({ nullable: true })
    public someUserdataBooleanProperty?: boolean

    @serialize()
    @validate({ nullable: true })
    public someMetadataStringProperty?: string
    @serialize()
    @validate({ nullable: true })
    public someMetadataNumberProperty?: number
    @serialize()
    @validate({ nullable: true })
    public someMetadataBooleanProperty?: boolean

    public static async from(value: IASynchronizedCollectionItem): Promise<ASynchronizedCollectionItem> {
        return await super.fromT(value, ASynchronizedCollectionItem)
    }
}
