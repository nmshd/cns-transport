import { CoreBuffer, CryptoSignatureKeypair } from "@nmshd/crypto"
import { CoreCrypto } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractUnitTest } from "../testHelpers"

export class CryptoTest extends AbstractUnitTest {
    public run(): void {
        describe("Crypto", function () {
            it("generates a Keypair", async function () {
                const keypair = await CoreCrypto.generateSignatureKeypair()
                expect(keypair.privateKey).to.exist
            })

            it("signs correctly with a keypair", async function () {
                const keypair = await CoreCrypto.generateSignatureKeypair()
                expect(keypair.privateKey).to.exist

                const content = CoreBuffer.fromUtf8("Test")
                const signature = await CoreCrypto.sign(content, keypair.privateKey)
                const valid = await CoreCrypto.verify(content, signature, keypair.publicKey)
                expect(valid).to.be.true
            })

            it("signs correctly with a serialized keypair", async function () {
                const keypair = await CoreCrypto.generateSignatureKeypair()
                const serializedKeypair = keypair.toJSON()
                const keypair2 = CryptoSignatureKeypair.fromJSON(serializedKeypair)
                expect(keypair2.publicKey).to.exist
                expect(keypair2.privateKey).to.exist

                const content = CoreBuffer.fromUtf8("Test")
                const signature = await CoreCrypto.sign(content, keypair2.privateKey)
                const valid = await CoreCrypto.verify(content, signature, keypair2.publicKey)
                expect(valid).to.be.true
            })
        })
    }
}
