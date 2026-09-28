/**
 * Highlight Comment command implementation
 */
import * as vscode from 'vscode';
/**
 * Executes the "Highlight Comment" command with optional color parameter
 * If color is provided (from submenu or keyboard shortcut args), applies that color directly
 * If no color provided (from context menu main command), shows color picker
 * Does NOT auto-remove existing highlights - use "Remove Highlight" for that
 */
export declare function highlightCommentCommand(args?: {
    color?: string;
} | string): Promise<void>;
/**
 * Registers the highlight command
 */
export declare function registerHighlightCommand(context: vscode.ExtensionContext): vscode.Disposable;
/**
 * Color-specific highlight commands for context menu
 */
export declare function registerColorHighlightCommands(context: vscode.ExtensionContext): vscode.Disposable[];
//# sourceMappingURL=highlight.d.ts.map