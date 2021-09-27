/* eslint-disable @typescript-eslint/no-inferrable-types */
import { SerializableAsync, serialize, type, validate } from "@js-soft/ts-serval"
import { CoreDate, CoreId, CoreSerializableAsync, ICoreDate, ICoreId, ICoreSerializableAsync } from "../../../core"

export interface ISecretContainerPlain extends ICoreSerializableAsync {
    id: ICoreId
    name: string
    description?: string
    createdAt: ICoreDate
    nonce?: number
    validFrom: ICoreDate
    validTo?: ICoreDate
    active: boolean
    secret: ICoreSerializableAsync
}

@type("SecretContainerPlain")
export class SecretContainerPlain extends CoreSerializableAsync implements ISecretContainerPlain {
    @serialize()
    @validate()
    public id: CoreId

    @serialize()
    @validate({ nullable: true })
    public name: string = ""

    @serialize()
    @validate({ nullable: true })
    public description: string = ""

    @serialize()
    @validate()
    public createdAt: CoreDate

    @serialize()
    @validate()
    public validFrom: CoreDate

    @serialize()
    @validate({ nullable: true })
    public validTo: CoreDate

    @serialize()
    @validate({ nullable: true })
    public nonce?: number

    @serialize()
    @validate()
    public active: boolean

    @serialize()
    @validate()
    public secret: SerializableAsync

    public static async from(value: ISecretContainerPlain): Promise<SecretContainerPlain> {
        return await super.fromT(value, SecretContainerPlain)
    }
}
