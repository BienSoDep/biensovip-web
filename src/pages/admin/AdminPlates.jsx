import { useState, useEffect, useRef } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  useAdminPlates, useDeletePlate, useUpdatePlateStatus,
  useUpdatePlateVisibility, useUpdatePlate, useCreatePlate,
  useBulkCreatePlate, useUploadImage, useAdminPlate, checkPlateVersion, useRestorePlate,
} from '../../services/adminPlates.js';
import { useAdminCategories } from '../../services/categories.js';
import { useExportCsv } from '../../hooks/useExportCsv.js';
import { parsePlateNumber } from '../../lib/plateFormat.js';
import { buildImportPlatePrompt } from '../../lib/importPlatePrompt.js';
import {
  fetchMissingImagePlates,
  generateOneImage,
  fetchGeneratedImagePlates,
  purgeGeneratedImageForPlate,
  fetchMissingInfoPlates,
  seedInfoForPlate,
  usePlateDataIssues,
} from '../../services/plateImages.js';

// Modular Plates Subcomponents & Utils
import {
  INITIAL_FORM,
  ERR_MSG,
  canViewCost,
  isSoldMarker,
  detectVehicleTypeOverride,
  codeMatches,
  loadColumnPrefs,
  COLUMN_PREFS_KEY,
  detectPlateTypeId,
  detectVehicleTypeId,
  num,
} from './plates/plateUtils.js';
import PlateQuickAddBar from './plates/PlateQuickAddBar.jsx';
import PlateDrawerForm from './plates/PlateDrawerForm.jsx';
import PlateBulkModals from './plates/PlateBulkModals.jsx';
import PlateTable from './plates/PlateTable.jsx';

