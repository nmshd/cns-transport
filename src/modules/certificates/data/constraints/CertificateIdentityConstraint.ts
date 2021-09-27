import { serialize, type, validate } from "@js-soft/ts-serval"
import { CoreAddress, ICoreAddress } from "../../../../core"
import { CertificateConstraint, ICertificateConstraint } from "../CertificateConstraint"

export interface ICertificateIdentityConstraint extends ICertificateConstraint {
    identity: ICoreAddress
}

@type("CertificateIdentityConstraint")
export class CertificateIdentityConstraint extends CertificateConstraint {
    @validate()
    @serialize()
    public identity: CoreAddress

    public static async from(value: ICertificateIdentityConstraint): Promise<CertificateIdentityConstraint> {
        return await super.fromT(value, CertificateIdentityConstraint)
    }
}
