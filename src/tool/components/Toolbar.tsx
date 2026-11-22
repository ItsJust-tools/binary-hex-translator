'use client';

import React from 'react';
import { SEPARATOR_OPTIONS, BIT_WIDTH_OPTIONS } from '../ui-shared';
import type { ToolState } from '../types';

interface ToolbarProps {
  state: ToolState;
  onChange: (next: ToolState) => void;
  onClear: () => void;
  onCopy?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ state, onChange, onClear, onCopy }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Translator controls"
      >
        <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
          Separator
          <select
            data-testid="select-separator"
            value={state.separator}
            onChange={(e) =>
              onChange({ ...state, separator: e.target.value as ToolState['separator'] })
            }
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            {SEPARATOR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-1" role="group" aria-label="Bit width">
          {BIT_WIDTH_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={state.bits === option.value}
              data-testid={`btn-bits-${option.value}`}
              onClick={() => onChange({ ...state, bits: option.value })}
              className={`rounded-md border px-2 py-1 text-xs font-medium ${
                state.bits === option.value
                  ? 'border-violet-500 bg-violet-50 text-violet-800 dark:bg-violet-900/40 dark:text-violet-100'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onCopy}
          data-testid="btn-copy-result"
          className="rounded-md bg-violet-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-violet-600"
        >
          Copy output
        </button>
        <button
          type="button"
          onClick={onClear}
          data-testid="btn-clear"
          className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Clear
        </button>
      </div>
    </div>
  );
};
