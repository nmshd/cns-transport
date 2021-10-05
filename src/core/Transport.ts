import { IDatabaseCollectionProvider, IDatabaseConnection } from "@js-soft/docdb-access-abstractions"
import { ILogger, ILoggerFactory } from "@js-soft/logging-abstractions"
import { SimpleLoggerFactory } from "@js-soft/simple-logger"
import { SodiumWrapper } from "@nmshd/crypto"
import { AgentOptions } from "http"
import { AgentOptions as HTTPSAgentOptions } from "https"
import _ from "lodash"
import { Realm } from "../modules/accounts/data/Identity"
import { TransportContext } from "./TransportContext"
import { TransportErrors } from "./TransportErrors"
import { TransportLoggerFactory } from "./TransportLoggerFactory"

let log: ILogger

export interface IConfig {
    identityVersion: number
    debug: boolean
    platformClientId: string
    platformClientSecret: string
    platformTimeout: number
    platformMaxRedirects: number
    platformMaxUnencryptedFileSize: number
    platformAdditionalHeaders?: Record<string, string>
    baseUrl: string
    useGateway: boolean
    realm: Realm
    datawalletEnabled: boolean
    httpAgent: AgentOptions
    httpsAgent: HTTPSAgentOptions
}

export interface IConfigOverwrite {
    identityVersion: number
    debug?: boolean
    platformClientId: string
    platformClientSecret: string
    platformTimeout?: number
    platformMaxRedirects?: number
    platformMaxUnencryptedFileSize?: number
    platformAdditionalHeaders?: object
    baseUrl: string
    useGateway?: boolean
    realm?: Realm
    datawalletEnabled?: boolean
    httpAgent?: AgentOptions
    httpsAgent?: HTTPSAgentOptions
}

export class Transport {
    private readonly databaseConnection: IDatabaseConnection

    private readonly _config: IConfig
    public get config(): IConfig {
        return this._config
    }

    private readonly defaultConfig: IConfig = {
        identityVersion: -1,
        debug: false,
        platformClientId: "",
        platformClientSecret: "",
        platformTimeout: 60000,
        platformMaxRedirects: 10,
        platformMaxUnencryptedFileSize: 10 * 1024 * 1024,
        baseUrl: "",
        useGateway: true,
        realm: Realm.Prod,
        datawalletEnabled: false,
        httpAgent: {
            keepAlive: true,
            maxSockets: 5,
            maxFreeSockets: 2
        },
        httpsAgent: {
            keepAlive: true,
            maxSockets: 5,
            maxFreeSockets: 2
        }
    }

    public constructor(
        databaseConnection: IDatabaseConnection,
        customConfig: IConfigOverwrite,
        loggerFactory: ILoggerFactory = new SimpleLoggerFactory()
    ) {
        this.databaseConnection = databaseConnection
        this._config = _.defaultsDeep({}, customConfig, this.defaultConfig)

        TransportLoggerFactory.init(loggerFactory)
        log = TransportLoggerFactory.getLogger(Transport)

        if (!this._config.platformClientId) {
            throw TransportErrors.general.platformClientIdNotSet().logWith(log)
        }

        if (!this._config.platformClientSecret) {
            throw TransportErrors.general.platformClientSecretNotSet().logWith(log)
        }

        if (!this._config.baseUrl) {
            throw TransportErrors.general.baseUrlNotSet().logWith(log)
        }

        this._config.identityVersion = Math.floor(this._config.identityVersion)
        if (this._config.identityVersion < 0) {
            throw TransportErrors.general.invalidIdentityVersion().logWith(log)
        }
    }

    public async init(): Promise<Transport> {
        log.trace("Initializing Libsodium...")
        await SodiumWrapper.ready()
        log.trace("Libsodium initialized")

        log.info("Transport initialized")

        return this
    }

    public async createDatabase(name: string): Promise<IDatabaseCollectionProvider> {
        return await this.databaseConnection.getDatabase(name)
    }

    public static get context(): TransportContext {
        return TransportContext.currentContext()
    }
}
