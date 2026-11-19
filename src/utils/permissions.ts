import { UserRole } from '../types';
import {
  Crown,
  Briefcase,
  Truck
} from 'lucide-react';

export interface RolePermissions {
  allowedTabs: string[];
  canAddVehicle: boolean;
  canEditVehicle: boolean;
  canDeleteVehicle: boolean;
  canPayTax: boolean;
  canAddTax: boolean;
  canEditTax: boolean;
  canDeleteTax: boolean;
  canAddFuelLog: boolean;
  canEditFuelLog: boolean;
  canDeleteFuelLog: boolean;
  canAddFinanceTx: boolean;
  canEditFinanceTx: boolean;
  canDeleteFinanceTx: boolean;
  canAddAccount: boolean;
  canEditAccount: boolean;
  canDeleteAccount: boolean;
  canTransferBalance: boolean;
  canManageNonRentalCategory: boolean;
  canManagePaymentMethods: boolean;
  canAddTimesheet: boolean;
  canEditTimesheet: boolean;
  canDeleteTimesheet: boolean;
  canAddMaintenance: boolean;
  canEditMaintenance: boolean;
  canDeleteMaintenance: boolean;
  canAddDriver: boolean;
  canEditDriver: boolean;
  canDeleteDriver: boolean;
  canViewFinancialSummary: boolean;
  canExportData: boolean;
  canConfigureNotifications: boolean;
  canConfigureAppsScript: boolean;
  canManageUsers: boolean;
  canClearActivityLogs: boolean;
}

