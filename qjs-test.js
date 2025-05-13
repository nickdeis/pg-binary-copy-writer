import { TypedRecordEncoder } from "./dist/index.js";

const encoder = new TypedRecordEncoder({
  a: "text",
  b: "text",
  c: "float8",
  d: "timestamptz",
  e: "jsonb",
  f: "bytea",
  g: "text",
  h: "int8",
  i: "uuid",
  j: "bool[]",
});

const input = [
  {
    a: "a",
    b: "b",
    c: 2,
    d: new Date(),
    e: { a: 1, b: 2 },
    f: new Uint8Array([0xff, 0xff]),
    g: "x",
    h: 100n,
    i: "26fdfaa9-39e9-40f5-a3ca-ee65114bc5fb",
    j: [true, true],
  },
  {
    a: "f",
    b: "g",
    c: 4,
    d: new Date(),
    e: { f: 1, g: 2 },
    f: new Uint8Array([0xff, 0xff]),
    g: null,
    h: 200n,
    i: "bd441670-6dd5-4001-844f-94a0e9886c96",
    j: [false, false],
  },
];
try {
  const output = encoder.encodeRecords(input);
  if (output.length !== 282) {
    throw new Error("Incorrect length");
  }
} catch (e) {
  console.log(e);
  process.exit(1);
}
