import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Truck,
  Users,
  MapPin,
  Calendar,
  Clock,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Eye,
  DollarSign,
  Wallet,
  Gauge,
  Package,
  Layers,
  ChevronRight,
  ShieldCheck,
  Check,
  X,
  Navigation,
  ArrowRight,
  Coins
} from 'lucide-react';
import {
  TripSheet,
  TripSheetStatus,
  Vehicle,
  Driver,
  FinancialAccount,
  UserRole
} from '../../types';
import { formatRupiah, formatDateIndo, formatNumber } from '../../utils/formatters';
import { printElementById } from '../../utils/slipPrint';
import { TablePagination } from '../Common/TablePagination';
import { ReceiptUploadField } from '../Common/ReceiptUploadField';
import { PrintOutPreviewStage } from '../Common/PrintPreviewControls';
import { SAMPLE_RECEIPT_IMAGE } from '../../data/initialData';
import { ModuleAnalyticsPanel } from '../Common/ModuleAnalyticsPanel';
import { BarChart3, ListFilter } from 'lucide-react';
import { confirmDelete } from '../../utils/dialogService';

interface TripSheetManagerProps {
  tripSheets: TripSheet[];
  vehicles: Vehicle[];
  drivers: Driver[];
  accounts: FinancialAccount[];
  userRole?: UserRole;
  onAddTripSheet: (trip: TripSheet) => void;
  onUpdateTripSheet: (trip: TripSheet) => void;
  onDeleteTripSheet: (id: string) => void;
  onQuickDisbursePocketMoney?: (trip: TripSheet) => void;
  onOpenRoleMatrix?: () => void;
}

