import { ILogger } from "@js-soft/logging-abstractions"
import { CoreBuffer } from "@nmshd/crypto"
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"
import FormDataLib from "form-data"
import { Agent } from "http"
import { Agent as HTTPSAgent } from "https"
import _ from "lodash"
import qs from "qs"
import { IConfig } from "../../core"
import { TransportLoggerFactory } from "../TransportLoggerFactory"
import { CoreId } from "../types"
import { ClientResult } from "./ClientResult"
import { IPaginationDataSource, Paginator } from "./Paginator"
import { PlatformParameters } from "./PlatformParameters"
import { PaginatedPlatformResponse, PlatformResponse } from "./PlatformResponse"
import { RequestError } from "./RequestError"

export class RestPaginationDataSource<T> implements IPaginationDataSource<T> {
    public constructor(private readonly client: RESTClient, private readonly path: string, private args: any) {}

    public async getPage(pageNumber: number): Promise<T[]> {
        this.args.pageNumber = pageNumber
        return (await this.client.get<T[]>(this.path, this.args)).value
    }
}

export enum RESTClientLogDirective {
    LogNone,
    LogRequest,
    LogResponse,
    LogAll
}

export class RESTClient {
    protected _logger: ILogger
    protected _logDirective = RESTClientLogDirective.LogAll

    private _httpAgent?: Agent
    private _httpsAgent?: HTTPSAgent

    public logRequest(): boolean {
        return (
            this._logDirective === RESTClientLogDirective.LogRequest ||
            this._logDirective === RESTClientLogDirective.LogAll
        )
    }

    public logResponse(): boolean {
        return (
            this._logDirective === RESTClientLogDirective.LogResponse ||
            this._logDirective === RESTClientLogDirective.LogAll
        )
    }

    public createHTTPAgent(): Agent {
        if (this._httpAgent) {
            return this._httpAgent
        }
        this._httpAgent = new Agent(this.config.httpAgent)
        return this._httpAgent
    }

    public createHTTPSAgent(): HTTPSAgent {
        if (this._httpsAgent) {
            return this._httpsAgent
        }

        this._httpsAgent = new HTTPSAgent(this.config.httpsAgent)
        return this._httpsAgent
    }

    private async generateRequestId(): Promise<string> {
        const id = await CoreId.generate("HTTP")
        return id.toString()
    }

    public constructor(protected readonly config: IConfig, protected requestConfig: AxiosRequestConfig = {}) {
        const defaults: AxiosRequestConfig = {
            baseURL: config.baseUrl,

            timeout: this.config.platformTimeout,
            maxRedirects: this.config.platformMaxRedirects,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            validateStatus: (status) => status < 300 || status === 400 || status === 404 || status === 500,
            paramsSerializer: (params) => {
                return qs.stringify(params, {
                    arrayFormat: "repeat",
                    encode: false,
                    allowDots: true
                })
            }
        }

        if (this.config.platformAdditionalHeaders) {
            defaults.headers = this.config.platformAdditionalHeaders
        }

        if (typeof Agent !== "undefined" && typeof HTTPSAgent !== "undefined") {
            defaults.httpAgent = this.createHTTPAgent()
            defaults.httpsAgent = this.createHTTPSAgent()
        }

        this.requestConfig = _.defaultsDeep(this.requestConfig, defaults)

        this._logger = TransportLoggerFactory.getLogger(RESTClient)
    }

    protected createAxios(): AxiosInstance {
        const axiosInstance = axios.create(this.requestConfig)

        if (this.config.debug) {
            this.addAxiosLoggingInterceptors(axiosInstance)
        }
        return axiosInstance
    }

