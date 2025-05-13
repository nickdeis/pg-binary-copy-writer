import { type PGType } from "./encoders";
export declare function getPGBinaryHeader(): Uint8Array<ArrayBuffer>;
export declare function getPGBinaryFooter(): Uint8Array<ArrayBuffer>;
export declare class TypedRecordEncoder<T> {
    readonly schema: Record<keyof T, PGType>;
    readonly fields: (keyof T)[];
    constructor(schema: Record<keyof T, PGType>);
    encodeRecord(record: T): Uint8Array;
    encodeRecords(records: T[]): Uint8Array;
}
