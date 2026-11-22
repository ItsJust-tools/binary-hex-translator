export type BaseKey = 'text' | 'binary' | 'hex' | 'octal' | 'decimal';

export type Separator = 'space' | 'none' | 'comma';

export type BitWidth = 8 | 16;

export interface HistoryEntry {
  /** Short human readable description of the conversion. */
  text: string;
  /** ISO timestamp when the entry was saved. */
  createdAt: string;
}

export interface ToolState {
  /** Which panel the user is typing in. */
  activeBase: BaseKey;
  /** Input for the text panel. */
  text: string;
  /** Input for the binary panel. */
  binary: string;
  /** Input for the hex panel. */
  hex: string;
  /** Input for the octal panel. */
  octal: string;
  /** Input for the decimal panel. */
  decimal: string;
  /** Separator between encoded bytes. */
  separator: Separator;
  /** Bit width per encoded unit. */
  bits: BitWidth;
  /** Saved conversion history, newest first. */
  history: HistoryEntry[];
}

export const DEFAULT_STATE: ToolState = {
  activeBase: 'text',
  text: 'Hi',
  binary: '01001000 01101001',
  hex: '48 69',
  octal: '110 151',
  decimal: '72 105',
  separator: 'space',
  bits: 8,
  history: [],
};

export const MAX_HISTORY = 20;

export const BASE_KEYS: BaseKey[] = ['text', 'binary', 'hex', 'octal', 'decimal'];

export const SEPARATORS: Separator[] = ['space', 'none', 'comma'];

export function separatorToken(separator: Separator): string {
  switch (separator) {
    case 'none':
      return '';
    case 'comma':
      return ',';
    default:
      return ' ';
  }
}

export function separatorLabel(separator: Separator): string {
  switch (separator) {
    case 'none':
      return 'None';
    case 'comma':
      return 'Comma';
    default:
      return 'Space';
  }
}

/** Normalize any user input into a raw character list: text or cleaned code tokens. */
export function tokenizeInput(input: string, separator: Separator): string[] {
  if (separator === 'none') return input.trim() ? [input.trim()] : [];
  return input.split(/[\s,]+/).filter((token) => token.length > 0);
}
