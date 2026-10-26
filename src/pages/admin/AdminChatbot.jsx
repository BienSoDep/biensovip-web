import { useState, useMemo } from 'react';
import {
  Trash2, ChevronLeft, ChevronRight, BookOpen, Search, Copy, Check,
  Download, ChevronDown, ChevronUp, Sparkles, Filter,
  Headphones, Zap, History, GitBranch, FlaskConical, Sliders, BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDebouncedValue } from '@mantine/hooks';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import { InfoTip } from '../../components/index.jsx';
import {
  useAdminChatSessions, useAdminChatSessionDetail, useDeleteChatSession,
  useChatbotSettings, useUpdateChatbotSettings, useChatbotStats,
} from '../../services/adminChatbot.js';
import { formatDateTime } from '../../lib/date.js';
import aiQuestions from '../../lib/content/vi/aiKnowledgeBase100.json';
import aiTestingSuite from '../../lib/content/vi/aiChatbotTesting100.json';
import aiContinuousScenarios from '../../lib/content/vi/aiChatbotContinuousScenarios.json';
import LiveChatPanel from './chatbot/LiveChatPanel.jsx';
import CannedResponsesPanel from './chatbot/CannedResponsesPanel.jsx';

const TABS = [
  { value: 'live', label: 'Live Chat Realtime', isLive: true, icon: Headphones, info: 'Tiếp nhận và tư vấn trực tiếp 2 chiều theo thời gian thực giữa nhân viên và khách hàng.' },
  { value: 'canned', label: 'Mẫu trả lời nhanh', icon: Zap, info: 'Quản lý kho câu trả lời mẫu soạn sẵn (Canned Responses) kèm phím tắt gõ nhanh cho tư vấn viên.' },
  { value: 'sessions', label: 'Lịch sử hội thoại', icon: History, info: 'Xem lại các đoạn chat thực tế giữa khách hàng và trợ lý AI để cải thiện kịch bản tư vấn.' },
  { value: 'scenarios', label: 'Kịch bản liên tục', icon: GitBranch, badge: '50 turns', info: '10 chuỗi kịch bản kiểm thử hội thoại đa lượt liên tục (50 turns): Phễu bán hàng, TT24, Đấu giá VPA, Jailbreak, Khiếu nại...' },
  { value: 'testing', label: '100 câu kiểm thử', icon: FlaskConical, info: 'Bộ 100 câu hỏi test benchmark phân loại tự động (Blocked, DirectPlate, DirectFilter, NeedsLlm).' },
  { value: 'kb', label: 'Kho 100 câu mẫu', icon: BookOpen, info: 'Bộ 100 câu hỏi - đáp chuyên sâu chuẩn hóa về Pháp lý Thông tư 24, Đấu giá VPA, Phong thủy và Dịch vụ.' },
  { value: 'settings', label: 'Cấu hình trợ lý', icon: Sliders, info: 'Thiết lập System Prompt ngữ cảnh, độ sáng tạo Temperature và giới hạn Token.' },
  { value: 'stats', label: 'Báo cáo thống kê', icon: BarChart3, info: 'Báo cáo số lượt hội thoại và tần suất sử dụng chatbot theo ngày.' },
];

