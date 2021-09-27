import { IDatabaseConnection } from "@js-soft/docdb-access-abstractions"
import { ILogger, ILoggerFactory } from "@js-soft/logging-abstractions"
import { AccountController, IConfigOverwrite, Transport } from "@nmshd/transport"
import { DurationLike } from "luxon"
import { TestUtil } from "./TestUtil"

export abstract class AbstractTest {
    protected logger: ILogger

    public readonly tempDateThreshold: DurationLike = { seconds: 30 }

    public constructor(
        protected config: IConfigOverwrite,
        protected connection: IDatabaseConnection,
        protected loggerFactory: ILoggerFactory
    ) {
        this.logger = this.loggerFactory.getLogger(this.constructor.name)
    }

    public abstract run(): void

    protected async createIdentityWithTwoDevices(
        accountPrefix: string
    ): Promise<{ device1: AccountController; device2: AccountController }> {
        // Create Device1 Controller
        const coreLibDevice1: Transport = new Transport(this.connection, this.config, this.loggerFactory)
        await coreLibDevice1.init()
        const device1Account = await TestUtil.createAccount(coreLibDevice1, accountPrefix)

        // Prepare Device2
        const device2 = await device1Account.devices.sendDevice({ name: "Device2" })
        const sharedSecret = await device1Account.activeDevice.secrets.createDeviceSharedSecret(device2, 1, true)
        await device1Account.syncDatawallet()

        // Create Device2 Controller
        const coreLibDevice2: Transport = new Transport(this.connection, this.config, this.loggerFactory)
        await coreLibDevice2.init()
        const device2Account = await TestUtil.onboardDevice(coreLibDevice2, sharedSecret)

        await device1Account.syncEverything()
        await device2Account.syncEverything()

        return { device1: device1Account, device2: device2Account }
    }

    protected async createIdentityWithOneDevice(accountPrefix: string): Promise<AccountController> {
        const coreLib: Transport = new Transport(this.connection, this.config, this.loggerFactory)
        await coreLib.init()
        const deviceAccount = await TestUtil.createAccount(coreLib, accountPrefix)
        return deviceAccount
    }
}
