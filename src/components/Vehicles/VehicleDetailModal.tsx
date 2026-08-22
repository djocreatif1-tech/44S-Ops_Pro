import React, { useState } from 'react';
import {
  X,
  Truck,
  FileCheck2,
  Fuel,
  Wallet,
  Clock,
  Wrench,
  Gauge,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import {
  Vehicle,
  TaxRecord,
  FuelLog,
  OperationalFinance,
  DriverTimesheet,
  MaintenanceRecord
} from '../../types';
import {
  formatRupiah,
  formatNumber,
  formatDateIndo,
  getTaxDueBadgeInfo,
  getVehicleStatusBadge
} from '../../utils/formatters';

interface VehicleDetailModalProps {
  vehicle: Vehicle | null;
  taxes: TaxRecord[];
  fuelLogs: FuelLog[];
  finances: OperationalFinance[];
  timesheets: DriverTimesheet[];
  maintenance: MaintenanceRecord[];
  onClose: () => void;
  onEditVehicle?: (vehicle: Vehicle) => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  vehicle,
  taxes = [],
  fuelLogs = [],
  finances = [],
  timesheets = [],
  maintenance = [],
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'fuel' | 'maintenance' | 'finance' | 'timesheet' | 'tax'>('overview');

  if (!vehicle) return null;

  const safeTaxes = Array.isArray(taxes) ? taxes : [];
  const safeFuelLogs = Array.isArray(fuelLogs) ? fuelLogs : [];
  const safeFinances = Array.isArray(finances) ? finances : [];
  const safeTimesheets = Array.isArray(timesheets) ? timesheets : [];
  const safeMaintenance = Array.isArray(maintenance) ? maintenance : [];

  // Filter unit-specific data
  const unitTaxes = safeTaxes.filter(t => t && (t.vehicleId === vehicle.id || t.nopol === vehicle.nopol));
  const unitFuelLogs = safeFuelLogs.filter(f => f && (f.vehicleId === vehicle.id || f.nopol === vehicle.nopol));
  const unitFinances = safeFinances.filter(f => f && (f.vehicleId === vehicle.id || f.nopol === vehicle.nopol));
  const unitTimesheets = safeTimesheets.filter(t => t && (t.vehicleId === vehicle.id || t.nopol === vehicle.nopol));
  const unitMaintenance = safeMaintenance.filter(m => m && (m.vehicleId === vehicle.id || m.nopol === vehicle.nopol));

  // Unit Stats
  const unitFuelCost = unitFuelLogs.reduce((sum, f) => sum + (f.totalCost || 0), 0);
  const unitFuelLiters = unitFuelLogs.reduce((sum, f) => sum + (f.volumeLiters || 0), 0);
  const avgKmPerL = unitFuelLogs.length > 0
    ? (unitFuelLogs.reduce((sum, f) => sum + (f.calculatedKmPerLiter || 0), 0) / unitFuelLogs.length).toFixed(2)
    : '0';

  const unitIncome = unitFinances.filter(f => f.type === 'income').reduce((sum, f) => sum + (f.amount || 0), 0);
  const unitExpenseOps = unitFinances.filter(f => f.type === 'expense').reduce((sum, f) => sum + (f.amount || 0), 0);
  const unitServiceCost = unitMaintenance.reduce((sum, m) => sum + (m.totalCost || 0), 0);
  const unitTotalCost = unitExpenseOps + unitFuelCost + unitServiceCost;
  const unitNetProfit = unitIncome - unitTotalCost;

  const totalKmRun = unitTimesheets.reduce((sum, t) => sum + (t.totalDistanceKm || 0), 0);
  const totalTrips = unitTimesheets.reduce((sum, t) => sum + (t.tripCount || 0), 0);

  const statusBadge = getVehicleStatusBadge(vehicle.status);
  const stnk1Badge = getTaxDueBadgeInfo(vehicle.stnk1YearDate);
  const stnk5Badge = getTaxDueBadgeInfo(vehicle.stnk5YearDate);
  const kirBadge = getTaxDueBadgeInfo(vehicle.kirDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs shrink-0">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight font-mono">{vehicle.nopol}</h2>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBadge.badgeClass}`}>
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
                {vehicle.brand} {vehicle.model} &bull; {vehicle.type} ({vehicle.year}) &bull; Driver: <span className="font-semibold text-slate-700">{vehicle.assignedDriver || '-'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-3 sm:px-6 border-b border-slate-100 flex gap-1 sm:gap-2 overflow-x-auto bg-slate-50">
          {[
            { id: 'overview', label: 'Ringkasan Unit', icon: Truck },
            { id: 'tax', label: `Pajak & KIR (${unitTaxes.length})`, icon: FileCheck2 },
            { id: 'fuel', label: `BBM Solar (${unitFuelLogs.length})`, icon: Fuel },
            { id: 'maintenance', label: `Riwayat Servis (${unitMaintenance.length})`, icon: Wrench },
            { id: 'finance', label: `Arus Kas (${unitFinances.length})`, icon: Wallet },
            { id: 'timesheet', label: `Timesheet (${unitTimesheets.length})`, icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-2.5 sm:py-3 px-2.5 sm:px-3.5 text-xs font-medium border-b-2 transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap touch-manipulation ${
                  isActive
                    ? 'border-blue-600 text-blue-700 font-semibold bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Unit Quick Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <p className="text-xs text-blue-600 font-semibold">Odometer Terkini</p>
                  <p className="text-xl font-bold font-mono text-slate-800 mt-1">{formatNumber(vehicle.currentOdometer)} KM</p>
                  <p className="text-[10px] text-slate-400 mt-1">Bio Solar / Target: {vehicle.targetKmPerLiter} Km/L</p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-semibold">Konsumsi BBM Solar</p>
                  <p className="text-xl font-bold font-mono text-slate-800 mt-1">{formatNumber(unitFuelLiters)} L</p>
                  <p className="text-[10px] text-slate-500 mt-1">{formatRupiah(unitFuelCost)} &bull; {avgKmPerL} Km/L</p>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                  <p className="text-xs text-indigo-600 font-semibold">Laba Operasional Unit</p>
                  <p className={`text-xl font-bold font-mono mt-1 ${unitNetProfit >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                    {formatRupiah(unitNetProfit)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Pendapatan: {formatRupiah(unitIncome)}</p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                  <p className="text-xs text-amber-600 font-semibold">Total Ritase &amp; Jarak</p>
                  <p className="text-xl font-bold font-mono text-slate-800 mt-1">{totalTrips} Rit</p>
                  <p className="text-[10px] text-slate-400 mt-1">{formatNumber(totalKmRun)} KM Tercatat</p>
                </div>
              </div>

              {/* Vehicle Specs & Legal Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Spesifikasi Kendaraan</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs divide-y divide-slate-100">
                    <div className="pt-2"><span className="text-slate-400">Nomor Rangka:</span> <p className="font-mono font-medium text-slate-700">{vehicle.chassisNumber || '-'}</p></div>
                    <div className="pt-2"><span className="text-slate-400">Nomor Mesin:</span> <p className="font-mono font-medium text-slate-700">{vehicle.engineNumber || '-'}</p></div>
                    <div className="pt-2"><span className="text-slate-400">Kapasitas Muatan:</span> <p className="font-medium text-slate-700">{vehicle.capacityTon} Ton</p></div>
                    <div className="pt-2"><span className="text-slate-400">Bahan Bakar:</span> <p className="font-medium text-slate-700">{vehicle.fuelType}</p></div>
                    <div className="pt-2"><span className="text-slate-400">Driver Ditugaskan:</span> <p className="font-medium text-slate-700">{vehicle.assignedDriver || '-'}</p></div>
                    <div className="pt-2"><span className="text-slate-400">Kontak Driver:</span> <p className="font-mono text-slate-700">{vehicle.driverPhone || '-'}</p></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Status Dokumen &amp; Legalitas</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div>
                        <span className="font-medium text-slate-700">Pajak Tahunan STNK</span>
                        <p className="text-[10px] text-slate-400">Jatuh tempo: {vehicle.stnk1YearDate ? formatDateIndo(vehicle.stnk1YearDate) : '-'}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${stnk1Badge.badgeClass}`}>
                        {stnk1Badge.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div>
                        <span className="font-medium text-slate-700">Uji KIR Dishub</span>
                        <p className="text-[10px] text-slate-400">Jatuh tempo: {vehicle.kirDate ? formatDateIndo(vehicle.kirDate) : '-'}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${kirBadge.badgeClass}`}>
                        {kirBadge.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div>
                        <span className="font-medium text-slate-700">STNK 5 Tahunan &amp; Plat</span>
                        <p className="text-[10px] text-slate-400">Jatuh tempo: {vehicle.stnk5YearDate ? formatDateIndo(vehicle.stnk5YearDate) : '-'}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${stnk5Badge.badgeClass}`}>
                        {stnk5Badge.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAX TAB */}
          {activeTab === 'tax' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Jenis Pajak</th>
                    <th className="px-4 py-3">Jatuh Tempo</th>
                    <th className="px-4 py-3">Nominal Pajak</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unitTaxes.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{t.documentType}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDateIndo(t.dueDate)}</td>
                      <td className="px-4 py-3 font-mono font-medium text-slate-700">{formatRupiah(t.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {t.status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {unitTaxes.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-6 text-slate-400">Belum ada riwayat pajak untuk unit ini.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* FUEL TAB */}
          {activeTab === 'fuel' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Pengemudi</th>
                    <th className="px-4 py-3">SPBU / Lokasi</th>
                    <th className="px-4 py-3">Volume (L)</th>
                    <th className="px-4 py-3">Total Biaya</th>
                    <th className="px-4 py-3">Efisiensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unitFuelLogs.map(fl => (
                    <tr key={fl.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-700">{formatDateIndo(fl.date)}</td>
                      <td className="px-4 py-3 text-slate-600">{fl.driverName}</td>
                      <td className="px-4 py-3 text-slate-600">{fl.fuelStation}</td>
                      <td className="px-4 py-3 font-mono">{fl.volumeLiters} L</td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">{formatRupiah(fl.totalCost)}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{fl.calculatedKmPerLiter} Km/L</td>
                    </tr>
                  ))}
                  {unitFuelLogs.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-6 text-slate-400">Belum ada log pengisian BBM untuk unit ini.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* MAINTENANCE TAB */}
          {activeTab === 'maintenance' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Tanggal &amp; SPK</th>
                    <th className="px-4 py-3">Bengkel</th>
                    <th className="px-4 py-3">Kategori Servis</th>
                    <th className="px-4 py-3">Odometer</th>
                    <th className="px-4 py-3">Total Biaya</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unitMaintenance.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-700">{formatDateIndo(m.serviceDate)} <span className="block text-[10px] text-slate-400">{m.workOrderNumber}</span></td>
                      <td className="px-4 py-3 text-slate-600">{m.workshopName}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{m.serviceType}</td>
                      <td className="px-4 py-3 font-mono">{formatNumber(m.odometerAtService)} KM</td>
                      <td className="px-4 py-3 font-mono font-semibold text-rose-600">{formatRupiah(m.totalCost)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          {m.status === 'completed' ? 'SELESAI' : 'PROSES'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {unitMaintenance.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-6 text-slate-400">Belum ada riwayat perawatan servis untuk unit ini.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* FINANCE TAB */}
          {activeTab === 'finance' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Deskripsi</th>
                    <th className="px-4 py-3">Jenis</th>
                    <th className="px-4 py-3">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unitFinances.map(fin => (
                    <tr key={fin.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-700">{formatDateIndo(fin.date)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{fin.category}</td>
                      <td className="px-4 py-3 text-slate-600">{fin.description}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${fin.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {fin.type === 'income' ? 'PEMASUKAN' : 'PENGELUARAN'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-mono font-bold ${fin.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {fin.type === 'income' ? '+' : '-'}{formatRupiah(fin.amount)}
                      </td>
                    </tr>
                  ))}
                  {unitFinances.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-6 text-slate-400">Belum ada transaksi arus kas khusus unit ini.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TIMESHEET TAB */}
          {activeTab === 'timesheet' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Pengemudi</th>
                    <th className="px-4 py-3">Rute Operasional</th>
                    <th className="px-4 py-3">Muatan</th>
                    <th className="px-4 py-3">Ritase &amp; Jarak</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unitTimesheets.map(ts => (
                    <tr key={ts.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-700">{formatDateIndo(ts.date)}</td>
                      <td className="px-4 py-3 text-slate-700 font-semibold">{ts.driverName}</td>
                      <td className="px-4 py-3 text-slate-600">{ts.originLocation} &rarr; {ts.destinationLocation}</td>
                      <td className="px-4 py-3 text-slate-600">{ts.cargoDescription} ({ts.cargoTonnageTon} Ton)</td>
                      <td className="px-4 py-3 font-mono">{ts.tripCount} Rit ({ts.totalDistanceKm} KM)</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${ts.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                          {ts.status === 'completed' ? 'SELESAI' : 'BERJALAN'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {unitTimesheets.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-6 text-slate-400">Belum ada log timesheet untuk unit ini.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            ID: <span className="font-mono">{vehicle.id}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition touch-manipulation"
          >
            Tutup Detail
          </button>
        </div>
      </div>
    </div>
  );
};
