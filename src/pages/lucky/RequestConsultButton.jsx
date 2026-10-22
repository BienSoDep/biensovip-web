import { useState } from 'react';
import Button from '../../components/Button.jsx';
import { Input } from '../../components/index.jsx';
import { useSubmitContact } from '../../services/contactService.js';
import { updateProfile } from '../../services/authService.js';
import { validatePhone, normalizePhone } from '../../lib/phone.js';
import { trackGenerateLead } from '../../services/tracking/events.js';

export function RequestConsultButton({ plate, user, notify, onUserUpdate }) {
  const submitContact = useSubmitContact();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const send = (phoneToUse, fullName) => {
    submitContact.mutate(
      {
        fullName: fullName || 'Khách hàng',
        phone: normalizePhone(phoneToUse),
        plateId: plate.plateId,
        plateNumber: plate.plateNumber,
        note: '',
        source: 'lucky_plate',
        intent: 'inquiry',
        subscribeToNotifications: false,
        honeypot: null,
      },
      {
        onSuccess: () => {
          trackGenerateLead(plate.plateId, 'lucky_plate');
          notify('Đã gửi yêu cầu tư vấn — admin sẽ liên hệ sớm.');
          setSent(true);
          setOpen(false);
        },
        onError: (err) => notify(err?.message || 'Gửi thất bại, vui lòng thử lại.'),
      }
    );
  };

  const submitPhone = async () => {
    if (!validatePhone(phone)) {
      notify('Số điện thoại không hợp lệ.');
      return;
    }
    setBusy(true);
    try {
      if (user) {
        const updated = await updateProfile({ phone });
        onUserUpdate?.(updated);
        send(phone, user.fullName);
      } else {
        send(phone, '');
      }
    } catch (e) {
      notify(e?.message || 'Có lỗi xảy ra, thử lại sau.');
    } finally {
      setBusy(false);
    }
  };

  const click = () => {
    if (sent) return;
    if (user?.phone) {
      send(user.phone, user.fullName);
      return;
    }
    setOpen(true);
  };

  if (sent) return <Button variant="ghost" size="sm" disabled>Đã gửi yêu cầu</Button>;

  return open ? (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submitPhone();
      }}
      style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}
    >
      <div style={{ width: 180 }}>
        <Input placeholder="Số điện thoại của bạn" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <Button variant="primary" type="submit" size="sm" disabled={busy}>
        {busy ? 'Đang gửi...' : 'Gửi'}
      </Button>
      <Button variant="ghost" type="button" size="sm" onClick={() => setOpen(false)}>
        Hủy
      </Button>
    </form>
  ) : (
    <Button variant="outline" size="sm" onClick={click}>
      Yêu cầu tư vấn
    </Button>
  );
}

export default RequestConsultButton;
