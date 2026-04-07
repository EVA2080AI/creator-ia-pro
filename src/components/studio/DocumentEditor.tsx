import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, 
  List, ListOrdered, Quote, Undo, Redo, Save, X, Loader2
} from 'lucide-react';
import React, { useState } from 'react';

interface DocumentEditorProps {
  initialContent: string;
  onSave: (content: string) => Promise<void>;
  onClose: () => void;
  title?: string;
  isSaving?: boolean;
}

export const DocumentEditor = ({ initialContent, onSave, onClose, title = "Documento sin título", isSaving }: DocumentEditorProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [docTitle, setDocTitle] = useState(title);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Empieza a escribir tu obra maestra...',
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-zinc prose-sm sm:prose-base focus:outline-none max-w-none min-h-[60vh] py-8 px-4',
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-zinc-200">
      
      {/* ── Toolbar / Header ── */}
      <div className="h-16 shrink-0 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between px-4 sticky top-0 z-10">
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-zinc-200 text-zinc-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="hidden sm:flex items-center gap-1 bg-white border border-zinc-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${editor.isActive('bold') ? 'bg-primary/10 text-primary' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${editor.isActive('italic') ? 'bg-primary/10 text-primary' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${editor.isActive('strike') ? 'bg-primary/10 text-primary' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
            >
              <Strikethrough className="h-4 w-4" />
            </button>
            
            <div className="w-px h-5 bg-zinc-200 mx-1" />
            
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold font-serif ${editor.isActive('heading', { level: 1 }) ? 'bg-primary/10 text-primary' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
            >
              H1
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold font-serif ${editor.isActive('heading', { level: 2 }) ? 'bg-primary/10 text-primary' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
            >
              H2
            </button>
            
            <div className="w-px h-5 bg-zinc-200 mx-1" />

            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${editor.isActive('bulletList') ? 'bg-primary/10 text-primary' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${editor.isActive('orderedList') ? 'bg-primary/10 text-primary' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${editor.isActive('blockquote') ? 'bg-primary/10 text-primary' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
            >
              <Quote className="h-4 w-4" />
            </button>

            <div className="w-px h-5 bg-zinc-200 mx-1" />
            
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
            >
              <Redo className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 justify-center max-w-xs mx-4">
          <input 
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            className="w-full text-center text-sm font-bold bg-transparent border-none focus:ring-0 text-zinc-600 focus:text-zinc-900"
            placeholder="Título del documento"
            readOnly
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSave(editor.getHTML())}
            disabled={isSaving}
            className="h-10 px-5 rounded-xl bg-primary text-white text-[13px] font-bold shadow-sm transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95 flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
      
      {/* ── Editor Area ── */}
      <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-4 md:p-10 hide-scrollbar">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-zinc-100 min-h-full">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};
