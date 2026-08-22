import React, { useState } from 'react';
import {
  Truck,
  FileWarning,
  Fuel,
  Wallet,
  Clock,
  Wrench,
  AlertTriangle,
  ChevronRight,
  ArrowUpRight,
  Sliders,
  Bell,
  Building2,
  Banknote,
  CreditCard,
  CheckCircle2,
  Info,
  Calendar,
  AlertCircle,
  History
} from 'lucide-react';
import {
  Vehicle,
  TaxRecord,
  FuelLog,
  OperationalFinance,
  DriverTimesheet,
  MaintenanceRecord,
  FinancialAccount,
  NotificationConfig,
  ActivityLog
} from '../../types';
import {
  formatRupiah,
  formatNumber,
  formatDateIndo,
  getTaxDueBadgeInfo
} from '../../utils/formatters';
import { generateAppNotifications } from '../../utils/notificationEngine';

interface DashboardOverviewProps {
  vehicles: Vehicle[];
  taxes: TaxRecord[];
  fuelLogs: FuelLog[];
  finances: OperationalFinance[];
  timesheets: DriverTimesheet[];
  maintenance: MaintenanceRecord[];
  accounts: FinancialAccount[];
  notifConfig: NotificationConfig;
  activityLogs?: ActivityLog[];
  onNavigateTab: (tab: string) => void;
  onSelectVehicleForDetail: (vehicle: Vehicle) => void;
  onOpenNotifConfig: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  vehicles = [],
  taxes = [],
  fuelLogs = [],
  finances = [],
  timesheets = [],
  maintenance = [],
  accounts = [],
  notifConfig,
  activityLogs = [],
  onNavigateTab,
  onSelectVehicleForDetail,
  onOpenNotifConfig
}) => {
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const safeTaxes = Array.isArray(taxes) ? taxes : [];
  const safeFuelLogs = Array.isArray(fuelLogs) ? fuelLogs : [];
  const safeFinances = Array.isArray(finances) ? finances : [];
  const safeTimesheets = Array.isArray(timesheets) ? timesheets : [];
  const safeMaintenance = Array.isArray(maintenance) ? maintenance : [];
  const safeAccounts = Array.isArray(accounts) ? accounts : [];

  const [selectedNotifFilter, setSelectedNotifFilter] = useState<'all' | 'tax' | 'service' | 'fuel'>('all');

  // Dynamic Notification Generation based on user configuration
  const notifications = generateAppNotifications(safeVehicles, safeTaxes, safeMaintenance, safeFuelLogs, notifConfig);
  const filteredNotifications = (notifications || []).filter(n => {
    if (selectedNotifFilter === 'all') return true;
    return n.category === selectedNotifFilter;
  });

  const taxNotifCount = (notifications || []).filter(n => n.category === 'tax').length;
  const serviceNotifCount = (notifications || []).filter(n => n.category === 'service').length;
  const fuelNotifCount = (notifications || []).filter(n => n.category === 'fuel').length;

  // Vehicle Status Counts
  const activeVehicles = safeVehicles.filter(v => v.status === 'active').length;
  const maintenanceVehicles = safeVehicles.filter(v => v.status === 'maintenance').length;

  // Total Solar Metrics
  const totalFuelLiters = safeFuelLogs.reduce((sum, item) => sum + (item.volumeLiters || 0), 0);
  const totalFuelCost = safeFuelLogs.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  const avgFuelEfficiency = safeFuelLogs.length > 0
    ? (safeFuelLogs.reduce((sum, item) => sum + (item.calculatedKmPerLiter || 0), 0) / safeFuelLogs.length).toFixed(2)
    : '0';

  // Financial Metrics
  const totalIncome = safeFinances
    .filter(f => f.type === 'income')
    .reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalOperationalExpense = safeFinances
    .filter(f => f.type === 'expense')
    .reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalServiceCost = safeMaintenance.reduce((sum, m) => sum + (m.totalCost || 0), 0);
  const totalExpenses = totalOperationalExpense + totalFuelCost + totalServiceCost;
  const netOperationalMargin = totalIncome - totalExpenses;
  const totalLiquidity = safeAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  // Timesheet Metrics
  const totalTrips = safeTimesheets.reduce((sum, t) => sum + (t.tripCount || 1), 0);
  const totalKmTravelled = safeTimesheets.reduce((sum, t) => sum + (t.totalDistanceKm || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. NOTIFICATION & ALERT CENTER (DAPAT DIKONFIGURASI OLEH PENGGUNA) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold relative shadow-2xs">
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                  {notifications.length}
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
              onClick={onOpenNotifConfig}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>Atur Notifikasi</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs for Notifications */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: `Semua (${notifications.length})` },
            { id: 'tax', label: `Pajak & KIR (${taxNotifCount})` },
            { id: 'service', label: `Servis Rutin (${serviceNotifCount})` },
            { id: 'fuel', label: `BBM Solar (${fuelNotifCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedNotifFilter(tab.id as typeof selectedNotifFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
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
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    isHigh
                      ? 'bg-rose-100 text-rose-600'
                      : isMed
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
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
                      <span className={`text-[9px] font-bold px-2 py-0.2 rounded uppercase ${
                        isHigh ? 'bg-rose-600 text-white' : isMed ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
                      }`}>
                        {isHigh ? 'MENDESAK' : isMed ? 'PERHATIAN' : 'INFO'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
                  </div>
                </div>

                {notif.actionTab && (
                  <button
                    onClick={() => onNavigateTab(notif.actionTab!)}
                    className={`self-start sm:self-center px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-2xs transition flex items-center gap-1 shrink-0 ${
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
              <p className="text-[11px] text-slate-400">Tidak ada pengingat mendesak untuk kategori yang dipilih saat ini.</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. RINGKASAN AKUN SALDO REKENING & KAS (NEW REQUIREMENT) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Likuiditas Saldo Rekening &amp; Kas Operasional</h4>
              <p className="text-[11px] text-slate-400">Total Saldo Tersedia: <span className="font-mono font-bold text-blue-600">{formatRupiah(totalLiquidity)}</span></p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('finance')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Kelola Rekening &amp; Kas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {accounts.map((acc) => {
            const isBank = acc.accountType === 'bank';
            const isCash = acc.accountType === 'cash';

            return (
              <div
                key={acc.id}
                onClick={() => onNavigateTab('finance')}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-blue-200 hover:shadow-xs transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-700 truncate">{acc.accountName}</span>
                  <div className={`p-1 rounded text-[10px] ${isBank ? 'bg-blue-100 text-blue-700' : isCash ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {isBank ? <Building2 className="w-3 h-3" /> : isCash ? <Banknote className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                  </div>
                </div>
                <p className="text-sm font-bold font-mono text-slate-800">{formatRupiah(acc.currentBalance)}</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">{acc.bankOrProvider} &bull; {acc.accountNumber}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. EXECUTIVE KPI CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Armada */}
        <div 
          onClick={() => onNavigateTab('vehicles')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Total Armada</p>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-2">
            {vehicles.length} <span className="text-sm font-normal text-slate-400">Unit</span>
          </h3>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200/60">
              {activeVehicles} Beroperasi
            </span>
            <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
              {maintenanceVehicles} Servis
            </span>
          </div>
        </div>

        {/* Card 2: Konsumsi Solar */}
        <div 
          onClick={() => onNavigateTab('fuel')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Konsumsi Solar (MTD)</p>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-2">
            {formatNumber(totalFuelLiters)} <span className="text-sm font-normal text-slate-400">Liter</span>
          </h3>
          <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: '68%' }}></div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span>{formatRupiah(totalFuelCost)}</span>
            <span className="text-emerald-700 font-semibold">{avgFuelEfficiency} Km/L</span>
          </div>
        </div>

        {/* Card 3: Arus Kas Operasional */}
        <div 
          onClick={() => onNavigateTab('finance')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Laba Operasional Bersih</p>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <h3 className={`text-2xl font-bold mt-2 truncate ${netOperationalMargin >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
            {formatRupiah(netOperationalMargin)}
          </h3>
          <div className="mt-4 flex items-center justify-between text-[10px]">
            <span className="text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200/60">
              +{formatRupiah(totalIncome)}
            </span>
            <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60">
              -{formatRupiah(totalExpenses)}
            </span>
          </div>
        </div>

        {/* Card 4: Timesheet & Efisiensi */}
        <div 
          onClick={() => onNavigateTab('timesheet')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Ritase &amp; Jarak Tempuh</p>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-2">
            {totalTrips} <span className="text-sm font-normal text-slate-400">Ritase</span>
          </h3>
          <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span>{formatNumber(totalKmTravelled)} KM Total</span>
            <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
              {activeVehicles} Unit Jalan
            </span>
          </div>
        </div>
      </div>

      {/* 4. TWO COLUMNS: VEHICLE MONITORING & RECENT FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Unit Armada Status & Timesheet */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Unit Armada */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Status &amp; Telemetri Armada</h4>
                <p className="text-xs text-slate-400 mt-0.5">Monitoring kondisi unit dan odometer terkini</p>
              </div>
              <button
                onClick={() => onNavigateTab('vehicles')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                Lihat Semua ({vehicles.length}) <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {vehicles.slice(0, 5).map((vehicle) => {
                const tax1Badge = getTaxDueBadgeInfo(vehicle.stnk1YearDate);
                const kirBadge = getTaxDueBadgeInfo(vehicle.kirDate);

                return (
                  <div
                    key={vehicle.id}
                    onClick={() => onSelectVehicleForDetail(vehicle)}
                    className="p-3.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-100 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-bold shrink-0 shadow-2xs">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-800 tracking-tight">{vehicle.nopol}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            vehicle.status === 'active'
                              ? 'bg-green-50 text-green-700 border border-green-200/60'
                              : vehicle.status === 'maintenance'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                          }`}>
                            {vehicle.status === 'active' ? 'AKTIF' : vehicle.status === 'maintenance' ? 'SERVICE' : 'STANDBY'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {vehicle.brand} {vehicle.model} &bull; Driver: <span className="text-slate-600 font-medium">{vehicle.assignedDriver || '-'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs sm:self-center">
                      <div className="text-right hidden sm:block">
                        <p className="font-mono font-bold text-slate-800">{formatNumber(vehicle.currentOdometer)} KM</p>
                        <p className="text-[10px] text-slate-400">Odometer</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {tax1Badge.status === 'urgent' || tax1Badge.status === 'overdue' ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60">
                            STNK: {tax1Badge.label}
                          </span>
                        ) : null}

                        {kirBadge.status === 'urgent' || kirBadge.status === 'overdue' ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200/60">
                            KIR: {kirBadge.label}
                          </span>
                        ) : null}

                        <div className="p-1 text-slate-400 group-hover:text-blue-600">
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timesheet Terkini */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Status Time Sheet &amp; Operasional</h4>
                <p className="text-xs text-slate-400 mt-0.5">Log perjalanan dan ritase pengiriman hari ini</p>
              </div>
              <button
                onClick={() => onNavigateTab('timesheet')}
                className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Pengemudi</th>
                    <th className="px-5 py-3">No. Polisi</th>
                    <th className="px-5 py-3">Rute Operasional</th>
                    <th className="px-5 py-3">Muatan</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100">
                  {timesheets.slice(0, 5).map((ts) => (
                    <tr key={ts.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5 font-medium text-slate-700">{ts.driverName}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">{ts.nopol}</td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {ts.originLocation} &rarr; {ts.destinationLocation}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {ts.cargoDescription} ({ts.cargoTonnageTon}T)
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          ts.status === 'completed'
                            ? 'bg-green-50 text-green-700 border border-green-200/60'
                            : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                        }`}>
                          {ts.status === 'completed' ? 'SELESAI' : 'AKTIF'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Reports & Log */}
        <div className="flex flex-col gap-6">
          {/* Laporan Ringkasan */}
          <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-xs">
            <h4 className="text-sm font-bold mb-1">Ringkasan Biaya Operasional</h4>
            <p className="text-[10px] opacity-80 mb-3">Total Pengeluaran Bulan Ini</p>
            <div className="text-xl sm:text-2xl font-bold mb-4">{formatRupiah(totalExpenses)}</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[11px] border-b border-white/20 pb-1.5">
                <span className="opacity-90">Solar &amp; BBM</span>
                <span className="font-semibold">{formatRupiah(totalFuelCost)}</span>
              </div>
              <div className="flex justify-between text-[11px] border-b border-white/20 pb-1.5">
                <span className="opacity-90">Operasional / Uang Jalan</span>
                <span className="font-semibold">{formatRupiah(totalOperationalExpense)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="opacity-90">Servis &amp; Sparepart</span>
                <span className="font-semibold">{formatRupiah(totalServiceCost)}</span>
              </div>
            </div>
          </div>

          {/* Log BBM Singkat */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-800">Pengisian Solar Terakhir</h4>
              <button
                onClick={() => onNavigateTab('fuel')}
                className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Log Lengkap
              </button>
            </div>
            <div className="space-y-2.5">
              {fuelLogs.slice(0, 3).map((fl) => (
                <div key={fl.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{fl.nopol}</span>
                    <p className="text-[10px] text-slate-400">{formatDateIndo(fl.date)} &bull; {fl.volumeLiters}L</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-700">{formatRupiah(fl.totalCost)}</p>
                    <span className="text-[10px] text-emerald-600 font-semibold">{fl.calculatedKmPerLiter} Km/L</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Log Feed Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <History className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Aktivitas Terkini</h4>
              </div>
              <button
                onClick={() => onNavigateTab('activity_log')}
                className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span>Semua Log</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {activityLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  onClick={() => onNavigateTab('activity_log')}
                  className="p-2.5 bg-slate-50/70 hover:bg-blue-50/50 hover:border-blue-200 rounded-xl border border-slate-100 transition cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      log.badgeType === 'danger' ? 'bg-rose-100 text-rose-700' :
                      log.badgeType === 'warning' ? 'bg-amber-100 text-amber-800' :
                      log.badgeType === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {log.action.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {log.timestamp.split(' ')[1] || log.timestamp}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 truncate">{log.title}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="truncate">{log.userName}</span>
                    <span className="font-mono text-slate-500 font-medium">{log.targetName || ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
