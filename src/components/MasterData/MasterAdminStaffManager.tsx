import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Building,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Edit2,
  Trash2,
  Check,
  X,
  Calendar,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { AdminStaff, Driver, UserRole } from '../../types';
import { TablePagination } from '../Common/TablePagination';
import { formatDateIndo } from '../../utils/formatters';
import { confirmDelete } from '../../utils/dialogService';

interface MasterAdminStaffManagerProps {
  staffList: AdminStaff[];
  drivers?: Driver[];
  userRole?: UserRole;
  onAddStaff: (staff: AdminStaff) => void;
  onUpdateStaff: (staff: AdminStaff) => void;
  onDeleteStaff: (id: string) => void;
  onOpenRoleMatrix?: () => void;
}

const DEPARTMENTS = [
  'Keuangan & Pembukuan',
  'Operasional & Lapangan',
  'Pengemudi & Operasional Jalan (Driver)',
  'Personalia & HRD',
  'Legalitas & Logistik',
  'Teknisi & Maintenance'
];

export const MasterAdminStaffManager: React.FC<MasterAdminStaffManagerProps> = ({
  staffList = [],
  drivers = [],
  userRole = 'owner',
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onOpenRoleMatrix
}) => {
  const safeStaff = Array.isArray(staffList) ? staffList : [];
  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<AdminStaff | null>(null);

  const [formData, setFormData] = useState<Partial<AdminStaff>>({
    nikOrNip: '',
    name: '',
    jobTitle: 'Staff Administrasi Operasional',
    department: 'Keuangan & Pembukuan',
    phone: '',
    email: '',
    address: '',
    status: 'active',
    joinDate: new Date().toISOString().slice(0, 10),
    notes: ''
  });

  const filtered = safeStaff.filter((s) => {
    if (!s) return false;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.nikOrNip.toLowerCase().includes(q) ||
      s.jobTitle.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q));
    const matchesDept = departmentFilter === 'all' || s.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormData({
      nikOrNip: 'ADM-' + new Date().getFullYear() + '-' + Date.now().toString().slice(-3),
      name: '',
      jobTitle: 'Staff Administrasi Operasional',
      department: 'Keuangan & Pembukuan',
      phone: '',
      email: '',
      address: '',
      status: 'active',
      joinDate: new Date().toISOString().slice(0, 10),
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff: AdminStaff) => {
    setEditingStaff(staff);
    setFormData({ ...staff });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    if (editingStaff) {
      onUpdateStaff({
        ...editingStaff,
        ...formData,
        nikOrNip: formData.nikOrNip || editingStaff.nikOrNip,
        name: formData.name.trim(),
        jobTitle: formData.jobTitle || 'Staff Administrasi',
        department: formData.department || 'Keuangan & Pembukuan',
        phone: formData.phone || '',
        email: formData.email || '',
        address: formData.address || '',
        status: formData.status || 'active',
        joinDate: formData.joinDate || editingStaff.joinDate,
        notes: formData.notes || ''
      });
    } else {
      const newStaff: AdminStaff = {
        id: 'ADM-' + Date.now().toString().slice(-6),
        nikOrNip: formData.nikOrNip || 'ADM-' + Date.now().toString().slice(-4),
        name: formData.name.trim(),
        jobTitle: formData.jobTitle || 'Staff Administrasi',
        department: formData.department || 'Keuangan & Pembukuan',
        phone: formData.phone || '',
        email: formData.email || '',
        address: formData.address || '',
        status: formData.status || 'active',
        joinDate: formData.joinDate || new Date().toISOString().slice(0, 10),
        notes: formData.notes || '',
        createdAt: new Date().toISOString().slice(0, 10)
      };
      onAddStaff(newStaff);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">Master Karyawan Administrasi &amp; Staf</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
              {safeStaff.length} Staf Terdaftar
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Database profil staf administrasi kantor: keuangan, dispatcher, operasional pool &amp; kasir
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Karyawan Baru</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama karyawan, NIK/NIP, jabatan, atau email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-indigo-500"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => {
            setDepartmentFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-52 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-500"
        >
          <option value="all">Semua Departemen</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-40 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-500"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="leave">Cuti</option>
          <option value="inactive">Non-Aktif</option>
        </select>
      </div>

      {/* Table view */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">NIP &amp; Nama Karyawan</th>
                <th className="py-3 px-4">Jabatan &amp; Departemen</th>
                <th className="py-3 px-4">Kontak (HP &amp; Email)</th>
                <th className="py-3 px-4">Alamat Domisili</th>
                <th className="py-3 px-4">Tgl Bergabung</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((staf) => (
                <tr key={staf.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60 inline-block mb-1">
                      {staf.nikOrNip}
                    </span>
                    <p className="font-bold text-slate-800 text-xs">{staf.name}</p>
                    {staf.notes && <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{staf.notes}</p>}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-800">{staf.jobTitle}</p>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 inline-block mt-0.5">
                      {staf.department}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-mono font-medium text-slate-700">{staf.phone || '-'}</p>
                    {staf.email && <p className="text-[10px] text-blue-600 truncate mt-0.5">{staf.email}</p>}
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-[11px] text-slate-600 line-clamp-2 max-w-xs">{staf.address || '-'}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-[11px] font-mono text-slate-700">{formatDateIndo(staf.joinDate)}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        staf.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : staf.status === 'leave'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {staf.status === 'active' ? 'Aktif' : staf.status === 'leave' ? 'Cuti' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(staf)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Edit Data Staf"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (await confirmDelete(`Data Karyawan "${staf.name}"`, 'Apakah Anda Yakin Ingin Menghapus Data?', `NIP: ${staf.nip} • Divisi: ${staf.department}`)) {
                            onDeleteStaff(staf.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Karyawan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada staf administrasi yang sesuai dengan pencarian
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[8, 16, 24]}
          itemLabel="karyawan"
        />
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {editingStaff ? 'Edit Data Karyawan Administrasi' : 'Tambah Karyawan Administrasi Baru'}
                  </h3>
                  <p className="text-[10px] text-slate-400">Profil staf kantor, divisi, dan data kontak resmi</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">NIK / NIP Karyawan</label>
                  <input
                    type="text"
                    value={formData.nikOrNip}
                    onChange={(e) => setFormData({ ...formData, nikOrNip: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-slate-800"
                    placeholder="ADM-2026-001"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Status Kepegawaian *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                    required
                  >
                    <option value="active">Aktif Bekerja</option>
                    <option value="leave">Sedang Cuti</option>
                    <option value="inactive">Non-Aktif / Resign</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Nama Lengkap Karyawan *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Misal: Siti Nurhaliza, A.Md."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-hidden focus:border-indigo-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jabatan / Posisi *</label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    placeholder="Misal: Staff Kasir Kas Kecil"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Departemen / Divisi *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                    required
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nomor HP / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Email Perusahaan</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@fleetops.co.id"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Tanggal Mulai Bergabung</label>
                <input
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Alamat Domisili Karyawan</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Jl. Raya Perumahan No. 10, Bekasi..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catatan Tambahan / Tugas Khusus</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Misal: Penanggung jawab kasir petty cash pool Jakarta"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingStaff ? 'Simpan Perubahan' : 'Simpan Karyawan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
