import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Node as PMNode } from "@tiptap/pm/model";
import { analyzeDocument } from "../../proofread/proofreadEngine";
import type { Suggestion } from "../../proofread/proofreadTypes";

export interface ProofreadItem {
  suggestion: Suggestion;
  from: number;
  to: number;
}

export interface ProofreadPluginState {
  decorations: DecorationSet;
  issues: ProofreadItem[];
  dismissedIds: Set<string>;
}

export const writelyProofreadPluginKey = new PluginKey<ProofreadPluginState>("writelyProofread");

/**
 * Maps a character offset within blockNode.textContent to a ProseMirror doc position.
 */
export function getDocPos(blockNode: PMNode, blockStartPos: number, textOffset: number): number {
  let curOffset = 0;
  let docPos = blockStartPos + 1; // start inside the block

  for (let i = 0; i < blockNode.childCount; i++) {
    const child = blockNode.child(i);
    const childTextLen = child.isText ? (child.text ? child.text.length : 0) : 1;

    if (curOffset + childTextLen > textOffset) {
      if (child.isText) {
        return docPos + (textOffset - curOffset);
      }
      return docPos;
    }
    curOffset += childTextLen;
    docPos += child.nodeSize;
  }

  return docPos;
}

/**
 * Computes inline proofreading decorations by analyzing textblock nodes.
 */
export function computeProofreadDecorations(
  doc: PMNode,
  dismissedIds: Set<string>
): { decorations: DecorationSet; issues: ProofreadItem[] } {
  const decorations: Decoration[] = [];
  const issues: ProofreadItem[] = [];

  doc.descendants((node, pos) => {
    // Only analyze textblocks (paragraphs, headings, list items), skipping code blocks
    if (!node.isTextblock || node.type.name === "codeBlock") return;

    const text = node.textContent;
    if (!text || text.trim().length === 0) return;

    const result = analyzeDocument(text);

    for (const sug of result.suggestions) {
      if (dismissedIds.has(sug.id)) continue;

      const from = getDocPos(node, pos, sug.start);
      const to = getDocPos(node, pos, sug.end);

      if (from < to && to <= doc.content.size) {
        const deco = Decoration.inline(from, to, {
          class: `writely-issue writely-issue-${sug.type}`,
          "data-suggestion-id": sug.id,
          "data-issue-type": sug.type,
          "data-original": sug.original,
          "data-replacement": sug.replacement,
        });
        decorations.push(deco);
        issues.push({ suggestion: sug, from, to });
      }
    }
  });

  return {
    decorations: DecorationSet.create(doc, decorations),
    issues,
  };
}

export interface WritelyProofreadOptions {
  enabled?: boolean;
  onHoverIssue?: (issue: ProofreadItem | null, event?: MouseEvent, domRect?: DOMRect) => void;
  onClickIssue?: (issue: ProofreadItem, event: MouseEvent, domRect: DOMRect) => void;
  onIssuesChange?: (issues: ProofreadItem[]) => void;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    writelyProofread: {
      applyProofreadSuggestion: (issueId: string) => ReturnType;
      dismissProofreadSuggestion: (issueId: string) => ReturnType;
      applyAllProofreadSuggestions: () => ReturnType;
      refreshProofread: () => ReturnType;
    };
  }
}

