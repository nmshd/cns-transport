/* eslint-disable @typescript-eslint/no-inferrable-types */
import { ISerializableAsync, SerializableAsync, serialize, type, validate } from "@js-soft/ts-serval"
import {
    CoreAddress,
    CoreId,
    CoreSerializableAsync,
    ICoreAddress,
    ICoreId,
    ICoreSerializableAsync
} from "../../../core"
import { CoreDate, ICoreDate } from "../../../core/types/CoreDate"
import { IMessageEnvelopeRecipient, MessageEnvelopeRecipient } from "../transmission/MessageEnvelopeRecipient"

export interface ICachedMessage extends ICoreSerializableAsync {
    createdBy: ICoreAddress
    createdByDevice: ICoreId

    recipients: IMessageEnvelopeRecipient[]

    createdAt: ICoreDate

    attachments?: ICoreId[]
    receivedByEveryone: boolean

    content: ISerializableAsync
}

@type("CachedMessage")
export class CachedMessage extends CoreSerializableAsync implements ICachedMessage {
    @validate()
    @serialize()
    public createdBy: CoreAddress

    @validate()
    @serialize()
    public createdByDevice: CoreId

    @validate()
    @serialize({ type: MessageEnvelopeRecipient })
    public recipients: MessageEnvelopeRecipient[]

    @validate()
    @serialize()
    public createdAt: CoreDate

    @validate({ nullable: true })
    @serialize({ type: CoreId })
    public attachments: CoreId[]

    @validate()
    @serialize()
    public receivedByEveryone: boolean = false

    @validate()
    @serialize()
    public content: SerializableAsync

    public static async from(value: ICachedMessage): Promise<CachedMessage> {
        return await super.fromT(value, CachedMessage)
    }
}
