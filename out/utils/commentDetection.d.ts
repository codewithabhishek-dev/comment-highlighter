/**
 * Comment detection logic - determines if a selection is inside a comment
 * Uses hardcoded comment tokens for reliable, fast detection
 */
import * as vscode from 'vscode';
import { CommentDetectionResult } from '../types';
/**
 * Main function to detect if a selection is inside a comment
 * Uses hardcoded tokens for reliable, fast detection
 */
export declare function detectComment(editor: vscode.TextEditor, selection: vscode.Selection): Promise<CommentDetectionResult>;
/**
 * Synchronous version for context menu visibility checks
 */
export declare function detectCommentSync(editor: vscode.TextEditor, selection: vscode.Selection): CommentDetectionResult;
/**
 * Checks if a specific range is within a comment (for decoration updates)
 */
export declare function isRangeInComment(document: vscode.TextDocument, range: vscode.Range): boolean;
/**
 * Gets the full comment range for a given range (used for highlighting the entire comment)
 * This is useful for multi-line block comments where we want to highlight the entire comment block
 */
export declare function getFullCommentRange(document: vscode.TextDocument, range: vscode.Range): vscode.Range | null;
//# sourceMappingURL=commentDetection.d.ts.map