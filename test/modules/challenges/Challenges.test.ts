import { SerializableAsync } from "@js-soft/ts-serval"
import { CryptoSignature } from "@nmshd/crypto"
import {
    AccountController,
    Challenge,
    ChallengeSigned,
    ChallengeType,
    CoreAddress,
    CoreDate,
    CoreId,
    Transport
} from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest } from "../../testHelpers/AbstractTest"
import { TestUtil } from "../../testHelpers/TestUtil"

export class ChallengesTest extends AbstractTest {
    public run(): void {
        const that = this

        describe("ChallengeTest", function () {
            let transport: Transport
            this.timeout(200000)

            let recipient: AccountController
            let sender: AccountController

            before(async function () {
                transport = new Transport(that.connection, that.config, that.loggerFactory)
                await TestUtil.clearAccounts(that.connection)

                await transport.init()

                const accounts = await TestUtil.provideAccounts(transport, 2, ChallengesTest.name)

                sender = accounts[0]
                recipient = accounts[1]

                await TestUtil.addRelationship(recipient, sender)
            })

            it("sender should create a signed challenge", async function () {
                const challenge = await sender.challenges.createChallenge()
                expect(challenge).instanceOf(ChallengeSigned)
                expect(challenge.challenge).is.a("string")
                expect(challenge.signature).is.instanceOf(CryptoSignature)

                const deserializedChallenge = await Challenge.deserialize(challenge.challenge)
                expect(deserializedChallenge.createdBy).instanceOf(CoreAddress)
                expect(deserializedChallenge.expiresAt).instanceOf(CoreDate)
                expect(deserializedChallenge.type).equals(ChallengeType.Identity)
                expect(deserializedChallenge.id).instanceOf(CoreId)
            })

            it("recipient should verify a signed challenge", async function () {
                const challenge = await sender.challenges.createChallenge()
                const serializedChallenge = challenge.serialize(true)
                const deserializedChallenge = (await SerializableAsync.deserializeUnknown(
                    serializedChallenge
                )) as ChallengeSigned
                const relationship = await recipient.challenges.checkChallenge(deserializedChallenge)
                expect(relationship).to.exist
            })

            after(async function () {
                await sender.close()
                await recipient.close()
            })
        })
    }
}
