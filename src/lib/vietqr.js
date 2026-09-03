// UC25 §7 — VietQR public API (miễn phí, không cần key) cho dropdown ngân hàng + QR tĩnh CTV.
const BANKS_URL = 'https://api.vietqr.io/v2/banks';

let banksCache = null;
let banksPromise = null;

// Trả về [{ value: bin, label: "Vietcombank — Ngân hàng TMCP Ngoại Thương Việt Nam" }], cache trong phiên trình duyệt.
export async function fetchVietQrBanks() {
  if (banksCache) return banksCache;
  if (banksPromise) return banksPromise;

  banksPromise = fetch(BANKS_URL)
    .then((res) => res.json())
    .then((body) => {
      const list = Array.isArray(body?.data) ? body.data : [];
      banksCache = list
        .map((b) => ({ value: b.bin, label: `${b.shortName} — ${b.name}` }))
        .sort((a, b) => a.label.localeCompare(b.label));
      return banksCache;
    })
    .catch(() => {
      banksCache = [];
      return banksCache;
    })
    .finally(() => { banksPromise = null; });

  return banksPromise;
}

// QR tĩnh (không số tiền/nội dung) — Quick Link miễn phí, không cần đăng ký merchant.
export function vietQrImageUrl(bankCode, accountNo) {
  if (!bankCode || !accountNo) return null;
  return `https://img.vietqr.io/image/${encodeURIComponent(bankCode)}-${encodeURIComponent(accountNo)}-compact.png`;
}
