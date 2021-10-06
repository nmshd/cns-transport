export interface UpdateDatawalletRequest {
    version?: number
    localIndex?: number
    modifications: UpdateDatawalletRequestItem[]
}

export interface UpdateDatawalletRequestItem {
    objectIdentifier: string
    payloadCategory?: string
    collection: string
    type: string
    encryptedPayload?: string
}

export interface UpdateDatawalletResponse {
    newIndex: number
    modifications: {
        id: string
        index: number
        createdAt: string
    }[]
}
