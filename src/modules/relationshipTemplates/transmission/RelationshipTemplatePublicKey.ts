import { ISerialized, serialize, type, validate } from "@js-soft/ts-serval"
import {
    CoreBuffer,
    CryptoExchangeAlgorithm,
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

    public constructor(id: CoreId, algorithm: CryptoExchangeAlgorithm, publicKey: CoreBuffer) {
        super(algorithm, publicKey)
        this.id = id
    }

    public toJSON(verbose = true): IRelationshipTemplatePublicKeySerialized {
        const obj: IRelationshipTemplatePublicKeySerialized = {
            id: this.id.toString(),
            pub: this.publicKey.toBase64URL(),
            alg: this.algorithm
        }
        if (verbose) {
            obj["@type"] = "RelationshipTemplatePublicKey"
        }
        return obj
    }

    public toBase64(): string {
        return CoreBuffer.utf8_base64(this.serialize())
    }

    public serialize(verbose = true): string {
        return JSON.stringify(this.toJSON(verbose))
    }

    public static async fromJSON(
        value: IRelationshipTemplatePublicKeySerialized
    ): Promise<RelationshipTemplatePublicKey> {
        const key = await CryptoExchangePublicKey.fromJSON(value)

        return new RelationshipTemplatePublicKey(CoreId.from(value.id), key.algorithm, key.publicKey)
    }

    public static from(value: IRelationshipTemplatePublicKey): Promise<RelationshipTemplatePublicKey> {
        return Promise.resolve(
            new RelationshipTemplatePublicKey(CoreId.from(value.id), value.algorithm, value.publicKey)
        )
    }

    public static async deserialize(value: string): Promise<RelationshipTemplatePublicKey> {
        const obj = JSON.parse(value)
        return await this.fromJSON(obj)
    }
}
