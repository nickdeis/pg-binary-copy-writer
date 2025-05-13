import type { MinBuffer } from "src/MinBuffer";

function blitBuffer(
  src: number[],
  dst: MinBuffer,
  offset: number,
  length: number
) {
  let i;
  for (i = 0; i < length; ++i) {
    if (i + offset >= dst.length || i >= src.length) break;
    //@ts-ignore
    dst[i + offset] = src[i];
  }
  return i;
}

export function utf8Write(
  buf: MinBuffer,
  text: string,
  offset: number,
  length: number
) {
  return blitBuffer(
    utf8ToBytes(text, buf.length - offset),
    buf,
    offset,
    length
  );
}

export function utf8ToBytes(string: string, units: number = Infinity) {
  let codePoint;
  const length = string.length;
  let leadSurrogate = null;
  const bytes = [];

  for (let i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i);

    // is surrogate component
    if (codePoint > 0xd7ff && codePoint < 0xe000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xdbff) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
          continue;
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
          continue;
        }

        // valid lead
        leadSurrogate = codePoint;

        continue;
      }

      // 2 leads in a row
      if (codePoint < 0xdc00) {
        if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
        leadSurrogate = codePoint;
        continue;
      }

      // valid surrogate pair
      codePoint =
        (((leadSurrogate - 0xd800) << 10) | (codePoint - 0xdc00)) + 0x10000;
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
    }

    leadSurrogate = null;

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break;
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break;
      bytes.push((codePoint >> 0x6) | 0xc0, (codePoint & 0x3f) | 0x80);
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break;
      bytes.push(
        (codePoint >> 0xc) | 0xe0,
        ((codePoint >> 0x6) & 0x3f) | 0x80,
        (codePoint & 0x3f) | 0x80
      );
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break;
      bytes.push(
        (codePoint >> 0x12) | 0xf0,
        ((codePoint >> 0xc) & 0x3f) | 0x80,
        ((codePoint >> 0x6) & 0x3f) | 0x80,
        (codePoint & 0x3f) | 0x80
      );
    } else {
      throw new Error("Invalid code point");
    }
  }

  return bytes;
}
