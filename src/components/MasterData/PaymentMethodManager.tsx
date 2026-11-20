import React, { useState } from 'react';
import {
  CreditCard,
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
  ShieldCheck,
  Crown,
  Wallet,
  Fuel,
  QrCode,
  CheckCircle2,
  Receipt,
  ArrowUpRight,
  Landmark
} from 'lucide-react';
import {
  PaymentMethod,
  PaymentMethodCategory,
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

interface PaymentMethodManagerProps {
  paymentMethods: PaymentMethod[];
  accounts: FinancialAccount[];
  finances: OperationalFinance[];
  userRole: UserRole;
  onAddPaymentMethod: (method: PaymentMethod) => void;
  onUpdatePaymentMethod: (method: PaymentMethod) => void;
  onDeletePaymentMethod: (id: string) => void;
  onAddAccount?: (acc: FinancialAccount) => void;
  onOpenAddFinanceModal?: (defaultPaymentMethod?: string) => void;
  onOpenRoleMatrix?: () => void;
}

export const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({
  paymentMethods = [],
  accounts = [],
  finances = [],
  userRole = 'owner',
  onAddPaymentMethod,
  onUpdatePaymentMethod,
  onDeletePaymentMethod,
  onAddAccount,
  onOpenAddFinanceModal,
  onOpenRoleMatrix
}) => {
  const safePaymentMethods = Array.isArray(paymentMethods) ? paymentMethods : [];
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safeFinances = Array.isArray(finances) ? finances : [];

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  // State for Add Company Account Modal on-the-fly
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [newAccountForm, setNewAccountForm] = useState<Partial<FinancialAccount>>({
    accountName: '',
    accountNumber: '',
    bankOrProvider: 'Bank Central Asia (BCA)',
    accountType: 'bank',
    companyName: 'PT Transindo Logistik',
    initialBalance: 0,
    currentBalance: 0,
    notes: ''
  });

  // State for Custom Category
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<PaymentMethod>>({
    code: '',
    name: '',
    category: 'transfer',
    description: '',
    defaultAccountId: safeAccounts[0]?.id || '',
    isActive: true,
    requiresProof: true,
    notes: ''
  });

  const perms = getRolePermissions(userRole);
  const isOwnerOrAdmin = perms.canManageNonRentalCategory || perms.canAddAccount;

  // Distinct company list
  const uniqueCompanies = Array.from(
    new Set(safeAccounts.map(a => a.companyName || 'PT Transindo Logistik').filter(Boolean))
  ) as string[];

  const handleSaveNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountForm.accountName || !newAccountForm.accountNumber) return;

    const newAcc: FinancialAccount = {
      id: 'ACC-' + Date.now().toString().slice(-4),
      accountName: newAccountForm.accountName,
      accountNumber: newAccountForm.accountNumber,
      bankOrProvider: newAccountForm.bankOrProvider || 'Bank Mandiri',
      accountType: newAccountForm.accountType || 'bank',
      companyName: newAccountForm.companyName || 'PT Transindo Logistik',
      initialBalance: Number(newAccountForm.initialBalance) || 0,
      currentBalance: Number(newAccountForm.initialBalance) || 0,
      isActive: true,
      notes: newAccountForm.notes || '',
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (onAddAccount) {
      onAddAccount(newAcc);
    }

    setFormData(prev => ({
      ...prev,
      defaultAccountId: newAcc.id,
      defaultAccountName: newAcc.accountName
    }));

    setIsAddAccountModalOpen(false);
    setNewAccountForm({
      accountName: '',
      accountNumber: '',
      bankOrProvider: 'Bank Central Asia (BCA)',
      accountType: 'bank',
      companyName: 'PT Transindo Logistik',
      initialBalance: 0,
      currentBalance: 0,
      notes: ''
    });
  };

  // Category Helpers
  const getCategoryMeta = (cat: PaymentMethodCategory) => {
    switch (cat) {
      case 'cash':
        return {
          label: 'Uang Tunai / Kas',
          icon: Wallet,
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      case 'transfer':
        return {
          label: 'Transfer Bank',
          icon: Building2,
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'etoll':
        return {
          label: 'Kartu E-Toll',
          icon: CreditCard,
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
        };
      case 'fuel_voucher':
        return {
          label: 'Kupon SPBU BBM',
          icon: Fuel,
          badgeColor: 'bg-orange-50 text-orange-700 border-orange-200'
        };
      case 'qris':
        return {
          label: 'QRIS Digital',
          icon: QrCode,
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
        };
      case 'giro_cek':
        return {
          label: 'Giro / Cek Tempo',
          icon: FileText,
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-300'
        };
      default:
        return {
          label: 'Lainnya',
          icon: DollarSign,
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
        };
    }
  };

  // Filtered payment methods
  const filteredMethods = safePaymentMethods.filter((m) => {
    if (!m) return false;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (m.name || '').toLowerCase().includes(q) ||
      (m.code || '').toLowerCase().includes(q) ||
      ((m.description || '').toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && m.isActive) ||
      (statusFilter === 'inactive' && !m.isActive);

    const matchesCategory =
      categoryFilter === 'all' || m.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Calculate historical usage & turnover per payment method
  const methodTurnoverMap: Record<string, { totalAmount: number; count: number; income: number; expense: number }> = {};
  safeFinances.forEach((f) => {
    if (f && f.paymentMethod) {
      const key = f.paymentMethod;
      if (!methodTurnoverMap[key]) {
        methodTurnoverMap[key] = { totalAmount: 0, count: 0, income: 0, expense: 0 };
      }
      methodTurnoverMap[key].totalAmount += (f.amount || 0);
      methodTurnoverMap[key].count += 1;
      if (f.type === 'income') {
        methodTurnoverMap[key].income += (f.amount || 0);
      } else {
        methodTurnoverMap[key].expense += (f.amount || 0);
      }
    }
  });

  const totalAllTurnover = Object.values(methodTurnoverMap).reduce((sum, item) => sum + (item.totalAmount || 0), 0);

  const handleOpenAddModal = () => {
    setEditingMethod(null);
    setFormData({
      code: `PM-${Date.now().toString().slice(-4)}`,
      name: '',
      category: 'transfer',
      description: '',
      defaultAccountId: accounts[0]?.id || '',
      isActive: true,
      requiresProof: true,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({ ...method });
    setIsModalOpen(true);
  };

  const handleToggleActive = (method: PaymentMethod) => {
    onUpdatePaymentMethod({
      ...method,
      isActive: !method.isActive
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    const selectedAcc = accounts.find((a) => a.id === formData.defaultAccountId);

    if (editingMethod) {
      onUpdatePaymentMethod({
        ...editingMethod,
        code: formData.code?.toUpperCase() || editingMethod.code,
        name: formData.name.trim(),
        category: (formData.category as PaymentMethodCategory) || editingMethod.category,
        description: formData.description || '',
        defaultAccountId: formData.defaultAccountId || '',
        defaultAccountName: selectedAcc ? selectedAcc.accountName : editingMethod.defaultAccountName,
        isActive: formData.isActive ?? true,
        requiresProof: formData.requiresProof ?? true,
        notes: formData.notes || ''
      });
    } else {
      const newMethod: PaymentMethod = {
        id: 'PM-' + Date.now().toString().slice(-4),
        code: formData.code?.toUpperCase() || `PM-${Math.floor(100 + Math.random() * 900)}`,
        name: formData.name.trim(),
        category: (formData.category as PaymentMethodCategory) || 'transfer',
        description: formData.description || '',
        defaultAccountId: formData.defaultAccountId || accounts[0]?.id || '',
        defaultAccountName: selectedAcc ? selectedAcc.accountName : 'Kasir Tunai Pool',
        isActive: formData.isActive ?? true,
        requiresProof: formData.requiresProof ?? true,
        notes: formData.notes || '',
        createdAt: new Date().toISOString().split('T')[0]
      };
      onAddPaymentMethod(newMethod);
    }

    setIsModalOpen(false);
  };

  const handleExportExcel = () => {
    const data = filteredMethods.map((m, i) => {
      const stats = methodTurnoverMap[m.name] || { totalAmount: 0, count: 0, income: 0, expense: 0 };
      const acc = accounts.find((a) => a.id === m.defaultAccountId);
      const catMeta = getCategoryMeta(m.category);

      return {
        No: i + 1,
        'Kode Metode': m.code,
        'Nama Metode Pembayaran': m.name,
        Kategori: catMeta.label,
        Deskripsi: m.description || '-',
        'Rekening Kas Terkait': acc ? acc.accountName : '-',
        'Wajib Bukti Nota': m.requiresProof ? 'Ya' : 'Tidak',
        Status: m.isActive ? 'Aktif' : 'Non-Aktif',
        'Total Riwayat Transaksi (Rp)': stats.totalAmount,
        'Frekuensi Transaksi': stats.count,
        'Total Pemasukan (Rp)': stats.income,
        'Total Pengeluaran (Rp)': stats.expense,
        Catatan: m.notes || '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Master_Metode_Pembayaran');
    XLSX.writeFile(workbook, `Master_Metode_Pembayaran_${new Date().toISOString().split('T')[0]}.xlsx`);
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
    doc.text('FLEETOPS PRO - MASTER DATA METODE PEMBAYARAN', 14, 11);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(219, 234, 254);
    doc.text('Daftar Konfigurasi Rekening Kas, Transfer Bank, E-Toll, Kupon SPBU, & QRIS Operasional', 14, 18);

    const printDate = new Date().toLocaleString('id-ID');
    doc.text(`Dicetak: ${printDate}`, pageWidth - 14, 18, { align: 'right' });

    const tableRows = filteredMethods.map((m, i) => {
      const stats = methodTurnoverMap[m.name] || { totalAmount: 0, count: 0 };
      const acc = accounts.find((a) => a.id === m.defaultAccountId);
      const catMeta = getCategoryMeta(m.category);

      return [
        (i + 1).toString(),
        m.code,
        m.name,
        catMeta.label,
        acc ? acc.accountName : '-',
        m.requiresProof ? 'WAJIB' : 'OPSIONAL',
        m.isActive ? 'AKTIF' : 'NON-AKTIF',
        formatRupiah(stats.totalAmount),
        `${stats.count}x`
      ];
    });

    autoTable(doc, {
      head: [['NO', 'KODE', 'METODE PEMBAYARAN', 'KATEGORI', 'REKENING DEFAULT', 'BUKTI NOTA', 'STATUS', 'TOTAL TRANSAKSI', 'FREQ']],
      body: tableRows,
      startY: 32,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      theme: 'grid'
    });

    doc.save(`Master_Metode_Pembayaran_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Master Data Metode Pembayaran
            </h2>
            {userRole === 'owner' && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
                <Crown className="w-3 h-3 text-amber-600" />
                Owner Privileges
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Konfigurasi seluruh jalur transaksi keuangan kas masuk &amp; keluar armada (Tunai Kasir Pool, Transfer Bank BCA/Mandiri, Kartu E-Toll, Kupon SPBU, QRIS, &amp; Giro)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg shadow-xs transition cursor-pointer"
            title="Export Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg shadow-xs transition cursor-pointer"
            title="Export PDF"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
          {isOwnerOrAdmin && (
            <>
              <button
                onClick={() => setIsAddAccountModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition border border-slate-200 shadow-xs cursor-pointer"
                title="Tambah Data Rekening Kas Perusahaan Baru"
              >
                <Landmark className="w-3.5 h-3.5 text-blue-600" />
                <span>+ Rekening Perusahaan</span>
              </button>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs active:scale-95 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Metode Pembayaran</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards for Payment Methods */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Total Metode Terdaftar</p>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mt-2 font-mono">
            {safePaymentMethods.length} <span className="text-xs font-normal text-slate-400">Metode</span>
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            {safePaymentMethods.filter((m) => m.isActive).length} Aktif &bull; {safePaymentMethods.filter((m) => !m.isActive).length} Non-Aktif
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Total Perputaran Nilai Transaksi</p>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-700 mt-2 font-mono">
            {formatRupiah(totalAllTurnover)}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Total arus perputaran kas masuk &amp; keluar armada</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Hak Akses Konfigurasi Master</p>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-sm font-bold text-slate-800 mt-2 flex items-center gap-1.5">
            <span className="capitalize">{userRole === 'owner' ? 'Owner / Direktur Utama' : userRole === 'admin1' ? 'Admin 1 (Ops & Keuangan)' : userRole}</span>
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            {isOwnerOrAdmin ? 'Dapat menambah, mengubah status aktif & rekening default' : 'Akses hanya lihat (Read-Only)'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode, nama metode, deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">Semua Kategori</option>
            <option value="cash">Uang Tunai / Kas</option>
            <option value="transfer">Transfer Bank</option>
            <option value="etoll">Kartu E-Toll</option>
            <option value="fuel_voucher">Kupon BBM SPBU</option>
            <option value="qris">QRIS Digital</option>
            <option value="giro_cek">Giro / Cek Tempo</option>
          </select>

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
        </div>
      </div>

      {/* Payment Methods Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMethods.map((method) => {
          const stats = methodTurnoverMap[method.name] || { totalAmount: 0, count: 0, income: 0, expense: 0 };
          const defaultAcc = accounts.find((a) => a.id === method.defaultAccountId);
          const catMeta = getCategoryMeta(method.category);
          const CatIcon = catMeta.icon;

          return (
            <div
              key={method.id}
              className={`p-5 rounded-2xl border transition relative flex flex-col justify-between ${
                method.isActive
                  ? 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                  : 'bg-slate-50/70 border-slate-200/80 opacity-75'
              }`}
            >
              <div>
                {/* Top Badge & Code */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                      {method.code}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border flex items-center gap-1 ${catMeta.badgeColor}`}
                    >
                      <CatIcon className="w-3 h-3" />
                      {catMeta.label}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                        method.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {method.isActive ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </div>

                  {isOwnerOrAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleActive(method)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition cursor-pointer"
                        title={method.isActive ? 'Non-aktifkan metode pembayaran' : 'Aktifkan metode pembayaran'}
                      >
                        {method.isActive ? (
                          <ToggleRight className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(method)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition cursor-pointer"
                        title="Edit Master Metode Pembayaran"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (await confirmDelete(`Master Metode Pembayaran "${method.name}"`, 'Apakah Anda Yakin Ingin Menghapus Data?', `Kode: ${method.code} • Kategori: ${method.category}`)) {
                            onDeletePaymentMethod(method.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                        title="Hapus Master Metode Pembayaran"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Name & Description */}
                <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{method.name}</span>
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4 min-h-[36px]">
                  {method.description || 'Tidak ada deskripsi rinci.'}
                </p>

                {/* Default Account & Requirements info */}
                <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Rekening Kas Acuan:</span>
                    <span className="font-medium text-slate-700 flex items-center gap-1 truncate max-w-[170px]">
                      <Building2 className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="truncate">{defaultAcc?.accountName || method.defaultAccountName || 'Kasir Tunai Pool'}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Kewajiban Bukti Nota:</span>
                    <span className="font-semibold flex items-center gap-1 text-[11px]">
                      {method.requiresProof ? (
                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Wajib Upload Nota
                        </span>
                      ) : (
                        <span className="text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                          Opsional
                        </span>
                      )}
                    </span>
                  </div>
                  {method.notes && (
                    <div className="flex items-start justify-between gap-2 pt-1">
                      <span className="text-slate-400 text-[10px]">Catatan:</span>
                      <span className="text-[10px] text-slate-500 text-right italic truncate max-w-[200px]">
                        {method.notes}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Total Realized Turnover & Quick Action */}
              <div className="mt-4 pt-3 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Perputaran:</span>
                  <span className="text-xs font-bold font-mono text-blue-700">
                    {formatRupiah(stats.totalAmount)}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1">({stats.count} transaksi)</span>
                </div>

                {onOpenAddFinanceModal && method.isActive && (
                  <button
                    onClick={() => onOpenAddFinanceModal(method.name)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] rounded-lg transition border border-blue-200/60 flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ Transaksi Kas</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredMethods.length === 0 && (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">Tidak ada master metode pembayaran ditemukan</h4>
          <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau tambah master metode pembayaran baru.</p>
        </div>
      )}

      {/* Modal Add/Edit Payment Method */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {editingMethod ? 'Edit Master Metode Pembayaran' : 'Tambah Master Metode Pembayaran'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Pengaturan kode, nama, kategori, rekening kas &amp; validasi bukti</p>
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
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-slate-700 font-semibold block mb-1">Kode Master *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: TRF-BNI"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono uppercase font-bold focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-slate-700 font-semibold block mb-1">Nama Metode Pembayaran *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Transfer Bank BNI / Mandiri Livin"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-semibold block">Kategori Transaksi *</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(!isCustomCategory)}
                      className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold hover:underline cursor-pointer"
                    >
                      {isCustomCategory ? 'Pilih dari Standar' : '+ Tambah Kategori Baru'}
                    </button>
                  </div>
                  {isCustomCategory ? (
                    <input
                      type="text"
                      required
                      placeholder="Ketik kategori baru (contoh: Virtual Account / Giro Khusus)"
                      value={customCategoryName}
                      onChange={(e) => {
                        setCustomCategoryName(e.target.value);
                        setFormData({ ...formData, category: e.target.value as any });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-hidden focus:border-blue-500"
                    />
                  ) : (
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomCategory(true);
                        } else {
                          setFormData({ ...formData, category: e.target.value as PaymentMethodCategory });
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-hidden focus:border-blue-500"
                    >
                      <option value="transfer">Transfer Bank (BCA, Mandiri, BRI, dll)</option>
                      <option value="cash">Uang Tunai / Kasir Pool / Kas Kecil</option>
                      <option value="etoll">Kartu E-Toll Fleet Pass (Flazz/e-Money)</option>
                      <option value="fuel_voucher">Kupon / Voucher SPBU Rekanan</option>
                      <option value="qris">QRIS Digital Merchant</option>
                      <option value="giro_cek">Bilyet Giro / Cek Perusahaan</option>
                      <option value="other">Lain-lain</option>
                      <option value="__custom__" className="font-semibold text-blue-600">+ Tambah Kategori Baru...</option>
                    </select>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-semibold block">Rekening Kas Default *</label>
                    <button
                      type="button"
                      onClick={() => setIsAddAccountModalOpen(true)}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Tambah Rekening</span>
                    </button>
                  </div>
                  <select
                    value={formData.defaultAccountId}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setIsAddAccountModalOpen(true);
                      } else {
                        setFormData({ ...formData, defaultAccountId: e.target.value });
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500 font-medium"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountName} ({a.accountType}) {a.companyName ? `[${a.companyName}]` : ''}
                      </option>
                    ))}
                    <option value="__add_new__" className="font-bold text-blue-600 bg-blue-50">
                      + Tambah Data Rekening Perusahaan Baru...
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Deskripsi &amp; Ruang Lingkup</label>
                <textarea
                  rows={2}
                  placeholder="Jelaskan peruntukan dan ketentuan penggunaan metode pembayaran ini..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Simpan struk fisik / lampirkan mutasi m-banking"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requiresProofToggle"
                    checked={formData.requiresProof}
                    onChange={(e) => setFormData({ ...formData, requiresProof: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="requiresProofToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Wajib Melampirkan Bukti / Kuitansi / Struk Nota Transaksi
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActiveMethodToggle"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="isActiveMethodToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Metode Pembayaran Aktif &amp; Dapat Dipilih Saat Input Transaksi Keuangan
                  </label>
                </div>
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
                  <span>{editingMethod ? 'Simpan Perubahan' : 'Simpan Master Metode'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Company Account on-the-fly */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Tambah Rekening Kas Perusahaan Baru
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Data rekening akan otomatis tersimpan di Master Referensi dan dapat dipilih
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddAccountModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewAccount} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Perusahaan Pemilik Rekening *
                </label>
                <input
                  type="text"
                  required
                  list="quick-account-company-list"
                  placeholder="Contoh: PT Transindo Logistik / PT Sinar Surya Persada"
                  value={newAccountForm.companyName || ''}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, companyName: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-hidden focus:border-blue-500"
                />
                <datalist id="quick-account-company-list">
                  <option value="PT Transindo Logistik" />
                  <option value="PT Sinar Surya Persada" />
                  <option value="CV Maju Jaya Logistik" />
                  <option value="PT Bahtera Kencana" />
                  {uniqueCompanies.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Nama Rekening / Akun Kas *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BCA Giro Operasional Fleet / BRI Pool Surabaya"
                  value={newAccountForm.accountName || ''}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, accountName: e.target.value })}
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
                    list="quick-bank-list"
                    placeholder="Contoh: Bank Central Asia (BCA)"
                    value={newAccountForm.bankOrProvider || ''}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, bankOrProvider: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-hidden focus:border-blue-500"
                  />
                  <datalist id="quick-bank-list">
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
                    value={newAccountForm.accountNumber || ''}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, accountNumber: e.target.value })}
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
                    value={newAccountForm.accountType || 'bank'}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, accountType: e.target.value })}
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
                    value={newAccountForm.initialBalance || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setNewAccountForm({ ...newAccountForm, initialBalance: val, currentBalance: val });
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Rekening giro utama untuk transaksi armada..."
                  value={newAccountForm.notes || ''}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, notes: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAccountModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Rekening Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
