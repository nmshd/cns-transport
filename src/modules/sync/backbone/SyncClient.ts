import { IConfig, Paginator, RESTClientAuthenticate } from "../../../core"
import { Authenticator } from "../../../core/backbone/Authenticator"
import { ClientResult } from "../../../core/backbone/ClientResult"
import { BackboneExternalEvent } from "./BackboneExternalEvent"
import { FinalizeDatawalletVersionUpgradeRequest, FinalizeSyncRunRequest } from "./FinalizeSyncRun"
import { GetDatawalletRequest, GetDatawalletResponse } from "./GetDatawallet"
import { StartSyncRunRequest, StartSyncRunResponse } from "./StartSyncRun"
import { UpdateDatawalletRequest, UpdateDatawalletResponse } from "./UpdateDatawallet"

export class SyncClient extends RESTClientAuthenticate {
    public constructor(config: IConfig, authenticator: Authenticator) {
        super(config, authenticator, {
            headers: {
                "x-datawallet-version": config.supportedDatawalletVersion.toString()
            }
        })
    }

    public async startSyncRun(request?: StartSyncRunRequest): Promise<ClientResult<StartSyncRunResponse>> {
        return await this.post<StartSyncRunResponse>("/api/v1/SyncRuns", request)
    }

    public async finalizeExternalEventSync(
        id: string,
        request: FinalizeSyncRunRequest
    ): Promise<ClientResult<StartSyncRunResponse>> {
        return await this.put<StartSyncRunResponse>(`/api/v1/SyncRuns/${id}/FinalizeExternalEventSync`, request)
    }

    public async finalizeDatawalletVersionUpgrade(
        id: string,
        request: FinalizeDatawalletVersionUpgradeRequest
    ): Promise<ClientResult<StartSyncRunResponse>> {
        return await this.put<StartSyncRunResponse>(`/api/v1/SyncRuns/${id}/FinalizeDatawalletVersionUpgrade`, request)
    }

    public async getExternalEventsOfSyncRun(
        syncRunId: string
    ): Promise<ClientResult<Paginator<BackboneExternalEvent>>> {
        return await this.getPaged<BackboneExternalEvent>(`/api/v1/SyncRuns/${syncRunId}/ExternalEvents`, {})
    }

    public async getDatawallet(request: GetDatawalletRequest): Promise<ClientResult<Paginator<GetDatawalletResponse>>> {
        return await this.getPaged<GetDatawalletResponse>("/api/v1/Datawallet", request)
    }

    public async updateDatawallet(request: UpdateDatawalletRequest): Promise<ClientResult<UpdateDatawalletResponse>> {
        return await this.put<UpdateDatawalletResponse>("/api/v1/Datawallet", request)
    }
}
