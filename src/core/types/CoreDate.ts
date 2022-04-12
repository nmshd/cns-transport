import { serialize, serializeOnly, validate } from "@js-soft/ts-serval"
import { DateTime, DateTimeUnit, Duration, DurationLike, Interval } from "luxon"
import { CoreSerializable, ICoreSerializable } from "../CoreSerializable"
import { TransportErrors } from "../TransportErrors"

export interface ICoreDate extends ICoreSerializable {
    date: string
}

@serializeOnly("date", "string")
export class CoreDate extends CoreSerializable implements ICoreDate {
    private readonly _dateTime: DateTime
    public get dateTime(): DateTime {
        return this._dateTime
    }

    @validate()
    @serialize()
    public readonly date: string

    public constructor(dateTime: DateTime = DateTime.utc()) {
        super()
        this._dateTime = dateTime
        this.date = dateTime.toISO()
    }

    public static utc(): CoreDate {
        return new CoreDate(DateTime.utc())
    }

    public static local(): CoreDate {
        return new CoreDate(DateTime.local())
    }

    public equals(another: CoreDate): boolean {
        return this.dateTime.equals(another.dateTime)
    }

    public add(amount: number | Duration | DurationLike): CoreDate {
        return new CoreDate(this.dateTime.plus(amount))
    }

    public subtract(amount: number | Duration | DurationLike): CoreDate {
        return new CoreDate(this.dateTime.minus(amount))
    }

    public startOf(unitOfTime: DateTimeUnit): CoreDate {
        return new CoreDate(this.dateTime.startOf(unitOfTime))
    }

    public endOf(unitOfTime: DateTimeUnit): CoreDate {
        return new CoreDate(this.dateTime.endOf(unitOfTime))
    }

    public format(format: string): string {
        return this.dateTime.toFormat(format)
    }

    public isWithin(
        rangeMinusOrBoth: number | Duration | DurationLike,
        rangePlus?: number | Duration | DurationLike,
        other?: CoreDate,
        granularity?: DateTimeUnit
    ): boolean {
        if (typeof rangePlus === "undefined") {
            rangePlus = rangeMinusOrBoth
        }
        if (typeof other === "undefined") {
            other = CoreDate.utc()
        }

        const start = other.subtract(rangeMinusOrBoth)
        const end = other.add(rangePlus)

        if (typeof granularity !== "undefined") {
            return (
                this.dateTime.startOf(granularity) > start.dateTime.startOf(granularity) &&
                this.dateTime.startOf(granularity) < end.dateTime.startOf(granularity)
            )
        }

        return this.dateTime > start.dateTime && this.dateTime < end.dateTime
    }

    public isBefore(other: CoreDate, granularity?: DateTimeUnit): boolean {
        if (typeof granularity !== "undefined") {
            return this.dateTime.startOf(granularity) < other.dateTime.startOf(granularity)
        }

        return this.dateTime < other.dateTime
    }

    public isAfter(other: CoreDate, granularity?: DateTimeUnit): boolean {
        if (typeof granularity !== "undefined") {
            return this.dateTime.startOf(granularity) > other.dateTime.startOf(granularity)
        }

        return this.dateTime > other.dateTime
    }

    public isSame(other: CoreDate, granularity: DateTimeUnit): boolean {
        if (typeof granularity !== "undefined") {
            return this.dateTime.startOf(granularity).valueOf() === other.dateTime.startOf(granularity).valueOf()
        }

        return this.dateTime.valueOf() === other.dateTime.valueOf()
    }

    public isSameOrAfter(other: CoreDate, granularity?: DateTimeUnit): boolean {
        if (typeof granularity !== "undefined") {
            return this.dateTime.startOf(granularity) >= other.dateTime.startOf(granularity)
        }

        return this.dateTime >= other.dateTime
    }

    public isSameOrBefore(other: CoreDate, granularity?: DateTimeUnit): boolean {
        if (typeof granularity !== "undefined") {
            return this.dateTime.startOf(granularity) <= other.dateTime.startOf(granularity)
        }

        return this.dateTime <= other.dateTime
    }

    public isBetween(start: CoreDate, end?: CoreDate, granularity?: DateTimeUnit): boolean {
        if (!end) {
            return this.isAfter(start, granularity)
        }

        return Interval.fromDateTimes(start.dateTime, end.dateTime).contains(this.dateTime)
    }

    public isExpired(): boolean {
        return this.isSameOrBefore(CoreDate.utc())
    }

    public compare(comparator: CoreDate): number {
        return this.dateTime.valueOf() - comparator.dateTime.valueOf()
    }

    /**
     * Creates an ISO String.
     */
    public toString(): string {
        return this.dateTime.toISO()
    }

    public toISOString(): string {
        return this.dateTime.toISO()
    }

    public toLocaleString(): string {
        return this.dateTime.toLocaleString()
    }

    public serialize(): string {
        return this.dateTime.toISO()
    }

    public static override preFrom(value: any): any {
        if (typeof value === "undefined") {
            throw TransportErrors.util.date.undefined()
        }

        if (typeof value === "object") {
            if (typeof value.date === "undefined") {
                if (typeof value.toISOString !== "function") {
                    throw TransportErrors.util.date.noIsoStringMethod()
                }

                const iso = value.toISOString()
                return { date: DateTime.fromISO(iso, { zone: "utc" }) }
            }

            return { date: DateTime.fromISO(value.date, { zone: "utc" }) }
        }

        if (typeof value === "number") {
            return { date: DateTime.fromMillis(value) }
        }

        return { date: DateTime.fromISO(value, { zone: "utc" }).toUTC() }
    }

    public static from(value: ICoreDate | string | number): CoreDate {
        return this.fromAny(value)
    }
}
