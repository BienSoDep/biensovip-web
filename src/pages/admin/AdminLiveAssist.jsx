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
  Database,
  StopCircle,
  MessageSquarePlus,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import PlateShowcaseModal from '../../components/live/PlateShowcaseModal.jsx';
import LiveDisplayOverlay from '../overlay/LiveDisplayOverlay.jsx';
import SpotlightCard from '../../components/reactbits/SpotlightCard.jsx';
import ShinyText from '../../components/reactbits/ShinyText.jsx';
import MagnetButton from '../../components/reactbits/MagnetButton.jsx';
import { useAdminPlates } from '../../services/adminPlates.js';
import { splitPlateNumber } from '../../lib/plateFormat.js';
import {
  LIVE_EFFECT_DECK,
  playLiveSoundEffect,
  stopAllLiveSounds,
} from '../../lib/liveSoundEffects.js';
import {
  parseLiveSearchInput,
  parseNumericVnd,
} from '../../lib/liveCommentParser.js';

// Kho biển mẫu chuẩn bị sẵn cho phiên Live (kết hợp cùng dữ liệu DB thật từ API)
const INITIAL_LIVE_PLATES = [
  {
    id: 'lp-1',
    prov: '30',
    seri: 'K',
    num: '888.88',
    plateNumber: '30K-888.88',
    city: 'Hà Nội',
    cat: 'Ngũ quý',
    price: '1.850.000.000đ',
    priceNum: 1850000000,
    floorPrice: '1.680.000.000đ',
    fengshui: 'Ngũ Quý 8 — Phát tài phát lộc đỉnh cao đại cát, hợp mệnh Kim & Thổ',
    shortCode: '#B101',
    status: 'Còn hàng',
    notes: 'Biển đấu giá chính chủ, hồ sơ sẵn cầm tay sang tên trong ngày',
    source: 'QUEUE',
  },
  {
    id: 'lp-2',
    prov: '51',
    seri: 'K',
    num: '999.99',
    plateNumber: '51K-999.99',
    city: 'TP. HCM',
    cat: 'Ngũ quý',
    price: '2.450.000.000đ',
    priceNum: 2450000000,
    floorPrice: '2.200.000.000đ',
    fengshui: 'Ngũ Quý 9 — Cửu ngũ chí tôn, trường cửu vĩnh cửu, hợp mệnh Hỏa & Thổ',
    shortCode: '#B102',
    status: 'Còn hàng',
    notes: 'Biển Sài Gòn đầu số phong thủy cực mạnh cho chủ tịch',
    source: 'QUEUE',
  },
  {
    id: 'lp-3',
    prov: '43',
    seri: 'A',
    num: '999.99',
    plateNumber: '43A-999.99',
    city: 'Đà Nẵng',
    cat: 'Ngũ quý',
    price: '850.000.000đ',
    priceNum: 850000000,
    floorPrice: '780.000.000đ',
    fengshui: 'Ngũ Quý 9 Đà Nẵng — Độc bản miền Trung vượng khí, hợp mệnh Hỏa & Thổ',
    shortCode: '#B103',
    status: 'Còn hàng',
    notes: 'Khách live chốt bớt 20tr lộc phát',
    source: 'QUEUE',
  },
  {
    id: 'lp-4',
    prov: '30',
    seri: 'L',
    num: '686.88',
    plateNumber: '30L-686.88',
    city: 'Hà Nội',
    cat: 'Lộc phát',
    price: '380.000.000đ',
    priceNum: 380000000,
    floorPrice: '335.000.000đ',
    fengshui: 'Lộc Phát Đại Cát — Tiền vào như nước, kinh doanh đắc lợi',
    shortCode: '#B104',
    status: 'Còn hàng',
    notes: 'Thế số gánh cực đẹp gắn xe sang BMW/Mercedes',
    source: 'QUEUE',
  },
  {
    id: 'lp-5',
    prov: '51',
    seri: 'L',
    num: '777.77',
    plateNumber: '51L-777.77',
    city: 'TP. HCM',
    cat: 'Ngũ quý',
    price: '1.250.000.000đ',
    priceNum: 1250000000,
    floorPrice: '1.100.000.000đ',
    fengshui: 'Ngũ Quý 7 — Quyền năng thần tài, quý nhân phù trợ, hợp mệnh Kim & Thủy',
    shortCode: '#B105',
    status: 'Còn hàng',
    notes: 'Biển nguyên bản chưa gắn xe, sang tên bấm biển 24h',
    source: 'QUEUE',
  },
  {
    id: 'lp-6',
    prov: '14',
    seri: 'A',
    num: '888.88',
    plateNumber: '14A-888.88',
    city: 'Quảng Ninh',
    cat: 'Ngũ quý',
    price: '1.150.000.000đ',
    priceNum: 1150000000,
    floorPrice: '1.020.000.000đ',
    fengshui: 'Đất mỏ ngũ quý 8 — Rồng cuộn vượng khí thịnh vượng',
    shortCode: '#B106',
    status: 'Còn hàng',
    notes: 'Chủ xe cần vốn đổi xe mới, ưu tiên khách chốt nhanh',
    source: 'QUEUE',
  },
  {
    id: 'lp-7',
    prov: '30',
    seri: 'K',
    num: '779.79',
    plateNumber: '30K-779.79',
    city: 'Hà Nội',
    cat: 'Thần tài',
    price: '420.000.000đ',
    priceNum: 420000000,
    floorPrice: '380.000.000đ',
    fengshui: 'Cặp Thần Tài Lớn — Hút tài lộc, kinh doanh hanh thông',
    shortCode: '#B107',
    status: 'Còn hàng',
    notes: 'Rất hợp mệnh Kim, Hỏa và Thổ',
    source: 'QUEUE',
  },
  {
    id: 'lp-8',
    prov: '43',
    seri: 'A',
    num: '678.88',
    plateNumber: '43A-678.88',
    city: 'Đà Nẵng',
    cat: 'Lộc phát',
    price: '290.000.000đ',
    priceNum: 290000000,
    floorPrice: '255.000.000đ',
    fengshui: 'Sảnh Lộc Phát Kép — Thăng tiến sự nghiệp, gia đạo bình an',
    shortCode: '#B108',
    status: 'Còn hàng',
    notes: 'Giá mềm dễ chốt trong phiên livestream',
    source: 'QUEUE',
  },
];

