import { serialize, validate } from "@js-soft/ts-serval"
import { CoreDate, CoreId, CoreSynchronizable, ICoreDate, ICoreSerializableAsync } from "@nmshd/transport"
import { nameof } from "ts-simple-nameof"

export interface IACacheableSynchronizedCollectionItem extends ICoreSerializableAsync {
    id: CoreId

    someTechnicalProperty?: string

    cache?: ICachedACacheableSynchronizedCollectionItem
    cachedAt?: ICoreDate
}

export class ACacheableSynchronizedCollectionItem
    extends CoreSynchronizable
    implements IACacheableSynchronizedCollectionItem
{
    public readonly technicalProperties = [nameof<ACacheableSynchronizedCollectionItem>((r) => r.someTechnicalProperty)]

    @serialize()
    @validate()
    public id: CoreId

    @validate({ nullable: true })
    @serialize()
    public cache?: CachedACacheableSynchronizedCollectionItem

    @validate({ nullable: true })
    @serialize()
    public cachedAt?: CoreDate

    @serialize()
    @validate({ nullable: true })
    public someTechnicalProperty?: string

    public static async from(
        value: IACacheableSynchronizedCollectionItem
    ): Promise<ACacheableSynchronizedCollectionItem> {
        return await super.fromT(value, ACacheableSynchronizedCollectionItem)
    }
}

export interface ICachedACacheableSynchronizedCollectionItem {
    someCacheProperty: string
}

export class CachedACacheableSynchronizedCollectionItem implements ICachedACacheableSynchronizedCollectionItem {
    public someCacheProperty: string
}
