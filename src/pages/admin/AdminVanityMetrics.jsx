import { useEffect, useState } from 'react';
import Button from '../../components/Button.jsx';
import { Input, Switch } from '../../components/index.jsx';
import { useUpdateVanityMetric, useVanityMetrics } from '../../services/adminVanityMetrics.js';
import { SkeletonTable } from '../../components/Skeleton.jsx';

// UC38 — số liệu hiển thị "ảo": bật/tắt + hệ số khuếch đại số liệu hiển thị công khai,
// KHÔNG đụng dữ liệu giao dịch thật. Mặc định tắt (mọi nơi hiển thị số thật).
const META = {
  PlateContact: { label: 'Liên hệ trong ngày', desc: 'Lượt khách liên hệ/tư vấn cho biển — tăng dần quanh mức thật.', hasCap: true },
  PlateView: { label: 'Lượt xem biển', desc: 'Tổng lượt xem trên trang chi tiết biển.', hasCap: true },
  PlateFavorite: { label: 'Lượt yêu thích', desc: 'Số người đã lưu/thả tim biển.', hasCap: true },
  PlateLiveViewer: { label: 'Đang xem trực tiếp', desc: 'Badge “X người đang xem” trên trang chi tiết biển.', hasCap: false },
  SiteStats: { label: 'Thống kê tổng quan site', desc: 'Số giao dịch/khách hàng hiển thị ở vùng thống kê.', hasCap: true },
  ActivityFeed: { label: 'Feed hoạt động gần đây', desc: 'Dòng “Khách vừa liên hệ biển…” hiển thị công khai.', hasCap: false },
  SiteRating: { label: 'Điểm đánh giá trung bình', desc: 'Sao + số đánh giá; nếu chưa thực thì fake quanh mức nền.', hasCap: true },
  VideoStats: { label: 'Thống kê video', desc: 'Lượt xem/thích tăng dần cho video TikTok/Facebook.', hasCap: true },
};

export default function AdminVanityMetrics({ notify }) {
  const { data, isLoading, isError, refetch } = useVanityMetrics();
  const update = useUpdateVanityMetric();
  const [drafts, setDrafts] = useState({}); // type -> { multiplier: string, cap: string }

  const items = (data || []);

  // Khởi tạo draft khi data đầu tiên về (sau khi isLoading = false).
  useEffect(() => {
    if (!data) return;
    const d = {};
    for (const it of data) {
      if (!drafts[it.type]) {
        d[it.type] = { multiplier: `${it.multiplier}`, cap: it.cap == null ? '' : `${it.cap}` };
      }
    }
    if (Object.keys(d).length) setDrafts((p) => ({ ...p, ...d }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // enabled = trạng thái mới muốn lưu (bật/tắt); source đọc từ data, nhả draft khi thay đổi.
  const doSave = (item, enabled) => {
    // Nhả draft → reset về mặc định mỗi khi bật lại (khi tắt thì không cần giá trị).
    const d = enabled ? { multiplier: '1', cap: '' } : { multiplier: `${item.multiplier}`, cap: item.cap == null ? '' : `${item.cap}` };
    const multiplier = parseFloat(d.multiplier);
    const payload = { enabled, multiplier };
    if (META[item.type]?.hasCap) {
      const cap = d.cap === '' || d.cap == null ? null : parseInt(d.cap, 10);
      if (cap !== null && (!Number.isInteger(cap) || cap < 0)) { notify('Trần phải là số ≥ 0 (để trống = không giới hạn)'); return; }
      payload.cap = cap;
    }
    update.mutate({ type: item.type, ...payload }, {
      onSuccess: () => { notify(`${enabled ? 'Đã bật' : 'Đã tắt'} “${META[item.type].label}”.`); if (enabled) patchDraft(item.type, 'multiplier', ''); },
      onError: (err) => notify(err.message || 'Cập nhật thất bại, thử lại.'),
    });
  };

  const toggle = (item) => {
    if (!item.enabled) { doSave(item, true); return; }
    // Tắt: tôn trọng hệ số/trần đang chỉnh nếu admin vừa bấm Lưu riêng; đơn giản tắt với mặc định.
    doSave(item, false);
  };

  const saveWithDraft = (item) => {
    const d = drafts[item.type] || {};
    const multiplier = parseFloat(d.multiplier);
    if (Number.isNaN(multiplier) || multiplier < 1 || multiplier > 20) { notify('Hệ số phải nằm trong khoảng 1 – 20'); return; }
    const payload = { enabled: true, multiplier };
    if (META[item.type]?.hasCap) {
      const cap = d.cap === '' || d.cap == null ? null : parseInt(d.cap, 10);
      if (cap !== null && (!Number.isInteger(cap) || cap < 0)) { notify('Trần phải là số ≥ 0 (để trống = không giới hạn)'); return; }
      payload.cap = cap;
    }
    update.mutate({ type: item.type, ...payload }, {
      onSuccess: () => notify(`Đã cập nhật “${META[item.type].label}”.`),
      onError: (err) => notify(err.message || 'Cập nhật thất bại, thử lại.'),
    });
  };

  const patchDraft = (type, key, val) => setDrafts((p) => ({ ...p, [type]: { ...(p[type] || {}), [key]: val } }));

  if (isLoading) return <SkeletonTable rows={8} cols={3} />;
  if (isError) return (
    <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
      <p style={{ color: 'var(--text-muted)' }}>Không tải được cấu hình số liệu hiển thị.</p>
      <Button variant="outline" onClick={refetch}>Thử lại</Button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
        Các con số này chỉ <strong>hiển thị công khai</strong> — khuếch đại/tạo thêm nhằm tăng độ tin cậy, không làm thay đổi dữ liệu giao dịch, hoa hồng hay thống kê nội bộ. Tắt hết (mặc định) thì mọi nơi hiển thị số liệu thật. Bật từng ô và chỉnh “hệ số” để khuếch đại; “trần” là con số tối đa hiển thị (để trống = không giới hạn).
      </p>
      {items.map((item) => {
        const meta = META[item.type];
        if (!meta) return null;
        const d = drafts[item.type] || {};
        const busy = update.isPending && update.variables?.type === item.type;
        return (
          <div key={item.type} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Switch checked={!!item.enabled} onChange={() => toggle(item)} disabled={update.isPending} label={meta.label} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: 'var(--type-body)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{meta.label}</div>
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{meta.desc}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div style={{ width: 110 }}>
                <Input label="Hệ số" type="number" min={1} max={20} step={0.5}
                  value={d.multiplier ?? `${item.multiplier}`}
                  onChange={(e) => patchDraft(item.type, 'multiplier', e.target.value)} disabled={!item.enabled} />
              </div>
              {meta.hasCap && (
                <div style={{ width: 130 }}>
                  <Input label="Trần (tối đa)" type="number" min={0} step={1} placeholder="Không giới hạn"
                    value={d.cap ?? (item.cap == null ? '' : `${item.cap}`)}
                    onChange={(e) => patchDraft(item.type, 'cap', e.target.value)} disabled={!item.enabled} />
                </div>
              )}
              <Button variant="outline" size="sm" disabled={!item.enabled} onClick={() => saveWithDraft(item)} loading={busy}>Lưu</Button>
            </div>
          </div>
        );
      })}
      {!items.some((x) => x.enabled) && (
        <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Mọi loại đang tắt — website hiển thị số liệu thật.</div>
      )}
    </div>
  );
}
