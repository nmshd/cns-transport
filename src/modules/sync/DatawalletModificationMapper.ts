import { CoreId, CoreIds } from "../../core"
import { BackboneDatawalletModification } from "./backbone/BackboneDatawalletModification"
import { CreateDatawalletModificationsRequestItem } from "./backbone/CreateDatawalletModifications"
import {
    DatawalletModification,
    DatawalletModificationCategory,
    DatawalletModificationType
} from "./local/DatawalletModification"

export class DatawalletModificationMapper {
    public static async fromBackboneDatawalletModification(
        backboneDatawalletModification: BackboneDatawalletModification,
        decryptedPayload: object | undefined
    ): Promise<DatawalletModification> {
        let type: DatawalletModificationType

        switch (backboneDatawalletModification.type) {
            case "Create":
                type = DatawalletModificationType.Create
                break
            case "Update":
                type = DatawalletModificationType.Update
                break
            case "Delete":
                type = DatawalletModificationType.Delete
                break
            case "CacheChanged":
                type = DatawalletModificationType.CacheChanged
                break
            default:
                throw new Error("Unsupported DatawalletModificationType '${backboneDatawalletModification.type}'")
        }

        let payloadCategory: DatawalletModificationCategory | undefined

        switch (backboneDatawalletModification.payloadCategory) {
            case "TechnicalData":
                payloadCategory = DatawalletModificationCategory.TechnicalData
                break
            case "Userdata":
                payloadCategory = DatawalletModificationCategory.Userdata
                break
            case "Metadata":
                payloadCategory = DatawalletModificationCategory.Metadata
                break
            case null:
                payloadCategory = undefined
                break
            default:
                throw new Error(
                    `Unsupported DatawalletModificationCategory '${backboneDatawalletModification.payloadCategory}'`
                )
        }

        return DatawalletModification.from({
            localId: await CoreIds.datawalletModification.generate(),
            objectIdentifier: CoreId.from(backboneDatawalletModification.objectIdentifier),
            payloadCategory: payloadCategory,
            collection: backboneDatawalletModification.collection,
            type: type,
            payload: decryptedPayload
        })
    }

    public static toCreateDatawalletModificationsRequestItem(
        datawalletModification: DatawalletModification,
        encryptedPayload: string | undefined
    ): CreateDatawalletModificationsRequestItem {
        return {
            objectIdentifier: datawalletModification.objectIdentifier.toString(),
            payloadCategory: datawalletModification.payloadCategory,
            collection: datawalletModification.collection,
            type: datawalletModification.type,
            encryptedPayload: encryptedPayload
        }
    }
}
