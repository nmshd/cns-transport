import { ISerializable, Serializable, serialize, type, validate } from "@js-soft/ts-serval"
import { CoreSerializable, ICoreSerializable } from "../../../core"
import { CoreAddress, ICoreAddress } from "../../../core/types/CoreAddress"
import { CoreDate, ICoreDate } from "../../../core/types/CoreDate"
import { FileReference, IFileReference } from "../../files/transmission/FileReference"

export interface IMessagePlain extends ICoreSerializable {
    attachments?: IFileReference[]
    content: ISerializable
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
export class MessagePlain extends CoreSerializable implements IMessagePlain {
    @validate()
    @serialize({ type: FileReference })
    public attachments: FileReference[] = []
    @validate()
    @serialize()
    public content: Serializable
    @validate()
    @serialize()
    public createdAt: CoreDate
    @validate()
    @serialize({ type: CoreAddress })
    public recipients: CoreAddress[]

    public static from(value: IMessagePlain): MessagePlain {
        if (typeof value.attachments === "undefined") {
            value.attachments = []
        }
        return super.fromT(value, MessagePlain)
    }

    public static deserialize(value: string): MessagePlain {
        return super.deserializeT(value, MessagePlain)
    }
}
