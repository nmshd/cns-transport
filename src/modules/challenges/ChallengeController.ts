import { CoreBuffer, CryptoSignatureKeypair } from "@nmshd/crypto"
import { CoreAddress, CoreCrypto, CoreDate, CoreId, TransportErrors } from "../../core"
import { ControllerName, TransportController } from "../../core/TransportController"
import { AccountController } from "../accounts/AccountController"
import { Relationship } from "../relationships/local/Relationship"
import { ChallengeAuthClient } from "./backbone/ChallengeAuthClient"
import { ChallengeClient } from "./backbone/ChallengeClient"
import { Challenge, ChallengeType } from "./data/Challenge"
import { ChallengeSigned } from "./data/ChallengeSigned"

export class ChallengeController extends TransportController {
    private client: ChallengeClient
    private authClient: ChallengeAuthClient

    public constructor(parent: AccountController) {
        super(ControllerName.Challenge, parent)
    }

    public async init(): Promise<this> {
        await super.init()

        this.client = new ChallengeClient(this.config)
        this.authClient = new ChallengeAuthClient(this.config, this.parent.authenticator)
        return this
    }

    private async verifyChallengeLocally(
        challenge: Challenge,
        signedChallenge: ChallengeSigned
    ): Promise<Relationship | undefined> {
        if (!challenge.createdBy) {
            return
        }
        const relationship = await this.parent.relationships.getActiveRelationshipToIdentity(challenge.createdBy)
        if (!relationship) {
            throw TransportErrors.general.recordNotFound(Relationship, challenge.createdBy.toString())
        }
        const challengeBuffer = CoreBuffer.fromUtf8(signedChallenge.challenge)
        let verified = false
        switch (challenge.type) {
            case ChallengeType.Identity:
                verified = await this.parent.relationships.verifyIdentity(
                    relationship,
                    challengeBuffer,
                    signedChallenge.signature
                )
                break
            case ChallengeType.Device:
                throw TransportErrors.general.notImplemented().logWith(this._log)
            case ChallengeType.Relationship:
                verified = await this.parent.relationships.verify(
                    relationship,
                    challengeBuffer,
                    signedChallenge.signature
                )
                break
        }

        if (!verified) {
            return
        }
        return relationship
    }

    public async checkChallenge(
        signedChallenge: ChallengeSigned,
        requiredType?: ChallengeType
    ): Promise<Relationship | undefined> {
        const challenge = await Challenge.deserialize(signedChallenge.challenge)
        if (requiredType && challenge.type !== requiredType) {
            return
        }

        if (challenge.expiresAt.isExpired()) {
            return
        }

        const [relationship, response] = await Promise.all([
            this.verifyChallengeLocally(challenge, signedChallenge),
            this.authClient.getChallenge(challenge.id.toString())
        ])

        if (
            !relationship ||
            (challenge.createdBy && response.value.createdBy !== challenge.createdBy.toString()) ||
            // TODO: JSSNMSHDD-2472 (Reenable check once the backbone returns with same timestamp)
            // response.expiresAt !== challenge.expiresAt.toString() ||
            response.value.id !== challenge.id.toString()
        ) {
            return
        }

        return relationship
    }

    public async createAccountCreationChallenge(identity: CryptoSignatureKeypair): Promise<ChallengeSigned> {
        const backboneResponse = (await this.client.createChallenge()).value
        const challenge = await Challenge.from({
            id: CoreId.from(backboneResponse.id),
            expiresAt: CoreDate.from(backboneResponse.expiresAt),
            type: ChallengeType.Identity
        })
        const serializedChallenge = challenge.serialize(false)
        const challengeBuffer = CoreBuffer.fromUtf8(serializedChallenge)
        const signature = await CoreCrypto.sign(challengeBuffer, identity.privateKey)
        const signedChallenge = await ChallengeSigned.from({
            challenge: serializedChallenge,
            signature: signature
        })
        return signedChallenge
    }

    public async createChallenge(
        type: ChallengeType = ChallengeType.Identity,
        relationship?: Relationship
    ): Promise<ChallengeSigned> {
        if (type === ChallengeType.Relationship && !relationship) {
            throw TransportErrors.challenges.challengeTypeRequiredRelationship().logWith(this._log)
        }
        const backboneResponse = (await this.authClient.createChallenge()).value
        const challenge = await Challenge.from({
            id: CoreId.from(backboneResponse.id),
            expiresAt: CoreDate.from(backboneResponse.expiresAt),
            createdBy: backboneResponse.createdBy ? CoreAddress.from(backboneResponse.createdBy) : undefined,
            createdByDevice: backboneResponse.createdByDevice
                ? CoreId.from(backboneResponse.createdByDevice)
                : undefined,
            type: type
        })

        const serializedChallenge = challenge.serialize(false)
        const challengeBuffer = CoreBuffer.fromUtf8(serializedChallenge)
        let signature
        switch (type) {
            case ChallengeType.Identity:
                signature = await this.parent.identity.sign(challengeBuffer)
                break
            case ChallengeType.Device:
                signature = await this.parent.activeDevice.sign(challengeBuffer)
                break
            case ChallengeType.Relationship:
                if (!relationship) {
                    throw TransportErrors.challenges.challengeTypeRequiredRelationship().logWith(this._log)
                }
                signature = await this.parent.relationships.sign(relationship, challengeBuffer)
                break
        }

        const signedChallenge = await ChallengeSigned.from({
            challenge: serializedChallenge,
            signature: signature
        })
        return signedChallenge
    }
}
