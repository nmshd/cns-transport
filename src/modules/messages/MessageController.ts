import { ISerializableAsync } from "@js-soft/ts-serval"
import { CoreBuffer, CryptoCipher, CryptoSecretKey, ICryptoSignature } from "@nmshd/crypto"
import { nameof } from "ts-simple-nameof"
import { CoreAddress, CoreCrypto, CoreDate, CoreId, ICoreAddress, TransportErrors } from "../../core"
import { ControllerName, CoreController } from "../../core/CoreController"
import { DbCollectionNames } from "../../core/DbCollectionNames"
import { AccountController } from "../accounts/AccountController"
import { File } from "../files/local/File"
import { FileReference } from "../files/transmission/FileReference"
import { Relationship } from "../relationships/local/Relationship"
import { RelationshipsController } from "../relationships/RelationshipsController"
import { RelationshipSecretController } from "../relationships/RelationshipSecretController"
import { SynchronizedCollection } from "../sync/SynchronizedCollection"
import { BackboneGetMessagesResponse } from "./backbone/BackboneGetMessages"
import { BackbonePostMessagesRecipientRequest } from "./backbone/BackbonePostMessages"
import { MessageClient } from "./backbone/MessageClient"
import { CachedMessage } from "./local/CachedMessage"
import { Message } from "./local/Message"
import { ISendMessageParameters, SendMessageParameters } from "./local/SendMessageParameters"
import { MessageEnvelope } from "./transmission/MessageEnvelope"
import { MessageEnvelopeRecipient } from "./transmission/MessageEnvelopeRecipient"
import { MessagePlain } from "./transmission/MessagePlain"
import { MessageSignature } from "./transmission/MessageSignature"
import { MessageSigned } from "./transmission/MessageSigned"

export class MessageController extends CoreController {
    private client: MessageClient
    private messages: SynchronizedCollection

    private readonly relationships: RelationshipsController
    private secrets: RelationshipSecretController

    public constructor(parent: AccountController) {
        super(ControllerName.Message, parent)

        this.relationships = parent.relationships
    }

    public async init(): Promise<this> {
        await super.init()

        this.secrets = new RelationshipSecretController(this.parent)
        await this.secrets.init()

        this.client = new MessageClient(this.config, this.parent.authenticator)
        this.messages = await this.parent.getSynchronizedCollection(DbCollectionNames.Messages)
        return this
    }

    public async getMessages(query?: any): Promise<Message[]> {
        const messages = await this.messages.find(query)
        return await this.parseArray<Message>(messages, Message)
    }

    public async getMessagesByRelationshipId(id: CoreId): Promise<Message[]> {
        return await this.getMessages({
            [nameof<Message>((m) => m.relationshipIds)]: {
                $contains: id.toString()
            }
        })
    }

    public async getMessagesByAddress(address: CoreAddress): Promise<Message[]> {
        const relationship = await this.parent.relationships.getActiveRelationshipToIdentity(address)
        if (!relationship) {
            throw TransportErrors.messages.noMatchingRelationship(address.toString()).logWith(this._log)
        }
        return await this.getMessagesByRelationshipId(relationship.id)
    }

    public async getReceivedMessages(): Promise<Message[]> {
        return await this.getMessages({
            [nameof<Message>((m) => m.isOwn)]: false
        })
    }

    public async getMessage(id: CoreId): Promise<Message | undefined> {
        const messageDoc = await this.messages.read(id.toString())
        return messageDoc ? await Message.from(messageDoc) : undefined
    }

    public async updateCache(ids: string[]): Promise<Message[]> {
        const paginator = (await this.client.getMessages({ ids })).value
        const promises = []
        for await (const resultItem of paginator) {
            promises.push(this.updateCacheOfExistingMessageInDb(resultItem.id, resultItem))
        }
        return await Promise.all(promises)
    }

