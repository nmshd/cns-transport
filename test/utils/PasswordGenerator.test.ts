import { PasswordGenerator } from "@nmshd/transport"
import { expect } from "chai"
import { TestUtil } from "../core"
import { AbstractUnitTest } from "./AbstractUnitTest"

export class PasswordGeneratorTest extends AbstractUnitTest {
    public run(): void {
        describe("PasswordGeneratorTest", function () {
            describe("CreatePassword", function () {
                it("should return a fixed length password", async function () {
                    for (let i = 1; i < 20; i++) {
                        const pass = await PasswordGenerator.createPassword(i)
                        expect(pass).to.be.of.length(i)
                    }
                })

                it("should return a random length password within the range", async function () {
                    for (let i = 1; i < 20; i++) {
                        const pass = await PasswordGenerator.createPassword(6, 10)
                        expect(pass.length).to.be.within(6, 10)
                    }
                })
            })

            describe("CreateStrongPassword", function () {
                it("should return a random password with a dynamic size", async function () {
                    for (let i = 1; i < 20; i++) {
                        const password = await PasswordGenerator.createStrongPassword()
                        expect(password.length).to.be.within(8, 12)
                    }
                })
                it("should return a random password with the correct given fix length", async function () {
                    for (let i = 1; i < 20; i++) {
                        const pass = await PasswordGenerator.createStrongPassword(50, 50)
                        expect(pass).to.be.length(50)
                    }
                })
                it("should return a random password with the correct given length interval", async function () {
                    for (let i = 1; i < 20; i++) {
                        const pass = await PasswordGenerator.createStrongPassword(20, 50)
                        expect(pass.length).to.be.within(19, 51)
                    }
                })
                it("should throw an error if minLength is too low", async function () {
                    for (let i = 1; i < 20; i++) {
                        await TestUtil.expectThrowsAsync(
                            PasswordGenerator.createStrongPassword(2, 20),
                            "error.transport.passwordMinLengthTooShort"
                        )
                    }
                })
            })

            describe("CreateUnitPassword", function () {
                it("should return a random password", async function () {
                    for (let i = 1; i < 20; i++) {
                        const pass = await PasswordGenerator.createUnitPassword()
                        expect(pass.length).to.be.within(5, 30)
                    }
                })
            })
        })
    }
}
