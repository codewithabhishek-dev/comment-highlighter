/**
 * Decoration management - handles creating and applying text editor decorations
 * Tracks highlights per document and revalidates on document changes
 */
import * as vscode from 'vscode';
import { HighlightOptions } from '../types';
/**
 * Represents a single highlight (serializable for persistence)
 */
interface Highlight {
    id: string;
    range: vscode.Range;
    color: string;
}
/**
 * Sets the extension context for persistence
 */
export declare function setExtensionContext(context: vscode.ExtensionContext): void;
/**
 * Loads highlights from global state
 */
export declare function loadHighlightsFromStorage(): Promise<void>;
/**
 * Applies a highlight decoration to the given range in the editor
 */
export declare function applyHighlight(editor: vscode.TextEditor, range: vscode.Range, options: HighlightOptions): Promise<void>;
/**
 * Removes a specific highlight from the given range
 */
export declare function removeHighlight(editor: vscode.TextEditor, range: vscode.Range, options: HighlightOptions): Promise<void>;
/**
 * Removes all highlights of a specific color from the editor
 */
export declare function removeAllHighlights(editor: vscode.TextEditor, color: string): Promise<void>;
/**
 * Removes all highlights (all colors) from the editor
 */
export declare function removeAllHighlightsFromEditor(editor: vscode.TextEditor): Promise<void>;
/**
 * Revalidates all highlights for a document after a text change
 * Removes highlights that are no longer in comments
 */
export declare function revalidateHighlights(editor: vscode.TextEditor, isRangeInCommentFn: (document: vscode.TextDocument, range: vscode.Range) => boolean): Promise<void>;
/**
 * Checks if a specific range is already highlighted (for any color)
 */
export declare function isRangeHighlighted(editor: vscode.TextEditor, range: vscode.Range): {
    highlighted: boolean;
    color?: string;
};
/**
 * Gets highlights for a document (for persistence or inspection)
 */
export declare function getHighlightsForDocument(document: vscode.TextDocument): Highlight[];
/**
 * Restores highlights for a document when an editor becomes visible
 */
export declare function restoreHighlightsForEditor(editor: vscode.TextEditor): void;
/**
 * Disposes all cached decoration types (call on extension deactivation)
 */
export declare function disposeAllDecorations(): void;
/**
 * Gets the current highlight color from configuration
 */
export declare function getHighlightColor(): string;
/**
 * Available highlight colors
 */
export declare const HIGHLIGHT_COLORS: readonly [{
    readonly name: "Yellow";
    readonly value: "#ffff00";
    readonly emoji: "🟨";
}, {
    readonly name: "Green";
    readonly value: "#90ee90";
    readonly emoji: "🟩";
}, {
    readonly name: "Blue";
    readonly value: "#add8e6";
    readonly emoji: "🟦";
}, {
    readonly name: "Red";
    readonly value: "#ffb6c1";
    readonly emoji: "🟥";
}, {
    readonly name: "Purple";
    readonly value: "#dda0dd";
    readonly emoji: "🟪";
}];
export type HighlightColorName = typeof HIGHLIGHT_COLORS[number]['name'];
export type HighlightColorValue = typeof HIGHLIGHT_COLORS[number]['value'];
export {};
//# sourceMappingURL=decorations.d.ts.map