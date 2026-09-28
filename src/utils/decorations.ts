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
 * Serializable version of Highlight for storage
 */
interface SerializableHighlight {
  id: string;
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  color: string;
}

/**
 * Storage key for highlights in global state
 */
const HIGHLIGHTS_STORAGE_KEY = 'commentHighlighter.highlights';

/**
 * Extension context for accessing global state
 */
let extensionContext: vscode.ExtensionContext | undefined;

/**
 * Sets the extension context for persistence
 */
export function setExtensionContext(context: vscode.ExtensionContext): void {
  extensionContext = context;
}

/**
 * Track highlights per document
 * Key: document URI, Value: Map of color -> Set of highlights
 */
const documentHighlights = new Map<string, Map<string, Highlight[]>>();

/**
 * Cache for decoration types to avoid recreating them
 */
const decorationCache = new Map<string, vscode.TextEditorDecorationType>();

/**
 * Generates a cache key for a color
 */
function getCacheKey(color: string): string {
  return `highlight-${color}`;
}

/**
 * Generates a unique ID for a highlight
 */
function generateHighlightId(): string {
  return `hl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Converts a hex color to rgba with transparency
 */
function hexToRgba(hex: string, alpha: number = 0.3): string {
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
function createHighlightDecoration(color: string): vscode.TextEditorDecorationType {
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
function getOrCreateDecoration(color: string): vscode.TextEditorDecorationType {
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
function highlightToSerializable(highlight: Highlight): SerializableHighlight {
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
function serializableToHighlight(serializable: SerializableHighlight): Highlight {
  return {
    id: serializable.id,
    range: new vscode.Range(
      new vscode.Position(serializable.range.start.line, serializable.range.start.character),
      new vscode.Position(serializable.range.end.line, serializable.range.end.character)
    ),
    color: serializable.color
  };
}

/**
 * Saves all highlights to global state
 */
async function saveHighlightsToStorage(): Promise<void> {
  if (!extensionContext) {
    return;
  }
  
  const storageData: Record<string, SerializableHighlight[]> = {};
  
  for (const [uri, colorMap] of documentHighlights) {
    const allHighlights: SerializableHighlight[] = [];
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
export async function loadHighlightsFromStorage(): Promise<void> {
  if (!extensionContext) {
    return;
  }
  
  const storageData = extensionContext.globalState.get<Record<string, SerializableHighlight[]>>(HIGHLIGHTS_STORAGE_KEY);
  if (!storageData) {
    return;
  }
  
  for (const [uri, highlights] of Object.entries(storageData)) {
    const colorMap = new Map<string, Highlight[]>();
    for (const serializable of highlights) {
      const highlight = serializableToHighlight(serializable);
      if (!colorMap.has(highlight.color)) {
        colorMap.set(highlight.color, []);
      }
      colorMap.get(highlight.color)!.push(highlight);
    }
    documentHighlights.set(uri, colorMap);
  }
}

/**
 * Gets the highlights map for a document
 */
function getDocumentHighlights(document: vscode.TextDocument): Map<string, Highlight[]> {
  const uri = document.uri.toString();
  if (!documentHighlights.has(uri)) {
    documentHighlights.set(uri, new Map());
  }
  return documentHighlights.get(uri)!;
}

/**
 * Applies all highlights for a document to an editor
 */
function applyDocumentHighlights(editor: vscode.TextEditor): void {
  const highlightsMap = getDocumentHighlights(editor.document);
  
  for (const [color, highlights] of highlightsMap) {
    const decorationType = getOrCreateDecoration(color);
    const decorationOptions: vscode.DecorationOptions[] = highlights.map(h => ({
      range: h.range,
      hoverMessage: `Highlighted comment (${color})`
    }));
    editor.setDecorations(decorationType, decorationOptions);
  }
}

/**
 * Applies a highlight decoration to the given range in the editor
 */
export async function applyHighlight(
  editor: vscode.TextEditor,
  range: vscode.Range,
  options: HighlightOptions
): Promise<void> {
  const highlightsMap = getDocumentHighlights(editor.document);
  
  if (!highlightsMap.has(options.color)) {
    highlightsMap.set(options.color, []);
  }
  
  const highlights = highlightsMap.get(options.color)!;
  
  // Check if this exact range already exists for this color
  const existingIndex = highlights.findIndex(h => 
    h.range.start.isEqual(range.start) && h.range.end.isEqual(range.end)
  );
  
  if (existingIndex >= 0) {
    // Already highlighted, do nothing
    return;
  }
  
  // Add new highlight
  const highlight: Highlight = {
    id: generateHighlightId(),
    range,
    color: options.color
  };
  highlights.push(highlight);
  
  // Re-apply all highlights for this color
  const decorationType = getOrCreateDecoration(options.color);
  const decorationOptions: vscode.DecorationOptions[] = highlights.map(h => ({
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
export async function removeHighlight(
  editor: vscode.TextEditor,
  range: vscode.Range,
  options: HighlightOptions
): Promise<void> {
  const highlightsMap = getDocumentHighlights(editor.document);
  const highlights = highlightsMap.get(options.color);
  
  if (!highlights) {
    return;
  }
  
  // Find and remove the highlight that matches the range
  const index = highlights.findIndex(h => 
    h.range.start.isEqual(range.start) && h.range.end.isEqual(range.end)
  );
  
  if (index >= 0) {
    highlights.splice(index, 1);
    
    // Re-apply remaining highlights for this color
    const decorationType = getOrCreateDecoration(options.color);
    const decorationOptions: vscode.DecorationOptions[] = highlights.map(h => ({
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
export async function removeAllHighlights(
  editor: vscode.TextEditor,
  color: string
): Promise<void> {
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
export async function removeAllHighlightsFromEditor(editor: vscode.TextEditor): Promise<void> {
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
export async function revalidateHighlights(
  editor: vscode.TextEditor,
  isRangeInCommentFn: (document: vscode.TextDocument, range: vscode.Range) => boolean
): Promise<void> {
  const highlightsMap = getDocumentHighlights(editor.document);
  let hasChanges = false;
  
  for (const [color, highlights] of highlightsMap) {
    const validHighlights = highlights.filter(h => 
      isRangeInCommentFn(editor.document, h.range)
    );
    
    if (validHighlights.length !== highlights.length) {
      hasChanges = true;
      highlightsMap.set(color, validHighlights);
      
      // Re-apply valid highlights
      const decorationType = getOrCreateDecoration(color);
      const decorationOptions: vscode.DecorationOptions[] = validHighlights.map(h => ({
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
export function isRangeHighlighted(
  editor: vscode.TextEditor,
  range: vscode.Range
): { highlighted: boolean; color?: string } {
  const highlightsMap = getDocumentHighlights(editor.document);
  
  for (const [color, highlights] of highlightsMap) {
    const found = highlights.some(h => 
      h.range.start.isEqual(range.start) && h.range.end.isEqual(range.end)
    );
    if (found) {
      return { highlighted: true, color };
    }
  }
  
  return { highlighted: false };
}

/**
 * Gets highlights for a document (for persistence or inspection)
 */
export function getHighlightsForDocument(document: vscode.TextDocument): Highlight[] {
  const highlightsMap = getDocumentHighlights(document);
  const allHighlights: Highlight[] = [];
  for (const highlights of highlightsMap.values()) {
    allHighlights.push(...highlights);
  }
  return allHighlights;
}

/**
 * Restores highlights for a document when an editor becomes visible
 */
export function restoreHighlightsForEditor(editor: vscode.TextEditor): void {
  applyDocumentHighlights(editor);
}

/**
 * Disposes all cached decoration types (call on extension deactivation)
 */
export function disposeAllDecorations(): void {
  for (const decorationType of decorationCache.values()) {
    decorationType.dispose();
  }
  decorationCache.clear();
  documentHighlights.clear();
}

/**
 * Gets the current highlight color from configuration
 */
export function getHighlightColor(): string {
  const config = vscode.workspace.getConfiguration('commentHighlighter');
  return config.get<string>('highlightColor', '#ffff00');
}

/**
 * Available highlight colors
 */
export const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#ffff00', emoji: '🟨' },
  { name: 'Green', value: '#90ee90', emoji: '🟩' },
  { name: 'Blue', value: '#add8e6', emoji: '🟦' },
  { name: 'Red', value: '#ffb6c1', emoji: '🟥' },
  { name: 'Purple', value: '#dda0dd', emoji: '🟪' },
] as const;

export type HighlightColorName = typeof HIGHLIGHT_COLORS[number]['name'];
export type HighlightColorValue = typeof HIGHLIGHT_COLORS[number]['value'];