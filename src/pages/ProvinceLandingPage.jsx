import LandingBody from '../components/LandingBody.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { useProvinceLanding } from '../services/landing.js';
import { useSeo } from '../hooks/useSeo.js';
import { PROVINCE_LANDINGS } from '../config/routes.js';

export default function ProvinceLandingPage({ provinceCode = '43', openPlate, onBuy, contact, go }) {
  const { data, isLoading, isError } = useProvinceLanding(provinceCode);
  useSeo('provinceLanding', { landing: data });
  const prov = PROVINCE_LANDINGS.find((p) => p.code === provinceCode);
  const name = prov?.name || '';
  const blogPost = prov ? {
    slug: prov.slug,
    title: `Bài viết chi tiết biển số ${name}`,
    excerpt: `Tìm hiểu về đầu số, thị trường và phong thủy biển số ${name} — đọc ngay trong bài viết chi tiết.`,
  } : null;
  return (
    <>
      {go && <Breadcrumb items={[{ label: 'Trang chủ', onClick: go('home') }, { label: 'Biển số', onClick: go('list') }, { label: name || 'Tỉnh thành' }]} />}
      <LandingBody
        title={data?.title} intro={data?.intro} plates={data?.plates} faqs={data?.faqs}
        isLoading={isLoading} isError={isError} openPlate={openPlate} onBuy={onBuy} contact={contact}
        blogPost={blogPost}
      />
    </>
  );
}
