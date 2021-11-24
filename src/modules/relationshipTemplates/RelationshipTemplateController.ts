import { ISerializableAsync } from "@js-soft/ts-serval"
import { CoreBuffer, CryptoCipher, CryptoSecretKey, CryptoSignature } from "@nmshd/crypto"
import { CoreAddress, CoreCrypto, CoreDate, CoreId, TransportErrors } from "../../core"
import { DbCollectionName } from "../../core/DbCollectionName"
import { ControllerName, TransportController } from "../../core/TransportController"
import { AccountController } from "../accounts/AccountController"
import { RelationshipSecretController } from "../relationships/RelationshipSecretController"
import { SynchronizedCollection } from "../sync/SynchronizedCollection"
import { BackboneGetRelationshipTemplatesResponse } from "./backbone/BackboneGetRelationshipTemplates"
import { RelationshipTemplateClient } from "./backbone/RelationshipTemplateClient"
import { CachedRelationshipTemplate } from "./local/CachedRelationshipTemplate"
import { RelationshipTemplate } from "./local/RelationshipTemplate"
import {
    ISendRelationshipTemplateParameters,
    SendRelationshipTemplateParameters
} from "./local/SendRelationshipTemplateParameters"
import { RelationshipTemplateContent } from "./transmission/RelationshipTemplateContent"
import { RelationshipTemplateSigned } from "./transmission/RelationshipTemplateSigned"

export class RelationshipTemplateController extends TransportController {
    protected readonly client: RelationshipTemplateClient
    protected templates: SynchronizedCollection
    protected readonly secrets: RelationshipSecretController

    public constructor(
        parent: AccountController,
        secrets: RelationshipSecretController,
        controllerName?: ControllerName
    ) {
        super(controllerName ? controllerName : ControllerName.RelationshipTemplate, parent)
        this.secrets = secrets
        this.client = new RelationshipTemplateClient(this.config, this.parent.authenticator)
    }

    public async init(): Promise<this> {
        await super.init()

        this.templates = await this.parent.getSynchronizedCollection(DbCollectionName.RelationshipTemplates)

        return this
    }

    public async sendRelationshipTemplate(
        parameters: ISendRelationshipTemplateParameters
    ): Promise<RelationshipTemplate> {
        parameters = await SendRelationshipTemplateParameters.from(parameters)
        const templateKey = await this.secrets.createTemplateKey()

        const templateContent = await RelationshipTemplateContent.from({
            content: parameters.content,
            identity: this.parent.identity.identity,
            templateKey: templateKey
        })

        const secretKey: CryptoSecretKey = await CoreCrypto.generateSecretKey()
        const serializedTemplate: string = templateContent.serialize()
        const serializedTemplateBuffer: CoreBuffer = CoreBuffer.fromUtf8(serializedTemplate)

        const signature: CryptoSignature = await this.parent.identity.sign(serializedTemplateBuffer)
        const signedTemplate = await RelationshipTemplateSigned.from({
            deviceSignature: signature,
            serializedTemplate: serializedTemplate
        })
        const signedTemplateBuffer = CoreBuffer.fromUtf8(signedTemplate.serialize())

        const cipher: CryptoCipher = await CoreCrypto.encrypt(signedTemplateBuffer, secretKey)

        const backboneResponse = (
            await this.client.createRelationshipTemplate({
                expiresAt: parameters.expiresAt.toString(),
                maxNumberOfRelationships: parameters.maxNumberOfRelationships,
                content: cipher.toBase64()
            })
        ).value

        const templateCache = await CachedRelationshipTemplate.from({
            content: parameters.content,
            createdAt: CoreDate.from(backboneResponse.createdAt),
            createdBy: this.parent.identity.address,
            createdByDevice: this.parent.activeDevice.id,
            expiresAt: parameters.expiresAt,
            identity: this.parent.identity.identity,
            maxNumberOfRelationships: parameters.maxNumberOfRelationships ?? undefined,
            templateKey: templateKey
        })

        const template = await RelationshipTemplate.from({
            id: CoreId.from(backboneResponse.id),
            secretKey: secretKey,
            isOwn: true,
            cache: templateCache,
            cachedAt: CoreDate.utc()
        })

        await this.templates.create(template)

        return template
    }

    public async deleteRelationshipTemplate(template: RelationshipTemplate): Promise<void> {
        await this.client.deleteRelationshipTemplate(template.id.toString())
        await this.templates.delete(template)
    }

    public async getRelationshipTemplates(query?: any): Promise<RelationshipTemplate[]> {
        const templateDocs = await this.templates.find(query)
        return await this.parseArray<RelationshipTemplate>(templateDocs, RelationshipTemplate)
    }

    public async updateCache(ids: string[]): Promise<RelationshipTemplate[]> {
        const resultItems = (await this.client.getRelationshipTemplates({ ids })).value
        const promises = []
        for await (const resultItem of resultItems) {
            promises.push(this.updateCacheOfExistingTemplateInDb(resultItem.id, resultItem))
        }
        return await Promise.all(promises)
    }

