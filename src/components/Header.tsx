import React, { useState } from 'react';
import { 
  Bell, 
  CloudCheck, 
  FileCode, 
  Truck,
  PlusCircle,
  Menu,
  RotateCw,
  Crown,
  Briefcase,
  UserCheck,
  ChevronDown,
  ShieldCheck,
  Lock,
  LogOut,
  User,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { UserRole, AuthSession, UserAccount } from '../types';
import { getRoleMeta } from '../utils/permissions';

interface HeaderProps {
  onOpenDeployModal: () => void;
  isConnected: boolean;
  lastSyncTime?: string;
  onTriggerSync: () => void;
  isSyncing: boolean;
  onToggleSidebar?: () => void;
  onOpenNotifConfig?: () => void;
  onOpenRoleMatrix?: () => void;
  activeNotifCount?: number;
  userRole?: UserRole;
  onChangeUserRole?: (role: UserRole) => void;
  authSession?: AuthSession | null;
  currentUser?: UserAccount;
  onOpenProfile?: () => void;
  onLockScreen?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDeployModal,
  isConnected,
  onTriggerSync,
  isSyncing,
  onToggleSidebar,
  onOpenNotifConfig,
  onOpenRoleMatrix,
  activeNotifCount = 0,
  userRole = 'owner',
  onChangeUserRole,
  authSession,
  currentUser,
  onOpenProfile,
  onLockScreen,
  onLogout
}) => {
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const effectiveRole = authSession?.userRole || userRole || 'owner';
  const effectiveName = authSession?.userName || currentUser?.name || 'Direksi Utama';

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'owner': return Crown;
      case 'admin1': return Briefcase;
      case 'admin2': return Truck;
      default: return UserCheck;
    }
  };

  const roleMeta = getRoleMeta(effectiveRole);
  const CurrentRoleIcon = getRoleIcon(effectiveRole);

  const roleOptions: { role: UserRole; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { role: 'owner', label: 'Owner / Direktur Utama', desc: 'Kelola 100% semua modul & akun', icon: Crown },
    { role: 'admin1', label: 'Admin 1 (Ops & Keuangan)', desc: 'Kas, perawatan, supir & non-sewa', icon: Briefcase },
    { role: 'admin2', label: 'Admin 2 (Armada & Solar)', desc: 'Kendaraan, pajak, BBM, & timesheet', icon: Truck },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-3 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left side brand */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition touch-manipulation"
            aria-label="Toggle Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-sm sm:text-base lg:text-lg text-slate-800 tracking-tight">
                44S Ops<span className="text-blue-600">_pro</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-1.5 sm:px-2 py-0.5 rounded border border-blue-200/60 hidden xs:inline-block">
                Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden md:block">
              Sistem Manajemen Terpadu Operasional Kendaraan &amp; Rekening Kas
            </p>
          </div>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Owner-only controls: Notification, Sheets Status, Sync, and Deploy Hub */}
        {effectiveRole === 'owner' && (
          <>
            {/* Notification Config / Bell Button */}
            {onOpenNotifConfig && (
              <button
                onClick={onOpenNotifConfig}
                className="relative p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition shadow-2xs touch-manipulation cursor-pointer"
                title="Pengaturan Notifikasi Operasional"
              >
                <Bell className="w-4 h-4" />
                {activeNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                    {activeNotifCount}
                  </span>
                )}
              </button>
            )}

            {/* Apps Script Connection Status Badge */}
            <button
              onClick={onOpenDeployModal}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition border touch-manipulation cursor-pointer ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70'
                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/70'
              }`}
              title="Setup / Buka Google Apps Script (Kode.gs & Index.html)"
            >
              {isConnected ? (
                <>
                  <CloudCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="hidden md:inline font-medium">Sheets</span>
                </>
              ) : (
                <>
                  <FileCode className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="hidden md:inline font-medium">Apps Script</span>
                </>
              )}
            </button>

            {/* Sync Trigger Button */}
            <button
              onClick={onTriggerSync}
              disabled={isSyncing}
              className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 active:scale-95 transition shadow-xs touch-manipulation cursor-pointer"
              title="Sinkronkan dengan Google Spreadsheet"
            >
              <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isSyncing ? 'Sync...' : 'Sync'}</span>
            </button>

            {/* Deploy Hub Modal Button */}
            <button
              onClick={onOpenDeployModal}
              className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 active:scale-95 transition shadow-xs touch-manipulation cursor-pointer"
              title="Buka Deployment Hub"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Deploy Hub</span>
            </button>
          </>
        )}

        {/* User Account & Session Profile Dropdown */}
        <div className="relative ml-1">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition shadow-2xs group cursor-pointer"
            title={`Akun: ${effectiveName} (${roleMeta.shortLabel})`}
          >
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-xs ${
              effectiveRole === 'owner' ? 'bg-gradient-to-tr from-amber-500 to-amber-600' :
              effectiveRole === 'admin1' ? 'bg-gradient-to-tr from-emerald-500 to-teal-600' :
              'bg-gradient-to-tr from-blue-500 to-indigo-600'
            }`}>
              {effectiveName.charAt(0)}
            </div>

            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-800 leading-tight max-w-[130px] truncate">
                {effectiveName}
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${roleMeta.badgeClass}`}>
                  {roleMeta.shortLabel}
                </span>
              </div>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition" />
          </button>

          {/* User Account Menu Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95">
              {/* Account Header */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 mb-1">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-xs ${
                    effectiveRole === 'owner' ? 'bg-amber-600' :
                    effectiveRole === 'admin1' ? 'bg-emerald-600' :
                    'bg-blue-600'
                  }`}>
                    {effectiveName.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-slate-800 text-xs truncate">{effectiveName}</div>
                    <div className="text-[11px] text-slate-500 truncate font-mono">{authSession?.email || currentUser?.email}</div>
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 mt-0.5">
                      <CurrentRoleIcon className="w-3 h-3" />
                      <span>{roleMeta.title}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Actions */}
              <div className="space-y-0.5 py-1">
                {onOpenProfile && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Profil Pengguna &amp; PIN</span>
                  </button>
                )}

                {onOpenRoleMatrix && effectiveRole === 'owner' && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenRoleMatrix();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-500" />
                    <span>Matriks Batasan Hak Akses</span>
                  </button>
                )}

                {/* Role Switcher in User Menu - Only accessible by Owner */}
                {onChangeUserRole && effectiveRole === 'owner' && (
                  <div className="pt-1 border-t border-slate-100 my-1">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Ganti Peran Pengguna (RBAC):
                    </div>
                    {roleOptions.map((opt) => {
                      const OptIcon = opt.icon;
                      const isSel = effectiveRole === opt.role;
                      return (
                        <button
                          key={opt.role}
                          onClick={() => {
                            onChangeUserRole(opt.role);
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
                            isSel ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <OptIcon className="w-3.5 h-3.5" />
                            <span className="text-xs">{opt.label}</span>
                          </div>
                          {isSel && <span className="text-blue-600 text-xs font-bold">&bull;</span>}
                        </button>
                      );
                    })}
                  </div>
                )}

                {onLockScreen && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLockScreen();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 font-medium text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Kunci Layar (Lock Screen)</span>
                  </button>
                )}
              </div>

              {/* Logout Button */}
              {onLogout && (
                <div className="pt-1.5 border-t border-slate-100 mt-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar dari Sistem (Logout)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