    private addAxiosLoggingInterceptors(axiosInstance: AxiosInstance) {
        axiosInstance.interceptors.request.use((config) => {
            const requestAsAny = config as any
            requestAsAny.meta = (config as any).meta || {}
            requestAsAny.meta.startTime = new Date().getTime()
            return config
        })

        axiosInstance.interceptors.response.use((response) => {
            logResponseTime(response)
            return response
        })

        const logResponseTime = (response: AxiosResponse) => {
            const requestStartTime = (response.config as any).meta.startTime as number

            // Backbone Call duration
            const backboneResponseDuration = response.headers?.["x-response-duration-ms"]
                ? Number.parseInt(response.headers["x-response-duration-ms"])
                : undefined

            const backboneMessage = `${response.config.method!.toUpperCase()} ${
                response.request.path
            } (backbone call): ${backboneResponseDuration ? `${backboneResponseDuration}ms` : "unknown"}`

            if (backboneResponseDuration && backboneResponseDuration > 200) {
                this._logger.warn(backboneMessage)
            } else {
                this._logger.debug(backboneMessage)
            }

            // Latency duration
            const requestEndTime = new Date().getTime()
            const callAndLatencyMilliseconds = requestEndTime - requestStartTime
            const latencyMilliseconds = backboneResponseDuration
                ? callAndLatencyMilliseconds - backboneResponseDuration
                : undefined

            const latencyMessage = `${response.config.method!.toUpperCase()} ${
                response.request.path
            } (latency): ${latencyMilliseconds}ms`

            this._logger.debug(latencyMessage)

            // Backbone Call + Latency duration
            this._logger.debug(
                `${response.config.method!.toUpperCase()} ${
                    response.request.path
                } (backbone call + latency): ${callAndLatencyMilliseconds}ms`
            )
        }
    }

    private getResult<T>(
        method: string,
        path: string,
        response: AxiosResponse<PlatformResponse<T> | undefined>,
        requestId: string
    ): ClientResult<T> {
        const platformParameters: PlatformParameters = {
            requestTime: response.headers["x-request-time"],
            responseDuration: response.headers["x-response-duration-ms"],
            responseTime: response.headers["x-response-time"],
            traceId: response.headers["x-trace-id"]
        }

        if (response.data && this.logResponse()) {
            const message = `Response ${requestId}: ${method} ${path} | TraceId: '${platformParameters.traceId}' | PlatformDuration: ${platformParameters.responseDuration}`
            try {
                this._logger.trace(message, JSON.stringify(response.data, undefined, 2))
            } catch (e) {
                this._logger.trace(message)
            }
        }

        // Rare case: We receive status 400 JSON error from backbone when downloading a file
        if (
            response.status === 400 &&
            !response.data?.error &&
            response.headers["content-type"] === "application/json; charset=utf-8"
        ) {
            try {
                const errorText = CoreBuffer.from(response.data).toUtf8()
                response.data = JSON.parse(errorText)
            } catch (e) {
                // Do nothing here: Error is handled below
            }
        }

        if (response.data?.error) {
            const backboneError = response.data.error
            const error = new RequestError(
                method,
                path,
                platformParameters,
                backboneError.code,
                backboneError.message,
                backboneError.docs,
                response.status,
                backboneError.time,
                {
                    id: backboneError.id,
                    details: backboneError.details
                }
            )
            this._logger.debug(error)
            return ClientResult.fail<T>(error, platformParameters)
        }

        if (response.status === 204) {
            return ClientResult.ok<T>({} as T, platformParameters)
        }

        if (response.status === 404) {
            const error = new RequestError(
                method,
                path,
                platformParameters,
                "error.transport.request.notFound",
                "The requested entity was not found. Make sure the ID exists and the record is not expired.",
                "",
                404
            )
            this._logger.debug(error)
            return ClientResult.fail<T>(error, platformParameters)
        }

        if (response.status >= 400 && response.status <= 499) {
            const error = new RequestError(
                method,
                path,
                platformParameters,
                "error.transport.request.badRequest",
                "The platform responded with a Bad Request without giving any specific reason.",
                "",
                response.status
            ).setObject(response.data)
            this._logger.debug(error)
            return ClientResult.fail<T>(error, platformParameters)
        }

        if ((typeof Buffer === "function" && response.data instanceof Buffer) || response.data instanceof ArrayBuffer) {
            // Casting is required for typescript to not complain => data is a buffer
            return ClientResult.ok<T>(response.data as any as T, platformParameters)
        }

        if (!response.data?.result) {
            const error = new RequestError(
                method,
                path,
                platformParameters,
                "error.transport.request.resultUndefined",
                "The Platform responded without a result."
            ).setObject(response.data)
            this._logger.debug(error)
            return ClientResult.fail<T>(error, platformParameters)
        }

        return ClientResult.ok<T>(response.data.result, platformParameters)
    }

