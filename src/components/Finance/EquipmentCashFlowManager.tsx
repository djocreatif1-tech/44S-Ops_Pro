import React, { useState, useRef } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Truck,
  Building2,
  DollarSign,
  Package,
  Layers,
  ShieldCheck,
  AlertCircle,
  FileText,
  UploadCloud,
  Image as ImageIcon,
  Eye,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  X,
  Edit2,
  Trash2,
  Check,
  Tag,
  ShieldAlert,
  Download,
  Printer
} from 'lucide-react';
import {
  EquipmentCashFlow,
  EquipmentCategory,
  Vehicle,
  FinancialAccount,
  Driver,
  AdminStaff,
  UserRole
} from '../../types';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import {
  terbilangRupiah,
  printElementById,
  downloadEquipmentSlipPDF,
  resolveDriverFromData,
  resolveAdminCashierByRole
} from '../../utils/slipPrint';
import { TablePagination } from '../Common/TablePagination';
import { PrintOutPreviewStage } from '../Common/PrintPreviewControls';
import { SAMPLE_RECEIPT_IMAGE } from '../../data/initialData';
import { ModuleAnalyticsPanel } from '../Common/ModuleAnalyticsPanel';
import { BarChart3, ListFilter } from 'lucide-react';
import { confirmDelete } from '../../utils/dialogService';

interface EquipmentCashFlowManagerProps {
  equipmentList: EquipmentCashFlow[];
  vehicles: Vehicle[];
  accounts: FinancialAccount[];
  drivers?: Driver[];
  adminStaff?: AdminStaff[];
  userRole?: UserRole;
  onAddEquipment: (eq: EquipmentCashFlow) => void;
  onUpdateEquipment: (eq: EquipmentCashFlow) => void;
  onDeleteEquipment: (id: string) => void;
  onOpenRoleMatrix?: () => void;
}

const COMMON_CATEGORIES: EquipmentCategory[] = [
  'Alat Pengikat & Terpal Muatan',
  'Keselamatan & K3 (APAR, P3K, Rompi)',
  'Tool Kit & Perkakas Supir',
  'Peralatan Bengkel & Workshop',
  'Perangkat GPS & Telematika',
  'Kompresor & Perlengkapan Ban',
  'Lainnya'
];

