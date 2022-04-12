import { ISerialized, serialize, type, validate } from "@js-soft/ts-serval"
import {
    CoreBuffer,
    CryptoExchangePublicKey,
    ICryptoExchangePublicKey,
    ICryptoExchangePublicKeySerialized
} from "@nmshd/crypto"
import { CoreId, ICoreId } from "../../../core"

export interface IRelationshipTemplatePublicKey extends ICryptoExchangePublicKey {
    id: ICoreId
}
export interface IRelationshipTemplatePublicKeySerialized extends ICryptoExchangePublicKeySerialized, ISerialized {
    id: string
}

@type("RelationshipTemplatePublicKey")
export class RelationshipTemplatePublicKey extends CryptoExchangePublicKey implements IRelationshipTemplatePublicKey {
    @serialize({ enforceString: true })
    @validate()
    public id: CoreId

    public toJSON(verbose = true): IRelationshipTemplatePublicKeySerialized {
        return {
            id: this.id.toString(),
            pub: this.publicKey.toBase64URL(),
            alg: this.algorithm,
            "@type": verbose ? "RelationshipTemplatePublicKey" : undefined
        }
    }

    public toBase64(): string {
        return CoreBuffer.utf8_base64(this.serialize())
    }

    public serialize(verbose = true): string {
        return JSON.stringify(this.toJSON(verbose))
    }

    protected static override preFrom(value: any): any {
        const newValue = super.preFrom(value)
        newValue.id = value.id

        return newValue
    }

    public static fromJSON(value: IRelationshipTemplatePublicKeySerialized): RelationshipTemplatePublicKey {
        return this.fromAny(value)
    }

    public static from(value: IRelationshipTemplatePublicKey): RelationshipTemplatePublicKey {
        return this.fromAny(value)
    }
}
