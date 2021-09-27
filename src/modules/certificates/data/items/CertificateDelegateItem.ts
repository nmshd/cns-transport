import { serialize, type, validate } from "@js-soft/ts-serval"
import { CertificateItem, ICertificateItem } from "../CertificateItem"

export interface ICertificateDelegateItem extends ICertificateItem {}

export enum CertificateDelegateType {
    Clone = "clone",
    Custodian = "custodian",
    Sign = "sign",
    Ppa = "ppa",
    Communication = "communication"
}

/**
 * A CertificateDelegateItem
 */
@type("CertificateDelegateItem")
export class CertificateDelegateItem extends CertificateItem {
    @validate()
    @serialize()
    public type: CertificateDelegateType

    @validate({ nullable: true })
    @serialize()
    public content: string

    public static async from(value: ICertificateDelegateItem): Promise<CertificateDelegateItem> {
        return await super.fromT(value, CertificateDelegateItem)
    }
}
