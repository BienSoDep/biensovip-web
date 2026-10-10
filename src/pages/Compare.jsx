import { useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { GitCompareArrows, X, Sparkles, Search, Heart, ChevronDown, ChevronUp, Phone, MessageCircle } from 'lucide-react';
import { useDebouncedValue } from '@mantine/hooks';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import Button from '../components/Button.jsx';
import BulletPicker from '../components/BulletPicker.jsx';
import { InfoTip, DateInputVN } from '../components/index.jsx';
import PlateVisual from '../components/PlateVisual.jsx';
import { shouldShowGeneratedImage } from '../lib/plateImageDisplay.js';
import { useSiteSettings } from '../services/siteSettings.js';
import { useCompareIds, useComparePlates } from '../services/compareService.js';
import { usePlates } from '../services/plates.js';
import { useCategories } from '../services/categories.js';
import { useScorePlates } from '../services/fengshuiService.js';
import { routeFor } from '../config/routes.js';
import { splitPlateNumber, formatPrice } from '../lib/plateFormat.js';
import { compareInsights, patternScore, buildFengShuiRows, priceScores } from '../lib/compareInsights.js';
import { PURPOSES, INDUSTRIES } from '../lib/fengshui.js';
import { validBirthDate } from '../lib/date.js';
import { buildConsultMessage, openZaloWithMessage, callOrCopyPhone, isMobileDevice } from '../lib/zaloMessage.js';

// Lịch sử tra cứu — lưu tối đa 6 biển đã chọn qua slot search, localStorage per-browser (giống Fav guest mode).
const SEARCH_HISTORY_KEY = 'bsd_compare_search_history';
function readSearchHistory() {
  try { return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]'); } catch { return []; }
}
function pushSearchHistory(plate) {
  try {
    const prev = readSearchHistory().filter((p) => p.id !== plate.id);
    const next = [{ id: plate.id, plateNumber: plate.plateNumber, thumbnailUrl: plate.thumbnailUrl, price: plate.price, priceOnRequest: plate.priceOnRequest }, ...prev].slice(0, 6);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
    return next;
  } catch { return readSearchHistory(); }
}

// Slot tìm nhanh — thay vì bắt user rời trang quay lại danh sách (pattern Thế Giới Di Động/FPT Shop):
// mỗi slot trống là 1 ô tìm kiếm riêng, gõ số biển ra gợi ý ngay dưới, chọn là add() thẳng vào so sánh.
function PlateSlotSearch({ onAdd, excludeIds }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [justAdded, setJustAdded] = useState(null);
  const [debouncedQuery] = useDebouncedValue(query, 300);
  const { data, isFetching } = usePlates({ q: debouncedQuery, perPage: 8 }, { enabled: debouncedQuery.trim().length >= 2 });
  const results = (data?.items || []).filter((p) => !excludeIds.includes(p.id));
  const [history, setHistory] = useState(readSearchHistory);
  const historyItems = history.filter((p) => !excludeIds.includes(p.id));
  const showPanel = focused && (debouncedQuery.trim().length >= 2 || (!query && historyItems.length > 0));
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!showPanel) return;
    const onClickOutside = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setFocused(false); };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [showPanel]);

  const pick = (p) => {
    onAdd(p.id);
    setHistory(pushSearchHistory(p));
    setQuery('');
    setFocused(false);
    setJustAdded(p.plateNumber);
    setTimeout(() => setJustAdded(null), 1800);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', top: '50%', left: 14, transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Tìm biển số để thêm..."
          aria-label="Tìm biển số để thêm vào so sánh"
          style={{ height: 44, width: '100%', border: `1.5px solid ${focused ? 'var(--action-primary)' : 'var(--border-hairline)'}`, borderRadius: 'var(--radius-field)', background: 'var(--white)', padding: query ? '0 40px' : '0 14px 0 40px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', outline: 'none', transition: 'border-color 120ms var(--ease-out)' }}
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="Xóa tìm kiếm"
            style={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', border: 'none', background: 'var(--surface-sunken)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={13} />
          </button>
        )}
      </div>
      {justAdded && (
        <div style={{ position: 'absolute', zIndex: 30, top: 44, left: 0, right: 0, marginTop: 6, padding: '8px 12px', background: 'var(--status-success-bg)', color: 'var(--status-success-ink)', borderRadius: 'var(--radius-field)', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)' }}>
          Đã thêm {justAdded} vào so sánh
        </div>
      )}
      {showPanel && !justAdded && (
        <div style={{ position: 'absolute', zIndex: 30, top: 44, left: 0, right: 0, marginTop: 6, background: 'var(--white)', border: '1px solid var(--border-hairline)', boxShadow: 'var(--shadow-4)', borderRadius: 'var(--radius-field)', maxHeight: 280, overflowY: 'auto' }}>
          {query.trim().length >= 2 ? (
            isFetching ? (
              <div style={{ padding: '14px', font: 'var(--type-caption)', color: 'var(--text-muted)', textAlign: 'center' }}>Đang tìm…</div>
            ) : results.length === 0 ? (
              <div style={{ padding: '14px', font: 'var(--type-caption)', color: 'var(--text-muted)', textAlign: 'center' }}>Không tìm thấy biển phù hợp</div>
            ) : results.map((p) => {
              const { prov, seri, num } = splitPlateNumber(p.plateNumber);
              return (
                <button key={p.id} type="button" onClick={() => pick(p)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', borderBottom: '1px solid var(--surface-sunken)', background: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}>
                  <div style={{ width: 72, aspectRatio: '330/165', flexShrink: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    <PlateVisual size="sm" prov={prov} seri={seri} num={num} />
                  </div>
                  <span style={{ flex: 1, minWidth: 0, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.plateNumber}</span>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', flexShrink: 0 }}>{formatPrice(p.price, p.priceOnRequest)}</span>
                </button>
              );
            })
          ) : (
            <>
              <div style={{ padding: '8px 12px', font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Tra cứu gần đây</div>
              {historyItems.map((p) => {
                const { prov, seri, num } = splitPlateNumber(p.plateNumber);
                return (
                  <button key={p.id} type="button" onClick={() => pick(p)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', borderBottom: '1px solid var(--surface-sunken)', background: 'none', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}>
                    <div style={{ width: 72, aspectRatio: '330/165', flexShrink: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                      <PlateVisual size="sm" prov={prov} seri={seri} num={num} />
                    </div>
                    <span style={{ flex: 1, minWidth: 0, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.plateNumber}</span>
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', flexShrink: 0 }}>{formatPrice(p.price, p.priceOnRequest)}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Card gợi ý biển số
function PlateSuggestionCard({ plate, onAdd }) {
  const { data: settings } = useSiteSettings();
  const { prov, seri, num } = splitPlateNumber(plate.plateNumber);

  return (
    <button
      type="button"
      onClick={() => onAdd(plate.id)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: 190,
        padding: '12px',
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-card)',
        background: 'var(--white)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: 'var(--shadow-1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--action-primary)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-hairline)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'var(--shadow-1)';
      }}
    >
      <div style={{ width: '100%', aspectRatio: '330/165', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
        {shouldShowGeneratedImage(settings, plate.thumbnailUrl ? [plate.thumbnailUrl] : []) ? (
          <img src={plate.thumbnailUrl} alt={plate.plateNumber} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <PlateVisual size="listLg" prov={prov} seri={seri} num={num} />
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {plate.plateNumber}
          </span>
          <span style={{
            fontSize: 11,
            fontWeight: 'var(--fw-semibold)',
            color: 'var(--action-primary)',
            background: 'var(--orange-50)',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            + So sánh
          </span>
        </div>
        {plate.price != null && (
          <span style={{ font: 'var(--type-caption)', color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>
            {formatPrice(plate.price, plate.priceOnRequest)}
          </span>
        )}
      </div>
    </button>
  );
}

// Gợi ý biển đã thích
function FavSuggestions({ favCards, excludeIds, onAdd }) {
  const items = (favCards || []).filter((p) => !excludeIds.includes(p.id) && p.status !== 'sold').slice(0, 6);
  if (items.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-label)', color: 'var(--text-strong)' }}><Heart size={14} style={{ color: 'var(--status-danger)' }} /> Từ biển đã thích của bạn</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        {items.map((p) => (
          <PlateSuggestionCard key={p.id} plate={p} onAdd={onAdd} />
        ))}
      </div>
    </div>
  );
}

// Gợi ý biển cùng loại/cùng tỉnh
function SimilarPlateSuggestions({ plate, excludeIds, onAdd }) {
  const { data: plateTypes } = useCategories('plate_type');
  const { data: provinces } = useCategories('province');
  const typeId = plateTypes?.items?.find((c) => c.name === plate.type)?.id;
  const provinceId = provinces?.items?.find((c) => c.name === plate.province)?.id;

  const { data: sameTypeData } = usePlates({ cat: typeId ? [typeId] : [], perPage: 7 }, { enabled: !!typeId });
  const { data: sameProvinceData } = usePlates({ city: provinceId ? [provinceId] : [], perPage: 7 }, { enabled: !!provinceId });

  const filterList = (items) => (items || []).filter((p) => !excludeIds.includes(p.id) && p.status !== 'sold').slice(0, 6);
  const sameType = filterList(sameTypeData?.items);
  const sameProvince = filterList(sameProvinceData?.items);

  const renderRow = (title, items) => items.length === 0 ? null : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>{title}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        {items.map((p) => (
          <PlateSuggestionCard key={p.id} plate={p} onAdd={onAdd} />
        ))}
      </div>
    </div>
  );

  if (sameType.length === 0 && sameProvince.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {renderRow(`Cùng loại "${plate.type}"`, sameType)}
      {renderRow(`Cùng tỉnh/thành "${plate.province}"`, sameProvince)}
    </div>
  );
}

// Màu sắc và nhãn ngũ hành
const ELEMENT_CONFIG = {
  moc: { label: 'Mệnh Mộc', bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' },
  hoa: { label: 'Mệnh Hỏa', bg: '#FEE2E2', color: '#B91C1C', border: '#FCA5A5' },
  tho: { label: 'Mệnh Thổ', bg: '#FEF3C7', color: '#B45309', border: '#FCD34D' },
  kim: { label: 'Mệnh Kim', bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' },
  thuy: { label: 'Mệnh Thủy', bg: '#DBEAFE', color: '#1D4ED8', border: '#93C5FD' },
};

const CHART_COLORS = ['#F97316', '#2563EB', '#16A34A'];

// Form nhập ngày sinh gọn nhẹ (1 dòng inline)
function BirthDatePrompt({ onSubmit }) {
  const [date, setDate] = useState('');
  const valid = validBirthDate(date);

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (valid) onSubmit(date); }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
        padding: '12px 16px',
        background: 'linear-gradient(135deg, var(--orange-50) 0%, var(--white) 100%)',
        border: '1px dashed var(--orange-200)',
        borderRadius: 'var(--radius-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 260px' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--orange-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Sparkles size={16} style={{ color: 'var(--action-primary)' }} />
        </div>
        <div>
          <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
            Chấm điểm hợp mệnh theo ngày sinh
          </div>
          <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            So sánh biểu đồ 4 chiều: Hợp mệnh, Mẫu đẹp, Giá trị, Độ hot
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <DateInputVN value={date} onChange={(e) => setDate(e.target.value)} />
        <Button type="submit" variant="primary" size="sm" disabled={!valid}>Xem điểm</Button>
      </div>
    </form>
  );
}

export default function Compare({ go, notify, allPlates, user, openPlate, favCards }) {
  const { ids, add, remove, clear } = useCompareIds();
  const { data, isLoading, isFetching, isPlaceholderData, isError, refetch } = useComparePlates(ids);
  const { data: settings } = useSiteSettings();
  const apiPlates = data?.items || [];
  const plates = (apiPlates.length > 0)
    ? apiPlates
    : (allPlates || []).filter((p) => ids.includes(p.id));

  const [birthDate, setBirthDate] = useState(user?.birthDate || null);
  const [purpose, setPurpose] = useState('Đi lại cá nhân');
  const [industry, setIndustry] = useState(INDUSTRIES[0].label);
  const [showDetailedFengShui, setShowDetailedFengShui] = useState(false);
  const [showRadarChart, setShowRadarChart] = useState(true);
  const [expandedMobile, setExpandedMobile] = useState({});
  const scoreMutation = useScorePlates();

  const toggleMobileFengShui = (id) => {
    setExpandedMobile((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const removePlate = (id) => {
    remove(id);
    if (ids.length <= 2) notify('Cần ít nhất 2 biển số để so sánh có ý nghĩa');
  };

  const insights = useMemo(() => compareInsights(plates), [plates]);
  const fengShuiRows = useMemo(() => buildFengShuiRows(plates), [plates]);
  const priceScoreList = useMemo(() => priceScores(plates), [plates]);

  useEffect(() => {
    if (isLoading || isFetching || isPlaceholderData || isError || ids.length === 0) return;
    const resolvedIds = new Set(plates.map((p) => p.id));
    const staleIds = ids.filter((id) => !resolvedIds.has(id));
    staleIds.forEach(remove);
  }, [isLoading, isFetching, isPlaceholderData, isError, ids, plates, remove]);

  useEffect(() => {
    if (!birthDate || plates.length < 2) return;
    const purposeKey = PURPOSES.find((p) => p.label === purpose)?.key || 'ca_nhan';
    scoreMutation.mutate({
      birthDate,
      plateIds: plates.map((p) => p.id),
      purpose: purposeKey,
      industry: purposeKey === 'kinh_doanh' ? (INDUSTRIES.find((i) => i.label === industry)?.key || null) : null,
    }, {
      onError: (err) => notify?.(err?.message || 'Chấm điểm hợp mệnh thất bại, thử lại.'),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birthDate, purpose, industry, plates.map((p) => p.id).join(',')]);

  if (ids.length < 2) {
    const filledPlate = plates[0];
    const slotsNeeded = filledPlate ? 2 : 3;
    return (
      <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-4)' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>So sánh biển số</h1>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{filledPlate ? 'Cần ít nhất 2 biển để so sánh — tìm thêm 1 biển nữa.' : 'Tìm và thêm tối đa 3 biển để so sánh cạnh nhau.'}</p>
          </div>
          {filledPlate && <Button variant="ghost" size="md" onClick={clear}>Bỏ chọn</Button>}
        </div>
        <div className="compare-empty-slots" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--space-4)', width: '100%', alignItems: 'stretch' }}>
          {filledPlate && (() => {
            const { prov, seri, num } = splitPlateNumber(filledPlate.plateNumber);
            return (
              <div className="compare-empty-slot" style={{ width: '100%', minWidth: 0, background: 'var(--orange-50)', border: '1px solid var(--orange-100)', borderRadius: 'var(--radius-card)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', position: 'relative', minHeight: 180 }}>
                <button onClick={() => remove(filledPlate.id)} aria-label="Bỏ khỏi so sánh" title="Bỏ khỏi so sánh" style={{ position: 'absolute', top: 8, right: 8, border: '1px solid var(--border-hairline)', background: 'var(--white)', boxShadow: 'var(--shadow-1)', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                {shouldShowGeneratedImage(settings, filledPlate.thumbnailUrl ? [filledPlate.thumbnailUrl] : []) ? (
                  <img src={filledPlate.thumbnailUrl} alt={filledPlate.plateNumber} style={{ width: 160, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                ) : (
                  <div style={{ width: 160, aspectRatio: '330/165', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                    <PlateVisual size="listLg" prov={prov} seri={seri} num={num} />
                  </div>
                )}
                <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{filledPlate.plateNumber}</span>
              </div>
            );
          })()}
          {Array.from({ length: slotsNeeded }, (_, i) => (
            <div key={i} className="compare-empty-slot" style={{ width: '100%', minWidth: 0, border: '1.5px dashed var(--border-hairline)', borderRadius: 'var(--radius-card)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', minHeight: 180 }}>
              <GitCompareArrows size={22} style={{ color: 'var(--text-faint)' }} />
              <PlateSlotSearch onAdd={add} excludeIds={ids} />
            </div>
          ))}
        </div>
        {filledPlate && <SimilarPlateSuggestions plate={filledPlate} excludeIds={ids} onAdd={add} />}
        <FavSuggestions favCards={favCards} excludeIds={ids} onAdd={add} />
        <div style={{ textAlign: 'center' }}>
          <Button variant="ghost" size="md" onClick={go('list')}>Hoặc duyệt toàn bộ kho biển số</Button>
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
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* Tiêu đề & Nút thao tác nhanh */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>So sánh biển số</h1>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{plates.length}/{ids.length} biển — so sánh trực quan &amp; chọn số phù hợp nhất.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" size="sm" onClick={go('list')}>+ Thêm biển</Button>
          <Button variant="ghost" size="sm" onClick={clear}>Xóa tất cả</Button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '64px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải dữ liệu so sánh…</div>
      ) : isError ? (
        <div style={{ padding: '64px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>Lỗi tải dữ liệu so sánh</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Thử lại</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* MOBILE VIEW (<768px): Thẻ từng biển gọn gàng, đưa Giá & Gọi ngay lên trước */}
          <div className="compare-mobile-cards" style={{ flexDirection: 'column', gap: 'var(--space-4)' }}>
            {plates.map((p) => {
              const { prov, seri, num } = splitPlateNumber(p.plateNumber);
              const sold = p.status === 'sold';
              const phone = p.seller?.phone, zalo = p.seller?.zalo;
              const plateFengShuiRows = fengShuiRows.map((row) => ({ label: row.label, value: row.values.find((v) => v.id === p.id) }));
              const info = insights.perPlate.find((pi) => pi.id === p.id);
              const elemConf = info?.element ? ELEMENT_CONFIG[info.element] : null;

              return (
                <div key={p.id} style={{ border: '1px solid var(--orange-100)', borderRadius: 'var(--radius-card)', overflow: 'hidden', background: 'var(--white)' }}>
                  <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--orange-50)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', position: 'relative' }}>
                    <button onClick={() => removePlate(p.id)} aria-label="Bỏ khỏi so sánh" title="Bỏ khỏi so sánh" style={{ position: 'absolute', top: 6, right: 6, border: '1px solid var(--border-hairline)', background: 'var(--white)', boxShadow: 'var(--shadow-1)', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                    {shouldShowGeneratedImage(settings, p.thumbnailUrl ? [p.thumbnailUrl] : []) ? (
                      <img src={p.thumbnailUrl} alt={p.plateNumber} style={{ width: 104, height: 52, objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 104, aspectRatio: '330/165', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                        <PlateVisual size="md" prov={prov} seri={seri} num={num} />
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{p.plateNumber}</span>
                      <button onClick={() => openPlate(p.id)} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--action-primary)', textAlign: 'left' }}>Xem chi tiết</button>
                    </div>
                  </div>

                  {/* Giá & Liên hệ ngay dưới Header */}
                  <div style={{ padding: '10px var(--space-4)', background: 'var(--white)', borderBottom: '1px solid var(--grey-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'block' }}>Giá bán</span>
                      <span style={{ font: 'var(--type-price)', color: 'var(--action-primary)', fontWeight: 'var(--fw-bold)' }}>{formatPrice(p.price, false)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {sold ? (
                        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đã bán</span>
                      ) : (
                        <>
                          {phone && (isMobileDevice() ? (
                            <a href={`tel:${phone}`} style={{ textDecoration: 'none' }}><Button variant="primary" size="sm" style={{ padding: '4px 10px', fontSize: 12 }}><Phone size={13} style={{ marginRight: 4 }} />Gọi</Button></a>
                          ) : (
                            <Button variant="primary" size="sm" onClick={() => callOrCopyPhone(phone)} style={{ padding: '4px 10px', fontSize: 12 }}><Phone size={13} style={{ marginRight: 4 }} />Gọi</Button>
                          ))}
                          {zalo && <Button variant="outline" size="sm" onClick={() => openZaloWithMessage(zalo, buildConsultMessage(p.plateNumber))} style={{ padding: '4px 10px', fontSize: 12 }}><MessageCircle size={13} style={{ marginRight: 4 }} />Zalo</Button>}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Thông số cơ bản */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px var(--space-4)', borderBottom: '1px solid var(--grey-100)', font: 'var(--type-body-sm)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Tỉnh / thành</span>
                      <span style={{ color: 'var(--text-strong)', fontWeight: 'var(--fw-semibold)' }}>{p.province || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px var(--space-4)', borderBottom: '1px solid var(--grey-100)', font: 'var(--type-body-sm)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Loại xe</span>
                      <span style={{ color: 'var(--text-strong)', fontWeight: 'var(--fw-semibold)' }}>{p.vehicleType || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px var(--space-4)', borderBottom: '1px solid var(--grey-100)', font: 'var(--type-body-sm)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Loại biển</span>
                      <span style={{ color: 'var(--text-strong)', fontWeight: 'var(--fw-semibold)' }}>{p.type || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px var(--space-4)', borderBottom: '1px solid var(--grey-100)', font: 'var(--type-body-sm)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Phong thủy</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' }}>
                        {elemConf && (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 10, background: elemConf.bg, color: elemConf.color }}>
                            {elemConf.label}
                          </span>
                        )}
                        {(info?.patterns || []).map((pat) => (
                          <span key={pat} style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 10, background: 'var(--orange-50)', color: 'var(--action-primary)' }}>
                            {pat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Accordion phong thủy mobile */}
                  {plateFengShuiRows.length > 0 && (
                    <div>
                      <button
                        type="button"
                        onClick={() => toggleMobileFengShui(p.id)}
                        style={{
                          width: '100%',
                          padding: '9px var(--space-4)',
                          background: 'var(--surface-sunken)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: 'var(--text-strong)',
                        }}
                      >
                        <span>Luận giải phong thủy ({plateFengShuiRows.length} mục)</span>
                        {expandedMobile[p.id] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                      {expandedMobile[p.id] && (
                        <div style={{ padding: '8px var(--space-4)', background: 'var(--white)' }}>
                          {plateFengShuiRows.map((row) => (
                            <div key={row.label} style={{ padding: '8px 0', borderBottom: '1px solid var(--grey-100)' }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 2 }}>{row.label}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-body)', lineHeight: 1.5 }}>{row.value?.text || '–'}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* DESKTOP VIEW: Bảng so sánh thông số cốt lõi (Hiển thị ngay trên đầu!) */}
          {plates.length > 1 && (
            <span className="compare-desktop-table" style={{ alignItems: 'center', gap: 4, font: 'var(--type-caption)', color: 'var(--text-faint)' }}><GitCompareArrows size={12} /> Vuốt ngang để xem hết các biển</span>
          )}
          <div className="compare-desktop-table" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid var(--orange-100)', borderRadius: 'var(--radius-card)', background: 'var(--white)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `clamp(130px,20vw,170px) repeat(${plates.length},minmax(190px,1fr))`, minWidth: plates.length * 190 + 140 }}>
              {/* Header biển số */}
              <div style={{ padding: 'var(--space-3) clamp(8px,3vw,var(--space-4))', font: 'var(--type-caption)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', position: 'sticky', left: 0, zIndex: 2, background: 'var(--white)' }}>Thuộc tính</div>
              {plates.map((p) => {
                const { prov, seri, num } = splitPlateNumber(p.plateNumber);
                return (
                  <div key={p.id} style={{ padding: 'var(--space-3) clamp(8px,3vw,var(--space-4))', background: 'var(--orange-50)', borderLeft: '1px solid var(--orange-100)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)', position: 'relative' }}>
                    <button onClick={() => removePlate(p.id)} aria-label="Bỏ khỏi so sánh" title="Bỏ khỏi so sánh" style={{ position: 'absolute', top: 6, right: 6, zIndex: 1, border: '1px solid var(--border-hairline)', background: 'var(--white)', boxShadow: 'var(--shadow-1)', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} /></button>
                    {shouldShowGeneratedImage(settings, p.thumbnailUrl ? [p.thumbnailUrl] : []) ? (
                      <img src={p.thumbnailUrl} alt={p.plateNumber} style={{ width: 130, height: 65, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                    ) : (
                      <div style={{ width: 130, aspectRatio: '330/165', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                        <PlateVisual size="listLg" prov={prov} seri={seri} num={num} />
                      </div>
                    )}
                    <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{p.plateNumber}</span>
                    <button onClick={() => openPlate(p.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--action-primary)' }}>Xem chi tiết</button>
                  </div>
                );
              })}

              {/* Hàng 1: Giá bán (Nổi bật nhất) */}
              <div style={{ padding: '10px clamp(8px,3vw,var(--space-4))', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', background: 'var(--orange-50)', position: 'sticky', left: 0, zIndex: 1, display: 'flex', alignItems: 'center' }}>
                Giá bán
              </div>
              {plates.map((p) => (
                <div key={p.id} style={{ padding: '10px clamp(8px,3vw,var(--space-4))', boxShadow: 'inset 0 -1px 0 var(--grey-100)', borderLeft: '1px solid var(--orange-100)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ font: 'var(--type-price)', color: 'var(--action-primary)', fontWeight: 'var(--fw-bold)' }}>{formatPrice(p.price, false)}</span>
                </div>
              ))}

              {/* Hàng 2: Tư vấn mua ngay (Gọi & Zalo) */}
              <div style={{ padding: '10px clamp(8px,3vw,var(--space-4))', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', background: 'var(--orange-50)', position: 'sticky', left: 0, zIndex: 1, display: 'flex', alignItems: 'center' }}>
                Tư vấn mua
              </div>
              {plates.map((p) => {
                const sold = p.status === 'sold';
                const phone = p.seller?.phone, zalo = p.seller?.zalo;
                return (
                  <div key={p.id} style={{ padding: '10px clamp(8px,3vw,var(--space-4))', boxShadow: 'inset 0 -1px 0 var(--grey-100)', borderLeft: '1px solid var(--orange-100)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {sold ? (
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đã bán</span>
                    ) : (
                      <>
                        {phone && (isMobileDevice() ? (
                          <a href={`tel:${phone}`} style={{ textDecoration: 'none' }}><Button variant="primary" size="sm" style={{ padding: '4px 10px', fontSize: 12 }}><Phone size={13} style={{ marginRight: 4 }} />Gọi ngay</Button></a>
                        ) : (
                          <Button variant="primary" size="sm" onClick={() => callOrCopyPhone(phone)} style={{ padding: '4px 10px', fontSize: 12 }}><Phone size={13} style={{ marginRight: 4 }} />Gọi ngay</Button>
                        ))}
                        {zalo && <Button variant="outline" size="sm" onClick={() => openZaloWithMessage(zalo, buildConsultMessage(p.plateNumber))} style={{ padding: '4px 10px', fontSize: 12 }}><MessageCircle size={13} style={{ marginRight: 4 }} />Nhắn Zalo</Button>}
                        {!phone && !zalo && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>—</span>}
                      </>
                    )}
                  </div>
                );
              })}

              {/* Hàng 3: Tỉnh / thành */}
              <div style={{ padding: '10px clamp(8px,3vw,var(--space-4))', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', background: 'var(--orange-50)', position: 'sticky', left: 0, zIndex: 1, display: 'flex', alignItems: 'center' }}>
                Tỉnh / thành
              </div>
              {plates.map((p) => (
                <div key={p.id} style={{ padding: '10px clamp(8px,3vw,var(--space-4))', font: 'var(--type-body-sm)', color: 'var(--text-body)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', borderLeft: '1px solid var(--orange-100)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.province || '—'}
                </div>
              ))}

              {/* Hàng 4: Loại xe */}
              <div style={{ padding: '10px clamp(8px,3vw,var(--space-4))', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', background: 'var(--orange-50)', position: 'sticky', left: 0, zIndex: 1, display: 'flex', alignItems: 'center' }}>
                Loại xe
              </div>
              {plates.map((p) => (
                <div key={p.id} style={{ padding: '10px clamp(8px,3vw,var(--space-4))', font: 'var(--type-body-sm)', color: 'var(--text-body)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', borderLeft: '1px solid var(--orange-100)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.vehicleType || '—'}
                </div>
              ))}

              {/* Hàng 5: Loại biển */}
              <div style={{ padding: '10px clamp(8px,3vw,var(--space-4))', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', background: 'var(--orange-50)', position: 'sticky', left: 0, zIndex: 1, display: 'flex', alignItems: 'center' }}>
                Loại biển
              </div>
              {plates.map((p) => (
                <div key={p.id} style={{ padding: '10px clamp(8px,3vw,var(--space-4))', font: 'var(--type-body-sm)', color: 'var(--text-body)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', borderLeft: '1px solid var(--orange-100)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.type || '—'}
                </div>
              ))}

              {/* Hàng 6: Ngũ hành & Dáng số (Tóm tắt huy hiệu) */}
              <div style={{ padding: '10px clamp(8px,3vw,var(--space-4))', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', background: 'var(--orange-50)', position: 'sticky', left: 0, zIndex: 1, display: 'flex', alignItems: 'center' }}>
                Ngũ hành &amp; Mẫu đẹp
              </div>
              {plates.map((p) => {
                const info = insights.perPlate.find((pi) => pi.id === p.id);
                const elemConf = info?.element ? ELEMENT_CONFIG[info.element] : null;
                return (
                  <div key={p.id} style={{ padding: '10px clamp(8px,3vw,var(--space-4))', boxShadow: 'inset 0 -1px 0 var(--grey-100)', borderLeft: '1px solid var(--orange-100)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                      {elemConf && (
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: elemConf.bg, color: elemConf.color, border: `1px solid ${elemConf.border}` }}>
                          {elemConf.label}
                        </span>
                      )}
                      {(info?.patterns || []).map((pat) => (
                        <span key={pat} style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: 'var(--orange-50)', color: 'var(--action-primary)', border: '1px solid var(--orange-200)' }}>
                          {pat}
                        </span>
                      ))}
                      {!elemConf && (!info?.patterns || info.patterns.length === 0) && (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DẢI TÓM TẮT PHONG THỦY GỌN GÀNG (Điểm chung & Nét riêng) */}
          <div style={{
            background: 'linear-gradient(180deg, var(--orange-50) 0%, var(--white) 100%)',
            border: '1px solid var(--orange-100)',
            borderRadius: 'var(--radius-card)',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                <Sparkles size={16} style={{ color: 'var(--action-primary)' }} />
                <span>Tương quan phong thủy</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Điểm chung:</span>
                {insights.commonElement && (
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: 'var(--green-50)', color: 'var(--status-success-ink)', border: '1px solid var(--green-200)' }}>
                    ✓ Cùng ngũ hành {insights.commonElementLabel}
                  </span>
                )}
                {insights.commonPatterns.map((label) => (
                  <span key={label} style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: 'var(--green-50)', color: 'var(--status-success-ink)', border: '1px solid var(--green-200)' }}>
                    ✓ Cùng mẫu: {label}
                  </span>
                ))}
                {!insights.commonElement && insights.commonPatterns.length === 0 && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Không có mẫu đẹp chung</span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${plates.length}, minmax(0, 1fr))`, gap: 'var(--space-3)', paddingTop: 8, borderTop: '1px dashed var(--orange-200)' }}>
              {insights.perPlate.map((pi) => {
                const plate = plates.find((p) => p.id === pi.id);
                return (
                  <div key={pi.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 'var(--fw-semibold)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                      {plate?.plateNumber} — nét riêng
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {!insights.commonElement && pi.element && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 10, background: ELEMENT_CONFIG[pi.element]?.bg || 'var(--grey-100)', color: ELEMENT_CONFIG[pi.element]?.color || 'var(--text-strong)' }}>
                          {insights.elementLabel[pi.element]}
                        </span>
                      )}
                      {pi.uniquePatterns.map((label) => (
                        <span key={label} style={{ fontSize: 11, fontWeight: 500, padding: '1px 6px', borderRadius: 10, background: 'var(--surface-sunken)', color: 'var(--text-strong)' }}>
                          {label}
                        </span>
                      ))}
                      {pi.uniquePatterns.length === 0 && (insights.commonElement || pi.element === insights.commonElement) && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Không có nét riêng nổi bật</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CHẤM ĐIỂM HỢP MỆNH & BIỂU ĐỒ 4 CHIỀU (Gọn gàng) */}
          {!birthDate ? (
            <BirthDatePrompt onSubmit={setBirthDate} />
          ) : (
            <div style={{ background: 'var(--white)', border: '1px solid var(--orange-100)', borderRadius: 'var(--radius-card)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} style={{ color: 'var(--action-primary)' }} />
                  <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                    Biểu đồ so sánh 4 chiều (Ngày sinh: {birthDate})
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Button variant="ghost" size="sm" onClick={() => setBirthDate(null)} style={{ fontSize: 11, padding: '2px 8px', height: 26 }}>Đổi ngày sinh</Button>
                  <Button variant="outline" size="sm" onClick={() => setShowRadarChart((prev) => !prev)} style={{ fontSize: 11, padding: '2px 8px', height: 26 }}>
                    {showRadarChart ? 'Ẩn biểu đồ' : 'Hiện biểu đồ'}
                  </Button>
                </div>
              </div>
              {showRadarChart && (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
                    <BulletPicker label="Mục đích" value={purpose} onChange={setPurpose} options={PURPOSES.map((p) => p.label)} size="sm" />
                    {purpose === 'Kinh doanh' && (
                      <BulletPicker label="Ngành nghề" value={industry} onChange={setIndustry} options={INDUSTRIES.map((i) => i.label)} size="sm" />
                    )}
                  </div>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="var(--orange-100)" />
                        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fill: 'var(--text-body)' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                        {plates.map((p, i) => (
                          <Radar key={p.id} name={p.plateNumber} dataKey={p.plateNumber} stroke={CHART_COLORS[i % 3]} fill={CHART_COLORS[i % 3]} fillOpacity={0.25} />
                        ))}
                        <Legend />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          )}

          {/* LUẬN GIẢI PHONG THỦY CHI TIẾT (Collapsible Accordion — Giải quyết dứt điểm giao diện lê thê) */}
          {fengShuiRows.length > 0 && (
            <div style={{ border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-card)', overflow: 'hidden', background: 'var(--white)' }}>
              <button
                type="button"
                onClick={() => setShowDetailedFengShui((prev) => !prev)}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  background: showDetailedFengShui ? 'var(--orange-50)' : 'var(--surface-sunken)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  font: 'var(--type-body-sm)',
                  fontWeight: 'var(--fw-semibold)',
                  color: 'var(--text-strong)',
                  transition: 'background 120ms ease',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span>Luận giải phong thủy chi tiết ({fengShuiRows.length} mục phân tích)</span>
                  <span style={{ fontSize: 12, fontWeight: 'normal', color: 'var(--text-muted)' }}>
                    {showDetailedFengShui ? '— Bấm để thu gọn' : '— Bấm để mở rộng xem ý nghĩa từng con số, tài lộc, lời khuyên'}
                  </span>
                </span>
                {showDetailedFengShui ? <ChevronUp size={18} style={{ color: 'var(--action-primary)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
              </button>
              {showDetailedFengShui && (
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderTop: '1px solid var(--border-hairline)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: `clamp(130px,20vw,170px) repeat(${plates.length},minmax(190px,1fr))`, minWidth: plates.length * 190 + 140 }}>
                    {fengShuiRows.map((row) => {
                      const allSame = row.values.length >= 2 && row.values.every((v) => v.text && v.text === row.values[0].text);
                      return (
                        <Fragment key={row.label}>
                          <div style={{ padding: '12px 16px', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', background: 'var(--surface-sunken)', position: 'sticky', left: 0, zIndex: 1 }}>
                            {row.label}
                          </div>
                          {allSame ? (
                            <div style={{ gridColumn: `span ${row.values.length}`, padding: '12px 16px', font: 'var(--type-caption)', color: 'var(--text-body)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', textAlign: 'left', background: 'var(--green-50)', display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.6 }}>
                              <span style={{ font: 'var(--type-caption)', color: 'var(--status-success-ink)', fontWeight: 'var(--fw-semibold)', flexShrink: 0 }}>Giống nhau:</span>
                              <span>{row.values[0].text}</span>
                            </div>
                          ) : row.values.map((v) => (
                            <div key={v.id} style={{ padding: '12px 16px', font: 'var(--type-caption)', color: 'var(--text-body)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', textAlign: 'left', lineHeight: 1.6 }}>
                              {v.text || <span style={{ color: 'var(--text-muted)', textAlign: 'center', display: 'block' }}>–</span>}
                            </div>
                          ))}
                        </Fragment>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
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
