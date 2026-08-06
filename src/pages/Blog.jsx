import { POST_CATS } from '../lib/mockData.js';
import { Badge } from '../components/index.jsx';
import NavBtn, { pill } from '../components/NavBtn.jsx';
import LazyImage from '../components/LazyImage.jsx';
import { useStaggeredReveal } from '../hooks/useStaggeredReveal.js';

export default function Blog({ st, patch }) {
  const stagger = useStaggeredReveal();
  return (
    <div style={{ animation: 'pageIn 180ms var(--ease-out)' }}>
      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-8) var(--pad-page) var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div>
          <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Tin phong thủy</h1>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Ý nghĩa từng dãy số, cách chọn biển hợp mệnh và quy định mới nhất.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          {POST_CATS.map((c) => <NavBtn key={c} onClick={() => patch({ postCat: c })} {...pill(st.postCat === c)}>{c}</NavBtn>)}
        </div>
      </section>
      <section aria-label="Danh sách bài viết" style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: '0 var(--pad-page) var(--pad-section-y)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 'var(--gutter-section)', animation: 'fadeIn 180ms var(--ease-out)' }}>
        {st.posts.filter((p) => p.status === 'Đã xuất bản' && (st.postCat === 'Tất cả' || p.cat === st.postCat)).map((p, i) => (
          <article key={p.id} itemScope itemType="https://schema.org/Article" className="pressable" style={{ cursor: 'pointer', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'var(--transition-card)', ...stagger(i) }}>
            <a href={'#/bai-viet/' + (p.slug || p.id)} onClick={(e) => { e.preventDefault(); patch({ screen: 'post', postId: p.id }); }} style={{ display: 'flex', flexDirection: 'column', flex: 1, textDecoration: 'none', color: 'inherit' }}>
              <LazyImage src={p.img || ''} alt={p.imgAlt || p.title} style={{ height: 170, background: 'var(--surface-muted)' }} imgStyle={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} skeletonHeight={170} />
              <div style={{ padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Badge tone="neutral">{p.cat}</Badge>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}><time dateTime={p.date} itemProp="datePublished">{p.date}</time></span>
                </div>
                <h2 itemProp="headline" style={{ margin: 0, font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{p.title}</h2>
                <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }} itemProp="description">{p.excerpt}</p>
              </div>
            </a>
          </article>
        ))}
      </section>
    </div>
  );
}
