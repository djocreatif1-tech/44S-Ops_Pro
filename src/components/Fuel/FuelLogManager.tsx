import React, { useState } from 'react';
import {
  Fuel,
  Plus,
  Search,
  Trash2,
  Edit2,
  X,
  Lock,
  Eye,
  FileText,
  Receipt
} from 'lucide-react';
import { FuelLog, Vehicle, FuelType, UserRole, Driver } from '../../types';
import {
  formatRupiah,
  formatNumber,
  formatDateIndo,
  getFuelEfficiencyStatus
} from '../../utils/formatters';
import { exportFuelToExcel, exportFuelToPDF } from '../../utils/exportUtils';
import { ModuleFilterExportBar } from '../Common/ModuleFilterExportBar';
import { getRolePermissions } from '../../utils/permissions';
import { RoleRestrictedBanner } from '../Common/RoleRestrictedBanner';
import { TablePagination } from '../Common/TablePagination';
import { confirmDelete } from '../../utils/dialogService';
import { ReceiptUploadField } from '../Common/ReceiptUploadField';
import { ModuleAnalyticsPanel } from '../Common/ModuleAnalyticsPanel';
import { BarChart3, ListFilter, UploadCloud } from 'lucide-react';
import { resolveDisplayReceiptUrl, compressReceiptFile, getApproxBase64SizeKB } from '../../utils/imageCompressor';

interface FuelLogManagerProps {
  fuelLogs: FuelLog[];
  vehicles: Vehicle[];
  drivers?: Driver[];
  userRole?: UserRole;
  onOpenRoleMatrix?: () => void;
  onAddFuelLog: (log: FuelLog) => void;
  onUpdateFuelLog?: (log: FuelLog) => void;
  onDeleteFuelLog: (id: string) => void;
}

