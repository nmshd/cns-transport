import { CryptoExchangeKeypair, CryptoSecretKey, CryptoSignatureKeypair } from "@nmshd/crypto"
import { AccountController, CoreCrypto, SecretContainerPlain, SecretController, Transport } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest } from "../../core/AbstractTest"
import { TestUtil } from "../../core/TestUtil"

export class SecretControllerTest extends AbstractTest {
    public run(): void {
        const that = this

        const transport = new Transport(that.connection, that.config, that.loggerFactory)
        let account: AccountController
        let subject: AccountController
        let secretKey: CryptoSecretKey
        let signatureKeypair: CryptoSignatureKeypair
        let exchangeKeypair: CryptoExchangeKeypair
        let secretController: SecretController

        describe("SecretController", function () {
            this.timeout(30000)

            before(async function () {
                await TestUtil.clearAccounts(that.connection)

                await transport.init()

                const accounts = await TestUtil.provideAccounts(transport, 2, SecretControllerTest.name)
                account = accounts[0]
                subject = accounts[1]
                secretController = await new SecretController(account).init()
            })

            it("should store and load a SignatureKeypair by Id", async function () {
                const keypair = await CoreCrypto.generateSignatureKeypair()
                signatureKeypair = keypair
                const secretContainer = await secretController.storeSecret(keypair, "test")

                const secretContainerLoaded = await secretController.loadSecretById(secretContainer.id)

                expect(secretContainerLoaded).to.exist

                if (!secretContainerLoaded) return

                expect(secretContainerLoaded.secret).to.be.instanceOf(CryptoSignatureKeypair)

                const loadedSecret: CryptoSignatureKeypair =
                    secretContainerLoaded.secret as unknown as CryptoSignatureKeypair
                expect(loadedSecret.privateKey.toBase64()).to.equal(keypair.privateKey.toBase64())
                expect(loadedSecret.publicKey.toBase64()).to.equal(keypair.publicKey.toBase64())
            })

            it("should store and load an ExchangeKeypair by Id", async function () {
                const keypair = await CoreCrypto.generateExchangeKeypair()
                exchangeKeypair = keypair
                const secretContainer = await secretController.storeSecret(keypair, "test")

                const secretContainerLoaded = await secretController.loadSecretById(secretContainer.id)

                expect(secretContainerLoaded).to.exist

                if (!secretContainerLoaded) return

                expect(secretContainerLoaded.secret).to.be.instanceOf(CryptoExchangeKeypair)
                const loadedSecret: CryptoExchangeKeypair =
                    secretContainerLoaded.secret as unknown as CryptoExchangeKeypair
                expect(loadedSecret.privateKey.toBase64()).to.equal(keypair.privateKey.toBase64())
                expect(loadedSecret.publicKey.toBase64()).to.equal(keypair.publicKey.toBase64())
            })

            it("should store and load a SecretKey by Id", async function () {
                const key = await CoreCrypto.generateSecretKey()
                secretKey = key
                const secretContainer = await secretController.storeSecret(key, "test")

                const secretContainerLoaded = await secretController.loadSecretById(secretContainer.id)

                expect(secretContainerLoaded).to.exist

                if (!secretContainerLoaded) return

                expect(secretContainerLoaded.secret).to.be.instanceOf(CryptoSecretKey)
                const loadedSecret: CryptoSecretKey = secretContainerLoaded.secret as unknown as CryptoSecretKey
                expect(loadedSecret.secretKey.toBase64()).to.equal(key.secretKey.toBase64())
            })

            it("should load the synchronizedSecrets by Name", async function () {
                const synchronizedSecrets: SecretContainerPlain[] = await secretController.loadSecretsByName("test")
                expect(synchronizedSecrets).to.be.of.length(3)
                for (const secret of synchronizedSecrets) {
                    expect(secret.secret).to.exist

                    if (secret.secret instanceof CryptoSignatureKeypair) {
                        const loadedSecret: CryptoSignatureKeypair = secret.secret
                        expect(loadedSecret.privateKey.toBase64()).to.equal(signatureKeypair.privateKey.toBase64())
                        expect(loadedSecret.publicKey.toBase64()).to.equal(signatureKeypair.publicKey.toBase64())
                    } else if (secret.secret instanceof CryptoExchangeKeypair) {
                        const loadedSecret: CryptoExchangeKeypair = secret.secret
                        expect(loadedSecret.privateKey.toBase64()).to.equal(exchangeKeypair.privateKey.toBase64())
                        expect(loadedSecret.publicKey.toBase64()).to.equal(exchangeKeypair.publicKey.toBase64())
                    } else if (secret.secret instanceof CryptoSecretKey) {
                        const loadedSecret: CryptoSecretKey = secret.secret
                        expect(loadedSecret.secretKey.toBase64()).to.equal(secretKey.secretKey.toBase64())
                    } else {
                        throw new Error("Secret type mismatch!")
                    }
                }
            })
            after(async function () {
                await account.close()
                await subject.close()
            })
        })
    }
}
