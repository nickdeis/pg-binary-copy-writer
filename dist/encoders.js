import BufferPut, {} from "./BufferPut";
import { MinBuffer } from "./MinBuffer";
import { chunk, flatten } from "utils";
const BoolCoder = {
    oid: 16,
    send(buf, value) {
        buf.word8be(value ? 1 : 0);
    },
};
const ByteaCoder = {
    oid: 17,
    send(buf, value) {
        buf.put(value);
    },
};
const Int2Coder = {
    oid: 21,
    send(buf, value) {
        buf.word16be(value);
    },
};
const Int4Coder = {
    oid: 23,
    send(buf, value) {
        buf.word32be(value);
    },
};
const Int8Coder = {
    oid: 20,
    send(buf, value) {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setBigInt64(0, value, false);
        buf.put(new MinBuffer(buffer));
    },
};
const TextCoder = {
    oid: 25,
    send(buf, value) {
        const tbuf = MinBuffer.fromUTF8String(value);
        buf.put(tbuf);
    },
};
const VarCharCoder = { ...TextCoder, oid: 1043 };
const JSONCoder = {
    oid: 114,
    send(buf, value) {
        const jbuf = MinBuffer.fromUTF8String(JSON.stringify(value));
        buf.put(jbuf);
    },
};
const JSONBCoder = {
    oid: 3802,
    send(buf, value) {
        const jbuf = MinBuffer.fromUTF8String("\u0001" + JSON.stringify(value));
        buf.put(jbuf);
    },
};
const Float4Coder = {
    oid: 700,
    send(buf, value) {
        const fbuf = MinBuffer.fromDoubleLE(value, 0);
        buf.put(fbuf);
    },
};
const Float8Coder = {
    oid: 701,
    send(buf, value) {
        const fbuf = MinBuffer.fromDoubleBE(value, 0);
        buf.put(fbuf);
    },
};
const TimestamptzCoder = {
    oid: 1184,
    send(buf, value) {
        // postgres origin of time is 01/01/2000
        let ts = value.getTime() - 946684800000;
        ts = 1000 * ts; // add unknown usecs
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setBigInt64(0, BigInt(ts), false);
        buf.put(new MinBuffer(buffer));
    },
};
const UUIDCoder = {
    oid: 2950,
    send(buf, value) {
        const hex = value.replace(/-/g, "");
        if (hex.length !== 32) {
            throw new Error("Invalid UUID format");
        }
        const uuidBuffer = new MinBuffer(MinBuffer.fromHex(hex));
        buf.put(uuidBuffer);
    },
};
class BaseArrayCoder {
    oid;
    type;
    constructor(oid, type) {
        this.oid = oid;
        this.type = type;
    }
    send(buf, value) {
        let tmp;
        let ndim = 0;
        // count # of dimensions
        tmp = value;
        while (Array.isArray(tmp)) {
            ndim++;
            tmp = tmp[0];
        }
        buf.word32be(ndim); // ndim
        buf.word32be(0); // hasnull
        buf.word32be(types[this.type].oid); // elem oid
        // for each dimension, declare
        // - size of dimension
        // - index of first item in dimension (1)
        tmp = value;
        for (let i = 0; i < ndim; i++) {
            buf.word32be(tmp.length);
            buf.word32be(1);
            tmp = tmp[0];
        }
        // elems are flattened on 1-dim
        const flat = flatten(value);
        const len = flat.length;
        for (let i = 0; i < len; i++) {
            encode(buf, this.type, flat[i]);
        }
    }
}
const BoolArrayCoder = new BaseArrayCoder(1000, "bool");
const ByteaArrayCoder = new BaseArrayCoder(1001, "bytea");
const Int2ArrayCoder = new BaseArrayCoder(1005, "int2");
const Int4ArrayCoder = new BaseArrayCoder(1007, "int4");
const Int8ArrayCoder = new BaseArrayCoder(1016, "int8");
const TextArrayCoder = new BaseArrayCoder(1009, "text");
const VarCharArrayCoder = new BaseArrayCoder(1015, "varchar");
const JSONArrayCoder = new BaseArrayCoder(199, "json");
const JSONBArrayCoder = new BaseArrayCoder(3807, "jsonb");
const Float4ArrayCoder = new BaseArrayCoder(1021, "float4");
const Float8ArrayCoder = new BaseArrayCoder(1022, "float8");
const TimestamptzArrayCoder = new BaseArrayCoder(1185, "timestamptz");
// Note that send function names are kept identical to their names in the PostgreSQL source code.
export const types = {
    bool: BoolCoder,
    bytea: ByteaCoder,
    int2: Int2Coder,
    int4: Int4Coder,
    int8: Int8Coder,
    text: TextCoder,
    varchar: VarCharCoder,
    json: JSONCoder,
    jsonb: JSONBCoder,
    float4: Float4Coder,
    float8: Float8Coder,
    timestamptz: TimestamptzCoder,
    uuid: UUIDCoder,
    "bool[]": BoolArrayCoder,
    "bytea[]": ByteaArrayCoder,
    "int2[]": Int2ArrayCoder,
    "int4[]": Int4ArrayCoder,
    "int8[]": Int8ArrayCoder,
    "text[]": TextArrayCoder,
    "varchar[]": VarCharArrayCoder,
    "json[]": JSONArrayCoder,
    "jsonb[]": JSONBArrayCoder,
    "float4[]": Float4ArrayCoder,
    "float8[]": Float8ArrayCoder,
    "timestamptz[]": TimestamptzArrayCoder,
    "uuid[]": UUIDCoder,
};
export function encode(buf, type, value) {
    // Add a UInt32  placeholder for the field length
    buf.word32be(0);
    const lenField = buf.words[buf.words.length - 1];
    // See [1] - Tuples Section
    // As a special case, -1 indicates a NULL field value. No value bytes follow in the NULL case
    if (value === null && "value" in lenField) {
        lenField.value = -1;
        // Then, repeated for each field in the tuple, there is a 32-bit length word followed by
        // that many bytes of field data.
    }
    else if (type && "value" in lenField) {
        const offset = buf.len;
        if (typeof type === "string" && types[type]) {
            //@ts-ignore
            types[type].send(buf, value);
        }
        else if (typeof type === "object") {
            type.send(buf, value);
        }
        lenField.value = buf.len - offset;
    }
    return buf;
}
