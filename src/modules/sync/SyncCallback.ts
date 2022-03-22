export type SyncPercentageCallback = (percentage: number, process: string) => void

export enum SyncStep {
    Sync = "sync",
    DatawalletSync = "sync:datawallet",
    DatawalletSyncDownloading = "sync:datawallet:downloading",
    DatawalletSyncDecryption = "sync:datawallet:decrypting",
    DatawalletSyncProcessing = "sync:datawallet:processing",
    ExternalEventSync = "sync:externalEvent",
    ExternalEventSyncDownloading = "sync:externalEvent:downloading",
    ExternalEventsProcessing = "sync:externalEvent:processing"
}
