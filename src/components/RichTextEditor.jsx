import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import TiptapImage from '@tiptap/extension-image';
import { useEffect, useRef } from 'react';
import {
  Bold, Italic, Strikethrough, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Link2, Image as ImageIcon, Undo2, Redo2, Upload,
} from 'lucide-react';
import { apiClient } from '../services/apiClient.js';

function ToolbarButton({ onClick, active, disabled, label, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', borderRadius: 'var(--radius-sm)', cursor: disabled ? 'not-allowed' : 'pointer',
        background: active ? 'var(--action-primary)' : 'transparent',
        color: active ? 'var(--white)' : 'var(--text-body)',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function EditorToolbar({ editor }) {
  const imgFileRef = useRef(null);
  if (!editor) return null;
  const addLink = () => {
    const url = window.prompt('Nhập URL liên kết:');
    if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };
  const addImage = () => {
    const url = window.prompt('Nhập URL ảnh:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };
  const uploadImage = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await apiClient.upload('/api/admin/plates/upload', fd);
      editor.chain().focus().setImage({ src: res.url }).run();
    } catch (e) {
      // eslint-disable-next-line no-alert
      window.alert(e.message || 'Lỗi tải ảnh lên');
    } finally {
      imgFileRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, padding: '6px 8px', background: 'var(--white)', borderRadius: 'var(--radius-field) var(--radius-field) 0 0', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
      <ToolbarButton label="In đậm" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></ToolbarButton>
      <ToolbarButton label="In nghiêng" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></ToolbarButton>
      <ToolbarButton label="Gạch ngang" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={16} /></ToolbarButton>
      <div style={{ width: 1, background: 'var(--border-hairline)', margin: '4px 4px' }} />
      <ToolbarButton label="Tiêu đề H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={16} /></ToolbarButton>
      <ToolbarButton label="Tiêu đề H3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={16} /></ToolbarButton>
      <div style={{ width: 1, background: 'var(--border-hairline)', margin: '4px 4px' }} />
      <ToolbarButton label="Danh sách" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={16} /></ToolbarButton>
      <ToolbarButton label="Danh sách số" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></ToolbarButton>
      <ToolbarButton label="Trích dẫn" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={16} /></ToolbarButton>
      <ToolbarButton label="Khối mã" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code size={16} /></ToolbarButton>
      <div style={{ width: 1, background: 'var(--border-hairline)', margin: '4px 4px' }} />
      <ToolbarButton label="Chèn liên kết" active={editor.isActive('link')} onClick={addLink}><Link2 size={16} /></ToolbarButton>
      <ToolbarButton label="Chèn ảnh (dán link)" onClick={addImage}><ImageIcon size={16} /></ToolbarButton>
      <ToolbarButton label="Tải ảnh lên" onClick={() => imgFileRef.current?.click()}><Upload size={16} /></ToolbarButton>
      <input ref={imgFileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadImage(e.target.files[0])} style={{ display: 'none' }} />
      <div style={{ flex: 1 }} />
      <ToolbarButton label="Hoàn tác" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={16} /></ToolbarButton>
      <ToolbarButton label="Làm lại" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={16} /></ToolbarButton>
    </div>
  );
}

// Trình soạn thảo rich-text dùng chung (Tiptap) — định dạng sẵn (tiêu đề, đậm/nghiêng, danh sách,
// trích dẫn) + chèn ảnh (dán link hoặc tải lên qua Cloudinary). value/onChange nhận HTML string.
export default function RichTextEditor({ value, onChange, minHeight = 220, placeholder }) {
  const editor = useEditor({
    extensions: [StarterKit, TiptapLink, TiptapImage],
    content: value || '',
    editorProps: placeholder ? { attributes: { 'data-placeholder': placeholder } } : undefined,
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
  });

  // Đồng bộ khi value đổi từ ngoài (VD load lại dữ liệu edit) mà không phải do gõ tại chỗ.
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  return (
    <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)', overflow: 'hidden' }}>
      <EditorToolbar editor={editor} />
      <div style={{ padding: '12px 14px', minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
