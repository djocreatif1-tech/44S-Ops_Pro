import React, { useState } from 'react';
import {
  LayoutDashboard,
  Truck,
  FileCheck2,
  Fuel,
  Wallet,
  Clock,
  Wrench,
  Users,
  FileBarChart,
  ChevronLeft,
  ChevronRight,
  Coins,
  Crown,
  Shield,
  Briefcase,
  UserCheck,
  ChevronDown,
  X,
  Lock,
  ShieldCheck,
  History,
  LogOut,
  User,
  KeyRound
} from 'lucide-react';
import { UserRole, AuthSession } from '../types';
import { getRoleMeta, isTabPermitted } from '../utils/permissions';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  userRole: UserRole;
  onChangeUserRole: (role: UserRole) => void;
  onOpenRoleMatrix?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  authSession?: AuthSession | null;
  onLogout?: () => void;
  onLockScreen?: () => void;
  onOpenProfile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed = false,
  onToggleCollapse,
  userRole,
  onChangeUserRole,
  onOpenRoleMatrix,
  isMobileOpen = false,
  onCloseMobile,
  authSession,
  onLogout,
  onLockScreen,
  onOpenProfile
}) => {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const navSections = [
    {
      title: 'Main Menu',
      items: [
        { id: 'dashboard', label: 'Ringkasan Dasbor', icon: LayoutDashboard },
        { id: 'vehicles', label: 'Kelola Kendaraan', icon: Truck },
        { id: 'tax', label: 'Pajak & Legalitas', icon: FileCheck2 },
        { id: 'fuel', label: 'Konsumsi Solar', icon: Fuel },
        { id: 'timesheet', label: 'Laporan Time Sheet', icon: Clock },
      ]
    },
    {
      title: 'Operasional & Keuangan',
      items: [
        { id: 'finance', label: 'Arus Kas Operasional', icon: Wallet },
        { id: 'maintenance', label: 'Perawatan Rutin', icon: Wrench },
        { id: 'drivers', label: 'Data Pengemudi', icon: Users },
        { id: 'reports', label: 'Laporan & Analitik', icon: FileBarChart },
      ]
    },
    {
      title: 'Master Data & Pengguna',
      items: [
        { id: 'master_non_rental', label: 'Master Pemasukan Non-Sewa', icon: Coins, highlight: true },
        { id: 'users', label: 'Manajemen Akun', icon: ShieldCheck },
        { id: 'activity_log', label: 'Log Aktivitas', icon: History },
      ]
    }
  ];

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'owner': return Crown;
      case 'admin1': return Briefcase;
      case 'admin2': return Truck;
      default: return UserCheck;
    }
  };

  const roleMeta = getRoleMeta(userRole);
  const RoleIcon = getRoleIcon(userRole);

  const rolesList: { role: UserRole; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { role: 'owner', label: 'Owner / Direktur Utama', desc: 'Akses penuh seluruh 100% modul sistem & akun', icon: Crown },
    { role: 'admin1', label: 'Admin 1 (Ops & Keuangan)', desc: 'Kelola kas, perawatan, supir, laporan & non-sewa', icon: Briefcase },
    { role: 'admin2', label: 'Admin 2 (Armada & Solar)', desc: 'Kelola kendaraan, pajak/KIR, BBM solar, & timesheet', icon: Truck }
  ];

  const handleItemClick = (id: string, isAllowed: boolean) => {
    if (!isAllowed) {
      if (onOpenRoleMatrix) onOpenRoleMatrix();
      return;
    }
    onSelectTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Top Section / Title Info */}
      <div className={`p-4 border-b border-slate-100 flex items-center justify-between ${isCollapsed ? 'lg:justify-center' : ''}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <Truck className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div>
              <div className="text-xs font-bold text-slate-800 leading-none">Fleet Operations</div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">Control Center</div>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role Display / Switcher in Sidebar */}
      {!isCollapsed && (
        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            {userRole === 'owner' ? (
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="w-full p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-400 transition flex items-center justify-between text-left cursor-pointer"
                title="Ganti Peran Pengguna (Khusus Owner)"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs bg-amber-600">
                    <RoleIcon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-[11px] font-bold text-slate-800 truncate leading-tight flex items-center gap-1">
                      <span>{roleMeta.title}</span>
                    </div>
                    <div className="text-[9px] text-slate-500 font-medium truncate leading-tight">
                      {roleMeta.category}
                    </div>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
              </button>
            ) : (
              <div className="w-full p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-2 text-left">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs ${
                  userRole === 'admin1' ? 'bg-emerald-600' : 'bg-blue-600'
                }`}>
                  <RoleIcon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-[11px] font-bold text-slate-800 truncate leading-tight flex items-center gap-1">
                    <span>{roleMeta.title}</span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-medium truncate leading-tight">
                    {roleMeta.category}
                  </div>
                </div>
              </div>
            )}

            {/* Dropdown Menu - Only for Owner */}
            {isRoleDropdownOpen && userRole === 'owner' && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Ganti Peran Pengguna</span>
                  {onOpenRoleMatrix && (
                    <button
                      onClick={() => {
                        setIsRoleDropdownOpen(false);
                        onOpenRoleMatrix();
                      }}
                      className="text-blue-600 hover:text-blue-800 text-[10px] font-bold"
                    >
                      Matriks RBAC
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto space-y-0.5">
                  {rolesList.map((r) => {
                    const RIcon = r.icon;
                    const isSelected = userRole === r.role;
                    return (
                      <button
                        key={r.role}
                        onClick={() => {
                          onChangeUserRole(r.role);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left p-1.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer ${
                          isSelected ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <RIcon className="w-3.5 h-3.5 shrink-0" />
                          <div className="truncate">
                            <div className="leading-tight font-semibold truncate">{r.label}</div>
                            <div className="text-[9px] text-slate-400 font-normal truncate">{r.desc}</div>
                          </div>
                        </div>
                        {isSelected && <span className="text-blue-600 font-bold">&bull;</span>}
                      </button>
                    );
                  })}
                </div>

                {onOpenRoleMatrix && (
                  <div className="pt-1.5 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setIsRoleDropdownOpen(false);
                        onOpenRoleMatrix();
                      }}
                      className="w-full py-1 text-[10px] text-slate-600 hover:text-blue-600 font-semibold text-center flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ShieldCheck className="w-3 h-3 text-blue-600" />
                      <span>Pelajari Batasan Setiap Role</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {navSections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {sec.title}
              </div>
            )}
            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const isAllowed = isTabPermitted(userRole, item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id, isAllowed)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition group relative touch-manipulation cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : isAllowed
                      ? item.highlight
                        ? 'bg-amber-50/70 text-amber-900 hover:bg-amber-100/70 border border-amber-200/50'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                      : 'text-slate-400 bg-slate-50/50 hover:bg-slate-100/50 opacity-60'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                  title={
                    !isAllowed
                      ? `Terkunci: Role ${roleMeta.shortLabel} tidak memiliki izin ke menu ${item.label}`
                      : item.label
                  }
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition ${
                      isActive
                        ? 'text-white'
                        : isAllowed
                        ? item.highlight
                          ? 'text-amber-600'
                          : 'text-slate-500 group-hover:text-slate-800'
                        : 'text-slate-400'
                    }`}
                  />
                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1 truncate">
                      <span className="truncate">{item.label}</span>
                      {!isAllowed && (
                        <Lock className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                      )}
                    </div>
                  )}

                  {/* Active Indicator bar */}
                  {isActive && !isCollapsed && (
                    <span className="w-1 h-3.5 bg-white/70 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom User Card & RBAC Guide Link */}
      <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/30">
        {!isCollapsed && authSession && (
          <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs ${
                  userRole === 'owner' ? 'bg-amber-600' :
                  userRole === 'admin1' ? 'bg-emerald-600' :
                  'bg-blue-600'
                }`}>
                  {(authSession.userName || 'U').charAt(0)}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-800 truncate leading-tight">
                    {authSession.userName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {roleMeta.shortLabel}
                  </div>
                </div>
              </div>

              {onLockScreen && (
                <button
                  onClick={onLockScreen}
                  title="Kunci Layar"
                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex gap-1 pt-1 border-t border-slate-100 text-[10px]">
              {onOpenProfile && (
                <button
                  onClick={onOpenProfile}
                  className="flex-1 py-1 px-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg font-semibold text-center transition"
                >
                  Profil
                </button>
              )}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex-1 py-1 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-semibold text-center transition"
                >
                  Keluar
                </button>
              )}
            </div>
          </div>
        )}

        {!isCollapsed && onOpenRoleMatrix && userRole === 'owner' && (
          <button
            onClick={onOpenRoleMatrix}
            className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 text-slate-700 hover:text-blue-700 transition flex items-center justify-between text-xs font-semibold group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Matriks Hak Akses</span>
            </div>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
              RBAC
            </span>
          </button>
        )}

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!isCollapsed && <span>Ciutkan Menu</span>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:block h-[calc(100vh-4rem)] border-r border-slate-200 transition-all duration-300 ${
          isCollapsed ? 'w-18' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-over with Backdrop) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
