import { ILogger, ILoggerFactory } from "@js-soft/logging-abstractions"
import { CoreErrors } from "./CoreErrors"

export class CoreLoggerFactory {
    private static instance: ILoggerFactory

    public static init(instance: ILoggerFactory): void {
        this.instance = instance
    }

    public static getLogger(name: string | Function): ILogger {
        if (!this.isInitialized()) {
            throw CoreErrors.util.logging.loggerNotInitialized()
        }

        if (typeof name === "function") {
            return this.instance.getLogger(`Core.${name.name}`)
        }

        return this.instance.getLogger(`Core.${name}`)
    }

    public static isInitialized(): boolean {
        return !!this.instance
    }
}
