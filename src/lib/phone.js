// Phone helpers — THE fix for the P1 loose-regex trust-boundary audit point.
// Other agents import these instead of the permissive /^0\d{8,10}$/ in mockData.

// Trim, strip spaces/dashes/dots, convert leading +84/0084 to 0.
export function normalizePhone(p) {
  if (p == null) return '';
  return String(p)
    .trim()
    .replace(/[\s.\-]/g, '')
    .replace(/^(?:\+84|0084)/, '0');
}

// Vietnamese mobile format: 0 + (3|5|7|8|9) + 8 digits.
export function validatePhone(p) {
  return /^0(3|5|7|8|9)\d{8}$/.test(normalizePhone(p));
}
