import {
    AccountController,
    Certificate,
    CertificatePublicAttributeItem,
    CertificateTimeConstraint,
    Core,
    CoreDate,
    ICertificateContent
} from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest } from "../../core/AbstractTest"
import { TestUtil } from "../../core/TestUtil"

export class CertificateIssuerTest extends AbstractTest {
    public run(): void {
        const that = this

        describe("CertificateIssuer", function () {
            let coreLib: Core

            let issuer: AccountController
            let subject: AccountController

            this.timeout(30000)

            before(async function () {
                coreLib = new Core(that.connection, that.config, that.loggerFactory)

                await TestUtil.clearAccounts(that.connection)

                await coreLib.init()

                const accounts = await TestUtil.provideAccounts(coreLib, 2, CertificateIssuerTest.name)
                issuer = accounts[0]
                subject = accounts[1]
            })

            describe("IssueCertificate", function () {
                it("should return with an Certificate object", async function () {
                    const content: ICertificateContent = {
                        issuedAt: CoreDate.utc(),
                        issuer: issuer.identity.address,
                        subject: subject.identity.address,
                        subjectPublicKey: subject.identity.publicKey,
                        issuerData: {
                            id: "abc"
                        },
                        constraints: [
                            CertificateTimeConstraint.from({
                                validFrom: CoreDate.utc(),
                                validTo: CoreDate.utc().add({ years: 2 })
                            })
                        ],
                        items: [
                            CertificatePublicAttributeItem.from({
                                name: "Person.givenName",
                                value: "Herbert"
                            }),
                            CertificatePublicAttributeItem.from({
                                name: "Person.familyName",
                                value: "Müller"
                            }),
                            CertificatePublicAttributeItem.from({
                                name: "Person.birthDate",
                                value: "16.12.1982"
                            })
                        ]
                    }
                    const cert = await issuer.certificateIssuer.issueCertificate(content)

                    expect(cert).to.be.instanceof(Certificate)
                    const serializedCert: string = cert.serialize()

                    const valid = await cert.verify(issuer.identity.publicKey)
                    expect(valid).to.equal(true)

                    const cert2 = await Certificate.deserialize(serializedCert)
                    const valid2 = await cert2.verify(issuer.identity.publicKey)
                    expect(valid2).to.equal(true)
                })
            })
        })
    }
}
