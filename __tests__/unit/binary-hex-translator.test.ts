import { describe, it, expect } from 'vitest';
import {
  textToBytes,
  bytesToText,
  bytesToBase,
  convertAll,
  parseNumericInput,
  decodeNumericToText,
  byteRows,
} from '@/tool/convert';
import {
  serializeState,
  deserializeState,
  withHistory,
  roundTrips,
  binaryHexTranslatorTool,
} from '@/tool/tool-definition';
import { DEFAULT_STATE, MAX_HISTORY, BASE_KEYS, type ToolState } from '@/tool/types';
import { tokenizeInput, separatorToken } from '@/tool/types';

const state = (patch: Partial<ToolState> = {}): ToolState => ({ ...DEFAULT_STATE, ...patch });

describe('text to bytes', () => {
  it('encodes plain ASCII', () => {
    expect(textToBytes('Hi')).toEqual([0x48, 0x69]);
    expect(textToBytes('')).toEqual([]);
    expect(textToBytes('A')).toEqual([65]);
  });

  it('encodes UTF-8 multibyte characters', () => {
    // ü = C3 BC
    expect(textToBytes('ü')).toEqual([0xc3, 0xbc]);
    // € = E2 82 AC
    expect(textToBytes('€')).toEqual([0xe2, 0x82, 0xac]);
    // 😀 = F0 9F 98 80
    expect(textToBytes('😀')).toEqual([0xf0, 0x9f, 0x98, 0x80]);
  });
});

describe('bytes to text', () => {
  it('decodes ASCII and empty input', () => {
    expect(bytesToText([0x48, 0x69])).toBe('Hi');
    expect(bytesToText([])).toBe('');
  });

  it('decodes UTF-8 multibyte sequences', () => {
    expect(bytesToText([0xc3, 0xbc])).toBe('ü');
    expect(bytesToText([0xe2, 0x82, 0xac])).toBe('€');
    expect(bytesToText([0xf0, 0x9f, 0x98, 0x80])).toBe('😀');
  });
});

describe('bytesToBase', () => {
  const options = { separator: 'space' as const, bits: 8 };

  it('emits every base with padding', () => {
    expect(bytesToBase([0x48, 0x69], 'binary', options)).toBe('01001000 01101001');
    expect(bytesToBase([0x48, 0x69], 'hex', options)).toBe('48 69');
    expect(bytesToBase([0x48, 0x69], 'octal', options)).toBe('110 151');
    expect(bytesToBase([0x48, 0x69], 'decimal', options)).toBe('72 105');
  });

  it('respects separators', () => {
    expect(bytesToBase([0x48, 0x69], 'hex', { separator: 'none', bits: 8 })).toBe('4869');
    expect(bytesToBase([0x48, 0x69], 'hex', { separator: 'comma', bits: 8 })).toBe('48,69');
    expect(bytesToBase([], 'hex', { separator: 'space', bits: 8 })).toBe('');
  });

  it('emits 16-bit binary groups in 16-bit mode', () => {
    expect(bytesToBase([0x00, 0x48], 'binary', { separator: 'space', bits: 16 })).toBe(
      '0000000001001000'
    );
  });
});

describe('convertAll', () => {
  it('fills all numeric panels from bytes', () => {
    const outputs = convertAll(textToBytes('Hi'), { separator: 'space', bits: 8 });
    expect(outputs.binary).toBe('01001000 01101001');
    expect(outputs.hex).toBe('48 69');
    expect(outputs.octal).toBe('110 151');
    expect(outputs.decimal).toBe('72 105');
  });

  it('uses commas when configured', () => {
    const outputs = convertAll(textToBytes('Hi'), { separator: 'comma', bits: 8 });
    expect(outputs.hex).toBe('48,69');
  });
});

describe('tokenizeInput', () => {
  it('splits on spaces, commas and newlines', () => {
    expect(tokenizeInput('48 69', 'space')).toEqual(['48', '69']);
    expect(tokenizeInput('48,69', 'space')).toEqual(['48', '69']);
    expect(tokenizeInput('48\n69', 'space')).toEqual(['48', '69']);
  });

  it('treats the whole input as one token with no separator', () => {
    expect(tokenizeInput('4869', 'none')).toEqual(['4869']);
    expect(tokenizeInput('', 'none')).toEqual([]);
  });
});

describe('separatorToken', () => {
  it('maps separators to join tokens', () => {
    expect(separatorToken('space')).toBe(' ');
    expect(separatorToken('none')).toBe('');
    expect(separatorToken('comma')).toBe(',');
  });
});

