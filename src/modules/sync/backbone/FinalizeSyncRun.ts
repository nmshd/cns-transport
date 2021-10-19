export interface FinalizeExternalEventSyncRequest {
    externalEventResults: FinalizeSyncRunRequestExternalEventResult[]
    datawalletModifications: FinalizeSyncRunRequestDatawalletModification[]
}

export interface FinalizeDatawalletVersionUpgradeRequest {
    newDatawalletVersion: number
    datawalletModifications?: FinalizeSyncRunRequestDatawalletModification[]
}
export interface FinalizeSyncRunRequestDatawalletModification {
    objectIdentifier?: string
    payloadCategory?: string
    collection: string
    type: string
    encryptedPayload?: string
}
export interface FinalizeSyncRunRequestExternalEventResult {
    externalEventId: string
    errorCode?: string
}

export interface FinalizeExternalEventSyncResponse {
    newDatawalletModificationIndex: number
    datawalletModifications: {
        id: string
        index: number
        createdAt: string
    }
}

export interface FinalizeDatawalletVersionUpgradeResponse {
    newDatawalletVersion: number
    datawalletModifications: {
        id: string
        index: number
        createdAt: string
    }
}