    private async updateCacheOfExistingMessageInDb(id: string, response?: BackboneGetMessagesResponse) {
        const messageDoc = await this.messages.read(id)
        if (!messageDoc) {
            throw TransportErrors.general.recordNotFound(Message, id).logWith(this._log)
        }

        const message = await Message.from(messageDoc)

        await this.updateCacheOfMessage(message, response)
        await this.messages.update(messageDoc, message)
        return message
    }

    private async updateCacheOfMessage(message: Message, response?: BackboneGetMessagesResponse) {
        const messageId = message.id.toString()

        if (!response) {
            response = (await this.client.getMessage(messageId)).value
        }

        const envelope = await this.getEnvelopeFromBackboneGetMessagesResponse(response)
        const [cachedMessage, messageKey] = await this.decryptSealedEnvelope(envelope, message.secretKey)

        message.secretKey = messageKey
        message.setCache(cachedMessage)
    }

    public async loadPeerMessage(id: CoreId): Promise<Message> {
        const response = (await this.client.getMessage(id.toString())).value

        const envelope = await this.getEnvelopeFromBackboneGetMessagesResponse(response)
        const [cachedMessage, messageKey, relationship] = await this.decryptSealedEnvelope(envelope)

        if (!relationship) {
            throw TransportErrors.general.recordNotFound(Relationship, envelope.id.toString()).logWith(this._log)
        }

        const message = await Message.from({
            id: envelope.id,
            isOwn: false,
            secretKey: messageKey,
            relationshipIds: [relationship.id]
        })
        message.setCache(cachedMessage)
        await this.messages.create(message)

        return message
    }

    private async getEnvelopeFromBackboneGetMessagesResponse(response: BackboneGetMessagesResponse) {
        const recipients = []

        for (const recipient of response.recipients) {
            const sealedRecipient = await MessageEnvelopeRecipient.from({
                encryptedKey: await CryptoCipher.fromBase64(recipient.encryptedKey),
                address: CoreAddress.from(recipient.address),
                receivedAt: recipient.receivedAt ? CoreDate.from(recipient.receivedAt) : undefined,
                receivedByDevice: recipient.receivedByDevice ? CoreId.from(recipient.receivedByDevice) : undefined
            })
            recipients.push(sealedRecipient)
        }

        const envelope = await MessageEnvelope.from({
            id: CoreId.from(response.id),
            createdAt: CoreDate.from(response.createdAt),
            createdBy: CoreAddress.from(response.createdBy),
            createdByDevice: CoreId.from(response.createdByDevice),
            cipher: await CryptoCipher.fromBase64(response.body),
            attachments: response.attachments,
            recipients: recipients
        })

        return envelope
    }

    public async setMessageMetadata(idOrMessage: CoreId | Message, metadata: ISerializableAsync): Promise<Message> {
        const id = idOrMessage instanceof CoreId ? idOrMessage.toString() : idOrMessage.id.toString()
        const messageDoc = await this.messages.read(id)
        if (!messageDoc) {
            throw TransportErrors.general.recordNotFound(Message, id.toString()).logWith(this._log)
        }

        const message = await Message.from(messageDoc)
        message.setMetadata(metadata)
        await this.messages.update(messageDoc, message)

        return message
    }

