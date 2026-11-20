import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  CreditCard,
  DollarSign,
  Wallet,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { FinancialAccount, CompanyDeposit, UserRole } from '../../types';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import { getRolePermissions } from '../../utils/permissions';
import { TablePagination } from '../Common/TablePagination';
import { confirmDelete } from '../../utils/dialogService';

interface CompanyAccountManagerProps {
  accounts: FinancialAccount[];
  companies?: CompanyDeposit[];
  userRole: UserRole;
  onAddAccount: (acc: FinancialAccount) => void;
  onUpdateAccount: (acc: FinancialAccount) => void;
  onDeleteAccount: (id: string) => void;
  onOpenRoleMatrix?: () => void;
}

export const CompanyAccountManager: React.FC<CompanyAccountManagerProps> = ({
  accounts = [],
  companies = [],
  userRole = 'owner',
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount
}) => {
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safeCompanies = Array.isArray(companies) ? companies : [];

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);

  const [formData, setFormData] = useState<Partial<FinancialAccount>>({
    accountName: '',
    accountNumber: '',
    bankOrProvider: 'Bank Central Asia (BCA)',
    accountType: 'bank',
    companyName: 'PT Transindo Logistik',
    initialBalance: 0,
    currentBalance: 0,
    isActive: true,
    color: '#2563eb',
    notes: ''
  });

  const perms = getRolePermissions(userRole);
  const isOwnerOrAdmin = perms.canAddAccount;

  // Distinct company list (from registered deposit companies and accounts)
  const uniqueCompanies = Array.from(
    new Set([
      'PT Transindo Logistik (Fleet Pusat)',
      ...safeCompanies.map(c => c.companyName),
      ...safeAccounts.map(a => a.companyName || 'PT Transindo Logistik')
    ].filter(Boolean))
  ) as string[];

  // Filtered Accounts
  const filteredAccounts = safeAccounts.filter(acc => {
    const q = (searchQuery || '').toLowerCase();
    const accCompany = acc.companyName || 'PT Transindo Logistik';
    const matchesSearch =
      (acc.accountName || '').toLowerCase().includes(q) ||
      (acc.accountNumber || '').toLowerCase().includes(q) ||
      (acc.bankOrProvider || '').toLowerCase().includes(q) ||
      accCompany.toLowerCase().includes(q);

    const matchesType = typeFilter === 'all' || acc.accountType === typeFilter;
    const matchesCompany = companyFilter === 'all' || accCompany === companyFilter;

    return matchesSearch && matchesType && matchesCompany;
  });

  // Paginated Accounts
  const totalFilteredAccounts = filteredAccounts.length;
  const paginatedAccounts = filteredAccounts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setFormData({
      accountName: '',
      accountNumber: '',
      bankOrProvider: 'Bank Central Asia (BCA)',
      accountType: 'bank',
      companyName: 'PT Transindo Logistik',
      initialBalance: 0,
      currentBalance: 0,
      isActive: true,
      color: '#2563eb',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: FinancialAccount) => {
    setEditingAccount(acc);
    setFormData({
      ...acc,
      companyName: acc.companyName || 'PT Transindo Logistik'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountName || !formData.accountNumber) return;

    if (editingAccount) {
      onUpdateAccount({
        ...editingAccount,
        ...formData,
        companyName: formData.companyName || 'PT Transindo Logistik',
        initialBalance: Number(formData.initialBalance) || 0,
        currentBalance: Number(formData.currentBalance ?? formData.initialBalance) || 0
      } as FinancialAccount);
    } else {
      const newAcc: FinancialAccount = {
        id: 'ACC-' + Date.now().toString().slice(-4),
        accountName: formData.accountName || '',
        accountNumber: formData.accountNumber || '',
        bankOrProvider: formData.bankOrProvider || 'Bank Mandiri',
        accountType: formData.accountType || 'bank',
        companyName: formData.companyName || 'PT Transindo Logistik',
        initialBalance: Number(formData.initialBalance) || 0,
        currentBalance: Number(formData.initialBalance) || 0,
        isActive: formData.isActive ?? true,
        color: formData.color || '#2563eb',
        notes: formData.notes || '',
        createdAt: new Date().toISOString().split('T')[0]
      };
      onAddAccount(newAcc);
    }
    setIsModalOpen(false);
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return Landmark;
      case 'cash':
        return Wallet;
      case 'etoll':
        return CreditCard;
      default:
        return Building2;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-blue-600" />
            <span>Master Data Rekening Perusahaan &amp; Kas</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola daftar rekening bank operasional, kasir kas pool, dan kartu transaksi per perusahaan
          </p>
        </div>

        {isOwnerOrAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-xs active:scale-95 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Rekening Perusahaan</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama rekening, no rekening, bank, PT..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 font-medium"
          >
            <option value="all">Semua Jenis Akun</option>
            <option value="bank">Rekening Bank (Giro/Tabungan)</option>
            <option value="cash">Kas Tunai Pool / Petty Cash</option>
            <option value="etoll">Kartu E-Toll / Fleet</option>
            <option value="other">Lainnya</option>
          </select>

          <select
            value={companyFilter}
            onChange={(e) => {
              setCompanyFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 font-medium"
          >
            <option value="all">Semua Perusahaan</option>
            {uniqueCompanies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Account Cards & Table View */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold tracking-wider text-[11px] uppercase">
                <th className="py-3.5 px-4 text-center w-12">#</th>
                <th className="py-3.5 px-4 min-w-[200px]">Nama Rekening &amp; Perusahaan</th>
                <th className="py-3.5 px-4 min-w-[150px]">Bank / Provider</th>
                <th className="py-3.5 px-4 min-w-[150px]">Nomor Rekening</th>
                <th className="py-3.5 px-4 min-w-[120px]">Jenis Kas</th>
                <th className="py-3.5 px-4 text-right min-w-[140px]">Saldo Buku Saat Ini</th>
                <th className="py-3.5 px-4 text-center min-w-[100px]">Status</th>
                <th className="py-3.5 px-4 text-center min-w-[120px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada rekening perusahaan yang cocok</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Ubah kata kunci pencarian atau tambah rekening baru</p>
                  </td>
                </tr>
              ) : (
                paginatedAccounts.map((acc, index) => {
                  const rowNumber = (currentPage - 1) * pageSize + index + 1;
                  const TypeIcon = getAccountTypeIcon(acc.accountType);

                  return (
                    <tr key={acc.id} className="hover:bg-blue-50/40 transition group cursor-default">
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-[11px]">
                        {rowNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <TypeIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-tight">{acc.accountName}</p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <p className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
                                <Building2 className="w-3 h-3 shrink-0" />
                                <span>{acc.companyName || 'PT Transindo Logistik'}</span>
                              </p>
                              {(() => {
                                const matchedComp = safeCompanies.find(
                                  c => c.companyName.toLowerCase() === (acc.companyName || '').toLowerCase() || c.id === acc.companyId
                                );
                                if (matchedComp) {
                                  return (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-1.5 py-0.2 rounded" title={`Saldo Deposit Klien: ${formatRupiah(matchedComp.currentBalance)}`}>
                                      <span>[{matchedComp.companyCode}]</span>
                                      <span>Deposit: {formatRupiah(matchedComp.currentBalance)}</span>
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700">{acc.bankOrProvider}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {acc.accountNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {acc.accountType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-slate-800 text-[13px]">
                          {formatRupiah(acc.currentBalance ?? acc.initialBalance)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          acc.isActive !== false
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {acc.isActive !== false ? 'AKTIF' : 'NON-AKTIF'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {isOwnerOrAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(acc)}
                                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                                title="Edit Rekening Perusahaan"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (await confirmDelete(`Rekening Perusahaan "${acc.accountName}"`, 'Apakah Anda Yakin Ingin Menghapus Data?', `${acc.bankOrProvider} • No: ${acc.accountNumber}`)) {
                                    onDeleteAccount(acc.id);
                                  }
                                }}
                                className="p-1.5 bg-white border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                                title="Hapus Rekening Perusahaan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="border-t border-slate-200">
          <TablePagination
            currentPage={currentPage}
            totalItems={totalFilteredAccounts}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20]}
            itemLabel="rekening perusahaan"
          />
        </div>
      </div>

      {/* Modal Add / Edit Account */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {editingAccount ? 'Edit Rekening Perusahaan' : 'Tambah Rekening Perusahaan Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Pengaturan nomor rekening, nama bank, dan kepemilikan PT</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Perusahaan Pemilik Rekening / Sumber Deposit *
                </label>
                <div className="space-y-1.5">
                  <select
                    value={formData.companyName || 'PT Transindo Logistik'}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      const matched = safeCompanies.find(c => c.companyName === selectedVal);
                      setFormData({
                        ...formData,
                        companyName: selectedVal,
                        companyId: matched ? matched.id : undefined
                      });
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-hidden focus:border-blue-500 cursor-pointer"
                  >
                    <option value="PT Transindo Logistik">🏢 PT Transindo Logistik (Kas Pusat / Fleet Utama)</option>
                    {safeCompanies.map((c) => (
                      <option key={c.id} value={c.companyName}>
                        🏢 {c.companyName} [{c.companyCode}] - Saldo Deposit: {formatRupiah(c.currentBalance)}
                      </option>
                    ))}
                    {uniqueCompanies
                      .filter(c => c !== 'PT Transindo Logistik' && !safeCompanies.some(sc => sc.companyName === c))
                      .map(c => (
                        <option key={c} value={c}>🏢 {c}</option>
                      ))}
                  </select>
                  <p className="text-[10px] text-slate-400">
                    Rekening ini terintegrasi langsung dengan master deposit perusahaan untuk mutasi saldo dan laporan operasional
                  </p>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Nama Rekening / Akun Kas *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BCA Giro Operasional Fleet / BRI Pool Surabaya"
                  value={formData.accountName || ''}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Bank / Lembaga Penyedia *
                  </label>
                  <input
                    type="text"
                    required
                    list="bank-list"
                    placeholder="Contoh: Bank Central Asia (BCA)"
                    value={formData.bankOrProvider || ''}
                    onChange={(e) => setFormData({ ...formData, bankOrProvider: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-hidden focus:border-blue-500"
                  />
                  <datalist id="bank-list">
                    <option value="Bank Central Asia (BCA)" />
                    <option value="Bank Mandiri" />
                    <option value="Bank Rakyat Indonesia (BRI)" />
                    <option value="Bank Negara Indonesia (BNI)" />
                    <option value="Bank Danamon" />
                    <option value="Bank CIMB Niaga" />
                    <option value="Kas Kantor Pool Utama" />
                    <option value="Mandiri E-Money Fleet" />
                    <option value="BCA Flazz Fleet" />
                  </datalist>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Nomor Rekening / No. Kartu *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 882-019-3388"
                    value={formData.accountNumber || ''}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Jenis / Klasifikasi Kas *
                  </label>
                  <select
                    value={formData.accountType || 'bank'}
                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="bank">Rekening Bank (Giro / Bisnis)</option>
                    <option value="cash">Kas Tunai Pool / Petty Cash</option>
                    <option value="etoll">Kartu E-Toll Fleet</option>
                    <option value="other">Lain-lain</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Saldo Awal (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.initialBalance || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setFormData({ ...formData, initialBalance: val, currentBalance: val });
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Misal: Digunakan khusus mutasi armada wilayah barat atau deposit klien..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="accountActiveToggle"
                  checked={formData.isActive !== false}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="accountActiveToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Rekening Aktif &amp; Dapat Dipilih di Seluruh Modul Transaksi
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingAccount ? 'Simpan Perubahan' : 'Simpan Rekening'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
