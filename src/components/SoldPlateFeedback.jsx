import React, { useState, useMemo } from 'react';
import { ShieldCheck, Star, Award, CheckCircle2, PhoneCall, MessageCircle, Clock, Car, MapPin, ChevronRight, ThumbsUp, RefreshCw } from 'lucide-react';
import Button from './Button.jsx';
import { useSystemReviews } from '../services/reviewService.js';
import { formatDate } from '../lib/date.js';
import { maskName } from '../lib/textMask.js';
import { toZaloUrl } from '../lib/zaloMessage.js';
import { generateSoldPlateFeedbacks } from '../lib/plateDiscussionBank.js';

export default function SoldPlateFeedback({ plate, onConsultSimilar, go, notify }) {
  const [activeTab, setActiveTab] = useState('all');
  const { data: dbReviewsData } = useSystemReviews({ perPage: 6 });
  const curatedFeedbacks = useMemo(() => generateSoldPlateFeedbacks(plate), [plate?.id, plate?.plateNumber]);

  // Merge DB reviews with rich curated feedbacks if available
  const dbItems = (dbReviewsData?.items || []).filter((r) => r.comment);

  const displayFeedbacks = dbItems.length > 0
    ? dbItems.map((r, idx) => ({
        id: r.id,
        customerName: maskName(r.reviewerName || 'Khách hàng'),
        location: r.plateProvince ? `CSGT ${r.plateProvince}` : 'Khách hàng toàn quốc',
        vehicle: idx % 2 === 0 ? 'Mercedes-Benz E300 / GLC' : 'Lexus / Porsche Macan',
        plateNumber: r.plateNumber || plate.plateNumber,
        rating: r.rating || 5,
        date: formatDate(r.createdAt),
        comment: r.comment,
        adminReply: r.adminReply || 'Biensovip xin chân thành cảm ơn quý khách đã tin tưởng và đồng hành cùng anh Duy Đinh!',
        tags: ['Giao dịch thành công', 'Định danh chính chủ'],
      }))
    : curatedFeedbacks;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6, 24px)',
        margin: 'var(--space-6, 24px) 0',
      }}
    >
      {/* 1. Verified Handover Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(217, 119, 6, 0.06) 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.35)',
          borderRadius: 'var(--radius-card, 16px)',
          padding: 'var(--space-5, 20px) var(--space-6, 24px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4, 16px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#059669',
              }}
            >
              <CheckCircle2 size={22} />
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ font: 'var(--type-title-2, 700 18px / 24px sans-serif)', color: '#065F46' }}>
                  Biển số đã bàn giao thành công
                </span>
                <span
                  style={{
                    background: '#10B981',
                    color: '#FFF',
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                  }}
                >
                  CHÍNH CHỦ
                </span>
              </div>
              <p style={{ margin: '2px 0 0', font: 'var(--type-body-sm, 14px sans-serif)', color: 'var(--text-muted, #64748B)' }}>
                Hồ sơ định danh cho biển số <strong>{plate.plateNumber}</strong> đã được hoàn tất thủ tục thu hồi và cấp đăng ký xe thành công.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="primary"
              size="sm"
              onClick={onConsultSimilar}
              style={{
                background: 'linear-gradient(135deg, var(--action-primary, #D97706) 0%, #B45309 100%)',
                color: '#FFF',
                border: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
              }}
            >
              <RefreshCw size={15} style={{ marginRight: 6 }} />
              Tìm biển tương tự
            </Button>
          </div>
        </div>

        {/* Handover specs grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 12,
            paddingTop: 12,
            borderTop: '1px dashed rgba(16, 185, 129, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Car size={18} style={{ color: '#059669', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted, #64748B)', textTransform: 'uppercase', fontWeight: 600 }}>Phương tiện gắn biển</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong, #0F172A)' }}>Xe con 5 - 7 chỗ cao cấp</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MapPin size={18} style={{ color: '#059669', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted, #64748B)', textTransform: 'uppercase', fontWeight: 600 }}>Khu vực bàn giao</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong, #0F172A)' }}>{plate.province || 'Toàn quốc'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={18} style={{ color: '#059669', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted, #64748B)', textTransform: 'uppercase', fontWeight: 600 }}>Thời gian sang tên</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong, #0F172A)' }}>24h - 48h làm việc</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={18} style={{ color: '#059669', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted, #64748B)', textTransform: 'uppercase', fontWeight: 600 }}>Pháp lý bảo đảm</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>Bảo hành trọn đời</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. System Credibility & Customer Testimonials Section */}
      <div
        style={{
          background: 'var(--white, #FFF)',
          borderRadius: 'var(--radius-card, 16px)',
          border: '1px solid var(--border-hairline, #E2E8F0)',
          boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0, 0, 0, 0.04))',
          padding: 'var(--space-6, 24px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5, 20px)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={20} style={{ color: 'var(--action-primary, #D97706)' }} />
              <h3 style={{ margin: 0, font: 'var(--type-title-2, 700 18px / 24px sans-serif)', color: 'var(--text-strong, #0F172A)' }}>
                Đánh giá giao dịch & Phản hồi về hệ thống Biensovip
              </h3>
            </div>
            <p style={{ margin: '4px 0 0', font: 'var(--type-body-sm, 14px sans-serif)', color: 'var(--text-muted, #64748B)' }}>
              Feedback thực tế từ các chủ xe đã tin tưởng giao dịch và bàn giao biển số qua chuyên gia Duy Đinh.
            </p>
          </div>

          {/* Quick Score */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'var(--surface-sunken, #F8FAFC)',
              padding: '8px 16px',
              borderRadius: 12,
              border: '1px solid var(--border-hairline, #E2E8F0)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Star size={18} fill="#D97706" style={{ color: '#D97706' }} />
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-strong, #0F172A)' }}>4.9</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted, #64748B)' }}>/ 5.0</span>
            </div>
            <span style={{ height: 16, width: 1, background: '#CBD5E1' }} />
            <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>500+ Giao dịch an toàn</span>
          </div>
        </div>

        {/* Testimonials List */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {displayFeedbacks.slice(0, 4).map((item) => (
            <div
              key={item.id}
              style={{
                background: 'var(--surface-sunken, #F8FAFC)',
                borderRadius: 'var(--radius-md, 12px)',
                padding: 'var(--space-4, 16px)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                transition: 'transform 200ms ease, box-shadow 200ms ease',
              }}
            >
              {/* Customer info */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                      color: '#FFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {item.customerName.charAt(0) || 'K'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong, #0F172A)' }}>
                        {item.customerName}
                      </span>
                      <span
                        title="Đã xác thực giao dịch tại Biensovip"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 2,
                          color: '#059669',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        <CheckCircle2 size={13} />
                        Đã mua
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted, #64748B)' }}>
                      {item.location} {item.vehicle ? `· ${item.vehicle}` : ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        fill={s <= item.rating ? '#D97706' : 'none'}
                        style={{ color: s <= item.rating ? '#D97706' : '#CBD5E1' }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-faint, #94A3B8)' }}>{item.date}</span>
                </div>
              </div>

              {/* Comment text */}
              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: 'var(--text-body, #334155)',
                  fontStyle: 'normal',
                }}
              >
                "{item.comment}"
              </p>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {item.tags.map((t, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 11,
                        background: 'rgba(217, 119, 6, 0.08)',
                        color: '#B45309',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontWeight: 600,
                      }}
                    >
                      ✓ {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Admin reply */}
              {item.adminReply && (
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.03)',
                    borderLeft: '3px solid var(--action-primary, #D97706)',
                    padding: '8px 12px',
                    borderRadius: '0 8px 8px 0',
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    color: 'var(--text-muted, #475569)',
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--action-primary, #D97706)', display: 'block', marginBottom: 2 }}>
                    Phản hồi từ Duy Đinh (Chủ sáng lập):
                  </span>
                  {item.adminReply}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 3. Guarantees Bar & Call to Action */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.03) 0%, rgba(217, 119, 6, 0.05) 100%)',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--text-strong, #0F172A)', fontWeight: 600 }}>
              🛡️ Cam kết dịch vụ Biensovip:
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted, #475569)' }}>
              100% Biển sạch nguồn gốc · Hợp đồng pháp lý công chứng · Đền bù 200% nếu sai lệch
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {plate.seller?.zalo && (
              <a
                href={toZaloUrl(plate.seller.zalo)}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#0068FF',
                  textDecoration: 'none',
                }}
              >
                <MessageCircle size={16} />
                Nhắn Zalo anh Duy
              </a>
            )}
            {plate.seller?.phone && (
              <a
                href={`tel:${plate.seller.phone}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#059669',
                  textDecoration: 'none',
                }}
              >
                <PhoneCall size={15} />
                Hotline tư vấn
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