describe('parseNumericInput', () => {
  it('parses binary tokens', () => {
    const parsed = parseNumericInput('01001000 01101001', 'binary');
    expect(parsed.bytes).toEqual([0x48, 0x69]);
    expect(parsed.error).toBeUndefined();
  });

  it('parses hex with mixed separators', () => {
    expect(parseNumericInput('48 69', 'hex').bytes).toEqual([0x48, 0x69]);
    expect(parseNumericInput('48,69', 'hex').bytes).toEqual([0x48, 0x69]);
    expect(parseNumericInput('48, 69', 'hex').bytes).toEqual([0x48, 0x69]);
  });

  it('parses octal and decimal', () => {
    expect(parseNumericInput('110 151', 'octal').bytes).toEqual([0x48, 0x69]);
    expect(parseNumericInput('72 105', 'decimal').bytes).toEqual([0x48, 0x69]);
  });

  it('rejects invalid characters with a clear error', () => {
    const parsed = parseNumericInput('01001abc', 'binary');
    expect(parsed.bytes).toEqual([]);
    expect(parsed.error).toContain('not a valid binary value');

    const hexBad = parseNumericInput('4g', 'hex');
    expect(hexBad.error).toBeDefined();

    const decBad = parseNumericInput('12x', 'decimal');
    expect(decBad.error).toBeDefined();
  });

  it('rejects odd hex digit groups', () => {
    const parsed = parseNumericInput('486 69', 'hex');
    expect(parsed.error).toContain('even number');
  });

  it('returns empty bytes for empty input', () => {
    expect(parseNumericInput('', 'hex').bytes).toEqual([]);
    expect(parseNumericInput('   ', 'octal').bytes).toEqual([]);
  });

  it('parses single-token hex when no separator mode is used', () => {
    expect(parseNumericInput('4869', 'hex', /,+/).bytes).toEqual([0x48, 0x69]);
  });
});

describe('decodeNumericToText', () => {
  const cases: [string, ToolState['separator'], string][] = [
    ['48 69', 'space', 'Hi'],
    ['48,69', 'comma', 'Hi'],
  ];

  it.each(cases)('decodes hex "%s" with %s separator', (input, _sep, expected) => {
    expect(decodeNumericToText(input, 'hex', 8).value).toBe(expected);
  });

  it('decodes binary, octal and decimal back to text', () => {
    expect(decodeNumericToText('01001000 01101001', 'binary', 8).value).toBe('Hi');
    expect(decodeNumericToText('110 151', 'octal', 8).value).toBe('Hi');
    expect(decodeNumericToText('72 105', 'decimal', 8).value).toBe('Hi');
  });

  it('decodes pasted hex with mixed separators', () => {
    expect(decodeNumericToText('48  69,\t69', 'hex', 8).value).toBe('Hii');
  });

  it('reports errors without crashing', () => {
    expect(decodeNumericToText('01001abc', 'binary', 8).error).toBeDefined();
    expect(decodeNumericToText('4g', 'hex', 8).error).toBeDefined();
    expect(decodeNumericToText('72x', 'decimal', 8).error).toBeDefined();
  });

  it('rejects out-of-range values', () => {
    expect(decodeNumericToText('300', 'decimal', 8).error).toContain('exceeds 8-bit');
    expect(decodeNumericToText('111111111', 'binary', 8).error).toContain('multiple of 8');
    expect(decodeNumericToText('72', 'decimal', 16).error).toBeUndefined();
  });

  it('returns empty value for empty input', () => {
    expect(decodeNumericToText('', 'hex', 8)).toEqual({ value: '' });
  });

  it('round-trips multibyte UTF-8 through every base', () => {
    const samples = ['ü', '€', '😀', 'naïve café'];
    for (const sample of samples) {
      const bytes = textToBytes(sample);
      expect(
        decodeNumericToText(
          bytesToBase(bytes, 'binary', { separator: 'space', bits: 8 }),
          'binary',
          8
        ).value
      ).toBe(sample);
      expect(
        decodeNumericToText(bytesToBase(bytes, 'hex', { separator: 'space', bits: 8 }), 'hex', 8)
          .value
      ).toBe(sample);
      expect(
        decodeNumericToText(
          bytesToBase(bytes, 'octal', { separator: 'space', bits: 8 }),
          'octal',
          8
        ).value
      ).toBe(sample);
      expect(
        decodeNumericToText(
          bytesToBase(bytes, 'decimal', { separator: 'space', bits: 8 }),
          'decimal',
          8
        ).value
      ).toBe(sample);
    }
  });
});

describe('byteRows', () => {
  it('shows one row per byte with char, decimal, hex, binary and octal', () => {
    const rows = byteRows('Hi');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      char: 'H',
      decimal: 72,
      hex: '48',
      binary: '01001000',
      octal: '110',
    });
    expect(rows[1]).toEqual({
      char: 'i',
      decimal: 105,
      hex: '69',
      binary: '01101001',
      octal: '151',
    });
  });

  it('marks continuation rows for multibyte characters', () => {
    const rows = byteRows('ü');
    expect(rows).toHaveLength(2);
    expect(rows[0]?.char).toBe('ü');
    expect(rows[1]?.char).toBe('');
  });
});

