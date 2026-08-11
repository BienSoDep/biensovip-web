import { useEffect } from 'react';

export function useSeo(st, cur0) {
  useEffect(() => {
    const scr = st.screen;
    const site = 'https://biensovip.com';
    const brand = 'Biển số đẹp Đà Nẵng — Duy Đinh';
    const post0 = st.posts.find((p) => p.id === st.postId) || st.posts[0];
    let title = brand;
    let desc = 'Mua bán biển số đẹp Đà Nẵng: ngũ quý, tứ quý, lộc phát, thần tài. Hồ sơ rõ ràng, sang tên nhanh, tư vấn phong thủy theo mệnh chủ xe.';
    let canonical = site;
    let type = 'website';
    let ld = null;
    if (scr === 'list') { title = 'Danh sách biển số đẹp | ' + brand; canonical = site + '/danh-sach'; }
    else if (scr === 'detail' && cur0) { title = 'Biển ' + cur0.prov + cur0.seri + ' ' + cur0.num + ' — ' + cur0.price + ' | ' + brand; desc = 'Biển số đẹp ' + cur0.vehicle + ' tại ' + cur0.city + '. ' + (cur0.fengshui || '') + ' Liên hệ Duy Đinh để giữ chỗ.'; canonical = site + '/bien/' + cur0.id; }
    else if (scr === 'detail') { title = 'Chi tiết biển số | ' + brand; canonical = site + '/bien/' + (st.curId || ''); }
    else if (scr === 'lucky') { title = 'Tư vấn biển số hợp mệnh | ' + brand; desc = 'Điền thông tin cá nhân để nhận gợi ý biển số đẹp hợp mệnh, hợp ngũ hành và phù hợp ngân sách của bạn.'; canonical = site + '/tu-van'; }
    else if (scr === 'about') { title = 'Về Duy Đinh — ' + brand; canonical = site + '/gioi-thieu'; }
    else if (scr === 'blog') { title = 'Tin phong thủy biển số | ' + brand; desc = 'Ý nghĩa dãy số, cách chọn biển hợp mệnh và quy định sang tên mới nhất. Nội dung phong thủy biển số xe hữu ích.'; canonical = site + '/tin'; type = 'CollectionPage'; }
    else if (scr === 'post' && post0) {
      title = post0.title + ' | ' + brand;
      desc = post0.desc || post0.excerpt;
      canonical = site + '/bai-viet/' + (post0.slug || post0.id);
      type = 'article';
      ld = {
        '@context': 'https://schema.org', '@type': 'BlogPosting',
        headline: post0.title, description: desc,
        datePublished: post0.date, author: { '@type': 'Person', name: 'Duy Đinh' },
        publisher: { '@type': 'Organization', name: 'Duy Đinh', logo: { '@type': 'ImageObject', url: site + '/assets/logo-mark.png' } },
        mainEntityOfPage: canonical,
      };
    }
    else if (scr === 'fav') title = 'Biển số yêu thích | ' + brand;
    else if (scr === 'register') title = 'Đăng ký tài khoản | ' + brand;
    else if (scr === 'login') title = 'Đăng nhập | ' + brand;
    else if (scr === 'forgot') title = 'Lấy lại mật khẩu | ' + brand;

    document.title = title;
    const setMeta = (attr, key, val) => {
      let el = document.head.querySelector('meta[' + attr + '="' + key + '"]');
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute('content', val);
    };
    const setLink = (rel, href) => {
      let el = document.head.querySelector('link[rel="' + rel + '"]');
      if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
      el.setAttribute('href', href);
    };
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:site_name', brand);
    setMeta('name', 'twitter:card', 'summary');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'robots', 'index, follow');
    setLink('canonical', canonical);
    let oldLd = document.head.querySelector('script[data-seo-ld]');
    if (oldLd) oldLd.remove();
    if (ld) {
      const sc = document.createElement('script');
      sc.type = 'application/ld+json'; sc.dataset.seoLd = '1';
      sc.textContent = JSON.stringify(ld);
      document.head.appendChild(sc);
    }
  }, [st.screen, st.postId]);
}
