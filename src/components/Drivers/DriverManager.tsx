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
  Lock,
  LayoutGrid,
  Table
} from 'lucide-react';
import { Driver, Vehicle, UserRole, SimClassReference, TripSheet, DriverPocketCashFlow, EquipmentCashFlow } from '../../types';
import { formatDateIndo, getTaxDueBadgeInfo } from '../../utils/formatters';
import { exportDriversToExcel, exportDriversToPDF } from '../../utils/exportUtils';
import { ModuleFilterExportBar } from '../Common/ModuleFilterExportBar';
import { getRolePermissions } from '../../utils/permissions';
import { RoleRestrictedBanner } from '../Common/RoleRestrictedBanner';
import { TablePagination } from '../Common/TablePagination';
import { ModuleAnalyticsPanel } from '../Common/ModuleAnalyticsPanel';
import { BarChart3 } from 'lucide-react';
import { confirmDelete } from '../../utils/dialogService';

interface DriverManagerProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  simClasses?: SimClassReference[];
  tripSheets?: TripSheet[];
  pocketFlows?: DriverPocketCashFlow[];
  equipmentList?: EquipmentCashFlow[];
  userRole?: UserRole;
  onOpenRoleMatrix?: () => void;
  onAddDriver: (d: Driver) => void;
  onUpdateDriver: (d: Driver) => void;
  onDeleteDriver: (id: string) => void;
}

