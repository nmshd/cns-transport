import { ControllerName, CoreController } from "../../core"
import { AccountController } from "../accounts/AccountController"

/**
 * The CertificateController keeps track of all created and received certificates.
 *
 * For example:
 *  - Store certificates for technical identities (per relationship)
 *  - Store certificates for own attributes
 *  - Store certificates for own relationships/roles/authorization
 *  - Store certificates for other identities
 */
export class CertificateController extends CoreController {
    public constructor(parent: AccountController) {
        super(ControllerName.Certificate, parent)
    }
}
