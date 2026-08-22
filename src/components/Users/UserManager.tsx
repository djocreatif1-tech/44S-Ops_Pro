import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Crown,
  Briefcase,
  Truck,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  ShieldCheck,
  UserCheck,
  KeyRound,
  LogIn,
  X,
  Lock,
  Sparkles,
  Info,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserAccount, UserRole } from '../../types';
import { ROLE_DEFINITIONS, getRoleMeta } from '../../utils/permissions';
import { formatDateIndo } from '../../utils/formatters';

interface UserManagerProps {
  users: UserAccount[];
  currentUserRole: UserRole;
  currentUserId?: string;
  onAddUser: (user: UserAccount) => void;
  onUpdateUser: (user: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchUser: (user: UserAccount) => void;
  onOpenRoleMatrix?: () => void;
}

export const UserManager: React.FC<UserManagerProps> = ({
  users = [],
  currentUserRole = 'owner',
  currentUserId,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onSwitchUser,
  onOpenRoleMatrix
}) => {
  const safeUsers = Array.isArray(users) ? users : [];

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    pin: '',
    role: 'admin1' as UserRole,
    phone: '',
    status: 'active' as 'active' | 'inactive',
    notes: ''
  });

  const isOwner = currentUserRole === 'owner';

  // KPI Calculations
  const totalUsers = safeUsers.length;
  const activeCount = safeUsers.filter(u => u && u.status === 'active').length;
  const ownerCount = safeUsers.filter(u => u && u.role === 'owner').length;
  const admin1Count = safeUsers.filter(u => u && u.role === 'admin1').length;
  const admin2Count = safeUsers.filter(u => u && u.role === 'admin2').length;

  // Filtered Users
  const filteredUsers = safeUsers.filter(user => {
    if (!user) return false;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (user.name || '').toLowerCase().includes(q) ||
      (user.username || '').toLowerCase().includes(q) ||
      (user.email || '').toLowerCase().includes(q) ||
      (user.phone && user.phone.includes(searchQuery));

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'owner': return Crown;
      case 'admin1': return Briefcase;
      case 'admin2': return Truck;
      default: return Users;
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      pin: '123456',
      role: 'admin1',
      phone: '',
      status: 'active',
      notes: ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      email: user.email,
      password: user.password || '',
      pin: user.pin || '123456',
      role: user.role,
      phone: user.phone || '',
      status: user.status,
      notes: user.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim()) {
      alert('Mohon isi nama lengkap dan username');
      return;
    }

    // Check username uniqueness
    const targetUsername = (formData.username || '').trim().toLowerCase();
    const exists = users.some(u => (u.username || '').toLowerCase() === targetUsername);
    if (exists) {
      alert(`Username "${formData.username}" sudah digunakan. Silakan pilih username lain.`);
      return;
    }

    const newUser: UserAccount = {
      id: 'USR-' + Date.now(),
      name: formData.name.trim(),
      username: targetUsername.replace(/\s+/g, ''),
      email: formData.email.trim() || `${targetUsername.replace(/\s+/g, '')}@translog.id`,
      password: formData.password.trim() || 'admin123',
      pin: formData.pin.trim() || '123456',
      role: formData.role,
      phone: formData.phone.trim(),
      status: formData.status,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Belum pernah login',
      notes: formData.notes.trim()
    };

    onAddUser(newUser);
    setIsAddModalOpen(false);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!formData.name.trim() || !formData.username.trim()) {
      alert('Mohon isi nama lengkap dan username');
      return;
    }

    // Check username uniqueness excluding current
    const targetUsername = (formData.username || '').trim().toLowerCase();
    const exists = users.some(
      u => u.id !== selectedUser.id && (u.username || '').toLowerCase() === targetUsername
    );
    if (exists) {
      alert(`Username "${formData.username}" sudah digunakan oleh pengguna lain.`);
      return;
    }

    // Prevent changing the last owner to another role
    if (selectedUser.role === 'owner' && formData.role !== 'owner' && ownerCount <= 1) {
      alert('Sistem harus memiliki minimal 1 akun dengan peran Owner.');
      return;
    }

    const updated: UserAccount = {
      ...selectedUser,
      name: formData.name.trim(),
      username: targetUsername.replace(/\s+/g, ''),
      email: formData.email.trim(),
      password: formData.password.trim() || selectedUser.password,
      pin: formData.pin.trim() || selectedUser.pin,
      role: formData.role,
      phone: formData.phone.trim(),
      status: formData.status,
      notes: formData.notes.trim()
    };

    onUpdateUser(updated);
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleDelete = (user: UserAccount) => {
    if (user.role === 'owner' && ownerCount <= 1) {
      alert('Akun Owner utama tidak dapat dihapus (minimal 1 Owner harus tetap ada).');
      return;
    }
    if (user.id === currentUserId) {
      alert('Anda sedang login menggunakan akun ini. Silakan berganti akun sebelum menghapus akun ini.');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus akun pengguna "${user.name}" (@${user.username})?`)) {
      onDeleteUser(user.id);
    }
  };

  const handleFastSwitch = (user: UserAccount) => {
    if (user.status === 'inactive') {
      alert('Akun ini sedang berstatus nonaktif. Aktifkan akun terlebih dahulu untuk beralih profil.');
      return;
    }
    onSwitchUser(user);
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              Manajemen Akun & Hak Akses Pengguna
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              3 Peran Sistem
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola daftar akun pengguna, peran otorisasi (Owner, Admin 1, Admin 2), status akses, dan kredensial tim.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onOpenRoleMatrix && (
            <button
              onClick={onOpenRoleMatrix}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium shadow-xs transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Matriks Izin Role</span>
            </button>
          )}
          {isOwner ? (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Akun Pengguna</span>
            </button>
          ) : (
            <button
              disabled
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 text-slate-400 font-medium text-xs rounded-lg cursor-not-allowed border border-slate-200"
              title="Hanya Owner yang dapat menambah akun baru"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Tambah Akun (Khusus Owner)</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Akun</div>
            <div className="text-lg font-bold text-slate-800">{totalUsers} User</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Owner (Super)</div>
            <div className="text-lg font-bold text-slate-800">{ownerCount} Akun</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Admin 1 (Ops & Fin)</div>
            <div className="text-lg font-bold text-slate-800">{admin1Count} Akun</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Admin 2 (Armada & Solar)</div>
            <div className="text-lg font-bold text-slate-800">{admin2Count} Akun</div>
          </div>
        </div>
      </div>

      {/* Role Explanatory Card */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50/40 p-4 rounded-xl border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800">
              Struktur 3 Hak Akses Utama Aplikasi
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              <strong className="text-amber-800">1. Owner:</strong> Kelola 100% seluruh modul, keuangan, dan manajemen user. &bull;{' '}
              <strong className="text-emerald-800">2. Admin 1:</strong> Arus Kas Operasional, Perawatan Bengkel, Supir, Laporan & Master Non-Sewa. &bull;{' '}
              <strong className="text-blue-800">3. Admin 2:</strong> Kendaraan, Pajak & Legalitas, Konsumsi Solar BBM, dan Laporan Time Sheet.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pengguna berdasarkan nama, username, email, atau no. HP..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                roleFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua Role
            </button>
            <button
              onClick={() => setRoleFilter('owner')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                roleFilter === 'owner' ? 'bg-amber-100 text-amber-900 font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Owner
            </button>
            <button
              onClick={() => setRoleFilter('admin1')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                roleFilter === 'admin1' ? 'bg-emerald-100 text-emerald-900 font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Admin 1
            </button>
            <button
              onClick={() => setRoleFilter('admin2')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                roleFilter === 'admin2' ? 'bg-blue-100 text-blue-900 font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Admin 2
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Users Table / Grid */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-5">Pengguna & Username</th>
                <th className="py-3 px-5">Peran / Otorisasi</th>
                <th className="py-3 px-5">Ruang Lingkup Kelola</th>
                <th className="py-3 px-5">Kontak</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Tidak ada akun pengguna yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const meta = getRoleMeta(user.role);
                  const Icon = getRoleIcon(user.role);
                  const isCurrentActive = currentUserRole === user.role;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                            user.role === 'owner' ? 'bg-amber-100 text-amber-800' :
                            user.role === 'admin1' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {(user.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isCurrentActive && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">@{user.username}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.badgeClass}`}>
                          <Icon className="w-3.5 h-3.5" />
                          <span>{meta.title}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-5 max-w-xs">
                        <p className="text-[11px] text-slate-600 line-clamp-2">
                          {meta.description}
                        </p>
                      </td>

                      <td className="py-3.5 px-5">
                        <div className="space-y-0.5 text-[11px] text-slate-600">
                          {user.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{user.email}</span>
                            </div>
                          )}
                          {user.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          user.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {user.status === 'active' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-500" />
                              Nonaktif
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Fast Switch User */}
                          <button
                            onClick={() => handleFastSwitch(user)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                              isCurrentActive
                                ? 'bg-slate-100 text-slate-400 cursor-default'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                            }`}
                            title={isCurrentActive ? 'Profil aktif saat ini' : `Beralih ke profil ${user.name}`}
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>{isCurrentActive ? 'Aktif' : 'Beralih'}</span>
                          </button>

                          {/* Edit Button */}
                          {isOwner && (
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition"
                              title="Edit Akun"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Button */}
                          {isOwner && (
                            <button
                              onClick={() => handleDelete(user)}
                              disabled={user.role === 'owner' && ownerCount <= 1}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Hapus Akun"
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
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Tambah Akun Pengguna Baru</h3>
                  <p className="text-xs text-slate-500">Buat akun untuk staf atau pengelola sistem</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Pengguna <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Rina Wijaya"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Contoh: rina_finance"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0812-3456-7890"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Akun
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rina@fleetops.co.id"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PIN Akses (4-6 Digit) / Password
                  </label>
                  <input
                    type="text"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    placeholder="Default: 123456"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* Role Selection (3 Roles Only) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Pilih Hak Akses / Peran (3 Role) <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  {(['owner', 'admin1', 'admin2'] as UserRole[]).map((r) => {
                    const meta = ROLE_DEFINITIONS[r];
                    const Icon = getRoleIcon(r);
                    const isSelected = formData.role === r;

                    return (
                      <label
                        key={r}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? 'bg-blue-50/60 border-blue-500 ring-1 ring-blue-500'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="userRole"
                          value={r}
                          checked={isSelected}
                          onChange={() => setFormData({ ...formData, role: r })}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800">
                            <Icon className="w-4 h-4 text-blue-600" />
                            <span>{meta.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {meta.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Akun
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan / Jabatan
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Staf Keuangan Pool Cakung"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition"
                >
                  Simpan Akun Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Edit Akun Pengguna</h3>
                  <p className="text-xs text-slate-500">Perbarui identitas dan hak akses akun @{selectedUser.username}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Akun
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reset PIN / Password
                  </label>
                  <input
                    type="text"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    placeholder="PIN / Password baru"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Peran Otorisasi (3 Role) <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  {(['owner', 'admin1', 'admin2'] as UserRole[]).map((r) => {
                    const meta = ROLE_DEFINITIONS[r];
                    const Icon = getRoleIcon(r);
                    const isSelected = formData.role === r;

                    return (
                      <label
                        key={r}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? 'bg-blue-50/60 border-blue-500 ring-1 ring-blue-500'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="userRoleEdit"
                          value={r}
                          checked={isSelected}
                          onChange={() => setFormData({ ...formData, role: r })}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800">
                            <Icon className="w-4 h-4 text-blue-600" />
                            <span>{meta.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {meta.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Akun
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan / Jabatan
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition"
                >
                  Perbarui Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
