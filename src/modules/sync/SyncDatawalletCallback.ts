export type SyncPercentageCallback = (percentage: number, process: string) => void

export enum DatawalletSyncStep {
    Sync = "sync",
    DatawalletSync = "sync:datawallet",
    DatawalletSyncDownloading = "sync:datawallet:downloading",
    DatawalletSyncDecryption = "sync:datawallet:decrypting",
    DatawalletSyncProcessing = "sync:datawallet:processing"
}
