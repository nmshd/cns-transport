import { ProgressReporter, ProgressReporterStep } from "../../core"

export type SyncPercentageCallback = (percentage: number, process: string) => void

export class SyncProgressReporter extends ProgressReporter<SyncStep> {
    public static fromCallback(callback?: SyncPercentageCallback): SyncProgressReporter | undefined {
        if (!callback) return

        return new SyncProgressReporter(callback)
    }
}
export class SyncProgressReporterStep extends ProgressReporterStep<SyncStep> {}

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
