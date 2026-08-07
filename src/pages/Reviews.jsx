import { Star, ThumbsUp } from 'lucide-react';
import Button from '../components/Button.jsx';
import { Avatar } from '../components/index.jsx';
import PlateVisual from '../components/PlateVisual.jsx';

// ponytail: UC15 reviews + ratings. Star picker + distribution bar.
export default function Reviews({ st, patch, notify }) {
  const reviews = st.reviews || [];
  const avg = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : '0.0';
  const dist = [5, 4, 3, 2, 1].map((n) => ({ stars: n, count: reviews.filter((r) => r.rating === n).length, pct: reviews.length ? Math.round((reviews.filter((r) => r.rating === n).length / reviews.length) * 100) : 0 }));

  const submit = () => {
    const d = st.reviewDraft || {};
    if (!d.rating) { notify('Vui lòng chọn số sao.'); return; }
    if (!d.body?.trim()) { notify('Vui lòng nhập nhận xét.'); return; }
    patch({ reviews: [{ id: 'rv' + Date.now(), name: st.user || 'Khách', rating: d.rating, body: d.body.trim(), pid: d.pid || '', time: 'Vừa xong' }, ...reviews], reviewDraft: null });
    notify('Cảm ơn bạn đã gửi đánh giá!');
  };

  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div>
        <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Đánh giá từ khách hàng</h1>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Trải nghiệm thực từ người đã mua biển số tại Duy Đinh.</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'center' }}>
        <div style={{ flex: '0 0 160px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-display-1)', color: 'var(--text-strong)', lineHeight: 1 }}>{avg}</span>
          <div style={{ display: 'flex', gap: 2 }}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={16} fill={n <= Math.round(Number(avg)) ? 'var(--amber-400)' : 'none'} style={{ color: n <= Math.round(Number(avg)) ? 'var(--amber-400)' : 'var(--grey-300)' }} />)}</div>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{reviews.length} đánh giá</span>
        </div>
        <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {dist.map((d) => (
            <div key={d.stars} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', width: 28 }}>{d.stars}★</span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--grey-100)', overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 3, background: 'var(--amber-400)', width: d.pct + '%', transition: 'width 300ms var(--ease-out)' }} /></div>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', width: 28, textAlign: 'right' }}>{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Gửi đánh giá của bạn</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Số sao:</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => patch({ reviewDraft: { ...st.reviewDraft, rating: n } })} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2 }}><Star size={24} fill={(st.reviewDraft?.rating || 0) >= n ? 'var(--amber-400)' : 'none'} style={{ color: (st.reviewDraft?.rating || 0) >= n ? 'var(--amber-400)' : 'var(--grey-300)' }} /></button>
          ))}
        </div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Biển số đã mua</span>
          <select value={st.reviewDraft?.pid || ''} onChange={(e) => patch({ reviewDraft: { ...st.reviewDraft, pid: e.target.value } })} style={{ height: 40, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 12px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', outline: 'none' }}>
            <option value="">Chọn biển số</option>
            {st.plates.filter((p) => p.status === 'Đã bán').map((p) => <option key={p.id} value={p.id}>{p.prov}{p.seri} {p.num}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Nhận xét</span>
          <textarea rows={3} placeholder="Chia sẻ trải nghiệm của bạn..." value={st.reviewDraft?.body || ''} onChange={(e) => patch({ reviewDraft: { ...st.reviewDraft, body: e.target.value } })} style={{ background: 'var(--surface-sunken)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '12px 14px', font: 'var(--type-body)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none' }} />
        </label>
        <Button variant="primary" size="md" onClick={submit} style={{ alignSelf: 'flex-start' }}>Gửi đánh giá</Button>
      </div>

      {!reviews.length ? (
        <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '48px var(--space-6)', textAlign: 'center' }}>
          <ThumbsUp size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {reviews.map((r) => {
            const p = r.pid ? st.plates.find((x) => x.id === r.pid) : null;
            return (
              <div key={r.id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Avatar name={r.name} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{r.name}</span><span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{r.time}</span></div>
                  <div style={{ flex: 1 }} />
                  <div style={{ display: 'flex', gap: 2 }}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} fill={n <= r.rating ? 'var(--amber-400)' : 'none'} style={{ color: n <= r.rating ? 'var(--amber-400)' : 'var(--grey-300)' }} />)}</div>
                </div>
                <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{r.body}</p>
                {p && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                    <PlateVisual size="sm" prov={p.prov} seri={p.seri} num={p.num} />
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Biển đã mua</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
