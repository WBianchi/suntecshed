"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import { cn } from "@/lib/utils";
import {
  FiBold,
  FiItalic,
  FiList,
  FiLink,
  FiType,
  FiX,
} from "react-icons/fi";
import { Strikethrough } from "lucide-react";
import { useEffect, useCallback, useState, useRef } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Digite o conteúdo...",
  className,
  minHeight = "200px",
}: RichTextEditorProps) {
  const [linkPopover, setLinkPopover] = useState<{
    open: boolean;
    x: number;
    y: number;
    href: string;
  }>({ open: false, x: 0, y: 0, href: "" });
  const linkInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none min-h-[var(--min-h)] px-3 py-2.5",
          "text-sm text-gray-900"
        ),
        style: `--min-h: ${minHeight}`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const isEmpty =
        html === "<p></p>" ||
        html === "<h2></h2>" ||
        html === "<h3></h3>";
      onChange(isEmpty ? "" : html);
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      const { from, to } = editor.state.selection;
      editor.commands.setContent(value, { emitUpdate: false });
      try {
        editor.commands.setTextSelection({
          from: Math.min(from, editor.state.doc.content.size),
          to: Math.min(to, editor.state.doc.content.size),
        });
      } catch {}
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const { href } = linkPopover;
    if (href === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const url = href.startsWith("http") ? href : `https://${href}`;
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
    setLinkPopover({ open: false, x: 0, y: 0, href: "" });
  }, [editor, linkPopover]);

  const openLinkPopover = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href || "";
    setLinkPopover({
      open: true,
      x: 0,
      y: 40,
      href: previousUrl,
    });
    setTimeout(() => linkInputRef.current?.focus(), 50);
  }, [editor]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && linkPopover.open) {
        setLinkPopover({ open: false, x: 0, y: 0, href: "" });
        editor?.commands.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [linkPopover.open, editor]);

  if (!editor) {
    return (
      <div
        className={cn(
          "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-400",
          className
        )}
        style={{ minHeight }}
      >
        Carregando editor...
      </div>
    );
  }

  const buttonClass = (active: boolean) =>
    cn(
      "flex h-7 w-7 items-center justify-center rounded text-xs transition-colors",
      active
        ? "bg-primary/10 text-primary"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
    );

  return (
    <div
      className={cn(
        "relative w-full rounded-xl border border-gray-200 bg-white transition-colors",
        "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-100 px-2 py-1.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={buttonClass(editor.isActive("bold"))}
          title="Negrito"
        >
          <FiBold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={buttonClass(editor.isActive("italic"))}
          title="Itálico"
        >
          <FiItalic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={buttonClass(editor.isActive("strike"))}
          title="Tachado"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </button>

        <div className="mx-1 h-4 w-px bg-gray-200" />

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={buttonClass(editor.isActive("heading", { level: 2 }))}
          title="Título"
        >
          <span className="text-[11px] font-bold">H2</span>
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={buttonClass(editor.isActive("heading", { level: 3 }))}
          title="Subtítulo"
        >
          <span className="text-[11px] font-bold">H3</span>
        </button>

        <div className="mx-1 h-4 w-px bg-gray-200" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={buttonClass(editor.isActive("bulletList"))}
          title="Lista com marcadores"
        >
          <FiList className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={buttonClass(editor.isActive("orderedList"))}
          title="Lista numerada"
        >
          <FiType className="h-3.5 w-3.5" />
        </button>

        <div className="mx-1 h-4 w-px bg-gray-200" />

        <div className="relative">
          <button
            type="button"
            onClick={openLinkPopover}
            className={buttonClass(editor.isActive("link"))}
            title="Inserir link"
          >
            <FiLink className="h-3.5 w-3.5" />
          </button>
          {linkPopover.open && (
            <div
              className="absolute left-0 top-full z-50 flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                ref={linkInputRef}
                type="url"
                value={linkPopover.href}
                onChange={(e) =>
                  setLinkPopover((prev) => ({
                    ...prev,
                    href: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") setLink();
                  if (e.key === "Escape")
                    setLinkPopover({ open: false, x: 0, y: 0, href: "" });
                }}
                placeholder="https://..."
                className="h-7 w-52 rounded-md border border-gray-200 px-2 text-xs outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={setLink}
                className="rounded-md bg-primary px-2 py-1 text-[10px] font-semibold text-white hover:bg-primary/90"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => {
                  setLinkPopover({ open: false, x: 0, y: 0, href: "" });
                  if (editor.isActive("link")) {
                    editor.chain().focus().unsetLink().run();
                  }
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100"
              >
                <FiX className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className="[&_.ProseMirror]:focus:outline-none [&_.ProseMirror]:min-h-[var(--min-h)] [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2.5 [&_.ProseMirror]:text-sm [&_.ProseMirror]:text-gray-900"
        style={{ ["--min-h" as string]: minHeight }}
      />
    </div>
  );
}
