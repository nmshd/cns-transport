import { BackboneSyncRun } from "./BackboneSyncRun"

export interface StartSyncRunResponse {
    status: StartSyncRunStatus
    syncRun: BackboneSyncRun | null
}

export enum StartSyncRunStatus {
    Created = "Created",
    NoNewEvents = "NoNewEvents"
}
