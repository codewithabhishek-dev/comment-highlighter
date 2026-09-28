/**
 * Comment Highlighter - Main Extension Entry Point
 */

import * as vscode from 'vscode';
import { registerHighlightCommand, registerColorHighlightCommands } from './commands/highlight';
import { registerRemoveHighlightCommand } from './commands/removeHighlight';
import { 
  disposeAllDecorations, 
  revalidateHighlights, 
  restoreHighlightsForEditor,
  getHighlightColor,
  setExtensionContext,
  loadHighlightsFromStorage
} from './utils/decorations';
import { isRangeInComment, detectCommentSync } from './utils/commentDetection';

/**
 * Context key for when selection is in a comment
 */
const IN_COMMENT_CONTEXT_KEY = 'commentHighlighter.inComment';

/**
 * Activates the extension
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('Comment Highlighter extension is now active');
  
  // Initialize persistence
  setExtensionContext(context);
  
  // Load highlights from storage
  await loadHighlightsFromStorage();
  
  // Register commands
  const highlightCommand = registerHighlightCommand(context);
  const removeHighlightCommand = registerRemoveHighlightCommand(context);
  const colorCommands = registerColorHighlightCommands(context);
  
  // Add to subscriptions for proper cleanup
  context.subscriptions.push(highlightCommand, removeHighlightCommand, ...colorCommands);
  
  // Restore highlights for all currently visible editors
  for (const editor of vscode.window.visibleTextEditors) {
    restoreHighlightsForEditor(editor);
  }
  
  // Track document changes to revalidate highlights
  const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(async (event) => {
    const editor = vscode.window.visibleTextEditors.find(e => e.document === event.document);
    if (editor) {
      await revalidateHighlights(editor, isRangeInComment);
    }
  });
  
  // Restore highlights when editor becomes visible
  const onDidChangeVisibleTextEditors = vscode.window.onDidChangeVisibleTextEditors((editors) => {
    for (const editor of editors) {
      restoreHighlightsForEditor(editor);
    }
  });
  
  // Restore highlights when a document is opened (handles VS Code reload)
  const onDidOpenTextDocument = vscode.workspace.onDidOpenTextDocument((document) => {
    const editor = vscode.window.visibleTextEditors.find(e => e.document === document);
    if (editor) {
      restoreHighlightsForEditor(editor);
    }
  });
  
  // Update context key for context menu visibility
  const updateContextKey = (editor: vscode.TextEditor | undefined) => {
    if (!editor || editor.selection.isEmpty) {
      vscode.commands.executeCommand('setContext', IN_COMMENT_CONTEXT_KEY, false);
      return;
    }
    
    // Use synchronous detection for context key (fast)
    const result = detectCommentSync(editor, editor.selection);
    vscode.commands.executeCommand('setContext', IN_COMMENT_CONTEXT_KEY, result.isInComment);
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
  
  context.subscriptions.push(
    onDidChangeTextEditorVisibleRanges,
    onDidChangeTextDocument,
    onDidChangeVisibleTextEditors,
    onDidOpenTextDocument,
    onDidChangeTextEditorSelection,
    onDidChangeActiveTextEditor
  );
}

/**
 * Deactivates the extension
 */
export function deactivate(): void {
  console.log('Comment Highlighter extension is deactivating');
  disposeAllDecorations();
}