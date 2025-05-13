import BufferPut from "./BufferPut";
import { MinBuffer } from "./MinBuffer";
import { encode } from "./encoders";
//Header
function encodeHeader() {
    const buf = new BufferPut();
    buf.put(MinBuffer.fromArray([
        0x50, 0x47, 0x43, 0x4f, 0x50, 0x59, 0x0a, 0xff, 0x0d, 0x0a, 0x00,
    ]));
    buf.word32be(0);
    buf.word32be(0);
    return buf;
}
function encodeFooter() {
    const buf = new BufferPut();
    buf.put(MinBuffer.fromArray([0xff, 0xff]));
    return buf;
}
export class TypedRecordEncoder {
    schema;
    fields;
    constructor(schema) {
        this.schema = schema;
        this.fields = Object.keys(this.schema);
    }
    static getPGBinaryHeader() {
        return new Uint8Array(encodeHeader().buffer());
    }
    static getPGBinaryFooter() {
        return new Uint8Array(encodeFooter().buffer());
    }
    encodeRecord(record) {
        const buf = new BufferPut();
        const { fields, schema } = this;
        buf.word16be(fields.length);
        for (const field of fields) {
            const pgType = schema[field];
            const value = record[field];
            if (value instanceof Uint8Array) {
                encode(buf, pgType, new MinBuffer(value));
            }
            else {
                encode(buf, pgType, value);
            }
        }
        return new Uint8Array(buf.buffer());
    }
    encodeRecords(records) {
        const buf = new BufferPut();
        const header = encodeHeader();
        buf.insert(header);
        for (const record of records) {
            const rowBuf = this.encodeRecord(record);
            buf.put(new MinBuffer(rowBuf));
        }
        const footer = encodeFooter();
        buf.insert(footer);
        return new Uint8Array(buf.buffer());
    }
}
