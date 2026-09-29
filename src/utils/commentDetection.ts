/**
 * Comment detection logic - determines if a selection is inside a comment
 * Uses hardcoded comment tokens for reliable, fast detection
 */

import * as vscode from 'vscode';
import { CommentDetectionResult, CommentRange } from '../types';

/**
 * Hardcoded comment tokens for common languages
 * This is used as the primary detection method since VS Code doesn't expose
 * a getLanguageConfiguration API for extensions
 */
function getCommentTokens(languageId: string): { lineComment?: string; blockCommentStart?: string; blockCommentEnd?: string } {
  const commentConfig: Record<string, { lineComment?: string; blockCommentStart?: string; blockCommentEnd?: string }> = {
    'javascript': { lineComment: '//', blockCommentStart: '/*', blockCommentEnd: '*/' },
    'typescript': { lineComment: '//', blockCommentStart: '/*', blockCommentEnd: '*/' },
    'python': { lineComment: '#' },
    'java': { lineComment: '//', blockCommentStart: '/*', blockCommentEnd: '*/' },
    'csharp': { lineComment: '//', blockCommentStart: '/*', blockCommentEnd: '*/' },
    'cpp': { lineComment: '//', blockCommentStart: '/*', blockCommentEnd: '*/' },
    'c': { lineComment: '//', blockCommentStart: '/*', blockCommentEnd: '*/' },
    'go': { lineComment: '//', blockCommentStart: '/*', blockCommentEnd: '*/' },
    'rust': { lineComment: '//', blockCommentStart: '/*', blockCommentEnd: '*/' },
    'php': { lineComment: '//', blockCommentStart: '/*', blockCommentEnd: '*/' },
    'ruby': { lineComment: '#' },
    'swift': { lineComment: '//', blockCommentStart: '/*', blockCommentEnd: '*/' },
    'kotlin': { lineComment: '//', blockCommentStart: '/*', blockCommentEnd: '*/' },
    'scala': { lineComment: '//', blockCommentStart: '/*', blockCommentEnd: '*/' },
    'html': { blockCommentStart: '<!--', blockCommentEnd: '-->' },
    'xml': { blockCommentStart: '<!--', blockCommentEnd: '-->' },
    'css': { blockCommentStart: '/*', blockCommentEnd: '*/' },
    'scss': { lineComment: '//', blockCommentStart: '/*', blockCommentEnd: '*/' },
    'less': { lineComment: '//', blockCommentStart: '/*', blockCommentEnd: '*/' },
    'json': { lineComment: '//' },
    'yaml': { lineComment: '#' },
    'yml': { lineComment: '#' },
    'markdown': { blockCommentStart: '<!--', blockCommentEnd: '-->' },
    'sql': { lineComment: '--' },
    'shell': { lineComment: '#' },
    'bash': { lineComment: '#' },
    'powershell': { lineComment: '#' },
    'dockerfile': { lineComment: '#' },
    'r': { lineComment: '#' },
    'julia': { lineComment: '#' },
    'perl': { lineComment: '#' },
    'lua': { lineComment: '--', blockCommentStart: '--[[', blockCommentEnd: ']]' },
    'haskell': { lineComment: '--', blockCommentStart: '{-', blockCommentEnd: '-}' },
    'elm': { lineComment: '--', blockCommentStart: '{-', blockCommentEnd: '-}' },
    'fsharp': { lineComment: '//', blockCommentStart: '(*', blockCommentEnd: '*)' },
    'ocaml': { blockCommentStart: '(*', blockCommentEnd: '*)' },
    'clojure': { lineComment: ';' },
    'scheme': { lineComment: ';' },
    'racket': { lineComment: ';' },
    'commonlisp': { lineComment: ';' },
    'erlang': { lineComment: '%' },
    'elixir': { lineComment: '#' },
    'dart': { lineComment: '//', blockCommentStart: '/*', blockCommentEnd: '*/' },
    'vue': { blockCommentStart: '<!--', blockCommentEnd: '-->' },
    'svelte': { blockCommentStart: '<!--', blockCommentEnd: '-->' },
  };
  
  return commentConfig[languageId.toLowerCase()] || {};
}

/**
 * Checks if a position is inside a line comment
 */
