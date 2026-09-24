import { useState } from 'react';
import toast from 'react-hot-toast';
import { useDebouncedValue } from '@mantine/hooks';
import {
  useAdminContacts,
  useUpdateContactStatus,
  useContactStats,
  useAssignContact,
  useDeleteContact,
  useDeletedContacts,
  useRestoreContact,
} from '../../services/adminContacts.js';
import { useCreatePaymentLink } from '../../services/paymentLinks.js';
import { useStaffLite } from '../../services/adminStaff.js';
import { useExportCsv } from '../../hooks/useExportCsv.js';
import { loadAuth } from '../../lib/authStore.js';

// Modular Contacts Subcomponents & Utils
import { STATUS_VAL } from './contacts/contactUtils.js';
import ContactTable from './contacts/ContactTable.jsx';
import ContactDetailModal from './contacts/ContactDetailModal.jsx';
import ContactModals from './contacts/ContactModals.jsx';

export default function AdminContacts({ notify, go, st }) {
  const [status, setStatus] = useState(st?.contactStatus || 'all');
  const [intent, setIntent] = useState('all');
  const [search, setSearch] = useState(st?.adminQ || '');
  const [q] = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('all');
  const [mobileView, setMobileView] = useState('card');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { exportCsv, loading: exporting } = useExportCsv('/api/admin/contact-requests');
  const { data: staffData } = useStaffLite();
  const staffList = staffData?.items || [];
  const currentUserId = loadAuth()?.user?.id;

  const { data, isLoading, isError, refetch } = useAdminContacts({
    status, intent, q, page, perPage: 20, assignedTo,
    ...(fromDate && { fromDate }), ...(toDate && { toDate }),
  });
  const updateStatus = useUpdateContactStatus();
  const assignContact = useAssignContact();
  const deleteContact = useDeleteContact();
  const { data: deletedData, isLoading: deletedLoading } = useDeletedContacts({ page: 1, limit: 20 });
  const restoreContact = useRestoreContact();
  const deletedItems = deletedData?.items || [];
  const [deleteTarget, setDeleteTarget] = useState(null);
  const createPaymentLink = useCreatePaymentLink();
  const [creatingLinkFor, setCreatingLinkFor] = useState(null);
  const [linkAmountFor, setLinkAmountFor] = useState(null);
  const [linkAmountInput, setLinkAmountInput] = useState('');
  const [upgrading, setUpgrading] = useState(null);
  const [viewingTx, setViewingTx] = useState(null);

  const { data: stats } = useContactStats({ intent, q });

  const result = data ?? { items: [], total: 0, page: 1, perPage: 20 };
  const totalPages = Math.max(1, Math.ceil(result.total / result.perPage));
  const statusCounts = {
    all: result.total,
    new: stats?.new ?? 0,
    consulting: stats?.consulting ?? 0,
    closed: stats?.closed ?? 0,
    found: stats?.found ?? 0,
    cancelled: stats?.cancelled ?? 0,
  };

  const openLinkAmountPopup = (contact) => {
    if (!contact.plateId) return;
    setLinkAmountInput('');
    setLinkAmountFor(contact);
  };

  const handleCreatePaymentLink = () => {
    const contact = linkAmountFor;
    const amount = Number(String(linkAmountInput).replace(/[^\d]/g, ''));
    if (!contact || !amount || amount <= 0) return;
    setCreatingLinkFor(contact.id);
    createPaymentLink.mutate({ contactRequestId: contact.id, amount }, {
      onSuccess: (link) => {
        toast.success('Đã tạo link ZaloPay — gửi cho khách qua Zalo OA');
        setSelected((s) => (s && s.id === contact.id ? { ...s, paymentLink: link } : s));
        setLinkAmountFor(null);
      },
      onError: (e) => toast.error(e.message || 'Tạo link thất bại'),
      onSettled: () => setCreatingLinkFor(null),
    });
  };

  const handleStatus = async (id, newStatusLabel) => {
    const nextVal = STATUS_VAL[newStatusLabel] || newStatusLabel;
    setUpdatingId(id);
    try {
      await updateStatus.mutateAsync({ id, status: nextVal });
      notify?.(`Đã chuyển sang "${newStatusLabel}"`);
    } catch (err) {
      notify?.(err?.message || 'Cập nhật trạng thái thất bại, thử lại.');
    } finally {
      setUpdatingId(null);
    }
  };

  const submitDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteContact.mutateAsync(deleteTarget.id);
      toast.success(`Đã chuyển liên hệ ${deleteTarget.fullName} vào Thùng rác`);
      setDeleteTarget(null);
      if (selected?.id === deleteTarget.id) setSelected(null);
    } catch (e) {
      toast.error(e.message || 'Xóa thất bại');
    }
  };

  const handleRestore = async (c) => {
    try {
      await restoreContact.mutateAsync(c.id);
      toast.success(`Đã khôi phục liên hệ ${c.fullName}`);
    } catch (e) {
      toast.error(e.message || 'Khôi phục thất bại');
    }
  };

  const activeFiltersCount = [
    status !== 'all' && status,
    intent !== 'all' && intent,
    assignedTo !== 'all' && assignedTo,
    fromDate,
    toDate,
  ].filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* 1. Main Contacts Table, Cards & Filters */}
      <ContactTable
        search={search} setSearch={setSearch}
        status={status} setStatus={setStatus}
        intent={intent} setIntent={setIntent}
        fromDate={fromDate} setFromDate={setFromDate}
        toDate={toDate} setToDate={setToDate}
        assignedTo={assignedTo} setAssignedTo={setAssignedTo}
        setPage={setPage} page={page} totalPages={totalPages}
        activeFiltersCount={activeFiltersCount}
        mobileFiltersOpen={mobileFiltersOpen} setMobileFiltersOpen={setMobileFiltersOpen}
        mobileView={mobileView} setMobileView={setMobileView}
        exportCsv={exportCsv} exporting={exporting}
        result={result} statusCounts={statusCounts}
        isLoading={isLoading} isError={isError} refetch={refetch}
        staffList={staffList}
        setSelected={setSelected}
        updatingId={updatingId}
        handleStatus={handleStatus}
        setDeleteTarget={setDeleteTarget}
        setViewingTx={setViewingTx}
        assignContact={assignContact}
        notify={notify}
        deletedItems={deletedItems}
        deletedLoading={deletedLoading}
        restoreContact={restoreContact}
        handleRestore={handleRestore}
      />

      {/* 2. Contact Detail Modal */}
      <ContactDetailModal
        selected={selected}
        setSelected={setSelected}
        updatingId={updatingId}
        handleStatus={handleStatus}
        openLinkAmountPopup={openLinkAmountPopup}
        creatingLinkFor={creatingLinkFor}
        setViewingTx={setViewingTx}
        setUpgrading={setUpgrading}
        setDeleteTarget={setDeleteTarget}
        notify={notify}
      />

      {/* 3. Action Modals (Payment Link, Create Tx, View Tx, Delete) */}
      <ContactModals
        linkAmountFor={linkAmountFor}
        setLinkAmountFor={setLinkAmountFor}
        linkAmountInput={linkAmountInput}
        setLinkAmountInput={setLinkAmountInput}
        handleCreatePaymentLink={handleCreatePaymentLink}
        creatingLinkFor={creatingLinkFor}
        upgrading={upgrading}
        setUpgrading={setUpgrading}
        refetch={refetch}
        viewingTx={viewingTx}
        setViewingTx={setViewingTx}
        deleteTarget={deleteTarget}
        setDeleteTarget={setDeleteTarget}
        deleteContact={deleteContact}
        submitDelete={submitDelete}
        notify={notify}
      />
    </div>
  );
}
