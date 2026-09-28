/**
 * Shared TypeScript types for Comment Highlighter extension
 */

import * as vscode from 'vscode';

/**
 * Configuration options for highlighting
 */
export interface HighlightOptions {
  /** Background color for the highlight (hex or CSS color name) */
  color: string;
  /** Optional: custom decoration type key for caching */
  decorationKey?: string;
}

/**
 * Represents a comment range in the document
 */
export interface CommentRange {
  /** The range of the comment */
  range: vscode.Range;
  /** The comment syntax used (e.g., '//', '#', '--') */
  commentSyntax: string;
  /** Whether this is a block comment */
  isBlockComment: boolean;
}

/**
 * Result of comment detection
 */
export interface CommentDetectionResult {
  /** Whether the selection is inside a comment */
  isInComment: boolean;
  /** The comment range if found */
  commentRange?: CommentRange;
  /** The selected text */
  selectedText: string;
}

/**
 * Decoration cache entry
 */
export interface DecorationCacheEntry {
  /** The decoration type */
  decorationType: vscode.TextEditorDecorationType;
  /** Color key used for caching */
  colorKey: string;
}