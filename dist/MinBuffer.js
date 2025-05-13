import { utf8ToBytes, utf8Write } from "./utf8";
export class MinBuffer extends Uint8Array {
    constructor(length) {
        if (typeof length === "number") {
            super(length);
        }
        else {
            super(length);
        }
    }
    copy(target, targetStart, start, end) {
        if (!start)
            start = 0;
        if (!end && end !== 0)
            end = this.length;
        //@ts-ignore
        if (targetStart >= target.length)
            targetStart = target.length;
        if (!targetStart)
            targetStart = 0;
        if (end > 0 && end < start)
            end = start;
        // Copy 0 bytes; we're done
        if (end === start)
            return 0;
        if (target.length === 0 || this.length === 0)
            return 0;
        // Fatal error conditions
        if (targetStart < 0) {
            throw new RangeError("targetStart out of bounds");
        }
        if (start < 0 || start >= this.length)
            throw new RangeError("Index out of range");
        if (end < 0)
            throw new RangeError("sourceEnd out of bounds");
        // Are we oob?
        if (end > this.length)
            end = this.length;
        if (target.length - targetStart < end - start) {
            end = target.length - targetStart + start;
        }
        const len = end - start;
        if (this === target &&
            typeof Uint8Array.prototype.copyWithin === "function") {
            // Use built-in when available, missing from IE11
            this.copyWithin(targetStart, start, end);
        }
        else {
            Uint8Array.prototype.set.call(target, this.subarray(start, end), targetStart);
        }
        return len;
    }
    static fromHex(text) {
        if (text.length % 2 !== 0) {
            throw new Error("Hex string must have an even length");
        }
        const byteArray = new Uint8Array(text.length / 2);
        for (let i = 0; i < text.length; i += 2) {
            byteArray[i / 2] = parseInt(text.substr(i, 2), 16);
        }
        return new MinBuffer(byteArray);
    }
    static fromUTF8String(text) {
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
        for (let i = 0; i < length; i += 1) {
            buf[i] = array[i] & 255;
        }
        return buf;
    }
}
