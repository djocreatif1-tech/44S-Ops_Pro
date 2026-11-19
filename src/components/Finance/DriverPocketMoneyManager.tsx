import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Truck,
  Users,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  DollarSign,
  FileText,
  Printer,
  Eye,
  Check,
  X,
  Edit2,
  Trash2,
  AlertCircle,
  Building2,
  Coins,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Navigation,
  Building,
  CreditCard,
  Download
} from 'lucide-react';
import {
  DriverPocketCashFlow,
  PocketAllowanceStatus,
  Vehicle,
  Driver,
  FinancialAccount,
  CompanyDeposit,
  AdminStaff,
  UserRole
} from '../../types';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import {
  terbilangRupiah,
  printElementById,
  downloadPocketSlipPDF
} from '../../utils/slipPrint';
import { TablePagination } from '../Common/TablePagination';
import { ReceiptUploadField } from '../Common/ReceiptUploadField';
import { PrintOutPreviewStage } from '../Common/PrintPreviewControls';
import { SAMPLE_RECEIPT_IMAGE } from '../../data/initialData';
import { ModuleAnalyticsPanel } from '../Common/ModuleAnalyticsPanel';
import { BarChart3, ListFilter } from 'lucide-react';
import { confirmDelete } from '../../utils/dialogService';

interface DriverPocketMoneyManagerProps {
  pocketFlows: DriverPocketCashFlow[];
  vehicles: Vehicle[];
  drivers: Driver[];
  accounts: FinancialAccount[];
  companyDeposits?: CompanyDeposit[];
  adminStaff?: AdminStaff[];
  userRole?: UserRole;
  onAddPocketFlow: (flow: DriverPocketCashFlow) => void;
  onUpdatePocketFlow: (flow: DriverPocketCashFlow) => void;
  onDeletePocketFlow: (id: string) => void;
  onOpenRoleMatrix?: () => void;
}

