/* eslint-disable jest/no-commented-out-tests */
// TODO: JSSNMSHDD-2492 (make all unit tests run)
/*
import { IDatabaseCollection, IDatabaseCollectionProvider } from "@js-soft/docdb-access-abstractions"
import { LokiJsCollection } from "@js-soft/docdb-access-loki"
import {
    CoreId,
    DatawalletModification,
    DatawalletModificationCategory,
    DatawalletModificationsProcessor,
    DatawalletModificationType,
    TransportIds
} from "@nmshd/transport"
import { uniqueId } from "lodash"
import { anyString, instance, mock, verify, when } from "ts-mockito"
import { AbstractTest } from "../../core"
import { DatawalletModificationBuilder } from "./builder/DatawalletModificationBuilder"
import { ACollectionItem } from "./data/ACollectionItem"
import { FakeDatabaseCollection } from "./fakes/FakeDatabaseCollection"
import { FakeDbCollectionProvider } from "./fakes/FakeDbCollectionProvider"
import { objectWith } from "./fakes/PartialObjectMatcher"

export class DatawalletModificationsProcessorTest extends AbstractTest {
    public run(): void {
        describe("DatawalletModificationsProcessor", function () {
            it("when applying 'create' modifications, should create corresponding objects in database", async function () {
                // Arrange
                const fakeDbCollectionProvider = new FakeDbCollectionProvider()
                const mockCollection = mock<IDatabaseCollection>()

                fakeDbCollectionProvider.setCollection(instance(mockCollection))

                const datawalletModification = await createDatawalletModification({
                    type: DatawalletModificationType.Create,
                    payloadCategory: DatawalletModificationCategory.TechnicalData,
                    collection: "ACollection",
                    payload: {
                        "@type": ACollectionItem.name,
                        "@context": "https://schema.corp",
                        someTechnicalStringProperty: "Some value"
                    }
                })

                const modificatorUnderTest = createDatawalletModificator(fakeDbCollectionProvider, [
                    datawalletModification
                ])

                // Act
                await modificatorUnderTest.execute()

                // Assert
                verify(
                    mockCollection.create({
                        id: CoreId.from(datawalletModification.objectIdentifier),
                        someTechnicalStringProperty: "Some value"
                    })
                ).once()
            })

            it("when applying UpdateModifications, should update corresponding objects in database", async function () {
                // Arrange
                const fakeDbCollectionProvider = new FakeDbCollectionProvider()
                const mockCollection = mock(LokiJsCollection)

                const anItem = await ACollectionItem.from({
                    id: await CoreId.generate(),
                    someTechnicalStringProperty: "Some value"
                })

                when(mockCollection.read(anyString())).thenResolve({ ...anItem.toJSON() })

                const collection = instance(mockCollection)
                fakeDbCollectionProvider.setCollection(collection)

                const datawalletModification = new DatawalletModificationBuilder()
                    .withObjectIdentifier(anItem.id)
                    .withType(DatawalletModificationType.Update)
                    .withCollection("ACollection")
                    .withPayload({
                        "@type": ACollectionItem.name,
                        "@context": "https://schema.corp",
                        someTechnicalStringProperty: "Some updated value"
                    })
                    .build()

                const modificatorUnderTest = createDatawalletModificator(fakeDbCollectionProvider, [
                    datawalletModification
                ])

                // Act
                await modificatorUnderTest.execute()

                // Assert
                verify(
                    mockCollection.update(
                        objectWith<any>({ id: anItem.id.toString() }),
                        objectWith<ACollectionItem>({
                            id: anItem.id,
                            someTechnicalStringProperty: "Some updated value"
                        })
                    )
                ).once()
            })

            // it("should not delete $loki", async function () {})

            it("should write to collection specified in DatawalletModification", async function () {
                const mockDbCollectionProvider = mock<IDatabaseCollectionProvider>()
                when(mockDbCollectionProvider.getCollection(anyString())).thenCall(
                    (name) => new FakeDatabaseCollection(name)
                )

                const datawalletModificator = createDatawalletModificator(instance(mockDbCollectionProvider), [
                    new DatawalletModificationBuilder().withCollection("CollectionA").build(),
                    new DatawalletModificationBuilder().withCollection("CollectionB").build()
                ])

                await datawalletModificator.execute()

                verify(mockDbCollectionProvider.getCollection("CollectionA")).once()
                verify(mockDbCollectionProvider.getCollection("CollectionB")).once()
            })

            function createDatawalletModificator(
                _collectionProvider: IDatabaseCollectionProvider,
                _modifications: DatawalletModification[]
            ): DatawalletModificationsProcessor {
                throw new Error()
                // return new DatawalletModificationsProcessor(collectionProvider, modifications)
            }
        })

        async function createDatawalletModification(properties: Partial<DatawalletModification>) {
            return DatawalletModification.from({
                localId: properties.localId ?? (await TransportIds.datawalletModification.generate()),
                type: properties.type ?? DatawalletModificationType.Create,
                collection: properties.collection ?? "SomeCollection",
                payloadCategory: properties.payloadCategory ?? DatawalletModificationCategory.TechnicalData,
                payload: properties.payload ?? { aPayloadProperty: "aPayloadValue" },
                objectIdentifier: properties.objectIdentifier ?? CoreId.from(uniqueId())
            })
        }
    }
}
*/