    private getPaginator<T>(
        path: string,
        response: AxiosResponse<PaginatedPlatformResponse<T[]> | undefined>,
        requestId: string,
        args: any
    ): ClientResult<Paginator<T>> {
        const platformParameters: PlatformParameters = {
            requestTime: response.headers["x-request-time"],
            responseDuration: response.headers["x-response-duration-ms"],
            responseTime: response.headers["x-response-time"],
            traceId: response.headers["x-trace-id"]
        }

        if (response.data && this.logResponse()) {
            const message = `Response ${requestId}: GET ${path} | TraceId: '${platformParameters.traceId}' | PlatformDuration: ${platformParameters.responseDuration}`

            try {
                this._logger.trace(message, JSON.stringify(response.data, undefined, 2))
            } catch (e) {
                this._logger.trace(message)
            }
        }

        if (response.data?.error) {
            const backboneError = response.data.error
            const error = new RequestError(
                "GET",
                path,
                platformParameters,
                backboneError.code,
                backboneError.message,
                backboneError.docs,
                response.status,
                backboneError.time,
                {
                    id: backboneError.id,
                    details: backboneError.details
                }
            )
            this._logger.debug(error)
            return ClientResult.fail<Paginator<T>>(error, platformParameters)
        }

        if (response.status >= 400 && response.status <= 499) {
            const error = new RequestError(
                "GET",
                path,
                platformParameters,
                "error.transport.request.badRequest",
                "The platform responded with a Bad Request without giving any specific reason.",
                "",
                response.status
            ).setObject(response.data)
            this._logger.debug(error)
            return ClientResult.fail<Paginator<T>>(error, platformParameters)
        }

        if (!response.data?.result) {
            const error = new RequestError(
                "GET",
                path,
                platformParameters,
                "error.transport.request.resultUndefined",
                "The Platform responded without a result."
            ).setObject(response.data)
            this._logger.debug(error)
            return ClientResult.fail<Paginator<T>>(error, platformParameters)
        }

        if (!response.data.pagination) {
            response.data.pagination = {
                pageNumber: 1,
                pageSize: response.data.result.length,
                totalPages: 1,
                totalRecords: response.data.result.length
            }
        }

        const paginationDataSource = new RestPaginationDataSource<T>(this, path, args)
        const paginator = new Paginator<T>(response.data.result, response.data.pagination, paginationDataSource)

        return ClientResult.ok<Paginator<T>>(paginator, platformParameters)
    }

    public async get<T>(path: string, params: any = {}, config?: AxiosRequestConfig): Promise<ClientResult<T>> {
        const id = await this.generateRequestId()
        const conf = _.defaultsDeep({ params: params }, config, this.requestConfig)
        if (this.logRequest()) {
            const anyThis = this as any
            if (anyThis._username) {
                this._logger.trace(`Request ${id} by ${anyThis._username}: GET ${path}`)
            } else {
                this._logger.trace(`Request ${id}: GET ${path}`)
            }
        }

        try {
            const response = await this.createAxios().get<PlatformResponse<T>>(path, conf)
            return this.getResult("GET", path, response, id)
        } catch (e) {
            const err = RequestError.fromAxiosError("GET", path, e, id)
            this._logger.debug(err)
            return ClientResult.fail<T>(err)
        }
    }

    public async getPaged<T>(
        path: string,
        params: any = {},
        config?: AxiosRequestConfig
    ): Promise<ClientResult<Paginator<T>>> {
        const id = await this.generateRequestId()
        const conf = _.defaultsDeep({ params: params }, config, this.requestConfig)

        try {
            const response = await this.createAxios().get<PlatformResponse<T[]>>(path, conf)
            return this.getPaginator(path, response, id, params)
        } catch (e) {
            const err = RequestError.fromAxiosError("GET", path, e, id)
            this._logger.debug(err)
            return ClientResult.fail<Paginator<T>>(err)
        }
    }

    public async post<T>(
        path: string,
        data: any,
        params: any = {},
        config?: AxiosRequestConfig
    ): Promise<ClientResult<T>> {
        const id = await this.generateRequestId()
        const conf = _.defaultsDeep({ params: params }, config, this.requestConfig)

        if (this.logRequest()) {
            const anyThis = this as any
            if (anyThis._username) {
                this._logger.trace(`Request ${id} by ${anyThis._username}: POST ${path}`, data)
            } else {
                this._logger.trace(`Request ${id}: POST ${path}`, data)
            }
        }

        try {
            const response = await this.createAxios().post<PlatformResponse<T>>(path, data, conf)
            return this.getResult("POST", path, response, id)
        } catch (e) {
            const err = RequestError.fromAxiosError("POST", path, e, id)
            this._logger.debug(err)
            return ClientResult.fail<T>(err)
        }
    }

