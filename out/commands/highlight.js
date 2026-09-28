"use strict";
/**
 * Highlight Comment command implementation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.highlightCommentCommand = highlightCommentCommand;
exports.registerHighlightCommand = registerHighlightCommand;
exports.registerColorHighlightCommands = registerColorHighlightCommands;
const vscode = __importStar(require("vscode"));
const commentDetection_1 = require("../utils/commentDetection");
const decorations_1 = require("../utils/decorations");
/**
 * Available highlight colors
 */
const HIGHLIGHT_COLORS = [
    { label: '🟨 Yellow', color: '#ffff00', description: 'Bright yellow highlight' },
    { label: '🟩 Green', color: '#90ee90', description: 'Light green highlight' },
    { label: '🟦 Blue', color: '#add8e6', description: 'Light blue highlight' },
    { label: '🟥 Red', color: '#ffb6c1', description: 'Light red/pink highlight' },
    { label: '🟪 Purple', color: '#dda0dd', description: 'Light purple highlight' },
];
/**
 * Shows a quick pick to select highlight color
 */
async function pickHighlightColor() {
    const selected = await vscode.window.showQuickPick(HIGHLIGHT_COLORS, {
        placeHolder: 'Select highlight color',
        matchOnDescription: true,
    });
    return selected?.color;
}
/**
 * Executes the "Highlight Comment" command with optional color parameter
 * If color is provided (from submenu or keyboard shortcut args), applies that color directly
 * If no color provided (from context menu main command), shows color picker
 * Does NOT auto-remove existing highlights - use "Remove Highlight" for that
 */
async function highlightCommentCommand(args) {
    // Handle both string (legacy) and object (from keybinding args) formats
    const color = typeof args === 'string' ? args : args?.color;
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
    }
    const selection = editor.selection;
    // Validate selection
    if (selection.isEmpty) {
        vscode.window.showWarningMessage('Please select text to highlight');
        return;
    }
    // Check for multiple cursors - only support single selection for now
    if (editor.selections.length > 1) {
        vscode.window.showWarningMessage('Please use a single selection');
        return;
    }
    // Detect if selection is in a comment
    const detectionResult = await (0, commentDetection_1.detectComment)(editor, selection);
    if (!detectionResult.isInComment || !detectionResult.commentRange) {
        vscode.window.showWarningMessage('Selected text is not inside a comment');
        return;
    }
    const range = detectionResult.commentRange.range;
    // Determine highlight color
    // If color provided (from submenu), use it; otherwise show color picker
    let highlightColor = color;
    if (!highlightColor) {
        highlightColor = await pickHighlightColor();
        if (!highlightColor) {
            // User cancelled the color picker
            return;
        }
    }
    // Apply highlight (doesn't remove existing, just adds/updates)
    await (0, decorations_1.applyHighlight)(editor, range, { color: highlightColor });
    // Get color name for display message
    const colorName = HIGHLIGHT_COLORS.find(c => c.color === highlightColor)?.label || highlightColor;
    vscode.window.showInformationMessage(`Comment highlighted with ${colorName}!`);
}
/**
 * Registers the highlight command
 */
function registerHighlightCommand(context) {
    return vscode.commands.registerCommand('comment-highlighter.highlight', highlightCommentCommand);
}
/**
 * Color-specific highlight commands for context menu
 */
function registerColorHighlightCommands(context) {
    const colors = [
        { name: 'Yellow', color: '#ffff00' },
        { name: 'Green', color: '#90ee90' },
        { name: 'Blue', color: '#add8e6' },
        { name: 'Red', color: '#ffb6c1' },
        { name: 'Purple', color: '#dda0dd' },
    ];
    const colorCommands = colors.map(({ name, color }) => vscode.commands.registerCommand(`comment-highlighter.highlight.${name.toLowerCase()}`, () => highlightCommentCommand(color)));
    // Debug command to check detection
    const debugCommand = vscode.commands.registerCommand('comment-highlighter.debug', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }
        const selection = editor.selection;
        const { detectCommentSync } = require('../utils/commentDetection');
        const result = detectCommentSync(editor, selection);
        vscode.window.showInformationMessage(`Debug: language=${editor.document.languageId}, selection="${editor.document.getText(selection)}", isInComment=${result.isInComment}`);
    });
    return [...colorCommands, debugCommand];
}
//# sourceMappingURL=highlight.js.map