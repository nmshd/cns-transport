/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { IDatabaseCollectionProvider } from "@js-soft/docdb-access-abstractions"
import { ILogger } from "@js-soft/logging-abstractions"
import _ from "lodash"
import { CoreId, CoreSerializableAsync, TransportErrors, TransportIds } from "../../core"
import { DbCollectionName } from "../../core/DbCollectionName"
import { ICacheable } from "../../core/ICacheable"
import { FileController } from "../files/FileController"
import { CachedFile } from "../files/local/CachedFile"
import { File } from "../files/local/File"
import { CachedMessage } from "../messages/local/CachedMessage"
import { Message } from "../messages/local/Message"
import { MessageController } from "../messages/MessageController"
import { CachedRelationship } from "../relationships/local/CachedRelationship"
import { Relationship } from "../relationships/local/Relationship"
import { RelationshipsController } from "../relationships/RelationshipsController"
import { CachedRelationshipTemplate } from "../relationshipTemplates/local/CachedRelationshipTemplate"
import { RelationshipTemplate } from "../relationshipTemplates/local/RelationshipTemplate"
import { RelationshipTemplateController } from "../relationshipTemplates/RelationshipTemplateController"
import { CachedToken } from "../tokens/local/CachedToken"
import { Token } from "../tokens/local/Token"
import { TokenController } from "../tokens/TokenController"
import { DatawalletModification, DatawalletModificationType } from "./local/DatawalletModification"

export class DatawalletModificationsProcessor {
    private readonly creates: DatawalletModification[]
    private readonly updates: DatawalletModification[]
    private readonly deletes: DatawalletModification[]
    private readonly cacheChanges: DatawalletModification[]

    public constructor(
        modifications: DatawalletModification[],
        private readonly cacheFetcher: CacheFetcher,
        private readonly collectionProvider: IDatabaseCollectionProvider,
        private readonly logger: ILogger
    ) {
        const modificationsGroupedByType = _.groupBy(modifications, (m) => m.type)

        this.creates = modificationsGroupedByType[DatawalletModificationType.Create] ?? []
        this.updates = modificationsGroupedByType[DatawalletModificationType.Update] ?? []
        this.deletes = modificationsGroupedByType[DatawalletModificationType.Delete] ?? []
        this.cacheChanges = modificationsGroupedByType[DatawalletModificationType.CacheChanged] ?? []
    }

    private readonly collectionsWithCacheableItems: string[] = [
        DbCollectionName.Files,
        DbCollectionName.Messages,
        DbCollectionName.Relationships,
        DbCollectionName.RelationshipTemplates,
        DbCollectionName.Tokens
    ]

    public async execute(): Promise<void> {
        await this.applyCreates()
        await this.applyUpdates()
        await this.applyCacheChanges()
        await this.applyDeletes()
    }

    private async applyCreates() {
        if (this.creates.length === 0) {
            return
        }

        const createsGroupedByObjectIdentifier = _.groupBy(this.creates, (c) => c.objectIdentifier)

        for (const objectIdentifier in createsGroupedByObjectIdentifier) {
            const currentCreates = createsGroupedByObjectIdentifier[objectIdentifier]

            const targetCollectionName = currentCreates[0].collection
            const targetCollection = await this.collectionProvider.getCollection(targetCollectionName)

            let mergedCreate = { id: objectIdentifier }

            for (const create of currentCreates) {
                mergedCreate = { ...mergedCreate, ...create.payload }
            }

            const newObject = await CoreSerializableAsync.fromUnknown(mergedCreate)

            const oldDoc = await targetCollection.read(objectIdentifier)
            if (oldDoc) {
                const oldObject = await CoreSerializableAsync.fromUnknown(oldDoc)
                const updatedObject = { ...oldObject.toJSON(), ...newObject.toJSON() }
                await targetCollection.update(oldDoc, updatedObject)
            }

            if (this.collectionsWithCacheableItems.includes(targetCollectionName)) {
                const modification = DatawalletModification.from({
                    localId: await TransportIds.datawalletModification.generate(),
                    type: DatawalletModificationType.CacheChanged,
                    collection: targetCollectionName,
                    objectIdentifier: CoreId.from(objectIdentifier)
                })

                this.cacheChanges.push(modification)
            }

            await targetCollection.create(newObject)
        }
    }

    private async applyUpdates() {
        if (this.updates.length === 0) {
            return
        }

        for (const updateModification of this.updates) {
            const targetCollection = await this.collectionProvider.getCollection(updateModification.collection)
            const oldDoc = await targetCollection.read(updateModification.objectIdentifier.toString())

            if (!oldDoc) {
                throw new Error("Document to update was not found.")
            }

            const oldObject = await CoreSerializableAsync.fromUnknown(oldDoc)
            const newObject = { ...oldObject.toJSON(), ...updateModification.payload }

            await targetCollection.update(oldDoc, newObject)
        }
    }

