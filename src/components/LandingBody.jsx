import { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import Button from './Button.jsx';
import PlateCard from './PlateCard.jsx';
import PlateCardSkeleton from './skeletons/PlateCardSkeleton.jsx';
import { useStaggeredReveal } from '../hooks/useStaggeredReveal.js';
import { routeFor } from '../config/routes.js';

function FaqAccordion({ faqs }) {
  const [openIdx, setOpenIdx] = useState(0);
  if (!faqs?.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {faqs.map((f, i) => {
        const open = openIdx === i;
        return (
          <div key={i} style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <button type="button" onClick={() => setOpenIdx(open ? -1 : i)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '14px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', font: 'var(--type-body)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
              {f.question}
              <ChevronDown size={18} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms var(--ease-out)', flexShrink: 0 }} />
            </button>
            {open && (
              <p style={{ margin: 0, padding: '0 16px 16px', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{f.answer}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function LandingBody({ title, intro, plates, faqs, isLoading, isError, openPlate, onBuy, contact, blogPost }) {
  const stagger = useStaggeredReveal();
  return (
    <div style={{ animation: 'pageIn 180ms var(--ease-out)' }}>
      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-7) var(--pad-page) var(--space-4)' }}>
        <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>
          {title || 'Kho Biển Số Đẹp'}
        </h1>
        {intro && (
          <div className="landing-intro" style={{ font: 'var(--type-body)', color: 'var(--text-body)', maxWidth: 'var(--width-prose)' }} dangerouslySetInnerHTML={{ __html: intro }} />
        )}
        {blogPost && (
          <div style={{ marginTop: 'var(--space-6)', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', overflow: 'hidden', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
            {blogPost.coverImageUrl && (
              <img src={blogPost.coverImageUrl} alt={blogPost.title} loading="lazy" style={{ width: 'min(100%, 220px)', aspectRatio: '16/9', objectFit: 'cover', flexShrink: 0, display: 'block' }} />
            )}
            <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-4)' }}>
              <span style={{ padding: '2px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', color: 'var(--action-primary)', alignSelf: 'flex-start' }}>Bài viết chi tiết</span>
              <h2 style={{ margin: 0, font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{blogPost.title}</h2>
              {blogPost.excerpt && <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{blogPost.excerpt}</p>}
              <a href={routeFor('post', blogPost.slug)}>
                <Button variant="primary" size="md">Đọc tiếp →</Button>
              </a>
            </div>
          </div>
        )}
      </section>

      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: '0 var(--pad-page) var(--space-6)' }}>
        {isError ? (
          <p style={{ font: 'var(--type-body)', color: 'var(--text-muted)' }}>Không tải được dữ liệu. Vui lòng thử lại.</p>
        ) : isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(276px,100%),1fr))', gap: 'var(--gutter-section)' }}>
            {Array.from({ length: 8 }, (_, i) => <PlateCardSkeleton key={i} />)}
          </div>
        ) : plates?.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(276px,100%),1fr))', gap: 'var(--gutter-section)' }}>
            {plates.map((p, i) => (
              <PlateCard key={p.id}
                plateNumber={p.plateNumber} type={p.type} province={p.province} vehicleType={p.vehicleType}
                price={p.price} priceOnRequest={p.priceOnRequest} isHot={p.isHot} thumbnailUrl={p.thumbnailUrl}
                status={p.status} onOpen={() => openPlate?.(p.slug || p.id)}
                href={routeFor('detail', p.slug || p.id)}
                onBuy={() => onBuy?.(p.id)} contact={contact} style={stagger(i)} />
            ))}
          </div>
        ) : (
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '48px var(--space-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
            <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)' }}>Hiện chưa có biển còn hàng phù hợp — liên hệ Zalo để chúng tôi tìm biển theo yêu cầu.</p>
            <a href="#chat" onClick={(e) => { e.preventDefault(); onBuy?.(null); }}>
              <Button variant="primary" size="md"><MessageCircle size={16} style={{ marginRight: 6 }} />Săn biển theo yêu cầu</Button>
            </a>
          </div>
        )}
      </section>

      {faqs?.length > 0 && (
        <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: '0 var(--pad-page) var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h2 style={{ margin: 0, font: 'var(--type-display-3)', color: 'var(--text-strong)' }}>Câu hỏi thường gặp</h2>
          <FaqAccordion faqs={faqs} />
        </section>
      )}
    </div>
  );
}
