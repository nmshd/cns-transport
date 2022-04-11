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

    public static from(value: ICertificateIdentityConstraint): CertificateIdentityConstraint {
        return super.fromT(value, CertificateIdentityConstraint)
    }
}
