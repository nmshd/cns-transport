import { CoreDate, ICoreDate } from "@nmshd/transport"

export enum LogType {
    Fatal = "fatal",
    Error = "error",
    Warn = "warn",
    Info = "info",
    Debug = "debug",
    Trace = "trace"
}

export interface ILogEntry {
    time: ICoreDate
    type: LogType
    arguments: any[]
}

export class LogInterceptor {
    protected _measuringLogs = true
    private _destroyed = false

    public get measuringLogs(): boolean {
        return this._measuringLogs
    }
    protected _logs: ILogEntry[] = []
    public get logs(): ILogEntry[] {
        return this._logs
    }
    protected _controller: any
    public get controller(): any {
        return this._controller
    }
    private oldLogger: any

    public constructor(controller: any) {
        this._controller = controller
        this._measuringLogs = true
        this.injectToController(controller)
    }

    private injectToController(controller: any) {
        const anyC = controller
        if (!anyC._logger) {
            throw new Error("No _logger property found on given controller.")
        }
        this.oldLogger = anyC._logger

        anyC._logger = {
            error: (...args: any[]) => {
                this.logs.push({
                    arguments: args,
                    time: CoreDate.utc(),
                    type: LogType.Error
                })
            },
            warn: (...args: any[]) => {
                this.logs.push({
                    arguments: args,
                    time: CoreDate.utc(),
                    type: LogType.Warn
                })
            },
            info: (...args: any[]) => {
                this.logs.push({
                    arguments: args,
                    time: CoreDate.utc(),
                    type: LogType.Info
                })
            },
            debug: (...args: any[]) => {
                this.logs.push({
                    arguments: args,
                    time: CoreDate.utc(),
                    type: LogType.Debug
                })
            },
            trace: (...args: any[]) => {
                this.logs.push({
                    arguments: args,
                    time: CoreDate.utc(),
                    type: LogType.Trace
                })
            },
            fatal: (...args: any[]) => {
                this.logs.push({
                    arguments: args,
                    time: CoreDate.utc(),
                    type: LogType.Fatal
                })
            }
        }
    }

    public destroy(): void {
        const anyC = this.controller
        anyC._logger = this.oldLogger
        this._destroyed = true
    }

    public start(): this {
        if (this._destroyed) {
            throw new Error("This interceptor has already been destroyed.")
        }

        this._measuringLogs = true
        this._logs = []
        return this
    }

    public stop(): ILogEntry[] {
        this._measuringLogs = false
        return this._logs
    }
}
