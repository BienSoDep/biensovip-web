import { useState } from 'react';
import { Select, Input } from '../../components/index.jsx';
import Button from '../../components/Button.jsx';
import { useDbConsoleTables, useDbConsoleQuery } from '../../services/adminDbConsole.js';

const OPERATOR_OPTS = [
  { value: 'eq', label: '=' }, { value: 'neq', label: '≠' },
  { value: 'gt', label: '>' }, { value: 'gte', label: '≥' },
  { value: 'lt', label: '<' }, { value: 'lte', label: '≤' },
  { value: 'contains', label: 'chứa' },
];

export default function AdminDbConsole({ notify }) {
  const { data: tables } = useDbConsoleTables();
  const query = useDbConsoleQuery();
  const [table, setTable] = useState('');
  const [filters, setFilters] = useState([]);

  const tableOpts = (tables || []).map((t) => ({ value: t.table, label: t.table }));
  const currentFields = (tables || []).find((t) => t.table === table)?.fields || [];
  const fieldOpts = currentFields.map((f) => ({ value: f, label: f }));

  const addFilter = () => setFilters((f) => [...f, { field: currentFields[0] || '', operator: 'eq', value: '' }]);
  const updateFilter = (i, patch) => setFilters((f) => f.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const removeFilter = (i) => setFilters((f) => f.filter((_, idx) => idx !== i));

  const run = () => {
    if (!table) { notify?.('Chọn bảng trước'); return; }
    query.mutate({ table, filters: filters.filter((f) => f.field && f.value !== ''), limit: 50 }, {
      onError: (err) => notify?.(err.message || 'Truy vấn thất bại'),
    });
  };

  const rows = query.data?.rows || [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : currentFields;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <Select label="Bảng" value={table} options={tableOpts} onChange={(v) => { setTable(v); setFilters([]); }} />
        <Button variant="outline" size="md" onClick={addFilter} disabled={!table}>+ Thêm điều kiện lọc</Button>
        <Button variant="primary" size="md" onClick={run} disabled={!table || query.isPending}>{query.isPending ? 'Đang chạy…' : 'Xem dữ liệu'}</Button>
      </div>

      {filters.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {filters.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <Select value={f.field} options={fieldOpts} onChange={(v) => updateFilter(i, { field: v })} />
              <Select value={f.operator} options={OPERATOR_OPTS} onChange={(v) => updateFilter(i, { operator: v })} />
              <Input value={f.value} onChange={(e) => updateFilter(i, { value: e.target.value })} placeholder="Giá trị" />
              <button type="button" onClick={() => removeFilter(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--status-danger)', font: 'var(--type-caption)' }}>Xóa</button>
            </div>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', font: 'var(--type-caption)' }}>
            <thead>
              <tr style={{ background: 'var(--surface-sunken)' }}>
                {columns.map((c) => <th key={c} style={{ padding: '8px 12px', textAlign: 'left', whiteSpace: 'nowrap' }}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
                  {columns.map((c) => <td key={c} style={{ padding: '8px 12px', whiteSpace: 'nowrap', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>{String(r[c] ?? '—')}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {query.isSuccess && rows.length === 0 && (
        <div style={{ padding: '24px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không có dòng nào khớp điều kiện lọc.</div>
      )}
    </div>
  );
}