export default function AdminPlates({ go, notify, st }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('all');
  const [keyword, setKeyword] = useState(st?.adminQ || '');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [plateTypeFilter, setPlateTypeFilter] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [hotFilter, setHotFilter] = useState('');
  const { exportCsv, loading: exporting } = useExportCsv('/api/admin/plates');
  const [sort, setSort] = useState(null); // { key, dir: 'asc' | 'desc' }
  const [mobileView, setMobileView] = useState('card'); // 'card' | 'table'
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [debouncedKeyword] = useDebouncedValue(keyword, 250);

  const [colPrefs, setColPrefs] = useState(loadColumnPrefs);
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const toggleCol = (key) => setColPrefs((prev) => {
    const next = { ...prev, [key]: !prev[key] };
    try { localStorage.setItem(COLUMN_PREFS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    return next;
  });

  // Modal: Sinh thông tin hàng loạt
  const [missingInfoPlates, setMissingInfoPlates] = useState(null);
  const [checkingMissingInfo, setCheckingMissingInfo] = useState(false);
  const [infoProgress, setInfoProgress] = useState(null);
  const infoCancelledRef = useRef(false);
  const [selectedInfoIds, setSelectedInfoIds] = useState(new Set());
  const toggleInfoSelected = (id) => setSelectedInfoIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const openMissingInfoModal = async () => {
    setCheckingMissingInfo(true);
    setInfoProgress(null);
    try {
      const res = await fetchMissingInfoPlates();
      const items = res.items || [];
      setMissingInfoPlates(items);
      setSelectedInfoIds(new Set(items.map((p) => p.id)));
    } catch (err) {
      notify(err.message || 'Lỗi kiểm tra biển thiếu thông tin');
    } finally {
      setCheckingMissingInfo(false);
    }
  };

  const closeMissingInfoModal = () => {
    infoCancelledRef.current = true;
    setMissingInfoPlates(null);
  };

  const confirmBulkSeedInfo = async () => {
    const platesToSeed = (missingInfoPlates || []).filter((p) => selectedInfoIds.has(p.id));
    infoCancelledRef.current = false;
    const errors = [];
    let meaningSeeded = 0, imageSeeded = 0, descriptionSeeded = 0;
    setInfoProgress({ done: 0, total: platesToSeed.length, errors });
    for (let i = 0; i < platesToSeed.length; i++) {
      if (infoCancelledRef.current) break;
      try {
        const res = await seedInfoForPlate(platesToSeed[i].id);
        if (res.meaningSeeded) meaningSeeded++;
        if (res.imageSeeded) imageSeeded++;
        if (res.descriptionSeeded) descriptionSeeded++;
        if (!res.ok) errors.push(platesToSeed[i].plateNumber);
      } catch {
        errors.push(platesToSeed[i].plateNumber);
      }
      setInfoProgress({ done: i + 1, total: platesToSeed.length, errors: [...errors] });
    }
    if (!infoCancelledRef.current) {
      queryClient.invalidateQueries({ queryKey: ['admin-plates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-plate'] });
      queryClient.invalidateQueries({ queryKey: ['plates'] });
      notify(`Đã sinh: ${meaningSeeded} ý nghĩa, ${imageSeeded} ảnh, ${descriptionSeeded} mô tả${errors.length ? ` — ${errors.length} biển có phần không sinh được` : ''}`);
    }
  };

  // Modal: Sinh ảnh đại diện hàng loạt
  const [missingImagePlates, setMissingImagePlates] = useState(null);
  const [checkingMissingImage, setCheckingMissingImage] = useState(false);
  const [genProgress, setGenProgress] = useState(null);
  const genCancelledRef = useRef(false);
  const [selectedGenIds, setSelectedGenIds] = useState(new Set());
  const toggleGenSelected = (id) => setSelectedGenIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const openMissingImageModal = async () => {
    setCheckingMissingImage(true);
    setGenProgress(null);
    try {
      const res = await fetchMissingImagePlates();
      const items = res.items || [];
      setMissingImagePlates(items);
      setSelectedGenIds(new Set(items.map((p) => p.id)));
    } catch (err) {
      notify(err.message || 'Lỗi kiểm tra biển thiếu ảnh');
    } finally {
      setCheckingMissingImage(false);
    }
  };

  const closeMissingImageModal = () => {
    genCancelledRef.current = true;
    setMissingImagePlates(null);
  };

  const confirmBulkGenerateImages = async () => {
    const platesToGen = (missingImagePlates || []).filter((p) => selectedGenIds.has(p.id));
    genCancelledRef.current = false;
    const errors = [];
    setGenProgress({ done: 0, total: platesToGen.length, errors });
    for (let i = 0; i < platesToGen.length; i++) {
      if (genCancelledRef.current) break;
      try {
        await generateOneImage(platesToGen[i].id);
      } catch {
        errors.push(platesToGen[i].plateNumber);
      }
      setGenProgress({ done: i + 1, total: platesToGen.length, errors: [...errors] });
    }
    if (!genCancelledRef.current) {
      queryClient.invalidateQueries({ queryKey: ['admin-plates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-plate'] });
      queryClient.invalidateQueries({ queryKey: ['plates'] });
      notify(`Đã sinh ảnh cho ${platesToGen.length - errors.length} biển${errors.length ? `, ${errors.length} biển lỗi` : ''}`);
    }
  };

  // Sinh ảnh cho 1 dòng
  const [generatingRowId, setGeneratingRowId] = useState(null);
  const generateRowImage = async (p) => {
    setGeneratingRowId(p.id);
    try {
      await generateOneImage(p.id);
      queryClient.invalidateQueries({ queryKey: ['admin-plates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-plate'] });
      queryClient.invalidateQueries({ queryKey: ['plates'] });
      notify('Đã sinh ảnh');
    } catch (err) {
      notify(err.message || 'Sinh ảnh thất bại');
    } finally {
      setGeneratingRowId(null);
    }
  };

  // Modal: Xóa ảnh sinh cũ
  const [generatedImagePlates, setGeneratedImagePlates] = useState(null);
  const [checkingGeneratedImage, setCheckingGeneratedImage] = useState(false);
  const [purgeProgress, setPurgeProgress] = useState(null);
  const purgeCancelledRef = useRef(false);
  const [selectedPurgeIds, setSelectedPurgeIds] = useState(new Set());
  const togglePurgeSelected = (id) => setSelectedPurgeIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const openPurgeImageModal = async () => {
    setCheckingGeneratedImage(true);
    setPurgeProgress(null);
    try {
      const res = await fetchGeneratedImagePlates();
      const items = res.items || [];
      setGeneratedImagePlates(items);
      setSelectedPurgeIds(new Set(items.map((p) => p.id)));
    } catch (err) {
      notify(err.message || 'Lỗi kiểm tra ảnh sinh tự động');
    } finally {
      setCheckingGeneratedImage(false);
    }
  };

  const closePurgeImageModal = () => {
    purgeCancelledRef.current = true;
    setGeneratedImagePlates(null);
  };

  const confirmPurgeGeneratedImages = async () => {
    const platesToPurge = (generatedImagePlates || []).filter((p) => selectedPurgeIds.has(p.id));
    purgeCancelledRef.current = false;
    const errors = [];
    setPurgeProgress({ done: 0, total: platesToPurge.length, errors });
    for (let i = 0; i < platesToPurge.length; i++) {
      if (purgeCancelledRef.current) break;
      try {
        await purgeGeneratedImageForPlate(platesToPurge[i].id);
      } catch {
        errors.push(platesToPurge[i].plateNumber);
      }
      setPurgeProgress({ done: i + 1, total: platesToPurge.length, errors: [...errors] });
    }
    if (!purgeCancelledRef.current) {
      queryClient.invalidateQueries({ queryKey: ['admin-plates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-plate'] });
      queryClient.invalidateQueries({ queryKey: ['plates'] });
      notify(`Đã xóa ảnh cho ${platesToPurge.length - errors.length} biển${errors.length ? `, ${errors.length} biển lỗi` : ''}`);
    }
  };

  // Add/Edit Drawer State
  const [editId, setEditId] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErr, setFormErr] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const restoreMut = useRestorePlate();

  const undoToast = (count, ids) => {
    toast((t) => (
      <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        Đã xóa {count} biển
        <button
          type="button"
          onClick={() => {
            toast.dismiss(t.id);
            Promise.allSettled(ids.map((id) => restoreMut.mutateAsync(id))).then(() => notify('Đã hoàn tác'));
          }}
          style={{ border: 'none', background: 'none', color: 'var(--action-primary)', fontWeight: 'var(--fw-bold)', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Hoàn tác
        </button>
      </span>
    ), { duration: 5000 });
  };

  // Quick Add State
  const [quickNum, setQuickNum] = useState('');
  const [quickPrice, setQuickPrice] = useState('');
  const [quickStatus, setQuickStatus] = useState('available');
  const [quickVehicleTypeId, setQuickVehicleTypeId] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkView, setBulkView] = useState('list');
  const [cell, setCell] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const filters = {
    status, keyword: debouncedKeyword, page, perPage,
    ...(fromDate && { fromDate }), ...(toDate && { toDate }),
    ...(sort && { sortBy: sort.key, sortDir: sort.dir }),
    ...(plateTypeFilter && { plateTypeId: plateTypeFilter }),
    ...(vehicleTypeFilter && { vehicleTypeId: vehicleTypeFilter }),
    ...(provinceFilter && { provinceId: provinceFilter }),
    ...(hotFilter && { isHot: hotFilter }),
  };
  const { data, isLoading, isError, refetch } = useAdminPlates(filters);
  const plates = data?.items || [];
  const total = data?.total || 0;

  const { data: dataIssuesRes } = usePlateDataIssues();
  const dataIssuesByPlateId = new Map((dataIssuesRes?.items || []).map((i) => [i.plateId, i.issues]));

  const allSelected = plates.length > 0 && plates.every((p) => selected.has(p.id));
  const someSelected = plates.some((p) => selected.has(p.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(plates.map((p) => p.id)));
  const toggleOne = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const sortedPlates = plates;
  const toggleSort = (key) => {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
    setPage(1);
  };

  const { data: plateTypesData } = useAdminCategories('plate_type');
  const { data: provincesData } = useAdminCategories('province');
  const { data: vehicleTypesData } = useAdminCategories('vehicle_type');
  const plateTypes = plateTypesData?.items || [];
  const provinces = provincesData?.items || [];
  const vehicleTypes = vehicleTypesData?.items || [];
  const defaultQuickVehicleTypeId = (vehicleTypes.find((v) => (v.name || '').toLowerCase().includes('xe máy')) || {}).id || '';

  const [editPlateId, setEditPlateId] = useState(null);
  const { data: editDetail } = useAdminPlate(editPlateId);

  const deleteMut = useDeletePlate();
  const statusMut = useUpdatePlateStatus();
  const visMut = useUpdatePlateVisibility();
  const createMut = useCreatePlate();
  const updateMut = useUpdatePlate();
  const bulkMut = useBulkCreatePlate();
  const uploadMut = useUploadImage();

  const catOpts = (list) => (list || []).map((c) => ({ value: c.id, label: c.name, code: c.code }));
  const provinceByCode = (code) => (provinces.find((c) => codeMatches(c.code, code)) || {}).id;
  const provNameOf = (code) => (provinces.find((c) => codeMatches(c.code, code)) || {}).name || '';

  const handlePlateNumberChange = (v) => {
    const prov = parsePlateNumber(v).prov;
    setForm((f) => {
      const patch = { plateNumber: v };
      if (prov && !f.provinceId) patch.provinceId = provinceByCode(prov) || f.provinceId;
      return { ...f, ...patch };
    });
  };

  const openAdd = () => {
    setEditId('new');
    setEditPlateId(null);
    setForm(INITIAL_FORM);
    setFormErr({});
  };

  const openEdit = (p) => {
    setEditId(p.id);
    setEditPlateId(p.id);
    setForm(INITIAL_FORM);
    setFormErr({});
  };

  const [loadedUpdatedAt, setLoadedUpdatedAt] = useState(null);

  useEffect(() => {
    if (editDetail && editId && editId === editPlateId) {
      setForm({
        plateNumber: editDetail.plateNumber || '',
        plateTypeId: editDetail.plateTypeId || '',
        provinceId: editDetail.provinceId || '',
        vehicleTypeId: editDetail.vehicleTypeId || '',
        price: editDetail.priceOnRequest ? '' : String(editDetail.price || ''),
        costPrice: editDetail.costPrice != null ? String(editDetail.costPrice) : '',
        priceOnRequest: editDetail.priceOnRequest || false,
        isHot: editDetail.isHot || false,
        description: editDetail.description || '',
        fengShuiMeaning: editDetail.fengShuiMeaning || '',
        images: (editDetail.images || []).map((img) => img.url),
        giftedPlateNumber: editDetail.giftedPlateNumber || '',
        salePrice: editDetail.salePrice != null ? String(editDetail.salePrice) : '',
        saleDiscountPercent: editDetail.salePrice != null && editDetail.price > 0
          ? String(Math.round((1 - editDetail.salePrice / editDetail.price) * 100)) : '',
      });
      setLoadedUpdatedAt(editDetail.updatedAt || null);
    }
  }, [editDetail]);

  const setF = (k) => (v) => setForm((f) => ({ ...f, [k]: v && v.target ? v.target.value : v }));

  const handleUpload = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    const remaining = 8 - (form.images?.length || 0);
    if (list.length > remaining) { notify(`Tối đa 8 ảnh (còn ${remaining} ảnh)`); return; }
    if (list.some((f) => f.size > 5 * 1024 * 1024)) { notify('Ảnh vượt quá 5MB'); return; }
    setUploading(true);
    try {
      const results = await Promise.all(list.map((f) => uploadMut.mutateAsync(f)));
      setForm((f) => ({ ...f, images: [...f.images, ...results.map((r) => r.url)] }));
      notify(`Đã tải ${results.length} ảnh lên`);
    } catch (err) {
      notify(err?.message || 'Lỗi tải ảnh');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url) => setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }));

  const blurValidateField = (field, valueOverride) => () => {
    setFormErr((prev) => {
      const next = { ...prev };
      const v = (val) => (valueOverride !== undefined ? valueOverride : val);
      if (field === 'plateNumber') {
        if (!v(form.plateNumber).trim()) next.plateNumber = 'Vui lòng nhập biển số'; else delete next.plateNumber;
      } else if (field === 'plateTypeId') {
        if (!v(form.plateTypeId)) next.plateTypeId = 'Chọn loại biển'; else delete next.plateTypeId;
      } else if (field === 'provinceId') {
        if (!v(form.provinceId)) next.provinceId = 'Chọn tỉnh/thành'; else delete next.provinceId;
      } else if (field === 'vehicleTypeId') {
        if (!v(form.vehicleTypeId)) next.vehicleTypeId = 'Chọn loại xe'; else delete next.vehicleTypeId;
      }
      return next;
    });
  };

  const handleSave = async () => {
    const errs = {};
    if (!form.plateNumber.trim()) errs.plateNumber = 'Vui lòng nhập biển số';
    if (!form.plateTypeId) errs.plateTypeId = 'Chọn loại biển';
    if (!form.provinceId) errs.provinceId = 'Chọn tỉnh/thành';
    if (!form.vehicleTypeId) errs.vehicleTypeId = 'Chọn loại xe';
    if (!form.priceOnRequest && num(form.price) < 0) errs.price = 'Giá không được âm';
    if (!form.priceOnRequest && form.salePrice && num(form.salePrice) >= num(form.price)) errs.salePrice = 'Giá sau giảm phải nhỏ hơn giá gốc';
    setFormErr(errs);
    if (Object.keys(errs).length) return;

    const body = {
      plateNumber: form.plateNumber.trim(),
      plateTypeId: form.plateTypeId,
      provinceId: form.provinceId,
      vehicleTypeId: form.vehicleTypeId,
      price: form.priceOnRequest ? 0 : num(form.price),
      costPrice: form.costPrice.trim() ? num(form.costPrice) : null,
      priceOnRequest: form.priceOnRequest,
      isHot: form.isHot,
      description: form.description || null,
      fengShuiMeaning: form.fengShuiMeaning || null,
      images: form.images,
      giftedPlateNumber: form.giftedPlateNumber?.trim() || null,
      salePrice: form.priceOnRequest || !form.salePrice ? null : num(form.salePrice),
      clearSalePrice: form.priceOnRequest || !form.salePrice,
    };

    setSaving(true);
    try {
      if (typeof editId === 'string' && editId === 'new') {
        await createMut.mutateAsync(body);
      } else {
        if (loadedUpdatedAt) {
          const conflict = await checkPlateVersion(editId, loadedUpdatedAt);
          if (conflict) {
            notify('Dữ liệu đã bị đổi bởi người khác — tải lại trang trước khi lưu để tránh ghi đè.');
            setSaving(false);
            return;
          }
        }
        await updateMut.mutateAsync({ id: editId, body });
      }
      setEditId(null);
      setEditPlateId(null);
      setForm(INITIAL_FORM);
      notify(typeof editId === 'string' ? 'Đã thêm biển số mới' : 'Đã cập nhật biển số');
    } catch (err) {
      notify(err.code === 'network' ? 'Mất kết nối — kiểm tra mạng và thử lại' : (err.message || 'Lỗi lưu biển số'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete;
    try {
      await deleteMut.mutateAsync(id);
      setConfirmDelete(null);
      undoToast(1, [id]);
    } catch (err) {
      notify(err.message || 'Lỗi xóa biển số');
    }
  };

  const STATUS_LABEL = { available: 'Còn hàng', sold: 'Đã bán', inactive: 'Hết hạn' };
  const bulkStatus = async (stVal) => {
    const ids = plates.filter((p) => selected.has(p.id)).map((p) => p.id);
    if (!ids.length) return;
    if (!window.confirm(`Đổi trạng thái ${ids.length} biển thành "${STATUS_LABEL[stVal] || stVal}"?`)) return;
    const results = await Promise.allSettled(ids.map((id) => statusMut.mutateAsync({ id, status: stVal })));
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - ok;
    setSelected(new Set());
    if (failed === 0) {
      notify(`Đã cập nhật trạng thái ${ok} biển`);
    } else {
      const firstReason = results.find((r) => r.status === 'rejected')?.reason?.message;
      notify(`Cập nhật ${ok}/${results.length} biển thành công — ${failed} biển lỗi${firstReason ? ` (${firstReason})` : ''}`);
    }
  };

  const bulkDelete = async () => {
    const ids = plates.filter((p) => selected.has(p.id)).map((p) => p.id);
    if (!ids.length) return;
    const results = await Promise.allSettled(ids.map((id) => deleteMut.mutateAsync(id)));
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const okIds = ids.filter((_, i) => results[i].status === 'fulfilled');
    const failed = results.length - ok;
    setSelected(new Set());
    setConfirmBulkDelete(false);
    undoToast(ok, okIds);
    if (failed > 0) {
      const firstReason = results.find((r) => r.status === 'rejected')?.reason?.message;
      notify(`${failed} biển không xóa được${firstReason ? ` (${firstReason})` : ''}`);
    }
  };

  const confirmPlate = plates.find((p) => p.id === confirmDelete) || null;
  const pendingCount = confirmPlate?.pendingContactCount ?? 0;

  const hideInsteadOfDelete = async () => {
    if (!confirmDelete) return;
    try {
      await visMut.mutateAsync({ id: confirmDelete, visible: false });
      setConfirmDelete(null);
      notify('Đã ẩn biển thay vì xóa');
    } catch (err) {
      notify(err.message || 'Lỗi ẩn biển');
    }
  };

  const quickCreate = async (number, price, plateStatus, vehicleTypeId) => {
    const n = (number || '').trim();
    if (!n || !/-\d/.test(n)) { notify('Nhập biển số hợp lệ (VD: 43A1-999.99)'); return false; }
    if (!String(price ?? '').trim()) { notify('Nhập giá biển số'); return false; }
    if (!plateStatus) { notify('Chọn trạng thái'); return false; }
    const priceOnRequest = false;
    try {
      const res = await bulkMut.mutateAsync([{
        plateNumber: n, price: num(price), isHot: false, priceOnRequest,
        sold: plateStatus === 'sold', vehicleTypeId: vehicleTypeId || undefined,
      }]);
      if (res[0]?.success) { notify(`Đã thêm ${n}`); return true; }
      notify(ERR_MSG[res[0]?.error] || 'Không thêm được biển');
      return false;
    } catch (err) {
      notify(err.message || 'Lỗi thêm biển');
      return false;
    }
  };

  const quickAdd = async () => {
    const ok = await quickCreate(quickNum, quickPrice, quickStatus, quickVehicleTypeId || defaultQuickVehicleTypeId);
    if (ok) { setQuickNum(''); setQuickPrice(''); setQuickStatus('available'); setQuickVehicleTypeId(''); }
  };

  // Prompt modal
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [promptFields, setPromptFields] = useState({ hasPrice: true, hasStatus: true, hasNote: false, hasGifted: false });
  const copyImportPrompt = async () => {
    try {
      await navigator.clipboard.writeText(buildImportPlatePrompt(promptFields));
      notify('Đã copy prompt — dán vào ChatGPT/Claude kèm file Excel/PDF');
      setPromptModalOpen(false);
    } catch {
      notify('Không copy được — trình duyệt chặn clipboard');
    }
  };

  const parseLine = (line) => {
    const parts = line.split(/[,;\t]/).map((p) => p.trim());
    const numberPart = (parts[0] || '').trim();
    const number = numberPart.split(/\s+/)[0] || '';
    if (!number) return null;
    const priceRaw = parts.length > 1 ? parts[1] : numberPart.split(/\s+/).slice(1).join(' ').trim();
    const priceOnRequest = !priceRaw;
    const price = priceOnRequest ? 0 : num(priceRaw);
    const sold = parts.length > 2 && isSoldMarker(parts[2]);
    const ok = /-\d/.test(number);
    const { prov, seri, num: serial } = parsePlateNumber(number);
    const provinceId = ok ? provinceByCode(prov) : '';
    const plateTypeId = ok ? detectPlateTypeId(serial.replace(/\D/g, ''), catOpts(plateTypes)) : '';
    const vehicleOverride = parts.length > 3 ? detectVehicleTypeOverride(parts[3], vehicleTypes) : null;
    const vehicleTypeId = ok ? (vehicleOverride ?? detectVehicleTypeId(seri, catOpts(vehicleTypes))) : '';
    const giftedPlateNumber = parts.length > 4 ? (parts[4] || '').trim() : '';
    return {
      number, price, priceOnRequest, sold, provinceId, plateTypeId, vehicleTypeId, giftedPlateNumber,
      provName: prov ? provNameOf(prov) : '', ok, reason: ok ? '' : 'Sai định dạng',
    };
  };

  const onBulkTextChange = (v) => {
    setBulkText(v);
    setBulkRows(v.split('\n').map(parseLine).filter(Boolean).map((r, i) => ({ key: i, done: false, ...r })));
  };

  const editBulkRow = (key, field, value) => {
    setBulkRows((rows) => rows.map((r) => (r.key === key && !r.done ? { ...r, [field]: value } : r)));
  };

  const submitBulk = async () => {
    const valid = bulkRows.filter((r) => r.ok && !r.done);
    if (valid.length === 0) { notify('Không có dòng hợp lệ để thêm'); return; }
    try {
      const res = await bulkMut.mutateAsync(valid.map((r) => ({
        plateNumber: r.number, price: r.price, isHot: false, priceOnRequest: r.priceOnRequest, sold: r.sold,
        plateTypeId: r.plateTypeId || undefined, vehicleTypeId: r.vehicleTypeId || undefined, provinceId: r.provinceId || undefined,
        giftedPlateNumber: r.giftedPlateNumber || undefined,
      })));
      const results = res.results || [];
      setBulkRows((rows) => rows.map((r) => {
        const itemRes = results.find((x) => x.plateNumber === r.number);
        if (!itemRes) return r;
        const reason = itemRes.success ? (itemRes.statusUpdated ? 'Đã cập nhật trạng thái' : '') : (ERR_MSG[itemRes.error] || 'Lỗi');
        return { ...r, done: true, ok: itemRes.success, reason };
      }));
      const createdCount = results.filter((r) => r.success && !r.statusUpdated).length;
      const updatedCount = results.filter((r) => r.success && r.statusUpdated).length;
      notify(`Đã thêm ${createdCount} biển mới${updatedCount ? `, cập nhật trạng thái ${updatedCount} biển trùng` : ''}`);
    } catch (err) {
      notify(err.message || 'Lỗi thêm hàng loạt');
    }
  };

  const commitPrice = (p) => {
    if (!cell) return;
    const priceVal = num(cell.value);
    if (priceVal < 0) { notify('Giá không được âm'); setCell(null); return; }
    updateMut.mutate({ id: p.id, body: { price: priceVal, priceOnRequest: false } }, {
      onSuccess: () => notify('Đã cập nhật giá'),
      onError: (err) => { notify(err.message || 'Lỗi cập nhật giá'); setCell(null); },
    });
    setCell(null);
  };

  const toggleHot = (p) => updateMut.mutate({ id: p.id, body: { isHot: !p.isHot } }, {
    onSuccess: () => notify(p.isHot ? 'Đã bỏ nổi bật' : 'Đã đánh dấu nổi bật'),
    onError: (err) => notify(err.message || 'Lỗi cập nhật nổi bật'),
  });

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const activeFiltersCount = [
    status !== 'all' && status,
    plateTypeFilter,
    vehicleTypeFilter,
    provinceFilter,
    hotFilter,
    fromDate,
    toDate,
  ].filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* 1. Quick-add & Bulk import bar */}
      <PlateQuickAddBar
        quickNum={quickNum} setQuickNum={setQuickNum}
        quickPrice={quickPrice} setQuickPrice={setQuickPrice}
        quickStatus={quickStatus} setQuickStatus={setQuickStatus}
        quickVehicleTypeId={quickVehicleTypeId} setQuickVehicleTypeId={setQuickVehicleTypeId}
        defaultQuickVehicleTypeId={defaultQuickVehicleTypeId}
        quickAdd={quickAdd}
        bulkMut={bulkMut}
        bulkOpen={bulkOpen} setBulkOpen={setBulkOpen}
        bulkText={bulkText} onBulkTextChange={onBulkTextChange}
        bulkRows={bulkRows}
        bulkView={bulkView} setBulkView={setBulkView}
        editBulkRow={editBulkRow}
        submitBulk={submitBulk}
        promptModalOpen={promptModalOpen} setPromptModalOpen={setPromptModalOpen}
        promptFields={promptFields} setPromptFields={setPromptFields}
        copyImportPrompt={copyImportPrompt}
        plateTypes={catOpts(plateTypes)}
        vehicleTypes={catOpts(vehicleTypes)}
        provinces={catOpts(provinces)}
      />

      {/* 2. Plates Table, Cards & Filters */}
      <PlateTable
        keyword={keyword} setKeyword={setKeyword}
        status={status} setStatus={setStatus}
        fromDate={fromDate} setFromDate={setFromDate}
        toDate={toDate} setToDate={setToDate}
        perPage={perPage} setPerPage={setPerPage}
        plateTypeFilter={plateTypeFilter} setPlateTypeFilter={setPlateTypeFilter}
        vehicleTypeFilter={vehicleTypeFilter} setVehicleTypeFilter={setVehicleTypeFilter}
        provinceFilter={provinceFilter} setProvinceFilter={setProvinceFilter}
        hotFilter={hotFilter} setHotFilter={setHotFilter}
        setPage={setPage} page={page}
        mobileFiltersOpen={mobileFiltersOpen} setMobileFiltersOpen={setMobileFiltersOpen}
        mobileView={mobileView} setMobileView={setMobileView}
        activeFiltersCount={activeFiltersCount}
        colPrefs={colPrefs} toggleCol={toggleCol}
        colMenuOpen={colMenuOpen} setColMenuOpen={setColMenuOpen}
        exportCsv={exportCsv} exporting={exporting}
        checkingMissingInfo={checkingMissingInfo} openMissingInfoModal={openMissingInfoModal}
        checkingMissingImage={checkingMissingImage} openMissingImageModal={openMissingImageModal}
        checkingGeneratedImage={checkingGeneratedImage} openPurgeImageModal={openPurgeImageModal}
        openAdd={openAdd} openEdit={openEdit}
        plateTypes={catOpts(plateTypes)}
        vehicleTypes={catOpts(vehicleTypes)}
        provinces={catOpts(provinces)}
        plates={plates} sortedPlates={sortedPlates} isLoading={isLoading} isError={isError} refetch={refetch} totalPages={totalPages}
        selected={selected} toggleAll={toggleAll} toggleOne={toggleOne} allSelected={allSelected} someSelected={someSelected}
        dataIssuesByPlateId={dataIssuesByPlateId} toggleHot={toggleHot} generatingRowId={generatingRowId} generateRowImage={generateRowImage}
        setConfirmDelete={setConfirmDelete} setConfirmBulkDelete={setConfirmBulkDelete} bulkStatus={bulkStatus}
        statusMut={statusMut}
        sort={sort} toggleSort={toggleSort}
        cell={cell} setCell={setCell} commitPrice={commitPrice}
        notify={notify}
      />

      {/* 3. Add/Edit Plate Form Drawer */}
      {editId != null && (
        <PlateDrawerForm
          form={form} setF={setF} setForm={setForm} formErr={formErr} blurValidateField={blurValidateField}
          notify={notify}
          showCost={canViewCost(st)}
          saving={saving} uploading={uploading}
          plateTypes={catOpts(plateTypes)}
          provinces={catOpts(provinces)}
          vehicleTypes={catOpts(vehicleTypes)}
          onPlateNumberChange={handlePlateNumberChange}
          editDetail={editPlateId ? editDetail : null}
          onSave={handleSave}
          onUpload={handleUpload}
          onRemoveImage={removeImage}
          onClose={() => { setEditId(null); setEditPlateId(null); setForm(INITIAL_FORM); setFormErr({}); }}
          setPreviewImageUrl={setPreviewImageUrl}
        />
      )}

      {/* 4. Modals (Confirm delete, bulk delete, bulk seed info, bulk gen images, preview image) */}
      <PlateBulkModals
        confirmDelete={confirmDelete}
        setConfirmDelete={setConfirmDelete}
        pendingCount={pendingCount}
        handleDelete={handleDelete}
        hideInsteadOfDelete={hideInsteadOfDelete}
        deleteMut={deleteMut}
        previewImageUrl={previewImageUrl}
        setPreviewImageUrl={setPreviewImageUrl}
        missingInfoPlates={missingInfoPlates}
        closeMissingInfoModal={closeMissingInfoModal}
        infoProgress={infoProgress}
        selectedInfoIds={selectedInfoIds}
        setSelectedInfoIds={setSelectedInfoIds}
        toggleInfoSelected={toggleInfoSelected}
        confirmBulkSeedInfo={confirmBulkSeedInfo}
        missingImagePlates={missingImagePlates}
        closeMissingImageModal={closeMissingImageModal}
        genProgress={genProgress}
        selectedGenIds={selectedGenIds}
        setSelectedGenIds={setSelectedGenIds}
        toggleGenSelected={toggleGenSelected}
        confirmBulkGenerateImages={confirmBulkGenerateImages}
        generatedImagePlates={generatedImagePlates}
        closePurgeImageModal={closePurgeImageModal}
        purgeProgress={purgeProgress}
        selectedPurgeIds={selectedPurgeIds}
        setSelectedPurgeIds={setSelectedPurgeIds}
        togglePurgeSelected={togglePurgeSelected}
        confirmPurgeGeneratedImages={confirmPurgeGeneratedImages}
        confirmBulkDelete={confirmBulkDelete}
        setConfirmBulkDelete={setConfirmBulkDelete}
        bulkDelete={bulkDelete}
        selectedCount={selected.size}
      />
    </div>
  );
}
