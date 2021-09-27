import { serialize, type, validate } from "@js-soft/ts-serval"
import { CoreSerializableAsync, ICoreSerializableAsync } from "../../../core"
import { IMessageSignature, MessageSignature } from "./MessageSignature"

export interface IMessageSigned extends ICoreSerializableAsync {
    signatures: IMessageSignature[]
    message: string
}

/**
 * MessageSigned encapsulates the actual message with the senders digital signature.
 */
@type("MessageSigned")
export class MessageSigned extends CoreSerializableAsync {
    @validate()
    @serialize({ type: MessageSignature })
    public signatures: MessageSignature[]

    @validate()
    @serialize()
    public message: string

    public static async from(value: IMessageSigned): Promise<MessageSigned> {
        return await super.fromT(value, MessageSigned)
    }

    public static async deserialize(value: string): Promise<MessageSigned> {
        const obj = JSON.parse(value)
        return await this.from(obj)
    }
}