    public async sendMessage(parameters: ISendMessageParameters): Promise<Message> {
        parameters = await SendMessageParameters.from(parameters)
        if (!parameters.attachments) parameters.attachments = []

        const secret: CryptoSecretKey = await CoreCrypto.generateSecretKey()
        const serializedSecret: string = secret.serialize(false)
        const addressArray: ICoreAddress[] = []
        const envelopeRecipients: MessageEnvelopeRecipient[] = []
        for (const recipient of parameters.recipients) {
            const relationship = await this.relationships.getActiveRelationshipToIdentity(CoreAddress.from(recipient))
            if (!relationship) {
                throw TransportErrors.general.recordNotFound(Relationship, recipient.toString()).logWith(this._log)
            }

            const cipherForRecipient: CryptoCipher = await this.secrets.encrypt(
                relationship.relationshipSecretId,
                serializedSecret
            )
            envelopeRecipients.push(
                await MessageEnvelopeRecipient.from({
                    address: recipient,
                    encryptedKey: cipherForRecipient
                })
            )
            addressArray.push(recipient)
        }

        const publicAttachmentArray: CoreId[] = []
        const fileReferences: FileReference[] = []
        for (const fileObject of parameters.attachments) {
            const file = await File.from(fileObject)
            fileReferences.push(await file.toFileReference())
            publicAttachmentArray.push(file.id)
        }

        const plaintext: MessagePlain = await MessagePlain.from({
            content: parameters.content,
            recipients: addressArray,
            createdAt: CoreDate.utc(),
            attachments: fileReferences
        })
        const serializedPlaintext: string = plaintext.serialize()

        const plaintextBuffer: CoreBuffer = CoreBuffer.fromUtf8(serializedPlaintext)

        const messageSignatures: MessageSignature[] = []
        const relationshipIds = []
        for (const recipient of parameters.recipients) {
            const relationship = await this.relationships.getActiveRelationshipToIdentity(CoreAddress.from(recipient))
            if (!relationship) {
                throw TransportErrors.general.recordNotFound(Relationship, recipient.toString()).logWith(this._log)
            }

            const signature: ICryptoSignature = await this.secrets.sign(
                relationship.relationshipSecretId,
                plaintextBuffer
            )
            const messageSignature: MessageSignature = await MessageSignature.from({
                recipient: recipient,
                signature: signature
            })
            messageSignatures.push(messageSignature)
            relationshipIds.push(relationship.id)
        }

        const signed: MessageSigned = await MessageSigned.from({
            message: serializedPlaintext,
            signatures: messageSignatures
        })
        const serializedSigned: string = signed.serialize()
        const cipher: CryptoCipher = await CoreCrypto.encrypt(CoreBuffer.fromUtf8(serializedSigned), secret)

        const platformRecipients: BackbonePostMessagesRecipientRequest[] = envelopeRecipients.map((recipient) => {
            return {
                address: recipient.address.toString(),
                encryptedKey: recipient.encryptedKey.toBase64()
            }
        })

        const fileIds = publicAttachmentArray.map((attachment) => {
            return {
                id: attachment.id
            }
        })

        const response = (
            await this.client.createMessage({
                attachments: fileIds,
                body: cipher.toBase64(),
                recipients: platformRecipients
            })
        ).value

        const cachedMessage: CachedMessage = await CachedMessage.from({
            content: parameters.content,
            createdAt: CoreDate.from(response.createdAt),
            createdBy: this.parent.identity.identity.address,
            createdByDevice: this.parent.activeDevice.id,
            recipients: envelopeRecipients,
            attachments: publicAttachmentArray,
            receivedByEveryone: false
        })

        const message: Message = await Message.from({
            id: CoreId.from(response.id),
            secretKey: secret,
            cache: cachedMessage,
            cachedAt: CoreDate.utc(),
            isOwn: true,
            relationshipIds: relationshipIds
        })

        await this.messages.create(message)

        return message
    }

    private async decryptOwnEnvelope(envelope: MessageEnvelope, secretKey: CryptoSecretKey): Promise<MessagePlain> {
        this.log.trace(`Decrypting own envelope with id ${envelope.id.toString()}...`)

        const plaintextMessageBuffer: CoreBuffer = await CoreCrypto.decrypt(envelope.cipher, secretKey)
        const signedMessage: MessageSigned = await MessageSigned.deserialize(plaintextMessageBuffer.toUtf8())
        const messagePlain = await MessagePlain.from(JSON.parse(signedMessage.message))

        return messagePlain
    }

