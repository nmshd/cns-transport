import { PaginationProperties } from "./PlatformResponse"

export interface IPaginationDataSource<T> {
    getPage(pageNumber: number): Promise<T[]>
}

export class Paginator<T> implements AsyncIterable<T> {
    private currentItemIndex = 0

    public constructor(
        private currentPage: T[],
        private readonly paginationProperties: PaginationProperties,
        private readonly dataSource: IPaginationDataSource<T>
    ) {}

    private hasNext() {
        return this.hasNextPage() || this.currentItemIndex < this.currentPage.length
    }

    private async next() {
        const isAtEndOfPage = this.currentItemIndex >= this.currentPage.length
        if (isAtEndOfPage && this.hasNextPage()) {
            this.currentItemIndex = 0
            this.currentPage = await this.nextPage()
        }

        return this.currentPage[this.currentItemIndex++]
    }

    private hasNextPage() {
        return this.paginationProperties.pageNumber < this.paginationProperties.totalPages
    }

    private async nextPage() {
        this.paginationProperties.pageNumber++
        const response = await this.dataSource.getPage(this.paginationProperties.pageNumber)
        return response
    }

    public async collect(): Promise<T[]> {
        const collection = this.currentPage

        while (this.hasNextPage()) {
            collection.push(...(await this.nextPage()))
        }

        return collection
    }

    public [Symbol.asyncIterator](): AsyncIterator<T, any, undefined> {
        return {
            next: async () =>
                this.hasNext() ? { value: await this.next(), done: false } : { value: undefined, done: true }
        }
    }
}