export const EquipmentCashFlowManager: React.FC<EquipmentCashFlowManagerProps> = ({
  equipmentList = [],
  vehicles = [],
  accounts = [],
  drivers = [],
  adminStaff = [],
  userRole = 'owner',
  onAddEquipment,
  onUpdateEquipment,
  onDeleteEquipment,
  onOpenRoleMatrix
}) => {
  const safeList = Array.isArray(equipmentList) ? equipmentList : [];
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const safeAdminStaff = Array.isArray(adminStaff) ? adminStaff : [];

  const [moduleView, setModuleView] = useState<'data' | 'analytics'>('data');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');

  const getEquipCompany = (item: EquipmentCashFlow) => {
    if (item.ownerCompany) return item.ownerCompany;
    const v = safeVehicles.find(veh => veh.id === item.vehicleId || veh.nopol === item.nopol);
    return v?.ownerCompany || 'PT Transindo Logistik';
  };

  const companies = Array.from(
    new Set([
      ...safeVehicles.map(v => v.ownerCompany).filter(Boolean),
      ...safeList.map(i => getEquipCompany(i)).filter(Boolean)
    ])
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentCashFlow | null>(null);
  const [inspectedReceipt, setInspectedReceipt] = useState<EquipmentCashFlow | null>(null);
  const [printSlipItem, setPrintSlipItem] = useState<EquipmentCashFlow | null>(null);
  const [receiptZoom, setReceiptZoom] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<EquipmentCashFlow>>({
    equipmentName: '',
    category: 'Alat Pengikat & Terpal Muatan',
    type: 'expense',
    quantity: 1,
    unit: 'unit',
    unitPrice: 0,
    totalAmount: 0,
    vehicleId: safeVehicles[0]?.id || 'POOL-GENERAL',
    supplierOrStore: '',
    condition: 'baru',
    accountId: safeAccounts[0]?.id || '',
    paymentMethod: 'Cash / Uang Kas',
    receiptNumber: '',
    receiptProofUrl: '',
    recipientDriverId: safeDrivers[0]?.id || '',
    recipientName: safeDrivers[0]?.name || '',
    recipientNip: safeDrivers[0]?.nip || '',
    recipientRole: safeDrivers[0]?.jobTitle || 'Pengemudi Utama (Driver)',
    handoverBy: safeAdminStaff[0]?.name || 'Hendra Kusuma, A.Md. (Kepala Gudang)',
    notes: '',
    date: new Date().toISOString().slice(0, 10)
  });

  // Filtered List
  const filteredList = safeList.filter((item) => {
    if (!item) return false;
    const compName = getEquipCompany(item);
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.equipmentName.toLowerCase().includes(q) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.supplierOrStore && item.supplierOrStore.toLowerCase().includes(q)) ||
      (item.nopol && item.nopol.toLowerCase().includes(q)) ||
      (item.recipientName && item.recipientName.toLowerCase().includes(q)) ||
      (item.recipientNip && item.recipientNip.toLowerCase().includes(q)) ||
      (item.receiptNumber && item.receiptNumber.toLowerCase().includes(q)) ||
      compName.toLowerCase().includes(q);

    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesVehicle =
      vehicleFilter === 'all' ||
      item.vehicleId === vehicleFilter ||
      (vehicleFilter === 'POOL-GENERAL' && (!item.vehicleId || item.vehicleId === 'POOL-GENERAL'));
    const matchesCondition = conditionFilter === 'all' || item.condition === conditionFilter;
    const matchesCompany = companyFilter === 'all' || compName === companyFilter;

    return matchesSearch && matchesCategory && matchesVehicle && matchesCondition && matchesCompany;
  });

  // Metrics
  const totalExpense = filteredList
    .filter((e) => e.type === 'expense')
    .reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  const totalItemsCount = filteredList.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const goodConditionCount = filteredList.filter((e) => e.condition === 'baru' || e.condition === 'bagus').length;
  const needServiceCount = filteredList.filter((e) => e.condition === 'perlu_servis' || e.condition === 'rusak').length;

  // Pagination Slice
  const totalFiltered = filteredList.length;
  const paginatedList = filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAdd = () => {
    setEditingItem(null);
    const defaultVeh = safeVehicles[0];
    const matchedDriver =
      safeDrivers.find((d) => d.name === defaultVeh?.assignedDriver || d.assignedVehicle === defaultVeh?.nopol) ||
      safeDrivers[0];
    setFormData({
      equipmentName: '',
      category: 'Alat Pengikat & Terpal Muatan',
      type: 'expense',
      quantity: 1,
      unit: 'lembar',
      unitPrice: 750000,
      totalAmount: 750000,
      vehicleId: defaultVeh?.id || 'POOL-GENERAL',
      supplierOrStore: 'Toko Perlengkapan Armada Mandiri',
      condition: 'baru',
      accountId: safeAccounts[0]?.id || '',
      paymentMethod: 'Cash / Uang Kas',
      receiptNumber: 'EQ-' + Date.now().toString().slice(-4),
      receiptProofUrl: SAMPLE_RECEIPT_IMAGE,
      recipientDriverId: matchedDriver?.id || '',
      recipientName: matchedDriver?.name || '',
      recipientNip: matchedDriver?.nip || '',
      recipientRole: matchedDriver?.jobTitle || 'Pengemudi Utama (Driver)',
      handoverBy: 'Hendra Kusuma, A.Md. (Kepala Gudang)',
      notes: '',
      date: new Date().toISOString().slice(0, 10)
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: EquipmentCashFlow) => {
    setEditingItem(item);
    setFormData({
      ...item,
      handoverBy: item.handoverBy || 'Hendra Kusuma, A.Md. (Kepala Gudang)'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Harap unggah file gambar (JPG, PNG, WebP) nota fisik.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFormError('Ukuran file maksimal 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({
        ...prev,
        receiptProofUrl: event.target?.result as string
      }));
      setFormError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.equipmentName?.trim()) {
      setFormError('Nama peralatan atau barang wajib diisi!');
      return;
    }

    if (!formData.receiptProofUrl) {
      setFormError('Wajib melampirkan foto bukti nota/kwitansi pembelian peralatan demi akuntabilitas keuangan!');
      return;
    }

    const matchedVeh = safeVehicles.find((v) => v.id === formData.vehicleId);
    const nopol = matchedVeh ? matchedVeh.nopol : formData.vehicleId === 'POOL-GENERAL' ? 'KAS OPERASIONAL POOL' : 'Pool Umum';
    const ownerCompany = matchedVeh ? matchedVeh.ownerCompany : 'PT Transindo Logistik';
    const matchedAcc = safeAccounts.find((a) => a.id === formData.accountId);
    const accountName = matchedAcc ? matchedAcc.accountName : 'Kasir Tunai Pool (Petty Cash)';

    const qty = Number(formData.quantity) || 1;
    const price = Number(formData.unitPrice) || 0;
    const total = qty * price;

    if (editingItem) {
      onUpdateEquipment({
        ...editingItem,
        ...formData,
        equipmentName: formData.equipmentName.trim(),
        quantity: qty,
        unitPrice: price,
        totalAmount: total,
        nopol,
        ownerCompany,
        accountName,
        recipientDriverId: formData.recipientDriverId || '',
        recipientName: formData.recipientName || '',
        recipientNip: formData.recipientNip || '',
        recipientRole: formData.recipientRole || '',
        handoverBy: formData.handoverBy || 'Hendra Kusuma, A.Md. (Kepala Gudang)'
      } as EquipmentCashFlow);
    } else {
      const newItem: EquipmentCashFlow = {
        id: 'EQ-' + Date.now().toString().slice(-4),
        date: formData.date || new Date().toISOString().slice(0, 10),
        equipmentName: formData.equipmentName.trim(),
        category: formData.category || 'Alat Pengikat & Terpal Muatan',
        type: formData.type || 'expense',
        quantity: qty,
        unit: formData.unit || 'unit',
        unitPrice: price,
        totalAmount: total,
        vehicleId: formData.vehicleId || 'POOL-GENERAL',
        nopol,
        ownerCompany,
        supplierOrStore: formData.supplierOrStore || 'Vendor Perkakas',
        condition: formData.condition || 'baru',
        accountId: formData.accountId || safeAccounts[0]?.id || '',
        accountName,
        paymentMethod: formData.paymentMethod || 'Cash / Uang Kas',
        receiptNumber: formData.receiptNumber || 'EQ-' + Date.now().toString().slice(-4),
        receiptProofUrl: formData.receiptProofUrl,
        isReceiptVerified: true,
        recipientDriverId: formData.recipientDriverId || '',
        recipientName: formData.recipientName || '',
        recipientNip: formData.recipientNip || '',
        recipientRole: formData.recipientRole || '',
        handoverBy: formData.handoverBy || 'Hendra Kusuma, A.Md. (Kepala Gudang)',
        notes: formData.notes || '',
        createdAt: new Date().toISOString().slice(0, 10)
      };
      onAddEquipment(newItem);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Belanja Peralatan</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900 mt-2 font-mono">
            {formatRupiah(totalExpense)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Arus kas pengadaan &amp; servis alat</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Jumlah Unit Peralatan</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900 mt-2 font-mono">
            {totalItemsCount} <span className="text-xs font-normal text-slate-500">Item</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Tersebar di armada &amp; bengkel</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Kondisi Prima / Baru</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-emerald-600 mt-2 font-mono">
            {goodConditionCount} <span className="text-xs font-normal text-slate-500">Alat</span>
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-1">Siap pakai operasi perjalanan</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Perlu Servis / Rusak</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-amber-600 mt-2 font-mono">
            {needServiceCount} <span className="text-xs font-normal text-slate-500">Alat</span>
          </div>
          <div className="text-[11px] text-amber-600/80 mt-1">Perlu perbaikan atau ganti baru</div>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-600" />
              Arus Kas &amp; Inventaris Peralatan Armada
            </h3>
            <p className="text-xs text-slate-500">
              Catatan pembukuan pengadaan terpal, alat lashing muatan, dongkrak, APAR, GPS &amp; tool kit supir.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle: Data vs Analytics */}
            <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setModuleView('data')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  moduleView === 'data'
                    ? 'bg-white text-amber-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Daftar Belanja Alat</span>
              </button>
              <button
                type="button"
                onClick={() => setModuleView('analytics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  moduleView === 'analytics'
                    ? 'bg-indigo-600 text-white shadow-xs border border-indigo-700'
                    : 'text-indigo-700 hover:bg-indigo-50'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Laporan &amp; Analitik Alat</span>
              </button>
            </div>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Catat Belanja Peralatan</span>
            </button>
          </div>
        </div>

        {moduleView === 'data' && (
          <>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari alat, toko, nopol, PT..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white"
            />
          </div>

          <select
            value={companyFilter}
            onChange={(e) => {
              setCompanyFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-indigo-50/70 border border-indigo-200 rounded-lg text-indigo-900 font-bold focus:outline-hidden focus:border-indigo-500"
          >
            <option value="all">🏢 Semua Perusahaan</option>
            {companies.map((c) => (
              <option key={c} value={c}>
                🏢 {c}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-amber-500 focus:bg-white"
          >
            <option value="all">Semua Kategori Peralatan</option>
            {COMMON_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={vehicleFilter}
            onChange={(e) => {
              setVehicleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-amber-500 focus:bg-white"
          >
            <option value="all">Semua Alokasi Armada / Pool</option>
            <option value="POOL-GENERAL">Kas &amp; Gudang Pool Umum</option>
            {safeVehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nopol} ({v.brand} {v.model})
              </option>
            ))}
          </select>

          <select
            value={conditionFilter}
            onChange={(e) => {
              setConditionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-amber-500 focus:bg-white"
          >
            <option value="all">Semua Kondisi Alat</option>
            <option value="baru">Baru</option>
            <option value="bagus">Bagus / Layak Pakai</option>
            <option value="perlu_servis">Perlu Servis Bengkel</option>
            <option value="rusak">Rusak / Tidak Layak</option>
          </select>
        </div>

        {/* Ringkasan Mutasi & Pengeluaran Peralatan Per Perusahaan */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Mutasi Belanja Alat per Perusahaan:
          </span>
          <button
            type="button"
            onClick={() => {
              setCompanyFilter('all');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border cursor-pointer ${
              companyFilter === 'all'
                ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Semua ({safeList.length}) • {formatRupiah(safeList.reduce((s, i) => s + (i.totalAmount || 0), 0))}
          </button>
          {companies.map((comp) => {
            const compItems = safeList.filter((i) => getEquipCompany(i) === comp);
            const compSum = compItems.reduce((s, i) => s + (i.totalAmount || 0), 0);
            const isActive = companyFilter === comp;
            return (
              <button
                key={comp}
                type="button"
                onClick={() => {
                  setCompanyFilter(isActive ? 'all' : comp);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/40'
                }`}
              >
                <span>🏢 {comp}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {compItems.length}
                </span>
                <span className={`font-mono text-[10px] ${isActive ? 'text-amber-100' : 'text-rose-600'}`}>
                  {formatRupiah(compSum)}
                </span>
              </button>
            );
          })}
        </div>
        </>
        )}
      </div>

      {moduleView === 'analytics' ? (
        <ModuleAnalyticsPanel
          moduleType="equipment"
          title="Laporan & Analitik Arus Kas & Inventaris Peralatan Armada"
          subtitle="Analisis pengadaan terpal, alat lashing muatan, APAR K3, tool kit supir & kondisi kelayakan peralatan"
          equipmentList={safeList}
          vehicles={safeVehicles}
          drivers={safeDrivers}
        />
      ) : (
      /* Table Section */
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80">
                <th className="py-3 px-4 min-w-[120px]">Tanggal &amp; Nota</th>
                <th className="py-3 px-4 min-w-[200px]">Nama Peralatan &amp; Kategori</th>
                <th className="py-3 px-3 min-w-[90px] text-center">Jumlah</th>
                <th className="py-3 px-4 min-w-[150px] text-right">Harga &amp; Total (Rp)</th>
                <th className="py-3 px-4 min-w-[160px]">Alokasi Unit / Perusahaan</th>
                <th className="py-3 px-4 min-w-[150px]">Toko / Rekening</th>
                <th className="py-3 px-3 min-w-[110px] text-center">Kondisi Alat</th>
                <th className="py-3 px-3 min-w-[90px] text-center">Bukti Nota</th>
                <th className="py-3 px-3 min-w-[90px] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Wrench className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">Belum ada catatan belanja peralatan</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Klik "+ Catat Belanja Peralatan" untuk menambahkan pembukuan alat kerja armada
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedList.map((item) => {
                  const conditionBadge = {
                    baru: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    bagus: 'bg-blue-50 text-blue-700 border-blue-200',
                    perlu_servis: 'bg-amber-50 text-amber-700 border-amber-200',
                    rusak: 'bg-rose-50 text-rose-700 border-rose-200'
                  }[item.condition || 'baru'];

                  const conditionLabel = {
                    baru: 'Baru 100%',
                    bagus: 'Bagus / Siap',
                    perlu_servis: 'Perlu Servis',
                    rusak: 'Rusak / Afkir'
                  }[item.condition || 'baru'];

                  return (
                    <tr key={item.id} className="hover:bg-amber-50/20 transition duration-150">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{formatDateIndo(item.date)}</div>
                        <div className="font-mono text-[11px] text-slate-400">{item.receiptNumber || item.id}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.equipmentName}</div>
                        <div className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-medium mt-0.5 border border-amber-200/60">
                          <Tag className="w-2.5 h-2.5" />
                          <span>{item.category}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-slate-800 font-mono text-sm">{item.quantity}</span>{' '}
                        <span className="text-[11px] text-slate-400">{item.unit}</span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="font-bold font-mono text-slate-900 text-sm">
                          {formatRupiah(item.totalAmount)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          @{formatRupiah(item.unitPrice)}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{item.nopol || 'KAS POOL UMUM'}</span>
                        </div>
                        {item.recipientName && (
                          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                            <span>PJ Driver: {item.recipientName}</span>
                            {item.recipientNip && (
                              <span className="font-mono text-[9px] bg-emerald-50 border border-emerald-200 px-1 rounded">
                                {item.recipientNip}
                              </span>
                            )}
                          </div>
                        )}
                        {item.ownerCompany && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[140px]">{item.ownerCompany}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 truncate max-w-[140px]">
                          {item.supplierOrStore || '-'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {item.accountName || item.paymentMethod}
                        </div>
                        {item.handoverBy && (
                          <div className="text-[10px] text-indigo-600 truncate max-w-[140px] mt-0.5">
                            Serah: {item.handoverBy}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${conditionBadge}`}>
                          {conditionLabel}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {item.receiptProofUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              setInspectedReceipt(item);
                              setReceiptZoom(1);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Nota</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-rose-500 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            Tanpa Nota
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPrintSlipItem(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="Cetak Slip / Kwitansi Peralatan"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Edit Data Peralatan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (await confirmDelete(`Catatan Peralatan "${item.equipmentName}"`, 'Apakah Anda Yakin Ingin Menghapus Data?', `Kode: ${item.equipmentCode} • Armada: ${item.nopol || 'Gudang Pool'}`)) {
                                onDeleteEquipment(item.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Hapus Data Peralatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <TablePagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={totalFiltered}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={[6, 8, 12, 24]}
        />
      </div>
      )}

      {/* Modal: Tambah / Edit Belanja Peralatan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {editingItem ? 'Ubah Catatan Belanja Peralatan' : 'Tambah Belanja Peralatan Armada'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Catat pengeluaran perlengkapan unit, terpal, apar, tools kit &amp; serah terima ke karyawan driver
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Pembelian *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Nota / Kwitansi
                  </label>
                  <input
                    type="text"
                    value={formData.receiptNumber}
                    placeholder="Misal: NOT-EQ-0821"
                    onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Peralatan / Barang *
                </label>
                <input
                  type="text"
                  required
                  list="common-tools-list"
                  placeholder="Contoh: Terpal Truk Jumbo 8x12m Tebal A20 / APAR Powder 6kg"
                  value={formData.equipmentName}
                  onChange={(e) => setFormData({ ...formData, equipmentName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500"
                />
                <datalist id="common-tools-list">
                  <option value="Terpal Truk Jumbo 8x12m Tebal A20 Super" />
                  <option value="Tali Rantai & Sabuk Lashing Ratchet Tie Down 50mm x 10m" />
                  <option value="Dongkrak Hidrolik Botol 30 Ton Heavy Duty" />
                  <option value="APAR Tabung Powder 6kg + Bracket Besi Truk" />
                  <option value="GPS Tracker 4G OBD + Remote Engine Cut-off" />
                  <option value="Tool Kit Supir (Kunci Roda Palang & Obeng Set)" />
                  <option value="Kompresor Angin Portabel 150 PSI Heavy Duty" />
                  <option value="Rompi Reflektor Keselamatan K3 & Helm Proyek" />
                </datalist>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Peralatan *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as EquipmentCategory })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 bg-white"
                  >
                    {COMMON_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kondisi Alat Saat Pembelian
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 bg-white"
                  >
                    <option value="baru">Baru 100% (Gress Toko)</option>
                    <option value="bagus">Bagus / Bekas Berkualitas</option>
                    <option value="perlu_servis">Perlu Servis / Rekondisi</option>
                    <option value="rusak">Rusak / Cadangan Kanibal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah (Qty) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => {
                      const qty = Number(e.target.value) || 1;
                      const price = Number(formData.unitPrice) || 0;
                      setFormData({ ...formData, quantity: qty, totalAmount: qty * price });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    placeholder="lembar / set / unit"
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Satuan (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    required
                    value={formData.unitPrice}
                    onChange={(e) => {
                      const price = Number(e.target.value) || 0;
                      const qty = Number(formData.quantity) || 1;
                      setFormData({ ...formData, unitPrice: price, totalAmount: qty * price });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Total Display */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">Total Biaya Belanja Peralatan:</span>
                <span className="text-base font-black font-mono text-amber-700">
                  {formatRupiah((formData.quantity || 1) * (formData.unitPrice || 0))}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alokasi Unit Truk / Pool *
                  </label>
                  <select
                    value={formData.vehicleId}
                    onChange={(e) => {
                      const vId = e.target.value;
                      const matchedV = safeVehicles.find((v) => v.id === vId);
                      const matchedDrv = safeDrivers.find(
                        (d) => d.name === matchedV?.assignedDriver || d.assignedVehicle === matchedV?.nopol
                      );
                      setFormData({
                        ...formData,
                        vehicleId: vId,
                        recipientDriverId: matchedDrv?.id || formData.recipientDriverId,
                        recipientName: matchedDrv?.name || formData.recipientName,
                        recipientNip: matchedDrv?.nip || formData.recipientNip,
                        recipientRole: matchedDrv?.jobTitle || formData.recipientRole
                      });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 bg-white"
                  >
                    <option value="POOL-GENERAL">Kas &amp; Gudang Pool Umum</option>
                    {safeVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nopol} - {v.brand} {v.model} ({v.ownerCompany || 'PT Transindo'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Toko / Supplier / Penjual
                  </label>
                  <input
                    type="text"
                    value={formData.supplierOrStore}
                    placeholder="Contoh: Toko Terpal Jaya Glodok"
                    onChange={(e) => setFormData({ ...formData, supplierOrStore: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Referensi Serah Terima Peralatan ke Karyawan Driver / PJ Unit */}
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">
                    Referensi Serah Terima Peralatan (Karyawan Driver / PJ Unit)
                  </span>
                  {formData.recipientNip && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-emerald-700 border border-emerald-200">
                      NIP: {formData.recipientNip}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Diterima Oleh (Karyawan Driver / PJ Unit) *
                    </label>
                    <select
                      value={formData.recipientName || ''}
                      onChange={(e) => {
                        const selectedName = e.target.value;
                        const drv = safeDrivers.find((d) => d.name === selectedName);
                        const stf = safeAdminStaff.find((s) => s.name === selectedName);
                        setFormData({
                          ...formData,
                          recipientDriverId: drv?.id || stf?.id || '',
                          recipientName: selectedName,
                          recipientNip: drv?.nip || stf?.nikOrNip || '',
                          recipientRole: drv?.jobTitle || stf?.jobTitle || 'Penanggung Jawab Alat'
                        });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
                    >
                      <option value="">-- Pilih Karyawan Driver / Penerima Alat --</option>
                      <optgroup label="🚚 Data Karyawan Driver & Co-Driver">
                        {safeDrivers.map((d) => (
                          <option key={d.id} value={d.name}>
                            [{d.nip || d.id}] {d.name} — {d.jobTitle || d.simType} ({d.assignedVehicle || 'Pool'})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🏢 Staf Gudang / Mekanik / Operasional">
                        {safeAdminStaff.map((s) => (
                          <option key={s.id} value={s.name}>
                            [{s.nikOrNip}] {s.name} — {s.jobTitle}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Diserahkan Oleh (Petugas Gudang / Kasir)
                    </label>
                    <select
                      value={formData.handoverBy || ''}
                      onChange={(e) => setFormData({ ...formData, handoverBy: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
                    >
                      <option value="Hendra Kusuma, A.Md. (Kepala Gudang)">
                        Hendra Kusuma, A.Md. (Kepala Gudang)
                      </option>
                      {safeAdminStaff.map((s) => (
                        <option key={s.id} value={`${s.name} (${s.jobTitle})`}>
                          [{s.nikOrNip}] {s.name} ({s.jobTitle})
                        </option>
                      ))}
                      {safeDrivers.map((d) => (
                        <option key={d.id} value={`${d.name} (${d.nip || d.id})`}>
                          [{d.nip || d.id}] {d.name} (Driver)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sumber Rekening Kas/Bank *
                  </label>
                  <select
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 bg-white"
                  >
                    {safeAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountName} ({formatRupiah(a.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 bg-white"
                  >
                    <option value="Cash / Uang Kas">Cash / Tunai Kasir</option>
                    <option value="Transfer">Transfer Bank</option>
                    <option value="QRIS / E-Wallet">QRIS / E-Wallet</option>
                    <option value="Giro / Cek">Giro / Cek Perusahaan</option>
                  </select>
                </div>
              </div>

              {/* Upload Bukti Nota Wajib */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Lampiran Foto Bukti Nota Fisik * (Wajib)</span>
                  {formData.receiptProofUrl && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Foto Nota Terlampir
                    </span>
                  )}
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition"
                  >
                    <UploadCloud className="w-4 h-4 text-amber-600" />
                    <span>Unggah Bukti Nota</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, receiptProofUrl: SAMPLE_RECEIPT_IMAGE })}
                    className="text-[11px] text-amber-600 hover:text-amber-700 underline"
                  >
                    Gunakan Contoh Nota Resmi
                  </button>
                </div>

                {formData.receiptProofUrl && (
                  <div className="mt-2 relative w-28 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group">
                    <img
                      src={formData.receiptProofUrl}
                      alt="Pratinjau Nota"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, receiptProofUrl: '' })}
                        className="p-1 bg-white text-rose-600 rounded-full"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  placeholder="Misal: Nomor seri alat, jaminan garansi toko, atau lokasi penyimpanan alat di kabin supir"
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Pembelian Peralatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Inspeksi Bukti Nota */}
      {inspectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Inspeksi Nota: {inspectedReceipt.equipmentName}</span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  {inspectedReceipt.supplierOrStore} • {formatDateIndo(inspectedReceipt.date)} • {formatRupiah(inspectedReceipt.totalAmount)}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setReceiptZoom((z) => Math.min(z + 0.25, 2.5))}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-white border border-slate-200"
                  title="Perbesar"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setReceiptZoom((z) => Math.max(z - 0.25, 0.75))}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-white border border-slate-200"
                  title="Perkecil"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setInspectedReceipt(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-100 flex items-center justify-center min-h-[320px] max-h-[500px] overflow-auto">
              <img
                src={inspectedReceipt.receiptProofUrl}
                alt="Nota Fisik"
                style={{ transform: `scale(${receiptZoom})` }}
                className="max-w-full max-h-[460px] object-contain transition-transform duration-150 shadow-md rounded-lg"
              />
            </div>

            <div className="px-5 py-3 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 font-mono truncate">
                Alokasi: {inspectedReceipt.nopol || 'KAS POOL'} ({inspectedReceipt.ownerCompany || 'Perusahaan Aset'})
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const target = inspectedReceipt;
                    setInspectedReceipt(null);
                    setPrintSlipItem(target);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Kwitansi</span>
                </button>
                <button
                  onClick={() => setInspectedReceipt(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cetak Slip / Kwitansi Belanja Peralatan */}
      {printSlipItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto printable-slip-modal">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto printable-slip-card">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 print:hidden print-hide">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Pratinjau Cetak Kwitansi Belanja &amp; Serah Terima Peralatan</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    printElementById(
                      'printable-equipment-slip',
                      `Kwitansi_Peralatan_${printSlipItem.receiptNumber || printSlipItem.id}`
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Printer</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadEquipmentSlipPDF(printSlipItem)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintSlipItem(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <PrintOutPreviewStage
              documentLabel={`KWITANSI PERALATAN: ${printSlipItem.receiptNumber || printSlipItem.id}`}
            >
              <div id="printable-equipment-slip" className="p-6 bg-white space-y-4 font-mono text-slate-900 text-xs">
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 gap-3">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wide">
                      {printSlipItem.purchasedByCompany || printSlipItem.ownerCompany || 'PT TRANSINDO LOGISTIK INDONESIA'}
                    </h3>
                    <p className="text-[10px] text-slate-600">
                      44S OPS_PRO • DIVISI LOGISTIK, SPAREPART &amp; PERALATAN ARMADA
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="border-2 border-indigo-800 text-indigo-800 bg-indigo-50 px-2.5 py-1 font-black text-xs uppercase">
                      {printSlipItem.type === 'income' ? 'KWITANSI PENJUALAN SCRAP' : 'KWITANSI BELANJA & SERAH TERIMA ALAT'}
                    </div>
                    <div className="text-[11px] font-bold mt-1">
                      NO: {printSlipItem.receiptNumber || printSlipItem.id}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-slate-500">Tanggal:</span>{' '}
                    <span className="font-bold">{formatDateIndo(printSlipItem.date)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Alokasi Unit:</span>{' '}
                    <span className="font-bold">{printSlipItem.nopol || 'KAS POOL UMUM'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Toko / Supplier:</span>{' '}
                    <span className="font-bold">{printSlipItem.supplierOrStore || '-'}</span>
                  </div>
                  {printSlipItem.recipientName && (
                    <div className="col-span-2">
                      <span className="text-slate-500">Diterima Oleh (Karyawan Driver/PIC):</span>{' '}
                      <span className="font-bold">
                        {
                          resolveDriverFromData({
                            driverId: printSlipItem.recipientDriverId,
                            driverName: printSlipItem.recipientName,
                            driverNip: printSlipItem.recipientNip,
                            nopol: printSlipItem.nopol,
                            vehicleId: printSlipItem.vehicleId,
                            drivers: safeDrivers,
                            vehicles: safeVehicles
                          }).labelWithBracket
                        }
                      </span>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-slate-500">Rekening &amp; Metode:</span>{' '}
                    <span className="font-bold">
                      {printSlipItem.accountName || 'Kas Pool'} ({printSlipItem.paymentMethod})
                    </span>
                  </div>
                </div>

                <table className="w-full border border-slate-300 text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300">
                    <tr>
                      <th className="p-2 text-left">Nama Barang / Kategori</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Harga Satuan</th>
                      <th className="p-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border-r border-slate-200">
                        <div className="font-bold">{printSlipItem.equipmentName}</div>
                        <div className="text-[10px] text-slate-500">{printSlipItem.category}</div>
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center">
                        {printSlipItem.quantity} {printSlipItem.unit}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right">
                        {formatRupiah(printSlipItem.unitPrice)}
                      </td>
                      <td className="p-2 text-right font-bold">
                        {formatRupiah(printSlipItem.totalAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="p-3.5 rounded-xl border-2 border-indigo-700 bg-indigo-50/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-slate-700">TOTAL TRANSAKSI:</span>
                    <span className="text-lg font-black text-indigo-900">
                      {formatRupiah(printSlipItem.totalAmount)}
                    </span>
                  </div>
                  <div className="text-[11px] italic text-slate-700 border-t border-indigo-200 pt-1.5">
                    Terbilang: <span className="font-bold"># {terbilangRupiah(printSlipItem.totalAmount)} #</span>
                  </div>
                </div>

                {printSlipItem.notes && (
                  <div className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <span className="font-bold text-slate-500">Catatan:</span> {printSlipItem.notes}
                  </div>
                )}

                <div className="grid grid-cols-2 pt-3 text-center text-xs">
                  <div>
                    <p className="text-slate-500">
                      {printSlipItem.recipientName ? 'Diterima Oleh (Karyawan Driver),' : 'Toko / Pemasok / PIC,'}
                    </p>
                    <div className="h-14"></div>
                    <p className="font-bold underline">
                      {printSlipItem.recipientName
                        ? resolveDriverFromData({
                            driverId: printSlipItem.recipientDriverId,
                            driverName: printSlipItem.recipientName,
                            driverNip: printSlipItem.recipientNip,
                            nopol: printSlipItem.nopol,
                            vehicleId: printSlipItem.vehicleId,
                            drivers: safeDrivers,
                            vehicles: safeVehicles
                          }).labelWithParen
                        : printSlipItem.supplierOrStore || '(.........................)'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Diserahkan Oleh (Logistik / Kasir Pool),</p>
                    <div className="h-14"></div>
                    <p className="font-bold underline">
                      {resolveAdminCashierByRole(printSlipItem.handoverBy, userRole)}
                    </p>
                  </div>
                </div>

                <div className="text-[9px] text-center text-slate-400 pt-2 border-t border-slate-100">
                  Dicetak melalui 44S Ops_pro • Kwitansi Resmi Pengadaan &amp; Serah Terima Peralatan Armada
                </div>
              </div>
            </PrintOutPreviewStage>
          </div>
        </div>
      )}
    </div>
  );
};
