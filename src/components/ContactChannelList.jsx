import { Phone } from 'lucide-react';
import Button from './Button.jsx';
import ZaloIcon from './ZaloIcon.jsx';
import FacebookIcon from './FacebookIcon.jsx';
import TikTokIcon from './TikTokIcon.jsx';
import { logZaloClick } from '../services/zaloClicks.js';
import { content } from '../lib/content/index.js';
import { toZaloUrl } from '../lib/zaloMessage.js';

// Danh sách 4 kênh liên hệ (Zalo/Gọi/Facebook/TikTok) — trước đây chỉ có ở trang Liên hệ
// (ChatZaloContact), Home chỉ có nút Zalo + hotline rời rạc, thiếu Facebook/TikTok/giờ làm việc.
// Trích ra dùng chung để mọi nơi hiện đủ và đồng bộ khi đổi thông tin liên hệ (content.info.*).
export default function ContactChannelList({ notify, zaloSource = 'contact_page' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter-section)', height: '100%' }}>
      <div style={{ position: 'relative', flex: 1, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: '0 0 0 2px var(--action-primary) inset', padding: 'var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <span style={{ position: 'absolute', top: -10, left: 20, background: 'var(--action-primary)', color: 'var(--white)', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', padding: '2px 10px', borderRadius: 'var(--radius-pill)' }}>Nhanh nhất</span>
        <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 'var(--radius-pill)', background: '#0068FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ZaloIcon style={{ color: '#fff' }} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Nhắn Zalo</h3>
          <p style={{ margin: '2px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{content.info.phone_display} · phản hồi {content.info.reply_time}</p>
        </div>
        <Button variant="primary" size="md" onClick={() => { logZaloClick(null, zaloSource); window.open(toZaloUrl(content.info.zalo), '_blank'); notify?.('Đang mở Zalo...'); }} style={{ flexShrink: 0 }}>Mở Zalo</Button>
      </div>

      <div style={{ flex: 1, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 'var(--radius-pill)', background: 'var(--mint-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={22} style={{ color: 'var(--status-success-ink)' }} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Gọi điện thoại</h3>
          <p style={{ margin: '2px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{content.info.hours}</p>
        </div>
        <a href={`tel:${content.info.phone}`} style={{ textDecoration: 'none', flexShrink: 0 }}><Button variant="dark" size="md">{content.info.phone_display}</Button></a>
      </div>

      <div style={{ flex: 1, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 'var(--radius-pill)', background: '#E7EFFD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FacebookIcon style={{ color: '#1877F2' }} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Facebook</h3>
          <p style={{ margin: '2px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Nhắn tin qua fanpage, xem thêm biển số mới đăng.</p>
        </div>
        <a href={content.info.facebook_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', flexShrink: 0 }}><Button variant="outline" size="md">Fanpage</Button></a>
      </div>

      <div style={{ flex: 1, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 'var(--radius-pill)', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TikTokIcon style={{ color: 'var(--white)' }} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>TikTok</h3>
          <p style={{ margin: '2px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Video giới thiệu biển số, đánh giá thực tế từ khách.</p>
        </div>
        <a href={content.info.tiktok_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', flexShrink: 0 }}><Button variant="outline" size="md">Xem TikTok</Button></a>
      </div>
    </div>
  );
}
