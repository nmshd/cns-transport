import { serialize, type, validate } from "@js-soft/ts-serval"
import { CryptoSecretKey, CryptoSignaturePrivateKey, ICryptoSecretKey, ICryptoSignaturePrivateKey } from "@nmshd/crypto"
import { CoreDate, CoreId, CoreSerializableAsync, ICoreId } from "../../../core"
import { Identity, IIdentity } from "../../accounts/data/Identity"

export interface IDeviceSharedSecret {
    id: ICoreId
    createdAt: CoreDate
    createdByDevice: CoreId
    name?: string
    description?: string
    secretBaseKey: CryptoSecretKey
    deviceIndex: number
    synchronizationKey: ICryptoSecretKey
    identityPrivateKey?: ICryptoSignaturePrivateKey
    identity: IIdentity
    password: string
    username: string
    numberOfSynchronizationSteps?: number
}

@type("DeviceSharedSecret")
export class DeviceSharedSecret extends CoreSerializableAsync implements IDeviceSharedSecret {
    @serialize()
    @validate()
    public id: CoreId

    @serialize()
    @validate()
    public createdByDevice: CoreId

    @serialize()
    @validate()
    public createdAt: CoreDate

    @serialize()
    @validate({ nullable: true })
    public name?: string

    @serialize()
    @validate({ nullable: true })
    public description?: string

    @serialize()
    @validate()
    public synchronizationKey: CryptoSecretKey

    @serialize()
    @validate()
    public secretBaseKey: CryptoSecretKey

    @serialize()
    @validate()
    public deviceIndex: number

    @serialize()
    @validate({ nullable: true })
    public identityPrivateKey?: CryptoSignaturePrivateKey

    @serialize()
    @validate()
    public identity: Identity

    @serialize()
    @validate()
    public username: string

    @serialize()
    @validate()
    public password: string

    @serialize()
    @validate({ nullable: true })
    public numberOfSynchronizationSteps?: number

    public static async from(value: IDeviceSharedSecret): Promise<DeviceSharedSecret> {
        return await super.fromT(value, DeviceSharedSecret)
    }

    public static async deserialize(value: string): Promise<DeviceSharedSecret> {
        return await super.deserializeT(value, DeviceSharedSecret)
    }
}
