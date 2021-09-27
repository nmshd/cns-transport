import { type } from "@js-soft/ts-serval"
import { CoreSerializableAsync, ICoreSerializableAsync } from "../../../core"

export interface ICertificateConstraint extends ICoreSerializableAsync {}

/**
 * A CertificateConstraint limits a Certificate to a specific time, region or identity.
 */
@type("CertificateConstraint")
export class CertificateConstraint extends CoreSerializableAsync {
    public static async from(value: ICertificateConstraint): Promise<CertificateConstraint> {
        return await super.fromT(value, CertificateConstraint)
    }

    public static async deserialize(value: string): Promise<CertificateConstraint> {
        return await super.deserializeT(value, CertificateConstraint)
    }
}
