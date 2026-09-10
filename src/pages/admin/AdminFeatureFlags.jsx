import { Switch } from '../../components/index.jsx';
import { useAdminFeatureFlags, useUpdateFeatureFlag } from '../../services/adminFeatureFlags.js';
import { useSiteSettings, useUpdatePlateImagesSetting } from '../../services/siteSettings.js';
import { formatDate } from '../../lib/date.js';

const FLAG_LABEL = {
  ai_chatbot_enabled: 'Trợ lý AI (widget chat góc phải)',
  vanity_metrics_enabled: 'Số liệu hiển thị (site-stats/rating/activity feed)',
  ctv_deal_report_enabled: 'CTV tự báo giao dịch ngoài nền tảng',
};

export default function AdminFeatureFlags({ notify }) {
  const { data, isLoading, isError, refetch } = useAdminFeatureFlags();
  const updateFlag = useUpdateFeatureFlag();
  const { data: settings } = useSiteSettings();
  const updateImages = useUpdatePlateImagesSetting();

  const items = data || [];

  const toggle = (key, enabled) => {
    updateFlag.mutate({ key, enabled }, {
      onSuccess: () => notify?.(enabled ? 'Đã bật' : 'Đã tắt'),
      onError: (err) => notify?.(err.message || 'Cập nhật thất bại'),
    });
  };

  const toggleImages = (v) => {
    updateImages.mutate(v, {
      onSuccess: () => notify?.(v ? 'Đã bật hiển thị ảnh sinh tự động' : 'Đã chuyển về hiển thị biển số chữ (PlateVisual)'),
      onError: (err) => notify?.(err.message || 'Cập nhật thất bại'),
    });
  };

  if (isLoading) return <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>;
  if (isError) return (
    <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <span>Lỗi tải dữ liệu</span>
      <button type="button" onClick={() => refetch()} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none' }}>Thử lại</button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>Hiển thị ảnh biển số sinh tự động</span>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
            Tắt = toàn site hiện biển số chữ (PlateVisual) mặc định. Bật = ưu tiên ảnh sinh tự động cho biển đã có ảnh. Áp dụng ngay mọi trang.
          </span>
        </div>
        <Switch checked={Boolean(settings?.showGeneratedPlateImages)} onChange={toggleImages} disabled={updateImages.isPending} />
      </div>
      {items.map((f) => (
        <div key={f.id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{FLAG_LABEL[f.key] || f.key}</span>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Cập nhật lần cuối: {formatDate(f.updatedAt)}</span>
          </div>
          <Switch checked={f.enabled} onChange={(v) => toggle(f.key, v)} disabled={updateFlag.isPending} />
        </div>
      ))}
    </div>
  );
}
