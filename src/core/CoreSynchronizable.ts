import { serialize, validate } from "@js-soft/ts-serval"
import { CoreSerializableAsync, ICoreSerializableAsync } from "./CoreSerializableAsync"
import { CoreId, ICoreId } from "./types/CoreId"

export interface ICoreSynchronizable extends ICoreSerializableAsync {
    id: ICoreId
}
export abstract class CoreSynchronizable extends CoreSerializableAsync implements ICoreSynchronizable {
    public readonly technicalProperties: string[] = []
    public readonly userdataProperties: string[] = []
    public readonly metadataProperties: string[] = []

    @validate()
    @serialize()
    public id: CoreId
}
