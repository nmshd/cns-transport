import { CoreBuffer } from "@nmshd/crypto"
import { AccountController, FileClient, Paginator, PaginatorPercentageCallback, Transport } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest, FakePaginationDataSource, TestUtil } from "../../testHelpers"

export class PaginatorTest extends AbstractTest {
    public run(): void {
        const that = this

        describe("Paginator", function () {
            describe("End2End", function () {
                let transport: Transport

                const fileCount = 10

                let testAccount: AccountController

                this.timeout(150000)

                before(async function () {
                    transport = new Transport(that.connection, that.config, that.loggerFactory)

                    await TestUtil.clearAccounts(that.connection)

                    await transport.init()

                    const accounts = await TestUtil.provideAccounts(transport, 1, PaginatorTest.name)
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
                const createPaginator = (pages: number[][], progressCallback?: PaginatorPercentageCallback) => {
                    const totalRecords = pages.flat().length

                    return new Paginator<number>(
                        pages[0],
                        {
                            pageNumber: 1,
                            pageSize: pages[0].length,
                            totalPages: pages.length,
                            totalRecords: totalRecords
                        },
                        new FakePaginationDataSource(pages),
                        progressCallback
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

                it("should call the paginator callback with 20 items", async function () {
                    const percentages: number[] = []

                    const paginator = createPaginator(
                        [
                            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                        ],
                        (percentage: number) => percentages.push(percentage)
                    )

                    for await (const _item of paginator) expect(_item).to.exist

                    expect(percentages).to.deep.equal([0, 50, 100])
                })

                it("should call the paginator callback with 19 items", async function () {
                    const percentages: number[] = []

                    const paginator = createPaginator(
                        [
                            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                            [1, 2, 3, 4, 5, 6, 7, 8, 9]
                        ],
                        (percentage: number) => percentages.push(percentage)
                    )

                    for await (const _item of paginator) expect(_item).to.exist

                    expect(percentages).to.deep.equal([0, 53, 100])
                })

                it("should call the paginator callback with 199 items", async function () {
                    const percentages: number[] = []

                    const paginator = createPaginator(
                        [Array.from(Array(100).keys()), Array.from(Array(99).keys())],
                        (percentage: number) => percentages.push(percentage)
                    )

                    for await (const _item of paginator) expect(_item).to.exist

                    expect(percentages).to.have.lengthOf(21)
                })
            })
        })
    }
}
