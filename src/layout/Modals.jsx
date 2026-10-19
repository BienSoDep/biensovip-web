import { PlateContactModal } from '../components/modals/PlateContactModal.jsx';

export default function Modals({ st, patch, cur, submitContact, mSending, setField, openPlate }) {
  if (!st?.modal || !cur) return null;

  return (
    <PlateContactModal
      isOpen={st.modal}
      onClose={() => patch({ modal: false, sent: false })}
      cur={cur}
      sent={st.sent}
      onSentReset={() => patch({ sent: false })}
      name={st.mName}
      onNameChange={setField('mName')}
      phone={st.mPhone}
      onPhoneChange={setField('mPhone')}
      email={st.mEmail}
      onEmailChange={setField('mEmail')}
      intent={st.mIntent}
      onIntentChange={(val) => patch({ mIntent: val })}
      note={st.mNote}
      onNoteChange={setField('mNote')}
      couponCode={st.mCouponCode}
      onCouponCodeChange={setField('mCouponCode')}
      subscribe={st.mSubscribe}
      onSubscribeChange={(val) => patch({ mSubscribe: val })}
      errors={st.mErr}
      onSubmit={(couponStatus) => submitContact(couponStatus)}
      submitting={mSending}
      openPlate={openPlate}
    />
  );
}
