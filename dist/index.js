// src/utf8.ts
function blitBuffer(src, dst, offset, length) {
  let i;
  for (i = 0;i < length; ++i) {
    if (i + offset >= dst.length || i >= src.length)
      break;
    dst[i + offset] = src[i];
  }
  return i;
}
function utf8Write(buf, text, offset, length) {
  return blitBuffer(utf8ToBytes(text, buf.length - offset), buf, offset, length);
}
function utf8ToBytes(string, units = Infinity) {
  let codePoint;
  const length = string.length;
  let leadSurrogate = null;
  const bytes = [];
  for (let i = 0;i < length; ++i) {
    codePoint = string.charCodeAt(i);
    if (codePoint > 55295 && codePoint < 57344) {
      if (!leadSurrogate) {
        if (codePoint > 56319) {
          if ((units -= 3) > -1)
            bytes.push(239, 191, 189);
          continue;
        } else if (i + 1 === length) {
          if ((units -= 3) > -1)
            bytes.push(239, 191, 189);
          continue;
        }
        leadSurrogate = codePoint;
        continue;
      }
      if (codePoint < 56320) {
        if ((units -= 3) > -1)
          bytes.push(239, 191, 189);
        leadSurrogate = codePoint;
        continue;
      }
      codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
    } else if (leadSurrogate) {
      if ((units -= 3) > -1)
        bytes.push(239, 191, 189);
    }
    leadSurrogate = null;
    if (codePoint < 128) {
      if ((units -= 1) < 0)
        break;
      bytes.push(codePoint);
    } else if (codePoint < 2048) {
      if ((units -= 2) < 0)
        break;
      bytes.push(codePoint >> 6 | 192, codePoint & 63 | 128);
    } else if (codePoint < 65536) {
      if ((units -= 3) < 0)
        break;
      bytes.push(codePoint >> 12 | 224, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
    } else if (codePoint < 1114112) {
      if ((units -= 4) < 0)
        break;
      bytes.push(codePoint >> 18 | 240, codePoint >> 12 & 63 | 128, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
    } else {
      throw new Error("Invalid code point");
    }
  }
  return bytes;
}

// src/MinBuffer.ts
class MinBuffer extends Uint8Array {
  constructor(length) {
    if (typeof length === "number") {
      super(length);
    } else {
      super(length);
    }
  }
  copy(target, targetStart, start, end) {
    if (!start)
      start = 0;
    if (!end && end !== 0)
      end = this.length;
    if (targetStart >= target.length)
      targetStart = target.length;
    if (!targetStart)
      targetStart = 0;
    if (end > 0 && end < start)
      end = start;
    if (end === start)
      return 0;
    if (target.length === 0 || this.length === 0)
      return 0;
    if (targetStart < 0) {
      throw new RangeError("targetStart out of bounds");
    }
    if (start < 0 || start >= this.length)
      throw new RangeError("Index out of range");
    if (end < 0)
      throw new RangeError("sourceEnd out of bounds");
    if (end > this.length)
      end = this.length;
    if (target.length - targetStart < end - start) {
      end = target.length - targetStart + start;
    }
    const len = end - start;
    if (this === target && typeof Uint8Array.prototype.copyWithin === "function") {
      this.copyWithin(targetStart, start, end);
    } else {
      Uint8Array.prototype.set.call(target, this.subarray(start, end), targetStart);
    }
    return len;
  }
  static fromHex(text) {
    if (text.length % 2 !== 0) {
      throw new Error("Hex string must have an even length");
    }
    const byteArray = new Uint8Array(text.length / 2);
    for (let i = 0;i < text.length; i += 2) {
      byteArray[i / 2] = parseInt(text.substr(i, 2), 16);
    }
    return new MinBuffer(byteArray);
  }
  static fromUTF8String(text) {
    const length = utf8ToBytes(text).length | 0;
    let buf = new MinBuffer(length);
    const actual = buf.writeUTF8String(text);
    if (actual !== length) {
      buf = new MinBuffer(buf.slice(0, actual));
    }
    return new MinBuffer(buf);
  }
  writeUTF8String(text) {
    let offset = 0;
    let length = this.length;
    const remaining = this.length - offset;
    if (length === undefined || length > remaining)
      length = remaining;
    return utf8Write(this, text, offset, length);
  }
  static fromDoubleLE(value, offset) {
    const buf = MinBuffer.alloc(4);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    view.setFloat64(offset, value, true);
    return buf;
  }
  static fromDoubleBE(value, offset) {
    const buf = MinBuffer.alloc(8);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    view.setFloat64(offset, value, false);
    return buf;
  }
  static alloc(size) {
    return new MinBuffer(size);
  }
  static fromArray(array) {
    const length = array.length < 0 ? 0 : array.length | 0;
    const buf = new MinBuffer(length);
    for (let i = 0;i < length; i += 1) {
      buf[i] = array[i] & 255;
    }
    return buf;
  }
}

// src/BufferPut.ts
class BufferPut {
  words = [];
  len = 0;
  put(buf) {
    this.words.push({ buffer: buf });
    this.len += buf.length;
  }
  insert(bufferput) {
    this.words = this.words.concat(bufferput.words);
    this.len += bufferput.len;
    return this;
  }
  wordbits(value, bits, endian) {
    this.words.push({ endian, bytes: bits / 8, value });
    this.len += bits / 8;
    return this;
  }
  wordbitsle(value, bits) {
    return this.wordbits(value, bits, "little");
  }
  word8le(x) {
    return this.wordbitsle(x, 8);
  }
  word16le(x) {
    return this.wordbitsle(x, 16);
  }
  word32le(x) {
    return this.wordbitsle(x, 32);
  }
  word64le(x) {
    return this.wordbitsle(x, 64);
  }
  wordbitsbe(value, bits) {
    return this.wordbits(value, bits, "big");
  }
  word8be(x) {
    return this.wordbitsbe(x, 8);
  }
  word16be(x) {
    return this.wordbitsbe(x, 16);
  }
  word32be(x) {
    return this.wordbitsbe(x, 32);
  }
  word64be(x) {
    return this.wordbitsbe(x, 64);
  }
  length() {
    return this.len;
  }
  buffer() {
    const buf = new MinBuffer(this.len);
    let offset = 0;
    for (const word of this.words) {
      if ("buffer" in word && word.buffer) {
        word.buffer.copy(buf, offset, 0);
        offset += word.buffer.length;
      } else if ("bytes" in word && word.bytes == "float") {
        const v = Math.abs(word.value);
        const s = (word.value >= 0) * 1;
        const e = Math.ceil(Math.log(v) / Math.LN2);
        const f = v / (1 << e);
        buf[offset++] = s << 7 & ~~(e / 2);
        buf[offset++] = (e & 1) << 7 & ~~(f / (1 << 16));
        buf[offset++] = 0;
        buf[offset++] = 0;
        offset += 4;
      } else if ("bytes" in word && "value" in word) {
        const big = "endian" in word && word.endian === "big";
        const ix = big ? [(word.bytes - 1) * 8, -8] : [0, 8];
        for (let i = ix[0];big ? i >= 0 : i < word.bytes * 8; i += ix[1]) {
          if (i >= 32) {
            buf[offset++] = Math.floor(word.value / Math.pow(2, i)) & 255;
          } else {
            buf[offset++] = word.value >> i & 255;
          }
        }
      }
    }
    return buf;
  }
}

// src/utils.ts
function flatten(arr) {
  return arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val), []);
}

