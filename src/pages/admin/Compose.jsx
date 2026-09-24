import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import { useEffect, useState, useRef, useMemo } from 'react';
import { marked } from 'marked';
import mammoth from 'mammoth';
import { Eye, X, Upload, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import Button from '../../components/Button.jsx';
import { Input, Select, InfoTip, Badge } from '../../components/index.jsx';
import { EditorToolbar, ResizableImage } from '../../components/RichTextEditor.jsx';
import Modal from '../../components/Modal.jsx';
import BlogVersionHistoryModal from '../../components/BlogVersionHistoryModal.jsx';
import { apiClient } from '../../services/apiClient.js';
import { useCreateBlogPost, useUpdateBlogPost, useAdminBlogTags, useCreateBlogTag, checkBlogPostVersion } from '../../services/blog.js';
import { sanitizeHtml } from '../../lib/sanitizeHtml.js';
import { useAdminPromoVideos, useCreatePromoVideo } from '../../services/promoVideoService.js';
import { useAdminCategories } from '../../services/categories.js';
import { useFaqSets } from '../../services/faqHowTo.js';
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

// 5 mệnh ngũ hành — Hợp mệnh/Kỵ mệnh là giá trị cố định, dùng chip toggle thay vì gõ tay.
const MENH = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'];
const splitMenh = (s) => (s || '').split(/,\s*/).map((x) => x.trim()).filter(Boolean);
const hasMenh = (s, m) => splitMenh(s).includes(m);
const toggleMenh = (current, m) => {
  const parts = splitMenh(current);
  const i = parts.indexOf(m);
  if (i >= 0) parts.splice(i, 1); else parts.push(m);
  return parts.join(', ');
};
// Cắt tại khoảng trắng gần nhất trước giới hạn — cho nút tự điền meta title/description.
const truncateAt = (text, max) => {
  const t = (text || '').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(' ');
  return (sp > 0 ? cut.slice(0, sp) : cut).trim();
};
const AUTO_FILL_BTN = { border: 'none', background: 'none', cursor: 'pointer', color: 'var(--action-primary)', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', padding: 0 };

function MenhChips({ value, onChange, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {MENH.map((m) => {
          const on = hasMenh(value, m);
          return (
            <button key={m} type="button" onClick={() => onChange(toggleMenh(value, m))} aria-pressed={on}
              style={{
                border: on ? '1px solid var(--action-primary)' : '1px dashed var(--border-strong)',
                background: on ? 'var(--action-primary)' : 'transparent',
                color: on ? 'var(--white)' : 'var(--action-primary)',
                borderRadius: 'var(--radius-pill)', padding: '2px 12px', font: 'var(--type-caption)', cursor: 'pointer',
              }}>
              {m}
            </button>
          );
        })}
      </div>
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
  const [scheduledPublishAt, setScheduledPublishAt] = useState('');
  // UC39 — bài "hành trình giao biển": gắn 1 biển đã bán cụ thể + địa điểm/ngày giao.
  const [plateId, setPlateId] = useState('');
  const [platePlateNumber, setPlatePlateNumber] = useState('');
  const [plateQuery, setPlateQuery] = useState('');
  const [plateOptions, setPlateOptions] = useState([]);
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  // UC40 — tóm tắt nhanh + FAQ (rich snippet) + nguồn tham khảo.
  const [summaryFengShui, setSummaryFengShui] = useState('');
  const [summaryTaboo, setSummaryTaboo] = useState('');
  const [summaryMeaning, setSummaryMeaning] = useState('');
  const [sourceNote, setSourceNote] = useState('');
  // Kho FAQ chung — bài chọn (không gõ tay) các bộ FAQ có sẵn, lọc theo category đang chọn.
  const [faqSetIds, setFaqSetIds] = useState([]);
  const [loadedUpdatedAt, setLoadedUpdatedAt] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [tags, setTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  // 1.3 — từ khóa chính để admin tự kiểm mật độ khi viết bài (chỉ tool, không lưu DB).
  const [focusKeyword, setFocusKeyword] = useState('');
  const [err, setErr] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const fileInputRef = useRef(null);
  // Ảnh trạng thái "đã lưu" để so sánh phát hiện thay đổi chưa lưu (unsaved-changes guard).
  const savedRef = useRef({ title: '', slug: '', coverImageUrl: '', metaTitle: '', metaDescription: '', category: 'kien-thuc', tags: '[]', contentHtml: '', summaryFengShui: '', summaryTaboo: '', summaryMeaning: '', sourceNote: '', scheduledPublishAt: '', deliveryLocation: '', deliveryDate: '', plateId: '', faq: '[]', howToSteps: '[]', videoIds: '[]' });

  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const { data: blogCatData } = useAdminCategories('blog_category');
  const categoryOpts = (blogCatData?.items || []).map((c) => ({ value: c.code || c.name, label: c.name }));
  const { data: faqSetsData } = useFaqSets(category);
  const faqSetOpts = faqSetsData?.items || [];
  // Đổi category → bộ FAQ đang gắn không còn khớp category mới thì tự gỡ (kho lọc theo category, tránh gắn lệch).
  useEffect(() => {
    if (!faqSetsData) return;
    const validIds = new Set(faqSetOpts.map((s) => s.id));
    setFaqSetIds((cur) => cur.filter((id) => validIds.has(id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, faqSetsData]);
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
    extensions: [StarterKit, TiptapLink, ResizableImage],
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
      setPlateId(full.plateId || '');
      setPlatePlateNumber(full.plateNumber || '');
      setDeliveryLocation(full.deliveryLocation || '');
      setDeliveryDate(full.deliveryDate || '');
      setSummaryFengShui(full.summaryFengShui || '');
      setSummaryTaboo(full.summaryTaboo || '');
      setSummaryMeaning(full.summaryMeaning || '');
      setSourceNote(full.sourceNote || '');
      setFaqSetIds((full.faqSets || []).map((s) => s.id));
      if (full.contentHtml) editor.commands.setContent(full.contentHtml);
      setAttachedVideos(full.videos || []);
      savedRef.current = {
        title: full.title || '', slug: full.slug || '', coverImageUrl: full.coverImageUrl || '',
        metaTitle: full.metaTitle || '', metaDescription: full.metaDescription || '',
        category: full.category || 'kien-thuc', tags: JSON.stringify(full.tags || []), contentHtml: full.contentHtml || '',
        summaryFengShui: full.summaryFengShui || '', summaryTaboo: full.summaryTaboo || '',
        summaryMeaning: full.summaryMeaning || '', sourceNote: full.sourceNote || '',
        scheduledPublishAt: full.scheduledPublishAt ? full.scheduledPublishAt.slice(0, 16) : '',
        deliveryLocation: full.deliveryLocation || '', deliveryDate: full.deliveryDate || '',
        plateId: full.plateId || '',
        faqSetIds: JSON.stringify((full.faqSets || []).map((s) => s.id)),
        videoIds: JSON.stringify((full.videos || []).map((v) => v.id)),
      };
    });
  };

  useEffect(() => {
    loadPost();
  }, [editPostId, editor]);

  // UC39 — search biển đã bán khi gõ vào ô chọn biển gắn bài (debounce 300ms).
  useEffect(() => {
    const q = plateQuery.trim();
    const timer = setTimeout(() => {
      apiClient.get(`/api/admin/blog/sold-plates${q ? `?q=${encodeURIComponent(q)}` : ''}`)
        .then((res) => setPlateOptions(res?.items || []))
        .catch(() => setPlateOptions([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [plateQuery]);

  // Unsaved-changes guard: cảnh báo trước khi đóng/refresh trình duyệt khi có thay đổi chưa lưu.
  const isDirty = () => {
    const s = savedRef.current;
    const c = {
      title, slug, coverImageUrl, metaTitle, metaDescription, category,
      tags: JSON.stringify(tags), contentHtml: editor?.getHTML() || '',
      summaryFengShui, summaryTaboo, summaryMeaning, sourceNote,
      scheduledPublishAt, deliveryLocation, deliveryDate, plateId,
      faqSetIds: JSON.stringify(faqSetIds),
      videoIds: JSON.stringify(attachedVideos.map((v) => v.id)),
    };
    return Object.keys(c).some((k) => c[k] !== (s[k] ?? null));
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
  // Đếm số lần từ khóa chính xuất hiện trong 1 chuỗi (so khớp không phân biệt hoa thường).
  const focusKw = focusKeyword.trim().toLowerCase();
  const focusCount = (text) => {
    if (!focusKw) return 0;
    const esc = focusKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return (text.toLowerCase().match(new RegExp(esc, 'g')) || []).length;
  };
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
    if (status === 'published' && metaTitle.length > 60) { setErr({ field: 'metaTitle', message: 'Meta title vượt 60 ký tự — bấm "Tự điền" hoặc rút ngắn trước khi đăng.' }); return; }
    if (status === 'published' && metaDescription.length > 155) { setErr({ field: 'metaDescription', message: 'Meta description vượt 155 ký tự — bấm "Tự điền" hoặc rút ngắn trước khi đăng.' }); return; }
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
      plateId: plateId || null,
      ...(editPostId && !plateId ? { clearPlateId: true } : {}),
      deliveryLocation: deliveryLocation.trim() || null,
      deliveryDate: deliveryDate || null,
      faqSetIds,
      summaryFengShui: summaryFengShui.trim() || null,
      summaryTaboo: summaryTaboo.trim() || null,
      summaryMeaning: summaryMeaning.trim() || null,
      sourceNote: sourceNote.trim() || null,
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
  const previewMetaTitle = metaTitle.trim() || title.trim() || 'Chưa có tiêu đề';
  const previewMetaDesc = metaDescription.trim() || truncateAt(plainText, 155);

  // Đánh giá chất lượng và độ hoàn thiện dữ liệu bài viết (tương tự quản lý biển số)
  const quality = useMemo(() => {
    const checks = [];
    const issues = [];

    // 1. Tiêu đề
    const hasTitle = title.trim().length >= 10;
    checks.push({ id: 'title', label: 'Tiêu đề đủ dài (≥10 ký tự)', ok: hasTitle });
    if (!hasTitle) issues.push('Tiêu đề cần tối thiểu 10 ký tự');

    // 2. Slug
    const hasSlug = !!slug.trim();
    checks.push({ id: 'slug', label: 'Slug thân thiện URL', ok: hasSlug });
    if (!hasSlug) issues.push('Chưa có đường dẫn riêng (slug)');

    // 3. Ảnh bìa
    const hasCover = !!coverImageUrl.trim();
    checks.push({ id: 'cover', label: 'Ảnh đại diện bài viết', ok: hasCover });
    if (!hasCover) issues.push('Thiếu ảnh bìa bài viết');

    // 4. Meta Title
    const metaTitleEffective = (metaTitle.trim() || title.trim());
    const hasMetaTitle = metaTitleEffective.length >= 15 && metaTitleEffective.length <= 60;
    checks.push({ id: 'metaTitle', label: 'Tiêu đề SEO Meta (15-60 ký tự)', ok: hasMetaTitle });
    if (!metaTitle.trim()) issues.push('Chưa điền riêng Meta Title');
    else if (metaTitle.trim().length > 60) issues.push('Meta Title quá dài (>60 ký tự)');

    // 5. Meta Description
    const hasMetaDesc = metaDescription.trim().length >= 50 && metaDescription.trim().length <= 160;
    checks.push({ id: 'metaDesc', label: 'Mô tả SEO Meta (50-160 ký tự)', ok: hasMetaDesc });
    if (!metaDescription.trim()) issues.push('Chưa điền riêng Meta Description');
    else if (metaDescription.trim().length < 50) issues.push('Meta Description quá ngắn (<50 ký tự)');
    else if (metaDescription.trim().length > 160) issues.push('Meta Description quá dài (>160 ký tự)');

    // 6. Độ dài nội dung
    const hasLength = wordCount >= 300;
    checks.push({ id: 'length', label: 'Nội dung chi tiết (≥300 từ)', ok: hasLength });
    if (!hasLength) issues.push(`Nội dung còn ngắn (${wordCount}/300 từ)`);

    // 7. Chuyên mục
    const hasCategory = !!category && category !== 'general';
    checks.push({ id: 'category', label: 'Chuyên mục bài viết', ok: hasCategory });
    if (!hasCategory) issues.push('Chưa chọn chuyên mục cụ thể');

    // 8. Tags
    const hasTags = tags.length >= 2;
    checks.push({ id: 'tags', label: 'Gắn thẻ từ khóa (≥2 tags)', ok: hasTags });
    if (tags.length === 0) issues.push('Chưa gắn thẻ Tags nào');
    else if (tags.length < 2) issues.push('Nên gắn thêm ít nhất 2 thẻ Tags');

    // 9. FAQ
    const hasFaqs = faqSetIds.length > 0;
    checks.push({ id: 'faqs', label: 'Bộ câu hỏi FAQ giải đáp', ok: hasFaqs });
    if (!hasFaqs) issues.push('Chưa gắn bộ FAQ giải đáp');

    const passed = checks.filter(c => c.ok).length;
    const score = Math.round((passed / checks.length) * 100);

    return {
      score,
      passed,
      totalChecks: checks.length,
      checks,
      issues,
      statusTone: score >= 85 ? 'mint' : score >= 60 ? 'amber' : 'danger',
      statusLabel: score >= 85 ? 'Chuẩn SEO Tối Ưu' : score >= 60 ? 'Tương Đối Đầy Đủ' : 'Cần Bổ Sung Thông Tin',
    };
  }, [title, slug, coverImageUrl, metaTitle, metaDescription, wordCount, category, tags, faqSetIds]);

  // Tự động sinh các trường thông tin còn thiếu (SEO, Slug, Tags, Category)
  const autoGenerateAllMissing = () => {
    let count = 0;

    // 1. Slug
    if (!slug.trim() && title.trim()) {
      setSlug(slugify(title));
      setSlugTouched(true);
      count++;
    }

    // 2. Meta Title
    if (!metaTitle.trim() && title.trim()) {
      setMetaTitle(truncateAt(title, 60));
      count++;
    }

    // 3. Meta Description
    if (!metaDescription.trim()) {
      const candidate = truncateAt(plainText || title, 155);
      if (candidate) {
        setMetaDescription(candidate);
        count++;
      }
    }

    // 4. Tags
    if (tags.length < 2) {
      const pool = availableTags.length > 0 ? availableTags : (allTagsData?.items || []);
      const matched = [];
      const titleLower = title.toLowerCase();
      const contentLower = plainText.toLowerCase();

      for (const t of pool) {
        const tl = t.toLowerCase();
        if (titleLower.includes(tl) || contentLower.includes(tl)) {
          matched.push(t);
        }
      }

      const fallbackTagsByCategory = {
        'kien-thuc': ['biển số đẹp', 'định danh biển số', 'ý nghĩa biển số'],
        'phong-thuy': ['phong thủy biển số', 'biển số hợp mệnh', 'ngũ quý'],
        'thi-truong': ['đấu giá biển số', 'giá biển số', 'thị trường biển đẹp'],
        'huong-dan': ['thủ tục sang tên', 'đăng ký biển số', 'hướng dẫn'],
        'hanh-trinh': ['giao biển tận nơi', 'khách hàng biensovip'],
      };

      const candidates = [...matched, ...(fallbackTagsByCategory[category] || ['biển số đẹp', 'biensovip'])];
      const newTags = [...tags];
      for (const cand of candidates) {
        if (newTags.length >= 4) break;
        if (!newTags.some(existing => existing.toLowerCase() === cand.toLowerCase())) {
          newTags.push(cand);
          count++;
        }
      }
      setTags(newTags.slice(0, 10));
    }

    // 5. Category (nếu đang là rỗng hoặc general)
    if (!category || category === 'general') {
      const tl = title.toLowerCase();
      if (tl.includes('phong thủy') || tl.includes('hợp mệnh') || tl.includes('ngũ hành') || tl.includes('tam hoa') || tl.includes('tứ quý') || tl.includes('ngũ quý')) {
        setCategory('phong-thuy');
        count++;
      } else if (tl.includes('đấu giá') || tl.includes('giá') || tl.includes('thị trường') || tl.includes('kỷ lục')) {
        setCategory('thi-truong');
        count++;
      } else if (tl.includes('thủ tục') || tl.includes('hướng dẫn') || tl.includes('sang tên') || tl.includes('định danh')) {
        setCategory('huong-dan');
        count++;
      } else if (tl.includes('giao biển') || tl.includes('bàn giao') || tl.includes('khách hàng')) {
        setCategory('hanh-trinh');
        count++;
      }
    }

    // 6. Summary Meaning (nếu trống và có từ khóa tài lộc)
    if (!summaryMeaning.trim() && (title.includes('lộc') || title.includes('phát') || title.includes('thần tài') || title.includes('tứ quý') || title.includes('ngũ quý'))) {
      setSummaryMeaning('Mang lại may mắn, vượng khí, tài lộc hanh thông cho gia chủ.');
      count++;
    }

    if (count > 0) {
      notify(`Đã tự động tạo và điền ${count} mục thông tin SEO & dữ liệu còn thiếu!`);
    } else {
      notify('Các trường cơ bản đã có đủ thông tin, không cần tự sinh thêm.');
    }
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'flex-start', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ flex: '2 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Input label="Tiêu đề" placeholder="VD: Ngũ quý 99999 — vì sao đắt nhất?" value={title} error={err?.field === 'title' ? err.message : undefined} onChange={onTitleChange} required />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Slug</span>
          <InfoTip size={12} text="Đường dẫn riêng của bài viết, dùng cho URL/SEO. Tự sinh từ tiêu đề (VD: 'phong-thuy-bien-so'). Để trống để hệ thống tự tạo." />
        </div>
        <Input placeholder="tu-dong-sinh-tu-tieu-de" value={slug} error={err?.field === 'slug' ? err.message : undefined} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
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
        </div>
        {err && !err.field && <span role="alert" style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{err.message}</span>}
      </div>
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Select label="Danh mục" value={category} options={categoryOpts} onChange={setCategory} />
        </div>
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
          </div>

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
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Từ khóa chính (focus keyword)</span>
            <InfoTip size={12} text="Gõ từ khóa chính của bài để kiểm tra mật độ xuất hiện trong tiêu đề, meta và nội dung. Chỉ để tự kiểm tra khi viết bài, không lưu vào bài viết." />
          </div>
          <Input value={focusKeyword} onChange={(e) => setFocusKeyword(e.target.value)} placeholder="VD: biển số đẹp Đà Nẵng" />
          {focusKw && (
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Xuất hiện: Tiêu đề {focusCount(title)} · Meta title {focusCount(metaTitle)} · Meta description {focusCount(metaDescription)} · Nội dung {focusCount(plainText)}
            </span>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Meta title (SEO)</span>
            <InfoTip size={12} text="Tiêu đề hiện trên tab trình duyệt và dòng đầu kết quả tìm kiếm Google. Để trống sẽ dùng tiêu đề bài viết." />
            <button type="button" onClick={() => setMetaTitle(truncateAt(title, 60))} style={AUTO_FILL_BTN}>Tự điền</button>
          </div>
          <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
          <span style={{ font: 'var(--type-caption)', color: metaTitle.length > 60 ? 'var(--status-danger)' : 'var(--text-faint)' }}>
            {metaTitle.length}/60 ký tự{metaTitle.length > 60 ? ' — Google sẽ cắt bớt phần dư' : ''}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Meta description (SEO)</span>
            <InfoTip size={12} text="Đoạn mô tả ngắn hiện dưới kết quả tìm kiếm. Nên 1-2 câu tóm tắt nội dung để tăng tỷ lệ nhấp." />
            <button type="button" onClick={() => setMetaDescription(truncateAt(plainText, 155))} style={AUTO_FILL_BTN}>Tự điền</button>
          </div>
          <Input value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
          <span style={{ font: 'var(--type-caption)', color: metaDescription.length > 155 ? 'var(--status-danger)' : 'var(--text-faint)' }}>
            {metaDescription.length}/155 ký tự{metaDescription.length > 155 ? ' — Google sẽ cắt bớt phần dư' : ''}
          </span>
        </div>

        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>Hành trình giao biển (tùy chọn)<InfoTip size={12} text="Gắn bài viết này với 1 biển đã bán cụ thể — bài sẽ hiện thành 'Câu chuyện giao biển' trong trang chi tiết biển đó. Chỉ chọn được biển đã có trạng thái Đã bán." /></span>

          {plateId ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)' }}>
              <span style={{ flex: 1, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{platePlateNumber}</span>
              <button type="button" onClick={() => { setPlateId(''); setPlatePlateNumber(''); }} aria-label="Bỏ gắn biển" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={14} /></button>
            </div>
          ) : (
            <>
              <Input placeholder="Gõ số biển đã bán…" value={plateQuery} onChange={(e) => setPlateQuery(e.target.value)} />
              {plateOptions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                  {plateOptions.map((p) => (
                    <button key={p.id} type="button" onClick={() => { setPlateId(p.id); setPlatePlateNumber(p.plateNumber); setPlateQuery(''); setPlateOptions([]); }}
                      style={{ textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px 8px', borderRadius: 'var(--radius-sm)', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>
                      {p.plateNumber}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {plateId && (
            <>
              <Input label="Địa điểm giao biển" placeholder="VD: Đà Nẵng" value={deliveryLocation} onChange={(e) => setDeliveryLocation(e.target.value)} />
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Ngày giao biển</span>
                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                  style={{ height: 36, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)', padding: '0 10px', font: 'var(--type-body-sm)' }} />
              </label>
            </>
          )}
        </div>

        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>Tóm tắt nhanh (tùy chọn)<InfoTip size={12} text="Hiện ngay đầu bài dưới dạng box tóm tắt — giúp người đọc lướt nhanh, tăng dwell time cho SEO." /></span>
          <MenhChips label="Hợp mệnh" value={summaryFengShui} onChange={setSummaryFengShui} />
          <MenhChips label="Kỵ mệnh" value={summaryTaboo} onChange={setSummaryTaboo} />
          <Input label="Ý nghĩa chính" placeholder="VD: Số mang lại tài lộc, thăng tiến" value={summaryMeaning} onChange={(e) => setSummaryMeaning(e.target.value)} />
          <Input label="Nguồn tham khảo" placeholder="VD: Theo kinh nghiệm tư vấn thực tế của Biensovip" value={sourceNote} onChange={(e) => setSourceNote(e.target.value)} />
        </div>

        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>Bộ FAQ áp dụng (tùy chọn)<InfoTip size={12} text="Chọn từ kho FAQ chung (quản lý ở trang Danh mục, tab Kho FAQ) — lọc theo danh mục bài đang chọn. Không gõ tay từng bài nữa, sửa 1 bộ áp dụng cho mọi bài đã gắn." /></span>
          {faqSetOpts.length === 0 ? (
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Chưa có bộ FAQ nào cho danh mục này — tạo ở trang Danh mục &gt; Kho FAQ.</span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {faqSetOpts.map((s) => {
                const on = faqSetIds.includes(s.id);
                return (
                  <button key={s.id} type="button" aria-pressed={on}
                    onClick={() => setFaqSetIds((cur) => (on ? cur.filter((id) => id !== s.id) : [...cur, s.id]))}
                    style={{
                      border: on ? '1px solid var(--action-primary)' : '1px dashed var(--border-strong)',
                      background: on ? 'var(--action-primary)' : 'transparent',
                      color: on ? 'var(--white)' : 'var(--action-primary)',
                      borderRadius: 'var(--radius-pill)', padding: '4px 12px', font: 'var(--type-caption)', cursor: 'pointer',
                    }}>
                    {s.name} ({s.items.length})
                  </button>
                );
              })}
            </div>
          )}
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

        {editPostId && (
          <Button variant="ghost" size="md" onClick={() => setHistoryOpen(true)}>Lịch sử phiên bản</Button>
        )}

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          Lịch xuất bản (tùy chọn)<InfoTip size={12} text="Lưu nháp kèm thời điểm này — hệ thống tự chuyển sang Đã xuất bản đúng giờ, không cần vào sửa lại." />
          <input type="datetime-local" value={scheduledPublishAt} onChange={(e) => setScheduledPublishAt(e.target.value)}
            style={{ height: 36, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)', padding: '0 10px', font: 'var(--type-body-sm)' }} />
        </label>

        <div className="compose-actions-mobile" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" size="md" disabled={saving} onClick={autoGenerateAllMissing} style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="Tự động điền Slug, Meta SEO và Tags còn thiếu">
            <Sparkles size={15} /> Tự sinh SEO
          </Button>
          <Button variant="outline" size="md" disabled={saving} onClick={() => submit('draft')} style={{ flex: 1 }}>{scheduledPublishAt ? 'Lưu & hẹn giờ' : 'Lưu nháp'}</Button>
          <Button variant="primary" size="md" disabled={saving} onClick={publish} style={{ flex: 1 }}>{editPostId ? 'Cập nhật' : 'Xuất bản'}</Button>
        </div>
      </div>

      {/* Cột preview — sticky, cuộn riêng khi form dài hơn viewport */}
      <div style={{ flex: '1 1 380px', minWidth: 0, position: 'sticky', top: 'var(--space-4)', maxHeight: 'calc(100vh - var(--space-8))', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Thẻ Đánh giá chất lượng & Chuẩn SEO */}
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={16} style={{ color: 'var(--action-primary)' }} />
              <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Độ hoàn thiện & SEO</span>
            </div>
            <Badge tone={quality.statusTone}>{quality.score}% · {quality.statusLabel}</Badge>
          </div>

          {/* Thanh tiến trình điểm chất lượng */}
          <div style={{ width: '100%', height: 6, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
            <div style={{
              width: `${quality.score}%`,
              height: '100%',
              background: quality.score >= 80 ? 'var(--status-mint)' : quality.score >= 50 ? 'var(--status-amber)' : 'var(--status-danger)',
              transition: 'width 250ms ease-out',
            }} />
          </div>

          {/* Nút tự sinh các trường còn thiếu */}
          <Button
            variant="outline"
            size="sm"
            onClick={autoGenerateAllMissing}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderColor: 'var(--action-primary)', color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}
            title="Tự động điền Slug, Meta Title, Meta Description và gợi ý Hashtags từ nội dung bài viết"
          >
            <Sparkles size={14} /> Tự động sinh các mục còn thiếu
          </Button>

          {/* Danh sách tiêu chí kiểm tra */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
            {quality.checks.map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', font: 'var(--type-caption)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: c.ok ? 'var(--text-body)' : 'var(--text-muted)' }}>
                  {c.ok ? (
                    <CheckCircle2 size={13} style={{ color: 'var(--status-mint)', flexShrink: 0 }} />
                  ) : (
                    <AlertTriangle size={13} style={{ color: 'var(--status-amber)', flexShrink: 0 }} />
                  )}
                  <span>{c.label}</span>
                </span>
                <span style={{ color: c.ok ? 'var(--status-mint)' : 'var(--text-faint)', fontWeight: c.ok ? 'var(--fw-semibold)' : 'normal' }}>
                  {c.ok ? 'Đạt' : 'Thiếu'}
                </span>
              </div>
            ))}
          </div>

          {quality.issues.length > 0 && (
            <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--status-amber)' }}>Cần cải thiện ({quality.issues.length}):</span>
              <ul style={{ margin: 0, paddingLeft: 16, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                {quality.issues.slice(0, 3).map((iss, i) => (
                  <li key={i}>{iss}</li>
                ))}
                {quality.issues.length > 3 && (
                  <li>Và {quality.issues.length - 3} mục khác…</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Eye size={14} />Xem trước Google</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontFamily: 'arial, sans-serif' }}>
            <span style={{ fontSize: 14, color: '#202124' }}>biensovip.com › bai-viet › {slug || 'duong-dan-bai-viet'}</span>
            <span style={{ fontSize: 20, color: '#1a0dab', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{previewMetaTitle}</span>
            <span style={{ fontSize: 14, color: '#4d5156', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{previewMetaDesc || 'Chưa có mô tả.'}</span>
          </div>
        </div>

        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-3) var(--gutter-card) 0' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Xem trước bài viết</span>
          </div>
          <article style={{ padding: 'var(--space-6) var(--gutter-card) var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ padding: '2px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>{categoryOpts.find((c) => c.value === category)?.label || category}</span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>~{readingMinutes} phút đọc</span>
            </div>
            <h1 style={{ margin: 0, font: 'var(--type-title-1)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>{title || 'Chưa có tiêu đề'}</h1>
            {coverImageUrl && (
              <img src={coverImageUrl} alt={title} style={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 'var(--radius-card)' }} />
            )}
            <div className="article-body" style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }} dangerouslySetInnerHTML={{ __html: contentHtml ? sanitizeHtml(contentHtml) : '<p style="color:var(--text-faint)">Chưa có nội dung.</p>' }} />
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 'var(--space-2)', boxShadow: 'inset 0 1px 0 var(--border-hairline)' }}>
                {tags.map((t) => <span key={t} style={{ padding: '2px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>#{t}</span>)}
              </div>
            )}
          </article>
        </div>
      </div>

      {editPostId && (
        <BlogVersionHistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} postId={editPostId} notify={notify} onRolledBack={loadPost} />
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
