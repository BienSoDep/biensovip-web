import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useInternalNotes, useAddInternalNote, useDeleteInternalNote } from '../services/internalNotes.js';
import { formatDateTime } from '../lib/date.js';
import { loadAuth } from '../lib/authStore.js';

// UC33 — panel ghi chú nội bộ dùng chung cho Contact và Customer (timeline, mới nhất trên đầu).
export default function InternalNotesPanel({ entityType, entityId }) {
  const auth = loadAuth();
  const [draft, setDraft] = useState('');
  const { data: notes, isLoading } = useInternalNotes(entityType, entityId);
  const addNote = useAddInternalNote();
  const deleteNote = useDeleteInternalNote();

  const submit = () => {
    const content = draft.trim();
    if (!content) return;
    addNote.mutate({ entityType, entityId, content }, { onSuccess: () => setDraft('') });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Ghi chú nội bộ</span>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); submit(); } }}
          placeholder="Ghi chú tiến trình xử lý… (Ctrl+Enter để gửi)"
          rows={2}
          disabled={addNote.isPending}
          style={{ flex: 1, resize: 'vertical', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', padding: '8px 12px', font: 'var(--type-body-sm)', opacity: addNote.isPending ? 0.6 : 1 }}
        />
        <button type="button" onClick={submit} disabled={!draft.trim() || addNote.isPending}
          style={{ alignSelf: 'flex-start', border: 'none', borderRadius: 'var(--radius-field)', padding: '8px 14px', background: 'var(--action-primary)', color: 'var(--white)', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', cursor: draft.trim() ? 'pointer' : 'default', opacity: draft.trim() ? 1 : 0.5 }}>
          Thêm
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
        {isLoading && <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Đang tải…</span>}
        {!isLoading && !notes?.length && <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Chưa có ghi chú nào.</span>}
        {notes?.map((n) => {
          const canDelete = auth?.user?.role === 'super-admin' || auth?.user?.id === n.createdBy;
          return (
            <div key={n.id} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 10px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{n.createdByLabel}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{formatDateTime(n.createdAt)}</span>
                  {canDelete && (
                    <button type="button" onClick={() => deleteNote.mutate({ id: n.id, entityType, entityId })} title="Xóa ghi chú"
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'inline-flex' }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </span>
              </div>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)', whiteSpace: 'pre-wrap' }}>{n.content}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
