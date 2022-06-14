export interface BackbonePostRelationshipTemplatesRequest {
    expiresAt?: string
    maxNumberOfAllocations?: number
    content: string

    /**
     * @deprecated use `maxNumberOfAllocations` instead
     * @see maxNumberOfAllocations
     */
    maxNumberOfRelationships?: number
}

export interface BackbonePostRelationshipTemplatesResponse {
    id: string
    createdAt: string
}
