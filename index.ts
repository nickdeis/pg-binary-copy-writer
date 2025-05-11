import BufferPut from "./BufferPut";
import { MinBuffer } from "./MinBuffer";
import { encode, type PGType } from "./encoders";

export function encodeJSRow<T extends Record<string, any>>(
  buf: BufferPut,
  record: T,
  fields: (keyof T)[]
) {
  buf.word16be(fields.length);
  for (const field of fields) {
    const value = record[field];
    switch (typeof value) {
      case "boolean":
        encode(buf, "bool", value);
        break;
      case "bigint":
        encode(buf, "int8", value);
        break;
      case "number":
        encode(buf, "float8", value);
        break;
      case "string":
        encode(buf, "text", value);
        break;
      case "object":
        const vo = value as object;
        if (vo instanceof Date) {
          encode(buf, "timestamptz", value);
        } else if (vo instanceof Uint8Array || vo instanceof ArrayBuffer) {
          encode(buf, "bytea", new MinBuffer(value));
        } else {
          encode(buf, "jsonb", value);
        }
    }
  }
}

//Header
export function encodeHeader() {
  const buf = new BufferPut();
  buf.put(
    MinBuffer.fromArray([
      0x50, 0x47, 0x43, 0x4f, 0x50, 0x59, 0x0a, 0xff, 0x0d, 0x0a, 0x00,
    ])
  );
  buf.word32be(0);
  buf.word32be(0);
  return buf;
}

export function encodeFooter() {
  const buf = new BufferPut();
  buf.put(MinBuffer.fromArray([0xff, 0xff]));
  return buf;
}

export function jsEncodeRows<T extends Record<string, any>>(records: T[]) {
  const buf = new BufferPut();
  const header = encodeHeader();
  buf.insert(header);
  const rec = records[0] as T;
  const fields = Object.keys(rec);
  //Tuples Section
  //buf.word16be(fields.length);
  //Tuples
  for (const row of records) {
    encodeJSRow(buf, row, fields);
  }
  const footer = encodeFooter();
  //Footer
  buf.insert(footer);
  return new Uint8Array(buf.buffer());
}

export class TypedRecordEncoder<T> {
  readonly schema: Record<keyof T, PGType>;
  readonly fields: (keyof T)[];
  constructor(schema: Record<keyof T, PGType>) {
    this.schema = schema;
    this.fields = Object.keys(this.schema) as (keyof T)[];
  }
  encodeRecord(record: T) {
    const buf = new BufferPut();
    const { fields, schema } = this;
    buf.word16be(fields.length);

    for (const field of fields) {
      const pgType = schema[field] as PGType;
      const value = record[field];
      if (value instanceof Uint8Array) {
        encode(buf, pgType, new Buffer(value));
      } else {
        encode(buf, pgType, value);
      }
    }
    return new Uint8Array(buf.buffer());
  }
  encodeRecords(records: T[]) {
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
