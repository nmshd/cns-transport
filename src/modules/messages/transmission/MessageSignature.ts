import { serialize, type, validate } from "@js-soft/ts-serval"
import { CryptoSignature, ICryptoSignature } from "@nmshd/crypto"
import { CoreAddress, CoreSerializableAsync, ICoreAddress, ICoreSerializableAsync } from "../../../core"

export interface IMessageSignature extends ICoreSerializableAsync {
    recipient: ICoreAddress
    signature: ICryptoSignature
}

@type("MessageSignature")
export class MessageSignature extends CoreSerializableAsync implements IMessageSignature {
    @validate()
    @serialize()
    public recipient: CoreAddress

    @validate()
    @serialize({ enforceString: true })
    public signature: CryptoSignature

    public static async from(value: IMessageSignature): Promise<MessageSignature> {
        return await super.fromT(value, MessageSignature)
    }
}
