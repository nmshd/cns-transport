import { IDatabaseCollectionProvider, IDatabaseConnection } from "@js-soft/docdb-access-abstractions"
import { LokiJsConnection } from "@js-soft/docdb-access-loki"
import { MongoDbConnection } from "@js-soft/docdb-access-mongo"
import { ILoggerFactory } from "@js-soft/logging-abstractions"
import { SimpleLoggerFactory } from "@js-soft/simple-logger"
import { ISerializableAsync, SerializableAsync } from "@js-soft/ts-serval"
import { sleep } from "@js-soft/ts-utils"
import { CoreBuffer } from "@nmshd/crypto"
import {
    AccountController,
    ChangedItems,
    CoreAddress,
    CoreDate,
    CoreId,
    DependencyContainer,
    DeviceSharedSecret,
    File,
    ISendFileParameters,
    Message,
    Realm,
    Relationship,
    RelationshipStatus,
    RelationshipTemplate,
    RequestError,
    TokenContentRelationshipTemplate,
    Transport,
    TransportLoggerFactory
} from "@nmshd/transport"
import { expect } from "chai"
import * as fs from "fs"
import { LogLevel } from "typescript-logging"

export class TestUtil {
    private static readonly fatalLogger = new SimpleLoggerFactory(LogLevel.Fatal)
    private static oldLogger: ILoggerFactory

    public static useFatalLoggerFactory(): void {
        this.oldLogger = (TransportLoggerFactory as any).instance
        TransportLoggerFactory.init(this.fatalLogger)
    }
    public static useTestLoggerFactory(): void {
        TransportLoggerFactory.init(this.oldLogger)
    }

    public static expectThrows(method: Function | Promise<any>, errorMessageRegexp: RegExp | string): void {
        let error: Error | undefined
        try {
            if (typeof method === "function") {
                method()
            }
        } catch (err) {
            error = err
        }
        expect(error).to.be.an("Error")
        if (errorMessageRegexp) {
            expect(error!.message).to.match(new RegExp(errorMessageRegexp))
        }
    }

    public static async syncParallel(
        device1: AccountController,
        device2: AccountController
    ): Promise<{ winner: AccountController; looser: AccountController; thrownError: Error }> {
        let syncWinner: AccountController | undefined
        let syncLooser: AccountController | undefined
        let thrownError: Error | undefined

        const syncPromises = [
            device1
                .syncEverything()
                .then(() => {
                    syncWinner = device1
                })
                .catch((e) => {
                    syncLooser = device1
                    thrownError = e
                }),
            device2
                .syncEverything()
                .then(() => {
                    syncWinner = device2
                })
                .catch((e) => {
                    syncLooser = device2
                    thrownError = e
                })
        ]

        await Promise.all(syncPromises)

        if (!syncWinner) throw new Error("There is no winner")
        if (!syncLooser) throw new Error("There is no looser")
        if (!thrownError) throw new Error("There was no error thrown")

        return { winner: syncWinner, looser: syncLooser, thrownError: thrownError }
    }

    public static async expectThrowsRequestErrorAsync(
        method: Function | Promise<any>,
        errorMessageRegexp?: RegExp | string,
        status?: number
    ): Promise<void> {
        return await this.expectThrowsAsync(method, (error: Error) => {
            if (errorMessageRegexp) {
                expect(error.message).to.match(new RegExp(errorMessageRegexp))
            }

            expect(error).to.be.instanceOf(RequestError)

            const requestError = error as RequestError

            expect(requestError.status).to.equal(status)
        })
    }

    public static async expectThrowsAsync(
        method: Function | Promise<any>,
        customExceptionMatcher: (e: Error) => void
    ): Promise<void>

    public static async expectThrowsAsync(
        method: Function | Promise<any>,
        errorMessageRegexp: RegExp | string
    ): Promise<void>

    public static async expectThrowsAsync(
        method: Function | Promise<any>,
        errorMessageRegexp: RegExp | string | ((e: Error) => void)
    ): Promise<void> {
        let error: Error | undefined
        try {
            if (typeof method === "function") {
                await method()
            } else {
                await method
            }
        } catch (err) {
            error = err
        }
        expect(error).to.be.an("Error")

        if (typeof errorMessageRegexp === "function") {
            errorMessageRegexp(error!)
            return
        }

        if (errorMessageRegexp) {
            expect(error!.message).to.match(new RegExp(errorMessageRegexp))
        }
    }

