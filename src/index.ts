import BufferPut from "./BufferPut";
import { MinBuffer } from "./MinBuffer";
import { encode, type PGType } from "./encoders";

//Header
export function getPGBinaryHeader() {
  const buf = new BufferPut();
  buf.put(
    MinBuffer.fromArray([
      0x50, 0x47, 0x43, 0x4f, 0x50, 0x59, 0x0a, 0xff, 0x0d, 0x0a, 0x00,
    ])
  );
  buf.word32be(0);
  buf.word32be(0);
  return new Uint8Array(buf.buffer());
}

export function getPGBinaryFooter() {
  return new Uint8Array(MinBuffer.fromArray([0xff, 0xff]));
}

export class TypedRecordEncoder<T> {
  readonly schema: Record<keyof T, PGType>;
  readonly fields: (keyof T)[];
  constructor(schema: Record<keyof T, PGType>) {
    this.schema = schema;
    this.fields = Object.keys(this.schema) as (keyof T)[];
  }
  encodeRecord(record: T): Uint8Array {
    const buf = new BufferPut();
    const { fields, schema } = this;
    buf.word16be(fields.length);

    for (const field of fields) {
      const pgType = schema[field] as PGType;
      const value = record[field];
      if (value instanceof Uint8Array) {
        encode(buf, pgType, new MinBuffer(value));
      } else {
        encode(buf, pgType, value);
      }
    }
    return new Uint8Array(buf.buffer());
  }
  encodeRecords(records: T[]): Uint8Array {
    const buf = new BufferPut();
    const header = getPGBinaryHeader();
    buf.put(new MinBuffer(header));
    for (const record of records) {
      const rowBuf = this.encodeRecord(record);
      buf.put(new MinBuffer(rowBuf));
    }
    const footer = getPGBinaryFooter();
    buf.put(new MinBuffer(footer));
    return new Uint8Array(buf.buffer());
  }
}
