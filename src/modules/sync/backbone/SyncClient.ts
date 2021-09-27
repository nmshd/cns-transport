import { Paginator, RESTClientAuthenticate } from "../../../core"
import { ClientResult } from "../../../core/backbone/ClientResult"
import { BackboneDatawalletModification } from "./BackboneDatawalletModification"
import { BackboneExternalEvent } from "./BackboneExternalEvent"
import {
    CreateDatawalletModificationsRequest,
    CreateDatawalletModificationsResponse
} from "./CreateDatawalletModifications"
import { FinalizeSyncRunRequest } from "./FinalizeSyncRun"
import { GetDatawalletModificationsRequest } from "./GetDatawalletModifications"
import { StartSyncRunResponse } from "./StartSyncRun"

export class SyncClient extends RESTClientAuthenticate {
    public async startSyncRun(): Promise<ClientResult<StartSyncRunResponse>> {
        return await this.post<StartSyncRunResponse>("/api/v1/SyncRuns", {})
    }

    public async finalizeSyncRun(
        id: string,
        request: FinalizeSyncRunRequest
    ): Promise<ClientResult<StartSyncRunResponse>> {
        return await this.put<StartSyncRunResponse>(`/api/v1/SyncRuns/${id}/Finalize`, request)
    }

    public async getExternalEventsOfSyncRun(
        syncRunId: string
    ): Promise<ClientResult<Paginator<BackboneExternalEvent>>> {
        return await this.getPaged<BackboneExternalEvent>(`/api/v1/SyncRuns/${syncRunId}/ExternalEvents`, {})
    }

    public async getDatawalletModifications(
        request: GetDatawalletModificationsRequest
    ): Promise<ClientResult<Paginator<BackboneDatawalletModification>>> {
        return await this.getPaged<BackboneDatawalletModification>("/api/v1/DatawalletModifications", request)
    }

    public async createDatawalletModifications(
        request: CreateDatawalletModificationsRequest
    ): Promise<ClientResult<CreateDatawalletModificationsResponse>> {
        return await this.post<CreateDatawalletModificationsResponse>("/api/v1/DatawalletModifications", request)
    }
}
