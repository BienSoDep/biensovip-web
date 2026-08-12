import { useEffect } from 'react';

const SITE = 'https://biensovip.com';
const BRAND = 'Biển số đẹp Đà Nẵng — Duy Đinh';
const DEFAULT_DESC = 'Mua bán biển số đẹp Đà Nẵng: ngũ quý, tứ quý, lộc phát, thần tài. Hồ sơ rõ ràng, sang tên nhanh, tư vấn phong thủy theo mệnh chủ xe.';

function setMeta(attr, key, val) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', val);
}

function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
  el.setAttribute('href', href);
}

function setJsonLd(ld) {
  const old = document.head.querySelector('script[data-seo-ld]');
  if (old) old.remove();
  if (!ld) return;
  const sc = document.createElement('script');
  sc.type = 'application/ld+json';
  sc.dataset.seoLd = '1';
  sc.textContent = JSON.stringify(ld);
  document.head.appendChild(sc);
}

/**
 * screen: current route screen id
 * data: real API data for detail screens — { plate } or { post } — undefined while loading
 */
export function useSeo(screen, data) {
  useEffect(() => {
    let title = BRAND;
    let desc = DEFAULT_DESC;
    let canonical = SITE;
    let type = 'website';
    let image = null;
    let ld = null;

    if (screen === 'list') {
      title = 'Danh sách biển số đẹp | ' + BRAND;
      canonical = SITE + '/danh-sach';
      ld = { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Danh sách biển số đẹp', url: canonical };
    } else if (screen === 'detail' && data?.plate) {
      const p = data.plate;
      const priceText = p.priceOnRequest ? 'Giá liên hệ' : `${Number(p.price).toLocaleString('vi-VN')}đ`;
      title = `Biển ${p.plateNumber} — ${priceText} | ${BRAND}`;
      desc = `Biển số đẹp ${p.vehicleType || ''} tại ${p.province || ''}. ${p.fengShuiMeaning || ''} Liên hệ Duy Đinh để giữ chỗ.`.trim();
      canonical = SITE + '/bien/' + (p.slug || p.id);
      image = p.images?.[0] || null;
      ld = {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'Danh sách biển số', item: SITE + '/danh-sach' },
          { '@type': 'ListItem', position: 3, name: p.plateNumber, item: canonical },
        ],
      };
    } else if (screen === 'detail') {
      title = 'Chi tiết biển số | ' + BRAND;
      canonical = SITE + '/bien/';
    } else if (screen === 'lucky') {
      title = 'Tư vấn biển số hợp mệnh | ' + BRAND;
      desc = 'Điền thông tin cá nhân để nhận gợi ý biển số đẹp hợp mệnh, hợp ngũ hành và phù hợp ngân sách của bạn.';
      canonical = SITE + '/tu-van';
    } else if (screen === 'about') {
      title = 'Về Duy Đinh — ' + BRAND;
      canonical = SITE + '/gioi-thieu';
    } else if (screen === 'blog') {
      title = 'Tin phong thủy biển số | ' + BRAND;
      desc = 'Ý nghĩa dãy số, cách chọn biển hợp mệnh và quy định sang tên mới nhất. Nội dung phong thủy biển số xe hữu ích.';
      canonical = SITE + '/tin';
      type = 'CollectionPage';
    } else if (screen === 'post' && data?.post) {
      const post = data.post;
      title = post.title + ' | ' + BRAND;
      desc = post.metaDescription || post.excerpt || DEFAULT_DESC;
      canonical = SITE + '/bai-viet/' + post.slug;
      type = 'article';
      image = post.coverImageUrl || null;
      ld = {
        '@context': 'https://schema.org', '@type': 'BlogPosting',
        headline: post.title, description: desc,
        datePublished: post.publishedAt,
        author: { '@type': 'Organization', name: 'Duy Đinh' },
        publisher: { '@type': 'Organization', name: 'Duy Đinh', logo: { '@type': 'ImageObject', url: SITE + '/assets/logo-mark.png' } },
        mainEntityOfPage: canonical,
      };
    } else if (screen === 'fav') title = 'Biển số yêu thích | ' + BRAND;
    else if (screen === 'register') title = 'Đăng ký tài khoản | ' + BRAND;
    else if (screen === 'login') title = 'Đăng nhập | ' + BRAND;
    else if (screen === 'forgot') title = 'Lấy lại mật khẩu | ' + BRAND;

    document.title = title;
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:site_name', BRAND);
    if (image) setMeta('property', 'og:image', image);
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'robots', 'index, follow');
    setLink('canonical', canonical);
    setJsonLd(ld);
  }, [screen, data]);
}
