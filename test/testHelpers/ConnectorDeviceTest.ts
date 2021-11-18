import { ILogger } from "@js-soft/logging-abstractions"
import { Realm, Transport } from "@nmshd/transport"
import { TestUtil } from "../testHelpers"
import { DeviceTestParameters } from "./DeviceTestParameters"

export class ConnectorDeviceTest {
    protected parameters: DeviceTestParameters

    protected name: string
    protected transport: Transport
    protected logger: ILogger
    protected realm: Realm

    public constructor(deviceName: string, parameters: DeviceTestParameters) {
        this.name = deviceName
        this.parameters = parameters
        this.transport = new Transport(
            this.parameters.connection,
            this.parameters.config,
            this.parameters.loggerFactory
        )
        this.logger = parameters.loggerFactory.getLogger(`CoreTest.${this.name}.`)
        this.realm = this.parameters.config.realm ? this.parameters.config.realm : Realm.Stage
    }

    public async init(): Promise<void> {
        await TestUtil.clearAccounts(this.parameters.connection)
        await this.transport.init()
    }
}
