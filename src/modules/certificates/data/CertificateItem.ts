import { type } from "@js-soft/ts-serval"
import { CoreSerializableAsync, ICoreSerializableAsync } from "../../../core"

export interface ICertificateItem extends ICoreSerializableAsync {}

/**
 * A CertificateItem is a digitally signed hash with information about the signature date,
 * the signer, the signature algorithm and the version.
 */
@type("CertificateItem")
export class CertificateItem extends CoreSerializableAsync {
    public static async from(value: ICertificateItem): Promise<CertificateItem> {
        return await super.fromT(value, CertificateItem)
    }

    public static async deserialize(value: string): Promise<CertificateItem> {
        return await super.deserializeT(value, CertificateItem)
    }
}
