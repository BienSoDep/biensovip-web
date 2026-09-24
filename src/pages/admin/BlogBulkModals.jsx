import { useState, useMemo } from 'react';
import { Copy, Check, CheckCircle2, AlertTriangle, Sparkles, Layers, RefreshCw } from 'lucide-react';
import Modal from '../../components/Modal.jsx';
import Button from '../../components/Button.jsx';
import { Select, Badge } from '../../components/index.jsx';
import { apiClient } from '../../services/apiClient.js';
import { BLOG_CATEGORIES, CATEGORY_LABEL } from './AdminPosts.jsx';

function slugify(title) {
  return (title || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 300);
}

const truncateAt = (text, max) => {
  const t = (text || '').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(' ');
  return (sp > 0 ? cut.slice(0, sp) : cut).trim();
};

const DEFAULT_COVER_IMAGES = [
  'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&q=80',
  'https://images.unsplash.com/photo-1580310614729-ccd69652491d?w=1200&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80',
  'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=80',
];

const CATEGORY_TAG_PRESETS = {
  'kien-thuc': ['biển số đẹp', 'định danh biển số', 'ý nghĩa biển số'],
  'phong-thuy': ['phong thủy biển số', 'biển số hợp mệnh', 'ngũ quý'],
  'thi-truong': ['đấu giá biển số', 'giá biển số', 'thị trường biển đẹp'],
  'huong-dan': ['thủ tục sang tên', 'đăng ký biển số', 'hướng dẫn'],
  'tin-tuc': ['tin tức biensovip', 'thông báo', 'cập nhật'],
  'hanh-trinh': ['giao biển tận nơi', 'câu chuyện giao biển'],
};

// Tự động nhận diện chuyên mục từ tiêu đề
function inferCategory(title) {
  const t = (title || '').toLowerCase();
  if (t.includes('phong thủy') || t.includes('hợp mệnh') || t.includes('ngũ hành') || t.includes('tứ quý') || t.includes('ngũ quý') || t.includes('tam hoa')) {
    return 'phong-thuy';
  }
  if (t.includes('đấu giá') || t.includes('giá') || t.includes('thị trường') || t.includes('kỷ lục') || t.includes('giao dịch')) {
    return 'thi-truong';
  }
  if (t.includes('thủ tục') || t.includes('hướng dẫn') || t.includes('sang tên') || t.includes('định danh') || t.includes('quy định') || t.includes('thông tư')) {
    return 'huong-dan';
  }
  if (t.includes('giao biển') || t.includes('bàn giao') || t.includes('khách hàng') || t.includes('hành trình')) {
    return 'hanh-trinh';
  }
  if (t.includes('tin tức') || t.includes('thông báo') || t.includes('sự kiện')) {
    return 'tin-tuc';
  }
  return 'kien-thuc';
}

/**
 * 1. Modal Thêm bài viết hàng loạt (Dán nhiều dòng tương tự bên Quản lý biển số)
 */
