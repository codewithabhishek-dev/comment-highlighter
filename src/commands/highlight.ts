/**
 * Highlight Comment command implementation
 */

import * as vscode from 'vscode';
import { detectComment } from '../utils/commentDetection';
import { applyHighlight, removeHighlight, getHighlightColor, isRangeHighlighted } from '../utils/decorations';

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
async function pickHighlightColor(): Promise<string | undefined> {
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
export async function highlightCommentCommand(args?: { color?: string } | string): Promise<void> {
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
  const detectionResult = await detectComment(editor, selection);
  
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
  await applyHighlight(editor, range, { color: highlightColor });
  
  // Get color name for display message
  const colorName = HIGHLIGHT_COLORS.find(c => c.color === highlightColor)?.label || highlightColor;
  vscode.window.showInformationMessage(`Comment highlighted with ${colorName}!`);
}

/**
 * Registers the highlight command
 */
export function registerHighlightCommand(context: vscode.ExtensionContext): vscode.Disposable {
  return vscode.commands.registerCommand('comment-highlighter.highlight', highlightCommentCommand);
}

/**
 * Color-specific highlight commands for context menu
 */
export function registerColorHighlightCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
  const colors = [
    { name: 'Yellow', color: '#ffff00' },
    { name: 'Green', color: '#90ee90' },
    { name: 'Blue', color: '#add8e6' },
    { name: 'Red', color: '#ffb6c1' },
    { name: 'Purple', color: '#dda0dd' },
  ];
  
  const colorCommands = colors.map(({ name, color }) =>
    vscode.commands.registerCommand(`comment-highlighter.highlight.${name.toLowerCase()}`, () =>
      highlightCommentCommand(color)
    )
  );
  
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
    
    vscode.window.showInformationMessage(
      `Debug: language=${editor.document.languageId}, selection="${editor.document.getText(selection)}", isInComment=${result.isInComment}`
    );
  });
  
  return [...colorCommands, debugCommand];
}