export interface RoleMeta {
  role: UserRole;
  title: string;
  shortLabel: string;
  category: string;
  badgeClass: string;
  borderClass: string;
  colorHex: string;
  description: string;
  capabilities: string[];
  restrictions: string[];
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleMeta> = {
  owner: {
    role: 'owner',
    title: 'Owner / Direktur Utama',
    shortLabel: 'Owner',
    category: 'Super Admin & Direksi',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    borderClass: 'border-amber-300',
    colorHex: '#d97706',
    description: 'Akses penuh tanpa batasan terhadap seluruh modul: Kendaraan, Pajak, BBM, Timesheet, Keuangan Kas, Perawatan/Bengkel, Supir, Laporan Laba-Rugi, Master Data, dan Manajemen Akun.',
    capabilities: [
      'Akses ke seluruh modul sistem (100% Full Control)',
      'Kelola seluruh data Kendaraan, Pajak & Legalitas, BBM, dan Timesheet',
      'Kelola Arus Kas Operasional, Rekening Bank, Transfer Saldo, & P&L',
      'Kelola SPK Servis Bengkel, Data Pengemudi & Master Data (Metode Pembayaran & Non-Sewa)',
      'Kelola Manajemen Akun Pengguna (Tambah, Edit, Hapus User & Role)',
      'Konfigurasi integrasi Google Apps Script & Notifikasi Telegram/WA',
      'Ekspor seluruh data ke Excel & PDF'
    ],
    restrictions: [
      'Tidak ada batasan hak akses (Super Admin)'
    ]
  },
  admin1: {
    role: 'admin1',
    title: 'Admin 1 (Operasional & Keuangan)',
    shortLabel: 'Admin 1',
    category: 'Operasional & Keuangan',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    borderClass: 'border-emerald-300',
    colorHex: '#059669',
    description: 'Mengelola penuh seluruh Arus Kas Operasional, Rekening/Bank, Perawatan Rutin Bengkel, Data Pengemudi/Supir, Laporan & Analitik, serta Master Data (Metode Pembayaran & Non-Sewa).',
    capabilities: [
      'Kelola Arus Kas Operasional (Tambah, Edit, Hapus Transaksi Kas)',
      'Kelola Rekening Kas & Transfer Saldo Mutasi',
      'Kelola Master Data Metode Pembayaran & Master Pemasukan Non-Sewa',
      'Kelola SPK & Riwayat Perawatan/Servis Bengkel (CRUD)',
      'Kelola Database & SIM Pengemudi (CRUD)',
      'Akses Laporan Laba/Rugi, Analitik Keuangan & Ekspor PDF/Excel',
      'Akses Dasbor Ringkasan Finansial & Operasional'
    ],
    restrictions: [
      'Tidak mengelola modul Kendaraan, Pajak/KIR, Konsumsi Solar, & Time Sheet',
      'Tidak dapat mengelola Manajemen Akun Pengguna (khusus Owner)'
    ]
  },
  admin2: {
    role: 'admin2',
    title: 'Admin 2 (Kendaraan, Pajak, Solar & Timesheet)',
    shortLabel: 'Admin 2',
    category: 'Armada & Lapangan',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    borderClass: 'border-blue-300',
    colorHex: '#2563eb',
    description: 'Mengelola penuh seluruh Data Kendaraan/Armada, Pajak & Legalitas (STNK/KIR), Pencatatan Konsumsi BBM Solar, dan Laporan Time Sheet/Ritase.',
    capabilities: [
      'Kelola Data Armada Kendaraan & Spesifikasi (CRUD)',
      'Kelola Jadwal Pajak, STNK, KIR & Proses Pembayaran (CRUD)',
      'Kelola Catatan Konsumsi BBM Solar & Odometer (CRUD)',
      'Kelola Laporan Time Sheet, Ritase, Rute & Tonase (CRUD)',
      'Ekspor Data Kendaraan, Pajak, BBM & Timesheet ke Excel & PDF',
      'Akses Dasbor Ringkasan Unit Armada'
    ],
    restrictions: [
      'Tidak mengelola Keuangan Kas, Mutasi Rekening, & Master Data',
      'Tidak mengelola SPK Servis Bengkel & Laporan Laba/Rugi',
      'Tidak dapat mengelola Manajemen Akun Pengguna (khusus Owner)'
    ]
  }
};

export const ROLE_PERMISSIONS_MAP: Record<UserRole, RolePermissions> = {
  owner: {
    allowedTabs: [
      'dashboard',
      'vehicles',
      'tax',
      'fuel',
      'timesheet',
      'tripsheet',
      'finance',
      'finance_pocket',
      'finance_equipment',
      'maintenance',
      'sparepart_inventory',
      'drivers',
      'reports',
      'master_hub',
      'users',
      'activity_log'
    ],
    canAddVehicle: true,
    canEditVehicle: true,
    canDeleteVehicle: true,
    canPayTax: true,
    canAddTax: true,
    canEditTax: true,
    canDeleteTax: true,
    canAddFuelLog: true,
    canEditFuelLog: true,
    canDeleteFuelLog: true,
    canAddFinanceTx: true,
    canEditFinanceTx: true,
    canDeleteFinanceTx: true,
    canAddAccount: true,
    canEditAccount: true,
    canDeleteAccount: true,
    canTransferBalance: true,
    canManageNonRentalCategory: true,
    canManagePaymentMethods: true,
    canAddTimesheet: true,
    canEditTimesheet: true,
    canDeleteTimesheet: true,
    canAddMaintenance: true,
    canEditMaintenance: true,
    canDeleteMaintenance: true,
    canAddDriver: true,
    canEditDriver: true,
    canDeleteDriver: true,
    canViewFinancialSummary: true,
    canExportData: true,
    canConfigureNotifications: true,
    canConfigureAppsScript: true,
    canManageUsers: true,
    canClearActivityLogs: true
  },
  admin1: {
    // Admin 1: Operasional dan Keuangan
    allowedTabs: [
      'dashboard',
      'tripsheet',
      'finance',
      'finance_pocket',
      'finance_equipment',
      'maintenance',
      'sparepart_inventory',
      'drivers',
      'reports',
      'master_hub',
      'activity_log'
    ],
    canAddVehicle: false,
    canEditVehicle: false,
    canDeleteVehicle: false,
    canPayTax: false,
    canAddTax: false,
    canEditTax: false,
    canDeleteTax: false,
    canAddFuelLog: false,
    canEditFuelLog: false,
    canDeleteFuelLog: false,
    canAddFinanceTx: true,
    canEditFinanceTx: true,
    canDeleteFinanceTx: true,
    canAddAccount: true,
    canEditAccount: true,
    canDeleteAccount: true,
    canTransferBalance: true,
    canManageNonRentalCategory: true,
    canManagePaymentMethods: true,
    canAddTimesheet: true,
    canEditTimesheet: true,
    canDeleteTimesheet: true,
    canAddMaintenance: true,
    canEditMaintenance: true,
    canDeleteMaintenance: true,
    canAddDriver: true,
    canEditDriver: true,
    canDeleteDriver: true,
    canViewFinancialSummary: true,
    canExportData: true,
    canConfigureNotifications: false,
    canConfigureAppsScript: false,
    canManageUsers: false,
    canClearActivityLogs: false
  },
  admin2: {
    // Admin 2: Kendaraan, Pajak, Konsumsi Solar, Laporan Time Sheet, Trip Sheet & Gudang Sparepart
    allowedTabs: [
      'dashboard',
      'vehicles',
      'tax',
      'fuel',
      'timesheet',
      'tripsheet',
      'sparepart_inventory',
      'master_hub',
      'activity_log'
    ],
    canAddVehicle: true,
    canEditVehicle: true,
    canDeleteVehicle: true,
    canPayTax: true,
    canAddTax: true,
    canEditTax: true,
    canDeleteTax: true,
    canAddFuelLog: true,
    canEditFuelLog: true,
    canDeleteFuelLog: true,
    canAddFinanceTx: false,
    canEditFinanceTx: false,
    canDeleteFinanceTx: false,
    canAddAccount: false,
    canEditAccount: false,
    canDeleteAccount: false,
    canTransferBalance: false,
    canManageNonRentalCategory: false,
    canManagePaymentMethods: false,
    canAddTimesheet: true,
    canEditTimesheet: true,
    canDeleteTimesheet: true,
    canAddMaintenance: true,
    canEditMaintenance: true,
    canDeleteMaintenance: true,
    canAddDriver: false,
    canEditDriver: false,
    canDeleteDriver: false,
    canViewFinancialSummary: false,
    canExportData: true,
    canConfigureNotifications: false,
    canConfigureAppsScript: false,
    canManageUsers: false,
    canClearActivityLogs: false
  }
};

export interface SystemModuleInfo {
  id: string;
  name: string;
  category: 'Utama' | 'Armada & Lapangan' | 'Operasional & Keuangan' | 'Master Referensi' | 'Keamanan & Akun';
  description: string;
  badge: string;
}

export const SYSTEM_MODULES: SystemModuleInfo[] = [
  { id: 'dashboard', name: 'Ringkasan Dasbor', category: 'Utama', description: 'Statistik armada, alert jatuh tempo & kartu KPI utama', badge: 'Utama' },
  { id: 'vehicles', name: 'Kelola Kendaraan', category: 'Armada & Lapangan', description: 'Data armada truk/mobil, nopol, spesifikasi & odometer', badge: 'Armada' },
  { id: 'tax', name: 'Pajak & Legalitas (KIR/STNK)', category: 'Armada & Lapangan', description: 'Pajak 1 thn, ganti plat 5 thn & uji berkala KIR Dishub', badge: 'Legalitas' },
  { id: 'fuel', name: 'Konsumsi BBM Solar', category: 'Armada & Lapangan', description: 'Pencatatan liter, SPBU, biaya BBM & rasio km/liter', badge: 'BBM' },
  { id: 'timesheet', name: 'Laporan Time Sheet', category: 'Armada & Lapangan', description: 'Ritase harian, jam kerja/standby, rute & tonase angkut', badge: 'Ritase' },
  { id: 'tripsheet', name: 'Trip Sheet & Surat Jalan', category: 'Armada & Lapangan', description: 'Surat jalan, instruksi ritase, kargo & integrasi uang saku driver', badge: 'Trip' },
  { id: 'finance', name: 'Buku Kas Operasional', category: 'Operasional & Keuangan', description: 'Pemasukan sewa/non-sewa, pengeluaran wajib nota, rekening & deposit rekanan', badge: 'Kas Umum' },
  { id: 'finance_pocket', name: 'Arus Kas Saku Driver', category: 'Operasional & Keuangan', description: 'Pencairan uang makan, tol, kernet & rekonsiliasi sisa saku supir', badge: 'Saku Driver' },
  { id: 'finance_equipment', name: 'Arus Kas Peralatan', category: 'Operasional & Keuangan', description: 'Belanja terpal, ban, dongkrak, sabuk & perlengkapan kerja armada', badge: 'Peralatan' },
  { id: 'maintenance', name: 'Perawatan Rutin Bengkel', category: 'Operasional & Keuangan', description: 'SPK servis, ganti oli, ban & bengkel luar/internal', badge: 'Servis' },
  { id: 'sparepart_inventory', name: 'Inventory Sparepart (Baru & Bekas)', category: 'Operasional & Keuangan', description: 'Stok gudang sparepart baru (OEM), copotan bekas layak pakai, rekondisi & scrap', badge: 'Gudang' },
  { id: 'drivers', name: 'Data Karyawan Driver & SIM', category: 'Operasional & Keuangan', description: 'Data karyawan supir, NIP, nomor HP, golongan SIM & serah terima', badge: 'Driver' },
  { id: 'reports', name: 'Laporan & Analitik Terpadu', category: 'Operasional & Keuangan', description: 'Laba/rugi, mutasi per perusahaan, rekap biaya armada, ekspor Excel & PDF', badge: 'Laporan' },
  { id: 'master_hub', name: 'Pusat Master Referensi', category: 'Master Referensi', description: 'Master perusahaan deposit, pemasok, staf admin, metode bayar & rekening kas', badge: 'Master' },
  { id: 'users', name: 'Manajemen Akun Pengguna', category: 'Keamanan & Akun', description: 'Kelola akun user, centang modul aktif & otorisasi hak akses', badge: 'Akun' },
  { id: 'activity_log', name: 'Log Audit Aktivitas', category: 'Keamanan & Akun', description: 'Riwayat audit jejak aktivitas & perubahan data sistem', badge: 'Audit' },
];

const VALID_SYSTEM_MODULE_IDS = new Set(SYSTEM_MODULES.map((m) => m.id));

/**
 * Normalizes any allowedTabs array against SYSTEM_MODULES so counts and badges
 * never exceed SYSTEM_MODULES.length or display raw sub-tab IDs.
 */
export const normalizeAllowedModules = (tabs?: string[], role?: UserRole, preserveEmpty = false): string[] => {
  if (!Array.isArray(tabs)) {
    return role ? [...(ROLE_PERMISSIONS_MAP[role]?.allowedTabs || ROLE_PERMISSIONS_MAP.owner.allowedTabs)] : [...ROLE_PERMISSIONS_MAP.owner.allowedTabs];
  }

  if (tabs.length === 0) {
    return preserveEmpty
      ? []
      : role
      ? [...(ROLE_PERMISSIONS_MAP[role]?.allowedTabs || ROLE_PERMISSIONS_MAP.owner.allowedTabs)]
      : [];
  }

  const normalizedSet = new Set<string>();

  for (const rawId of tabs) {
    if (!rawId || typeof rawId !== 'string') continue;
    if (VALID_SYSTEM_MODULE_IDS.has(rawId)) {
      normalizedSet.add(rawId);
    } else if (rawId.startsWith('master_')) {
      normalizedSet.add('master_hub');
    }
  }

  // Upgrade legacy default 12/7/7 tab sets that predated finance_pocket, finance_equipment, tripsheet, sparepart_inventory
  const isLegacyOwnerSet =
    role === 'owner' &&
    tabs.length === 12 &&
    !tabs.includes('finance_pocket') &&
    !tabs.includes('tripsheet');
  if (isLegacyOwnerSet) {
    ROLE_PERMISSIONS_MAP.owner.allowedTabs.forEach((id) => normalizedSet.add(id));
  }

  const isLegacyAdmin1Set =
    role === 'admin1' &&
    tabs.length === 7 &&
    tabs.includes('finance') &&
    !tabs.includes('finance_pocket') &&
    !tabs.includes('tripsheet');
  if (isLegacyAdmin1Set) {
    ROLE_PERMISSIONS_MAP.admin1.allowedTabs.forEach((id) => normalizedSet.add(id));
  }

  const isLegacyAdmin2Set =
    role === 'admin2' &&
    tabs.length === 7 &&
    tabs.includes('vehicles') &&
    !tabs.includes('tripsheet') &&
    !tabs.includes('sparepart_inventory');
  if (isLegacyAdmin2Set) {
    ROLE_PERMISSIONS_MAP.admin2.allowedTabs.forEach((id) => normalizedSet.add(id));
  }

  // Return in canonical SYSTEM_MODULES order
  return SYSTEM_MODULES.map((m) => m.id).filter((id) => normalizedSet.has(id));
};

export const getDefaultModulesForRole = (role: UserRole): string[] => {
  return [...(ROLE_PERMISSIONS_MAP[role]?.allowedTabs || ROLE_PERMISSIONS_MAP.owner.allowedTabs)];
};

/**
 * Helper to read the currently active user's checked modules from localStorage
 * when components call getRolePermissions(userRole) without passing allowedTabs.
 */
const resolveActiveUserAllowedTabs = (role: UserRole, explicitTabs?: string[]): string[] => {
  if (Array.isArray(explicitTabs)) {
    return normalizeAllowedModules(explicitTabs, role, true);
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const sessionRaw = window.localStorage.getItem('fleetops_auth_session_v1');
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        if (session && session.userRole === role && Array.isArray(session.allowedTabs)) {
          return normalizeAllowedModules(session.allowedTabs, role, true);
        }
      }
      const usersRaw = window.localStorage.getItem('fleetops_users_v1');
      if (usersRaw) {
        const users = JSON.parse(usersRaw);
        if (Array.isArray(users)) {
          const matchedUser = users.find((u: any) => u && u.role === role && Array.isArray(u.allowedTabs));
          if (matchedUser) {
            return normalizeAllowedModules(matchedUser.allowedTabs, role, true);
          }
        }
      }
    }
  } catch {
    // fallback to default role permissions
  }
  return getDefaultModulesForRole(role);
};

