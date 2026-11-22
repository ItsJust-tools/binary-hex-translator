import { DEFAULT_STATE, type BaseKey, type ToolState } from './types';

export interface BaseOption {
  value: BaseKey;
  label: string;
  hint: string;
}

export const BASES: BaseOption[] = [
  { value: 'text', label: 'Text', hint: 'readable input' },
  { value: 'binary', label: 'Binary', hint: 'base 2 bits' },
  { value: 'hex', label: 'Hex', hint: 'base 16 bytes' },
  { value: 'octal', label: 'Octal', hint: 'base 8 bytes' },
  { value: 'decimal', label: 'Decimal', hint: 'base 10 bytes' },
];

export const SEPARATOR_OPTIONS: { value: ToolState['separator']; label: string }[] = [
  { value: 'space', label: 'Space' },
  { value: 'none', label: 'None' },
  { value: 'comma', label: 'Comma' },
];

export const BIT_WIDTH_OPTIONS: { value: ToolState['bits']; label: string }[] = [
  { value: 8 as const, label: '8-bit' },
  { value: 16 as const, label: '16-bit' },
];

export function isState(value: unknown): value is ToolState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ToolState>;
  return (
    typeof v.activeBase === 'string' && typeof v.text === 'string' && DEFAULT_STATE !== undefined
  );
}
