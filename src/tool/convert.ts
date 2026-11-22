import { type BaseKey, type Separator } from './types';

export interface EncodeOptions {
  separator: Separator;
  bits: number;
}

export interface ConvertResult {
  /** Decoded text, empty when input is empty. */
  value: string;
  /** Human readable error message, when the input cannot be parsed. */
  error?: string;
}

/** UTF-8 encode a text string into bytes. */
export function textToBytes(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

/** Decode UTF-8 bytes back into a text string. */
export function bytesToText(bytes: number[]): string {
  return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
}

function partsJoin(parts: string[], separator: Separator): string {
  switch (separator) {
    case 'none':
      return parts.join('');
    case 'comma':
      return parts.join(',');
    default:
      return parts.join(' ');
  }
}

/** Encode bytes for a base panel; binary width follows the bit setting. */
export function bytesToBase(
  bytes: number[],
  base: Exclude<BaseKey, 'text'>,
  options: EncodeOptions
): string {
  const width = options.bits === 16 ? 16 : 8;
  const join = (parts: string[]): string => partsJoin(parts, options.separator);
  switch (base) {
    case 'binary':
      // 16-bit mode emits 16-bit groups aligned to UTF-16 code units.
      if (width === 16) {
        const units: number[] = [];
        for (let i = 0; i < bytes.length; i += 2) {
          const high = bytes[i] ?? 0;
          const low = bytes[i + 1] ?? 0;
          units.push(i + 1 < bytes.length ? (high << 8) | low : high << 8);
        }
        return join(units.map((u) => u.toString(2).padStart(16, '0')));
      }
      return join(bytes.map((b) => b.toString(2).padStart(8, '0')));
    case 'hex':
      return join(bytes.map((b) => b.toString(16).padStart(2, '0')));
    case 'octal':
      return join(bytes.map((b) => b.toString(8).padStart(3, '0')));
    case 'decimal':
      return join(bytes.map((b) => String(b)));
  }
}

/** Convert decoded bytes into the numeric-base token lists with separators. */
export function convertAll(
  bytes: number[],
  options: EncodeOptions
): Record<Exclude<BaseKey, 'text'>, string> {
  return {
    binary: bytesToBase(bytes, 'binary', options),
    hex: bytesToBase(bytes, 'hex', options),
    octal: bytesToBase(bytes, 'octal', options),
    decimal: bytesToBase(bytes, 'decimal', options),
  };
}

export interface ParsedNumeric {
  bytes: number[];
  error?: string;
}

interface BaseSpec {
  radix: number;
  charset: string;
  /** Digits per byte chunk, 0 = one value per token. */
  digits: number;
  label: string;
}

const BASE_SPECS: Record<Exclude<BaseKey, 'text'>, BaseSpec> = {
  binary: { radix: 2, charset: '01', digits: 8, label: 'binary' },
  hex: { radix: 16, charset: '0-9a-fA-F', digits: 2, label: 'hex' },
  octal: { radix: 8, charset: '0-7', digits: 3, label: 'octal' },
  decimal: { radix: 10, charset: '0-9', digits: 0, label: 'decimal' },
};

/** Parse binary/hex/octal/decimal token input into bytes. */
export function parseNumericInput(
  input: string,
  base: Exclude<BaseKey, 'text'>,
  separators: RegExp = /[\s,]+/
): ParsedNumeric {
  const tokens = input
    .split(separators)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
  if (tokens.length === 0) return { bytes: [] };
  const spec = BASE_SPECS[base];
  const bytes: number[] = [];
  for (const token of tokens) {
    if (!new RegExp(`^[${spec.charset}]+$`).test(token)) {
      return { bytes: [], error: `"${token}" is not a valid ${spec.label} value` };
    }
    if (spec.digits === 0) {
      // Decimal: one value per token, range checked by the caller.
      const value = Number.parseInt(token, 10);
      if (Number.isNaN(value)) {
        return { bytes: [], error: `"${token}" is not a valid decimal value` };
      }
      bytes.push(value);
      continue;
    }
    if (token.length % spec.digits !== 0) {
      if (base === 'hex') {
        return {
          bytes: [],
          error: `"${token}" does not have an even number of hex digits`,
        };
      }
      return {
        bytes: [],
        error: `"${token}" is not a multiple of ${spec.digits} ${spec.label} digits`,
      };
    }
    for (let i = 0; i < token.length; i += spec.digits) {
      bytes.push(Number.parseInt(token.slice(i, i + spec.digits), spec.radix));
    }
  }
  return { bytes };
}

/** Decode a numeric panel input to text. */
export function decodeNumericToText(
  input: string,
  base: Exclude<BaseKey, 'text'>,
  bits: number
): ConvertResult {
  const parsed = parseNumericInput(input, base);
  if (parsed.error) return { value: '', error: parsed.error };
  if (parsed.bytes.length === 0) return { value: '' };
  let bytes = parsed.bytes;
  if (base === 'binary' && bits === 16) {
    bytes = bytes.flatMap((token) =>
      token <= 0xff ? [token] : [(token >> 8) & 0xff, token & 0xff]
    );
  } else if (base === 'hex' && bits === 16) {
    // Hex tokens are kept byte-aligned regardless of bit width.
    bytes = bytes.flatMap((v) => (v > 0xff ? [(v >> 8) & 0xff, v & 0xff] : [v]));
  }
  const limit = bits === 16 ? 0xffff : 0xff;
  if (base !== 'hex') {
    const oversized = bytes.filter((b) => b > limit);
    if (oversized.length > 0) {
      return {
        value: '',
        error: `Value ${oversized[0]} exceeds ${bits}-bit range (max ${limit})`,
      };
    }
  }
  let text: string;
  try {
    text = bytesToText(bytes);
  } catch {
    return { value: '', error: 'Bytes do not form valid UTF-8 text' };
  }
  return { value: text };
}

/** Byte view rows for the table. */
export interface ByteRow {
  char: string;
  decimal: number;
  hex: string;
  binary: string;
  octal: string;
}

export function byteRows(text: string): ByteRow[] {
  const bytes = textToBytes(text);
  const rows: ByteRow[] = [];
  const decoded = (() => {
    try {
      return Array.from(text);
    } catch {
      return Array.from(bytes).map(() => '');
    }
  })();
  // For multibyte characters, map consecutive bytes to the character they compose.
  let byteIndex = 0;
  const encoder = new TextEncoder();
  for (const char of decoded) {
    const charBytes = Array.from(encoder.encode(char));
    for (let k = 0; k < charBytes.length; k++) {
      const byte = bytes[byteIndex] ?? charBytes[k] ?? 0;
      rows.push({
        char: k === 0 ? char : '',
        decimal: byte,
        hex: byte.toString(16).padStart(2, '0'),
        binary: byte.toString(2).padStart(8, '0'),
        octal: byte.toString(8).padStart(3, '0'),
      });
      byteIndex++;
    }
  }
  return rows;
}
