import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, X, Sparkles } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import Button from '../components/Button.jsx';
import PlateVisual from '../components/PlateVisual.jsx';
import { useCompareIds, useComparePlates } from '../services/compareService.js';
import { useScorePlates } from '../services/fengshuiService.js';
import { splitPlateNumber, formatPrice, splitFengShuiParagraphs } from '../lib/plateFormat.js';
import { compareInsights, patternScore } from '../lib/compareInsights.js';

const ROW_LABELS = [
  { key: 'type', label: 'Loại biển' },
  { key: 'province', label: 'Tỉnh / thành' },
  { key: 'vehicleType', label: 'Loại xe' },
  { key: 'price', label: 'Giá' },
];

// Đoạn không có nhãn rõ (VD câu mở đầu "Con số 1 – Nhất: ...") gom vào 1 hàng chung "Ý nghĩa con số".
const UNLABELED_ROW = 'Ý nghĩa con số';

// Union toàn bộ nhãn đoạn xuất hiện ở bất kỳ biển nào → mỗi nhãn 1 hàng riêng trong bảng so sánh.
function buildFengShuiRows(plates) {
  const perPlate = plates.map((p) => {
    const paras = splitFengShuiParagraphs(p.fengShuiMeaning);
    const byLabel = {};
    for (const para of paras) {
      const label = para.label ? para.label.replace(/:$/, '') : UNLABELED_ROW;
      byLabel[label] = byLabel[label] ? `${byLabel[label]} ${para.rest}` : para.rest;
    }
    return { id: p.id, byLabel };
  });
  const labelOrder = [];
  for (const pp of perPlate) for (const label of Object.keys(pp.byLabel)) if (!labelOrder.includes(label)) labelOrder.push(label);
  return labelOrder.map((label) => ({
    label,
    values: perPlate.map((pp) => ({ id: pp.id, text: pp.byLabel[label] || null })),
  }));
}

// Chuẩn hóa giá trong nhóm đang so sánh → điểm 0-100 (rẻ nhất = 100, đắt nhất = điểm sàn 20).
function priceScores(plates) {
  const prices = plates.map((p) => p.price).filter((v) => typeof v === 'number' && v > 0);
  if (prices.length < 2) return plates.map(() => 100);
  const min = Math.min(...prices), max = Math.max(...prices);
  if (min === max) return plates.map(() => 100);
  return plates.map((p) => {
    if (typeof p.price !== 'number' || p.price <= 0) return 50;
    return Math.round(100 - ((p.price - min) / (max - min)) * 80);
  });
}

const CHART_COLORS = ['#F97316', '#2563EB', '#16A34A'];

const CURRENT_YEAR = new Date().getFullYear();
const daysInMonth = (year, month) => new Date(year, month, 0).getDate();

const birthInputStyle = {
  width: '100%', height: 40, padding: '0 12px', borderRadius: 'var(--radius-field)',
  background: 'var(--surface-sunken)', boxShadow: 'var(--shadow-inset-hairline)',
  border: 'none', font: 'var(--type-body-sm)', color: 'var(--text-strong)',
  outline: 'none', textAlign: 'center', boxSizing: 'border-box',
};

