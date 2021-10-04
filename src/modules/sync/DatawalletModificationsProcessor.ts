/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { IDatabaseCollectionProvider } from "@js-soft/docdb-access-abstractions"
import { ILogger } from "@js-soft/logging-abstractions"
import {
    CachedFile,
    CachedMessage,
    CachedRelationship,
    CachedRelationshipTemplate,
    CachedToken,
    File,
    FileController,
    Message,
    MessageController,
    Relationship,
    RelationshipsController,
    RelationshipTemplate,
    RelationshipTemplateController,
    Token,
    TokenController
} from "@nmshd/transport"
import _ from "lodash"
import { ICacheable } from "src/core/ICacheable"
import { CoreId, CoreSerializableAsync } from "../../core"
import { DbCollectionName } from "../../core/DbCollectionName"
import { DatawalletModification, DatawalletModificationType } from "./local/DatawalletModification"

export class DatawalletModificationsProcessor {
    public constructor(
        private readonly cacher: CacheFetcher,
        private readonly collectionProvider: IDatabaseCollectionProvider,
        private readonly modifications: DatawalletModification[]
    ) {}

    public async execute(): Promise<void> {
        const modificationsGroupedByType = _.groupBy(this.modifications, (m) => m.type)

        await this.applyCreations(modificationsGroupedByType[DatawalletModificationType.Create])
        await this.applyUpdates(modificationsGroupedByType[DatawalletModificationType.Update])
        await this.applyDeletes(modificationsGroupedByType[DatawalletModificationType.Delete])
        await this.applyCacheChanges(modificationsGroupedByType[DatawalletModificationType.CacheChanged])
    }

    private async applyCreations(creations?: DatawalletModification[]) {
        if (!creations || creations.length === 0) {
            return
        }

        const creationsGroupedByObjectIdentifier = _.groupBy(creations, (c) => c.objectIdentifier)

        for (const objectIdentifier in creationsGroupedByObjectIdentifier) {
            const currentCreations = creationsGroupedByObjectIdentifier[objectIdentifier]

            const targetCollection = await this.collectionProvider.getCollection(currentCreations[0].collection)

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

            await targetCollection.create(newObject)
        }
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

        const cacheChangesGroupedByCollection = _.groupBy(cacheChanges, (c) => c.collection)

        const caches = await this.cacher.fetchCacheFor({
            files: (cacheChangesGroupedByCollection[DbCollectionName.Files] ?? []).map((m) => m.objectIdentifier),
            messages: (cacheChangesGroupedByCollection[DbCollectionName.Messages] ?? []).map((m) => m.objectIdentifier),
            relationshipTemplates: (cacheChangesGroupedByCollection[DbCollectionName.RelationshipTemplates] ?? []).map(
                (m) => m.objectIdentifier
            ),
            tokens: (cacheChangesGroupedByCollection[DbCollectionName.Tokens] ?? []).map((m) => m.objectIdentifier)
        })

        await this.save(caches.files, DbCollectionName.Files, File)
        await this.save(caches.messages, DbCollectionName.Messages, Message)
        await this.save(caches.relationshipTemplates, DbCollectionName.RelationshipTemplates, RelationshipTemplate)
        await this.save(caches.tokens, DbCollectionName.Tokens, Token)

        const relationshipCaches = await this.cacher.fetchCacheFor({
            relationships: (cacheChangesGroupedByCollection[DbCollectionName.Relationships] ?? []).map(
                (m) => m.objectIdentifier
            )
        })
        await this.save(relationshipCaches.relationships, DbCollectionName.Relationships, Relationship)
    }

    private async save<T extends ICacheable>(
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
        private readonly tokenController: TokenController,
        private readonly logger: ILogger
    ) {}

    public async fetchCacheFor(itemIds: FetchCacheInput): Promise<FetchCacheOutput> {
        const caches = await Promise.all([
            this.fetchCaches(this.fileController, itemIds.files),
            this.fetchCaches(this.messageController, itemIds.messages),
            this.fetchCaches(this.relationshipController, itemIds.relationships),
            this.fetchCaches(this.relationshipTemplateController, itemIds.relationshipTemplates),
            this.fetchCaches(this.tokenController, itemIds.tokens)
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
