import { MinBuffer } from "./MinBuffer";
export type Endian = "little" | "big";

export type FloatWord = {
  bytes: "float";
  endian: "little";
  value: number;
};

export type BufferWord = {
  buffer: MinBuffer;
};

export type BigEndianWord = {
  endian: "big";
  value: number;
  bytes: number;
};

export type LittleEndianWord = {
  endian: "little";
  value: number;
  bytes: number;
};

export type WordEight = {
  bytes: 1;
  value: number;
};

export type Word =
  | FloatWord
  | BufferWord
  | BigEndianWord
  | LittleEndianWord
  | WordEight;

export default class BufferPut {
  words: Word[] = [];
  len = 0;
  put(buf: MinBuffer) {
    this.words.push({ buffer: buf });
    this.len += buf.length;
  }
  insert(bufferput: BufferPut) {
    this.words = this.words.concat(bufferput.words);
    this.len += bufferput.len;
    return this;
  }
  private wordbits(value: number, bits: number, endian: "little" | "big") {
    this.words.push({ endian, bytes: bits / 8, value });
    this.len += bits / 8;
    return this;
  }
  private wordbitsle(value: number, bits: number) {
    return this.wordbits(value, bits, "little");
  }
  word8le(x: number) {
    return this.wordbitsle(x, 8);
  }
  word16le(x: number) {
    return this.wordbitsle(x, 16);
  }
  word32le(x: number) {
    return this.wordbitsle(x, 32);
  }
  word64le(x: number) {
    return this.wordbitsle(x, 64);
  }
  private wordbitsbe(value: number, bits: number) {
    return this.wordbits(value, bits, "big");
  }
  word8be(x: number) {
    return this.wordbitsbe(x, 8);
  }
  word16be(x: number) {
    return this.wordbitsbe(x, 16);
  }
  word32be(x: number) {
    return this.wordbitsbe(x, 32);
  }
  word64be(x: number) {
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
        // s * f * 2^e
        const v = Math.abs(word.value);
        //@ts-ignore
        const s = (word.value >= 0) * 1;
        const e = Math.ceil(Math.log(v) / Math.LN2);
        const f = v / (1 << e);

        // s:1, e:7, f:23
        // [seeeeeee][efffffff][ffffffff][ffffffff]
        buf[offset++] = (s << 7) & ~~(e / 2);
        buf[offset++] = ((e & 1) << 7) & ~~(f / (1 << 16));
        buf[offset++] = 0;
        buf[offset++] = 0;
        offset += 4;
      } else if ("bytes" in word && "value" in word) {
        const big = "endian" in word && word.endian === "big";
        const ix: [number, number] = big ? [(word.bytes - 1) * 8, -8] : [0, 8];
        for (let i = ix[0]; big ? i >= 0 : i < word.bytes * 8; i += ix[1]) {
          if (i >= 32) {
            buf[offset++] = Math.floor(word.value / Math.pow(2, i)) & 0xff;
          } else {
            buf[offset++] = (word.value >> i) & 0xff;
          }
        }
      }
    }
    return buf;
  }
}
