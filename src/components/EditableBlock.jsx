import { useRef, useEffect, useState } from 'react';

/**
 * Component cho phép chỉnh sửa trực tiếp trên bản xem trước (Inline ContentEditable),
 * tự động đồng bộ ngược lại (2 chiều) sang ô HTML / JSON / Form mà không bị nhảy con trỏ chuột.
 */
export default function EditableBlock({
  tag: Tag = 'div',
  html = '',
  onChange,
  placeholder = '',
  title = 'Nhấp vào để chỉnh sửa trực tiếp (tự động đồng bộ sang HTML/Form)',
  style = {},
  className = '',
  multiline = true,
  disabled = false,
  ...rest
}) {
  const ref = useRef(null);
  const isFocusedRef = useRef(false);
  const [isHovered, setIsHovered] = useState(false);

  // Đồng bộ từ props vào DOM khi không focus vào element này (tránh giật/nhảy con trỏ chuột)
  useEffect(() => {
    if (ref.current && !isFocusedRef.current) {
      const currentHtml = ref.current.innerHTML;
      const targetHtml = html || '';
      if (currentHtml !== targetHtml) {
        ref.current.innerHTML = targetHtml;
      }
    }
  }, [html]);

  const handleInput = (e) => {
    if (disabled || !onChange) return;
    const newHtml = e.currentTarget.innerHTML;
    onChange(newHtml);
  };

  const handleKeyDown = (e) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      ref.current?.blur();
    }
  };

  return (
    <Tag
      ref={ref}
      contentEditable={!disabled}
      suppressContentEditableWarning
      onFocus={() => { isFocusedRef.current = true; }}
      onBlur={(e) => {
        isFocusedRef.current = false;
        if (onChange) onChange(e.currentTarget.innerHTML);
      }}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={disabled ? undefined : title}
      className={className}
      style={{
        outline: 'none',
        cursor: disabled ? 'default' : 'text',
        borderRadius: 'var(--radius-sm)',
        transition: 'all 120ms ease-out',
        position: 'relative',
        minHeight: '1em',
        boxShadow: !disabled && isHovered && !isFocusedRef.current
          ? '0 0 0 1.5px var(--action-primary), inset 0 0 0 1px rgba(212, 101, 10, 0.15)'
          : undefined,
        background: !disabled && isHovered && !isFocusedRef.current
          ? 'rgba(212, 101, 10, 0.04)'
          : undefined,
        ...style,
      }}
      {...rest}
    />
  );
}
