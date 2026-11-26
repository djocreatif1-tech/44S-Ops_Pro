import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Printer,
  Trash2,
  Edit2,
  X,
  Lock,
  Eye,
  FileText,
  Receipt,
  Package
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MaintenanceRecord, Vehicle, ServiceType, SparepartItem, UserRole, ServiceTypeReference, Driver, SparepartInventoryItem } from '../../types';
import {
  formatRupiah,
  formatNumber,
  formatDateIndo
} from '../../utils/formatters';
import { exportMaintenanceToExcel, exportMaintenanceToPDF } from '../../utils/exportUtils';
import { printElementById } from '../../utils/slipPrint';
import { ModuleFilterExportBar } from '../Common/ModuleFilterExportBar';
import { getRolePermissions } from '../../utils/permissions';
import { RoleRestrictedBanner } from '../Common/RoleRestrictedBanner';
import { TablePagination } from '../Common/TablePagination';
import { ReceiptUploadField } from '../Common/ReceiptUploadField';
import { PrintOutPreviewStage } from '../Common/PrintPreviewControls';
import { ModuleAnalyticsPanel } from '../Common/ModuleAnalyticsPanel';
import { BarChart3, ListFilter } from 'lucide-react';
import { confirmDelete } from '../../utils/dialogService';
import { resolveDisplayReceiptUrl } from '../../utils/imageCompressor';

interface MaintenanceManagerProps {
  maintenance: MaintenanceRecord[];
  vehicles: Vehicle[];
  drivers?: Driver[];
  serviceTypes?: ServiceTypeReference[];
  sparepartInventory?: SparepartInventoryItem[];
  userRole?: UserRole;
  onOpenRoleMatrix?: () => void;
  onNavigateToInventory?: () => void;
  onAddMaintenance: (m: MaintenanceRecord) => void;
  onUpdateMaintenance?: (m: MaintenanceRecord) => void;
  onDeleteMaintenance: (id: string) => void;
}