function BirthDatePrompt({ onSubmit }) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const set = { day: setDay, month: setMonth, year: setYear };
  const pad = (n) => String(n).padStart(2, '0');

  // Giới hạn hợp lệ theo trường (trừ năm — để người dùng tự gõ thoải mái, không cân);
  // ngày dùng số ngày thực của tháng/năm đang chọn (tháng 2 → 28/29).
  const bounds = (f) => {
    if (f === 'month') return { min: 1, max: 12 };
    const y = Number(year) || CURRENT_YEAR, m = Number(month) || 1;
    return { min: 1, max: daysInMonth(y, m) };
  };
  const clamp = (f, v) => {
    if (v === '' || f === 'year') return v;
    const n = Number(v);
    if (Number.isNaN(n)) return '';
    const { min, max } = bounds(f);
    return String(Math.min(Math.max(Math.round(n), min), max));
  };
  const def = (f) => (f === 'year' ? CURRENT_YEAR : 1);
  // Lăn chuột: lên tăng, xuống giảm, chặn cuộn trang để chỉ đổi giá trị ô.
  const wheel = (f) => (e) => {
    e.preventDefault();
    const cur = f === 'year' ? year : f === 'month' ? month : day;
    const dir = e.deltaY < 0 ? 1 : -1;
    set[f](clamp(f, (Number(cur) || def(f)) + dir));
  };
  const field = (f, label) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: f === 'year' ? '112px' : '84px' }}>
      <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>{label}</span>
      <input
        type="number"
        value={f === 'year' ? year : f === 'month' ? month : day}
        {...(f === 'year' ? {} : { min: bounds(f).min, max: bounds(f).max })}
        placeholder={def(f)}
        onChange={(e) => set[f](clamp(f, e.target.value))}
        onBlur={() => set[f](clamp(f, (f === 'year' ? year : f === 'month' ? month : day)))}
        onWheel={wheel(f)}
        style={birthInputStyle}
      />
    </div>
  );

  const valid = (() => {
    const d = Number(day), m = Number(month), y = Number(year);
    if (!d || !m || !y) return false;
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-5)', textAlign: 'center' }}>
      <Sparkles size={28} style={{ color: 'var(--action-primary)' }} />
      <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)', maxWidth: 420 }}>
        Nhập ngày sinh để xem điểm <strong>hợp mệnh</strong> của từng biển trong biểu đồ so sánh — hoặc <a href="#/register" style={{ color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>đăng ký tài khoản</a> để lưu lại cho lần sau.
      </p>
      <form
        onSubmit={(e) => { e.preventDefault(); if (valid) onSubmit(`${year}-${pad(month)}-${pad(day)}`); }}
        style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end' }}
      >
        {field('day', 'Ngày')}
        {field('month', 'Tháng')}
        {field('year', 'Năm')}
        <Button type="submit" variant="primary" size="md" disabled={!valid}>Xem điểm hợp mệnh</Button>
      </form>
    </div>
  );
}

