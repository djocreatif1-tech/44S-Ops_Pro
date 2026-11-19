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
  CreditCard,
  Landmark,
  Crown,
  Briefcase,
  UserCheck,
  ChevronDown,
  X,
  Lock,
  ShieldCheck,
  History,
  Layers,
  Award,
  Search,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  FileText,
  Building,
  Receipt,
  Package
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
  const [menuSearch, setMenuSearch] = useState('');
  const [isCompactDensity, setIsCompactDensity] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    main: true,
    ops: true,
    master: true,
    admin: true
  });

  const toggleSection = (secKey: string) => {
    setOpenSections(prev => ({
      ...prev,
      [secKey]: !prev[secKey]
    }));
  };

  const navSections = [
    {
      key: 'main',
      title: 'Main Menu',
      badge: '6 Modul',
      items: [
        { id: 'dashboard', label: 'Ringkasan Dasbor', icon: LayoutDashboard },
        { id: 'vehicles', label: 'Kelola Kendaraan', icon: Truck },
        { id: 'tax', label: 'Pajak & Legalitas', icon: FileCheck2 },
        { id: 'fuel', label: 'Konsumsi Solar', icon: Fuel },
        { id: 'timesheet', label: 'Laporan Time Sheet', icon: Clock },
        { id: 'tripsheet', label: 'Trip Sheet & Surat Jalan', icon: FileText, highlight: true },
      ]
    },
    {
      key: 'ops',
      title: 'Operasional & Keuangan',
      badge: '7 Modul',
      items: [
        { id: 'finance', label: 'Buku Kas Operasional', icon: Wallet },
        { id: 'finance_pocket', label: 'Arus Kas Saku Driver', icon: Coins },
        { id: 'finance_equipment', label: 'Arus Kas Peralatan', icon: Wrench },
        { id: 'maintenance', label: 'Perawatan Rutin Bengkel', icon: Wrench },
        { id: 'sparepart_inventory', label: 'Inventory Sparepart (Baru & Bekas)', icon: Package, highlight: true },
        { id: 'drivers', label: 'Data Pengemudi & Supir', icon: Users },
        { id: 'reports', label: 'Laporan & Analitik', icon: FileBarChart },
      ]
    },
    {
      key: 'master',
      title: 'Master Referensi Sistem',
      badge: 'Master & Referensi',
      items: [
        { id: 'master_hub', label: 'Pusat Master & Referensi', icon: Layers, highlight: true },
        { id: 'master_deposit_companies', label: 'Perusahaan Pemberi Deposit', icon: Building },
        { id: 'master_suppliers', label: 'Supplier Peralatan & Part', icon: Wrench },
        { id: 'master_expense_categories', label: 'Jenis Pos Pengeluaran', icon: Receipt },
        { id: 'master_admin_staff', label: 'Karyawan Administrasi', icon: Briefcase },
        { id: 'master_payment_methods', label: 'Metode Pembayaran', icon: CreditCard },
        { id: 'master_company_accounts', label: 'Rekening Perusahaan', icon: Landmark },
        { id: 'master_service_types', label: 'Jenis Servis Bengkel', icon: Wrench },
        { id: 'master_sim_classes', label: 'Golongan SIM Pengemudi', icon: Award },
        { id: 'master_non_rental', label: 'Kategori Non-Sewa', icon: Coins },
      ]
    },
    {
      key: 'admin',
      title: 'Keamanan & Akun',
      badge: 'RBAC',
      items: [
        { id: 'users', label: 'Manajemen Akun Pengguna', icon: ShieldCheck },
        { id: 'activity_log', label: 'Log Audit Aktivitas', icon: History },
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

  // Filter sections and items based on search query
  const q = menuSearch.trim().toLowerCase();
  const filteredNavSections = navSections.map(sec => {
    const matchingItems = sec.items.filter(item => {
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        sec.title.toLowerCase().includes(q)
      );
    });
    return {
      ...sec,
      items: matchingItems
    };
  }).filter(sec => sec.items.length > 0);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Top Header */}
      <div className={`p-3.5 border-b border-slate-100 flex items-center justify-between ${isCollapsed ? 'lg:justify-center' : ''}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <div className="text-xs font-bold text-slate-800 leading-none">44S Ops<span className="text-blue-600">_pro</span></div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">Control Center Enterprise</div>
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
        <div className="p-2.5 border-b border-slate-100 bg-slate-50/50">
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Search & Compact Density Controls (Save Screen Real Estate) */}
      {!isCollapsed && (
        <div className="px-2.5 pt-2 pb-1.5 border-b border-slate-100 flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari menu / modul..."
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-6 py-1 text-[11px] text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white"
            />
            {menuSearch && (
              <button
                onClick={() => setMenuSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={() => setIsCompactDensity(!isCompactDensity)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              isCompactDensity
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'bg-white text-slate-400 border-slate-200 hover:text-slate-700'
            }`}
            title={isCompactDensity ? 'Mode Normal' : 'Mode Ringkas (Hemat Ruang)'}
          >
            {isCompactDensity ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Navigation Sections */}
      <div className={`flex-1 overflow-y-auto ${isCompactDensity ? 'p-1.5 space-y-1.5' : 'p-2.5 space-y-3'}`}>
        {filteredNavSections.map((sec) => {
          const isOpen = openSections[sec.key] !== false;

          return (
            <div key={sec.key} className="space-y-0.5">
              {!isCollapsed && (
                <button
                  type="button"
                  onClick={() => toggleSection(sec.key)}
                  className="w-full px-2 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 transition cursor-pointer group"
                >
                  <span className="truncate">{sec.title}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono px-1 py-0.2 bg-slate-100 rounded text-slate-500 group-hover:bg-slate-200">
                      {sec.badge}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
                  </div>
                </button>
              )}

              {(isOpen || isCollapsed || q) && (
                <div className="space-y-0.5">
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    const isAllowed = isTabPermitted(userRole, item.id, authSession?.allowedTabs);

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id, isAllowed)}
                        className={`w-full flex items-center gap-2.5 rounded-xl text-xs font-medium transition group relative touch-manipulation cursor-pointer ${
                          isCompactDensity ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2 text-xs'
                        } ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                            : isAllowed
                            ? item.highlight
                              ? 'bg-amber-50/80 text-amber-900 hover:bg-amber-100/80 border border-amber-200/60 font-semibold'
                              : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            : 'text-slate-400 bg-slate-50/50 hover:bg-slate-100/50 opacity-60'
                        } ${isCollapsed ? 'justify-center px-2 py-2' : ''}`}
                        title={
                          !isAllowed
                            ? `Terkunci: Role ${roleMeta.shortLabel} tidak memiliki izin ke menu ${item.label}`
                            : item.label
                        }
                      >
                        <Icon
                          className={`shrink-0 transition ${
                            isCompactDensity ? 'w-3.5 h-3.5' : 'w-4 h-4'
                          } ${
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

                        {/* Active Indicator dot */}
                        {isActive && !isCollapsed && (
                          <span className="w-1.5 h-1.5 bg-white rounded-full shrink-0 shadow-xs"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredNavSections.length === 0 && (
          <div className="py-6 text-center text-xs text-slate-400">
            Tidak ada menu yang sesuai &ldquo;{menuSearch}&rdquo;
          </div>
        )}
      </div>

      {/* Bottom User Card & RBAC Guide Link */}
      <div className="p-2.5 border-t border-slate-100 space-y-1.5 bg-slate-50/30">
        {!isCollapsed && authSession && (
          <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0 ${
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
                  className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex gap-1 pt-1 border-t border-slate-100 text-[10px]">
              {onOpenProfile && (
                <button
                  onClick={onOpenProfile}
                  className="flex-1 py-0.5 px-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg font-semibold text-center transition"
                >
                  Profil
                </button>
              )}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex-1 py-0.5 px-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-semibold text-center transition"
                >
                  Keluar
                </button>
              )}
            </div>
          </div>
        )}

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
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