export const MaintenanceManager: React.FC<MaintenanceManagerProps> = ({
  maintenance = [],
  vehicles = [],
  drivers = [],
  serviceTypes = [],
  sparepartInventory = [],
  userRole = 'owner',
  onOpenRoleMatrix,
  onNavigateToInventory,
  onAddMaintenance,
  onUpdateMaintenance,
  onDeleteMaintenance
}) => {
  const safeMaintenance = Array.isArray(maintenance) ? maintenance : [];
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const safeInventory = Array.isArray(sparepartInventory) ? sparepartInventory : [];
  const perms = getRolePermissions(userRole);
  const [moduleView, setModuleView] = useState<'data' | 'analytics'>('data');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getMaintCompany = (m: MaintenanceRecord) => {
    const v = safeVehicles.find(veh => veh.id === m.vehicleId || veh.nopol === m.nopol);
    return v?.ownerCompany || 'Perusahaan Umum / Lainnya';
  };

  const companies = Array.from(
    new Set([
      ...safeVehicles.map(v => v.ownerCompany).filter(Boolean),
      ...safeMaintenance.map(m => getMaintCompany(m)).filter(Boolean)
    ])
  );

  const companySummaries = companies.map((comp) => {
    const compMaint = safeMaintenance.filter((m) => {
      if (!m) return false;
      if (startDate && m.serviceDate < startDate) return false;
      if (endDate && m.serviceDate > endDate) return false;
      return getMaintCompany(m) === comp;
    });
    return {
      companyName: comp,
      count: compMaint.length,
      totalExpense: compMaint.reduce((sum, m) => sum + (m.totalCost || 0), 0),
    };
  });
  
  // Pagination State (Next Halaman)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSpk, setSelectedSpk] = useState<MaintenanceRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [inspectedReceiptRecord, setInspectedReceiptRecord] = useState<MaintenanceRecord | null>(null);

  // Form state (Add)
  const [selectedVehicleId, setSelectedVehicleId] = useState(safeVehicles[0]?.id || '');
  const [driverName, setDriverName] = useState(safeVehicles[0]?.assignedDriver || safeDrivers[0]?.name || '');
  const [serviceDate, setServiceDate] = useState('2026-08-21');
  const [currentOdo, setCurrentOdo] = useState<number>(safeVehicles[0]?.currentOdometer || 0);
  const [nextServiceOdo, setNextServiceOdo] = useState<number>((safeVehicles[0]?.currentOdometer || 0) + 5000);
  const [nextServiceDate, setNextServiceDate] = useState('2026-11-21');
  const [serviceType, setServiceType] = useState<ServiceType>('Ganti Oli Mesin & Filter Oli');
  const [workshopName, setWorkshopName] = useState('Bengkel Sentosa Diesel');
  const [mechanicName, setMechanicName] = useState('Pak Joko');
  const [workOrderNumber, setWorkOrderNumber] = useState('WO-2026-' + Date.now().toString().slice(-4));
  const [laborCost, setLaborCost] = useState<number>(200000);
  const [status, setStatus] = useState<'completed' | 'in_progress' | 'scheduled'>('completed');
  const [notes, setNotes] = useState('');
  const [receiptProofUrl, setReceiptProofUrl] = useState('');

  const [spareparts, setSpareparts] = useState<SparepartItem[]>([
    { id: 'SP-1', name: 'Oli Mesin Meditran SX 15W-40', qty: 16, unit: 'Liter', unitPrice: 55000, totalPrice: 880000 },
    { id: 'SP-2', name: 'Filter Oli Genuine', qty: 1, unit: 'Pcs', unitPrice: 175000, totalPrice: 175000 }
  ]);

  // Form state (Edit)
  const [editFormData, setEditFormData] = useState({
    id: '',
    vehicleId: '',
    driverName: '',
    serviceDate: '',
    serviceType: 'Ganti Oli Mesin & Filter Oli' as ServiceType,
    workshopName: '',
    mechanicName: '',
    workOrderNumber: '',
    odometerAtService: 0,
    nextServiceOdometer: 0,
    nextServiceDate: '',
    laborCost: 0,
    status: 'completed' as 'completed' | 'in_progress' | 'scheduled',
    notes: '',
    receiptProofUrl: '',
    spareparts: [] as SparepartItem[]
  });

  const handleVehicleSelect = (vId: string) => {
    setSelectedVehicleId(vId);
    const v = vehicles.find(veh => veh.id === vId);
    if (v) {
      setDriverName(v.assignedDriver || '');
      setCurrentOdo(v.currentOdometer);
      setNextServiceOdo(v.currentOdometer + 5000);
    }
  };

  const addSparepartRow = () => {
    setSpareparts([
      ...spareparts,
      { id: 'SP-' + Date.now(), name: '', qty: 1, unit: 'Pcs', unitPrice: 0, totalPrice: 0 }
    ]);
  };

  const updateSparepart = (index: number, field: keyof SparepartItem, val: any) => {
    const updated = [...spareparts];
    updated[index] = { ...updated[index], [field]: val };
    if (field === 'qty' || field === 'unitPrice') {
      updated[index].totalPrice = (Number(updated[index].qty) || 0) * (Number(updated[index].unitPrice) || 0);
    }
    setSpareparts(updated);
  };

  const removeSparepartRow = (index: number) => {
    setSpareparts(spareparts.filter((_, i) => i !== index));
  };

  const totalSparepartsCost = spareparts.reduce((sum, s) => sum + s.totalPrice, 0);
  const grandTotalCost = laborCost + totalSparepartsCost;

  // Edit form sparepart functions
  const addEditSparepartRow = () => {
    setEditFormData({
      ...editFormData,
      spareparts: [
        ...editFormData.spareparts,
        { id: 'SP-' + Date.now(), name: '', qty: 1, unit: 'Pcs', unitPrice: 0, totalPrice: 0 }
      ]
    });
  };

  const updateEditSparepart = (index: number, field: keyof SparepartItem, val: any) => {
    const updated = [...editFormData.spareparts];
    updated[index] = { ...updated[index], [field]: val };
    if (field === 'qty' || field === 'unitPrice') {
      updated[index].totalPrice = (Number(updated[index].qty) || 0) * (Number(updated[index].unitPrice) || 0);
    }
    setEditFormData({ ...editFormData, spareparts: updated });
  };

  const removeEditSparepartRow = (index: number) => {
    setEditFormData({
      ...editFormData,
      spareparts: (editFormData.spareparts || []).filter((_, i) => i !== index)
    });
  };

  const editSparepartsCost = (editFormData.spareparts || []).reduce((sum, s) => sum + (s?.totalPrice || 0), 0);
  const editGrandTotal = (editFormData.laborCost || 0) + editSparepartsCost;

  const filteredMaintenance = safeMaintenance.filter((m) => {
    if (!m) return false;
    const compName = getMaintCompany(m);
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (m.nopol || '').toLowerCase().includes(q) ||
      (m.serviceType || '').toLowerCase().includes(q) ||
      (m.workshopName || '').toLowerCase().includes(q) ||
      ((m.workOrderNumber || '').toLowerCase().includes(q)) ||
      compName.toLowerCase().includes(q);
    const matchesVehicle = selectedVehicle === 'all' || m.vehicleId === selectedVehicle || m.nopol === selectedVehicle;
    const matchesCompany = selectedCompany === 'all' || compName === selectedCompany;

    // Date range filter
    const matchesStartDate = !startDate || m.serviceDate >= startDate;
    const matchesEndDate = !endDate || m.serviceDate <= endDate;

    return matchesSearch && matchesVehicle && matchesCompany && matchesStartDate && matchesEndDate;
  });

  // Paginated Maintenance Records for Next / Prev Pages
  const totalFilteredMaintenance = filteredMaintenance.length;
  const paginatedMaintenance = filteredMaintenance.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const dateRangeText = startDate && endDate
    ? `${startDate} s/d ${endDate}`
    : startDate
    ? `Mulai ${startDate}`
    : endDate
    ? `Sampai ${endDate}`
    : 'Semua Periode';

  const handleExportExcel = () => {
    exportMaintenanceToExcel(filteredMaintenance, dateRangeText);
  };

  const handleExportPDF = () => {
    exportMaintenanceToPDF(filteredMaintenance, dateRangeText);
  };

  const totalMaintenanceCost = filteredMaintenance.reduce((sum, m) => sum + (m?.totalCost || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = safeVehicles.find(veh => veh.id === selectedVehicleId);
    const nopol = v ? v.nopol : 'B 0000 XX';
    const matchedDrv = safeDrivers.find(d => d.name.toLowerCase() === (driverName || '').toLowerCase());

    const newRecord: MaintenanceRecord = {
      id: 'MN-' + Date.now().toString().slice(-4),
      vehicleId: selectedVehicleId,
      nopol,
      driverId: matchedDrv?.id,
      driverName: driverName || v?.assignedDriver || '',
      driverNip: matchedDrv?.nip,
      serviceDate,
      serviceType,
      workshopName,
      mechanicName,
      workOrderNumber,
      odometerAtService: Number(currentOdo) || 0,
      nextServiceOdometer: Number(nextServiceOdo) || 0,
      nextServiceDate,
      laborCost: Number(laborCost) || 0,
      totalCost: grandTotalCost,
      spareparts,
      status,
      notes,
      receiptProofUrl: receiptProofUrl || undefined
    };

    onAddMaintenance(newRecord);
    setReceiptProofUrl('');
    setIsModalOpen(false);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
  };

  const handleOpenEdit = (m: MaintenanceRecord) => {
    const v = safeVehicles.find(veh => veh.id === m.vehicleId || veh.nopol === m.nopol);
    setSelectedRecord(m);
    setEditFormData({
      id: m.id,
      vehicleId: m.vehicleId,
      driverName: m.driverName || v?.assignedDriver || '',
      serviceDate: m.serviceDate,
      serviceType: m.serviceType,
      workshopName: m.workshopName,
      mechanicName: m.mechanicName || '',
      workOrderNumber: m.workOrderNumber,
      odometerAtService: m.odometerAtService,
      nextServiceOdometer: m.nextServiceOdometer,
      nextServiceDate: m.nextServiceDate || '',
      laborCost: m.laborCost,
      status: m.status,
      notes: m.notes || '',
      receiptProofUrl: m.receiptProofUrl || '',
      spareparts: m.spareparts ? [...m.spareparts] : []
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !onUpdateMaintenance) return;

    const v = vehicles.find(veh => veh.id === editFormData.vehicleId);
    const nopol = v ? v.nopol : selectedRecord.nopol;
    const matchedDrv = safeDrivers.find(d => d.name.toLowerCase() === (editFormData.driverName || '').toLowerCase());

    const updated: MaintenanceRecord = {
      ...selectedRecord,
      vehicleId: editFormData.vehicleId,
      nopol,
      driverId: matchedDrv?.id || selectedRecord.driverId,
      driverName: editFormData.driverName || selectedRecord.driverName,
      driverNip: matchedDrv?.nip || selectedRecord.driverNip,
      serviceDate: editFormData.serviceDate,
      serviceType: editFormData.serviceType,
      workshopName: editFormData.workshopName,
      mechanicName: editFormData.mechanicName,
      workOrderNumber: editFormData.workOrderNumber,
      odometerAtService: Number(editFormData.odometerAtService) || 0,
      nextServiceOdometer: Number(editFormData.nextServiceOdometer) || 0,
      nextServiceDate: editFormData.nextServiceDate,
      sparepartsCost: editSparepartsCost,
      laborCost: Number(editFormData.laborCost) || 0,
      totalCost: editGrandTotal,
      spareparts: editFormData.spareparts,
      status: editFormData.status,
      notes: editFormData.notes,
      receiptProofUrl: editFormData.receiptProofUrl || undefined
    };

    onUpdateMaintenance(updated);
    setIsEditModalOpen(false);
    setSelectedRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* Role Restricted Banner */}
      {!perms.canAddMaintenance && (
        <RoleRestrictedBanner
          userRole={userRole}
          moduleName="Perawatan Rutin & SPK Bengkel"
          allowedActionsText="Hanya dapat melihat jadwal servis"
          restrictedActionsText="Pembuatan SPK dan pencatatan bengkel hanya dapat dikelola oleh Admin 1 & Owner."
          onOpenRoleModal={onOpenRoleMatrix}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            Perawatan Berkala &amp; Bengkel Armada
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Pencatatan Surat Perintah Kerja (SPK), riwayat servis suku cadang, dan jadwal servis berkala
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
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
              <span>Daftar SPK Servis</span>
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
              <span>Laporan &amp; Analitik Bengkel</span>
            </button>
          </div>

          {onNavigateToInventory && (
            <button
              type="button"
              onClick={onNavigateToInventory}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>Gudang Sparepart Baru &amp; Bekas ({safeInventory.length})</span>
            </button>
          )}

          {perms.canAddMaintenance ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-xs active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Buat SPK Servis</span>
            </button>
          ) : (
            <button
              disabled
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 text-slate-400 font-medium text-xs rounded-lg cursor-not-allowed border border-slate-200"
              title="Akses dibatasi sesuai peran pengguna"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Buat SPK (Terkunci)</span>
            </button>
          )}
        </div>
      </div>

      {moduleView === 'analytics' ? (
        <ModuleAnalyticsPanel
          moduleType="maintenance"
          title="Laporan & Analitik Perawatan Berkala & SPK Bengkel"
          subtitle="Analisis proporsi biaya suku cadang (sparepart) vs ongkos jasa mekanik per armada & bengkel rekanan"
          maintenance={safeMaintenance}
          vehicles={safeVehicles}
          drivers={safeDrivers}
        />
      ) : (
      <>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Catatan Servis</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{filteredMaintenance.length} <span className="text-sm font-normal text-slate-400">Pekerjaan</span></h3>
          <p className="text-[10px] text-slate-400 mt-1">Surat Perintah Kerja diterbitkan</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Biaya Perawatan</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1 font-mono">{formatRupiah(totalMaintenanceCost)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Jasa montir &amp; belanja suku cadang</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Rata-rata Biaya per Servis</p>
          <h3 className="text-2xl font-bold text-blue-600 mt-1 font-mono">
            {filteredMaintenance.length > 0 ? formatRupiah(totalMaintenanceCost / filteredMaintenance.length) : 'Rp 0'}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Rata-rata nilai transaksi bengkel</p>
        </div>
      </div>

      {/* Date Filter & Export Bar */}
      <ModuleFilterExportBar
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onResetDateFilter={() => { setStartDate(''); setEndDate(''); }}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        totalFilteredCount={filteredMaintenance.length}
        totalAllCount={maintenance.length}
        moduleLabel="Riwayat Servis"
        companies={companies}
        selectedCompany={selectedCompany}
        onCompanyChange={(val) => {
          setSelectedCompany(val);
          setCurrentPage(1);
        }}
        companySummaries={companySummaries}
      >
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari SPK, Nopol, jenis servis, bengkel..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white"
          />
        </div>

        <select
          value={selectedVehicle}
          onChange={(e) => {
            setSelectedVehicle(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 font-medium"
        >
          <option value="all">Semua Armada</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.nopol} ({v.brand})</option>
          ))}
        </select>
      </ModuleFilterExportBar>

      {/* Maintenance Table with Full CRUD */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100 font-bold">
              <tr>
                <th className="py-3 px-5">Tanggal &amp; No SPK</th>
                <th className="py-3 px-5">Armada &amp; Bengkel</th>
                <th className="py-3 px-5">Jenis Pekerjaan Servis</th>
                <th className="py-3 px-5">Odo Servis &amp; Next</th>
                <th className="py-3 px-5 text-right">Total Biaya (Rp)</th>
                <th className="py-3 px-5 text-center">SPK</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedMaintenance.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-5">
                    <p className="font-bold text-slate-800">{formatDateIndo(m.serviceDate)}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{m.workOrderNumber}</p>
                  </td>
                  <td className="py-3.5 px-5">
                    <p className="font-mono font-bold text-slate-800">{m.nopol}</p>
                    <p className="text-[11px] text-slate-500">{m.workshopName}</p>
                    {(() => {
                      const v = safeVehicles.find(veh => veh.id === m.vehicleId || veh.nopol === m.nopol);
                      const drvName = m.driverName || v?.assignedDriver;
                      const matchedDrv = safeDrivers.find(d => d.name.toLowerCase() === (drvName || '').toLowerCase());
                      const nip = m.driverNip || matchedDrv?.nip;
                      return drvName ? (
                        <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                          PJ Serah Terima: {drvName} {nip ? `(${nip})` : ''}
                        </p>
                      ) : null;
                    })()}
                  </td>
                  <td className="py-3.5 px-5">
                    <p className="font-medium text-slate-800">{m.serviceType}</p>
                    <p className="text-[10px] text-slate-400">{m.spareparts?.length || 0} sparepart diganti</p>
                  </td>
                  <td className="py-3.5 px-5 font-mono">
                    <p className="font-bold text-slate-800">{formatNumber(m.odometerAtService)} KM</p>
                    <p className="text-[10px] text-blue-600 font-medium">Next: {formatNumber(m.nextServiceOdometer)} KM</p>
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-800">
                    {formatRupiah(m.totalCost)}
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSelectedSpk(m)}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition"
                        title="Lihat Cetak SPK"
                      >
                        <Printer className="w-3 h-3 text-blue-600" />
                        <span>SPK</span>
                      </button>
                      {m.receiptProofUrl && (
                        <button
                          onClick={() => setInspectedReceiptRecord(m)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition"
                          title="Lihat Nota Bengkel"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Nota</span>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {perms.canEditMaintenance && onUpdateMaintenance && (
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition"
                          title="Edit Catatan Servis"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {perms.canDeleteMaintenance && (
                        <button
                          onClick={async () => {
                            if (await confirmDelete(`Riwayat Servis ${m.workOrderNumber}`, 'Apakah Anda Yakin Ingin Menghapus Data?', `Armada: ${m.nopol} • Tanggal: ${m.date}`)) {
                              onDeleteMaintenance(m.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition"
                          title="Hapus riwayat servis"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMaintenance.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada data riwayat perawatan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination with Next / Prev */}
        <TablePagination
          currentPage={currentPage}
          totalItems={totalFilteredMaintenance}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 20, 50]}
          itemLabel="riwayat servis bengkel"
        />
      </div>
      </>
      )}

      {/* SPK View / Print Modal */}
      {selectedSpk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto printable-slip-modal">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto printable-slip-card">
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50 print:hidden print-hide">
              <span className="text-xs font-bold text-slate-800">Pratinjau Cetak SPK Bengkel</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    printElementById(
                      'printable-spk-doc',
                      `SPK_${selectedSpk.workOrderNumber}`
                    )
                  }
                  className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Lembar SPK</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSpk(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <PrintOutPreviewStage
              documentLabel={`SPK BENGKEL: ${selectedSpk.workOrderNumber}`}
            >
              <div id="printable-spk-doc" className="p-6 space-y-4 text-xs bg-white text-slate-900">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">SURAT PERINTAH KERJA (SPK)</h3>
                    <p className="text-[10px] text-slate-500 font-mono">{selectedSpk.workOrderNumber}</p>
                  </div>
                  <div className="text-right text-[10px] text-slate-500 font-mono">
                    44S OPS_PRO WORKSHOP
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-slate-400 text-[10px]">No. Polisi Unit</p>
                    <p className="font-mono font-bold text-slate-800">{selectedSpk.nopol}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px]">Tanggal Servis</p>
                    <p className="font-bold text-slate-800">{formatDateIndo(selectedSpk.serviceDate)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px]">Bengkel Rekanan</p>
                    <p className="font-medium text-slate-800">{selectedSpk.workshopName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px]">Mekanik Penanggungjawab</p>
                    <p className="font-medium text-slate-800">{selectedSpk.mechanicName || '-'}</p>
                  </div>
                  <div className="col-span-2 pt-1.5 border-t border-slate-200/70">
                    <p className="text-slate-400 text-[10px]">Karyawan Driver Penyerah Unit (Serah Terima Bengkel)</p>
                    <p className="font-bold text-emerald-800">
                      {selectedSpk.driverName || safeVehicles.find(v => v.id === selectedSpk.vehicleId)?.assignedDriver || '-'}
                      {selectedSpk.driverNip ? ` (${selectedSpk.driverNip})` : ''}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-slate-700 mb-1">Rincian Pekerjaan &amp; Sparepart:</p>
                  <table className="w-full text-[11px] border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="p-2 text-left">Deskripsi</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Harga</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedSpk.spareparts?.map((sp, i) => (
                        <tr key={i}>
                          <td className="p-2">{sp.name}</td>
                          <td className="p-2 text-center">{sp.qty} {sp.unit}</td>
                          <td className="p-2 text-right font-mono">{formatRupiah(sp.unitPrice)}</td>
                          <td className="p-2 text-right font-mono font-semibold">{formatRupiah(sp.totalPrice)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={3} className="p-2 font-medium text-slate-600">Ongkos Jasa Mekanik</td>
                        <td className="p-2 text-right font-mono font-semibold">{formatRupiah(selectedSpk.laborCost)}</td>
                      </tr>
                      <tr className="bg-blue-50 font-bold">
                        <td colSpan={3} className="p-2 text-blue-900">GRAND TOTAL BIAYA SERVIS</td>
                        <td className="p-2 text-right font-mono text-blue-900">{formatRupiah(selectedSpk.totalCost)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 pt-3 text-center text-xs">
                  <div>
                    <p className="text-slate-500">Diserahkan Oleh (Karyawan Driver),</p>
                    <div className="h-14"></div>
                    <p className="font-bold underline">
                      {selectedSpk.driverName || safeVehicles.find(v => v.id === selectedSpk.vehicleId)?.assignedDriver || '(.........................)'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Diterima Oleh (Kepala Bengkel / Mekanik),</p>
                    <div className="h-14"></div>
                    <p className="font-bold underline">{selectedSpk.mechanicName || selectedSpk.workshopName}</p>
                  </div>
                </div>
              </div>
            </PrintOutPreviewStage>
          </div>
        </div>
      )}

      {/* Modal Add Maintenance */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                Terbitkan SPK &amp; Catat Servis Bengkel
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Pilih Unit Armada *</label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => handleVehicleSelect(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.nopol} - {v.brand} ({v.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Karyawan Driver Penyerah Unit *</label>
                  <select
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full bg-emerald-50/40 border border-emerald-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-hidden focus:border-emerald-500"
                  >
                    {safeDrivers.map((d) => (
                      <option key={d.id} value={d.name}>
                        [{d.nip || d.id}] {d.name} ({d.assignedVehicle || 'Pool'})
                      </option>
                    ))}
                    {driverName && !safeDrivers.some(d => d.name === driverName) && (
                      <option value={driverName}>{driverName}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Tanggal Masuk Servis</label>
                  <input
                    type="date"
                    required
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jenis Servis / Pemeliharaan *</label>
                  <select
                    value={serviceType}
                    onChange={(e) => {
                      const val = e.target.value as ServiceType;
                      setServiceType(val);
                      const matched = serviceTypes.find(s => s.name === val);
                      if (matched && matched.defaultIntervalKm) {
                        setNextServiceOdo(currentOdo + matched.defaultIntervalKm);
                      }
                      if (matched && matched.estimatedCost && laborCost === 200000) {
                        setLaborCost(matched.estimatedCost);
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500 font-medium"
                  >
                    {serviceTypes.length > 0 ? (
                      serviceTypes.filter(s => s.isActive).map(st => (
                        <option key={st.id} value={st.name}>
                          {st.name} ({st.defaultIntervalKm.toLocaleString()} KM)
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Ganti Oli Mesin & Filter Oli">Ganti Oli Mesin &amp; Filter Oli</option>
                        <option value="Pemeriksaan Sistem Rem & Ganti Kampas">Pemeriksaan Sistem Rem &amp; Ganti Kampas</option>
                        <option value="Rotasi & Penggantian Ban Luar/Dalam">Rotasi &amp; Penggantian Ban Luar/Dalam</option>
                        <option value="Tune Up & Kalibrasi Injektor Common Rail">Tune Up &amp; Kalibrasi Injektor</option>
                        <option value="Ganti Filter Solar & Filter Udara">Ganti Filter Solar &amp; Filter Udara</option>
                        <option value="Ganti Oli Gardan & Transmisi">Ganti Oli Gardan &amp; Transmisi</option>
                        <option value="Overhaul Mesin (Turun Mesin Total)">Overhaul Mesin (Turun Mesin)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nama Bengkel / Vendor</label>
                  <input
                    type="text"
                    required
                    value={workshopName}
                    onChange={(e) => setWorkshopName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Odometer Saat Servis (KM) *</label>
                  <input
                    type="number"
                    required
                    value={currentOdo}
                    onChange={(e) => setCurrentOdo(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Target Odometer Servis Berikutnya (KM)</label>
                  <input
                    type="number"
                    value={nextServiceOdo}
                    onChange={(e) => setNextServiceOdo(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Spareparts Item Builder */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label className="text-slate-700 font-semibold">Rincian Sparepart yang Diganti (Baru / Bekas)</label>
                  <div className="flex items-center gap-2">
                    {safeInventory.length > 0 && (
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const invId = e.target.value;
                          if (!invId) return;
                          const found = safeInventory.find(i => i.id === invId);
                          if (found) {
                            const condTag = found.condition === 'baru' ? 'BARU' : found.condition === 'bekas_rekondisi' ? 'REKONDISI' : 'BEKAS COPOTAN';
                            setSpareparts(prev => [
                              ...prev,
                              {
                                id: 'SP-' + Date.now(),
                                name: `[${condTag}] ${found.partName} (${found.partCode})`,
                                qty: 1,
                                unit: found.unit,
                                unitPrice: found.unitPrice,
                                totalPrice: found.unitPrice
                              }
                            ]);
                          }
                          e.target.value = '';
                        }}
                        className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg px-2.5 py-1 text-[11px] font-bold focus:outline-hidden"
                      >
                        <option value="">+ Pilih dari Gudang Sparepart (Baru/Bekas)...</option>
                        {safeInventory
                          .filter(i => i.stockQty > 0 && i.condition !== 'bekas_rusak_afkir')
                          .map(i => (
                            <option key={i.id} value={i.id}>
                              [{i.condition === 'baru' ? 'BARU' : 'BEKAS'}] {i.partCode} - {i.partName} (Stok: {i.stockQty} {i.unit})
                            </option>
                          ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={addSparepartRow}
                      className="text-blue-600 font-bold hover:underline text-xs"
                    >
                      + Baris Manual
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {spareparts.map((sp, idx) => (
                    <div key={sp.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Nama suku cadang"
                        value={sp.name}
                        onChange={(e) => updateSparepart(idx, 'name', e.target.value)}
                        className="flex-2 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={sp.qty}
                        onChange={(e) => updateSparepart(idx, 'qty', parseFloat(e.target.value) || 0)}
                        className="w-14 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Harga"
                        value={sp.unitPrice}
                        onChange={(e) => updateSparepart(idx, 'unitPrice', parseInt(e.target.value, 10) || 0)}
                        className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                      />
                      <span className="w-24 text-right font-mono font-semibold text-slate-800 text-xs">
                        {formatRupiah(sp.totalPrice)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSparepartRow(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Ongkos Jasa Mekanik (Rp)</label>
                  <input
                    type="number"
                    value={laborCost}
                    onChange={(e) => setLaborCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Grand Total Biaya Servis</label>
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-bold font-mono">
                    {formatRupiah(grandTotalCost)}
                  </div>
                </div>
              </div>

              <ReceiptUploadField
                label="Upload Nota / Faktur Bengkel & Sparepart"
                value={receiptProofUrl}
                onChange={setReceiptProofUrl}
              />

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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-xs"
                >
                  Simpan SPK &amp; Riwayat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Maintenance (Update CRUD) */}
      {isEditModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                Edit SPK &amp; Catatan Servis Bengkel
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Unit Armada *</label>
                  <select
                    value={editFormData.vehicleId}
                    onChange={(e) => setEditFormData({ ...editFormData, vehicleId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.nopol} - {v.brand} ({v.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Tanggal Servis</label>
                  <input
                    type="date"
                    required
                    value={editFormData.serviceDate}
                    onChange={(e) => setEditFormData({ ...editFormData, serviceDate: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jenis Servis *</label>
                  <select
                    value={editFormData.serviceType}
                    onChange={(e) => setEditFormData({ ...editFormData, serviceType: e.target.value as ServiceType })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500 font-medium"
                  >
                    {serviceTypes.length > 0 ? (
                      serviceTypes.map(st => (
                        <option key={st.id} value={st.name}>
                          {st.name} ({st.defaultIntervalKm.toLocaleString()} KM)
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Ganti Oli Mesin & Filter Oli">Ganti Oli Mesin &amp; Filter Oli</option>
                        <option value="Pemeriksaan Sistem Rem & Ganti Kampas">Pemeriksaan Sistem Rem &amp; Ganti Kampas</option>
                        <option value="Rotasi & Penggantian Ban Luar/Dalam">Rotasi &amp; Penggantian Ban Luar/Dalam</option>
                        <option value="Tune Up & Kalibrasi Injektor Common Rail">Tune Up &amp; Kalibrasi Injektor</option>
                        <option value="Ganti Filter Solar & Filter Udara">Ganti Filter Solar &amp; Filter Udara</option>
                        <option value="Ganti Oli Gardan & Transmisi">Ganti Oli Gardan &amp; Transmisi</option>
                        <option value="Overhaul Mesin (Turun Mesin Total)">Overhaul Mesin (Turun Mesin)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nama Bengkel</label>
                  <input
                    type="text"
                    required
                    value={editFormData.workshopName}
                    onChange={(e) => setEditFormData({ ...editFormData, workshopName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Odometer Saat Servis (KM)</label>
                  <input
                    type="number"
                    value={editFormData.odometerAtService}
                    onChange={(e) => setEditFormData({ ...editFormData, odometerAtService: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Target Odometer Servis Berikutnya (KM)</label>
                  <input
                    type="number"
                    value={editFormData.nextServiceOdometer}
                    onChange={(e) => setEditFormData({ ...editFormData, nextServiceOdometer: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Spareparts Item Builder (Edit) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-700 font-semibold">Rincian Sparepart yang Diganti</label>
                  <button
                    type="button"
                    onClick={addEditSparepartRow}
                    className="text-blue-600 font-medium hover:underline text-xs"
                  >
                    + Tambah Sparepart
                  </button>
                </div>

                <div className="space-y-2">
                  {editFormData.spareparts.map((sp, idx) => (
                    <div key={sp.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Nama suku cadang"
                        value={sp.name}
                        onChange={(e) => updateEditSparepart(idx, 'name', e.target.value)}
                        className="flex-2 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={sp.qty}
                        onChange={(e) => updateEditSparepart(idx, 'qty', parseFloat(e.target.value) || 0)}
                        className="w-14 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Harga"
                        value={sp.unitPrice}
                        onChange={(e) => updateEditSparepart(idx, 'unitPrice', parseInt(e.target.value, 10) || 0)}
                        className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                      />
                      <span className="w-24 text-right font-mono font-semibold text-slate-800 text-xs">
                        {formatRupiah(sp.totalPrice)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEditSparepartRow(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Ongkos Jasa Mekanik (Rp)</label>
                  <input
                    type="number"
                    value={editFormData.laborCost}
                    onChange={(e) => setEditFormData({ ...editFormData, laborCost: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Grand Total Biaya Servis</label>
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-bold font-mono">
                    {formatRupiah(editGrandTotal)}
                  </div>
                </div>
              </div>

              <ReceiptUploadField
                label="Upload / Ganti Nota Bengkel & Sparepart"
                value={editFormData.receiptProofUrl}
                onChange={(url) => setEditFormData({ ...editFormData, receiptProofUrl: url })}
              />

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-xs"
                >
                  Perbarui SPK &amp; Riwayat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Nota Bengkel */}
      {inspectedReceiptRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Nota Bengkel: {inspectedReceiptRecord.workOrderNumber} ({inspectedReceiptRecord.nopol})
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {formatDateIndo(inspectedReceiptRecord.serviceDate)} • {inspectedReceiptRecord.workshopName} • {formatRupiah(inspectedReceiptRecord.totalCost)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectedReceiptRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center min-h-[300px] max-h-[480px] overflow-auto">
              {inspectedReceiptRecord.receiptProofUrl ? (() => {
                const resolvedUrl = resolveDisplayReceiptUrl(inspectedReceiptRecord.receiptProofUrl, {
                  title: 'NOTA SERVIS & BENGKEL ARMADA',
                  subtitle: inspectedReceiptRecord.workshopName || inspectedReceiptRecord.serviceType,
                  receiptNumber: inspectedReceiptRecord.workOrderNumber || inspectedReceiptRecord.id,
                  date: formatDateIndo(inspectedReceiptRecord.serviceDate),
                  amountText: formatRupiah(inspectedReceiptRecord.totalCost),
                  nopol: inspectedReceiptRecord.nopol,
                  driverName: inspectedReceiptRecord.driverName
                });
                return resolvedUrl.startsWith('data:application/pdf') ? (
                  <iframe
                    src={resolvedUrl}
                    title="Nota Bengkel PDF"
                    className="w-full h-[420px] rounded-lg border border-slate-200 bg-white"
                  />
                ) : (
                  <img
                    src={resolvedUrl}
                    alt="Nota Bengkel"
                    className="max-w-full max-h-[440px] object-contain rounded-lg shadow-sm bg-white"
                  />
                );
              })() : (
                <div className="text-center text-slate-400 text-xs">
                  <FileText className="w-8 h-8 mx-auto mb-2" />
                  Belum ada nota terlampir.
                </div>
              )}
            </div>
            <div className="px-5 py-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">{inspectedReceiptRecord.serviceType}</span>
              <button
                onClick={() => setInspectedReceiptRecord(null)}
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