export const FuelLogManager: React.FC<FuelLogManagerProps> = ({
  fuelLogs = [],
  vehicles = [],
  drivers = [],
  userRole = 'owner',
  onOpenRoleMatrix,
  onAddFuelLog,
  onUpdateFuelLog,
  onDeleteFuelLog
}) => {
  const safeFuelLogs = Array.isArray(fuelLogs) ? fuelLogs : [];
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const perms = getRolePermissions(userRole);
  const [moduleView, setModuleView] = useState<'data' | 'analytics'>('data');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getFuelCompany = (log: FuelLog) => {
    const v = safeVehicles.find(veh => veh.id === log.vehicleId || veh.nopol === log.nopol);
    return v?.ownerCompany || 'Perusahaan Umum / Lainnya';
  };

  const companies = Array.from(
    new Set([
      ...safeVehicles.map(v => v.ownerCompany).filter(Boolean),
      ...safeFuelLogs.map(l => getFuelCompany(l)).filter(Boolean)
    ])
  );

  const companySummaries = companies.map((comp) => {
    const compLogs = safeFuelLogs.filter((l) => {
      if (!l) return false;
      if (startDate && l.date < startDate) return false;
      if (endDate && l.date > endDate) return false;
      return getFuelCompany(l) === comp;
    });
    return {
      companyName: comp,
      count: compLogs.length,
      totalExpense: compLogs.reduce((sum, l) => sum + (l.totalCost || 0), 0),
    };
  });
  
  // Pagination State (Next Halaman)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<FuelLog | null>(null);
  const [inspectedReceiptLog, setInspectedReceiptLog] = useState<FuelLog | null>(null);

  // Form State (Add)
  const [selectedVehicleId, setSelectedVehicleId] = useState(safeVehicles[0]?.id || '');
  const [logDate, setLogDate] = useState('2026-08-21');
  const [driverName, setDriverName] = useState(safeVehicles[0]?.assignedDriver || '');
  const [fuelType, setFuelType] = useState<FuelType>(safeVehicles[0]?.fuelType || 'Bio Solar');
  const [volumeLiters, setVolumeLiters] = useState<number>(100);
  const [pricePerLiter, setPricePerLiter] = useState<number>(6800);
  const [currentOdo, setCurrentOdo] = useState<number>(safeVehicles[0]?.currentOdometer || 0);
  const [lastOdo, setLastOdo] = useState<number>((safeVehicles[0]?.currentOdometer || 0) - 300);
  const [fuelStation, setFuelStation] = useState('SPBU Pertamina Rest Area');
  const [isFullTank, setIsFullTank] = useState(true);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [receiptProofUrl, setReceiptProofUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Form State (Edit)
  const [editFormData, setEditFormData] = useState({
    id: '',
    vehicleId: '',
    driverName: '',
    date: '',
    fuelType: 'Bio Solar' as FuelType,
    volumeLiters: 0,
    pricePerLiter: 0,
    odometer: 0,
    lastOdometer: 0,
    fuelStation: '',
    isFullTank: true,
    receiptNumber: '',
    receiptProofUrl: '',
    notes: ''
  });

  // Handle vehicle change in form to prefill data
  const handleVehicleSelectInForm = (vId: string) => {
    setSelectedVehicleId(vId);
    const v = vehicles.find(veh => veh.id === vId);
    if (v) {
      setDriverName(v.assignedDriver);
      setFuelType(v.fuelType);
      setCurrentOdo(v.currentOdometer);
      // Find latest log for this vehicle
      const latestLog = fuelLogs.find(f => f.vehicleId === v.id || f.nopol === v.nopol);
      if (latestLog) {
        setLastOdo(latestLog.odometer);
      } else {
        setLastOdo(Math.max(0, v.currentOdometer - 300));
      }
      if (v.fuelType === 'Bio Solar') setPricePerLiter(6800);
      else if (v.fuelType === 'Solar Dexlite') setPricePerLiter(14500);
      else if (v.fuelType === 'Pertalite') setPricePerLiter(10000);
      else setPricePerLiter(13500);
    }
  };

  // Calculations for Add Form Preview
  const distance = Math.max(0, currentOdo - lastOdo);
  const totalCost = volumeLiters * pricePerLiter;
  const kmPerLiter = volumeLiters > 0 ? parseFloat((distance / volumeLiters).toFixed(2)) : 0;

  // Calculations for Edit Form Preview
  const editDistance = Math.max(0, editFormData.odometer - editFormData.lastOdometer);
  const editTotalCost = editFormData.volumeLiters * editFormData.pricePerLiter;
  const editKmPerLiter = editFormData.volumeLiters > 0 ? parseFloat((editDistance / editFormData.volumeLiters).toFixed(2)) : 0;

  // Filtered Logs
  const filteredLogs = safeFuelLogs.filter((log) => {
    if (!log) return false;
    const compName = getFuelCompany(log);
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (log.nopol || '').toLowerCase().includes(q) ||
      (log.driverName || '').toLowerCase().includes(q) ||
      ((log.fuelStation || '').toLowerCase().includes(q)) ||
      compName.toLowerCase().includes(q);
    const matchesVehicle = selectedVehicleFilter === 'all' || log.vehicleId === selectedVehicleFilter || log.nopol === selectedVehicleFilter;
    const matchesCompany = selectedCompany === 'all' || compName === selectedCompany;
    
    // Date Range filter
    const matchesStartDate = !startDate || log.date >= startDate;
    const matchesEndDate = !endDate || log.date <= endDate;

    return matchesSearch && matchesVehicle && matchesCompany && matchesStartDate && matchesEndDate;
  });

  // Paginated Logs for Next / Prev Pages
  const totalFilteredLogs = filteredLogs.length;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const dateRangeText = startDate && endDate
    ? `${startDate} s/d ${endDate}`
    : startDate
    ? `Mulai ${startDate}`
    : endDate
    ? `Sampai ${endDate}`
    : 'Semua Periode';

  // Overall Statistics
  const totalLiters = filteredLogs.reduce((sum, item) => sum + item.volumeLiters, 0);
  const totalExpenditure = filteredLogs.reduce((sum, item) => sum + item.totalCost, 0);
  const totalDistance = filteredLogs.reduce((sum, item) => sum + item.distanceTravelled, 0);
  const avgEfficiency = filteredLogs.length > 0
    ? (filteredLogs.reduce((sum, item) => sum + item.calculatedKmPerLiter, 0) / filteredLogs.length).toFixed(2)
    : '0';
  const costPerKm = totalDistance > 0 ? (totalExpenditure / totalDistance) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = vehicles.find(veh => veh.id === selectedVehicleId);
    const nopol = v ? v.nopol : 'B 0000 XX';
    const matchedDrv = safeDrivers.find(d => d.name.toLowerCase() === driverName.toLowerCase());

    const newLog: FuelLog = {
      id: 'FL-' + Date.now().toString().slice(-4),
      vehicleId: selectedVehicleId,
      nopol,
      driverId: matchedDrv?.id,
      driverName,
      driverNip: matchedDrv?.nip,
      date: logDate,
      fuelType,
      volumeLiters: Number(volumeLiters) || 0,
      pricePerLiter: Number(pricePerLiter) || 0,
      totalCost: Number(totalCost) || 0,
      odometer: Number(currentOdo) || 0,
      lastOdometer: Number(lastOdo) || 0,
      distanceTravelled: Number(distance) || 0,
      calculatedKmPerLiter: Number(kmPerLiter) || 0,
      fuelStation,
      isFullTank,
      receiptNumber,
      receiptProofUrl: receiptProofUrl || undefined,
      notes
    };

    onAddFuelLog(newLog);
    setReceiptProofUrl('');
    setIsModalOpen(false);
  };

  const handleOpenEdit = (log: FuelLog) => {
    setSelectedLog(log);
    setEditFormData({
      id: log.id,
      vehicleId: log.vehicleId,
      driverName: log.driverName,
      date: log.date,
      fuelType: log.fuelType,
      volumeLiters: log.volumeLiters,
      pricePerLiter: log.pricePerLiter,
      odometer: log.odometer,
      lastOdometer: log.lastOdometer,
      fuelStation: log.fuelStation,
      isFullTank: log.isFullTank,
      receiptNumber: log.receiptNumber || '',
      receiptProofUrl: log.receiptProofUrl || '',
      notes: log.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLog || !onUpdateFuelLog) return;

    const v = vehicles.find(veh => veh.id === editFormData.vehicleId);
    const nopol = v ? v.nopol : selectedLog.nopol;

    const updated: FuelLog = {
      ...selectedLog,
      vehicleId: editFormData.vehicleId,
      nopol,
      driverName: editFormData.driverName,
      date: editFormData.date,
      fuelType: editFormData.fuelType,
      volumeLiters: Number(editFormData.volumeLiters) || 0,
      pricePerLiter: Number(editFormData.pricePerLiter) || 0,
      totalCost: editTotalCost,
      odometer: Number(editFormData.odometer) || 0,
      lastOdometer: Number(editFormData.lastOdometer) || 0,
      distanceTravelled: editDistance,
      calculatedKmPerLiter: editKmPerLiter,
      fuelStation: editFormData.fuelStation,
      isFullTank: editFormData.isFullTank,
      receiptNumber: editFormData.receiptNumber,
      receiptProofUrl: editFormData.receiptProofUrl || undefined,
      notes: editFormData.notes
    };

    onUpdateFuelLog(updated);
    setIsEditModalOpen(false);
    setSelectedLog(null);
  };

  return (
    <div className="space-y-6">
      {/* Role Restricted Banner */}
      {!perms.canAddFuelLog && (
        <RoleRestrictedBanner
          userRole={userRole}
          moduleName="Pencatatan Konsumsi BBM Solar"
          allowedActionsText="Hanya dapat melihat data efisiensi BBM"
          restrictedActionsText="Pengisian log solar dan pengeditan riwayat BBM hanya dapat dikelola oleh Admin 2 & Owner."
          onOpenRoleModal={onOpenRoleMatrix}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Fuel className="w-5 h-5 text-blue-600" />
            Monitoring &amp; Log Konsumsi BBM Solar
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Pencatatan pengisian bahan bakar, analisa rasio efisiensi kilometer per liter (KM/L)
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
              <span>Log Pengisian BBM</span>
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
              <span>Laporan &amp; Analitik BBM</span>
            </button>
          </div>

          {perms.canAddFuelLog ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-xs active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Pengisian BBM</span>
            </button>
          ) : (
            <button
              disabled
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 text-slate-400 font-medium text-xs rounded-lg cursor-not-allowed border border-slate-200"
              title="Akses dibatasi sesuai peran pengguna"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Catat BBM (Terkunci)</span>
            </button>
          )}
        </div>
      </div>

      {moduleView === 'analytics' ? (
        <ModuleAnalyticsPanel
          moduleType="fuel"
          title="Laporan & Analitik Konsumsi BBM Solar"
          subtitle="Analisis pengeluaran solar, volume liter, jarak tempuh (KM) & rasio efisiensi mesin (KM/Liter) per armada"
          fuelLogs={safeFuelLogs}
          vehicles={safeVehicles}
          drivers={safeDrivers}
        />
      ) : (
      <>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Konsumsi</p>
          <h3 className="text-xl font-bold text-slate-800 mt-1">{formatNumber(totalLiters)} <span className="text-xs font-normal text-slate-400">Liter</span></h3>
          <p className="text-[10px] text-slate-400 mt-1">{filteredLogs.length} kali pengisian</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Biaya Solar</p>
          <h3 className="text-xl font-bold text-slate-800 mt-1 font-mono">{formatRupiah(totalExpenditure)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Estimasi belanja BBM</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Rata-rata Efisiensi</p>
          <h3 className="text-xl font-bold text-blue-600 mt-1">{avgEfficiency} <span className="text-xs font-normal text-slate-400">KM / Liter</span></h3>
          <p className="text-[10px] text-slate-400 mt-1">Total Jarak: {formatNumber(totalDistance)} KM</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Biaya per KM</p>
          <h3 className="text-xl font-bold text-slate-800 mt-1 font-mono">{formatRupiah(costPerKm)} <span className="text-xs font-normal text-slate-400">/ KM</span></h3>
          <p className="text-[10px] text-slate-400 mt-1">Rata-rata ongkos operasional</p>
        </div>
      </div>

      {/* Date Filter & Export Bar */}
      <ModuleFilterExportBar
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onResetDateFilter={() => { setStartDate(''); setEndDate(''); }}
        onExportExcel={() => exportFuelToExcel(filteredLogs, dateRangeText)}
        onExportPDF={() => exportFuelToPDF(filteredLogs, dateRangeText)}
        totalFilteredCount={filteredLogs.length}
        totalAllCount={fuelLogs.length}
        moduleLabel="Catatan BBM"
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
            placeholder="Cari Nopol, Supir, SPBU..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white"
          />
        </div>

        <select
          value={selectedVehicleFilter}
          onChange={(e) => {
            setSelectedVehicleFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 font-medium"
        >
          <option value="all">Semua Unit Kendaraan</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.nopol} ({v.brand} - {v.assignedDriver})</option>
          ))}
        </select>
      </ModuleFilterExportBar>

      {/* Logs Table with Full CRUD Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100 font-bold">
              <tr>
                <th className="py-3 px-5">Tanggal &amp; SPBU</th>
                <th className="py-3 px-5">Armada &amp; Supir</th>
                <th className="py-3 px-5">BBM &amp; Volume</th>
                <th className="py-3 px-5">Odometer &amp; Jarak</th>
                <th className="py-3 px-5">Efisiensi (Km/L)</th>
                <th className="py-3 px-5 text-center">Nota Struk</th>
                <th className="py-3 px-5 text-right">Total Biaya (Rp)</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.map((log) => {
                const vehicle = vehicles.find(v => v.id === log.vehicleId || v.nopol === log.nopol);
                const target = vehicle ? vehicle.targetKmPerLiter : 5;
                const effStatus = getFuelEfficiencyStatus(log.calculatedKmPerLiter, target);

                return (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-5">
                      <p className="font-bold text-slate-800">{formatDateIndo(log.date)}</p>
                      <p className="text-[11px] text-slate-400">{log.fuelStation}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="font-mono font-bold text-slate-800">{log.nopol}</p>
                      <p className="text-[11px] text-slate-600 font-semibold">{log.driverName}</p>
                      {(() => {
                        const matchedDrv = safeDrivers.find(d => d.name.toLowerCase() === (log.driverName || '').toLowerCase());
                        const nip = log.driverNip || matchedDrv?.nip;
                        return nip ? (
                          <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded inline-block mt-0.5">
                            {nip}
                          </span>
                        ) : null;
                      })()}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-medium text-slate-700">{log.fuelType}</span>
                      <p className="font-mono font-bold text-slate-800">{log.volumeLiters} L</p>
                    </td>
                    <td className="py-3.5 px-5 font-mono">
                      <span className="font-bold text-slate-800">{formatNumber(log.odometer)} KM</span>
                      <p className="text-[10px] text-slate-400">+{log.distanceTravelled} KM</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800">{log.calculatedKmPerLiter}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 ${effStatus.colorClass}`}>
                          {effStatus.text}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      {log.receiptProofUrl ? (
                        <button
                          type="button"
                          onClick={() => setInspectedReceiptLog(log)}
                          className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1 transition"
                          title="Lihat Foto Struk / Nota SPBU"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Lihat Nota</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {log.receiptNumber || '-'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-800">
                      {formatRupiah(log.totalCost)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {perms.canEditFuelLog && onUpdateFuelLog && (
                          <button
                            onClick={() => handleOpenEdit(log)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition"
                            title="Edit Catatan BBM"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {perms.canDeleteFuelLog && (
                          <button
                            onClick={() => {
                              confirmDelete(`Hapus catatan BBM unit ${log.nopol} tanggal ${log.date}?`).then((ok) => {
                                if (ok) onDeleteFuelLog(log.id);
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition"
                            title="Hapus Log BBM"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada data pengisian BBM
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination with Next / Prev */}
        <TablePagination
          currentPage={currentPage}
          totalItems={totalFilteredLogs}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 20, 50]}
          itemLabel="catatan BBM"
        />
      </div>
      </>
      )}

      {/* Modal Add Fuel Log */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Fuel className="w-4 h-4 text-blue-600" />
                Catat Pengisian BBM &amp; Solar
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Pilih Unit Kendaraan *</label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => handleVehicleSelectInForm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.nopol} - {v.brand} ({v.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Karyawan Driver Penerima BBM *</label>
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
                  <label className="text-slate-700 font-semibold block mb-1">Tanggal Pengisian</label>
                  <input
                    type="date"
                    required
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jenis Bahan Bakar</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as FuelType)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="Bio Solar">Bio Solar (Subsidi)</option>
                    <option value="Solar Dexlite">Solar Dexlite</option>
                    <option value="Pertamina Dex">Pertamina Dex</option>
                    <option value="Pertalite">Pertalite</option>
                    <option value="Pertamax">Pertamax</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Volume Liter *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={volumeLiters}
                    onChange={(e) => setVolumeLiters(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Harga per Liter (Rp)</label>
                  <input
                    type="number"
                    required
                    value={pricePerLiter}
                    onChange={(e) => setPricePerLiter(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Odometer Sebelumnya (KM)</label>
                  <input
                    type="number"
                    value={lastOdo}
                    onChange={(e) => setLastOdo(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Odometer Saat Isi BBM (KM) *</label>
                  <input
                    type="number"
                    required
                    value={currentOdo}
                    onChange={(e) => setCurrentOdo(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Lokasi SPBU / Rest Area</label>
                  <input
                    type="text"
                    value={fuelStation}
                    onChange={(e) => setFuelStation(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">No. Struk SPBU / Nota</label>
                  <input
                    type="text"
                    placeholder="Contoh: SPBU-88492"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Automatic Calculation Preview */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Jarak Ditempuh Sejak Pengisian Lalu:</span>
                  <span className="font-mono font-bold text-slate-800">{distance} KM</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Rasio Efisiensi Mesin:</span>
                  <span className="font-mono font-bold text-blue-700 text-sm">{kmPerLiter} KM/L</span>
                </div>
                <div className="flex justify-between items-center text-slate-700 pt-1 border-t border-blue-200/60">
                  <span className="font-semibold">Total Biaya Solar:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{formatRupiah(totalCost)}</span>
                </div>
              </div>

              <ReceiptUploadField
                label="Upload Struk / Nota SPBU Solar"
                value={receiptProofUrl}
                onChange={setReceiptProofUrl}
              />

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan kondisi muatan, rute macet, dll"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-xs"
                >
                  Simpan Catatan BBM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Fuel Log (Update CRUD) */}
      {isEditModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                Edit Catatan Pengisian BBM
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Unit Kendaraan *</label>
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
                  <label className="text-slate-700 font-semibold block mb-1">Karyawan Driver Penerima BBM</label>
                  <select
                    value={editFormData.driverName}
                    onChange={(e) => setEditFormData({ ...editFormData, driverName: e.target.value })}
                    className="w-full bg-emerald-50/40 border border-emerald-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-hidden focus:border-emerald-500"
                  >
                    {safeDrivers.map((d) => (
                      <option key={d.id} value={d.name}>
                        [{d.nip || d.id}] {d.name} ({d.assignedVehicle || 'Pool'})
                      </option>
                    ))}
                    {editFormData.driverName && !safeDrivers.some(d => d.name === editFormData.driverName) && (
                      <option value={editFormData.driverName}>{editFormData.driverName}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jenis Bahan Bakar</label>
                  <select
                    value={editFormData.fuelType}
                    onChange={(e) => setEditFormData({ ...editFormData, fuelType: e.target.value as FuelType })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="Bio Solar">Bio Solar (Subsidi)</option>
                    <option value="Solar Dexlite">Solar Dexlite</option>
                    <option value="Pertamina Dex">Pertamina Dex</option>
                    <option value="Pertalite">Pertalite</option>
                    <option value="Pertamax">Pertamax</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Volume Liter *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editFormData.volumeLiters}
                    onChange={(e) => setEditFormData({ ...editFormData, volumeLiters: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Harga per Liter (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editFormData.pricePerLiter}
                    onChange={(e) => setEditFormData({ ...editFormData, pricePerLiter: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Odometer Sebelumnya (KM)</label>
                  <input
                    type="number"
                    value={editFormData.lastOdometer}
                    onChange={(e) => setEditFormData({ ...editFormData, lastOdometer: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Odometer Saat Isi BBM (KM) *</label>
                  <input
                    type="number"
                    required
                    value={editFormData.odometer}
                    onChange={(e) => setEditFormData({ ...editFormData, odometer: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Lokasi SPBU</label>
                  <input
                    type="text"
                    value={editFormData.fuelStation}
                    onChange={(e) => setEditFormData({ ...editFormData, fuelStation: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">No. Struk</label>
                  <input
                    type="text"
                    value={editFormData.receiptNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, receiptNumber: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Automatic Calculation Preview */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Jarak Ditempuh Sejak Pengisian Lalu:</span>
                  <span className="font-mono font-bold text-slate-800">{editDistance} KM</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Rasio Efisiensi Mesin:</span>
                  <span className="font-mono font-bold text-blue-700 text-sm">{editKmPerLiter} KM/L</span>
                </div>
                <div className="flex justify-between items-center text-slate-700 pt-1 border-t border-blue-200/60">
                  <span className="font-semibold">Total Biaya Solar:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{formatRupiah(editTotalCost)}</span>
                </div>
              </div>

              <ReceiptUploadField
                label="Upload / Ganti Struk / Nota SPBU Solar"
                value={editFormData.receiptProofUrl}
                onChange={(url) => setEditFormData({ ...editFormData, receiptProofUrl: url })}
              />

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catatan</label>
                <textarea
                  rows={2}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

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
                  Perbarui Catatan BBM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Struk / Nota BBM */}
      {inspectedReceiptLog && (() => {
        const resolvedReceiptUrl = resolveDisplayReceiptUrl(inspectedReceiptLog.receiptProofUrl, {
          title: 'STRUK / NOTA SPBU BBM',
          subtitle: inspectedReceiptLog.fuelStation || 'SPBU Pertamina',
          receiptNumber: inspectedReceiptLog.receiptNumber || inspectedReceiptLog.id,
          date: formatDateIndo(inspectedReceiptLog.date),
          amountText: formatRupiah(inspectedReceiptLog.totalCost),
          nopol: inspectedReceiptLog.nopol,
          driverName: inspectedReceiptLog.driverName,
          volumeText: `${inspectedReceiptLog.fuelType} • ${inspectedReceiptLog.volumeLiters} Liter`
        });
        const approxKb = getApproxBase64SizeKB(resolvedReceiptUrl);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Struk / Nota SPBU: {inspectedReceiptLog.nopol}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {formatDateIndo(inspectedReceiptLog.date)} • {inspectedReceiptLog.fuelStation} • {formatRupiah(inspectedReceiptLog.totalCost)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectedReceiptLog(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 bg-slate-100 flex items-center justify-center min-h-[300px] max-h-[480px] overflow-auto">
                {resolvedReceiptUrl.startsWith('data:application/pdf') ? (
                  <iframe
                    src={resolvedReceiptUrl}
                    title="Nota SPBU PDF"
                    className="w-full h-[420px] rounded-lg border border-slate-200 bg-white"
                  />
                ) : resolvedReceiptUrl ? (
                  <img
                    src={resolvedReceiptUrl}
                    alt="Nota SPBU"
                    onError={(e) => {
                      const fallback = resolveDisplayReceiptUrl('[COMPRESSED_ATTACHMENT_REF:receiptProofUrl]', {
                        title: 'STRUK / NOTA SPBU BBM',
                        subtitle: inspectedReceiptLog.fuelStation || 'SPBU Pertamina',
                        receiptNumber: inspectedReceiptLog.receiptNumber || inspectedReceiptLog.id,
                        date: formatDateIndo(inspectedReceiptLog.date),
                        amountText: formatRupiah(inspectedReceiptLog.totalCost),
                        nopol: inspectedReceiptLog.nopol,
                        driverName: inspectedReceiptLog.driverName,
                        volumeText: `${inspectedReceiptLog.fuelType} • ${inspectedReceiptLog.volumeLiters} Liter`
                      });
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                    className="max-w-full max-h-[440px] object-contain rounded-lg shadow-sm bg-white"
                  />
                ) : (
                  <div className="text-center text-slate-400 text-xs">
                    <FileText className="w-8 h-8 mx-auto mb-2" />
                    Belum ada nota terlampir.
                  </div>
                )}
              </div>
              <div className="px-5 py-3 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono">
                    No. Struk: {inspectedReceiptLog.receiptNumber || '-'}
                  </span>
                  {approxKb > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                      DB Sync ({approxKb} KB)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {perms.canEditFuelLog && onUpdateFuelLog && (
                    <label className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1.5 transition">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload / Ganti Foto Nota</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const compressed = await compressReceiptFile(file);
                            const updatedLog = { ...inspectedReceiptLog, receiptProofUrl: compressed };
                            onUpdateFuelLog(updatedLog);
                            setInspectedReceiptLog(updatedLog);
                          } catch {
                            // ignore
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                  <button
                    onClick={() => setInspectedReceiptLog(null)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