    public async postMultipart<T>(path: string, data: any, config?: AxiosRequestConfig): Promise<ClientResult<T>> {
        const id = await this.generateRequestId()
        const formData: any = new FormDataLib()

        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                if (key.toLowerCase() === "content") {
                    let value = data[key]

                    if (value instanceof Uint8Array && typeof Blob !== "undefined") {
                        value = new Blob([value])
                        formData.append(key, value)
                    } else {
                        formData.append(key, Buffer.from(value), {
                            filename: "cipher.bin"
                        })
                    }
                } else {
                    formData.append(key, data[key])
                }
            }
        }

        const conf = _.defaultsDeep({}, config, this.requestConfig)
        let sendData = formData
        if (typeof formData.getHeaders !== "undefined") {
            const h = formData.getHeaders()
            conf["headers"] = conf["headers"] || {}
            for (const key in h) {
                conf["headers"][key] = h[key]
            }
            sendData = formData.getBuffer()
        }
        if (this.logRequest()) {
            const anyThis = this as any
            if (anyThis._username) {
                this._logger.trace(`Request ${id} by ${anyThis._username}: POST-Upload ${path}`)
            } else {
                this._logger.trace(`Request ${id}: POST-Upload ${path}`)
            }
        }

        try {
            const response = await this.createAxios().post<PlatformResponse<T>>(path, sendData, conf)
            return this.getResult("POST-Upload", path, response, id)
        } catch (e) {
            const err = RequestError.fromAxiosError("POST-Upload", path, e, id)
            this._logger.debug(err)
            return ClientResult.fail<T>(err)
        }
    }

    public async put<T>(path: string, data: any, config?: AxiosRequestConfig): Promise<ClientResult<T>> {
        const id = await this.generateRequestId()
        const conf = _.defaultsDeep({}, config, this.requestConfig)
        if (this.logRequest()) {
            const anyThis = this as any
            if (anyThis._username) {
                this._logger.trace(`Request ${id} by ${anyThis._username}: PUT ${path}`, data)
            } else {
                this._logger.trace(`Request ${id}: PUT ${path}`, data)
            }
        }

        try {
            const response = await this.createAxios().put<PlatformResponse<T>>(path, data, conf)
            return this.getResult("PUT", path, response, id)
        } catch (e) {
            const err = RequestError.fromAxiosError("PUT", path, e, id)
            this._logger.debug(err)
            return ClientResult.fail<T>(err)
        }
    }

    public async delete<T>(path: string, config?: AxiosRequestConfig): Promise<ClientResult<T>> {
        const id = await this.generateRequestId()
        const conf = _.defaultsDeep({}, config, this.requestConfig)
        if (this.logRequest()) {
            const anyThis = this as any
            if (anyThis._username) {
                this._logger.trace(`Request ${id} by ${anyThis._username}: DELETE ${path}`)
            } else {
                this._logger.trace(`Request ${id}: DELETE ${path}`)
            }
        }

        try {
            const response = await this.createAxios().delete<PlatformResponse<T>>(path, conf)
            return this.getResult("DELETE", path, response, id)
        } catch (e) {
            const err = RequestError.fromAxiosError("DELETE", path, e, id)
            this._logger.debug(err)
            return ClientResult.fail<T>(err)
        }
    }

    public async download<T>(path: string, config?: AxiosRequestConfig): Promise<ClientResult<T>> {
        const id = await this.generateRequestId()
        const conf = _.defaultsDeep({}, config, this.requestConfig)
        conf.responseType = "arraybuffer"
        if (this.logRequest()) {
            const anyThis = this as any
            if (anyThis._username) {
                this._logger.trace(`Request ${id} by ${anyThis._username}: GET-Download ${path}`)
            } else {
                this._logger.trace(`Request ${id}: GET-Download ${path}`)
            }
        }

        try {
            const response = await this.createAxios().get<T>(path, conf)
            return this.getResult<T>("GET-Download", path, response, id)
        } catch (e) {
            const err = RequestError.fromAxiosError("GET-Download", path, e, id)
            this._logger.debug(err)
            return ClientResult.fail<T>(err)
        }
    }
}
