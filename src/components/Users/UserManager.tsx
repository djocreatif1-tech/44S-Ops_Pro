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
  LogIn,
  X,
  Lock,
  Sparkles,
  Info,
  CheckSquare,
  Square,
  Check,
  RotateCcw,
  Sliders,
  LayoutDashboard,
  FileCheck2,
  Fuel,
  Clock,
  Wallet,
  Wrench,
  FileBarChart,
  Layers,
  History,
  ClipboardList,
  Coins,
  Hammer,
  Package,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserAccount, UserRole } from '../../types';
import {
  ROLE_DEFINITIONS,
  getRoleMeta,
  SYSTEM_MODULES,
  getDefaultModulesForRole,
  normalizeAllowedModules
} from '../../utils/permissions';
import { TablePagination } from '../Common/TablePagination';

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
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserAccount | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  // Quick Modules Permission Modal
  const [isQuickModulesModalOpen, setIsQuickModulesModalOpen] = useState(false);
  const [quickTargetUser, setQuickTargetUser] = useState<UserAccount | null>(null);
  const [quickTargetRole, setQuickTargetRole] = useState<UserRole>('admin1');
  const [quickModules, setQuickModules] = useState<string[]>([]);

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
    notes: '',
    allowedTabs: getDefaultModulesForRole('admin1')
  });

  const isOwner = currentUserRole === 'owner';

  const showError = (msg: string) => {
    setErrorBanner(msg);
    setTimeout(() => setErrorBanner(null), 5000);
  };

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

  // Paginated Users
  const totalFiltered = filteredUsers.length;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'owner': return Crown;
      case 'admin1': return Briefcase;
      case 'admin2': return Truck;
      default: return Users;
    }
  };

  const getModuleIcon = (modId: string) => {
    switch (modId) {
      case 'dashboard': return LayoutDashboard;
      case 'vehicles': return Truck;
      case 'tax': return FileCheck2;
      case 'fuel': return Fuel;
      case 'timesheet': return Clock;
      case 'tripsheet': return ClipboardList;
      case 'finance': return Wallet;
      case 'finance_pocket': return Coins;
      case 'finance_equipment': return Hammer;
      case 'maintenance': return Wrench;
      case 'sparepart_inventory': return Package;
      case 'drivers': return Users;
      case 'reports': return FileBarChart;
      case 'master_hub': return Layers;
      case 'users': return ShieldCheck;
      case 'activity_log': return History;
      default: return Layers;
    }
  };

  const handleOpenAdd = () => {
    setErrorBanner(null);
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      pin: '123456',
      role: 'admin1',
      phone: '',
      status: 'active',
      notes: '',
      allowedTabs: getDefaultModulesForRole('admin1')
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setErrorBanner(null);
    setSelectedUser(user);
    const userModules = normalizeAllowedModules(user.allowedTabs, user.role);

    setFormData({
      name: user.name,
      username: user.username,
      email: user.email,
      password: user.password || '',
      pin: user.pin || '123456',
      role: user.role,
      phone: user.phone || '',
      status: user.status,
      notes: user.notes || '',
      allowedTabs: userModules
    });
    setIsEditModalOpen(true);
  };

  // Quick Manage Modules Modal Open
  const handleOpenQuickModules = (user: UserAccount) => {
    setErrorBanner(null);
    setQuickTargetUser(user);
    setQuickTargetRole(user.role);
    const currentActive = normalizeAllowedModules(user.allowedTabs, user.role);
    setQuickModules(currentActive);
    setIsQuickModulesModalOpen(true);
  };

  const handleSaveQuickModules = () => {
    if (!quickTargetUser) return;
    if (quickModules.length === 0) {
      showError('Minimal 1 modul harus dicentang aktif untuk pengguna ini!');
      return;
    }

    if (quickTargetUser.role === 'owner' && quickTargetRole !== 'owner' && ownerCount <= 1) {
      showError('Sistem harus memiliki minimal 1 akun dengan peran Owner.');
      return;
    }

    const roleMeta = ROLE_DEFINITIONS[quickTargetRole];
    const updated: UserAccount = {
      ...quickTargetUser,
      role: quickTargetRole,
      department:
        quickTargetRole !== quickTargetUser.role
          ? roleMeta?.category || quickTargetUser.department
          : quickTargetUser.department,
      allowedTabs: normalizeAllowedModules(quickModules, quickTargetRole, true)
    };

    onUpdateUser(updated);
    setIsQuickModulesModalOpen(false);
    setQuickTargetUser(null);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
  };

  const toggleModuleInForm = (modId: string) => {
    setFormData(prev => {
      const exists = prev.allowedTabs.includes(modId);
      const updatedTabs = exists
        ? prev.allowedTabs.filter(id => id !== modId)
        : [...prev.allowedTabs, modId];
      return {
        ...prev,
        allowedTabs: normalizeAllowedModules(updatedTabs, prev.role, true)
      };
    });
  };

  const toggleModuleInQuickModal = (modId: string) => {
    setQuickModules(prev => {
      const next = prev.includes(modId)
        ? prev.filter(id => id !== modId)
        : [...prev, modId];
      return normalizeAllowedModules(next, quickTargetRole, true);
    });
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim()) {
      showError('Mohon isi nama lengkap dan username');
      return;
    }

    if (formData.allowedTabs.length === 0) {
      showError('Harap centang minimal satu modul aktif untuk akun ini!');
      return;
    }

    // Check username uniqueness
    const targetUsername = (formData.username || '').trim().toLowerCase();
    const exists = users.some(u => (u.username || '').toLowerCase() === targetUsername);
    if (exists) {
      showError(`Username "${formData.username}" sudah digunakan. Silakan pilih username lain.`);
      return;
    }

    const roleMeta = ROLE_DEFINITIONS[formData.role];
    const newUser: UserAccount = {
      id: 'USR-' + Date.now(),
      name: formData.name.trim(),
      username: targetUsername.replace(/\s+/g, ''),
      email: formData.email.trim() || `${targetUsername.replace(/\s+/g, '')}@translog.id`,
      password: formData.password.trim() || 'admin123',
      pin: formData.pin.trim() || '123456',
      role: formData.role,
      department: roleMeta?.category || 'Operasional',
      allowedTabs: normalizeAllowedModules(formData.allowedTabs, formData.role, true),
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
      showError('Mohon isi nama lengkap dan username');
      return;
    }

    if (formData.allowedTabs.length === 0) {
      showError('Harap centang minimal satu modul aktif untuk akun ini!');
      return;
    }

    // Check username uniqueness excluding current
    const targetUsername = (formData.username || '').trim().toLowerCase();
    const exists = users.some(
      u => u.id !== selectedUser.id && (u.username || '').toLowerCase() === targetUsername
    );
    if (exists) {
      showError(`Username "${formData.username}" sudah digunakan oleh pengguna lain.`);
      return;
    }

    // Prevent changing the last owner to another role
    if (selectedUser.role === 'owner' && formData.role !== 'owner' && ownerCount <= 1) {
      showError('Sistem harus memiliki minimal 1 akun dengan peran Owner.');
      return;
    }

    const roleMeta = ROLE_DEFINITIONS[formData.role];
    const updated: UserAccount = {
      ...selectedUser,
      name: formData.name.trim(),
      username: targetUsername.replace(/\s+/g, ''),
      email: formData.email.trim(),
      password: formData.password.trim() || selectedUser.password,
      pin: formData.pin.trim() || selectedUser.pin,
      role: formData.role,
      department:
        formData.role !== selectedUser.role
          ? roleMeta?.category || selectedUser.department
          : selectedUser.department,
      allowedTabs: normalizeAllowedModules(formData.allowedTabs, formData.role, true),
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
      showError('Akun Owner utama tidak dapat dihapus (minimal 1 Owner harus tetap ada).');
      return;
    }
    if (user.id === currentUserId) {
      showError('Anda sedang login menggunakan akun ini. Silakan berganti akun sebelum menghapus akun ini.');
      return;
    }
    setDeleteConfirmUser(user);
  };

  const handleFastSwitch = (user: UserAccount) => {
    if (user.status === 'inactive') {
      showError('Akun ini sedang berstatus nonaktif. Aktifkan akun terlebih dahulu untuk beralih profil.');
      return;
    }
    onSwitchUser(user);
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 } });
  };

  // Group modules by category for presentation
  const moduleCategories = [
    'Utama',
    'Armada & Lapangan',
    'Operasional & Keuangan',
    'Master Referensi',
    'Keamanan & Akun'
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              Manajemen Akun &amp; Hak Akses Pengguna
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Sistem Centang Modul Aktif
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola akun tim, peran otorisasi, dan centang modul aktif yang dapat dibuka oleh masing-masing pengguna.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onOpenRoleMatrix && (
            <button
              onClick={onOpenRoleMatrix}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium shadow-xs transition cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Matriks Izin Role</span>
            </button>
          )}
          {isOwner ? (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs active:scale-95 transition cursor-pointer"
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
            <div className="text-xs text-slate-500 font-medium">Admin 1 (Ops &amp; Fin)</div>
            <div className="text-lg font-bold text-slate-800">{admin1Count} Akun</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Admin 2 (Armada &amp; Solar)</div>
            <div className="text-lg font-bold text-slate-800">{admin2Count} Akun</div>
          </div>
        </div>
      </div>

      {/* In-app validation / error alert banner */}
      {errorBanner && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-3 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="text-rose-500 hover:text-rose-700 p-1 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Role Explanatory Card with Checklist Note */}
      <div className="bg-gradient-to-r from-slate-50 via-blue-50/40 to-indigo-50/30 p-4 rounded-xl border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-2">
              <span>Sistem Centang Modul Mandiri &amp; Sinkronisasi Hak Akses Peran</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                {SYSTEM_MODULES.length} Modul Terintegrasi
              </span>
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              Setiap modul yang <strong>dicentang aktif</strong> akan otomatis membuka akses menu navigasi sekaligus <strong>mengaktifkan hak input, edit, cetak slip &amp; ekspor laporan</strong> pada modul tersebut sesuai peran yang diharapkan. Seluruh modul memiliki tampilan data terpisah namun saling terintegrasi secara otomatis.
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari pengguna berdasarkan nama, username, email, atau no. HP..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => { setRoleFilter('all'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                roleFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua Role
            </button>
            <button
              onClick={() => { setRoleFilter('owner'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                roleFilter === 'owner' ? 'bg-amber-100 text-amber-900 font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Owner
            </button>
            <button
              onClick={() => { setRoleFilter('admin1'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                roleFilter === 'admin1' ? 'bg-emerald-100 text-emerald-900 font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Admin 1
            </button>
            <button
              onClick={() => { setRoleFilter('admin2'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                roleFilter === 'admin2' ? 'bg-blue-100 text-blue-900 font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Admin 2
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-5">Pengguna &amp; Username</th>
                <th className="py-3 px-5">Peran Sistem</th>
                <th className="py-3 px-5">Centang Modul Aktif</th>
                <th className="py-3 px-5">Kontak</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Tidak ada akun pengguna yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const meta = getRoleMeta(user.role);
                  const Icon = getRoleIcon(user.role);
                  const isCurrentActive = currentUserId ? currentUserId === user.id : currentUserRole === user.role;
                  const activeModulesList = normalizeAllowedModules(user.allowedTabs, user.role);
                  const activeCount = activeModulesList.length;

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

                      {/* Modul Aktif Column with Quick Checklist trigger */}
                      <td className="py-3.5 px-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              activeCount === SYSTEM_MODULES.length
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : activeCount >= 8
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              <CheckSquare className="w-3 h-3 text-blue-600" />
                              <span>{activeCount} dari {SYSTEM_MODULES.length} Modul Aktif</span>
                            </span>
                            {isOwner && (
                              <button
                                type="button"
                                onClick={() => handleOpenQuickModules(user)}
                                className="text-[10px] text-blue-600 hover:text-blue-800 underline font-semibold cursor-pointer"
                                title="Ubah centang modul aktif akun ini"
                              >
                                Ubah Centang
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {activeModulesList.slice(0, 4).map(modId => {
                              const modInfo = SYSTEM_MODULES.find(m => m.id === modId);
                              return (
                                <span
                                  key={modId}
                                  className="px-1.5 py-0.2 rounded bg-slate-100 text-[9px] text-slate-600 font-medium truncate"
                                  title={modInfo?.name || modId}
                                >
                                  {modInfo?.name || modId}
                                </span>
                              );
                            })}
                            {activeCount > 4 && (
                              <button
                                onClick={() => handleOpenQuickModules(user)}
                                className="px-1.5 py-0.2 rounded bg-blue-50 text-[9px] text-blue-700 font-bold hover:bg-blue-100 cursor-pointer"
                              >
                                +{activeCount - 4} modul lainnya
                              </button>
                            )}
                          </div>
                        </div>
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
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              isCurrentActive
                                ? 'bg-slate-100 text-slate-400 cursor-default'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                            }`}
                            title={isCurrentActive ? 'Profil aktif saat ini' : `Beralih ke profil ${user.name}`}
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>{isCurrentActive ? 'Aktif' : 'Beralih'}</span>
                          </button>

                          {/* Quick Manage Modules */}
                          {isOwner && (
                            <button
                              onClick={() => handleOpenQuickModules(user)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition cursor-pointer"
                              title="Centang Modul Aktif"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit Button */}
                          {isOwner && (
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition cursor-pointer"
                              title="Edit Akun Lengkap"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Button */}
                          {isOwner && (
                            <button
                              onClick={() => handleDelete(user)}
                              disabled={user.role === 'owner' && ownerCount <= 1}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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

        {/* Table Pagination with Next / Prev */}
        <TablePagination
          currentPage={currentPage}
          totalItems={totalFiltered}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[3, 5, 10, 20]}
          itemLabel="akun pengguna"
        />
      </div>

      {/* QUICK MANAGE MODULES MODAL */}
      {isQuickModulesModalOpen && quickTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Konfigurasi Role &amp; Centang Modul Aktif: {quickTargetUser.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pilih peran atau centang modul spesifik yang diizinkan untuk akun @{quickTargetUser.username}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickModulesModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Role Selection Preset Bar inside Quick Modal */}
            <div className="px-6 py-3 bg-indigo-50/40 border-b border-slate-200/80 space-y-2">
              <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                <span>Pilih Peran Otorisasi (Otomatis Menyesuaikan Ceklis Modul Sesuai Role):</span>
                <span className="text-[10px] font-semibold text-indigo-700">
                  Role Aktif: {ROLE_DEFINITIONS[quickTargetRole]?.shortLabel}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(['owner', 'admin1', 'admin2'] as UserRole[]).map((r) => {
                  const meta = ROLE_DEFINITIONS[r];
                  const RIcon = getRoleIcon(r);
                  const isSelected = quickTargetRole === r;
                  const defaultCount = getDefaultModulesForRole(r).length;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setQuickTargetRole(r);
                        setQuickModules(getDefaultModulesForRole(r));
                      }}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-white border-blue-600 ring-1 ring-blue-500 shadow-2xs'
                          : 'bg-white/70 border-slate-200 hover:bg-white text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <RIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">{meta.shortLabel}</div>
                          <div className="text-[10px] text-slate-500 truncate">{defaultCount} Modul Standar</div>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions toolbar */}
            <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span>{quickModules.length} dari {SYSTEM_MODULES.length} Modul Terpilih</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuickModules(SYSTEM_MODULES.map(m => m.id))}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 rounded-md font-semibold text-[11px] transition cursor-pointer"
                >
                  ✓ Centang Semua ({SYSTEM_MODULES.length})
                </button>
                <button
                  type="button"
                  onClick={() => setQuickModules(getDefaultModulesForRole(quickTargetRole))}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md font-semibold text-[11px] transition cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Template {quickTargetRole.toUpperCase()}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickModules([])}
                  className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 rounded-md font-semibold text-[11px] transition cursor-pointer"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            {/* Modules Checkbox Grid */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {moduleCategories.map((category) => {
                const categoryModules = SYSTEM_MODULES.filter(m => m.category === category);
                if (categoryModules.length === 0) return null;

                return (
                  <div key={category} className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      {category}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {categoryModules.map((mod) => {
                        const isChecked = quickModules.includes(mod.id);
                        const ModIcon = getModuleIcon(mod.id);

                        return (
                          <div
                            key={mod.id}
                            onClick={() => toggleModuleInQuickModal(mod.id)}
                            className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                              isChecked
                                ? 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-300'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500'
                            }`}
                          >
                            <div className="mt-0.5">
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <ModIcon className={`w-3.5 h-3.5 shrink-0 ${isChecked ? 'text-blue-600' : 'text-slate-400'}`} />
                                <span className={`text-xs font-bold truncate ${isChecked ? 'text-slate-900' : 'text-slate-600'}`}>
                                  {mod.name}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight line-clamp-2">
                                {mod.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Akses modul akan langsung berlaku saat pengguna login / beralih profil.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickModulesModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickModules}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Centang Modul</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Tambah Akun Pengguna Baru</h3>
                  <p className="text-xs text-slate-500">Atur kredensial dan centang modul yang aktif</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-6 space-y-4 overflow-y-auto flex-1">
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
                  Pilih Peran Utama Sistem <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['owner', 'admin1', 'admin2'] as UserRole[]).map((r) => {
                    const meta = ROLE_DEFINITIONS[r];
                    const Icon = getRoleIcon(r);
                    const isSelected = formData.role === r;

                    return (
                      <label
                        key={r}
                        className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-50/60 border-blue-500 ring-1 ring-blue-500'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                            <Icon className="w-4 h-4 text-blue-600" />
                            <span>{meta.shortLabel}</span>
                          </div>
                          <input
                            type="radio"
                            name="userRole"
                            value={r}
                            checked={isSelected}
                            onChange={() => {
                              setFormData({
                                ...formData,
                                role: r,
                                allowedTabs: getDefaultModulesForRole(r)
                              });
                            }}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          {meta.category}
                        </p>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* SISTEM CENTANG MODUL YANG AKTIF */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                      <span>Sistem Centang Modul yang Aktif</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Centang modul yang diizinkan untuk diakses sesuai harapan ({formData.allowedTabs.length} dipilih)
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, allowedTabs: SYSTEM_MODULES.map(m => m.id) })}
                      className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-blue-600 hover:bg-blue-50 cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, allowedTabs: getDefaultModulesForRole(formData.role) })}
                      className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Template Peran
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, allowedTabs: [] })}
                      className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {SYSTEM_MODULES.map((mod) => {
                    const isChecked = formData.allowedTabs.includes(mod.id);
                    const ModIcon = getModuleIcon(mod.id);

                    return (
                      <div
                        key={mod.id}
                        onClick={() => toggleModuleInForm(mod.id)}
                        className={`p-2.5 rounded-lg border transition cursor-pointer flex items-start gap-2.5 ${
                          isChecked
                            ? 'bg-white border-blue-500 shadow-2xs'
                            : 'bg-white/60 border-slate-200 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="mt-0.5">
                          {isChecked ? (
                            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <ModIcon className={`w-3 h-3 ${isChecked ? 'text-blue-600' : 'text-slate-400'}`} />
                            <span className="text-[11px] font-bold text-slate-800 truncate">{mod.name}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{mod.description}</p>
                        </div>
                      </div>
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan / Jabatan Staf
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Staf Operasional Lapangan"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
                >
                  Simpan Akun Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Edit Akun Pengguna &amp; Modul Aktif</h3>
                  <p className="text-xs text-slate-500">Perbarui identitas dan sesuaikan centang modul @{selectedUser.username}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-6 space-y-4 overflow-y-auto flex-1">
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
                    Reset PIN / Password Baru
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['owner', 'admin1', 'admin2'] as UserRole[]).map((r) => {
                    const meta = ROLE_DEFINITIONS[r];
                    const Icon = getRoleIcon(r);
                    const isSelected = formData.role === r;

                    return (
                      <label
                        key={r}
                        className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-50/60 border-blue-500 ring-1 ring-blue-500'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                            <Icon className="w-4 h-4 text-blue-600" />
                            <span>{meta.shortLabel}</span>
                          </div>
                          <input
                            type="radio"
                            name="userRoleEdit"
                            value={r}
                            checked={isSelected}
                            onChange={() =>
                              setFormData({
                                ...formData,
                                role: r,
                                allowedTabs: getDefaultModulesForRole(r)
                              })
                            }
                            className="text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          {meta.category}
                        </p>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* SISTEM CENTANG MODUL YANG AKTIF */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                      <span>Sistem Centang Modul yang Aktif</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Sesuaikan modul yang dapat diakses oleh akun ini ({formData.allowedTabs.length} dari {SYSTEM_MODULES.length} dipilih)
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, allowedTabs: SYSTEM_MODULES.map(m => m.id) })}
                      className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-blue-600 hover:bg-blue-50 cursor-pointer"
                    >
                      Pilih Semua ({SYSTEM_MODULES.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, allowedTabs: getDefaultModulesForRole(formData.role) })}
                      className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Template Peran
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, allowedTabs: [] })}
                      className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {SYSTEM_MODULES.map((mod) => {
                    const isChecked = formData.allowedTabs.includes(mod.id);
                    const ModIcon = getModuleIcon(mod.id);

                    return (
                      <div
                        key={mod.id}
                        onClick={() => toggleModuleInForm(mod.id)}
                        className={`p-2.5 rounded-lg border transition cursor-pointer flex items-start gap-2.5 ${
                          isChecked
                            ? 'bg-white border-blue-500 shadow-2xs'
                            : 'bg-white/60 border-slate-200 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="mt-0.5">
                          {isChecked ? (
                            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <ModIcon className={`w-3 h-3 ${isChecked ? 'text-blue-600' : 'text-slate-400'}`} />
                            <span className="text-[11px] font-bold text-slate-800 truncate">{mod.name}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{mod.description}</p>
                        </div>
                      </div>
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
                >
                  Perbarui Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Hapus Akun Pengguna?</h3>
                <p className="text-xs text-slate-500">
                  Konfirmasi penghapusan akun @{deleteConfirmUser.username}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun pengguna <strong>{deleteConfirmUser.name}</strong> (@{deleteConfirmUser.username}) dari sistem?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteUser(deleteConfirmUser.id);
                  setDeleteConfirmUser(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition cursor-pointer"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
