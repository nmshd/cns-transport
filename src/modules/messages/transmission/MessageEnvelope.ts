import { serialize, type, validate } from "@js-soft/ts-serval"
import { CryptoCipher, ICryptoCipher } from "@nmshd/crypto"
import {
    CoreAddress,
    CoreDate,
    CoreId,
    CoreSerializableAsync,
    ICoreAddress,
    ICoreDate,
    ICoreId,
    ICoreSerializableAsync
} from "../../../core"
import { IMessageEnvelopeRecipient, MessageEnvelopeRecipient } from "./MessageEnvelopeRecipient"

export interface IMessageEnvelope extends ICoreSerializableAsync {
    id: ICoreId

    createdAt: ICoreDate
    createdBy: ICoreAddress
    createdByDevice: ICoreId

    cipher: ICryptoCipher

    attachments: ICoreId[]
    recipients: IMessageEnvelopeRecipient[]
}

@type("MessageEnvelope")
export class MessageEnvelope extends CoreSerializableAsync implements IMessageEnvelope {
    @validate()
    @serialize()
    public id: CoreId

    @validate()
    @serialize()
    public createdAt: CoreDate

    @validate()
    @serialize()
    public createdBy: CoreAddress

    @validate()
    @serialize()
    public createdByDevice: CoreId

    @validate()
    @serialize({ type: MessageEnvelopeRecipient })
    public recipients: MessageEnvelopeRecipient[]

    @validate()
    @serialize()
    public cipher: CryptoCipher

    @validate()
    @serialize({ type: CoreId })
    public attachments: CoreId[]

    public static async from(value: IMessageEnvelope): Promise<MessageEnvelope> {
        return await super.fromT(value, MessageEnvelope)
    }

    public static mapToJSON(value: Map<CoreAddress, CryptoCipher>): Object {
        const obj: any = {}
        for (const [key, cipher] of value.entries()) {
            const serializedKey: string = key.serialize()
            const serializedValue: string = cipher.serialize()
            obj[serializedKey] = serializedValue
        }
        return obj
    }

    public static deserializeMap(value: any): Map<CoreAddress, CryptoCipher> {
        const obj: Map<CoreAddress, CryptoCipher> = new Map<CoreAddress, CryptoCipher>()
        for (const key in value) {
            const cipher: any = value[key]
            const serializedKey: CoreAddress = CoreAddress.deserialize(key)
            const serializedValue: CryptoCipher = CryptoCipher.deserialize(cipher)
            obj.set(serializedKey, serializedValue)
        }
        return obj
    }
}
