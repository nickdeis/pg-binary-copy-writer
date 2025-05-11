import { utf8Slice, utf8ToBytes, utf8Write } from "utf8";

export class MinBuffer extends Uint8Array {
  constructor(length: number | Uint8Array | ArrayBuffer) {
    if (typeof length === "number") {
      super(length);
    } else {
      super(length);
    }
  }
  // readUInt8(offset: number) {
  //   offset = offset >>> 0;
  //   return this[offset]!;
  // }
  // readInt16BE(offset: number) {
  //   offset = offset >>> 0;
  //   const val = this[offset + 1]! | (this[offset]! << 8);
  //   return val & 0x8000 ? val | 0xffff0000 : val;
  // }
  // readBigInt64BE(offset: number) {
  //   offset = offset >>> 0;
  //   const first = this[offset]!;
  //   const last = this[offset + 7]!;

  //   const val =
  //     (first << 24) + // Overflow
  //     this[++offset]! * 2 ** 16 +
  //     this[++offset]! * 2 ** 8 +
  //     this[++offset]!;

  //   return (
  //     (BigInt(val) << BigInt(32)) +
  //     BigInt(
  //       this[++offset]! * 2 ** 24 +
  //         this[++offset]! * 2 ** 16 +
  //         this[++offset]! * 2 ** 8 +
  //         last
  //     )
  //   );
  // }
  // readInt32BE(offset: number) {
  //   offset = offset >>> 0;
  //   return (
  //     (this[offset]! << 24) |
  //     (this[offset + 1]! << 16) |
  //     (this[offset + 2]! << 8) |
  //     this[offset + 3]!
  //   );
  // }
  copy(
    target: MinBuffer,
    targetStart?: number,
    start?: number,
    end?: number
  ): number {
    if (!start) start = 0;
    if (!end && end !== 0) end = this.length;
    //@ts-ignore
    if (targetStart >= target.length) targetStart = target.length;
    if (!targetStart) targetStart = 0;
    if (end > 0 && end < start) end = start;
    // Copy 0 bytes; we're done
    if (end === start) return 0;
    if (target.length === 0 || this.length === 0) return 0;

    // Fatal error conditions
    if (targetStart < 0) {
      throw new RangeError("targetStart out of bounds");
    }
    if (start < 0 || start >= this.length)
      throw new RangeError("Index out of range");
    if (end < 0) throw new RangeError("sourceEnd out of bounds");

    // Are we oob?
    if (end > this.length) end = this.length;
    if (target.length - targetStart < end - start) {
      end = target.length - targetStart + start;
    }

    const len = end - start;
    if (
      this === target &&
      typeof Uint8Array.prototype.copyWithin === "function"
    ) {
      // Use built-in when available, missing from IE11
      this.copyWithin(targetStart, start, end);
    } else {
      Uint8Array.prototype.set.call(
        target,
        this.subarray(start, end),
        targetStart
      );
    }
    return len;
  }
  // readUint8(offset: number) {
  //   offset = offset >>> 0;
  //   return this[offset]!;
  // }
  // readUInt16BE(offset: number) {
  //   offset = offset >>> 0;
  //   return (this[offset]! << 8) | this[offset + 1]!;
  // }
  // readUInt32BE(offset: number) {
  //   return (
  //     this[offset]! * 0x1000000 +
  //     ((this[offset + 1]! << 16) | (this[offset + 2]! << 8) | this[offset + 3]!)
  //   );
  // }
  // readBigUInt64BE(offset: number) {
  //   offset = offset >>> 0;
  //   const first = this[offset]!;
  //   const last = this[offset + 7]!;
  //   const hi =
  //     first * 2 ** 24 +
  //     this[++offset]! * 2 ** 16 +
  //     this[++offset]! * 2 ** 8 +
  //     this[++offset]!;

  //   const lo =
  //     this[++offset]! * 2 ** 24 +
  //     this[++offset]! * 2 ** 16 +
  //     this[++offset]! * 2 ** 8 +
  //     last;
  //   return (BigInt(hi) << BigInt(32)) + BigInt(lo);
  // }
  static fromHex(text: string) {
    if (text.length % 2 !== 0) {
      throw new Error("Hex string must have an even length");
    }

    const byteArray = new Uint8Array(text.length / 2);
    for (let i = 0; i < text.length; i += 2) {
      byteArray[i / 2] = parseInt(text.substr(i, 2), 16);
    }
    return new MinBuffer(byteArray);
  }
  // toHex() {
  //   return Array.from(this)
  //     .map((byte) => byte.toString(16).padStart(2, "0"))
  //     .join("");
  // }
  static fromUTF8String(text: string) {
    const length = utf8ToBytes(text).length | 0;
    let buf = new MinBuffer(length);
    const actual = buf.writeUTF8String(text);
    if (actual !== length) {
      // Writing a hex string, for example, that contains invalid characters will
      // cause everything after the first invalid character to be ignored. (e.g.
      // 'abxxcd' will be treated as 'ab')
      buf = new MinBuffer(buf.slice(0, actual));
    }
    return new MinBuffer(buf);
  }
  writeUTF8String(text: string) {
    let offset = 0;
    let length = this.length;
    const remaining = this.length - offset;
    if (length === undefined || length > remaining) length = remaining;
    return utf8Write(this, text, offset, length);
  }
  // toUTF8String() {
  //   const length = this.length;
  //   if (length === 0) return "";
  //   return utf8Slice(this, 0, length);
  // }
  static fromDoubleLE(value: number, offset: number) {
    const buf = MinBuffer.alloc(4);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    view.setFloat64(offset, value, true);
    return buf;
  }
  static fromDoubleBE(value: number, offset: number) {
    const buf = MinBuffer.alloc(8);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    view.setFloat64(offset, value, false);
    return buf;
  }
  // readDoubleLE(offset: number) {
  //   if (offset < 0 || offset + 8 > this.length) {
  //     throw new RangeError("Offset is out of bounds");
  //   }

  //   // Create a DataView for the underlying buffer
  //   const view = new DataView(this.buffer, this.byteOffset, this.byteLength);

  //   // Read the double value in little-endian format
  //   return view.getFloat64(offset, true);
  // }
  // readDoubleBE(offset: number) {
  //   // Ensure the offset is valid
  //   if (offset < 0 || offset + 8 > this.length) {
  //     throw new RangeError("Offset is out of bounds");
  //   }

  //   // Create a DataView for the underlying buffer
  //   const view = new DataView(this.buffer, this.byteOffset, this.byteLength);

  //   // Read the double value in big-endian format
  //   return view.getFloat64(offset, false);
  // }
  static alloc(size: number) {
    return new MinBuffer(size);
  }
  static fromArray(array: any[]) {
    const length = array.length < 0 ? 0 : array.length | 0;
    const buf = new MinBuffer(length);
    for (let i = 0; i < length; i += 1) {
      buf[i] = array[i] & 255;
    }
    return buf;
  }
}
