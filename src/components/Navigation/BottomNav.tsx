import React from 'react';
import {
  LayoutDashboard,
  Truck,
  Wallet,
  FileCheck2,
  Menu,
  Clock,
  Fuel,
  Wrench,
  Coins
} from 'lucide-react';
import { UserRole } from '../../types';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenMenu: () => void;
  activeNotifCount?: number;
  userRole?: UserRole;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenMenu,
  activeNotifCount = 0,
  userRole = 'owner'
}) => {
  const getNavItems = () => {
    switch (userRole) {
      case 'finance':
        return [
          { id: 'dashboard', label: 'Dasbor', icon: LayoutDashboard },
          { id: 'finance', label: 'Keuangan', icon: Wallet },
          { id: 'master_non_rental', label: 'Non-Sewa', icon: Coins },
          { id: 'tax', label: 'Pajak/KIR', icon: FileCheck2 },
        ];
      case 'dispatcher':
        return [
          { id: 'dashboard', label: 'Dasbor', icon: LayoutDashboard },
          { id: 'timesheet', label: 'Timesheet', icon: Clock },
          { id: 'vehicles', label: 'Armada', icon: Truck },
          { id: 'fuel', label: 'BBM Solar', icon: Fuel },
        ];
      case 'mechanic':
        return [
          { id: 'dashboard', label: 'Dasbor', icon: LayoutDashboard },
          { id: 'maintenance', label: 'Bengkel', icon: Wrench },
          { id: 'vehicles', label: 'Armada', icon: Truck },
          { id: 'fuel', label: 'BBM Log', icon: Fuel },
        ];
      case 'driver':
      case 'operator':
        return [
          { id: 'dashboard', label: 'Dasbor', icon: LayoutDashboard },
          { id: 'timesheet', label: 'Timesheet', icon: Clock },
          { id: 'fuel', label: 'BBM Solar', icon: Fuel },
          { id: 'vehicles', label: 'Armada', icon: Truck },
        ];
      case 'admin':
      case 'owner':
      default:
        return [
          { id: 'dashboard', label: 'Dasbor', icon: LayoutDashboard },
          { id: 'vehicles', label: 'Armada', icon: Truck },
          { id: 'finance', label: 'Keuangan', icon: Wallet },
          { id: 'tax', label: 'Pajak/KIR', icon: FileCheck2 },
        ];
    }
  };

  const navItems = getNavItems();
  const isMenuOtherActive = !navItems.map(n => n.id).includes(currentTab);

  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]"
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all active:scale-95 touch-manipulation ${
                isActive
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div
                className={`relative p-1 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight truncate mt-0.5">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* 5th Tab: Menu & Modul Lainnya */}
        <button
          type="button"
          onClick={onOpenMenu}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all active:scale-95 touch-manipulation ${
            isMenuOtherActive
              ? 'text-purple-600 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div
            className={`relative p-1 rounded-lg transition-colors ${
              isMenuOtherActive ? 'bg-purple-50 text-purple-600' : 'text-slate-500'
            }`}
          >
            <Menu className="w-5 h-5" />
            {activeNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[8px] flex items-center justify-center font-bold">
                {activeNotifCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight truncate mt-0.5">
            Semua Menu
          </span>
        </button>
      </div>
    </nav>
  );
};
