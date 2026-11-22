export const toolConfig = {
  id: 'binary-hex-translator',
  name: 'Binary Hex Translator',
  category: 'Converter',
  description:
    'Convert text to and from binary, hex, octal and decimal representations with live two-way conversion.',
  version: '1.0.0',
  exportFormats: ['png', 'jpeg', 'webp', 'pdf'] as import('@itsjust/core').ExportFormat[],
  features: {
    export: true,
    autoSave: true,
    undoRedo: true,
    statusBar: true,
    darkMode: true,
    sidebar: true,
  },
  theme: {
    brand: 'Binary Hex Translator',
  },
};

export default toolConfig;
