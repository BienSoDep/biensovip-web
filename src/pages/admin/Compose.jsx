import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import TiptapImage from '@tiptap/extension-image';
import { useEffect, useState, useRef } from 'react';
import { marked } from 'marked';
import mammoth from 'mammoth';
import {
  Bold, Italic, Strikethrough, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Link2, Image as ImageIcon, Undo2, Redo2, Eye, X, Upload,
} from 'lucide-react';
import Button from '../../components/Button.jsx';
import { Input, Select } from '../../components/index.jsx';
import { apiClient } from '../../services/apiClient.js';
import { useCreateBlogPost, useUpdateBlogPost } from '../../services/blog.js';
import { useAdminPromoVideos } from '../../services/promoVideoService.js';
import { useAdminCategories } from '../../services/categories.js';

function slugify(title) {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 300);
}

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

function EditorToolbar({ editor }) {
  if (!editor) return null;
  const addLink = () => {
    const url = window.prompt('Nhập URL liên kết:');
    if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };
  const addImage = () => {
    const url = window.prompt('Nhập URL ảnh:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
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
      <ToolbarButton label="Chèn ảnh" onClick={addImage}><ImageIcon size={16} /></ToolbarButton>
      <div style={{ flex: 1 }} />
      <ToolbarButton label="Hoàn tác" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={16} /></ToolbarButton>
      <ToolbarButton label="Làm lại" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={16} /></ToolbarButton>
    </div>
  );
}

export default function Compose({ st, patch, notify }) {
  const editPostId = st.editPostId;
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [category, setCategory] = useState('kien-thuc');
  const [tagsInput, setTagsInput] = useState('');
  const [err, setErr] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef(null);

  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const { data: blogCatData } = useAdminCategories('blog_category');
  const categoryOpts = (blogCatData?.items || []).map((c) => ({ value: c.code || c.name, label: c.name }));
  const { data: allVideos } = useAdminPromoVideos();
  const [attachedVideos, setAttachedVideos] = useState([]);
  const [addVideoId, setAddVideoId] = useState('');
  const [videoBusy, setVideoBusy] = useState(false);

  const [, forceEditorUpdate] = useState(0);
  const editor = useEditor({
    extensions: [StarterKit, TiptapLink, TiptapImage],
    content: '',
    onUpdate: () => forceEditorUpdate((n) => n + 1),
  });

  useEffect(() => {
    if (!editPostId || !editor) return;
    apiClient.get(`/api/admin/blog/posts/${editPostId}`).then((full) => {
      setTitle(full.title || '');
      setSlug(full.slug || '');
      setSlugTouched(true);
      setCoverImageUrl(full.coverImageUrl || '');
      setMetaTitle(full.metaTitle || '');
      setMetaDescription(full.metaDescription || '');
      setCategory(full.category || 'kien-thuc');
      setTagsInput((full.tags || []).join(', '));
      if (full.contentHtml) editor.commands.setContent(full.contentHtml);
      setAttachedVideos(full.videos || []);
    });
  }, [editPostId, editor]);

  const attachVideo = async () => {
    if (!editPostId || !addVideoId) return;
    setVideoBusy(true);
    try {
      await apiClient.post(`/api/admin/blog/posts/${editPostId}/videos`, { promoVideoId: addVideoId, displayOrder: attachedVideos.length });
      const video = (allVideos?.items || []).find((v) => v.id === addVideoId);
      if (video) setAttachedVideos((v) => [...v, video]);
      setAddVideoId('');
      notify('Đã gắn video vào bài viết');
    } catch (e) {
      notify(e.message || 'Lỗi khi gắn video');
    } finally {
      setVideoBusy(false);
    }
  };

  const detachVideo = async (videoId) => {
    if (!editPostId) return;
    setVideoBusy(true);
    try {
      await apiClient.delete(`/api/admin/blog/posts/${editPostId}/videos/${videoId}`);
      setAttachedVideos((v) => v.filter((x) => x.id !== videoId));
      notify('Đã gỡ video khỏi bài viết');
    } catch (e) {
      notify(e.message || 'Lỗi khi gỡ video');
    } finally {
      setVideoBusy(false);
    }
  };

  const onTitleChange = (e) => {
    const v = e.target.value;
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const importFileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);

  // Import Markdown (.md) hoặc Word (.docx) — convert sang HTML rồi đổ thẳng vào Tiptap editor.
  // Markdown: dòng H1 đầu tiên (# Tiêu đề) tự điền vào ô Tiêu đề nếu có, phần còn lại thành nội dung.
  // Docx: mammoth convert HTML giữ định dạng cơ bản (heading, bold, list, ảnh base64 nhúng sẵn).
  const onImportFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editor) return;
    setImporting(true);
    try {
      const ext = file.name.toLowerCase().split('.').pop();
      let html;
      if (ext === 'md' || ext === 'markdown') {
        const text = await file.text();
        const h1Match = text.match(/^#\s+(.+)$/m);
        const body = h1Match ? text.replace(h1Match[0], '').trim() : text;
        if (h1Match && !title.trim()) onTitleChange({ target: { value: h1Match[1].trim() } });
        html = await marked.parse(body);
      } else if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        html = result.value;
      } else {
        notify('Chỉ hỗ trợ file .md hoặc .docx');
        return;
      }
      editor.commands.setContent(html);
      notify('Đã import nội dung — kiểm tra lại trước khi lưu.');
    } catch (err) {
      notify(err.message || 'Import thất bại.');
    } finally {
      setImporting(false);
    }
  };

  const onCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await apiClient.upload('/api/admin/plates/upload', formData);
      setCoverImageUrl(result.url);
      notify('Đã tải ảnh lên');
    } catch (e2) {
      notify(e2.message || 'Lỗi khi tải ảnh lên');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const contentHtml = editor?.getHTML() || '';
  const plainText = editor?.getText() || '';
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));
  const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10);

  const submit = (status) => {
    if (!title.trim()) { setErr('Nhập tiêu đề bài viết.'); return; }
    if (status === 'published' && !plainText.trim()) { setErr('Bài viết cần có nội dung để đăng.'); return; }
    setErr('');

    const body = {
      title: title.trim(),
      slug: slug.trim() || null,
      contentHtml,
      coverImageUrl: coverImageUrl.trim() || null,
      metaTitle: metaTitle.trim() || null,
      metaDescription: metaDescription.trim() || null,
      category,
      tags,
      status,
    };

    const onSuccess = () => {
      notify(status === 'draft' ? 'Đã lưu nháp' : (editPostId ? 'Đã cập nhật bài viết' : 'Đã xuất bản bài viết'));
      patch({ screen: 'aposts', editPostId: null });
    };
    const onError = (e) => {
      if (e.code === 'slug_taken') setErr('Đường dẫn này đã được sử dụng, vui lòng chọn slug khác.');
      else setErr(e.message || 'Có lỗi xảy ra.');
    };

    if (editPostId) updatePost.mutate({ id: editPostId, body }, { onSuccess, onError });
    else createPost.mutate(body, { onSuccess, onError });
  };

  const saving = createPost.isPending || updatePost.isPending;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'flex-start', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ flex: '1 1 420px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Input label="Tiêu đề" placeholder="VD: Ngũ quý 99999 — vì sao đắt nhất?" value={title} error={err} onChange={onTitleChange} />
        <Input label="Slug" placeholder="tu-dong-sinh-tu-tieu-de" value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} />
        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Nội dung</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <input ref={importFileInputRef} type="file" accept=".md,.markdown,.docx" onChange={onImportFileChange} style={{ display: 'none' }} id="content-import" />
              <button type="button" onClick={() => importFileInputRef.current?.click()} disabled={importing}
                style={{ display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', cursor: importing ? 'default' : 'pointer', color: 'var(--action-primary)', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', padding: 0 }}>
                <Upload size={14} /> {importing ? 'Đang import…' : 'Import .md/.docx'}
              </button>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{wordCount} từ · ~{readingMinutes} phút đọc</span>
            </div>
          </div>
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)', overflow: 'hidden' }}>
            <EditorToolbar editor={editor} />
            <div style={{ padding: '12px 14px', minHeight: 320 }}>
              <EditorContent editor={editor} />
            </div>
          </div>
        </label>
      </div>
      <div style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Select label="Danh mục" value={category} options={categoryOpts} onChange={setCategory} />

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Ảnh đại diện</span>
            {coverImageUrl && (
              <div style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', aspectRatio: '16/9', background: 'var(--surface-sunken)' }}>
                <img src={coverImageUrl} alt="Ảnh đại diện" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" onClick={() => setCoverImageUrl('')} aria-label="Xóa ảnh" style={{ position: 'absolute', top: 6, right: 6, width: 28, height: 28, border: 'none', borderRadius: '50%', background: 'rgba(0,0,0,.55)', color: 'var(--white)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onCoverFileChange} style={{ display: 'none' }} id="cover-upload" />
              <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()} style={{ flex: 1 }}>{uploading ? 'Đang tải…' : 'Tải ảnh lên'}</Button>
            </div>
            <Input placeholder="hoặc dán URL ảnh trực tiếp" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} />
          </label>

          <Input label="Từ khóa (cách nhau bởi dấu phẩy)" placeholder="phong thủy, biển số đẹp, 68" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {tags.map((t) => (
                <span key={t} style={{ padding: '2px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{t}</span>
              ))}
            </div>
          )}

          <Input label="Meta title (SEO)" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
          <Input label="Meta description (SEO)" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
        </div>

        {editPostId ? (
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Video quảng cáo gắn kèm</span>
            {attachedVideos.length === 0 ? (
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Chưa gắn video nào.</span>
            ) : (
              attachedVideos.map((v) => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ flex: 1, font: 'var(--type-caption)', color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title || v.platform}</span>
                  <button type="button" disabled={videoBusy} onClick={() => detachVideo(v.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--status-danger)' }}>Gỡ</button>
                </div>
              ))
            )}
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Select value={addVideoId} options={(allVideos?.items || []).filter((v) => !attachedVideos.some((a) => a.id === v.id)).map((v) => ({ value: v.id, label: v.title || v.platform }))} onChange={setAddVideoId} style={{ flex: 1 }} />
              <Button variant="outline" size="sm" disabled={!addVideoId || videoBusy} onClick={attachVideo}>Gắn</Button>
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Lưu bài viết trước để gắn video quảng cáo.</span>
          </div>
        )}

        <Button variant="ghost" size="md" onClick={() => setPreviewOpen(true)} disabled={!title.trim()}>
          <Eye size={16} style={{ marginRight: 6 }} />Xem trước
        </Button>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" size="md" disabled={saving} onClick={() => submit('draft')} style={{ flex: 1 }}>Lưu nháp</Button>
          <Button variant="primary" size="md" disabled={saving} onClick={() => submit('published')} style={{ flex: 1 }}>{editPostId ? 'Cập nhật' : 'Xuất bản'}</Button>
        </div>
      </div>

      {previewOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'var(--overlay-scrim)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 18px', overflow: 'auto', animation: 'fadeIn 140ms var(--ease-out)' }}>
          <div style={{ width: '100%', maxWidth: 800, background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', animation: 'modalIn 180ms var(--ease-out)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-6)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
              <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Xem trước bài viết</span>
              <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Đóng" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-body)', padding: 4 }}><X size={22} /></button>
            </div>
            <article style={{ padding: 'var(--space-8) var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ padding: '2px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>{categoryOpts.find((c) => c.value === category)?.label || category}</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>~{readingMinutes} phút đọc</span>
              </div>
              <h1 style={{ margin: 0, font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>{title || 'Chưa có tiêu đề'}</h1>
              {coverImageUrl && (
                <img src={coverImageUrl} alt={title} style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 'var(--radius-card)' }} />
              )}
              <div style={{ font: 'var(--type-body)', fontSize: 17, color: 'var(--text-body)' }} dangerouslySetInnerHTML={{ __html: contentHtml || '<p style="color:var(--text-faint)">Chưa có nội dung.</p>' }} />
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 'var(--space-2)', boxShadow: 'inset 0 1px 0 var(--border-hairline)' }}>
                  {tags.map((t) => <span key={t} style={{ padding: '2px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>#{t}</span>)}
                </div>
              )}
            </article>
          </div>
        </div>
      )}
    </div>
  );
}
