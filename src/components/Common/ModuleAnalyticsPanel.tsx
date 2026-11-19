import React, { useState, useMemo } from 'react';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line
} from 'recharts';
import {
  FileBarChart,
  Download,
  Printer,
  RotateCcw,
  TrendingUp,
  X,
  FileSpreadsheet,
  FileText,
  Building2,
  CheckCircle2,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Vehicle,
  TaxRecord,
  FuelLog,
  DriverTimesheet,
  TripSheet,
  OperationalFinance,
  DriverPocketCashFlow,
  EquipmentCashFlow,
  MaintenanceRecord,
  Driver
} from '../../types';
import { formatRupiah, formatNumber, formatDateIndo } from '../../utils/formatters';
import { printElementById } from '../../utils/slipPrint';
import { PrintOutPreviewStage } from './PrintPreviewControls';

export type ModuleAnalyticsType =
  | 'vehicles'
  | 'tax'
  | 'fuel'
  | 'timesheet'
  | 'tripsheet'
  | 'finance'
  | 'driver_pocket'
  | 'equipment'
  | 'maintenance'
  | 'drivers';

interface ModuleAnalyticsPanelProps {
  moduleType: ModuleAnalyticsType;
  title: string;
  subtitle: string;
  vehicles?: Vehicle[];
  taxes?: TaxRecord[];
  fuelLogs?: FuelLog[];
  timesheets?: DriverTimesheet[];
  tripSheets?: TripSheet[];
  finances?: OperationalFinance[];
  pocketFlows?: DriverPocketCashFlow[];
  equipmentList?: EquipmentCashFlow[];
  maintenance?: MaintenanceRecord[];
  drivers?: Driver[];
}

interface CompanyMutationSummary {
  companyName: string;
  txCount: number;
  incomeOrPlafon: number;
  expenseAmount: number;
  unitOrNote: string;
}

const CHART_COLORS = [
  '#2563eb',
  '#059669',
  '#d97706',
  '#7c3aed',
  '#e11d48',
  '#0891b2',
  '#4f46e5',
  '#ea580c'
];

const MONTHS_ID = [
  { value: 'ALL', label: 'Semua Bulan' },
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' }
];

