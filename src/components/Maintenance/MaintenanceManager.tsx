import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Printer,
  Trash2,
  Edit2,
  X,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MaintenanceRecord, Vehicle, ServiceType, SparepartItem, UserRole } from '../../types';
import {
  formatRupiah,
  formatNumber,
  formatDateIndo
} from '../../utils/formatters';
import { exportMaintenanceToExcel, exportMaintenanceToPDF } from '../../utils/exportUtils';
import { ModuleFilterExportBar } from '../Common/ModuleFilterExportBar';
import { getRolePermissions } from '../../utils/permissions';
import { RoleRestrictedBanner } from '../Common/RoleRestrictedBanner';

interface MaintenanceManagerProps {
  maintenance: MaintenanceRecord[];
  vehicles: Vehicle[];
  userRole?: UserRole;
  onOpenRoleMatrix?: () => void;
  onAddMaintenance: (m: MaintenanceRecord) => void;
  onUpdateMaintenance?: (m: MaintenanceRecord) => void;
  onDeleteMaintenance: (id: string) => void;
}

export const MaintenanceManager: React.FC<MaintenanceManagerProps> = ({
  maintenance = [],
  vehicles = [],
  userRole = 'owner',
  onOpenRoleMatrix,
  onAddMaintenance,
  onUpdateMaintenance,
  onDeleteMaintenance
}) => {
  const safeMaintenance = Array.isArray(maintenance) ? maintenance : [];
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const perms = getRolePermissions(userRole);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSpk, setSelectedSpk] = useState<MaintenanceRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);

  // Form state (Add)
  const [selectedVehicleId, setSelectedVehicleId] = useState(safeVehicles[0]?.id || '');
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

  const [spareparts, setSpareparts] = useState<SparepartItem[]>([
    { id: 'SP-1', name: 'Oli Mesin Meditran SX 15W-40', qty: 16, unit: 'Liter', unitPrice: 55000, totalPrice: 880000 },
    { id: 'SP-2', name: 'Filter Oli Genuine', qty: 1, unit: 'Pcs', unitPrice: 175000, totalPrice: 175000 }
  ]);

  // Form state (Edit)
  const [editFormData, setEditFormData] = useState({
    id: '',
    vehicleId: '',
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
    spareparts: [] as SparepartItem[]
  });

  const handleVehicleSelect = (vId: string) => {
    setSelectedVehicleId(vId);
    const v = vehicles.find(veh => veh.id === vId);
    if (v) {
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
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (m.nopol || '').toLowerCase().includes(q) ||
      (m.serviceType || '').toLowerCase().includes(q) ||
      (m.workshopName || '').toLowerCase().includes(q) ||
      ((m.workOrderNumber || '').toLowerCase().includes(q));
    const matchesVehicle = selectedVehicle === 'all' || m.vehicleId === selectedVehicle || m.nopol === selectedVehicle;

    // Date range filter
    const matchesStartDate = !startDate || m.serviceDate >= startDate;
    const matchesEndDate = !endDate || m.serviceDate <= endDate;

    return matchesSearch && matchesVehicle && matchesStartDate && matchesEndDate;
  });

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

    const newRecord: MaintenanceRecord = {
      id: 'MN-' + Date.now().toString().slice(-4),
      vehicleId: selectedVehicleId,
      nopol,
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
      notes
    };

    onAddMaintenance(newRecord);
    setIsModalOpen(false);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
  };

  const handleOpenEdit = (m: MaintenanceRecord) => {
    setSelectedRecord(m);
    setEditFormData({
      id: m.id,
      vehicleId: m.vehicleId,
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
      spareparts: m.spareparts ? [...m.spareparts] : []
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !onUpdateMaintenance) return;

    const v = vehicles.find(veh => veh.id === editFormData.vehicleId);
    const nopol = v ? v.nopol : selectedRecord.nopol;

    const updated: MaintenanceRecord = {
      ...selectedRecord,
      vehicleId: editFormData.vehicleId,
      nopol,
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
      notes: editFormData.notes
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
      >
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari SPK, Nopol, jenis servis, bengkel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white"
          />
        </div>

        <select
          value={selectedVehicle}
          onChange={(e) => setSelectedVehicle(e.target.value)}
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
              {filteredMaintenance.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-5">
                    <p className="font-bold text-slate-800">{formatDateIndo(m.serviceDate)}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{m.workOrderNumber}</p>
                  </td>
                  <td className="py-3.5 px-5">
                    <p className="font-mono font-bold text-slate-800">{m.nopol}</p>
                    <p className="text-[11px] text-slate-500">{m.workshopName}</p>
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
                    <button
                      onClick={() => setSelectedSpk(m)}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition"
                      title="Lihat Cetak SPK"
                    >
                      <Printer className="w-3 h-3 text-blue-600" />
                      <span>SPK</span>
                    </button>
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
                          onClick={() => {
                            if (confirm(`Hapus riwayat servis ${m.workOrderNumber} (${m.nopol})?`)) onDeleteMaintenance(m.id);
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
      </div>

      {/* SPK View / Print Modal */}
      {selectedSpk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden p-6 animate-in fade-in zoom-in-95 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-800">SURAT PERINTAH KERJA (SPK)</h3>
                <p className="text-[10px] text-slate-400 font-mono">{selectedSpk.workOrderNumber}</p>
              </div>
              <button onClick={() => setSelectedSpk(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
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

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 inline-flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar SPK</span>
              </button>
            </div>
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
                    onChange={(e) => setServiceType(e.target.value as ServiceType)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500 font-medium"
                  >
                    <option value="Ganti Oli Mesin & Filter Oli">Ganti Oli Mesin &amp; Filter Oli</option>
                    <option value="Servis Rem & Kampas Rem">Servis Rem &amp; Kampas Rem</option>
                    <option value="Ganti Ban Luar / Rotasi Ban">Ganti Ban Luar / Rotasi Ban</option>
                    <option value="Tune-up Mesin & Kalibrasi Injektor">Tune-up Mesin &amp; Kalibrasi Injektor</option>
                    <option value="Perbaikan Sistem Kaki-kaki & Suspensi">Perbaikan Kaki-kaki &amp; Suspensi</option>
                    <option value="Overhaul Mesin (Turun Mesin)">Overhaul Mesin (Turun Mesin)</option>
                    <option value="Perbaikan Body & Las">Perbaikan Body &amp; Las</option>
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
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-700 font-semibold">Rincian Sparepart yang Diganti</label>
                  <button
                    type="button"
                    onClick={addSparepartRow}
                    className="text-blue-600 font-medium hover:underline text-xs"
                  >
                    + Tambah Sparepart
                  </button>
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
                    <option value="Ganti Oli Mesin & Filter Oli">Ganti Oli Mesin &amp; Filter Oli</option>
                    <option value="Servis Rem & Kampas Rem">Servis Rem &amp; Kampas Rem</option>
                    <option value="Ganti Ban Luar / Rotasi Ban">Ganti Ban Luar / Rotasi Ban</option>
                    <option value="Tune-up Mesin & Kalibrasi Injektor">Tune-up Mesin &amp; Kalibrasi Injektor</option>
                    <option value="Perbaikan Sistem Kaki-kaki & Suspensi">Perbaikan Kaki-kaki &amp; Suspensi</option>
                    <option value="Overhaul Mesin (Turun Mesin)">Overhaul Mesin (Turun Mesin)</option>
                    <option value="Perbaikan Body & Las">Perbaikan Body &amp; Las</option>
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
    </div>
  );
};
