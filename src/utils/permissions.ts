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
    description: 'Akses penuh tanpa batasan terhadap seluruh modul: Kendaraan, Pajak, BBM, Timesheet, Keuangan Kas, Perawatan/Bengkel, Supir, Laporan Laba-Rugi, dan Manajemen Akun.',
    capabilities: [
      'Akses ke seluruh modul sistem (100% Full Control)',
      'Kelola seluruh data Kendaraan, Pajak & Legalitas, BBM, dan Timesheet',
      'Kelola Arus Kas Operasional, Rekening Bank, Transfer Saldo, & P&L',
      'Kelola SPK Servis Bengkel, Data Pengemudi & Master Non-Sewa',
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
    description: 'Mengelola penuh seluruh Arus Kas Operasional, Rekening/Bank, Perawatan Rutin Bengkel, Data Pengemudi/Supir, Laporan & Analitik, serta Master Pemasukan Non-Sewa.',
    capabilities: [
      'Kelola Arus Kas Operasional (Tambah, Edit, Hapus Transaksi Kas)',
      'Kelola Rekening Kas & Transfer Saldo Mutasi',
      'Kelola Master Kategori Pemasukan Non-Sewa',
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
      'Tidak mengelola Keuangan Kas, Mutasi Rekening, & Master Non-Sewa',
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
      'finance',
      'maintenance',
      'drivers',
      'reports',
      'master_non_rental',
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
      'finance',
      'maintenance',
      'drivers',
      'reports',
      'master_non_rental',
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
    canAddTimesheet: false,
    canEditTimesheet: false,
    canDeleteTimesheet: false,
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
    // Admin 2: Kendaraan, Pajak, Konsumsi Solar, Laporan Time Sheet
    allowedTabs: [
      'dashboard',
      'vehicles',
      'tax',
      'fuel',
      'timesheet',
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
    canAddTimesheet: true,
    canEditTimesheet: true,
    canDeleteTimesheet: true,
    canAddMaintenance: false,
    canEditMaintenance: false,
    canDeleteMaintenance: false,
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

export const getRolePermissions = (role?: string): RolePermissions => {
  const safeRole = (role && role in ROLE_PERMISSIONS_MAP ? role : 'owner') as UserRole;
  return ROLE_PERMISSIONS_MAP[safeRole] || ROLE_PERMISSIONS_MAP.owner;
};

export const getRoleMeta = (role?: string): RoleMeta => {
  const safeRole = (role && role in ROLE_DEFINITIONS ? role : 'owner') as UserRole;
  return ROLE_DEFINITIONS[safeRole] || ROLE_DEFINITIONS.owner;
};

export const isTabPermitted = (role?: string, tabId?: string): boolean => {
  if (!tabId) return false;
  const perms = getRolePermissions(role);
  return perms.allowedTabs.includes(tabId);
};
