import { useState } from 'react';
import {
  X, RotateCw, Phone, MessageSquare, Copy, Check, Eye, Heart, ExternalLink, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useAdminCustomerDetail,
  useUpdateCustomer,
  useCustomerSessions,
  useRevokeCustomerSession,
  useVerifyCustomerEmail,
} from '../../../services/adminCustomers.js';
import { formatDate, formatDateTime } from '../../../lib/date.js';
import { Badge } from '../../../components/index.jsx';
import Button from '../../../components/Button.jsx';
import Modal from '../../../components/Modal.jsx';
import InternalNotesPanel from '../../../components/InternalNotesPanel.jsx';
import { SkeletonText } from '../../../components/Skeleton.jsx';
import { validatePhone } from '../../../lib/phone.js';
import { toZaloUrl } from '../../../lib/zaloMessage.js';
import { routeFor } from '../../../config/routes.js';

const fmtDate = formatDate;
const fmtDateTime = formatDateTime;
const fmtVnd = (n) => (n == null ? null : Number(n).toLocaleString('vi-VN') + 'đ');

const GENDER_LABEL = { male: 'Nam', female: 'Nữ', other: 'Khác' };
const CONTACT_STATUS_LABEL = { new: 'Mới', consulting: 'Đang tư vấn', closed: 'Đã chốt', found: 'Đã chốt (cũ)', cancelled: 'Hủy' };
const ELEMENT_LABEL = { kim: 'Kim', moc: 'Mộc', thuy: 'Thủy', hoa: 'Hỏa', tho: 'Thổ' };

