// Content source-of-truth: per-page VI JSON bundled statically.
// Partner edits values in these files, then `npm run build` — no code change.
// Keys are stable identity; values (and leaf list items: *_N) may be added/removed freely.

import home from './vi/home.json';
import common from './vi/common.json';
import about from './vi/about.json';
import faq from './vi/faq.json';
import terms from './vi/terms.json';
import privacy from './vi/privacy.json';
import transfer from './vi/transfer.json';
import plates from './vi/plates.json';
import posts from './vi/posts.json';

export const content = {
  home,
  common,
  about,
  faq,
  terms,
  privacy,
  transfer,
  plates,
  posts,
};

// Resolve a dotted path like 'home.hero.title'. Returns value or fallback.
export function contentGet(path, fallback = '') {
  let node = content;
  for (const part of path.split('.')) {
    if (node == null) return fallback;
    node = node[part];
  }
  return typeof node === 'string' ? node : (node == null ? fallback : String(node));
}

// Resolve an object-of-items (keyed map) to an ordered array.
// The map keys are stable identity; order comes from the `order` key if present,
// else Object.keys insertion order. Partner may add/remove leaf keys freely.
export function contentItems(path, fallback = []) {
  let node = content;
  for (const part of path.split('.')) {
    if (node == null) return fallback;
    node = node[part];
  }
  if (node == null || typeof node !== 'object') return fallback;
  if (Array.isArray(node)) return node;
  const keys = Array.isArray(node.__order) ? node.__order.filter((k) => k in node) : Object.keys(node);
  return keys.filter((k) => k !== '__order').map((k) => ({ key: k, ...node[k] }));
}
