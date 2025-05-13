# pg-binary-copy-writer

A module that writes javascript types/objects/arrays to the Postgres binary copy format.

## Usage

```typescript
import {
  TypedRecordEncoder,
  getPGBinaryHeader,
  getPGBinaryFooter,
} from "pg-binary-copy-writer";

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
// Will encode an object array and add a header and footer
const output = encoder.encodeRecords(inputArray);
// Or, you can stream it like so
//Get a header and add it to the start of your stream
const PG_BINARY_HEADER = getPGBinaryHeader();
//Encode records
const binary = encoder.encodeRecord(input);
//Add the footer then close the stream
const PG_BINARY_FOOTER = getPGBinaryHeader();
```

## Why?

A lot of databases:

- Support javascript UDF functions
- Don't support exporting to Postgres binary format.
- Support dumping a query directly to places like S3.
- Don't have support for postgres foreign data wrappers

Some instances of postgres support reading directly from these external stores.

So what if:

- You create a UDF that writes out a row in postgres binary copy format
- Slap a binary header on top with another function
- Slap a binary footer on bottom with another function

Here's an example from Snowflake:

```sql
SELECT pgBinaryHeader() as bin
UNION ALL
SELECT pgBinaryRow(*) as bin
UNION ALL
SELECT pgBinaryFooter() as bin
FROM table
```

## What about new lines and delimiters?

Most databases allow you to configure record delimiters and field delimiters.
Snowflake as an example has:

```sql
 RECORD_DELIMITER = ''
 FIELD_DELIMITER = ''
```

And Mysql has

```sql
SELECT * INTO OUTFILE 'outfile.bin'
    FIELDS TERMINATED BY '' OPTIONALLY ENCLOSED BY ''
    LINES TERMINATED BY ''
FROM table
```

## Why not just use CSV?

- Types are sometimes useful
- Text, JSON, and byte array types are not always CSV friendly

## Restrictions

In order to work in **all** JS environments,
I'm limited to only using classes/methods (eg I rely a lot on DataView).

## Special Thanks

- BufferPut
- Buffer
- ieee754
