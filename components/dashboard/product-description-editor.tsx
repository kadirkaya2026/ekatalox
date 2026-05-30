"use client";

import { useEffect, useMemo } from "react";
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
        "inline-flex size-8 items-center justify-center rounded-md border text-slate-600 transition",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white hover:bg-slate-50",
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
          "min-h-[280px] px-4 py-3 text-[16px] leading-6 text-slate-900 outline-none",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      const plainLength = getDescriptionPlainTextLength(html);

      if (plainLength > maxPlainTextLength) {
        return;
      }

      onChange(html === "<p></p>" ? "" : html);
    },
  });

  const plainTextLength = useMemo(
    () => getDescriptionPlainTextLength(value),
    [value],
  );

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextContent = toEditorContent(value);
    const currentHtml = editor.getHTML();
    const normalizedCurrent =
      currentHtml === "<p></p>" ? "" : currentHtml;
    const normalizedNext = nextContent === "<p></p>" ? "" : nextContent;

    if (normalizedCurrent !== normalizedNext) {
      editor.commands.setContent(nextContent || "<p></p>", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="min-h-[280px] px-4 py-3 text-sm text-slate-400">{placeholder}</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap gap-1 border-b border-slate-100 bg-slate-50 p-2">
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
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Numaralı liste"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Tablo ekle"
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
          className="[&_.ProseMirror]:min-h-[280px] [&_.ProseMirror_table]:my-3 [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-slate-200 [&_.ProseMirror_td]:px-2 [&_.ProseMirror_td]:py-1.5 [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-slate-200 [&_.ProseMirror_th]:bg-slate-100 [&_.ProseMirror_th]:px-2 [&_.ProseMirror_th]:py-1.5 [&_.ProseMirror_th]:text-left [&_.ProseMirror_th]:font-semibold"
        />
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>{placeholder}</span>
        <span
          className={cn(
            plainTextLength > maxPlainTextLength && "font-medium text-amber-700",
          )}
        >
          {plainTextLength} / {maxPlainTextLength}
        </span>
      </div>
    </div>
  );
}
