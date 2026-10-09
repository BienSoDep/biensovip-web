import { useEffect, useState, useMemo } from 'react';
import {
  Sparkles, CheckCircle2, ShieldCheck, Eye, RotateCw,
  TrendingUp, Sliders, Info, Zap, AlertCircle
} from 'lucide-react';
import Button from '../../components/Button.jsx';
import { Input, Switch } from '../../components/index.jsx';
import { useUpdateVanityMetric, useVanityMetrics } from '../../services/adminVanityMetrics.js';
import { SkeletonTable } from '../../components/Skeleton.jsx';

// UC38 — số liệu hiển thị "ảo": bật/tắt + hệ số khuếch đại số liệu hiển thị công khai,
// KHÔNG đụng dữ liệu giao dịch thật. Mặc định tắt (mọi nơi hiển thị số thật).
const META = {
  PlateContact: { label: 'Liên hệ trong ngày', desc: 'Lượt khách liên hệ/tư vấn cho biển — tăng dần quanh mức thật.', hasCap: true, unit: 'lượt' },
  PlateView: { label: 'Lượt xem biển', desc: 'Tổng lượt xem trên trang chi tiết biển.', hasCap: true, unit: 'view' },
  PlateFavorite: { label: 'Lượt yêu thích', desc: 'Số người đã lưu/thả tim biển.', hasCap: true, unit: 'tim' },
  PlateLiveViewer: { label: 'Đang xem trực tiếp', desc: 'Badge “X người đang xem” trên trang chi tiết biển.', hasCap: false, unit: 'người' },
  SiteStats: { label: 'Thống kê tổng quan website', desc: 'Số giao dịch/khách hàng hiển thị ở vùng chân trang & banner.', hasCap: true, overrideLabels: ['Số giao dịch cố định', 'Số khách hàng cố định'] },
  ActivityFeed: { label: 'Feed hoạt động gần đây', desc: 'Dòng “Khách vừa liên hệ biển…” hiển thị tự động ngoài trang chủ.', hasCap: false },
  SiteRating: { label: 'Điểm đánh giá trung bình', desc: 'Sao + số đánh giá; nếu chưa có thì hiển thị nền uy tín.', hasCap: true, overrideLabels: ['Điểm TB cố định (0-5)', 'Số đánh giá cố định'] },
  VideoStats: { label: 'Thống kê video TikTok / Shorts', desc: 'Lượt xem/thích tăng dần cho video giới thiệu biển.', hasCap: true, unit: 'tương tác' },
};

