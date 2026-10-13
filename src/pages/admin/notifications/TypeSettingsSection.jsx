import { useState, useRef } from 'react';
import {
  Copy, RefreshCw, AlertCircle, X, Clock,
  Search, Zap, Mail, Users
} from 'lucide-react';
import Button from '../../../components/Button.jsx';
import { Input, Select } from '../../../components/index.jsx';
import {
  useNotificationTypeSettings,
  useUpdateNotificationTypeSetting,
  useSendTestEmail,
  useFengShuiQueueStats,
  useRunNotificationTrigger,
  useRunAllNotificationTriggers,
} from '../../../services/adminNotificationService.js';
import {
  TYPE_LABEL, TYPE_DESC, GUEST_TYPES, TYPE_META, HOUR_HAS_EFFECT
} from './notificationConstants.js';
import SystemGuardrailsCard from './SystemGuardrailsCard.jsx';
import { LivePreviewPanel } from './NotificationPreviews.jsx';

export default function TypeSettingsSection({ notify }) {
  const { data, isLoading, isError, refetch } = useNotificationTypeSettings();
  const runAllTriggers = useRunAllNotificationTriggers();
  const [editingType, setEditingType] = useState(null);
  const [filterGroup, setFilterGroup] = useState('all'); // 'all' | 'guest' | 'registered' | 'inactive'
  const [searchQuery, setSearchQuery] = useState('');
  // Title/content đang gõ dở (chưa lưu) của row đang edit — nằm ở section cha để panel preview bên
  // phải đọc được real-time mà không cần lift state phức tạp qua nhiều tầng props.
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  // Tỉ lệ cột trái (list) tính theo % — kéo divider để chỉnh, nhớ qua localStorage.
  const [leftPct, setLeftPct] = useState(() => {
    try { return Number(localStorage.getItem('adminNotifLeftPct')) || 55; } catch { return 55; }
  });
  const containerRef = useRef(null);
  const dragging = useRef(false);

  const editingSetting = (data || []).find((t) => t.type === editingType) || null;

  const startEdit = (setting) => {
    setEditingType(setting.type);
    setDraftTitle(setting.titleTemplate || '');
    setDraftContent(setting.contentTemplate || '');
  };
  const closeEdit = () => setEditingType(null);

  const onDividerDown = (e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current || !containerRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = Math.min(75, Math.max(25, ((clientX - rect.left) / rect.width) * 100));
      setLeftPct(pct);
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try { localStorage.setItem('adminNotifLeftPct', String(leftPct)); } catch { /* ignore */ }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftPct]);

  const handleRunAll = () => {
    if (!window.confirm('Bạn có chắc chắn muốn quét và kích hoạt đồng loạt tất cả 20 luồng thông báo tự động ngay bây giờ không?')) return;
    runAllTriggers.mutate(undefined, {
      onSuccess: (res) => {
        notify(res?.data?.message || res?.message || 'Đã kích hoạt quét thành công toàn bộ các luồng thông báo!');
      },
      onError: (err) => {
        notify(err?.response?.data?.message || err?.message || 'Lỗi khi kích hoạt quét tất cả');
      },
    });
  };

  const showSplit = Boolean(editingType);
  const rawList = data || [];

  const filteredList = rawList.filter((t) => {
    // Lọc theo nhóm đối tượng
    if (filterGroup === 'guest' && !GUEST_TYPES.has(t.type)) return false;
    if (filterGroup === 'registered' && GUEST_TYPES.has(t.type)) return false;
    if (filterGroup === 'inactive' && (t.webEnabled || t.emailEnabled)) return false;

    // Lọc theo từ khóa tìm kiếm
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const label = (TYPE_LABEL[t.type] || '').toLowerCase();
      const desc = (TYPE_DESC[t.type] || '').toLowerCase();
      const typeCode = t.type.toLowerCase();
      const audience = (TYPE_META[t.type]?.audience || '').toLowerCase();
      if (!label.includes(q) && !desc.includes(q) && !typeCode.includes(q) && !audience.includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%' }}>
      {/* Banner thông số Guardrails */}
      <SystemGuardrailsCard />

      <div ref={containerRef} style={{ flex: '1 1 100%', minWidth: 0, display: 'flex', alignItems: 'flex-start' }}>
        <div style={{ flex: showSplit ? `0 0 ${leftPct}%` : '1 1 100%', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
            <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Kênh &amp; nội dung thông báo tự động</span>
            <p style={{ margin: '4px 0 0', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Bật/tắt chuông web, email, sửa câu chữ và khung giờ gửi cho từng loại — áp dụng toàn hệ thống.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
              {(() => {
                const list = rawList;
                const webOn = list.filter((t) => t.webEnabled).length;
                const emailOn = list.filter((t) => t.emailEnabled).length;
                const sent = list.reduce((s, t) => s + (t.emailsSent || 0), 0);
                const chips = [
                  ['Tổng loại', list.length],
                  ['Khách để lại thông tin', list.filter(t => GUEST_TYPES.has(t.type)).length],
                  ['Thành viên đăng ký', list.filter(t => !GUEST_TYPES.has(t.type)).length],
                  ['Chuông web bật', webOn],
                  ['Email bật', emailOn],
                  ['Email đã gửi', sent],
                ];
                return chips.map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 'var(--space-2) var(--space-3)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', minWidth: 96 }}>
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>{val.toLocaleString('vi-VN')}</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Thanh công cụ tìm kiếm & Nút quét tất cả */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', padding: '10px var(--gutter-card)', background: 'var(--surface-subtle)', borderBottom: '1px solid var(--border-hairline)' }}>
            <div style={{ flex: '1 1 240px', position: 'relative', maxWidth: 360 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Tìm loại thông báo, mã code, đối tượng…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: 36,
                  paddingLeft: 34,
                  paddingRight: searchQuery ? 30 : 12,
                  borderRadius: 'var(--radius-field)',
                  border: 'none',
                  background: 'var(--white)',
                  boxShadow: 'var(--shadow-inset-hairline)',
                  font: 'var(--type-body-sm)',
                  color: 'var(--text-strong)',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 2 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleRunAll}
              disabled={runAllTriggers.isPending}
              title="Kích hoạt kiểm tra điều kiện & gửi ngay cho toàn bộ các đối tượng phù hợp ở cả 20 luồng"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: 'var(--action-dark)',
                color: 'var(--white)',
                font: 'var(--type-body-sm)',
                fontWeight: 'var(--fw-semibold)',
                cursor: runAllTriggers.isPending ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--shadow-sm)',
                opacity: runAllTriggers.isPending ? 0.75 : 1,
                transition: 'all 0.15s ease',
              }}
            >
              <RefreshCw size={13} className={runAllTriggers.isPending ? 'animate-spin' : ''} />
              {runAllTriggers.isPending ? 'Đang quét toàn bộ…' : 'Quét & gửi tất cả luồng (20)'}
            </button>
          </div>

          {/* Phân nhóm đối tượng thông báo */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px var(--gutter-card)', background: 'var(--white)', borderBottom: '1px solid var(--border-hairline)' }}>
            {[
              { id: 'all', label: `Tất cả (${rawList.length})` },
              { id: 'guest', label: `Khách chưa đăng ký / Để lại thông tin (${rawList.filter(t => GUEST_TYPES.has(t.type)).length})` },
              { id: 'registered', label: `Thành viên đã đăng ký (${rawList.filter(t => !GUEST_TYPES.has(t.type)).length})` },
              { id: 'inactive', label: `Đã tắt hoàn toàn (${rawList.filter(t => !t.webEnabled && !t.emailEnabled).length})` },
            ].map((b) => (
              <button key={b.id} type="button" onClick={() => setFilterGroup(b.id)}
                style={{
                  padding: '6px 14px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer',
                  font: 'var(--type-body-sm)', fontSize: 13,
                  fontWeight: filterGroup === b.id ? 'var(--fw-semibold)' : 'var(--fw-normal)',
                  background: filterGroup === b.id ? (b.id === 'guest' ? '#d97706' : b.id === 'inactive' ? '#dc2626' : 'var(--action-dark)') : 'var(--surface-sunken)',
                  color: filterGroup === b.id ? 'var(--white)' : 'var(--text-body)',
                  boxShadow: filterGroup === b.id ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease',
                }}>
                {b.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div style={{ padding: '32px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>
          ) : isError ? (
            <div style={{ padding: '32px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span>Lỗi tải dữ liệu</span>
              <button type="button" onClick={() => refetch()} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none' }}>Thử lại</button>
            </div>
          ) : filteredList.length === 0 ? (
            <div style={{ padding: '32px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
              {searchQuery ? `Không tìm thấy loại thông báo nào khớp với "${searchQuery}".` : 'Không có loại thông báo nào trong nhóm này.'}
            </div>
          ) : (
            filteredList.map((t) => (
              <TypeSettingRow key={t.type} setting={t} notify={notify}
                editing={editingType === t.type}
                onEdit={() => startEdit(t)}
                onCloseEdit={closeEdit}
                draftTitle={draftTitle} setDraftTitle={setDraftTitle}
                draftContent={draftContent} setDraftContent={setDraftContent} />
            ))
          )}
        </div>

        {showSplit && (
          <>
            <div
              onMouseDown={onDividerDown}
              onTouchStart={onDividerDown}
              role="separator"
              aria-orientation="vertical"
              title="Kéo để đổi tỉ lệ"
              style={{ flex: '0 0 auto', width: 24, alignSelf: 'stretch', cursor: 'col-resize', touchAction: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <div style={{ width: 4, height: 40, borderRadius: 'var(--radius-pill)', background: 'var(--border-hairline)' }} />
            </div>
            {editingSetting && (
              <div style={{ flex: `0 0 ${100 - leftPct}%`, minWidth: 280 }}>
                <LivePreviewPanel setting={editingSetting} title={draftTitle} content={draftContent} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Hàng cấu hình từng loại thông báo với huy hiệu trực quan và bảng biến tương tác
function TypeSettingRow({ setting, notify, editing, onEdit, onCloseEdit, draftTitle, setDraftTitle, draftContent, setDraftContent }) {
  const update = useUpdateNotificationTypeSetting();
  const sendTest = useSendTestEmail();
  const runTrigger = useRunNotificationTrigger();
  const [triggerHour, setTriggerHour] = useState(setting.triggerHour ?? '');
  const isFengShui = setting.type === 'fengshui_match';
  const [dailyLimit, setDailyLimit] = useState(setting.dailyLimitPerUser ?? 2);
  const { data: queueStats } = useFengShuiQueueStats(isFengShui && editing);
  const [testEmail, setTestEmail] = useState('');

  const meta = TYPE_META[setting.type] || {
    mechanism: 'Thời gian thực',
    isRealtime: true,
    audience: 'Người dùng hệ thống',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên người nhận' },
      { key: '{SiteName}', desc: 'Tên website' },
    ],
  };

  const handleRunNow = (e) => {
    e.stopPropagation();
    if (!window.confirm(`Bạn có chắc muốn kích hoạt chạy quét trigger "${TYPE_LABEL[setting.type] || setting.type}" ngay bây giờ không?`)) return;
    runTrigger.mutate(setting.type, {
      onSuccess: (res) => {
        notify(res?.data?.message || res?.message || `Đã kích hoạt quét '${setting.type}' thành công!`);
      },
      onError: (err) => {
        notify(err?.response?.data?.message || err?.message || 'Kích hoạt thất bại');
      },
    });
  };

  // UC27 — dropdown "Layout email": liệt kê template áp dụng type này + tùy chọn "Mặc định hệ thống".
  const { data: templatesData } = useAdminEmailTemplates();
  const updateTemplate = useUpdateEmailTemplate();
  const templates = templatesData?.items || templatesData || [];
  const applicableTemplates = templates.filter((t) => (t.appliesTo || []).includes(setting.type));
  const activeTemplate = applicableTemplates.find((t) => t.isActive);
  const setEmailLayout = (templateId) => {
    if (!templateId) {
      const current = applicableTemplates.find((t) => t.isActive);
      if (current) updateTemplate.mutate({ id: current.id, isActive: false }, { onSuccess: () => notify('Đã đặt về layout mặc định hệ thống') });
      return;
    }
    updateTemplate.mutate({ id: templateId, isActive: true }, {
      onSuccess: () => notify('Đã áp dụng layout email'),
      onError: (err) => notify(err.message || 'Có lỗi xảy ra.'),
    });
  };

  const toggle = (field) => {
    update.mutate({ type: setting.type, webEnabled: setting.webEnabled, emailEnabled: setting.emailEnabled,
      titleTemplate: setting.titleTemplate, contentTemplate: setting.contentTemplate, triggerHour: setting.triggerHour, dailyLimitPerUser: setting.dailyLimitPerUser,
      [field]: !setting[field] }, {
      onError: (err) => notify?.(err?.message || 'Đổi cài đặt thất bại, thử lại.'),
    });
  };

  const saveEdit = async () => {
    try {
      await update.mutateAsync({
        type: setting.type, webEnabled: setting.webEnabled, emailEnabled: setting.emailEnabled,
        titleTemplate: draftTitle.trim() || null, contentTemplate: draftContent.trim() || null,
        triggerHour: setting.triggerHour !== null ? (triggerHour === '' ? null : Number(triggerHour)) : null,
        dailyLimitPerUser: isFengShui ? Math.max(0, Math.min(50, Number(dailyLimit) || 0)) : setting.dailyLimitPerUser,
      });
      notify('Đã lưu');
      onCloseEdit();
    } catch (e) { notify(e.message || 'Lỗi khi lưu'); }
  };

  const sendTestNow = async () => {
    if (!testEmail.trim()) { notify('Vui lòng nhập địa chỉ email nhận'); return; }
    try {
      await sendTest.mutateAsync({ type: setting.type, toEmail: testEmail.trim() });
      notify(`Đã gửi email thử tới ${testEmail.trim()}`);
    } catch (e) { notify(e.message || 'Lỗi khi gửi thử'); }
  };

  // Chèn nhanh biến vào nội dung soạn thảo
  const handleInsertVar = (varKey) => {
    setDraftContent((prev) => (prev ? `${prev} ${varKey}` : varKey));
    notify(`Đã chèn biến ${varKey} vào nội dung`);
  };

  return (
    <div
      role="button" tabIndex={0}
      onClick={editing ? onCloseEdit : onEdit}
      onKeyDown={(e) => { if (e.key === 'Enter') (editing ? onCloseEdit : onEdit)(); }}
      style={{
        padding: 'var(--space-3) var(--gutter-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        boxShadow: editing ? 'inset 3px 0 0 var(--action-primary), inset 0 -1px 0 var(--grey-100)' : 'inset 0 -1px 0 var(--grey-100)',
        background: editing ? 'var(--surface-tint-cream)' : 'transparent',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{ flex: '1 1 280px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
            {TYPE_LABEL[setting.type] || setting.type}
          </span>
          <span style={{ font: '10px monospace', padding: '1px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}>
            {setting.type}
          </span>
          {GUEST_TYPES.has(setting.type) && (
            <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 'var(--fw-semibold)', display: 'inline-flex', alignItems: 'center' }}>
              Khách chưa đăng ký
            </span>
          )}
          {meta.isRealtime ? (
            <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'rgba(241,151,32, 0.1)', color: '#C75B00', fontSize: 11, fontWeight: 'var(--fw-medium)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Zap size={10} /> Real-time
            </span>
          ) : (
            <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'rgba(107, 114, 128, 0.12)', color: '#4b5563', fontSize: 11, fontWeight: 'var(--fw-medium)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Clock size={10} /> Định kỳ
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Mail size={12} /> {setting.emailsSent ?? 0} email
          </span>
          <label onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={setting.webEnabled} onChange={() => toggle('webEnabled')} disabled={update.isPending} /> Chuông web
          </label>
          <label onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={setting.emailEnabled} onChange={() => toggle('emailEnabled')} disabled={update.isPending} /> Email
          </label>
          <button
            type="button"
            onClick={handleRunNow}
            disabled={runTrigger.isPending}
            title="Kích hoạt quét điều kiện và gửi ngay cho các đối tượng phù hợp"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-hairline)',
              background: 'var(--white)',
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-medium)',
              color: 'var(--action-primary)',
              cursor: runTrigger.isPending ? 'not-allowed' : 'pointer',
              opacity: runTrigger.isPending ? 0.7 : 1,
              boxShadow: 'var(--shadow-inset-hairline)',
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={11} className={runTrigger.isPending ? 'animate-spin' : ''} />
            {runTrigger.isPending ? 'Đang quét…' : 'Quét & gửi ngay'}
          </button>
        </div>

        {!setting.webEnabled && !setting.emailEnabled && (
          <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)', fontWeight: 'var(--fw-semibold)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <AlertCircle size={13} /> Đã tắt hoàn toàn — không gửi qua bất kỳ kênh nào
          </span>
        )}
        <span style={{ font: 'var(--type-caption)', color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>{editing ? 'Đang sửa…' : ''}</span>
      </div>

      {!editing && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          {TYPE_DESC[setting.type] && (
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', flex: '1 1 300px' }}>{TYPE_DESC[setting.type]}</span>
          )}
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--surface-sunken)', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
            <Users size={11} /> {meta.audience}
          </span>
        </div>
      )}

      {editing && (
        <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
          {/* Hộp tóm tắt cơ chế & đối tượng */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, padding: '10px 12px', background: 'var(--white)', borderRadius: 'var(--radius-field)', boxShadow: 'var(--shadow-inset-hairline)' }}>
            <div>
              <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Cơ chế kích hoạt:</div>
              <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{meta.mechanism}</div>
            </div>
            <div>
              <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đối tượng nhận:</div>
              <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{meta.audience}</div>
            </div>
            <div>
              <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Kênh phân phối:</div>
              <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{meta.channels.join(' & ')}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 'var(--space-2) var(--space-3)', background: 'var(--white)', borderRadius: 'var(--radius-field)', boxShadow: 'var(--shadow-inset-hairline)' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Mẫu mặc định gốc của hệ thống</span>
            <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{setting.defaultTitle}</span>
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{setting.defaultContent}</span>
          </div>

          <Input label="Tiêu đề tùy chỉnh (để trống = dùng mặc định ở trên)" placeholder={setting.defaultTitle} value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Nội dung tùy chỉnh (để trống = dùng mặc định ở trên)</span>
            <textarea rows={3} value={draftContent} placeholder={setting.defaultContent} onChange={(e) => setDraftContent(e.target.value)} style={{ background: 'var(--white)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '10px 12px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none' }} />
          </label>

          {/* Bảng biến placeholder tương tác (bấm để chèn) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-strong)', fontWeight: 'var(--fw-medium)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Copy size={12} /> Biến thay thế tự động (Bấm vào biến để chèn nhanh vào nội dung):
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {meta.vars.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => handleInsertVar(v.key)}
                  title={`${v.desc} — Bấm để chèn`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--border-hairline)',
                    background: 'var(--white)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    color: 'var(--text-strong)',
                    boxShadow: 'var(--shadow-inset-hairline)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)' }}>{v.key}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit' }}>({v.desc})</span>
                </button>
              ))}
            </div>
          </div>

          {isFengShui && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 320 }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Hạn mức thông báo mỗi người / ngày (0 = tạm dừng gửi)</span>
              <input type="number" min="0" max="50" value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)}
                style={{ height: 36, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 10px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', outline: 'none' }} />
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
                Biển kho và biển VPA hợp mệnh (điểm ≥ 70%) xếp hàng theo từng người, kho gửi trước. Mỗi người nhận tối đa số thông báo này mỗi ngày, dàn đều
                {Number(dailyLimit) > 0 ? ` (cách nhau khoảng ${(24 / Number(dailyLimit)).toFixed(1)} giờ)` : ''}; phần còn lại chờ trong hàng đợi (giữ tối đa 50 biển/người, bỏ sau 7 ngày).
              </span>
              {queueStats && (
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-body)' }}>
                  Hàng đợi hiện tại: <b>{queueStats.pending.toLocaleString('vi-VN')}</b> biển đang chờ (kho {queueStats.pendingOwn.toLocaleString('vi-VN')} · VPA {queueStats.pendingVpa.toLocaleString('vi-VN')}) của <b>{queueStats.usersWaiting.toLocaleString('vi-VN')}</b> người; đã gửi 24 giờ qua: <b>{queueStats.sentLast24h.toLocaleString('vi-VN')}</b>.
                </span>
              )}
            </label>
          )}

          {setting.triggerHour !== null && HOUR_HAS_EFFECT.has(setting.type) ? (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 220 }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Giờ gửi (giờ UTC, 0-23)</span>
              <input type="number" min="0" max="23" value={triggerHour} onChange={(e) => setTriggerHour(e.target.value)}
                style={{ height: 36, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 10px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', outline: 'none' }} />
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
                Giờ Việt Nam = UTC + 7 → gửi lúc {triggerHour !== '' ? `${(Number(triggerHour) + 7) % 24}h VN` : '—'} nếu nhập {triggerHour !== '' ? `${triggerHour}h UTC` : 'ở trên'}.
              </span>
            </label>
          ) : setting.triggerHour !== null ? (
            <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <AlertCircle size={13} style={{ flexShrink: 0 }} /> Loại này không dùng "Giờ gửi" cố định — {setting.type === 'digest' ? 'mỗi user tự chọn giờ riêng trong hồ sơ cá nhân' : 'job chạy cố định 1 lần/ngày, bỏ qua giờ đặt ở đây'}. Ẩn field để tránh admin tưởng chỉnh được.
            </span>
          ) : (
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', fontStyle: 'italic' }}>Loại này gửi ngay khi sự kiện xảy ra (real-time), không có giờ cố định để chỉnh.</span>
          )}

          <div style={{ maxWidth: 280 }}>
            <Select label="Layout email (UC27)" value={activeTemplate?.id || ''} onChange={setEmailLayout}
              options={[{ value: '', label: 'Mặc định hệ thống' }, ...applicableTemplates.map((t) => ({ value: t.id, label: t.name }))]} />
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
              Khung "Xem trước email" bên phải luôn hiện đúng layout hiện tại (mặc định hoặc template đã chọn) — không cần preview riêng.
            </span>
            {applicableTemplates.length === 0 && (
              <span style={{ display: 'block', font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Chưa có template nào gắn cho loại này — tạo ở trang "Mẫu email".</span>
            )}
          </div>

          <Button variant="dark" size="sm" style={{ alignSelf: 'flex-start' }} onClick={saveEdit} disabled={update.isPending}>{update.isPending ? 'Đang lưu…' : 'Lưu cài đặt'}</Button>

          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end', flexWrap: 'wrap', boxShadow: 'inset 0 1px 0 var(--border-hairline)', paddingTop: 'var(--space-2)' }}>
            <div style={{ flex: '1 1 220px' }}>
              <Input label="Gửi thử email mẫu tới" placeholder="ban@email.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} required />
            </div>
            <Button variant="ghost" size="sm" onClick={sendTestNow} disabled={sendTest.isPending}>{sendTest.isPending ? 'Đang gửi…' : 'Gửi thử'}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Bảng lịch sử & nhật ký gửi email hệ thống, marketing và tự động hóa