const INITIAL_ASKED_LEADS = [
  {
    id: 'lead-1',
    nickname: '@anh_tuan_bds',
    comment: 'Hỏi giá chốt biển 30K-888.88 sang tên Hà Nội',
    plateId: 'lp-1',
    plateNumber: '30K-888.88',
    shortCode: '#B101',
    price: '1.850.000.000đ',
    askedAt: 'Vừa xong',
  },
  {
    id: 'lead-2',
    nickname: '@minh_mercedes_sg',
    comment: 'Sinh năm 1990 hỏi biển 51K-999.99',
    plateId: 'lp-2',
    plateNumber: '51K-999.99',
    shortCode: '#B102',
    price: '2.450.000.000đ',
    askedAt: '3 phút trước',
  },
];

const QUICK_SAMPLE_COMMENTS = [
  { label: '🔮 Tuổi 1990 hợp biển nào?', query: '1990' },
  { label: '⚡ Gõ tắt: 30 68', query: '30 68' },
  { label: '💬 Sài Gòn thần tài', query: 'Tìm biển Sài Gòn ngũ quý' },
  { label: '💰 Đà Nẵng tầm 300tr', query: 'Đà Nẵng lộc phát tầm 300tr' },
  { label: '🔖 Mã #B104', query: '#B104' },
];

function formatVndPrice(numVal) {
  const n = Number(numVal);
  if (!Number.isFinite(n) || n <= 0) return 'Giá liên hệ';
  return `${n.toLocaleString('vi-VN')}đ`;
}