export const DriverManager: React.FC<DriverManagerProps> = ({
  drivers = [],
  vehicles = [],
  simClasses = [],
  tripSheets = [],
  pocketFlows = [],
  equipmentList = [],
  userRole = 'owner',
  onOpenRoleMatrix,
  onAddDriver,
  onUpdateDriver,
  onDeleteDriver
}) => {
  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const perms = getRolePermissions(userRole);
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'analytics'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination State (Next Halaman)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Driver>>({
    nip: '',
    name: '',
    nik: '',
    phone: '',
    simType: 'SIM B2 Umum',
    simNumber: '',
    simExpiry: '2028-01-01',
    status: 'active',
    joinDate: '2023-01-01',
    employmentType: 'Tetap',
    jobTitle: 'Pengemudi Utama (Driver Senior)',
    department: 'Divisi Operasional Armada & Jalan',
    companyName: 'PT Transindo Logistik Indonesia',
    bankName: 'BCA',
    bankAccountNumber: '',
    assignedVehicle: '',
    helperName: '',
    emergencyContact: '',
    ktpAddress: ''
  });

  const [selectedCompany, setSelectedCompany] = useState<string>('all');

  const getDriverCompany = (d: Driver) => {
    if (d.companyName) return d.companyName;
    const v = safeVehicles.find(veh => veh.assignedDriver === d.name || veh.nopol === d.assignedVehicle);
    return v?.ownerCompany || 'PT Transindo Logistik Indonesia';
  };

  const companies = Array.from(
    new Set([
      ...safeDrivers.map(d => getDriverCompany(d)).filter(Boolean),
      ...safeVehicles.map(v => v.ownerCompany).filter(Boolean)
    ])
  );

  const companySummaries = companies.map((comp) => ({
    companyName: comp,
    count: safeDrivers.filter(d => getDriverCompany(d) === comp).length,
  }));

  const filteredDrivers = safeDrivers.filter((d) => {
    if (!d) return false;
    const compName = getDriverCompany(d);
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (d.name || '').toLowerCase().includes(q) ||
      (d.nip || '').toLowerCase().includes(q) ||
      (d.nik || '').toLowerCase().includes(q) ||
      (d.phone || '').toLowerCase().includes(q) ||
      (d.simType || '').toLowerCase().includes(q) ||
      (d.jobTitle || '').toLowerCase().includes(q) ||
      (d.assignedVehicle || '').toLowerCase().includes(q) ||
      compName.toLowerCase().includes(q);

    if (selectedCompany !== 'all' && compName !== selectedCompany) {
      return false;
    }

    // Date range filter on simExpiry
    if (startDate && d.simExpiry && d.simExpiry < startDate) {
      return false;
    }
    if (endDate && d.simExpiry && d.simExpiry > endDate) {
      return false;
    }

    return matchesSearch;
  });

  // Paginated Drivers for Next / Prev Pages
  const totalFilteredDrivers = filteredDrivers.length;
  const paginatedDrivers = filteredDrivers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
    const nextNum = String(safeDrivers.length + 1).padStart(3, '0');
    setFormData({
      nip: `DRV-EMP-${new Date().getFullYear()}-${nextNum}`,
      name: '',
      nik: '',
      phone: '',
      simType: 'SIM B1 Umum',
      simNumber: '',
      simExpiry: '2028-06-15',
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0],
      employmentType: 'Tetap',
      jobTitle: 'Pengemudi Utama (Driver)',
      department: 'Divisi Operasional Armada & Jalan',
      companyName: 'PT Transindo Logistik Indonesia',
      bankName: 'BCA',
      bankAccountNumber: '',
      assignedVehicle: '',
      helperName: '',
      emergencyContact: '',
      ktpAddress: ''
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
      const nextNum = String(safeDrivers.length + 1).padStart(3, '0');
      const newD: Driver = {
        id: 'DRV-' + Date.now().toString().slice(-4),
        nip: formData.nip || `DRV-EMP-${new Date().getFullYear()}-${nextNum}`,
        name: formData.name || '',
        nik: formData.nik || '',
        phone: formData.phone || '',
        simType: (formData.simType || 'SIM B1 Umum') as any,
        simNumber: formData.simNumber || '',
        simExpiry: formData.simExpiry || '',
        status: (formData.status || 'active') as any,
        joinDate: formData.joinDate || new Date().toISOString().split('T')[0],
        employmentType: (formData.employmentType || 'Tetap') as any,
        jobTitle: formData.jobTitle || 'Pengemudi Utama (Driver)',
        department: formData.department || 'Divisi Operasional Armada & Jalan',
        companyName: formData.companyName || 'PT Transindo Logistik Indonesia',
        bankName: formData.bankName || 'BCA',
        bankAccountNumber: formData.bankAccountNumber || '',
        assignedVehicle: formData.assignedVehicle || '',
        helperName: formData.helperName || '',
        emergencyContact: formData.emergencyContact || '',
        ktpAddress: formData.ktpAddress || ''
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
          moduleName="Data Karyawan Pengemudi & Driver"
          allowedActionsText="Hanya dapat melihat kontak, NIP karyawan, dan status SIM pengemudi"
          restrictedActionsText="Penambahan, pengeditan, dan penghapusan data karyawan pengemudi hanya dapat dilakukan oleh Admin & Owner."
          onOpenRoleModal={onOpenRoleMatrix}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Data Karyawan Driver &amp; Co-Driver (Referensi Serah Terima)
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Database NIP karyawan pengemudi, jabatan, SIM, rekening pencairan uang saku, &amp; referensi serah terima transaksi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Switcher: Tabel vs Kartu */}
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'table'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Tabel & Kolom"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Kartu Kotak"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-xs border border-indigo-700'
                  : 'text-indigo-700 hover:bg-indigo-50'
              }`}
              title="Laporan & Analitik SDM Karyawan Driver"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Laporan &amp; Analitik Driver</span>
            </button>
          </div>

          {perms.canAddDriver ? (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-xs active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Karyawan Driver</span>
            </button>
          ) : (
            <button
              disabled
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 text-slate-400 font-medium text-xs rounded-lg cursor-not-allowed border border-slate-200"
              title="Akses dibatasi sesuai peran"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Tambah Karyawan Driver (Terkunci)</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === 'analytics' ? (
        <ModuleAnalyticsPanel
          moduleType="drivers"
          title="Laporan & Analitik SDM Karyawan Driver & Referensi Serah Terima"
          subtitle="Analisis komposisi kepegawaian driver, kualifikasi golongan SIM & frekuensi serah terima transaksi operasional"
          drivers={safeDrivers}
          vehicles={safeVehicles}
          tripSheets={tripSheets}
          pocketFlows={pocketFlows}
          equipmentList={equipmentList}
        />
      ) : (
      <>
      {/* Date Filter & Export Bar */}
      <ModuleFilterExportBar
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={(val) => { setStartDate(val); setCurrentPage(1); }}
        onEndDateChange={(val) => { setEndDate(val); setCurrentPage(1); }}
        onResetDateFilter={() => { setStartDate(''); setEndDate(''); setCurrentPage(1); }}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        totalFilteredCount={totalFilteredDrivers}
        totalAllCount={drivers.length}
        moduleLabel="Karyawan Driver"
        companies={companies}
        selectedCompany={selectedCompany}
        onCompanyChange={(val) => {
          setSelectedCompany(val);
          setCurrentPage(1);
        }}
        companySummaries={companySummaries}
      >
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari NIP, nama driver, jabatan, nopol, SIM..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white"
          />
        </div>
      </ModuleFilterExportBar>

      {/* Driver Display: Table vs Grid */}
      {viewMode === 'table' ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-200 font-semibold tracking-wider text-[11px] uppercase">
                  <th className="py-3.5 px-4 text-center w-12">#</th>
                  <th className="py-3.5 px-4 min-w-[210px]">NIP &amp; Nama Karyawan Driver</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Jabatan &amp; Kepegawaian</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Kontak &amp; Rekening Sangu</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Kualifikasi &amp; Exp SIM</th>
                  <th className="py-3.5 px-4 min-w-[170px]">Unit Armada &amp; Kernet</th>
                  <th className="py-3.5 px-4 min-w-[110px]">Status</th>
                  <th className="py-3.5 px-4 text-center min-w-[90px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">Tidak ada karyawan driver yang cocok dengan filter</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Ubah kata kunci pencarian atau setel ulang filter</p>
                    </td>
                  </tr>
                ) : (
                  paginatedDrivers.map((driver, index) => {
                    const rowNumber = (currentPage - 1) * pageSize + index + 1;
                    const simBadge = getTaxDueBadgeInfo(driver.simExpiry);
                    const assignedVehicles = safeVehicles.filter(
                      v => v.assignedDriver === driver.name || v.nopol === driver.assignedVehicle
                    );

                    return (
                      <tr
                        key={driver.id}
                        className="hover:bg-blue-50/40 transition group cursor-default"
                      >
                        <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-[11px]">
                          {rowNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 text-xs shrink-0">
                              {(driver.name || 'D').charAt(0)}
                            </div>
                            <div>
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block mb-0.5">
                                {driver.nip || driver.id}
                              </span>
                              <p className="font-bold text-slate-800 leading-tight">
                                {driver.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                NIK: {driver.nik || '-'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800 text-xs">
                            {driver.jobTitle || 'Pengemudi Armada'}
                          </p>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Karyawan {driver.employmentType || 'Tetap'}
                            </span>
                            {driver.companyName && (
                              <span className="text-[10px] text-slate-500 truncate max-w-[160px]">
                                • {driver.companyName}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-medium text-slate-700">
                            <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="font-mono text-[11px]">{driver.phone}</span>
                          </div>
                          {driver.bankAccountNumber && (
                            <p className="text-[10px] font-mono text-slate-500 mt-1 bg-slate-100 px-1.5 py-0.5 rounded inline-block">
                              {driver.bankName || 'Bank'}: {driver.bankAccountNumber}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                              {driver.simType}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${simBadge.badgeClass}`}>
                                {simBadge.label}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatDateIndo(driver.simExpiry)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {assignedVehicles.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {assignedVehicles.map(v => (
                                <span key={v.id} className="font-mono font-bold text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                                  {v.nopol} ({v.brand})
                                </span>
                              ))}
                            </div>
                          ) : driver.assignedVehicle ? (
                            <span className="font-mono font-bold text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                              {driver.assignedVehicle}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Pool / Cadangan</span>
                          )}
                          {driver.helperName && (
                            <p className="text-[10px] text-slate-500 mt-1">
                              Kernet: <strong className="text-slate-700">{driver.helperName}</strong>
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            driver.status === 'active'
                              ? 'bg-green-50 text-green-700 border border-green-200/60'
                              : driver.status === 'on_duty'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {driver.status === 'active'
                              ? 'AKTIF STANDBY'
                              : driver.status === 'on_duty'
                              ? 'DINAS JALAN'
                              : 'OFF / CUTI'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {perms.canEditDriver && (
                              <button
                                onClick={() => handleOpenEdit(driver)}
                                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                                title="Edit Data Karyawan Driver"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {perms.canDeleteDriver && (
                              <button
                                onClick={async () => {
                                  if (await confirmDelete(`Data Karyawan Driver ${driver.name}`, 'Apakah Anda Yakin Ingin Menghapus Data?', `NIP: ${driver.nip || driver.id} • SIM: ${driver.simType}`)) {
                                    onDeleteDriver(driver.id);
                                  }
                                }}
                                className="p-1.5 bg-white border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                                title="Hapus Data Karyawan Driver"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Summary & Pagination Footer */}
          <div className="border-t border-slate-200">
            <div className="px-4 py-2.5 bg-slate-50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 border-b border-slate-200/60">
              <span>
                Total terdaftar: <strong>{drivers.length}</strong> karyawan driver &amp; co-driver (aktif untuk referensi serah terima)
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Aktif / Jalan: <strong>{drivers.filter(d => d.status === 'active' || d.status === 'on_duty').length}</strong></span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span>Off / Cuti: <strong>{drivers.filter(d => d.status === 'inactive' || d.status === 'off').length}</strong></span>
                </span>
              </div>
            </div>
            <TablePagination
              currentPage={currentPage}
              totalItems={totalFilteredDrivers}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[6, 12, 24, 48]}
              itemLabel="karyawan driver"
            />
          </div>
        </div>
      ) : (
        /* Driver Grid (Kartu) */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedDrivers.map((driver) => {
              const simBadge = getTaxDueBadgeInfo(driver.simExpiry);
              const assignedVehicles = safeVehicles.filter(
                v => v.assignedDriver === driver.name || v.nopol === driver.assignedVehicle
              );

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
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block mb-0.5">
                            {driver.nip || driver.id}
                          </span>
                          <h4 className="font-bold text-sm text-slate-800">{driver.name}</h4>
                          <p className="text-[11px] text-slate-500">{driver.jobTitle || 'Pengemudi Armada'}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        driver.status === 'active' || driver.status === 'on_duty'
                          ? 'bg-green-50 text-green-700 border border-green-200/60'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {driver.status === 'active' ? 'AKTIF' : driver.status === 'on_duty' ? 'JALAN' : 'OFF'}
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

                      {driver.bankAccountNumber && (
                        <div className="flex items-center justify-between py-1 text-slate-600">
                          <span className="text-slate-400">Rekening Sangu</span>
                          <span className="font-mono font-semibold text-slate-800">
                            {driver.bankName}: {driver.bankAccountNumber}
                          </span>
                        </div>
                      )}

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
                        ) : driver.assignedVehicle ? (
                          <span className="font-mono font-bold text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                            {driver.assignedVehicle}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Unit Pool / Cadangan</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    {perms.canEditDriver && (
                      <button
                        onClick={() => handleOpenEdit(driver)}
                        className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition"
                        title="Edit Data Karyawan Driver"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {perms.canDeleteDriver && (
                      <button
                        onClick={async () => {
                          if (await confirmDelete(`Data Karyawan Driver ${driver.name}`, 'Apakah Anda Yakin Ingin Menghapus Data?', `NIP: ${driver.nip || driver.id} • SIM: ${driver.simType}`)) {
                            onDeleteDriver(driver.id);
                          }
                        }}
                        className="p-2 bg-white border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Hapus Data Karyawan Driver"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid View Pagination */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <TablePagination
              currentPage={currentPage}
              totalItems={totalFilteredDrivers}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[6, 12, 24, 48]}
              itemLabel="karyawan driver"
            />
          </div>
        </div>
      )}
      </>
      )}

      {/* Modal Add / Edit Driver */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                {editingDriver ? `Edit Data Karyawan Driver: ${editingDriver.name}` : 'Tambah Karyawan Driver Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">NIP Karyawan Driver *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: DRV-EMP-2026-011"
                    value={formData.nip || ''}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-hidden focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nama Lengkap Karyawan Driver *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama sesuai KTP & SIM"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jabatan / Posisi Driver *</label>
                  <select
                    value={formData.jobTitle || 'Pengemudi Utama (Driver)'}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="Pengemudi Utama (Driver Senior)">Pengemudi Utama (Driver Senior)</option>
                    <option value="Pengemudi Utama (Driver)">Pengemudi Utama (Driver)</option>
                    <option value="Pengemudi Antar Kota (AKAP)">Pengemudi Antar Kota (AKAP)</option>
                    <option value="Pengemudi Distribusi Dalam Kota">Pengemudi Distribusi Dalam Kota</option>
                    <option value="Pengemudi Cadangan (Pool)">Pengemudi Cadangan (Pool)</option>
                    <option value="Co-Driver / Asisten Pengemudi (Kernet)">Co-Driver / Asisten Pengemudi (Kernet)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Status Ikatan Kerja</label>
                  <select
                    value={formData.employmentType || 'Tetap'}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="Tetap">Karyawan Tetap</option>
                    <option value="Kontrak">Karyawan Kontrak (PKWT)</option>
                    <option value="Mitra">Mitra Lepas / Borongan</option>
                    <option value="Cadangan">Driver Cadangan</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Perusahaan Naungan</label>
                  <input
                    type="text"
                    value={formData.companyName || ''}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="PT Transindo Logistik Indonesia"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nomor Induk Kependudukan (NIK KTP)</label>
                  <input
                    type="text"
                    value={formData.nik || ''}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nomor WhatsApp Aktif *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Golongan SIM *</label>
                  <select
                    value={formData.simType}
                    onChange={(e) => setFormData({ ...formData, simType: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500 font-medium"
                  >
                    {simClasses.length > 0 ? (
                      simClasses.filter(s => s.isActive).map(sim => (
                        <option key={sim.id} value={sim.name}>
                          {sim.name} ({sim.vehicleClassification})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="SIM B2 Umum">SIM B2 Umum (Tronton / Gandengan)</option>
                        <option value="SIM B1 Umum">SIM B1 Umum (Truk / Bus)</option>
                        <option value="SIM B1">SIM B1 Polos</option>
                        <option value="SIM A">SIM A (Mobil Pribadi / Pickup)</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nomor Kartu SIM</label>
                  <input
                    type="text"
                    value={formData.simNumber || ''}
                    onChange={(e) => setFormData({ ...formData, simNumber: e.target.value })}
                    placeholder="Contoh: 8812-0934-1120"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Masa Berlaku SIM</label>
                  <input
                    type="date"
                    value={formData.simExpiry || ''}
                    onChange={(e) => setFormData({ ...formData, simExpiry: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Bank Pencairan Sangu</label>
                  <select
                    value={formData.bankName || 'BCA'}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="BCA">Bank BCA</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BRI">Bank BRI</option>
                    <option value="BNI">Bank BNI</option>
                    <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                    <option value="Tunai Kasir">Tunai Kasir Pool</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">No. Rekening Driver</label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber || ''}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    placeholder="Nomor rekening transfer uang saku"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Unit Armada Ditugaskan</label>
                  <select
                    value={formData.assignedVehicle || ''}
                    onChange={(e) => setFormData({ ...formData, assignedVehicle: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="">-- Unit Pool / Cadangan --</option>
                    {safeVehicles.map((v) => (
                      <option key={v.id} value={v.nopol}>
                        {v.nopol} — {v.brand} {v.model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nama Kernet / Co-Driver Pendamping</label>
                  <input
                    type="text"
                    value={formData.helperName || ''}
                    onChange={(e) => setFormData({ ...formData, helperName: e.target.value })}
                    placeholder="Opsional (Contoh: Ujang / Tono)"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Status Kepegawaian &amp; Dinas</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="active">Aktif Standby (Siap Serah Terima)</option>
                    <option value="on_duty">Sedang Dinas Jalan</option>
                    <option value="inactive">Nonaktif / Cuti</option>
                  </select>
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
                  {editingDriver ? 'Simpan Perubahan' : 'Simpan Karyawan Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
