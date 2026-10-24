import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, FileCode, CheckCircle2, Layers, Landmark, CarFront, Filter, Layers2 } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Button from '../../../components/Button.jsx';

export default function ExportOptionModal({
  open,
  onClose,
  onExport,
  page = 1,
  pageSize = 50,
  currentPageCount = 0,
  totalCount = 0,
}) {
  const [scope, setScope] = useState('all'); // 'all' | 'vpa' | 'available'
  const [format, setFormat] = useState('xlsx'); // 'xlsx' | 'docx' | 'csv'
  const [range, setRange] = useState('all'); // 'all' | 'page'

  if (!open) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    onExport({
      format,
      scope,
      isCurrentPageOnly: range === 'page',
    });
    onClose();
  };

  const scopeOptions = [
    {
      id: 'all',
      title: 'Gộp cả hai (VPA & Biển có sẵn)',
      badge: 'Khuyên dùng',
      icon: Layers,
      color: '#0284c7',
      desc: 'Xuất gộp toàn bộ kho: Sheet 1 chứa Biển có sẵn, các Sheet tiếp theo phân theo Tỉnh/Phiên đấu giá VPA.',
    },
    {
      id: 'vpa',
      title: 'Riêng biển đấu giá VPA',
      badge: 'VPA Only',
      icon: Landmark,
      color: '#d97706',
      desc: 'Chỉ xuất các biển đấu giá từ cổng VPA (phiên tuần, phiên tháng, đã đấu giá), phân chia sheet theo tỉnh/phiên.',
    },
    {
      id: 'available',
      title: 'Riêng biển số có sẵn',
      badge: 'Có sẵn',
      icon: CarFront,
      color: '#16a34a',
      desc: 'Chỉ xuất các biển sẵn sàng giao dịch (gồm biển VPA đã duyệt giá niêm yết và kho biển sẵn sàng bán của hệ thống).',
    },
  ];

  const formatOptions = [
    {
      id: 'xlsx',
      title: 'Excel (.xlsx)',
      sub: 'Tối đa 1.000.000 biển (đa sheet)',
      icon: FileSpreadsheet,
      color: '#107c41',
      badge: 'Tối ưu quản lý',
    },
    {
      id: 'docx',
      title: 'Word (.docx)',
      sub: 'Tối đa 50.000 biển (in ấn)',
      icon: FileText,
      color: '#2b579a',
      badge: 'Gửi đối tác / Khách',
    },
    {
      id: 'csv',
      title: 'CSV (.csv)',
      sub: 'Không giới hạn (1.000.000+ biển)',
      icon: FileCode,
      color: '#c2410c',
      badge: 'Tương thích CRM',
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Tùy chọn xuất dữ liệu biển số" maxWidth="580px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Section 1: Phạm vi kho dữ liệu */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Layers2 size={15} style={{ color: 'var(--primary)' }} />
            <span>1. Chọn loại biển số cần xuất:</span>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {scopeOptions.map((opt) => {
              const active = scope === opt.id;
              const Icon = opt.icon;
              return (
                <div
                  key={opt.id}
                  onClick={() => setScope(opt.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: `1.5px solid ${active ? opt.color : 'var(--grey-200, #e2e8f0)'}`,
                    background: active ? `${opt.color}0a` : 'var(--surface-raised, #ffffff)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: active ? opt.color : 'var(--surface-sunken, #f1f5f9)',
                      color: active ? '#ffffff' : opt.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <Icon size={17} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: active ? opt.color : 'var(--text-strong)' }}>
                        {opt.title}
                      </span>
                      {opt.badge && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: active ? `${opt.color}20` : 'var(--surface-sunken)',
                            color: active ? opt.color : 'var(--text-muted)',
                          }}
                        >
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-muted, #64748b)', lineHeight: 1.4 }}>
                      {opt.desc}
                    </p>
                  </div>
                  <div style={{ paddingTop: 3 }}>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: `1.5px solid ${active ? opt.color : 'var(--grey-300, #cbd5e1)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: active ? opt.color : 'transparent',
                      }}
                    >
                      {active && <CheckCircle2 size={12} color="#ffffff" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Chọn định dạng file */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <FileSpreadsheet size={15} style={{ color: 'var(--primary)' }} />
            <span>2. Chọn định dạng tải về:</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {formatOptions.map((opt) => {
              const active = format === opt.id;
              const Icon = opt.icon;
              return (
                <div
                  key={opt.id}
                  onClick={() => setFormat(opt.id)}
                  style={{
                    padding: '10px 10px',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: `1.5px solid ${active ? opt.color : 'var(--grey-200, #e2e8f0)'}`,
                    background: active ? `${opt.color}0a` : 'var(--surface-raised, #ffffff)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={22} color={opt.color} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: active ? opt.color : 'var(--text-strong)' }}>
                    {opt.title}
                  </span>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                    {opt.sub}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Phạm vi số lượng */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Filter size={15} style={{ color: 'var(--primary)' }} />
            <span>3. Số lượng xuất:</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div
              onClick={() => setRange('all')}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md, 8px)',
                border: `1.5px solid ${range === 'all' ? 'var(--primary, #0284c7)' : 'var(--grey-200, #e2e8f0)'}`,
                background: range === 'all' ? 'rgba(2, 132, 199, 0.05)' : 'var(--surface-raised, #ffffff)',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 700, color: range === 'all' ? 'var(--primary)' : 'var(--text-strong)', marginBottom: 2 }}>
                Toàn bộ theo bộ lọc
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {totalCount.toLocaleString('vi-VN')} biển phù hợp • Chạy ngầm & theo dõi %
              </div>
            </div>

            <div
              onClick={() => setRange('page')}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md, 8px)',
                border: `1.5px solid ${range === 'page' ? 'var(--primary, #0284c7)' : 'var(--grey-200, #e2e8f0)'}`,
                background: range === 'page' ? 'rgba(2, 132, 199, 0.05)' : 'var(--surface-raised, #ffffff)',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 700, color: range === 'page' ? 'var(--primary)' : 'var(--text-strong)', marginBottom: 2 }}>
                Chỉ trang hiện tại
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Trang {page} • {currentPageCount || pageSize} biển đang xem
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, paddingTop: 14, borderTop: '1px solid var(--grey-100, #f1f5f9)' }}>
          <Button type="button" variant="outline" onClick={onClose} style={{ minWidth: 80 }}>
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 160,
              fontWeight: 600,
              background: format === 'xlsx' ? '#107c41' : (format === 'docx' ? '#2b579a' : '#c2410c'),
              borderColor: 'transparent',
            }}
          >
            <Download size={15} />
            <span>Tải dữ liệu ngay</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
