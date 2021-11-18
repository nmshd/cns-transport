import { CoreBuffer, CryptoSecretKey, CryptoSignaturePrivateKey } from "@nmshd/crypto"
import {
    AccountController,
    CoreDate,
    CoreId,
    Device,
    DeviceSecretCredentials,
    DeviceSecretType,
    DeviceSharedSecret
} from "@nmshd/transport"
import { expect } from "chai"
import { AbstractTest, AppDeviceTest, DeviceTestParameters, TestUtil } from "../../testHelpers"

export class DeviceOnboardingTest extends AbstractTest {
    public run(): void {
        const that = this

        describe("Device Onboarding", function () {
            let parameters: DeviceTestParameters
            let device1: AppDeviceTest
            let device2: AppDeviceTest
            let device3: AppDeviceTest

            let device1Account: AccountController
            let device2Account: AccountController

            let newDevice: Device
            let sharedSecret: DeviceSharedSecret

            this.timeout(150000)

            before(async function () {
                parameters = new DeviceTestParameters(
                    { ...that.config, datawalletEnabled: true },
                    that.connection,
                    that.loggerFactory
                )
                device1 = new AppDeviceTest(parameters)
                device2 = new AppDeviceTest(parameters)
                device3 = new AppDeviceTest(parameters)

                await device1.init()
                await device2.init()

                device1Account = await device1.createAccount()
            })

            it("should create correct device", async function () {
                newDevice = await device1Account.devices.sendDevice({ name: "Test", isAdmin: true })
                await device1Account.syncDatawallet()
                expect(newDevice).instanceOf(Device)
                expect(newDevice.name).equals("Test")
                expect(newDevice.publicKey).to.not.exist
                expect(newDevice.operatingSystem).to.not.exist
                expect(newDevice.lastLoginAt).to.not.exist
                expect(newDevice.initialPassword!.length).below(51).above(44)
                expect(newDevice.username).to.exist
                expect(newDevice.id).instanceOf(CoreId)
                expect(newDevice.createdAt).instanceOf(CoreDate)
                expect(newDevice.createdByDevice).instanceOf(CoreId)
                expect(newDevice.createdByDevice.toString()).equals(device1Account.activeDevice.id.toString())
            })

            it("should list all devices correctly", async function () {
                const devices = await device1Account.devices.list()
                expect(devices).to.be.of.length(2)
                expect(devices[0].id.toString()).equals(device1Account.activeDevice.id.toString())
                expect(devices[1].id.toString()).equals(newDevice.id.toString())
            })

            it("should create correct device shared secret", async function () {
                sharedSecret = await device1Account.activeDevice.secrets.createDeviceSharedSecret(newDevice, 1, true)
                expect(sharedSecret).instanceOf(DeviceSharedSecret)
                expect(sharedSecret.id.toString()).equals(newDevice.id.toString())
                expect(JSON.stringify(sharedSecret.identity.toJSON(false))).equals(
                    JSON.stringify(device1Account.identity.identity.toJSON(false))
                )
                expect(sharedSecret.username).equals(newDevice.username)
                expect(sharedSecret.password).equals(newDevice.initialPassword)
                expect(sharedSecret.synchronizationKey).instanceOf(CryptoSecretKey)
                expect(sharedSecret.identityPrivateKey).instanceOf(CryptoSignaturePrivateKey)
            })

            it("should create correct device shared secret via controller", async function () {
                sharedSecret = await device1Account.devices.getSharedSecret(newDevice.id)
                expect(sharedSecret).instanceOf(DeviceSharedSecret)
                expect(sharedSecret.id.toString()).equals(newDevice.id.toString())
                expect(JSON.stringify(sharedSecret.identity.toJSON(false))).equals(
                    JSON.stringify(device1Account.identity.identity.toJSON(false))
                )
                expect(sharedSecret.username).equals(newDevice.username)
                expect(sharedSecret.password).equals(newDevice.initialPassword)
                expect(sharedSecret.synchronizationKey).instanceOf(CryptoSecretKey)
                expect(sharedSecret.identityPrivateKey).instanceOf(CryptoSignaturePrivateKey)
            })

            it("should serialize device shared secrets and deserialize them again", async function () {
                const serialized = sharedSecret.serialize()
                sharedSecret = await DeviceSharedSecret.deserialize(serialized)
                expect(sharedSecret).instanceOf(DeviceSharedSecret)
                expect(sharedSecret.id.toString()).equals(newDevice.id.toString())
                expect(JSON.stringify(sharedSecret.identity.toJSON(false))).equals(
                    JSON.stringify(device1Account.identity.identity.toJSON(false))
                )
                expect(sharedSecret.username).equals(newDevice.username)
                expect(sharedSecret.password).equals(newDevice.initialPassword)
                expect(sharedSecret.synchronizationKey).instanceOf(CryptoSecretKey)
                expect(sharedSecret.identityPrivateKey).instanceOf(CryptoSignaturePrivateKey)
            })

            it("should onboard new device with device shared secret", async function () {
                device2Account = await device2.onboardDevice(sharedSecret)
                expect(device2Account).instanceOf(AccountController)
            })

            it("should be able to login after a device onboarding", async function () {
                await device2Account.init()
                expect(device2Account).instanceOf(AccountController)
            })

            it("should own the same identity", function () {
                expect(device1Account.identity.identity.toBase64()).equals(device2Account.identity.identity.toBase64())
            })

            it("should be able to sign for the existing identity", async function () {
                const testBuffer = CoreBuffer.fromUtf8("Test")
                const dev1Signature = await device1Account.identity.sign(testBuffer)
                const dev2Check = await device2Account.identity.verify(testBuffer, dev1Signature)
                expect(dev2Check).to.be.true
                const dev2Signature = await device2Account.identity.sign(testBuffer)
                const dev1Check = await device1Account.identity.verify(testBuffer, dev2Signature)
                expect(dev1Check).to.be.true
            })

            it("should have created a new device keypair", async function () {
                const testBuffer = CoreBuffer.fromUtf8("Test")
                const dev2Signature = await device2Account.activeDevice.sign(testBuffer)
                const dev2Check = await device2Account.activeDevice.verify(testBuffer, dev2Signature)
                expect(dev2Check).to.be.true

                const dev1Check = await device1Account.activeDevice.verify(testBuffer, dev2Signature)
                expect(dev1Check).to.be.false

                const dev1Container = await device1Account.activeDevice.secrets.loadSecret(
                    DeviceSecretType.DeviceSignature
                )
                const dev1Key = dev1Container!.secret as CryptoSignaturePrivateKey
                expect(dev1Key).instanceOf(CryptoSignaturePrivateKey)
                const dev2Container = await device2Account.activeDevice.secrets.loadSecret(
                    DeviceSecretType.DeviceSignature
                )
                const dev2Key = dev2Container!.secret as CryptoSignaturePrivateKey
                expect(dev2Key).instanceOf(CryptoSignaturePrivateKey)
                expect(dev1Key.toBase64()).to.not.equal(dev2Key.toBase64())
            })

            it("should own the same synchronization key", async function () {
                const dev1Container = await device2Account.activeDevice.secrets.loadSecret(
                    DeviceSecretType.IdentitySignature
                )
                const dev1Key = dev1Container!.secret as CryptoSignaturePrivateKey
                expect(dev1Key).instanceOf(CryptoSignaturePrivateKey)
                const dev2Container = await device2Account.activeDevice.secrets.loadSecret(
                    DeviceSecretType.IdentitySignature
                )
                const dev2Key = dev2Container!.secret as CryptoSignaturePrivateKey
                expect(dev2Key).instanceOf(CryptoSignaturePrivateKey)
                expect(dev1Key.toBase64()).to.equal(dev2Key.toBase64())
            })

            // eslint-disable-next-line jest/expect-expect
            it("should have created a datawallet creation event with the public key", async function () {
                // TODO: JSSNMSHDD-2489 (write test)
            })

            it("should have different onboarding credentials", async function () {
                const dev1Container = await device1Account.activeDevice.secrets.loadSecret(
                    DeviceSecretType.DeviceCredentials
                )
                const dev1Key = dev1Container!.secret as DeviceSecretCredentials
                expect(dev1Key).instanceOf(DeviceSecretCredentials)

                const dev2Container = await device2Account.activeDevice.secrets.loadSecret(
                    DeviceSecretType.DeviceCredentials
                )
                const dev2Key = dev2Container!.secret as DeviceSecretCredentials
                expect(dev2Key).instanceOf(DeviceSecretCredentials)

                expect(dev1Key.id).not.equals(dev2Key.id)
                expect(dev1Key.username).not.equals(dev2Key.username)
                expect(dev1Key.password).not.equals(dev2Key.password)
            })

            it("should have changed the password of the created device (locally)", async function () {
                const dev1Container = await device1Account.activeDevice.secrets.loadSecret(
                    DeviceSecretType.DeviceCredentials
                )
                const dev1Key = dev1Container!.secret as DeviceSecretCredentials
                expect(dev1Key).instanceOf(DeviceSecretCredentials)

                expect(dev1Key.password).not.equals(newDevice.initialPassword)
            })

            it("should have changed the password of the created device (backbone)", async function () {
                TestUtil.useFatalLoggerFactory()
                await device3.init()

                await TestUtil.expectThrowsAsync(async () => {
                    await device3.onboardDevice(sharedSecret)
                }, "error.transport.request.noAuthGrant")
            })

            // eslint-disable-next-line jest/expect-expect
            it("device1 should have received the public key of device2", function () {
                // TODO: JSSNMSHDD-2489 (write test)
            })

            // eslint-disable-next-line jest/expect-expect
            it("should have synced the datawallet", async function () {
                // TODO: JSSNMSHDD-2489 (write test)
            })

            // eslint-disable-next-line jest/expect-expect
            it("should synchronize devices via datawallet", async function () {
                // TODO: JSSNMSHDD-2489 (enable once Datawallet is fine)
                // const devices = await device2Account.devices.list()
                // expect(devices).to.be.of.length(2)
                // expect(devices[0].id.toString()).equals(device1Account.device.id.toString())
                // expect(devices[1].id.toString()).equals(device2Account.device.id.toString())
            })

            // eslint-disable-next-line jest/expect-expect
            it("device2 should have deleted the initial password of the devices list", async function () {
                // TODO: JSSNMSHDD-2489 (write test)
            })

            // eslint-disable-next-line jest/expect-expect
            it("device without identity key should not be able to sign for an identity", async function () {
                // TODO: JSSNMSHDD-2489 (write test)
            })

            // eslint-disable-next-line jest/expect-expect
            it("device without identity key should wait for an device certificate by device1", async function () {
                // TODO: JSSNMSHDD-2489 (write test)
            })

            after(async function () {
                await device1.close()
                await device2.close()
                await device3.close()
            })
        })
    }
}
