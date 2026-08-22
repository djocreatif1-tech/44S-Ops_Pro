import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  CreditCard,
  Calendar,
  Trash2,
  Edit2,
  X,
  Lock
} from 'lucide-react';
import { Driver, Vehicle, UserRole } from '../../types';
import { formatDateIndo, getTaxDueBadgeInfo } from '../../utils/formatters';
import { exportDriversToExcel, exportDriversToPDF } from '../../utils/exportUtils';
import { ModuleFilterExportBar } from '../Common/ModuleFilterExportBar';
import { getRolePermissions } from '../../utils/permissions';
import { RoleRestrictedBanner } from '../Common/RoleRestrictedBanner';

interface DriverManagerProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  userRole?: UserRole;
  onOpenRoleMatrix?: () => void;
  onAddDriver: (d: Driver) => void;
  onUpdateDriver: (d: Driver) => void;
  onDeleteDriver: (id: string) => void;
}

export const DriverManager: React.FC<DriverManagerProps> = ({
  drivers = [],
  vehicles = [],
  userRole = 'owner',
  onOpenRoleMatrix,
  onAddDriver,
  onUpdateDriver,
  onDeleteDriver
}) => {
  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const perms = getRolePermissions(userRole);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Driver>>({
    name: '',
    nik: '',
    phone: '',
    simType: 'SIM B2 Umum',
    simNumber: '',
    simExpiry: '2028-01-01',
    status: 'active',
    joinDate: '2023-01-01'
  });

  const filteredDrivers = safeDrivers.filter((d) => {
    if (!d) return false;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (d.name || '').toLowerCase().includes(q) ||
      (d.phone || '').toLowerCase().includes(q) ||
      (d.simType || '').toLowerCase().includes(q);

    // Date range filter on joinDate or simExpiry
    if (startDate && d.joinDate && d.joinDate < startDate && d.simExpiry && d.simExpiry < startDate) {
      return false;
    }
    if (endDate && d.joinDate && d.joinDate > endDate && d.simExpiry && d.simExpiry > endDate) {
      return false;
    }

    return matchesSearch;
  });

  const dateRangeText = startDate && endDate
    ? `${startDate} s/d ${endDate}`
    : startDate
    ? `Mulai ${startDate}`
    : endDate
    ? `Sampai ${endDate}`
    : 'Semua Periode';

  const handleExportExcel = () => {
    exportDriversToExcel(filteredDrivers, dateRangeText);
  };

  const handleExportPDF = () => {
    exportDriversToPDF(filteredDrivers, dateRangeText);
  };

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setFormData({
      name: '',
      nik: '',
      phone: '',
      simType: 'SIM B1 Umum',
      simNumber: '',
      simExpiry: '2028-06-15',
      status: 'active',
      joinDate: '2023-01-01'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: Driver) => {
    setEditingDriver(d);
    setFormData({ ...d });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingDriver) {
      onUpdateDriver({
        ...editingDriver,
        ...(formData as Driver)
      });
    } else {
      const newD: Driver = {
        name: formData.name || '',
        nik: formData.nik || '',
        phone: formData.phone || '',
        simType: (formData.simType || 'SIM B1 Umum') as any,
        simNumber: formData.simNumber || '',
        simExpiry: formData.simExpiry || '',
        status: (formData.status || 'active') as any,
        joinDate: formData.joinDate || '',
        id: 'DRV-' + Date.now().toString().slice(-4)
      };
      onAddDriver(newD);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Role Restricted Banner */}
      {!perms.canAddDriver && (
        <RoleRestrictedBanner
          userRole={userRole}
          moduleName="Data Pengemudi & Supir"
          allowedActionsText="Hanya dapat melihat kontak dan status SIM pengemudi"
          restrictedActionsText="Penambahan, pengeditan, dan penghapusan data pengemudi hanya dapat dilakukan oleh Admin & Owner."
          onOpenRoleModal={onOpenRoleMatrix}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Manajemen Pengemudi &amp; Driver
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Database profil supir, masa berlaku SIM B1/B2 Umum, dan status penugasan armada
          </p>
        </div>
        {perms.canAddDriver ? (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-xs active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pengemudi</span>
          </button>
        ) : (
          <button
            disabled
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 text-slate-400 font-medium text-xs rounded-lg cursor-not-allowed border border-slate-200"
            title="Akses dibatasi sesuai peran"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Tambah Pengemudi (Terkunci)</span>
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
        totalFilteredCount={filteredDrivers.length}
        totalAllCount={drivers.length}
        moduleLabel="Pengemudi"
      >
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama pengemudi, no HP, SIM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white"
          />
        </div>
      </ModuleFilterExportBar>

      {/* Driver Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDrivers.map((driver) => {
          const simBadge = getTaxDueBadgeInfo(driver.simExpiry);
          const assignedVehicles = vehicles.filter(v => v.assignedDriver === driver.name);

          return (
            <div
              key={driver.id}
              className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition group"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm">
                      {(driver.name || 'D').charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{driver.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">NIK: {driver.nik}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    driver.status === 'active'
                      ? 'bg-green-50 text-green-700 border border-green-200/60'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {driver.status === 'active' ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>

                <div className="space-y-2 py-2 text-xs divide-y divide-slate-100">
                  <div className="flex items-center justify-between py-1 text-slate-600">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600" /> Kontak WhatsApp
                    </span>
                    <span className="font-medium text-slate-800">{driver.phone}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 text-slate-600">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Kualifikasi SIM
                    </span>
                    <span className="font-semibold text-slate-800">{driver.simType}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 text-slate-600">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Masa Berlaku SIM
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${simBadge.badgeClass}`}>
                      {formatDateIndo(driver.simExpiry)}
                    </span>
                  </div>

                  <div className="pt-2 text-slate-600">
                    <span className="text-[10px] text-slate-400 block mb-1">Armada yang Dikemudikan:</span>
                    {assignedVehicles.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {assignedVehicles.map(v => (
                          <span key={v.id} className="font-mono font-bold text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                            {v.nopol} ({v.brand})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Belum ada unit tetap</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                {perms.canEditDriver && (
                  <button
                    onClick={() => handleOpenEdit(driver)}
                    className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition"
                    title="Edit Data Supir"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {perms.canDeleteDriver && (
                  <button
                    onClick={() => {
                      if (confirm(`Hapus data pengemudi ${driver.name}?`)) onDeleteDriver(driver.id);
                    }}
                    className="p-2 bg-white border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                    title="Hapus Data Supir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Driver */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                {editingDriver ? `Edit Pengemudi: ${editingDriver.name}` : 'Tambah Pengemudi Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Nama Lengkap Pengemudi *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Nomor Induk Kependudukan (NIK)</label>
                <input
                  type="text"
                  value={formData.nik}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Nomor WhatsApp Aktif *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Golongan SIM</label>
                <select
                  value={formData.simType}
                  onChange={(e) => setFormData({ ...formData, simType: e.target.value as any })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                >
                  <option value="SIM B2 Umum">SIM B2 Umum (Tronton / Gandengan)</option>
                  <option value="SIM B1 Umum">SIM B1 Umum (Truk / Bus)</option>
                  <option value="SIM B1">SIM B1 Polos</option>
                  <option value="SIM A">SIM A (Mobil Pribadi / Pickup)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Masa Berlaku SIM</label>
                <input
                  type="date"
                  value={formData.simExpiry}
                  onChange={(e) => setFormData({ ...formData, simExpiry: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Status Kepegawaian</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                >
                  <option value="active">Aktif Bekerja</option>
                  <option value="inactive">Nonaktif / Cuti</option>
                </select>
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
                  {editingDriver ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
