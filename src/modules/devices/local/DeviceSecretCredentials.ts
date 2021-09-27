import { serialize, type, validate } from "@js-soft/ts-serval"
import { CoreId, CoreSerializableAsync, ICoreId } from "../../../core"

export interface IDeviceSecretCredentials {
    id: ICoreId
    password?: string
    username?: string
}

@type("DeviceSecretCredentials")
export class DeviceSecretCredentials extends CoreSerializableAsync implements IDeviceSecretCredentials {
    @serialize()
    @validate()
    public id: CoreId

    @serialize()
    @validate({ nullable: true })
    public password?: string

    @serialize()
    @validate({ nullable: true })
    public username?: string

    public static async from(value: IDeviceSecretCredentials): Promise<DeviceSecretCredentials> {
        return await super.fromT(value, DeviceSecretCredentials)
    }
}
