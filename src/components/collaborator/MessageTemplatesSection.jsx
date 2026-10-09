import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import Button from '../Button.jsx';
import { Badge, Input, Select } from '../index.jsx';
import { useCollaboratorMessageTemplates, useUpdateMessagingProfile } from '../../services/collaborators.js';
import { updateProfile } from '../../services/authService.js';
import { fallbackCopy } from './collaboratorUtils.js';

export default function MessageTemplatesSection({ referralUrl, ctvName, ctvPhone, ctvTitle, ctvZaloLink }) {
  const { data, isLoading, isError } = useCollaboratorMessageTemplates(true);
  const updateMessagingProfile = useUpdateMessagingProfile();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState(null);
  const [plateNumber, setPlateNumber] = useState('');
  const [name, setName] = useState(ctvName || '');
  const [phone, setPhone] = useState(ctvPhone || '');
  const [title, setTitle] = useState(ctvTitle || '');
  const [zaloLink, setZaloLink] = useState(ctvZaloLink || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const items = data || [];
  const categories = [...new Set(items.map((t) => t.category).filter(Boolean))];
  const [filterCategory, setFilterCategory] = useState('');
  const filtered = filterCategory ? items.filter((t) => t.category === filterCategory) : items;

  const saveProfileFields = async () => {
    setSavingProfile(true);
    try {
      await Promise.all([
        updateProfile({ fullName: name.trim() || undefined, phone: phone.trim() || undefined }),
        updateMessagingProfile.mutateAsync({ ctvTitle: title.trim() || undefined, ctvZaloLink: zaloLink.trim() || undefined }),
      ]);
      queryClient.invalidateQueries({ queryKey: ['collaborator-dashboard'] });
      toast.success('Đã lưu thông tin.');
    } catch (e) {
      toast.error(e?.message || 'Lưu thất bại, thử lại sau.');
    } finally {
      setSavingProfile(false);
    }
  };

  const fillTemplate = (body) => body
    .replaceAll('{referralUrl}', referralUrl || '')
    .replaceAll('{plateNumber}', plateNumber || '(chưa nhập số biển)')
    .replaceAll('{ctvName}', name || '(chưa đặt tên hiển thị)')
    .replaceAll('{ctvPhone}', phone || '(chưa có SĐT)')
    .replaceAll('{ctvTitle}', title || '(chưa đặt chức danh)')
    .replaceAll('{ctvZaloLink}', zaloLink || '(chưa có link Zalo)');

  const copyTemplate = (t) => {
    const filled = fillTemplate(t.bodyTemplate);
    const done = () => { setCopiedId(t.id); toast.success('Đã sao chép tin nhắn'); setTimeout(() => setCopiedId(null), 2000); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(filled).then(done).catch(() => fallbackCopy(filled, done));
    else fallbackCopy(filled, done);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
        <div style={{ flex: '1 1 220px' }}>
          <Input label="Số biển đang muốn giới thiệu (tùy chọn)" placeholder="VD: 43A1-999.99" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} />
        </div>
        {categories.length > 0 && (
          <Select label="Lọc danh mục" value={filterCategory} options={[{ value: '', label: 'Tất cả' }, ...categories.map((c) => ({ value: c, label: c }))]} onChange={setFilterCategory} />
        )}
      </div>

      {/* Điền các biến {ctvName}/{ctvPhone}/{ctvTitle}/{ctvZaloLink} tại chỗ */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Thông tin điền vào tin nhắn mẫu</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 'var(--space-3)' }}>
          <Input label="Tên hiển thị" placeholder="VD: Nguyễn Văn A" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Số điện thoại" type="tel" placeholder="09xx xxx xxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="Chức danh (tùy chọn)" placeholder="VD: Tư vấn viên" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Link Zalo (tùy chọn)" placeholder="https://zalo.me/..." value={zaloLink} onChange={(e) => setZaloLink(e.target.value)} />
        </div>
        <Button variant="primary" size="sm" onClick={saveProfileFields} disabled={savingProfile} style={{ alignSelf: 'flex-start' }}>{savingProfile ? 'Đang lưu...' : 'Lưu thông tin'}</Button>
      </div>

      {isLoading && <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</span>}
      {!isLoading && isError && <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không tải được mẫu tin nhắn.</span>}
      {!isLoading && !isError && filtered.length === 0 && (
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có mẫu tin nhắn nào — admin sẽ soạn sẵn để bạn dùng.</span>
      )}
      {filtered.map((t) => (
        <div key={t.id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)', flex: 1 }}>{t.title}</span>
            {t.category && <Badge tone="blue">{t.category}</Badge>}
            {t.channel && <Badge tone="amber">{t.channel}</Badge>}
          </div>
          {t.description && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{t.description}</span>}
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)', whiteSpace: 'pre-wrap' }}>{fillTemplate(t.bodyTemplate)}</p>
          <Button variant="outline" size="sm" onClick={() => copyTemplate(t)} style={{ alignSelf: 'flex-start' }}>{copiedId === t.id ? 'Đã sao chép' : 'Copy tin nhắn'}</Button>
        </div>
      ))}
    </div>
  );
}
