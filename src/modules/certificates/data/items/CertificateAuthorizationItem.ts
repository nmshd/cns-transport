import { serialize, type, validate } from "@js-soft/ts-serval"
import { CertificateItem, ICertificateItem } from "../CertificateItem"

export interface ICertificateAuthorizationItem extends ICertificateItem {
    authorization: string
}

/**
 * A CertificateAuthorizationItem gives a certain authorization, from the issuer to the
 * subject.
 *
 * Example:
 *  - Access Service XYZ
 *  - Admin access to a computer
 *  - Facility access to a visitor
 */
@type("CertificateAuthorizationItem")
export class CertificateAuthorizationItem extends CertificateItem {
    @validate()
    @serialize()
    public authorization: string

    public static async from(value: ICertificateAuthorizationItem): Promise<CertificateAuthorizationItem> {
        return await super.fromT(value, CertificateAuthorizationItem)
    }
}
