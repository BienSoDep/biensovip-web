import LandingBody from '../components/LandingBody.jsx';
import { usePlateTypeLanding } from '../services/landing.js';
import { useSeo } from '../hooks/useSeo.js';

export default function PlateTypeLandingPage({ typeSlug, openPlate, onBuy, contact }) {
  const { data, isLoading, isError } = usePlateTypeLanding(typeSlug);
  useSeo('plateTypeLanding', { landing: data });
  return (
    <LandingBody
      title={data?.title} intro={data?.intro} plates={data?.plates} faqs={data?.faqs}
      isLoading={isLoading} isError={isError} openPlate={openPlate} onBuy={onBuy} contact={contact}
    />
  );
}
