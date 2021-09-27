import { serialize, type, validate } from "@js-soft/ts-serval"
import { CoreBuffer, ICoreBuffer } from "@nmshd/crypto"
import { CoreSerializableAsync, ICoreSerializableAsync } from "../../../core"
import { CoreDate, ICoreDate } from "../../../core/types/CoreDate"

export interface ISendFileParameters extends ICoreSerializableAsync {
    title: string
    description: string
    filename: string
    mimetype: string
    expiresAt: ICoreDate
    filemodified?: ICoreDate
    buffer: ICoreBuffer
}

@type("SendFileParameters")
export class SendFileParameters extends CoreSerializableAsync implements ISendFileParameters {
    @validate()
    @serialize()
    public title: string
    @validate()
    @serialize()
    public description: string
    @validate()
    @serialize()
    public filename: string
    @validate()
    @serialize()
    public mimetype: string
    @validate()
    @serialize()
    public expiresAt: CoreDate

    @validate({ nullable: true })
    @serialize()
    public filemodified?: CoreDate

    @validate()
    @serialize()
    public buffer: CoreBuffer

    public static async from(value: ISendFileParameters): Promise<SendFileParameters> {
        return await super.fromT(value, SendFileParameters)
    }

    public static async deserialize(value: string): Promise<SendFileParameters> {
        return await super.deserializeT(value, SendFileParameters)
    }
}
