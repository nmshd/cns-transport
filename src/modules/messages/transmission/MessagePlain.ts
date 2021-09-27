import { ISerializableAsync, SerializableAsync, serialize, type, validate } from "@js-soft/ts-serval"
import { CoreSerializableAsync, ICoreSerializableAsync } from "../../../core"
import { CoreAddress, ICoreAddress } from "../../../core/types/CoreAddress"
import { CoreDate, ICoreDate } from "../../../core/types/CoreDate"
import { FileReference, IFileReference } from "../../files/transmission/FileReference"

export interface IMessagePlain extends ICoreSerializableAsync {
    attachments?: IFileReference[]
    content: ISerializableAsync
    createdAt?: ICoreDate
    recipients: ICoreAddress[]
}

/**
 * MessagePlain is a container for the actual message as [[IMessage]], its creationDate and
 * the list of recipients as [[IAddress]]. This container instance is then digitally signed
 * by the sender via an [[MessageSigned]] object.
 *
 * Insofar, the sender digitally signs the date of creation of this message (which could act as a
 * legal proof). Additionally, all recipients can - and must - check if they are addressed by
 * the sender. If a recipient is not in the signed list of recipients, the message needs to be
 * ignored (as the whole message could have been forwarded by bad party to a wrong recipient).
 */
@type("MessagePlain")
export class MessagePlain extends CoreSerializableAsync implements IMessagePlain {
    @validate()
    @serialize({ type: FileReference })
    public attachments: FileReference[] = []
    @validate()
    @serialize()
    public content: SerializableAsync
    @validate()
    @serialize()
    public createdAt: CoreDate
    @validate()
    @serialize({ type: CoreAddress })
    public recipients: CoreAddress[]

    public static async from(value: IMessagePlain): Promise<MessagePlain> {
        if (typeof value.attachments === "undefined") {
            value.attachments = []
        }
        return await super.fromT(value, MessagePlain)
    }

    public static async deserialize(value: string): Promise<MessagePlain> {
        return await super.deserializeT(value, MessagePlain)
    }
}
