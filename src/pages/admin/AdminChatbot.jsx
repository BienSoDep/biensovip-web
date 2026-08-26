import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDebouncedValue } from '@mantine/hooks';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import {
  useAdminChatSessions, useAdminChatSessionDetail, useDeleteChatSession,
  useChatbotSettings, useUpdateChatbotSettings, useChatbotStats,
} from '../../services/adminChatbot.js';
import { formatDateTime } from '../../lib/date.js';

const TABS = [
  { value: 'sessions', label: 'Lịch sử hội thoại' },
  { value: 'settings', label: 'Cấu hình trợ lý' },
  { value: 'stats', label: 'Thống kê' },
];

export default function AdminChatbot({ notify }) {
  const [tab, setTab] = useState('sessions');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        {TABS.map((t) => (
          <button key={t.value} type="button" onClick={() => setTab(t.value)}
            style={{
              border: 'none', borderRadius: 'var(--radius-pill)', padding: '8px 16px', cursor: 'pointer',
              font: 'var(--type-body-sm)', fontWeight: tab === t.value ? 'var(--fw-semibold)' : 'var(--fw-medium)',
              background: tab === t.value ? 'var(--action-primary)' : 'var(--white)',
              color: tab === t.value ? 'var(--white)' : 'var(--text-body)',
              boxShadow: tab === t.value ? 'none' : 'var(--shadow-inset-hairline)',
            }}>{t.label}</button>
        ))}
      </div>
      {tab === 'sessions' && <SessionsTab notify={notify} />}
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
            style={{ minWidth: 36, height: 36, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', color: page <= 1 ? 'var(--text-faint)' : 'var(--text-body)', font: 'var(--type-body-sm)', cursor: page <= 1 ? 'default' : 'pointer', boxShadow: 'var(--shadow-inset-hairline)' }} aria-label="Trang trước">‹</button>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{page}/{totalPages}</span>
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            style={{ minWidth: 36, height: 36, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', color: page >= totalPages ? 'var(--text-faint)' : 'var(--text-body)', font: 'var(--type-body-sm)', cursor: page >= totalPages ? 'default' : 'pointer', boxShadow: 'var(--shadow-inset-hairline)' }} aria-label="Trang sau">›</button>
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
    try {
      await update.mutateAsync({
        systemPrompt: current.systemPrompt,
        temperature: Number(current.temperature),
        maxTokens: Number(current.maxTokens),
        rateLimitPerHour: Number(current.rateLimitPerHour),
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
        <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>System prompt</span>
        <textarea value={current.systemPrompt} onChange={(e) => set('systemPrompt', e.target.value)} rows={8}
          style={{ resize: 'vertical', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', padding: '10px 12px', font: 'var(--type-body-sm)', fontFamily: 'inherit' }} />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Temperature (0–2)</span>
          <input type="number" min={0} max={2} step={0.1} value={current.temperature} onChange={(e) => set('temperature', e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', font: 'var(--type-body-sm)' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Max tokens</span>
          <input type="number" min={1} value={current.maxTokens} onChange={(e) => set('maxTokens', e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', font: 'var(--type-body-sm)' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Rate limit / giờ / phiên</span>
          <input type="number" min={1} value={current.rateLimitPerHour} onChange={(e) => set('rateLimitPerHour', e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', font: 'var(--type-body-sm)' }} />
        </label>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input type="checkbox" checked={current.enabled} onChange={(e) => set('enabled', e.target.checked)} />
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>Bật trợ lý AI</span>
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
