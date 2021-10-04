import { ISerializableAsync } from "@js-soft/ts-serval"
import {
    CoreBuffer,
    CryptoCipher,
    CryptoHash,
    CryptoHashAlgorithm,
    CryptoSecretKey,
    CryptoSignature,
    Encoding
} from "@nmshd/crypto"
import { CoreAddress, CoreCrypto, CoreDate, CoreHash, CoreId, TransportErrors } from "../../core"
import { DbCollectionName } from "../../core/DbCollectionName"
import { ControllerName, TransportController } from "../../core/TransportController"
import { AccountController } from "../accounts/AccountController"
import { SynchronizedCollection } from "../sync/SynchronizedCollection"
import { BackboneGetFilesResponse } from "./backbone/BackboneGetFiles"
import { BackbonePostFilesResponse } from "./backbone/BackbonePostFiles"
import { FileClient } from "./backbone/FileClient"
import { CachedFile } from "./local/CachedFile"
import { File } from "./local/File"
import { ISendFileParameters, SendFileParameters } from "./local/SendFileParameters"
import { FileMetadata } from "./transmission/FileMetadata"
import { FileReference } from "./transmission/FileReference"

export class FileController extends TransportController {
    private client: FileClient
    private files: SynchronizedCollection

    public constructor(parent: AccountController) {
        super(ControllerName.File, parent)
    }

    public async init(): Promise<this> {
        await super.init()

        this.client = new FileClient(this.config, this.parent.authenticator)
        this.files = await this.parent.getSynchronizedCollection(DbCollectionName.Files)
        return this
    }

    public async getFiles(query?: any): Promise<File[]> {
        const files = await this.files.find(query)
        return await this.parseArray<File>(files, File)
    }

    public async getFile(id: CoreId): Promise<File | undefined> {
        const doc = await this.files.read(id.toString())
        return doc ? await File.from(doc) : undefined
    }

    public async fetchCaches(ids: CoreId[]): Promise<CachedFile[]> {
        if (ids.length === 0) return []

        const backboneFiles = await (await this.client.getFiles({ ids: ids.map((id) => id.id) })).value.collect()

        const orderedBackboneFiles: BackboneGetFilesResponse[] = []
        for (const id of ids) {
            orderedBackboneFiles.push(backboneFiles.find((f) => f.id === id.id)!)
        }

        const decryptionPromises = orderedBackboneFiles.map(async (r) => {
            const fileDoc = await this.files.read(r.id)
            const file = await File.from(fileDoc)

            return await this.decryptFile(r, file.secretKey)
        })

        return await Promise.all(decryptionPromises)
    }

    public async updateCache(ids: string[]): Promise<File[]> {
        const resultItems = (await this.client.getFiles({ ids })).value
        const promises = []
        for await (const resultItem of resultItems) {
            promises.push(this.updateCacheOfExistingFileInDb(resultItem.id, resultItem))
        }

        return await Promise.all(promises)
    }

    private async updateCacheOfExistingFileInDb(id: string, response?: BackboneGetFilesResponse) {
        const fileDoc = await this.files.read(id)
        if (!fileDoc) {
            throw TransportErrors.general.recordNotFound(File, id).logWith(this._log)
        }

        const file = await File.from(fileDoc)

        await this.updateCacheOfFile(file, response)
        await this.files.update(fileDoc, file)
        return file
    }

    private async updateCacheOfFile(file: File, response?: BackboneGetFilesResponse) {
        const fileId = file.id.toString()
        if (!response) {
            response = (await this.client.getFile(fileId)).value
        }

        const cachedFile = await this.decryptFile(response, file.secretKey)
        file.setCache(cachedFile)

        // Update isOwn, as it is possible that the identity receives an attachment with an own File.
        file.isOwn = this.parent.identity.isMe(cachedFile.createdBy)
    }

    private async decryptFile(response: BackboneGetFilesResponse, secretKey: CryptoSecretKey) {
        const cipher = await CryptoCipher.fromBase64(response.encryptedProperties)
        const plaintextMetadataBuffer = await CoreCrypto.decrypt(cipher, secretKey)
        const plaintextMetadata: FileMetadata = await FileMetadata.deserialize(plaintextMetadataBuffer.toUtf8())

        if (!(plaintextMetadata instanceof FileMetadata)) {
            throw TransportErrors.files.invalidMetadata(response.id).logWith(this._log)
        }

        // TODO: JSSNMSHDD-2486 (check signature)
        const cachedFile = await CachedFile.fromBackbone(response, plaintextMetadata)
        return cachedFile
    }

    public async loadPeerFileByTruncated(truncated: string): Promise<File> {
        const reference = await FileReference.fromTruncated(truncated)
        return await this.loadPeerFileByReference(reference)
    }

    public async loadPeerFileByReference(fileReference: FileReference): Promise<File> {
        return await this.loadPeerFile(fileReference.id, fileReference.key)
    }

    public async loadPeerFile(id: CoreId, secretKey: CryptoSecretKey): Promise<File> {
        const fileDoc = await this.files.read(id.toString())
        if (fileDoc) {
            return await this.updateCacheOfExistingFileInDb(id.toString())
        }

        const file = await File.from({
            id: id,
            secretKey: secretKey,
            isOwn: false
        })

        await this.updateCacheOfFile(file)
        await this.files.create(file)
        return file
    }

