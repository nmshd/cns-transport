import { DatabaseType, IDatabaseCollection } from "@js-soft/docdb-access-abstractions"
import { Serializable } from "@js-soft/ts-serval"
import { AssertionError } from "chai"
import deepEqual from "deep-equal"

interface Update<T> {
    oldDoc: any
    newData: T
}

export class MockDatabaseCollection<T extends Serializable> implements IDatabaseCollection {
    private readonly creations: T[] = []
    private readonly unverifiedCreations: T[] = []
    private readonly updates: Update<T>[] = []
    private readonly unverifiedUpdates: Update<T>[] = []

    public databaseType: DatabaseType
    public name: string

    public constructor(name = "ADatabaseCollection") {
        this.name = name
    }

    public create(object: any): Promise<T> {
        this.creations.push(object)
        this.unverifiedCreations.push(object)
        return object
    }

    public read(_: string): Promise<TexImageSource> {
        throw new Error("Method not implemented.")
    }

    public update(oldDoc: any, data: T): Promise<T> {
        this.updates.push({ oldDoc: oldDoc, newData: data })
        this.unverifiedUpdates.push({ oldDoc: oldDoc, newData: data })
        return Promise.resolve(data)
    }

    public delete(_: T): Promise<boolean> {
        throw new Error("Method not implemented.")
    }

    public list(): Promise<T[]> {
        throw new Error("Method not implemented.")
    }

    public find(_: T): Promise<T[]> {
        throw new Error("Method not implemented.")
    }

    public findOne(_: Partial<T>): Promise<T> {
        throw new Error("Method not implemented.")
    }

    public count(_: any): Promise<number> {
        throw new Error("Method not implemented.")
    }
    public exists(_: any): Promise<boolean> {
        throw new Error("Method not implemented.")
    }

    public verifyUpdated(...expectedObjects: Partial<T>[]): this {
        for (const expectedObject of expectedObjects) {
            let i = 0
            let found = false
            for (const update of this.unverifiedUpdates) {
                const newDataAsJson = update.newData.toJSON()
                const comparisonObject = { ...newDataAsJson, ...expectedObject }
                const comparisonObjectAsJson = JSON.parse(JSON.stringify(comparisonObject))
                if (deepEqual(comparisonObjectAsJson, newDataAsJson)) {
                    found = true
                    break
                }
                i++
            }

            if (!found) {
                const stringifiedExpectedObject = JSON.stringify(expectedObject, null, 2)
                throw new AssertionError(
                    `expected an object like ${stringifiedExpectedObject} to be to be updated, but it was not.`,
                    {
                        expected: expectedObject,
                        actual: this.updates,
                        showDiff: true
                    }
                )
            }
            this.unverifiedUpdates.splice(i, 1)
        }

        return this.noMoreCreations()
    }

    private noMoreUpdates() {
        if (this.unverifiedUpdates.length > 0) {
            throw new AssertionError(`expected no more updates, but found ${this.unverifiedUpdates.length}`, {
                expected: [],
                actual: this.unverifiedUpdates,
                showDiff: true
            })
        }
        return this
    }

    public verifyCreated(...expectedObjects: Partial<T>[]): this {
        for (const expectedObject of expectedObjects) {
            let i = 0
            let found = false
            for (const creation of this.unverifiedCreations) {
                const createdObjectAsJson = creation.toJSON()
                const comparisonObject = { ...createdObjectAsJson, ...expectedObject }
                const comparisonObjectAsJson = JSON.parse(JSON.stringify(comparisonObject))

                if (deepEqual(comparisonObjectAsJson, createdObjectAsJson)) {
                    found = true
                    break
                }
                i++
            }

            if (!found) {
                const stringifiedExpectedObject = JSON.stringify(expectedObject, null, 2)
                throw new AssertionError(
                    `expected an object like ${stringifiedExpectedObject} to be to be created, but it was not.`,
                    {
                        expected: expectedObject,
                        actual: this.creations,
                        showDiff: true
                    }
                )
            }
            this.unverifiedCreations.splice(i, 1)
        }

        return this.noMoreCreations()
    }

    private noMoreCreations() {
        if (this.unverifiedCreations.length > 0) {
            throw new AssertionError(`expected no more creations, but found ${this.unverifiedCreations.length}`, {
                expected: [],
                actual: this.unverifiedCreations,
                showDiff: true
            })
        }
        return this
    }
}
