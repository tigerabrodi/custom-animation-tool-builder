import { describe, it, expect } from 'vitest';
import { arrayBufferToBase64, base64ToArrayBuffer } from '../utils/serialization';

describe('arrayBufferToBase64', () => {
  it('should convert empty buffer', () => {
    const buffer = new ArrayBuffer(0);
    expect(arrayBufferToBase64(buffer)).toBe('');
  });

  it('should convert simple data', () => {
    const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    expect(arrayBufferToBase64(data.buffer)).toBe('SGVsbG8=');
  });

  it('should convert binary data', () => {
    const data = new Uint8Array([0, 1, 2, 255, 254, 253]);
    const base64 = arrayBufferToBase64(data.buffer);
    expect(typeof base64).toBe('string');
    expect(base64.length).toBeGreaterThan(0);
  });

  it('should handle single byte', () => {
    const data = new Uint8Array([65]); // 'A'
    expect(arrayBufferToBase64(data.buffer)).toBe('QQ==');
  });

  it('should handle two bytes', () => {
    const data = new Uint8Array([65, 66]); // 'AB'
    expect(arrayBufferToBase64(data.buffer)).toBe('QUI=');
  });

  it('should handle three bytes (no padding)', () => {
    const data = new Uint8Array([65, 66, 67]); // 'ABC'
    expect(arrayBufferToBase64(data.buffer)).toBe('QUJD');
  });
});

describe('base64ToArrayBuffer', () => {
  it('should convert empty string', () => {
    const buffer = base64ToArrayBuffer('');
    expect(buffer.byteLength).toBe(0);
  });

  it('should convert simple base64', () => {
    const buffer = base64ToArrayBuffer('SGVsbG8=');
    const array = new Uint8Array(buffer);
    expect(Array.from(array)).toEqual([72, 101, 108, 108, 111]); // "Hello"
  });

  it('should handle single character padding', () => {
    const buffer = base64ToArrayBuffer('QUI='); // 'AB'
    const array = new Uint8Array(buffer);
    expect(Array.from(array)).toEqual([65, 66]);
  });

  it('should handle double padding', () => {
    const buffer = base64ToArrayBuffer('QQ=='); // 'A'
    const array = new Uint8Array(buffer);
    expect(Array.from(array)).toEqual([65]);
  });

  it('should handle no padding', () => {
    const buffer = base64ToArrayBuffer('QUJD'); // 'ABC'
    const array = new Uint8Array(buffer);
    expect(Array.from(array)).toEqual([65, 66, 67]);
  });
});

describe('roundtrip conversion', () => {
  it('should roundtrip empty buffer', () => {
    const original = new ArrayBuffer(0);
    const base64 = arrayBufferToBase64(original);
    const result = base64ToArrayBuffer(base64);
    expect(result.byteLength).toBe(0);
  });

  it('should roundtrip text data', () => {
    const text = 'Hello, World!';
    const encoder = new TextEncoder();
    const original = encoder.encode(text);

    const base64 = arrayBufferToBase64(original.buffer);
    const result = base64ToArrayBuffer(base64);

    const decoder = new TextDecoder();
    expect(decoder.decode(result)).toBe(text);
  });

  it('should roundtrip binary data', () => {
    const original = new Uint8Array([0, 1, 127, 128, 254, 255]);

    const base64 = arrayBufferToBase64(original.buffer);
    const result = base64ToArrayBuffer(base64);

    expect(Array.from(new Uint8Array(result))).toEqual(
      Array.from(original)
    );
  });

  it('should roundtrip large buffer', () => {
    const size = 10000;
    const original = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      original[i] = i % 256;
    }

    const base64 = arrayBufferToBase64(original.buffer);
    const result = base64ToArrayBuffer(base64);

    const resultArray = new Uint8Array(result);
    expect(resultArray.length).toBe(size);
    for (let i = 0; i < size; i++) {
      expect(resultArray[i]).toBe(i % 256);
    }
  });

  it('should roundtrip all byte values', () => {
    const original = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      original[i] = i;
    }

    const base64 = arrayBufferToBase64(original.buffer);
    const result = base64ToArrayBuffer(base64);

    const resultArray = new Uint8Array(result);
    for (let i = 0; i < 256; i++) {
      expect(resultArray[i]).toBe(i);
    }
  });
});
