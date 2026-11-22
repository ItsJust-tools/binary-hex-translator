# Binary Hex Translator

Convert text to and from binary, hex, octal and decimal representations with live two-way conversion.

**Live:** [binary-hex-translator.itsjust.tools](https://binary-hex-translator.itsjust.tools)

## Features

- Live two-way conversion between text and binary with byte grouping
- Convert text to hex, octal and decimal representations
- Reverse conversion: paste binary/hex/octal/decimal and get readable text
- Configurable separators (space, none, comma) and bit width (8/16-bit)
- Byte view table showing char, decimal, hex, octal and binary per character
- Copy and download outputs, plus file/drag-drop text import
- Handles Unicode via UTF-8 encoding with clear error messages
- Dark mode, keyboard-friendly, URL state persistence
- 100% client-side — no data ever leaves your browser

## Keyboard shortcuts

| Key | Action        |
| --- | ------------- |
| `T` | Text panel    |
| `B` | Binary panel  |
| `H` | Hex panel     |
| `O` | Octal panel   |
| `D` | Decimal panel |
| `Y` | Copy output   |

## Development

```bash
npm install
npm run build -w @itsjust/core   # build shared core first
npm run dev
npm test
```

## Deployment

```bash
docker build -t itsjust-binary-hex-translator .
docker run -p 3000:3000 itsjust-binary-hex-translator
```

## License

MIT
