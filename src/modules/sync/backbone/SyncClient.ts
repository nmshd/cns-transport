import { IConfig, Paginator, RESTClientAuthenticate } from "../../../core"
import { Authenticator } from "../../../core/backbone/Authenticator"
import { ClientResult } from "../../../core/backbone/ClientResult"
import { BackboneDatawalletModification } from "./BackboneDatawalletModification"
import { BackboneExternalEvent } from "./BackboneExternalEvent"
import {
    CreateDatawalletModificationsRequest,
    CreateDatawalletModificationsResponse
} from "./CreateDatawalletModifications"
import {
    FinalizeDatawalletVersionUpgradeRequest,
    FinalizeDatawalletVersionUpgradeResponse,
    FinalizeExternalEventSyncRequest,
    FinalizeExternalEventSyncResponse
} from "./FinalizeSyncRun"
import { GetDatawalletResponse } from "./GetDatawallet"
import { GetDatawalletModificationsRequest } from "./GetDatawalletModifications"
import { StartSyncRunRequest, StartSyncRunResponse } from "./StartSyncRun"

export interface ISyncClient {
    startSyncRun(request?: StartSyncRunRequest): Promise<ClientResult<StartSyncRunResponse>>

    finalizeExternalEventSync(
        id: string,
        request: FinalizeExternalEventSyncRequest
    ): Promise<ClientResult<FinalizeExternalEventSyncResponse>>

    finalizeExternalEventSync(
        id: string,
        request: FinalizeExternalEventSyncRequest
    ): Promise<ClientResult<FinalizeExternalEventSyncResponse>>

    finalizeDatawalletVersionUpgrade(
        id: string,
        request: FinalizeDatawalletVersionUpgradeRequest
    ): Promise<ClientResult<FinalizeDatawalletVersionUpgradeResponse>>

    getExternalEventsOfSyncRun(syncRunId: string): Promise<ClientResult<Paginator<BackboneExternalEvent>>>

    getDatawallet(): Promise<ClientResult<GetDatawalletResponse>>

    getDatawalletModifications(
        request: GetDatawalletModificationsRequest
    ): Promise<ClientResult<Paginator<BackboneDatawalletModification>>>

    createDatawalletModifications(
        request: CreateDatawalletModificationsRequest
    ): Promise<ClientResult<CreateDatawalletModificationsResponse>>
}

export class SyncClient extends RESTClientAuthenticate implements ISyncClient {
    public constructor(config: IConfig, authenticator: Authenticator) {
        super(config, authenticator, {
            headers: {
                "x-supported-datawallet-version": config.supportedDatawalletVersion.toString()
            }
        })
    }

    public async startSyncRun(request?: StartSyncRunRequest): Promise<ClientResult<StartSyncRunResponse>> {
        return await this.post<StartSyncRunResponse>("/api/v1/SyncRuns", request)
    }

    public async finalizeExternalEventSync(
        id: string,
        request: FinalizeExternalEventSyncRequest
    ): Promise<ClientResult<FinalizeExternalEventSyncResponse>> {
        return await this.put<FinalizeExternalEventSyncResponse>(
            `/api/v1/SyncRuns/${id}/FinalizeExternalEventSync`,
            request
        )
    }

    public async finalizeDatawalletVersionUpgrade(
        id: string,
        request: FinalizeDatawalletVersionUpgradeRequest
    ): Promise<ClientResult<FinalizeDatawalletVersionUpgradeResponse>> {
        return await this.put<FinalizeDatawalletVersionUpgradeResponse>(
            `/api/v1/SyncRuns/${id}/FinalizeDatawalletVersionUpgrade`,
            request
        )
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