export const TripSheetManager: React.FC<TripSheetManagerProps> = ({
  tripSheets = [],
  vehicles = [],
  drivers = [],
  accounts = [],
  userRole = 'owner',
  onAddTripSheet,
  onUpdateTripSheet,
  onDeleteTripSheet,
  onQuickDisbursePocketMoney,
  onOpenRoleMatrix
}) => {
  const safeTrips = Array.isArray(tripSheets) ? tripSheets : [];
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const safeAccounts = Array.isArray(accounts) ? accounts : [];

  const [moduleView, setModuleView] = useState<'data' | 'analytics'>('data');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');

  const getTripCompany = (t: TripSheet) => {
    if (t.ownerCompany) return t.ownerCompany;
    const v = safeVehicles.find(veh => veh.id === t.vehicleId || veh.nopol === t.nopol);
    return v?.ownerCompany || t.clientCompany || 'PT Transindo Logistik';
  };

  const companies = Array.from(
    new Set([
      ...safeVehicles.map(v => v.ownerCompany).filter(Boolean),
      ...safeTrips.map(t => getTripCompany(t)).filter(Boolean)
    ])
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripSheet | null>(null);
  const [printTrip, setPrintTrip] = useState<TripSheet | null>(null);
  const [detailTrip, setDetailTrip] = useState<TripSheet | null>(null);
  const [inspectedProofTrip, setInspectedProofTrip] = useState<TripSheet | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<TripSheet>>({
    tripNumber: '',
    suratJalanNumber: '',
    departureDate: new Date().toISOString().slice(0, 10),
    estimatedArrivalDate: new Date().toISOString().slice(0, 10),
    vehicleId: safeVehicles[0]?.id || '',
    driverId: safeDrivers[0]?.id || '',
    driverName: safeDrivers[0]?.name || safeVehicles[0]?.assignedDriver || '',
    driverNip: safeDrivers[0]?.nip || '',
    driverPhone: safeDrivers[0]?.phone || safeVehicles[0]?.driverPhone || '',
    helperName: safeDrivers[0]?.helperName || '',
    dispatcherName: 'Budi Santoso, S.T.',
    clientCompany: 'PT Sumber Makmur Mineral',
    recipientCompany: 'Site Proyek Pantura',
    originLocation: 'Pool Utama Jakarta',
    destinationLocation: 'Kawasan Industri Cikarang',
    cargoDescription: 'Muatan Kargo Palet Standard',
    cargoTonnageTon: 15,
    cargoQuantity: '20 Palet',
    startOdometer: safeVehicles[0]?.currentOdometer || 0,
    endOdometer: (safeVehicles[0]?.currentOdometer || 0) + 150,
    totalDistanceKm: 150,
    status: 'scheduled',
    driverPocketMoney: 250000,
    helperPocketMoney: 100000,
    fuelBudget: 0,
    tollBudget: 150000,
    otherTripBudget: 50000,
    totalPocketDisbursed: 550000,
    actualTripExpense: 0,
    pocketRemainingBalance: 550000,
    pocketSettlementStatus: 'disbursed',
    pocketAccountId: safeAccounts[0]?.id || '',
    notes: 'Surat jalan resmi keberangkatan armada.'
  });

  // Calculate Total Uang Saku Form
  const calcFormPocket = (data: Partial<TripSheet>) => {
    return (
      (Number(data.driverPocketMoney) || 0) +
      (Number(data.helperPocketMoney) || 0) +
      (Number(data.fuelBudget) || 0) +
      (Number(data.tollBudget) || 0) +
      (Number(data.otherTripBudget) || 0)
    );
  };

  // Filtered List
  const filteredTrips = safeTrips.filter((t) => {
    if (!t) return false;
    const compName = getTripCompany(t);
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.tripNumber.toLowerCase().includes(q) ||
      (t.suratJalanNumber && t.suratJalanNumber.toLowerCase().includes(q)) ||
      (t.driverName && t.driverName.toLowerCase().includes(q)) ||
      (t.nopol && t.nopol.toLowerCase().includes(q)) ||
      (t.clientCompany && t.clientCompany.toLowerCase().includes(q)) ||
      (t.originLocation && t.originLocation.toLowerCase().includes(q)) ||
      (t.destinationLocation && t.destinationLocation.toLowerCase().includes(q)) ||
      compName.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesVehicle = vehicleFilter === 'all' || t.vehicleId === vehicleFilter;
    const matchesDriver = driverFilter === 'all' || t.driverName === driverFilter;
    const matchesCompany =
      companyFilter === 'all' ||
      compName === companyFilter ||
      t.clientCompany === companyFilter;

    return matchesSearch && matchesStatus && matchesVehicle && matchesDriver && matchesCompany;
  });

  // Metrics
  const totalTripsCount = filteredTrips.length;
  const inTransitCount = filteredTrips.filter((t) => t.status === 'in_transit').length;
  const totalTonnageSum = filteredTrips.reduce((sum, item) => sum + (item.cargoTonnageTon || 0), 0);
  const totalPocketSum = filteredTrips.reduce((sum, item) => sum + (item.totalPocketDisbursed || 0), 0);

  // Pagination Slice
  const totalFiltered = filteredTrips.length;
  const paginatedTrips = filteredTrips.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAdd = () => {
    setEditingTrip(null);
    const v = safeVehicles[0];
    const d = safeDrivers[0];
    const tripNum = 'TS-' + new Date().toISOString().slice(0, 7).replace('-', '') + '-' + Date.now().toString().slice(-3);

    const initialData: Partial<TripSheet> = {
      tripNumber: tripNum,
      suratJalanNumber: 'SJ-' + Date.now().toString().slice(-4),
      departureDate: new Date().toISOString().slice(0, 10),
      estimatedArrivalDate: new Date().toISOString().slice(0, 10),
      vehicleId: v?.id || '',
      driverId: d?.id || '',
      driverName: d?.name || v?.assignedDriver || 'Supir Armada',
      driverNip: d?.nip || '',
      driverPhone: d?.phone || v?.driverPhone || '',
      helperName: d?.helperName || '',
      dispatcherName: 'Budi Santoso, S.T.',
      clientCompany: 'PT Sumber Makmur Mineral',
      recipientCompany: 'Pusat Distribusi Site',
      originLocation: 'Pool Utama Cikarang',
      destinationLocation: 'Kawasan Industri Jababeka',
      cargoDescription: 'Material Konstruksi / Pasir Cor',
      cargoTonnageTon: v?.capacityTon || 20,
      cargoQuantity: '1 Ritase Penuh',
      startOdometer: v?.currentOdometer || 50000,
      endOdometer: (v?.currentOdometer || 50000) + 120,
      totalDistanceKm: 120,
      status: 'scheduled',
      driverPocketMoney: 250000,
      helperPocketMoney: 80000,
      fuelBudget: 0,
      tollBudget: 150000,
      otherTripBudget: 50000,
      totalPocketDisbursed: 530000,
      actualTripExpense: 0,
      pocketRemainingBalance: 530000,
      pocketSettlementStatus: 'disbursed',
      pocketAccountId: safeAccounts[0]?.id || '',
      notes: 'Harap periksa kelengkapan terpal dan APAR sebelum berangkat.'
    };

    setFormData(initialData);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (trip: TripSheet) => {
    setEditingTrip(trip);
    setFormData({ ...trip });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleVehicleChange = (vId: string) => {
    const v = safeVehicles.find((item) => item.id === vId);
    if (!v) return;
    const matchedDrv = safeDrivers.find((d) => d.name.toLowerCase() === (v.assignedDriver || '').toLowerCase());

    setFormData((prev) => ({
      ...prev,
      vehicleId: vId,
      driverId: matchedDrv?.id || prev.driverId,
      driverName: v.assignedDriver || prev.driverName,
      driverNip: matchedDrv?.nip || prev.driverNip,
      driverPhone: matchedDrv?.phone || v.driverPhone || prev.driverPhone,
      helperName: matchedDrv?.helperName || prev.helperName,
      startOdometer: v.currentOdometer || prev.startOdometer,
      cargoTonnageTon: v.capacityTon || prev.cargoTonnageTon
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tripNumber?.trim() || !formData.suratJalanNumber?.trim()) {
      setFormError('Nomor Trip Sheet dan Nomor Surat Jalan wajib diisi!');
      return;
    }

    const v = safeVehicles.find((item) => item.id === formData.vehicleId);
    const nopol = v ? v.nopol : 'KAS OPERASIONAL POOL';
    const vehicleModel = v ? `${v.brand} ${v.model}` : 'Truk Operasional';
    const ownerCompany = v ? v.ownerCompany : 'PT Transindo Logistik';
    const acc = safeAccounts.find((a) => a.id === formData.pocketAccountId);
    const pocketAccountName = acc ? acc.accountName : 'Kasir Tunai Pool (Petty Cash)';

    const totalPocket = calcFormPocket(formData);
    const startKm = Number(formData.startOdometer) || 0;
    const endKm = Number(formData.endOdometer) || startKm;
    const distance = Math.max(0, endKm - startKm);

    if (editingTrip) {
      onUpdateTripSheet({
        ...editingTrip,
        ...formData,
        nopol,
        vehicleModel,
        ownerCompany,
        startOdometer: startKm,
        endOdometer: endKm,
        totalDistanceKm: distance,
        totalPocketDisbursed: totalPocket,
        pocketAccountName
      } as TripSheet);
    } else {
      const newTrip: TripSheet = {
        id: 'TS-' + Date.now().toString().slice(-4),
        tripNumber: formData.tripNumber.trim(),
        suratJalanNumber: formData.suratJalanNumber.trim(),
        departureDate: formData.departureDate || new Date().toISOString().slice(0, 10),
        estimatedArrivalDate: formData.estimatedArrivalDate || formData.departureDate || '',
        actualArrivalDate: formData.actualArrivalDate,
        vehicleId: formData.vehicleId || safeVehicles[0]?.id || '',
        nopol,
        vehicleModel,
        ownerCompany,
        driverId: formData.driverId,
        driverName: formData.driverName || 'Supir Armada',
        driverNip: formData.driverNip,
        driverPhone: formData.driverPhone || '',
        helperName: formData.helperName || '',
        dispatcherName: formData.dispatcherName || 'Budi Santoso, S.T.',
        clientCompany: formData.clientCompany || 'Perusahaan Klien',
        recipientCompany: formData.recipientCompany || 'Penerima Kargo',
        originLocation: formData.originLocation || 'Lokasi Muat',
        destinationLocation: formData.destinationLocation || 'Lokasi Bongkar',
        cargoDescription: formData.cargoDescription || 'Barang Kargo',
        cargoTonnageTon: Number(formData.cargoTonnageTon) || 0,
        cargoQuantity: formData.cargoQuantity || '1 Rit',
        startOdometer: startKm,
        endOdometer: endKm,
        totalDistanceKm: distance,
        status: (formData.status as TripSheetStatus) || 'scheduled',
        driverPocketMoney: Number(formData.driverPocketMoney) || 0,
        helperPocketMoney: Number(formData.helperPocketMoney) || 0,
        fuelBudget: Number(formData.fuelBudget) || 0,
        tollBudget: Number(formData.tollBudget) || 0,
        otherTripBudget: Number(formData.otherTripBudget) || 0,
        totalPocketDisbursed: totalPocket,
        actualTripExpense: Number(formData.actualTripExpense) || 0,
        pocketRemainingBalance: totalPocket - (Number(formData.actualTripExpense) || 0),
        pocketSettlementStatus: formData.pocketSettlementStatus || 'disbursed',
        pocketAccountId: formData.pocketAccountId || safeAccounts[0]?.id || '',
        pocketAccountName,
        notes: formData.notes || '',
        tripProofUrl: formData.tripProofUrl || SAMPLE_RECEIPT_IMAGE,
        createdAt: new Date().toISOString().slice(0, 10)
      };
      onAddTripSheet(newTrip);
    }

    setIsModalOpen(false);
  };

  const getStatusBadge = (status: TripSheetStatus) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in_transit':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'arrived':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'completed':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'settled':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status: TripSheetStatus) => {
    switch (status) {
      case 'scheduled':
        return 'Siap Berangkat';
      case 'in_transit':
        return 'Dalam Perjalanan';
      case 'arrived':
        return 'Tiba di Lokasi';
      case 'completed':
        return 'Selesai Bongkar';
      case 'settled':
        return 'Selesai & Settle Kas';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Trip Sheet</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900 mt-2 font-mono">
            {totalTripsCount} <span className="text-xs font-normal text-slate-500">Lembar</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Surat jalan &amp; ritase tercatat</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Dalam Perjalanan</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Navigation className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="text-lg font-black text-amber-600 mt-2 font-mono">
            {inTransitCount} <span className="text-xs font-normal text-slate-500">Armada</span>
          </div>
          <div className="text-[11px] text-amber-600/80 mt-1">Sedang melaju rute tujuan</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Tonase Kargo</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-emerald-600 mt-2 font-mono">
            {formatNumber(totalTonnageSum)} <span className="text-xs font-normal text-slate-500">Ton</span>
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-1">Volume muatan berhasil didistribusi</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Uang Saku Driver Disalurkan</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900 mt-2 font-mono">
            {formatRupiah(totalPocketSum)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Sangu jalan supir terhubung otomatis</div>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Trip Sheet &amp; Lembar Surat Jalan Armada
            </h3>
            <p className="text-xs text-slate-500">
              Pengelolaan Surat Jalan, instruksi rute muatan, dan integrasi otomatis Uang Saku Perjalanan Driver.
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
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Daftar Trip Sheet</span>
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
                <span>Laporan &amp; Analitik Trip</span>
              </button>
            </div>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Trip Sheet Baru</span>
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
              placeholder="Cari trip, surat jalan, supir, PT..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 focus:bg-white"
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-blue-500 focus:bg-white"
          >
            <option value="all">Semua Status Perjalanan</option>
            <option value="scheduled">Siap Berangkat (Scheduled)</option>
            <option value="in_transit">Dalam Perjalanan (In Transit)</option>
            <option value="arrived">Tiba di Lokasi</option>
            <option value="completed">Selesai Bongkar</option>
            <option value="settled">Selesai &amp; Settle Kas</option>
          </select>

          <select
            value={vehicleFilter}
            onChange={(e) => {
              setVehicleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-blue-500 focus:bg-white"
          >
            <option value="all">Semua Kendaraan</option>
            {safeVehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nopol} ({v.brand} {v.model})
              </option>
            ))}
          </select>

          <select
            value={driverFilter}
            onChange={(e) => {
              setDriverFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-blue-500 focus:bg-white"
          >
            <option value="all">Semua Karyawan Driver</option>
            {safeDrivers.map((d) => (
              <option key={d.id} value={d.name}>
                [{d.nip || d.id}] {d.name} ({d.simType})
              </option>
            ))}
          </select>
        </div>

        {/* Ringkasan Mutasi & Pengeluaran Uang Saku Trip Per Perusahaan */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Mutasi Trip &amp; Saku per Perusahaan:
          </span>
          <button
            type="button"
            onClick={() => {
              setCompanyFilter('all');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border cursor-pointer ${
              companyFilter === 'all'
                ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Semua ({safeTrips.length}) • {formatRupiah(safeTrips.reduce((s, t) => s + (t.totalPocketDisbursed || 0), 0))}
          </button>
          {companies.map((comp) => {
            const compTrips = safeTrips.filter((t) => getTripCompany(t) === comp);
            const compSum = compTrips.reduce((s, t) => s + (t.totalPocketDisbursed || 0), 0);
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
                    ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40'
                }`}
              >
                <span>🏢 {comp}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {compTrips.length}
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
          moduleType="tripsheet"
          title="Laporan & Analitik Trip Sheet & Surat Jalan"
          subtitle="Analisis distribusi tonase kargo per perusahaan klien, frekuensi rute perjalanan & realisasi uang saku trip driver"
          tripSheets={safeTrips}
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
                <th className="py-3 px-4 min-w-[130px]">No. Trip &amp; SJ</th>
                <th className="py-3 px-4 min-w-[170px]">Armada &amp; Pemilik Aset</th>
                <th className="py-3 px-4 min-w-[160px]">Pengemudi &amp; Kernet</th>
                <th className="py-3 px-4 min-w-[180px]">Rute &amp; Klien Pengirim</th>
                <th className="py-3 px-3 min-w-[120px]">Muatan &amp; Jarak</th>
                <th className="py-3 px-4 min-w-[140px] text-right">Uang Saku Driver</th>
                <th className="py-3 px-3 min-w-[110px] text-center">Status Trip</th>
                <th className="py-3 px-3 min-w-[120px] text-center">Aksi &amp; Cetak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedTrips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">Belum ada catatan Trip Sheet</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Klik "+ Buat Trip Sheet Baru" untuk membuat lembar perjalanan armada
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedTrips.map((trip) => {
                  return (
                    <tr key={trip.id} className="hover:bg-blue-50/20 transition duration-150">
                      <td className="py-3 px-4">
                        <div className="font-bold font-mono text-slate-900 text-xs">{trip.tripNumber}</div>
                        <div className="font-mono text-[11px] text-blue-700 font-semibold">{trip.suratJalanNumber}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{formatDateIndo(trip.departureDate)}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{trip.nopol}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[160px]">{trip.vehicleModel}</div>
                        {trip.ownerCompany && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[140px]">{trip.ownerCompany}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{trip.driverName}</span>
                        </div>
                        {(() => {
                          const matchedDrv = safeDrivers.find(d => d.name.toLowerCase() === (trip.driverName || '').toLowerCase());
                          const nip = trip.driverNip || matchedDrv?.nip;
                          return nip ? (
                            <div className="text-[10px] font-mono font-bold text-emerald-700 mt-0.5">
                              NIP: {nip}
                            </div>
                          ) : null;
                        })()}
                        {trip.helperName ? (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Kernet: <span className="font-semibold">{trip.helperName}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 mt-0.5">Tanpa kernet</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 truncate max-w-[170px]">{trip.clientCompany}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate max-w-[170px]">
                          <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span>
                            {trip.originLocation} → {trip.destinationLocation}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{trip.cargoDescription}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {trip.cargoTonnageTon} Ton • {trip.totalDistanceKm} KM
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="font-bold font-mono text-emerald-700 text-xs">
                          {formatRupiah(trip.totalPocketDisbursed)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {trip.pocketSettlementStatus === 'settled' ? (
                            <span className="text-emerald-600 font-semibold">Kas Klir (Settle)</span>
                          ) : (
                            <span className="text-amber-600 font-semibold">Dicairkan ke supir</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(trip.status)}`}>
                          {getStatusLabel(trip.status)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              if (onQuickDisbursePocketMoney) {
                                onQuickDisbursePocketMoney(trip);
                              }
                            }}
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="Kelola / Rekonsiliasi Uang Saku Driver"
                          >
                            <Coins className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setPrintTrip(trip)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Cetak Surat Jalan & Trip Sheet"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {trip.tripProofUrl && (
                            <button
                              onClick={() => setInspectedProofTrip(trip)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                              title="Lihat Nota / Bukti Surat Jalan"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(trip)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition"
                            title="Ubah Data Trip Sheet"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (await confirmDelete(`Trip Sheet / Surat Jalan ${trip.tripNumber}`, 'Apakah Anda Yakin Ingin Menghapus Data?', `Armada: ${trip.nopol} • Supir: ${trip.driverName}`)) {
                                onDeleteTripSheet(trip.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Hapus Trip Sheet"
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

      {/* Modal: Tambah / Edit Trip Sheet */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {editingTrip ? 'Ubah Lembar Trip Sheet' : 'Buat Lembar Trip Sheet & Surat Jalan Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Penugasan armada, rute kargo, dan alokasi uang saku perjalanan driver
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Trip Sheet *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tripNumber}
                    onChange={(e) => setFormData({ ...formData, tripNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Surat Jalan (SJ/DO) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.suratJalanNumber}
                    onChange={(e) => setFormData({ ...formData, suratJalanNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Perjalanan
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TripSheetStatus })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    <option value="scheduled">Siap Berangkat (Scheduled)</option>
                    <option value="in_transit">Dalam Perjalanan (In Transit)</option>
                    <option value="arrived">Tiba di Lokasi</option>
                    <option value="completed">Selesai Bongkar</option>
                    <option value="settled">Selesai &amp; Settle Kas</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </div>
              </div>

              {/* Tanggal & Waktu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Keberangkatan *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimasi Tiba di Lokasi Bongkar
                  </label>
                  <input
                    type="date"
                    value={formData.estimatedArrivalDate}
                    onChange={(e) => setFormData({ ...formData, estimatedArrivalDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Armada & Pengemudi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kendaraan Armada *
                  </label>
                  <select
                    value={formData.vehicleId}
                    onChange={(e) => handleVehicleChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    {safeVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nopol} - {v.brand} ({v.ownerCompany || 'PT Transindo'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Karyawan Driver (Supir Utama) *
                  </label>
                  <select
                    value={formData.driverName}
                    onChange={(e) => {
                      const d = safeDrivers.find((item) => item.name === e.target.value);
                      setFormData({
                        ...formData,
                        driverId: d?.id || '',
                        driverName: e.target.value,
                        driverNip: d?.nip || '',
                        driverPhone: d?.phone || formData.driverPhone,
                        helperName: d?.helperName || formData.helperName
                      });
                    }}
                    className="w-full px-3 py-2 text-xs border border-emerald-200 rounded-xl focus:outline-hidden focus:border-emerald-500 bg-emerald-50/40 font-semibold"
                  >
                    {safeDrivers.map((d) => (
                      <option key={d.id} value={d.name}>
                        [{d.nip || d.id}] {d.name} ({d.simType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kernet / Co-Driver Pendamping
                  </label>
                  <input
                    type="text"
                    list="tripsheet-helper-list"
                    value={formData.helperName}
                    placeholder="Pilih / ketik nama kernet"
                    onChange={(e) => setFormData({ ...formData, helperName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500"
                  />
                  <datalist id="tripsheet-helper-list">
                    {safeDrivers.map((d) => (
                      <option key={d.id} value={d.name}>[{d.nip || d.id}] {d.jobTitle || 'Co-Driver'}</option>
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Klien & Rute */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Perusahaan Klien / Pengirim *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.clientCompany}
                    placeholder="Contoh: PT Adhi Karya (Persero) Tbk"
                    onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Perusahaan Penerima Kargo
                  </label>
                  <input
                    type="text"
                    value={formData.recipientCompany}
                    placeholder="Contoh: Site Batching Plant Proyek"
                    onChange={(e) => setFormData({ ...formData, recipientCompany: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi Asal (Muat) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.originLocation}
                    placeholder="Misal: Quarry Rumpin, Bogor"
                    onChange={(e) => setFormData({ ...formData, originLocation: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi Tujuan (Bongkar) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.destinationLocation}
                    placeholder="Misal: Batching Plant Puri Indah, Jakbar"
                    onChange={(e) => setFormData({ ...formData, destinationLocation: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Muatan & Odometer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deskripsi Kargo / Barang *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cargoDescription}
                    placeholder="Misal: Pasir Cor & Split 2-3"
                    onChange={(e) => setFormData({ ...formData, cargoDescription: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Berat Tonase (Ton) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.cargoTonnageTon}
                    onChange={(e) => setFormData({ ...formData, cargoTonnageTon: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Volume / Jumlah Koli
                  </label>
                  <input
                    type="text"
                    value={formData.cargoQuantity}
                    placeholder="Misal: 2 Ritase / 420 Dus"
                    onChange={(e) => setFormData({ ...formData, cargoQuantity: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Odometer KM */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    Odometer Berangkat (KM)
                  </label>
                  <input
                    type="number"
                    value={formData.startOdometer}
                    onChange={(e) => {
                      const start = Number(e.target.value) || 0;
                      const end = Number(formData.endOdometer) || start;
                      setFormData({ ...formData, startOdometer: start, totalDistanceKm: Math.max(0, end - start) });
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    Odometer Tiba (KM)
                  </label>
                  <input
                    type="number"
                    value={formData.endOdometer}
                    onChange={(e) => {
                      const end = Number(e.target.value) || 0;
                      const start = Number(formData.startOdometer) || 0;
                      setFormData({ ...formData, endOdometer: end, totalDistanceKm: Math.max(0, end - start) });
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    Total Jarak Tempuh
                  </label>
                  <div className="px-2.5 py-1.5 text-xs font-bold font-mono text-blue-700 bg-white border border-slate-200 rounded-lg">
                    {Math.max(0, (Number(formData.endOdometer) || 0) - (Number(formData.startOdometer) || 0))} KM
                  </div>
                </div>
              </div>

              {/* BAGIAN INTEGRASI UANG SAKU DRIVER */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-950">
                      Rincian Uang Saku &amp; Biaya Perjalanan Driver
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                    Otomatis Masuk ke Kas
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-900 mb-0.5">
                      Uang Makan / Saku Supir
                    </label>
                    <input
                      type="number"
                      step="10000"
                      value={formData.driverPocketMoney}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        const next = { ...formData, driverPocketMoney: val };
                        setFormData({ ...next, totalPocketDisbursed: calcFormPocket(next) });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs border border-emerald-200 rounded-lg bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-900 mb-0.5">
                      Uang Saku Kernet
                    </label>
                    <input
                      type="number"
                      step="10000"
                      value={formData.helperPocketMoney}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        const next = { ...formData, helperPocketMoney: val };
                        setFormData({ ...next, totalPocketDisbursed: calcFormPocket(next) });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs border border-emerald-200 rounded-lg bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-900 mb-0.5">
                      Alokasi E-Toll
                    </label>
                    <input
                      type="number"
                      step="10000"
                      value={formData.tollBudget}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        const next = { ...formData, tollBudget: val };
                        setFormData({ ...next, totalPocketDisbursed: calcFormPocket(next) });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs border border-emerald-200 rounded-lg bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-900 mb-0.5">
                      Parkir &amp; Timbangan
                    </label>
                    <input
                      type="number"
                      step="5000"
                      value={formData.otherTripBudget}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        const next = { ...formData, otherTripBudget: val };
                        setFormData({ ...next, totalPocketDisbursed: calcFormPocket(next) });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs border border-emerald-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">Total Uang Saku Diberikan:</span>
                  <span className="text-sm font-black font-mono text-emerald-800">
                    {formatRupiah(calcFormPocket(formData))}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-900 mb-0.5">
                      Sumber Rekening Kas Pencairan
                    </label>
                    <select
                      value={formData.pocketAccountId}
                      onChange={(e) => setFormData({ ...formData, pocketAccountId: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-emerald-200 rounded-lg bg-white"
                    >
                      {safeAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.accountName} ({formatRupiah(a.currentBalance)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-900 mb-0.5">
                      Status Uang Saku
                    </label>
                    <select
                      value={formData.pocketSettlementStatus}
                      onChange={(e) => setFormData({ ...formData, pocketSettlementStatus: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 text-xs border border-emerald-200 rounded-lg bg-white"
                    >
                      <option value="disbursed">Sudah Dicairkan ke Supir</option>
                      <option value="pending">Pending (Belum Diambil Supir)</option>
                      <option value="settled">Sudah Selesai Rekonsiliasi Kas</option>
                    </select>
                  </div>
                </div>
              </div>

              <ReceiptUploadField
                label="Upload Nota / Bukti Surat Jalan &amp; Biaya Trip"
                value={formData.tripProofUrl || ''}
                onChange={(url) => setFormData({ ...formData, tripProofUrl: url })}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Rute / Instruksi Khusus
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  placeholder="Misal: Nomor telepon PIC penerima di lokasi bongkar, jam operasional portal pabrik"
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500"
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  {editingTrip ? 'Simpan Perubahan' : 'Terbitkan Trip Sheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cetak Surat Jalan & Trip Sheet Resmi */}
      {printTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto printable-slip-modal">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto printable-slip-card print:m-0 print:shadow-none print:w-full">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 print:hidden print-hide">
              <span className="text-xs font-bold text-slate-800">
                Pratinjau Cetak Surat Jalan &amp; Trip Sheet Resmi
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    printElementById(
                      'printable-tripsheet-doc',
                      `Surat_Jalan_${printTrip.suratJalanNumber || printTrip.tripNumber}`
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Cetak PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintTrip(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <PrintOutPreviewStage
              documentLabel={`SURAT JALAN: ${printTrip.suratJalanNumber} (${printTrip.tripNumber})`}
            >
              {/* Printable Document Body */}
              <div id="printable-tripsheet-doc" className="p-8 bg-white space-y-4 text-slate-900 text-xs font-mono">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                  <div>
                    <h2 className="text-base font-black tracking-wide uppercase">
                      {printTrip.ownerCompany || 'PT TRANSINDO LOGISTIK INDONESIA'}
                    </h2>
                    <p className="text-[10px] text-slate-600">
                      DIVISI OPERASIONAL TRANSPORTASI, LOGISTIK &amp; ANGKUTAN BERAT
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Pool &amp; Workshop: Jl. Raya Narogong KM 12.5, Pangkalan 4, Bekasi • Telp: (021) 8249-1088
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="border border-slate-900 px-3 py-1 font-black text-sm">
                      SURAT JALAN &amp; TRIP SHEET
                    </div>
                    <div className="text-[11px] font-bold mt-1">NO: {printTrip.suratJalanNumber}</div>
                    <div className="text-[10px] text-slate-500">TRIP ID: {printTrip.tripNumber}</div>
                  </div>
                </div>

                {/* Data Armada & Supir */}
                <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-700">INFORMASI ARMADA &amp; PENGEMUDI:</div>
                    <div>• No. Polisi (Nopol): <span className="font-bold">{printTrip.nopol}</span></div>
                    <div>• Tipe Kendaraan: {printTrip.vehicleModel}</div>
                    <div>• Pengemudi Utama: <span className="font-bold">{printTrip.driverName}</span> {printTrip.driverNip ? `(${printTrip.driverNip})` : ''}</div>
                    <div>• No. HP Supir: {printTrip.driverPhone || '-'}</div>
                    <div>• Kernet Pembantu: {printTrip.helperName || '-'}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="font-bold text-slate-700">INFORMASI RUTE &amp; KLIEN:</div>
                    <div>• Pengirim / Klien: <span className="font-bold">{printTrip.clientCompany}</span></div>
                    <div>• Penerima Kargo: {printTrip.recipientCompany || '-'}</div>
                    <div>• Tanggal Berangkat: {formatDateIndo(printTrip.departureDate)}</div>
                    <div>• Lokasi Asal (Muat): {printTrip.originLocation}</div>
                    <div>• Lokasi Tujuan (Bongkar): {printTrip.destinationLocation}</div>
                  </div>
                </div>

                {/* Rincian Muatan */}
                <div className="border-b border-slate-200 pb-3">
                  <div className="font-bold mb-1.5">RINCIAN MUATAN BARANG:</div>
                  <table className="w-full text-left border border-slate-300">
                    <thead className="bg-slate-100 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-1.5">No</th>
                        <th className="p-1.5">Deskripsi Komoditas / Barang</th>
                        <th className="p-1.5 text-center">Volume / Koli</th>
                        <th className="p-1.5 text-right">Berat Tonase</th>
                        <th className="p-1.5 text-center">Kondisi Muatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-1.5 border-r border-slate-300">1</td>
                        <td className="p-1.5 border-r border-slate-300 font-bold">{printTrip.cargoDescription}</td>
                        <td className="p-1.5 border-r border-slate-300 text-center">{printTrip.cargoQuantity}</td>
                        <td className="p-1.5 border-r border-slate-300 text-right font-bold">{printTrip.cargoTonnageTon} Ton</td>
                        <td className="p-1.5 text-center text-emerald-700 font-bold">Baik / Aman Terpal</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Rincian Uang Saku Jalan */}
                <div className="border-b border-slate-200 pb-3">
                  <div className="font-bold mb-1">PLAFON UANG SAKU &amp; UANG JALAN SUPIR:</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span>• Uang Saku &amp; Makan Supir:</span>
                      <span>{formatRupiah(printTrip.driverPocketMoney)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Alokasi Biaya E-Toll:</span>
                      <span>{formatRupiah(printTrip.tollBudget)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Uang Saku Kernet:</span>
                      <span>{formatRupiah(printTrip.helperPocketMoney)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Parkir &amp; Timbangan:</span>
                      <span>{formatRupiah(printTrip.otherTripBudget)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-slate-200 pt-1 col-span-2 text-xs">
                      <span>TOTAL UANG JALAN DICAIRKAN:</span>
                      <span className="text-emerald-700">{formatRupiah(printTrip.totalPocketDisbursed)}</span>
                    </div>
                  </div>
                </div>

                {/* Tanda Tangan 4 Pihak */}
                <div className="grid grid-cols-4 pt-3 text-center text-[10px]">
                  <div>
                    <p className="text-slate-500">Pengirim (Klien),</p>
                    <div className="h-16"></div>
                    <p className="font-bold underline">(.........................)</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Karyawan Driver,</p>
                    <div className="h-16"></div>
                    <p className="font-bold underline">{printTrip.driverName}</p>
                    {printTrip.driverNip && <p className="text-[9px] text-slate-500">NIP: {printTrip.driverNip}</p>}
                  </div>
                  <div>
                    <p className="text-slate-500">Penerima Barang,</p>
                    <div className="h-16"></div>
                    <p className="font-bold underline">(.........................)</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Diserahkan (Dispatcher),</p>
                    <div className="h-16"></div>
                    <p className="font-bold underline">{printTrip.dispatcherName || 'Budi Santoso, S.T.'}</p>
                  </div>
                </div>

                <div className="text-[9px] text-center text-slate-400 pt-2 border-t border-slate-100">
                  Lembar 1: Kantor Pool • Lembar 2: Supir Pengemudi • Lembar 3: Klien Penerima
                </div>
              </div>
            </PrintOutPreviewStage>
          </div>
        </div>
      )}

      {/* Modal Preview Nota / Bukti Trip Sheet */}
      {inspectedProofTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Bukti Nota &amp; Surat Jalan: {inspectedProofTrip.tripNumber}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {inspectedProofTrip.nopol} • {inspectedProofTrip.driverName} • {formatRupiah(inspectedProofTrip.totalPocketDisbursed)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectedProofTrip(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center min-h-[300px] max-h-[480px] overflow-auto">
              {inspectedProofTrip.tripProofUrl?.startsWith('data:application/pdf') ? (
                <iframe
                  src={inspectedProofTrip.tripProofUrl}
                  title="Bukti Trip PDF"
                  className="w-full h-[420px] rounded-lg border border-slate-200 bg-white"
                />
              ) : inspectedProofTrip.tripProofUrl ? (
                <img
                  src={inspectedProofTrip.tripProofUrl}
                  alt="Nota & Surat Jalan"
                  className="max-w-full max-h-[440px] object-contain rounded-lg shadow-sm"
                />
              ) : (
                <div className="text-center text-slate-400 text-xs">
                  <FileText className="w-8 h-8 mx-auto mb-2" />
                  Belum ada nota terlampir.
                </div>
              )}
            </div>
            <div className="px-5 py-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">SJ: {inspectedProofTrip.suratJalanNumber}</span>
              <button
                onClick={() => setInspectedProofTrip(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
