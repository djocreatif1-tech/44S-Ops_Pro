import React, { useState } from 'react';
import {
  Coins,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Building2,
  DollarSign,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  CreditCard,
  ShieldCheck,
  Crown,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react';
import {
  NonRentalIncomeCategory,
  FinancialAccount,
  OperationalFinance,
  UserRole
} from '../../types';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import { getRolePermissions } from '../../utils/permissions';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { confirmDelete } from '../../utils/dialogService';

interface NonRentalIncomeManagerProps {
  categories: NonRentalIncomeCategory[];
  accounts: FinancialAccount[];
  finances: OperationalFinance[];
  userRole: UserRole;
  onAddCategory: (cat: NonRentalIncomeCategory) => void;
  onUpdateCategory: (cat: NonRentalIncomeCategory) => void;
  onDeleteCategory: (id: string) => void;
  onOpenAddFinanceModal?: (defaultCategoryId?: string) => void;
}

export const NonRentalIncomeManager: React.FC<NonRentalIncomeManagerProps> = ({
  categories = [],
  accounts = [],
  finances = [],
  userRole = 'owner',
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onOpenAddFinanceModal
}) => {
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safeFinances = Array.isArray(finances) ? finances : [];

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<NonRentalIncomeCategory | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<NonRentalIncomeCategory>>({
    code: '',
    name: '',
    description: '',
    defaultAmount: 0,
    isActive: true,
    defaultAccountId: safeAccounts[0]?.id || '',
    notes: ''
  });

  const perms = getRolePermissions(userRole);
  const isOwnerOrAdmin = perms.canManageNonRentalCategory;

  // Filtered categories
  const filteredCategories = safeCategories.filter((cat) => {
    if (!cat) return false;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (cat.name || '').toLowerCase().includes(q) ||
      (cat.code || '').toLowerCase().includes(q) ||
      ((cat.description || '').toLowerCase().includes(q));
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && cat.isActive) ||
      (statusFilter === 'inactive' && !cat.isActive);

    return matchesSearch && matchesStatus;
  });

  // Calculate historical revenue per category
  const categoryRevenueMap: Record<string, { totalAmount: number; count: number }> = {};
  safeFinances.forEach((f) => {
    if (f && f.type === 'income' && f.incomeSourceType === 'non_rental') {
      const key = f.nonRentalCategoryId || f.category;
      if (key) {
        if (!categoryRevenueMap[key]) {
          categoryRevenueMap[key] = { totalAmount: 0, count: 0 };
        }
        categoryRevenueMap[key].totalAmount += (f.amount || 0);
        categoryRevenueMap[key].count += 1;
      }
    }
  });

  const totalNonRentalRevenueAll = Object.values(categoryRevenueMap).reduce((sum, item) => sum + (item.totalAmount || 0), 0);

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormData({
      code: `INC-${Date.now().toString().slice(-4)}`,
      name: '',
      description: '',
      defaultAmount: 0,
      isActive: true,
      defaultAccountId: accounts[0]?.id || '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: NonRentalIncomeCategory) => {
    setEditingCategory(cat);
    setFormData({ ...cat });
    setIsModalOpen(true);
  };

  const handleToggleActive = (cat: NonRentalIncomeCategory) => {
    onUpdateCategory({
      ...cat,
      isActive: !cat.isActive
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    if (editingCategory) {
      onUpdateCategory({
        ...editingCategory,
        code: formData.code?.toUpperCase() || editingCategory.code,
        name: formData.name.trim(),
        description: formData.description || '',
        defaultAmount: Number(formData.defaultAmount) || 0,
        isActive: formData.isActive ?? true,
        defaultAccountId: formData.defaultAccountId || '',
        notes: formData.notes || ''
      });
    } else {
      const newCategory: NonRentalIncomeCategory = {
        id: 'NRC-' + Date.now().toString().slice(-4),
        code: formData.code?.toUpperCase() || `INC-${Math.floor(100 + Math.random() * 900)}`,
        name: formData.name.trim(),
        description: formData.description || '',
        defaultAmount: Number(formData.defaultAmount) || 0,
        isActive: formData.isActive ?? true,
        defaultAccountId: formData.defaultAccountId || accounts[0]?.id || '',
        notes: formData.notes || '',
        createdAt: new Date().toISOString().split('T')[0]
      };
      onAddCategory(newCategory);
    }

    setIsModalOpen(false);
  };

  const handleExportExcel = () => {
    const data = filteredCategories.map((c, i) => {
      const rev = categoryRevenueMap[c.id] || categoryRevenueMap[c.name] || { totalAmount: 0, count: 0 };
      const acc = accounts.find((a) => a.id === c.defaultAccountId);
      return {
        No: i + 1,
        'Kode Kategori': c.code,
        'Nama Kategori Pemasukan': c.name,
        Deskripsi: c.description,
        'Tarif / Nominal Acuan (Rp)': c.defaultAmount || 0,
        'Akun Kas Rekening Tujuan': acc ? acc.accountName : '-',
        Status: c.isActive ? 'Aktif' : 'Non-Aktif',
        'Total Riwayat Pemasukan (Rp)': rev.totalAmount,
        'Frekuensi Transaksi': rev.count,
        Catatan: c.notes || '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Master_Pemasukan_Non_Sewa');
    XLSX.writeFile(workbook, `Master_Pemasukan_Non_Sewa_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header bar
    doc.setFillColor(30, 58, 138); // blue-900
    doc.rect(0, 0, pageWidth, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FLEETOPS PRO - MASTER DATA PEMASUKAN DI LUAR SEWA ARMADA', 14, 11);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(219, 234, 254);
    doc.text('Katalog Kategori Pendapatan Lain-lain, Scrap, Klaim, Komisi & Jasa Workshop', 14, 18);

    const printDate = new Date().toLocaleString('id-ID');
    doc.text(`Dicetak: ${printDate}`, pageWidth - 14, 18, { align: 'right' });

    const tableRows = filteredCategories.map((c, i) => {
      const rev = categoryRevenueMap[c.id] || categoryRevenueMap[c.name] || { totalAmount: 0, count: 0 };
      const acc = accounts.find((a) => a.id === c.defaultAccountId);
      return [
        (i + 1).toString(),
        c.code,
        c.name,
        c.description,
        formatRupiah(c.defaultAmount || 0),
        acc ? acc.accountName : '-',
        c.isActive ? 'AKTIF' : 'NON-AKTIF',
        formatRupiah(rev.totalAmount)
      ];
    });

    autoTable(doc, {
      head: [['NO', 'KODE', 'NAMA KATEGORI', 'DESKRIPSI', 'TARIF ACUAN', 'REKENING DEFAULT', 'STATUS', 'TOTAL TRANSAKSI']],
      body: tableRows,
      startY: 32,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      theme: 'grid'
    });

    doc.save(`Master_Pemasukan_Non_Sewa_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Coins className="w-5 h-5 text-blue-600" />
              Master Data Pemasukan di Luar Sewa Armada
            </h2>
            {userRole === 'owner' && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
                <Crown className="w-3 h-3 text-amber-600" />
                Owner Privileges
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Konfigurasi jenis sumber pemasukan lain (bongkar muat, penjualan oli/scrap bengkel, klaim asuransi, fee subkon, jasa workshop luar, dan sewa lahan pool)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg shadow-xs transition"
            title="Export Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg shadow-xs transition"
            title="Export PDF"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
          {isOwnerOrAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Master Pemasukan</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards for Non-Rental Incomes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Total Kategori Terdaftar</p>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mt-2 font-mono">
            {categories.length} <span className="text-xs font-normal text-slate-400">Kategori</span>
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            {categories.filter((c) => c.isActive).length} Status Aktif &bull; {categories.filter((c) => !c.isActive).length} Non-Aktif
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Total Akumulasi Pemasukan Non-Sewa</p>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-700 mt-2 font-mono">
            {formatRupiah(totalNonRentalRevenueAll)}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Kontribusi laba di luar invoice sewa armada</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Hak Akses Konfigurasi Master</p>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-sm font-bold text-slate-800 mt-2 flex items-center gap-1.5">
            <span className="capitalize">{userRole === 'owner' ? 'Owner / Direksi Utama' : userRole}</span>
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            {isOwnerOrAdmin ? 'Dapat menambah, mengubah & mengatur tarif acuan' : 'Akses hanya lihat (Read-Only)'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode, nama kategori, deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
            {[
              { id: 'all', label: 'Semua Status' },
              { id: 'active', label: 'Aktif' },
              { id: 'inactive', label: 'Non-Aktif' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as typeof statusFilter)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle (Tabel Ringkas vs Kartu) */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel Kolom Ringkas"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabel Ringkas</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Kartu Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Categories Content: Table View (Default) or Compact Grid */}
      {viewMode === 'table' ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[820px]">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5 w-36">Kode &amp; Status</th>
                  <th className="py-2.5 px-3.5">Kategori Pemasukan &amp; Deskripsi</th>
                  <th className="py-2.5 px-3.5 text-right w-44">Tarif Acuan</th>
                  <th className="py-2.5 px-3.5 w-52">Rekening Kas Acuan</th>
                  <th className="py-2.5 px-3.5 text-right w-40">Total Realisasi</th>
                  <th className="py-2.5 px-3.5 text-center w-52">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCategories.map((cat, idx) => {
                  const rev = categoryRevenueMap[cat.id] || categoryRevenueMap[cat.name] || { totalAmount: 0, count: 0 };
                  const defaultAcc = accounts.find((a) => a.id === cat.defaultAccountId);

                  return (
                    <tr
                      key={cat.id}
                      className={`hover:bg-blue-50/40 transition duration-150 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      } ${!cat.isActive ? 'opacity-65' : ''}`}
                    >
                      {/* 1. Kode & Status */}
                      <td className="py-2.5 px-3.5 align-middle">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 shadow-2xs">
                            {cat.code}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              cat.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {cat.isActive ? 'Aktif' : 'Non-Aktif'}
                          </span>
                        </div>
                      </td>

                      {/* 2. Nama Kategori & Deskripsi */}
                      <td className="py-2.5 px-3.5 align-middle">
                        <div className="font-bold text-slate-900 text-xs">{cat.name}</div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 max-w-sm mt-0.5" title={cat.description}>
                          {cat.description || 'Tidak ada keterangan rinci.'}
                        </p>
                      </td>

                      {/* 3. Tarif Acuan */}
                      <td className="py-2.5 px-3.5 align-middle text-right">
                        {cat.defaultAmount ? (
                          <span className="font-mono font-bold text-slate-800 text-xs">
                            {formatRupiah(cat.defaultAmount)}
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400 italic">
                            Fleksibel / Realisasi
                          </span>
                        )}
                      </td>

                      {/* 4. Rekening Kas Acuan */}
                      <td className="py-2.5 px-3.5 align-middle">
                        <div className="flex items-center gap-1.5 text-slate-700 text-xs truncate max-w-[190px]">
                          <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate font-medium">{defaultAcc?.accountName || 'Kas Tunai Pool'}</span>
                        </div>
                      </td>

                      {/* 5. Total Realisasi */}
                      <td className="py-2.5 px-3.5 align-middle text-right">
                        <div className="font-mono font-bold text-emerald-700 text-xs">
                          {formatRupiah(rev.totalAmount)}
                        </div>
                        <span className="text-[10px] text-slate-400 font-sans">
                          ({rev.count}x transaksi)
                        </span>
                      </td>

                      {/* 6. Aksi Cepat */}
                      <td className="py-2.5 px-3.5 align-middle text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tombol Catat Masuk */}
                          {onOpenAddFinanceModal && cat.isActive && (
                            <button
                              onClick={() => onOpenAddFinanceModal(cat.id)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] rounded-lg transition border border-blue-200/80 cursor-pointer shadow-2xs whitespace-nowrap"
                              title={`Catat Pemasukan untuk ${cat.name}`}
                            >
                              + Catat Masuk
                            </button>
                          )}

                          {isOwnerOrAdmin && (
                            <div className="flex items-center gap-0.5 ml-1">
                              {/* Toggle Aktif */}
                              <button
                                onClick={() => handleToggleActive(cat)}
                                className="p-1 text-slate-400 hover:text-emerald-600 rounded transition cursor-pointer"
                                title={cat.isActive ? 'Non-aktifkan kategori' : 'Aktifkan kategori'}
                              >
                                {cat.isActive ? (
                                  <ToggleRight className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <ToggleLeft className="w-4 h-4 text-slate-400" />
                                )}
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => handleOpenEditModal(cat)}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded transition cursor-pointer"
                                title="Edit Master Data"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Hapus */}
                              <button
                                onClick={async () => {
                                  if (await confirmDelete(`Kategori Master "${cat.name}"`, 'Apakah Anda Yakin Ingin Menghapus Data?', `Kode: ${cat.code}`)) {
                                    onDeleteCategory(cat.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                title="Hapus Master Data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Categories Cards / Table Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCategories.map((cat) => {
            const rev = categoryRevenueMap[cat.id] || categoryRevenueMap[cat.name] || { totalAmount: 0, count: 0 };
            const defaultAcc = accounts.find((a) => a.id === cat.defaultAccountId);

            return (
              <div
                key={cat.id}
                className={`p-4 rounded-xl border transition relative flex flex-col justify-between ${
                  cat.isActive
                    ? 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                    : 'bg-slate-50/70 border-slate-200/80 opacity-75'
                }`}
              >
                <div>
                  {/* Top Badge & Code */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                        {cat.code}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                          cat.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {cat.isActive ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </div>

                    {isOwnerOrAdmin && (
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => handleToggleActive(cat)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition cursor-pointer"
                          title={cat.isActive ? 'Non-aktifkan kategori' : 'Aktifkan kategori'}
                        >
                          {cat.isActive ? (
                            <ToggleRight className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(cat)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition cursor-pointer"
                          title="Edit Master Data"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (await confirmDelete(`Kategori Master "${cat.name}"`, 'Apakah Anda Yakin Ingin Menghapus Data?', `Kode: ${cat.code}`)) {
                              onDeleteCategory(cat.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          title="Hapus Master Data"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Name & Description */}
                  <h3 className="text-sm font-bold text-slate-800 mb-1">{cat.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">
                    {cat.description || 'Tidak ada deskripsi rinci.'}
                  </p>

                  {/* Default Account & Rate info */}
                  <div className="space-y-1.5 py-2.5 border-y border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Tarif Acuan:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {cat.defaultAmount ? formatRupiah(cat.defaultAmount) : 'Fleksibel / Realisasi'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Rekening Kas:</span>
                      <span className="font-medium text-slate-700 flex items-center gap-1 truncate max-w-[170px]">
                        <Building2 className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="truncate">{defaultAcc?.accountName || 'Kas Tunai Pool'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Total Realized Revenue & Quick Action */}
                <div className="mt-3 pt-2.5 flex items-center justify-between gap-2 border-t border-slate-50">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Realisasi:</span>
                    <span className="text-xs font-bold font-mono text-emerald-700">
                      {formatRupiah(rev.totalAmount)}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">({rev.count}x)</span>
                  </div>

                  {onOpenAddFinanceModal && cat.isActive && (
                    <button
                      onClick={() => onOpenAddFinanceModal(cat.id)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] rounded-lg transition border border-blue-200/60 cursor-pointer shadow-2xs"
                    >
                      + Catat Masuk
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredCategories.length === 0 && (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <Coins className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">Tidak ada kategori master ditemukan</h4>
          <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau tambah kategori master baru.</p>
        </div>
      )}

      {/* Modal Add/Edit Category */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {editingCategory ? 'Edit Master Pemasukan Non-Sewa' : 'Tambah Master Kategori Pemasukan Non-Sewa'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Pengaturan kode, deskripsi, tarif acuan &amp; rekening default</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-slate-700 font-semibold block mb-1">Kode *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: JASA-MUAT"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono uppercase font-bold focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-slate-700 font-semibold block mb-1">Nama Kategori Pemasukan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jasa Bongkar Muat / Penjualan Scrap"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Deskripsi / Ruang Lingkup</label>
                <textarea
                  rows={2}
                  placeholder="Jelaskan kriteria dan sumber pemasukan non-sewa ini..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Tarif / Nominal Acuan (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 jika fleksibel"
                    value={formData.defaultAmount}
                    onChange={(e) => setFormData({ ...formData, defaultAmount: Number(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-hidden focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Isi 0 jika nominal selalu berubah</span>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Rekening Kas Default</label>
                  <select
                    value={formData.defaultAccountId}
                    onChange={(e) => setFormData({ ...formData, defaultAccountId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500 font-medium"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountName} ({a.accountType})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Ditagihkan langsung tunai oleh kasir pool"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Kategori Aktif &amp; Dapat Dipilih Saat Input Transaksi Keuangan
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCategory ? 'Simpan Perubahan' : 'Simpan Master Kategori'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