export default function AdminLiveAssist() {
  // 1. Fetch real DB plates from Admin API (up to 150 available plates)
  const { data: adminPlatesData, isLoading: isLoadingDb } = useAdminPlates({
    page: 1,
    perPage: 150,
    status: 'available',
  });

  // Merge real DB plates with curated Live Queue plates
  const plates = useMemo(() => {
    const dbItems = adminPlatesData?.items || [];
    const normalizedDb = dbItems.map((item, idx) => {
      const split = splitPlateNumber(item.plateNumber);
      const rawPrice = Number(item.salePrice || item.price || 0);
      const rawCost = Number(item.costPrice || 0);
      const computedFloor =
        rawCost > 0
          ? rawCost
          : rawPrice > 0
            ? Math.round((rawPrice * 0.91) / 1_000_000) * 1_000_000
            : 0;

      return {
        id: item.id || `db-${idx}`,
        prov: split.prov || '30',
        seri: split.seri || 'A',
        num: split.num || item.plateNumber,
        plateNumber: item.plateNumber,
        city: item.provinceName || 'Toàn quốc',
        cat: item.plateTypeName || 'Biển đẹp',
        price: formatVndPrice(rawPrice),
        priceNum: rawPrice,
        floorPrice: computedFloor > 0 ? formatVndPrice(computedFloor) : 'Theo giá sàn kho',
        fengshui:
          item.fengShuiMeaning ||
          item.description ||
          'Thế số phong thủy đại cát — Vượng khí tài lộc bền vững',
        shortCode: `#B${201 + idx}`,
        status: item.status === 'sold' ? 'Đã bán' : 'Còn hàng',
        notes: item.description || 'Hồ sơ định danh chính chủ sẵn sàng sang tên',
        source: 'DB',
      };
    });

    const seenNumbers = new Set();
    const merged = [];

    for (const p of [...INITIAL_LIVE_PLATES, ...normalizedDb]) {
      const key = String(p.plateNumber || '').toUpperCase();
      if (!key || seenNumbers.has(key)) continue;
      seenNumbers.add(key);
      merged.push(p);
    }
    return merged;
  }, [adminPlatesData]);

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

  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [catFilter, setCatFilter] = useState('ALL');
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);

  const [showcasePlate, setShowcasePlate] = useState(null);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [tickerInput, setTickerInput] = useState(
    '🔥 KHUYẾN MÃI LIVESTREAM: Giảm ngay 10 - 20 triệu khi chốt trên live • Comment Năm Sinh hoặc Đuôi Số để shop tra ngay • Hotline: 0815.792.699'
  );

  // Danh sách "Khách vừa hỏi trên Live" (LiveAskedLead)
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
  const [leadNoteInput, setLeadNoteInput] = useState('');

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

  // Tra cứu In-Memory siêu tốc (< 15ms) kết hợp 3-in-1 Smart Comment Parser
  const filteredPlates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return plates.filter((p) => {
      const matchCityDropdown = cityFilter === 'ALL' || p.city === cityFilter;
      const matchCatDropdown = catFilter === 'ALL' || p.cat === catFilter;
      if (!matchCityDropdown || !matchCatDropdown) return false;

      if (!q) return true;

      // Nếu bộ phân tích thông minh phát hiện thực thể (mã #Bxxx, Năm sinh, Tỉnh, Thế số, Đuôi số, Ngân sách)
      if (parsedSearch.hasSmartMatch) {
        if (
          parsedSearch.shortCode &&
          p.shortCode.toLowerCase() !== parsedSearch.shortCode.toLowerCase()
        ) {
          return false;
        }
        if (parsedSearch.city && p.city.toLowerCase() !== parsedSearch.city.toLowerCase() && p.prov !== parsedSearch.provCode) {
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
          const fengshuiMatch = p.fengshui
            .toLowerCase()
            .includes(parsedSearch.birthYearInfo.menh.toLowerCase());
          if (matchCount < 2 && !fengshuiMatch) return false;
        }
        return true;
      }

      // Tìm kiếm chuỗi thông thường
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
  }, [plates, searchQuery, cityFilter, catFilter, parsedSearch]);

  useEffect(() => {
    setSelectedRowIndex(0);
  }, [searchQuery, cityFilter, catFilter]);

  const activePlateObj = useMemo(
    () => plates.find((p) => p.id === activePlateId) || plates[0] || INITIAL_LIVE_PLATES[0],
    [plates, activePlateId]
  );

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
        toast('⏹️ Đã dừng toàn bộ hiệu ứng & âm thanh');
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

      toast.success(`${deckItem.emoji} Đã phát hiệu ứng: ${deckItem.label}!`, {
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
        ? '📱 Đã chuyển sang Khung Dọc 9:16 (Chuẩn TikTok Safe-Zone)'
        : '🖥️ Đã chuyển sang Khung Ngang 16:9 (Facebook / YouTube)'
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

      // F1 - F6 hoặc Alt + 1..6 hoạt động MỌI LÚC kể cả khi đang đặt con trỏ trong ô tìm kiếm
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
        if (showcasePlate) return; // PlateShowcaseModal tự đóng
        handleTriggerEffect('FX_STOP_ALL');
        return;
      }

      // Khi đang gõ trong ô tìm kiếm: hỗ trợ ArrowUp / ArrowDown / Enter để ghim biển siêu tốc
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

      // Khi KHÔNG gõ trong input: Phím 1-6 phát hiệu ứng, Phím 0 dừng, Phím / tìm kiếm, Space mở 3D
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
    const commentText =
      leadNoteInput.trim() ||
      (searchQuery.trim()
        ? `Hỏi: "${searchQuery.trim()}"`
        : `Quan tâm biển ${targetPlate.plateNumber}`);

    const newLead = {
      id: `lead-${Date.now()}`,
      nickname: formattedNick,
      comment: commentText,
      plateId: targetPlate.id,
      plateNumber: targetPlate.plateNumber,
      shortCode: targetPlate.shortCode,
      price: targetPlate.price,
      askedAt: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const updated = [newLead, ...askedLeads].slice(0, 20);
    setAskedLeads(updated);
    try {
      localStorage.setItem('bsv_live_asked_leads', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setLeadNicknameInput('');
    setLeadNoteInput('');
    toast.success(`Đã lưu ${formattedNick} hỏi biển ${targetPlate.plateNumber}!`);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* 1. TOP STUDIO HEADER: Live Status, Layout Switcher (9:16 vs 16:9), Audio Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '14px',
          padding: '16px 20px',
          backgroundColor: 'var(--surface-card, #FFFFFF)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle, #E2E8F0)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#DC2626',
              fontWeight: 800,
              fontSize: '12.5px',
            }}
          >
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                backgroundColor: '#DC2626',
                boxShadow: '0 0 8px #DC2626',
              }}
            />
            <ShinyText text="TRỢ LÝ LIVE TIKTOK 9:16" shimmerColor="#F87171" speed={2.5} />
          </div>

          <div>
            <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700 }}>
              THỜI LƯỢNG LIVE
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#0F172A',
                fontFamily: 'monospace',
              }}
            >
              {formatTimer(liveDuration)}
            </div>
          </div>

          <div style={{ height: '28px', width: '1px', backgroundColor: '#E2E8F0' }} />

          <div>
            <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700 }}>
              KHO BIỂN SẴN SÀNG
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Database size={15} color="#2563EB" />
              <span>{plates.length} biển</span>
              {isLoadingDb ? (
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                  (đang đồng bộ DB...)
                </span>
              ) : (
                <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>
                  • Đã ghim {pinnedCount} lượt
                </span>
              )}
            </div>
          </div>

          <div style={{ height: '28px', width: '1px', backgroundColor: '#E2E8F0' }} />

          {/* Layout Switcher: 9:16 TikTok Default vs 16:9 Horizontal */}
          <div
            style={{
              display: 'inline-flex',
              padding: '3px',
              borderRadius: '10px',
              backgroundColor: '#F1F5F9',
              border: '1px solid #CBD5E1',
            }}
          >
            <button
              type="button"
              onClick={() => handleSwitchLayout('9:16')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: layoutMode === '9:16' ? '#0F172A' : 'transparent',
                color: layoutMode === '9:16' ? '#FBBF24' : '#475569',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <Smartphone size={14} />
              Dọc 9:16 (TikTok)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchLayout('16:9')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: layoutMode === '16:9' ? '#0F172A' : 'transparent',
                color: layoutMode === '16:9' ? '#FBBF24' : '#475569',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <Monitor size={14} />
              Ngang 16:9 (FB/YT)
            </button>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleToggleAdminMute}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 13px',
              borderRadius: '10px',
              backgroundColor: adminMuted ? '#FEF2F2' : '#ECFDF5',
              border: `1px solid ${adminMuted ? '#FECACA' : '#A7F3D0'}`,
              color: adminMuted ? '#DC2626' : '#047857',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title="Bật/Tắt tiếng hiệu ứng tại máy Admin (độc lập với tiếng trên OBS)"
          >
            {adminMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            {adminMuted ? 'Loa Admin: TẮT' : 'Loa Admin: BẬT'}
          </button>

          <MagnetButton
            onClick={copyObsUrl}
            style={{
              padding: '8px 13px',
              borderRadius: '10px',
              backgroundColor: copiedToken ? '#DCFCE7' : '#F1F5F9',
              border: '1px solid #CBD5E1',
              color: copiedToken ? '#166534' : '#334155',
              fontSize: '12.5px',
              fontWeight: 700,
              gap: '6px',
            }}
          >
            {copiedToken ? <Check size={15} /> : <Copy size={15} />}
            {copiedToken ? 'Đã chép link OBS' : 'Chép link OBS'}
          </MagnetButton>

          <a
            href={`/overlay/live-display?layout=${layoutMode}`}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '8px 13px',
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              color: '#1D4ED8',
              fontSize: '12.5px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ExternalLink size={15} />
            Mở màn hình OBS
          </a>

          <MagnetButton
            onClick={() => setShowLivePreview((v) => !v)}
            style={{
              padding: '8px 13px',
              borderRadius: '10px',
              backgroundColor: showLivePreview ? '#FEF3C7' : '#FFFFFF',
              border: `1px solid ${showLivePreview ? '#F59E0B' : '#E2E8F0'}`,
              color: showLivePreview ? '#B45309' : '#0F172A',
              fontSize: '12.5px',
              fontWeight: 700,
              gap: '6px',
            }}
          >
            <Layers size={15} />
            {showLivePreview ? 'Ẩn Preview 9:16' : 'Hiện Preview 9:16'}
          </MagnetButton>

          {activePlateObj && (
            <MagnetButton
              onClick={() => setShowcasePlate(activePlateObj)}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                backgroundColor: '#1E1B4B',
                border: '1px solid #4338CA',
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: 700,
                gap: '6px',
              }}
              title="Phím tắt: Space"
            >
              <Maximize2 size={15} color="#FBBF24" />
              <ShinyText text="Phôi 3D giơ Camera (Space)" shimmerColor="#FDE68A" speed={3} />
            </MagnetButton>
          )}
        </div>
      </div>

      {/* 2. KEYBOARD SOUNDBOARD & VFX DECK (PHÍM TẮT 1-6 / F1-F6 & 0/ESC) */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: '#0F172A',
          borderRadius: '16px',
          border: '1px solid #334155',
          color: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 10px 25px rgba(15, 23, 42, 0.25)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Keyboard size={18} color="#FBBF24" />
            <span style={{ fontWeight: 800, fontSize: '13.5px', color: '#FDE047', letterSpacing: '0.4px' }}>
              BÀN ĐẠO DIỄN HIỆU ỨNG & ÂM THANH TỨC THÌ (VFX + SFX SOUNDBOARD)
            </span>
            <span
              style={{
                fontSize: '11.5px',
                color: '#94A3B8',
                backgroundColor: 'rgba(255,255,255,0.08)',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              Nhấn phím <b>1–6</b> (hoặc <b>F1–F6</b> / <b>Alt+1..6</b> mọi lúc) • <b>0 / Esc</b> để tắt
            </span>
          </div>

          {/* Optional Buyer Name Honor Input for Deal Closed Effect */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              value={buyerHonorInput}
              onChange={(e) => setBuyerHonorInput(e.target.value)}
              placeholder="Tên khách vinh danh khi bấm Phím 1 (VD: @anh_tuan)..."
              style={{
                width: '270px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #475569',
                backgroundColor: '#1E293B',
                color: '#F8FAFC',
                fontSize: '12px',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => handleTriggerEffect('FX_STOP_ALL')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: '#334155',
                border: '1px solid #64748B',
                color: '#FCA5A5',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <StopCircle size={14} />
              Dừng (0 / Esc)
            </button>
          </div>
        </div>

        {/* 6 Shortcut Pads Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))',
            gap: '10px',
          }}
        >
          {LIVE_EFFECT_DECK.map((fx) => {
            const isPlaying = activeEffectCode === fx.code;
            return (
              <motion.button
                key={fx.code}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTriggerEffect(fx.code)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '4px',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  background: fx.bg,
                  border: `2px solid ${isPlaying ? '#FDE047' : fx.border}`,
                  boxShadow: isPlaying ? `0 0 22px ${fx.accent}` : 'none',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'box-shadow 0.2s, border-color 0.2s',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{fx.emoji}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 900,
                      fontFamily: 'monospace',
                      padding: '2px 7px',
                      borderRadius: '6px',
                      backgroundColor: isPlaying ? '#FDE047' : 'rgba(15, 23, 42, 0.75)',
                      color: isPlaying ? '#0F172A' : '#E2E8F0',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    Phím {fx.key} / {fx.fKey}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#F8FAFC', marginTop: '2px' }}>
                  {fx.label}
                </div>
                <div style={{ fontSize: '11px', color: '#CBD5E1', lineHeight: 1.3 }}>
                  {fx.subLabel}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: LEFT (3-IN-1 SMART LOOKUP & PLATE LIST) + RIGHT (9:16 TIKTOK LIVE PREVIEW & LEADS) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: showLivePreview ? 'minmax(0, 1fr) 370px' : '1fr',
          gap: '18px',
          alignItems: ' start',
        }}
      >
        {/* LEFT COLUMN: 3-IN-1 SMART COMMENT SEARCH + FENGSHUI SCRIPT + PLATE LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
          {/* Smart 3-in-1 Search Box */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '18px 20px',
              backgroundColor: 'var(--surface-card, #FFFFFF)',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle, #E2E8F0)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Search size={16} color="#2563EB" />
                <span>TRÌNH TRA CỨU BÌNH LUẬN THÔNG MINH 3-TRONG-1 (&lt; 30ms)</span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                Phím tắt: Nhấn <kbd style={{ padding: '1px 5px', background: '#F1F5F9', borderRadius: '4px', border: '1px solid #CBD5E1', fontWeight: 700 }}>/</kbd> để tìm • <kbd style={{ padding: '1px 5px', background: '#F1F5F9', borderRadius: '4px', border: '1px solid #CBD5E1', fontWeight: 700 }}>↑↓</kbd> chọn biển • <kbd style={{ padding: '1px 5px', background: '#F1F5F9', borderRadius: '4px', border: '1px solid #CBD5E1', fontWeight: 700 }}>Enter</kbd> Ghim lên Live
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <Search
                size={20}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748B',
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
                  padding: '13px 70px 13px 44px',
                  borderRadius: '12px',
                  border: '2px solid #3B82F6',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#0F172A',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: '#F8FAFC',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: '#E2E8F0',
                    border: 'none',
                    color: '#334155',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  Xóa
                </button>
              )}
            </div>

            {/* Quick Sample Comment Chips for 1-Click Testing */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B' }}>
                Thử nhanh comment khách:
              </span>
              {QUICK_SAMPLE_COMMENTS.map((chip) => (
                <button
                  key={chip.query}
                  type="button"
                  onClick={() => setSearchQuery(chip.query)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    backgroundColor: searchQuery === chip.query ? '#DBEAFE' : '#F1F5F9',
                    color: searchQuery === chip.query ? '#1D4ED8' : '#475569',
                    border: '1px solid #CBD5E1',
                    cursor: 'pointer',
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Extracted Smart Filter Badges */}
            {parsedSearch.extractedTokens.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                }}
              >
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#1E40AF' }}>
                  ⚡ Đã bóc tách tự động:
                </span>
                {parsedSearch.extractedTokens.map((tk, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '3px 9px',
                      borderRadius: '6px',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      fontSize: '11.5px',
                      fontWeight: 700,
                    }}
                  >
                    {tk.label}
                  </span>
                ))}
              </div>
            )}

            {/* FENGSHUI STREAMER TALKING SCRIPT BANNER (Appears automatically when a birth year 1950-2015 is typed) */}
            {parsedSearch.birthYearInfo && (
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                  border: '1.5px solid #F59E0B',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 900, color: '#B45309' }}>
                    <Compass size={17} color="#D97706" />
                    <span>
                      KỊCH BẢN ĐỌC PHONG THỦY CHO KHÁCH SINH NĂM {parsedSearch.birthYearInfo.year} ({parsedSearch.birthYearInfo.canChi} • Mệnh {parsedSearch.birthYearInfo.menh})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdateTicker(`🔮 Tư vấn tuổi ${parsedSearch.birthYearInfo.year} (${parsedSearch.birthYearInfo.canChi} - Mệnh ${parsedSearch.birthYearInfo.menh}): Hợp số ${parsedSearch.birthYearInfo.luckyLabel} • Hotline: 0815.792.699`)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: '#D97706',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Đẩy câu này lên chữ chạy OBS
                  </button>
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#78350F', lineHeight: 1.45 }}>
                  🎙️ <i>&ldquo;{parsedSearch.birthYearInfo.talkingScript}&rdquo;</i>
                </div>
              </div>
            )}

            {/* Quick Province & Category Filter Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Tỉnh:</span>
              {availableCities.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCityFilter(c)}
                  style={{
                    padding: '5px 11px',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: cityFilter === c ? '#0F172A' : '#F1F5F9',
                    color: cityFilter === c ? '#FFFFFF' : '#475569',
                    border: 'none',
                  }}
                >
                  {c === 'ALL' ? 'Tất cả' : c}
                </button>
              ))}

              <div style={{ width: '1px', height: '18px', backgroundColor: '#CBD5E1', margin: '0 4px' }} />

              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Thế số:</span>
              {['ALL', 'Ngũ quý', 'Tứ quý', 'Lộc phát', 'Thần tài'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCatFilter(cat)}
                  style={{
                    padding: '5px 11px',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: catFilter === cat ? '#2563EB' : '#F1F5F9',
                    color: catFilter === cat ? '#FFFFFF' : '#475569',
                    border: 'none',
                  }}
                >
                  {cat === 'ALL' ? 'Tất cả' : cat}
                </button>
              ))}

              <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748B' }}>
                Khớp <b>{filteredPlates.length}</b> biển
              </span>
            </div>
          </div>

          {/* Filtered Plates List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredPlates.slice(0, 25).map((plate, idx) => {
              const isPinned = activePlateId === plate.id;
              const isSelectedRow = idx === selectedRowIndex;

              return (
                <SpotlightCard
                  key={plate.id}
                  onClick={() => setSelectedRowIndex(idx)}
                  spotlightColor={isPinned ? 'rgba(245, 158, 11, 0.22)' : 'rgba(59, 130, 246, 0.12)'}
                  style={{
                    borderRadius: '14px',
                    backgroundColor: isPinned
                      ? '#FEFCE8'
                      : isSelectedRow
                        ? '#F8FAFC'
                        : 'var(--surface-card, #FFFFFF)',
                    border: isPinned
                      ? '2px solid #F59E0B'
                      : isSelectedRow
                        ? '2px solid #3B82F6'
                        : '1px solid var(--border-subtle, #E2E8F0)',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '13px 16px',
                    }}
                  >
                    {/* Plate Number Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
                      <div
                        style={{
                          position: 'relative',
                          backgroundColor: '#FFFFFF',
                          border: '2.5px solid #1E293B',
                          borderRadius: '8px',
                          padding: '5px 12px 5px 32px',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left: '7px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '16px',
                            height: '11px',
                            backgroundColor: '#DA251D',
                            borderRadius: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <svg width="7" height="7" viewBox="0 0 24 24" fill="#FFFF00">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                          </svg>
                        </div>
                        <div
                          style={{
                            fontFamily: '"DIN Alternate", "DIN 1451", sans-serif',
                            fontSize: '20px',
                            fontWeight: 900,
                            letterSpacing: '1px',
                            color: '#0F172A',
                          }}
                        >
                          {plate.plateNumber}
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              color: '#2563EB',
                              backgroundColor: '#EFF6FF',
                              padding: '2px 7px',
                              borderRadius: '4px',
                            }}
                          >
                            {plate.city}
                          </span>
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 800,
                              color: '#4F46E5',
                              backgroundColor: '#EEF2FF',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                            }}
                          >
                            {plate.shortCode}
                          </span>
                          {plate.source === 'DB' && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                color: '#047857',
                                backgroundColor: '#D1FAE5',
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              KHO DB
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '3px', fontWeight: 600 }}>
                          {plate.cat} • {plate.fengshui.slice(0, 48)}
                        </div>
                      </div>
                    </div>

                    {/* Dual Prices: Retail (OBS Visible) & Secret Floor Price (Internal Only per BR-LIVE-01) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>
                          GIÁ NIÊM YẾT (OBS)
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#10B981' }}>
                          {plate.price}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '5px 10px',
                          borderRadius: '8px',
                          backgroundColor: '#FEF2F2',
                          border: '1px solid #FECACA',
                        }}
                        title="Quy tắc BR-LIVE-01: Giá đáy nội bộ tuyệt đối không hiển thị lên OBS"
                      >
                        <div
                          style={{
                            fontSize: '10px',
                            color: '#DC2626',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Lock size={11} />
                          GIÁ ĐÁY NỘI BỘ
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 900, color: '#B91C1C' }}>
                          {plate.floorPrice}
                        </div>
                      </div>
                    </div>

                    {/* Row Quick Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowcasePlate(plate);
                        }}
                        style={{
                          padding: '8px 11px',
                          borderRadius: '8px',
                          backgroundColor: '#F1F5F9',
                          border: '1px solid #CBD5E1',
                          color: '#334155',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                        title="Phóng to phôi 3D toàn màn hình"
                      >
                        <Maximize2 size={14} />
                        3D
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePinPlate(plate);
                          handleTriggerEffect('FX_DEAL_CLOSED', null, plate);
                        }}
                        style={{
                          padding: '8px 11px',
                          borderRadius: '8px',
                          backgroundColor: '#FEF3C7',
                          border: '1px solid #F59E0B',
                          color: '#B45309',
                          fontWeight: 800,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                        title="Ghim biển này kèm pháo hoa Chốt Đơn"
                      >
                        <PartyPopper size={14} />
                        Chốt
                      </button>

                      {isPinned ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnpinPlate();
                          }}
                          style={{
                            padding: '8px 13px',
                            borderRadius: '8px',
                            backgroundColor: '#FEE2E2',
                            border: '1px solid #FCA5A5',
                            color: '#DC2626',
                            fontWeight: 800,
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <Square size={13} fill="#DC2626" />
                          Đang Ghim
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePinPlate(plate);
                          }}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                            border: 'none',
                            color: '#FFFFFF',
                            fontWeight: 800,
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <Play size={13} fill="#FFFFFF" />
                          Ghim Live
                        </button>
                      )}
                    </div>
                  </div>
                </SpotlightCard>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: 9:16 TIKTOK SAFE-ZONE PREVIEW + "KHÁCH VỪA HỎI TRÊN LIVE" TRACKER */}
        {showLivePreview && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'sticky',
              top: '16px',
            }}
          >
            {/* 9:16 Phone Live Preview Box */}
            <div
              style={{
                backgroundColor: '#070C18',
                borderRadius: '20px',
                border: '2px solid #F59E0B',
                overflow: 'hidden',
                boxShadow: '0 14px 35px rgba(0,0,0,0.28)',
              }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#0F172A',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FDE047', fontSize: '12px', fontWeight: 800 }}>
                  <Smartphone size={14} />
                  <span>MÔ PHỎNG MÀN HÌNH {layoutMode}</span>
                </div>
                {layoutMode === '9:16' && (
                  <button
                    type="button"
                    onClick={handleToggleSafeZoneGuide}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: showSafeZoneGuide ? '#059669' : '#334155',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {showSafeZoneGuide ? 'Đang hiện khung TikTok' : 'Hiện khung TikTok'}
                  </button>
                )}
              </div>

              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: layoutMode === '9:16' ? '560px' : '310px',
                }}
              >
                <LiveDisplayOverlay
                  embedded
                  forcedLayoutMode={layoutMode}
                  forcedSafeZoneGuide={showSafeZoneGuide}
                />
              </div>
            </div>

            {/* "KHÁCH VỪA HỎI TRÊN LIVE" (LiveAskedLead Tracker) */}
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--surface-card, #FFFFFF)',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle, #E2E8F0)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                  <MessageSquarePlus size={16} color="#F59E0B" />
                  <span>KHÁCH VỪA HỎI TRÊN LIVE ({askedLeads.length})</span>
                </div>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                  1-Click Ghim lại & Chốt
                </span>
              </div>

              {/* Quick Lead Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={leadNicknameInput}
                    onChange={(e) => setLeadNicknameInput(e.target.value)}
                    placeholder="@nickname hoặc SĐT..."
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12.5px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddAskedLead()}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <UserPlus size={14} />
                    Lưu khách
                  </button>
                </div>
                <input
                  type="text"
                  value={leadNoteInput}
                  onChange={(e) => setLeadNoteInput(e.target.value)}
                  placeholder={`Ghi chú (mặc định gắn với biển ${activePlateObj?.plateNumber || 'đang chọn'})...`}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Leads List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {askedLeads.map((lead) => (
                  <div
                    key={lead.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '12.5px', color: '#1E40AF' }}>
                        {lead.nickname}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#FEF3C7',
                            color: '#B45309',
                          }}
                        >
                          {lead.plateNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveLead(lead.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94A3B8',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                          title="Xóa"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#475569' }}>{lead.comment}</div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const p = plates.find(
                            (item) => item.id === lead.plateId || item.plateNumber === lead.plateNumber
                          );
                          if (p) handlePinPlate(p);
                        }}
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#E2E8F0',
                          color: '#0F172A',
                          border: 'none',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        📌 Ghim lại biển
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCloseDealForLead(lead)}
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#DC2626',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        🎉 Chốt đơn khách này
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. MARQUEE TICKER CONTROL BAR */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: 'var(--surface-card, #FFFFFF)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle, #E2E8F0)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#0F172A', fontSize: '13.5px' }}>
            <Flame size={17} color="#F59E0B" />
            <span>ĐIỀU KHIỂN DẢI CHỮ CHẠY (MARQUEE TICKER) TRÊN SÓNG LIVE</span>
          </div>
          <span style={{ fontSize: '11.5px', color: '#047857', fontWeight: 700 }}>
            ✓ Tự động đặt ở vùng giữa 46.5% trên khung 9:16 để không bị bình luận TikTok che khuất
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value)}
            style={{
              flex: 1,
              minWidth: '260px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              fontSize: '13.5px',
              color: '#0F172A',
            }}
          />
          <MagnetButton
            onClick={() => handleUpdateTicker()}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              fontSize: '13px',
              gap: '6px',
            }}
          >
            <Send size={15} />
            Phát chữ chạy lên OBS
          </MagnetButton>
        </div>
      </div>

      {/* 5. SECURITY & TIKTOK ANTI-BAN REMINDER */}
      <div
        style={{
          padding: '12px 18px',
          borderRadius: '12px',
          backgroundColor: '#F8FAFC',
          border: '1px dashed #CBD5E1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '12px',
          color: '#475569',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={16} color="#2563EB" />
          <span>
            <b>Bảo mật Giá Đáy (BR-LIVE-01):</b> Cột <i>&ldquo;Giá Đáy Nội Bộ&rdquo;</i> chỉ hiển thị tại màn hình điều khiển này, đã được loại bỏ 100% khỏi gói tin gửi sang OBS Overlay.
          </span>
        </div>
        <div>
          <b>Mẹo chống bóp tương tác TikTok:</b> Hướng dẫn khách gõ mã <b>#B101</b> tại <b>biensovip.com</b>.
        </div>
      </div>

      {/* 6. 3D FULLSCREEN SHOWCASE MODAL (SCR-LIVE-02) */}
      <PlateShowcaseModal
        plate={showcasePlate}
        onClose={() => setShowcasePlate(null)}
        defaultVertical={layoutMode === '9:16'}
      />
    </div>
  );
}