/**
 * Dynamically computes effective role & action permissions based on the user's role
 * AND their checked active modules (allowedTabs). When a module is checked active,
 * the user is granted full operational CRUD capabilities for that module.
 */
export const getRolePermissions = (role?: string, customAllowedTabs?: string[]): RolePermissions => {
  const safeRole = (role && role in ROLE_PERMISSIONS_MAP ? role : 'owner') as UserRole;
  const base = ROLE_PERMISSIONS_MAP[safeRole] || ROLE_PERMISSIONS_MAP.owner;
  const activeTabs = resolveActiveUserAllowedTabs(safeRole, customAllowedTabs);
  const hasTab = (id: string) => activeTabs.includes(id);

  const hasAnyFinance = hasTab('finance') || hasTab('finance_pocket') || hasTab('finance_equipment');
  const hasAnyTripOrTimesheet = hasTab('timesheet') || hasTab('tripsheet');
  const hasAnyMaintOrInventory = hasTab('maintenance') || hasTab('sparepart_inventory');

  return {
    ...base,
    allowedTabs: activeTabs,
    // Vehicles
    canAddVehicle: hasTab('vehicles'),
    canEditVehicle: hasTab('vehicles'),
    canDeleteVehicle: hasTab('vehicles'),
    // Tax & KIR
    canPayTax: hasTab('tax'),
    canAddTax: hasTab('tax'),
    canEditTax: hasTab('tax'),
    canDeleteTax: hasTab('tax'),
    // Fuel Solar
    canAddFuelLog: hasTab('fuel'),
    canEditFuelLog: hasTab('fuel'),
    canDeleteFuelLog: hasTab('fuel'),
    // Finance, Pocket Money & Equipment Cash
    canAddFinanceTx: hasAnyFinance,
    canEditFinanceTx: hasAnyFinance,
    canDeleteFinanceTx: hasAnyFinance,
    canAddAccount: hasTab('finance') || hasTab('master_hub'),
    canEditAccount: hasTab('finance') || hasTab('master_hub'),
    canDeleteAccount: safeRole === 'owner' || hasTab('finance'),
    canTransferBalance: hasAnyFinance,
    canViewFinancialSummary: hasAnyFinance || hasTab('reports') || safeRole === 'owner',
    // Master References
    canManageNonRentalCategory: hasTab('master_hub') || hasTab('finance'),
    canManagePaymentMethods: hasTab('master_hub') || hasTab('finance'),
    // Timesheet & Trip Sheet
    canAddTimesheet: hasAnyTripOrTimesheet,
    canEditTimesheet: hasAnyTripOrTimesheet,
    canDeleteTimesheet: hasAnyTripOrTimesheet,
    // Maintenance & Sparepart Inventory
    canAddMaintenance: hasAnyMaintOrInventory,
    canEditMaintenance: hasAnyMaintOrInventory,
    canDeleteMaintenance: hasAnyMaintOrInventory,
    // Drivers
    canAddDriver: hasTab('drivers') || hasTab('master_hub'),
    canEditDriver: hasTab('drivers') || hasTab('master_hub'),
    canDeleteDriver: hasTab('drivers') || hasTab('master_hub'),
    // Export & Admin
    canExportData: true,
    canConfigureNotifications: safeRole === 'owner',
    canConfigureAppsScript: safeRole === 'owner',
    canManageUsers: hasTab('users') || safeRole === 'owner',
    canClearActivityLogs: safeRole === 'owner'
  };
};

