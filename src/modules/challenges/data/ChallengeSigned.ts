import { ISerialized, serialize, type, validate } from "@js-soft/ts-serval"
import { CryptoSignature, ICryptoSignature } from "@nmshd/crypto"
import { CoreSerializableAsync, ICoreSerializableAsync } from "../../../core"

export interface IChallengeSignedSerialized extends ISerialized {
    challenge: string
    signature: string
}

export interface IChallengeSigned extends ICoreSerializableAsync {
    challenge: string
    signature: ICryptoSignature
}

@type("ChallengeSigned")
export class ChallengeSigned extends CoreSerializableAsync implements IChallengeSigned {
    @validate()
    @serialize({ enforceString: true })
    public challenge: string

    @validate()
    @serialize({ enforceString: true })
    public signature: CryptoSignature

    public static async from(value: IChallengeSigned): Promise<ChallengeSigned> {
        return await super.fromT(value, ChallengeSigned)
    }

    public static async fromJSON(value: IChallengeSignedSerialized): Promise<ChallengeSigned> {
        const signature = await CryptoSignature.fromBase64(value.signature)

        return await this.from({ signature: signature, challenge: value.challenge })
    }

    public toJSON(verbose = true): IChallengeSignedSerialized {
        const obj: IChallengeSignedSerialized = {
            challenge: this.challenge,
            signature: this.signature.toBase64()
        }
        if (verbose) {
            obj["@type"] = "ChallengeSigned"
        }
        return obj
    }
}
