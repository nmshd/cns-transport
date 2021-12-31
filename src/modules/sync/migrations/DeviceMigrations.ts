import { CoreSynchronizable } from "../../../core/CoreSynchronizable"
import { AccountController } from "../../accounts/AccountController"

export class DeviceMigrations {
    public constructor(private readonly accountController: AccountController) {}

    public async v1(): Promise<void> {
        const query = { cache: { $exists: false } }
        const synchronizableToId = (c: CoreSynchronizable) => c.id.toString()

        const files = await this.accountController.files.getFiles(query)
        if (files.length > 0) {
            await this.accountController.files.updateCache(files.map(synchronizableToId))
        }

        const messages = await this.accountController.messages.getMessages(query)
        if (messages.length > 0) {
            await this.accountController.messages.updateCache(messages.map(synchronizableToId))
        }

        const relationships = await this.accountController.relationships.getRelationships(query)
        if (relationships.length > 0) {
            await this.accountController.relationships.updateCache(relationships.map(synchronizableToId))
        }

        const templates = await this.accountController.relationshipTemplates.getRelationshipTemplates(query)
        if (templates.length > 0) {
            await this.accountController.relationshipTemplates.updateCache(templates.map(synchronizableToId))
        }

        const tokens = await this.accountController.tokens.getTokens(query)
        if (tokens.length > 0) {
            await this.accountController.tokens.updateCache(tokens.map(synchronizableToId))
        }
    }
}
