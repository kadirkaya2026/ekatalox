"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Table as TableIcon,
  Undo2,
} from "lucide-react";
import {
  getDescriptionPlainTextLength,
  isHtmlDescription,
  PRODUCT_DESCRIPTION_MAX_PLAIN_TEXT_LENGTH,
} from "@/lib/products/description-html";
import { cn } from "@/lib/utils";

function toEditorContent(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (isHtmlDescription(trimmed)) {
    return trimmed;
  }

  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function normalizeEditorHtml(html: string) {
  return html === "<p></p>" ? "" : html;
}

function toEditorHtml(value: string) {
  const content = toEditorContent(value);
  return content || "<p></p>";
}

function formatCharacterCount(value: number) {
  return new Intl.NumberFormat("tr-TR").format(value);
}

function getPlainTextLengthFromClipboard(text: string) {
  const trimmed = text.trim();

  if (!trimmed) {
    return 0;
  }

  return getDescriptionPlainTextLength(
    trimmed
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
      .join(""),
  );
}

function isAllowedAtCharacterLimit(event: KeyboardEvent) {
  return (
    event.key === "Backspace" ||
    event.key === "Delete" ||
    event.key.startsWith("Arrow") ||
    event.key === "Home" ||
    event.key === "End" ||
    event.key === "Tab" ||
    event.key === "Escape" ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey
  );
}

function ToolbarButton({
  active,
  disabled,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md border text-muted-foreground transition",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:bg-muted",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      {children}
    </button>
  );
}

export function ProductDescriptionEditor({
  value,
  onChange,
  placeholder = "Ürün detayı (vitrinde Detaylar sekmesinde görünür)",
  maxPlainTextLength = PRODUCT_DESCRIPTION_MAX_PLAIN_TEXT_LENGTH,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxPlainTextLength?: number;
}) {
  const onChangeRef = useRef(onChange);
  const maxLengthRef = useRef(maxPlainTextLength);
  const lastValidHtmlRef = useRef(toEditorHtml(value));
  const plainTextLengthRef = useRef(getDescriptionPlainTextLength(value));
  const [plainTextLength, setPlainTextLength] = useState(() =>
    getDescriptionPlainTextLength(value),
  );

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    maxLengthRef.current = maxPlainTextLength;
  }, [maxPlainTextLength]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      TableKit.configure({
        table: {
          resizable: false,
        },
      }),
    ],
    content: toEditorContent(value),
    editorProps: {
      attributes: {
        class:
          "min-h-[280px] px-4 py-3 text-[16px] leading-6 text-foreground outline-none",
      },
      handleKeyDown: (_view, event) => {
        if (plainTextLengthRef.current < maxLengthRef.current) {
          return false;
        }

        if (isAllowedAtCharacterLimit(event)) {
          return false;
        }

        if (event.key === "Enter" || event.key.length === 1) {
          event.preventDefault();
          return true;
        }

        return false;
      },
      handlePaste: (_view, event) => {
        const clipboardText = event.clipboardData?.getData("text/plain") ?? "";

        if (!clipboardText.trim()) {
          return false;
        }

        const pastedLength = getPlainTextLengthFromClipboard(clipboardText);
        const nextLength = plainTextLengthRef.current + pastedLength;

        if (nextLength > maxLengthRef.current) {
          event.preventDefault();
          return true;
        }

        return false;
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      const plainLength = getDescriptionPlainTextLength(html);

      if (plainLength > maxLengthRef.current) {
        currentEditor.commands.setContent(lastValidHtmlRef.current, { emitUpdate: false });
        return;
      }

      const normalized = normalizeEditorHtml(html);
      lastValidHtmlRef.current = normalized || "<p></p>";
      plainTextLengthRef.current = plainLength;
      setPlainTextLength(plainLength);
      onChangeRef.current(normalized);
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextContent = toEditorContent(value);
    const currentHtml = editor.getHTML();
    const normalizedCurrent = normalizeEditorHtml(currentHtml);
    const normalizedNext = nextContent === "<p></p>" ? "" : nextContent;

    if (normalizedCurrent !== normalizedNext) {
      const htmlToSet = nextContent || "<p></p>";
      editor.commands.setContent(htmlToSet, { emitUpdate: false });
      lastValidHtmlRef.current = htmlToSet;
      const length = getDescriptionPlainTextLength(htmlToSet);
      plainTextLengthRef.current = length;
      setPlainTextLength(length);
    }
  }, [editor, value]);

  const isLimitReached = plainTextLength >= maxPlainTextLength;

  if (!editor) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <div className="min-h-[280px] px-4 py-3 text-sm text-muted-foreground">{placeholder}</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap gap-1 border-b border-border bg-muted/50 p-2">
          <ToolbarButton
            label="Kalın"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="İtalik"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Başlık 2"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Başlık 3"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Madde listesi"
            active={editor.isActive("bulletList")}
            disabled={isLimitReached}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Numaralı liste"
            active={editor.isActive("orderedList")}
            disabled={isLimitReached}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Tablo ekle"
            disabled={isLimitReached}
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            <TableIcon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Geri al"
            disabled={!editor.can().chain().focus().undo().run()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Yinele"
            disabled={!editor.can().chain().focus().redo().run()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 className="size-4" />
          </ToolbarButton>
        </div>

        <EditorContent
          editor={editor}
          className="[&_.ProseMirror]:min-h-[280px] [&_.ProseMirror_table]:my-3 [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-border [&_.ProseMirror_td]:px-2 [&_.ProseMirror_td]:py-1.5 [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-border [&_.ProseMirror_th]:bg-muted [&_.ProseMirror_th]:px-2 [&_.ProseMirror_th]:py-1.5 [&_.ProseMirror_th]:text-left [&_.ProseMirror_th]:font-semibold"
        />
      </div>

      <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <span>{placeholder}</span>
        <div className="flex flex-col items-start gap-0.5 sm:items-end">
          <span className={cn(isLimitReached && "font-medium text-amber-700")}>
            {formatCharacterCount(plainTextLength)} /{" "}
            {formatCharacterCount(maxPlainTextLength)} karakter
          </span>
          {isLimitReached ? (
            <span className="font-medium text-amber-700">Karakter limitine ulaşıldı</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
