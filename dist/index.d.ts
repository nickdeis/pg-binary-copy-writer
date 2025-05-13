import { type PGType } from "./encoders";
export declare class TypedRecordEncoder<T> {
    readonly schema: Record<keyof T, PGType>;
    readonly fields: (keyof T)[];
    constructor(schema: Record<keyof T, PGType>);
    static getPGBinaryHeader(): Uint8Array<ArrayBuffer>;
    static getPGBinaryFooter(): Uint8Array<ArrayBuffer>;
    encodeRecord(record: T): Uint8Array<ArrayBuffer>;
    encodeRecords(records: T[]): Uint8Array<ArrayBuffer>;
}
