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
    public constructor(
        private readonly cacheFetcher: CacheFetcher,
        private readonly collectionProvider: IDatabaseCollectionProvider,
        private readonly modifications: DatawalletModification[],
        private readonly logger: ILogger
    ) {}

    private readonly collectionsWithCacheableItems: string[] = [
        DbCollectionName.Files,
        DbCollectionName.Messages,
        DbCollectionName.Relationships,
        DbCollectionName.RelationshipTemplates,
        DbCollectionName.Tokens
    ]

    public async execute(): Promise<void> {
        const modificationsGroupedByType = _.groupBy(this.modifications, (m) => m.type)

        const cacheChangesForCreatedItems = await this.applyCreations(
            modificationsGroupedByType[DatawalletModificationType.Create]
        )

        await this.applyUpdates(modificationsGroupedByType[DatawalletModificationType.Update])
        await this.applyDeletes(modificationsGroupedByType[DatawalletModificationType.Delete])

        const cacheChanges = modificationsGroupedByType[DatawalletModificationType.CacheChanged] ?? []
        cacheChanges.push(...cacheChangesForCreatedItems)
        await this.applyCacheChanges(cacheChanges)
    }

    private async applyCreations(creations?: DatawalletModification[]) {
        if (!creations || creations.length === 0) {
            return []
        }

        const creationsGroupedByObjectIdentifier = _.groupBy(creations, (c) => c.objectIdentifier)

        const cacheChangesForCreatedItems: DatawalletModification[] = []

        for (const objectIdentifier in creationsGroupedByObjectIdentifier) {
            const currentCreations = creationsGroupedByObjectIdentifier[objectIdentifier]

            const targetCollectionName = currentCreations[0].collection
            const targetCollection = await this.collectionProvider.getCollection(targetCollectionName)

            let mergedCreation = { id: objectIdentifier }

            for (const creation of currentCreations) {
                mergedCreation = { ...mergedCreation, ...creation.payload }
            }

            const newObject = await CoreSerializableAsync.fromUnknown(mergedCreation)

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

                cacheChangesForCreatedItems.push(modification)
            }

            await targetCollection.create(newObject)
        }

        return cacheChangesForCreatedItems
    }

    private async applyUpdates(updateModifications?: DatawalletModification[]) {
        if (!updateModifications || updateModifications.length === 0) {
            return
        }

        for (const updateModification of updateModifications) {
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

    private async applyDeletes(deleteModifications?: DatawalletModification[]) {
        if (!deleteModifications || deleteModifications.length === 0) {
            return
        }

        for (const deleteModification of deleteModifications) {
            const targetCollection = await this.collectionProvider.getCollection(deleteModification.collection)
            await targetCollection.delete({ id: deleteModification.objectIdentifier })
        }
    }

    private async applyCacheChanges(cacheChanges?: DatawalletModification[]) {
        if (!cacheChanges || cacheChanges.length === 0) {
            return
        }

        const cacheChangesGroupedByCollection = this.groupCacheChangesByCollection(cacheChanges)

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