export function BulkAddPostsModal({ open, onClose, notify, onCompleted }) {
  const [rawText, setRawText] = useState('');
  const [defaultCategory, setDefaultCategory] = useState('kien-thuc');
  const [defaultStatus, setDefaultStatus] = useState('draft');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(null);

  // Phân tích văn bản nhập vào thành danh sách bài viết
  const parsedRows = useMemo(() => {
    if (!rawText.trim()) return [];
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

    return lines.map((line, index) => {
      // Hỗ trợ phân cách bằng dấu gạch đứng (|) hoặc tab
      const parts = line.split(/[|\t]/).map((p) => p.trim());
      const title = parts[0] || '';
      let cat = parts[1] || '';
      let stat = parts[2] || '';

      // Chuẩn hóa category
      if (!cat || !CATEGORY_LABEL[cat]) {
        cat = inferCategory(title) || defaultCategory;
      }

      // Chuẩn hóa status (draft hoặc published)
      if (stat !== 'published' && stat !== 'draft') {
        stat = defaultStatus;
      }

      const isValid = title.length >= 6;
      const slug = slugify(title);

      return {
        key: index,
        title,
        category: cat,
        status: stat,
        slug,
        isValid,
        error: !isValid ? 'Tiêu đề quá ngắn (≥6 ký tự)' : '',
        done: false,
        success: null,
      };
    });
  }, [rawText, defaultCategory, defaultStatus]);

  const validRows = parsedRows.filter((r) => r.isValid && !r.done);

  const copyAiPrompt = () => {
    const prompt = `Hãy tạo giúp tôi danh sách 10 bài viết blog chuyên sâu về Biển số đẹp chuẩn SEO cho website Biensovip.
Định dạng mỗi dòng trả về chính xác như sau (không thêm số thứ tự, không thêm lời chào):
[Tiêu đề bài viết hấp dẫn] | [Chuyên mục: kien-thuc / phong-thuy / thi-truong / huong-dan / tin-tuc] | draft

Ví dụ:
Ý nghĩa biển số ngũ quý 99999 trong phong thủy và tài lộc | phong-thuy | draft
Biển số xe máy đẹp Đà Nẵng: Bảng giá và xu hướng 2026 | kien-thuc | draft
Hướng dẫn thủ tục sang tên đổi chủ biển số định danh theo Thông tư 24 | huong-dan | draft`;

    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
    notify('Đã sao chép prompt mẫu cho AI (ChatGPT/Claude)!');
  };

  const submitBulk = async () => {
    if (validRows.length === 0) {
      notify('Không có dòng bài viết nào hợp lệ để thêm.');
      return;
    }

    setIsSubmitting(true);
    setProgress({ done: 0, total: validRows.length, success: 0, fail: 0 });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const tags = CATEGORY_TAG_PRESETS[row.category] || ['biển số đẹp', 'biensovip'];
      const metaTitle = truncateAt(row.title, 60);
      const metaDescription = truncateAt(
        `Tìm hiểu chi tiết về ${row.title.toLowerCase()} cùng chuyên gia Biensovip. Tư vấn ý nghĩa phong thủy, giá trị thị trường và thủ tục cấp biển uy tín.`,
        155
      );
      const coverImageUrl = DEFAULT_COVER_IMAGES[i % DEFAULT_COVER_IMAGES.length];
      const sampleContent = `<p><strong>${row.title}</strong> là một trong những chủ đề được rất nhiều người yêu thích và tìm kiếm trong giới sưu tầm biển số xe đẹp.</p><h2>1. Ý nghĩa và giá trị nổi bật</h2><p>Biển số không chỉ là định danh phương tiện mà còn thể hiện phong cách, đẳng cấp và phong thủy may mắn cho chủ nhân sở hữu.</p><h2>2. Lời khuyên khi lựa chọn biển số</h2><p>Khi chọn biển số, bạn nên cân nhắc yếu tố hợp tuổi, hợp mệnh và nguồn gốc pháp lý rõ ràng theo quy định mới nhất của Bộ Công An.</p>`;

      const body = {
        title: row.title,
        slug: row.slug || null,
        category: row.category,
        status: row.status,
        metaTitle,
        metaDescription,
        coverImageUrl,
        tags,
        contentHtml: sampleContent,
      };

      try {
        await apiClient.post('/api/admin/blog/posts', body);
        successCount++;
        row.done = true;
        row.success = true;
      } catch (err) {
        failCount++;
        row.done = true;
        row.success = false;
        row.error = err.message || 'Lỗi thêm bài';
      }

      setProgress({
        done: i + 1,
        total: validRows.length,
        success: successCount,
        fail: failCount,
      });
    }

    setIsSubmitting(false);
    notify(`Đã hoàn tất thêm hàng loạt: ${successCount} bài thành công${failCount > 0 ? `, ${failCount} bài lỗi` : ''}`);
    if (onCompleted) onCompleted();
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={() => !isSubmitting && onClose()} title="Thêm bài viết hàng loạt" maxWidth="840px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
          <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Dán danh sách nhiều bài viết cùng lúc (mỗi dòng một bài). Hệ thống sẽ tự động phân tích tiêu đề, sinh slug, thẻ SEO Meta và gắn tags tự động.
          </p>
          <Button variant="outline" size="sm" onClick={copyAiPrompt} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {copiedPrompt ? <Check size={14} style={{ color: 'var(--status-mint)' }} /> : <Copy size={14} />}
            {copiedPrompt ? 'Đã copy prompt AI' : 'Copy prompt cho ChatGPT'}
          </Button>
        </div>

        {/* Thanh thiết lập mặc định */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--surface-sunken)', padding: '10px 14px', borderRadius: 'var(--radius-field)' }}>
          <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>Mặc định áp dụng:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Chuyên mục:</span>
            <Select
              value={defaultCategory}
              options={BLOG_CATEGORIES.filter((c) => c.value !== 'all')}
              onChange={setDefaultCategory}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Trạng thái:</span>
            <Select
              value={defaultStatus}
              options={[
                { value: 'draft', label: 'Lưu bản nháp' },
                { value: 'published', label: 'Xuất bản ngay' },
              ]}
              onChange={setDefaultStatus}
            />
          </div>
        </div>

        {/* Textarea dán nhiều */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <textarea
            rows={6}
            placeholder={`Dán danh sách bài viết vào đây, mỗi dòng một bài. Ví dụ:
Biển số xe máy tứ quý: ý nghĩa, giá trị và cách sở hữu | phong-thuy | draft
Biển số đẹp Đà Nẵng đầu số 43 cập nhật mới nhất 2026 | kien-thuc | draft
Quy trình cấp biển số định danh theo Thông tư 24 | huong-dan | published`}
            value={rawText}
            disabled={isSubmitting}
            onChange={(e) => setRawText(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px',
              fontFamily: 'monospace',
              fontSize: 13,
              borderRadius: 'var(--radius-field)',
              border: '1px solid var(--border-strong)',
              background: 'var(--white)',
              outline: 'none',
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            <span>Cú pháp: <code>Tiêu đề | Chuyên mục (tùy chọn) | Trạng thái (draft / published)</code></span>
            <span>Tổng cộng: <b>{parsedRows.length}</b> dòng (<b>{validRows.length}</b> hợp lệ)</span>
          </div>
        </div>

        {/* Tiến trình khi đang thêm */}
        {progress && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--surface-sunken)', padding: '10px 14px', borderRadius: 'var(--radius-field)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--type-caption)' }}>
              <span>Đang xử lý thêm hàng loạt: <b>{progress.done}/{progress.total}</b> bài</span>
              <span>Thành công: <b style={{ color: 'var(--status-mint)' }}>{progress.success}</b> · Lỗi: <b style={{ color: 'var(--status-danger)' }}>{progress.fail}</b></span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'var(--surface-muted)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
              <div style={{ width: `${(progress.done / progress.total) * 100}%`, height: '100%', background: 'var(--action-primary)', transition: 'width 150ms ease-out' }} />
            </div>
          </div>
        )}

        {/* Bảng xem trước trực tiếp */}
        {parsedRows.length > 0 && (
          <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-field)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', font: 'var(--type-caption)' }}>
              <thead>
                <tr style={{ background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border-hairline)' }}>
                  <th style={{ padding: '8px 10px', width: 36 }}>#</th>
                  <th style={{ padding: '8px 10px' }}>Tiêu đề & Slug</th>
                  <th style={{ padding: '8px 10px', width: 120 }}>Chuyên mục</th>
                  <th style={{ padding: '8px 10px', width: 100 }}>Trạng thái</th>
                  <th style={{ padding: '8px 10px', width: 120 }}>Kiểm tra</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((r, i) => (
                  <tr key={r.key} style={{ borderBottom: '1px solid var(--border-hairline)', background: r.done ? (r.success ? 'var(--status-mint-soft)' : 'var(--status-danger-soft)') : 'transparent' }}>
                    <td style={{ padding: '8px 10px', color: 'var(--text-faint)' }}>{i + 1}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{r.title}</div>
                      <div style={{ color: 'var(--text-faint)', fontSize: 11 }}>/{r.slug}</div>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <Badge tone="blue">{CATEGORY_LABEL[r.category] || r.category}</Badge>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <Badge tone={r.status === 'published' ? 'mint' : 'amber'}>
                        {r.status === 'published' ? 'Xuất bản' : 'Bản nháp'}
                      </Badge>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      {r.done ? (
                        r.success ? (
                          <span style={{ color: 'var(--status-mint)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle2 size={13} /> Đã tạo
                          </span>
                        ) : (
                          <span style={{ color: 'var(--status-danger)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <AlertTriangle size={13} /> {r.error}
                          </span>
                        )
                      ) : r.isValid ? (
                        <span style={{ color: 'var(--status-mint)' }}>✓ Hợp lệ</span>
                      ) : (
                        <span style={{ color: 'var(--status-danger)' }}>✗ {r.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Thanh nút hành động */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="ghost" size="md" disabled={isSubmitting} onClick={onClose}>
            {progress?.done ? 'Đóng' : 'Hủy'}
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={isSubmitting || validRows.length === 0}
            onClick={submitBulk}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Layers size={16} />
            {isSubmitting ? 'Đang thêm…' : `Thêm ${validRows.length} bài viết hợp lệ`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * 2. Modal Sinh thông tin SEO hàng loạt cho các bài viết đang bị thiếu
 */
export function BulkSeedPostInfoModal({ open, onClose, posts = [], notify, onCompleted }) {
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null);

  // Lọc các bài viết đang thiếu thông tin (chất lượng < 100% hoặc có issue)
  const incompletePosts = useMemo(() => {
    return posts.filter((p) => {
      const q = p.quality;
      if (!q) return false;
      return !q.hasCover || !q.hasMetaDesc || !q.hasCategory || !q.hasTags;
    });
  }, [posts]);

  // Khởi tạo chọn tất cả các bài thiếu thông tin khi mở modal
  const handleOpen = () => {
    setSelectedIds(new Set(incompletePosts.map((p) => p.id)));
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(incompletePosts.map((p) => p.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const handleRunBulkSeed = async () => {
    const targetPosts = incompletePosts.filter((p) => selectedIds.has(p.id));
    if (targetPosts.length === 0) {
      notify('Chọn ít nhất 1 bài viết để sinh thông tin.');
      return;
    }

    setIsProcessing(true);
    setProgress({ done: 0, total: targetPosts.length, success: 0, fail: 0 });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < targetPosts.length; i++) {
      const p = targetPosts[i];
      try {
        // Lấy chi tiết bài viết hiện tại để giữ nội dung
        const full = await apiClient.get(`/api/admin/blog/posts/${p.id}`);

        const newCategory = (!full.category || full.category === 'general') ? inferCategory(full.title) : full.category;
        const newCover = (full.coverImageUrl && full.coverImageUrl.trim())
          ? full.coverImageUrl
          : DEFAULT_COVER_IMAGES[i % DEFAULT_COVER_IMAGES.length];
        const newMetaTitle = (full.metaTitle && full.metaTitle.trim())
          ? full.metaTitle
          : truncateAt(full.title, 60);
        const newMetaDescription = (full.metaDescription && full.metaDescription.trim())
          ? full.metaDescription
          : truncateAt(`Thông tin chi tiết về ${full.title.toLowerCase()}. Cập nhật ý nghĩa phong thủy, kiến thức chuyên sâu và hướng dẫn sở hữu biển số đẹp tại Biensovip.`, 155);

        const currentTags = full.tags || [];
        const fallbackTags = CATEGORY_TAG_PRESETS[newCategory] || ['biển số đẹp', 'biensovip'];
        const mergedTags = [...new Set([...currentTags, ...fallbackTags])].slice(0, 10);

        const updateBody = {
          title: full.title,
          slug: full.slug,
          category: newCategory,
          coverImageUrl: newCover,
          metaTitle: newMetaTitle,
          metaDescription: newMetaDescription,
          tags: mergedTags,
          contentHtml: full.contentHtml || `<p>${full.title}</p>`,
          status: full.status,
          faqSetIds: (full.faqSets || []).map((f) => f.id),
        };

        await apiClient.put(`/api/admin/blog/posts/${p.id}`, updateBody);
        successCount++;
      } catch {
        failCount++;
      }

      setProgress({
        done: i + 1,
        total: targetPosts.length,
        success: successCount,
        fail: failCount,
      });
    }

    setIsProcessing(false);
    notify(`Đã tự động cập nhật thông tin SEO cho ${successCount} bài viết!`);
    if (onCompleted) onCompleted();
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={() => !isProcessing && onClose()} title="Sinh thông tin & Chuẩn SEO hàng loạt" maxWidth="680px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} onMouseEnter={handleOpen}>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
          Hệ thống sẽ quét các bài viết đang thiếu ảnh đại diện, thiếu thẻ Meta SEO hoặc chưa phân chuyên mục cụ thể, sau đó tự động sinh dữ liệu tối ưu theo chuẩn Google.
        </p>

        {incompletePosts.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', color: 'var(--status-mint)' }}>
            <CheckCircle2 size={32} style={{ marginBottom: 8 }} />
            <div style={{ font: 'var(--type-body)', fontWeight: 'var(--fw-semibold)' }}>Tất cả bài viết trong trang này đã đạt chuẩn đầy đủ thông tin!</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', font: 'var(--type-caption)' }}>
              <span>Đã chọn: <b>{selectedIds.size}/{incompletePosts.length}</b> bài viết</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={selectAll} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--action-primary)', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)' }}>Chọn tất cả</button>
                <button type="button" onClick={deselectAll} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', font: 'var(--type-caption)' }}>Bỏ chọn hết</button>
              </div>
            </div>

            {progress && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--surface-sunken)', padding: '10px 14px', borderRadius: 'var(--radius-field)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--type-caption)' }}>
                  <span>Tiến trình: <b>{progress.done}/{progress.total}</b> bài</span>
                  <span>Hoàn tất: <b style={{ color: 'var(--status-mint)' }}>{progress.success}</b></span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'var(--surface-muted)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                  <div style={{ width: `${(progress.done / progress.total) * 100}%`, height: '100%', background: 'var(--action-primary)', transition: 'width 150ms ease-out' }} />
                </div>
              </div>
            )}

            <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, padding: '4px' }}>
              {incompletePosts.map((p) => {
                const isSelected = selectedIds.has(p.id);
                const q = p.quality;
                return (
                  <div
                    key={p.id}
                    onClick={() => !isProcessing && toggleSelect(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-card)',
                      border: isSelected ? '1px solid var(--action-primary)' : '1px solid var(--border-hairline)',
                      background: isSelected ? 'var(--action-lightest)' : 'var(--white)',
                      cursor: isProcessing ? 'default' : 'pointer',
                      transition: 'all 120ms ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isProcessing}
                      onChange={() => {}}
                      style={{ accentColor: 'var(--action-primary)', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.title}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        {!q?.hasCover && <span style={{ font: 'var(--type-caption)', color: 'var(--status-amber)' }}>• Thiếu ảnh bìa</span>}
                        {!q?.hasMetaDesc && <span style={{ font: 'var(--type-caption)', color: 'var(--status-amber)' }}>• Thiếu Meta SEO</span>}
                        {!q?.hasCategory && <span style={{ font: 'var(--type-caption)', color: 'var(--status-amber)' }}>• Chưa phân chuyên mục</span>}
                        {!q?.hasTags && <span style={{ font: 'var(--type-caption)', color: 'var(--status-amber)' }}>• Chưa gắn tags</span>}
                      </div>
                    </div>
                    <Badge tone={q?.statusTone || 'neutral'}>{q?.score || 0}%</Badge>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="ghost" size="md" disabled={isProcessing} onClick={onClose}>
            {progress?.done ? 'Đóng' : 'Hủy'}
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={isProcessing || selectedIds.size === 0}
            onClick={handleRunBulkSeed}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Sparkles size={16} />
            {isProcessing ? 'Đang xử lý…' : `Tự động sinh cho ${selectedIds.size} bài viết`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
