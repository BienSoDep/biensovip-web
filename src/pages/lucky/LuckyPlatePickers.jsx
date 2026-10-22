import BulletPicker from '../../components/BulletPicker.jsx';
import { VEHICLES, PURPOSES, INDUSTRIES } from '../../lib/fengshui.js';

export function VehiclePicker({ value, onChange }) {
  return <BulletPicker label="Loại xe" value={value} onChange={onChange} options={VEHICLES} />;
}

export function PurposePicker({ value, onChange }) {
  return (
    <BulletPicker
      label="Mục đích sử dụng"
      value={value}
      onChange={onChange}
      options={PURPOSES.map((p) => p.label)}
    />
  );
}

export function IndustryPicker({ value, onChange }) {
  return (
    <BulletPicker
      label="Ngành kinh doanh"
      value={value}
      onChange={onChange}
      options={INDUSTRIES.map((i) => i.label)}
    />
  );
}
