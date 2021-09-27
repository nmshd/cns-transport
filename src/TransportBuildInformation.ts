import { ServalBuildInformation } from "@js-soft/ts-serval"
import { CryptoBuildInformation } from "@nmshd/crypto"

export class TransportBuildInformation {
    public readonly version: string = "{{version}}"
    public readonly build: string = "{{build}}"
    public readonly date: string = "{{date}}"
    public readonly commit: string = "{{commit}}"
    public readonly dependencies: object

    public readonly crypto = CryptoBuildInformation.info
    public readonly serval = ServalBuildInformation.info

    private constructor() {
        try {
            // eslint-disable-next-line @typescript-eslint/quotes
            this.dependencies = JSON.parse(`{{dependencies}}`)
        } catch (e) {
            this.dependencies = {}
        }
    }

    public static readonly info: TransportBuildInformation = new TransportBuildInformation()
}
