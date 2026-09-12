import { useState } from 'react';
import { LayoutGrid, List, Wallet } from 'lucide-react';
import AdminKanban from './AdminKanban.jsx';
import AdminContacts from './AdminContacts.jsx';
import AdminTransactions from './AdminTransactions.jsx';

// 1 trang cho toàn bộ luồng bán hàng — thay 3 trang rời (Yêu cầu liên hệ / Quy trình / Giao dịch)
// vốn đọc chung 2 entity (ContactRequest, Transaction) liên kết 2 chiều nên luôn phải đổi qua lại.
// Ba view là 3 cách NHÌN cùng một dữ liệu, không phải 3 nguồn riêng: mọi mutation đều invalidate
// cả 5 cache key qua invalidateSales() nên đổi trạng thái ở view này là view kia đổi ngay, không F5.
//
// ponytail: view là state cục bộ, không đẩy lên URL — đủ dùng vì vào thẳng 1 màn cụ thể thì đã có
// slug cũ redirect kèm ?view=. Nếu cần deep-link từng view rồi thì mới đọc/ghi query string.
const VIEWS = [
  { key: 'pipeline', label: 'Quy trình', Icon: LayoutGrid },
  { key: 'list', label: 'Danh sách', Icon: List },
  { key: 'transactions', label: 'Giao dịch', Icon: Wallet },
];

export default function AdminSales({ notify, go, st, initialView }) {
  const [view, setView] = useState(VIEWS.some((v) => v.key === initialView) ? initialView : 'pipeline');
  // Mở chi tiết 1 liên hệ từ thẻ Kanban → nhảy sang view Danh sách kèm từ khóa, thay vì rời trang.
  const [focusQ, setFocusQ] = useState(null);

  const openContact = (c) => {
    setFocusQ(c.fullName || '');
    setView('list');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div role="tablist" aria-label="Chế độ xem bán hàng" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        {VIEWS.map(({ key, label, Icon }) => {
          const active = view === key;
          return (
            <button key={key} role="tab" aria-selected={active} type="button" onClick={() => setView(key)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 18px', border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer', font: 'var(--type-body-sm)', fontWeight: active ? 'var(--fw-bold)' : 'var(--fw-medium)', background: active ? 'var(--action-primary)' : 'var(--white)', color: active ? 'var(--text-inverse)' : 'var(--text-body)', boxShadow: 'var(--shadow-inset-hairline)' }}>
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>

      {/* hidden chứ không unmount: đổi view qua lại không mất filter đang chọn và không refetch lại
          từ đầu. key chỉ dùng để ép AdminContacts seed lại ô tìm kiếm khi bấm thẻ Kanban. */}
      <div hidden={view !== 'pipeline'}><AdminKanban notify={notify} go={go} onOpenContact={openContact} /></div>
      <div hidden={view !== 'list'}>
        <AdminContacts key={focusQ ?? 'default'} notify={notify} go={go} st={focusQ != null ? { ...st, adminQ: focusQ } : st} />
      </div>
      <div hidden={view !== 'transactions'}><AdminTransactions notify={notify} /></div>
    </div>
  );
}
