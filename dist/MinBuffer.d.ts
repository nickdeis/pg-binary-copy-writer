export declare class MinBuffer extends Uint8Array {
    constructor(length: number | Uint8Array | ArrayBuffer);
    copy(target: MinBuffer, targetStart?: number, start?: number, end?: number): number;
    static fromHex(text: string): MinBuffer;
    static fromUTF8String(text: string): MinBuffer;
    writeUTF8String(text: string): number;
    static fromDoubleLE(value: number, offset: number): MinBuffer;
    static fromDoubleBE(value: number, offset: number): MinBuffer;
    static alloc(size: number): MinBuffer;
    static fromArray(array: any[]): MinBuffer;
}
