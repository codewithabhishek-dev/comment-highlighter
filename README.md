# comment-highlighter
A Comment Highlighter is a VS Code extension that lets developers highlight important parts of code comments using different colors, making comments easier to read, organize, and remember.


## Features

- **Highlight Comment** (`Ctrl+Alt+H` / `Cmd+Alt+H`): Highlight selected text inside a comment with a background color
- **Remove Highlight** (`Ctrl+Alt+Shift+H` / `Cmd+Alt+Shift+H`): Remove highlight from selection or all highlights
- **Configurable Color**: Customize the highlight color via settings
- **Language Support**: Works with line comments in 30+ programming languages

## Installation

### From Source (Development)

```bash
# Clone the repository
git clone <repository-url>
cd comment-highlighter

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Press F5 in VS Code to launch Extension Development Host
```

### Packaging for Distribution

```bash
# Install vsce if not already installed
npm install -g @vscode/vsce

# Package the extension
vsce package

# Install the .vsix file in VS Code
code --install-extension comment-highlighter-0.0.1.vsix
```

## Usage

1. Open a file with comments
2. Select text **inside a comment** (e.g., `// TODO: Fix this bug` → select `Fix this bug`)
3. Press `Ctrl+Alt+H` (Windows/Linux) or `Cmd+Alt+H` (Mac)
4. The selected text will be highlighted with a yellow background

To remove highlights:
- Select highlighted text and press `Ctrl+Alt+Shift+H` to remove from selection
- Or press `Ctrl+Alt+Shift+H` with no selection to remove all highlights

## Supported Languages

The extension detects line comments for these languages:

| Language | Comment Token |
|----------|---------------|
| JavaScript/TypeScript | `//` |
| Python | `#` |
| Java/C#/C/C++/Go/Rust | `//` |
| Ruby/Shell/YAML | `#` |
| SQL | `--` |
| HTML/XML/Markdown | `<!--` |
| CSS/SCSS/Less | `/*` or `//` |
| And many more... |

## Configuration

Add to your `settings.json`:

```json
{
  "commentHighlighter.highlightColor": "#ffff00"
}
```

Or use the Settings UI: search for "Comment Highlighter".

## Commands

| Command | Keybinding | Description |
|---------|------------|-------------|
| `comment-highlighter.highlight` | `Ctrl+Alt+H` | Highlight selected comment text |
| `comment-highlighter.removeHighlight` | `Ctrl+Alt+Shift+H` | Remove highlight |

## Architecture

```
src/
├── extension.ts          # Entry point, registers commands
├── commands/
│   ├── highlight.ts      # Highlight command logic
│   └── removeHighlight.ts # Remove highlight command logic
├── utils/
│   ├── commentDetection.ts # Detects if selection is in a comment
│   └── decorations.ts      # Manages VS Code decorations
└── types/
    └── index.ts          # Shared TypeScript interfaces
```

## Development

### Commands

```bash
npm run compile      # Compile TypeScript
npm run watch        # Watch mode for development
npm run lint         # Run ESLint
npm run package      # Create .vsix package
```

### Debugging

1. Open the project in VS Code
2. Press `F5` to launch Extension Development Host
3. Test the extension in the new window

## License

MIT