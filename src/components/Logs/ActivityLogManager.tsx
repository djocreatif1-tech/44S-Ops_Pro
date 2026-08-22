import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Trash2,
  Calendar,
  User,
  Shield,
  Truck,
  FileCheck2,
  Fuel,
  Wallet,
  Wrench,
  Clock,
  Users,
  ShieldCheck,
  Coins,
  Server,
  Plus,
  ChevronDown,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  ArrowRightLeft,
  LogIn,
  RotateCcw,
  Sparkles,
  FileSpreadsheet,
  FileText,
  X,
  Lock,
  Flame
} from 'lucide-react';
import {
  ActivityLog,
  ActivityLogModule,
  ActivityActionType,
  UserRole,
  UserAccount
} from '../../types';
import { formatDateIndo, formatRupiah } from '../../utils/formatters';
import { exportActivityLogsToExcel, exportActivityLogsToPDF } from '../../utils/exportUtils';
import { getRolePermissions, getRoleMeta } from '../../utils/permissions';

interface ActivityLogManagerProps {
  activityLogs: ActivityLog[];
  userRole: UserRole;
  currentUserId?: string;
  users: UserAccount[];
  onAddLog: (log: Omit<ActivityLog, 'id' | 'timestamp'> & { timestamp?: string }) => void;
  onClearLogs?: () => void;
  onOpenRoleMatrix?: () => void;
}