export const getRoleMeta = (role?: string): RoleMeta => {
  const safeRole = (role && role in ROLE_DEFINITIONS ? role : 'owner') as UserRole;
  return ROLE_DEFINITIONS[safeRole] || ROLE_DEFINITIONS.owner;
};

export const isTabPermitted = (
  roleOrUser?: string | { role?: string; allowedTabs?: string[] },
  tabId?: string,
  userCustomTabs?: string[]
): boolean => {
  if (!tabId) return false;

  const checkAgainstList = (tabs: string[]) => {
    if (tabId.startsWith('master_') && tabs.includes('master_hub')) return true;
    return tabs.includes(tabId);
  };

  // 1. If explicit array provided
  if (Array.isArray(userCustomTabs)) {
    const roleHint =
      typeof roleOrUser === 'string'
        ? (roleOrUser as UserRole)
        : (roleOrUser?.role as UserRole) || 'owner';
    const normalized = normalizeAllowedModules(userCustomTabs, roleHint, true);
    return checkAgainstList(normalized);
  }

  // 2. If object with allowedTabs provided
  if (typeof roleOrUser === 'object' && roleOrUser !== null) {
    const roleHint = ((roleOrUser.role && roleOrUser.role in ROLE_PERMISSIONS_MAP ? roleOrUser.role : 'owner') as UserRole);
    if (Array.isArray(roleOrUser.allowedTabs)) {
      const normalized = normalizeAllowedModules(roleOrUser.allowedTabs, roleHint, true);
      return checkAgainstList(normalized);
    }
    return isTabPermitted(roleHint, tabId);
  }

  const roleStr = typeof roleOrUser === 'string' ? roleOrUser : 'owner';
  const role = (roleStr in ROLE_PERMISSIONS_MAP ? roleStr : 'owner') as UserRole;
  const activeTabs = resolveActiveUserAllowedTabs(role);
  return checkAgainstList(activeTabs);
};