describe('serialize/deserialize round-trip', () => {
  const full: ToolState = {
    ...DEFAULT_STATE,
    activeBase: 'hex',
    hex: '48 69',
    separator: 'comma',
    bits: 16,
    history: [{ text: 'Text -> hex: 48 69', createdAt: '2026-11-21T10:00:00.000Z' }],
  };

  it('round-trips all fields through serializeState/deserializeState', () => {
    const restored = deserializeState(JSON.parse(serializeState(full)));
    expect(restored.success).toBe(true);
    if (restored.success) {
      expect(restored.data).toEqual(full);
    }
    expect(serializeState(full)).toContain('"separator":"comma"');
    expect(serializeState(full)).toContain('"bits":16');
  });

  it('round-trips separator and bit width options for URL state', () => {
    for (const separator of ['space', 'none', 'comma'] as const) {
      for (const bits of [8, 16] as const) {
        const s = state({ separator, bits });
        expect(roundTrips(s)).toBe(true);
      }
    }
  });

  it('round-trips via the Tool object', () => {
    const serialized = binaryHexTranslatorTool.serialize(full);
    const restored = binaryHexTranslatorTool.deserialize(JSON.parse(serialized));
    expect(restored.success).toBe(true);
    if (restored.success) {
      expect(restored.data).toEqual(full);
    }
  });

  it('keeps URL share state round-trip safe', () => {
    expect(roundTrips(full)).toBe(true);
    expect(roundTrips(DEFAULT_STATE)).toBe(true);
  });

  it('rejects malformed payloads', () => {
    expect(deserializeState(null).success).toBe(false);
    expect(deserializeState('string').success).toBe(false);
    expect(deserializeState([1, 2]).success).toBe(false);
    expect(deserializeState(undefined).success).toBe(false);
  });

  it('repairs invalid options instead of failing', () => {
    const restored = deserializeState({ activeBase: 'nonsense', separator: 'tab', bits: 12 });
    expect(restored.success).toBe(true);
    if (restored.success) {
      expect(restored.data.activeBase).toBe(DEFAULT_STATE.activeBase);
      expect(restored.data.separator).toBe(DEFAULT_STATE.separator);
      expect(restored.data.bits).toBe(DEFAULT_STATE.bits);
    }
  });

  it('falls back to defaults for missing fields', () => {
    const restored = deserializeState({});
    expect(restored.success).toBe(true);
    if (restored.success) {
      expect(restored.data.activeBase).toBe(DEFAULT_STATE.activeBase);
      expect(restored.data.history).toEqual([]);
    }
  });

  it('filters invalid history entries and caps length', () => {
    const entries = Array.from({ length: MAX_HISTORY + 5 }, (_, i) => ({
      text: `entry ${i}`,
      createdAt: new Date(2026, 0, 1, 0, 0, i).toISOString(),
    }));
    const restored = deserializeState({
      activeBase: 'text',
      history: [...entries, 'bad', { text: 'x' }],
    });
    expect(restored.success).toBe(true);
    if (restored.success) {
      expect(restored.data.history.length).toBe(MAX_HISTORY);
      expect(restored.data.history[0]?.text).toBe('entry 0');
    }
  });
});

describe('withHistory', () => {
  it('prepends newest entries first', () => {
    const now = new Date('2026-11-21T12:00:00Z');
    let s = state();
    s = withHistory(s, 'one', now);
    s = withHistory(s, 'two', now);
    expect(s.history[0]?.text).toBe('two');
    expect(s.history[1]?.text).toBe('one');
    expect(s.history[0]?.createdAt).toBe('2026-11-21T12:00:00.000Z');
  });

  it('caps the history at MAX_HISTORY', () => {
    const now = new Date('2026-11-21T12:00:00Z');
    let s = state();
    for (let i = 0; i < MAX_HISTORY + 10; i++) {
      s = withHistory(s, `entry ${i}`, now);
    }
    expect(s.history.length).toBe(MAX_HISTORY);
    expect(s.history[0]?.text).toBe(`entry ${MAX_HISTORY + 9}`);
  });
});

describe('full round trips', () => {
  it('converts text to grouped 8-bit binary and back', () => {
    const text = 'Hello, translator!';
    const bytes = textToBytes(text);
    const binary = bytesToBase(bytes, 'binary', { separator: 'space', bits: 8 });
    expect(binary.split(' ')).toHaveLength(bytes.length);
    for (const group of binary.split(' ')) {
      expect(group).toMatch(/^[01]{8}$/);
    }
    expect(decodeNumericToText(binary, 'binary', 8).value).toBe(text);
  });

  it('keeps every base key valid', () => {
    expect(BASE_KEYS).toEqual(['text', 'binary', 'hex', 'octal', 'decimal']);
  });
});
