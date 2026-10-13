import { useState, useMemo } from 'react';
import {
  AlertTriangle, ShieldAlert, AlertCircle, RotateCw,
  Search, X, Copy, Check, Terminal, Bug, ChevronDown
} from 'lucide-react';
import { Select, Badge } from '../../components/index.jsx';
import Button from '../../components/Button.jsx';
import Pagination from '../../components/Pagination.jsx';
import { useAdminErrorLogs } from '../../services/adminErrorLogs.js';
import { formatDate } from '../../lib/date.js';

const LEVEL_CONFIG = {
  Fatal: { label: 'Fatal (Khẩn cấp)', tone: 'danger', bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: 'rgba(239, 68, 68, 0.25)', icon: ShieldAlert },
  Error: { label: 'Error (Lỗi)', tone: 'rose', bg: 'rgba(244, 63, 94, 0.1)', color: '#e11d48', border: 'rgba(244, 63, 94, 0.25)', icon: AlertCircle },
  Warning: { label: 'Warning (Cảnh báo)', tone: 'amber', bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: 'rgba(245, 158, 11, 0.25)', icon: AlertTriangle },
  default: { label: 'Thông tin', tone: 'neutral', bg: 'rgba(107, 114, 128, 0.1)', color: '#4b5563', border: 'rgba(107, 114, 128, 0.25)', icon: Bug },
};

function formatVNTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  } catch {
    return iso;
  }
}

