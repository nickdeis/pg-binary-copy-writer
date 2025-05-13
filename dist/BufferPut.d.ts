import { MinBuffer } from "./MinBuffer";
export type Endian = "little" | "big";
export type FloatWord = {
    bytes: "float";
    endian: "little";
    value: number;
};
export type BufferWord = {
    buffer: MinBuffer;
};
export type BigEndianWord = {
    endian: "big";
    value: number;
    bytes: number;
};
export type LittleEndianWord = {
    endian: "little";
    value: number;
    bytes: number;
};
export type WordEight = {
    bytes: 1;
    value: number;
};
export type Word = FloatWord | BufferWord | BigEndianWord | LittleEndianWord | WordEight;
export default class BufferPut {
    words: Word[];
    len: number;
    put(buf: MinBuffer): void;
    insert(bufferput: BufferPut): this;
    private wordbits;
    private wordbitsle;
    word8le(x: number): this;
    word16le(x: number): this;
    word32le(x: number): this;
    word64le(x: number): this;
    private wordbitsbe;
    word8be(x: number): this;
    word16be(x: number): this;
    word32be(x: number): this;
    word64be(x: number): this;
    length(): number;
    buffer(): MinBuffer;
}
