export interface BackbonePostRelationshipTemplatesRequest {
    expiresAt?: string
    maxNumberOfRelationships?: number
    content: string
}

export interface BackbonePostRelationshipTemplatesResponse {
    id: string
    createdAt: string
}
