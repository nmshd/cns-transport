import { CoreIdHelper } from "./CoreIdHelper"

export class CoreIds {
    public static readonly generic = new CoreIdHelper("")
    public static readonly secret = new CoreIdHelper("CORSEC")
    public static readonly relationshipSecret = new CoreIdHelper("CORRSE")
    public static readonly relationshipTemplateKey = new CoreIdHelper("CORRTK")
    public static readonly datawalletModification = new CoreIdHelper("CORDWM")
    public static readonly fileReference = new CoreIdHelper("CORFRF")
}