    public async setFileMetadata(idOrFile: CoreId | File, metadata: ISerializableAsync): Promise<File> {
        const id = idOrFile instanceof CoreId ? idOrFile.toString() : idOrFile.id.toString()
        const fileDoc = await this.files.read(id)
        if (!fileDoc) {
            throw TransportErrors.general.recordNotFound(File, id.toString()).logWith(this._log)
        }

        const file = await File.from(fileDoc)
        file.setMetadata(metadata)
        await this.files.update(fileDoc, file)
        return file
    }

    public async sendFile(parameters: ISendFileParameters): Promise<File> {
        const input = await SendFileParameters.from(parameters)

        const content = input.buffer
        const fileSize = content.length

        if (fileSize > this.config.platformMaxUnencryptedFileSize) {
            throw TransportErrors.files.maxFileSizeExceeded(fileSize, this.config.platformMaxUnencryptedFileSize)
        }

        const plaintextHashBuffer: CoreBuffer = await CryptoHash.hash(content, CryptoHashAlgorithm.SHA512)
        const plaintextHash: CoreHash = CoreHash.from(plaintextHashBuffer.toBase64URL())

        const signature: CryptoSignature = await this.parent.activeDevice.sign(plaintextHashBuffer)
        const signatureB64: string = signature.toBase64()

        const fileDownloadSecretKey: CryptoSecretKey = await CoreCrypto.generateSecretKey()
        const cipher: CryptoCipher = await CoreCrypto.encrypt(content, fileDownloadSecretKey)
        const cipherBuffer: CoreBuffer = CoreBuffer.fromBase64URL(cipher.toBase64())
        const cipherHash: CoreBuffer = await CryptoHash.hash(cipherBuffer, CryptoHashAlgorithm.SHA512)
        const cipherCoreHash: CoreHash = CoreHash.from(cipherHash.toBase64URL())

        const metadata: FileMetadata = await FileMetadata.from({
            title: input.title,
            description: input.description,
            filename: input.filename,
            filesize: fileSize,
            plaintextHash: plaintextHash,
            secretKey: fileDownloadSecretKey,
            filemodified: input.filemodified,
            mimetype: input.mimetype
        })

        const serializedMetadata: string = metadata.serialize()

        const metadataBuffer: CoreBuffer = CoreBuffer.fromString(serializedMetadata, Encoding.Utf8)
        const metadataKey: CryptoSecretKey = await CoreCrypto.generateSecretKey()
        const metadataCipher: CryptoCipher = await CoreCrypto.encrypt(metadataBuffer, metadataKey)

        const owner: CoreAddress = this.parent.identity.address

        const response: BackbonePostFilesResponse = (
            await this.client.createFile({
                content: cipherBuffer.buffer,
                cipherHash: cipherHash.toBase64URL(),
                owner: owner.toString(),
                ownerSignature: signatureB64,
                expiresAt: input.expiresAt.toString(),
                encryptedProperties: metadataCipher.toBase64()
            })
        ).value

        const cachedFile: CachedFile = await CachedFile.from({
            title: input.title,
            description: input.description,
            filename: input.filename,
            filesize: fileSize,
            filemodified: input.filemodified,
            cipherKey: fileDownloadSecretKey,
            cipherHash: cipherCoreHash,
            createdAt: CoreDate.from(response.createdAt),
            createdBy: CoreAddress.from(response.createdBy),
            createdByDevice: CoreId.from(response.createdByDevice),
            expiresAt: CoreDate.from(response.expiresAt),
            mimetype: input.mimetype,
            owner: CoreAddress.from(response.owner),
            ownerSignature: signature,
            plaintextHash: plaintextHash
        })

        const file: File = await File.from({
            id: CoreId.from(response.id),
            secretKey: metadataKey,
            isOwn: true
        })
        file.setCache(cachedFile)

        await this.files.create(file)

        return file
    }

    public async downloadFileContent(idOrFile: CoreId | File): Promise<CoreBuffer> {
        const file = idOrFile instanceof File ? idOrFile : await this.getFile(idOrFile)
        if (!file) {
            throw TransportErrors.general.recordNotFound(File, idOrFile.toString()).logWith(this._log)
        }

        if (!file.cache) {
            throw TransportErrors.general.cacheEmpty(File, file.id.toString()).logWith(this._log)
        }

        const downloadResponse = (await this.client.downloadFile(file.id.toString())).value
        const buffer: CoreBuffer = CoreBuffer.fromObject(downloadResponse)

        const hash = await CryptoHash.hash(buffer, CryptoHashAlgorithm.SHA512)
        const hashb64 = hash.toBase64URL()

        if (hashb64 !== file.cache.cipherHash.hash) {
            throw TransportErrors.files.cipherMismatch().logWith(this._log)
        }
        /*
        // TODO: JSSNMSHDD-2486 (verify owner signature)
        const valid = await Crypto.verify(parcel.cipher.cipher, parcel.ownerSignature, owner.signing)
        if (!valid) {
            throw CoreErrors.General.SignatureNotValid("file").logWith(this._log)
        }
        */

        const cipher: CryptoCipher = await CryptoCipher.fromBase64(buffer.toBase64URL())
        const decrypt = await CoreCrypto.decrypt(cipher, file.cache.cipherKey)
        const plaintextHashesMatch = await file.cache.plaintextHash.verify(decrypt, CryptoHashAlgorithm.SHA512)

        if (!plaintextHashesMatch) {
            throw TransportErrors.files.plaintextHashMismatch().logWith(this._log)
        }

        return decrypt
    }
}
