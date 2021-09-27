import { ILogger } from "@js-soft/logging-abstractions"
import { AccountController, DeviceSharedSecret, Transport } from "@nmshd/transport"
import { DeviceTestParameters } from "./DeviceTestParameters"
import { TestUtil } from "./TestUtil"

export class AppDeviceTest {
    protected parameters: DeviceTestParameters

    protected transport: Transport
    protected logger: ILogger

    private readonly createdAccounts: AccountController[] = []

    public constructor(parameters: DeviceTestParameters) {
        this.parameters = parameters
        this.transport = new Transport(
            this.parameters.connection,
            this.parameters.config,
            this.parameters.loggerFactory
        )
    }

    public async init(): Promise<void> {
        await TestUtil.clearAccounts(this.parameters.connection)
        await this.transport.init()
    }

    public async createAccount(): Promise<AccountController> {
        const accounts = await TestUtil.provideAccounts(this.transport, 1, AppDeviceTest.name)

        const account = accounts[0]

        this.createdAccounts.push(account)
        return account
    }

    public async onboardDevice(sharedSecret: DeviceSharedSecret): Promise<AccountController> {
        const account = await TestUtil.onboardDevice(this.transport, sharedSecret)
        this.createdAccounts.push(account)
        return account
    }

    public async close(): Promise<void> {
        for (const account of this.createdAccounts) {
            await account.close()
        }
    }
}
