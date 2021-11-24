import {
    CoreId,
    DatawalletModification,
    DatawalletModificationCategory,
    DatawalletModificationType,
    Random
} from "@nmshd/transport"
import { uniqueId } from "lodash"

export class DatawalletModificationBuilder {
    private type: DatawalletModificationType = DatawalletModificationType.Create
    private collection = "SomeCollection"
    private objectIdentifier: CoreId = CoreId.from(uniqueId())
    private category: DatawalletModificationCategory = DatawalletModificationCategory.TechnicalData
    private payload: object = { aProperty: "aValue" }
    private readonly localId = CoreId.from(Random.uuid())
    private datawalletVersion = 1

    public withType(type: DatawalletModificationType): this {
        this.type = type
        return this
    }

    public withObjectIdentifier(objectIdentifier: CoreId): this {
        this.objectIdentifier = objectIdentifier
        return this
    }

    public withCategory(category: DatawalletModificationCategory): this {
        this.category = category
        return this
    }

    public withCollection(collection: string): this {
        this.collection = collection
        return this
    }

    public withPayload(payload: object): this {
        this.payload = payload
        return this
    }

    public withDatawalletVersion(datawalletVersion: number): this {
        this.datawalletVersion = datawalletVersion
        return this
    }

    public build(): DatawalletModification {
        return DatawalletModification.from({
            localId: this.localId,
            type: this.type,
            collection: this.collection,
            payloadCategory: this.category,
            payload: this.payload,
            objectIdentifier: this.objectIdentifier,
            datawalletVersion: this.datawalletVersion
        })
    }
}
