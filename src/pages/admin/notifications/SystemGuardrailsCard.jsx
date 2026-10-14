import { ShieldCheck, Moon, Bell, Zap, Sparkles } from 'lucide-react';
import { useNotificationGuardrails } from '../../../services/adminNotificationService.js';

export default function SystemGuardrailsCard() {
  const { data: res } = useNotificationGuardrails();
  const rails = res?.data || res || {
    quietStartHour: 22,
    quietEndHour: 1,
    maxPerDay: 12,
    reEngageAfterDays: 14,
    priceDropThresholdPct: 5,
    aiSuggestEnabled: false,
  };

  const startVn = ((rails.quietStartHour ?? 22) + 7) % 24;
  const endVn = ((rails.quietEndHour ?? 1) + 7) % 24;
  const quietStr = `${String(startVn).padStart(2, '0')}:00 - ${String(endVn).padStart(2, '0')}:00`;

  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-4) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--surface-tint-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--action-primary)' }}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 8 }}>
              Quy tắc hệ thống &amp; Chống spam (Guardrails Engine)
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'rgba(63,191,143, 0.1)', color: '#2E9970', fontWeight: 'var(--fw-semibold)' }}>
                Đang bảo vệ
              </span>
            </div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Cấu hình kỹ thuật cốt lõi giúp tối ưu hóa tỷ lệ chuyển đổi, ngăn chặn tràn hộp thư và bảo vệ danh tiếng gửi mail.</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-2)' }}>
        <div style={{ padding: '10px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            <Moon size={14} style={{ color: '#8A8F99' }} />
            <span>Khung giờ im lặng (Quiet Hours)</span>
          </div>
          <div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{quietStr} (Giờ VN)</div>
          <div style={{ font: 'var(--type-caption)', fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.4 }}>
            Tự động hoãn email/chuông đêm ({rails.quietStartHour}h - {rails.quietEndHour}h UTC). Admin quét thủ công vẫn gửi ngay.
          </div>
        </div>

        <div style={{ padding: '10px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            <Bell size={14} style={{ color: '#f59e0b' }} />
            <span>Giới hạn tần suất (Daily Cap)</span>
          </div>
          <div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Tối đa {rails.maxPerDay} tin / user / ngày</div>
          <div style={{ font: 'var(--type-caption)', fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.4 }}>
            Giới hạn tối đa số thông báo mỗi thành viên nhận trong ngày để chống spam khi có nhiều biến động.
          </div>
        </div>

        <div style={{ padding: '10px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            <Zap size={14} style={{ color: '#ef4444' }} />
            <span>Ngưỡng kích hoạt giảm giá</span>
          </div>
          <div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Giảm ≥ {rails.priceDropThresholdPct}% giá</div>
          <div style={{ font: 'var(--type-caption)', fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.4 }}>
            Chỉ kích hoạt thông báo khi giá biển yêu thích hoặc đã xem giảm sâu vượt mức tối thiểu này.
          </div>
        </div>

        <div style={{ padding: '10px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            <Sparkles size={14} style={{ color: '#F19720' }} />
            <span>Trợ lý AI Gợi ý biển</span>
          </div>
          <div style={{ font: 'var(--type-title-3)', color: rails.aiSuggestEnabled ? '#2E9970' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {rails.aiSuggestEnabled ? 'Đang hoạt động' : 'Tạm dừng (Mặc định)'}
          </div>
          <div style={{ font: 'var(--type-caption)', fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.4 }}>
            {rails.aiSuggestEnabled ? 'Đang phân tích gợi ý thông minh dựa trên DeepSeek AI.' : 'Gợi ý biển tĩnh theo tỉnh/loại xe để tối ưu hóa chi phí API.'}
          </div>
        </div>
      </div>
    </div>
  );
}
