import { BackboneDatawalletModification } from "./BackboneDatawalletModification"

export interface GetDatawalletRequest {
    localIndex?: number
}

export interface GetDatawalletResponse {
    version: number
    minimumVersion: number
    modifications: BackboneDatawalletModification[]
}
