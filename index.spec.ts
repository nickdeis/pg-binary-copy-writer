import { TypedRecordEncoder } from ".";
import { PGlite } from "@electric-sql/pglite";
import { writeFileSync } from "node:fs";
import { describe, it, expect } from "bun:test";
const pool = new PGlite();

await pool.query(`DROP TABLE IF EXISTS example_table;`);
const create_table = `
CREATE TABLE IF NOT EXISTS example_table (
    a text,
    b text,
    c float8,
    d timestamptz,
    e jsonb,
    f bytea,
    g text,
    h int8,
    i uuid,
    j bool[]
);
`;

type InputType = {
  a: string;
  b: string;
  c: number;
  d: Date;
  e: object;
  f: Uint8Array;
  g?: string | null;
  h: bigint;
  i: string;
  j: boolean[];
};
function createInput(): InputType[] {
  return [
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
}

async function createTable() {
  console.log("Creating table");
  await pool.query(`DROP TABLE IF EXISTS example_table;`);
  await pool.query(create_table);
}

async function writeOutput(x: Uint8Array<ArrayBuffer>) {
  const blob = new Blob([x]);

  await pool.query(
    `COPY example_table FROM '/dev/blob' WITH (FORMAT BINARY);`,
    [],
    { blob }
  );
}

async function endTable() {
  await pool.query(`DROP TABLE IF EXISTS example_table;`);
}
function assertRowIsRoughlyEqual(input: InputType, row: any) {
  const { f: fx, h: hx, ...restOfInput } = input;
  const { f: fy, h: hy, ...restOfRow } = row;
  expect(String(hx)).toEqual(String(hy));
  expect(Array.from(fx)).toEqual(Array.from(fy));
  expect(restOfInput).toEqual(restOfRow);
}
describe("Smoke test", () => {
  it("TypedRecordEncoder", async () => {
    await createTable();
    const encoder = new TypedRecordEncoder<InputType>({
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
    const input = createInput();
    const output = encoder.encodeRecords(input);
    await writeOutput(output);
    const { rows } = await pool.query(`select * from example_table`);
    for (let i = 0; i < rows.length; i++) {
      assertRowIsRoughlyEqual(rows[i] as any, input[i]);
    }
    await endTable();
  });
});