    private async applyCacheChanges() {
        if (this.cacheChanges.length === 0) {
            return
        }

        const cacheChangesGroupedByCollection = this.groupCacheChangesByCollection(this.cacheChanges)

        const caches = await this.cacheFetcher.fetchCacheFor({
            files: cacheChangesGroupedByCollection.fileIds,
            messages: cacheChangesGroupedByCollection.messageIds,
            relationshipTemplates: cacheChangesGroupedByCollection.relationshipTemplateIds,
            tokens: cacheChangesGroupedByCollection.tokenIds
        })

        await this.saveNewCaches(caches.files, DbCollectionName.Files, File)
        await this.saveNewCaches(caches.messages, DbCollectionName.Messages, Message)
        await this.saveNewCaches(
            caches.relationshipTemplates,
            DbCollectionName.RelationshipTemplates,
            RelationshipTemplate
        )
        await this.saveNewCaches(caches.tokens, DbCollectionName.Tokens, Token)

        // Need to fetch the cache for relationships after the cache for relationship templates was fetched,
        // because when building the relationship cache, the cache of thecorresponding relationship template
        // is needed
        const relationshipCaches = await this.cacheFetcher.fetchCacheFor({
            relationships: cacheChangesGroupedByCollection.relationshipIds
        })
        await this.saveNewCaches(relationshipCaches.relationships, DbCollectionName.Relationships, Relationship)
    }

    private groupCacheChangesByCollection(cacheChanges: DatawalletModification[]) {
        const groups = _.groupBy(cacheChanges, (c) => c.collection)

        const fileIds = (groups[DbCollectionName.Files] ?? []).map((m) => m.objectIdentifier)
        delete groups[DbCollectionName.Files]

        const messageIds = (groups[DbCollectionName.Messages] ?? []).map((m) => m.objectIdentifier)
        delete groups[DbCollectionName.Messages]

        const relationshipIds = (groups[DbCollectionName.Relationships] ?? []).map((m) => m.objectIdentifier)
        delete groups[DbCollectionName.Relationships]

        const relationshipTemplateIds = (groups[DbCollectionName.RelationshipTemplates] ?? []).map(
            (m) => m.objectIdentifier
        )
        delete groups[DbCollectionName.RelationshipTemplates]

        const tokenIds = (groups[DbCollectionName.Tokens] ?? []).map((m) => m.objectIdentifier)
        delete groups[DbCollectionName.Tokens]

        const unsupportedCollections = Object.keys(groups) // all collections not deleted before are considered as unsupported

        if (unsupportedCollections.length > 0) {
            throw TransportErrors.datawallet
                .unsupportedModification("unsupportedCacheChangedModificationCollection", unsupportedCollections)
                .logWith(this.logger)
        }

        return { fileIds, messageIds, relationshipTemplateIds, tokenIds, relationshipIds }
    }

    private async saveNewCaches<T extends ICacheable>(
        caches: FetchCacheOutputItem<any>[],
        collectionName: DbCollectionName,
        constructorOfT: new () => T
    ) {
        const collection = await this.collectionProvider.getCollection(collectionName)

        await Promise.all(
            caches.map(async (c) => {
                const itemDoc = await collection.read(c.id.toString())
                const item = await CoreSerializableAsync.fromT(itemDoc, constructorOfT)
                item.setCache(c.cache)
                await collection.update(itemDoc, item)
            })
        )
    }

    private async applyDeletes() {
        if (this.deletes.length === 0) {
            return
        }

        for (const deleteModification of this.deletes) {
            const targetCollection = await this.collectionProvider.getCollection(deleteModification.collection)
            await targetCollection.delete({ id: deleteModification.objectIdentifier })
        }
    }
}

export class CacheFetcher {
    public constructor(
        private readonly fileController: FileController,
        private readonly messageController: MessageController,
        private readonly relationshipTemplateController: RelationshipTemplateController,
        private readonly relationshipController: RelationshipsController,
        private readonly tokenController: TokenController
    ) {}

    public async fetchCacheFor(input: FetchCacheInput): Promise<FetchCacheOutput> {
        const caches = await Promise.all([
            this.fetchCaches(this.fileController, input.files),
            this.fetchCaches(this.messageController, input.messages),
            this.fetchCaches(this.relationshipController, input.relationships),
            this.fetchCaches(this.relationshipTemplateController, input.relationshipTemplates),
            this.fetchCaches(this.tokenController, input.tokens)
        ])

        const output: FetchCacheOutput = {
            files: caches[0],
            messages: caches[1],
            relationships: caches[2],
            relationshipTemplates: caches[3],
            tokens: caches[4]
        }

        return output
    }

    private async fetchCaches<TCache>(
        controller: { fetchCaches(ids: CoreId[]): Promise<FetchCacheOutputItem<TCache>[]> },
        ids?: CoreId[]
    ) {
        if (!ids) return []
        const caches = await controller.fetchCaches(ids)
        return caches
    }
}

interface FetchCacheInput {
    files?: CoreId[]
    messages?: CoreId[]
    relationships?: CoreId[]
    relationshipTemplates?: CoreId[]
    tokens?: CoreId[]
}

interface FetchCacheOutput {
    files: FetchCacheOutputItem<CachedFile>[]
    messages: FetchCacheOutputItem<CachedMessage>[]
    relationships: FetchCacheOutputItem<CachedRelationship>[]
    relationshipTemplates: FetchCacheOutputItem<CachedRelationshipTemplate>[]
    tokens: FetchCacheOutputItem<CachedToken>[]
}

interface FetchCacheOutputItem<TCache> {
    id: CoreId
    cache: TCache
}
