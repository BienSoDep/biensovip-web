import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import TiptapImage from '@tiptap/extension-image';
import { useEffect, useRef, useState } from 'react';
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
        width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', borderRadius: 'var(--radius-sm)', cursor: disabled ? 'not-allowed' : 'pointer',
        background: active ? 'var(--action-primary)' : 'transparent',
        color: active ? 'var(--text-inverse)' : 'var(--text-body)',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

const URL_ERROR = 'Vui lòng nhập URL hợp lệ (bắt đầu bằng http:// hoặc https://)';

export function EditorToolbar({ editor }) {
  const imgFileRef = useRef(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imgOpen, setImgOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState('');
  const [error, setError] = useState('');
  if (!editor) return null;

  const submitLink = (e) => {
    e.preventDefault();
    if (!/^https?:\/\//.test(linkUrl)) { setError(URL_ERROR); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    setLinkUrl(''); setLinkOpen(false); setError('');
  };
  const submitImage = (e) => {
    e.preventDefault();
    if (!/^https?:\/\//.test(imgUrl)) { setError(URL_ERROR); return; }
    editor.chain().focus().setImage({ src: imgUrl }).run();
    setImgUrl(''); setImgOpen(false); setError('');
  };
  const uploadImage = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await apiClient.upload('/api/admin/plates/upload', fd);
      editor.chain().focus().setImage({ src: res.url }).run();
      setError('');
    } catch (e) {
      setError(e.message || 'Lỗi tải ảnh lên');
    } finally {
      imgFileRef.current.value = '';
    }
  };

  const rowStyle = { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px 6px' };
  const fieldStyle = { flex: 1, padding: '6px 10px', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)', font: 'var(--type-body-sm)', background: 'var(--surface-sunken)' };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, padding: '6px 8px', background: 'var(--surface-card)', borderRadius: 'var(--radius-field) var(--radius-field) 0 0', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
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
      <ToolbarButton label="Chèn liên kết" active={editor.isActive('link')} onClick={() => { setImgOpen(false); setLinkOpen((v) => !v); setError(''); }}><Link2 size={16} /></ToolbarButton>
      <ToolbarButton label="Chèn ảnh (dán link)" onClick={() => { setLinkOpen(false); setImgOpen((v) => !v); setError(''); }}><ImageIcon size={16} /></ToolbarButton>
      <ToolbarButton label="Tải ảnh lên" onClick={() => imgFileRef.current?.click()}><Upload size={16} /></ToolbarButton>
      <input ref={imgFileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadImage(e.target.files[0])} style={{ display: 'none' }} />
      {linkOpen && (
        <form onSubmit={submitLink} style={rowStyle} aria-label="Chèn liên kết">
          <input autoFocus value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." aria-label="URL liên kết" style={fieldStyle} />
          <button type="submit" className="btn btn-sm btn-primary">Chèn</button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setLinkOpen(false); setError(''); }}>Huỷ</button>
        </form>
      )}
      {imgOpen && (
        <form onSubmit={submitImage} style={rowStyle} aria-label="Chèn ảnh bằng link">
          <input autoFocus value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} placeholder="https://.../anh.png" aria-label="URL ảnh" style={fieldStyle} />
          <button type="submit" className="btn btn-sm btn-primary">Chèn</button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setImgOpen(false); setError(''); }}>Huỷ</button>
        </form>
      )}
      {error && <div role="alert" style={{ width: '100%', padding: '2px 8px 4px', font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{error}</div>}
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
