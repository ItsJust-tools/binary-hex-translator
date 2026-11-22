'use client';

import React from 'react';
import { convertAll, decodeNumericToText, textToBytes, byteRows } from '../convert';
import { BASES } from '../ui-shared';
import type { BaseKey, ToolState } from '../types';

interface CanvasProps {
  state: ToolState;
  onChange: (next: ToolState) => void;
  onSaveHistory?: (text: string) => void;
}

const inputClass =
  'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 focus:border-violet-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

const PANEL_IDS: Exclude<BaseKey, 'text'>[] = ['binary', 'hex', 'octal', 'decimal'];

export const Canvas: React.FC<CanvasProps> = ({ state, onChange, onSaveHistory }) => {
  const options = { separator: state.separator, bits: state.bits };

  // Canonical bytes come from the panel the user last typed in.
  let error: string | undefined;
  let bytes: number[] = [];
  let decodedText = state.text;

  if (state.activeBase === 'text') {
    bytes = textToBytes(state.text);
    decodedText = state.text;
  } else {
    const result = decodeNumericToText(
      state.activeBase === 'binary'
        ? state.binary
        : state.activeBase === 'hex'
          ? state.hex
          : state.activeBase === 'octal'
            ? state.octal
            : state.decimal,
      state.activeBase,
      state.bits
    );
    if (result.error) {
      error = result.error;
    } else {
      decodedText = result.value;
      bytes = textToBytes(decodedText);
    }
  }

  const outputs = error
    ? { binary: '', hex: '', octal: '', decimal: '' }
    : convertAll(bytes, options);

  const update = (patch: Partial<ToolState>) => onChange({ ...state, ...patch });

  const switchTo = (base: BaseKey, value: string) => {
    // Setting a panel means the user typed there; keep other panels in sync.
    if (base === 'text') {
      onChange({ ...state, activeBase: 'text', text: value });
      return;
    }
    const patch: Partial<ToolState> = { activeBase: base };
    if (base === 'binary') patch.binary = value;
    else if (base === 'hex') patch.hex = value;
    else if (base === 'octal') patch.octal = value;
    else patch.decimal = value;
    onChange({ ...state, ...patch });
  };

  const currentValue = state.activeBase === 'text' ? state.text : state[state.activeBase];

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full" data-testid="translator-canvas">
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Input base"
        data-testid="base-tabs"
      >
        {BASES.map((base) => (
          <button
            key={base.value}
            type="button"
            role="tab"
            aria-selected={state.activeBase === base.value}
            data-testid={`tab-${base.value}`}
            title={base.hint}
            onClick={() => {
              // When switching, decode the current panel into the target panel.
              if (!error) update({ activeBase: base.value });
            }}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
              state.activeBase === base.value
                ? 'border-violet-500 bg-violet-50 text-violet-800 dark:bg-violet-900/40 dark:text-violet-100'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400'
            }`}
          >
            {base.label}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          {state.activeBase === 'text' ? 'Text input' : `${state.activeBase} input`}
          <textarea
            value={currentValue}
            onChange={(e) => switchTo(state.activeBase, e.target.value)}
            data-testid="input-active-panel"
            rows={3}
            className={inputClass}
            spellCheck={false}
          />
        </label>
      </div>

      {error ? (
        <p
          role="alert"
          data-testid="conversion-error"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200"
        >
          {error}
        </p>
      ) : null}

      {!error ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2" data-testid="output-panels">
            {PANEL_IDS.map((panel) => (
              <div
                key={panel}
                className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
                data-testid={`output-${panel}`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    {panel}
                  </span>
                  <button
                    type="button"
                    data-testid={`copy-${panel}`}
                    onClick={() =>
                      void navigator.clipboard.writeText(outputs[panel]).catch(() => {})
                    }
                    className="text-xs px-2 py-0.5 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Copy
                  </button>
                </div>
                <code className="block break-all font-mono text-xs text-gray-800 dark:text-gray-200">
                  {outputs[panel] || '—'}
                </code>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Byte view
            </h3>
            {decodedText === '' ? (
              <p className="text-xs text-gray-500 dark:text-gray-400" data-testid="bytes-empty">
                No input to display.
              </p>
            ) : (
              <table className="w-full text-left text-xs" data-testid="byte-table">
                <thead>
                  <tr className="text-gray-500 dark:text-gray-400">
                    <th className="py-1 pr-3">Char</th>
                    <th className="py-1 pr-3">Dec</th>
                    <th className="py-1 pr-3">Hex</th>
                    <th className="py-1 pr-3">Oct</th>
                    <th className="py-1">Binary</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-gray-800 dark:text-gray-200">
                  {byteRows(decodedText).map((row, i) => (
                    <tr key={i} className="border-t border-gray-200 dark:border-gray-800">
                      <td className="py-1 pr-3">{row.char === ' ' ? '␠' : row.char}</td>
                      <td className="py-1 pr-3">{row.decimal}</td>
                      <td className="py-1 pr-3">{row.hex}</td>
                      <td className="py-1 pr-3">{row.octal}</td>
                      <td className="py-1">{row.binary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <button
            type="button"
            data-testid="btn-save-history"
            onClick={() => onSaveHistory?.(decodedText)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Save to history
          </button>
        </>
      ) : null}

      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          History
        </h3>
        {state.history.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400" data-testid="history-empty">
            No saved conversions yet.
          </p>
        ) : (
          <ul className="space-y-1" data-testid="history-list">
            {state.history.map((entry, i) => (
              <li
                key={`${entry.createdAt}-${i}`}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-xs dark:border-gray-800"
              >
                <span className="text-gray-700 dark:text-gray-300">{entry.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        All conversions run locally in your browser; nothing is uploaded. Unicode is encoded as
        UTF-8.
      </p>
    </div>
  );
};