function isInLineComment(
  document: vscode.TextDocument,
  position: vscode.Position,
  lineComment: string
): { isInComment: boolean; commentStart: number; commentEnd: number } {
  const line = document.lineAt(position.line);
  const lineText = line.text;
  const commentIndex = lineText.indexOf(lineComment);
  
  if (commentIndex === -1) {
    return { isInComment: false, commentStart: -1, commentEnd: -1 };
  }
  
  const charPosition = position.character;
  // Allow selection from the comment token onwards (>= instead of >)
  const inComment = charPosition >= commentIndex + lineComment.length;
  
  return { 
    isInComment: inComment, 
    commentStart: commentIndex + lineComment.length,
    commentEnd: lineText.length
  };
}

/**
 * Checks if a position is inside a block comment (single-line only)
 */
function isInBlockComment(
  document: vscode.TextDocument,
  position: vscode.Position,
  blockStart: string,
  blockEnd: string
): { isInComment: boolean; commentStart: number; commentEnd: number } {
  const line = document.lineAt(position.line);
  const lineText = line.text;
  const startIndex = lineText.indexOf(blockStart);
  const endIndex = lineText.indexOf(blockEnd);
  
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return { isInComment: false, commentStart: -1, commentEnd: -1 };
  }
  
  const charPosition = position.character;
  // Allow selection from the block start token onwards (>= instead of >)
  const inComment = charPosition >= startIndex + blockStart.length && charPosition <= endIndex;
  
  return { 
    isInComment: inComment, 
    commentStart: startIndex + blockStart.length,
    commentEnd: endIndex
  };
}

/**
 * Checks if a range is inside a line comment
 */
function isRangeInLineComment(
  document: vscode.TextDocument,
  range: vscode.Range,
  lineComment: string
): { isInComment: boolean; commentStart: number; commentEnd: number } {
  const startCheck = isInLineComment(document, range.start, lineComment);
  const endCheck = isInLineComment(document, range.end, lineComment);
  
  if (startCheck.isInComment && endCheck.isInComment && 
      startCheck.commentStart === endCheck.commentStart) {
    return { 
      isInComment: true, 
      commentStart: startCheck.commentStart,
      commentEnd: startCheck.commentEnd
    };
  }
  
  return { isInComment: false, commentStart: -1, commentEnd: -1 };
}

/**
 * Checks if a range is inside a block comment (single-line only)
 */
function isRangeInBlockComment(
  document: vscode.TextDocument,
  range: vscode.Range,
  blockStart: string,
  blockEnd: string
): { isInComment: boolean; commentStart: number; commentEnd: number } {
  const startCheck = isInBlockComment(document, range.start, blockStart, blockEnd);
  const endCheck = isInBlockComment(document, range.end, blockStart, blockEnd);
  
  if (startCheck.isInComment && endCheck.isInComment && 
      startCheck.commentStart === endCheck.commentStart) {
    return { 
      isInComment: true, 
      commentStart: startCheck.commentStart,
      commentEnd: startCheck.commentEnd
    };
  }
  
  return { isInComment: false, commentStart: -1, commentEnd: -1 };
}

/**
 * Finds the boundaries of a multi-line block comment containing the given position
 * Scans backwards for blockStart and forwards for blockEnd
 */
function findMultiLineBlockCommentBounds(
  document: vscode.TextDocument,
  position: vscode.Position,
  blockStart: string,
  blockEnd: string
): { startLine: number; startChar: number; endLine: number; endChar: number } | null {
  const text = document.getText();
  const offset = document.offsetAt(position);
  
  // Find the last blockStart before the position
  let lastStartIndex = -1;
  let searchIndex = 0;
  while (true) {
    const found = text.indexOf(blockStart, searchIndex);
    if (found === -1 || found >= offset) {
      break;
    }
    lastStartIndex = found;
    searchIndex = found + blockStart.length;
  }
  
  if (lastStartIndex === -1) {
    return null;
  }
  
  // Find the first blockEnd after the lastStartIndex
  const endIndex = text.indexOf(blockEnd, lastStartIndex + blockStart.length);
  if (endIndex === -1) {
    return null;
  }
  
  // Check if position is within this block comment
  if (offset >= lastStartIndex + blockStart.length && offset <= endIndex) {
    const startPos = document.positionAt(lastStartIndex + blockStart.length);
    const endPos = document.positionAt(endIndex);
    return {
      startLine: startPos.line,
      startChar: startPos.character,
      endLine: endPos.line,
      endChar: endPos.character
    };
  }
  
  return null;
}

/**
 * Checks if a range is inside a multi-line block comment
 */
