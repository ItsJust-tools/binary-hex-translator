'use client';

import React from 'react';
import { BASES } from '../ui-shared';
import type { ToolState } from '../types';

interface SidebarProps {
  state: ToolState;
  onChange: (next: ToolState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ state }) => {
  return (
    <div className="p-4 space-y-6 text-sm overflow-y-auto h-full" data-testid="translator-sidebar">
      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Bases</h3>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          {BASES.map((base) => (
            <li key={base.value} className="flex justify-between gap-2">
              <span>{base.label}</span>
              <span className="text-gray-500 dark:text-gray-400">{base.hint}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Settings</h3>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          <li>
            Bit width: <span data-testid="sidebar-bits">{state.bits}-bit</span>
          </li>
          <li>
            Separator: <span data-testid="sidebar-separator">{state.separator}</span>
          </li>
          <li>Encoding: UTF-8 (multi-byte characters supported)</li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Keyboard shortcuts</h3>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          <li>
            <kbd>T</kbd> — Text panel
          </li>
          <li>
            <kbd>B</kbd> — Binary panel
          </li>
          <li>
            <kbd>H</kbd> — Hex panel
          </li>
          <li>
            <kbd>O</kbd> — Octal panel
          </li>
          <li>
            <kbd>D</kbd> — Decimal panel
          </li>
          <li>
            <kbd>Y</kbd> — Copy output
          </li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Share</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Use the toolbar share button to create a URL containing the current input and settings;
          open it to restore this conversion.
        </p>
      </div>
    </div>
  );
};
