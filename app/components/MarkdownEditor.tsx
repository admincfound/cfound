'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, List, ListOrdered, Link as LinkIcon,
  Quote, Code, Heading1, Heading2, Heading3, Check, X as XIcon, Unlink,
} from 'lucide-react';

interface MarkdownEditorProps {
  isEditing: boolean;
  value: string; // HTML content
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  hasError?: boolean;
}

// Parses a Tailwind min-h-[Npx] (or min-h-[Nrem]) string into a pixel number.
// Falls back to 300 (the editor's minimum) if it can't be parsed or is smaller.
function parseMinHeightPx(minHeight?: string): number {
  const DEFAULT_MIN = 300;
  if (!minHeight) return DEFAULT_MIN;
  const match = minHeight.match(/min-h-\[(\d+(?:\.\d+)?)(px|rem)?\]/);
  if (!match) return DEFAULT_MIN;
  const value = parseFloat(match[1]);
  const unit = match[2] || 'px';
  const px = unit === 'rem' ? value * 16 : value;
  return Math.max(px, DEFAULT_MIN);
}

// A tiny, unique class per mount so scoped <style> rules below never leak
// into other editor instances on the same page (multiple descriptions etc).
let instanceCounter = 0;

export default function MarkdownEditor({
  isEditing,
  value,
  onChange,
  placeholder,
  minHeight = 'min-h-[300px]',
  hasError,
}: MarkdownEditorProps) {
  const [scopeClass] = useState(() => `cf-rte-${++instanceCounter}`);
  const minHeightPx = parseMinHeightPx(minHeight);

  const [linkMenuOpen, setLinkMenuOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    editable: isEditing,
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing…',
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep the editor's content in sync if `value` changes from outside
  // (e.g. Cancel button resetting formData) without fighting the user's cursor.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current && (value || '') !== current) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  // Toggle editability if isEditing changes without remounting
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(isEditing);
  }, [isEditing, editor]);

  const openLinkMenu = useCallback(() => {
    if (!editor) return;
    const prevUrl = editor.getAttributes('link').href || '';
    setLinkUrl(prevUrl);
    setLinkMenuOpen(true);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;
    const url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    setLinkMenuOpen(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setLinkMenuOpen(false);
    setLinkUrl('');
  }, [editor]);

  if (!editor) return null;

  const isEmpty = editor.isEmpty;

  // ── VIEW MODE ────────────────────────────────────────────────────────────
  if (!isEditing) {
    if (isEmpty) {
      return <p className="text-sm text-gray-400 italic">{placeholder || 'Nothing added yet.'}</p>;
    }
    return (
      <div className={`cf-rte-view ${scopeClass} text-[15px] sm:text-base text-gray-700 leading-[1.7]`}>
        <EditorContent editor={editor} />
        <style jsx global>{`
          .${scopeClass} .ProseMirror {
            outline: none;
          }
          .${scopeClass} .ProseMirror h1 {
            font-size: 1.5rem;
            font-weight: 800;
            color: #111827;
            margin: 1.25rem 0 0.75rem;
          }
          .${scopeClass} .ProseMirror h1:first-child { margin-top: 0; }
          .${scopeClass} .ProseMirror h2 {
            font-size: 1.25rem;
            font-weight: 700;
            color: #111827;
            margin: 1.1rem 0 0.6rem;
          }
          .${scopeClass} .ProseMirror h2:first-child { margin-top: 0; }
          .${scopeClass} .ProseMirror h3 {
            font-size: 1.1rem;
            font-weight: 700;
            color: #111827;
            margin: 1rem 0 0.5rem;
          }
          .${scopeClass} .ProseMirror h3:first-child { margin-top: 0; }
          .${scopeClass} .ProseMirror p {
            color: #374151;
            line-height: 1.7;
            margin: 0.6rem 0;
          }
          .${scopeClass} .ProseMirror p:first-child { margin-top: 0; }
          .${scopeClass} .ProseMirror p:last-child { margin-bottom: 0; }
          .${scopeClass} .ProseMirror strong { font-weight: 700; color: #111827; }
          .${scopeClass} .ProseMirror em { font-style: italic; }
          .${scopeClass} .ProseMirror ul {
            margin: 0.75rem 0;
            padding-left: 1.5rem;
            list-style: disc;
          }
          .${scopeClass} .ProseMirror ol {
            margin: 0.75rem 0;
            padding-left: 1.5rem;
            list-style: decimal;
          }
          .${scopeClass} .ProseMirror li {
            color: #374151;
            line-height: 1.7;
            margin: 0.25rem 0;
          }
          .${scopeClass} .ProseMirror li p { margin: 0; }
          .${scopeClass} .ProseMirror a {
            color: #2563eb;
            font-weight: 500;
            text-decoration: none;
          }
          .${scopeClass} .ProseMirror a:hover { text-decoration: underline; }
          .${scopeClass} .ProseMirror blockquote {
            border-left: 4px solid #bfdbfe;
            background: rgba(239, 246, 255, 0.5);
            padding: 0.25rem 1rem;
            margin: 0.75rem 0;
            color: #4b5563;
            border-radius: 0 0.375rem 0.375rem 0;
          }
          .${scopeClass} .ProseMirror code {
            color: #db2777;
            background: #f3f4f6;
            padding: 0.15rem 0.4rem;
            border-radius: 0.25rem;
            font-size: 0.9em;
            font-weight: 600;
          }
        `}</style>
      </div>
    );
  }

  // ── EDIT MODE ────────────────────────────────────────────────────────────
  const ToolbarButton = ({
    onClick,
    active,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()} // keep editor focus/selection
      onClick={onClick}
      className={`p-2 rounded-lg transition-all active:scale-95 ${
        active ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-100/70'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div
      className={`flex flex-col rounded-xl border overflow-hidden transition-all bg-white ${
        hasError ? 'border-red-400' : 'border-gray-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100'
      }`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2.5 bg-gray-50 border-b border-gray-200 flex-wrap relative">
        <ToolbarButton
          title="Heading 1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={18} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <ToolbarButton
          title="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={18} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <ToolbarButton
          title="Bullet List"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="Numbered List"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="Blockquote"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="Inline Code"
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code size={18} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <ToolbarButton
          title="Link"
          active={editor.isActive('link')}
          onClick={openLinkMenu}
        >
          <LinkIcon size={18} />
        </ToolbarButton>

        {/* Link dialog */}
        {linkMenuOpen && (
          <div className="absolute top-full left-3 mt-2 z-20 flex items-center gap-2 bg-white border border-gray-200 shadow-lg rounded-xl p-2">
            <input
              autoFocus
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
                if (e.key === 'Escape') { e.preventDefault(); setLinkMenuOpen(false); }
              }}
              placeholder="https://example.com"
              className="w-56 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={applyLink}
              className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              title="Apply link"
            >
              <Check size={15} />
            </button>
            {editor.isActive('link') && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={removeLink}
                className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Remove link"
              >
                <Unlink size={15} />
              </button>
            )}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setLinkMenuOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Cancel"
            >
              <XIcon size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Editable surface */}
      <div className={`cf-rte-edit ${scopeClass}`} style={{ minHeight: `${minHeightPx}px` }}>
        <EditorContent editor={editor} />
      </div>

      <style jsx global>{`
        .${scopeClass} .ProseMirror {
          outline: none;
          min-height: ${minHeightPx}px;
          padding: 1rem 1.25rem;
          font-size: 16px;
          line-height: 1.7;
          color: #111827;
        }
        .${scopeClass} .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .${scopeClass} .ProseMirror h1 {
          font-size: 1.5rem;
          font-weight: 800;
          color: #111827;
          margin: 1rem 0 0.5rem;
        }
        .${scopeClass} .ProseMirror h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0.9rem 0 0.45rem;
        }
        .${scopeClass} .ProseMirror h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: #111827;
          margin: 0.8rem 0 0.4rem;
        }
        .${scopeClass} .ProseMirror p { margin: 0.5rem 0; }
        .${scopeClass} .ProseMirror strong { font-weight: 700; }
        .${scopeClass} .ProseMirror em { font-style: italic; }
        .${scopeClass} .ProseMirror ul {
          margin: 0.6rem 0;
          padding-left: 1.5rem;
          list-style: disc;
        }
        .${scopeClass} .ProseMirror ol {
          margin: 0.6rem 0;
          padding-left: 1.5rem;
          list-style: decimal;
        }
        .${scopeClass} .ProseMirror li { margin: 0.2rem 0; }
        .${scopeClass} .ProseMirror li p { margin: 0; }
        .${scopeClass} .ProseMirror a {
          color: #2563eb;
          font-weight: 500;
          text-decoration: underline;
          text-decoration-color: #bfdbfe;
        }
        .${scopeClass} .ProseMirror blockquote {
          border-left: 4px solid #bfdbfe;
          background: rgba(239, 246, 255, 0.5);
          padding: 0.25rem 1rem;
          margin: 0.6rem 0;
          color: #4b5563;
          border-radius: 0 0.375rem 0.375rem 0;
        }
        .${scopeClass} .ProseMirror code {
          color: #db2777;
          background: #f3f4f6;
          padding: 0.15rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.9em;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}