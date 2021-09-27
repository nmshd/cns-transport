import { serialize, type, validate } from "@js-soft/ts-serval"
import { CryptoSignaturePublicKey, ICryptoSignaturePublicKey } from "@nmshd/crypto"
import { nameof } from "ts-simple-nameof"
import { CoreSynchronizable, ICoreSynchronizable } from "../../../core"
import { CoreDate } from "../../../core/types/CoreDate"
import { CoreId } from "../../../core/types/CoreId"

export enum DeviceType {
    "Unknown",
    "Phone",
    "Tablet",
    "Desktop",
    "Connector"
}

export interface DeviceInfo {
    operatingSystem: string
    type: DeviceType
}

export interface IDevice extends ICoreSynchronizable {
    isAdmin?: boolean
    publicKey?: ICryptoSignaturePublicKey
    certificate?: string
    name: string
    description?: string
    createdAt: CoreDate
    createdByDevice: CoreId
    operatingSystem?: string
    lastLoginAt?: CoreDate
    type: DeviceType
    username: string
    initialPassword?: string
}

@type("Device")
export class Device extends CoreSynchronizable implements IDevice {
    public readonly technicalProperties = [
        "@type",
        "@context",
        nameof<Device>((d) => d.isAdmin),
        nameof<Device>((d) => d.publicKey),
        nameof<Device>((d) => d.certificate),
        nameof<Device>((d) => d.operatingSystem),
        nameof<Device>((d) => d.type),
        nameof<Device>((d) => d.createdAt),
        nameof<Device>((d) => d.createdByDevice),
        nameof<Device>((d) => d.lastLoginAt),
        nameof<Device>((d) => d.username),
        nameof<Device>((d) => d.initialPassword)
    ]

    public readonly userdataProperties = [nameof<Device>((d) => d.name), nameof<Device>((d) => d.description)]

    @validate({ nullable: true })
    @serialize()
    public publicKey?: CryptoSignaturePublicKey

    @validate({ nullable: true })
    @serialize()
    public certificate?: string

    @validate()
    @serialize()
    public name: string

    @validate({ nullable: true })
    @serialize()
    public description?: string

    @validate({ nullable: true })
    @serialize()
    public operatingSystem?: string

    @validate()
    @serialize()
    public createdAt: CoreDate

    @validate()
    @serialize()
    public createdByDevice: CoreId

    @validate({ nullable: true })
    @serialize()
    public lastLoginAt?: CoreDate

    @validate()
    @serialize()
    public type: DeviceType

    @validate({ nullable: true })
    @serialize()
    public username: string

    @validate({ nullable: true })
    @serialize()
    public initialPassword?: string

    @validate({ nullable: true })
    @serialize()
    public isAdmin?: boolean

    public static async from(value: IDevice): Promise<Device> {
        return await super.fromT(value, Device)
    }
}
