import { CoreBuffer } from "@nmshd/crypto"
import { AccountController, Core, FileClient, IPaginationDataSource, Paginator } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest } from "../AbstractTest"
import { TestUtil } from "../TestUtil"

class FakePaginationDataSource<T> implements IPaginationDataSource<T> {
    public constructor(private readonly pages: T[][]) {}

    public getPage(pageNumber: number): Promise<T[]> {
        return Promise.resolve(this.pages[pageNumber - 1])
    }
}

export class PaginatorTest extends AbstractTest {
    public run(): void {
        const that = this

        describe("Paginator", function () {
            describe("End2End", function () {
                let coreLib: Core

                const fileCount = 10

                let testAccount: AccountController

                this.timeout(150000)

                before(async function () {
                    coreLib = new Core(that.connection, that.config, that.loggerFactory)

                    await TestUtil.clearAccounts(that.connection)

                    await coreLib.init()

                    const accounts = await TestUtil.provideAccounts(coreLib, 1, PaginatorTest.name)
                    testAccount = accounts[0]

                    const buffer = CoreBuffer.fromUtf8("a")
                    const filesPromises = Array.from(Array(fileCount).keys()).map(() =>
                        TestUtil.uploadFile(testAccount, buffer)
                    )
                    await Promise.all(filesPromises)
                })

                it("should get all files", async function () {
                    const fileController = (testAccount.files as any).client as FileClient

                    const result = await fileController.getFiles({ pageSize: 1 } as any)
                    const paginator = result.value

                    const files = []

                    for await (const file of paginator) {
                        files.push(file)
                    }

                    expect(files).to.have.lengthOf(fileCount)
                }).timeout(15000)

                after(async function () {
                    await testAccount.close()
                })
            })

            describe("Unit", function () {
                const createPaginator = (pages: number[][]) => {
                    const totalRecords = pages.flat().length

                    return new Paginator<number>(
                        pages[0],
                        {
                            pageNumber: 1,
                            pageSize: pages[0].length,
                            totalPages: pages.length,
                            totalRecords: totalRecords
                        },
                        new FakePaginationDataSource(pages)
                    )
                }

                it("should iterate over all items", async function () {
                    const paginator = createPaginator([
                        [1, 2, 3],
                        [4, 5, 6],
                        [7, 8, 9]
                    ])

                    const items = []
                    for await (const item of paginator) {
                        items.push(item)
                    }

                    expect(items).to.have.lengthOf(9)
                })

                it("should iterate incomplete pages", async function () {
                    const paginator = createPaginator([[1, 2, 3], [4, 5, 6], [7]])

                    const items = []
                    for await (const item of paginator) {
                        items.push(item)
                    }

                    expect(items).to.have.lengthOf(7)
                })

                it("should iterate empty pages", async function () {
                    const paginator = createPaginator([[]])

                    const items = []
                    for await (const item of paginator) {
                        items.push(item)
                    }

                    expect(items).to.have.lengthOf(0)
                })

                it("should iterate one page", async function () {
                    const paginator = createPaginator([[1, 2, 3]])

                    const items = []
                    for await (const item of paginator) {
                        items.push(item)
                    }

                    expect(items).to.have.lengthOf(3)
                })

                it("should collect all items", async function () {
                    const paginator = createPaginator([
                        [1, 2, 3],
                        [4, 5, 6],
                        [7, 8, 9]
                    ])

                    const items = await paginator.collect()
                    expect(items).to.have.lengthOf(9)
                })

                it("should collect incomplete pages", async function () {
                    const paginator = createPaginator([[1, 2, 3], [4, 5, 6], [7]])

                    const items = await paginator.collect()
                    expect(items).to.have.lengthOf(7)
                })

                it("should collect empty pages", async function () {
                    const paginator = createPaginator([[]])

                    const items = await paginator.collect()
                    expect(items).to.have.lengthOf(0)
                })

                it("should collect one page", async function () {
                    const paginator = createPaginator([[1, 2, 3]])

                    const items = await paginator.collect()
                    expect(items).to.have.lengthOf(3)
                })
            })
        })
    }
}