export const WritelyProofreadExtension = Extension.create<WritelyProofreadOptions>({
  name: "writelyProofread",

  addOptions() {
    return {
      enabled: true,
      onHoverIssue: undefined,
      onClickIssue: undefined,
      onIssuesChange: undefined,
    };
  },

  addCommands() {
    return {
      applyProofreadSuggestion:
        (issueId: string) =>
        ({ tr, dispatch, state }) => {
          const pluginState = writelyProofreadPluginKey.getState(state);
          if (!pluginState) return false;

          const item = pluginState.issues.find((i) => i.suggestion.id === issueId);
          if (!item) return false;

          if (dispatch) {
            tr.insertText(item.suggestion.replacement, item.from, item.to);
            dispatch(tr);
          }
          return true;
        },

      dismissProofreadSuggestion:
        (issueId: string) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(writelyProofreadPluginKey, { type: "DISMISS", issueId });
            dispatch(tr);
          }
          return true;
        },

      applyAllProofreadSuggestions:
        () =>
        ({ tr, dispatch, state }) => {
          const pluginState = writelyProofreadPluginKey.getState(state);
          if (!pluginState || pluginState.issues.length === 0) return false;

          if (dispatch) {
            // Apply right-to-left so earlier offsets remain accurate
            const sorted = [...pluginState.issues].sort((a, b) => b.from - a.from);
            for (const item of sorted) {
              tr.insertText(item.suggestion.replacement, item.from, item.to);
            }
            dispatch(tr);
          }
          return true;
        },

      refreshProofread:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(writelyProofreadPluginKey, { type: "FORCE_REFRESH" });
            dispatch(tr);
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    return [
      new Plugin<ProofreadPluginState>({
        key: writelyProofreadPluginKey,

        state: {
          init(_, state) {
            if (!options.enabled) {
              return {
                decorations: DecorationSet.empty,
                issues: [],
                dismissedIds: new Set<string>(),
              };
            }
            const dismissed = new Set<string>();
            const computed = computeProofreadDecorations(state.doc, dismissed);
            setTimeout(() => {
              options.onIssuesChange?.(computed.issues);
            }, 0);
            return {
              decorations: computed.decorations,
              issues: computed.issues,
              dismissedIds: dismissed,
            };
          },

          apply(tr, oldState, _oldEditorState, newEditorState) {
            if (!options.enabled) {
              return {
                decorations: DecorationSet.empty,
                issues: [],
                dismissedIds: oldState.dismissedIds,
              };
            }

            const meta = tr.getMeta(writelyProofreadPluginKey);

            if (meta?.type === "UPDATE_RESULTS") {
              const { decorations, issues } = meta;
              options.onIssuesChange?.(issues);
              return {
                decorations,
                issues,
                dismissedIds: oldState.dismissedIds,
              };
            }

            if (meta?.type === "DISMISS") {
              const newDismissed = new Set(oldState.dismissedIds);
              newDismissed.add(meta.issueId);
              const computed = computeProofreadDecorations(newEditorState.doc, newDismissed);
              options.onIssuesChange?.(computed.issues);
              return {
                decorations: computed.decorations,
                issues: computed.issues,
                dismissedIds: newDismissed,
              };
            }

            if (meta?.type === "FORCE_REFRESH") {
              const computed = computeProofreadDecorations(newEditorState.doc, oldState.dismissedIds);
              options.onIssuesChange?.(computed.issues);
              return {
                decorations: computed.decorations,
                issues: computed.issues,
                dismissedIds: oldState.dismissedIds,
              };
            }

            // Document changed: map existing decorations forward
            if (tr.docChanged) {
              const mappedDecorations = oldState.decorations.map(tr.mapping, tr.doc);
              const mappedIssues: ProofreadItem[] = oldState.issues
                .map((issue) => ({
                  ...issue,
                  from: tr.mapping.map(issue.from),
                  to: tr.mapping.map(issue.to),
                }))
                .filter((issue) => issue.from < issue.to);

              return {
                decorations: mappedDecorations,
                issues: mappedIssues,
                dismissedIds: oldState.dismissedIds,
              };
            }

            return oldState;
          },
        },

        props: {
          decorations(state) {
            return this.getState(state)?.decorations ?? DecorationSet.empty;
          },

          handleDOMEvents: {
            mouseover(view, event) {
              const target = (event.target as HTMLElement)?.closest(".writely-issue") as HTMLElement | null;
              if (target) {
                const id = target.getAttribute("data-suggestion-id");
                const pluginState = writelyProofreadPluginKey.getState(view.state);
                const item = pluginState?.issues.find((i) => i.suggestion.id === id);
                if (item) {
                  options.onHoverIssue?.(item, event, target.getBoundingClientRect());
                }
              }
              return false;
            },

            click(view, event) {
              const target = (event.target as HTMLElement)?.closest(".writely-issue") as HTMLElement | null;
              if (target) {
                const id = target.getAttribute("data-suggestion-id");
                const pluginState = writelyProofreadPluginKey.getState(view.state);
                const item = pluginState?.issues.find((i) => i.suggestion.id === id);
                if (item) {
                  options.onClickIssue?.(item, event, target.getBoundingClientRect());
                }
              }
              return false;
            },
          },
        },

        view() {
          return {
            update(view, prevState) {
              if (!options.enabled) return;

              // If doc changed, trigger debounced full proofread scan
              if (view.state.doc !== prevState.doc) {
                if (debounceTimer) clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                  const state = writelyProofreadPluginKey.getState(view.state);
                  const dismissed = state?.dismissedIds ?? new Set<string>();
                  const { decorations, issues } = computeProofreadDecorations(view.state.doc, dismissed);

                  // Dispatch transaction to update plugin state
                  const tr = view.state.tr.setMeta(writelyProofreadPluginKey, {
                    type: "UPDATE_RESULTS",
                    decorations,
                    issues,
                  });
                  view.dispatch(tr);
                }, 200);
              }
            },

            destroy() {
              if (debounceTimer) clearTimeout(debounceTimer);
            },
          };
        },
      }),
    ];
  },
});
