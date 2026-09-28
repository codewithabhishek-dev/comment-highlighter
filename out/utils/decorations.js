"use strict";
/**
 * Decoration management - handles creating and applying text editor decorations
 * Tracks highlights per document and revalidates on document changes
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
exports.HIGHLIGHT_COLORS = void 0;
exports.setExtensionContext = setExtensionContext;
exports.loadHighlightsFromStorage = loadHighlightsFromStorage;
exports.applyHighlight = applyHighlight;
exports.removeHighlight = removeHighlight;
exports.removeAllHighlights = removeAllHighlights;
exports.removeAllHighlightsFromEditor = removeAllHighlightsFromEditor;
exports.revalidateHighlights = revalidateHighlights;
exports.isRangeHighlighted = isRangeHighlighted;
exports.getHighlightsForDocument = getHighlightsForDocument;
exports.restoreHighlightsForEditor = restoreHighlightsForEditor;
exports.disposeAllDecorations = disposeAllDecorations;
exports.getHighlightColor = getHighlightColor;
const vscode = __importStar(require("vscode"));
/**
 * Storage key for highlights in global state
 */
const HIGHLIGHTS_STORAGE_KEY = 'commentHighlighter.highlights';
/**
 * Extension context for accessing global state
 */
let extensionContext;
/**
 * Sets the extension context for persistence
 */
function setExtensionContext(context) {
    extensionContext = context;
}
/**
 * Track highlights per document
 * Key: document URI, Value: Map of color -> Set of highlights
 */
const documentHighlights = new Map();
/**
 * Cache for decoration types to avoid recreating them
 */
const decorationCache = new Map();
/**
 * Generates a cache key for a color
 */
function getCacheKey(color) {
    return `highlight-${color}`;
}
/**
 * Generates a unique ID for a highlight
 */
