export { default as toolConfig } from './tool.config';
export { templateBaseVersion } from './template-metadata';
export { templateMetadata, getPublicSiteUrl } from './template-metadata';
export {
  binaryHexTranslatorTool,
  serializeState,
  deserializeState,
  withHistory,
  roundTrips,
} from './tool-definition';
export { summaryText } from './summary';
export { Canvas } from './components/Canvas';
export { Sidebar } from './components/Sidebar';
export { Toolbar } from './components/Toolbar';
export { BASES, SEPARATOR_OPTIONS, BIT_WIDTH_OPTIONS, isState } from './ui-shared';
export { DEFAULT_STATE, MAX_HISTORY, BASE_KEYS, SEPARATORS } from './types';
export type { BaseKey, BitWidth, HistoryEntry, Separator, ToolState } from './types';
export {
  textToBytes,
  bytesToText,
  bytesToBase,
  convertAll,
  parseNumericInput,
  decodeNumericToText,
  byteRows,
} from './convert';
export type { ConvertResult, ByteRow, EncodeOptions } from './convert';
