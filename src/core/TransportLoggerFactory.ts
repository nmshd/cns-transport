import { ILogger, ILoggerFactory } from "@js-soft/logging-abstractions"
import { TransportErrors } from "./TransportErrors"

export class TransportLoggerFactory {
    private static instance: ILoggerFactory

    public static init(instance: ILoggerFactory): void {
        this.instance = instance
    }

    public static getLogger(name: string | Function): ILogger {
        if (!this.isInitialized()) {
            throw TransportErrors.util.logging.loggerNotInitialized()
        }

        if (typeof name === "function") {
            return this.instance.getLogger(`Transport.${name.name}`)
        }

        return this.instance.getLogger(`Transport.${name}`)
    }

    public static isInitialized(): boolean {
        return !!this.instance
    }
}