function generateHighlightId() {
    return `hl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * Converts a hex color to rgba with transparency
 */
function hexToRgba(hex, alpha = 0.3) {
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    // Parse hex to RGB
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
/**
 * Creates a new TextEditorDecorationType for highlighting
 * Uses semi-transparent background so comment text remains readable
 */
function createHighlightDecoration(color) {
    const transparentColor = hexToRgba(color, 0.3); // 30% opacity
    return vscode.window.createTextEditorDecorationType({
        backgroundColor: transparentColor,
        border: '1px solid transparent',
        borderRadius: '2px',
        isWholeLine: false,
    });
}
/**
 * Gets or creates a decoration type for the given color
 */
function getOrCreateDecoration(color) {
    const key = getCacheKey(color);
    let decorationType = decorationCache.get(key);
    if (!decorationType) {
        decorationType = createHighlightDecoration(color);
        decorationCache.set(key, decorationType);
    }
    return decorationType;
}
/**
 * Converts a Highlight to a SerializableHighlight for storage
 */
function highlightToSerializable(highlight) {
    return {
        id: highlight.id,
        range: {
            start: { line: highlight.range.start.line, character: highlight.range.start.character },
            end: { line: highlight.range.end.line, character: highlight.range.end.character }
        },
        color: highlight.color
    };
}
/**
 * Converts a SerializableHighlight back to a Highlight
 */
function serializableToHighlight(serializable) {
    return {
        id: serializable.id,
        range: new vscode.Range(new vscode.Position(serializable.range.start.line, serializable.range.start.character), new vscode.Position(serializable.range.end.line, serializable.range.end.character)),
        color: serializable.color
    };
}
/**
 * Saves all highlights to global state
 */
async function saveHighlightsToStorage() {
    if (!extensionContext) {
        return;
    }
    const storageData = {};
    for (const [uri, colorMap] of documentHighlights) {
        const allHighlights = [];
        for (const highlights of colorMap.values()) {
            for (const highlight of highlights) {
                allHighlights.push(highlightToSerializable(highlight));
            }
        }
        if (allHighlights.length > 0) {
            storageData[uri] = allHighlights;
        }
    }
    await extensionContext.globalState.update(HIGHLIGHTS_STORAGE_KEY, storageData);
}
/**
 * Loads highlights from global state
 */
async function loadHighlightsFromStorage() {
    if (!extensionContext) {
        return;
    }
    const storageData = extensionContext.globalState.get(HIGHLIGHTS_STORAGE_KEY);
    if (!storageData) {
        return;
    }
    for (const [uri, highlights] of Object.entries(storageData)) {
        const colorMap = new Map();
        for (const serializable of highlights) {
            const highlight = serializableToHighlight(serializable);
            if (!colorMap.has(highlight.color)) {
                colorMap.set(highlight.color, []);
            }
            colorMap.get(highlight.color).push(highlight);
        }
        documentHighlights.set(uri, colorMap);
    }
}
/**
 * Gets the highlights map for a document
 */
function getDocumentHighlights(document) {
    const uri = document.uri.toString();
    if (!documentHighlights.has(uri)) {
        documentHighlights.set(uri, new Map());
    }
    return documentHighlights.get(uri);
}
/**
 * Applies all highlights for a document to an editor
 */
function applyDocumentHighlights(editor) {
    const highlightsMap = getDocumentHighlights(editor.document);
    for (const [color, highlights] of highlightsMap) {
        const decorationType = getOrCreateDecoration(color);
        const decorationOptions = highlights.map(h => ({
            range: h.range,
            hoverMessage: `Highlighted comment (${color})`
        }));
        editor.setDecorations(decorationType, decorationOptions);
    }
}
/**
 * Applies a highlight decoration to the given range in the editor
 */
async function applyHighlight(editor, range, options) {
    const highlightsMap = getDocumentHighlights(editor.document);
    if (!highlightsMap.has(options.color)) {
        highlightsMap.set(options.color, []);
    }
    const highlights = highlightsMap.get(options.color);
    // Check if this exact range already exists for this color
    const existingIndex = highlights.findIndex(h => h.range.start.isEqual(range.start) && h.range.end.isEqual(range.end));
    if (existingIndex >= 0) {
        // Already highlighted, do nothing
        return;
    }
    // Add new highlight
    const highlight = {
        id: generateHighlightId(),
        range,
        color: options.color
    };
    highlights.push(highlight);
    // Re-apply all highlights for this color
    const decorationType = getOrCreateDecoration(options.color);
    const decorationOptions = highlights.map(h => ({
        range: h.range,
        hoverMessage: `Highlighted comment (${options.color})`
    }));
    editor.setDecorations(decorationType, decorationOptions);
    // Save to storage
    await saveHighlightsToStorage();
}
/**
 * Removes a specific highlight from the given range
 */
async function removeHighlight(editor, range, options) {
    const highlightsMap = getDocumentHighlights(editor.document);
    const highlights = highlightsMap.get(options.color);
    if (!highlights) {
        return;
    }
    // Find and remove the highlight that matches the range
    const index = highlights.findIndex(h => h.range.start.isEqual(range.start) && h.range.end.isEqual(range.end));
    if (index >= 0) {
        highlights.splice(index, 1);
        // Re-apply remaining highlights for this color
        const decorationType = getOrCreateDecoration(options.color);
        const decorationOptions = highlights.map(h => ({
            range: h.range,
            hoverMessage: `Highlighted comment (${options.color})`
        }));
        editor.setDecorations(decorationType, decorationOptions);
        // Save to storage
        await saveHighlightsToStorage();
    }
}
/**
 * Removes all highlights of a specific color from the editor
 */
async function removeAllHighlights(editor, color) {
    const highlightsMap = getDocumentHighlights(editor.document);
    highlightsMap.delete(color);
    const decorationType = decorationCache.get(getCacheKey(color));
    if (decorationType) {
        editor.setDecorations(decorationType, []);
    }
    // Save to storage
    await saveHighlightsToStorage();
}
/**
 * Removes all highlights (all colors) from the editor
 */
async function removeAllHighlightsFromEditor(editor) {
    const highlightsMap = getDocumentHighlights(editor.document);
    highlightsMap.clear();
    for (const decorationType of decorationCache.values()) {
        editor.setDecorations(decorationType, []);
    }
    // Save to storage
    await saveHighlightsToStorage();
}
/**
 * Revalidates all highlights for a document after a text change
 * Removes highlights that are no longer in comments
 */
async function revalidateHighlights(editor, isRangeInCommentFn) {
    const highlightsMap = getDocumentHighlights(editor.document);
    let hasChanges = false;
    for (const [color, highlights] of highlightsMap) {
        const validHighlights = highlights.filter(h => isRangeInCommentFn(editor.document, h.range));
        if (validHighlights.length !== highlights.length) {
            hasChanges = true;
            highlightsMap.set(color, validHighlights);
            // Re-apply valid highlights
            const decorationType = getOrCreateDecoration(color);
            const decorationOptions = validHighlights.map(h => ({
                range: h.range,
                hoverMessage: `Highlighted comment (${color})`
            }));
            editor.setDecorations(decorationType, decorationOptions);
        }
    }
    // Clean up empty color maps
    for (const [color, highlights] of highlightsMap) {
        if (highlights.length === 0) {
            highlightsMap.delete(color);
            const decorationType = decorationCache.get(getCacheKey(color));
            if (decorationType) {
                editor.setDecorations(decorationType, []);
            }
        }
    }
    // Save to storage if there were changes
    if (hasChanges) {
        await saveHighlightsToStorage();
    }
}
/**
 * Checks if a specific range is already highlighted (for any color)
 */
function isRangeHighlighted(editor, range) {
    const highlightsMap = getDocumentHighlights(editor.document);
    for (const [color, highlights] of highlightsMap) {
        const found = highlights.some(h => h.range.start.isEqual(range.start) && h.range.end.isEqual(range.end));
        if (found) {
            return { highlighted: true, color };
        }
    }
    return { highlighted: false };
}
/**
 * Gets highlights for a document (for persistence or inspection)
 */
function getHighlightsForDocument(document) {
    const highlightsMap = getDocumentHighlights(document);
    const allHighlights = [];
    for (const highlights of highlightsMap.values()) {
        allHighlights.push(...highlights);
    }
    return allHighlights;
}
/**
 * Restores highlights for a document when an editor becomes visible
 */
function restoreHighlightsForEditor(editor) {
    applyDocumentHighlights(editor);
}
/**
 * Disposes all cached decoration types (call on extension deactivation)
 */
function disposeAllDecorations() {
    for (const decorationType of decorationCache.values()) {
        decorationType.dispose();
    }
    decorationCache.clear();
    documentHighlights.clear();
}
/**
 * Gets the current highlight color from configuration
 */
function getHighlightColor() {
    const config = vscode.workspace.getConfiguration('commentHighlighter');
    return config.get('highlightColor', '#ffff00');
}
/**
 * Available highlight colors
 */
exports.HIGHLIGHT_COLORS = [
    { name: 'Yellow', value: '#ffff00', emoji: '🟨' },
    { name: 'Green', value: '#90ee90', emoji: '🟩' },
    { name: 'Blue', value: '#add8e6', emoji: '🟦' },
    { name: 'Red', value: '#ffb6c1', emoji: '🟥' },
    { name: 'Purple', value: '#dda0dd', emoji: '🟪' },
];
//# sourceMappingURL=decorations.js.map