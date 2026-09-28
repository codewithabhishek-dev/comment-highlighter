/**
 * Remove Highlight command implementation
 */
import * as vscode from 'vscode';
/**
 * Executes the "Remove Highlight" command
 * Removes highlight from the current selection if it's highlighted, or all highlights
 */
export declare function removeHighlightCommand(): Promise<void>;
/**
 * Registers the remove highlight command
 */
export declare function registerRemoveHighlightCommand(context: vscode.ExtensionContext): vscode.Disposable;
//# sourceMappingURL=removeHighlight.d.ts.map