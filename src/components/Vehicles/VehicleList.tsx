import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Gauge,
  User,
  X,
  Lock
} from 'lucide-react';
import { Vehicle, VehicleType, FuelType, VehicleStatus, UserRole } from '../../types';
import {
  formatNumber,
  getTaxDueBadgeInfo,
  getVehicleStatusBadge
} from '../../utils/formatters';
import { exportVehiclesToExcel, exportVehiclesToPDF } from '../../utils/exportUtils';
import { ModuleFilterExportBar } from '../Common/ModuleFilterExportBar';
import { getRolePermissions } from '../../utils/permissions';
import { RoleRestrictedBanner } from '../Common/RoleRestrictedBanner';

interface VehicleListProps {
  vehicles: Vehicle[];
  userRole?: UserRole;
  onOpenRoleMatrix?: () => void;
  onAddVehicle: (v: Vehicle) => void;
  onUpdateVehicle: (v: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onSelectVehicleForDetail: (v: Vehicle) => void;
}

export const VehicleList: React.FC<VehicleListProps> = ({
  vehicles = [],
  userRole = 'owner',
  onOpenRoleMatrix,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onSelectVehicleForDetail
}) => {
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const perms = getRolePermissions(userRole);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    nopol: '',
    brand: '',
    model: '',
    type: 'Dump Truck',
    year: 2023,
    fuelType: 'Bio Solar',
    chassisNumber: '',
    engineNumber: '',
    currentOdometer: 0,
    status: 'active',
    assignedDriver: '',
    driverPhone: '',
    stnk1YearDate: '',
    stnk5YearDate: '',
    kirDate: '',
    insuranceDate: '',
    targetKmPerLiter: 5.0,
    capacityTon: 10,
    notes: ''
  });

  const filteredVehicles = safeVehicles.filter((v) => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (v.nopol || '').toLowerCase().includes(q) ||
      (v.brand || '').toLowerCase().includes(q) ||
      (v.model || '').toLowerCase().includes(q) ||
      (v.assignedDriver || '').toLowerCase().includes(q);
    const matchesStatus = filterStatus === 'all' || v.status === filterStatus;
    const matchesType = filterType === 'all' || v.type === filterType;

    // Date range filter against stnk or kir due dates if set
    if (startDate && ((v.stnk1YearDate && v.stnk1YearDate < startDate) && (v.kirDate && v.kirDate < startDate))) {
      return false;
    }
    if (endDate && ((v.stnk1YearDate && v.stnk1YearDate > endDate) && (v.kirDate && v.kirDate > endDate))) {
      return false;
    }

    return matchesSearch && matchesStatus && matchesType;
  });

  const dateRangeText = startDate && endDate
    ? `${startDate} s/d ${endDate}`
    : startDate
    ? `Mulai ${startDate}`
    : endDate
    ? `Sampai ${endDate}`
    : 'Semua Periode';

  const handleExportExcel = () => {
    exportVehiclesToExcel(filteredVehicles, dateRangeText);
  };

  const handleExportPDF = () => {
    exportVehiclesToPDF(filteredVehicles, dateRangeText);
  };

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setFormData({
      nopol: '',
      brand: '',
      model: '',
      type: 'Truk Box',
      year: 2023,
      fuelType: 'Solar Dexlite',
      chassisNumber: '',
      engineNumber: '',
      currentOdometer: 1000,
      status: 'active',
      assignedDriver: '',
      driverPhone: '',
      stnk1YearDate: '2027-08-20',
      stnk5YearDate: '2028-08-20',
      kirDate: '2027-02-20',
      insuranceDate: '',
      targetKmPerLiter: 6.5,
      capacityTon: 5,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({ ...vehicle });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nopol || !formData.brand) return;

    if (editingVehicle) {
      onUpdateVehicle({
        ...editingVehicle,
        ...formData
      } as Vehicle);
    } else {
      const newVehicle: Vehicle = {
        id: 'VH-' + Date.now().toString().slice(-4),
        nopol: (formData.nopol || '').toUpperCase(),
        brand: formData.brand || '',
        model: formData.model || '',
        type: formData.type || 'Truk Box',
        year: formData.year || 2023,
        fuelType: formData.fuelType || 'Bio Solar',
        chassisNumber: formData.chassisNumber || '',
        engineNumber: formData.engineNumber || '',
        currentOdometer: Number(formData.currentOdometer) || 0,
        status: formData.status || 'active',
        assignedDriver: formData.assignedDriver || '',
        driverPhone: formData.driverPhone || '',
        stnk1YearDate: formData.stnk1YearDate || '',
        stnk5YearDate: formData.stnk5YearDate || '',
        kirDate: formData.kirDate || '',
        insuranceDate: formData.insuranceDate || '',
        targetKmPerLiter: Number(formData.targetKmPerLiter) || 5.0,
        capacityTon: Number(formData.capacityTon) || 5,
        notes: formData.notes || ''
      };
      onAddVehicle(newVehicle);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, nopol: string) => {
    if (confirm(`Yakin ingin menghapus unit kendaraan ${nopol}?`)) {
      onDeleteVehicle(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Restricted Banner if not allowed to add */}
      {!perms.canAddVehicle && (
        <RoleRestrictedBanner
          userRole={userRole}
          moduleName="Kelola Kendaraan"
          allowedActionsText="Hanya dapat melihat data, status, dan riwayat armada"
          restrictedActionsText="Penambahan dan penghapusan unit armada hanya dapat dilakukan oleh Owner & Admin Operasional."
          onOpenRoleModal={onOpenRoleMatrix}
        />
      )}

      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Kelola Kendaraan
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Total {vehicles.length} unit armada terdaftar dalam database operasional
          </p>
        </div>
        {perms.canAddVehicle ? (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-xs active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kendaraan</span>
          </button>
        ) : (
          <button
            disabled
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 text-slate-400 font-medium text-xs rounded-lg cursor-not-allowed border border-slate-200"
            title="Hanya Admin dan Owner yang dapat menambah unit baru"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Tambah Unit (Terkunci)</span>
          </button>
        )}
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
        totalFilteredCount={filteredVehicles.length}
        totalAllCount={vehicles.length}
        moduleLabel="Unit Armada"
      >
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Nopol, merk, supir..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 font-medium"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif Operasi</option>
          <option value="maintenance">Dalam Servis</option>
          <option value="standby">Standby / Pool</option>
          <option value="broken">Mogok / Rusak</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 font-medium"
        >
          <option value="all">Semua Jenis Armada</option>
          <option value="Dump Truck">Dump Truck</option>
          <option value="Truk Box">Truk Box</option>
          <option value="Truk Tronton / Wingbox">Truk Tronton / Wingbox</option>
          <option value="Truk Engkel (CDE/CDD)">Truk Engkel</option>
          <option value="Pickup Bak / Blind Van">Pickup Bak / Blind Van</option>
          <option value="Minibus / HiAce">Minibus / HiAce</option>
          <option value="Mobil Operasional Kantor">Mobil Operasional</option>
        </select>
      </ModuleFilterExportBar>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVehicles.map((vehicle) => {
          const stnk1Badge = getTaxDueBadgeInfo(vehicle.stnk1YearDate);
          const kirBadge = getTaxDueBadgeInfo(vehicle.kirDate);

          return (
            <div
              key={vehicle.id}
              className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 flex flex-col justify-between transition shadow-xs group"
            >
              <div>
                {/* Card Top */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="font-mono font-bold text-lg text-slate-800 tracking-tight">
                      {vehicle.nopol}
                    </span>
                    <p className="text-xs font-medium text-slate-600">
                      {vehicle.brand} {vehicle.model}
                    </p>
                    <span className="text-[11px] text-slate-400">{vehicle.type} ({vehicle.year})</span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    vehicle.status === 'active'
                      ? 'bg-green-50 text-green-700 border border-green-200/60'
                      : vehicle.status === 'maintenance'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                      : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                  }`}>
                    {vehicle.status === 'active' ? 'AKTIF' : vehicle.status === 'maintenance' ? 'SERVICE' : 'STANDBY'}
                  </span>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-blue-600" /> Odometer
                    </span>
                    <p className="font-mono font-bold text-slate-800 mt-0.5">{formatNumber(vehicle.currentOdometer)} KM</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-500" /> Pengemudi
                    </span>
                    <p className="font-medium text-slate-700 truncate mt-0.5">{vehicle.assignedDriver || '-'}</p>
                  </div>
                </div>

                {/* Tax Badges Preview */}
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Pajak STNK 1 Thn:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      stnk1Badge.status === 'urgent' || stnk1Badge.status === 'overdue'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {stnk1Badge.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Uji KIR Dishub:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      kirBadge.status === 'urgent' || kirBadge.status === 'overdue'
                        ? 'bg-red-50 text-red-700 border border-red-200/60'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {kirBadge.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectVehicleForDetail(vehicle)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Detail &amp; Histori</span>
                </button>

                {perms.canEditVehicle && (
                  <button
                    onClick={() => handleOpenEdit(vehicle)}
                    className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition"
                    title="Edit Kendaraan"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {perms.canDeleteVehicle && (
                  <button
                    onClick={() => handleDelete(vehicle.id, vehicle.nopol)}
                    className="p-2 bg-white border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                    title="Hapus Kendaraan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Vehicle */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                {editingVehicle ? `Edit Kendaraan: ${editingVehicle.nopol}` : 'Tambah Unit Kendaraan Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nomor Polisi (Nopol) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: B 9482 TDE"
                    value={formData.nopol}
                    onChange={(e) => setFormData({ ...formData, nopol: e.target.value.toUpperCase() })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono uppercase focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jenis Armada *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as VehicleType })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="Dump Truck">Dump Truck</option>
                    <option value="Truk Box">Truk Box</option>
                    <option value="Truk Tronton / Wingbox">Truk Tronton / Wingbox</option>
                    <option value="Truk Engkel (CDE/CDD)">Truk Engkel (CDE/CDD)</option>
                    <option value="Pickup Bak / Blind Van">Pickup Bak / Blind Van</option>
                    <option value="Minibus / HiAce">Minibus / HiAce</option>
                    <option value="Mobil Operasional Kantor">Mobil Operasional Kantor</option>
                    <option value="Forklift / Alat Berat">Forklift / Alat Berat</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Merk Kendaraan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hino / Mitsubishi / Isuzu"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Tipe / Model</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ranger FM 260 / Canter HD"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Tahun Pembuatan</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value, 10) || 2022 })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jenis Bahan Bakar</label>
                  <select
                    value={formData.fuelType}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as FuelType })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="Bio Solar">Bio Solar</option>
                    <option value="Solar Dexlite">Solar Dexlite</option>
                    <option value="Pertamina Dex">Pertamina Dex</option>
                    <option value="Pertalite">Pertalite</option>
                    <option value="Pertamax">Pertamax</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Odometer Saat Ini (KM)</label>
                  <input
                    type="number"
                    value={formData.currentOdometer}
                    onChange={(e) => setFormData({ ...formData, currentOdometer: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Status Operasional</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as VehicleStatus })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="active">Aktif Operasi</option>
                    <option value="maintenance">Dalam Servis / Bengkel</option>
                    <option value="standby">Standby di Pool</option>
                    <option value="broken">Mogok / Rusak</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Supir Tetap</label>
                  <input
                    type="text"
                    placeholder="Nama Supir"
                    value={formData.assignedDriver}
                    onChange={(e) => setFormData({ ...formData, assignedDriver: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">No. WhatsApp Supir</label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={formData.driverPhone}
                    onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Target Efisiensi Solar (Km/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.targetKmPerLiter}
                    onChange={(e) => setFormData({ ...formData, targetKmPerLiter: parseFloat(e.target.value) || 5 })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Kapasitas Muatan (Ton)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.capacityTon}
                    onChange={(e) => setFormData({ ...formData, capacityTon: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jatuh Tempo Pajak STNK 1 Thn</label>
                  <input
                    type="date"
                    value={formData.stnk1YearDate}
                    onChange={(e) => setFormData({ ...formData, stnk1YearDate: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jatuh Tempo Plat 5 Thn</label>
                  <input
                    type="date"
                    value={formData.stnk5YearDate}
                    onChange={(e) => setFormData({ ...formData, stnk5YearDate: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jatuh Tempo Uji KIR Dishub</label>
                  <input
                    type="date"
                    value={formData.kirDate}
                    onChange={(e) => setFormData({ ...formData, kirDate: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jatuh Tempo Asuransi</label>
                  <input
                    type="date"
                    value={formData.insuranceDate}
                    onChange={(e) => setFormData({ ...formData, insuranceDate: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Rute rutin, kondisi armada, dll."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
                >
                  {editingVehicle ? 'Simpan Perubahan' : 'Tambah Kendaraan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
