import { CoreDate, CoreId, TransportErrors } from "../../core"
import { ControllerName, CoreController } from "../../core/CoreController"
import { DbCollectionNames } from "../../core/DbCollectionNames"
import { PasswordGenerator } from "../../util"
import { AccountController } from "../accounts/AccountController"
import { ChallengeType } from "../challenges/data/Challenge"
import { SynchronizedCollection } from "../sync/SynchronizedCollection"
import { DeviceAuthClient } from "./backbone/DeviceAuthClient"
import { Device, DeviceType } from "./local/Device"
import { ISendDeviceParameters, SendDeviceParameters } from "./local/SendDeviceParameters"
import { DeviceSharedSecret } from "./transmission/DeviceSharedSecret"

export class DevicesController extends CoreController {
    private devices: SynchronizedCollection
    private client: DeviceAuthClient

    public constructor(parent: AccountController) {
        super(ControllerName.Devices, parent)
    }

    public async init(): Promise<DevicesController> {
        await super.init()

        this.client = new DeviceAuthClient(this.config, this.parent.authenticator)
        this.devices = await this.parent.getSynchronizedCollection(DbCollectionNames.Devices)
        return this
    }

    public async get(id: CoreId): Promise<Device | undefined> {
        const result = await this.devices.read(id.toString())
        if (!result) {
            return undefined
        }

        return await Device.from(result)
    }

    public async addExistingDevice(device: Device): Promise<void> {
        await this.devices.create(device)
    }

    private async createDevice(name = "", description = "", isAdmin = false): Promise<Device> {
        const [signedChallenge, devicePwdDn] = await Promise.all([
            this.parent.challenges.createChallenge(ChallengeType.Identity),
            PasswordGenerator.createStrongPassword(45, 50)
        ])

        this.log.trace("Device Creation Challenge signed. Creating device on backbone...")

        const response = (
            await this.client.createDevice({
                signedChallenge: signedChallenge.toJSON(),
                devicePassword: devicePwdDn
            })
        ).value

        this.log.trace(`Created device with id ${response.id}.`)

        const device = await Device.from({
            createdAt: CoreDate.from(response.createdAt),
            createdByDevice: CoreId.from(response.createdByDevice),
            id: CoreId.from(response.id),
            name: name,
            description: description,
            type: DeviceType.Unknown,
            username: response.username,
            initialPassword: devicePwdDn,
            isAdmin: isAdmin
        })

        return device
    }

    public async sendDevice(parameters: ISendDeviceParameters): Promise<Device> {
        parameters = await SendDeviceParameters.from(parameters)

        if (!parameters.name) {
            const devices = await this.parent.devices.list()
            parameters.name = `Device ${devices.length + 1}`
        }

        const device = await this.createDevice(parameters.name, parameters.description, parameters.isAdmin)

        await this.devices.create(device)

        return device
    }

    public async getSharedSecret(id: CoreId): Promise<DeviceSharedSecret> {
        const deviceDoc = await this.devices.read(id.toString())
        if (!deviceDoc) {
            throw TransportErrors.general.recordNotFound(Device, id.toString())
        }

        const count = await this.devices.count()
        const device = await Device.from(deviceDoc)

        if (!device.initialPassword || device.publicKey || device.lastLoginAt) {
            throw TransportErrors.device.alreadyOnboarded()
        }

        const isAdmin = device.isAdmin === true

        const secret = await this.parent.activeDevice.secrets.createDeviceSharedSecret(device, count, isAdmin)
        return secret
    }

    public async update(device: Device): Promise<void> {
        const deviceDoc = await this.devices.read(device.id.toString())
        if (!deviceDoc) {
            throw TransportErrors.general.recordNotFound(Device, device.id.toString())
        }
        await this.devices.update(deviceDoc, device)
    }

    public async delete(device: Device): Promise<void> {
        await this.devices.delete(device)
    }

    public async list(): Promise<Device[]> {
        const items = await this.devices.list()
        return await this.parseArray<Device>(items, Device)
    }
}
