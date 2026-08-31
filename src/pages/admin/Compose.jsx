import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import TiptapImage from '@tiptap/extension-image';
import { useEffect, useState, useRef } from 'react';
import { marked } from 'marked';
import mammoth from 'mammoth';
import { Eye, X, Upload } from 'lucide-react';
import Button from '../../components/Button.jsx';
import { Input, Select, InfoTip } from '../../components/index.jsx';
import { EditorToolbar } from '../../components/RichTextEditor.jsx';
import Modal from '../../components/Modal.jsx';
import BlogVersionHistoryModal from '../../components/BlogVersionHistoryModal.jsx';
import { apiClient } from '../../services/apiClient.js';
import { useCreateBlogPost, useUpdateBlogPost, useAdminBlogTags, useCreateBlogTag, checkBlogPostVersion } from '../../services/blog.js';
import { useAdminPromoVideos, useCreatePromoVideo } from '../../services/promoVideoService.js';
import { useAdminCategories } from '../../services/categories.js';
import { setComposeDirty, resetComposeDirty } from '../../lib/unsavedGuard.js';

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


export default function Compose({ st, patch, notify }) {
  const editPostId = st.editPostId;
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [category, setCategory] = useState('kien-thuc');
  const [scheduledPublishAt, setScheduledPublishAt] = useState('');
  const [loadedUpdatedAt, setLoadedUpdatedAt] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [tags, setTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [err, setErr] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const fileInputRef = useRef(null);
  const previewCloseRef = useRef(null);
  // Ảnh trạng thái "đã lưu" để so sánh phát hiện thay đổi chưa lưu (unsaved-changes guard).
  const savedRef = useRef({ title: '', slug: '', coverImageUrl: '', metaTitle: '', metaDescription: '', category: 'kien-thuc', tags: [], contentHtml: '' });

  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const { data: blogCatData } = useAdminCategories('blog_category');
  const categoryOpts = (blogCatData?.items || []).map((c) => ({ value: c.code || c.name, label: c.name }));
  const { data: allVideos } = useAdminPromoVideos();
  const createVideo = useCreatePromoVideo();
  const { data: allTagsData } = useAdminBlogTags();
  const createTag = useCreateBlogTag();
  const [attachedVideos, setAttachedVideos] = useState([]);
  // Video chờ gắn khi tạo bài mới — sau khi create xong (có id) mới attach vào bài.
  const [pendingAttach, setPendingAttach] = useState([]);
  const [addVideoId, setAddVideoId] = useState('');
  const [videoBusy, setVideoBusy] = useState(false);
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [tiktokBusy, setTiktokBusy] = useState(false);
  const [tiktokErr, setTiktokErr] = useState('');

  const [, forceEditorUpdate] = useState(0);
  const editor = useEditor({
    extensions: [StarterKit, TiptapLink, TiptapImage],
    content: '',
    onUpdate: () => forceEditorUpdate((n) => n + 1),
  });

  const loadPost = () => {
    if (!editPostId || !editor) return;
    apiClient.get(`/api/admin/blog/posts/${editPostId}`).then((full) => {
      setTitle(full.title || '');
      setSlug(full.slug || '');
      setSlugTouched(true);
      setCoverImageUrl(full.coverImageUrl || '');
      setMetaTitle(full.metaTitle || '');
      setMetaDescription(full.metaDescription || '');
      setCategory(full.category || 'kien-thuc');
      setScheduledPublishAt(full.scheduledPublishAt ? full.scheduledPublishAt.slice(0, 16) : '');
      setLoadedUpdatedAt(full.updatedAt || null);
      setTags(full.tags || []);
      if (full.contentHtml) editor.commands.setContent(full.contentHtml);
      setAttachedVideos(full.videos || []);
      savedRef.current = {
        title: full.title || '', slug: full.slug || '', coverImageUrl: full.coverImageUrl || '',
        metaTitle: full.metaTitle || '', metaDescription: full.metaDescription || '',
        category: full.category || 'kien-thuc', tags: full.tags || [], contentHtml: full.contentHtml || '',
      };
    });
  };

  useEffect(() => {
    loadPost();
  }, [editPostId, editor]);

  // Unsaved-changes guard: cảnh báo trước khi đóng/refresh trình duyệt khi có thay đổi chưa lưu.
  const isDirty = () => {
    const s = savedRef.current;
    const c = {
      title, slug, coverImageUrl, metaTitle, metaDescription, category, tags,
      contentHtml: editor?.getHTML() || '',
    };
    return c.title !== s.title || c.slug !== s.slug || c.coverImageUrl !== s.coverImageUrl ||
      c.metaTitle !== s.metaTitle || c.metaDescription !== s.metaDescription || c.category !== s.category ||
      c.tags.length !== (s.tags || []).length || c.tags.some((t, i) => t !== (s.tags || [])[i]) ||
      c.contentHtml !== (s.contentHtml || '');
  };

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!isDirty()) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  });

  // Preview modal a11y: focus nút đóng + Esc đóng.
  useEffect(() => {
    if (!previewOpen) return;
    previewCloseRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); setPreviewOpen(false); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [previewOpen]);

  // Route-guard trong-SPA: đăng ký trạng thái dirty cho App/usePathRouter chặn rời trang.
  useEffect(() => { setComposeDirty(isDirty()); });

  const attachVideo = async () => {
    if (!addVideoId) return;
    setVideoBusy(true);
    try {
      const video = (allVideos?.items || []).find((v) => v.id === addVideoId);
      if (!video) return;
      if (editPostId) {
        await apiClient.post(`/api/admin/blog/posts/${editPostId}/videos`, { promoVideoId: addVideoId, displayOrder: attachedVideos.length });
      } else {
        setPendingAttach((p) => [...p, addVideoId]);
      }
      setAttachedVideos((v) => [...v, video]);
      setAddVideoId('');
      notify(editPostId ? 'Đã gắn video vào bài viết' : 'Đã thêm video — sẽ gắn vào bài sau khi lưu');
    } catch (e) {
      notify(e.message || 'Lỗi khi gắn video');
    } finally {
      setVideoBusy(false);
    }
  };

  const detachVideo = async (videoId) => {
    setVideoBusy(true);
    try {
      if (editPostId) await apiClient.delete(`/api/admin/blog/posts/${editPostId}/videos/${videoId}`);
      else setPendingAttach((p) => p.filter((id) => id !== videoId));
      setAttachedVideos((v) => v.filter((x) => x.id !== videoId));
      notify('Đã gỡ video khỏi bài viết');
    } catch (e) {
      notify(e.message || 'Lỗi khi gỡ video');
    } finally {
      setVideoBusy(false);
    }
  };

  // Dán link TikTok → hệ thống tự tạo video trong thư viện + gắn thẳng vào bài viết.
  const attachByUrl = async () => {
    const url = tiktokUrl.trim();
    if (!url) { setTiktokErr('Dán link TikTok vào ô bên trên.'); return; }
    setTiktokBusy(true);
    setTiktokErr('');
    try {
      const created = await createVideo.mutateAsync({ videoUrl: url, title: null });
      if (editPostId) {
        await apiClient.post(`/api/admin/blog/posts/${editPostId}/videos`, { promoVideoId: created.id, displayOrder: attachedVideos.length });
      } else {
        setPendingAttach((p) => [...p, created.id]);
      }
      setAttachedVideos((prev) => [...prev, created]);
      setTiktokUrl('');
      notify(editPostId ? 'Đã thêm video từ link' : 'Đã thêm video từ link — sẽ gắn vào bài sau khi lưu');
    } catch (e) {
      if (e.code === 'invalid_url') setTiktokErr('Link không hợp lệ — dán link TikTok dạng https://www.tiktok.com/@…/video/…');
      else if (e.code === 'duplicate') setTiktokErr('Video này đã tồn tại trong thư viện.');
      else setTiktokErr(e.message || 'Lỗi khi thêm video.');
    } finally {
      setTiktokBusy(false);
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
  // Kho hashtag dùng chung (bảng blog_tags) — chọn lại hoặc gõ tạo mới, không gõ tay tự do nữa.
  const tagPool = allTagsData?.items || [];
  const currentTagsLower = new Set(tags.map((t) => t.toLowerCase()));
  const availableTags = tagPool.filter((t) => !currentTagsLower.has(t.toLowerCase()));

  const toggleTag = (t) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t].slice(0, 10)));
  const removeTag = (t) => setTags((cur) => cur.filter((x) => x !== t));
  const createNewTag = async () => {
    const name = newTagInput.trim();
    if (!name || tags.length >= 10) return;
    if (!tagPool.some((t) => t.toLowerCase() === name.toLowerCase())) {
      try { await createTag.mutateAsync(name); } catch { /* vẫn thêm vào bài viết dù kho lưu lỗi */ }
    }
    setTags((cur) => (cur.some((t) => t.toLowerCase() === name.toLowerCase()) ? cur : [...cur, name]));
    setNewTagInput('');
  };

  // Xuất bản / Cập nhật (bài công khai) — xác nhận trước khi đưa lên public.
  const publish = () => {
    if (!title.trim()) { setErr({ field: 'title', message: 'Nhập tiêu đề bài viết.' }); return; }
    if (!plainText.trim()) { setErr({ field: 'content', message: 'Bài viết cần có nội dung để đăng.' }); return; }
    setErr(null);
    setConfirmPublish(true);
  };

  const submit = async (status) => {
    if (!title.trim()) { setErr({ field: 'title', message: 'Nhập tiêu đề bài viết.' }); return; }
    if (status === 'published' && !plainText.trim()) { setErr({ field: 'content', message: 'Bài viết cần có nội dung để đăng.' }); return; }
    setErr(null);

    if (editPostId && loadedUpdatedAt) {
      try {
        const conflict = await checkBlogPostVersion(editPostId, loadedUpdatedAt);
        if (conflict) {
          notify('Bài viết đã bị sửa bởi người khác — tải lại trang trước khi lưu để tránh ghi đè.');
          return;
        }
      } catch { /* version-check lỗi mạng — không chặn lưu, chỉ là cảnh báo phụ */ }
    }

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
      scheduledPublishAt: status === 'draft' && scheduledPublishAt ? new Date(scheduledPublishAt).toISOString() : null,
    };

    const onSuccess = async (data) => {
      // Bài mới: sau khi create xong mới có id → gắn các video đã chọn trước đó.
      if (!editPostId && pendingAttach.length) {
        const newId = data?.id;
        if (newId) {
          try {
            await Promise.all(pendingAttach.map((pv, i) =>
              apiClient.post(`/api/admin/blog/posts/${newId}/videos`, { promoVideoId: pv, displayOrder: i })
            ));
          } catch (e) {
            notify(e.message || 'Lỗi khi gắn video sau khi lưu');
          }
        }
      }
      notify(status === 'draft' ? 'Đã lưu nháp' : (editPostId ? 'Đã cập nhật bài viết' : 'Đã xuất bản bài viết'));
      resetComposeDirty();
      patch({ screen: 'aposts', editPostId: null });
    };
    const onError = (e) => {
      if (e.code === 'slug_taken') setErr({ field: 'slug', message: 'Đường dẫn này đã được sử dụng, vui lòng chọn slug khác.' });
      else setErr({ field: null, message: e.message || 'Có lỗi xảy ra.' });
    };

    if (editPostId) updatePost.mutate({ id: editPostId, body }, { onSuccess, onError });
    else createPost.mutate(body, { onSuccess, onError });
  };

  const saving = createPost.isPending || updatePost.isPending;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'flex-start', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ flex: '1 1 420px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Input label="Tiêu đề" placeholder="VD: Ngũ quý 99999 — vì sao đắt nhất?" value={title} error={err?.field === 'title' ? err.message : undefined} onChange={onTitleChange} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Slug</span>
          <InfoTip size={12} text="Đường dẫn riêng của bài viết, dùng cho URL/SEO. Tự sinh từ tiêu đề (VD: 'phong-thuy-bien-so'). Để trống để hệ thống tự tạo." />
        </div>
        <Input placeholder="tu-dong-sinh-tu-tieu-de" value={slug} error={err?.field === 'slug' ? err.message : undefined} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} />
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
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)', overflow: 'hidden', boxShadow: err?.field === 'content' ? 'inset 0 0 0 1.5px var(--status-danger)' : undefined }}>
            <EditorToolbar editor={editor} />
            <div style={{ padding: '12px 14px', minHeight: 320 }}>
              <EditorContent editor={editor} />
            </div>
          </div>
          {err?.field === 'content' && <span role="alert" style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{err.message}</span>}
        </label>
        {err && !err.field && <span role="alert" style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{err.message}</span>}
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

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>Từ khóa<InfoTip size={12} text="Chọn từ kho hashtag có sẵn hoặc gõ tạo mới. Tối đa 10 từ khóa mỗi bài." /></span>

            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {tags.map((t) => (
                  <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px 2px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', font: 'var(--type-caption)', color: 'var(--white)' }}>
                    #{t}
                    <button type="button" onClick={() => removeTag(t)} aria-label={`Bỏ ${t}`} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--white)', display: 'flex', padding: 2 }}><X size={11} /></button>
                  </span>
                ))}
              </div>
            )}

            {availableTags.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Chọn từ kho hashtag:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
                  {availableTags.map((t) => (
                    <button key={t} type="button" onClick={() => toggleTag(t)} title={`Thêm #${t}`}
                      style={{ border: '1px dashed var(--border-strong)', background: 'transparent', borderRadius: 'var(--radius-pill)', padding: '2px 10px', font: 'var(--type-caption)', color: 'var(--action-primary)', cursor: 'pointer' }}>#{t} +</button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <div style={{ flex: 1 }}>
                <Input placeholder="Tạo hashtag mới…" value={newTagInput} onChange={(e) => setNewTagInput(e.target.value)} />
              </div>
              <Button variant="outline" size="sm" disabled={!newTagInput.trim() || tags.length >= 10} onClick={createNewTag}>Thêm</Button>
            </div>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Meta title (SEO)</span>
            <InfoTip size={12} text="Tiêu đề hiện trên tab trình duyệt và dòng đầu kết quả tìm kiếm Google. Để trống sẽ dùng tiêu đề bài viết." />
          </div>
          <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
          <span style={{ font: 'var(--type-caption)', color: metaTitle.length > 60 ? 'var(--status-danger)' : 'var(--text-faint)' }}>
            {metaTitle.length}/60 ký tự{metaTitle.length > 60 ? ' — Google sẽ cắt bớt phần dư' : ''}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Meta description (SEO)</span>
            <InfoTip size={12} text="Đoạn mô tả ngắn hiện dưới kết quả tìm kiếm. Nên 1-2 câu tóm tắt nội dung để tăng tỷ lệ nhấp." />
          </div>
          <Input value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
          <span style={{ font: 'var(--type-caption)', color: metaDescription.length > 155 ? 'var(--status-danger)' : 'var(--text-faint)' }}>
            {metaDescription.length}/155 ký tự{metaDescription.length > 155 ? ' — Google sẽ cắt bớt phần dư' : ''}
          </span>
        </div>

        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>Video quảng cáo gắn kèm<InfoTip size={12} text="Gắn video TikTok quảng cáo vào cuối bài viết để tăng tương tác. Với bài mới, video được lưu lại và tự gắn sau khi bạn xuất bản/lưu." /></span>

            {/* Thêm nhanh bằng link TikTok — tự tạo video + gắn vào bài */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
              <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>Thêm nhanh bằng link TikTok</span>
              <ol style={{ margin: 0, paddingLeft: 18, font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <li>Mở video trên app TikTok.</li>
                <li>Chạm nút <b>Chia sẻ</b> → chọn <b>Sao chép liên kết</b>.</li>
                <li>Dán link vào ô dưới và bấm <b>Thêm</b> — hệ thống tự nhận diện, thêm vào thư viện và gắn ngay vào bài viết.</li>
              </ol>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <Input placeholder="https://www.tiktok.com/@…/video/…" value={tiktokUrl} error={tiktokErr} onChange={(e) => setTiktokUrl(e.target.value)} />
                </div>
                <Button variant="primary" size="sm" disabled={!tiktokUrl.trim() || tiktokBusy} onClick={attachByUrl}>{tiktokBusy ? 'Đang thêm…' : 'Thêm'}</Button>
              </div>
            </div>

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

        <Button variant="ghost" size="md" onClick={() => setPreviewOpen(true)} disabled={!title.trim()}>
          <Eye size={16} style={{ marginRight: 6 }} />Xem trước
        </Button>

        {editPostId && (
          <Button variant="ghost" size="md" onClick={() => setHistoryOpen(true)}>Lịch sử phiên bản</Button>
        )}

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          Lịch xuất bản (tùy chọn)<InfoTip size={12} text="Lưu nháp kèm thời điểm này — hệ thống tự chuyển sang Đã xuất bản đúng giờ, không cần vào sửa lại." />
          <input type="datetime-local" value={scheduledPublishAt} onChange={(e) => setScheduledPublishAt(e.target.value)}
            style={{ height: 36, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)', padding: '0 10px', font: 'var(--type-body-sm)' }} />
        </label>

        <div className="compose-actions-mobile" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" size="md" disabled={saving} onClick={() => submit('draft')} style={{ flex: 1 }}>{scheduledPublishAt ? 'Lưu & hẹn giờ' : 'Lưu nháp'}</Button>
          <Button variant="primary" size="md" disabled={saving} onClick={publish} style={{ flex: 1 }}>{editPostId ? 'Cập nhật' : 'Xuất bản'}</Button>
        </div>
      </div>

      {editPostId && (
        <BlogVersionHistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} postId={editPostId} notify={notify} onRolledBack={loadPost} />
      )}

      {previewOpen && (
        <div role="dialog" aria-modal="true" aria-label="Xem trước bài viết" style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'var(--overlay-scrim)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 18px', overflow: 'auto', animation: 'fadeIn 140ms var(--ease-out)' }}>
          <div style={{ width: '100%', maxWidth: 800, background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', animation: 'modalIn 180ms var(--ease-out)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-6)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
              <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Xem trước bài viết</span>
              <button type="button" ref={previewCloseRef} onClick={() => setPreviewOpen(false)} aria-label="Đóng" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-body)', padding: 4 }}><X size={22} /></button>
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

      {confirmPublish && (
        <Modal open onClose={() => setConfirmPublish(false)} title={editPostId ? 'Cập nhật bài viết' : 'Xuất bản bài viết'} maxWidth="420px">
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            {editPostId
              ? 'Cập nhật sẽ đưa bản mới ngay lên website công khai cho mọi người xem. Xác nhận tiếp tục?'
              : 'Xuất bản sẽ đưa bài viết này công khai lên website. Xác nhận tiếp tục?'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <Button variant="ghost" size="md" onClick={() => setConfirmPublish(false)}>Hủy</Button>
            <Button variant="primary" size="md" onClick={() => { setConfirmPublish(false); submit('published'); }}>Xác nhận</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
