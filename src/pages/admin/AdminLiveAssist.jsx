import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Lock,
  Play,
  Square,
  Maximize2,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Flame,
  ShieldAlert,
  Send,
  Smartphone,
  Monitor,
  Volume2,
  VolumeX,
  Keyboard,
  UserPlus,
  Trash2,
  PartyPopper,
  Compass,
  StopCircle,
  MessageSquarePlus,
  SlidersHorizontal,
  Database,
  Gavel,
  Sparkles,
  Star,
  TicketPercent,
  Heart,
  ScrollText,
  ArrowUpRight,
  Mic,
  RefreshCw,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { Button, Badge } from '../../components/index.jsx';
import PlateVisual from '../../components/PlateVisual.jsx';
import PlateShowcaseModal from '../../components/live/PlateShowcaseModal.jsx';
import LiveDisplayOverlay from '../overlay/LiveDisplayOverlay.jsx';
import { useAdminPlates } from '../../services/adminPlates.js';
import { useVpaAdminPlates, useVpaAuctionResults } from '../../services/adminVpa.js';
import { useAdminFengShuiHistory } from '../../services/adminFengShuiHistory.js';
import { useAdminInterestLeads } from '../../services/adminInterestLeads.js';
import { useAdminContacts, invalidateSales } from '../../services/adminContacts.js';
import { useSubmitContact } from '../../services/contactService.js';
import { useAdminCoupons } from '../../services/adminCoupons.js';
import { splitPlateNumber } from '../../lib/plateFormat.js';
import { validatePhone, normalizePhone } from '../../lib/phone.js';
import {
  LIVE_EFFECT_DECK,
  playLiveSoundEffect,
  stopAllLiveSounds,
} from '../../lib/liveSoundEffects.js';
import {
  parseLiveSearchInput,
  parseNumericVnd,
} from '../../lib/liveCommentParser.js';

// Kho biển mẫu chuẩn bị sẵn cho phiên Live (kết hợp cùng dữ liệu DB thật từ Kho Shop & Kho VPA)
const INITIAL_LIVE_PLATES = [
  {
    id: 'lp-1',
    prov: '30',
    seri: 'K',
    num: '888.88',
    plateNumber: '30K-888.88',
    city: 'Hà Nội',
    cat: 'Ngũ quý',
    vehicle: 'Ô tô',
    shape: 'long',
    price: '1.850.000.000đ',
    priceNum: 1850000000,
    floorPrice: '1.680.000.000đ',
    floorPriceNum: 1680000000,
    fengshui: 'Ngũ Quý 8 — Phát tài phát lộc đỉnh cao đại cát, hợp mệnh Kim & Thổ',
    elements: ['Kim', 'Thổ'],
    shortCode: '#B101',
    status: 'Còn hàng',
    notes: 'Biển đấu giá chính chủ, hồ sơ sẵn cầm tay sang tên trong ngày',
    source: 'QUEUE',
    sourceLabel: 'Rổ VIP Live',
    isHot: true,
  },
  {
    id: 'lp-2',
    prov: '51',
    seri: 'K',
    num: '999.99',
    plateNumber: '51K-999.99',
    city: 'TP. HCM',
    cat: 'Ngũ quý',
    vehicle: 'Ô tô',
    shape: 'long',
    price: '2.450.000.000đ',
    priceNum: 2450000000,
    floorPrice: '2.200.000.000đ',
    floorPriceNum: 2200000000,
    fengshui: 'Ngũ Quý 9 — Cửu ngũ chí tôn, trường cửu vĩnh cửu, hợp mệnh Hỏa & Thổ',
    elements: ['Hỏa', 'Thổ'],
    shortCode: '#B102',
    status: 'Còn hàng',
    notes: 'Biển Sài Gòn đầu số phong thủy cực mạnh cho chủ tịch',
    source: 'QUEUE',
    sourceLabel: 'Rổ VIP Live',
    isHot: true,
  },
  {
    id: 'lp-3',
    prov: '43',
    seri: 'A',
    num: '999.99',
    plateNumber: '43A-999.99',
    city: 'Đà Nẵng',
    cat: 'Ngũ quý',
    vehicle: 'Ô tô',
    shape: 'long',
    price: '850.000.000đ',
    priceNum: 850000000,
    floorPrice: '780.000.000đ',
    floorPriceNum: 780000000,
    fengshui: 'Ngũ Quý 9 Đà Nẵng — Độc bản miền Trung vượng khí, hợp mệnh Hỏa & Thổ',
    elements: ['Hỏa', 'Thổ'],
    shortCode: '#B103',
    status: 'Còn hàng',
    notes: 'Khách live chốt bớt 20tr lộc phát',
    source: 'QUEUE',
    sourceLabel: 'Rổ VIP Live',
    isHot: true,
  },
  {
    id: 'lp-4',
    prov: '30',
    seri: 'L',
    num: '686.88',
    plateNumber: '30L-686.88',
    city: 'Hà Nội',
    cat: 'Lộc phát',
    vehicle: 'Ô tô',
    shape: 'long',
    price: '380.000.000đ',
    priceNum: 380000000,
    floorPrice: '335.000.000đ',
    floorPriceNum: 335000000,
    fengshui: 'Lộc Phát Đại Cát — Tiền vào như nước, kinh doanh đắc lợi, hợp mệnh Kim & Thổ',
    elements: ['Kim', 'Thổ'],
    shortCode: '#B104',
    status: 'Còn hàng',
    notes: 'Thế số gánh cực đẹp gắn xe sang BMW/Mercedes',
    source: 'QUEUE',
    sourceLabel: 'Rổ VIP Live',
    isHot: false,
  },
  {
    id: 'lp-5',
    prov: '51',
    seri: 'L',
    num: '777.77',
    plateNumber: '51L-777.77',
    city: 'TP. HCM',
    cat: 'Ngũ quý',
    vehicle: 'Ô tô',
    shape: 'long',
    price: '1.250.000.000đ',
    priceNum: 1250000000,
    floorPrice: '1.100.000.000đ',
    floorPriceNum: 1100000000,
    fengshui: 'Ngũ Quý 7 — Quyền năng thần tài, quý nhân phù trợ, hợp mệnh Kim & Thủy',
    elements: ['Kim', 'Thủy'],
    shortCode: '#B105',
    status: 'Còn hàng',
    notes: 'Biển nguyên bản chưa gắn xe, sang tên bấm biển 24h',
    source: 'QUEUE',
    sourceLabel: 'Rổ VIP Live',
    isHot: true,
  },
  {
    id: 'lp-6',
    prov: '14',
    seri: 'A',
    num: '888.88',
    plateNumber: '14A-888.88',
    city: 'Quảng Ninh',
    cat: 'Ngũ quý',
    vehicle: 'Ô tô',
    shape: 'long',
    price: '1.150.000.000đ',
    priceNum: 1150000000,
    floorPrice: '1.020.000.000đ',
    floorPriceNum: 1020000000,
    fengshui: 'Đất mỏ ngũ quý 8 — Rồng cuộn vượng khí thịnh vượng, hợp mệnh Kim & Thổ',
    elements: ['Kim', 'Thổ'],
    shortCode: '#B106',
    status: 'Còn hàng',
    notes: 'Chủ xe cần vốn đổi xe mới, ưu tiên khách chốt nhanh',
    source: 'QUEUE',
    sourceLabel: 'Rổ VIP Live',
    isHot: false,
  },
  {
    id: 'lp-7',
    prov: '30',
    seri: 'K',
    num: '779.79',
    plateNumber: '30K-779.79',
    city: 'Hà Nội',
    cat: 'Thần tài',
    vehicle: 'Ô tô',
    shape: 'long',
    price: '420.000.000đ',
    priceNum: 420000000,
    floorPrice: '380.000.000đ',
    floorPriceNum: 380000000,
    fengshui: 'Cặp Thần Tài Lớn — Hút tài lộc, kinh doanh hanh thông, hợp mệnh Kim & Hỏa',
    elements: ['Kim', 'Hỏa'],
    shortCode: '#B107',
    status: 'Còn hàng',
    notes: 'Rất hợp mệnh Kim, Hỏa và Thổ',
    source: 'QUEUE',
    sourceLabel: 'Rổ VIP Live',
    isHot: false,
  },
  {
    id: 'lp-8',
    prov: '43',
    seri: 'A',
    num: '678.88',
    plateNumber: '43A-678.88',
    city: 'Đà Nẵng',
    cat: 'Sảnh tiến',
    vehicle: 'Ô tô',
    shape: 'long',
    price: '290.000.000đ',
    priceNum: 290000000,
    floorPrice: '255.000.000đ',
    floorPriceNum: 255000000,
    fengshui: 'Sảnh Lộc Phát Kép — Thăng tiến sự nghiệp, hợp mệnh Mộc & Hỏa',
    elements: ['Mộc', 'Hỏa'],
    shortCode: '#B108',
    status: 'Còn hàng',
    notes: 'Giá mềm dễ chốt trong phiên livestream',
    source: 'QUEUE',
    sourceLabel: 'Rổ VIP Live',
    isHot: false,
  },
];

const INITIAL_ASKED_LEADS = [
  {
    id: 'lead-1',
    nickname: '@anh_tuan_bds',
    phone: '0905123888',
    comment: 'Hỏi giá chốt biển 30K-888.88 sang tên Hà Nội',
    plateId: 'lp-1',
    plateNumber: '30K-888.88',
    shortCode: '#B101',
    price: '1.850.000.000đ',
    askedAt: 'Vừa xong',
    syncedToCrm: false,
  },
  {
    id: 'lead-2',
    nickname: '@minh_mercedes_sg',
    phone: '0918999999',
    comment: 'Sinh năm 1990 hỏi biển 51K-999.99',
    plateId: 'lp-2',
    plateNumber: '51K-999.99',
    shortCode: '#B102',
    price: '2.450.000.000đ',
    askedAt: '3 phút trước',
    syncedToCrm: false,
  },
];

const QUICK_SAMPLE_COMMENTS = [
  { label: 'Tuổi 1990 hợp biển nào?', query: '1990' },
  { label: 'Tuổi 1988 mệnh Mộc', query: '1988' },
  { label: 'Gõ tắt: 30 68', query: '30 68' },
  { label: 'Sài Gòn ngũ quý', query: 'Tìm biển Sài Gòn ngũ quý' },
  { label: 'Đà Nẵng tầm 300tr', query: 'Đà Nẵng lộc phát tầm 300tr' },
  { label: 'Mã #B104', query: '#B104' },
];

function formatVndPrice(numVal) {
  const n = Number(numVal);
  if (!Number.isFinite(n) || n <= 0) return 'Giá liên hệ';
  return `${n.toLocaleString('vi-VN')}đ`;
}

function normalizeLiveCityName(rawCity) {
  const s = String(rawCity || '').trim();
  if (!s) return 'Toàn quốc';
  const lower = s.toLowerCase();
  if (lower.includes('hồ chí minh') || lower === 'tp. hcm' || lower === 'tphcm' || lower === 'hcm') {
    return 'TP. HCM';
  }
  if (lower.includes('hà nội')) return 'Hà Nội';
  if (lower.includes('đà nẵng')) return 'Đà Nẵng';
  if (lower.includes('hải phòng')) return 'Hải Phòng';
  if (lower.includes('cần thơ')) return 'Cần Thơ';
  if (lower.includes('quảng ninh')) return 'Quảng Ninh';
  return s.replace(/^(Thành phố|Tỉnh)\s+/i, '');
}

