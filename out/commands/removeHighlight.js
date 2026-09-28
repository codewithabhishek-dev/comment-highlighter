"use strict";
/**
 * Remove Highlight command implementation
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
exports.removeHighlightCommand = removeHighlightCommand;
exports.registerRemoveHighlightCommand = registerRemoveHighlightCommand;
const vscode = __importStar(require("vscode"));
const commentDetection_1 = require("../utils/commentDetection");
const decorations_1 = require("../utils/decorations");
/**
 * Executes the "Remove Highlight" command
 * Removes highlight from the current selection if it's highlighted, or all highlights
 */
async function removeHighlightCommand() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
    }
    const selection = editor.selection;
    // If there's a selection, try to remove highlight from that specific range
    if (!selection.isEmpty && editor.selections.length === 1) {
        const detectionResult = await (0, commentDetection_1.detectComment)(editor, selection);
        if (detectionResult.isInComment && detectionResult.commentRange) {
            const color = (0, decorations_1.getHighlightColor)();
            await (0, decorations_1.removeHighlight)(editor, detectionResult.commentRange.range, { color });
            vscode.window.showInformationMessage('Highlight removed from selection');
            return;
        }
    }
    // Otherwise, remove all highlights from the editor
    await (0, decorations_1.removeAllHighlightsFromEditor)(editor);
    vscode.window.showInformationMessage('All highlights removed');
}
/**
 * Registers the remove highlight command
 */
function registerRemoveHighlightCommand(context) {
    return vscode.commands.registerCommand('comment-highlighter.removeHighlight', removeHighlightCommand);
}
//# sourceMappingURL=removeHighlight.js.map