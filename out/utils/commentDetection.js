"use strict";
/**
 * Comment detection logic - determines if a selection is inside a comment
 * Uses hardcoded comment tokens for reliable, fast detection
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectComment = detectComment;
exports.detectCommentSync = detectCommentSync;
exports.isRangeInComment = isRangeInComment;
const vscode = __importStar(require("vscode"));
/**
 * Hardcoded comment tokens for common languages
 * This is used as the primary detection method since VS Code doesn't expose
 * a getLanguageConfiguration API for extensions
 */
function getCommentTokens(languageId) {
    const commentConfig = {
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
function isInLineComment(document, position, lineComment) {
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
function isInBlockComment(document, position, blockStart, blockEnd) {
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
function isRangeInLineComment(document, range, lineComment) {
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
function isRangeInBlockComment(document, range, blockStart, blockEnd) {
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
 * Main comment detection using hardcoded tokens
 * This is synchronous and fast
 */
function detectCommentInternal(document, selection) {
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
            const commentRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
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
            const commentRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
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
    }
    return { isInComment: false, selectedText };
}
/**
 * Main function to detect if a selection is inside a comment
 * Uses hardcoded tokens for reliable, fast detection
 */
async function detectComment(editor, selection) {
    return detectCommentInternal(editor.document, selection);
}
/**
 * Synchronous version for context menu visibility checks
 */
function detectCommentSync(editor, selection) {
    return detectCommentInternal(editor.document, selection);
}
/**
 * Checks if a specific range is within a comment (for decoration updates)
 */
function isRangeInComment(document, range) {
    const result = detectCommentInternal(document, new vscode.Selection(range.start, range.end));
    return result.isInComment;
}
//# sourceMappingURL=commentDetection.js.map