// Tự động suy diễn Ngũ Hành & Tổng nút từ dãy số biển + chuỗi luận giải phong thủy
function analyzePlateFengShuiMeta(numStr, fengshuiText = '') {
  const digits = String(numStr || '').replace(/\D/g, '').split('').map(Number);
  const sumDigits = digits.reduce((acc, d) => acc + d, 0);
  const nut = sumDigits % 10;

  const detectedElements = new Set();
  const lowerFs = String(fengshuiText || '').toLowerCase();
  if (lowerFs.includes('kim')) detectedElements.add('Kim');
  if (lowerFs.includes('mộc') || lowerFs.includes('moc')) detectedElements.add('Mộc');
  if (lowerFs.includes('thủy') || lowerFs.includes('thuy')) detectedElements.add('Thủy');
  if (lowerFs.includes('hỏa') || lowerFs.includes('hoa')) detectedElements.add('Hỏa');
  if (lowerFs.includes('thổ') || lowerFs.includes('tho')) detectedElements.add('Thổ');

  // Suy diễn thêm từ con số chủ đạo ở đuôi biển
  const tail = digits.slice(-2);
  for (const d of tail) {
    if (d === 6 || d === 7) detectedElements.add('Kim');
    if (d === 3 || d === 4) detectedElements.add('Mộc');
    if (d === 1 || d === 0) detectedElements.add('Thủy');
    if (d === 9) detectedElements.add('Hỏa');
    if (d === 2 || d === 5 || d === 8) detectedElements.add('Thổ');
  }

  const elements = Array.from(detectedElements);
  if (elements.length === 0) elements.push('Kim', 'Thổ');

  return {
    nut: nut === 0 ? 10 : nut,
    sumDigits,
    elements,
  };
}

const kbdStyle = {
  display: 'inline-block',
  padding: '1px 5px',
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--text-strong)',
  background: 'var(--white)',
  boxShadow: 'var(--shadow-inset-hairline)',
};

