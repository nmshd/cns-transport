import { CoreBuffer, CryptoSignatureAlgorithm, CryptoSignatureKeypair, CryptoSignaturePublicKey } from "@nmshd/crypto"
import { CoreCrypto, IdentityUtil } from "@nmshd/transport"
import { expect } from "chai"
import { AbstractUnitTest } from "../testHelpers"

export class IdentityGeneratorTest extends AbstractUnitTest {
    public run(): void {
        describe("IdentityGeneratorTest", function () {
            describe("From", function () {
                let kp: CryptoSignatureKeypair
                before(async function () {
                    kp = await CoreCrypto.generateSignatureKeypair()
                })

                it("should create a correct address object", async function () {
                    const address = await IdentityUtil.createAddress(kp.publicKey, "id1")
                    expect(address).to.exist
                    expect(address.address).to.exist
                    expect(address.address.substr(0, 3)).to.equal("id1")
                })

                it("should create a correct address object (test 0)", async function () {
                    const key = "tB9KFp/YqHrom3m5qUuZsd6l30DkaNjN14SxRw7YZuI="
                    const buf = CoreBuffer.fromBase64(key)
                    const pk = CryptoSignaturePublicKey.from({
                        publicKey: buf,
                        algorithm: CryptoSignatureAlgorithm.ECDSA_ED25519
                    })
                    const address = await IdentityUtil.createAddress(pk, "id1")
                    expect(address).to.exist
                    expect(address.address).to.exist
                    expect(address.address).to.equal("id18uSgVGTSNqECvt1DJM3bZg6U8p6RSjott")
                })

                it("should create a correct address object (testcases)", async function () {
                    const addresses = [
                        {
                            realm: "id1",
                            publicKey: "fj0o9eOiPRswTZL6j9lE9TRvpDDnPRMF0gJeahz/W2c=",
                            address: "id1QF24Gk2DfqCywRS7NpeH5iu7D4xvu6qv1"
                        },
                        {
                            realm: "id1",
                            publicKey: "jRxGfZtQ8a90TmKCGk+dhuX1CBjgoXuldhNPwrjpWsw=",
                            address: "id1HwY1TuyVBp3CmY3h18yTt1CKyu5qwB9wj"
                        },
                        {
                            realm: "id1",
                            publicKey: "PEODpwvi7KxIVa4qeUXia9apMFvPMktdDHiDitlfbjE=",
                            address: "id1LMp4k1XwxZ3WFXdAn9y12tv1ofe5so4kM"
                        },
                        {
                            realm: "id1",
                            publicKey: "mJGmNbxiVZAPToRuk9O3NvdfsWl6V+7wzIc+/57bU08=",
                            address: "id1McegXycvRoiJppS2LG25phn3jNveckFUL"
                        },
                        {
                            realm: "id1",
                            publicKey: "l68K/zdNp1VLoswcHAqN6QUFwCMU6Yvzf7XiW2m1hRY=",
                            address: "id193k6K5cJr94WJEWYb6Kei8zp5CGPyrQLS"
                        },
                        {
                            realm: "id1",
                            publicKey: "Gl8XTo8qFuUM+ksXixwp4g/jf3H/hU1F8ETuYaHCM5I=",
                            address: "id1BLrHAgDpimtLcGJGssMSm7bJHsvVe7CN"
                        },
                        {
                            realm: "id1",
                            publicKey: "rIS4kAzHXT7GgCA6Qm1ANlwM3x12QMSkeprHb6tjPyc=",
                            address: "id1NjGvLfWPrQ34PXWRBNiTfXv9DFiDQHExx"
                        },
                        {
                            realm: "id1",
                            publicKey: "hg/cbeBvfNrMiJ0dW1AtWC4IQwG4gkuhzG2+z6bAoRU=",
                            address: "id1Gda4aTXiBX9Pyc8UnmLaG44cX46umjnea"
                        },
                        {
                            realm: "id1",
                            publicKey: "kId+qWen/lKeTdyxcIQhkzvvvTU8wIJECfWUWbmRQRY=",
                            address: "id17RDEphijMPFGLbhqLWWgJfatBANMruC8f"
                        },
                        {
                            realm: "id1",
                            publicKey: "NcqlzTEpSlKX9gmNBv41EjPRHpaNYwt0bxqh1bgyJzA=",
                            address: "id19meHs4Di7JYNXoRPx9bFD6FUcpHFo3mBi"
                        }
                    ]

                    for (let i = 0; i < 10; i++) {
                        const testcase = addresses[i]
                        const buf = CoreBuffer.fromBase64(testcase.publicKey)
                        const pk = CryptoSignaturePublicKey.from({
                            publicKey: buf,
                            algorithm: CryptoSignatureAlgorithm.ECDSA_ED25519
                        })
                        const address = await IdentityUtil.createAddress(pk, testcase.realm)
                        expect(address.toString()).to.equal(testcase.address)
                    }
                })

                it("should positively check a correct address object (without giving public key and realm)", async function () {
                    const address = await IdentityUtil.createAddress(kp.publicKey, "id1")
                    const valid = await IdentityUtil.checkAddress(address)
                    expect(valid).to.be.true
                })

                it("should positively check a correct address object (giving public key)", async function () {
                    const address = await IdentityUtil.createAddress(kp.publicKey, "id1")
                    const valid = await IdentityUtil.checkAddress(address, kp.publicKey)
                    expect(valid).to.be.true
                })

                it("should positively check a correct address object (giving public key and realm)", async function () {
                    const address = await IdentityUtil.createAddress(kp.publicKey, "id1")
                    const valid = await IdentityUtil.checkAddress(address, kp.publicKey, "id1")
                    expect(valid).to.be.true
                })

                it("should negatively check an incorrect address object (wrong realm)", async function () {
                    const address = await IdentityUtil.createAddress(kp.publicKey, "id1")
                    const valid = await IdentityUtil.checkAddress(address, kp.publicKey, "id2")
                    expect(valid).to.be.false
                })

                it("should negatively check an incorrect address object (wrong checksum)", async function () {
                    const address = await IdentityUtil.createAddress(kp.publicKey, "id1")
                    const index = 5
                    let replaceWith = "b"
                    const currentString = address.address.substr(index, replaceWith.length)
                    if (currentString === replaceWith) {
                        replaceWith = "c"
                    }
                    const wrongaddress =
                        address.address.substr(0, index) +
                        replaceWith +
                        address.address.substr(index + replaceWith.length)
                    address.address = wrongaddress
                    const valid = await IdentityUtil.checkAddress(address, kp.publicKey, "id1")
                    expect(valid).to.be.false
                })

                it("should negatively check an incorrect address object (wrong publicKey)", async function () {
                    const kp2 = await CoreCrypto.generateSignatureKeypair()
                    const address = await IdentityUtil.createAddress(kp.publicKey, "id1")
                    const valid = await IdentityUtil.checkAddress(address, kp2.publicKey, "id1")
                    expect(valid).to.be.false
                })
                // eslint-disable-next-line jest/no-commented-out-tests
                /*
                it("should serialize as a String and valid JSON", async function() {
                    const i:OwnIdentity = await IdentityUtil.createIdentity("Test");
                    const s:string = await i.serialize();
                    expect(s).to.be.a("string");
                    const o:unknown = JSON.parse(s);
                });

                it("should incorporate all the properties", async function() {
                    const i:OwnIdentity = await IdentityUtil.createIdentity("Test");
                    const s:string = await i.serialize();

                    expect(s).to.be.a("string");
                    const o:IOwnIdentity = JSON.parse(s) as IOwnIdentity;
                    expect(o.publicIdentity.version).to.exist;
                    expect(o.publicIdentity.version).to.be.a("string");

                    expect(o.publicIdentity.address).to.exist;
                    expect(o.publicIdentity.address).to.be.a("string");

                    expect(o.publicIdentity.addressChecksum).to.exist;
                    expect(o.publicIdentity.addressChecksum).to.be.a("string");

                    expect(o.publicIdentity.did).to.exist;
                    expect(o.publicIdentity.did).to.be.a("string");

                    expect(o.createdAt).to.exist;
                    expect(o.createdAt).to.be.a("string");

                    expect(o.publicIdentity.exchange).to.exist;
                    expect(o.publicIdentity.exchange).to.be.an("object");

                    expect(o.exchangeKeypair).to.exist;
                    expect(o.exchangeKeypair).to.be.an("object");
                    expect(o.exchangeKeypair.privateKey).to.exist;
                    expect(o.exchangeKeypair.publicKey).to.exist;

                    expect(o.publicIdentity.signing).to.exist;
                    expect(o.publicIdentity.signing).to.be.an("object");

                    expect(o.signingKeypair).to.exist;
                    expect(o.signingKeypair).to.be.an("object");
                    expect(o.signingKeypair.privateKey).to.exist;
                    expect(o.signingKeypair.publicKey).to.exist;

                    expect(o.name).to.exist;
                    expect(o.name).to.be.a("string");
                });

                it("should deserialize correctly", async function() {
                    const i:OwnIdentity = await IdentityUtil.createIdentity("Test");
                    const s:string = await i.serialize();

                    expect(s).to.be.a("string");
                    const o:IOwnIdentity = await OwnIdentity.deserialize(s);
                    expect(o.publicIdentity.version).to.exist;
                    expect(o.publicIdentity.version).to.be.a("string");

                    expect(o.publicIdentity.address).to.exist;
                    expect(o.publicIdentity.address).to.be.instanceof(Address);

                    expect(o.publicIdentity.addressChecksum).to.exist;
                    expect(o.publicIdentity.addressChecksum).to.be.a("string");

                    expect(o.publicIdentity.did).to.exist;
                    expect(o.publicIdentity.did).to.be.a("string");

                    expect(o.createdAt).to.exist;
                    expect(o.createdAt).to.be.instanceof(Date);
                    expect(o.createdAt.dateObj).to.be.instanceOf(Date);
                    expect(o.createdAt.date).to.be.a("string");
                    expect(o.createdAt.dateObj.getTime()).to.be.greaterThan(100000);

                    expect(o.publicIdentity.exchange).to.exist;
                    expect(o.publicIdentity.exchange).to.be.instanceof(CryptoPublicKey);

                    expect(o.exchangeKeypair).to.exist;
                    expect(o.exchangeKeypair).to.be.instanceof(CryptoKeypair);
                    expect(o.exchangeKeypair.privateKey).to.exist;
                    expect(o.exchangeKeypair.publicKey).to.exist;

                    expect(o.publicIdentity.signing).to.exist;
                    expect(o.publicIdentity.signing).to.be.instanceof(CryptoPublicKey);

                    expect(o.signingKeypair).to.exist;
                    expect(o.signingKeypair).to.be.instanceof(CryptoKeypair);
                    expect(o.signingKeypair.privateKey).to.exist;
                    expect(o.signingKeypair.publicKey).to.exist;

                    expect(o.name).to.exist;
                    expect(o.name).to.be.a("string");
                });
                */
            })
        })
    }
}