export default function AdminErrorLogs() {
  const [level, setLevel] = useState('');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const { data, isLoading, isError, refetch } = useAdminErrorLogs({ level: level || undefined, page });

  const items = data?.items || [];
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.total || items.length;

  // Lọc theo từ khóa tìm kiếm trong message hoặc sourceContext
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase().trim();
    return items.filter((log) =>
      (log.message || '').toLowerCase().includes(term) ||
      (log.sourceContext || '').toLowerCase().includes(term) ||
      (log.exception || '').toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const fatal = items.filter((x) => x.level === 'Fatal').length;
    const error = items.filter((x) => x.level === 'Error').length;
    const warning = items.filter((x) => x.level === 'Warning').length;
    return { total: totalItems, fatal, error, warning };
  }, [items, totalItems]);

  const copyTrace = (id, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* 4 Thẻ KPI Mức độ lỗi */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-3)' }}>
        <div
          onClick={() => { setLevel(''); setPage(1); }}
          style={{
            background: 'var(--white)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            border: level === '' ? '2px solid var(--action-primary)' : '2px solid transparent',
            transition: 'all 120ms ease',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bug size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tổng bản ghi lỗi</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: 'var(--text-strong)' }}>{stats.total}</div>
          </div>
        </div>

        <div
          onClick={() => { setLevel('Fatal'); setPage(1); }}
          style={{
            background: 'var(--white)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            border: level === 'Fatal' ? '2px solid #dc2626' : '2px solid transparent',
            transition: 'all 120ms ease',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Mức Fatal (Khẩn cấp)</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: '#dc2626' }}>{stats.fatal}</div>
          </div>
        </div>

        <div
          onClick={() => { setLevel('Error'); setPage(1); }}
          style={{
            background: 'var(--white)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            border: level === 'Error' ? '2px solid #e11d48' : '2px solid transparent',
            transition: 'all 120ms ease',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(244, 63, 94, 0.12)', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Mức Error (Lỗi)</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: '#e11d48' }}>{stats.error}</div>
          </div>
        </div>

        <div
          onClick={() => { setLevel('Warning'); setPage(1); }}
          style={{
            background: 'var(--white)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            border: level === 'Warning' ? '2px solid #d97706' : '2px solid transparent',
            transition: 'all 120ms ease',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Mức Warning (Cảnh báo)</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: '#d97706' }}>{stats.warning}</div>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div style={{
        background: 'var(--white)',
        borderRadius: 'var(--radius-card)',
        padding: '14px 18px',
        boxShadow: 'var(--shadow-inset-hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
      }}>
        {/* Tab Pills theo mức độ */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: '', label: 'Tất cả mức độ' },
            { id: 'Fatal', label: 'Fatal (Khẩn cấp)', count: stats.fatal },
            { id: 'Error', label: 'Error', count: stats.error },
            { id: 'Warning', label: 'Warning', count: stats.warning },
          ].map((t) => {
            const active = level === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => { setLevel(t.id); setPage(1); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? 'var(--action-dark)' : 'var(--surface-sunken)',
                  color: active ? 'var(--white)' : 'var(--text-body)',
                  font: 'var(--type-body-sm)',
                  fontWeight: active ? 600 : 500,
                  transition: 'all 120ms ease',
                }}
              >
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span style={{
                    padding: '1px 7px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                    background: active ? 'rgba(255, 255, 255, 0.22)' : 'var(--border-hairline)',
                    color: active ? 'var(--white)' : 'var(--text-muted)',
                  }}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tìm kiếm & Nút Làm mới */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Tìm theo nội dung lỗi, context…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                height: 36,
                padding: '0 30px 0 32px',
                borderRadius: 'var(--radius-field)',
                border: 'none',
                background: 'var(--surface-sunken)',
                boxShadow: 'var(--shadow-inset-hairline)',
                font: 'var(--type-body-sm)',
                color: 'var(--text-strong)',
                outline: 'none',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            title="Làm mới log lỗi"
            style={{
              height: 36,
              width: 36,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-field)',
              border: '1px solid var(--border-hairline)',
              background: 'var(--white)',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <RotateCw size={14} />
          </button>
        </div>
      </div>

      {/* Main List Table */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <RotateCw size={24} className="animate-spin" style={{ color: 'var(--action-primary)' }} />
            <span>Đang tải danh sách lỗi hệ thống…</span>
          </div>
        ) : isError ? (
          <div style={{ padding: 48, textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <span>Lỗi tải danh sách lỗi hệ thống.</span>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>Thử lại</Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Check size={36} color="#059669" />
            <div style={{ font: 'var(--type-body)', fontWeight: 600, color: 'var(--text-strong)' }}>
              Không có lỗi nào được ghi nhận
            </div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Hệ thống đang vận hành ổn định không phát sinh ngoại lệ nào theo bộ lọc này.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredItems.map((log, idx) => {
              const cfg = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.default;
              const LevelIcon = cfg.icon;

              return (
                <div
                  key={log.id}
                  style={{
                    padding: '18px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    borderBottom: idx < filteredItems.length - 1 ? '1px solid var(--border-hairline)' : 'none',
                    background: log.level === 'Fatal' ? 'rgba(239, 68, 68, 0.03)' : log.level === 'Error' ? 'rgba(244, 63, 94, 0.02)' : 'transparent',
                  }}
                >
                  {/* Top Bar: Level Pill, Context, Time */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '3px 9px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: 12,
                        fontWeight: 700,
                        background: cfg.bg,
                        color: cfg.color,
                        border: `1px solid ${cfg.border}`,
                      }}>
                        <LevelIcon size={12} />
                        {log.level}
                      </span>

                      {log.sourceContext && (
                        <code style={{
                          fontSize: 12,
                          background: 'var(--surface-sunken)',
                          padding: '2px 8px',
                          borderRadius: 4,
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border-hairline)'
                        }}>
                          {log.sourceContext}
                        </code>
                      )}
                    </div>

                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: 12 }}>
                      {formatVNTime(log.createdAt)}
                    </span>
                  </div>

                  {/* Message */}
                  <div style={{ font: 'var(--type-body)', fontWeight: 600, color: 'var(--text-strong)', lineHeight: 1.5 }}>
                    {log.message}
                  </div>

                  {/* Exception Stack Trace with One-Click Copy */}
                  {log.exception && (
                    <div style={{ position: 'relative', marginTop: 4 }}>
                      <pre style={{
                        margin: 0,
                        padding: '12px 14px',
                        background: '#0f172a',
                        color: '#f8fafc',
                        borderRadius: 'var(--radius-md)',
                        fontFamily: 'monospace',
                        fontSize: 12,
                        lineHeight: 1.5,
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        maxHeight: 220,
                      }}>
                        {log.exception}
                      </pre>

                      <button
                        type="button"
                        onClick={() => copyTrace(log.id, log.exception)}
                        title="Sao chép toàn bộ Stack Trace"
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 8px',
                          borderRadius: 4,
                          background: 'rgba(255, 255, 255, 0.15)',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 11,
                          fontWeight: 600,
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        {copiedId === log.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        <span>{copiedId === log.id ? 'Đã copy' : 'Copy Trace'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} size="sm" />
      )}
    </div>
  );
}
