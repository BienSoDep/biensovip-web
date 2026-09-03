import { useEffect } from 'react';
import { contentGet, contentItems } from '../lib/content/index.js';

// Origin thật của chính trang đang chạy (biensovip.com production, localhost khi dev) — không
// hardcode domain cũ (bug 03/09/2026: GSC Live Test cho thấy canonical/og:url trỏ nhầm sang
// biensodep.vercel.app, domain Vercel preview đã bỏ khi chuyển sang VPS Hostinger).
const SITE = typeof window !== 'undefined' ? window.location.origin : 'https://biensovip.com';
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
      const productLd = {
        '@type': 'Product',
        name: `Biển số ${p.plateNumber}`,
        description: desc,
        ...(image ? { image } : {}),
        sku: p.plateNumber,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'VND',
          ...(p.priceOnRequest ? {} : { price: p.price }),
          availability: p.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
          url: canonical,
        },
        ...(p.ratingCount > 0 ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: p.ratingAvg,
            reviewCount: p.ratingCount,
          },
        } : {}),
      };
      const breadcrumbLd = {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'Danh sách biển số', item: SITE + '/danh-sach' },
          { '@type': 'ListItem', position: 3, name: p.plateNumber, item: canonical },
        ],
      };
      ld = { '@context': 'https://schema.org', '@graph': [productLd, breadcrumbLd] };
    } else if (screen === 'detail') {
      title = 'Chi tiết biển số | ' + BRAND;
      canonical = SITE + '/bien/';
    } else if (screen === 'lucky') {
      title = 'Tư vấn biển số hợp mệnh | ' + BRAND;
      desc = 'Điền thông tin cá nhân để nhận gợi ý biển số đẹp hợp mệnh, hợp ngũ hành và phù hợp ngân sách của bạn.';
      canonical = SITE + '/hop-menh';
      image = SITE + '/assets/logo-mark.png';
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
    } else if (screen === 'fav') { title = 'Biển số yêu thích | ' + BRAND; canonical = SITE + '/yeu-thich'; }
    else if (screen === 'register') { title = 'Đăng ký tài khoản | ' + BRAND; canonical = SITE + '/dang-ky'; }
    else if (screen === 'login') { title = 'Đăng nhập | ' + BRAND; canonical = SITE + '/dang-nhap'; }
    else if (screen === 'forgot') { title = 'Lấy lại mật khẩu | ' + BRAND; canonical = SITE + '/quen-mat-khau'; }
    else if (screen === 'chat') {
      title = 'Liên hệ tư vấn | ' + BRAND;
      desc = 'Liên hệ Duy Đinh qua Zalo, điện thoại hoặc form để tư vấn biển số đẹp, đặt cọc giữ chỗ.';
      canonical = SITE + '/lien-he';
    } else if (screen === 'compare') {
      title = 'So sánh biển số | ' + BRAND;
      desc = 'So sánh giá, ý nghĩa phong thủy và điểm hợp mệnh giữa nhiều biển số đẹp cùng lúc.';
      canonical = SITE + '/so-sanh';
    } else if (screen === 'saved') {
      title = 'Thông báo biển mới theo yêu cầu | ' + BRAND;
      canonical = SITE + '/thong-bao';
    } else if (screen === 'reviews') {
      title = 'Đánh giá từ khách hàng | ' + BRAND;
      desc = 'Đánh giá thật từ khách hàng đã mua biển số đẹp tại Duy Đinh — minh bạch, đáng tin cậy.';
      canonical = SITE + '/danh-gia';
    } else if (screen === 'notifications') {
      title = 'Thông báo | ' + BRAND;
      canonical = SITE + '/thong-bao-moi';
    } else if (screen === 'collab') {
      title = 'Cộng tác viên bán biển số | ' + BRAND;
      desc = 'Đăng ký cộng tác viên, nhận hoa hồng khi giới thiệu khách mua biển số đẹp Đà Nẵng.';
      canonical = SITE + '/cong-tac-vien';
    } else if (screen === 'terms') {
      title = 'Điều khoản sử dụng | ' + BRAND;
      canonical = SITE + '/dieu-khoan';
    } else if (screen === 'privacy') {
      title = 'Chính sách bảo mật | ' + BRAND;
      canonical = SITE + '/bao-mat';
    } else if (screen === 'transfer') {
      title = 'Hướng dẫn sang tên biển số | ' + BRAND;
      desc = 'Hướng dẫn thủ tục sang tên đổi chủ biển số xe mới nhất — hồ sơ, phí, quy trình chi tiết.';
      canonical = SITE + '/sang-ten';
      const steps = contentItems('transfer.steps');
      if (steps.length) {
        ld = {
          '@context': 'https://schema.org', '@type': 'HowTo',
          name: contentGet('transfer.title') || 'Hướng dẫn sang tên biển số',
          description: desc,
          step: steps.map((s) => ({
            '@type': 'HowToStep',
            name: s.title,
            text: s.desc,
          })),
        };
      }
    } else if (screen === 'faq') {
      title = 'Câu hỏi thường gặp | ' + BRAND;
      canonical = SITE + '/hoi-dap';
    } else if (screen === 'notfound') {
      title = 'Không tìm thấy trang | ' + BRAND;
    } else if ((screen === 'provinceLanding' || screen === 'plateTypeLanding') && data?.landing) {
      const l = data.landing;
      title = l.title + ' | ' + BRAND;
      desc = (l.intro || '').replace(/<[^>]+>/g, '').slice(0, 300) || DEFAULT_DESC;
      canonical = SITE + window.location.pathname;
      const breadcrumbLd = {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE },
          { '@type': 'ListItem', position: 2, name: l.title, item: canonical },
        ],
      };
      const graph = [breadcrumbLd];
      if (l.faqs?.length) {
        graph.push({
          '@type': 'FAQPage',
          mainEntity: l.faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        });
      }
      ld = { '@context': 'https://schema.org', '@graph': graph };
    }

    if (screen === 'home') {
      ld = {
        '@context': 'https://schema.org', '@type': 'Organization',
        name: 'Biensovip — Duy Đinh', url: SITE,
        logo: SITE + '/assets/logo-mark.png',
        description: DEFAULT_DESC,
        areaServed: { '@type': 'City', name: 'Đà Nẵng' },
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: SITE + '/danh-sach?q={search_term_string}' },
          'query-input': 'required name=search_term_string',
        },
      };
    }

    document.title = title;
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:site_name', BRAND);
    setMeta('property', 'og:locale', 'vi_VN');
    if (image) setMeta('property', 'og:image', image);
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', desc);
    const noIndexScreens = ['fav', 'saved', 'notifications', 'register', 'login', 'forgot', 'notfound'];
    setMeta('name', 'robots', noIndexScreens.includes(screen) ? 'noindex, follow' : 'index, follow');
    setLink('canonical', canonical);
    setJsonLd(ld);
  }, [screen, data]);
}