export default function AdminLiveAssist({ notify, go }) {
  const qc = useQueryClient();

  // 1. NGUỒN DỮ LIỆU 1: Kho biển có sẵn của Shop (Admin Plates API)
  const {
    data: adminPlatesData,
    isLoading: isLoadingShop,
    refetch: refetchShopPlates,
  } = useAdminPlates({
    page: 1,
    perPage: 150,
    status: 'available',
  });

  // 2. NGUỒN DỮ LIỆU 2: Kho biển đấu giá VPA (VPA Admin Plates API)
  const {
    data: vpaPlatesData,
    isLoading: isLoadingVpa,
    refetch: refetchVpaPlates,
  } = useVpaAdminPlates({
    page: 1,
    limit: 120,
    hidden: false,
  });

  // 3. NGUỒN DỮ LIỆU 3: Kết quả trúng đấu giá VPA thực tế (để làm dẫn chứng so sánh giá trên Live)
  const { data: vpaAuctionResultsData } = useVpaAuctionResults({
    page: 1,
    limit: 40,
  });

  // 4. NGUỒN DỮ LIỆU 4: Lịch sử khách đang tra cứu Luận giải phong thủy trên Web (/luan-bien-so)
  const {
    data: fengShuiHistoryData,
    refetch: refetchFengShui,
    isFetching: isFetchingFs,
  } = useAdminFengShuiHistory({
    page: 1,
    perPage: 15,
  });

  // 5. NGUỒN DỮ LIỆU 5: Khách tiềm năng đang thả tim / xem lặp lại biển số trên Web
  const {
    data: interestLeadsData,
    refetch: refetchInterestLeads,
  } = useAdminInterestLeads({
    status: 'all',
    page: 1,
    perPage: 15,
  });

  // 6. NGUỒN DỮ LIỆU 6: Liên hệ CRM Bán hàng & Mutation tạo Lead trực tiếp từ Livestream
  const { data: crmContactsData, refetch: refetchCrmContacts } = useAdminContacts({
    page: 1,
    perPage: 10,
  });
  const submitContactMutation = useSubmitContact();

  // 7. NGUỒN DỮ LIỆU 7: Kho Mã Giảm Giá thật trong hệ thống (để phát Voucher trên sóng Live)
  const { data: couponsData } = useAdminCoupons();

  // Rổ hàng phiên Live (Streamer đánh dấu sao các biển muốn lên sóng ưu tiên)
  const [basketIds, setBasketIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('bsv_live_basket_ids') || '[]');
      return Array.isArray(saved) ? saved : ['lp-1', 'lp-2', 'lp-3'];
    } catch {
      return ['lp-1', 'lp-2', 'lp-3'];
    }
  });

  const toggleBasketPlate = useCallback((plateId) => {
    setBasketIds((prev) => {
      const exists = prev.includes(plateId);
      const next = exists ? prev.filter((id) => id !== plateId) : [plateId, ...prev];
      try {
        localStorage.setItem('bsv_live_basket_ids', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Hợp nhất Đa nguồn biển số: Rổ VIP + Kho Shop Có Sẵn + Kho Đấu Giá VPA
  const plates = useMemo(() => {
    const shopItems = adminPlatesData?.items || [];
    const normalizedShop = shopItems.map((item, idx) => {
      const split = splitPlateNumber(item.plateNumber);
      const rawPrice = Number(item.salePrice || item.price || 0);
      const rawCost = Number(item.costPrice || 0);
      const computedFloor =
        rawCost > 0
          ? rawCost
          : rawPrice > 0
            ? Math.round((rawPrice * 0.91) / 1_000_000) * 1_000_000
            : 0;
      const fsText =
        item.fengShuiMeaning ||
        item.description ||
        'Thế số phong thủy đại cát — Vượng khí tài lộc bền vững';
      const fsMeta = analyzePlateFengShuiMeta(split.num || item.plateNumber, fsText);
      const isMoto =
        String(item.vehicleTypeName || '').toLowerCase().includes('máy') ||
        (split.seri && split.seri.length >= 2);

      return {
        id: item.id || `shop-${idx}`,
        prov: split.prov || '30',
        seri: split.seri || 'A',
        num: split.num || item.plateNumber,
        plateNumber: item.plateNumber,
        city: normalizeLiveCityName(item.provinceName),
        cat: item.plateTypeName || 'Biển đẹp',
        vehicle: isMoto ? 'Xe máy' : 'Ô tô',
        shape: isMoto ? 'short' : 'long',
        price: formatVndPrice(rawPrice),
        priceNum: rawPrice,
        floorPrice: computedFloor > 0 ? formatVndPrice(computedFloor) : 'Theo giá sàn kho',
        floorPriceNum: computedFloor,
        fengshui: fsText,
        elements: fsMeta.elements,
        nut: fsMeta.nut,
        shortCode: `#S${201 + idx}`,
        status: item.status === 'sold' ? 'Đã bán' : 'Còn hàng',
        notes: item.description || 'Hồ sơ định danh chính chủ sẵn sàng sang tên',
        source: 'SHOP',
        sourceLabel: 'Kho Shop',
        isHot: Boolean(item.isHot),
      };
    });

    const vpaItems = vpaPlatesData?.items || [];
    const normalizedVpa = vpaItems.map((item, idx) => {
      const split = splitPlateNumber(item.plateNumber);
      const approved = Number(item.approvedPrice || 0);
      const suggested = Number(item.suggestedPrice || 0);
      const starting = Number(item.startingPrice || 40_000_000);
      const displayPrice = approved > 0 ? approved : suggested > 0 ? suggested : starting;
      const floorVal =
        starting > 0 && displayPrice > starting
          ? Math.max(starting, Math.round((displayPrice * 0.92) / 1_000_000) * 1_000_000)
          : starting;
      const fsText =
        item.fengShuiMeaning ||
        item.description ||
        `Biển đấu giá VPA ${item.sampleCount ? `(Tham chiếu ${item.sampleCount} mẫu trúng)` : 'chính ngạch'}`;
      const fsMeta = analyzePlateFengShuiMeta(split.num || item.plateNumber, fsText);
      const isMoto =
        String(item.vehicle || '').toLowerCase().includes('motor') ||
        (split.seri && split.seri.length >= 2);

      return {
        id: item.id || `vpa-${idx}`,
        prov: split.prov || '30',
        seri: split.seri || 'A',
        num: split.num || item.plateNumber,
        plateNumber: item.plateNumber,
        city: normalizeLiveCityName(item.provinceName),
        cat: item.plateTypeName || 'Đấu giá VPA',
        vehicle: isMoto ? 'Xe máy' : 'Ô tô',
        shape: isMoto ? 'short' : 'long',
        price: formatVndPrice(displayPrice),
        priceNum: displayPrice,
        floorPrice: formatVndPrice(floorVal),
        floorPriceNum: floorVal,
        startingPrice: starting,
        sampleCount: item.sampleCount || 0,
        auctionStartAt: item.auctionStartAt || null,
        fengshui: fsText,
        elements: fsMeta.elements,
        nut: fsMeta.nut,
        shortCode: `#V${501 + idx}`,
        status: approved > 0 ? 'Đã duyệt giá' : 'Đấu giá VPA',
        notes: item.auctionStartAt
          ? `Phiên đấu giá: ${new Date(item.auctionStartAt).toLocaleDateString('vi-VN')}`
          : 'Biển trong danh mục đấu giá VPA toàn quốc',
        source: 'VPA',
        sourceLabel: 'Kho VPA',
        isHot: Boolean(item.isFeatured || item.isPinned),
      };
    });

    const enrichedInitial = INITIAL_LIVE_PLATES.map((p) => {
      const fsMeta = analyzePlateFengShuiMeta(p.num, p.fengshui);
      return {
        ...p,
        nut: fsMeta.nut,
        elements: p.elements || fsMeta.elements,
      };
    });

    const seenNumbers = new Set();
    const merged = [];

    for (const p of [...enrichedInitial, ...normalizedShop, ...normalizedVpa]) {
      const key = String(p.plateNumber || '').toUpperCase();
      if (!key || seenNumbers.has(key)) continue;
      seenNumbers.add(key);
      merged.push(p);
    }
    return merged;
  }, [adminPlatesData, vpaPlatesData]);

  // Thống kê số lượng từng nguồn kho
  const sourceCounts = useMemo(() => {
    let shop = 0;
    let vpa = 0;
    let queue = 0;
    let basket = 0;
    for (const p of plates) {
      if (p.source === 'SHOP') shop += 1;
      else if (p.source === 'VPA') vpa += 1;
      else queue += 1;
      if (basketIds.includes(p.id)) basket += 1;
    }
    return { total: plates.length, shop, vpa, queue, basket };
  }, [plates, basketIds]);

  const [activePlateId, setActivePlateId] = useState(() => {
    try {
      const saved = localStorage.getItem('biensovip_live_active_plate');
      return saved ? JSON.parse(saved).id : 'lp-1';
    } catch {
      return 'lp-1';
    }
  });

  const [layoutMode, setLayoutMode] = useState(() => {
    try {
      return localStorage.getItem('biensovip_live_layout_mode') || '9:16';
    } catch {
      return '9:16';
    }
  });

  const [showSafeZoneGuide, setShowSafeZoneGuide] = useState(() => {
    try {
      const saved = localStorage.getItem('biensovip_live_safezone_guide');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const [adminMuted, setAdminMuted] = useState(() => {
    try {
      return localStorage.getItem('bsv_live_admin_muted') === 'true';
    } catch {
      return false;
    }
  });

  const [activeEffectCode, setActiveEffectCode] = useState(null);
  const [buyerHonorInput, setBuyerHonorInput] = useState('');

  // Đa chiều lọc (6 chiều: Tìm kiếm, Nguồn kho, Loại xe, Tầm giá, Ngũ hành, Tỉnh, Thế số)
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL'); // ALL | SHOP | VPA | BASKET
  const [vehicleFilter, setVehicleFilter] = useState('ALL'); // ALL | Ô tô | Xe máy
  const [priceRangeFilter, setPriceRangeFilter] = useState('ALL'); // ALL | UNDER_100M | 100M_300M | 300M_800M | OVER_800M
  const [elementFilter, setElementFilter] = useState('ALL'); // ALL | Kim | Mộc | Thủy | Hỏa | Thổ
  const [cityFilter, setCityFilter] = useState('ALL');
  const [catFilter, setCatFilter] = useState('ALL');
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);

  // Tab tín hiệu khách hàng bên cột phải: 'leads' | 'fengshui' | 'interest'
  const [rightSignalTab, setRightSignalTab] = useState('leads');

  const [showcasePlate, setShowcasePlate] = useState(null);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [previewWidth, setPreviewWidth] = useState(() => {
    try {
      const saved = Number(localStorage.getItem('bsv_live_preview_width'));
      if (Number.isFinite(saved) && saved >= 320 && saved <= 540) return saved;
    } catch {
      // ignore
    }
    return 390;
  });
  const [isResizingPreview, setIsResizingPreview] = useState(false);

  const updatePreviewWidth = useCallback((nextWidth) => {
    const clamped = Math.max(320, Math.min(540, Math.round(nextWidth)));
    setPreviewWidth(clamped);
    try {
      localStorage.setItem('bsv_live_preview_width', String(clamped));
    } catch {
      // ignore
    }
  }, []);

  const handleStartResizePreview = useCallback(
    (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = previewWidth;
      setIsResizingPreview(true);

      const onMouseMove = (moveEvent) => {
        const delta = startX - moveEvent.clientX;
        updatePreviewWidth(startWidth + delta);
      };

      const onMouseUp = () => {
        setIsResizingPreview(false);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [previewWidth, updatePreviewWidth]
  );

  const [tickerInput, setTickerInput] = useState(
    'KHUYẾN MÃI LIVESTREAM: Giảm ngay 10 - 20 triệu khi chốt trên live • Comment Năm Sinh hoặc Đuôi Số để shop tra ngay • Hotline: 0815.792.699'
  );

  // Danh sách "Khách vừa hỏi trên Live" (LiveAskedLead) kết hợp đồng bộ CRM
  const [askedLeads, setAskedLeads] = useState(() => {
    try {
      const saved = localStorage.getItem('bsv_live_asked_leads');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_ASKED_LEADS;
    } catch {
      return INITIAL_ASKED_LEADS;
    }
  });
  const [leadNicknameInput, setLeadNicknameInput] = useState('');
  const [leadPhoneInput, setLeadPhoneInput] = useState('');
  const [leadNoteInput, setLeadNoteInput] = useState('');
  const [pushingLeadId, setPushingLeadId] = useState(null);

  const [liveDuration, setLiveDuration] = useState(3840);
  const [pinnedCount, setPinnedCount] = useState(6);
  const [copiedToken, setCopiedToken] = useState(false);

  const channelRef = useRef(null);
  const searchInputRef = useRef(null);
  const effectClearTimerRef = useRef(null);

  // Khởi tạo BroadcastChannel để đồng bộ Realtime sang màn hình OBS Overlay
  useEffect(() => {
    try {
      channelRef.current = new BroadcastChannel('biensovip_livestream_channel');
    } catch (e) {
      console.warn('BroadcastChannel error', e);
    }
    return () => {
      channelRef.current?.close();
      if (effectClearTimerRef.current) clearTimeout(effectClearTimerRef.current);
    };
  }, []);

  // Timer phiên Live
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Phân tích thông minh chuỗi tìm kiếm / comment của khách (3-in-1 Parser)
  const parsedSearch = useMemo(() => parseLiveSearchInput(searchQuery), [searchQuery]);

  // Tra cứu In-Memory siêu tốc (< 15ms) kết hợp 6 chiều lọc + 3-in-1 Smart Comment Parser
  const filteredPlates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return plates.filter((p) => {
      // 1. Nguồn kho
      if (sourceFilter === 'SHOP' && p.source !== 'SHOP') return false;
      if (sourceFilter === 'VPA' && p.source !== 'VPA') return false;
      if (sourceFilter === 'BASKET' && !basketIds.includes(p.id)) return false;

      // 2. Loại xe
      if (vehicleFilter !== 'ALL' && p.vehicle !== vehicleFilter) return false;

      // 3. Phân khúc ngân sách
      if (priceRangeFilter !== 'ALL') {
        const val = p.priceNum || parseNumericVnd(p.price);
        if (priceRangeFilter === 'UNDER_100M' && val >= 100_000_000) return false;
        if (priceRangeFilter === '100M_300M' && (val < 100_000_000 || val > 300_000_000)) return false;
        if (priceRangeFilter === '300M_800M' && (val <= 300_000_000 || val > 800_000_000)) return false;
        if (priceRangeFilter === 'OVER_800M' && val <= 800_000_000) return false;
      }

      // 4. Ngũ hành / Bản mệnh
      if (elementFilter !== 'ALL' && !(p.elements || []).includes(elementFilter)) {
        return false;
      }

      // 5. Tỉnh thành & Thế số
      const matchCityDropdown = cityFilter === 'ALL' || p.city === cityFilter;
      const matchCatDropdown =
        catFilter === 'ALL' ||
        p.cat.toLowerCase().includes(catFilter.toLowerCase());
      if (!matchCityDropdown || !matchCatDropdown) return false;

      if (!q) return true;

      if (parsedSearch.hasSmartMatch) {
        if (
          parsedSearch.shortCode &&
          p.shortCode.toLowerCase() !== parsedSearch.shortCode.toLowerCase()
        ) {
          return false;
        }
        if (
          parsedSearch.city &&
          p.city.toLowerCase() !== parsedSearch.city.toLowerCase() &&
          p.prov !== parsedSearch.provCode
        ) {
          return false;
        }
        if (parsedSearch.cat && !p.cat.toLowerCase().includes(parsedSearch.cat.toLowerCase())) {
          return false;
        }
        if (parsedSearch.tailDigits) {
          const cleanNum = p.num.replace(/\D/g, '');
          if (!cleanNum.includes(parsedSearch.tailDigits)) return false;
        }
        if (parsedSearch.minBudgetVnd || parsedSearch.maxBudgetVnd) {
          const pVal = p.priceNum || parseNumericVnd(p.price);
          if (parsedSearch.minBudgetVnd && pVal < parsedSearch.minBudgetVnd) return false;
          if (parsedSearch.maxBudgetVnd && pVal > parsedSearch.maxBudgetVnd) return false;
        }
        if (parsedSearch.birthYearInfo) {
          const digits = parsedSearch.birthYearInfo.luckyDigits;
          const cleanNum = p.num.replace(/\D/g, '');
          const matchCount = cleanNum.split('').filter((d) => digits.includes(d)).length;
          const fengshuiMatch =
            p.fengshui.toLowerCase().includes(parsedSearch.birthYearInfo.menh.toLowerCase()) ||
            (p.elements || []).includes(parsedSearch.birthYearInfo.menh);
          if (matchCount < 2 && !fengshuiMatch) return false;
        }
        return true;
      }

      const cleanPlate = p.plateNumber.toLowerCase();
      const cleanDigits = p.num.replace(/\D/g, '');
      const cleanQDigits = q.replace(/\D/g, '');

      return (
        cleanPlate.includes(q) ||
        (cleanQDigits && cleanDigits.includes(cleanQDigits)) ||
        p.shortCode.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.cat.toLowerCase().includes(q) ||
        p.fengshui.toLowerCase().includes(q)
      );
    });
  }, [
    plates,
    searchQuery,
    sourceFilter,
    vehicleFilter,
    priceRangeFilter,
    elementFilter,
    cityFilter,
    catFilter,
    parsedSearch,
    basketIds,
  ]);

  useEffect(() => {
    setSelectedRowIndex(0);
  }, [searchQuery, sourceFilter, vehicleFilter, priceRangeFilter, elementFilter, cityFilter, catFilter]);

  const activePlateObj = useMemo(
    () => plates.find((p) => p.id === activePlateId) || plates[0] || INITIAL_LIVE_PLATES[0],
    [plates, activePlateId]
  );

  // Biển đang được focus trên bảng (để hiện Kịch bản Teleprompter & Đối chiếu giá VPA)
  const focusedPlate = useMemo(
    () => filteredPlates[selectedRowIndex] || activePlateObj,
    [filteredPlates, selectedRowIndex, activePlateObj]
  );

  // Tìm kết quả trúng đấu giá VPA tương đồng với biển đang chọn để làm dẫn chứng trên sóng Live
  const comparableAuctionResult = useMemo(() => {
    const results = vpaAuctionResultsData?.items || [];
    if (!focusedPlate || results.length === 0) return null;
    const sameProv = results.find(
      (r) =>
        normalizeLiveCityName(r.provinceName) === focusedPlate.city ||
        String(r.plateNumber || '').startsWith(focusedPlate.prov)
    );
    return sameProv || results[0];
  }, [vpaAuctionResultsData, focusedPlate]);

  // Ghim biển số lên màn hình OBS Overlay (TUYỆT ĐỐI LOẠI BỎ floorPrice per BR-LIVE-01)
  const handlePinPlate = useCallback((plate) => {
    if (!plate) return;
    const broadcastDto = {
      id: plate.id,
      plateNumber: plate.plateNumber,
      prov: plate.prov,
      seri: plate.seri,
      num: plate.num,
      city: plate.city,
      cat: plate.cat,
      price: plate.price,
      fengshui: plate.fengshui,
      shortCode: plate.shortCode,
      timestamp: Date.now(),
    };

    setActivePlateId(plate.id);
    setPinnedCount((prev) => prev + 1);

    try {
      localStorage.setItem('biensovip_live_active_plate', JSON.stringify(broadcastDto));
    } catch {
      // ignore
    }

    channelRef.current?.postMessage({
      type: 'PIN_PLATE',
      plate: broadcastDto,
    });

    toast.success(`Đã ghim biển ${plate.plateNumber} lên màn hình Live!`);
  }, []);

  // Gỡ biển số khỏi màn hình OBS
  const handleUnpinPlate = useCallback(() => {
    setActivePlateId(null);
    try {
      localStorage.removeItem('biensovip_live_active_plate');
    } catch {
      // ignore
    }
    channelRef.current?.postMessage({ type: 'UNPIN_PLATE' });
    toast('Đã gỡ biển số khỏi màn hình OBS');
  }, []);

  // Kích hoạt Hiệu ứng Hình ảnh (VFX) + Âm thanh (SFX)
  const handleTriggerEffect = useCallback(
    (effectCode, overrideBuyerName = null, overridePlate = null) => {
      if (effectClearTimerRef.current) clearTimeout(effectClearTimerRef.current);

      if (effectCode === 'FX_STOP_ALL') {
        setActiveEffectCode(null);
        stopAllLiveSounds();
        channelRef.current?.postMessage({ type: 'STOP_EFFECT' });
        try {
          localStorage.setItem(
            'biensovip_live_active_effect',
            JSON.stringify({ effectCode: 'FX_STOP_ALL', timestamp: Date.now() })
          );
        } catch {
          // ignore
        }
        toast('Đã dừng toàn bộ hiệu ứng & âm thanh');
        return;
      }

      const deckItem = LIVE_EFFECT_DECK.find((d) => d.code === effectCode);
      if (!deckItem) return;

      const targetPlate = overridePlate || activePlateObj;
      const safePlateDto = targetPlate
        ? {
            id: targetPlate.id,
            plateNumber: targetPlate.plateNumber,
            price: targetPlate.price,
            shortCode: targetPlate.shortCode,
          }
        : null;

      const finalBuyer =
        overrideBuyerName !== null ? overrideBuyerName : buyerHonorInput.trim();

      const effectPayload = {
        type: 'TRIGGER_EFFECT',
        effectCode,
        plate: safePlateDto,
        buyerName: finalBuyer || null,
        durationMs: deckItem.durationMs,
        timestamp: Date.now(),
      };

      setActiveEffectCode(effectCode);
      playLiveSoundEffect(effectCode, adminMuted);

      channelRef.current?.postMessage(effectPayload);
      try {
        localStorage.setItem('biensovip_live_active_effect', JSON.stringify(effectPayload));
      } catch {
        // ignore
      }

      toast.success(`Đã phát hiệu ứng: ${deckItem.label}`, {
        duration: 2200,
      });

      effectClearTimerRef.current = setTimeout(() => {
        setActiveEffectCode(null);
      }, deckItem.durationMs);
    },
    [activePlateObj, buyerHonorInput, adminMuted]
  );

  // Chuyển đổi Khung Dọc 9:16 TikTok vs Ngang 16:9
  const handleSwitchLayout = (mode) => {
    setLayoutMode(mode);
    try {
      localStorage.setItem('biensovip_live_layout_mode', mode);
    } catch {
      // ignore
    }
    channelRef.current?.postMessage({
      type: 'SET_LAYOUT_MODE',
      layoutMode: mode,
    });
    toast.success(
      mode === '9:16'
        ? 'Đã chuyển sang Khung Dọc 9:16 (Chuẩn TikTok Safe-Zone)'
        : 'Đã chuyển sang Khung Ngang 16:9 (Facebook / YouTube)'
    );
  };

  const handleToggleSafeZoneGuide = () => {
    setShowSafeZoneGuide((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('biensovip_live_safezone_guide', String(next));
      } catch {
        // ignore
      }
      channelRef.current?.postMessage({
        type: 'SET_SAFEZONE_GUIDE',
        show: next,
      });
      return next;
    });
  };

  const handleToggleAdminMute = () => {
    setAdminMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('bsv_live_admin_muted', String(next));
      } catch {
        // ignore
      }
      if (next) stopAllLiveSounds();
      return next;
    });
  };

  // Global Keyboard Shortcuts Listener (1-6 / F1-F6 / Alt+1..6 / 0 / Esc / / / Arrows / Enter / Space)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isTyping =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        document.activeElement?.isContentEditable;

      if (/^F[1-6]$/.test(e.key)) {
        e.preventDefault();
        const idx = Number(e.key.slice(1)) - 1;
        if (LIVE_EFFECT_DECK[idx]) {
          handleTriggerEffect(LIVE_EFFECT_DECK[idx].code);
        }
        return;
      }

      if (e.altKey && /^[1-6]$/.test(e.key)) {
        e.preventDefault();
        const idx = Number(e.key) - 1;
        if (LIVE_EFFECT_DECK[idx]) {
          handleTriggerEffect(LIVE_EFFECT_DECK[idx].code);
        }
        return;
      }

      if (e.key === 'Escape') {
        if (showcasePlate) return;
        handleTriggerEffect('FX_STOP_ALL');
        return;
      }

      if (isTyping) {
        if (document.activeElement === searchInputRef.current) {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedRowIndex((prev) =>
              Math.min(prev + 1, Math.max(0, filteredPlates.length - 1))
            );
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedRowIndex((prev) => Math.max(0, prev - 1));
          } else if (e.key === 'Enter' && filteredPlates[selectedRowIndex]) {
            e.preventDefault();
            handlePinPlate(filteredPlates[selectedRowIndex]);
          }
        }
        return;
      }

      if (/^[1-6]$/.test(e.key)) {
        e.preventDefault();
        const idx = Number(e.key) - 1;
        if (LIVE_EFFECT_DECK[idx]) {
          handleTriggerEffect(LIVE_EFFECT_DECK[idx].code);
        }
      } else if (e.key === '0') {
        e.preventDefault();
        handleTriggerEffect('FX_STOP_ALL');
      } else if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedRowIndex((prev) =>
          Math.min(prev + 1, Math.max(0, filteredPlates.length - 1))
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedRowIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Enter' && filteredPlates[selectedRowIndex]) {
        e.preventDefault();
        handlePinPlate(filteredPlates[selectedRowIndex]);
      } else if (e.key === ' ' && !showcasePlate) {
        e.preventDefault();
        const target = filteredPlates[selectedRowIndex] || activePlateObj;
        if (target) setShowcasePlate(target);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    filteredPlates,
    selectedRowIndex,
    showcasePlate,
    activePlateObj,
    handleTriggerEffect,
    handlePinPlate,
  ]);

  // Cập nhật chữ chạy Marquee
  const handleUpdateTicker = (customMsg) => {
    const msg = (typeof customMsg === 'string' ? customMsg : tickerInput).trim();
    if (!msg) return;
    if (typeof customMsg === 'string') setTickerInput(customMsg);
    try {
      localStorage.setItem('biensovip_live_ticker_message', msg);
    } catch {
      // ignore
    }
    channelRef.current?.postMessage({
      type: 'TICKER_NOTICE',
      message: msg,
    });
    toast.success('Đã cập nhật dải chữ chạy Marquee trên OBS!');
  };

  // Lưu nhanh "Khách vừa hỏi trên Live" (LiveAskedLead)
  const handleAddAskedLead = (plateOverride = null) => {
    const targetPlate =
      plateOverride || filteredPlates[selectedRowIndex] || activePlateObj;
    if (!targetPlate) return;

    const nick = leadNicknameInput.trim() || `@khach_live_${askedLeads.length + 1}`;
    const formattedNick = nick.startsWith('@') ? nick : `@${nick}`;
    const cleanPhone = leadPhoneInput.trim();
    const commentText =
      leadNoteInput.trim() ||
      (searchQuery.trim()
        ? `Hỏi: "${searchQuery.trim()}"`
        : `Quan tâm biển ${targetPlate.plateNumber}`);

    const newLead = {
      id: `lead-${Date.now()}`,
      nickname: formattedNick,
      phone: cleanPhone,
      comment: commentText,
      plateId: targetPlate.id,
      plateNumber: targetPlate.plateNumber,
      shortCode: targetPlate.shortCode,
      price: targetPlate.price,
      askedAt: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      syncedToCrm: false,
    };

    const updated = [newLead, ...askedLeads].slice(0, 25);
    setAskedLeads(updated);
    try {
      localStorage.setItem('bsv_live_asked_leads', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setLeadNicknameInput('');
    setLeadPhoneInput('');
    setLeadNoteInput('');
    toast.success(`Đã lưu ${formattedNick} hỏi biển ${targetPlate.plateNumber}!`);
  };

  // Đẩy trực tiếp Lead từ Livestream vào CRM Bán hàng (/api/contact-requests)
  const handlePushLeadToCrm = async (lead) => {
    const rawPhone = String(lead.phone || '').trim();
    if (!rawPhone || !validatePhone(rawPhone)) {
      toast.error('Vui lòng nhập SĐT hợp lệ (10 số, VD: 0905123888) cho khách để đẩy vào CRM Bán hàng.');
      return;
    }

    setPushingLeadId(lead.id);
    try {
      await submitContactMutation.mutateAsync({
        fullName: lead.nickname.replace(/^@/, '') || 'Khách Livestream TikTok',
        phone: normalizePhone(rawPhone),
        email: null,
        plateId: null,
        plateNumber: lead.plateNumber || null,
        note: `[Livestream 9:16] ${lead.comment || ''} (Giá báo: ${lead.price || ''})`,
        source: 'livestream_tiktok',
        intent: 'deposit_request',
        subscribeToNotifications: false,
        honeypot: null,
      });

      const updated = askedLeads.map((item) =>
        item.id === lead.id ? { ...item, syncedToCrm: true } : item
      );
      setAskedLeads(updated);
      try {
        localStorage.setItem('bsv_live_asked_leads', JSON.stringify(updated));
      } catch {
        // ignore
      }

      invalidateSales(qc);
      refetchCrmContacts();
      toast.success(`Đã đẩy ${lead.nickname} (${rawPhone}) vào bảng Kanban Bán hàng!`);
    } catch (err) {
      toast.error(err?.message || 'Không thể đẩy vào CRM, vui lòng thử lại.');
    } finally {
      setPushingLeadId(null);
    }
  };

  const handleRemoveLead = (id) => {
    const updated = askedLeads.filter((l) => l.id !== id);
    setAskedLeads(updated);
    try {
      localStorage.setItem('bsv_live_asked_leads', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Chốt đơn trực tiếp cho khách trong danh sách vừa hỏi
  const handleCloseDealForLead = (lead) => {
    const foundPlate =
      plates.find((p) => p.id === lead.plateId || p.plateNumber === lead.plateNumber) ||
      activePlateObj;
    if (foundPlate) {
      handlePinPlate(foundPlate);
    }
    setBuyerHonorInput(lead.nickname);
    handleTriggerEffect('FX_DEAL_CLOSED', lead.nickname, foundPlate);
  };

  // Tìm hoặc ghim biển số mà khách đang tra cứu Phong thủy / Thả tim trên Web
  const handlePinOrLookupExternalPlate = (rawPlateNumber, customerLabel = '') => {
    if (!rawPlateNumber) return;
    const cleanTarget = String(rawPlateNumber).replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const exactMatch = plates.find(
      (p) => String(p.plateNumber).replace(/[^A-Z0-9]/gi, '').toUpperCase() === cleanTarget
    );

    if (exactMatch) {
      handlePinPlate(exactMatch);
      if (customerLabel) {
        setBuyerHonorInput(customerLabel);
      }
    } else {
      // Gõ vào thanh tìm kiếm thông minh để lọc các biển có đuôi tương đương
      const tailDigits = String(rawPlateNumber).replace(/\D/g, '').slice(-3);
      setSearchQuery(tailDigits || rawPlateNumber);
      toast(`Biển ${rawPlateNumber} chưa có trong rổ, đã tự động lọc các biển có đuôi "${tailDigits}" tương tự!`);
    }
  };

  // Phát mã giảm giá thật từ hệ thống lên OBS Marquee & Hiệu ứng Flash Sale
  const handleBroadcastCoupon = (coupon) => {
    if (!coupon) return;
    const msg = `VOUCHER LIVESTREAM: Nhập mã "${coupon.code}" giảm ngay ${coupon.discountPercent}% khi đặt cọc giữ biển trên biensovip.com • Số lượng có hạn!`;
    handleUpdateTicker(msg);
    handleTriggerEffect('FX_FLASH_DEAL');
  };

  const obsOverlayUrl = `${window.location.origin}/overlay/live-display?obs=1&layout=${layoutMode}`;

  const copyObsUrl = () => {
    navigator.clipboard.writeText(obsOverlayUrl);
    setCopiedToken(true);
    toast.success(`Đã sao chép link OBS (${layoutMode})!`);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const availableCities = useMemo(() => {
    const base = ['ALL', 'Hà Nội', 'TP. HCM', 'Đà Nẵng', 'Quảng Ninh'];
    for (const p of plates) {
      if (p.city && !base.includes(p.city) && base.length < 9) {
        base.push(p.city);
      }
    }
    return base;
  }, [plates]);

  const activeCoupons = useMemo(() => {
    const raw = couponsData?.items || [];
    return raw.filter((c) => c.active);
  }, [couponsData]);

  const fengShuiLiveItems = fengShuiHistoryData?.items || [];
  const interestLiveItems = interestLeadsData?.items || [];
  const recentCrmItems = crmContactsData?.items || [];

  // Tính biên độ giảm tối đa cho phép trên sóng Live của biển đang chọn
  const negotiationMargin = useMemo(() => {
    if (!focusedPlate) return null;
    const retail = Number(focusedPlate.priceNum || 0);
    const floor = Number(focusedPlate.floorPriceNum || 0);
    if (retail > 0 && floor > 0 && retail > floor) {
      return retail - floor;
    }
    return null;
  }, [focusedPlate]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        paddingBottom: 'var(--space-10)',
        animation: 'pageIn 180ms var(--ease-out)',
      }}
    >
      <style>{`
        .bsv-live-table-grid {
          display: grid;
          grid-template-columns: minmax(270px, 1.55fr) minmax(135px, 0.7fr) minmax(150px, 0.75fr) auto;
          align-items: center;
          gap: var(--space-3);
          padding: 12px var(--gutter-card);
        }
        @media (max-width: 1200px) {
          .bsv-live-table-grid {
            grid-template-columns: 1fr auto;
          }
        }
        @media (max-width: 768px) {
          .bsv-live-table-grid {
            grid-template-columns: 1fr;
          }
        }
        .bsv-live-pad-btn:hover {
          background: var(--brand-50) !important;
        }
        .bsv-live-row:hover {
          background: var(--surface-sunken) !important;
        }
      `}</style>

      {/* 1. STUDIO HEADER & MULTI-SOURCE KPI STRIP */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, font: 'var(--type-display-3)', color: 'var(--text-strong)' }}>
              Trợ lý Livestream 9:16 & Trung tâm Tín hiệu Đa kênh
            </h1>
            <Badge tone="rose" dot>
              LIVE {formatTimer(liveDuration)}
            </Badge>
            <Badge tone="amber">
              Tổng {sourceCounts.total} biển ({sourceCounts.shop} Shop • {sourceCounts.vpa} VPA)
            </Badge>
            <Badge tone="mint">Đã ghim {pinnedCount} lượt</Badge>
          </div>
          <p style={{ margin: '4px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Kết nối trực tiếp Kho Biển Shop, Kho Đấu Giá VPA, Lịch sử khách đang Luận giải Phong thủy trên web, Khách thả tim và đẩy Lead thẳng vào Kanban Bán hàng.
          </p>
        </div>

        {/* Header Action Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--white)',
              boxShadow: 'var(--shadow-inset-hairline)',
              padding: '2px',
              position: 'relative',
            }}
          >
            {[
              { mode: '9:16', label: 'Dọc 9:16 (TikTok)', Icon: Smartphone },
              { mode: '16:9', label: 'Ngang 16:9 (FB/YT)', Icon: Monitor },
            ].map(({ mode, label, Icon }) => {
              const active = layoutMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleSwitchLayout(mode)}
                  style={{
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '30px',
                    padding: '0 10px',
                    border: 'none',
                    background: 'transparent',
                    color: active ? 'var(--white)' : 'var(--text-muted)',
                    font: 'var(--type-caption)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    zIndex: 1,
                  }}
                >
                  {active && (
                    <motion.span
                      layoutId="live-layout-mode-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'var(--action-dark)',
                        zIndex: -1,
                      }}
                    />
                  )}
                  <Icon size={13} />
                  {label}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleAdminMute}
            title="Bật/Tắt tiếng hiệu ứng tại máy Admin (độc lập với tiếng trên OBS)"
          >
            {adminMuted ? (
              <VolumeX size={14} color="var(--status-danger)" />
            ) : (
              <Volume2 size={14} color="var(--status-success-ink)" />
            )}
            {adminMuted ? 'Loa Admin: Tắt' : 'Loa Admin: Bật'}
          </Button>

          <Button variant="outline" size="sm" onClick={copyObsUrl}>
            {copiedToken ? <Check size={14} color="var(--status-success-ink)" /> : <Copy size={14} />}
            {copiedToken ? 'Đã chép link OBS' : 'Chép link OBS'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/overlay/live-display?layout=${layoutMode}`, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink size={14} />
            Mở màn hình OBS
          </Button>

          <Button
            variant={showLivePreview ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setShowLivePreview((v) => !v)}
          >
            <Layers size={14} />
            {showLivePreview ? 'Ẩn Preview' : 'Hiện Preview'}
          </Button>

          {activePlateObj && (
            <Button
              variant="dark"
              size="sm"
              onClick={() => setShowcasePlate(activePlateObj)}
              title="Phím tắt: Space"
            >
              <Maximize2 size={14} />
              Phôi 3D (Space)
            </Button>
          )}
        </div>
      </div>

      {/* 2. MULTI-DATA OVERVIEW STRIP (4 Real-Time Data Source Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <div
          onClick={() => setSourceFilter(sourceFilter === 'SHOP' ? 'ALL' : 'SHOP')}
          style={{
            background: sourceFilter === 'SHOP' ? 'var(--brand-50)' : 'var(--white)',
            boxShadow:
              sourceFilter === 'SHOP'
                ? 'inset 0 0 0 1.5px var(--action-primary)'
                : 'var(--shadow-inset-hairline)',
            padding: '12px var(--gutter-card)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ font: 'var(--type-caption)', fontWeight: 700, color: 'var(--text-muted)' }}>
              KHO BIỂN SHOP CÓ SẴN
            </span>
            <Database size={14} color="var(--brand-600)" />
          </div>
          <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: 'var(--text-strong)', fontVariantNumeric: 'tabular-nums' }}>
            {sourceCounts.shop} biển {isLoadingShop && <span style={{ font: 'var(--type-caption)' }}>(đang tải...)</span>}
          </div>
          <div style={{ font: 'var(--type-caption)', color: 'var(--text-subtle)' }}>
            Hồ sơ sẵn sàng sang tên ngay • Bấm để lọc riêng
          </div>
        </div>

        <div
          onClick={() => setSourceFilter(sourceFilter === 'VPA' ? 'ALL' : 'VPA')}
          style={{
            background: sourceFilter === 'VPA' ? 'var(--brand-50)' : 'var(--white)',
            boxShadow:
              sourceFilter === 'VPA'
                ? 'inset 0 0 0 1.5px var(--action-primary)'
                : 'var(--shadow-inset-hairline)',
            padding: '12px var(--gutter-card)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ font: 'var(--type-caption)', fontWeight: 700, color: 'var(--text-muted)' }}>
              KHO BIỂN ĐẤU GIÁ VPA
            </span>
            <Gavel size={14} color="var(--brand-600)" />
          </div>
          <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: 'var(--text-strong)', fontVariantNumeric: 'tabular-nums' }}>
            {sourceCounts.vpa} biển {isLoadingVpa && <span style={{ font: 'var(--type-caption)' }}>(đang tải...)</span>}
          </div>
          <div style={{ font: 'var(--type-caption)', color: 'var(--text-subtle)' }}>
            Đồng bộ trực tiếp danh mục VPA • Bấm để lọc riêng
          </div>
        </div>

        <div
          onClick={() => setSourceFilter(sourceFilter === 'BASKET' ? 'ALL' : 'BASKET')}
          style={{
            background: sourceFilter === 'BASKET' ? 'var(--brand-50)' : 'var(--white)',
            boxShadow:
              sourceFilter === 'BASKET'
                ? 'inset 0 0 0 1.5px var(--action-primary)'
                : 'var(--shadow-inset-hairline)',
            padding: '12px var(--gutter-card)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ font: 'var(--type-caption)', fontWeight: 700, color: 'var(--text-muted)' }}>
              RỔ HÀNG ƯU TIÊN PHIÊN LIVE
            </span>
            <Star size={14} color="var(--action-primary)" fill="var(--action-primary)" />
          </div>
          <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: 'var(--brand-700)', fontVariantNumeric: 'tabular-nums' }}>
            {sourceCounts.basket} biển đã gắn sao
          </div>
          <div style={{ font: 'var(--type-caption)', color: 'var(--text-subtle)' }}>
            Danh sách biển chủ lực chuẩn bị cho ca Live
          </div>
        </div>

        <div
          onClick={() => setRightSignalTab('fengshui')}
          style={{
            background: 'var(--white)',
            boxShadow: 'var(--shadow-inset-hairline)',
            padding: '12px var(--gutter-card)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ font: 'var(--type-caption)', fontWeight: 700, color: 'var(--text-muted)' }}>
              TÍN HIỆU KHÁCH TRỰC TUYẾN
            </span>
            <Sparkles size={14} color="var(--status-success-ink)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
            <Badge tone="amber">{fengShuiLiveItems.length} luận giải</Badge>
            <Badge tone="rose">{interestLiveItems.length} thả tim</Badge>
            <Badge tone="mint">{activeCoupons.length} voucher</Badge>
          </div>
          <div style={{ font: 'var(--type-caption)', color: 'var(--text-subtle)', marginTop: 'auto' }}>
            Khách đang tương tác thực tế trên biensovip.com
          </div>
        </div>
      </div>

      {/* 3. KEYBOARD SOUNDBOARD & VFX DECK */}
      <div
        style={{
          background: 'var(--white)',
          boxShadow: 'var(--shadow-inset-hairline)',
        }}
      >
        <div
          style={{
            padding: 'var(--space-3) var(--gutter-card)',
            boxShadow: 'inset 0 -1px 0 var(--border-hairline)',
            background: 'var(--surface-sunken)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Keyboard size={16} color="var(--brand-600)" />
            <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
              Bàn đạo diễn hiệu ứng & âm thanh (VFX + SFX)
            </span>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Nhấn phím <kbd style={kbdStyle}>1–6</kbd> hoặc <kbd style={kbdStyle}>F1–F6</kbd> mọi lúc •{' '}
              <kbd style={kbdStyle}>0</kbd> / <kbd style={kbdStyle}>Esc</kbd> để dừng
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={buyerHonorInput}
              onChange={(e) => setBuyerHonorInput(e.target.value)}
              placeholder="Tên khách vinh danh khi bấm Phím 1 (VD: @anh_tuan)..."
              style={{
                width: '260px',
                maxWidth: '100%',
                height: '32px',
                padding: '0 10px',
                border: '1px solid var(--border-default)',
                background: 'var(--white)',
                color: 'var(--text-strong)',
                font: 'var(--type-body-sm)',
                outline: 'none',
              }}
            />
            <Button variant="outline" size="sm" onClick={() => handleTriggerEffect('FX_STOP_ALL')}>
              <StopCircle size={14} color="var(--status-danger)" />
              Dừng (0 / Esc)
            </Button>
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-3) var(--gutter-card)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
            gap: 'var(--space-2)',
          }}
        >
          {LIVE_EFFECT_DECK.map((fx) => {
            const isPlaying = activeEffectCode === fx.code;
            return (
              <motion.button
                key={fx.code}
                type="button"
                className="bsv-live-pad-btn"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                onClick={() => handleTriggerEffect(fx.code)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '4px',
                  padding: '10px 12px',
                  background: isPlaying ? 'var(--brand-50)' : 'var(--surface-sunken)',
                  boxShadow: isPlaying
                    ? 'inset 0 0 0 1.5px var(--action-primary)'
                    : 'var(--shadow-inset-hairline)',
                  border: 'none',
                  borderTop: `3px solid ${fx.accent || 'var(--action-primary)'}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '16px', lineHeight: 1 }}>{fx.emoji}</span>
                    {isPlaying && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'flex-end',
                          gap: '2px',
                          height: '12px',
                        }}
                        aria-hidden="true"
                      >
                        {[0, 0.15, 0.3].map((delay, barIdx) => (
                          <motion.span
                            key={barIdx}
                            animate={{ scaleY: [0.35, 1, 0.4, 0.95, 0.35] }}
                            transition={{ duration: 0.65, repeat: Infinity, delay }}
                            style={{
                              width: '2.5px',
                              height: '12px',
                              background: 'var(--action-primary)',
                              transformOrigin: 'bottom',
                              display: 'inline-block',
                            }}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      background: isPlaying ? 'var(--action-primary)' : 'var(--white)',
                      color: isPlaying ? 'var(--white)' : 'var(--text-body)',
                      boxShadow: 'var(--shadow-inset-hairline)',
                    }}
                  >
                    Phím {fx.key} / {fx.fKey}
                  </span>
                </div>
                <div
                  style={{
                    font: 'var(--type-body-sm)',
                    fontWeight: 700,
                    color: 'var(--text-strong)',
                    marginTop: '2px',
                  }}
                >
                  {fx.label}
                </div>
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  {fx.subLabel}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 4. MAIN WORKSPACE: LEFT (6-DIMENSIONAL SMART LOOKUP, TELEPROMPTER & PLATE TABLE) + RIGHT (RESIZABLE PREVIEW & 3-TAB LIVE SIGNALS) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: showLivePreview ? `minmax(0, 1fr) ${previewWidth}px` : '1fr',
          gap: 'var(--space-4)',
          alignItems: 'start',
          userSelect: isResizingPreview ? 'none' : 'auto',
        }}
      >
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minWidth: 0 }}>
          {/* LIVE TELEPROMPTER & MARKET BENCHMARK BAR FOR FOCUSED PLATE */}
          <AnimatePresence mode="wait">
            {focusedPlate && (
              <motion.div
                key={focusedPlate.id || focusedPlate.plateNumber}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                style={{
                  background: 'var(--surface-tint-cream)',
                  boxShadow: 'var(--shadow-inset-hairline)',
                  borderLeft: '3px solid var(--action-primary)',
                  padding: '12px var(--gutter-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 'var(--space-2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <Mic size={15} color="var(--brand-600)" />
                    <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
                      Trợ lý Kịch bản Đọc Sóng (Teleprompter): {focusedPlate.plateNumber}
                    </span>
                    <Badge tone="amber">{focusedPlate.nut || 9} nút</Badge>
                    {(focusedPlate.elements || []).map((el) => (
                      <Badge key={el} tone="neutral">
                        Hợp mệnh {el}
                      </Badge>
                    ))}
                    {negotiationMargin && (
                      <Badge tone="rose">
                        <Lock size={10} /> Biên độ bớt tối đa: {formatVndPrice(negotiationMargin)}
                      </Badge>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleUpdateTicker(
                          `ĐANG LÊN SÓNG: Biển ${focusedPlate.plateNumber} (${focusedPlate.city} • ${focusedPlate.cat}) — Giá niêm yết ${focusedPlate.price} • Nhập mã ${focusedPlate.shortCode} tại biensovip.com`
                        )
                      }
                    >
                      <Send size={12} />
                      Đẩy biển này lên chữ chạy
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => handlePinPlate(focusedPlate)}>
                      <Play size={12} fill="currentColor" />
                      Ghim lên OBS
                    </Button>
                  </div>
                </div>

                <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)', lineHeight: 1.5 }}>
                  <strong>Lời dẫn gợi ý đọc mic:</strong>{' '}
                  <em>
                    &ldquo;Anh chị đang xem trên màn hình là siêu phẩm <b>{focusedPlate.plateNumber}</b> đầu số{' '}
                    <b>{focusedPlate.city}</b> ({focusedPlate.cat}). Biển đạt <b>{focusedPlate.nut || 9} nút</b>, cực vượng cho chủ nhân mệnh{' '}
                    <b>{(focusedPlate.elements || []).join(' & ')}</b> — {focusedPlate.fengshui}.{' '}
                    {comparableAuctionResult
                      ? `Trên sàn đấu giá VPA vừa qua, biển tương đương ${comparableAuctionResult.plateNumber} đã trúng ở mức ${formatVndPrice(comparableAuctionResult.auctionPrice || comparableAuctionResult.winningPrice)}. `
                      : ''}
                    Giá niêm yết tại shop là <b>{focusedPlate.price}</b>, anh chị gõ mã <b>{focusedPlate.shortCode}</b> hoặc để lại 4 số cuối SĐT để nhận ưu đãi riêng trên phiên Live!&rdquo;
                  </em>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* UNIFIED ADMIN CARD FOR 6-DIMENSIONAL SMART LOOKUP & PLATE TABLE */}
          <div
            style={{
              background: 'var(--white)',
              boxShadow: 'var(--shadow-inset-hairline)',
              minWidth: 0,
            }}
          >
            {/* Search & 6-Dimensional Filter Control Header */}
            <div
              style={{
                padding: 'var(--gutter-card)',
                boxShadow: 'inset 0 -1px 0 var(--border-hairline)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 'var(--space-2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Search size={16} color="var(--brand-600)" />
                  <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
                    Trình tra cứu bình luận thông minh 3-trong-1 & Bộ lọc 6 chiều (&lt; 15ms)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    Phím tắt: <kbd style={kbdStyle}>/</kbd> tìm • <kbd style={kbdStyle}>↑↓</kbd> chọn •{' '}
                    <kbd style={kbdStyle}>Enter</kbd> ghim • <kbd style={kbdStyle}>Space</kbd> 3D
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      refetchShopPlates();
                      refetchVpaPlates();
                      toast.success('Đã đồng bộ lại dữ liệu Kho Shop & Kho VPA');
                    }}
                    title="Làm mới dữ liệu kho"
                  >
                    <RefreshCw size={13} />
                  </Button>
                </div>
              </div>

              {/* Search Input Box */}
              <div style={{ position: 'relative' }}>
                <Search
                  size={17}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Gõ tắt "30 68", Năm sinh "1990", mã "#B101", hoặc dán cả câu comment "Sài Gòn ngũ quý tầm 2 tỷ"...'
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 72px 0 38px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface-sunken)',
                    font: 'var(--type-body-md)',
                    fontWeight: 500,
                    color: 'var(--text-strong)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      height: '26px',
                      padding: '0 10px',
                      background: 'var(--white)',
                      boxShadow: 'var(--shadow-inset-hairline)',
                      border: 'none',
                      color: 'var(--text-body)',
                      cursor: 'pointer',
                      font: 'var(--type-caption)',
                      fontWeight: 600,
                    }}
                  >
                    Xóa
                  </button>
                )}
              </div>

              {/* Sample Comment Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                <span style={{ font: 'var(--type-caption)', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Thử nhanh comment khách:
                </span>
                {QUICK_SAMPLE_COMMENTS.map((chip) => {
                  const active = searchQuery === chip.query;
                  return (
                    <button
                      key={chip.query}
                      type="button"
                      onClick={() => setSearchQuery(chip.query)}
                      style={{
                        padding: '4px 10px',
                        font: 'var(--type-caption)',
                        fontWeight: 600,
                        background: active ? 'var(--brand-50)' : 'var(--surface-sunken)',
                        color: active ? 'var(--brand-700)' : 'var(--text-body)',
                        boxShadow: active
                          ? 'inset 0 0 0 1px var(--action-primary)'
                          : 'var(--shadow-inset-hairline)',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>

              {/* Extracted Smart Filter Badges */}
              {parsedSearch.extractedTokens.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: '8px 12px',
                    background: 'var(--surface-tint-cream)',
                    boxShadow: 'var(--shadow-inset-hairline)',
                  }}
                >
                  <span style={{ font: 'var(--type-caption)', fontWeight: 700, color: 'var(--brand-700)' }}>
                    Đã bóc tách tự động:
                  </span>
                  {parsedSearch.extractedTokens.map((tk, i) => (
                    <Badge key={i} tone="amber">
                      {tk.label}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Fengshui Streamer Talking Script Banner (When Birth Year 1950-2015 is typed) */}
              {parsedSearch.birthYearInfo && (
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'var(--surface-tint-cream)',
                    boxShadow: 'var(--shadow-inset-hairline)',
                    borderLeft: '3px solid var(--action-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        font: 'var(--type-body-sm)',
                        fontWeight: 700,
                        color: 'var(--brand-700)',
                      }}
                    >
                      <Compass size={16} color="var(--brand-600)" />
                      <span>
                        Kịch bản đọc phong thủy cho khách sinh năm {parsedSearch.birthYearInfo.year} (
                        {parsedSearch.birthYearInfo.canChi} • Mệnh {parsedSearch.birthYearInfo.menh})
                      </span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        handleUpdateTicker(
                          `Tư vấn tuổi ${parsedSearch.birthYearInfo.year} (${parsedSearch.birthYearInfo.canChi} - Mệnh ${parsedSearch.birthYearInfo.menh}): Hợp số ${parsedSearch.birthYearInfo.luckyLabel} • Hotline: 0815.792.699`
                        )
                      }
                    >
                      <Send size={12} />
                      Đẩy lên chữ chạy OBS
                    </Button>
                  </div>
                  <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)', fontStyle: 'italic' }}>
                    &ldquo;{parsedSearch.birthYearInfo.talkingScript}&rdquo;
                  </div>
                </div>
              )}

              {/* ROW 1 OF FILTERS: Nguồn kho + Loại xe + Khoảng giá + Ngũ hành */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                <span style={{ font: 'var(--type-caption)', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Nguồn:
                </span>
                {[
                  { key: 'ALL', label: `Tất cả (${sourceCounts.total})` },
                  { key: 'BASKET', label: `Rổ Live (${sourceCounts.basket})` },
                  { key: 'SHOP', label: `Kho Shop (${sourceCounts.shop})` },
                  { key: 'VPA', label: `Đấu giá VPA (${sourceCounts.vpa})` },
                ].map((sItem) => {
                  const active = sourceFilter === sItem.key;
                  return (
                    <button
                      key={sItem.key}
                      type="button"
                      onClick={() => setSourceFilter(sItem.key)}
                      style={{
                        padding: '4px 9px',
                        font: 'var(--type-caption)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: active ? 'var(--action-dark)' : 'var(--surface-sunken)',
                        color: active ? 'var(--white)' : 'var(--text-body)',
                        boxShadow: active ? 'none' : 'var(--shadow-inset-hairline)',
                        border: 'none',
                      }}
                    >
                      {sItem.label}
                    </button>
                  );
                })}

                <div style={{ width: '1px', height: '16px', background: 'var(--border-default)', margin: '0 2px' }} />

                <span style={{ font: 'var(--type-caption)', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Xe:
                </span>
                {['ALL', 'Ô tô', 'Xe máy'].map((v) => {
                  const active = vehicleFilter === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVehicleFilter(v)}
                      style={{
                        padding: '4px 9px',
                        font: 'var(--type-caption)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: active ? 'var(--action-dark)' : 'var(--surface-sunken)',
                        color: active ? 'var(--white)' : 'var(--text-body)',
                        boxShadow: active ? 'none' : 'var(--shadow-inset-hairline)',
                        border: 'none',
                      }}
                    >
                      {v === 'ALL' ? 'Mọi xe' : v}
                    </button>
                  );
                })}

                <div style={{ width: '1px', height: '16px', background: 'var(--border-default)', margin: '0 2px' }} />

                <span style={{ font: 'var(--type-caption)', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Giá:
                </span>
                {[
                  { key: 'ALL', label: 'Mọi giá' },
                  { key: 'UNDER_100M', label: '< 100tr' },
                  { key: '100M_300M', label: '100–300tr' },
                  { key: '300M_800M', label: '300–800tr' },
                  { key: 'OVER_800M', label: '> 800tr' },
                ].map((pr) => {
                  const active = priceRangeFilter === pr.key;
                  return (
                    <button
                      key={pr.key}
                      type="button"
                      onClick={() => setPriceRangeFilter(pr.key)}
                      style={{
                        padding: '4px 9px',
                        font: 'var(--type-caption)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: active ? 'var(--action-primary)' : 'var(--surface-sunken)',
                        color: active ? 'var(--white)' : 'var(--text-body)',
                        boxShadow: active ? 'none' : 'var(--shadow-inset-hairline)',
                        border: 'none',
                      }}
                    >
                      {pr.label}
                    </button>
                  );
                })}

                <div style={{ width: '1px', height: '16px', background: 'var(--border-default)', margin: '0 2px' }} />

                <span style={{ font: 'var(--type-caption)', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Mệnh:
                </span>
                {['ALL', 'Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'].map((el) => {
                  const active = elementFilter === el;
                  return (
                    <button
                      key={el}
                      type="button"
                      onClick={() => setElementFilter(el)}
                      style={{
                        padding: '4px 8px',
                        font: 'var(--type-caption)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: active ? 'var(--action-primary)' : 'var(--surface-sunken)',
                        color: active ? 'var(--white)' : 'var(--text-body)',
                        boxShadow: active ? 'none' : 'var(--shadow-inset-hairline)',
                        border: 'none',
                      }}
                    >
                      {el === 'ALL' ? 'Tất cả' : el}
                    </button>
                  );
                })}
              </div>

              {/* ROW 2 OF FILTERS: Tỉnh/Thành & Thế số */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                <span style={{ font: 'var(--type-caption)', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Tỉnh:
                </span>
                {availableCities.map((c) => {
                  const active = cityFilter === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCityFilter(c)}
                      style={{
                        padding: '4px 10px',
                        font: 'var(--type-caption)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: active ? 'var(--action-dark)' : 'var(--surface-sunken)',
                        color: active ? 'var(--white)' : 'var(--text-body)',
                        boxShadow: active ? 'none' : 'var(--shadow-inset-hairline)',
                        border: 'none',
                      }}
                    >
                      {c === 'ALL' ? 'Tất cả' : c}
                    </button>
                  );
                })}

                <div
                  style={{
                    width: '1px',
                    height: '16px',
                    background: 'var(--border-default)',
                    margin: '0 4px',
                  }}
                />

                <span style={{ font: 'var(--type-caption)', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Thế số:
                </span>
                {['ALL', 'Ngũ quý', 'Tứ quý', 'Tam hoa', 'Lộc phát', 'Thần tài', 'Sảnh tiến'].map((cat) => {
                  const active = catFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCatFilter(cat)}
                      style={{
                        padding: '4px 10px',
                        font: 'var(--type-caption)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: active ? 'var(--action-primary)' : 'var(--surface-sunken)',
                        color: active ? 'var(--white)' : 'var(--text-body)',
                        boxShadow: active ? 'none' : 'var(--shadow-inset-hairline)',
                        border: 'none',
                      }}
                    >
                      {cat === 'ALL' ? 'Tất cả' : cat}
                    </button>
                  );
                })}

                <span
                  style={{
                    marginLeft: 'auto',
                    font: 'var(--type-caption)',
                    color: 'var(--text-muted)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  Khớp <strong style={{ color: 'var(--text-strong)' }}>{filteredPlates.length}</strong> biển
                </span>
              </div>
            </div>

            {/* Table Column Header */}
            <div
              className="bsv-live-table-grid"
              style={{
                background: 'var(--grey-50)',
                borderBottom: '1px solid var(--grey-200)',
                paddingTop: '9px',
                paddingBottom: '9px',
                font: 'var(--type-caption)',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <div>Biển số, Nguồn kho & Phong thủy</div>
              <div>Giá niêm yết (OBS)</div>
              <div>Giá đáy nội bộ (BR-LIVE-01)</div>
              <div style={{ textAlign: 'right' }}>Thao tác sóng Live</div>
            </div>

            {/* Plate Rows */}
            <div>
              {filteredPlates.length === 0 ? (
                <div
                  style={{
                    padding: 'var(--space-8)',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    font: 'var(--type-body-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div>Không tìm thấy biển số nào khớp với bộ lọc hiện tại.</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setSourceFilter('ALL');
                      setVehicleFilter('ALL');
                      setPriceRangeFilter('ALL');
                      setElementFilter('ALL');
                      setCityFilter('ALL');
                      setCatFilter('ALL');
                    }}
                  >
                    Đặt lại toàn bộ bộ lọc
                  </Button>
                </div>
              ) : (
                filteredPlates.slice(0, 30).map((plate, idx) => {
                  const isPinned = activePlateId === plate.id;
                  const isSelectedRow = idx === selectedRowIndex;
                  const inBasket = basketIds.includes(plate.id);

                  return (
                    <div
                      key={plate.id}
                      onClick={() => setSelectedRowIndex(idx)}
                      className="bsv-live-table-grid bsv-live-row"
                      style={{
                        position: 'relative',
                        borderTop: idx === 0 ? 'none' : '1px solid var(--grey-100)',
                        background: isPinned
                          ? 'var(--brand-50)'
                          : isSelectedRow
                            ? 'var(--surface-sunken)'
                            : 'var(--white)',
                        borderLeft: isPinned
                          ? '3px solid transparent'
                          : isSelectedRow
                            ? '3px solid var(--ink-900)'
                            : '3px solid transparent',
                        cursor: 'pointer',
                        transition: 'background 120ms var(--ease-out)',
                      }}
                    >
                      {isPinned && (
                        <motion.span
                          layoutId="live-pinned-row-bar"
                          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '3.5px',
                            background: 'var(--action-primary)',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                      {/* COLUMN 1: Star Basket + Embossed PlateVisual + Metadata + Fengshui */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBasketPlate(plate.id);
                          }}
                          title={inBasket ? 'Bỏ khỏi Rổ hàng Live' : 'Đánh dấu vào Rổ hàng Live'}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '4px',
                            cursor: 'pointer',
                            color: inBasket ? 'var(--action-primary)' : 'var(--border-strong)',
                            display: 'inline-flex',
                            flexShrink: 0,
                          }}
                        >
                          <Star size={15} fill={inBasket ? 'var(--action-primary)' : 'none'} />
                        </button>

                        <div style={{ width: '128px', flexShrink: 0 }}>
                          <PlateVisual
                            size="md"
                            shape="long"
                            prov={plate.prov}
                            seri={plate.seri}
                            num={plate.num}
                          />
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                            <Badge tone="neutral">{plate.city}</Badge>
                            <Badge tone="amber">{plate.shortCode}</Badge>
                            <Badge
                              tone={
                                plate.source === 'VPA'
                                  ? 'blue'
                                  : plate.source === 'SHOP'
                                    ? 'mint'
                                    : 'amber'
                              }
                            >
                              {plate.sourceLabel}
                            </Badge>
                            <Badge tone="neutral">{plate.nut || 9} nút</Badge>
                            {(plate.elements || []).slice(0, 2).map((el) => (
                              <Badge key={el} tone="neutral">
                                Mệnh {el}
                              </Badge>
                            ))}
                            {isPinned && (
                              <Badge tone="rose" dot>
                                Đang lên sóng
                              </Badge>
                            )}
                          </div>
                          <div
                            style={{
                              font: 'var(--type-body-sm)',
                              color: 'var(--text-muted)',
                              marginTop: '4px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={`${plate.cat} • ${plate.fengshui}`}
                          >
                            <strong style={{ color: 'var(--text-body)', fontWeight: 600 }}>
                              {plate.cat} ({plate.vehicle})
                            </strong>{' '}
                            • {plate.fengshui}
                          </div>
                        </div>
                      </div>

                      {/* COLUMN 2: Retail Price (OBS Visible) */}
                      <div>
                        <div
                          style={{
                            font: 'var(--type-title-3)',
                            fontWeight: 700,
                            color: 'var(--status-success-ink)',
                            fontVariantNumeric: 'tabular-nums',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {plate.price}
                        </div>
                        <div style={{ font: 'var(--type-caption)', color: 'var(--text-subtle)' }}>
                          {plate.source === 'VPA' && plate.sampleCount > 0
                            ? `${plate.sampleCount} mẫu đấu giá VPA`
                            : 'Hiển thị trên OBS'}
                        </div>
                      </div>

                      {/* COLUMN 3: Secret Floor Price (Internal Only per BR-LIVE-01) */}
                      <div title="Quy tắc BR-LIVE-01: Giá đáy nội bộ tuyệt đối không hiển thị lên OBS">
                        <Badge tone="rose">
                          <Lock size={11} />
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontVariantNumeric: 'tabular-nums',
                              fontWeight: 700,
                            }}
                          >
                            {plate.floorPrice}
                          </span>
                        </Badge>
                        <div
                          style={{
                            font: 'var(--type-caption)',
                            color: 'var(--text-subtle)',
                            marginTop: '2px',
                          }}
                        >
                          {plate.priceNum > plate.floorPriceNum && plate.floorPriceNum > 0
                            ? `Biên độ: -${formatVndPrice(plate.priceNum - plate.floorPriceNum)}`
                            : 'Chỉ Admin thấy'}
                        </div>
                      </div>

                      {/* COLUMN 4: Row Quick Actions */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '6px',
                        }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowcasePlate(plate);
                          }}
                          title="Phóng to phôi 3D toàn màn hình (Space)"
                        >
                          <Maximize2 size={13} />
                          3D
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePinPlate(plate);
                            handleTriggerEffect('FX_DEAL_CLOSED', null, plate);
                          }}
                          title="Ghim biển này kèm hiệu ứng Chốt Đơn"
                        >
                          <PartyPopper size={13} color="var(--brand-600)" />
                          Chốt
                        </Button>

                        {isPinned ? (
                          <Button
                            variant="dark"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnpinPlate();
                            }}
                          >
                            <Square size={12} fill="currentColor" />
                            Bỏ ghim
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePinPlate(plate);
                            }}
                          >
                            <Play size={12} fill="currentColor" />
                            Ghim Live
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RESIZABLE 9:16 PREVIEW CARD + 3-TAB REALTIME CUSTOMER SIGNAL CENTER */}
        {showLivePreview && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
              position: 'sticky',
              top: '16px',
            }}
          >
            {/* Left-Edge Drag Handle to Resize Preview Column Width */}
            <div
              onMouseDown={handleStartResizePreview}
              title="Kéo sang trái/phải để điều chỉnh độ rộng cột Preview"
              style={{
                position: 'absolute',
                left: '-10px',
                top: 0,
                bottom: 0,
                width: '8px',
                cursor: 'col-resize',
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '3px',
                  height: '72px',
                  background: isResizingPreview ? 'var(--action-primary)' : 'var(--border-strong)',
                  transition: 'background 150ms var(--ease-out)',
                }}
              />
            </div>

            {/* Card 1: 9:16 / 16:9 Live Preview Monitor */}
            <div
              style={{
                background: 'var(--white)',
                boxShadow: 'var(--shadow-inset-hairline)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: 'var(--space-3) var(--gutter-card)',
                  background: 'var(--surface-sunken)',
                  boxShadow: 'inset 0 -1px 0 var(--border-hairline)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      font: 'var(--type-title-3)',
                      color: 'var(--text-strong)',
                    }}
                  >
                    <Smartphone size={15} color="var(--brand-600)" />
                    <span>Mô phỏng màn hình ({layoutMode})</span>
                  </div>

                  {layoutMode === '9:16' && (
                    <button
                      type="button"
                      onClick={handleToggleSafeZoneGuide}
                      style={{
                        padding: '3px 8px',
                        background: showSafeZoneGuide ? 'var(--action-dark)' : 'var(--white)',
                        color: showSafeZoneGuide ? 'var(--white)' : 'var(--text-body)',
                        boxShadow: showSafeZoneGuide ? 'none' : 'var(--shadow-inset-hairline)',
                        border: 'none',
                        font: 'var(--type-caption)',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {showSafeZoneGuide ? 'Ẩn khung TikTok' : 'Hiện khung TikTok'}
                    </button>
                  )}
                </div>

                {/* Width Resizer Controls */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    paddingTop: '6px',
                    borderTop: '1px solid var(--border-hairline)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      font: 'var(--type-caption)',
                      color: 'var(--text-muted)',
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <SlidersHorizontal size={12} />
                    Rộng {previewWidth}px
                  </span>
                  <input
                    type="range"
                    min={320}
                    max={520}
                    step={10}
                    value={previewWidth}
                    onChange={(e) => updatePreviewWidth(Number(e.target.value))}
                    style={{
                      flex: 1,
                      accentColor: 'var(--action-primary)',
                      cursor: 'pointer',
                      height: '4px',
                    }}
                    title="Kéo thanh trượt để chỉnh độ rộng khung Preview"
                  />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[
                      { label: 'Nhỏ', w: 340 },
                      { label: 'Vừa', w: 390 },
                      { label: 'Rộng', w: 460 },
                    ].map((preset) => {
                      const active = Math.abs(previewWidth - preset.w) <= 10;
                      return (
                        <button
                          key={preset.w}
                          type="button"
                          onClick={() => updatePreviewWidth(preset.w)}
                          style={{
                            padding: '2px 7px',
                            background: active ? 'var(--action-primary)' : 'var(--white)',
                            color: active ? 'var(--white)' : 'var(--text-body)',
                            boxShadow: active ? 'none' : 'var(--shadow-inset-hairline)',
                            border: 'none',
                            font: 'var(--type-caption)',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ padding: 'var(--space-2)', background: 'var(--surface-sunken)' }}>
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: layoutMode === '9:16' ? '555px' : '295px',
                    background: '#070B14',
                    boxShadow: 'var(--shadow-inset-hairline)',
                    overflow: 'hidden',
                  }}
                >
                  <LiveDisplayOverlay
                    embedded
                    forcedLayoutMode={layoutMode}
                    forcedSafeZoneGuide={showSafeZoneGuide}
                  />
                </div>
              </div>
            </div>

            {/* Card 2: 3-TAB REALTIME CUSTOMER SIGNAL CENTER (Leads + Web FengShui Lookups + Interest & Coupons) */}
            <div
              style={{
                background: 'var(--white)',
                boxShadow: 'var(--shadow-inset-hairline)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Segmented 3-Tab Header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  background: 'var(--surface-sunken)',
                  boxShadow: 'inset 0 -1px 0 var(--border-hairline)',
                }}
              >
                {[
                  {
                    key: 'leads',
                    label: `Khách hỏi (${askedLeads.length})`,
                    Icon: MessageSquarePlus,
                  },
                  {
                    key: 'fengshui',
                    label: `Luận giải (${fengShuiLiveItems.length})`,
                    Icon: ScrollText,
                  },
                  {
                    key: 'interest',
                    label: `Thả tim & Mã (${interestLiveItems.length})`,
                    Icon: Heart,
                  },
                ].map((tab) => {
                  const active = rightSignalTab === tab.key;
                  const TabIcon = tab.Icon;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setRightSignalTab(tab.key)}
                      style={{
                        position: 'relative',
                        padding: '10px 6px',
                        border: 'none',
                        background: active ? 'var(--white)' : 'transparent',
                        color: active ? 'var(--text-strong)' : 'var(--text-muted)',
                        font: 'var(--type-caption)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <TabIcon size={12} color={active ? 'var(--brand-600)' : 'currentColor'} />
                      <span>{tab.label}</span>
                      {active && (
                        <motion.span
                          layoutId="live-signal-tab-indicator"
                          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: '2px',
                            background: 'var(--action-primary)',
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: KHÁCH VỪA HỎI TRÊN LIVE + ĐẨY VÀO CRM BÁN HÀNG */}
              {rightSignalTab === 'leads' && (
                <>
                  <div
                    style={{
                      padding: 'var(--space-3) var(--gutter-card)',
                      boxShadow: 'inset 0 -1px 0 var(--border-hairline)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        value={leadNicknameInput}
                        onChange={(e) => setLeadNicknameInput(e.target.value)}
                        placeholder="@nickname khách..."
                        style={{
                          flex: 1,
                          minWidth: 0,
                          height: '32px',
                          padding: '0 8px',
                          border: '1px solid var(--border-default)',
                          background: 'var(--surface-sunken)',
                          font: 'var(--type-body-sm)',
                          color: 'var(--text-strong)',
                          outline: 'none',
                        }}
                      />
                      <input
                        type="text"
                        value={leadPhoneInput}
                        onChange={(e) => setLeadPhoneInput(e.target.value)}
                        placeholder="SĐT (để đẩy CRM)..."
                        style={{
                          width: '125px',
                          height: '32px',
                          padding: '0 8px',
                          border: '1px solid var(--border-default)',
                          background: 'var(--surface-sunken)',
                          font: 'var(--type-body-sm)',
                          color: 'var(--text-strong)',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        value={leadNoteInput}
                        onChange={(e) => setLeadNoteInput(e.target.value)}
                        placeholder={`Ghi chú (gắn biển ${activePlateObj?.plateNumber || ''})...`}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          height: '32px',
                          padding: '0 8px',
                          border: '1px solid var(--border-default)',
                          background: 'var(--surface-sunken)',
                          font: 'var(--type-body-sm)',
                          color: 'var(--text-strong)',
                          outline: 'none',
                        }}
                      />
                      <Button variant="dark" size="sm" onClick={() => handleAddAskedLead()}>
                        <UserPlus size={13} />
                        Lưu
                      </Button>
                    </div>
                  </div>

                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <AnimatePresence initial={false}>
                      {askedLeads.map((lead, idx) => (
                        <motion.div
                          key={lead.id}
                          layout
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -16 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                          style={{
                            padding: '10px var(--gutter-card)',
                            borderTop: idx === 0 ? 'none' : '1px solid var(--grey-100)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                          }}
                        >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ font: 'var(--type-body-sm)', fontWeight: 700, color: 'var(--text-strong)' }}>
                              {lead.nickname}
                            </span>
                            {lead.phone && (
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                                {lead.phone}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Badge tone="amber">{lead.plateNumber}</Badge>
                            <button
                              type="button"
                              onClick={() => handleRemoveLead(lead.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-subtle)',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'inline-flex',
                              }}
                              title="Xóa"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                          {lead.comment}
                        </div>

                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const p = plates.find(
                                (item) => item.id === lead.plateId || item.plateNumber === lead.plateNumber
                              );
                              if (p) handlePinPlate(p);
                            }}
                          >
                            <Play size={11} />
                            Ghim
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleCloseDealForLead(lead)}
                          >
                            <PartyPopper size={11} />
                            Chốt
                          </Button>
                          {lead.syncedToCrm ? (
                            <Badge tone="mint">Đã đẩy CRM</Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={pushingLeadId === lead.id}
                              onClick={() => handlePushLeadToCrm(lead)}
                              title="Tạo liên hệ thật vào trang Bán hàng (Kanban CRM)"
                            >
                              <ArrowUpRight size={12} />
                              {pushingLeadId === lead.id ? 'Đang đẩy...' : 'Đẩy CRM'}
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    </AnimatePresence>
                  </div>

                  {/* Recent CRM Contacts Footer */}
                  {recentCrmItems.length > 0 && (
                    <div
                      style={{
                        padding: '8px var(--gutter-card)',
                        background: 'var(--surface-sunken)',
                        borderTop: '1px solid var(--border-hairline)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                        CRM hiện có <strong>{crmContactsData?.total || recentCrmItems.length}</strong> yêu cầu liên hệ
                      </span>
                      {go && (
                        <button
                          type="button"
                          onClick={go('asales')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--brand-700)',
                            font: 'var(--type-caption)',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Mở Bán hàng →
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: KHÁCH ĐANG TRA CỨU LUẬN GIẢI PHONG THỦY TRÊN WEB (/luan-bien-so) */}
              {rightSignalTab === 'fengshui' && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      padding: '8px var(--gutter-card)',
                      background: 'var(--surface-tint-cream)',
                      boxShadow: 'inset 0 -1px 0 var(--border-hairline)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-body)' }}>
                      Lượt khách vừa tra cứu tại <strong>/luan-bien-so</strong>
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => refetchFengShui()}>
                      <RefreshCw size={12} className={isFetchingFs ? 'animate-spin' : ''} />
                    </Button>
                  </div>

                  <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                    {fengShuiLiveItems.length === 0 ? (
                      <div style={{ padding: 'var(--space-6)', textAlign: 'center', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                        Chưa có lượt luận giải mới trên website.
                      </div>
                    ) : (
                      fengShuiLiveItems.map((fsItem, idx) => (
                        <div
                          key={fsItem.id || idx}
                          style={{
                            padding: '10px var(--gutter-card)',
                            borderTop: idx === 0 ? 'none' : '1px solid var(--grey-100)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '5px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-strong)' }}>
                              {fsItem.plateNumberRaw}
                            </strong>
                            <Badge tone="mint">
                              {fsItem.score || 90}đ • {fsItem.scoreTier || 'Đại Cát'}
                            </Badge>
                          </div>
                          <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                            Khách: <strong>{fsItem.fullName || 'Khách vãng lai'}</strong> •{' '}
                            {fsItem.vehicleType || 'Ô tô'}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                            <Button
                              variant="primary"
                              size="sm"
                              style={{ flex: 1 }}
                              onClick={() =>
                                handlePinOrLookupExternalPlate(fsItem.plateNumberRaw, fsItem.fullName)
                              }
                            >
                              <Play size={11} />
                              Ghim / Tìm biển tương tự
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: KHÁCH THẢ TIM / XEM LẠI & PHÁT MÃ GIẢM GIÁ (COUPONS) */}
              {rightSignalTab === 'interest' && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Active Coupons Sub-panel */}
                  <div
                    style={{
                      padding: '10px var(--gutter-card)',
                      background: 'var(--surface-tint-cream)',
                      boxShadow: 'inset 0 -1px 0 var(--border-hairline)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', font: 'var(--type-caption)', fontWeight: 700, color: 'var(--brand-700)' }}>
                      <TicketPercent size={13} />
                      <span>VOUCHER KHUYẾN MÃI (1-CLICK TUNG LÊN SÓNG)</span>
                    </div>
                    {activeCoupons.length === 0 ? (
                      <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                        Chưa có mã giảm giá đang bật.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {activeCoupons.slice(0, 3).map((cp) => (
                          <div
                            key={cp.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: 'var(--white)',
                              padding: '6px 8px',
                              boxShadow: 'var(--shadow-inset-hairline)',
                            }}
                          >
                            <div>
                              <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-strong)' }}>
                                {cp.code}
                              </strong>{' '}
                              <Badge tone="amber">-{cp.discountPercent}%</Badge>
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleBroadcastCoupon(cp)}
                            >
                              <Send size={11} />
                              Tung mã
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* High-Intent Favorited / Repeat View Leads */}
                  <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                    {interestLiveItems.length === 0 ? (
                      <div style={{ padding: 'var(--space-5)', textAlign: 'center', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                        Chưa có tín hiệu khách thả tim mới.
                      </div>
                    ) : (
                      interestLiveItems.map((leadItem, idx) => {
                        const pNum = leadItem.plateNumber || leadItem.plate?.plateNumber || '30K-888.88';
                        const cName = leadItem.userFullName || leadItem.fullName || 'Khách quan tâm';
                        return (
                          <div
                            key={leadItem.id || idx}
                            style={{
                              padding: '10px var(--gutter-card)',
                              borderTop: idx === 0 ? 'none' : '1px solid var(--grey-100)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div style={{ font: 'var(--type-body-sm)', fontWeight: 700, color: 'var(--text-strong)' }}>
                                {cName}
                              </div>
                              <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                                Đang quan tâm biển <strong>{pNum}</strong>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePinOrLookupExternalPlate(pNum, cName)}
                            >
                              <Play size={11} />
                              Lên sóng
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. MARQUEE TICKER CONTROL BAR (Standard Admin Card) */}
      <div
        style={{
          background: 'var(--white)',
          boxShadow: 'var(--shadow-inset-hairline)',
          padding: 'var(--space-3) var(--gutter-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              font: 'var(--type-title-3)',
              color: 'var(--text-strong)',
            }}
          >
            <Flame size={16} color="var(--brand-600)" />
            <span>Điều khiển dải chữ chạy (Marquee Ticker) trên sóng Live</span>
          </div>
          <span style={{ font: 'var(--type-caption)', color: 'var(--status-success-ink)', fontWeight: 600 }}>
            Tự động gắn liền ngay dưới thẻ biển số trong Vùng An Toàn 9:16 để không bị bình luận TikTok che
          </span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value)}
            style={{
              flex: 1,
              minWidth: '260px',
              height: '36px',
              padding: '0 12px',
              border: '1px solid var(--border-default)',
              background: 'var(--surface-sunken)',
              font: 'var(--type-body-sm)',
              color: 'var(--text-strong)',
              outline: 'none',
            }}
          />
          <Button variant="dark" size="sm" onClick={() => handleUpdateTicker()}>
            <Send size={14} />
            Phát chữ chạy lên OBS
          </Button>
        </div>
      </div>

      {/* 6. SECURITY & TIKTOK ANTI-BAN REMINDER */}
      <div
        style={{
          padding: 'var(--space-3) var(--gutter-card)',
          background: 'var(--surface-tint-cream)',
          boxShadow: 'var(--shadow-inset-hairline)',
          borderLeft: '3px solid var(--action-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
          font: 'var(--type-caption)',
          color: 'var(--text-body)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={15} color="var(--brand-600)" />
          <span>
            <strong style={{ color: 'var(--text-strong)' }}>Bảo mật Giá Đáy (BR-LIVE-01):</strong> Cột{' '}
            <em>&ldquo;Giá đáy nội bộ&rdquo;</em> và <em>&ldquo;Biên độ bớt tối đa&rdquo;</em> chỉ hiển thị tại màn hình điều khiển này, đã được loại bỏ 100% khỏi gói tin gửi sang OBS Overlay.
          </span>
        </div>
        <div>
          <strong style={{ color: 'var(--text-strong)' }}>Mẹo chống bóp tương tác TikTok:</strong> Hướng dẫn khách gõ mã{' '}
          <strong style={{ fontFamily: 'var(--font-mono)' }}>#B101</strong> tại <strong>biensovip.com</strong>.
        </div>
      </div>

      {/* 7. 3D FULLSCREEN SHOWCASE MODAL (SCR-LIVE-02) */}
      <PlateShowcaseModal
        plate={showcasePlate}
        onClose={() => setShowcasePlate(null)}
        defaultVertical={layoutMode === '9:16'}
      />
    </div>
  );
}
