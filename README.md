# pg-binary-copy-writer

A module that writes javascript types/objects/arrays to the Postgres binary copy format. Comes with a lot of tools to do so.

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

```
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

```
 RECORD_DELIMITER = ''
 FIELD_DELIMITER = ''
```

## Why not just use CSV?

- Types are sometimes useful
- Text, JSON, and byte array types are not always CSV friendly

## Restrictions

In order to work in **all** JS environments,
I'm limited to only using classes/methods (eg I rely a lot on DataView)

## Special Thanks

- BufferPut
- Buffer
- ieee754
