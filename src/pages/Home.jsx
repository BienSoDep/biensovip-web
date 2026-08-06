import Button from '../components/Button.jsx';
import { SearchField, Badge, Eyebrow } from '../components/index.jsx';
import PlateCard from '../components/PlateCard.jsx';
import NavBtn, { pill } from '../components/NavBtn.jsx';

export default function Home({ st, patch, go, notify, heroAnim, cards, catNames }) {
  return (
    <div style={{ animation: 'pageIn 180ms var(--ease-out)' }}>
      <section style={{ padding: '0 var(--pad-page)' }}>
        <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', background: 'var(--surface-hero)', borderRadius: 'var(--radius-surface)', padding: 'clamp(28px,5vw,64px)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-8)', alignItems: 'center' }}>
          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <Eyebrow tone="blue">3.240 biển số đang chờ chủ mới</Eyebrow>
            <h1 style={{ margin: 0, font: 'var(--type-display-1)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Chọn biển số đẹp,<br />rước lộc về nhà</h1>
            <p style={{ margin: 0, maxWidth: 'var(--width-prose)', font: 'var(--type-body)', color: 'var(--text-body)' }}>Kho biển ngũ quý, tứ quý, lộc phát và thần tài tại Đà Nẵng cùng các tỉnh miền Trung. Hồ sơ rõ ràng, sang tên nhanh, tư vấn theo mệnh chủ xe.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <Button variant="primary" size="lg" uppercase onClick={go('list')}>Xem kho biển số</Button>
              <Button variant="outline" size="lg" onClick={() => notify('Đã mở Zalo — shop sẽ trả lời trong 15 phút')}>Nhắn Zalo tư vấn</Button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-8)', paddingTop: 'var(--space-6)', boxShadow: 'inset 0 1px 0 var(--border-hairline)' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>3.240</span><span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>biển số hiện có</span></div>
              <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>4,9/5</span><span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>khách hài lòng</span></div>
              <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>15 phút</span><span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>phản hồi trung bình</span></div>
            </div>
          </div>
          <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 520, aspectRatio: '1.42/1' }}>
              <img src="/assets/hero-plate-left.png" alt="Biển số 43A 888.88" style={{ position: 'absolute', left: -3, top: -3, width: '71%', zIndex: 1, transform: 'rotate(-13deg)', animation: heroAnim('fanLeft', 100) }} />
              <img src="/assets/hero-plate-right.png" alt="Biển số 43K 556.68" style={{ position: 'absolute', left: 131, top: 170, width: '71%', zIndex: 2, transform: 'rotate(7deg)', animation: heroAnim('fanRight', 180) }} />
              <img src="/assets/hero-plate-main.png" alt="Biển số 43A1 999.99" style={{ position: 'absolute', left: '8%', top: '15%', width: '84%', zIndex: 3, transform: 'rotate(-5deg)', animation: heroAnim('fanMain', 0) }} />
            </div>
            <div style={{ width: '100%', maxWidth: 520, display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '0 4px' }}>
              <Badge tone="rose">Ngũ quý · còn 1 số</Badge>
              <div style={{ flex: 1 }} />
              <span style={{ font: 'var(--type-price)', color: 'var(--text-strong)' }}>43A1 · 999.99 — 2.150.000.000đ</span>
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 'var(--width-content)', margin: '-26px auto 0', padding: '0 var(--pad-page)', position: 'relative', zIndex: 5 }}>
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-pill)', boxShadow: 'var(--shadow-3)', padding: '10px 14px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
          <SearchField placeholder="Tìm theo đuôi số, VD: 79, 68, 39…" value={st.q} onChange={(e) => patch({ q: e.target.value, page: 1 })} width={300} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', flex: 1 }}>
            {['Tất cả', ...catNames].map((c) => (
              <NavBtn key={c} onClick={() => patch({ cat: c, page: 1 })} {...pill(st.cat === c)}>{c}</NavBtn>
            ))}
          </div>
          <Button variant="primary" size="md" onClick={go('list')}>Tìm biển số</Button>
        </div>
      </section>

      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page) 0', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-4)' }}>
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Eyebrow tone="blue">Nổi bật</Eyebrow>
          <h2 style={{ margin: 0, font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Biển số nổi bật</h2>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Những tấm biển được khách hỏi nhiều nhất tuần này.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={go('list')}>Xem tất cả →</Button>
      </section>
      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-6) var(--pad-page) var(--pad-section-y)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(276px,1fr))', gap: 'var(--gutter-section)', animation: 'fadeIn 180ms var(--ease-out)' }}>
        {cards(st.plates.filter((p) => p.status !== 'Ẩn').slice(0, 4)).map((p) => <PlateCard key={p.id} {...p} />)}
      </section>

      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: '0 var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Eyebrow tone="blue">Video</Eyebrow>
          <h2 style={{ margin: 0, font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Xem shop trên TikTok &amp; Facebook</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'var(--gutter-section)' }}>
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', aspectRatio: '9/14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', border: '2px dashed var(--border-strong)' }}>
            <span style={{ font: 'var(--type-title-3)', color: 'var(--text-muted)' }}>TikTok video</span>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Chèn link/embed video TikTok tại đây</span>
          </div>
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', border: '2px dashed var(--border-strong)' }}>
            <span style={{ font: 'var(--type-title-3)', color: 'var(--text-muted)' }}>Facebook video</span>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Chèn link/embed video Facebook tại đây</span>
          </div>
        </div>
      </section>

      <section style={{ padding: '0 var(--pad-page) var(--pad-section-y)' }}>
        <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', background: 'var(--surface-inverse)', borderRadius: 'var(--radius-surface)', padding: 'clamp(28px,4vw,52px)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-8)' }}>
          <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Eyebrow tone="inverse">Hướng dẫn</Eyebrow>
            <h2 style={{ margin: 0, font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--white)' }}>Chọn đúng, mua một lần</h2>
            <p style={{ margin: 0, font: 'var(--type-body)', color: 'rgba(255,255,255,.72)', maxWidth: 'var(--width-prose)' }}>Gửi số điện thoại, chúng tôi lo phần còn lại: kiểm tra hồ sơ, báo giá thật và sang tên trong 1–2 ngày.</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <Button variant="primary" size="lg" onClick={go('blog')}>Đọc tin phong thủy</Button>
            <Button variant="outline" size="lg" onClick={go('about')}>Về chúng tôi</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