function getAvatarBg(str = '') {
  const colors = [
    'linear-gradient(135deg, #C75B00, #C75B00)',
    'linear-gradient(135deg, #3FBF8F, #2E9970)',
    'linear-gradient(135deg, #d97706, #b45309)',
    'linear-gradient(135deg, #6B7180, #4A4F59)',
    'linear-gradient(135deg, #A8485A, #8a3645)',
    'linear-gradient(135deg, #C75B00, #8a3d00)',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function DrawerSection({ title, count, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', fontWeight: 600 }}>
          {title}{count != null ? ` (${count})` : ''}
        </span>
      </div>
      {children}
    </div>
  );
}

export default function CustomerDetailDrawer({ id, onClose, notify }) {
  const { data, isLoading, isError, refetch } = useAdminCustomerDetail(id);
  const updateCustomer = useUpdateCustomer();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'plates' | 'sales' | 'notes'
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', phone: '' });
  const { data: sessions, isLoading: sessionsLoading } = useCustomerSessions(id);
  const revokeSession = useRevokeCustomerSession();
  const [confirmRevoke, setConfirmRevoke] = useState(null); // { sessionId, deviceLabel, ipAddress }
  const [copiedField, setCopiedField] = useState(null);

  const verifyEmail = useVerifyCustomerEmail();

  const handleVerifyEmail = () => {
    verifyEmail.mutate(id, {
      onSuccess: () => toast.success('Đã xác thực email hộ khách hàng thành công'),
      onError: (e) => toast.error(e.message || 'Lỗi xác thực email'),
    });
  };

  const startEdit = () => {
    setEditForm({ fullName: data?.fullName || '', email: data?.email || '', phone: data?.phone || '' });
    setEditing(true);
  };

  const saveEdit = () => {
    if (!editForm.fullName.trim()) return toast.error('Vui lòng nhập họ tên');
    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) return toast.error('Email không hợp lệ');
    if (editForm.phone && !validatePhone(editForm.phone)) return toast.error('Số điện thoại không hợp lệ');
    updateCustomer.mutate(
      { id, ...editForm },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật thông tin khách hàng');
          setEditing(false);
        },
        onError: (e) => toast.error(e.message || 'Lỗi cập nhật'),
      }
    );
  };

  const copyVal = (val, field) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedField(field);
    toast.success(`Đã sao chép: ${val}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const zaloUrl = data?.phone ? toZaloUrl(data.phone) : null;
  const avatarBg = getAvatarBg(data?.email || data?.fullName || String(id));
  const firstLetter = (data?.fullName?.[0] || data?.email?.[0] || 'K').toUpperCase();

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'var(--overlay-scrim)', animation: 'fadeIn 140ms var(--ease-out)' }} />
      <div style={{
        position: 'relative',
        width: 'min(560px, 100vw)',
        height: '100%',
        background: 'var(--white)',
        boxShadow: 'var(--shadow-4)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 220ms var(--ease-out)',
      }}>
        {/* Header Drawer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-hairline)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: avatarBg,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 16,
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
            }}>
              {firstLetter}
            </div>
            <div>
              <div style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)', lineHeight: 1.2 }}>
                {data?.fullName || data?.email || 'Chi tiết khách hàng'}
              </div>
              <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                ID: #{id} · Đăng ký {data?.createdAt ? formatDate(data.createdAt) : '—'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: 6,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              borderRadius: 'var(--radius-field)',
              display: 'inline-flex'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Action Bar nếu có SĐT/Email */}
        {data && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-2)',
            padding: '10px 20px',
            background: 'var(--surface-sunken)',
            borderBottom: '1px solid var(--border-subtle)',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {data.phone ? (
                <a
                  href={`tel:${data.phone}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-field)',
                    background: 'var(--action-primary)',
                    color: '#fff',
                    font: 'var(--type-caption)',
                    textDecoration: 'none'
                  }}
                >
                  <Phone size={13} /> Gọi: {data.phone}
                </a>
              ) : (
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Chưa có SĐT</span>
              )}
              {zaloUrl && (
                <a
                  href={zaloUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-field)',
                    background: 'rgba(0, 104, 255, 0.12)',
                    color: '#0068ff',
                    font: 'var(--type-caption)',
                    textDecoration: 'none'
                  }}
                >
                  <MessageSquare size={13} /> Chat Zalo
                </a>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {data.email && (
                <button
                  type="button"
                  onClick={() => copyVal(data.email, 'email')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-field)',
                    border: '1px solid var(--border-hairline)',
                    background: 'var(--white)',
                    font: 'var(--type-caption)',
                    color: copiedField === 'email' ? 'var(--intent-success)' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {copiedField === 'email' ? <Check size={12} /> : <Copy size={12} />} Copy Email
                </button>
              )}
              {data.phone && (
                <button
                  type="button"
                  onClick={() => copyVal(data.phone, 'phone')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-field)',
                    border: '1px solid var(--border-hairline)',
                    background: 'var(--white)',
                    font: 'var(--type-caption)',
                    color: copiedField === 'phone' ? 'var(--intent-success)' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {copiedField === 'phone' ? <Check size={12} /> : <Copy size={12} />} Copy SĐT
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab navigation inside Drawer */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-hairline)',
          background: 'var(--white)',
          padding: '0 20px',
          gap: 16
        }}>
          {[
            { id: 'profile', label: 'Hồ sơ & Bảo mật' },
            { id: 'plates', label: `Biển số (${(data?.favorites?.length || 0) + (data?.topViewedPlates?.length || 0)})` },
            { id: 'sales', label: `Đặt cọc & Tư vấn (${data?.contactRequests?.length || 0})` },
            { id: 'notes', label: 'Ghi chú nội bộ' },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: '12px 2px',
                  font: 'var(--type-label)',
                  fontWeight: active ? 600 : 500,
                  color: active ? 'var(--action-primary)' : 'var(--text-muted)',
                  borderBottom: active ? '2px solid var(--action-primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 120ms ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Drawer Body with Tabs */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SkeletonText height={80} />
              <SkeletonText height={120} />
              <SkeletonText height={80} />
            </div>
          )}

          {isError && (
            <div style={{ textAlign: 'center', padding: '48px 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center' }}>
              <AlertCircle size={32} style={{ color: 'var(--intent-danger)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Lỗi tải dữ liệu chi tiết khách hàng.</span>
              <Button variant="ghost" size="sm" onClick={() => refetch()}>Thử lại</Button>
            </div>
          )}

          {data && (
            <>
              {/* TAB 1: HỒ SƠ & BẢO MẬT */}
              {activeTab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {/* Hồ sơ cơ bản */}
                  <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', fontWeight: 600 }}>Thông tin cá nhân</span>
                      {!editing && <Button variant="ghost" size="sm" onClick={startEdit}>Chỉnh sửa</Button>}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <Badge tone={data.status === 'active' ? 'mint' : 'rose'}>{data.status === 'active' ? 'Hoạt động' : 'Đã khóa'}</Badge>
                      <Badge tone={data.emailVerified ? 'mint' : 'neutral'}>{data.emailVerified ? 'Email đã xác thực' : 'Email chưa xác thực'}</Badge>
                      {data.fengShuiElement && <Badge tone="amber">Mệnh {ELEMENT_LABEL[data.fengShuiElement] || data.fengShuiElement}</Badge>}
                    </div>

                    {!data.emailVerified && data.email && (
                      <div style={{ marginTop: 2 }}>
                        <Button variant="outline" size="sm" disabled={verifyEmail.isPending} onClick={handleVerifyEmail}>
                          {verifyEmail.isPending ? 'Đang xác thực...' : 'Xác thực email hộ khách hàng'}
                        </Button>
                      </div>
                    )}

                    {editing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                          Họ và tên
                          <input
                            value={editForm.fullName}
                            onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
                            style={{ height: 36, border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-field)', padding: '0 10px', font: 'var(--type-body-sm)' }}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                          Email
                          <input
                            value={editForm.email}
                            onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                            style={{ height: 36, border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-field)', padding: '0 10px', font: 'var(--type-body-sm)' }}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                          Số điện thoại
                          <input
                            value={editForm.phone}
                            onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                            style={{ height: 36, border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-field)', padding: '0 10px', font: 'var(--type-body-sm)' }}
                          />
                        </label>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 4 }}>
                          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Hủy</Button>
                          <Button variant="primary" size="sm" disabled={updateCustomer.isPending} onClick={saveEdit}>Lưu thay đổi</Button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px 16px', marginTop: 4, font: 'var(--type-body-sm)' }}>
                        <div>
                          <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Email</div>
                          <div style={{ color: 'var(--text-strong)', fontWeight: 500 }}>{data.email || '—'}</div>
                        </div>
                        <div>
                          <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Số điện thoại</div>
                          <div style={{ color: 'var(--text-strong)', fontWeight: 500 }}>{data.phone || '—'}</div>
                        </div>
                        <div>
                          <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Ngày sinh</div>
                          <div style={{ color: 'var(--text-strong)' }}>{fmtDate(data.birthDate) || '—'}</div>
                        </div>
                        <div>
                          <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Giới tính</div>
                          <div style={{ color: 'var(--text-strong)' }}>{GENDER_LABEL[data.gender] || '—'}</div>
                        </div>
                        <div>
                          <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Ngày đăng ký</div>
                          <div style={{ color: 'var(--text-strong)' }}>{fmtDate(data.createdAt)}</div>
                        </div>
                        <div>
                          <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đăng nhập gần nhất</div>
                          <div style={{ color: 'var(--text-strong)' }}>{fmtDateTime(data.lastLoginAt) || 'Chưa đăng nhập'}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Phiên đăng nhập đang hoạt động */}
                  <DrawerSection title="Phiên đăng nhập & Thiết bị" count={sessions?.length}>
                    {sessionsLoading ? (
                      <EmptyRow text="Đang tải phiên đăng nhập…" />
                    ) : !sessions?.length ? (
                      <EmptyRow text="Không có phiên đăng nhập nào đang hoạt động." />
                    ) : (
                      sessions.map((s) => (
                        <div
                          key={s.id}
                          style={{
                            background: 'var(--surface-sunken)',
                            borderRadius: 'var(--radius-field)',
                            padding: '10px 12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 8,
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ font: 'var(--type-body-strong)', color: 'var(--text-strong)' }}>
                              {s.deviceLabel || 'Thiết bị không rõ'}
                            </span>
                            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                              IP: {s.ipAddress || '—'} · Hoạt động {fmtDateTime(s.lastActiveAt)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={revokeSession.isPending}
                            onClick={() => setConfirmRevoke({ sessionId: s.id, deviceLabel: s.deviceLabel, ipAddress: s.ipAddress })}
                            style={{ color: 'var(--intent-danger)' }}
                          >
                            Đăng xuất
                          </Button>
                        </div>
                      ))
                    )}
                  </DrawerSection>
                </div>
              )}

              {/* TAB 2: BIỂN SỐ & QUAN TÂM */}
              {activeTab === 'plates' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <DrawerSection title="Biển số yêu thích" count={data.favorites?.length}>
                    {data.favorites?.length === 0 ? (
                      <EmptyRow text="Khách hàng chưa lưu biển số nào vào danh sách yêu thích." />
                    ) : (
                      data.favorites?.map((f) => (
                        <div
                          key={f.plateId}
                          style={{
                            background: 'var(--surface-sunken)',
                            borderRadius: 'var(--radius-field)',
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)', fontWeight: 700 }}>{f.plateNumber}</span>
                            <a
                              href={routeFor('detail', f.plateId)}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 3, font: 'var(--type-caption)', color: 'var(--brand-primary)', textDecoration: 'none' }}
                            >
                              Xem biển <ExternalLink size={12} />
                            </a>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ font: 'var(--type-body-strong)', color: 'var(--intent-success)' }}>{fmtVnd(f.currentPrice)}</div>
                            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Lưu lúc {fmtDate(f.createdAt)}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </DrawerSection>

                  <DrawerSection title="Biển xem nhiều nhất" count={data.topViewedPlates?.length}>
                    {data.topViewedPlates?.length === 0 ? (
                      <EmptyRow text="Chưa có dữ liệu lượt xem biển số." />
                    ) : (
                      data.topViewedPlates?.map((v) => (
                        <div
                          key={v.plateId}
                          style={{
                            background: 'var(--surface-sunken)',
                            borderRadius: 'var(--radius-field)',
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ font: 'var(--type-body-strong)', color: 'var(--text-strong)' }}>{v.plateNumber}</span>
                            <a
                              href={routeFor('detail', v.plateId)}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 3, font: 'var(--type-caption)', color: 'var(--brand-primary)', textDecoration: 'none' }}
                            >
                              Mở <ExternalLink size={12} />
                            </a>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)', fontWeight: 600 }}>{v.viewCount} lượt xem</div>
                            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Gần nhất {fmtDateTime(v.lastViewedAt)}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </DrawerSection>

                  <DrawerSection title="Lịch sử tra cứu phong thủy" count={data.fengShuiLookups?.length}>
                    {data.fengShuiLookups?.length === 0 ? (
                      <EmptyRow text="Khách hàng chưa tra cứu phong thủy lần nào." />
                    ) : (
                      data.fengShuiLookups?.map((h, i) => (
                        <RowCard
                          key={i}
                          left={`Mệnh ${ELEMENT_LABEL[h.element] || h.element} (Sinh ngày ${fmtDate(h.birthDate)})`}
                          right={fmtDateTime(h.createdAt)}
                          sub="Tra cứu qua công cụ phong thủy ngũ hành"
                        />
                      ))
                    )}
                  </DrawerSection>

                  <DrawerSection title="Bộ lọc tìm kiếm đã lưu" count={data.savedSearches?.length}>
                    {data.savedSearches?.length === 0 ? (
                      <EmptyRow text="Chưa lưu bộ lọc tìm kiếm nào." />
                    ) : (
                      data.savedSearches?.map((s) => (
                        <RowCard
                          key={s.id}
                          left={s.name || 'Bộ lọc tìm kiếm'}
                          right={s.notifyEnabled ? <Badge tone="mint">Bật thông báo</Badge> : <Badge tone="neutral">Tắt thông báo</Badge>}
                          sub={`Tạo lúc ${fmtDate(s.createdAt)}`}
                        />
                      ))
                    )}
                  </DrawerSection>
                </div>
              )}

              {/* TAB 3: ĐẶT CỌC & TƯ VẤN & THÔNG BÁO */}
              {activeTab === 'sales' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <DrawerSection title="Yêu cầu liên hệ / Đặt cọc" count={data.contactRequests?.length}>
                    {data.contactRequests?.length === 0 ? (
                      <EmptyRow text="Khách hàng chưa gửi yêu cầu liên hệ hoặc đặt cọc nào." />
                    ) : (
                      data.contactRequests?.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            background: 'var(--surface-sunken)',
                            borderRadius: 'var(--radius-field)',
                            padding: '12px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Badge tone={c.intent === 'deposit' ? 'amber' : 'blue'}>
                                {c.intent === 'deposit' ? 'Đặt cọc' : 'Hỏi mua / Tư vấn'}
                              </Badge>
                              <span style={{ font: 'var(--type-body-strong)', color: 'var(--text-strong)' }}>
                                {c.plateNumber || 'Hỏi chung'}
                              </span>
                            </div>
                            <Badge tone={c.status === 'closed' ? 'mint' : c.status === 'consulting' ? 'blue' : 'neutral'}>
                              {CONTACT_STATUS_LABEL[c.status] || c.status}
                            </Badge>
                          </div>
                          {c.note && (
                            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', background: 'var(--white)', padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}>
                              Ghi chú: {c.note}
                            </div>
                          )}
                          <div style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
                            Thời gian gửi: {fmtDateTime(c.createdAt)}
                          </div>
                        </div>
                      ))
                    )}
                  </DrawerSection>

                  <DrawerSection title="Thông báo hệ thống đã gửi" count={data.notifications?.length}>
                    {data.notifications?.length === 0 ? (
                      <EmptyRow text="Chưa có thông báo nào được gửi tới khách hàng này." />
                    ) : (
                      data.notifications?.map((n) => (
                        <RowCard
                          key={n.id}
                          left={n.title || n.type}
                          right={<Badge tone={n.read ? 'neutral' : 'amber'}>{n.read ? 'Đã xem' : 'Chưa đọc'}</Badge>}
                          sub={fmtDateTime(n.createdAt)}
                        />
                      ))
                    )}
                  </DrawerSection>
                </div>
              )}

              {/* TAB 4: GHI CHÚ NỘI BỘ */}
              {activeTab === 'notes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                    Ghi chú trao đổi nội bộ giữa Admin và đội ngũ CSKH/Sale về khách hàng này. Khách hàng sẽ không nhìn thấy nội dung này.
                  </div>
                  <InternalNotesPanel entityType="customer" entityId={id} notify={notify} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal xác nhận thu hồi phiên đăng nhập */}
      <Modal open={!!confirmRevoke} onClose={() => setConfirmRevoke(null)} title="Đăng xuất phiên đăng nhập" maxWidth="420px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Bạn có chắc muốn đăng xuất khách hàng khỏi thiết bị <b>{confirmRevoke?.deviceLabel || 'không rõ'}</b>{confirmRevoke?.ipAddress ? ` (IP: ${confirmRevoke.ipAddress})` : ''}?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="md" onClick={() => setConfirmRevoke(null)}>Hủy</Button>
            <Button
              variant="danger"
              size="md"
              disabled={revokeSession.isPending}
              onClick={() => {
                revokeSession.mutate(
                  { id, sessionId: confirmRevoke.sessionId },
                  {
                    onSuccess: () => {
                      toast.success('Đã đăng xuất phiên thiết bị này thành công');
                      setConfirmRevoke(null);
                    },
                    onError: (e) => toast.error(e.message || 'Lỗi khi đăng xuất phiên')
                  }
                );
              }}
            >
              {revokeSession.isPending ? 'Đang xử lý…' : 'Đăng xuất phiên'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function RowCard({ left, right, sub }) {
  return (
    <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4, border: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{left}</span>
        <span style={{ flexShrink: 0 }}>{right}</span>
      </div>
      {sub && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{sub}</span>}
    </div>
  );
}

function EmptyRow({ text = 'Chưa có dữ liệu.' }) {
  return (
    <div style={{ padding: '14px 16px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)', textAlign: 'center', font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
      {text}
    </div>
  );
}
