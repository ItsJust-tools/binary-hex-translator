import type { Tool, DeserializeResult } from '@itsjust/core';
import toolConfig from './tool.config';
import {
  DEFAULT_STATE,
  MAX_HISTORY,
  BASE_KEYS,
  SEPARATORS,
  type BaseKey,
  type BitWidth,
  type HistoryEntry,
  type Separator,
  type ToolState,
} from './types';

const VALID_BASES: BaseKey[] = BASE_KEYS;
const BIT_WIDTHS: BitWidth[] = [8, 16];

/** Serialize tool state into a compact JSON string for share/import. */
export function serializeState(state: ToolState): string {
  return JSON.stringify({
    activeBase: state.activeBase,
    text: state.text,
    binary: state.binary,
    hex: state.hex,
    octal: state.octal,
    decimal: state.decimal,
    separator: state.separator,
    bits: state.bits,
    history: state.history,
  });
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function validHistory(value: unknown): HistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (entry): entry is HistoryEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as HistoryEntry).text === 'string' &&
        typeof (entry as HistoryEntry).createdAt === 'string'
    )
    .slice(0, MAX_HISTORY);
}

/** Validate and recover tool state from an arbitrary payload. */
export function deserializeState(data: unknown): DeserializeResult<ToolState> {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return {
      success: false,
      error: 'Invalid data format: expected binary hex translator state object',
    };
  }
  const v = data as Record<string, unknown>;
  const activeBase: BaseKey = VALID_BASES.includes(v.activeBase as BaseKey)
    ? (v.activeBase as BaseKey)
    : DEFAULT_STATE.activeBase;
  const separator: Separator = SEPARATORS.includes(v.separator as Separator)
    ? (v.separator as Separator)
    : DEFAULT_STATE.separator;
  const bits: BitWidth = BIT_WIDTHS.includes(v.bits as BitWidth)
    ? (v.bits as BitWidth)
    : DEFAULT_STATE.bits;
  const state: ToolState = {
    activeBase,
    text: stringOr(v.text, DEFAULT_STATE.text),
    binary: stringOr(v.binary, DEFAULT_STATE.binary),
    hex: stringOr(v.hex, DEFAULT_STATE.hex),
    octal: stringOr(v.octal, DEFAULT_STATE.octal),
    decimal: stringOr(v.decimal, DEFAULT_STATE.decimal),
    separator,
    bits,
    history: validHistory(v.history),
  };
  return { success: true, data: state };
}

/** Append a history entry to state, capped at MAX_HISTORY, newest first. */
export function withHistory(state: ToolState, text: string, now = new Date()): ToolState {
  const entry: HistoryEntry = { text, createdAt: now.toISOString() };
  return { ...state, history: [entry, ...state.history].slice(0, MAX_HISTORY) };
}

/** True when a serialized string round-trips back to the same state. */
export function roundTrips(state: ToolState): boolean {
  try {
    const restored = deserializeState(JSON.parse(serializeState(state)));
    return restored.success && JSON.stringify(restored.data) === JSON.stringify(state);
  } catch {
    return false;
  }
}

export const binaryHexTranslatorTool: Tool<ToolState> = {
  id: toolConfig.id,
  name: toolConfig.name,
  version: toolConfig.version,
  config: toolConfig,
  initialState: { ...DEFAULT_STATE },
  serialize: serializeState,
  deserialize: deserializeState,
  exporters: [
    { format: 'png', loader: () => import('./exporters/png') },
    { format: 'jpeg', loader: () => import('./exporters/jpeg') },
    { format: 'webp', loader: () => import('./exporters/webp') },
    { format: 'pdf', loader: () => import('./exporters/pdf') },
  ],
};
