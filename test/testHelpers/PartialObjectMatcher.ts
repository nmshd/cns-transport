import { Serializable } from "@js-soft/ts-serval"
import deepEqual from "deep-equal"
import { Matcher } from "ts-mockito/lib/matcher/type/Matcher"

export function objectWith<T extends Serializable>(expected: Partial<T>): any {
    return new PartialObjectMatcher(expected)
}

export class PartialObjectMatcher<T extends Serializable> extends Matcher {
    public constructor(private readonly expected: Partial<T>) {
        super()
    }

    public override match(actual: T): boolean {
        const actualAsJson = this.objectToJson(actual)

        const comparisonObject = { ...actualAsJson, ...this.expected }
        const comparisonObjectAsJson = this.objectToJson(comparisonObject)
        return deepEqual(comparisonObjectAsJson, actualAsJson)
    }

    private objectToJson<T extends Serializable>(obj: T) {
        if ((obj as any).toJSON && typeof (obj as any).toJSON === "function") {
            return obj.toJSON()
        }

        return JSON.parse(JSON.stringify(obj))
    }

    public override toString(): string {
        return `${JSON.stringify(this.expected)}`
    }
}
