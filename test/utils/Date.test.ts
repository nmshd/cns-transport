import { CoreDate } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractUnitTest } from "../testHelpers"

export class DateTest extends AbstractUnitTest {
    public run(): void {
        describe("CoreDate", function () {
            describe("Constructor", function () {
                it("returns the current date when constructor is empty", function () {
                    const date = CoreDate.utc()
                    expect(date).to.exist
                })

                it("sets the date property as string", function () {
                    const date = CoreDate.utc()
                    expect(typeof date.date).to.equal("string")
                })
            })

            describe("Add()", function () {
                it("returns a date in the future", function () {
                    const date = CoreDate.utc().add({ years: 1 })
                    expect(date).to.exist
                    expect(date.isAfter(CoreDate.utc())).to.be.true
                })
            })

            describe("IsWithin()", function () {
                it("should return a correct value if it is within the given range (one parameter)", function () {
                    const date = CoreDate.utc().subtract({ days: 1, seconds: 1 })
                    expect(date.isWithin({ days: 5 })).to.be.true
                    expect(date.isWithin({ days: 1 })).to.be.false
                    expect(date.isWithin({ days: 1, minutes: 2 })).to.be.true
                    expect(date.isWithin({ days: -1 })).to.be.false
                })

                it("should return a correct value if it is within the given range (two parameters)", function () {
                    const date = CoreDate.utc().subtract({ days: 1, seconds: 1 })
                    expect(date.isWithin({ days: 5 }, { days: 1 })).to.be.true
                    expect(date.isWithin({ days: 20 }, { days: -20 })).to.be.false
                    expect(date.isWithin({ days: 1, minutes: 2 }, { days: 1 })).to.be.true
                    expect(date.isWithin({ days: -1 }, { minutes: 4000 })).to.be.false

                    const date2 = CoreDate.utc().add({ days: 1, seconds: 1 })
                    expect(date2.isWithin(0, { days: 2 })).to.be.true
                    expect(date2.isWithin({ days: 2 }, { days: 3 })).to.be.true
                    expect(date2.isWithin({ days: 1 }, { days: 3 })).to.be.true
                    expect(date2.isWithin({ days: -1 }, { seconds: 4000 })).to.be.false
                })

                it("should return a correct value if it is within the given range (three parameters)", function () {
                    const date = CoreDate.from("2020-01-01")
                    const reference = CoreDate.from("2020-01-02")
                    expect(date.isWithin({ days: 5 }, { days: 1 }, reference)).to.be.true
                    expect(date.isWithin({ days: 20 }, { days: -20 }, reference)).to.be.false
                    expect(date.isWithin({ days: 1, minutes: 2 }, { days: 1 }, reference)).to.be.true
                    expect(date.isWithin({ hours: 25 }, { hours: 25 }, reference)).to.be.true
                    expect(date.isWithin({ hours: 23 }, { hours: 25 }, reference)).to.be.false

                    const date2 = CoreDate.from("2020-01-03")
                    expect(date2.isWithin(0, { days: 2 }, reference)).to.be.true
                    expect(date2.isWithin({ minutes: 2 }, { days: 1 }, reference)).to.be.false
                    expect(date2.isWithin({ days: 1 }, { days: 3 }, reference)).to.be.true
                    expect(date2.isWithin({ hours: 25 }, { hours: 25 }, reference)).to.be.true
                    expect(date2.isWithin({ hours: 23 }, { hours: 23 }, reference)).to.be.false
                })
            })

            describe("From()", function () {
                it("returns a date when provided with a date", function () {
                    const date = CoreDate.from(CoreDate.utc())
                    expect(date).to.exist
                })

                it("returns a date when provided with a string", function () {
                    const date = CoreDate.from(CoreDate.utc().date)
                    expect(date).to.exist
                })
            })
        })
    }
}
