import { type, ValidationError } from "@js-soft/ts-serval"
import { BackboneIds, IReference, Reference } from "../../../core"

export interface IFileReference extends IReference {}

@type("FileReference")
export class FileReference extends Reference implements IFileReference {
    protected static override preFrom(value: any): any {
        if (value?.id && BackboneIds.file.validate(value.id)) {
            throw new ValidationError(FileReference.name, "id", "id must start with `FIL`")
        }

        return value
    }

    public static override from(value: IFileReference | string): FileReference {
        return super.from(value)
    }
}
