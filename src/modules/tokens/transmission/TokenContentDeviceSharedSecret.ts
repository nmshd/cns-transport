import { serialize, type, validate } from "@js-soft/ts-serval"
import { CoreSerializableAsync, ICoreSerializableAsync } from "../../../core"
import { DeviceSharedSecret } from "../../devices/transmission/DeviceSharedSecret"

export interface ITokenContentDeviceSharedSecret extends ICoreSerializableAsync {
    sharedSecret: DeviceSharedSecret
}

@type("TokenContentDeviceSharedSecret")
export class TokenContentDeviceSharedSecret extends CoreSerializableAsync implements ITokenContentDeviceSharedSecret {
    @validate()
    @serialize()
    public sharedSecret: DeviceSharedSecret

    public static async from(value: ITokenContentDeviceSharedSecret): Promise<TokenContentDeviceSharedSecret> {
        return await super.fromT(value, TokenContentDeviceSharedSecret)
    }

    public static async deserialize(value: string): Promise<TokenContentDeviceSharedSecret> {
        return await super.deserializeT(value, TokenContentDeviceSharedSecret)
    }
}
