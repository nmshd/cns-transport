import { IDatabaseCollectionProvider, IDatabaseConnection } from "@js-soft/docdb-access-abstractions"
import { ILogger, ILoggerFactory } from "@js-soft/logging-abstractions"
import { SimpleLoggerFactory } from "@js-soft/simple-logger"
import { SodiumWrapper } from "@nmshd/crypto"
import { AgentOptions } from "http"
import { AgentOptions as HTTPSAgentOptions } from "https"
import _ from "lodash"
import { Realm } from "../modules/accounts/data/Identity"
import { CoreContext } from "./CoreContext"
import { CoreLoggerFactory } from "./CoreLoggerFactory"
import { TransportErrors } from "./TransportErrors"

let log: ILogger

export interface IConfig {
    debug: boolean
    platformClientId: string
    platformClientSecret: string
    platformTimeout: number
    platformMaxRedirects: number
    platformMaxUnencryptedFileSize: number
    platformAdditionalHeaders?: object
    baseUrl: string
    useGateway: boolean
    realm: Realm
    datawalletEnabled: boolean
    httpAgent: AgentOptions
    httpsAgent: HTTPSAgentOptions
}

export interface IConfigOverwrite {
    debug?: boolean
    platformClientId: string
    platformClientSecret: string
    platformTimeout?: number
    platformMaxRedirects?: number
    platformMaxUnencryptedFileSize?: number
    platformAdditionalHeaders?: object
    baseUrl?: string
    useGateway?: boolean
    realm?: Realm
    datawalletEnabled?: boolean
    httpAgent?: AgentOptions
    httpsAgent?: HTTPSAgentOptions
}

export class Core {
    private readonly databaseConnection: IDatabaseConnection

    private readonly _config: IConfig
    public get config(): IConfig {
        return this._config
    }

    public defaultConfig: IConfig = {
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
        customConfig: IConfigOverwrite = {
            platformClientId: "",
            platformClientSecret: ""
        },
        loggerFactory: ILoggerFactory = new SimpleLoggerFactory()
    ) {
        this.databaseConnection = databaseConnection
        this._config = _.defaultsDeep({}, customConfig, this.defaultConfig)

        CoreLoggerFactory.init(loggerFactory)
        log = CoreLoggerFactory.getLogger(Core)

        if (!this._config.platformClientId) {
            throw TransportErrors.general.platformClientIdNotSet().logWith(log)
        }

        if (!this._config.platformClientSecret) {
            throw TransportErrors.general.platformClientSecretNotSet().logWith(log)
        }

        if (!this._config.baseUrl) {
            throw TransportErrors.general.baseUrlNotSet().logWith(log)
        }
    }

    public async init(): Promise<Core> {
        log.trace("Initializing Libsodium...")
        await SodiumWrapper.ready()
        log.trace("Libsodium initialized")

        log.info("Core initialized")

        return this
    }

    public async createDatabase(name: string): Promise<IDatabaseCollectionProvider> {
        return await this.databaseConnection.getDatabase(name)
    }

    public static get context(): CoreContext {
        return CoreContext.currentContext()
    }
}
