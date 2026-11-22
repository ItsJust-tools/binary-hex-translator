import type { ToolState } from './types';

/** Compact summary used by the status bar and copy actions. */
export function summaryText(state: ToolState): string {
  const bitLabel = state.bits === 16 ? '16-bit' : '8-bit';
  return `Text: ${state.text ? `"${state.text}"` : 'empty'} · UTF-8 · ${bitLabel} · ${state.separator}`;
}
