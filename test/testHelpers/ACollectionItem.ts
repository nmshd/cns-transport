import { serialize, type, validate } from "@js-soft/ts-serval"
import { CoreId, CoreSerializable, ICoreSerializable } from "@nmshd/transport"
import { nameof } from "ts-simple-nameof"

export interface IACollectionItem extends ICoreSerializable {
    id: CoreId

    someTechnicalStringProperty?: string

    someUserdataStringProperty?: string

    someMetadataStringProperty?: string
}

@type("ACollectionItem")
export class ACollectionItem extends CoreSerializable implements IACollectionItem {
    public readonly technicalProperties = [
        nameof<ACollectionItem>((r) => r.someTechnicalStringProperty),
        "@type",
        "@context"
    ]
    public readonly userdataProperties = [nameof<ACollectionItem>((r) => r.someUserdataStringProperty)]
    public readonly metadataProperties = [nameof<ACollectionItem>((r) => r.someMetadataStringProperty)]

    @serialize()
    @validate()
    public id: CoreId

    @serialize()
    @validate({ nullable: true })
    public someTechnicalStringProperty?: string

    @serialize()
    @validate({ nullable: true })
    public someUserdataStringProperty?: string

    @serialize()
    @validate({ nullable: true })
    public someMetadataStringProperty?: string

    public static from(value: IACollectionItem): ACollectionItem {
        return this.fromAny(value)
    }
}