// src/encoders.ts
var BoolCoder = {
  oid: 16,
  send(buf, value) {
    buf.word8be(value ? 1 : 0);
  }
};
var ByteaCoder = {
  oid: 17,
  send(buf, value) {
    buf.put(value);
  }
};
var Int2Coder = {
  oid: 21,
  send(buf, value) {
    buf.word16be(value);
  }
};
var Int4Coder = {
  oid: 23,
  send(buf, value) {
    buf.word32be(value);
  }
};
var Int8Coder = {
  oid: 20,
  send(buf, value) {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigInt64(0, value, false);
    buf.put(new MinBuffer(buffer));
  }
};
var TextCoder = {
  oid: 25,
  send(buf, value) {
    const tbuf = MinBuffer.fromUTF8String(value);
    buf.put(tbuf);
  }
};
var VarCharCoder = { ...TextCoder, oid: 1043 };
var JSONCoder = {
  oid: 114,
  send(buf, value) {
    const jbuf = MinBuffer.fromUTF8String(JSON.stringify(value));
    buf.put(jbuf);
  }
};
var JSONBCoder = {
  oid: 3802,
  send(buf, value) {
    const jbuf = MinBuffer.fromUTF8String("\x01" + JSON.stringify(value));
    buf.put(jbuf);
  }
};
var Float4Coder = {
  oid: 700,
  send(buf, value) {
    const fbuf = MinBuffer.fromDoubleLE(value, 0);
    buf.put(fbuf);
  }
};
var Float8Coder = {
  oid: 701,
  send(buf, value) {
    const fbuf = MinBuffer.fromDoubleBE(value, 0);
    buf.put(fbuf);
  }
};
var TimestamptzCoder = {
  oid: 1184,
  send(buf, value) {
    let ts = value.getTime() - 946684800000;
    ts = 1000 * ts;
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigInt64(0, BigInt(ts), false);
    buf.put(new MinBuffer(buffer));
  }
};
var UUIDCoder = {
  oid: 2950,
  send(buf, value) {
    const hex = value.replace(/-/g, "");
    if (hex.length !== 32) {
      throw new Error("Invalid UUID format");
    }
    const uuidBuffer = new MinBuffer(MinBuffer.fromHex(hex));
    buf.put(uuidBuffer);
  }
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
    tmp = value;
    while (Array.isArray(tmp)) {
      ndim++;
      tmp = tmp[0];
    }
    buf.word32be(ndim);
    buf.word32be(0);
    buf.word32be(types[this.type].oid);
    tmp = value;
    for (let i = 0;i < ndim; i++) {
      buf.word32be(tmp.length);
      buf.word32be(1);
      tmp = tmp[0];
    }
    const flat = flatten(value);
    const len = flat.length;
    for (let i = 0;i < len; i++) {
      encode(buf, this.type, flat[i]);
    }
  }
}
var BoolArrayCoder = new BaseArrayCoder(1000, "bool");
var ByteaArrayCoder = new BaseArrayCoder(1001, "bytea");
var Int2ArrayCoder = new BaseArrayCoder(1005, "int2");
var Int4ArrayCoder = new BaseArrayCoder(1007, "int4");
var Int8ArrayCoder = new BaseArrayCoder(1016, "int8");
var TextArrayCoder = new BaseArrayCoder(1009, "text");
var VarCharArrayCoder = new BaseArrayCoder(1015, "varchar");
var JSONArrayCoder = new BaseArrayCoder(199, "json");
var JSONBArrayCoder = new BaseArrayCoder(3807, "jsonb");
var Float4ArrayCoder = new BaseArrayCoder(1021, "float4");
var Float8ArrayCoder = new BaseArrayCoder(1022, "float8");
var TimestamptzArrayCoder = new BaseArrayCoder(1185, "timestamptz");
var types = {
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
  "uuid[]": UUIDCoder
};
function encode(buf, type, value) {
  buf.word32be(0);
  const lenField = buf.words[buf.words.length - 1];
  if (value === null && "value" in lenField) {
    lenField.value = -1;
  } else if (type && "value" in lenField) {
    const offset = buf.len;
    if (typeof type === "string" && types[type]) {
      types[type].send(buf, value);
    } else if (typeof type === "object") {
      type.send(buf, value);
    }
    lenField.value = buf.len - offset;
  }
  return buf;
}

// src/index.ts
function getPGBinaryHeader() {
  const buf = new BufferPut;
  buf.put(MinBuffer.fromArray([
    80,
    71,
    67,
    79,
    80,
    89,
    10,
    255,
    13,
    10,
    0
  ]));
  buf.word32be(0);
  buf.word32be(0);
  return new Uint8Array(buf.buffer());
}
function getPGBinaryFooter() {
  return new Uint8Array(MinBuffer.fromArray([255, 255]));
}

class TypedRecordEncoder {
  schema;
  fields;
  constructor(schema) {
    this.schema = schema;
    this.fields = Object.keys(this.schema);
  }
  encodeRecord(record) {
    const buf = new BufferPut;
    const { fields, schema } = this;
    buf.word16be(fields.length);
    for (const field of fields) {
      const pgType = schema[field];
      const value = record[field];
      if (value instanceof Uint8Array) {
        encode(buf, pgType, new MinBuffer(value));
      } else {
        encode(buf, pgType, value);
      }
    }
    return new Uint8Array(buf.buffer());
  }
  encodeRecords(records) {
    const buf = new BufferPut;
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
export {
  getPGBinaryHeader,
  getPGBinaryFooter,
  TypedRecordEncoder
};