export const ActivityLogManager: React.FC<ActivityLogManagerProps> = ({
  activityLogs = [],
  userRole = 'owner',
  currentUserId,
  users = [],
  onAddLog,
  onClearLogs,
  onOpenRoleMatrix
}) => {
  const safeLogs = Array.isArray(activityLogs) ? activityLogs : [];
  const safeUsers = Array.isArray(users) ? users : [];

  const permissions = getRolePermissions(userRole);
  const roleMeta = getRoleMeta(userRole);

  // Filter States
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  // Modals
  const [selectedLogDetail, setSelectedLogDetail] = useState<ActivityLog | null>(null);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState<boolean>(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState<boolean>(false);
  const [clearConfirmText, setClearConfirmText] = useState<string>('');

  // Manual Log Note Form State
  const [manualNoteData, setManualNoteData] = useState({
    title: '',
    description: '',
    module: 'system' as ActivityLogModule,
    targetName: '',
    badgeType: 'info' as 'success' | 'danger' | 'warning' | 'info' | 'primary'
  });

  // Handle Date Presets
  const applyDatePreset = (preset: 'all' | 'today' | '7days' | '30days') => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      const past = new Date(today);
      past.setDate(today.getDate() - 7);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === '30days') {
      const past = new Date(today);
      past.setDate(today.getDate() - 30);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return safeLogs.filter((log) => {
      if (!log) return false;
      // Keyword search
      if (searchKeyword.trim()) {
        const query = searchKeyword.toLowerCase();
        const matchesTitle = (log.title || '').toLowerCase().includes(query);
        const matchesDesc = (log.description || '').toLowerCase().includes(query);
        const matchesUser = (log.userName || '').toLowerCase().includes(query);
        const matchesTarget = (log.targetName || '').toLowerCase().includes(query);
        const matchesId = (log.id || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesUser && !matchesTarget && !matchesId) {
          return false;
        }
      }

      // Module Filter
      if (selectedModule !== 'all' && log.module !== selectedModule) {
        return false;
      }

      // Action Filter
      if (selectedAction !== 'all' && log.action !== selectedAction) {
        return false;
      }

      // User / Role Filter
      if (selectedUserFilter !== 'all') {
        if (selectedUserFilter.startsWith('role:')) {
          const role = selectedUserFilter.replace('role:', '');
          if (log.userRole !== role) return false;
        } else if (log.userId !== selectedUserFilter) {
          return false;
        }
      }

      // Date Range Filter
      if (startDate || endDate) {
        const ts = log.timestamp || '';
        const logDate = ts.split(' ')[0] || ts.split('T')[0];
        if (startDate && logDate < startDate) return false;
        if (endDate && logDate > endDate) return false;
      }

      return true;
    });
  }, [safeLogs, searchKeyword, selectedModule, selectedAction, selectedUserFilter, startDate, endDate]);

  // Metric Computations
  const totalLogsCount = safeLogs.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogsCount = safeLogs.filter(l => l && (l.timestamp || '').startsWith(todayStr)).length;
  const financeLogsCount = safeLogs.filter(l => l && l.module === 'finance').length;
  const operationalLogsCount = safeLogs.filter(l => l && ['vehicle', 'fuel', 'tax', 'maintenance', 'timesheet'].includes(l.module)).length;

  // Module Icon Helper
  const getModuleIcon = (mod: ActivityLogModule) => {
    switch (mod) {
      case 'vehicle': return Truck;
      case 'tax': return FileCheck2;
      case 'fuel': return Fuel;
      case 'finance': return Wallet;
      case 'maintenance': return Wrench;
      case 'timesheet': return Clock;
      case 'driver': return Users;
      case 'user': return ShieldCheck;
      case 'master_data': return Coins;
      case 'system': return Server;
      default: return History;
    }
  };

  const getModuleLabel = (mod: ActivityLogModule) => {
    switch (mod) {
      case 'vehicle': return 'Armada Kendaraan';
      case 'tax': return 'Pajak & Legalitas';
      case 'fuel': return 'BBM Solar';
      case 'finance': return 'Arus Kas & Keuangan';
      case 'maintenance': return 'Servis & Bengkel';
      case 'timesheet': return 'Time Sheet Supir';
      case 'driver': return 'Data Pengemudi';
      case 'user': return 'Akun & Autentikasi';
      case 'master_data': return 'Master Non-Sewa';
      case 'system': return 'Sistem & Konfigurasi';
      default: return mod;
    }
  };

  const getActionBadge = (action: ActivityActionType) => {
    switch (action) {
      case 'create':
        return { label: 'TAMBAH', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'update':
        return { label: 'UBAH', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'delete':
        return { label: 'HAPUS', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'pay':
        return { label: 'PELUNASAN', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'transfer':
        return { label: 'MUTASI SALDO', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'login':
        return { label: 'LOGIN', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'export':
        return { label: 'EKSPOR', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
      case 'sync':
        return { label: 'SINKRONISASI', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'clear':
        return { label: 'RESET LOG', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'note':
        return { label: 'CATATAN', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: String(action || 'LOG').toUpperCase(), bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const getUserRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return { label: 'OWNER', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'admin1':
        return { label: 'ADMIN 1', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'admin2':
        return { label: 'ADMIN 2', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      default:
        return { label: role, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const handleCreateManualNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNoteData.title.trim() || !manualNoteData.description.trim()) return;

    const activeUser = users.find(u => u.id === currentUserId) || {
      id: 'USR-CURRENT',
      name: roleMeta.title,
      role: userRole,
      department: roleMeta.category
    };

    onAddLog({
      module: manualNoteData.module,
      action: 'note',
      title: manualNoteData.title,
      description: manualNoteData.description,
      targetName: manualNoteData.targetName || 'Catatan Operasional',
      userId: activeUser.id,
      userName: activeUser.name,
      userRole: activeUser.role,
      userDepartment: activeUser.department,
      badgeType: manualNoteData.badgeType
    });

    setManualNoteData({
      title: '',
      description: '',
      module: 'system',
      targetName: '',
      badgeType: 'info'
    });
    setIsAddNoteModalOpen(false);
  };

  const handleConfirmClearLogs = () => {
    if (clearConfirmText.trim().toLowerCase() !== 'hapus log') return;
    if (onClearLogs) {
      onClearLogs();
    }
    setIsClearConfirmOpen(false);
    setClearConfirmText('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                  Log Aktivitas &amp; Audit Trail
                </h1>
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-200/60">
                  {activityLogs.length} Entri
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Rekam jejak komprehensif seluruh transaksi keuangan, armada, perawatan, supir, dan aktivitas staf operasional.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Manual Audit Note */}
          <button
            onClick={() => setIsAddNoteModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catat Log Manual</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={() => exportActivityLogsToExcel(filteredLogs, startDate || endDate ? `${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}` : 'Semua')}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Ekspor daftar log terfilter ke format Microsoft Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Ekspor</span> Excel
          </button>

          {/* Export PDF */}
          <button
            onClick={() => exportActivityLogsToPDF(filteredLogs, startDate || endDate ? `${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}` : 'Semua')}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Cetak audit trail laporan ke format PDF landscape"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Ekspor</span> PDF
          </button>

          {/* Clear Logs (Owner Only) */}
          {permissions.canClearActivityLogs && onClearLogs && (
            <button
              onClick={() => setIsClearConfirmOpen(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Bersihkan riwayat log aktivitas (Khusus Owner)"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
              <span className="hidden md:inline">Reset Log</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium leading-none">Total Log Audit</div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{totalLogsCount}</div>
            <div className="text-[10px] text-blue-600 font-semibold mt-0.5">Semua entri tersimpan</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium leading-none">Aktivitas Hari Ini</div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{todayLogsCount}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">{formatDateIndo(todayStr)}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium leading-none">Mutasi Finansial</div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{financeLogsCount}</div>
            <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Kas, Bank &amp; Pendapatan</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium leading-none">Operasional Armada</div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{operationalLogsCount}</div>
            <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">Solar, Servis, Pajak, Rit</div>
          </div>
        </div>
      </div>

      {/* Filter & Control Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Row 1: Search Bar & View Mode Toggle */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Cari aktivitas, nama supir, nopol armada, pengguna, atau kata kunci..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  viewMode === 'timeline'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tabel Audit
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Deep Dropdown Filters & Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100">
          {/* Module Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Modul Sistem
            </label>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium"
            >
              <option value="all">Semua Modul ({activityLogs.length})</option>
              <option value="finance">Arus Kas &amp; Keuangan</option>
              <option value="vehicle">Armada Kendaraan</option>
              <option value="fuel">Konsumsi Solar BBM</option>
              <option value="tax">Pajak &amp; Legalitas STNK/KIR</option>
              <option value="maintenance">Servis &amp; Bengkel</option>
              <option value="timesheet">Time Sheet Supir</option>
              <option value="driver">Data Pengemudi</option>
              <option value="user">Manajemen Pengguna</option>
              <option value="master_data">Master Non-Sewa</option>
              <option value="system">Sistem &amp; Catatan</option>
            </select>
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Jenis Aksi
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium"
            >
              <option value="all">Semua Aksi</option>
              <option value="create">Tambah Data Baru (Create)</option>
              <option value="update">Perubahan Data (Update)</option>
              <option value="delete">Penghapusan (Delete)</option>
              <option value="pay">Pelunasan Pajak / Biaya</option>
              <option value="transfer">Mutasi / Transfer Saldo</option>
              <option value="login">Sesi Masuk / Ganti User</option>
              <option value="note">Catatan Log Manual</option>
              <option value="sync">Sinkronisasi Spreadsheet</option>
            </select>
          </div>

          {/* User / Role Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Staf / Peran Akun
            </label>
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium"
            >
              <option value="all">Semua Pengguna</option>
              <optgroup label="Peran (Role)">
                <option value="role:owner">Khusus Owner (Direksi)</option>
                <option value="role:admin1">Khusus Admin 1 (Ops &amp; Keuangan)</option>
                <option value="role:admin2">Khusus Admin 2 (Armada &amp; Lapangan)</option>
              </optgroup>
              {users.length > 0 && (
                <optgroup label="Akun Spesifik">
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role.toUpperCase()})</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Date Filter Preset & Range */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Periode Rentang Waktu
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('all');
                }}
                className="w-1/2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 font-medium focus:bg-white focus:outline-none"
                title="Tanggal Mulai"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('all');
                }}
                className="w-1/2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 font-medium focus:bg-white focus:outline-none"
                title="Tanggal Akhir"
              />
            </div>
          </div>
        </div>

        {/* Quick Date Presets & Reset Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Cepat:</span>
            <button
              onClick={() => applyDatePreset('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                datePreset === 'all' && !startDate && !endDate
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Waktu
            </button>
            <button
              onClick={() => applyDatePreset('today')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                datePreset === 'today'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => applyDatePreset('7days')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                datePreset === '7days'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => applyDatePreset('30days')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                datePreset === '30days'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              30 Hari
            </button>
          </div>

          {(searchKeyword || selectedModule !== 'all' || selectedAction !== 'all' || selectedUserFilter !== 'all' || startDate || endDate) && (
            <button
              onClick={() => {
                setSearchKeyword('');
                setSelectedModule('all');
                setSelectedAction('all');
                setSelectedUserFilter('all');
                applyDatePreset('all');
              }}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Semua Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Timeline vs Table */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <History className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tidak Ada Log Aktivitas Ditemukan</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Tidak ada riwayat aktivitas yang cocok dengan kriteria filter saat ini. Coba sesuaikan kata kunci atau atur ulang filter pencarian.
          </p>
          <button
            onClick={() => {
              setSearchKeyword('');
              setSelectedModule('all');
              setSelectedAction('all');
              setSelectedUserFilter('all');
              applyDatePreset('all');
            }}
            className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition"
          >
            Reset Filter
          </button>
        </div>
      ) : viewMode === 'timeline' ? (
        /* TIMELINE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-4 sm:p-6">
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {filteredLogs.map((log) => {
              const ModuleIcon = getModuleIcon(log.module);
              const actionBadge = getActionBadge(log.action);
              const roleBadge = getUserRoleBadge(log.userRole);

              return (
                <div key={log.id} className="relative group">
                  {/* Timeline Icon Dot */}
                  <div className={`absolute -left-6 sm:-left-8 top-1.5 w-6 sm:w-8 h-6 sm:h-8 rounded-full border-2 border-white flex items-center justify-center shadow-xs text-white ${
                    log.badgeType === 'danger' ? 'bg-rose-500' :
                    log.badgeType === 'warning' ? 'bg-amber-500' :
                    log.badgeType === 'success' ? 'bg-emerald-500' :
                    log.badgeType === 'primary' ? 'bg-indigo-600' : 'bg-blue-600'
                  }`}>
                    <ModuleIcon className="w-3 sm:w-4 h-3 sm:h-4" />
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/40 hover:bg-white hover:border-blue-300 hover:shadow-xs transition duration-200 space-y-2.5">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${actionBadge.bg}`}>
                          {actionBadge.label}
                        </span>
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/60">
                          {getModuleLabel(log.module)}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                          {log.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-slate-400 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-600">{log.timestamp}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {log.description}
                    </p>

                    {/* Metadata & User Details Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* User Badge */}
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">
                            {(log.userName || 'U').charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-700 text-[11px]">{log.userName}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${roleBadge.bg}`}>
                            {roleBadge.label}
                          </span>
                        </div>

                        {/* Target Item if exists */}
                        {log.targetName && (
                          <div className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-mono text-[11px] border border-slate-200/60">
                            Target: <span className="font-bold text-slate-800">{log.targetName}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedLogDetail(log)}
                          className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 hover:border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Rincian Payload</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* TABLE AUDIT VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Modul</th>
                  <th className="px-4 py-3">Aksi</th>
                  <th className="px-4 py-3">Judul &amp; Deskripsi</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Pengguna</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const actionBadge = getActionBadge(log.action);
                  const roleBadge = getUserRoleBadge(log.userRole);

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap">
                        {getModuleLabel(log.module)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${actionBadge.bg}`}>
                          {actionBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs sm:max-w-md">
                        <div className="font-bold text-slate-800 truncate">{log.title}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{log.description}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-700 font-semibold text-[11px]">
                        {log.targetName || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{log.userName}</div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${roleBadge.bg}`}>
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLogDetail(log)}
                          className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition"
                          title="Lihat Detail Snapshot"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Rincian Log Audit Trail</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedLogDetail.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Judul Aktivitas</span>
                  <span className="text-xs font-mono font-semibold text-slate-600">{selectedLogDetail.timestamp}</span>
                </div>
                <div className="text-sm font-bold text-slate-900">{selectedLogDetail.title}</div>
                <p className="text-xs text-slate-600">{selectedLogDetail.description}</p>
              </div>

              {/* Staf & Modul Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Pengguna / Aktor</div>
                  <div className="font-bold text-slate-800">{selectedLogDetail.userName}</div>
                  <div className="text-[11px] text-slate-500">
                    Role: <span className="font-semibold uppercase text-blue-600">{selectedLogDetail.userRole}</span>
                  </div>
                  {selectedLogDetail.userDepartment && (
                    <div className="text-[10px] text-slate-400 mt-0.5">{selectedLogDetail.userDepartment}</div>
                  )}
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Modul &amp; Target</div>
                  <div className="font-bold text-slate-800">{getModuleLabel(selectedLogDetail.module)}</div>
                  <div className="text-[11px] text-slate-500">
                    Target: <span className="font-semibold text-slate-700">{selectedLogDetail.targetName || '-'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Aksi: {selectedLogDetail.action.toUpperCase()}</div>
                </div>
              </div>

              {/* JSON Parameters / Payload Details */}
              {selectedLogDetail.details && (
                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Payload / Parameter Perubahan:</div>
                  <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48">
                    <pre>{JSON.stringify(selectedLogDetail.details, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MANUAL AUDIT NOTE MODAL */}
      {isAddNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Catat Log Manual / Insiden Operasional</h3>
                  <p className="text-xs text-slate-400">Dokumentasikan temuan fisik, instruksi pengemudi, atau audit lapangan</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddNoteModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualNote} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Aktivitas / Temuan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualNoteData.title}
                  onChange={(e) => setManualNoteData({ ...manualNoteData, title: e.target.value })}
                  placeholder="Contoh: Pemeriksaan Surat Jalan Fisik di Pool Cakung"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Modul
                  </label>
                  <select
                    value={manualNoteData.module}
                    onChange={(e) => setManualNoteData({ ...manualNoteData, module: e.target.value as ActivityLogModule })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="system">Sistem &amp; Kebijakan</option>
                    <option value="vehicle">Armada Kendaraan</option>
                    <option value="driver">Data Pengemudi</option>
                    <option value="finance">Keuangan &amp; Kas</option>
                    <option value="fuel">Konsumsi Solar</option>
                    <option value="maintenance">Bengkel &amp; Servis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Objek / No. Polisi
                  </label>
                  <input
                    type="text"
                    value={manualNoteData.targetName}
                    onChange={(e) => setManualNoteData({ ...manualNoteData, targetName: e.target.value })}
                    placeholder="Contoh: B 9011 TKN / Pool Pusat"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tingkat Kepentingan / Warna Badge
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'info', label: 'Informasi', class: 'bg-blue-50 text-blue-700 border-blue-200' },
                    { id: 'success', label: 'Sukses', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                    { id: 'warning', label: 'Peringatan', class: 'bg-amber-50 text-amber-700 border-amber-200' },
                    { id: 'danger', label: 'Penting/Kritis', class: 'bg-rose-50 text-rose-700 border-rose-200' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setManualNoteData({ ...manualNoteData, badgeType: lvl.id as any })}
                      className={`p-2 rounded-xl text-xs font-bold border text-center transition ${
                        manualNoteData.badgeType === lvl.id
                          ? `${lvl.class} ring-2 ring-blue-500 shadow-2xs`
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan Rinci &amp; Catatan Tindakan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={manualNoteData.description}
                  onChange={(e) => setManualNoteData({ ...manualNoteData, description: e.target.value })}
                  placeholder="Jelaskan detail pemeriksaan, instruksi, atau temuan operasional..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center gap-2 text-xs text-blue-800">
                <Info className="w-4 h-4 shrink-0 text-blue-600" />
                <span>Log manual akan ditandai dengan identitas akun staf aktif Anda saat ini.</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddNoteModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  Simpan Catatan Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLEAR LOGS CONFIRMATION MODAL */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 p-5 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Bersihkan Riwayat Log Audit?</h3>
              <p className="text-xs text-slate-500">
                Tindakan ini akan menghapus seluruh data rekam jejak aktivitas operasional dari memori lokal.
              </p>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
              <div className="font-bold">Konfirmasi Keamanan (Khusus Owner):</div>
              <p className="text-[11px] text-rose-700">
                Ketik teks <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-rose-300">hapus log</span> di bawah untuk melanjutkan.
              </p>
            </div>

            <input
              type="text"
              value={clearConfirmText}
              onChange={(e) => setClearConfirmText(e.target.value)}
              placeholder="Ketik: hapus log"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-center font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsClearConfirmOpen(false);
                  setClearConfirmText('');
                }}
                className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={clearConfirmText.trim().toLowerCase() !== 'hapus log'}
                onClick={handleConfirmClearLogs}
                className="w-1/2 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                Hapus Semua Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
