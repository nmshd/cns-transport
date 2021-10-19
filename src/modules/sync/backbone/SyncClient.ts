import { IConfig, Paginator, RESTClientAuthenticate } from "../../../core"
import { Authenticator } from "../../../core/backbone/Authenticator"
import { ClientResult } from "../../../core/backbone/ClientResult"
import { BackboneDatawalletModification } from "./BackboneDatawalletModification"
import { BackboneExternalEvent } from "./BackboneExternalEvent"
import {
    CreateDatawalletModificationsRequest,
    CreateDatawalletModificationsResponse
} from "./CreateDatawalletModifications"
import { FinalizeDatawalletVersionUpgradeRequest, FinalizeSyncRunRequest } from "./FinalizeSyncRun"
import { GetDatawalletModificationsRequest } from "./GetDatawalletModifications"
import { StartSyncRunRequest, StartSyncRunResponse } from "./StartSyncRun"

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

    public async getDatawallet(): Promise<ClientResult<GetDatawalletResponse>> {
        return await this.get<GetDatawalletResponse>("/api/v1/Datawallet")
    }

    public async getDatawalletModifications(
        request: GetDatawalletModificationsRequest
    ): Promise<ClientResult<Paginator<BackboneDatawalletModification>>> {
        return await this.getPaged<BackboneDatawalletModification>("/api/v1/Datawallet/Modifications", request)
    }

    public async createDatawalletModifications(
        request: CreateDatawalletModificationsRequest
    ): Promise<ClientResult<CreateDatawalletModificationsResponse>> {
        return await this.post<CreateDatawalletModificationsResponse>("/api/v1/Datawallet/Modifications", request)
    }
}
