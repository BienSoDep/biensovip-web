import { useEffect } from 'react';
import { contentGet, contentItems } from '../lib/content/index.js';

// Origin thật của chính trang đang chạy (biensovip.com production, localhost khi dev) — không
// hardcode domain cũ (bug 03/09/2026: GSC Live Test cho thấy canonical/og:url trỏ nhầm sang
// biensodep.vercel.app, domain Vercel preview đã bỏ khi chuyển sang VPS Hostinger).
const SITE = typeof window !== 'undefined' ? window.location.origin : 'https://biensovip.com';
const BRAND = 'Biensovip — Biển số đẹp Đà Nẵng';
const DEFAULT_DESC = 'Kho biển số đẹp toàn quốc — ngũ quý, tứ quý, lộc phát, thần tài, sảnh tiến. Tư vấn hợp mệnh miễn phí, giá rõ ràng, hỗ trợ sang tên. Nhắn Zalo ngay!';

function setMeta(attr, key, val) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', val);
}

// Cắt tại khoảng trắng gần nhất trước giới hạn — tránh đứt giữa từ trong snippet Google/social
// share. Đồng bộ 160 ký tự với SeoEndpoints.cs TruncateAtWordBoundary (SEO audit finding #2) —
// server /render/* là bản Google/bot thấy thật, nên đây chỉ cần khớp cùng độ dài, không phải nguồn.
function truncateAtWordBoundary(text, maxLength) {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd();
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
    let canonical = SITE + '/';
    let type = 'website';
    let image = null;
    let ld = null;

    if (screen === 'list') {
      title = 'Kho Biển Số Xe Đẹp Toàn Quốc — Ngũ Quý, Tứ Quý, Thần Tài | ' + BRAND;
      desc = 'Xem kho biển số xe đẹp đang chào bán: ngũ quý, tứ quý, tam hoa, lộc phát, thần tài, sảnh tiến. Cập nhật liên tục, giá công khai minh bạch, hỗ trợ sang tên toàn quốc.';
      canonical = SITE + '/danh-sach';
      const items = data?.items || [];
      const itemListLd = {
        '@type': 'ItemList', name: 'Danh sách biển số đẹp', url: canonical,
        ...(items.length ? {
          itemListElement: items.map((p, i) => ({
            '@type': 'ListItem', position: i + 1,
            url: SITE + '/bien/' + (p.slug || p.id),
          })),
        } : {}),
      };
      const breadcrumbLd = {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'Danh sách biển số', item: canonical },
        ],
      };
      ld = { '@context': 'https://schema.org', '@graph': [itemListLd, breadcrumbLd] };
    } else if (screen === 'detail' && data?.plate) {
      const p = data.plate;
      const priceText = p.priceOnRequest ? 'Giá liên hệ' : `${Number(p.price).toLocaleString('vi-VN')}đ`;
      title = `Biển ${p.plateNumber} — ${priceText} | ${BRAND}`;
      // truncateAtWordBoundary — fengShuiMeaning có thể dài hàng nghìn ký tự, nhồi nguyên vào meta
      // description làm Google/mạng xã hội tự cắt xấu khi share link.
      desc = truncateAtWordBoundary(`Biển số đẹp ${p.vehicleType || ''} tại ${p.province || ''}. ${p.fengShuiMeaning || ''} Liên hệ Duy Đinh để giữ chỗ.`.trim(), 160);
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
      title = 'Biển số xe đẹp phong thủy | ' + BRAND;
      canonical = SITE + '/bien/';
    } else if (screen === 'lucky') {
      title = 'Tra cứu Biển Số Hợp Mệnh Theo Ngũ Hành — Tư Vấn Miễn Phí | ' + BRAND;
      desc = 'Tra cứu biển số hợp mệnh theo ngũ hành Kim Mộc Thủy Hỏa Thổ. Nhập năm sinh để nhận gợi ý biển số phong thủy đẹp hợp tuổi, hợp ngũ hành và phù hợp ngân sách.';
      canonical = SITE + '/hop-menh';
      image = SITE + '/assets/logo-mark.png';
    } else if (screen === 'about') {
      title = 'Về Duy Đinh — Shop Biển Số Đẹp Đà Nẵng Uy Tín | ' + BRAND;
      desc = 'Duy Đinh — chuyên gia tư vấn biển số đẹp phong thủy tại Đà Nẵng. Hơn 5 năm kinh nghiệm, hỗ trợ sang tên toàn quốc, dịch vụ Zalo nhanh trong 15 phút.';
      canonical = SITE + '/gioi-thieu';
    } else if (screen === 'blog') {
      title = 'Tin Tức Phong Thủy Biển Số & Cẩm Nang Chọn Biển Đẹp | ' + BRAND;
      desc = 'Ý nghĩa dãy số biển số xe, cách chọn biển hợp mệnh theo ngũ hành, quy định đấu giá biển số và sang tên mới nhất 2026.';
      canonical = SITE + '/tin';
      type = 'CollectionPage';
    } else if (screen === 'post' && data?.post) {
      const post = data.post;
      title = post.title + ' | ' + BRAND;
      desc = truncateAtWordBoundary(post.metaDescription || post.excerpt || DEFAULT_DESC, 160);
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
      title = 'Liên Hệ Mua Biển Số Đẹp — Tư Vấn Ngay Qua Zalo | ' + BRAND;
      desc = 'Liên hệ Duy Đinh qua Zalo 0815 792 699 để được tư vấn biển số đẹp phong thủy, báo giá và đặt cọc giữ chỗ ngay hôm nay.';
      canonical = SITE + '/lien-he';
    } else if (screen === 'compare') {
      title = 'So Sánh Biển Số Đẹp — Giá & Điểm Phong Thủy | ' + BRAND;
      desc = 'So sánh giá, ý nghĩa phong thủy và điểm hợp mệnh giữa nhiều biển số đẹp cùng lúc. Chọn biển tốt nhất cho mệnh của bạn.';
      canonical = SITE + '/so-sanh';
    } else if (screen === 'saved') {
      title = 'Thông báo biển mới theo yêu cầu | ' + BRAND;
      canonical = SITE + '/thong-bao';
    } else if (screen === 'reviews') {
      title = 'Đánh Giá Khách Hàng — Mua Biển Số Đẹp Tại Biensovip | ' + BRAND;
      desc = 'Hàng trăm đánh giá thật từ khách hàng đã mua biển số đẹp phong thủy tại Biensovip — uy tín, minh bạch, sang tên nhanh.';
      canonical = SITE + '/danh-gia';
    } else if (screen === 'notifications') {
      title = 'Thông báo | ' + BRAND;
      canonical = SITE + '/thong-bao-moi';
    } else if (screen === 'collab') {
      title = 'Cộng Tác Viên Biển Số Đẹp — Nhận Hoa Hồng Hấp Dẫn | ' + BRAND;
      desc = 'Đăng ký cộng tác viên Biensovip, giới thiệu khách mua biển số đẹp và nhận hoa hồng hấp dẫn. Làm online, không cần vốn.';
      canonical = SITE + '/cong-tac-vien';
    } else if (screen === 'terms') {
      title = 'Điều khoản sử dụng | ' + BRAND;
      canonical = SITE + '/dieu-khoan';
    } else if (screen === 'privacy') {
      title = 'Chính sách bảo mật | ' + BRAND;
      canonical = SITE + '/bao-mat';
    } else if (screen === 'transfer') {
      title = 'Hướng Dẫn Sang Tên Biển Số Xe Ô Tô & Xe Máy 2026 | ' + BRAND;
      desc = 'Hướng dẫn chi tiết thủ tục sang tên đổi chủ biển số xe — hồ sơ cần thiết, phí sang tên, quy trình tại cơ quan đăng ký xe theo Thông tư 24.';
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
      title = 'Hỏi Đáp về Biển Số Đẹp, Đấu Giá & Sang Tên | ' + BRAND;
      desc = 'Giải đáp các câu hỏi thường gặp về biển số đẹp phong thủy, quy trình đấu giá biển số, thủ tục sang tên và bảng giá tham khảo.';
      canonical = SITE + '/hoi-dap';
    } else if (screen === 'notfound') {
      title = 'Không tìm thấy trang | ' + BRAND;
    } else if ((screen === 'provinceLanding' || screen === 'plateTypeLanding') && data?.landing) {
      const l = data.landing;
      title = l.title + ' | ' + BRAND;
      desc = truncateAtWordBoundary((l.intro || '').replace(/<[^>]+>/g, ''), 160) || DEFAULT_DESC;
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
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            name: 'Biensovip',
            alternateName: ['Biển Số Đẹp Đà Nẵng', 'Duy Đinh Biển Số', 'Shop Biển Số Đẹp'],
            url: SITE + '/',
            logo: SITE + '/assets/logo-mark.png',
            description: DEFAULT_DESC,
            sameAs: [
              'https://www.tiktok.com/@duydinhbiensodepdanang',
              'https://www.facebook.com/duydinhbiensodepdanang',
              'https://zalo.me/0815792699',
            ],
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: '+84-815-792-699',
              contactType: 'customer service',
              availableLanguage: 'Vietnamese',
              hoursAvailable: 'Mo-Su 08:00-21:00',
            },
          },
          {
            '@type': 'WebSite',
            name: 'Biensovip',
            url: SITE + '/',
            potentialAction: {
              '@type': 'SearchAction',
              target: { '@type': 'EntryPoint', urlTemplate: SITE + '/danh-sach?q={search_term_string}' },
              'query-input': 'required name=search_term_string',
            },
          },
        ],
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
    // Landing tỉnh/loại xe thin content (chưa có intro lẫn biển gợi ý) → noindex tránh bị Google
    // coi là trang rỗng/trùng lặp, dù URL vẫn truy cập được bình thường.
    const isThinLanding = (screen === 'provinceLanding' || screen === 'plateTypeLanding')
      && data?.landing && !data.landing.intro && !(data.landing.plates?.length > 0);
    const noIndex = noIndexScreens.includes(screen) || isThinLanding;
    setMeta('name', 'robots', noIndex ? 'noindex, follow' : 'index, follow');
    setLink('canonical', canonical);
    setJsonLd(ld);
  }, [screen, data]);
}
