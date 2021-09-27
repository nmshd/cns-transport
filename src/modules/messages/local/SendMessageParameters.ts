import { ISerializableAsync, SerializableAsync, serialize, type, validate } from "@js-soft/ts-serval"
import { CoreAddress, CoreSerializableAsync, ICoreAddress, ICoreSerializableAsync } from "../../../core"
import { File, IFile } from "../../files/local/File"

export interface ISendMessageParameters extends ICoreSerializableAsync {
    recipients: ICoreAddress[]
    content: ISerializableAsync
    attachments?: IFile[]
}

@type("SendMessageParameters")
export class SendMessageParameters extends CoreSerializableAsync implements ISendMessageParameters {
    @validate()
    @serialize({ type: CoreAddress })
    public recipients: CoreAddress[]

    @validate()
    @serialize()
    public content: SerializableAsync

    @validate({ nullable: true })
    @serialize({ type: File })
    public attachments?: File[]

    public static async from(value: ISendMessageParameters): Promise<SendMessageParameters> {
        return await super.fromT(value, SendMessageParameters)
    }

    public static async deserialize(value: string): Promise<SendMessageParameters> {
        return await super.deserializeT(value, SendMessageParameters)
    }
}
