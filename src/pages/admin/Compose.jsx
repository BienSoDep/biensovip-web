import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import TiptapImage from '@tiptap/extension-image';
import { useEffect, useState } from 'react';
import Button from '../../components/Button.jsx';
import { Input } from '../../components/index.jsx';
import { apiClient } from '../../services/apiClient.js';
import { useCreateBlogPost, useUpdateBlogPost } from '../../services/blog.js';

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
  const [err, setErr] = useState('');

  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();

  const editor = useEditor({
    extensions: [StarterKit, TiptapLink, TiptapImage],
    content: '',
  });

  useEffect(() => {
    if (!editPostId || !editor) return;
    apiClient.get(`/api/admin/blog/posts?page=1&limit=200`).then((data) => {
      const post = data?.items?.find((p) => p.id === editPostId);
      if (!post) return;
      apiClient.get(`/api/blog/posts/${post.slug}`).catch(() => null).then((detail) => {
        const full = detail || post;
        setTitle(full.title || '');
        setSlug(full.slug || '');
        setSlugTouched(true);
        setCoverImageUrl(full.coverImageUrl || '');
        setMetaTitle(full.metaTitle || '');
        setMetaDescription(full.metaDescription || '');
        if (full.contentHtml) editor.commands.setContent(full.contentHtml);
      });
    });
  }, [editPostId, editor]);

  const onTitleChange = (e) => {
    const v = e.target.value;
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const submit = (status) => {
    if (!title.trim()) { setErr('Nhập tiêu đề bài viết.'); return; }
    const contentHtml = editor?.getHTML() || '';
    if (status === 'published' && !editor?.getText().trim()) { setErr('Bài viết cần có nội dung để đăng.'); return; }
    setErr('');

    const body = {
      title: title.trim(),
      slug: slug.trim() || null,
      contentHtml,
      coverImageUrl: coverImageUrl.trim() || null,
      metaTitle: metaTitle.trim() || null,
      metaDescription: metaDescription.trim() || null,
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
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Nội dung</span>
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)', padding: '12px 14px', minHeight: 240 }}>
            <EditorContent editor={editor} />
          </div>
        </label>
      </div>
      <div style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input label="Ảnh đại diện (URL)" placeholder="https://..." value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} />
          <Input label="Meta title (SEO)" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
          <Input label="Meta description (SEO)" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" size="md" disabled={saving} onClick={() => submit('draft')} style={{ flex: 1 }}>Lưu nháp</Button>
          <Button variant="primary" size="md" disabled={saving} onClick={() => submit('published')} style={{ flex: 1 }}>{editPostId ? 'Cập nhật' : 'Xuất bản'}</Button>
        </div>
      </div>
    </div>
  );
}
