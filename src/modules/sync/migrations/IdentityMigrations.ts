import { AccountController } from "../../accounts/AccountController"

export class IdentityMigrations {
    public constructor(private readonly accountController: AccountController) {}

    public v1(): Promise<void> {
        return Promise.resolve()
    }
}
