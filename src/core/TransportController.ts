import { IDatabaseCollectionProvider } from "@js-soft/docdb-access-abstractions"
import { ILogger } from "@js-soft/logging-abstractions"
import { AccountController } from "../modules/accounts/AccountController"
import { CoreSerializable } from "./CoreSerializable"
import { IConfig, Transport } from "./Transport"
import { TransportErrors } from "./TransportErrors"
import { TransportLoggerFactory } from "./TransportLoggerFactory"

export enum ControllerName {
    Account = "Account",
    Attribute = "Attribute",
    Certificate = "Certificate",
    CertificateIssuer = "CertificateIssuer",
    CertificateValidator = "CertificateValidator",
    Challenge = "Challenge",
    Device = "Device",
    Devices = "Devices",
    DeviceSecret = "DeviceSecret",
    File = "File",
    Identity = "Identity",
    Message = "Message",
    Relationship = "Relationship",
    Relationships = "Relationships",
    RelationshipTemplate = "RelationshipTemplate",
    RelationshipRequest = "RelationshipRequest",
    RelationshipRequestor = "RelationshipRequestor",
    RelationshipSecret = "RelationshipSecret",
    RelationshipTemplator = "RelationshipTemplator",
    Secret = "Secret",
    Sync = "Sync",
    Token = "Token"
}

export class TransportController {
    protected _log: ILogger
    public get log(): ILogger {
        return this._log
    }

    protected _config: IConfig
    public get config(): IConfig {
        return this._config
    }

    protected _db: IDatabaseCollectionProvider
    public get db(): IDatabaseCollectionProvider {
        return this._db
    }

    protected _dbClosed = false

    protected _transport: Transport
    public get transport(): Transport {
        return this._transport
    }

    protected _parent: AccountController
    public get parent(): AccountController {
        return this._parent
    }

    protected _initialized: boolean
    public get initialized(): boolean {
        return this._initialized
    }

    protected _controllerName: ControllerName
    public get controllerName(): ControllerName {
        return this._controllerName
    }

    public constructor(controllerName: ControllerName, parent: AccountController) {
        this._controllerName = controllerName
        this._transport = parent.transport
        this._parent = parent
        this._config = parent.config
        this._db = parent.db
        this._initialized = false
        let loggerName: string = controllerName
        if (this.config.debug && this.parent.activeDeviceOrUndefined?.deviceOrUndefined) {
            loggerName += ` of ${this.parent.activeDevice.device.id}`
        }
        this._log = TransportLoggerFactory.getLogger(loggerName)
    }

    public init(): Promise<TransportController> {
        if (this._initialized) {
            throw TransportErrors.controller.alreadyInitialized(this.controllerName).logWith(this._log)
        }
        this._initialized = true
        return Promise.resolve(this)
    }

    protected async parseArray<T extends CoreSerializable | CoreSerializable>(
        values: Object[],
        type: new () => T
    ): Promise<T[]> {
        const parsePromises: Promise<T>[] = values.map((v) => (type as any).from(v))
        return await Promise.all(parsePromises)
    }
}