function isRangeInMultiLineBlockComment(
  document: vscode.TextDocument,
  range: vscode.Range,
  blockStart: string,
  blockEnd: string
): { isInComment: boolean; commentRange?: vscode.Range } {
  // Check if both start and end of selection are within the same multi-line block comment
  const startBounds = findMultiLineBlockCommentBounds(document, range.start, blockStart, blockEnd);
  const endBounds = findMultiLineBlockCommentBounds(document, range.end, blockStart, blockEnd);
  
  if (startBounds && endBounds && 
      startBounds.startLine === endBounds.startLine && 
      startBounds.startChar === endBounds.startChar &&
      startBounds.endLine === endBounds.endLine && 
      startBounds.endChar === endBounds.endChar) {
    // Both positions are in the same block comment
    const commentRange = new vscode.Range(
      startBounds.startLine, startBounds.startChar,
      endBounds.endLine, endBounds.endChar
    );
    return { isInComment: true, commentRange };
  }
  
  return { isInComment: false };
}

/**
 * Main comment detection using hardcoded tokens
 * This is synchronous and fast
 */
function detectCommentInternal(
  document: vscode.TextDocument,
  selection: vscode.Selection
): CommentDetectionResult {
  const languageId = document.languageId;
  const selectedText = document.getText(selection);
  
  if (selection.isEmpty || selectedText.trim().length === 0) {
    return { isInComment: false, selectedText: '' };
  }
  
  const tokens = getCommentTokens(languageId);
  
  // Try line comment first
  if (tokens.lineComment) {
    const result = isRangeInLineComment(document, selection, tokens.lineComment);
    if (result.isInComment) {
      const commentRange = new vscode.Range(
        selection.start.line,
        selection.start.character,
        selection.end.line,
        selection.end.character
      );
      return {
        isInComment: true,
        commentRange: {
          range: commentRange,
          commentSyntax: tokens.lineComment,
          isBlockComment: false,
        },
        selectedText,
      };
    }
  }
  
  // Try block comment (single-line only)
  if (tokens.blockCommentStart && tokens.blockCommentEnd) {
    const result = isRangeInBlockComment(document, selection, tokens.blockCommentStart, tokens.blockCommentEnd);
    if (result.isInComment) {
      const commentRange = new vscode.Range(
        selection.start.line,
        selection.start.character,
        selection.end.line,
        selection.end.character
      );
      return {
        isInComment: true,
        commentRange: {
          range: commentRange,
          commentSyntax: `${tokens.blockCommentStart}...${tokens.blockCommentEnd}`,
          isBlockComment: true,
        },
        selectedText,
      };
    }
    
    // Try multi-line block comment
    const multiLineResult = isRangeInMultiLineBlockComment(document, selection, tokens.blockCommentStart, tokens.blockCommentEnd);
    if (multiLineResult.isInComment && multiLineResult.commentRange) {
      return {
        isInComment: true,
        commentRange: {
          range: multiLineResult.commentRange,
          commentSyntax: `${tokens.blockCommentStart}...${tokens.blockCommentEnd}`,
          isBlockComment: true,
        },
        selectedText,
      };
    }
  }
  
  return { isInComment: false, selectedText };
}

/**
 * Main function to detect if a selection is inside a comment
 * Uses hardcoded tokens for reliable, fast detection
 */
export async function detectComment(
  editor: vscode.TextEditor,
  selection: vscode.Selection
): Promise<CommentDetectionResult> {
  return detectCommentInternal(editor.document, selection);
}

/**
 * Synchronous version for context menu visibility checks
 */
export function detectCommentSync(
  editor: vscode.TextEditor,
  selection: vscode.Selection
): CommentDetectionResult {
  return detectCommentInternal(editor.document, selection);
}

/**
 * Checks if a specific range is within a comment (for decoration updates)
 */
export function isRangeInComment(
  document: vscode.TextDocument,
  range: vscode.Range
): boolean {
  const result = detectCommentInternal(document, new vscode.Selection(range.start, range.end));
  return result.isInComment;
}

/**
 * Gets the full comment range for a given range (used for highlighting the entire comment)
 * This is useful for multi-line block comments where we want to highlight the entire comment block
 */
export function getFullCommentRange(
  document: vscode.TextDocument,
  range: vscode.Range
): vscode.Range | null {
  const result = detectCommentInternal(document, new vscode.Selection(range.start, range.end));
  if (result.isInComment && result.commentRange) {
    return result.commentRange.range;
  }
  return null;
}