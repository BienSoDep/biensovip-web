import { useEffect } from 'react';
import LandingBody from '../components/LandingBody.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { useProvinceLanding } from '../services/landing.js';
import { useSeo } from '../hooks/useSeo.js';
import { PROVINCE_LANDINGS } from '../config/routes.js';
import { forceScrollToTop } from '../lib/scrollRestoration.js';

export default function ProvinceLandingPage({ provinceCode = '43', openPlate, onBuy, contact, go }) {
  const { data, isLoading, isError } = useProvinceLanding(provinceCode);
  useSeo('provinceLanding', { landing: data, provinceCode });

  useEffect(() => {
    forceScrollToTop();
  }, [provinceCode]);
  const prov = PROVINCE_LANDINGS.find((p) => p.code === provinceCode);
  const name = prov?.name || '';
  const blogPost = prov ? {
    slug: prov.slug,
    title: `Bài viết chi tiết biển số ${name}`,
    excerpt: `Tìm hiểu về đầu số, thị trường và phong thủy biển số ${name} — đọc ngay trong bài viết chi tiết.`,
  } : null;
  const relatedProvinces = PROVINCE_LANDINGS
    .filter((p) => p.code !== provinceCode)
    .slice(0, 8)
    .map((p) => ({ name: `Biển số ${p.name} (${p.code})`, slug: p.slug }));
  return (
    <>
      {go && <Breadcrumb keepOnMobile items={[{ label: 'Trang chủ', href: '/', onClick: go('home') }, { label: 'Biển số', href: '/danh-sach', onClick: go('list') }, { label: name ? `Biển số ${name}` : 'Tỉnh thành' }]} />}
      <LandingBody
        title={data?.title} intro={data?.intro} plates={data?.plates} faqs={data?.faqs}
        isLoading={isLoading} isError={isError} openPlate={openPlate} onBuy={onBuy} contact={contact}
        blogPost={blogPost} listName="province_landing"
        relatedLandings={relatedProvinces}
        relatedHeading="Khám phá biển số đẹp các tỉnh thành trọng điểm"
      />
    </>
  );
}
