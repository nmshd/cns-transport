import { SerializableAsync } from "@js-soft/ts-serval"
import { CryptoCipher, CryptoSecretKey } from "@nmshd/crypto"
import { CoreAddress, CoreCrypto, CoreDate, CoreErrors, CoreId, CoreSerializableAsync, IConfig } from "../../core"
import { AnonymousTokenClient } from "./backbone/AnonymousTokenClient"
import { CachedToken } from "./local/CachedToken"
import { Token } from "./local/Token"
import { TokenReference } from "./transmission/TokenReference"

export class AnonymousTokenController {
    private readonly client: AnonymousTokenClient
    public constructor(config: IConfig) {
        this.client = new AnonymousTokenClient(config)
    }

    public async loadPeerTokenByTruncated(truncated: string): Promise<Token> {
        const reference = await TokenReference.fromTruncated(truncated)
        return await this.loadPeerTokenByReference(reference)
    }

    public async loadPeerTokenByReference(tokenReference: TokenReference): Promise<Token> {
        return await this.loadPeerToken(tokenReference.id, tokenReference.key)
    }

    public async loadPeerToken(id: CoreId, secretKey: CryptoSecretKey): Promise<Token> {
        const response = (await this.client.getToken(id.toString())).value

        const cipher = await CryptoCipher.fromBase64(response.content)
        const plaintextTokenBuffer = await CoreCrypto.decrypt(cipher, secretKey)
        const plaintextTokenContent = await CoreSerializableAsync.deserializeUnknown(plaintextTokenBuffer.toUtf8())

        if (!(plaintextTokenContent instanceof SerializableAsync)) {
            throw CoreErrors.tokens.invalidTokenContent(id.toString())
        }
        const token = await Token.from({
            id: id,
            secretKey: secretKey,
            isOwn: false
        })

        const cachedToken = await CachedToken.from({
            createdAt: CoreDate.from(response.createdAt),
            expiresAt: CoreDate.from(response.expiresAt),
            createdBy: CoreAddress.from(response.createdBy),
            createdByDevice: CoreId.from(response.createdByDevice),
            content: plaintextTokenContent
        })
        token.setCache(cachedToken)

        return token
    }
}
