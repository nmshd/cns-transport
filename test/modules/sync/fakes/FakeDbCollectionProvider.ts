import { IDatabaseCollection, IDatabaseCollectionProvider, IDatabaseMap } from "@js-soft/docdb-access-abstractions"

export class FakeDbCollectionProvider implements IDatabaseCollectionProvider {
    private collectionToReturn: IDatabaseCollection

    public getCollection(_: string): Promise<IDatabaseCollection> {
        return Promise.resolve(this.collectionToReturn)
    }

    public setCollection(collectionToReturn: IDatabaseCollection): void {
        this.collectionToReturn = collectionToReturn
    }

    public getMap(_: string): Promise<IDatabaseMap> {
        throw new Error("Method not implemented.")
    }

    public close(): Promise<void> {
        throw new Error("Method not implemented.")
    }
}
