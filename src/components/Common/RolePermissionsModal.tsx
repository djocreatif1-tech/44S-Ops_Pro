import React, { useState } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Crown,
  Briefcase,
  Truck,
  CheckCircle2,
  XCircle,
  Info,
  Lock,
  ArrowRight
} from 'lucide-react';
import { UserRole } from '../../types';
import { ROLE_DEFINITIONS, getRolePermissions } from '../../utils/permissions';

interface RolePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

export const RolePermissionsModal: React.FC<RolePermissionsModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSelectRole
}) => {
  const [selectedRoleTab, setSelectedRoleTab] = useState<UserRole>(currentRole);

  if (!isOpen) return null;

  const currentMeta = ROLE_DEFINITIONS[selectedRoleTab] || ROLE_DEFINITIONS.owner;

  const allRoles: UserRole[] = [
    'owner',
    'admin1',
    'admin2'
  ];

  const permissionMatrixRows = [
    { label: 'Dasbor & Ringkasan Armada', key: 'dashboard' },
    { label: 'Kelola & Tambah Kendaraan', key: 'vehicles_add' },
    { label: 'Edit & Hapus Unit Armada', key: 'vehicles_delete' },
    { label: 'Pajak, STNK & KIR (Input/Bayar/Edit)', key: 'tax_pay' },
    { label: 'Pencatatan & Edit Log BBM Solar', key: 'fuel_add' },
    { label: 'Timesheet, Ritase & Tonase (CRUD)', key: 'timesheet_add' },
    { label: 'Arus Kas Keuangan Operasional (CRUD)', key: 'finance_crud' },
    { label: 'Master Pemasukan Non-Sewa (CRUD)', key: 'master_non_rental' },
    { label: 'Tambah & Kelola Rekening Bank (CRUD)', key: 'accounts_manage' },
    { label: 'Transfer & Mutasi Antar Rekening', key: 'balance_transfer' },
    { label: 'Input SPK & Catatan Servis Bengkel (CRUD)', key: 'maintenance_crud' },
    { label: 'Kelola Data & SIM Pengemudi (CRUD)', key: 'drivers_crud' },
    { label: 'Laporan Laba/Rugi & Analitik', key: 'reports_view' },
    { label: 'Manajemen Akun Pengguna (User CRUD)', key: 'user_management' },
    { label: 'Ekspor Data ke Excel & PDF', key: 'export_data' },
    { label: 'Setup Apps Script & Notifikasi', key: 'system_config' }
  ];

  const getMatrixCheck = (role: UserRole, rowKey: string): boolean => {
    const perms = getRolePermissions(role);
    switch (rowKey) {
      case 'dashboard':
        return perms.allowedTabs.includes('dashboard');
      case 'vehicles_add':
        return perms.canAddVehicle;
      case 'vehicles_delete':
        return perms.canDeleteVehicle;
      case 'tax_pay':
        return perms.canPayTax;
      case 'fuel_add':
        return perms.canAddFuelLog;
      case 'timesheet_add':
        return perms.canAddTimesheet;
      case 'finance_crud':
        return perms.canAddFinanceTx;
      case 'master_non_rental':
        return perms.canManageNonRentalCategory;
      case 'accounts_manage':
        return perms.canAddAccount;
      case 'balance_transfer':
        return perms.canTransferBalance;
      case 'maintenance_crud':
        return perms.canAddMaintenance;
      case 'drivers_crud':
        return perms.canAddDriver;
      case 'reports_view':
        return perms.canViewFinancialSummary && perms.allowedTabs.includes('reports');
      case 'user_management':
        return perms.canManageUsers;
      case 'export_data':
        return perms.canExportData;
      case 'system_config':
        return perms.canConfigureAppsScript;
      default:
        return false;
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'owner': return Crown;
      case 'admin1': return Briefcase;
      case 'admin2': return Truck;
      default: return Shield;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                Hak Akses &amp; Batasan 3 Peran Pengguna (RBAC)
              </h2>
              <p className="text-xs text-slate-500">
                1. Owner (Semua Modul) &bull; 2. Admin 1 (Operasional &amp; Keuangan) &bull; 3. Admin 2 (Kendaraan, Pajak, Solar, Timesheet)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Tabs & Details */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 3 Role Selection Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {allRoles.map((r) => {
              const meta = ROLE_DEFINITIONS[r];
              const Icon = getRoleIcon(r);
              const isActive = selectedRoleTab === r;
              const isCurrent = currentRole === r;

              return (
                <button
                  key={r}
                  onClick={() => setSelectedRoleTab(r)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition ${
                    isActive
                      ? 'bg-white shadow-xs text-slate-900 font-bold'
                      : 'text-slate-600 hover:bg-white/60 font-medium'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? meta.badgeClass : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate flex items-center gap-1.5">
                      <span>{meta.title}</span>
                      {isCurrent && (
                        <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded font-bold">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{meta.category}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Role Detail Box */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${currentMeta.badgeClass}`}>
                  {currentMeta.title}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {currentMeta.category}
                </span>
              </div>

              {currentRole === 'owner' && currentRole !== selectedRoleTab && (
                <button
                  onClick={() => {
                    onSelectRole(selectedRoleTab);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <span>Simulasikan Peran Ini</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {currentMeta.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Capabilities */}
              <div className="space-y-2 bg-white/80 p-3.5 rounded-xl border border-slate-200/70">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Fitur &amp; Wewenang yang Dapat Dikelola:</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 pl-1">
                  {currentMeta.capabilities.map((cap, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold shrink-0">&bull;</span>
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Restrictions */}
              <div className="space-y-2 bg-white/80 p-3.5 rounded-xl border border-slate-200/70">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Batasan Hak Akses:</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 pl-1">
                  {currentMeta.restrictions.map((res, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold shrink-0">&bull;</span>
                      <span>{res}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Full Matrix Comparison Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Matriks Perbandingan Hak Akses 3 Peran
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                Centang hijau = memiliki izin akses penuh (CRUD)
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase">
                      <th className="py-2.5 px-4">Fitur / Modul Operasional</th>
                      {allRoles.map((r) => {
                        const meta = ROLE_DEFINITIONS[r];
                        const isCurrent = currentRole === r;
                        return (
                          <th key={r} className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <span>{meta.shortLabel}</span>
                              {isCurrent && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {permissionMatrixRows.map((row) => (
                      <tr key={row.key} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-4 font-medium text-slate-700">
                          {row.label}
                        </td>
                        {allRoles.map((r) => {
                          const hasAccess = getMatrixCheck(r, row.key);
                          return (
                            <td key={r} className="py-2.5 px-3 text-center">
                              {hasAccess ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                              ) : (
                                <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Peran Anda saat ini: <strong className="text-slate-800">{ROLE_DEFINITIONS[currentRole]?.title}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition"
          >
            Tutup Matriks
          </button>
        </div>
      </div>
    </div>
  );
};
