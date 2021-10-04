import { RandomCharacterRange } from "../util/Random"
import { CoreId } from "./types/CoreId"

export class CoreIdHelper {
    private readonly coreIdRegex: RegExp

    public constructor(public readonly prefix: string, private readonly validateOnly: boolean = false) {
        this.coreIdRegex = new RegExp(`${prefix}[${RandomCharacterRange.Alphanumeric}]{${20 - prefix.length}}`)
    }

    public async generate(): Promise<CoreId> {
        if (this.validateOnly) {
            throw new Error("This CoreIdHelper is set up for validation only.")
        }

        return await CoreId.generate(this.prefix)
    }

    public validate(id: string): boolean {
        return this.coreIdRegex.test(id)
    }
}