export default function Compare({ go, notify, allPlates, user, openPlate }) {
  const { ids, remove, clear } = useCompareIds();
  const { data, isLoading, isFetching, isPlaceholderData, isError, refetch } = useComparePlates(ids);
  // Fall back to the in-app plate list when the API is unavailable (mock/dev).
  const apiPlates = data?.items || [];
  const plates = (apiPlates.length > 0)
    ? apiPlates
    : (allPlates || []).filter((p) => ids.includes(p.id));

  const [birthDate, setBirthDate] = useState(user?.birthDate || null);
  const scoreMutation = useScorePlates();

  const removePlate = (id) => {
    remove(id);
    if (ids.length <= 2) notify('Cần ít nhất 2 biển số để so sánh có ý nghĩa');
  };

  const insights = useMemo(() => compareInsights(plates), [plates]);
  const fengShuiRows = useMemo(() => buildFengShuiRows(plates), [plates]);
  const priceScoreList = useMemo(() => priceScores(plates), [plates]);

  // Dọn ID cũ trỏ tới biển đã bị xóa/không tồn tại — tránh badge đếm lệch với số biển thật hiện được.
  // Bỏ qua khi đang fetch hoặc data còn là placeholder (React Query giữ data cũ lúc ids vừa đổi) —
  // nếu không sẽ tưởng nhầm ID mới thêm là "stale" và xóa oan trước khi API kịp trả kết quả.
  useEffect(() => {
    if (isLoading || isFetching || isPlaceholderData || isError || ids.length === 0) return;
    const resolvedIds = new Set(plates.map((p) => p.id));
    const staleIds = ids.filter((id) => !resolvedIds.has(id));
    staleIds.forEach(remove);
  }, [isLoading, isFetching, isPlaceholderData, isError, ids, plates, remove]);

  // Chấm điểm hợp mệnh khi có ngày sinh + đủ biển hợp lệ.
  useEffect(() => {
    if (!birthDate || plates.length < 2) return;
    scoreMutation.mutate({ birthDate, plateIds: plates.map((p) => p.id) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birthDate, plates.map((p) => p.id).join(',')]);

  // Empty: no IDs at all
  if (ids.length === 0) {
    return (
      <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-4)' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>So sánh biển số</h1>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chọn tối đa 3 biển để so sánh cạnh nhau.</p>
          </div>
        </div>
        <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '64px var(--space-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-pill)', background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeftRight size={28} style={{ color: 'var(--text-muted)' }} /></div>
          <div><h2 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Chưa có biển để so sánh</h2><p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Duyệt kho biển số và nhấn "So sánh" để thêm vào đây.</p></div>
          <Button variant="primary" size="md" onClick={go('list')}>Xem danh sách biển</Button>
        </div>
      </div>
    );
  }

  // Insufficient: only 1 plate
  if (ids.length === 1) {
    return (
      <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-4)' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>So sánh biển số</h1>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Cần ít nhất 2 biển để so sánh.</p>
          </div>
        </div>
        <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '64px var(--space-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-pill)', background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeftRight size={28} style={{ color: 'var(--text-muted)' }} /></div>
          <div><h2 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Cần thêm 1 biển nữa</h2><p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chọn thêm ít nhất 1 biển số từ danh sách để bắt đầu so sánh.</p></div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button variant="primary" size="md" onClick={go('list')}>Xem danh sách biển</Button>
            <Button variant="ghost" size="md" onClick={clear}>Bỏ chọn</Button>
          </div>
        </div>
      </div>
    );
  }

  const scoreItems = scoreMutation.data?.items || [];
  const scoreByPlateId = Object.fromEntries(scoreItems.map((it) => [it.plateId, it.score]));

  const radarData = ['Hợp mệnh', 'Mẫu đẹp', 'Giá trị', 'Độ hot'].map((axis) => {
    const row = { axis };
    plates.forEach((p, i) => {
      const val = axis === 'Hợp mệnh' ? (birthDate ? (scoreByPlateId[p.id] ?? 0) : 0)
        : axis === 'Mẫu đẹp' ? patternScore(insights.perPlate.find((pi) => pi.id === p.id)?.patterns)
        : axis === 'Giá trị' ? priceScoreList[i]
        : (p.isHot ? 100 : 40);
      row[p.plateNumber] = val;
    });
    return row;
  });

  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-4)' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>So sánh biển số</h1>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{plates.length}/{ids.length} biển — so sánh cạnh nhau.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" size="md" onClick={go('list')}>Thêm biển</Button>
          <Button variant="ghost" size="md" onClick={clear}>Xóa tất cả</Button>
        </div>
      </div>

      {!isLoading && !isError && plates.length >= 2 && (
        <div style={{ background: 'linear-gradient(180deg, var(--orange-50) 0%, var(--white) 100%)', border: '1px solid var(--orange-100)', borderRadius: 'var(--radius-card)', padding: 'var(--space-5) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h2 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Điểm chung &amp; điểm riêng phong thủy</h2>

          <div>
            <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)', marginBottom: 'var(--space-2)' }}>Điểm chung</div>
            {insights.commonPatterns.length === 0 && !insights.commonElement ? (
              <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-muted)', fontStyle: 'italic' }}>Không có mẫu đẹp hay ngũ hành nào trùng nhau giữa các biển đã chọn.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {insights.commonElement && (
                  <li style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>Cùng ngũ hành <strong>{insights.commonElementLabel}</strong> (theo số cuối)</li>
                )}
                {insights.commonPatterns.map((label) => (
                  <li key={label} style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>Cùng mẫu đẹp: <strong>{label}</strong></li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${plates.length},1fr)`, gap: 'var(--space-4)' }}>
            {insights.perPlate.map((pi) => {
              const plate = plates.find((p) => p.id === pi.id);
              return (
                <div key={pi.id}>
                  <div style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 'var(--space-2)' }}>{plate?.plateNumber} — điểm riêng</div>
                  {pi.uniquePatterns.length === 0 && (insights.commonElement || pi.element === insights.commonElement) ? (
                    <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-muted)', fontStyle: 'italic' }}>Không có điểm riêng nổi bật ngoài phần chung.</p>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {!insights.commonElement && pi.element && (
                        <li style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>Ngũ hành <strong>{insights.elementLabel[pi.element]}</strong></li>
                      )}
                      {pi.uniquePatterns.map((label) => (
                        <li key={label} style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{label}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isLoading && !isError && plates.length >= 2 && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--orange-100)', borderRadius: 'var(--radius-card)', padding: 'var(--space-5) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h2 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Chấm điểm tự động</h2>
          {!birthDate ? (
            <BirthDatePrompt onSubmit={setBirthDate} />
          ) : (
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--orange-100)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 13, fill: 'var(--text-body)' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  {plates.map((p, i) => (
                    <Radar key={p.id} name={p.plateNumber} dataKey={p.plateNumber} stroke={CHART_COLORS[i % 3]} fill={CHART_COLORS[i % 3]} fillOpacity={0.25} />
                  ))}
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '64px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải dữ liệu so sánh…</div>
      ) : isError ? (
        <div style={{ padding: '64px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>Lỗi tải dữ liệu so sánh</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Thử lại</Button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${plates.length},minmax(220px,1fr))`, minWidth: plates.length * 240 + 210 }}>
            <div style={{ padding: 'var(--space-3) var(--space-4)', font: 'var(--type-caption)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Thuộc tính</div>
            {plates.map((p) => {
              const { prov, seri, num } = splitPlateNumber(p.plateNumber);
              return (
                <div key={p.id} style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--orange-50)', border: '1px solid var(--orange-100)', borderBottom: 'none', borderRadius: 'var(--radius-card) var(--radius-card) 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)', position: 'relative' }}>
                  <button onClick={() => removePlate(p.id)} aria-label="Bỏ khỏi so sánh" style={{ position: 'absolute', top: 2, right: 2, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Bỏ khỏi so sánh"><X size={16} /></button>
                  {p.thumbnailUrl ? (
                    <img src={p.thumbnailUrl} alt={p.plateNumber} style={{ width: 120, height: 65, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  ) : (
                    <PlateVisual size="md" prov={prov} seri={seri} num={num} />
                  )}
                  <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{p.plateNumber}</span>
                  <button onClick={() => openPlate(p.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--action-primary)' }}>Xem chi tiết</button>
                </div>
              );
            })}
            {ROW_LABELS.map((row) => {
              const values = row.key === 'price' ? [] : plates.map((p) => p[row.key]);
              const allSame = values.length >= 2 && values.every((v) => v && v === values[0]);
              return (
              <>
                <div key={`h-${row.key}`} style={{ padding: 'var(--space-3) var(--space-4)', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', background: 'var(--orange-50)' }}>{row.label}</div>
                {plates.map((p) => (
                  <div key={p.id} style={{ padding: 'var(--space-3) var(--space-4)', font: 'var(--type-body-sm)', color: 'var(--text-body)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', textAlign: 'center', background: allSame ? 'var(--green-50)' : undefined }}>
                    {row.key === 'price' ? (
                      <span style={{ font: 'var(--type-price)', color: 'var(--text-strong)' }}>{formatPrice(p.price, false)}</span>
                    ) : (
                      p[row.key] || '—'
                    )}
                  </div>
                ))}
              </>
              );
            })}

            {/* Ý nghĩa phong thủy — mỗi nhãn đoạn (Ngũ hành, Vận trình, Lời khuyên...) 1 hàng riêng để dễ so
                sánh ngang; biển nào không có đoạn tương ứng hiện dấu "–". */}
            {fengShuiRows.length === 0 ? (
              <>
                <div key="h-fengshui-empty" style={{ padding: 'var(--space-3) var(--space-4)', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', background: 'var(--orange-50)' }}>Ý nghĩa phong thủy</div>
                {plates.map((p) => (
                  <div key={p.id} style={{ padding: 'var(--space-3) var(--space-4)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', textAlign: 'center' }}>
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa có</span>
                  </div>
                ))}
              </>
            ) : fengShuiRows.map((row, ri) => {
              const allSame = row.values.length >= 2 && row.values.every((v) => v.text && v.text === row.values[0].text);
              return (
                <>
                  <div key={`h-fs-${ri}`} style={{ padding: 'var(--space-3) var(--space-4)', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', background: 'var(--orange-50)' }}>{ri === 0 && <span style={{ display: 'block', font: 'var(--type-caption)', color: 'var(--text-muted)', marginBottom: 4 }}>Ý nghĩa phong thủy</span>}{row.label}</div>
                  {row.values.map((v) => (
                    <div key={v.id} style={{ padding: 'var(--space-3) var(--space-4)', font: 'var(--type-caption)', color: 'var(--text-body)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', textAlign: 'left', background: allSame ? 'var(--green-50)' : undefined }}>
                      {v.text || <span style={{ color: 'var(--text-muted)', textAlign: 'center', display: 'block' }}>–</span>}
                    </div>
                  ))}
                </>
              );
            })}
          </div>
        </div>
      )}

      {plates.length < ids.length && !isLoading && (
        <div style={{ padding: 'var(--space-4)', background: 'var(--amber-50)', borderRadius: 'var(--radius-md)', font: 'var(--type-caption)', color: 'var(--status-warning-ink)', textAlign: 'center' }}>
          Một số biển không còn khả dụng và đã bị loại khỏi bảng so sánh.
        </div>
      )}
    </div>
  );
}
