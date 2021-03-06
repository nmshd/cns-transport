import { serialize, type, validate } from "@js-soft/ts-serval"
import { CryptoSecretKey, ICryptoSecretKey } from "@nmshd/crypto"
import { nameof } from "ts-simple-nameof"
import { CoreDate, CoreSynchronizable, ICoreDate, ICoreSynchronizable } from "../../../core"
import { FileReference } from "../transmission/FileReference"
import { CachedFile, ICachedFile } from "./CachedFile"

export interface IFile extends ICoreSynchronizable {
    secretKey: ICryptoSecretKey
    isOwn: boolean
    cache?: ICachedFile
    cachedAt?: ICoreDate
    metadata?: any
    metadataModifiedAt?: ICoreDate
}

@type("File")
export class File extends CoreSynchronizable implements IFile {
    public readonly technicalProperties = [
        "@type",
        "@context",
        nameof<File>((r) => r.secretKey),
        nameof<File>((r) => r.isOwn)
    ]
    public readonly metadataProperties = [nameof<File>((r) => r.metadata), nameof<File>((r) => r.metadataModifiedAt)]

    @validate()
    @serialize()
    public secretKey: CryptoSecretKey

    @validate()
    @serialize()
    public isOwn: boolean

    @validate({ nullable: true })
    @serialize()
    public cache?: CachedFile

    @validate({ nullable: true })
    @serialize()
    public cachedAt?: CoreDate

    @validate({ nullable: true })
    @serialize()
    public metadata?: any

    @validate({ nullable: true })
    @serialize()
    public metadataModifiedAt?: CoreDate

    public static async from(value: IFile): Promise<File> {
        return await super.fromT(value, File)
    }

    public static async deserialize(value: string): Promise<File> {
        return await super.deserializeT(value, File)
    }

    public async toFileReference(): Promise<FileReference> {
        return await FileReference.from({
            id: this.id,
            key: this.secretKey
        })
    }

    public setCache(cache: CachedFile): this {
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
