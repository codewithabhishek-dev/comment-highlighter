"use strict";
/**
 * Comment Highlighter - Main Extension Entry Point
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const highlight_1 = require("./commands/highlight");
const removeHighlight_1 = require("./commands/removeHighlight");
const decorations_1 = require("./utils/decorations");
const commentDetection_1 = require("./utils/commentDetection");
/**
 * Context key for when selection is in a comment
 */
const IN_COMMENT_CONTEXT_KEY = 'commentHighlighter.inComment';
/**
 * Context key for when selection has a highlight
 */
const HAS_HIGHLIGHT_CONTEXT_KEY = 'commentHighlighter.hasHighlight';
/**
 * Activates the extension
 */
async function activate(context) {
    console.log('Comment Highlighter extension is now active');
    // Initialize persistence
    (0, decorations_1.setExtensionContext)(context);
    // Load highlights from storage
    await (0, decorations_1.loadHighlightsFromStorage)();
    // Register commands
    const highlightCommand = (0, highlight_1.registerHighlightCommand)(context);
    const removeHighlightCommand = (0, removeHighlight_1.registerRemoveHighlightCommand)(context);
    const colorCommands = (0, highlight_1.registerColorHighlightCommands)(context);
    // Add to subscriptions for proper cleanup
    context.subscriptions.push(highlightCommand, removeHighlightCommand, ...colorCommands);
    // Restore highlights for all currently visible editors
    for (const editor of vscode.window.visibleTextEditors) {
        (0, decorations_1.restoreHighlightsForEditor)(editor);
    }
    // Track document changes to revalidate highlights
    const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(async (event) => {
        const editor = vscode.window.visibleTextEditors.find(e => e.document === event.document);
        if (editor) {
            await (0, decorations_1.revalidateHighlights)(editor, commentDetection_1.isRangeInComment);
        }
    });
    // Restore highlights when editor becomes visible
    const onDidChangeVisibleTextEditors = vscode.window.onDidChangeVisibleTextEditors((editors) => {
        for (const editor of editors) {
            (0, decorations_1.restoreHighlightsForEditor)(editor);
        }
    });
    // Restore highlights when a document is opened (handles VS Code reload)
    const onDidOpenTextDocument = vscode.workspace.onDidOpenTextDocument((document) => {
        const editor = vscode.window.visibleTextEditors.find(e => e.document === document);
        if (editor) {
            (0, decorations_1.restoreHighlightsForEditor)(editor);
        }
    });
    // Update context key for context menu visibility
    const updateContextKey = (editor) => {
        if (!editor || editor.selection.isEmpty) {
            vscode.commands.executeCommand('setContext', IN_COMMENT_CONTEXT_KEY, false);
            vscode.commands.executeCommand('setContext', HAS_HIGHLIGHT_CONTEXT_KEY, false);
            return;
        }
        // Use synchronous detection for context key (fast)
        const result = (0, commentDetection_1.detectCommentSync)(editor, editor.selection);
        vscode.commands.executeCommand('setContext', IN_COMMENT_CONTEXT_KEY, result.isInComment);
        // Check if selection has a highlight
        if (result.isInComment && result.commentRange) {
            const highlightInfo = (0, decorations_1.isRangeHighlighted)(editor, result.commentRange.range);
            vscode.commands.executeCommand('setContext', HAS_HIGHLIGHT_CONTEXT_KEY, highlightInfo.highlighted);
        }
        else {
            vscode.commands.executeCommand('setContext', HAS_HIGHLIGHT_CONTEXT_KEY, false);
        }
    };
    // Update on selection change
    const onDidChangeTextEditorSelection = vscode.window.onDidChangeTextEditorSelection((event) => {
        updateContextKey(event.textEditor);
    });
    // Update on active editor change
    const onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor((editor) => {
        updateContextKey(editor);
    });
    // Initial check
    updateContextKey(vscode.window.activeTextEditor);
    // Also update when text editor visible ranges change (e.g., scrolling)
    const onDidChangeTextEditorVisibleRanges = vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
        updateContextKey(event.textEditor);
    });
    context.subscriptions.push(onDidChangeTextEditorVisibleRanges, onDidChangeTextDocument, onDidChangeVisibleTextEditors, onDidOpenTextDocument, onDidChangeTextEditorSelection, onDidChangeActiveTextEditor);
}
/**
 * Deactivates the extension
 */
function deactivate() {
    console.log('Comment Highlighter extension is deactivating');
    (0, decorations_1.disposeAllDecorations)();
}
//# sourceMappingURL=extension.js.map