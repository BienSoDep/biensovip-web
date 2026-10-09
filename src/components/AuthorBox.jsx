import React from 'react';
import { ShieldCheck, MessageCircle, ExternalLink, Award, Phone, Mail, Clock, Globe } from 'lucide-react';
import Button from './Button.jsx';
import { content } from '../lib/content/index.js';

export default function AuthorBox({ style }) {
  return (
    <aside
      itemScope
      itemType="https://schema.org/Person"
      className="author-box"
      style={{
        background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.05) 0%, rgba(15, 23, 42, 0.03) 100%)',
        border: '1px solid rgba(217, 119, 6, 0.2)',
        borderRadius: 'var(--radius-card, 16px)',
        padding: 'var(--space-5, 24px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4, 16px)',
        margin: 'var(--space-6, 32px) 0',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4, 16px)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            itemProp="image"
            src="/assets/logo-mark.png"
            alt="Duy Đinh — Chuyên gia phong thủy biển số đẹp"
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--action-primary, #D97706)',
              background: 'var(--surface-sunken, #0F172A)',
            }}
          />
          <div
            title="Đã xác minh chuyên gia E-E-A-T"
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              background: 'var(--action-primary, #D97706)',
              color: '#FFF',
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            <ShieldCheck size={14} />
          </div>
        </div>

        <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3
              itemProp="name"
              style={{
                margin: 0,
                font: 'var(--type-title-2, 18px)',
                fontWeight: 'var(--fw-bold, 700)',
                color: 'var(--text-strong, #0F172A)',
              }}
            >
              Duy Đinh
            </h3>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                background: 'rgba(217, 119, 6, 0.12)',
                color: '#B45309',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill, 999px)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Award size={12} /> Người sáng lập Biensovip
            </span>
          </div>

          <p
            itemProp="jobTitle"
            style={{
              margin: 0,
              font: 'var(--type-caption, 13px)',
              fontWeight: 600,
              color: 'var(--text-muted, #64748B)',
            }}
          >
            Chuyên gia phong thủy ngũ hành & Định giá biển số xe đẹp tại Đà Nẵng
          </p>

          <p
            itemProp="description"
            style={{
              margin: '6px 0 0',
              font: 'var(--type-body-sm, 14px)',
              lineHeight: 1.6,
              color: 'var(--text-body, #334155)',
            }}
          >
            Hơn 10 năm kinh nghiệm thực chiến trong lĩnh vực thẩm định, giao dịch và hoàn thiện thủ tục sang tên biển số định danh theo Thông tư 24. Đã trực tiếp đồng hành cùng hơn 5.000+ chủ xe tại Đà Nẵng và toàn quốc.
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3, 12px)',
          paddingTop: 'var(--space-3, 12px)',
          borderTop: '1px solid rgba(217, 119, 6, 0.15)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px 16px',
            font: 'var(--type-caption, 13px)',
            color: 'var(--text-muted, #64748B)',
          }}
        >
          <a
            href={`tel:${content.info.phone || '0815792699'}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--text-strong, #0F172A)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            <Phone size={14} style={{ color: 'var(--action-primary, #D97706)' }} />
            Hotline: {content.info.phone_display || '081 579 2699'}
          </a>

          <a
            href={`mailto:${content.info.email || 'duymc64@gmail.com'}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--text-muted, #64748B)',
              textDecoration: 'none',
            }}
          >
            <Mail size={14} style={{ color: 'var(--action-primary, #D97706)' }} />
            {content.info.email || 'duymc64@gmail.com'}
          </a>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Clock size={14} style={{ color: 'var(--action-primary, #D97706)' }} />
            {content.info.hours || '8:00 – 21:00'}
          </span>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Globe size={14} style={{ color: 'var(--action-primary, #D97706)' }} />
            Giao dịch toàn quốc
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2, 8px)' }}>
          <a
            href={`https://zalo.me/${content.info.zalo || '0815792699'}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <Button variant="primary" size="sm">
              <MessageCircle size={15} style={{ marginRight: 6 }} />
              Tư vấn Zalo {content.info.phone_display || '0815 792 699'}
            </Button>
          </a>
          <a
            href="/gioi-thieu"
            style={{ textDecoration: 'none' }}
          >
            <Button variant="outline" size="sm">
              <ExternalLink size={14} style={{ marginRight: 6 }} />
              Xem hồ sơ chuyên gia
            </Button>
          </a>
        </div>
      </div>
    </aside>
  );
}
