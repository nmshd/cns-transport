import { serialize, type, validate } from "@js-soft/ts-serval"
import { CoreAddress, CoreDate, CoreId, CoreSerializableAsync, ICoreId, ICoreSerializableAsync } from "../../../core"

export interface IChallenge extends ICoreSerializableAsync {
    id: ICoreId
    expiresAt: CoreDate
    createdBy?: CoreAddress
    createdByDevice?: CoreId
    type: ChallengeType
}

export enum ChallengeType {
    Identity = "Identity",
    Device = "Device",
    Relationship = "Relationship"
}

@type("Challenge")
export class Challenge extends CoreSerializableAsync implements IChallenge {
    @validate()
    @serialize()
    public id: CoreId

    @validate()
    @serialize()
    public expiresAt: CoreDate

    @validate({ nullable: true })
    @serialize()
    public createdBy?: CoreAddress

    @validate({ nullable: true })
    @serialize()
    public createdByDevice?: CoreId

    @validate()
    @serialize()
    public type: ChallengeType

    public static async from(value: IChallenge): Promise<Challenge> {
        return await super.fromT(value, Challenge)
    }

    public static async deserialize(value: string): Promise<Challenge> {
        return await this.deserializeT(value, Challenge)
    }
}