    public async fetchCaches(ids: CoreId[]): Promise<{ id: CoreId; cache: CachedRelationshipTemplate }[]> {
        if (ids.length === 0) return []

        const backboneRelationships = await (
            await this.client.getRelationshipTemplates({ ids: ids.map((id) => id.id) })
        ).value.collect()

        const decryptionPromises = backboneRelationships.map(async (t) => {
            const templateDoc = await this.templates.read(t.id)
            const template = await RelationshipTemplate.from(templateDoc)

            return { id: CoreId.from(t.id), cache: await this.decryptRelationshipTemplate(t, template.secretKey) }
        })

        return await Promise.all(decryptionPromises)
    }

    private async updateCacheOfExistingTemplateInDb(id: string, response?: BackboneGetRelationshipTemplatesResponse) {
        const templateDoc = await this.templates.read(id)
        if (!templateDoc) {
            throw TransportErrors.general.recordNotFound(RelationshipTemplate, id).logWith(this._log)
        }

        const template = await RelationshipTemplate.from(templateDoc)

        await this.updateCacheOfTemplate(template, response)
        await this.templates.update(templateDoc, template)
        return template
    }

    private async updateCacheOfTemplate(
        template: RelationshipTemplate,
        response?: BackboneGetRelationshipTemplatesResponse
    ) {
        if (!response) {
            response = (await this.client.getRelationshipTemplate(template.id.toString())).value
        }

        const cachedTemplate = await this.decryptRelationshipTemplate(response, template.secretKey)
        template.setCache(cachedTemplate)

        // Update isOwn, as it is possible that the identity receives an own template.
        template.isOwn = this.parent.identity.isMe(cachedTemplate.createdBy)
    }

    private async decryptRelationshipTemplate(
        response: BackboneGetRelationshipTemplatesResponse,
        secretKey: CryptoSecretKey
    ) {
        const cipher: CryptoCipher = await CryptoCipher.fromBase64(response.content)
        const signedTemplateBuffer: CoreBuffer = await this.secrets.decryptTemplate(cipher, secretKey)

        const signedTemplate = await RelationshipTemplateSigned.deserialize(signedTemplateBuffer.toUtf8())
        const templateContent = await RelationshipTemplateContent.deserialize(signedTemplate.serializedTemplate)

        const templateSignatureValid = await this.secrets.verifyTemplate(
            CoreBuffer.fromUtf8(signedTemplate.serializedTemplate),
            signedTemplate.deviceSignature,
            templateContent.identity.publicKey
        )

        if (!templateSignatureValid) {
            throw TransportErrors.general.signatureNotValid("template").logWith(this._log)
        }

        const cachedTemplate = await CachedRelationshipTemplate.from({
            content: templateContent.content,
            createdBy: CoreAddress.from(response.createdBy),
            createdByDevice: CoreId.from(response.createdByDevice),
            createdAt: CoreDate.from(response.createdAt),
            expiresAt: response.expiresAt ? CoreDate.from(response.expiresAt) : undefined,
            identity: templateContent.identity,
            maxNumberOfRelationships: response.maxNumberOfRelationships ?? undefined,
            templateKey: templateContent.templateKey
        })

        return cachedTemplate
    }

    public async getRelationshipTemplate(id: CoreId): Promise<RelationshipTemplate | undefined> {
        const templateDoc = await this.templates.read(id.toString())
        if (!templateDoc) {
            return
        }
        return await RelationshipTemplate.from(templateDoc)
    }

    public async setRelationshipTemplateMetadata(
        idOrTemplate: CoreId | RelationshipTemplate,
        metadata: ISerializableAsync
    ): Promise<RelationshipTemplate> {
        const id = idOrTemplate instanceof CoreId ? idOrTemplate.toString() : idOrTemplate.id.toString()
        const templateDoc = await this.templates.read(id)
        if (!templateDoc) {
            throw TransportErrors.general.recordNotFound(RelationshipTemplate, id.toString()).logWith(this._log)
        }

        const template = await RelationshipTemplate.from(templateDoc)
        template.setMetadata(metadata)
        await this.templates.update(templateDoc, template)

        return template
    }

    public async loadPeerRelationshipTemplate(id: CoreId, secretKey: CryptoSecretKey): Promise<RelationshipTemplate> {
        const templateDoc = await this.templates.read(id.toString())
        if (templateDoc) {
            return await this.updateCacheOfExistingTemplateInDb(id.toString())
        }

        const relationshipTemplate = await RelationshipTemplate.from({
            id: id,
            secretKey: secretKey,
            isOwn: false
        })
        await this.updateCacheOfTemplate(relationshipTemplate)

        await this.templates.create(relationshipTemplate)

        return relationshipTemplate
    }
}
