import { ISerializableAsync, SerializableAsync, serialize, type, validate } from "@js-soft/ts-serval"
import { CoreDate, CoreSerializableAsync, ICoreDate, ICoreSerializableAsync } from "../../../core"

export interface ISendTokenParameters extends ICoreSerializableAsync {
    content: ISerializableAsync
    expiresAt: ICoreDate
    ephemeral: boolean
}

@type("SendTokenParameters")
export class SendTokenParameters extends CoreSerializableAsync implements ISendTokenParameters {
    @validate()
    @serialize()
    public content: SerializableAsync

    @validate()
    @serialize()
    public expiresAt: CoreDate

    @validate()
    @serialize()
    public ephemeral: boolean

    public static async from(value: ISendTokenParameters): Promise<SendTokenParameters> {
        return await super.fromT(value, SendTokenParameters)
    }

    public static async deserialize(value: string): Promise<SendTokenParameters> {
        return await super.deserializeT(value, SendTokenParameters)
    }
}