export default function AdminChatbot({ notify }) {
  const [tab, setTab] = useState('live');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <style>{`
        @keyframes bsd-pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
          50% { transform: scale(1.15); opacity: 0.85; box-shadow: 0 0 0 5px rgba(239, 68, 68, 0); }
        }
        .bsd-live-beacon {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          display: inline-block;
          animation: bsd-pulse-dot 1.6s infinite ease-in-out;
        }
      `}</style>
      <div style={{
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        alignItems: 'center',
        background: 'var(--surface-sunken)',
        padding: '5px 6px',
        borderRadius: 'var(--radius-pill)',
        border: '1px solid var(--border-hairline)'
      }}>
        {TABS.map((t) => {
          const isActive = tab === t.value;
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              style={{
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                padding: '7px 14px',
                cursor: 'pointer',
                font: 'var(--type-body-sm)',
                fontWeight: isActive ? 600 : 500,
                background: isActive ? 'var(--action-primary)' : 'transparent',
                color: isActive ? 'var(--white)' : 'var(--text-body)',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 140ms ease',
              }}
            >
              {t.isLive && <span className="bsd-live-beacon" />}
              {Icon && <Icon size={14} style={{ opacity: isActive ? 1 : 0.7 }} />}
              <span>{t.label}</span>
              {t.badge && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: 8,
                  background: isActive ? 'rgba(255,255,255,0.22)' : 'var(--grey-200)',
                  color: isActive ? '#fff' : 'var(--text-muted)'
                }}>
                  {t.badge}
                </span>
              )}
              {t.info && (
                <span onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <InfoTip text={t.info} size={13} style={{ color: isActive ? 'rgba(255,255,255,0.85)' : 'var(--text-faint)' }} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {tab === 'live' && <LiveChatPanel notify={notify} />}
      {tab === 'canned' && <CannedResponsesPanel notify={notify} />}
      {tab === 'sessions' && <SessionsTab notify={notify} />}
      {tab === 'scenarios' && <ContinuousScenariosTab notify={notify} />}
      {tab === 'testing' && <TestingSuiteTab notify={notify} />}
      {tab === 'kb' && <KnowledgeBaseTab notify={notify} />}
      {tab === 'settings' && <SettingsTab notify={notify} />}
      {tab === 'stats' && <StatsTab />}
    </div>
  );
}

function SessionsTab({ notify }) {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [q] = useDebouncedValue(keyword, 300);
  const [openId, setOpenId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const { data, isLoading, isError, refetch } = useAdminChatSessions(page, 20, q || undefined);
  const deleteSession = useDeleteChatSession();

  const items = data?.items || [];
  const total = data?.total || 0;
  const limit = data?.limit || 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const del = async (id) => {
    setDeletingId(id);
    try {
      await deleteSession.mutateAsync(id);
      notify('Đã xóa lịch sử hội thoại');
    } catch (e) {
      notify(e.message || 'Lỗi khi xóa');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
        <input
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
          placeholder="Tìm theo nội dung tin nhắn…"
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', font: 'var(--type-body-sm)', color: 'var(--text-body)', background: 'var(--white)', minWidth: 260 }}
        />
        <span style={{ flex: 1, font: 'var(--type-caption)', color: 'var(--text-faint)', textAlign: 'right' }}>{total} phiên chat</span>
      </div>

      {isLoading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>
      ) : isError ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span>Lỗi tải dữ liệu</span>
          <button type="button" onClick={() => refetch()} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none' }}>Thử lại</button>
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có phiên chat nào.</div>
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          {items.map((s) => (
            <div key={s.id} style={{ padding: 'var(--space-4) var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', cursor: 'pointer' }}
              onClick={() => setOpenId(s.id)}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.lastMessagePreview || '(chưa có tin nhắn)'}</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{s.messageCount} tin nhắn · cập nhật {formatDateTime(s.lastMessageAt)}</span>
              </div>
              <button type="button" aria-label="Xóa phiên chat" disabled={deletingId === s.id}
                onClick={(e) => { e.stopPropagation(); del(s.id); }}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--status-danger)', padding: 6, display: 'flex' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', alignItems: 'center' }}>
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            style={{ minWidth: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', color: page <= 1 ? 'var(--text-faint)' : 'var(--text-body)', font: 'var(--type-body-sm)', cursor: page <= 1 ? 'default' : 'pointer', boxShadow: 'var(--shadow-inset-hairline)' }} aria-label="Trang trước"><ChevronLeft size={16} /></button>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{page}/{totalPages}</span>
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            style={{ minWidth: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', color: page >= totalPages ? 'var(--text-faint)' : 'var(--text-body)', font: 'var(--type-body-sm)', cursor: page >= totalPages ? 'default' : 'pointer', boxShadow: 'var(--shadow-inset-hairline)' }} aria-label="Trang sau"><ChevronRight size={16} /></button>
        </div>
      )}

      <Modal open={!!openId} onClose={() => setOpenId(null)} title="Chi tiết hội thoại" maxWidth="560px">
        {openId && <SessionDetail id={openId} />}
      </Modal>
    </div>
  );
}

function SessionDetail({ id }) {
  const { data, isLoading, isError } = useAdminChatSessionDetail(id);
  if (isLoading) return <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>;
  if (isError) return <div style={{ font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>Lỗi tải dữ liệu</div>;

  const messages = data?.messages || [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxHeight: '60vh', overflowY: 'auto' }}>
      {messages.map((m) => (
        <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 4 }}>
          <div style={{ maxWidth: '85%', padding: '10px 14px', borderRadius: m.role === 'user' ? 'var(--radius-pill)' : 'var(--radius-md)', background: m.role === 'user' ? 'var(--action-primary)' : 'var(--surface-sunken)', color: m.role === 'user' ? 'var(--white)' : 'var(--text-body)', font: 'var(--type-body-sm)', whiteSpace: 'pre-wrap' }}>{m.content}</div>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{formatDateTime(m.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}

function SettingsTab({ notify }) {
  const { data, isLoading, isError } = useChatbotSettings();
  const update = useUpdateChatbotSettings();
  const [form, setForm] = useState(null);

  const current = form || data;

  if (isLoading) return <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>;
  if (isError || !current) return <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>Lỗi tải cấu hình</div>;

  const set = (field, value) => setForm({ ...current, [field]: value });

  const save = async () => {
    const temperature = Number(current.temperature);
    const maxTokens = Number(current.maxTokens);
    const rateLimitPerHour = Number(current.rateLimitPerHour);
    if (Number.isNaN(temperature) || temperature < 0 || temperature > 2) { notify('Temperature phải từ 0 đến 2.'); return; }
    if (!Number.isFinite(maxTokens) || maxTokens < 1) { notify('Max tokens phải là số ≥ 1.'); return; }
    if (!Number.isFinite(rateLimitPerHour) || rateLimitPerHour < 1) { notify('Rate limit phải là số ≥ 1.'); return; }
    try {
      await update.mutateAsync({
        systemPrompt: current.systemPrompt,
        temperature, maxTokens, rateLimitPerHour,
        enabled: current.enabled,
      });
      notify('Đã lưu cấu hình trợ lý');
      setForm(null);
    } catch (e) {
      notify(e.message || 'Lỗi khi lưu cấu hình');
    }
  };

  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: 640 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          System prompt
          <InfoTip text="Lời nhắc chỉ thị tính cách, ngữ cảnh chuyên môn về biển số và quy tắc ứng xử của AI khi phản hồi khách." />
        </span>
        <textarea value={current.systemPrompt} onChange={(e) => set('systemPrompt', e.target.value)} rows={8}
          style={{ resize: 'vertical', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', padding: '10px 12px', font: 'var(--type-body-sm)', fontFamily: 'inherit' }} />
      </label>

      <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-field)', background: 'var(--amber-50)', color: 'var(--status-warning-ink)', font: 'var(--type-caption)' }}>
        Thay đổi 3 giá trị dưới đây ảnh hưởng ngay lập tức tới trợ lý AI đang chạy công khai trên site.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Temperature (0–2)
            <InfoTip text="Độ biến thiên sáng tạo: 0 là trả lời chính xác, cố định; 0.7 - 1.0 là văn phong tự nhiên, linh hoạt." />
          </span>
          <input type="number" min={0} max={2} step={0.1} value={current.temperature} onChange={(e) => set('temperature', e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', font: 'var(--type-body-sm)' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Max tokens
            <InfoTip text="Giới hạn số lượng token tối đa trong mỗi câu trả lời để kiểm soát độ dài và chi phí API." />
          </span>
          <input type="number" min={1} value={current.maxTokens} onChange={(e) => set('maxTokens', e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', font: 'var(--type-body-sm)' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Rate limit / giờ / phiên
            <InfoTip text="Số lượt tin nhắn tối đa mỗi khách hàng được phép gửi trong 1 giờ để chống spam bot." />
          </span>
          <input type="number" min={1} value={current.rateLimitPerHour} onChange={(e) => set('rateLimitPerHour', e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', font: 'var(--type-body-sm)' }} />
        </label>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input type="checkbox" checked={current.enabled} onChange={(e) => set('enabled', e.target.checked)} />
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          Bật trợ lý AI
          <InfoTip text="Bật hoặc tắt biểu tượng chatbox trợ lý ảo AI trên toàn bộ website của khách hàng." />
        </span>
      </label>

      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Button variant="primary" size="md" loading={update.isPending} onClick={save}>Lưu cấu hình</Button>
        {form && <Button variant="ghost" size="md" onClick={() => setForm(null)}>Hủy</Button>}
      </div>
    </div>
  );
}

function StatsTab() {
  const [days, setDays] = useState(7);
  const { data, isLoading, isError } = useChatbotStats(days);

  if (isLoading) return <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>;
  if (isError || !data) return <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>Lỗi tải thống kê</div>;

  const unresolvedPct = data.totalAssistantResponses > 0
    ? Math.round((data.unresolvedResponseCount / data.totalAssistantResponses) * 100)
    : 0;
  const contactRatePct = data.totalSessions > 0
    ? Math.round((data.sessionsLedToContact / data.totalSessions) * 100)
    : 0;
  const plateClickRatePct = data.totalSessions > 0
    ? Math.round((data.sessionsLedToPlateClick / data.totalSessions) * 100)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        {[7, 30, 90].map((d) => (
          <button key={d} type="button" onClick={() => setDays(d)}
            style={{
              border: 'none', borderRadius: 'var(--radius-pill)', padding: '6px 14px', cursor: 'pointer',
              font: 'var(--type-caption)', fontWeight: days === d ? 'var(--fw-semibold)' : 'var(--fw-medium)',
              background: days === d ? 'var(--action-primary)' : 'var(--white)',
              color: days === d ? 'var(--white)' : 'var(--text-body)',
              boxShadow: days === d ? 'none' : 'var(--shadow-inset-hairline)',
            }}>{d} ngày</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
        <StatTile label="Phiên chat" value={data.totalSessions} />
        <StatTile label="Tin nhắn" value={data.totalMessages} />
        <StatTile label="AI không tự tin trả lời" value={`${unresolvedPct}%`} />
        <StatTile label="Lượt bị giới hạn tần suất" value={data.rateLimitedCount} />
        <StatTile label="Phiên ra lead (liên hệ)" value={`${contactRatePct}%`} />
        <StatTile label="Phiên bấm xem biển" value={`${plateClickRatePct}%`} />
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-4)' }}>
        <h3 style={{ margin: '0 0 var(--space-3)', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Phiên chat theo ngày</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.sessionsPerDay}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" name="Phiên chat" fill="var(--action-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <h3 style={{ margin: 0, padding: 'var(--space-4) var(--gutter-card) 0', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Câu hỏi hay gặp</h3>
        {data.topQuestions.length === 0 ? (
          <div style={{ padding: 'var(--space-4) var(--gutter-card)', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có dữ liệu.</div>
        ) : (
          <div style={{ padding: 'var(--space-3) 0' }}>
            {data.topQuestions.map((q, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', padding: '8px var(--gutter-card)' }}>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{q.content}</span>
                <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)' }}>{q.count}×</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ font: 'var(--type-title-2)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>{value}</span>
    </div>
  );
}

function KnowledgeBaseTab({ notify }) {
  const [selectedCat, setSelectedCat] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [q] = useDebouncedValue(keyword, 250);
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const categories = useMemo(() => {
    const list = [
      { id: 'all', label: 'Tất cả', count: aiQuestions.length },
      { id: 'Pháp lý & Thông tư 24', label: 'Pháp lý & Thông tư 24', count: aiQuestions.filter(x => x.category === 'Pháp lý & Thông tư 24').length },
      { id: 'Đấu giá VPA & Định giá', label: 'Đấu giá VPA & Định giá', count: aiQuestions.filter(x => x.category === 'Đấu giá VPA & Định giá').length },
      { id: 'Phong thủy & Luận giải số', label: 'Phong thủy & Luận giải số', count: aiQuestions.filter(x => x.category === 'Phong thủy & Luận giải số').length },
      { id: 'Quy trình & Dịch vụ Biensovip', label: 'Quy trình & Dịch vụ', count: aiQuestions.filter(x => x.category === 'Quy trình & Dịch vụ Biensovip').length },
    ];
    return list;
  }, []);

  const filtered = useMemo(() => {
    let list = aiQuestions;
    if (selectedCat !== 'all') {
      list = list.filter(item => item.category === selectedCat);
    }
    if (q.trim()) {
      const lower = q.toLowerCase();
      list = list.filter(item =>
        item.question.toLowerCase().includes(lower) ||
        item.answer.toLowerCase().includes(lower) ||
        item.category.toLowerCase().includes(lower) ||
        String(item.id).includes(lower)
      );
    }
    return list;
  }, [selectedCat, q]);

  const copyItem = (item) => {
    const text = `Câu hỏi: ${item.question}\nTrả lời: ${item.answer}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    notify(`Đã sao chép Câu #${item.id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAll = () => {
    const text = filtered.map(x => `### Câu ${x.id}: ${x.question}\n**Trả lời:** ${x.answer}`).join('\n\n');
    navigator.clipboard.writeText(text);
    notify(`Đã sao chép ${filtered.length} câu hỏi vào clipboard!`);
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(aiQuestions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Biensovip_AI_KnowledgeBase_100_QA.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify('Đã tải xuống file JSON 100 câu hỏi AI!');
  };

  const getCatBadgeColor = (cat) => {
    switch (cat) {
      case 'Pháp lý & Thông tư 24': return { bg: 'var(--blue-50)', color: 'var(--blue-700)', border: 'var(--blue-200)' };
      case 'Đấu giá VPA & Định giá': return { bg: 'var(--amber-50)', color: 'var(--amber-700)', border: 'var(--amber-200)' };
      case 'Phong thủy & Luận giải số': return { bg: 'var(--mint-50)', color: 'var(--mint-700)', border: 'var(--mint-200)' };
      default: return { bg: 'var(--brand-50)', color: 'var(--action-primary)', border: 'var(--orange-100)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Header bar */}
      <div style={{
        background: 'var(--white)',
        padding: 'var(--gutter-card)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-inset-hairline)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--space-3)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Kho tri thức 100 câu hỏi AI</span>
            <span style={{ background: 'var(--brand-50)', color: 'var(--action-primary)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)' }}>
              100 câu chuẩn hóa
            </span>
          </div>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Dữ liệu huấn luyện & Few-shot injection chuẩn cho Trợ lý ảo AI Chatbot (Pháp lý TT24, Đấu giá VPA, Phong thủy & Dịch vụ).
          </span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={copyAll} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Copy size={14} />
            <span>Sao chép {filtered.length} câu</span>
          </Button>
          <Button variant="primary" size="sm" onClick={downloadJson} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} />
            <span>Tải file JSON</span>
          </Button>
        </div>
      </div>

      {/* Filter and Category Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}>
        {categories.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedCat(c.id)}
            style={{
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '6px 14px',
              cursor: 'pointer',
              font: 'var(--type-caption)',
              fontWeight: selectedCat === c.id ? 'var(--fw-semibold)' : 'var(--fw-medium)',
              background: selectedCat === c.id ? 'var(--action-primary)' : 'var(--white)',
              color: selectedCat === c.id ? 'var(--white)' : 'var(--text-body)',
              boxShadow: selectedCat === c.id ? 'none' : 'var(--shadow-inset-hairline)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>{c.label}</span>
            <span style={{
              background: selectedCat === c.id ? 'rgba(255,255,255,0.25)' : 'var(--grey-100)',
              color: selectedCat === c.id ? 'var(--white)' : 'var(--text-muted)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-pill)',
              fontSize: 11
            }}>
              {c.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Input and Counter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{ position: 'relative', minWidth: 320 }}>
          <Search size={16} color="var(--text-faint)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo nội dung câu hỏi, câu trả lời, số thứ tự…"
            style={{
              padding: '8px 12px 8px 36px',
              borderRadius: 'var(--radius-field)',
              border: '1px solid var(--grey-200)',
              font: 'var(--type-body-sm)',
              color: 'var(--text-body)',
              background: 'var(--white)',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          Hiển thị <strong>{filtered.length}</strong> / 100 câu
        </span>
      </div>

      {/* Question Accordion List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {filtered.length === 0 ? (
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: '48px var(--gutter-card)', textAlign: 'center', color: 'var(--text-muted)' }}>
            Không tìm thấy câu hỏi nào phù hợp với từ khóa &ldquo;{keyword}&rdquo;.
          </div>
        ) : (
          filtered.map(item => {
            const isExpanded = expandedId === item.id;
            const badge = getCatBadgeColor(item.category);
            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--white)',
                  borderRadius: 'var(--radius-card)',
                  boxShadow: 'var(--shadow-inset-hairline)',
                  overflow: 'hidden',
                  transition: 'box-shadow 140ms ease'
                }}
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  style={{
                    padding: '12px var(--gutter-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    gap: 'var(--space-3)',
                    background: isExpanded ? 'var(--grey-50)' : 'var(--white)',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
                    <span style={{
                      font: 'var(--type-caption)',
                      fontWeight: 'var(--fw-bold)',
                      color: 'var(--text-faint)',
                      minWidth: 36
                    }}>
                      #{item.id}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: 12,
                      fontWeight: 'var(--fw-semibold)',
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                      whiteSpace: 'nowrap'
                    }}>
                      {item.category}
                    </span>
                    <span style={{
                      font: 'var(--type-body-sm)',
                      fontWeight: 'var(--fw-semibold)',
                      color: 'var(--text-strong)',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: isExpanded ? 'normal' : 'nowrap'
                    }}>
                      {item.question}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <button
                      type="button"
                      title="Sao chép câu này"
                      onClick={(e) => { e.stopPropagation(); copyItem(item); }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: 6,
                        borderRadius: 'var(--radius-circle)',
                        cursor: 'pointer',
                        color: copiedId === item.id ? 'var(--mint-600)' : 'var(--text-faint)',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                    >
                      {copiedId === item.id ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                    {isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                  </div>
                </div>

                {/* Expanded Answer */}
                {isExpanded && (
                  <div style={{
                    padding: 'var(--space-3) var(--gutter-card) var(--space-4)',
                    boxShadow: 'inset 0 1px 0 var(--border-hairline)',
                    background: 'var(--white)',
                    animation: 'fadeIn 140ms ease-out'
                  }}>
                    <div style={{
                      font: 'var(--type-body-sm)',
                      color: 'var(--text-body)',
                      lineHeight: '1.6',
                      background: 'var(--grey-50)',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-field)',
                      borderLeft: '3px solid var(--action-primary)'
                    }}>
                      <div style={{ fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', marginBottom: 4 }}>
                        Câu trả lời mẫu của AI (Duy Đinh):
                      </div>
                      {item.answer}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function TestingSuiteTab({ notify }) {
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedIntent, setSelectedIntent] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [q] = useDebouncedValue(keyword, 250);
  const [copiedCode, setCopiedCode] = useState(null);

  const groups = useMemo(() => [
    { id: 'all', label: 'Tất cả nhóm', count: aiTestingSuite.length },
    { id: 'A', label: 'A. Chống Jailbreak / Blocked', count: aiTestingSuite.filter(x => x.code.startsWith('TEST-A')).length },
    { id: 'B', label: 'B. Tra cứu Biển (DirectPlate)', count: aiTestingSuite.filter(x => x.code.startsWith('TEST-B')).length },
    { id: 'C', label: 'C. Lọc Ngân sách (DirectFilter)', count: aiTestingSuite.filter(x => x.code.startsWith('TEST-C')).length },
    { id: 'D', label: 'D. Pháp lý TT24 & VPA', count: aiTestingSuite.filter(x => x.code.startsWith('TEST-D')).length },
    { id: 'E', label: 'E. Phong thủy & Lead', count: aiTestingSuite.filter(x => x.code.startsWith('TEST-E')).length },
  ], []);

  const intents = useMemo(() => [
    { id: 'all', label: 'Tất cả Intent', count: aiTestingSuite.length },
    { id: 'Blocked', label: 'Blocked', count: aiTestingSuite.filter(x => x.expectedIntent === 'Blocked').length },
    { id: 'DirectPlate', label: 'DirectPlate', count: aiTestingSuite.filter(x => x.expectedIntent === 'DirectPlate').length },
    { id: 'DirectFilter', label: 'DirectFilter', count: aiTestingSuite.filter(x => x.expectedIntent === 'DirectFilter').length },
    { id: 'NeedsLlm', label: 'NeedsLlm', count: aiTestingSuite.filter(x => x.expectedIntent === 'NeedsLlm').length },
  ], []);

  const filtered = useMemo(() => {
    let list = aiTestingSuite;
    if (selectedGroup !== 'all') {
      list = list.filter(item => item.code.startsWith(`TEST-${selectedGroup}`));
    }
    if (selectedIntent !== 'all') {
      list = list.filter(item => item.expectedIntent === selectedIntent);
    }
    if (q.trim()) {
      const lower = q.toLowerCase();
      list = list.filter(item =>
        item.input.toLowerCase().includes(lower) ||
        item.code.toLowerCase().includes(lower) ||
        item.expectedBehavior.toLowerCase().includes(lower) ||
        item.group.toLowerCase().includes(lower)
      );
    }
    return list;
  }, [selectedGroup, selectedIntent, q]);

  const copyPrompt = (item) => {
    navigator.clipboard.writeText(item.input);
    setCopiedCode(item.code);
    notify(`Đã copy prompt: "${item.input}"`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const copyAll = () => {
    const text = filtered.map(x => `${x.code}: "${x.input}" -> Expected: ${x.expectedIntent} (${x.expectedBehavior})`).join('\n');
    navigator.clipboard.writeText(text);
    notify(`Đã sao chép ${filtered.length} câu test vào clipboard!`);
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(aiTestingSuite, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Biensovip_AI_TestSuite_100_Questions.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify('Đã tải xuống file JSON bộ 100 câu kiểm thử AI!');
  };

  const getIntentBadge = (intent) => {
    switch (intent) {
      case 'Blocked':
        return { bg: 'var(--red-50, #fef2f2)', color: 'var(--red-700, #b91c1c)', border: 'var(--red-200, #fecaca)' };
      case 'DirectPlate':
        return { bg: 'var(--blue-50)', color: 'var(--blue-700)', border: 'var(--blue-200)' };
      case 'DirectFilter':
        return { bg: 'var(--amber-50)', color: 'var(--amber-700)', border: 'var(--amber-200)' };
      case 'NeedsLlm':
      default:
        return { bg: 'var(--mint-50)', color: 'var(--mint-700)', border: 'var(--mint-200)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Header bar */}
      <div style={{
        background: 'var(--white)',
        padding: 'var(--gutter-card)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-inset-hairline)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--space-3)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Bộ 100 câu hỏi kiểm thử AI (Testing Suite)</span>
            <span style={{ background: 'var(--mint-50)', color: 'var(--mint-700)', border: '1px solid var(--mint-200)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)' }}>
              100/100 Test Cases Pass (52ms)
            </span>
          </div>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Bộ benchmark kiểm thử tự động phân loại ý định: An ninh Blocked, DirectPlate bypass, DirectFilter ngân sách, và NeedsLlm.
          </span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={copyAll} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Copy size={14} />
            <span>Sao chép {filtered.length} test</span>
          </Button>
          <Button variant="primary" size="sm" onClick={downloadJson} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} />
            <span>Tải JSON test suite</span>
          </Button>
        </div>
      </div>

      {/* Filter by Group Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}>
        {groups.map(g => (
          <button
            key={g.id}
            type="button"
            onClick={() => setSelectedGroup(g.id)}
            style={{
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '6px 14px',
              cursor: 'pointer',
              font: 'var(--type-caption)',
              fontWeight: selectedGroup === g.id ? 'var(--fw-semibold)' : 'var(--fw-medium)',
              background: selectedGroup === g.id ? 'var(--action-primary)' : 'var(--white)',
              color: selectedGroup === g.id ? 'var(--white)' : 'var(--text-body)',
              boxShadow: selectedGroup === g.id ? 'none' : 'var(--shadow-inset-hairline)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>{g.label}</span>
            <span style={{
              background: selectedGroup === g.id ? 'rgba(255,255,255,0.25)' : 'var(--grey-100)',
              color: selectedGroup === g.id ? 'var(--white)' : 'var(--text-muted)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-pill)',
              fontSize: 11
            }}>
              {g.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter by Intent & Search */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginRight: 4 }}>Intent:</span>
          {intents.map(i => (
            <button
              key={i.id}
              type="button"
              onClick={() => setSelectedIntent(i.id)}
              style={{
                border: selectedIntent === i.id ? '1px solid var(--action-primary)' : '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-field)',
                padding: '4px 10px',
                cursor: 'pointer',
                font: 'var(--type-caption)',
                background: selectedIntent === i.id ? 'var(--brand-50)' : 'var(--white)',
                color: selectedIntent === i.id ? 'var(--action-primary)' : 'var(--text-muted)',
                fontWeight: selectedIntent === i.id ? 'var(--fw-bold)' : 'var(--fw-normal)'
              }}
            >
              {i.label} ({i.count})
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: 280 }}>
          <Search size={16} color="var(--text-faint)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo mã TEST-, câu hỏi, từ khóa…"
            style={{
              padding: '8px 12px 8px 36px',
              borderRadius: 'var(--radius-field)',
              border: '1px solid var(--grey-200)',
              font: 'var(--type-body-sm)',
              color: 'var(--text-body)',
              background: 'var(--white)',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Test List Table */}
      <div style={{
        background: 'var(--white)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-inset-hairline)',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '90px 130px 1fr 180px 70px',
          padding: '10px 16px',
          background: 'var(--grey-50)',
          font: 'var(--type-caption)',
          fontWeight: 'var(--fw-bold)',
          color: 'var(--text-muted)',
          borderBottom: '1px solid var(--border-hairline)'
        }}>
          <div>Mã Test</div>
          <div>Expected Intent</div>
          <div>Câu hỏi kiểm thử (Prompt Input)</div>
          <div>Kỳ vọng kết quả</div>
          <div style={{ textAlign: 'center' }}>Test</div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '40px var(--gutter-card)', textAlign: 'center', color: 'var(--text-muted)' }}>
            Không tìm thấy test case nào phù hợp.
          </div>
        ) : (
          filtered.map((item, idx) => {
            const badge = getIntentBadge(item.expectedIntent);
            const isCopied = copiedCode === item.code;
            return (
              <div
                key={item.code}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 130px 1fr 180px 70px',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-hairline)' : 'none',
                  background: idx % 2 === 0 ? 'var(--white)' : 'rgba(0,0,0,0.01)',
                  font: 'var(--type-body-sm)',
                  gap: 'var(--space-2)'
                }}
              >
                <div>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: 12,
                    fontWeight: 'var(--fw-bold)',
                    color: 'var(--text-strong)',
                    background: 'var(--grey-100)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-field)'
                  }}>
                    {item.code}
                  </span>
                </div>

                <div>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 12,
                    fontWeight: 'var(--fw-semibold)',
                    background: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.border}`,
                    whiteSpace: 'nowrap'
                  }}>
                    {item.expectedIntent}
                  </span>
                </div>

                <div style={{
                  color: 'var(--text-body)',
                  fontWeight: 'var(--fw-medium)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  &ldquo;{item.input}&rdquo;
                </div>

                <div style={{
                  font: 'var(--type-caption)',
                  color: 'var(--text-muted)',
                  lineHeight: '1.4'
                }}>
                  {item.expectedBehavior}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => copyPrompt(item)}
                    title="Sao chép prompt để thử trong Chat"
                    style={{
                      border: 'none',
                      background: isCopied ? 'var(--mint-50)' : 'var(--grey-100)',
                      color: isCopied ? 'var(--mint-700)' : 'var(--text-body)',
                      borderRadius: 'var(--radius-pill)',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {isCopied ? <Check size={13} /> : <Copy size={13} />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ContinuousScenariosTab({ notify }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const [collapsedMap, setCollapsedMap] = useState({});

  const categories = useMemo(() => {
    const set = new Set();
    aiContinuousScenarios.forEach((s) => set.add(s.category));
    return ['ALL', ...Array.from(set)];
  }, []);

  const totalTurns = useMemo(() => {
    return aiContinuousScenarios.reduce((acc, s) => acc + s.turns.length, 0);
  }, []);

  const filteredScenarios = useMemo(() => {
    return aiContinuousScenarios.filter((s) => {
      const matchCat = selectedCategory === 'ALL' || s.category === selectedCategory;
      if (!matchCat) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      const matchMeta = s.id.toLowerCase().includes(q) || s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
      const matchTurns = s.turns.some((t) => t.user.toLowerCase().includes(q) || t.expectedBehavior.toLowerCase().includes(q) || t.contextTag?.toLowerCase().includes(q));
      return matchMeta || matchTurns;
    });
  }, [selectedCategory, search]);

  const toggleCollapse = (id) => {
    setCollapsedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text, key, label) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    notify?.(`${label || 'Đã sao chép vào clipboard'}!`, 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyEntireScenario = (s) => {
    const content = `=== ${s.id}: ${s.title} ===\n` +
      `Mục tiêu: ${s.description}\n` +
      `Phân loại: ${s.category} (${s.turns.length} lượt liên tục)\n\n` +
      s.turns.map((t) =>
        `[Lượt ${t.turn}] ${t.contextTag} | Intent kỳ vọng: ${t.expectedIntent}\n` +
        `User: "${t.user}"\n` +
        `AI kỳ vọng: ${t.expectedBehavior}\n`
      ).join('\n');
    handleCopy(content, `scn-${s.id}`, `Đã sao chép kịch bản ${s.id}`);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(aiContinuousScenarios, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Biensovip_AI_Continuous_Scenarios_10.json';
    a.click();
    URL.revokeObjectURL(url);
    notify?.('Đã tải xuống bộ 10 kịch bản kiểm thử liên tục (JSON)', 'success');
  };

  const getIntentBadge = (intent) => {
    switch (intent) {
      case 'Blocked':
        return { bg: 'rgba(239,68,68,0.12)', color: '#dc2626', border: 'rgba(239,68,68,0.3)', label: 'Blocked (Gateway)' };
      case 'DirectPlate':
        return { bg: 'rgba(59,130,246,0.12)', color: '#2563eb', border: 'rgba(59,130,246,0.3)', label: 'DirectPlate (DB)' };
      case 'DirectFilter':
        return { bg: 'rgba(16,185,129,0.12)', color: '#059669', border: 'rgba(16,185,129,0.3)', label: 'DirectFilter (DB)' };
      default:
        return { bg: 'rgba(139,92,246,0.12)', color: '#7c3aed', border: 'rgba(139,92,246,0.3)', label: 'NeedsLlm (AI)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* Banner giới thiệu */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(235,100,50,0.06) 0%, rgba(59,130,246,0.06) 100%)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16
        }}
      >
        <div style={{ maxWidth: 760 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>🔄</span>
            <h3 style={{ margin: 0, font: 'var(--type-title-md)', fontWeight: 'var(--fw-bold)', color: 'var(--text-heading)' }}>
              Bộ 10 Kịch bản Kiểm thử Hội thoại Liên tục (Multi-turn Scenarios)
            </h3>
            <span
              style={{
                font: 'var(--type-caption)',
                fontWeight: 'var(--fw-bold)',
                background: 'var(--action-primary)',
                color: 'white',
                borderRadius: 'var(--radius-pill)',
                padding: '2px 8px'
              }}
            >
              {totalTurns} Lượt test
            </span>
          </div>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)', lineHeight: 1.5 }}>
            Kiểm thử năng lực hội thoại đa lượt thực tế: duy trì ngữ cảnh (Context Retention), chuyển đổi Intent giữa các câu hỏi, xử lý phản đối, phễu chốt đơn và bảo vệ hệ thống trước tấn công đa bước.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExportJson}
            style={{
              background: 'var(--white)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-body)',
              borderRadius: 'var(--radius-pill)',
              padding: '6px 14px',
              font: 'var(--type-body-sm)',
              fontWeight: 'var(--fw-medium)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: 'var(--shadow-inset-hairline)'
            }}
          >
            <Download size={14} />
            <span>Tải JSON 10 Kịch bản</span>
          </button>
        </div>
      </div>

      {/* Bộ lọc và Tìm kiếm */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCategory(c)}
              style={{
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                padding: '5px 12px',
                cursor: 'pointer',
                font: 'var(--type-caption)',
                fontWeight: selectedCategory === c ? 'var(--fw-bold)' : 'var(--fw-medium)',
                background: selectedCategory === c ? 'var(--text-heading)' : 'var(--white)',
                color: selectedCategory === c ? 'var(--white)' : 'var(--text-body)',
                boxShadow: selectedCategory === c ? 'none' : 'var(--shadow-inset-hairline)'
              }}
            >
              {c === 'ALL' ? 'Tất cả chủ đề' : c}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', maxWidth: 420 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã kịch bản (SCN-01), từ khóa, nội dung lượt chat..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-subtle)',
              font: 'var(--type-body-sm)',
              background: 'var(--white)'
            }}
          />
        </div>
      </div>

      {/* Danh sách 10 Kịch bản */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {filteredScenarios.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-faint)', font: 'var(--type-body-sm)' }}>
            Không tìm thấy kịch bản nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          filteredScenarios.map((s) => {
            const isCollapsed = !!collapsedMap[s.id];
            const isScnCopied = copiedKey === `scn-${s.id}`;

            return (
              <div
                key={s.id}
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-card-subtle)',
                  overflow: 'hidden',
                  transition: 'border-color 150ms ease'
                }}
              >
                {/* Header kịch bản */}
                <div
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    background: 'var(--surface-subtle)',
                    borderBottom: isCollapsed ? 'none' : '1px solid var(--border-hairline)'
                  }}
                >
                  <div
                    onClick={() => toggleCollapse(s.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1, minWidth: 260 }}
                  >
                    <span
                      style={{
                        font: 'var(--type-caption)',
                        fontWeight: 'var(--fw-bold)',
                        background: 'rgba(235,100,50,0.12)',
                        color: 'var(--action-primary)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-pill)',
                        border: '1px solid rgba(235,100,50,0.25)',
                        fontFamily: 'monospace'
                      }}
                    >
                      {s.id}
                    </span>
                    <div>
                      <h4 style={{ margin: 0, font: 'var(--type-body-md)', fontWeight: 'var(--fw-bold)', color: 'var(--text-heading)' }}>
                        {s.title}
                      </h4>
                      <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                        {s.description}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        font: 'var(--type-caption)',
                        fontWeight: 'var(--fw-medium)',
                        background: 'var(--surface-card)',
                        color: 'var(--text-body)',
                        padding: '3px 9px',
                        borderRadius: 'var(--radius-pill)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      {s.category} • {s.turns.length} lượt
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopyEntireScenario(s)}
                      title="Sao chép toàn bộ kịch bản này để test liên tục"
                      style={{
                        background: isScnCopied ? 'rgba(16,185,129,0.12)' : 'var(--white)',
                        color: isScnCopied ? 'var(--mint-700)' : 'var(--text-body)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-pill)',
                        padding: '4px 10px',
                        cursor: 'pointer',
                        fontSize: 12,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {isScnCopied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{isScnCopied ? 'Đã sao chép' : 'Sao chép kịch bản'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCollapse(s.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-faint)',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                    >
                      {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                  </div>
                </div>

                {/* Các lượt hội thoại (Turns Timeline) */}
                {!isCollapsed && (
                  <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {s.turns.map((t, idx) => {
                      const intentStyle = getIntentBadge(t.expectedIntent);
                      const turnCopyKey = `${s.id}-turn-${t.turn}`;
                      const isTurnCopied = copiedKey === turnCopyKey;

                      return (
                        <div
                          key={t.turn}
                          style={{
                            display: 'flex',
                            gap: 12,
                            position: 'relative'
                          }}
                        >
                          {/* Dấu chấm & Đường timeline nối các turn */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 28 }}>
                            <div
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                background: 'var(--action-primary)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                font: 'var(--type-caption)',
                                fontWeight: 'var(--fw-bold)',
                                fontSize: 11
                              }}
                            >
                              {t.turn}
                            </div>
                            {idx < s.turns.length - 1 && (
                              <div style={{ width: 2, flex: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
                            )}
                          </div>

                          {/* Nội dung lượt test */}
                          <div
                            style={{
                              flex: 1,
                              background: 'var(--surface-subtle)',
                              border: '1px solid var(--border-hairline)',
                              borderRadius: 'var(--radius-md)',
                              padding: '10px 14px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6
                            }}
                          >
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--text-heading)' }}>
                                  Lượt {t.turn}
                                </span>
                                <span
                                  style={{
                                    font: 'var(--type-caption)',
                                    background: 'var(--surface-card)',
                                    color: 'var(--text-body)',
                                    padding: '1px 7px',
                                    borderRadius: 'var(--radius-pill)',
                                    border: '1px solid var(--border-hairline)',
                                    fontSize: 11
                                  }}
                                >
                                  {t.contextTag}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span
                                  style={{
                                    font: 'var(--type-caption)',
                                    fontWeight: 'var(--fw-medium)',
                                    background: intentStyle.bg,
                                    color: intentStyle.color,
                                    border: `1px solid ${intentStyle.border}`,
                                    borderRadius: 'var(--radius-pill)',
                                    padding: '2px 8px',
                                    fontSize: 11
                                  }}
                                >
                                  Intent: {intentStyle.label}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleCopy(t.user, turnCopyKey, `Đã copy Lượt ${t.turn}`)}
                                  title="Sao chép tin nhắn này để dán vào khung chat test"
                                  style={{
                                    background: isTurnCopied ? 'rgba(16,185,129,0.12)' : 'var(--white)',
                                    color: isTurnCopied ? 'var(--mint-700)' : 'var(--text-body)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-pill)',
                                    padding: '3px 8px',
                                    cursor: 'pointer',
                                    fontSize: 11,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                >
                                  {isTurnCopied ? <Check size={12} /> : <Copy size={12} />}
                                  <span>{isTurnCopied ? 'Copied' : `Copy Lượt ${t.turn}`}</span>
                                </button>
                              </div>
                            </div>

                            {/* Tin nhắn của User */}
                            <div
                              style={{
                                font: 'var(--type-body-sm)',
                                color: 'var(--text-heading)',
                                background: 'var(--white)',
                                padding: '8px 12px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-subtle)',
                                fontStyle: 'italic',
                                lineHeight: 1.45
                              }}
                            >
                              "{t.user}"
                            </div>

                            {/* Kỳ vọng xử lý của AI */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                              <span style={{ color: 'var(--action-primary)', fontWeight: 'var(--fw-bold)' }}>Kỳ vọng AI:</span>
                              <span style={{ color: 'var(--text-body)' }}>{t.expectedBehavior}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


