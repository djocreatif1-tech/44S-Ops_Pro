import React, { useState } from 'react';
import {
  FileBarChart,
  Printer,
  Download,
  Calendar,
  Fuel,
  Wrench,
  Wallet
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
  formatNumber
} from '../../utils/formatters';

interface ReportsAnalyticsProps {
  vehicles: Vehicle[];
  taxes: TaxRecord[];
  fuelLogs: FuelLog[];
  finances: OperationalFinance[];
  timesheets: DriverTimesheet[];
  maintenance: MaintenanceRecord[];
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({
  vehicles = [],
  taxes = [],
  fuelLogs = [],
  finances = [],
  timesheets = [],
  maintenance = []
}) => {
  const [selectedMonth, setSelectedMonth] = useState('2026-08');

  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const safeTaxes = Array.isArray(taxes) ? taxes : [];
  const safeFuelLogs = Array.isArray(fuelLogs) ? fuelLogs : [];
  const safeFinances = Array.isArray(finances) ? finances : [];
  const safeTimesheets = Array.isArray(timesheets) ? timesheets : [];
  const safeMaintenance = Array.isArray(maintenance) ? maintenance : [];

  // Aggregated totals
  const totalFuelLiters = safeFuelLogs.reduce((sum, f) => sum + (f.volumeLiters || 0), 0);
  const totalFuelExpense = safeFuelLogs.reduce((sum, f) => sum + (f.totalCost || 0), 0);

  const totalOpsExpense = safeFinances.filter(f => f.type === 'expense').reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalServiceExpense = safeMaintenance.reduce((sum, m) => sum + (m.totalCost || 0), 0);
  const totalTaxExpense = safeTaxes.filter(t => t.status === 'paid').reduce((sum, t) => sum + (t.amount || 0), 0);
  
  const grandTotalExpenses = totalFuelExpense + totalOpsExpense + totalServiceExpense + totalTaxExpense;
  const totalIncome = safeFinances.filter(f => f.type === 'income').reduce((sum, f) => sum + (f.amount || 0), 0);
  const netMargin = totalIncome - grandTotalExpenses;

  const totalKmRun = safeTimesheets.reduce((sum, t) => sum + (t.totalDistanceKm || 0), 0);
  const costPerKmTotal = totalKmRun > 0 ? grandTotalExpenses / totalKmRun : 0;

  // Breakdown per Vehicle
  const vehiclePerformance = safeVehicles.map(v => {
    const vFuel = safeFuelLogs.filter(f => f && (f.vehicleId === v.id || f.nopol === v.nopol));
    const vFin = safeFinances.filter(f => f && (f.vehicleId === v.id || f.nopol === v.nopol));
    const vMnt = safeMaintenance.filter(m => m && (m.vehicleId === v.id || m.nopol === v.nopol));
    const vTs = safeTimesheets.filter(t => t && (t.vehicleId === v.id || t.nopol === v.nopol));

    const fuelCost = vFuel.reduce((sum, f) => sum + (f.totalCost || 0), 0);
    const liters = vFuel.reduce((sum, f) => sum + (f.volumeLiters || 0), 0);
    const opsCost = vFin.filter(f => f.type === 'expense').reduce((sum, f) => sum + (f.amount || 0), 0);
    const srvCost = vMnt.reduce((sum, m) => sum + (m.totalCost || 0), 0);
    const income = vFin.filter(f => f.type === 'income').reduce((sum, f) => sum + (f.amount || 0), 0);
    const totalCost = fuelCost + opsCost + srvCost;
    const net = income - totalCost;
    const km = vTs.reduce((sum, t) => sum + (t.totalDistanceKm || 0), 0);
    const trips = vTs.reduce((sum, t) => sum + (t.tripCount || 0), 0);
    const avgKmL = vFuel.length > 0 ? (vFuel.reduce((sum, f) => sum + (f.calculatedKmPerLiter || 0), 0) / vFuel.length).toFixed(2) : '0';
    const unitCostPerKm = km > 0 ? totalCost / km : 0;

    return {
      vehicle: v,
      liters,
      fuelCost,
      opsCost,
      srvCost,
      totalCost,
      income,
      net,
      km,
      trips,
      avgKmL,
      unitCostPerKm
    };
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Nopol,Merk Tipe,Driver,Ritase,Jarak KM,Solar Liter,Biaya Solar,Biaya Uang Jalan/Ops,Biaya Servis,Total Biaya,Pendapatan,Laba Bersih,Cost Per KM'];
    const rows = vehiclePerformance.map(vp => 
      `"${vp.vehicle.nopol}","${vp.vehicle.brand} ${vp.vehicle.model}","${vp.vehicle.assignedDriver}",${vp.trips},${vp.km},${vp.liters},${vp.fuelCost},${vp.opsCost},${vp.srvCost},${vp.totalCost},${vp.income},${vp.net},${vp.unitCostPerKm.toFixed(0)}`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Kinerja_Armada_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-blue-600" />
            Laporan Kinerja &amp; Analisis Biaya
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Laporan komprehensif efisiensi unit, audit pemborosan, dan laporan laba rugi operasional
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500"
          />
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-500 font-medium">Biaya Solar &amp; BBM</p>
            <Fuel className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 font-mono mt-1">{formatRupiah(totalFuelExpense)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">{formatNumber(totalFuelLiters)} Liter Total</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-500 font-medium">Biaya Perawatan Bengkel</p>
            <Wrench className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 font-mono mt-1">{formatRupiah(totalServiceExpense)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Servis &amp; Suku Cadang</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-500 font-medium">Uang Jalan &amp; Tol</p>
            <Wallet className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 font-mono mt-1">{formatRupiah(totalOpsExpense)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Biaya Jalan Pengemudi</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-500 font-medium">Total Laba Operasional</p>
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
          <h3 className={`text-2xl font-bold font-mono mt-1 ${netMargin >= 0 ? 'text-green-700' : 'text-rose-700'}`}>
            {formatRupiah(netMargin)}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Rata-rata: {formatRupiah(costPerKmTotal)}/KM</p>
        </div>
      </div>

      {/* Comprehensive Fleet Performance Matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Matriks Kinerja &amp; Biaya Tiap Unit Kendaraan</h3>
            <p className="text-xs text-slate-400 mt-0.5">Analisis pengeluaran solar, servis, dan profitabilitas per armada</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100 font-bold">
              <tr>
                <th className="py-3 px-4">Armada &amp; Driver</th>
                <th className="py-3 px-4 text-center">Rit / KM</th>
                <th className="py-3 px-4 text-center">Konsumsi Solar</th>
                <th className="py-3 px-4 text-right">Biaya Solar</th>
                <th className="py-3 px-4 text-right">Uang Jalan / Tol</th>
                <th className="py-3 px-4 text-right">Biaya Servis</th>
                <th className="py-3 px-4 text-right">Total Biaya</th>
                <th className="py-3 px-4 text-right">Pendapatan</th>
                <th className="py-3 px-4 text-right">Laba Bersih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehiclePerformance.map((vp) => (
                <tr key={vp.vehicle.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4">
                    <p className="font-mono font-bold text-slate-800">{vp.vehicle.nopol}</p>
                    <p className="text-[10px] text-slate-400">{vp.vehicle.assignedDriver || '-'}</p>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-bold text-slate-800">{vp.trips} Rit</span>
                    <p className="text-[10px] text-slate-400 font-mono">{formatNumber(vp.km)} KM</p>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-bold text-slate-800">{formatNumber(vp.liters)} L</span>
                    <p className="text-[10px] text-blue-600 font-semibold">{vp.avgKmL} Km/L</p>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                    {formatRupiah(vp.fuelCost)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                    {formatRupiah(vp.opsCost)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                    {formatRupiah(vp.srvCost)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                    {formatRupiah(vp.totalCost)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-medium text-green-700">
                    {formatRupiah(vp.income)}
                  </td>
                  <td className={`py-3.5 px-4 text-right font-mono font-bold ${vp.net >= 0 ? 'text-green-700' : 'text-rose-700'}`}>
                    {formatRupiah(vp.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
