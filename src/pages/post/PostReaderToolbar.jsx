import { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';

export const FONT_SIZES = [15, 17, 19, 21];
export const FONT_FAMILIES = [
  { id: 'sans', label: 'Mặc định', value: 'var(--font-text)' },
  { id: 'serif', label: 'Chữ chân', value: '"Noto Serif","Times New Roman",serif' },
];
export const READER_PREFS_KEY = 'biensovip.readerPrefs';

export function useReaderPrefs() {
  const [sizeIdx, setSizeIdx] = useState(1);
  const [fontId, setFontId] = useState('sans');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(READER_PREFS_KEY) || '{}');
      if (Number.isInteger(saved.sizeIdx) && FONT_SIZES[saved.sizeIdx]) setSizeIdx(saved.sizeIdx);
      if (FONT_FAMILIES.some((f) => f.id === saved.fontId)) setFontId(saved.fontId);
    } catch {
      /* ignore malformed prefs */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(READER_PREFS_KEY, JSON.stringify({ sizeIdx, fontId }));
  }, [sizeIdx, fontId]);

  const fontFamily = FONT_FAMILIES.find((f) => f.id === fontId)?.value || FONT_FAMILIES[0].value;
  return { sizeIdx, setSizeIdx, fontId, setFontId, fontSize: FONT_SIZES[sizeIdx], fontFamily };
}

export function PostReaderToolbar({ sizeIdx, setSizeIdx, fontSize, fontId, setFontId }) {
  return (
    <div className="reader-prefs">
      <div className="reader-prefs__group">
        <span className="reader-prefs__label">Cỡ chữ</span>
        <button
          type="button"
          className="reader-prefs__btn"
          onClick={() => setSizeIdx((i) => Math.max(0, i - 1))}
          disabled={sizeIdx === 0}
          aria-label="Giảm cỡ chữ"
        >
          <Minus size={14} />
        </button>
        <span className="reader-prefs__size">{fontSize}px</span>
        <button
          type="button"
          className="reader-prefs__btn"
          onClick={() => setSizeIdx((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
          disabled={sizeIdx === FONT_SIZES.length - 1}
          aria-label="Tăng cỡ chữ"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="reader-prefs__group">
        <span className="reader-prefs__label">Font chữ</span>
        <select
          id="reader-font-select"
          name="reader-font"
          className="reader-prefs__font"
          value={fontId}
          onChange={(e) => setFontId(e.target.value)}
          aria-label="Chọn kiểu chữ"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default PostReaderToolbar;
