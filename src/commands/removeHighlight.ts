/**
 * Remove Highlight command implementation
 */

import * as vscode from 'vscode';
import { detectComment } from '../utils/commentDetection';
import { removeHighlight, removeAllHighlightsFromEditor, getHighlightColor, isRangeHighlighted } from '../utils/decorations';

/**
 * Executes the "Remove Highlight" command
 * Removes highlight from the current selection if it's highlighted, or all highlights
 */
export async function removeHighlightCommand(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  
  if (!editor) {
    vscode.window.showWarningMessage('No active editor found');
    return;
  }
  
  const selection = editor.selection;
  
  // If there's a selection, try to remove highlight from that specific range
  if (!selection.isEmpty && editor.selections.length === 1) {
    const detectionResult = await detectComment(editor, selection);
    
    if (detectionResult.isInComment && detectionResult.commentRange) {
      const range = detectionResult.commentRange.range;
      
      // Check if this range is highlighted and get the actual color
      const highlightInfo = isRangeHighlighted(editor, range);
      
      if (highlightInfo.highlighted && highlightInfo.color) {
        // Use the actual highlight color to remove it
        await removeHighlight(editor, range, { color: highlightInfo.color });
        vscode.window.showInformationMessage('Highlight removed from selection');
        return;
      }
      
      // If not highlighted but in a comment, try with default color (for backward compatibility)
      const color = getHighlightColor();
      await removeHighlight(editor, range, { color });
      vscode.window.showInformationMessage('Highlight removed from selection');
      return;
    }
  }
  
  // Otherwise, remove all highlights from the editor
  await removeAllHighlightsFromEditor(editor);
  vscode.window.showInformationMessage('All highlights removed');
}

/**
 * Registers the remove highlight command
 */
export function registerRemoveHighlightCommand(context: vscode.ExtensionContext): vscode.Disposable {
  return vscode.commands.registerCommand('comment-highlighter.removeHighlight', removeHighlightCommand);
}