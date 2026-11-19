import React, { useState } from 'react';
import {
  Bell,
  Sliders,
  FileWarning,
  Wrench,
  Fuel,
  ChevronRight,
  CheckCircle2,
  X
} from 'lucide-react';
import { AppNotification } from '../../types';

interface NotificationCenterPanelProps {
  notifications: AppNotification[];
  onNavigateTab: (tab: string) => void;
  onOpenNotifConfig: () => void;
  onClose: () => void;
}

export const NotificationCenterPanel: React.FC<NotificationCenterPanelProps> = ({
  notifications = [],
  onNavigateTab,
  onOpenNotifConfig,
  onClose
}) => {
  const [selectedNotifFilter, setSelectedNotifFilter] = useState<'all' | 'tax' | 'service' | 'fuel'>('all');

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const filteredNotifications = safeNotifications.filter((n) => {
    if (selectedNotifFilter === 'all') return true;
    return n.category === selectedNotifFilter;
  });

  const taxNotifCount = safeNotifications.filter((n) => n.category === 'tax').length;
  const serviceNotifCount = safeNotifications.filter((n) => n.category === 'service').length;
  const fuelNotifCount = safeNotifications.filter((n) => n.category === 'fuel').length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold relative shadow-2xs">
            <Bell className="w-4 h-4" />
            {safeNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                {safeNotifications.length}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">Pusat Notifikasi &amp; Pengingat Operasional</h3>
              <span className="bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Real-time Monitoring
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pajak STNK/KIR, batas KM servis rutin &amp; konsumsi BBM solar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onOpenNotifConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Atur Notifikasi</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition cursor-pointer"
            title="Sembunyikan Pusat Notifikasi"
            aria-label="Tutup Pusat Notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs for Notifications */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `Semua (${safeNotifications.length})` },
          { id: 'tax', label: `Pajak & KIR (${taxNotifCount})` },
          { id: 'service', label: `Servis Rutin (${serviceNotifCount})` },
          { id: 'fuel', label: `BBM Solar (${fuelNotifCount})` }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedNotifFilter(tab.id as typeof selectedNotifFilter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              selectedNotifFilter === tab.id
                ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification Items List */}
      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {filteredNotifications.map((notif) => {
          const isHigh = notif.severity === 'high';
          const isMed = notif.severity === 'medium';

          return (
            <div
              key={notif.id}
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                isHigh
                  ? 'bg-rose-50/60 border-rose-200/80 text-rose-900'
                  : isMed
                  ? 'bg-amber-50/60 border-amber-200/80 text-amber-900'
                  : 'bg-blue-50/40 border-blue-200/60 text-slate-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    isHigh
                      ? 'bg-rose-100 text-rose-600'
                      : isMed
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  {notif.category === 'tax' ? (
                    <FileWarning className="w-4 h-4" />
                  ) : notif.category === 'service' ? (
                    <Wrench className="w-4 h-4" />
                  ) : (
                    <Fuel className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-800">{notif.title}</h4>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.2 rounded uppercase ${
                        isHigh ? 'bg-rose-600 text-white' : isMed ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
                      }`}
                    >
                      {isHigh ? 'MENDESAK' : isMed ? 'PERHATIAN' : 'INFO'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
                </div>
              </div>

              {notif.actionTab && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab(notif.actionTab!);
                    onClose();
                  }}
                  className={`self-start sm:self-center px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-2xs transition flex items-center gap-1 shrink-0 cursor-pointer ${
                    isHigh
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : isMed
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <span>{notif.actionLabel || 'Tindak Lanjuti'}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {filteredNotifications.length === 0 && (
          <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-1.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <p className="text-xs font-medium text-slate-700">Semua operasional dalam batas aman</p>
            <p className="text-[11px] text-slate-400">
              Tidak ada pengingat mendesak untuk kategori yang dipilih saat ini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
