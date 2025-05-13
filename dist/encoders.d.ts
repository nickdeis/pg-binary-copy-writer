import BufferPut from "./BufferPut";
import { MinBuffer } from "./MinBuffer";
interface PGCoder<T> {
    readonly oid: number;
    send(buf: BufferPut, value: T): void;
}
declare class BaseArrayCoder<T> implements PGCoder<T[]> {
    readonly oid: number;
    readonly type: PGCoreType;
    constructor(oid: number, type: PGCoreType);
    send(buf: BufferPut, value: T[]): void;
}
export declare const types: {
    readonly bool: PGCoder<boolean>;
    readonly bytea: PGCoder<MinBuffer>;
    readonly int2: PGCoder<number>;
    readonly int4: PGCoder<number>;
    readonly int8: PGCoder<bigint>;
    readonly text: PGCoder<string>;
    readonly varchar: PGCoder<string>;
    readonly json: PGCoder<any>;
    readonly jsonb: PGCoder<any>;
    readonly float4: PGCoder<number>;
    readonly float8: PGCoder<number>;
    readonly timestamptz: PGCoder<Date>;
    readonly uuid: PGCoder<string>;
    readonly "bool[]": BaseArrayCoder<boolean>;
    readonly "bytea[]": BaseArrayCoder<MinBuffer>;
    readonly "int2[]": BaseArrayCoder<number>;
    readonly "int4[]": BaseArrayCoder<number>;
    readonly "int8[]": BaseArrayCoder<bigint>;
    readonly "text[]": BaseArrayCoder<string>;
    readonly "varchar[]": BaseArrayCoder<string>;
    readonly "json[]": BaseArrayCoder<any>;
    readonly "jsonb[]": BaseArrayCoder<any>;
    readonly "float4[]": BaseArrayCoder<number>;
    readonly "float8[]": BaseArrayCoder<number>;
    readonly "timestamptz[]": BaseArrayCoder<Date>;
    readonly "uuid[]": PGCoder<string>;
};
type PGCoreType = "bool" | "bytea" | "int2" | "int4" | "int8" | "text" | "varchar" | "json" | "jsonb" | "float4" | "float8" | "timestamptz" | "uuid";
type PGArrayType = `${PGCoreType}[]`;
export type PGType = PGCoreType | PGArrayType;
export declare function encode<T>(buf: BufferPut, type: PGType | PGCoder<T>, value: T): BufferPut;
export {};