export const ModuleAnalyticsPanel: React.FC<ModuleAnalyticsPanelProps> = ({
  moduleType,
  title,
  subtitle,
  vehicles = [],
  taxes = [],
  fuelLogs = [],
  timesheets = [],
  tripSheets = [],
  finances = [],
  pocketFlows = [],
  equipmentList = [],
  maintenance = [],
  drivers = []
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Helper to resolve company name from a vehicleId or nopol
  const resolveVehicleCompany = (vehicleId?: string, nopol?: string, fallback?: string): string => {
    if (fallback && fallback.trim()) return fallback.trim();
    const matched = vehicles.find(
      (v) => (vehicleId && v.id === vehicleId) || (nopol && v.nopol === nopol)
    );
    return matched?.ownerCompany || 'PT Transindo Logistik';
  };

  const matchDateFilter = (dateStr?: string) => {
    if (!dateStr) return true;
    const d = dateStr.slice(0, 10);
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    if (selectedYear !== 'ALL' && !d.startsWith(selectedYear)) return false;
    if (selectedMonth !== 'ALL' && d.slice(5, 7) !== selectedMonth) return false;
    return true;
  };

  // Compute all available companies & per-company mutation summary (filtered by date, before company filter)
  const companyMutationStats = useMemo<CompanyMutationSummary[]>(() => {
    const map: Record<string, CompanyMutationSummary> = {};
    const ensureComp = (name: string) => {
      const clean = (name || 'PT Transindo Logistik').trim();
      if (!map[clean]) {
        map[clean] = {
          companyName: clean,
          txCount: 0,
          incomeOrPlafon: 0,
          expenseAmount: 0,
          unitOrNote: ''
        };
      }
      return map[clean];
    };

    // Always seed companies from vehicles so all fleet companies appear in dropdown
    vehicles.forEach((v) => {
      if (v.ownerCompany) ensureComp(v.ownerCompany);
    });

    switch (moduleType) {
      case 'vehicles': {
        vehicles
          .filter((v) => matchDateFilter(v.stnk1YearDate || v.kirDate))
          .forEach((v) => {
            const c = ensureComp(v.ownerCompany || 'PT Transindo Logistik');
            c.txCount += 1;
            c.incomeOrPlafon += v.capacityTon || 0;
            c.expenseAmount += v.currentOdometer || 0;
            c.unitOrNote = `${c.txCount} Unit Armada (${c.incomeOrPlafon} Ton)`;
          });
        break;
      }
      case 'tax': {
        taxes
          .filter((t) => matchDateFilter(t.dueDate))
          .forEach((t) => {
            const compName = resolveVehicleCompany(t.vehicleId, t.nopol);
            const c = ensureComp(compName);
            const amt = (t.amount || 0) + (t.penaltyAmount || 0);
            c.txCount += 1;
            c.expenseAmount += amt;
            c.unitOrNote = `${c.txCount} Berkas Pajak/KIR`;
          });
        break;
      }
      case 'fuel': {
        fuelLogs
          .filter((f) => matchDateFilter(f.date))
          .forEach((f) => {
            const compName = resolveVehicleCompany(f.vehicleId, f.nopol);
            const c = ensureComp(compName);
            c.txCount += 1;
            c.incomeOrPlafon += f.volumeLiters || 0;
            c.expenseAmount += f.totalCost || 0;
            c.unitOrNote = `${c.txCount}x Isi (${formatNumber(c.incomeOrPlafon)} Liter)`;
          });
        break;
      }
      case 'timesheet': {
        timesheets
          .filter((ts) => matchDateFilter(ts.date))
          .forEach((ts) => {
            const compName = resolveVehicleCompany(ts.vehicleId, ts.nopol);
            const c = ensureComp(compName);
            c.txCount += 1;
            c.incomeOrPlafon += ts.tripCount || 0;
            c.expenseAmount += ts.totalDistanceKm || 0;
            c.unitOrNote = `${c.txCount} Timesheet (${c.incomeOrPlafon} Rit)`;
          });
        break;
      }
      case 'tripsheet': {
        tripSheets
          .filter((t) => matchDateFilter(t.departureDate))
          .forEach((t) => {
            const compName = t.ownerCompany || resolveVehicleCompany(t.vehicleId, t.nopol);
            const c = ensureComp(compName);
            c.txCount += 1;
            c.incomeOrPlafon += t.cargoTonnageTon || 0;
            c.expenseAmount += t.totalPocketDisbursed || 0;
            c.unitOrNote = `${c.txCount} Trip (${formatNumber(c.incomeOrPlafon)} Ton)`;
          });
        break;
      }
      case 'finance': {
        finances
          .filter((f) => matchDateFilter(f.date))
          .forEach((f) => {
            const compName =
              f.depositCompanyName ||
              resolveVehicleCompany(f.vehicleId, f.nopol, 'PT Transindo Logistik');
            const c = ensureComp(compName);
            c.txCount += 1;
            if (f.type === 'income') {
              c.incomeOrPlafon += f.amount || 0;
            } else {
              c.expenseAmount += f.amount || 0;
            }
            c.unitOrNote = `${c.txCount} Voucher Kas`;
          });
        break;
      }
      case 'driver_pocket': {
        pocketFlows
          .filter((p) => matchDateFilter(p.date))
          .forEach((p) => {
            const compName =
              p.sourceCompanyName ||
              p.ownerCompany ||
              resolveVehicleCompany(p.vehicleId, p.nopol);
            const c = ensureComp(compName);
            c.txCount += 1;
            c.incomeOrPlafon += p.totalGiven || 0;
            c.expenseAmount += p.actualExpense > 0 ? p.actualExpense : p.totalGiven || 0;
            c.unitOrNote = `${c.txCount} Slip Uang Saku`;
          });
        break;
      }
      case 'equipment': {
        equipmentList
          .filter((e) => matchDateFilter(e.date))
          .forEach((e) => {
            const compName = e.ownerCompany || resolveVehicleCompany(e.vehicleId, e.nopol);
            const c = ensureComp(compName);
            c.txCount += 1;
            c.incomeOrPlafon += e.quantity || 0;
            c.expenseAmount += e.totalAmount || 0;
            c.unitOrNote = `${c.txCount} Transaksi (${c.incomeOrPlafon} Alat)`;
          });
        break;
      }
      case 'maintenance': {
        maintenance
          .filter((m) => matchDateFilter(m.serviceDate))
          .forEach((m) => {
            const compName = resolveVehicleCompany(m.vehicleId, m.nopol);
            const c = ensureComp(compName);
            c.txCount += 1;
            c.incomeOrPlafon += m.laborCost || 0;
            c.expenseAmount += m.totalCost || 0;
            c.unitOrNote = `${c.txCount} SPK Servis Bengkel`;
          });
        break;
      }
      case 'drivers': {
        drivers
          .filter((d) => matchDateFilter(d.joinDate))
          .forEach((d) => {
            const compName = d.companyName || 'PT Transindo Logistik';
            const c = ensureComp(compName);
            c.txCount += 1;
            c.unitOrNote = `${c.txCount} Personel Driver`;
          });
        break;
      }
    }

    return Object.values(map).sort((a, b) => b.expenseAmount - a.expenseAmount || b.txCount - a.txCount);
  }, [
    moduleType,
    vehicles,
    taxes,
    fuelLogs,
    timesheets,
    tripSheets,
    finances,
    pocketFlows,
    equipmentList,
    maintenance,
    drivers,
    startDate,
    endDate,
    selectedMonth,
    selectedYear
  ]);

  const matchCompanyFilter = (compName: string, extraClientName?: string) => {
    if (selectedCompany === 'ALL') return true;
    return (
      compName.toLowerCase() === selectedCompany.toLowerCase() ||
      (extraClientName && extraClientName.toLowerCase() === selectedCompany.toLowerCase())
    );
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedMonth('ALL');
    setSelectedYear('ALL');
    setSelectedCompany('ALL');
  };

  const periodLabel = useMemo(() => {
    const parts: string[] = [];
    if (selectedCompany !== 'ALL') {
      parts.push(`Perusahaan: ${selectedCompany}`);
    } else {
      parts.push('Semua Perusahaan');
    }
    if (startDate || endDate) {
      parts.push(`${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}`);
    }
    if (selectedMonth !== 'ALL') {
      const m = MONTHS_ID.find((item) => item.value === selectedMonth);
      if (m) parts.push(m.label);
    }
    if (selectedYear !== 'ALL') {
      parts.push(`Tahun ${selectedYear}`);
    }
    return parts.join(' • ');
  }, [startDate, endDate, selectedMonth, selectedYear, selectedCompany]);

  // Compute analytics per moduleType (filtered by Date AND Selected Company)
  const analyticsData = useMemo(() => {
    switch (moduleType) {
      case 'vehicles': {
        const list = vehicles.filter((v) => {
          const comp = v.ownerCompany || 'PT Transindo Logistik';
          return matchDateFilter(v.stnk1YearDate || v.kirDate) && matchCompanyFilter(comp);
        });
        const activeCount = list.filter((v) => v.status === 'active').length;
        const totalCap = list.reduce((s, v) => s + (v.capacityTon || 0), 0);
        const avgOdo =
          list.length > 0
            ? Math.round(list.reduce((s, v) => s + (v.currentOdometer || 0), 0) / list.length)
            : 0;

        const byCompany: Record<string, { name: string; unit: number; capacity: number }> = {};
        list.forEach((v) => {
          const comp = v.ownerCompany || 'PT Transindo Logistik';
          if (!byCompany[comp]) byCompany[comp] = { name: comp, unit: 0, capacity: 0 };
          byCompany[comp].unit += 1;
          byCompany[comp].capacity += v.capacityTon || 0;
        });

        const barData = list.map((v) => ({
          name: v.nopol,
          OdometerKm: v.currentOdometer || 0,
          KapasitasTon: v.capacityTon || 0
        }));

        const pieData = Object.values(byCompany).map((c) => ({
          name: c.name,
          value: c.unit
        }));

        const tableHeaders = [
          'Perusahaan Pemilik',
          'No. Polisi',
          'Merek & Tipe',
          'Supir Pegangan',
          'Odometer (KM)',
          'Kapasitas (Ton)',
          'Target KM/L',
          'Status'
        ];
        const tableRows = list.map((v) => [
          v.ownerCompany || 'PT Transindo Logistik',
          v.nopol,
          `${v.brand} ${v.model} (${v.type})`,
          v.assignedDriver || '-',
          `${formatNumber(v.currentOdometer)} KM`,
          `${v.capacityTon} Ton`,
          `${v.targetKmPerLiter} KM/L`,
          v.status.toUpperCase()
        ]);

        return {
          kpis: [
            {
              label: 'Total Armada Terfilter',
              value: `${list.length} Unit`,
              sub: `${activeCount} Unit Aktif Beroperasi`,
              color: 'blue'
            },
            {
              label: 'Total Kapasitas Angkut',
              value: `${formatNumber(totalCap)} Ton`,
              sub: 'Daya angkut kumulatif armada',
              color: 'emerald'
            },
            {
              label: 'Rata-rata Odometer',
              value: `${formatNumber(avgOdo)} KM`,
              sub: 'Jam terbang rata-rata unit',
              color: 'indigo'
            },
            {
              label: 'Entitas Perusahaan',
              value: selectedCompany === 'ALL' ? `${Object.keys(byCompany).length} PT/CV` : selectedCompany,
              sub: 'Filter mutasi perusahaan aktif',
              color: 'amber'
            }
          ],
          barTitle: 'Perbandingan Odometer (KM) & Kapasitas Muatan per Nopol',
          pieTitle: 'Distribusi Kepemilikan Unit per Perusahaan',
          barData,
          barKeys: [
            { key: 'OdometerKm', name: 'Odometer (KM)', color: '#2563eb' },
            { key: 'KapasitasTon', name: 'Kapasitas (Ton)', color: '#059669' }
          ],
          pieData,
          tableHeaders,
          tableRows,
          summaryFooter: `Total ${list.length} Unit Armada • Total Kapasitas: ${totalCap} Ton`
        };
      }

      case 'tax': {
        const list = taxes.filter((t) => {
          const comp = resolveVehicleCompany(t.vehicleId, t.nopol);
          return matchDateFilter(t.dueDate) && matchCompanyFilter(comp);
        });
        const totalAmount = list.reduce((s, t) => s + (t.amount || 0) + (t.penaltyAmount || 0), 0);
        const paidCount = list.filter((t) => t.status === 'paid' || t.status === 'safe').length;
        const urgentOrOverdue = list.filter(
          (t) => t.status === 'overdue' || t.status === 'urgent' || t.status === 'warning'
        ).length;

        const byDocType: Record<string, { name: string; total: number; count: number }> = {};
        list.forEach((t) => {
          const dt = t.documentType || 'Lainnya';
          if (!byDocType[dt]) byDocType[dt] = { name: dt, total: 0, count: 0 };
          byDocType[dt].total += (t.amount || 0) + (t.penaltyAmount || 0);
          byDocType[dt].count += 1;
        });

        const barData = Object.values(byDocType).map((d) => ({
          name: d.name,
          TotalBiaya: d.total,
          JumlahBerkas: d.count
        }));

        const pieData = Object.values(byDocType).map((d) => ({
          name: d.name,
          value: d.total
        }));

        const tableHeaders = [
          'Perusahaan Armada',
          'No. Polisi',
          'Jenis Dokumen Legalitas',
          'Jatuh Tempo',
          'Instansi / Samsat',
          'Status',
          'Total Pengeluaran Pajak (Rp)'
        ];
        const tableRows = list.map((t) => [
          resolveVehicleCompany(t.vehicleId, t.nopol),
          t.nopol,
          t.documentType,
          formatDateIndo(t.dueDate),
          t.agentOrSamsat || 'Samsat Induk',
          t.status.toUpperCase(),
          formatRupiah((t.amount || 0) + (t.penaltyAmount || 0))
        ]);

        return {
          kpis: [
            {
              label: 'Total Pengeluaran Pajak & KIR',
              value: formatRupiah(totalAmount),
              sub: `${list.length} dokumen legalitas`,
              color: 'blue'
            },
            {
              label: 'Dokumen Aman / Lunas',
              value: `${paidCount} Berkas`,
              sub: 'Masa berlaku aktif & patuh',
              color: 'emerald'
            },
            {
              label: 'Perhatian / Jatuh Tempo',
              value: `${urgentOrOverdue} Berkas`,
              sub: 'Segera proses perpanjangan',
              color: 'rose'
            },
            {
              label: 'Rata-rata Biaya Dokumen',
              value: formatRupiah(list.length ? totalAmount / list.length : 0),
              sub: 'Beban pajak rata-rata per berkas',
              color: 'indigo'
            }
          ],
          barTitle: 'Alokasi Pengeluaran Pajak & Legalitas per Jenis Dokumen',
          pieTitle: 'Proporsi Anggaran Pajak & Uji KIR',
          barData,
          barKeys: [{ key: 'TotalBiaya', name: 'Total Biaya (Rp)', color: '#2563eb' }],
          pieData,
          tableHeaders,
          tableRows,
          summaryFooter: `Total ${list.length} Berkas Pajak & Legalitas • Total Pengeluaran: ${formatRupiah(totalAmount)}`
        };
      }

      case 'fuel': {
        const list = fuelLogs.filter((f) => {
          const comp = resolveVehicleCompany(f.vehicleId, f.nopol);
          return matchDateFilter(f.date) && matchCompanyFilter(comp);
        });
        const totalLiters = list.reduce((s, f) => s + (f.volumeLiters || 0), 0);
        const totalCost = list.reduce((s, f) => s + (f.totalCost || 0), 0);
        const totalDist = list.reduce((s, f) => s + (f.distanceTravelled || 0), 0);
        const avgKml =
          list.length > 0
            ? (list.reduce((s, f) => s + (f.calculatedKmPerLiter || 0), 0) / list.length).toFixed(2)
            : '0';

        const byVehicle: Record<string, { name: string; liter: number; biaya: number; jarak: number }> = {};
        list.forEach((f) => {
          const key = f.nopol || 'Unknown';
          if (!byVehicle[key]) byVehicle[key] = { name: key, liter: 0, biaya: 0, jarak: 0 };
          byVehicle[key].liter += f.volumeLiters || 0;
          byVehicle[key].biaya += f.totalCost || 0;
          byVehicle[key].jarak += f.distanceTravelled || 0;
        });

        const barData = Object.values(byVehicle).map((v) => ({
          name: v.name,
          TotalBiaya: v.biaya,
          VolumeLiter: v.liter
        }));

        const pieData = Object.values(byVehicle).map((v) => ({
          name: v.name,
          value: v.biaya
        }));

        const tableHeaders = [
          'Tanggal',
          'Perusahaan Armada',
          'No. Polisi',
          'Karyawan Driver',
          'SPBU Pengisian',
          'Volume (L)',
          'Jarak Tempuh',
          'Rasio KM/L',
          'Pengeluaran BBM (Rp)'
        ];
        const tableRows = list.map((f) => [
          formatDateIndo(f.date),
          resolveVehicleCompany(f.vehicleId, f.nopol),
          f.nopol,
          `${f.driverName}${f.driverNip ? ` (${f.driverNip})` : ''}`,
          f.fuelStation,
          `${f.volumeLiters} L`,
          `${formatNumber(f.distanceTravelled)} KM`,
          `${f.calculatedKmPerLiter} KM/L`,
          formatRupiah(f.totalCost)
        ]);

        return {
          kpis: [
            {
              label: 'Total Pengeluaran BBM Solar',
              value: formatRupiah(totalCost),
              sub: `${list.length} transaksi pengisian SPBU`,
              color: 'blue'
            },
            {
              label: 'Total Volume Konsumsi',
              value: `${formatNumber(totalLiters)} Liter`,
              sub: 'Akumulasi solar terpakai',
              color: 'amber'
            },
            {
              label: 'Total Jarak Tempuh',
              value: `${formatNumber(totalDist)} KM`,
              sub: 'Selisih odometer tercatat',
              color: 'emerald'
            },
            {
              label: 'Rata-rata Efisiensi BBM',
              value: `${avgKml} KM/L`,
              sub: `Rp ${totalDist > 0 ? formatNumber(Math.round(totalCost / totalDist)) : 0} / KM`,
              color: 'indigo'
            }
          ],
          barTitle: 'Analisis Pengeluaran Solar & Volume per Armada',
          pieTitle: 'Proporsi Pengeluaran Biaya Solar (Rp) per Nopol',
          barData,
          barKeys: [
            { key: 'TotalBiaya', name: 'Biaya Solar (Rp)', color: '#2563eb' },
            { key: 'VolumeLiter', name: 'Volume (Liter)', color: '#d97706' }
          ],
          pieData,
          tableHeaders,
          tableRows,
          summaryFooter: `Total Volume: ${formatNumber(totalLiters)} Liter • Total Jarak: ${formatNumber(totalDist)} KM • Total Pengeluaran Solar: ${formatRupiah(totalCost)}`
        };
      }

      case 'timesheet': {
        const list = timesheets.filter((ts) => {
          const comp = resolveVehicleCompany(ts.vehicleId, ts.nopol);
          return matchDateFilter(ts.date) && matchCompanyFilter(comp);
        });
        const totalHours = list.reduce((s, ts) => s + (ts.totalHours || 0), 0);
        const totalOvertime = list.reduce((s, ts) => s + (ts.overtimeHours || 0), 0);
        const totalTrips = list.reduce((s, ts) => s + (ts.tripCount || 0), 0);
        const totalKm = list.reduce((s, ts) => s + (ts.totalDistanceKm || 0), 0);

        const byDriver: Record<string, { name: string; jamKerja: number; lembur: number; ritase: number; km: number }> = {};
        list.forEach((ts) => {
          const d = ts.driverName || 'Supir';
          if (!byDriver[d]) byDriver[d] = { name: d, jamKerja: 0, lembur: 0, ritase: 0, km: 0 };
          byDriver[d].jamKerja += ts.totalHours || 0;
          byDriver[d].lembur += ts.overtimeHours || 0;
          byDriver[d].ritase += ts.tripCount || 0;
          byDriver[d].km += ts.totalDistanceKm || 0;
        });

        const barData = Object.values(byDriver).map((d) => ({
          name: d.name,
          JamKerja: Number(d.jamKerja.toFixed(1)),
          JamLembur: Number(d.lembur.toFixed(1)),
          Ritase: d.ritase
        }));

        const pieData = Object.values(byDriver).map((d) => ({
          name: d.name,
          value: d.ritase
        }));

        const tableHeaders = [
          'Tanggal',
          'Perusahaan Armada',
          'Karyawan Driver',
          'No. Polisi',
          'Rute Operasional',
          'Jam Kerja',
          'Lembur',
          'Ritase',
          'Jarak (KM)'
        ];
        const tableRows = list.map((ts) => [
          formatDateIndo(ts.date),
          resolveVehicleCompany(ts.vehicleId, ts.nopol),
          ts.driverName,
          ts.nopol,
          `${ts.originLocation} → ${ts.destinationLocation}`,
          `${ts.totalHours} Jam`,
          `${ts.overtimeHours || 0} Jam`,
          `${ts.tripCount} Rit`,
          `${formatNumber(ts.totalDistanceKm)} KM`
        ]);

        return {
          kpis: [
            {
              label: 'Total Jam Kerja Efektif',
              value: `${totalHours.toFixed(1)} Jam`,
              sub: `${list.length} hari kerja tercatat`,
              color: 'blue'
            },
            {
              label: 'Total Jam Lembur (OT)',
              value: `${totalOvertime.toFixed(1)} Jam`,
              sub: 'Akumulasi lembur pengemudi',
              color: 'amber'
            },
            {
              label: 'Total Ritase Selesai',
              value: `${formatNumber(totalTrips)} Rit`,
              sub: 'Total ritase angkutan harian',
              color: 'emerald'
            },
            {
              label: 'Total Jarak Odometer',
              value: `${formatNumber(totalKm)} KM`,
              sub: 'Jarak tempuh produktif',
              color: 'indigo'
            }
          ],
          barTitle: 'Rekapitulasi Jam Kerja, Lembur & Ritase per Karyawan Driver',
          pieTitle: 'Distribusi Produktivitas Ritase per Pengemudi',
          barData,
          barKeys: [
            { key: 'JamKerja', name: 'Jam Kerja Efektif', color: '#2563eb' },
            { key: 'JamLembur', name: 'Jam Lembur (OT)', color: '#d97706' },
            { key: 'Ritase', name: 'Total Ritase', color: '#059669' }
          ],
          pieData,
          tableHeaders,
          tableRows,
          summaryFooter: `Total Jam Kerja: ${totalHours.toFixed(1)} Jam • Lembur: ${totalOvertime.toFixed(1)} Jam • Total Ritase: ${totalTrips} Rit (${formatNumber(totalKm)} KM)`
        };
      }

      case 'tripsheet': {
        const list = tripSheets.filter((t) => {
          const comp = t.ownerCompany || resolveVehicleCompany(t.vehicleId, t.nopol);
          return matchDateFilter(t.departureDate) && matchCompanyFilter(comp, t.clientCompany);
        });
        const totalTonnage = list.reduce((s, t) => s + (t.cargoTonnageTon || 0), 0);
        const totalPocket = list.reduce((s, t) => s + (t.totalPocketDisbursed || 0), 0);
        const totalKm = list.reduce((s, t) => s + (t.totalDistanceKm || 0), 0);

        const byClient: Record<string, { name: string; tonase: number; uangSaku: number; trips: number }> = {};
        list.forEach((t) => {
          const c = t.clientCompany || t.ownerCompany || 'Perusahaan Umum';
          if (!byClient[c]) byClient[c] = { name: c, tonase: 0, uangSaku: 0, trips: 0 };
          byClient[c].tonase += t.cargoTonnageTon || 0;
          byClient[c].uangSaku += t.totalPocketDisbursed || 0;
          byClient[c].trips += 1;
        });

        const barData = Object.values(byClient).map((c) => ({
          name: c.name,
          UangSaku: c.uangSaku,
          TonaseTon: c.tonase
        }));

        const pieData = Object.values(byClient).map((c) => ({
          name: c.name,
          value: c.uangSaku
        }));

        const tableHeaders = [
          'No. Trip / SJ',
          'Tanggal',
          'Perusahaan Armada',
          'Perusahaan Klien',
          'Armada & Driver',
          'Rute Muat → Bongkar',
          'Tonase',
          'Pengeluaran Saku Trip (Rp)'
        ];
        const tableRows = list.map((t) => [
          `${t.tripNumber} / ${t.suratJalanNumber}`,
          formatDateIndo(t.departureDate),
          t.ownerCompany || resolveVehicleCompany(t.vehicleId, t.nopol),
          t.clientCompany,
          `${t.nopol} - ${t.driverName}${t.driverNip ? ` (${t.driverNip})` : ''}`,
          `${t.originLocation} → ${t.destinationLocation}`,
          `${t.cargoTonnageTon} Ton`,
          formatRupiah(t.totalPocketDisbursed)
        ]);

        return {
          kpis: [
            {
              label: 'Total Surat Jalan / Trip',
              value: `${list.length} Lembar`,
              sub: 'Dokumen keberangkatan sah',
              color: 'blue'
            },
            {
              label: 'Total Tonase Muatan',
              value: `${formatNumber(totalTonnage)} Ton`,
              sub: 'Kargo terkirim ke klien',
              color: 'emerald'
            },
            {
              label: 'Total Pengeluaran Saku Trip',
              value: formatRupiah(totalPocket),
              sub: 'Plafon uang jalan trip sheet',
              color: 'indigo'
            },
            {
              label: 'Total Jarak Distribusi',
              value: `${formatNumber(totalKm)} KM`,
              sub: 'Jarak tempuh pengiriman',
              color: 'amber'
            }
          ],
          barTitle: 'Alokasi Uang Saku & Tonase Kargo per Perusahaan',
          pieTitle: 'Porsi Pengeluaran Uang Saku per Perusahaan',
          barData,
          barKeys: [
            { key: 'UangSaku', name: 'Uang Saku (Rp)', color: '#2563eb' },
            { key: 'TonaseTon', name: 'Tonase (Ton)', color: '#059669' }
          ],
          pieData,
          tableHeaders,
          tableRows,
          summaryFooter: `Total ${list.length} Trip Sheet • Total Muatan: ${formatNumber(totalTonnage)} Ton • Total Pengeluaran Saku: ${formatRupiah(totalPocket)}`
        };
      }

      case 'finance': {
        const list = finances.filter((f) => {
          const comp =
            f.depositCompanyName ||
            resolveVehicleCompany(f.vehicleId, f.nopol, 'PT Transindo Logistik');
          const vehComp = resolveVehicleCompany(f.vehicleId, f.nopol);
          return matchDateFilter(f.date) && matchCompanyFilter(comp, vehComp);
        });
        const totalIn = list.filter((f) => f.type === 'income').reduce((s, f) => s + (f.amount || 0), 0);
        const totalOut = list.filter((f) => f.type === 'expense').reduce((s, f) => s + (f.amount || 0), 0);
        const net = totalIn - totalOut;

        const byCat: Record<string, { name: string; masuk: number; keluar: number }> = {};
        list.forEach((f) => {
          const cat = f.category || 'Lainnya';
          if (!byCat[cat]) byCat[cat] = { name: cat, masuk: 0, keluar: 0 };
          if (f.type === 'income') byCat[cat].masuk += f.amount || 0;
          else byCat[cat].keluar += f.amount || 0;
        });

        const barData = Object.values(byCat).map((c) => ({
          name: c.name,
          Pemasukan: c.masuk,
          Pengeluaran: c.keluar
        }));

        const pieData = Object.values(byCat)
          .filter((c) => c.keluar > 0)
          .map((c) => ({
            name: c.name,
            value: c.keluar
          }));

        const tableHeaders = [
          'Tanggal',
          'Perusahaan / Beban Dana',
          'Kategori Transaksi',
          'Unit / Driver',
          'Serah Terima (Kasir → Penerima)',
          'Rekening Kas',
          'Tipe Mutasi',
          'Nominal (Rp)'
        ];
        const tableRows = list.map((f) => [
          formatDateIndo(f.date),
          f.depositCompanyName || resolveVehicleCompany(f.vehicleId, f.nopol),
          f.category,
          `${f.nopol} (${f.driverName}${f.driverNip ? ` - ${f.driverNip}` : ''})`,
          `${f.handoverBy || 'Kasir'} → ${f.receivedBy || f.driverName}`,
          f.accountName || 'Kas Utama',
          f.type === 'income' ? 'MASUK (+)' : 'KELUAR (-)',
          formatRupiah(f.amount)
        ]);

        return {
          kpis: [
            {
              label: 'Total Kas Masuk (Income)',
              value: formatRupiah(totalIn),
              sub: 'Sewa armada & pemasukan non-sewa',
              color: 'emerald'
            },
            {
              label: 'Total Pengeluaran (Expense)',
              value: formatRupiah(totalOut),
              sub: 'Daftar pengeluaran operasional perusahaan',
              color: 'rose'
            },
            {
              label: 'Arus Kas Bersih (Net)',
              value: formatRupiah(net),
              sub: net >= 0 ? 'Surplus Operasional' : 'Defisit Operasional',
              color: net >= 0 ? 'blue' : 'amber'
            },
            {
              label: 'Volume Transaksi',
              value: `${list.length} Voucher`,
              sub: 'Tercatat dengan bukti & serah terima',
              color: 'indigo'
            }
          ],
          barTitle: 'Perbandingan Pemasukan vs Pengeluaran per Kategori Pos',
          pieTitle: 'Komposisi Beban Pengeluaran Operasional',
          barData,
          barKeys: [
            { key: 'Pemasukan', name: 'Pemasukan (Rp)', color: '#059669' },
            { key: 'Pengeluaran', name: 'Pengeluaran (Rp)', color: '#e11d48' }
          ],
          pieData: pieData.length > 0 ? pieData : [{ name: 'Pemasukan', value: totalIn || 1 }],
          tableHeaders,
          tableRows,
          summaryFooter: `Total Masuk: ${formatRupiah(totalIn)} • Total Pengeluaran: ${formatRupiah(totalOut)} • Saldo Bersih: ${formatRupiah(net)}`
        };
      }

      case 'driver_pocket': {
        const list = pocketFlows.filter((p) => {
          const comp =
            p.sourceCompanyName ||
            p.ownerCompany ||
            resolveVehicleCompany(p.vehicleId, p.nopol);
          return matchDateFilter(p.date) && matchCompanyFilter(comp, p.ownerCompany);
        });
        const totalGiven = list.reduce((s, p) => s + (p.totalGiven || 0), 0);
        const totalActual = list.reduce(
          (s, p) => s + (p.actualExpense > 0 ? p.actualExpense : p.totalGiven || 0),
          0
        );
        const totalRemain = list.reduce((s, p) => s + (p.remainingBalance || 0), 0);

        const byDriver: Record<string, { name: string; plafon: number; realisasi: number }> = {};
        list.forEach((p) => {
          const d = p.driverName || 'Supir';
          if (!byDriver[d]) byDriver[d] = { name: d, plafon: 0, realisasi: 0 };
          byDriver[d].plafon += p.totalGiven || 0;
          byDriver[d].realisasi += p.actualExpense > 0 ? p.actualExpense : p.totalGiven || 0;
        });

        const compTotals = [
          {
            name: 'Uang Makan Supir',
            value: list.reduce((s, p) => s + (p.driverAllowance || p.driverMealAllowance || 0), 0)
          },
          { name: 'Uang Saku Kernet', value: list.reduce((s, p) => s + (p.helperAllowance || 0), 0) },
          { name: 'Biaya E-Toll', value: list.reduce((s, p) => s + (p.tollAllowance || p.tollFee || 0), 0) },
          { name: 'BBM Jalan', value: list.reduce((s, p) => s + (p.fuelAllowance || 0), 0) },
          {
            name: 'Parkir & Timbangan',
            value: list.reduce((s, p) => s + (p.parkingAndWeighCost || p.parkingAndRetribution || 0), 0)
          },
          {
            name: 'Bongkar Muat',
            value: list.reduce((s, p) => s + (p.loadingUnloadingCost || p.loadingUnloadingFee || 0), 0)
          }
        ].filter((c) => c.value > 0);

        const barData = Object.values(byDriver).map((d) => ({
          name: d.name,
          PlafonCair: d.plafon,
          RealisasiNota: d.realisasi
        }));

        const tableHeaders = [
          'Tanggal & Kode',
          'Perusahaan Beban Kas',
          'Karyawan Driver (NIP)',
          'Unit Nopol',
          'Rute Perjalanan',
          'Plafon Cair (Rp)',
          'Pengeluaran Realisasi (Rp)',
          'Status'
        ];
        const tableRows = list.map((p) => [
          `${formatDateIndo(p.date)} (${p.tripCode})`,
          p.sourceCompanyName || p.ownerCompany || resolveVehicleCompany(p.vehicleId, p.nopol),
          `${p.driverName}${p.driverNip ? ` [${p.driverNip}]` : ''}`,
          p.nopol,
          p.routeDescription || `${p.originLocation || ''} → ${p.destinationLocation || ''}`,
          formatRupiah(p.totalGiven),
          formatRupiah(p.actualExpense > 0 ? p.actualExpense : p.totalGiven),
          p.status.toUpperCase()
        ]);

        return {
          kpis: [
            {
              label: 'Total Saku Dicairkan',
              value: formatRupiah(totalGiven),
              sub: `${list.length} voucher pencairan saku`,
              color: 'blue'
            },
            {
              label: 'Total Pengeluaran Saku',
              value: formatRupiah(totalActual),
              sub: 'Realisasi pengeluaran jalan supir',
              color: 'emerald'
            },
            {
              label: 'Net Selisih / Pengembalian',
              value: formatRupiah(totalRemain),
              sub: 'Sisa setor / klaim kurang bayar',
              color: 'amber'
            },
            {
              label: 'Karyawan Driver Terlibat',
              value: `${Object.keys(byDriver).length} Supir`,
              sub: 'Tercatat dalam berita acara',
              color: 'indigo'
            }
          ],
          barTitle: 'Plafon Uang Saku vs Realisasi Pengeluaran per Karyawan Driver',
          pieTitle: 'Komposisi Komponen Biaya Saku Perjalanan',
          barData,
          barKeys: [
            { key: 'PlafonCair', name: 'Plafon Dicairkan (Rp)', color: '#2563eb' },
            { key: 'RealisasiNota', name: 'Realisasi Pengeluaran (Rp)', color: '#059669' }
          ],
          pieData: compTotals,
          tableHeaders,
          tableRows,
          summaryFooter: `Total Plafon Cair: ${formatRupiah(totalGiven)} • Total Pengeluaran Realisasi: ${formatRupiah(totalActual)} • Selisih: ${formatRupiah(totalRemain)}`
        };
      }

      case 'equipment': {
        const list = equipmentList.filter((e) => {
          const comp = e.ownerCompany || resolveVehicleCompany(e.vehicleId, e.nopol);
          return matchDateFilter(e.date) && matchCompanyFilter(comp);
        });
        const totalOut = list.reduce((s, e) => s + (e.totalAmount || 0), 0);
        const totalQty = list.reduce((s, e) => s + (e.quantity || 0), 0);

        const byCategory: Record<string, { name: string; total: number; qty: number }> = {};
        list.forEach((e) => {
          const cat = e.category || 'Lainnya';
          if (!byCategory[cat]) byCategory[cat] = { name: cat, total: 0, qty: 0 };
          byCategory[cat].total += e.totalAmount || 0;
          byCategory[cat].qty += e.quantity || 0;
        });

        const barData = Object.values(byCategory).map((c) => ({
          name: c.name,
          TotalBelanja: c.total,
          JumlahItem: c.qty
        }));

        const pieData = Object.values(byCategory).map((c) => ({
          name: c.name,
          value: c.total
        }));

        const tableHeaders = [
          'Tanggal',
          'Perusahaan Armada',
          'Nama Peralatan',
          'Kategori',
          'Armada Tujuan',
          'Serah Terima (Penyerah → Driver)',
          'Qty',
          'Total Pengeluaran (Rp)'
        ];
        const tableRows = list.map((e) => [
          formatDateIndo(e.date),
          e.ownerCompany || resolveVehicleCompany(e.vehicleId, e.nopol),
          e.equipmentName,
          e.category,
          e.nopol || 'GUDANG POOL',
          `${e.handoverBy || 'Logistik'} → ${e.recipientName || '-'}${e.recipientNip ? ` (${e.recipientNip})` : ''}`,
          `${e.quantity} ${e.unit}`,
          formatRupiah(e.totalAmount)
        ]);

        return {
          kpis: [
            {
              label: 'Total Pengeluaran Peralatan',
              value: formatRupiah(totalOut),
              sub: `${list.length} transaksi pengadaan alat`,
              color: 'blue'
            },
            {
              label: 'Total Kuantitas Alat',
              value: `${formatNumber(totalQty)} Unit/Pcs`,
              sub: 'Terpal, lashing, dongkrak, APAR, dll',
              color: 'emerald'
            },
            {
              label: 'Kategori Alat Kerja',
              value: `${Object.keys(byCategory).length} Kategori`,
              sub: 'Klasifikasi inventaris armada',
              color: 'amber'
            },
            {
              label: 'Rata-rata Nilai Transaksi',
              value: formatRupiah(list.length ? totalOut / list.length : 0),
              sub: 'Nilai belanja per transaksi',
              color: 'indigo'
            }
          ],
          barTitle: 'Total Pengeluaran Belanja Peralatan per Kategori',
          pieTitle: 'Distribusi Anggaran Perlengkapan Armada',
          barData,
          barKeys: [{ key: 'TotalBelanja', name: 'Total Pengeluaran (Rp)', color: '#d97706' }],
          pieData,
          tableHeaders,
          tableRows,
          summaryFooter: `Total ${list.length} Transaksi Peralatan (${totalQty} Item) • Total Pengeluaran: ${formatRupiah(totalOut)}`
        };
      }

      case 'maintenance': {
        const list = maintenance.filter((m) => {
          const comp = resolveVehicleCompany(m.vehicleId, m.nopol);
          return matchDateFilter(m.serviceDate) && matchCompanyFilter(comp);
        });
        const totalCost = list.reduce((s, m) => s + (m.totalCost || 0), 0);
        const totalLabor = list.reduce((s, m) => s + (m.laborCost || 0), 0);
        const totalParts = totalCost - totalLabor;

        const byVehicle: Record<string, { name: string; jasa: number; part: number; total: number }> = {};
        list.forEach((m) => {
          const key = m.nopol || 'Unit';
          const partCost = (m.totalCost || 0) - (m.laborCost || 0);
          if (!byVehicle[key]) byVehicle[key] = { name: key, jasa: 0, part: 0, total: 0 };
          byVehicle[key].jasa += m.laborCost || 0;
          byVehicle[key].part += partCost;
          byVehicle[key].total += m.totalCost || 0;
        });

        const barData = Object.values(byVehicle).map((v) => ({
          name: v.name,
          BiayaSparepart: v.part,
          JasaMekanik: v.jasa
        }));

        const pieData = Object.values(byVehicle).map((v) => ({
          name: v.name,
          value: v.total
        }));

        const tableHeaders = [
          'Tanggal & SPK',
          'Perusahaan Armada',
          'No. Polisi',
          'Karyawan Driver PJ',
          'Jenis Servis',
          'Bengkel / Mekanik',
          'Jasa (Rp)',
          'Total Pengeluaran Servis (Rp)'
        ];
        const tableRows = list.map((m) => [
          `${formatDateIndo(m.serviceDate)} (${m.workOrderNumber})`,
          resolveVehicleCompany(m.vehicleId, m.nopol),
          m.nopol,
          `${m.driverName || '-'}${m.driverNip ? ` (${m.driverNip})` : ''}`,
          m.serviceType,
          `${m.workshopName} (${m.mechanicName || '-'})`,
          formatRupiah(m.laborCost),
          formatRupiah(m.totalCost)
        ]);

        return {
          kpis: [
            {
              label: 'Total Pengeluaran Servis & SPK',
              value: formatRupiah(totalCost),
              sub: `${list.length} Surat Perintah Kerja (SPK)`,
              color: 'blue'
            },
            {
              label: 'Total Belanja Sparepart',
              value: formatRupiah(totalParts),
              sub: 'Oli, filter, kampas rem, ban, dll',
              color: 'amber'
            },
            {
              label: 'Total Ongkos Jasa Mekanik',
              value: formatRupiah(totalLabor),
              sub: 'Biaya pengerjaan workshop/bengkel',
              color: 'emerald'
            },
            {
              label: 'Rata-rata Biaya per SPK',
              value: formatRupiah(list.length ? totalCost / list.length : 0),
              sub: 'Biaya rata-rata per kunjungan servis',
              color: 'indigo'
            }
          ],
          barTitle: 'Rincian Pengeluaran Suku Cadang vs Jasa Mekanik per Armada',
          pieTitle: 'Distribusi Beban Perawatan Bengkel per Nopol',
          barData,
          barKeys: [
            { key: 'BiayaSparepart', name: 'Biaya Sparepart (Rp)', color: '#2563eb' },
            { key: 'JasaMekanik', name: 'Jasa Mekanik (Rp)', color: '#059669' }
          ],
          pieData,
          tableHeaders,
          tableRows,
          summaryFooter: `Total ${list.length} SPK Bengkel • Sparepart: ${formatRupiah(totalParts)} • Jasa: ${formatRupiah(totalLabor)} • Grand Total Pengeluaran: ${formatRupiah(totalCost)}`
        };
      }

      case 'drivers':
      default: {
        const list = drivers.filter((d) => {
          const comp = d.companyName || 'PT Transindo Logistik';
          return matchDateFilter(d.joinDate) && matchCompanyFilter(comp);
        });
        const activeCount = list.filter((d) => d.status === 'active' || d.status === 'on_duty').length;

        const bySim: Record<string, number> = {};
        list.forEach((d) => {
          const s = d.simType || 'SIM B1 Umum';
          bySim[s] = (bySim[s] || 0) + 1;
        });

        const barData = list.map((d) => {
          const drvTrips = tripSheets.filter((t) => t.driverName.toLowerCase() === d.name.toLowerCase()).length;
          const drvPockets = pocketFlows.filter((p) => p.driverName.toLowerCase() === d.name.toLowerCase()).length;
          const drvEquip = equipmentList.filter((e) => (e.recipientName || '').toLowerCase() === d.name.toLowerCase()).length;
          return {
            name: d.name.split(' ')[0],
            TripSuratJalan: drvTrips,
            SerahTerimaSaku: drvPockets,
            SerahTerimaAlat: drvEquip
          };
        });

        const pieData = Object.entries(bySim).map(([name, value]) => ({ name, value }));

        const tableHeaders = [
          'Perusahaan Penempatan',
          'NIP Karyawan',
          'Nama Karyawan Driver',
          'Jabatan & Status Kerja',
          'Golongan SIM & Berlaku',
          'Rekening Bank',
          'Armada & Kernet'
        ];
        const tableRows = list.map((d) => [
          d.companyName || 'PT Transindo Logistik',
          d.nip || d.id,
          d.name,
          `${d.jobTitle || 'Supir Armada'} (${d.employmentType || 'Karyawan Tetap'})`,
          `${d.simType} (${d.simExpiry})`,
          `${d.bankName || '-'} ${d.bankAccountNumber || ''}`,
          `${d.assignedVehicle || 'Cadangan Pool'} / Kernet: ${d.helperName || '-'}`
        ]);

        return {
          kpis: [
            {
              label: 'Total Karyawan Driver',
              value: `${list.length} Personel`,
              sub: `${activeCount} Aktif / Sedang Jalan`,
              color: 'blue'
            },
            {
              label: 'Karyawan Tetap (PKWTT)',
              value: `${list.filter((d) => (d.employmentType || '').includes('Tetap')).length} Orang`,
              sub: 'Driver organik perusahaan',
              color: 'emerald'
            },
            {
              label: 'Kontrak & Mitra Ritase',
              value: `${list.filter((d) => !(d.employmentType || '').includes('Tetap')).length} Orang`,
              sub: 'PKWT & Co-Driver pendamping',
              color: 'amber'
            },
            {
              label: 'Golongan Kualifikasi SIM',
              value: `${Object.keys(bySim).length} Kelas SIM`,
              sub: 'SIM B2 Umum, B1 Umum & SIM A',
              color: 'indigo'
            }
          ],
          barTitle: 'Frekuensi Serah Terima Transaksi (Trip, Uang Saku & Alat) per Driver',
          pieTitle: 'Komposisi Kualifikasi Golongan SIM Karyawan Driver',
          barData,
          barKeys: [
            { key: 'TripSuratJalan', name: 'Surat Jalan / Trip', color: '#2563eb' },
            { key: 'SerahTerimaSaku', name: 'Slip Uang Saku', color: '#059669' },
            { key: 'SerahTerimaAlat', name: 'Serah Terima Alat', color: '#d97706' }
          ],
          pieData,
          tableHeaders,
          tableRows,
          summaryFooter: `Total ${list.length} Karyawan Driver & Co-Driver Terdaftar dalam Referensi Serah Terima`
        };
      }
    }
  }, [
    moduleType,
    vehicles,
    taxes,
    fuelLogs,
    timesheets,
    tripSheets,
    finances,
    pocketFlows,
    equipmentList,
    maintenance,
    drivers,
    startDate,
    endDate,
    selectedMonth,
    selectedYear,
    selectedCompany
  ]);

  const isMonetaryModule = ['tax', 'fuel', 'tripsheet', 'finance', 'driver_pocket', 'equipment', 'maintenance'].includes(
    moduleType
  );

  const totalAllCompanyExpense = useMemo(
    () => companyMutationStats.reduce((sum, c) => sum + (c.expenseAmount || 0), 0),
    [companyMutationStats]
  );

  const handleExportExcel = () => {
    const companyMatrixRows = companyMutationStats.map((c, idx) => [
      idx + 1,
      c.companyName,
      c.txCount,
      c.unitOrNote,
      isMonetaryModule ? c.expenseAmount : c.expenseAmount
    ]);

    const wsData = [
      [title.toUpperCase()],
      [`Filter & Periode: ${periodLabel}`],
      [],
      ['REKAPITULASI MUTASI & PENGELUARAN MASING-MASING PERUSAHAAN'],
      [
        'No',
        'Nama Perusahaan',
        'Jumlah Transaksi/Data',
        'Keterangan Mutasi',
        isMonetaryModule ? 'Total Pengeluaran Perusahaan (Rp)' : 'Total Volume/Jarak'
      ],
      ...companyMatrixRows,
      [],
      ['DAFTAR RINCIAN TRANSAKSI / PENGELUARAN TERFILTER'],
      analyticsData.tableHeaders,
      ...analyticsData.tableRows,
      [],
      [analyticsData.summaryFooter]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mutasi_Perusahaan');
    const compSuffix = selectedCompany !== 'ALL' ? `_${selectedCompany.replace(/\s+/g, '_')}` : '_Semua_Perusahaan';
    XLSX.writeFile(wb, `Laporan_${moduleType}${compSuffix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), 14, 14);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${subtitle} • ${periodLabel}`, 14, 20);

    // Table 1: Rekap Mutasi Masing-Masing Perusahaan
    autoTable(doc, {
      startY: 24,
      head: [
        [
          'No',
          'Nama Perusahaan',
          'Jumlah Data',
          'Rincian Aktivitas',
          isMonetaryModule ? 'Total Pengeluaran Perusahaan (Rp)' : 'Akumulasi'
        ]
      ],
      body: companyMutationStats.map((c, i) => [
        i + 1,
        c.companyName,
        `${c.txCount} Data`,
        c.unitOrNote,
        isMonetaryModule ? formatRupiah(c.expenseAmount) : formatNumber(c.expenseAmount)
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' }
    });

    const nextY = ((doc as any).lastAutoTable?.finalY || 60) + 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `DAFTAR RINCIAN PENGELUARAN / TRANSAKSI (${
        selectedCompany === 'ALL' ? 'SEMUA PERUSAHAAN' : selectedCompany.toUpperCase()
      })`,
      14,
      nextY
    );

    autoTable(doc, {
      startY: nextY + 3,
      head: [analyticsData.tableHeaders],
      body: analyticsData.tableRows,
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 160;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(analyticsData.summaryFooter, 14, finalY + 7);
    const compSuffix = selectedCompany !== 'ALL' ? `_${selectedCompany.replace(/\s+/g, '_')}` : '_Semua_Perusahaan';
    doc.save(`Laporan_${moduleType}${compSuffix}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <FileBarChart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Mutasi &amp; Analitik Per Perusahaan
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Preview &amp; Cetak Laporan</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Unduh Excel</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Row: Perusahaan, Dari Tanggal, Sampai Tanggal, Bulan, Tahun, Reset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold text-indigo-700 uppercase mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Filter Mutasi Perusahaan</span>
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className={`w-full px-3 py-1.5 text-xs rounded-xl border font-bold focus:outline-hidden transition cursor-pointer ${
                selectedCompany !== 'ALL'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                  : 'bg-indigo-50/70 border-indigo-200 text-indigo-950 hover:bg-indigo-100/70'
              }`}
            >
              <option value="ALL" className="bg-white text-slate-900">
                🏢 Semua Perusahaan (Gabungan {companyMutationStats.length} Perusahaan)
              </option>
              {companyMutationStats.map((comp) => (
                <option key={comp.companyName} value={comp.companyName} className="bg-white text-slate-900">
                  🏢 {comp.companyName} ({comp.txCount} Data
                  {isMonetaryModule ? ` • ${formatRupiah(comp.expenseAmount)}` : ''})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-hidden focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-hidden focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Filter Bulan &amp; Tahun
            </label>
            <div className="flex gap-1.5">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-1/2 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-hidden focus:border-blue-500"
              >
                {MONTHS_ID.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-1/2 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-hidden focus:border-blue-500"
              >
                <option value="ALL">Semua Thn</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>

        {/* Quick-Switch Pill Bar: Mutasi per Perusahaan */}
        {companyMutationStats.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pilih Cepat Mutasi &amp; Daftar Pengeluaran per Perusahaan:</span>
              </span>
              {selectedCompany !== 'ALL' && (
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  Menampilkan khusus: {selectedCompany}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedCompany('ALL')}
                className={`px-3.5 py-2 rounded-xl border text-left transition shrink-0 cursor-pointer ${
                  selectedCompany === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>Semua Perusahaan</span>
                  {selectedCompany === 'ALL' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className={`text-[10px] font-mono mt-0.5 ${selectedCompany === 'ALL' ? 'text-emerald-300 font-bold' : 'text-slate-500'}`}>
                  {isMonetaryModule ? formatRupiah(totalAllCompanyExpense) : `${companyMutationStats.reduce((s, c) => s + c.txCount, 0)} Data`}
                </div>
              </button>

              {companyMutationStats.map((comp) => {
                const isSelected = selectedCompany === comp.companyName;
                return (
                  <button
                    key={comp.companyName}
                    type="button"
                    onClick={() => setSelectedCompany(isSelected ? 'ALL' : comp.companyName)}
                    className={`px-3.5 py-2 rounded-xl border text-left transition shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-indigo-600'}`} />
                      <span>{comp.companyName}</span>
                    </div>
                    <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-amber-200 font-bold' : 'text-slate-500'}`}>
                      {comp.txCount} Transaksi &bull;{' '}
                      {isMonetaryModule ? formatRupiah(comp.expenseAmount) : comp.unitOrNote}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticsData.kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{kpi.label}</span>
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  kpi.color === 'emerald'
                    ? 'bg-emerald-50 text-emerald-600'
                    : kpi.color === 'rose'
                    ? 'bg-rose-50 text-rose-600'
                    : kpi.color === 'amber'
                    ? 'bg-amber-50 text-amber-600'
                    : kpi.color === 'indigo'
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'bg-blue-50 text-blue-600'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="text-lg font-black font-mono text-slate-900 mt-2">{kpi.value}</div>
            <div className="text-[11px] text-slate-400 mt-1">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Rekapitulasi Mutasi & Daftar Pengeluaran Masing-Masing Perusahaan */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-indigo-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Rekapitulasi Mutasi &amp; Pengeluaran Masing-Masing Perusahaan
              </h4>
              <p className="text-[11px] text-slate-500">
                Klik pada baris perusahaan untuk memfilter daftar rincian pengeluaran di bawah khusus perusahaan tersebut
              </p>
            </div>
          </div>
          {isMonetaryModule && (
            <div className="text-xs font-mono font-bold text-indigo-900 bg-white px-3 py-1 rounded-xl border border-indigo-200">
              Total Gabungan Perusahaan: {formatRupiah(totalAllCompanyExpense)}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-4 w-10 text-center">No</th>
                <th className="py-2.5 px-4">Nama Perusahaan</th>
                <th className="py-2.5 px-4 text-center">Volume Transaksi</th>
                <th className="py-2.5 px-4">Keterangan Mutasi</th>
                <th className="py-2.5 px-4 text-right">
                  {isMonetaryModule ? 'Total Pengeluaran Perusahaan (Rp)' : 'Total Akumulasi'}
                </th>
                <th className="py-2.5 px-4 text-center">Porsi (%)</th>
                <th className="py-2.5 px-4 text-center">Aksi Filter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companyMutationStats.map((comp, idx) => {
                const isSelected = selectedCompany === comp.companyName;
                const pct =
                  totalAllCompanyExpense > 0
                    ? ((comp.expenseAmount / totalAllCompanyExpense) * 100).toFixed(1)
                    : '0.0';
                return (
                  <tr
                    key={comp.companyName}
                    onClick={() => setSelectedCompany(isSelected ? 'ALL' : comp.companyName)}
                    className={`transition cursor-pointer ${
                      isSelected ? 'bg-indigo-50/90 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{comp.companyName}</span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-700">
                      {comp.txCount} Data
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{comp.unitOrNote || '-'}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-black text-rose-700">
                      {isMonetaryModule ? formatRupiah(comp.expenseAmount) : formatNumber(comp.expenseAmount)}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-[11px] text-slate-600">
                      {pct}%
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCompany(isSelected ? 'ALL' : comp.companyName);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 hover:bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {isSelected ? '✓ Sedang Difilter' : 'Filter Mutasi PT'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visualisasi Grafik Recharts (BarChart & PieChart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {analyticsData.barTitle}
              </h4>
              <p className="text-[11px] text-slate-400">{periodLabel}</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analyticsData.barData} margin={{ top: 10, right: 15, left: 5, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#475569' }}
                  interval={0}
                  angle={-12}
                  textAnchor="end"
                  height={45}
                />
                <YAxis tick={{ fontSize: 10, fill: '#475569' }} />
                <Tooltip
                  formatter={(value: any) =>
                    typeof value === 'number' && value > 10000
                      ? formatRupiah(value)
                      : formatNumber(Number(value) || 0)
                  }
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {analyticsData.barKeys.map((bk, idx) =>
                  idx === 0 ? (
                    <Bar key={bk.key} dataKey={bk.key} name={bk.name} fill={bk.color} radius={[6, 6, 0, 0]} barSize={28} />
                  ) : (
                    <Line
                      key={bk.key}
                      type="monotone"
                      dataKey={bk.key}
                      name={bk.name}
                      stroke={bk.color}
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                  )
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {analyticsData.pieTitle}
            </h4>
            <p className="text-[11px] text-slate-400">Distribusi proporsi data modul</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="48%"
                  innerRadius={48}
                  outerRadius={82}
                  paddingAngle={3}
                >
                  {analyticsData.pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) =>
                    typeof value === 'number' && value > 10000
                      ? formatRupiah(value)
                      : formatNumber(Number(value) || 0)
                  }
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabel Daftar Rincian Pengeluaran / Transaksi Perusahaan */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Daftar Rincian Pengeluaran &amp; Mutasi ({selectedCompany === 'ALL' ? 'Semua Perusahaan' : selectedCompany}) — {analyticsData.tableRows.length} Data
            </h4>
          </div>
          <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            {analyticsData.summaryFooter}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center">No</th>
                {analyticsData.tableHeaders.map((h, i) => (
                  <th key={i} className="py-3 px-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {analyticsData.tableRows.length === 0 ? (
                <tr>
                  <td colSpan={analyticsData.tableHeaders.length + 1} className="py-10 text-center text-slate-400">
                    Tidak ada data transaksi pada filter perusahaan/periode yang dipilih.
                  </td>
                </tr>
              ) : (
                analyticsData.tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-blue-50/30 transition">
                    <td className="py-2.5 px-4 text-center font-mono text-slate-400">{rIdx + 1}</td>
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={`py-2.5 px-4 ${
                          cIdx === row.length - 1 ? 'font-mono font-bold text-slate-900' : ''
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Preview Cetak Laporan Analitik Modul */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto printable-slip-modal">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto printable-slip-card">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 print:hidden print-hide">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600" />
                <span>Pratinjau Cetak Laporan Mutasi Perusahaan: {title}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    printElementById(`printable-module-report-${moduleType}`, `Laporan_${moduleType}`)
                  }
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Printer</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <PrintOutPreviewStage documentLabel={`LAPORAN MUTASI PERUSAHAAN: ${title.toUpperCase()}`}>
              <div id={`printable-module-report-${moduleType}`} className="p-6 bg-white space-y-4 text-slate-900 text-xs">
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wide">
                      {selectedCompany === 'ALL'
                        ? 'KONSOLIDASI SELURUH PERUSAHAAN • 44S OPS_PRO'
                        : `${selectedCompany.toUpperCase()} • 44S OPS_PRO`}
                    </h2>
                    <h3 className="text-xs font-bold text-blue-800 mt-0.5">{title.toUpperCase()}</h3>
                    <p className="text-[10px] text-slate-500">{periodLabel}</p>
                  </div>
                  <div className="text-right text-[10px] font-mono">
                    <div className="font-bold border border-slate-900 px-2 py-0.5">LAPORAN MUTASI PERUSAHAAN</div>
                    <div className="mt-1">Tgl Cetak: {formatDateIndo(new Date().toISOString().slice(0, 10))}</div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {analyticsData.kpis.map((k, idx) => (
                    <div key={idx} className="p-2.5 border border-slate-300 rounded-lg bg-slate-50">
                      <div className="text-[9px] text-slate-500 uppercase font-bold">{k.label}</div>
                      <div className="text-xs font-black font-mono mt-0.5">{k.value}</div>
                    </div>
                  ))}
                </div>

                {/* Ringkasan per Perusahaan di Cetakan */}
                <div>
                  <div className="text-[10px] font-bold uppercase mb-1">
                    Rekapitulasi Pengeluaran / Mutasi per Perusahaan:
                  </div>
                  <table className="w-full text-[10px] text-left border border-slate-300 border-collapse mb-3">
                    <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                      <tr>
                        <th className="p-1.5 border-r border-slate-300">Nama Perusahaan</th>
                        <th className="p-1.5 border-r border-slate-300 text-center">Jumlah Data</th>
                        <th className="p-1.5 border-r border-slate-300">Keterangan</th>
                        <th className="p-1.5 text-right">
                          {isMonetaryModule ? 'Total Pengeluaran (Rp)' : 'Total'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {companyMutationStats.map((c) => (
                        <tr key={c.companyName}>
                          <td className="p-1.5 border-r border-slate-200 font-bold">{c.companyName}</td>
                          <td className="p-1.5 border-r border-slate-200 text-center">{c.txCount}</td>
                          <td className="p-1.5 border-r border-slate-200">{c.unitOrNote}</td>
                          <td className="p-1.5 text-right font-mono font-bold">
                            {isMonetaryModule ? formatRupiah(c.expenseAmount) : formatNumber(c.expenseAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase mb-1">
                    Daftar Rincian Transaksi / Pengeluaran ({selectedCompany === 'ALL' ? 'Semua Perusahaan' : selectedCompany}):
                  </div>
                  <table className="w-full text-[10px] text-left border border-slate-300 border-collapse">
                    <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                      <tr>
                        <th className="p-1.5 border-r border-slate-300 text-center">No</th>
                        {analyticsData.tableHeaders.map((h, i) => (
                          <th key={i} className="p-1.5 border-r border-slate-300">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {analyticsData.tableRows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          <td className="p-1.5 border-r border-slate-200 text-center font-mono">{rIdx + 1}</td>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-1.5 border-r border-slate-200">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-2.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[11px]">
                  {analyticsData.summaryFooter}
                </div>
              </div>
            </PrintOutPreviewStage>
          </div>
        </div>
      )}
    </div>
  );
};
