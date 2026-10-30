import { Home } from 'lucide-react';
import { contentGet } from '../lib/content/index.js';
import { PROVINCE_LANDINGS, PLATE_TYPE_LANDINGS } from '../config/routes.js';

const LABEL_HREF_MAP = {
  'trang chủ': '/',
  'home': '/',
  'biển số': '/danh-sach',
  'danh sách biển số': '/danh-sach',
  'kho biển số': '/danh-sach',
  'tư vấn biển hợp mệnh': '/hop-menh',
  'biển hợp mệnh': '/hop-menh',
  'luận giải phong thủy biển số & gợi ý cải vận': '/luan-bien-so',
  'luận giải biển số': '/luan-bien-so',
  'tin phong thủy': '/tin',
  'tin tức': '/tin',
  'so sánh biển số': '/so-sanh',
  'cộng tác viên': '/cong-tac-vien',
  'đánh giá': '/danh-gia',
  'liên hệ tư vấn': '/lien-he',
  'trợ lý ai': '/tro-ly-ai',
  'biển số đã lưu': '/yeu-thich',
  'lịch sử duyệt biển số': '/yeu-thich',
  'quản trị': '/admin/tong-quan',
};

function inferBreadcrumbHref(label) {
  if (!label || typeof label !== 'string') return null;
  const norm = label.trim().toLowerCase();
  if (LABEL_HREF_MAP[norm]) return LABEL_HREF_MAP[norm];
  const prov = PROVINCE_LANDINGS.find((p) => p.name.toLowerCase() === norm);
  if (prov) return '/' + prov.slug;
  const pt = PLATE_TYPE_LANDINGS.find((p) => p.name.toLowerCase() === norm || ('biển ' + p.name.toLowerCase()) === norm);
  if (pt) return '/' + pt.slug;
  return null;
}

export default function Breadcrumb({ items, keepOnMobile, inset }) {
  if (!items || !items.length) return null;
  // inset: dùng trong shell đã tự căn layout (vd AdminShell) — bỏ max-width/margin-auto/padding page
  // để breadcrumb bám sát container cha thay vì tự căn giữa trong khung đã hẹp sẵn (gây thụt lề).
  const wrapStyle = inset
    ? { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0, font: 'var(--type-caption)' }
    : { maxWidth: 'var(--width-content)', margin: '0 auto', padding: '12px var(--pad-page)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0, font: 'var(--type-caption)' };
  const validItems = (items || []).filter(
    (it, idx, arr) => it && it.label && (idx === 0 || it.label !== arr[idx - 1]?.label)
  );
  if (!validItems.length) return null;
  return (
    <nav aria-label={contentGet('common.breadcrumb.aria') || 'Breadcrumb'} className={'page-breadcrumb' + (keepOnMobile ? ' keep-mobile' : '')} style={inset ? undefined : { boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
      <div style={wrapStyle}>
        {validItems.map((it, i) => {
          const last = i === validItems.length - 1;
          const first = i === 0;
          const href = !last ? (it.href || inferBreadcrumbHref(it.label)) : null;
          const isLink = !last && Boolean(href);
          const isButton = !last && !isLink && Boolean(it.onClick);
          const Tag = isLink ? 'a' : isButton ? 'button' : 'span';
          const handleClick = (e) => {
            if (!it.onClick) return;
            if (isLink) {
              if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
            }
            it.onClick(e);
          };
          return (
            <Tag
              key={i}
              href={isLink ? href : undefined}
              type={isButton ? 'button' : undefined}
              onClick={(isLink || isButton) && it.onClick ? handleClick : undefined}
              aria-current={last ? 'page' : undefined}
              style={isLink ? { textDecoration: 'none' } : undefined}
              className={'breadcrumb-step' + (last ? ' is-current' : '') + (isLink || isButton ? ' pressable' : '')}
            >
              {first && <Home aria-hidden size={13} />}
              <span>{it.label}</span>
            </Tag>
          );
        })}
      </div>
    </nav>
  );
}
