import { serialize, type, validate } from "@js-soft/ts-serval"
import { CoreSerializableAsync, ICoreSerializableAsync } from "../../../core"

export interface ISendDeviceParameters extends ICoreSerializableAsync {
    name?: string
    description?: string
    isAdmin?: boolean
}

@type("SendDeviceParameters")
export class SendDeviceParameters extends CoreSerializableAsync implements ISendDeviceParameters {
    @validate({ nullable: true })
    @serialize()
    public name?: string

    @validate({ nullable: true })
    @serialize()
    public description?: string

    @validate({ nullable: true })
    @serialize()
    public isAdmin?: boolean

    public static async from(value: ISendDeviceParameters): Promise<SendDeviceParameters> {
        return await super.fromT(value, SendDeviceParameters)
    }

    public static async deserialize(value: string): Promise<SendDeviceParameters> {
        return await super.deserializeT(value, SendDeviceParameters)
    }
}
