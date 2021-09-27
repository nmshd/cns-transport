import { serialize, type, validate } from "@js-soft/ts-serval"
import { CryptoSecretKey, ICryptoSecretKey } from "@nmshd/crypto"
import { CoreDate, CoreHash, CoreSerializableAsync, ICoreDate, ICoreHash, ICoreSerializableAsync } from "../../../core"

export interface IFileMetadata extends ICoreSerializableAsync {
    title?: string
    description?: string
    filename: string

    plaintextHash: ICoreHash
    secretKey: ICryptoSecretKey

    filesize: number
    filemodified?: ICoreDate
    mimetype: string
}

@type("FileMetadata")
export class FileMetadata extends CoreSerializableAsync implements IFileMetadata {
    @validate({ nullable: true })
    @serialize()
    public title?: string

    @validate({ nullable: true })
    @serialize()
    public description?: string

    @validate()
    @serialize()
    public filename: string

    @validate()
    @serialize()
    public plaintextHash: CoreHash

    @validate()
    @serialize()
    public secretKey: CryptoSecretKey

    @validate()
    @serialize()
    public filesize: number

    @validate({ nullable: true })
    @serialize()
    public filemodified?: CoreDate

    @validate()
    @serialize()
    public mimetype: string

    public static async from(value: IFileMetadata): Promise<FileMetadata> {
        return await super.fromT(value, FileMetadata)
    }

    public static async deserialize(value: string): Promise<FileMetadata> {
        return await super.deserializeT(value, FileMetadata)
    }
}
