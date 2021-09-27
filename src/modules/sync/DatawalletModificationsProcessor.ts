import { IDatabaseCollectionProvider } from "@js-soft/docdb-access-abstractions"
import _ from "lodash"
import { CoreSerializableAsync } from "../../core"
import { DbCollectionNames } from "../../core/DbCollectionNames"
import { DatawalletModification, DatawalletModificationType } from "./local/DatawalletModification"

interface ICacheUpdater {
    updateCache(ids: string[]): Promise<any[]>
}

export class DatawalletModificationsProcessor {
    public constructor(
        private readonly collectionProvider: IDatabaseCollectionProvider,
        private readonly modifications: DatawalletModification[],
        private readonly fileCacheUpdater: ICacheUpdater,
        private readonly messageCacheUpdater: ICacheUpdater,
        private readonly relationshipTemplateCacheUpdater: ICacheUpdater,
        private readonly relationshipCacheUpdater: ICacheUpdater,
        private readonly tokenCacheUpdater: ICacheUpdater
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

        const fillCachePromises: Promise<any>[] = []

        for (const collectionName in cacheChangesGroupedByCollection) {
            const modificationsInCollection = cacheChangesGroupedByCollection[collectionName]

            switch (collectionName) {
                case DbCollectionNames.Files:
                    fillCachePromises.push(
                        this.fileCacheUpdater.updateCache(
                            modificationsInCollection.map((m) => m.objectIdentifier.toString())
                        )
                    )
                    break
                case DbCollectionNames.Messages:
                    fillCachePromises.push(
                        this.messageCacheUpdater.updateCache(
                            modificationsInCollection.map((m) => m.objectIdentifier.toString())
                        )
                    )
                    break
                case DbCollectionNames.Relationships:
                    // Relationship caches are filled afterwards. It requires the template caches to be filled.
                    break
                case DbCollectionNames.Templates:
                    fillCachePromises.push(
                        this.relationshipTemplateCacheUpdater.updateCache(
                            modificationsInCollection.map((m) => m.objectIdentifier.toString())
                        )
                    )
                    break
                case DbCollectionNames.Tokens:
                    fillCachePromises.push(
                        this.tokenCacheUpdater.updateCache(
                            modificationsInCollection.map((m) => m.objectIdentifier.toString())
                        )
                    )
                    break
                default:
                    throw new Error(`DB collection with name '${collectionName}' is not supported.'`)
            }
        }

        await Promise.all(fillCachePromises)

        const relationshipCacheUpdates = cacheChangesGroupedByCollection[DbCollectionNames.Relationships]

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (relationshipCacheUpdates) {
            await this.relationshipCacheUpdater.updateCache(
                relationshipCacheUpdates.map((m) => m.objectIdentifier.toString())
            )
        }
    }
}