export const DriverPocketMoneyManager: React.FC<DriverPocketMoneyManagerProps> = ({
  pocketFlows = [],
  vehicles = [],
  drivers = [],
  accounts = [],
  companyDeposits = [],
  adminStaff = [],
  userRole = 'owner',
  onAddPocketFlow,
  onUpdatePocketFlow,
  onDeletePocketFlow,
  onOpenRoleMatrix
}) => {
  const safeFlows = Array.isArray(pocketFlows) ? pocketFlows : [];
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safeCompanyDeposits = Array.isArray(companyDeposits) ? companyDeposits : [];
  const safeAdminStaff = Array.isArray(adminStaff) ? adminStaff : [];

  const [moduleView, setModuleView] = useState<'data' | 'analytics'>('data');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [modalCompanyFilter, setModalCompanyFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isPrintSlipModalOpen, setIsPrintSlipModalOpen] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<DriverPocketCashFlow | null>(null);
  const [inspectedReceipt, setInspectedReceipt] = useState<DriverPocketCashFlow | null>(null);
  const [receiptZoom, setReceiptZoom] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State: Add Pocket Flow
  const [formData, setFormData] = useState<Partial<DriverPocketCashFlow>>({
    date: new Date().toISOString().slice(0, 10),
    tripCode: 'TS-' + new Date().toISOString().slice(0, 7).replace('-', '') + '-01',
    driverId: safeDrivers[0]?.id || 'DRV-001',
    driverNip: safeDrivers[0]?.nip || 'DRV-EMP-2020-001',
    driverName: safeDrivers[0]?.name || safeVehicles[0]?.assignedDriver || 'Bambang Sudiro',
    driverPhone: safeDrivers[0]?.phone || '0812-8871-9921',
    helperName: safeDrivers[0]?.helperName || 'Ujang',
    disbursedBy: safeAdminStaff[0]?.name || 'Rina Anggraini, S.E.',
    vehicleId: safeVehicles[0]?.id || '',
    originLocation: 'Quarry Rumpin, Bogor',
    destinationLocation: 'Batching Plant Puri Indah, Jakbar',
    driverAllowance: 250000,
    helperAllowance: 100000,
    fuelAllowance: 0,
    tollAllowance: 175000,
    loadingUnloadingCost: 50000,
    parkingAndWeighCost: 25000,
    emergencyFund: 50000,
    totalGiven: 650000,
    actualExpense: 0,
    remainingBalance: 650000,
    status: 'disbursed',
    accountId: safeAccounts[0]?.id || '',
    paymentMethod: 'Cash / Uang Kas',
    notes: 'Pencairan uang saku & sangu perjalanan armada.',
    receiptProofUrl: SAMPLE_RECEIPT_IMAGE
  });

  // Settle Form State
  const [settleActualExpense, setSettleActualExpense] = useState<number>(0);
  const [settleNotes, setSettleNotes] = useState<string>('');
  const [settleReceiptUrl, setSettleReceiptUrl] = useState<string>('');

  // 1. Daftar semua perusahaan terdaftar (pemilik armada, rekening operasional, & deposit)
  const registeredCompanies = useMemo(() => {
    const set = new Set<string>();
    safeAccounts.forEach((a) => {
      if (a.companyName) set.add(a.companyName.trim());
    });
    safeCompanyDeposits.forEach((d) => {
      if (d.companyName) set.add(d.companyName.trim());
    });
    safeVehicles.forEach((v) => {
      if (v.ownerCompany) set.add(v.ownerCompany.trim());
    });
    set.add('PT Transindo Logistik');
    return Array.from(set).filter(Boolean).sort();
  }, [safeAccounts, safeCompanyDeposits, safeVehicles]);

  // 2. Satukan semua sumber kas pencairan (Rekening Bank/Kas Perusahaan & Saldo Deposit Klien)
  const allCashSources = useMemo(() => {
    const list: Array<{
      id: string;
      rawId: string;
      companyName: string;
      accountName: string;
      accountNumber: string;
      bankOrProvider: string;
      currentBalance: number;
      accountType: 'bank' | 'cash' | 'etoll' | 'deposit' | string;
      isDeposit: boolean;
      color?: string;
    }> = [];

    // Rekening Operasional / Bank / Kas Kecil Perusahaan
    safeAccounts.forEach((acc) => {
      list.push({
        id: acc.id,
        rawId: acc.id,
        companyName: acc.companyName || 'PT Transindo Logistik',
        accountName: acc.accountName,
        accountNumber: acc.accountNumber,
        bankOrProvider: acc.bankOrProvider,
        currentBalance: acc.currentBalance,
        accountType: acc.accountType,
        isDeposit: false,
        color: acc.color
      });
    });

    // Rekening Saldo Deposit Perusahaan Klien / Rekanan Terdaftar
    safeCompanyDeposits.forEach((dep) => {
      list.push({
        id: `deposit_${dep.id}`,
        rawId: dep.id,
        companyName: dep.companyName,
        accountName: `Deposit Klien ${dep.companyName}`,
        accountNumber: dep.companyCode,
        bankOrProvider: 'Rekening Saldo Deposit Klien',
        currentBalance: dep.currentBalance,
        accountType: 'deposit',
        isDeposit: true,
        color: '#4f46e5'
      });
    });

    return list;
  }, [safeAccounts, safeCompanyDeposits]);

  // Filtering
  const filteredFlows = safeFlows.filter((flow) => {
    if (!flow) return false;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      flow.driverName.toLowerCase().includes(q) ||
      (flow.driverNip && flow.driverNip.toLowerCase().includes(q)) ||
      (flow.tripCode && flow.tripCode.toLowerCase().includes(q)) ||
      (flow.nopol && flow.nopol.toLowerCase().includes(q)) ||
      (flow.originLocation && flow.originLocation.toLowerCase().includes(q)) ||
      (flow.destinationLocation && flow.destinationLocation.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || flow.status === statusFilter;
    const matchesDriver = driverFilter === 'all' || flow.driverName === driverFilter;
    const matchesVehicle = vehicleFilter === 'all' || flow.vehicleId === vehicleFilter;
    const matchesCompany =
      companyFilter === 'all' ||
      flow.sourceCompanyName === companyFilter ||
      flow.ownerCompany === companyFilter;

    return matchesSearch && matchesStatus && matchesDriver && matchesVehicle && matchesCompany;
  });

  // Metrics
  const totalGivenSum = filteredFlows.reduce((sum, item) => sum + (item.totalGiven || 0), 0);
  const totalActualSum = filteredFlows.reduce((sum, item) => sum + (item.actualExpense || 0), 0);
  const totalRemainingSum = filteredFlows.reduce((sum, item) => sum + Math.max(0, item.remainingBalance || 0), 0);
  const activeTripsCount = filteredFlows.filter((f) => f.status === 'disbursed' || f.status === 'in_trip').length;

  // Pagination Slice
  const totalFiltered = filteredFlows.length;
  const paginatedFlows = filteredFlows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Recalculate Total Given
  const calculateTotalGiven = (current: Partial<DriverPocketCashFlow>) => {
    return (
      (Number(current.driverAllowance) || 0) +
      (Number(current.helperAllowance) || 0) +
      (Number(current.fuelAllowance) || 0) +
      (Number(current.tollAllowance) || 0) +
      (Number(current.loadingUnloadingCost) || 0) +
      (Number(current.parkingAndWeighCost) || 0) +
      (Number(current.emergencyFund) || 0)
    );
  };

  const handleOpenAdd = () => {
    setSelectedFlow(null);
    const initialVeh = safeVehicles[0];
    const initialDriver = safeDrivers[0];
    const targetComp = initialVeh?.ownerCompany || 'PT Transindo Logistik';
    
    // Temukan akun kas default berdasarkan perusahaan kendaraan atau akun pertama
    const matchedDefaultSource =
      allCashSources.find((s) => s.companyName === targetComp) || allCashSources[0];

    const def: Partial<DriverPocketCashFlow> = {
      date: new Date().toISOString().slice(0, 10),
      tripCode: 'TS-' + new Date().toISOString().slice(0, 7).replace('-', '') + '-' + Date.now().toString().slice(-3),
      driverId: initialDriver?.id || 'DRV-001',
      driverNip: initialDriver?.nip || 'DRV-EMP-2020-001',
      driverName: initialDriver?.name || initialVeh?.assignedDriver || 'Supir Armada',
      driverPhone: initialDriver?.phone || initialVeh?.driverPhone || '',
      helperName: initialDriver?.helperName || '',
      disbursedBy: safeAdminStaff[0] ? `${safeAdminStaff[0].name} (${safeAdminStaff[0].jobTitle})` : 'Rina Anggraini, S.E. (Kasir Pool)',
      vehicleId: initialVeh?.id || '',
      originLocation: 'Pool Utama',
      destinationLocation: 'Lokasi Klien',
      driverAllowance: 250000,
      helperAllowance: 80000,
      fuelAllowance: 0,
      tollAllowance: 150000,
      loadingUnloadingCost: 50000,
      parkingAndWeighCost: 25000,
      emergencyFund: 50000,
      totalGiven: 605000,
      actualExpense: 0,
      remainingBalance: 605000,
      status: 'disbursed',
      accountId: matchedDefaultSource?.id || safeAccounts[0]?.id || '',
      paymentMethod: 'Cash / Uang Kas',
      notes: 'Pencairan uang saku & uang jalan supir.',
      receiptProofUrl: SAMPLE_RECEIPT_IMAGE
    };
    setFormData(def);
    setModalCompanyFilter('all');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenSettle = (flow: DriverPocketCashFlow) => {
    setSelectedFlow(flow);
    setSettleActualExpense(flow.actualExpense > 0 ? flow.actualExpense : flow.totalGiven);
    setSettleNotes(flow.notes || 'Pertanggungjawaban uang jalan selesai di kasir.');
    setSettleReceiptUrl(flow.receiptProofUrl || SAMPLE_RECEIPT_IMAGE);
    setIsSettleModalOpen(true);
  };

  const handleOpenPrintSlip = (flow: DriverPocketCashFlow) => {
    setSelectedFlow(flow);
    setIsPrintSlipModalOpen(true);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.driverName?.trim()) {
      setFormError('Nama supir penerima uang saku wajib diisi!');
      return;
    }

    const matchedVeh = safeVehicles.find((v) => v.id === formData.vehicleId);
    const nopol = matchedVeh ? matchedVeh.nopol : 'KAS OPERASIONAL POOL';
    const ownerCompany = matchedVeh ? matchedVeh.ownerCompany : 'PT Transindo Logistik';
    const matchedDriver = safeDrivers.find((d) => d.name === formData.driverName);

    // Cari sumber kas yang dipilih di seluruh perusahaan terdaftar
    const selectedSource =
      allCashSources.find((s) => s.id === formData.accountId) ||
      allCashSources[0];

    const sourceCompanyName = selectedSource ? selectedSource.companyName : ownerCompany;
    const accountName = selectedSource ? selectedSource.accountName : 'Kasir Tunai Pool (Petty Cash)';
    const sourceAccountType = selectedSource ? selectedSource.accountType : 'bank';

    const total = calculateTotalGiven(formData);

    const newFlow: DriverPocketCashFlow = {
      id: 'SAKU-' + Date.now().toString().slice(-4),
      tripSheetId: formData.tripSheetId || 'TS-' + Date.now().toString().slice(-4),
      tripCode: formData.tripCode || 'TRIP-' + Date.now().toString().slice(-6),
      date: formData.date || new Date().toISOString().slice(0, 10),
      driverId: formData.driverId || matchedDriver?.id || '',
      driverNip: formData.driverNip || matchedDriver?.nip || '',
      driverName: formData.driverName.trim(),
      driverPhone: formData.driverPhone || matchedDriver?.phone || '',
      helperName: formData.helperName || '',
      disbursedBy: formData.disbursedBy || 'Rina Anggraini, S.E. (Kasir Pool)',
      receivedBy: formData.driverName.trim(),
      vehicleId: formData.vehicleId || safeVehicles[0]?.id || '',
      nopol,
      ownerCompany,
      sourceCompanyId: selectedSource?.id,
      sourceCompanyName,
      sourceAccountType,
      originLocation: formData.originLocation || 'Pool Utama',
      destinationLocation: formData.destinationLocation || 'Lokasi Tujuan',
      driverAllowance: Number(formData.driverAllowance) || 0,
      helperAllowance: Number(formData.helperAllowance) || 0,
      fuelAllowance: Number(formData.fuelAllowance) || 0,
      tollAllowance: Number(formData.tollAllowance) || 0,
      loadingUnloadingCost: Number(formData.loadingUnloadingCost) || 0,
      parkingAndWeighCost: Number(formData.parkingAndWeighCost) || 0,
      emergencyFund: Number(formData.emergencyFund) || 0,
      totalGiven: total,
      actualExpense: 0,
      remainingBalance: total,
      status: formData.status || 'disbursed',
      accountId: formData.accountId || selectedSource?.id || safeAccounts[0]?.id || '',
      accountName,
      paymentMethod: formData.paymentMethod || 'Cash / Uang Kas',
      notes: formData.notes || '',
      receiptProofUrl: formData.receiptProofUrl || SAMPLE_RECEIPT_IMAGE,
      isReceiptVerified: true,
      verifiedBy: formData.disbursedBy || `Kasir Pool (${userRole.toUpperCase()})`,
      verifiedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      createdAt: new Date().toISOString().slice(0, 10)
    };

    onAddPocketFlow(newFlow);
    setIsAddModalOpen(false);
  };

  const handleSubmitSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlow) return;

    const actual = Number(settleActualExpense) || 0;
    const remaining = selectedFlow.totalGiven - actual;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const updated: DriverPocketCashFlow = {
      ...selectedFlow,
      actualExpense: actual,
      remainingBalance: remaining,
      status: remaining >= 0 ? 'settled' : 'settled',
      settlementDate: nowStr,
      notes: settleNotes,
      receiptProofUrl: settleReceiptUrl || selectedFlow.receiptProofUrl,
      isReceiptVerified: true,
      verifiedBy: `Kasir (${userRole.toUpperCase()})`,
      verifiedAt: nowStr
    };

    onUpdatePocketFlow(updated);
    setIsSettleModalOpen(false);
    setSelectedFlow(null);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Uang Saku Dicairkan</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900 mt-2 font-mono">
            {formatRupiah(totalGivenSum)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Plafon kas jalan supir disalurkan</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Realisasi Biaya Jalan</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-amber-600 mt-2 font-mono">
            {formatRupiah(totalActualSum)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Biaya aktual terpakai di lapangan</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sisa Uang Saku (Refund Kas)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-emerald-600 mt-2 font-mono">
            {formatRupiah(totalRemainingSum)}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-1">Saldo kembali disetor ke kasir</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Uang Saku Belum Settle</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-indigo-600 mt-2 font-mono">
            {activeTripsCount} <span className="text-xs font-normal text-slate-500">Trip</span>
          </div>
          <div className="text-[11px] text-indigo-600/80 mt-1">Sedang dibawa supir perjalanan</div>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              Arus Kas Saku &amp; Uang Jalan Perjalanan Driver
            </h3>
            <p className="text-xs text-slate-500">
              Pengelolaan pencairan uang makan supir, uang kernet, biaya e-toll, BBM jalan &amp; rekonsiliasi sisa saku.
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
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Transaksi Saku Driver</span>
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
                <span>Laporan &amp; Analitik Saku</span>
              </button>
            </div>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Cairkan Uang Saku Driver</span>
            </button>
          </div>
        </div>

        {moduleView === 'data' && (
          <>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari supir, nopol, trip..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
          >
            <option value="all">Semua Status Settle</option>
            <option value="disbursed">Dicairkan (Belum Berangkat)</option>
            <option value="in_trip">Dalam Perjalanan (Aktif)</option>
            <option value="settled">Selesai Rekonsiliasi (Settled)</option>
          </select>

          <select
            value={companyFilter}
            onChange={(e) => {
              setCompanyFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-emerald-500 focus:bg-white font-medium"
          >
            <option value="all">🏢 Semua Perusahaan Kas</option>
            {registeredCompanies.map((c) => (
              <option key={c} value={c}>
                🏢 {c}
              </option>
            ))}
          </select>

          <select
            value={driverFilter}
            onChange={(e) => {
              setDriverFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
          >
            <option value="all">Semua Karyawan Driver</option>
            {safeDrivers.map((d) => (
              <option key={d.id} value={d.name}>
                [{d.nip || d.id}] {d.name} ({d.simType})
              </option>
            ))}
          </select>

          <select
            value={vehicleFilter}
            onChange={(e) => {
              setVehicleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
          >
            <option value="all">Semua Kendaraan</option>
            {safeVehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nopol} - {v.brand} {v.model}
              </option>
            ))}
          </select>
        </div>

        {/* Ringkasan Mutasi & Pengeluaran Saku Driver Per Perusahaan */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Mutasi Saku per Perusahaan:
          </span>
          <button
            type="button"
            onClick={() => {
              setCompanyFilter('all');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border cursor-pointer ${
              companyFilter === 'all'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Semua ({safeFlows.length}) • {formatRupiah(safeFlows.reduce((s, f) => s + (f.totalGiven || 0), 0))}
          </button>
          {registeredCompanies.map((comp) => {
            const compItems = safeFlows.filter(
              (f) => f.sourceCompanyName === comp || f.ownerCompany === comp
            );
            const compSum = compItems.reduce((s, f) => s + (f.totalGiven || 0), 0);
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
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40'
                }`}
              >
                <span>🏢 {comp}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {compItems.length}
                </span>
                <span className={`font-mono text-[10px] ${isActive ? 'text-amber-200' : 'text-rose-600'}`}>
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
          moduleType="driver_pocket"
          title="Laporan & Analitik Arus Kas Saku & Uang Jalan Driver"
          subtitle="Analisis plafon uang saku diberikan vs realisasi pengeluaran lapangan & pengembalian sisa kas per karyawan driver"
          pocketFlows={safeFlows}
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
                <th className="py-3 px-4 min-w-[120px]">Tanggal &amp; Kode</th>
                <th className="py-3 px-4 min-w-[195px]">Karyawan Driver &amp; Serah Terima</th>
                <th className="py-3 px-4 min-w-[170px]">Armada &amp; Rute</th>
                <th className="py-3 px-4 min-w-[150px] text-right">Uang Saku Diberikan</th>
                <th className="py-3 px-4 min-w-[150px] text-right">Realisasi Biaya</th>
                <th className="py-3 px-4 min-w-[140px] text-right">Sisa / Saldo</th>
                <th className="py-3 px-3 min-w-[110px] text-center">Status Settle</th>
                <th className="py-3 px-3 min-w-[90px] text-center">Kwitansi</th>
                <th className="py-3 px-4 min-w-[130px] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedFlows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Wallet className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">Belum ada catatan pencairan uang saku supir</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Klik "+ Cairkan Uang Saku Driver" untuk mencatat uang jalan perjalanan armada
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedFlows.map((flow) => {
                  const statusBadge = {
                    draft: 'bg-slate-100 text-slate-700 border-slate-200',
                    disbursed: 'bg-blue-50 text-blue-700 border-blue-200',
                    in_trip: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    settled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    refunded: 'bg-teal-50 text-teal-700 border-teal-200'
                  }[flow.status || 'disbursed'];

                  const statusLabel = {
                    draft: 'Draft',
                    disbursed: 'Dicairkan',
                    in_trip: 'Dalam Perjalanan',
                    settled: 'Selesai Settle',
                    refunded: 'Sisa Disetor'
                  }[flow.status || 'disbursed'];

                  const matchedDrv = safeDrivers.find((d) => d.name === flow.driverName || d.id === flow.driverId);
                  const displayNip = flow.driverNip || matchedDrv?.nip;

                  return (
                    <tr key={flow.id} className="hover:bg-emerald-50/20 transition duration-150">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{formatDateIndo(flow.date)}</div>
                        <div className="font-mono text-[11px] text-emerald-700 font-bold">{flow.tripCode}</div>
                      </td>

                      <td className="py-3 px-4">
                        {displayNip && (
                          <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block mb-0.5">
                            {displayNip}
                          </span>
                        )}
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{flow.driverName}</span>
                        </div>
                        {flow.helperName ? (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Kernet: <span className="font-semibold">{flow.helperName}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 mt-0.5">Tanpa kernet</div>
                        )}
                        {flow.disbursedBy && (
                          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                            Diserahkan: {flow.disbursedBy}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span>{flow.nopol}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate max-w-[180px]">
                          <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span>
                            {flow.originLocation} → {flow.destinationLocation}
                          </span>
                        </div>
                        <div className="text-[10px] text-indigo-700 font-semibold flex items-center gap-1 mt-0.5 truncate max-w-[190px]">
                          <Building2 className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                          <span title={`Kas: ${flow.sourceCompanyName || flow.ownerCompany || 'Fleet'} (${flow.accountName})`}>
                            {flow.sourceCompanyName || flow.ownerCompany || 'Fleet'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="font-bold font-mono text-slate-900 text-sm">
                          {formatRupiah(flow.totalGiven)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Mkn: {formatRupiah(flow.driverAllowance)} • Tol: {formatRupiah(flow.tollAllowance)}
                        </div>
                        <div className="text-[10px] text-indigo-600/90 font-mono truncate max-w-[160px] ml-auto" title={flow.accountName}>
                          {flow.accountName}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="font-bold font-mono text-amber-700 text-sm">
                          {formatRupiah(flow.actualExpense)}
                        </div>
                        {flow.actualExpense === 0 && (
                          <span className="text-[10px] text-slate-400">Belum lapor</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div
                          className={`font-black font-mono text-sm ${
                            flow.remainingBalance > 0
                              ? 'text-emerald-600'
                              : flow.remainingBalance < 0
                              ? 'text-rose-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {formatRupiah(flow.remainingBalance)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {flow.remainingBalance > 0
                            ? 'Lebih (Sisa Kasir)'
                            : flow.remainingBalance < 0
                            ? 'Nombor (Kurang)'
                            : 'Klir / Pas'}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}>
                          {statusLabel}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {flow.receiptProofUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              setInspectedReceipt(flow);
                              setReceiptZoom(1);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Lihat</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {flow.status !== 'settled' ? (
                            <button
                              onClick={() => handleOpenSettle(flow)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-md transition shadow-2xs"
                              title="Rekonsiliasi Realisasi & Sisa Uang Saku"
                            >
                              Settle
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenSettle(flow)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-[10px] rounded-md transition"
                              title="Lihat / Edit Settle"
                            >
                              Ubah Settle
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenPrintSlip(flow)}
                            className="p-1 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="Cetak Bukti Kwitansi Uang Saku Supir"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={async () => {
                              if (await confirmDelete(`Catatan Uang Saku ${flow.tripCode}`, 'Apakah Anda Yakin Ingin Menghapus Data?', `Supir: ${flow.driverName} • Armada: ${flow.nopol}`)) {
                                onDeletePocketFlow(flow.id);
                              }
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Hapus Catatan"
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

      {/* Modal: Pencairan Uang Saku Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Form Pencairan Uang Saku &amp; Serah Terima Kas Driver
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Pemberian dana operasional perjalanan kepada Karyawan Driver &amp; pencatatan petugas kasir penyerah
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Pencairan Kas *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Trip Sheet / Surat Jalan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tripCode}
                    placeholder="Contoh: TS-202608-005"
                    onChange={(e) => setFormData({ ...formData, tripCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Referensi Serah Terima Karyawan Driver & Petugas Kasir */}
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-200/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900">
                    Referensi Serah Terima Uang Saku (Data Karyawan Driver)
                  </span>
                  {formData.driverNip && (
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white text-indigo-700 border border-indigo-200">
                      NIP: {formData.driverNip}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Karyawan Driver Penerima (Supir Utama) *
                    </label>
                    <select
                      value={formData.driverName}
                      onChange={(e) => {
                        const d = safeDrivers.find((item) => item.name === e.target.value);
                        const matchedVeh = safeVehicles.find(
                          (v) => v.nopol === d?.assignedVehicle || v.assignedDriver === d?.name
                        );
                        setFormData({
                          ...formData,
                          driverId: d?.id || '',
                          driverNip: d?.nip || '',
                          driverName: e.target.value,
                          driverPhone: d?.phone || formData.driverPhone,
                          helperName: d?.helperName || formData.helperName,
                          vehicleId: matchedVeh?.id || formData.vehicleId
                        });
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 bg-white font-semibold"
                    >
                      {safeDrivers.map((d) => (
                        <option key={d.id} value={d.name}>
                          [{d.nip || d.id}] {d.name} ({d.simType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Kernet / Co-Driver Pendamping
                    </label>
                    <input
                      type="text"
                      list="co-driver-reference-list"
                      value={formData.helperName}
                      placeholder="Pilih atau ketik nama kernet / co-driver"
                      onChange={(e) => setFormData({ ...formData, helperName: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 bg-white"
                    />
                    <datalist id="co-driver-reference-list">
                      {safeDrivers.map((d) => (
                        <option key={d.id} value={d.name}>
                          [{d.nip || d.id}] {d.jobTitle || d.simType}
                        </option>
                      ))}
                      <option value="Ujang (Kernet)" />
                      <option value="Tono (Kernet)" />
                      <option value="Slamet (Kernet)" />
                    </datalist>
                  </div>
                </div>

                {(() => {
                  const selectedDrv = safeDrivers.find((d) => d.name === formData.driverName);
                  if (!selectedDrv) return null;
                  return (
                    <div className="p-2.5 bg-white border border-indigo-100 rounded-lg flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div>
                        <span className="font-bold text-slate-800">{selectedDrv.name}</span>{' '}
                        <span className="text-slate-500">• {selectedDrv.jobTitle || 'Pengemudi Utama'}</span>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          SIM: {selectedDrv.simType} ({selectedDrv.simNumber}) • WA: {selectedDrv.phone}
                        </div>
                      </div>
                      {selectedDrv.bankAccountNumber && (
                        <div className="text-right font-mono text-[10px] bg-slate-50 px-2 py-1 rounded border border-slate-200">
                          <span className="text-slate-400 block">Rekening Transfer Sangu:</span>
                          <strong className="text-slate-800">
                            {selectedDrv.bankName}: {selectedDrv.bankAccountNumber}
                          </strong>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Diserahkan Oleh (Petugas Kasir / Keuangan Pool) *
                  </label>
                  <select
                    value={formData.disbursedBy || 'Rina Anggraini, S.E. (Kasir Pool)'}
                    onChange={(e) => setFormData({ ...formData, disbursedBy: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
                  >
                    <option value="Rina Anggraini, S.E. (Kasir Pool)">
                      [ADM-2023-001] Rina Anggraini, S.E. (Kepala Administrasi &amp; Keuangan)
                    </option>
                    {safeAdminStaff.map((s) => (
                      <option key={s.id} value={`${s.name} (${s.jobTitle})`}>
                        [{s.nikOrNip}] {s.name} ({s.jobTitle})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Armada Truk *
                  </label>
                  <select
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 bg-white"
                  >
                    {safeVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nopol} ({v.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi Asal (Muat)
                  </label>
                  <input
                    type="text"
                    value={formData.originLocation}
                    placeholder="Quarry / Gudang Pool"
                    onChange={(e) => setFormData({ ...formData, originLocation: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi Tujuan (Bongkar)
                  </label>
                  <input
                    type="text"
                    value={formData.destinationLocation}
                    placeholder="Pabrik / Site Proyek"
                    onChange={(e) => setFormData({ ...formData, destinationLocation: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Rincian Komponen Uang Saku */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Rincian Plafon Biaya Perjalanan (Rp)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Ketik nominal rincian</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Uang Makan &amp; Saku Supir
                    </label>
                    <input
                      type="number"
                      step="10000"
                      value={formData.driverAllowance}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        const next = { ...formData, driverAllowance: val };
                        setFormData({ ...next, totalGiven: calculateTotalGiven(next) });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Uang Saku Kernet
                    </label>
                    <input
                      type="number"
                      step="10000"
                      value={formData.helperAllowance}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        const next = { ...formData, helperAllowance: val };
                        setFormData({ ...next, totalGiven: calculateTotalGiven(next) });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Tol &amp; E-Toll
                    </label>
                    <input
                      type="number"
                      step="10000"
                      value={formData.tollAllowance}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        const next = { ...formData, tollAllowance: val };
                        setFormData({ ...next, totalGiven: calculateTotalGiven(next) });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      BBM Solar Tambahan
                    </label>
                    <input
                      type="number"
                      step="10000"
                      value={formData.fuelAllowance}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        const next = { ...formData, fuelAllowance: val };
                        setFormData({ ...next, totalGiven: calculateTotalGiven(next) });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Parkir &amp; Timbangan
                    </label>
                    <input
                      type="number"
                      step="5000"
                      value={formData.parkingAndWeighCost}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        const next = { ...formData, parkingAndWeighCost: val };
                        setFormData({ ...next, totalGiven: calculateTotalGiven(next) });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Bongkar Muat / Kuli
                    </label>
                    <input
                      type="number"
                      step="10000"
                      value={formData.loadingUnloadingCost}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        const next = { ...formData, loadingUnloadingCost: val };
                        setFormData({ ...next, totalGiven: calculateTotalGiven(next) });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">TOTAL UANG SAKU DIBERIKAN:</span>
                  <span className="text-base font-black font-mono text-emerald-700">
                    {formatRupiah(calculateTotalGiven(formData))}
                  </span>
                </div>
              </div>

              {/* Pilihan Perusahaan & Rekening Sumber Kas Pencairan */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Sumber Kas Pencairan (Rekening &amp; Deposit Perusahaan) *</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Bisa dari rekening semua perusahaan terdaftar
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Pilih Perusahaan Pemilik Kas
                    </label>
                    <select
                      value={modalCompanyFilter}
                      onChange={(e) => {
                        const comp = e.target.value;
                        setModalCompanyFilter(comp);
                        if (comp !== 'all') {
                          const firstInComp = allCashSources.find((s) => s.companyName === comp);
                          if (firstInComp) {
                            setFormData((prev) => ({ ...prev, accountId: firstInComp.id }));
                          }
                        }
                      }}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-emerald-500"
                    >
                      <option value="all">🌐 Semua Perusahaan Terdaftar ({registeredCompanies.length} Perusahaan)</option>
                      {registeredCompanies.map((c) => {
                        const count = allCashSources.filter((s) => s.companyName === c).length;
                        return (
                          <option key={c} value={c}>
                            🏢 {c} ({count} Rekening / Deposit)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Rekening / Kas Pencairan *
                    </label>
                    <select
                      required
                      value={formData.accountId}
                      onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-emerald-500 font-medium"
                    >
                      {modalCompanyFilter === 'all' ? (
                        registeredCompanies.map((comp) => {
                          const compSources = allCashSources.filter((s) => s.companyName === comp);
                          if (compSources.length === 0) return null;
                          return (
                            <optgroup key={comp} label={`🏢 ${comp}`}>
                              {compSources.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.isDeposit ? '💼 [Deposit Klien] ' : ''}
                                  {s.accountName} - {s.bankOrProvider} ({formatRupiah(s.currentBalance)})
                                </option>
                              ))}
                            </optgroup>
                          );
                        })
                      ) : (
                        allCashSources
                          .filter((s) => s.companyName === modalCompanyFilter)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.isDeposit ? '💼 [Deposit Klien] ' : ''}
                              {s.accountName} - {s.bankOrProvider} ({formatRupiah(s.currentBalance)})
                            </option>
                          ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Card Live Info Sumber Kas Terpilih */}
                {(() => {
                  const selectedSource =
                    allCashSources.find((s) => s.id === formData.accountId) ||
                    allCashSources[0];
                  if (!selectedSource) return null;

                  const totalGiven = calculateTotalGiven(formData);
                  const isInsufficient = selectedSource.currentBalance < totalGiven;
                  const estimatedRemaining = selectedSource.currentBalance - totalGiven;

                  return (
                    <div
                      className={`p-3 rounded-lg border text-xs transition-colors ${
                        isInsufficient
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 font-bold ${
                              selectedSource.isDeposit
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {selectedSource.isDeposit ? (
                              <Coins className="w-3.5 h-3.5" />
                            ) : (
                              <Building2 className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-1.5">
                              <span className="text-slate-900">{selectedSource.companyName}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-sm font-semibold ${
                                  selectedSource.isDeposit
                                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {selectedSource.isDeposit ? 'Deposit Klien' : 'Kas Operasional Fleet'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {selectedSource.bankOrProvider} • No. Rek:{' '}
                              <span className="font-mono font-medium">{selectedSource.accountNumber || '-'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="sm:text-right">
                          <span className="text-[10px] text-slate-400 block">Saldo Kas Tersedia:</span>
                          <span className="text-xs font-black font-mono text-slate-900">
                            {formatRupiah(selectedSource.currentBalance)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          Estimasi Saldo Setelah Pencairan ({formatRupiah(totalGiven)}):
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            isInsufficient ? 'text-rose-600 font-black' : 'text-emerald-700'
                          }`}
                        >
                          {formatRupiah(estimatedRemaining)}
                        </span>
                      </div>

                      {isInsufficient && (
                        <div className="mt-2 p-1.5 bg-rose-100/80 border border-rose-300 rounded text-rose-800 text-[10px] flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                          <span>
                            <strong>Peringatan Saldo Kas:</strong> Saldo kas rekening perusahaan {selectedSource.companyName} kurang dari total uang saku (Kurang {formatRupiah(totalGiven - selectedSource.currentBalance)}). Harap top-up kas atau pilih rekening perusahaan lain.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Metode Pembayaran Kas
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="Cash / Uang Kas">Cash / Tunai Kasir Pool</option>
                    <option value="Transfer">Transfer Mandiri / BCA / Rekening Bank Perusahaan</option>
                    <option value="Kartu E-Toll">Kartu E-Toll Pool</option>
                  </select>
                </div>
              </div>

              <ReceiptUploadField
                label="Upload Nota / Tanda Terima Pencairan Uang Saku"
                value={formData.receiptProofUrl || ''}
                onChange={(url) => setFormData({ ...formData, receiptProofUrl: url })}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Pencairan Uang Saku
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  placeholder="Misal: Uang saku 2 hari perjalanan, jangan lupa simpan struk tol & timbangan fisik"
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Cairkan Uang Saku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Settlement / Rekonsiliasi Realisasi Uang Saku */}
      {isSettleModalOpen && selectedFlow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Rekonsiliasi (Settle) Uang Saku Supir
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedFlow.tripCode} • {selectedFlow.driverName} ({selectedFlow.nopol})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSettle} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-500">Plafon Uang Saku Diberikan:</span>
                  <div className="text-sm font-black font-mono text-slate-900">
                    {formatRupiah(selectedFlow.totalGiven)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Rute Perjalanan:</span>
                  <div className="text-xs font-semibold text-slate-800 truncate">
                    {selectedFlow.originLocation} → {selectedFlow.destinationLocation}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Total Realisasi Biaya Pengeluaran Aktual (Rp) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  required
                  value={settleActualExpense}
                  onChange={(e) => setSettleActualExpense(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-bold font-mono border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Jumlah total dari kuitansi makan supir, tiket tol, struk BBM tambahan, dan retribusi timbangan.
                </p>
              </div>

              {/* Sisa / Lebih Kurang Display */}
              {(() => {
                const diff = selectedFlow.totalGiven - settleActualExpense;
                return (
                  <div
                    className={`p-3.5 rounded-xl border flex items-center justify-between ${
                      diff > 0
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : diff < 0
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold">
                        {diff > 0
                          ? 'SISA UANG SAKU (Disetor Kembali ke Kas):'
                          : diff < 0
                          ? 'KEKURANGAN BIAYA (Harus Diganti Perusahaan):'
                          : 'REALISASI KLIR / PAS:'}
                      </span>
                      <p className="text-[10px] opacity-80 mt-0.5">
                        {diff > 0
                          ? 'Supir mengembalikan kelebihan dana ke kasir pool'
                          : diff < 0
                          ? 'Kasir mengganti kekurangan uang jalan ke supir'
                          : 'Tidak ada selisih pengembalian uang saku'}
                      </p>
                    </div>
                    <span className="text-base font-black font-mono">
                      {formatRupiah(Math.abs(diff))}
                    </span>
                  </div>
                );
              })()}

              <ReceiptUploadField
                label="Upload Nota / Kuitansi Pertanggungjawaban (Tol, Solar, Makan, Timbangan)"
                value={settleReceiptUrl}
                onChange={(url) => setSettleReceiptUrl(url)}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Rekonsiliasi &amp; Keterangan Kwitansi
                </label>
                <textarea
                  rows={2}
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSettleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Simpan Settlement Selesai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cetak Kwitansi Uang Saku Supir */}
      {isPrintSlipModalOpen && selectedFlow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto printable-slip-modal">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto printable-slip-card print:m-0 print:shadow-none print:w-full">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 print:hidden print-hide">
              <span className="text-xs font-bold text-slate-800">
                Pratinjau Slip / Kwitansi Uang Jalan Supir
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    printElementById(
                      'printable-pocket-slip',
                      `Slip_UangSaku_${selectedFlow.tripCode}`
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Printer</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadPocketSlipPDF(selectedFlow)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintSlipModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <PrintOutPreviewStage
              documentLabel={`SLIP UANG SAKU: ${selectedFlow.id} / ${selectedFlow.tripCode}`}
            >
              {/* Printable Content */}
              <div id="printable-pocket-slip" className="p-6 bg-white space-y-4 font-mono text-slate-900">
                <div className="border-b-2 border-slate-900 pb-3 text-center">
                  <h3 className="text-sm font-black uppercase tracking-wide">
                    {selectedFlow.sourceCompanyName || selectedFlow.ownerCompany || 'PT TRANSINDO LOGISTIK INDONESIA'}
                  </h3>
                  <p className="text-[10px] text-slate-600">
                    SLIP BUKTI PENCAIRAN UANG SAKU &amp; SERAH TERIMA KAS PENGEMUDI
                  </p>
                  <div className="mt-1 font-bold text-xs">
                    NO. VOUCHER: {selectedFlow.id} / {selectedFlow.tripCode}
                  </div>
                </div>

                <div className="grid grid-cols-2 text-xs gap-y-1.5 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-slate-500">Tanggal:</span> {formatDateIndo(selectedFlow.date)}
                  </div>
                  <div>
                    <span className="text-slate-500">No. Polisi:</span> {selectedFlow.nopol}
                  </div>
                  <div>
                    <span className="text-slate-500">Karyawan Driver:</span>{' '}
                    <span className="font-bold">
                      {selectedFlow.driverName}
                      {selectedFlow.driverNip ? ` [${selectedFlow.driverNip}]` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Kernet:</span> {selectedFlow.helperName || '-'}
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Rute:</span> {selectedFlow.originLocation} → {selectedFlow.destinationLocation}
                  </div>
                  <div className="col-span-2 text-slate-700">
                    <span className="text-slate-500">Sumber Kas:</span>{' '}
                    <span className="font-bold">{selectedFlow.sourceCompanyName || selectedFlow.ownerCompany || 'Fleet'}</span> - {selectedFlow.accountName} ({selectedFlow.paymentMethod})
                  </div>
                </div>

                <div className="space-y-1 text-xs border-b border-slate-200 pb-3">
                  <div className="font-bold mb-1">Rincian Komponen Saku Diberikan:</div>
                  <div className="flex justify-between">
                    <span>1. Uang Makan &amp; Saku Supir:</span>
                    <span>{formatRupiah(selectedFlow.driverAllowance)}</span>
                  </div>
                  {selectedFlow.helperAllowance > 0 && (
                    <div className="flex justify-between">
                      <span>2. Uang Saku Kernet:</span>
                      <span>{formatRupiah(selectedFlow.helperAllowance)}</span>
                    </div>
                  )}
                  {selectedFlow.tollAllowance > 0 && (
                    <div className="flex justify-between">
                      <span>3. Alokasi Biaya E-Toll:</span>
                      <span>{formatRupiah(selectedFlow.tollAllowance)}</span>
                    </div>
                  )}
                  {selectedFlow.fuelAllowance > 0 && (
                    <div className="flex justify-between">
                      <span>4. Alokasi BBM Solar Jalan:</span>
                      <span>{formatRupiah(selectedFlow.fuelAllowance)}</span>
                    </div>
                  )}
                  {selectedFlow.parkingAndWeighCost > 0 && (
                    <div className="flex justify-between">
                      <span>5. Parkir, Retribusi &amp; Timbangan:</span>
                      <span>{formatRupiah(selectedFlow.parkingAndWeighCost)}</span>
                    </div>
                  )}
                  {selectedFlow.loadingUnloadingCost > 0 && (
                    <div className="flex justify-between">
                      <span>6. Ongkos Bongkar Muat:</span>
                      <span>{formatRupiah(selectedFlow.loadingUnloadingCost)}</span>
                    </div>
                  )}
                  {selectedFlow.emergencyFund > 0 && (
                    <div className="flex justify-between">
                      <span>7. Cadangan Darurat:</span>
                      <span>{formatRupiah(selectedFlow.emergencyFund)}</span>
                    </div>
                  )}
                </div>

                <div className="border-b-2 border-slate-900 pb-2.5 space-y-1">
                  <div className="flex justify-between text-sm font-black">
                    <span>TOTAL UANG SAKU DIBAYAR:</span>
                    <span className="text-base">{formatRupiah(selectedFlow.totalGiven)}</span>
                  </div>
                  <div className="text-[11px] italic text-slate-700">
                    Terbilang: <span className="font-bold"># {terbilangRupiah(selectedFlow.totalGiven)} #</span>
                  </div>
                </div>

                {selectedFlow.actualExpense > 0 && (
                  <div className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span>Realisasi Pengeluaran Lapangan:</span>
                      <span>{formatRupiah(selectedFlow.actualExpense)}</span>
                    </div>
                    <div className="flex justify-between font-black text-emerald-700">
                      <span>Sisa Disetor ke Kas:</span>
                      <span>{formatRupiah(selectedFlow.remainingBalance)}</span>
                    </div>
                  </div>
                )}

                {/* Tanda Tangan */}
                <div className="grid grid-cols-2 pt-4 text-center text-xs">
                  <div>
                    <p className="text-slate-500">Diterima Oleh (Karyawan Driver),</p>
                    <div className="h-14"></div>
                    <p className="font-bold underline">
                      {selectedFlow.driverName}
                      {selectedFlow.driverNip ? ` (${selectedFlow.driverNip})` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Diserahkan Oleh (Kasir Pool),</p>
                    <div className="h-14"></div>
                    <p className="font-bold underline">{selectedFlow.disbursedBy || 'Rina Anggraini, S.E.'}</p>
                  </div>
                </div>

                <div className="text-[9px] text-center text-slate-400 pt-2 border-t border-slate-100">
                  Dicetak via FleetOps Pro • Wajib lampirkan struk nota saat tiba kembali di pool
                </div>
              </div>
            </PrintOutPreviewStage>
          </div>
        </div>
      )}

      {/* Modal: Inspeksi Bukti Kwitansi / Nota */}
      {inspectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Kwitansi Uang Saku: {inspectedReceipt.tripCode}</span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  Supir: {inspectedReceipt.driverName} • Total: {formatRupiah(inspectedReceipt.totalGiven)}
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
              {inspectedReceipt.receiptProofUrl?.startsWith('data:application/pdf') ? (
                <iframe
                  src={inspectedReceipt.receiptProofUrl}
                  title="Pratinjau Nota PDF"
                  className="w-full h-[440px] rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                <img
                  src={inspectedReceipt.receiptProofUrl}
                  alt="Nota Fisik"
                  style={{ transform: `scale(${receiptZoom})` }}
                  className="max-w-full max-h-[460px] object-contain transition-transform duration-150 shadow-md rounded-lg"
                />
              )}
            </div>

            <div className="px-5 py-3 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 font-mono truncate">
                Sumber: {inspectedReceipt.accountName || inspectedReceipt.paymentMethod}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const target = inspectedReceipt;
                    setInspectedReceipt(null);
                    handleOpenPrintSlip(target);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Slip Kwitansi</span>
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
    </div>
  );
};
