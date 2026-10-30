import { useEffect } from 'react';
import { contentGet, contentItems } from '../lib/content/index.js';
import { ADMIN_SCREENS, PROVINCE_LANDINGS, PLATE_TYPE_LANDINGS } from '../config/routes.js';

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
  if (!text || text.length <= maxLength) return text || '';
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

function makeBreadcrumbLd(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: it.item,
    })),
  };
}

/**
 * screen: current route screen id
 * data: real API data for detail/landing screens — { plate }, { post }, { landing }, or { skip: true }
 */
export function useSeo(screen, data) {
  useEffect(() => {
    if (data?.skip) return;

    let title = BRAND;
    let desc = DEFAULT_DESC;
    let canonical = SITE + '/';
    let type = 'website';
    let image = null;
    let ld = null;

    if (screen === 'list') {
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      const isSearchPath = pathname.startsWith('/tim-kiem/');
      const searchRaw = isSearchPath ? pathname.slice('/tim-kiem/'.length).split('/')[0] : '';
      const searchTerm = searchRaw ? decodeURIComponent(searchRaw).replace(/-/g, ' ') : '';

      if (isSearchPath && searchTerm) {
        title = `Biển Số ${searchTerm.toUpperCase()} Đang Bán — Kho Biển Số Đẹp | ` + BRAND;
        desc = `Xem các biển số đẹp phù hợp từ khóa "${searchTerm}" đang chào bán tại Biensovip: giá công khai minh bạch, hỗ trợ sang tên toàn quốc, tư vấn hợp mệnh.`;
        canonical = SITE + pathname;
      } else {
        title = 'Kho Biển Số Xe Đẹp Toàn Quốc — Ngũ Quý, Tứ Quý, Thần Tài | ' + BRAND;
        desc = 'Xem kho biển số xe đẹp đang chào bán: ngũ quý, tứ quý, tam hoa, lộc phát, thần tài, sảnh tiến. Cập nhật liên tục, giá công khai minh bạch, hỗ trợ sang tên toàn quốc.';
        canonical = SITE + '/danh-sach';
      }
      const items = data?.items || [];
      const itemListLd = {
        '@type': 'ItemList',
        name: isSearchPath && searchTerm ? `Biển số ${searchTerm}` : 'Danh sách biển số đẹp',
        url: canonical,
        ...(items.length ? {
          numberOfItems: items.length,
          itemListElement: items.map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: SITE + '/bien/' + (p.slug || p.id),
            ...(p.plateNumber ? { name: `Biển số ${p.plateNumber}` } : {}),
          })),
        } : {}),
      };
      const breadcrumbLd = makeBreadcrumbLd([
        { name: 'Trang chủ', item: SITE + '/' },
        { name: 'Danh sách biển số', item: SITE + '/danh-sach' },
        ...(isSearchPath && searchTerm ? [{ name: `Tìm kiếm: ${searchTerm}`, item: canonical }] : []),
      ]);
      const collectionLd = {
        '@type': 'CollectionPage',
        name: title,
        description: desc,
        url: canonical,
        isPartOf: { '@type': 'WebSite', name: 'Biensovip', url: SITE + '/' },
      };
      ld = { '@context': 'https://schema.org', '@graph': [collectionLd, itemListLd, breadcrumbLd] };
    } else if (screen === 'detail' && data?.plate) {
      const p = data.plate;
      const priceText = p.priceOnRequest ? 'Giá liên hệ' : `${Number(p.price).toLocaleString('vi-VN')}đ`;
      title = `Biển ${p.plateNumber} — ${priceText} | ${BRAND}`;
      // truncateAtWordBoundary — fengShuiMeaning có thể dài hàng nghìn ký tự, nhồi nguyên vào meta
      // description làm Google/mạng xã hội tự cắt xấu khi share link.
      const vpaDefaultMeaning = p.source === 'vpa' ? `Biển số ${p.plateNumber} đấu giá VPA chính thức theo Thông tư 24/2023/TT-BCA, thế số đẹp hanh thông tài lộc.` : '';
      const meaningSnippet = p.fengShuiMeaning || p.description || vpaDefaultMeaning;
      desc = truncateAtWordBoundary(`Biển số đẹp ${p.vehicleType || ''} tại ${p.province || ''}. ${meaningSnippet} Liên hệ Duy Đinh để giữ chỗ.`.trim(), 160);
      canonical = SITE + '/bien/' + (p.slug || p.id);
      image = p.images?.[0] || `${SITE}/assets/logo-mark.png`;

      const plateProvLanding = p.province
        ? PROVINCE_LANDINGS.find((pr) => pr.name.toLowerCase() === p.province.toLowerCase())
        : null;

      const productLd = {
        '@type': 'Product',
        name: `Biển số ${p.plateNumber}`,
        description: desc,
        ...(image ? { image } : {}),
        sku: p.plateNumber,
        mpn: p.plateNumber,
        brand: {
          '@type': 'Brand',
          name: 'Biensovip',
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'VND',
          ...(p.priceOnRequest ? {} : { price: p.price }),
          itemCondition: 'https://schema.org/NewCondition',
          availability: p.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
          url: canonical,
          seller: {
            '@type': 'Organization',
            name: 'Duy Đinh - Biển Số Đẹp Đà Nẵng',
            url: SITE + '/',
          },
        },
        ...(p.ratingCount > 0 ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: p.ratingAvg,
            reviewCount: p.ratingCount,
            bestRating: '5',
            worstRating: '1',
          },
        } : {}),
      };
      const breadcrumbLd = makeBreadcrumbLd([
        { name: 'Trang chủ', item: SITE + '/' },
        { name: 'Danh sách biển số', item: SITE + '/danh-sach' },
        ...(plateProvLanding ? [{ name: `Biển số ${plateProvLanding.name}`, item: `${SITE}/${plateProvLanding.slug}` }] : []),
        { name: `Biển số ${p.plateNumber}`, item: canonical },
      ]);
      ld = { '@context': 'https://schema.org', '@graph': [productLd, breadcrumbLd] };
    } else if (screen === 'detail') {
      title = 'Biển số xe đẹp phong thủy | ' + BRAND;
      canonical = SITE + (typeof window !== 'undefined' ? window.location.pathname : '/bien/');
    } else if (screen === 'lucky' || screen === 'luanBien') {
      const isLuanBien = (typeof window !== 'undefined' && window.location.pathname.includes('luan-bien-so')) || screen === 'luanBien';
      if (isLuanBien) {
        title = 'Luận Giải Phong Thủy Biển Số Xe — Chấm Điểm 5 Chiều & Gợi Ý Cải Vận 2026 | ' + BRAND;
        desc = 'Công cụ luận giải phong thủy biển số xe 5 chiều: Ngũ hành Hà Đồ, Tổng nút, Âm Dương, Cặp số may mắn và Quẻ Kinh Dịch. Nhận ngay giải pháp bổ khuyết và gợi ý biển số đẹp cải vận chuẩn 2026.';
        canonical = SITE + '/luan-bien-so';
        ld = {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebApplication',
              name: 'Công Cụ Luận Giải Phong Thủy Biển Số Xe 5 Chiều & Gợi Ý Cải Vận',
              description: desc,
              url: canonical,
              applicationCategory: 'LifestyleApplication',
              operatingSystem: 'All',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'VND' },
            },
            makeBreadcrumbLd([
              { name: 'Trang chủ', item: SITE + '/' },
              { name: 'Luận giải phong thủy biển số & Gợi ý cải vận', item: canonical },
            ]),
            {
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'Làm sao để biết biển số xe hiện tại của tôi tốt hay xấu?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Không nên chỉ nhìn vào tổng nút (1–9 nút). Một biển số chuẩn phong thủy cần được đánh giá toàn diện trên 5 chiều: Ngũ hành Hà Đồ, Tổng số nút, Cân bằng Âm Dương, Cặp số cát tường và Quẻ Kinh Dịch Mai Hoa.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Nếu biển số đang đi chưa hợp mệnh hoặc ít nút thì cải vận thế nào?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Công cụ Luận Giải Biển Số của Biensovip sẽ chỉ rõ khía cạnh bị khuyết (ví dụ thiếu hành tương sinh hoặc lệch âm dương) và tự động gợi ý các biển số đẹp có cấu trúc bù đắp chính xác điểm yếu đó.',
                  },
                },
              ],
            },
          ],
        };
      } else {
        title = 'Tra cứu Biển Số Hợp Mệnh Theo Ngũ Hành — Tư Vấn Miễn Phí | ' + BRAND;
        desc = 'Tra cứu biển số hợp mệnh theo ngũ hành Kim Mộc Thủy Hỏa Thổ. Nhập năm sinh để nhận gợi ý biển số phong thủy đẹp hợp tuổi, hợp ngũ hành và phù hợp ngân sách.';
        canonical = SITE + '/hop-menh';
        ld = {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebApplication',
              name: 'Công cụ tra cứu biển số hợp mệnh phong thủy',
              description: desc,
              url: canonical,
              applicationCategory: 'LifestyleApplication',
              operatingSystem: 'All',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'VND' },
            },
            makeBreadcrumbLd([
              { name: 'Trang chủ', item: SITE + '/' },
              { name: 'Tư vấn biển hợp mệnh', item: canonical },
            ]),
            {
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'Tra cứu biển số hợp mệnh tại Biensovip tính theo nguyên lý nào?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Hệ thống phân tích dựa trên năm sinh âm lịch (Can Chi, Nạp Âm Ngũ Hành), kết hợp quy luật Tương Sinh - Tương Khắc, cân bằng Âm Dương, Tổng số nút và Quẻ Kinh Dịch của 5 chữ số cuối biển số xe.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Người mệnh Kim, Mộc, Thủy, Hỏa, Thổ hợp với những con số nào?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Theo Hà Đồ Lạc Thư và Ngũ Hành: Mệnh Kim hợp số 6, 7 (tương sinh 2, 5, 8); Mệnh Mộc hợp số 3, 4 (tương sinh 1); Mệnh Thủy hợp số 1 (tương sinh 6, 7); Mệnh Hỏa hợp số 9 (tương sinh 3, 4); Mệnh Thổ hợp số 2, 5, 8 (tương sinh 9).',
                  },
                },
              ],
            },
          ],
        };
      }
      image = SITE + '/assets/logo-mark.png';
    } else if (screen === 'about') {
      title = 'Về Duy Đinh — Shop Biển Số Đẹp Đà Nẵng Uy Tín | ' + BRAND;
      desc = 'Duy Đinh — chuyên gia tư vấn biển số đẹp phong thủy tại Đà Nẵng. Hơn 10 năm kinh nghiệm, hỗ trợ sang tên toàn quốc, dịch vụ Zalo nhanh trong 15 phút.';
      canonical = SITE + '/gioi-thieu';
      image = SITE + '/assets/duy-dinh-portrait.jpg';
      ld = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'AboutPage',
            '@id': canonical + '#webpage',
            name: title,
            description: desc,
            url: canonical,
            breadcrumb: { '@id': canonical + '#breadcrumb' },
            mainEntity: { '@id': canonical + '#person' },
          },
          {
            '@type': 'BreadcrumbList',
            '@id': canonical + '#breadcrumb',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE + '/' },
              { '@type': 'ListItem', position: 2, name: 'Về Duy Đinh', item: canonical },
            ],
          },
          {
            '@type': 'Person',
            '@id': canonical + '#person',
            name: 'Duy Đinh',
            jobTitle: 'Chuyên gia phong thủy & Định giá biển số xe',
            url: canonical,
            image: SITE + '/assets/duy-dinh-portrait.jpg',
            description: 'Người sáng lập Biensovip, chuyên gia hơn 10 năm kinh nghiệm trong lĩnh vực định giá và tư vấn biển số xe đẹp phong thủy tại Đà Nẵng.',
            telephone: '0815792699',
            email: 'duymc64@gmail.com',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Số 06 An Thượng 30',
              addressLocality: 'Ngũ Hành Sơn',
              addressRegion: 'Đà Nẵng',
              postalCode: '550000',
              addressCountry: 'VN',
            },
            knowsAbout: [
              'Biển số xe đẹp',
              'Định giá biển số xe',
              'Phong thủy ngũ hành biển số xe',
              'Quy trình sang tên thu hồi biển số xe',
              'Thông tư 24/2023/TT-BCA',
              'Đấu giá biển số xe',
            ],
            sameAs: [
              'https://www.facebook.com/duydinhbiensodepdanang',
              'https://zalo.me/0815792699',
              'https://www.tiktok.com/@duydinhbiensodepdanang',
            ],
          },
          {
            '@type': 'AutoDealer',
            '@id': SITE + '/#localbusiness',
            name: 'Duy Đinh - Biển Số Đẹp Đà Nẵng',
            url: SITE + '/',
            telephone: '0815792699',
            image: SITE + '/assets/duy-dinh-portrait.jpg',
            priceRange: '10.000.000đ - 5.000.000.000đ',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Số 06 An Thượng 30',
              addressLocality: 'Ngũ Hành Sơn',
              addressRegion: 'Đà Nẵng',
              postalCode: '550000',
              addressCountry: 'VN',
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: 16.0520,
              longitude: 108.2435,
            },
            areaServed: ['Đà Nẵng', 'Miền Trung', 'Toàn quốc'],
            openingHoursSpecification: {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
              opens: '08:00',
              closes: '21:00',
            },
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Biển số mua tại Duy Đinh có sang tên định danh chính chủ được không?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Hoàn toàn được. Toàn bộ biển số tại Biensovip đều có hồ sơ gốc hợp pháp 100%, tuân thủ nghiêm ngặt quy định tại Thông tư 24/2023/TT-BCA và Thông tư 28/2024/TT-BCA. Khách hàng sẽ được cấp biển định danh chính chủ đứng tên trên cà vẹt.',
                },
              },
              {
                '@type': 'Question',
                name: 'Khách hàng ở các tỉnh thành khác (Hà Nội, TP.HCM, Tây Nguyên...) có mua được không?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Hoàn toàn thuận lợi. Quy định biển định danh hiện nay cho phép công dân đăng ký xe tại nơi thường trú hoặc tạm trú. Đội ngũ Duy Đinh hỗ trợ rút hồ sơ gốc, chuyển phát hỏa tốc và hướng dẫn hoàn tất thủ tục đăng ký tận nơi trên cả nước.',
                },
              },
              {
                '@type': 'Question',
                name: 'Quy trình đặt cọc và cam kết giao dịch như thế nào?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Khi chọn được biển ưng ý, khách hàng đặt cọc giữ chỗ qua tài khoản chính chủ của Duy Đinh. Cửa hàng lập tức cấp hợp đồng giao dịch điện tử có giá trị pháp lý, cam kết hoàn tiền 100% nếu có bất kỳ vướng mắc nào về mặt pháp lý.',
                },
              },
              {
                '@type': 'Question',
                name: 'Duy Đinh có thu phí tư vấn phong thủy chọn biển không?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Không. Duy Đinh tư vấn phong thủy nạp âm, phân tích dãy số hợp can chi và bản mệnh hoàn toàn MIỄN PHÍ cho mọi khách hàng ghé thăm cửa hàng hoặc nhắn tin qua Zalo.',
                },
              },
            ],
          },
        ],
      };
    } else if (screen === 'blog') {
      const blogParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const blogPage = blogParams ? parseInt(blogParams.get('page') || '1', 10) : 1;
      const pageSuffix = Number.isFinite(blogPage) && blogPage > 1 ? ` — Trang ${blogPage}` : '';
      title = `Tin Tức Phong Thủy Biển Số & Cẩm Nang Chọn Biển Đẹp${pageSuffix} | ${BRAND}`;
      desc = 'Ý nghĩa dãy số biển số xe, cách chọn biển hợp mệnh theo ngũ hành, quy định đấu giá biển số và sang tên mới nhất 2026.';
      canonical = Number.isFinite(blogPage) && blogPage > 1 ? `${SITE}/tin?page=${blogPage}` : `${SITE}/tin`;
      ld = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'CollectionPage',
            name: title,
            description: desc,
            url: canonical,
            isPartOf: { '@type': 'WebSite', name: 'Biensovip', url: SITE + '/' },
          },
          makeBreadcrumbLd([
            { name: 'Trang chủ', item: SITE + '/' },
            { name: 'Tin phong thủy', item: SITE + '/tin' },
            ...(Number.isFinite(blogPage) && blogPage > 1 ? [{ name: `Trang ${blogPage}`, item: canonical }] : []),
          ]),
        ],
      };
    } else if (screen === 'post' && data?.post) {
      const post = data.post;
      title = (post.metaTitle || post.title) + ' | ' + BRAND;
      desc = truncateAtWordBoundary(post.metaDescription || post.excerpt || DEFAULT_DESC, 160);
      canonical = SITE + '/bai-viet/' + post.slug;
      type = 'article';
      image = post.coverImageUrl || null;
      const postCategoryMap = {
        'y-nghia-so': 'Ý nghĩa số',
        'hop-menh': 'Hợp mệnh',
        'luat-moi': 'Luật & quy định',
        'thu-tuc': 'Thủ tục sang tên',
        'kinh-nghiem': 'Kinh nghiệm',
      };
      const postCatLabel = post.category ? (postCategoryMap[post.category] || post.category) : null;
      const postProvLanding = (post.tags || [])
        .map((t) => PROVINCE_LANDINGS.find((pr) => pr.name.toLowerCase() === t.toLowerCase()))
        .find(Boolean)
        || PROVINCE_LANDINGS.find((pr) => (post.title || '').includes(pr.name));
      ld = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BlogPosting',
            headline: post.title,
            description: desc,
            datePublished: post.publishedAt,
            ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
            ...(post.coverImageUrl ? { image: post.coverImageUrl } : {}),
            ...(postCatLabel ? { articleSection: postCatLabel } : {}),
            author: {
              '@type': 'Person',
              name: 'Duy Đinh',
              jobTitle: 'Chuyên gia phong thủy & Định giá biển số xe',
              url: SITE + '/gioi-thieu',
              sameAs: ['https://zalo.me/0815792699'],
            },
            publisher: {
              '@type': 'Organization',
              name: 'Biensovip',
              logo: { '@type': 'ImageObject', url: SITE + '/assets/logo-mark.png' },
            },
            mainEntityOfPage: canonical,
          },
          makeBreadcrumbLd([
            { name: 'Trang chủ', item: SITE + '/' },
            { name: 'Tin phong thủy', item: SITE + '/tin' },
            ...(postCatLabel ? [{ name: postCatLabel, item: `${SITE}/tin?category=${encodeURIComponent(post.category)}` }] : []),
            ...(postProvLanding ? [{ name: `Biển số ${postProvLanding.name}`, item: `${SITE}/${postProvLanding.slug}` }] : []),
            { name: post.title, item: canonical },
          ]),
        ],
      };
    } else if (screen === 'fav') { title = 'Biển số yêu thích | ' + BRAND; canonical = SITE + '/yeu-thich'; }
    else if (screen === 'profile') { title = 'Hồ sơ tài khoản | ' + BRAND; canonical = SITE + '/tai-khoan'; }
    else if (screen === 'register') { title = 'Đăng ký tài khoản | ' + BRAND; canonical = SITE + '/dang-ky'; }
    else if (screen === 'login') { title = 'Đăng nhập | ' + BRAND; canonical = SITE + '/dang-nhap'; }
    else if (screen === 'forgot') { title = 'Lấy lại mật khẩu | ' + BRAND; canonical = SITE + '/quen-mat-khau'; }
    else if (screen === 'chat') {
      title = 'Liên Hệ Mua Biển Số Đẹp — Tư Vấn Ngay Qua Zalo | ' + BRAND;
      desc = 'Liên hệ Duy Đinh qua Zalo 0815 792 699 để được tư vấn biển số đẹp phong thủy, báo giá và đặt cọc giữ chỗ ngay hôm nay.';
      canonical = SITE + '/lien-he';
      ld = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'ContactPage',
            name: title,
            description: desc,
            url: canonical,
          },
          makeBreadcrumbLd([
            { name: 'Trang chủ', item: SITE + '/' },
            { name: 'Liên hệ tư vấn', item: canonical },
          ]),
        ],
      };
    } else if (screen === 'compare') {
      title = 'So Sánh Biển Số Đẹp — Giá & Điểm Phong Thủy | ' + BRAND;
      desc = 'So sánh giá, ý nghĩa phong thủy và điểm hợp mệnh giữa nhiều biển số đẹp cùng lúc. Chọn biển tốt nhất cho mệnh của bạn.';
      canonical = SITE + '/so-sanh';
      ld = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            name: title,
            description: desc,
            url: canonical,
          },
          makeBreadcrumbLd([
            { name: 'Trang chủ', item: SITE + '/' },
            { name: 'So sánh biển số', item: canonical },
          ]),
        ],
      };
    } else if (screen === 'saved') {
      title = 'Thông báo biển mới theo yêu cầu | ' + BRAND;
      canonical = SITE + '/thong-bao';
    } else if (screen === 'reviews') {
      title = 'Đánh Giá Khách Hàng — Mua Biển Số Đẹp Tại Biensovip | ' + BRAND;
      desc = 'Hàng trăm đánh giá thật từ khách hàng đã mua biển số đẹp phong thủy tại Biensovip — uy tín, minh bạch, sang tên nhanh.';
      canonical = SITE + '/danh-gia';
      ld = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'ItemPage',
            name: title,
            description: desc,
            url: canonical,
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '5.0',
              reviewCount: 50,
              bestRating: '5',
              worstRating: '1',
            },
          },
          makeBreadcrumbLd([
            { name: 'Trang chủ', item: SITE + '/' },
            { name: 'Đánh giá khách hàng', item: canonical },
          ]),
        ],
      };
    } else if (screen === 'notifications') {
      title = 'Thông báo | ' + BRAND;
      canonical = SITE + '/thong-bao-moi';
    } else if (screen === 'collab') {
      title = 'Cộng Tác Viên Biển Số Đẹp — Nhận Hoa Hồng Hấp Dẫn | ' + BRAND;
      desc = 'Đăng ký cộng tác viên Biensovip, giới thiệu khách mua biển số đẹp và nhận hoa hồng hấp dẫn. Làm online, không cần vốn.';
      canonical = SITE + '/cong-tac-vien';
      ld = {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebPage', name: title, description: desc, url: canonical },
          makeBreadcrumbLd([
            { name: 'Trang chủ', item: SITE + '/' },
            { name: 'Cộng tác viên', item: canonical },
          ]),
        ],
      };
    } else if (screen === 'collabProcess') {
      title = 'Quy Trình Nhận Hoa Hồng Cộng Tác Viên Biensovip | ' + BRAND;
      desc = 'Hướng dẫn chi tiết quy trình 3 bước giới thiệu khách hàng và nhận hoa hồng minh bạch dành cho Cộng tác viên Biensovip.';
      canonical = SITE + '/cong-tac-vien/quy-trinh';
      ld = {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebPage', name: title, description: desc, url: canonical },
          makeBreadcrumbLd([
            { name: 'Trang chủ', item: SITE + '/' },
            { name: 'Cộng tác viên', item: SITE + '/cong-tac-vien' },
            { name: 'Quy trình nhận hoa hồng', item: canonical },
          ]),
        ],
      };
    } else if (screen === 'collabLeaderboard') {
      title = 'Bảng Xếp Hạng Cộng Tác Viên Xuất Sắc | ' + BRAND;
      desc = 'Vinh danh các Cộng tác viên có thành tích kết nối giao dịch biển số đẹp xuất sắc tại hệ thống Biensovip.';
      canonical = SITE + '/cong-tac-vien/bang-xep-hang';
      ld = {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebPage', name: title, description: desc, url: canonical },
          makeBreadcrumbLd([
            { name: 'Trang chủ', item: SITE + '/' },
            { name: 'Cộng tác viên', item: SITE + '/cong-tac-vien' },
            { name: 'Bảng xếp hạng', item: canonical },
          ]),
        ],
      };
    } else if (screen === 'collabCustomers') {
      title = 'Khách Hàng Của Tôi — Cộng Tác Viên | ' + BRAND;
      canonical = SITE + '/cong-tac-vien/khach-hang';
    } else if (screen === 'aiChat') {
      title = 'Trợ lý AI Biensovip — Tư vấn biển số đẹp | ' + BRAND;
      desc = 'Chat trực tiếp với trợ lý AI Biensovip để tìm biển số đẹp hợp mệnh, tra giá và quy trình đấu giá hộ.';
      canonical = SITE + '/tro-ly-ai';
      ld = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: 'Trợ lý AI Phong Thủy Biensovip',
            description: desc,
            url: canonical,
            applicationCategory: 'LifestyleApplication',
            operatingSystem: 'All',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'VND' },
          },
          makeBreadcrumbLd([
            { name: 'Trang chủ', item: SITE + '/' },
            { name: 'Trợ lý AI', item: canonical },
          ]),
        ],
      };
    } else if (screen === 'terms') {
      title = 'Điều khoản sử dụng | ' + BRAND;
      desc = 'Quy định và điều khoản sử dụng dịch vụ mua bán, định giá và sang tên biển số xe đẹp tại Biensovip. Đảm bảo quyền lợi khách hàng và pháp lý minh bạch.';
      canonical = SITE + '/dieu-khoan';
      ld = {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebPage', name: title, description: desc, url: canonical },
          makeBreadcrumbLd([
            { name: 'Trang chủ', item: SITE + '/' },
            { name: 'Điều khoản sử dụng', item: canonical },
          ]),
        ],
      };
    } else if (screen === 'privacy') {
      title = 'Chính sách bảo mật | ' + BRAND;
      desc = 'Chính sách bảo mật thông tin khách hàng tại Biensovip. Cam kết bảo vệ dữ liệu cá nhân, số điện thoại, thông tin liên hệ và lịch sử giao dịch an toàn tuyệt đối.';
      canonical = SITE + '/bao-mat';
      ld = {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebPage', name: title, description: desc, url: canonical },
          makeBreadcrumbLd([
            { name: 'Trang chủ', item: SITE + '/' },
            { name: 'Chính sách bảo mật', item: canonical },
          ]),
        ],
      };
    } else if (screen === 'transfer') {
      title = 'Hướng Dẫn Sang Tên Biển Số Xe Ô Tô & Xe Máy 2026 | ' + BRAND;
      desc = 'Hướng dẫn chi tiết thủ tục sang tên đổi chủ biển số định danh & xe gắn biển trúng đấu giá theo Thông tư 24/2023/TT-BCA — hồ sơ, phí trước bạ, quy trình rút hồ sơ gốc tận nơi.';
      canonical = SITE + '/sang-ten';
      const transferFaqs = contentItems('transfer.faqs') || [];
      const faqLd = transferFaqs.length > 0 ? {
        '@type': 'FAQPage',
        mainEntity: transferFaqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      } : null;
      const webPageLd = {
        '@type': 'WebPage',
        name: contentGet('transfer.title') || 'Hướng dẫn thủ tục sang tên đổi chủ biển số xe',
        description: desc,
        url: canonical,
        author: {
          '@type': 'Person',
          name: 'Duy Đinh',
          jobTitle: 'Chuyên gia phong thủy & Định giá biển số xe',
          url: SITE + '/gioi-thieu',
          sameAs: ['https://zalo.me/0815792699'],
        },
      };
      const breadcrumbLd = makeBreadcrumbLd([
        { name: 'Trang chủ', item: SITE + '/' },
        { name: 'Hướng dẫn sang tên', item: canonical },
      ]);
      const serviceLd = {
        '@type': 'Service',
        name: 'Dịch vụ hỗ trợ sang tên & rút hồ sơ gốc biển số xe toàn quốc',
        serviceType: 'Thủ tục pháp lý sang tên đổi chủ, cấp biển số định danh theo Thông tư 24/2023/TT-BCA',
        provider: {
          '@type': 'Person',
          name: 'Duy Đinh',
          jobTitle: 'Chuyên gia phong thủy & Định giá biển số xe',
          url: SITE + '/gioi-thieu',
          telephone: '0815792699',
        },
        areaServed: {
          '@type': 'Country',
          name: 'Việt Nam',
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'VND',
          description: 'Tư vấn miễn phí qua Zalo, chi phí minh bạch theo từng hồ sơ thực tế',
        },
      };
      ld = {
        '@context': 'https://schema.org',
        '@graph': [webPageLd, breadcrumbLd, serviceLd, ...(faqLd ? [faqLd] : [])],
      };
    } else if (screen === 'faq') {
      title = 'Hỏi Đáp về Biển Số Đẹp, Đấu Giá & Sang Tên 2026 | ' + BRAND;
      desc = 'Giải đáp các câu hỏi thường gặp về biển số đẹp phong thủy, quy trình đấu giá biển số, thủ tục sang tên định danh và bảng giá tham khảo tại Biensovip.';
      canonical = SITE + '/hoi-dap';
      const faqItems = contentItems('faq.items') || [];
      const faqLd = faqItems.length > 0 ? {
        '@type': 'FAQPage',
        mainEntity: faqItems.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      } : null;
      const breadcrumbLd = makeBreadcrumbLd([
        { name: 'Trang chủ', item: SITE + '/' },
        { name: 'Hỏi đáp thường gặp', item: canonical },
      ]);
      ld = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            name: title,
            description: desc,
            url: canonical,
          },
          breadcrumbLd,
          ...(faqLd ? [faqLd] : []),
        ],
      };
    } else if (screen === 'notfound') {
      title = 'Không tìm thấy trang | ' + BRAND;
    } else if (screen === 'provinceLanding') {
      const l = data?.landing;
      const prov = PROVINCE_LANDINGS.find((p) => p.code === data?.provinceCode) ||
        PROVINCE_LANDINGS.find((p) => typeof window !== 'undefined' && window.location.pathname.replace(/^\//, '') === p.slug);
      const provName = l?.title || prov?.name || 'Đà Nẵng';
      const slugPath = prov ? `/${prov.slug}` : (typeof window !== 'undefined' ? window.location.pathname : '/bien-so-da-nang');
      title = `Mua Bán Biển Số Đẹp ${provName} — Xe Máy & Ô Tô | ` + BRAND;
      desc = truncateAtWordBoundary((l?.intro || '').replace(/<[^>]+>/g, ''), 155) ||
        `Kho biển số đẹp ${provName} đang chào bán tại Biensovip — tư vấn hợp mệnh miễn phí, giá rõ ràng, hỗ trợ sang tên toàn quốc.`;
      canonical = SITE + slugPath;
      const breadcrumbLd = makeBreadcrumbLd([
        { name: 'Trang chủ', item: SITE + '/' },
        { name: 'Danh sách biển số', item: SITE + '/danh-sach' },
        { name: `Biển số ${provName}`, item: canonical },
      ]);
      const graph = [breadcrumbLd];
      if (l?.plates?.length) {
        graph.push({
          '@type': 'ItemList',
          name: `Danh sách biển số đẹp ${provName}`,
          numberOfItems: l.plates.length,
          itemListElement: l.plates.map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: SITE + '/bien/' + (p.slug || p.id),
            name: `Biển số ${p.plateNumber}`,
          })),
        });
      }
      if (l?.faqs?.length) {
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
    } else if (screen === 'plateTypeLanding') {
      const l = data?.landing;
      const cleanSlug = 'bien-' + String(data?.typeSlug || '').replace(/^bien-/, '');
      const pt = PLATE_TYPE_LANDINGS.find((p) => p.slug === cleanSlug) ||
        PLATE_TYPE_LANDINGS.find((p) => typeof window !== 'undefined' && window.location.pathname.replace(/^\//, '') === p.slug);
      const typeName = l?.title || pt?.name || 'Tứ quý';
      const slugPath = pt ? `/${pt.slug}` : (typeof window !== 'undefined' ? window.location.pathname : '/bien-tu-quy');
      title = `Biển Số ${typeName} — Ý Nghĩa Phong Thủy, Hợp Mệnh & Giá 2026 | ` + BRAND;
      desc = truncateAtWordBoundary((l?.intro || '').replace(/<[^>]+>/g, ''), 155) ||
        `Tìm hiểu biển số ${typeName}: ý nghĩa phong thủy, con số hợp mệnh, bảng giá và kho biển đang có tại Biensovip. Tư vấn miễn phí qua Zalo.`;
      canonical = SITE + slugPath;
      const bcLd = makeBreadcrumbLd([
        { name: 'Trang chủ', item: SITE + '/' },
        { name: 'Danh sách biển số', item: SITE + '/danh-sach' },
        { name: `Biển số ${typeName}`, item: canonical },
      ]);
      const typeGraph = [bcLd];
      if (l?.plates?.length) {
        typeGraph.push({
          '@type': 'ItemList',
          name: `Danh sách biển số ${typeName}`,
          numberOfItems: l.plates.length,
          itemListElement: l.plates.map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: SITE + '/bien/' + (p.slug || p.id),
            name: `Biển số ${p.plateNumber}`,
          })),
        });
      }
      if (l?.faqs?.length) {
        typeGraph.push({
          '@type': 'FAQPage',
          mainEntity: l.faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        });
      }
      ld = { '@context': 'https://schema.org', '@graph': typeGraph };
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
            '@type': 'AutoDealer',
            name: 'Biensovip — Biển số đẹp Đà Nẵng',
            alternateName: ['Biển số đẹp Duy Đinh', 'Biensovip'],
            url: SITE + '/',
            logo: SITE + '/assets/logo-mark.png',
            image: SITE + '/assets/logo-mark.png',
            description: DEFAULT_DESC,
            telephone: '0815792699',
            priceRange: '10.000.000đ - 5.000.000.000đ',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Số 06 An Thượng 30',
              addressLocality: 'Ngũ Hành Sơn',
              addressRegion: 'Đà Nẵng',
              postalCode: '550000',
              addressCountry: 'VN',
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: 16.0520,
              longitude: 108.2435,
            },
            openingHoursSpecification: {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
              opens: '08:00',
              closes: '21:00',
            },
            founder: {
              '@type': 'Person',
              name: 'Duy Đinh',
              jobTitle: 'Chuyên gia phong thủy & Định giá biển số xe',
              url: SITE + '/gioi-thieu',
            },
            sameAs: [
              'https://zalo.me/0815792699',
              'https://www.tiktok.com/@duydinhbiensodepdanang',
              'https://www.facebook.com/duydinhbiensodepdanang',
            ],
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

    const finalImage = image || `${SITE}/assets/logo-mark.png`;
    document.title = title;
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:site_name', BRAND);
    setMeta('property', 'og:locale', 'vi_VN');
    setMeta('property', 'og:image', finalImage);
    setMeta('property', 'og:image:alt', title);
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', finalImage);

    const noIndexScreens = [
      'fav', 'profile', 'saved', 'notifications', 'register', 'login', 'forgot',
      'adminForgot', 'adminReset', 'gmailCallback', 'collabCustomers', 'overlayLive', 'notfound',
      ...ADMIN_SCREENS,
    ];
    const noIndex = noIndexScreens.includes(screen);
    const isNoFollow = ADMIN_SCREENS.includes(screen) || ['overlayLive', 'adminForgot', 'adminReset', 'gmailCallback'].includes(screen);
    setMeta('name', 'robots', noIndex ? (isNoFollow ? 'noindex, nofollow' : 'noindex, follow') : 'index, follow');
    setLink('canonical', canonical);
    setJsonLd(ld);
  }, [screen, data]);
}
