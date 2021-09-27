import { IDatabaseCollectionProvider } from "@js-soft/docdb-access-abstractions"
import { ILogger } from "@js-soft/logging-abstractions"
import { AccountController } from "../modules/accounts/AccountController"
import { CoreLoggerFactory } from "./CoreLoggerFactory"
import { CoreSerializable } from "./CoreSerializable"
import { CoreSerializableAsync } from "./CoreSerializableAsync"
import { IConfig, Transport } from "./Transport"
import { TransportErrors } from "./TransportErrors"

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

    protected _core: Transport
    public get core(): Transport {
        return this._core
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
        this._core = parent.core
        this._parent = parent
        this._config = parent.config
        this._db = parent.db
        this._initialized = false
        let loggerName: string = controllerName
        if (this.config.debug && this.parent.activeDeviceOrUndefined?.deviceOrUndefined) {
            loggerName += ` of ${this.parent.activeDevice.device.id}`
        }
        this._log = CoreLoggerFactory.getLogger(loggerName)
    }

    public init(): Promise<TransportController> {
        if (this._initialized) {
            throw TransportErrors.controller.alreadyInitialized(this.controllerName).logWith(this._log)
        }
        this._initialized = true
        return Promise.resolve(this)
    }

    protected async parseObject<T extends CoreSerializableAsync | CoreSerializable>(
        value: Object,
        type: new () => T
    ): Promise<T> {
        return await CoreSerializableAsync.fromT(value, type)
    }

    protected async parseArray<T extends CoreSerializableAsync | CoreSerializable>(
        value: Object[],
        type: new () => T,
        contentProperty?: string
    ): Promise<T[]> {
        const parsePromises: Promise<T>[] = []
        for (let i = 0, l = value.length; i < l; i++) {
            if (contentProperty) {
                const item: any = value[i]
                if (item[contentProperty]) {
                    parsePromises.push(this.parseObject(item[contentProperty], type))
                } else {
                    throw TransportErrors.controller.contentPropertyUndefined(contentProperty).logWith(this._log)
                }
            } else {
                parsePromises.push(this.parseObject(value[i], type))
            }
        }
        return await Promise.all(parsePromises)
    }
}
