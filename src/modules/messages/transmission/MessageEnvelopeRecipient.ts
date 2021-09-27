import { serialize, type, validate } from "@js-soft/ts-serval"
import { CryptoCipher, ICryptoCipher } from "@nmshd/crypto"
import { CoreDate, CoreId, CoreSerializableAsync, ICoreDate, ICoreId, ICoreSerializableAsync } from "../../../core"
import { CoreAddress, ICoreAddress } from "../../../core/types/CoreAddress"

export interface IMessageEnvelopeRecipient extends ICoreSerializableAsync {
    address: ICoreAddress
    encryptedKey: ICryptoCipher
    receivedAt?: ICoreDate
    receivedByDevice?: ICoreId
}

@type("MessageEnvelopeRecipient")
export class MessageEnvelopeRecipient extends CoreSerializableAsync implements IMessageEnvelopeRecipient {
    @validate()
    @serialize()
    public address: CoreAddress

    @validate()
    @serialize()
    public encryptedKey: CryptoCipher

    @validate({ nullable: true })
    @serialize()
    public receivedAt?: CoreDate

    @validate({ nullable: true })
    @serialize()
    public receivedByDevice?: CoreId

    public static async from(value: IMessageEnvelopeRecipient): Promise<MessageEnvelopeRecipient> {
        return await super.fromT(value, MessageEnvelopeRecipient)
    }
}