    public static async clearAccounts(dbConnection: IDatabaseConnection): Promise<void> {
        if (dbConnection instanceof LokiJsConnection) {
            await TestUtil.clearLokiDb()
            return
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (MongoDbConnection && dbConnection instanceof MongoDbConnection) {
            await TestUtil.clearMongoDb(dbConnection)
            return
        }
    }

    private static async clearMongoDb(dbConnection: MongoDbConnection) {
        if (process.env["KEEP_TEST_DATA"]) {
            return
        }

        const adminDb = dbConnection.client.db("admin").admin()

        const list = (await adminDb.listDatabases({ nameOnly: true })) as any
        const databases = list.databases

        for (const database of databases) {
            const dbName = database.name
            if (dbName !== "local" && dbName !== "admin" && dbName !== "config") {
                const db = dbConnection.client.db(dbName)
                await db.dropDatabase()
            }
        }
    }

    private static async clearLokiDb() {
        if (typeof window === "undefined") {
            const dbFiles = (await import("glob")).sync("./db/*.db")

            for (const file of dbFiles) {
                fs.unlinkSync(file)
            }
        } else {
            window.localStorage.clear()
        }
    }

    public static async provideAccounts(
        transport: Transport,
        count: number,
        prefix: string
    ): Promise<AccountController[]> {
        const accounts: AccountController[] = []

        for (let i = 0; i < count; i++) {
            accounts.push(await this.createAccount(transport, prefix))
        }

        return accounts
    }

    public static async createAccount(
        transport: Transport,
        prefix: string,
        setupDependencies?: (container: DependencyContainer) => void
    ): Promise<AccountController> {
        const randomId = Math.random().toString(36).substring(7)
        const db: IDatabaseCollectionProvider = await transport.createDatabase(`${prefix}-${randomId}`)

        const accountController: AccountController = new AccountController(transport, Realm.Prod, db, transport.config)

        if (setupDependencies) setupDependencies(accountController.dependencyContainer)

        await accountController.init()

        return accountController
    }

    public static async onboardDevice(
        transport: Transport,
        deviceSharedSecret: DeviceSharedSecret
    ): Promise<AccountController> {
        const randomId = Math.random().toString(36).substring(7)
        const db: IDatabaseCollectionProvider = await transport.createDatabase(`acc-${randomId}`)
        const accountController: AccountController = new AccountController(
            transport,
            deviceSharedSecret.identity.realm,
            db,
            transport.config
        )
        await accountController.init(deviceSharedSecret)

        return accountController
    }

    public static async addRejectedRelationship(from: AccountController, to: AccountController): Promise<void> {
        const templateFrom = await from.relationshipTemplates.sendRelationshipTemplate({
            content: {
                mycontent: "template"
            },
            expiresAt: CoreDate.utc().add({ minutes: 5 }),
            maxNumberOfRelationships: 1
        })

        const templateToken = await TokenContentRelationshipTemplate.from({
            templateId: templateFrom.id,
            secretKey: templateFrom.secretKey
        })

        const token = await from.tokens.sendToken({
            content: templateToken,
            expiresAt: CoreDate.utc().add({ hours: 12 }),
            ephemeral: false
        })

        const tokenRef = await token.truncate()

        const receivedToken = await to.tokens.loadPeerTokenByTruncated(tokenRef, false)

        if (!(receivedToken.cache!.content instanceof TokenContentRelationshipTemplate)) {
            throw new Error("token content not instanceof TokenContentRelationshipTemplate")
        }

        const templateTo = await to.relationshipTemplates.loadPeerRelationshipTemplate(
            receivedToken.cache!.content.templateId,
            receivedToken.cache!.content.secretKey
        )

        await to.relationships.sendRelationship({
            template: templateTo,
            content: {
                mycontent: "request"
            }
        })

        // Reject relationship
        const syncedRelationships = await TestUtil.syncUntilHasRelationships(from)
        expect(syncedRelationships).to.have.lengthOf(1)
        const pendingRelationship = syncedRelationships[0]
        expect(pendingRelationship.status).to.equal(RelationshipStatus.Pending)

        const rejectedRelationshipFromSelf = await from.relationships.rejectChange(
            pendingRelationship.cache!.creationChange,
            {}
        )
        expect(rejectedRelationshipFromSelf.status).to.equal(RelationshipStatus.Rejected)

        // Get accepted relationship
        const syncedRelationshipsPeer = await TestUtil.syncUntilHasRelationships(to)
        expect(syncedRelationshipsPeer).to.have.lengthOf(1)
        const acceptedRelationshipPeer = syncedRelationshipsPeer[0]
        expect(acceptedRelationshipPeer.status).to.equal(RelationshipStatus.Rejected)
    }

    public static async addRelationship(from: AccountController, to: AccountController): Promise<Relationship[]> {
        const templateFrom = await from.relationshipTemplates.sendRelationshipTemplate({
            content: {
                mycontent: "template"
            },
            expiresAt: CoreDate.utc().add({ minutes: 5 }),
            maxNumberOfRelationships: 1
        })

        const templateToken = await TokenContentRelationshipTemplate.from({
            templateId: templateFrom.id,
            secretKey: templateFrom.secretKey
        })

        const token = await from.tokens.sendToken({
            content: templateToken,
            expiresAt: CoreDate.utc().add({ hours: 12 }),
            ephemeral: false
        })

        const tokenRef = await token.truncate()

        const receivedToken = await to.tokens.loadPeerTokenByTruncated(tokenRef, false)

        if (!(receivedToken.cache!.content instanceof TokenContentRelationshipTemplate)) {
            throw new Error("token content not instanceof TokenContentRelationshipTemplate")
        }

        const templateTo = await to.relationshipTemplates.loadPeerRelationshipTemplate(
            receivedToken.cache!.content.templateId,
            receivedToken.cache!.content.secretKey
        )

        const relRequest = await to.relationships.sendRelationship({
            template: templateTo,
            content: {
                mycontent: "request"
            }
        })

        // Accept relationship
        const syncedRelationships = await TestUtil.syncUntilHasRelationships(from)
        expect(syncedRelationships).to.have.lengthOf(1)
        const pendingRelationship = syncedRelationships[0]
        expect(pendingRelationship.status).to.equal(RelationshipStatus.Pending)

        const acceptedRelationshipFromSelf = await from.relationships.acceptChange(
            pendingRelationship.cache!.creationChange,
            {}
        )
        expect(acceptedRelationshipFromSelf.status).to.equal(RelationshipStatus.Active)

        // Get accepted relationship
        await this.sleep(300)
        const syncedRelationshipsPeer = (
            await TestUtil.syncUntil(to, (syncResult) => syncResult.relationships.length > 0)
        ).relationships

        await from.syncDatawallet()

        expect(syncedRelationshipsPeer).to.have.lengthOf(1)
        const acceptedRelationshipPeer = syncedRelationshipsPeer[0]
        expect(acceptedRelationshipPeer.status).to.equal(RelationshipStatus.Active)
        expect(relRequest.id.toString()).equals(acceptedRelationshipFromSelf.id.toString())
        expect(relRequest.id.toString()).equals(acceptedRelationshipPeer.id.toString())

        return [acceptedRelationshipFromSelf, acceptedRelationshipPeer]
    }

    /**
     * SyncEvents in the backbone are only enventually consistent. This means that if you send a message now and
     * get all SyncEvents right after, you cannot rely on getting a NewMessage SyncEvent right away. So instead
     * this method executes the syncEverything()-method of the account controller until the condition specified in
     * the `until` callback is met.
     */
    public static async syncUntil(
        accountController: AccountController,
        until: (syncResult: ChangedItems) => boolean
    ): Promise<ChangedItems> {
        const { messages, relationships } = await accountController.syncEverything()
        const syncResult = new ChangedItems([...relationships], [...messages])

        let iterationNumber = 0
        while (!until(syncResult) && iterationNumber < 20) {
            await sleep(150 * iterationNumber)
            const newSyncResult = await accountController.syncEverything()
            syncResult.messages.push(...newSyncResult.messages)
            syncResult.relationships.push(...newSyncResult.relationships)
            iterationNumber++
        }
        return syncResult
    }

    public static async syncUntilHasRelationships(accountController: AccountController): Promise<Relationship[]> {
        const syncResult = await TestUtil.syncUntil(
            accountController,
            (syncResult) => syncResult.relationships.length > 0
        )
        return syncResult.relationships
    }

    public static async syncUntilHasRelationship(
        accountController: AccountController,
        id: CoreId
    ): Promise<Relationship[]> {
        const syncResult = await TestUtil.syncUntil(accountController, (syncResult) =>
            syncResult.relationships.some((r) => r.id === id)
        )
        return syncResult.relationships
    }

    public static async syncUntilHasMessages(
        accountController: AccountController,
        expectedNumberOfMessages = 1
    ): Promise<Message[]> {
        const syncResult = await TestUtil.syncUntil(
            accountController,
            (syncResult) => syncResult.messages.length >= expectedNumberOfMessages
        )
        return syncResult.messages
    }

    public static async syncUntilHasMessage(accountController: AccountController, id: CoreId): Promise<Message[]> {
        const syncResult = await TestUtil.syncUntil(accountController, (syncResult) =>
            syncResult.messages.some((m) => m.id.equals(id))
        )
        return syncResult.messages
    }

    public static async syncUntilHasError(accountController: AccountController): Promise<any> {
        try {
            await TestUtil.syncUntilHasMessages(accountController, 100)
        } catch (e) {
            return e
        }

        throw new Error("no error occured")
    }

    public static async sendRelationshipTemplate(
        from: AccountController,
        body?: ISerializableAsync
    ): Promise<RelationshipTemplate> {
        if (!body) {
            body = {
                content: "template"
            }
        }
        return await from.relationshipTemplates.sendRelationshipTemplate({
            content: body,
            expiresAt: CoreDate.utc().add({ minutes: 5 }),
            maxNumberOfRelationships: 1
        })
    }

    public static async sendRelationshipTemplateAndToken(
        account: AccountController,
        body?: ISerializableAsync
    ): Promise<string> {
        if (!body) {
            body = {
                content: "template"
            }
        }
        const template = await account.relationshipTemplates.sendRelationshipTemplate({
            content: body,
            expiresAt: CoreDate.utc().add({ minutes: 5 }),
            maxNumberOfRelationships: 1
        })
        const templateToken = await TokenContentRelationshipTemplate.from({
            templateId: template.id,
            secretKey: template.secretKey
        })

        const token = await account.tokens.sendToken({
            content: templateToken,
            expiresAt: CoreDate.utc().add({ minutes: 5 }),
            ephemeral: false
        })

        const tokenRef = await token.truncate()
        return tokenRef
    }

    public static async sendRelationship(
        account: AccountController,
        template: RelationshipTemplate,
        body?: ISerializableAsync
    ): Promise<Relationship> {
        if (!body) {
            body = {
                content: "request"
            }
        }
        return await account.relationships.sendRelationship({
            template: template,
            content: body
        })
    }

    public static async fetchRelationshipTemplateFromTokenReference(
        account: AccountController,
        tokenReference: string
    ): Promise<RelationshipTemplate> {
        const receivedToken = await account.tokens.loadPeerTokenByTruncated(tokenReference, false)

        if (!(receivedToken.cache!.content instanceof TokenContentRelationshipTemplate)) {
            throw new Error("token content not instanceof TokenContentRelationshipTemplate")
        }

        const template = await account.relationshipTemplates.loadPeerRelationshipTemplate(
            receivedToken.cache!.content.templateId,
            receivedToken.cache!.content.secretKey
        )
        return template
    }

    public static async sendMessage(
        from: AccountController,
        to: AccountController,
        content?: SerializableAsync
    ): Promise<Message> {
        return await this.sendMessagesWithFiles(from, [to], [], content)
    }

    public static async sendMessageWithFile(
        from: AccountController,
        to: AccountController,
        file: File,
        content?: SerializableAsync
    ): Promise<Message> {
        return await this.sendMessagesWithFiles(from, [to], [file], content)
    }

    public static async sendMessagesWithFile(
        from: AccountController,
        recipients: AccountController[],
        file: File,
        content?: SerializableAsync
    ): Promise<Message> {
        return await this.sendMessagesWithFiles(from, recipients, [file], content)
    }

    public static async sendMessagesWithFiles(
        from: AccountController,
        recipients: AccountController[],
        files: File[],
        content?: SerializableAsync
    ): Promise<Message> {
        const recipientAddresses: CoreAddress[] = []
        for (const controller of recipients) {
            recipientAddresses.push(controller.identity.address)
        }
        if (!content) {
            content = await SerializableAsync.from({ content: "TestContent" }, SerializableAsync)
        }
        return await from.messages.sendMessage({
            recipients: recipientAddresses,
            content: content,
            attachments: files
        })
    }

    public static async uploadFile(from: AccountController, fileContent: CoreBuffer): Promise<File> {
        const params: ISendFileParameters = {
            buffer: fileContent,
            title: "Test",
            description: "Dies ist eine Beschreibung",
            filename: "Test.bin",
            filemodified: CoreDate.from("2019-09-30T00:00:00.000Z"),
            mimetype: "application/json",
            expiresAt: CoreDate.utc().add({ minutes: 5 })
        }

        const file: File = await from.files.sendFile(params)
        return file
    }

    public static async sleep(ms = 500): Promise<void> {
        if (ms <= 0) throw new Error("Please enter a positive value greater than 0.")

        return await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, ms)
        })
    }
}