export default function AdminVanityMetrics({ notify }) {
  const { data, isLoading, isError, refetch } = useVanityMetrics();
  const update = useUpdateVanityMetric();
  const [drafts, setDrafts] = useState({}); // type -> { multiplier, cap, overrideValue1, overrideValue2 }

  const items = data || [];

  // Khởi tạo draft khi data đầu tiên về
  useEffect(() => {
    if (!data) return;
    const d = {};
    for (const it of data) {
      if (!drafts[it.type]) {
        d[it.type] = {
          multiplier: `${it.multiplier}`,
          cap: it.cap == null ? '' : `${it.cap}`,
          overrideValue1: it.overrideValue1 == null ? '' : `${it.overrideValue1}`,
          overrideValue2: it.overrideValue2 == null ? '' : `${it.overrideValue2}`,
        };
      }
    }
    if (Object.keys(d).length) setDrafts((p) => ({ ...p, ...d }));
  }, [data]);

  // Thống kê
  const stats = useMemo(() => {
    const total = items.length;
    const enabledCount = items.filter((x) => x.enabled).length;
    const realCount = total - enabledCount;
    return { total, enabledCount, realCount };
  }, [items]);

  const patchDraft = (type, key, val) => setDrafts((p) => ({ ...p, [type]: { ...(p[type] || {}), [key]: val } }));

  const doSave = (item, enabled) => {
    const d = enabled ? { multiplier: '1', cap: '' } : { multiplier: `${item.multiplier}`, cap: item.cap == null ? '' : `${item.cap}` };
    const multiplier = parseFloat(d.multiplier);
    const payload = { enabled, multiplier };
    if (META[item.type]?.hasCap) {
      const cap = d.cap === '' || d.cap == null ? null : parseInt(d.cap, 10);
      if (cap !== null && (!Number.isInteger(cap) || cap < 0)) {
        notify?.('Trần phải là số ≥ 0 (để trống = không giới hạn)');
        return;
      }
      payload.cap = cap;
    }
    update.mutate({ type: item.type, ...payload }, {
      onSuccess: () => {
        notify?.(`${enabled ? 'Đã bật khuếch đại' : 'Đã chuyển về số liệu thật'} cho “${META[item.type].label}”.`);
        if (enabled) patchDraft(item.type, 'multiplier', '');
      },
      onError: (err) => notify?.(err.message || 'Cập nhật thất bại, thử lại.'),
    });
  };

  const toggle = (item) => {
    if (!item.enabled) { doSave(item, true); return; }
    doSave(item, false);
  };

  const saveWithDraft = (item) => {
    const d = drafts[item.type] || {};
    const multiplier = parseFloat(d.multiplier);
    if (Number.isNaN(multiplier) || multiplier < 1 || multiplier > 20) {
      notify?.('Hệ số phải nằm trong khoảng 1 – 20');
      return;
    }
    const payload = { enabled: true, multiplier };
    if (META[item.type]?.hasCap) {
      const cap = d.cap === '' || d.cap == null ? null : parseInt(d.cap, 10);
      if (cap !== null && (!Number.isInteger(cap) || cap < 0)) {
        notify?.('Trần phải là số ≥ 0 (để trống = không giới hạn)');
        return;
      }
      payload.cap = cap;
    }
    if (META[item.type]?.overrideLabels) {
      const parseOverride = (raw, max) => {
        if (raw === '' || raw == null) return { ok: true, val: null };
        const n = parseFloat(raw);
        if (Number.isNaN(n) || n < 0 || (max != null && n > max)) return { ok: false };
        return { ok: true, val: n };
      };
      const ov1 = parseOverride(d.overrideValue1, item.type === 'SiteRating' ? 5 : null);
      const ov2 = parseOverride(d.overrideValue2, null);
      if (!ov1.ok || !ov2.ok) {
        notify?.('Số cố định không hợp lệ (để trống = dùng công thức).');
        return;
      }
      payload.overrideValue1 = ov1.val;
      payload.overrideValue2 = ov2.val;
    }
    update.mutate({ type: item.type, ...payload }, {
      onSuccess: () => notify?.(`Đã lưu cấu hình “${META[item.type].label}”.`),
      onError: (err) => notify?.(err.message || 'Cập nhật thất bại, thử lại.'),
    });
  };

  if (isLoading) return <SkeletonTable rows={6} cols={3} />;

  if (isError) return (
    <div style={{ padding: 48, textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
      <span>Không tải được cấu hình số liệu hiển thị.</span>
      <Button variant="ghost" size="sm" onClick={() => refetch()}>Thử lại</Button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* 3 Thẻ KPI Thống kê trạng thái số liệu */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-3)' }}>
        <div style={{ background: 'var(--white)', padding: '16px 20px', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sliders size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tổng chỉ số cấu hình</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: 'var(--text-strong)' }}>{stats.total}</div>
          </div>
        </div>

        <div style={{ background: 'var(--white)', padding: '16px 20px', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đang bật khuếch đại</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: '#d97706' }}>
              {stats.enabledCount} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-faint)' }}>chỉ số</span>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--white)', padding: '16px 20px', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Hiển thị số liệu thật 100%</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: '#059669' }}>
              {stats.realCount} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-faint)' }}>chỉ số</span>
            </div>
          </div>
        </div>
      </div>

      {/* Banner lưu ý an toàn */}
      <div style={{
        background: 'rgba(59, 130, 246, 0.06)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: 'var(--radius-card)',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Info size={18} color="#2563eb" />
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: '#1e40af', lineHeight: 1.5 }}>
            Các cấu hình này <strong>chỉ áp dụng hiển thị công khai</strong> ra giao diện người dùng nhằm tăng tương tác, <strong>hoàn toàn không thay đổi</strong> dữ liệu giao dịch, đơn hàng hay đối soát hoa hồng nội bộ.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          title="Làm mới"
          style={{
            height: 32,
            padding: '0 10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            borderRadius: 'var(--radius-field)',
            border: '1px solid var(--border-hairline)',
            background: 'var(--white)',
            cursor: 'pointer',
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          <RotateCw size={13} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Grid thẻ cấu hình số liệu */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-4)' }}>
        {items.map((item) => {
          const meta = META[item.type];
          if (!meta) return null;
          const d = drafts[item.type] || {};
          const busy = update.isPending && update.variables?.type === item.type;
          const currentMultiplier = parseFloat(d.multiplier || item.multiplier || 1);

          return (
            <div
              key={item.type}
              style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-card)',
                boxShadow: 'var(--shadow-inset-hairline)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                borderLeft: item.enabled ? '4px solid #f59e0b' : '4px solid #10b981',
                transition: 'all 120ms ease',
              }}
            >
              {/* Card Header: Switch + Label + Status Pill */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ paddingTop: 2 }}>
                    <Switch checked={!!item.enabled} onChange={() => toggle(item)} disabled={update.isPending} />
                  </div>
                  <div>
                    <div style={{ font: 'var(--type-body)', fontWeight: 700, color: 'var(--text-strong)' }}>
                      {meta.label}
                    </div>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                      {meta.desc}
                    </div>
                  </div>
                </div>

                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 11,
                  fontWeight: 600,
                  background: item.enabled ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  color: item.enabled ? '#d97706' : '#059669',
                  border: item.enabled ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                  flexShrink: 0,
                }}>
                  {item.enabled ? <Zap size={11} /> : <ShieldCheck size={11} />}
                  <span>{item.enabled ? 'Khuếch đại' : 'Số thật'}</span>
                </span>
              </div>

              {/* Inputs */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 'var(--space-3)',
                flexWrap: 'wrap',
                background: 'var(--surface-sunken)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-field)'
              }}>
                <div style={{ width: 100 }}>
                  <Input
                    label="Hệ số (1 - 20x)"
                    type="number"
                    min={1}
                    max={20}
                    step={0.5}
                    value={d.multiplier ?? `${item.multiplier}`}
                    onChange={(e) => patchDraft(item.type, 'multiplier', e.target.value)}
                    disabled={!item.enabled}
                    required
                  />
                </div>

                {meta.hasCap && (
                  <div style={{ width: 130 }}>
                    <Input
                      label="Trần tối đa"
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Không giới hạn"
                      value={d.cap ?? (item.cap == null ? '' : `${item.cap}`)}
                      onChange={(e) => patchDraft(item.type, 'cap', e.target.value)}
                      disabled={!item.enabled}
                    />
                  </div>
                )}

                <Button
                  variant="primary"
                  size="sm"
                  disabled={!item.enabled}
                  onClick={() => saveWithDraft(item)}
                  loading={busy}
                  style={{ height: 40 }}
                >
                  Lưu
                </Button>
              </div>

              {/* Live Preview Calculation */}
              {item.enabled && meta.unit && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontStyle: 'italic' }}>
                  <span>Ví dụ: Thực tế có 10 {meta.unit} ➔ Website hiển thị ~{Math.round(10 * currentMultiplier)} {meta.unit}</span>
                </div>
              )}

              {/* Override Fields (cho SiteStats & SiteRating) */}
              {meta.overrideLabels && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  paddingTop: 8,
                  borderTop: '1px dashed var(--border-hairline)'
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-strong)' }}>
                    Gán giá trị hiển thị cố định (bỏ qua công thức nếu điền):
                  </span>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 140px' }}>
                      <Input
                        label={meta.overrideLabels[0]}
                        type="number"
                        min={0}
                        step={meta.overrideLabels[0].includes('Điểm') ? 0.1 : 1}
                        placeholder="Để trống = công thức"
                        value={d.overrideValue1 ?? ''}
                        onChange={(e) => patchDraft(item.type, 'overrideValue1', e.target.value)}
                        disabled={!item.enabled}
                      />
                    </div>
                    <div style={{ flex: '1 1 140px' }}>
                      <Input
                        label={meta.overrideLabels[1]}
                        type="number"
                        min={0}
                        step={1}
                        placeholder="Để trống = công thức"
                        value={d.overrideValue2 ?? ''}
                        onChange={(e) => patchDraft(item.type, 'overrideValue2', e.target.value)}
                        disabled={!item.enabled}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
