import { useEffect, useRef, useState, useCallback, type MutableRefObject } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { cn } from "../lib/utils";
import { createMentionExtension } from "./RichTextEditorMention";
import type { MentionPerson } from "../../utils/mentionMarkdown";
import {
  WritelyProofreadExtension,
  type ProofreadItem,
} from "./RichTextEditorProofread";
import { RichTextEditorSuggestionCard } from "./RichTextEditorSuggestionCard";
import { addToUserDictionary } from "../../proofread/spell";
import { globalSentenceCache } from "../../proofread/cache";

interface RichTextEditorProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  editorRef?: MutableRefObject<Editor | null>;
  /** Enables @mention tagging with these people as suggestions. */
  mentionPeople?: MentionPerson[];
  /** Enables real-time Grammarly-style proofreading inline underlines. Defaults to true. */
  proofreadEnabled?: boolean;
  /** Callback notified when active proofreading issues change. */
  onIssuesChange?: (issues: ProofreadItem[]) => void;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  editorRef,
  mentionPeople,
  proofreadEnabled = true,
  onIssuesChange,
}: RichTextEditorProps) {
  const internalValueRef = useRef(value);
  const suppressUpdateRef = useRef(false);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [activeIssue, setActiveIssue] = useState<{
    item: ProofreadItem;
    rect: DOMRect;
  } | null>(null);

  // Mention support is decided at mount; the ref keeps suggestions current
  // without rebuilding the editor when the people list changes.
  const mentionPeopleRef = useRef(mentionPeople);
  useEffect(() => {
    mentionPeopleRef.current = mentionPeople;
  }, [mentionPeople]);
  const withMentions = useRef(mentionPeople != null).current;

  // Stable callbacks for proofread extension
  const onIssuesChangeRef = useRef(onIssuesChange);
  useEffect(() => {
    onIssuesChangeRef.current = onIssuesChange;
  }, [onIssuesChange]);

  const handleHoverIssue = useCallback((item: ProofreadItem | null, _e?: MouseEvent, domRect?: DOMRect) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    if (item && domRect) {
      setActiveIssue({ item, rect: domRect });
    }
  }, []);

  const handleClickIssue = useCallback((item: ProofreadItem, _e: MouseEvent, domRect: DOMRect) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setActiveIssue({ item, rect: domRect });
  }, []);

  const editor = useEditor({
    extensions: [
      ...(withMentions ? [createMentionExtension(() => mentionPeopleRef.current ?? [])] : []),
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: placeholder || "",
        emptyEditorClass: "is-editor-empty",
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      WritelyProofreadExtension.configure({
        enabled: proofreadEnabled && !disabled,
        onHoverIssue: handleHoverIssue,
        onClickIssue: handleClickIssue,
        onIssuesChange: (issues) => {
          onIssuesChangeRef.current?.(issues);
        },
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      if (suppressUpdateRef.current) return;

      const md = (ed.storage as any).markdown.getMarkdown() as string;
      internalValueRef.current = md;
      onChange?.(md);
    },
    editorProps: {
      attributes: {
        class: "rich-text-editor-content",
      },
    },
  });

  useEffect(() => {
    if (editorRef) editorRef.current = editor;
    return () => {
      if (editorRef) editorRef.current = null;
    };
  }, [editor, editorRef]);

  // Sync external value changes (e.g. dictation, programmatic updates)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (value === internalValueRef.current) return;

    internalValueRef.current = value;
    suppressUpdateRef.current = true;

    const { from, to } = editor.state.selection;
    editor.commands.setContent(value);

    // Restore cursor position within bounds
    const docSize = editor.state.doc.content.size;
    const safeFrom = Math.min(from, docSize);
    const safeTo = Math.min(to, docSize);
    editor.commands.setTextSelection({ from: safeFrom, to: safeTo });

    suppressUpdateRef.current = false;
  }, [value, editor]);

  // Sync editable state
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(!disabled, false);
    }
  }, [disabled, editor]);

  // Close popup on window scroll or resize
  useEffect(() => {
    if (!activeIssue) return;
    const handleScrollOrResize = () => {
      setActiveIssue(null);
    };
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [activeIssue]);

  const handleClick = useCallback(() => {
    if (editor && !editor.isFocused && !disabled) {
      editor.commands.focus();
    }
  }, [editor, disabled]);

  const handleCardMouseEnter = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setActiveIssue(null);
    }, 250);
  }, []);

  const handleEditorMouseLeave = useCallback((e: React.MouseEvent) => {
    const toElement = e.relatedTarget as HTMLElement | null;
    // Don't close if moving into the popup card
    if (toElement?.closest?.(".fixed.z-\\[9999\\]")) return;

    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setActiveIssue(null);
    }, 300);
  }, []);

  const handleAcceptSuggestion = useCallback(
    (sug: any) => {
      if (!editor || editor.isDestroyed) return;
      editor.commands.applyProofreadSuggestion(sug.id);
      setActiveIssue(null);
    },
    [editor]
  );

  const handleDismissSuggestion = useCallback(
    (sug: any) => {
      if (!editor || editor.isDestroyed) return;
      editor.commands.dismissProofreadSuggestion(sug.id);
      setActiveIssue(null);
    },
    [editor]
  );

  const handleAddToDictionary = useCallback(
    (word: string) => {
      addToUserDictionary(word);
      globalSentenceCache.clear();
      if (editor && !editor.isDestroyed) {
        editor.commands.refreshProofread();
      }
      setActiveIssue(null);
    },
    [editor]
  );

  return (
    <div
      className={cn("relative w-full h-full", className)}
      onClick={handleClick}
      onMouseLeave={handleEditorMouseLeave}
    >
      <EditorContent
        editor={editor}
        className={cn(
          "h-full overflow-y-auto",
          disabled && "pointer-events-none opacity-70",
          // Reserved by an ancestor via --floating-inset; 0 elsewhere.
          "pb-[var(--floating-inset,0px)]"
        )}
      />

      {activeIssue && (
        <RichTextEditorSuggestionCard
          suggestion={activeIssue.item.suggestion}
          anchorRect={activeIssue.rect}
          onAccept={handleAcceptSuggestion}
          onDismiss={handleDismissSuggestion}
          onAddToDictionary={handleAddToDictionary}
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
        />
      )}
    </div>
  );
}
