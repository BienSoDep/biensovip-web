import LandingBody from '../components/LandingBody.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { usePlateTypeLanding } from '../services/landing.js';
import { useSeo } from '../hooks/useSeo.js';
import { PLATE_TYPE_LANDINGS } from '../config/routes.js';

export default function PlateTypeLandingPage({ typeSlug, openPlate, onBuy, contact, go }) {
  const { data, isLoading, isError } = usePlateTypeLanding(typeSlug);
  useSeo('plateTypeLanding', { landing: data });
  const landingSlug = 'bien-' + typeSlug;
  const pt = PLATE_TYPE_LANDINGS.find((p) => p.slug === landingSlug);
  const blogPost = pt ? {
    slug: pt.slug,
    title: `Bài viết chi tiết biển ${pt.name}`,
    excerpt: `Ý nghĩa phong thủy, đặc điểm và cách sở hữu biển ${pt.name} — đọc ngay trong bài viết chi tiết.`,
  } : null;
  return (
    <>
      {go && <Breadcrumb items={[{ label: 'Trang chủ', onClick: go('home') }, { label: 'Biển số', onClick: go('list') }, { label: pt?.name || 'Loại biển' }]} />}
      <LandingBody
        title={data?.title} intro={data?.intro} plates={data?.plates} faqs={data?.faqs}
        isLoading={isLoading} isError={isError} openPlate={openPlate} onBuy={onBuy} contact={contact}
        blogPost={blogPost}
      />
    </>
  );
}