    private async decryptPeerEnvelope(
        envelope: MessageEnvelope,
        relationship: Relationship
    ): Promise<[MessagePlain, CryptoSecretKey]> {
        const ownKeyCipher = envelope.recipients.find((r) => this.parent.identity.isMe(r.address))?.encryptedKey

        if (!ownKeyCipher) {
            throw TransportErrors.messages.ownAddressNotInList(envelope.id.toString()).logWith(this._log)
        }

        const plaintextKeyBuffer = await this.secrets.decryptPeer(relationship.relationshipSecretId, ownKeyCipher, true)
        const plaintextKey: CryptoSecretKey = await CryptoSecretKey.deserialize(plaintextKeyBuffer.toUtf8())
        const plaintextMessageBuffer: CoreBuffer = await CoreCrypto.decrypt(envelope.cipher, plaintextKey)

        const signedMessage: MessageSigned = await MessageSigned.deserialize(plaintextMessageBuffer.toUtf8())

        const signature = signedMessage.signatures.find((s) => this.parent.identity.isMe(s.recipient))?.signature

        if (!signature) {
            throw TransportErrors.messages.signatureListMismatch(envelope.id.toString()).logWith(this._log)
        }

        const messagePlain = await MessagePlain.from(JSON.parse(signedMessage.message))
        if (signedMessage.signatures.length !== messagePlain.recipients.length) {
            this.log.debug(`Number of signatures does not match number of recipients from envelope ${envelope.id}.`)
        }

        const plainMessageBuffer: CoreBuffer = CoreBuffer.fromUtf8(signedMessage.message)
        const validSignature: boolean = await this.secrets.verifyPeer(
            relationship.relationshipSecretId,
            plainMessageBuffer,
            signature
        )
        if (!validSignature) {
            throw TransportErrors.messages.signatureNotValid().logWith(this._log)
        }

        if (messagePlain.recipients.length !== envelope.recipients.length) {
            this.log.debug(
                `Number of signed recipients within the message does not match number of recipients from envelope ${envelope.id}.`
            )
        }

        if (messagePlain.recipients.length !== signedMessage.signatures.length) {
            this.log.debug(
                `Number of signed recipients within the message does not match number of signatures from envelope ${envelope.id}.`
            )
        }

        const recipientFound: boolean = messagePlain.recipients.some((r) => this.parent.identity.isMe(r))

        if (!recipientFound) {
            throw TransportErrors.messages.plaintextMismatch(envelope.id.toString()).logWith(this._log)
        }

        return [messagePlain, plaintextKey]
    }

    private async decryptSealedEnvelope(
        envelope: MessageEnvelope,
        secretKey?: CryptoSecretKey
    ): Promise<[CachedMessage, CryptoSecretKey, Relationship?]> {
        this.log.trace(`Decrypting MessageEnvelope with id ${envelope.id}...`)
        let plainMessage: MessagePlain
        let messageKey: CryptoSecretKey

        let relationship
        if (this.parent.identity.isMe(envelope.createdBy)) {
            if (!secretKey) {
                throw TransportErrors.messages.noSecretKeyForOwnMessage(envelope.id.toString()).logWith(this._log)
            }
            messageKey = secretKey
            plainMessage = await this.decryptOwnEnvelope(envelope, secretKey)
        } else {
            relationship = await this.relationships.getActiveRelationshipToIdentity(envelope.createdBy)

            if (!relationship) {
                throw TransportErrors.messages.noMatchingRelationship(envelope.createdBy.toString()).logWith(this._log)
            }

            const [peerMessage, peerKey] = await this.decryptPeerEnvelope(envelope, relationship)
            plainMessage = peerMessage
            messageKey = peerKey
        }

        this.log.trace("Message is valid. Fetching attachments for message...")
        const fileArray: CoreId[] = []
        const promises = []
        for (const fileReference of plainMessage.attachments) {
            promises.push(this.parent.files.loadPeerFileByReference(fileReference))
            fileArray.push(fileReference.id)
        }
        await Promise.all(promises)

        this.log.trace("Attachments fetched. Creating message...")

        const cachedMessage: CachedMessage = await CachedMessage.from({
            createdBy: envelope.createdBy,
            createdByDevice: envelope.createdByDevice,
            recipients: envelope.recipients,
            attachments: fileArray,
            content: plainMessage.content,
            createdAt: envelope.createdAt,
            receivedByEveryone: false
        })

        return [cachedMessage, messageKey, relationship]
    }
}
