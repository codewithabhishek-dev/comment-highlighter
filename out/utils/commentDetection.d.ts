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
//# sourceMappingURL=commentDetection.d.ts.map