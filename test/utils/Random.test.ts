import { Random, RandomCharacterRange } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractUnitTest } from "../testHelpers"

export class RandomTest extends AbstractUnitTest {
    public run(): void {
        describe("RandomTest", function () {
            describe("IntBetween", function () {
                it("should return a number between the min and max", async function () {
                    for (let i = 1; i < 20; i++) {
                        const n = await Random.intBetween(0, 1)
                        expect(n).to.be.lessThan(2)
                        expect(n).to.be.greaterThan(-1)
                    }
                })

                it("should return an even number across all possible values (0|1)", async function () {
                    const buckets: number[] = [0, 0]
                    const iterations = 10000
                    for (let i = 1; i < iterations; i++) {
                        const n = await Random.intBetween(0, 1)
                        switch (n) {
                            case 0:
                                buckets[0]++
                                break
                            case 1:
                                buckets[1]++
                                break
                            default:
                                throw new Error(`Value '${n}' is not in the range!`)
                        }
                    }

                    expect(buckets[0]).to.be.lessThan(iterations * 0.6)
                    expect(buckets[0]).to.be.greaterThan(iterations * 0.4)
                    expect(buckets[1]).to.be.lessThan(iterations * 0.6)
                    expect(buckets[1]).to.be.greaterThan(iterations * 0.4)
                })

                it("should return an even number across all possible values (0 to 100)", async function () {
                    const buckets: number[] = []
                    const iterations = 10000
                    const min = 0
                    const max = 100
                    const diff = max - min + 1

                    for (let j = 0; j < diff; j++) {
                        buckets[j] = 0
                    }

                    for (let i = 1; i < iterations; i++) {
                        const n = await Random.intBetween(min, max)
                        buckets[n]++
                    }

                    for (let j = 0; j < diff; j++) {
                        expect(buckets[j]).to.be.lessThan((iterations / diff) * 1.5)
                        expect(buckets[j]).to.be.greaterThan((iterations / diff) * 0.5)
                    }
                })

                it("should return a number between the min and max (small numbers)", async function () {
                    for (let i = 1; i < 20; i++) {
                        const n = await Random.intBetween(-20, 20)
                        expect(n).to.be.lessThan(21)
                        expect(n).to.be.greaterThan(-21)
                    }
                })

                it("should return a number between the min and max (very high max)", async function () {
                    for (let i = 1; i < 20; i++) {
                        const n = await Random.intBetween(0, 2 ^ (32 - 1))
                        expect(n).to.be.lessThan(2 ^ 32)
                        expect(n).to.be.greaterThan(-1)
                    }
                })

                it("should return a number between the min and max (very low min)", async function () {
                    for (let i = 1; i < 20; i++) {
                        const n = await Random.intBetween(-2 ^ (32 + 1), 0)
                        expect(n).to.be.lessThan(1)
                        expect(n).to.be.greaterThan(-2 ^ 32)
                    }
                })
            })

            describe("Scramble()", function () {
                it("should return a string with the same length", async function () {
                    for (let i = 1; i < 20; i++) {
                        const instring = "012345"
                        const n = await Random.scramble(instring)
                        expect(n).to.be.of.length(instring.length)
                    }
                })
            })

            describe("String()", function () {
                this.timeout(5000)

                it("should return a string with a fixed length", async function () {
                    for (let i = 1; i < 20; i++) {
                        const n = await Random.string(1)
                        expect(n).to.be.of.length(1)
                    }

                    for (let i = 1; i < 20; i++) {
                        const n = await Random.string(10)
                        expect(n).to.be.of.length(10)
                    }

                    for (let i = 1; i < 20; i++) {
                        const n = await Random.string(100)
                        expect(n).to.be.of.length(100)
                    }
                })

                it("should return a string with a fixed length and wanted characters", async function () {
                    for (let i = 1; i < 20; i++) {
                        const n = await Random.string(1, "a")
                        expect(n).to.be.of.length(1)
                        expect(n).to.equal("a")
                    }

                    for (let i = 1; i < 20; i++) {
                        const n = await Random.string(10, "a")
                        expect(n).to.be.of.length(10)
                        expect(n).to.equal("aaaaaaaaaa")
                    }

                    for (let i = 1; i < 20; i++) {
                        const n = await Random.string(10, "0")
                        expect(n).to.be.of.length(10)
                        expect(n).to.equal("0000000000")
                    }
                })

                it("should return an even number across all possible values (Alphabet)", async function () {
                    const buckets: any = {}
                    const iterations = 10000
                    const diff = RandomCharacterRange.Alphabet.length

                    for (let i = 1; i < iterations; i++) {
                        const n = await Random.string(1, RandomCharacterRange.Alphabet)
                        if (buckets[n]) buckets[n]++
                        else buckets[n] = 1
                    }

                    for (const char in buckets) {
                        expect(buckets[char]).to.be.lessThan((iterations / diff) * 1.5)
                        expect(buckets[char]).to.be.greaterThan((iterations / diff) * 0.5)
                    }
                })
            })
        })
    }
}
