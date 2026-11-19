import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileBarChart,
  Printer,
  Download,
  Calendar,
  Fuel,
  Wrench,
  Wallet,
  FileText,
  Coins,
  ShieldCheck,
  Truck,
  Building,
  Landmark,
  Users,
  Clock,
  Layers,
  ArrowRight,
  ArrowLeftRight,
  Receipt,
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Filter,
  RotateCcw,
  Sparkles,
  CalendarRange,
  X,
  Check,
  Eye,
  TrendingUp,
  TrendingDown,
  Building2,
  ExternalLink,
  Briefcase,
  Phone,
  MapPin,
  CreditCard,
  SendHorizontal,
  FileCheck2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Vehicle,
  TaxRecord,
  FuelLog,
  OperationalFinance,
  DriverTimesheet,
  MaintenanceRecord,
  TripSheet,
  EquipmentCashFlow,
  DriverPocketCashFlow,
  CompanyDeposit,
  DepositTopUpRecord,
  FinancialAccount,
  EquipmentSupplier,
  Driver,
  AdminStaff,
  CompanyDepositRequest
} from '../../types';
import {
  formatRupiah,
  formatNumber,
  formatDateIndo
} from '../../utils/formatters';

export type ReportTabType =
  | 'overview'
  | 'deposit'
  | 'deposit_requests'
  | 'driver_pocket'
  | 'equipment'
  | 'vehicle_expenses'
  | 'tripsheet'
  | 'timesheet'
  | 'fuel'
  | 'company_costs'
  | 'cash_advances';

interface ReportsAnalyticsProps {
  vehicles: Vehicle[];
  taxes: TaxRecord[];
  fuelLogs: FuelLog[];
  finances: OperationalFinance[];
  timesheets: DriverTimesheet[];
  maintenance: MaintenanceRecord[];
  tripSheets?: TripSheet[];
  equipmentList?: EquipmentCashFlow[];
  pocketFlows?: DriverPocketCashFlow[];
  companyDeposits?: CompanyDeposit[];
  depositTopUps?: DepositTopUpRecord[];
  depositRequests?: CompanyDepositRequest[];
  accounts?: FinancialAccount[];
  suppliers?: EquipmentSupplier[];
  drivers?: Driver[];
  adminStaff?: AdminStaff[];
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({
  vehicles = [],
  taxes = [],
  fuelLogs = [],
  finances = [],
  timesheets = [],
  maintenance = [],
  tripSheets = [],
  equipmentList = [],
  pocketFlows = [],
  companyDeposits = [],
  depositTopUps = [],
  depositRequests = [],
  accounts = [],
  suppliers = [],
  drivers = [],
  adminStaff = []
}) => {
  // Navigation & Dropdown states
  const [activeReportTab, setActiveReportTab] = useState<ReportTabType>('overview');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Date Range states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeDatePreset, setActiveDatePreset] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); // 'ALL' or '01'..'12'
  const [selectedYear, setSelectedYear] = useState<string>('ALL'); // 'ALL' or '2024'..'2027'

  // Contextual filter states
  const [selectedVehicle, setSelectedVehicle] = useState('ALL');
  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [selectedDriver, setSelectedDriver] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedAccount, setSelectedAccount] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [singleCompanySubTab, setSingleCompanySubTab] = useState<'all_expenses' | 'topups' | 'trips' | 'pockets' | 'equipment'>('all_expenses');
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const safeTaxes = Array.isArray(taxes) ? taxes : [];
  const safeFuelLogs = Array.isArray(fuelLogs) ? fuelLogs : [];
  const safeFinances = Array.isArray(finances) ? finances : [];
  const safeTimesheets = Array.isArray(timesheets) ? timesheets : [];
  const safeMaintenance = Array.isArray(maintenance) ? maintenance : [];
  const safeTripSheets = Array.isArray(tripSheets) ? tripSheets : [];
  const safeEquipmentList = Array.isArray(equipmentList) ? equipmentList : [];
  const safePocketFlows = Array.isArray(pocketFlows) ? pocketFlows : [];
  const safeCompanyDeposits = Array.isArray(companyDeposits) ? companyDeposits : [];
  const safeDepositTopUps = Array.isArray(depositTopUps) ? depositTopUps : [];
  const safeDepositRequests = Array.isArray(depositRequests) ? depositRequests : [];
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];

  // Configuration of 11 reports
  const reportTabsConfig: {
    id: ReportTabType;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    category: string;
  }[] = [
    {
      id: 'overview',
      label: 'Ringkasan & Kinerja Armada',
      description: 'Matriks komprehensif ritase, solar, servis, laba bersih armada',
      icon: FileBarChart,
      category: 'Eksekutif'
    },
    {
      id: 'deposit',
      label: 'Laporan Deposit Perusahaan',
      description: 'Pencatatan deposit awal, top-up, penggunaan & saldo akhir',
      icon: Building,
      category: 'Keuangan Klien'
    },
    {
      id: 'deposit_requests',
      label: 'Laporan Pengajuan Deposit',
      description: 'Rekapitulasi permohonan deposit rekanan: nominal, approval, realisasi kas masuk & penolakan',
      icon: SendHorizontal,
      category: 'Keuangan Klien'
    },
    {
      id: 'driver_pocket',
      label: 'Laporan Uang Saku Driver',
      description: 'Pencairan sangu jalan, nota pengeluaran fisik, refund & LPJ',
      icon: Coins,
      category: 'Operasional Supir'
    },
    {
      id: 'equipment',
      label: 'Laporan Belanja Peralatan',
      description: 'Pengadaan sparepart, ban, oli, aki, toolkit & nota toko',
      icon: ShieldCheck,
      category: 'Pengadaan'
    },
    {
      id: 'vehicle_expenses',
      label: 'Laporan Pengeluaran Kendaraan',
      description: 'Total beban biaya solar, servis, saku jalan, & cost/KM per nopol',
      icon: Truck,
      category: 'Armada'
    },
    {
      id: 'tripsheet',
      label: 'Laporan Tripsheet (Perjalanan)',
      description: 'Surat jalan DO, supir, jam, durasi, jarak KM, muatan & biaya',
      icon: FileText,
      category: 'Logistik Rit'
    },
    {
      id: 'timesheet',
      label: 'Laporan Timesheet (Jam Kerja)',
      description: 'Jam mulai-selesai kerja, istirahat, lembur, ritase & absensi',
      icon: Clock,
      category: 'SDM Driver'
    },
    {
      id: 'fuel',
      label: 'Laporan BBM Solar',
      description: 'Transaksi SPBU, volume liter, biaya & rasio efisiensi KM/L',
      icon: Fuel,
      category: 'Bahan Bakar'
    },
    {
      id: 'company_costs',
      label: 'Laporan Operasional & Resume Perusahaan',
      description: 'Resume operasional terpadu per perusahaan: deposit masuk, pengeluaran & sisa saldo',
      icon: Landmark,
      category: 'Keuangan Klien'
    },
    {
      id: 'cash_advances',
      label: 'Laporan Kas & Uang Muka',
      description: 'Posisi saldo rekening kas bank & uang muka supir on-trip',
      icon: Wallet,
      category: 'Treasury'
    }
  ];

  const currentReportConfig = reportTabsConfig.find(r => r.id === activeReportTab) || reportTabsConfig[0];

  // Helper date checker
  const isDateInRange = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = dateStr.slice(0, 10);
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    if (selectedYear !== 'ALL') {
      const year = d.slice(0, 4);
      if (year !== selectedYear) return false;
    }
    if (selectedMonth !== 'ALL') {
      const month = d.slice(5, 7);
      if (month !== selectedMonth) return false;
    }
    return true;
  };

  // Quick Preset Date Handlers
  const applyDatePreset = (preset: 'today' | '7days' | 'this_month' | 'last_month' | 'this_year' | 'all') => {
    setActiveDatePreset(preset);
    setSelectedMonth('ALL');
    setSelectedYear('ALL');
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'today') {
      const today = formatYMD(now);
      setStartDate(today);
      setEndDate(today);
    } else if (preset === '7days') {
      const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      setStartDate(formatYMD(start));
      setEndDate(formatYMD(now));
    } else if (preset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(formatYMD(start));
      setEndDate(formatYMD(end));
    } else if (preset === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(formatYMD(start));
      setEndDate(formatYMD(end));
    } else if (preset === 'this_year') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      setStartDate(formatYMD(start));
      setEndDate(formatYMD(end));
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleResetFilters = () => {
    setActiveDatePreset('all');
    setStartDate('');
    setEndDate('');
    setSelectedMonth('ALL');
    setSelectedYear('ALL');
    setSelectedVehicle('ALL');
    setSelectedCompany('ALL');
    setSelectedDriver('ALL');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSelectedAccount('ALL');
    setSearchKeyword('');
  };

  const hasActiveFilters = Boolean(
    startDate ||
    endDate ||
    selectedMonth !== 'ALL' ||
    selectedYear !== 'ALL' ||
    selectedVehicle !== 'ALL' ||
    selectedCompany !== 'ALL' ||
    selectedDriver !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedAccount !== 'ALL' ||
    searchKeyword
  );

  // Distinct Lists for Dropdown Selectors
  const distinctVehicles = useMemo(() => {
    const map = new Map<string, string>();
    safeVehicles.forEach(v => {
      map.set(v.nopol, `${v.nopol} - ${v.brand} ${v.model}`);
    });
    return Array.from(map.entries());
  }, [safeVehicles]);

  const distinctCompanies = useMemo(() => {
    const list = new Set<string>();
    safeCompanyDeposits.forEach(c => {
      if (c.companyName) list.add(c.companyName);
    });
    safeDepositTopUps.forEach(t => {
      if (t.companyName) list.add(t.companyName);
    });
    safeTripSheets.forEach(t => {
      if (t.clientCompany) list.add(t.clientCompany);
      if (t.ownerCompany) list.add(t.ownerCompany);
    });
    safePocketFlows.forEach(p => {
      if (p.sourceCompanyName) list.add(p.sourceCompanyName);
      if (p.ownerCompany) list.add(p.ownerCompany);
    });
    safeEquipmentList.forEach(e => {
      if (e.purchasedByCompany) list.add(e.purchasedByCompany);
      if (e.ownerCompany) list.add(e.ownerCompany);
    });
    return Array.from(list).filter(Boolean).sort();
  }, [safeCompanyDeposits, safeDepositTopUps, safeTripSheets, safePocketFlows, safeEquipmentList]);

  const distinctDrivers = useMemo(() => {
    const list = new Set<string>();
    safeDrivers.forEach(d => {
      if (d.name) list.add(d.name);
    });
    safePocketFlows.forEach(p => {
      if (p.driverName) list.add(p.driverName);
    });
    safeTripSheets.forEach(t => {
      if (t.driverName) list.add(t.driverName);
    });
    return Array.from(list);
  }, [safeDrivers, safePocketFlows, safeTripSheets]);

  const distinctCategories = useMemo(() => {
    const set = new Set<string>([
      'Sparepart',
      'Ban',
      'Oli & Pelumas',
      'Aki / Kelistrikan',
      'Terpal & Tali',
      'Toolkit',
      'Peralatan K3',
      'Lainnya'
    ]);
    safeEquipmentList.forEach(e => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set);
  }, [safeEquipmentList]);

  // ============================================================
  // FILTERED DATASETS (REACT TO DATE RANGE & CONTEXTUAL FILTERS)
  // ============================================================

  // 1. Filtered Fuel Logs
  const filteredFuelLogs = useMemo(() => {
    return safeFuelLogs.filter(f => {
      if (!isDateInRange(f.date)) return false;
      if (selectedVehicle !== 'ALL' && f.vehicleId !== selectedVehicle && f.nopol !== selectedVehicle) return false;
      if (selectedDriver !== 'ALL' && f.driverName !== selectedDriver) return false;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        const match =
          (f.nopol && f.nopol.toLowerCase().includes(kw)) ||
          (f.driverName && f.driverName.toLowerCase().includes(kw)) ||
          (f.fuelStationName && f.fuelStationName.toLowerCase().includes(kw)) ||
          (f.location && f.location.toLowerCase().includes(kw));
        if (!match) return false;
      }
      return true;
    });
  }, [safeFuelLogs, startDate, endDate, selectedVehicle, selectedDriver, searchKeyword]);

  // 2. Filtered Operational Finances
  const filteredFinances = useMemo(() => {
    return safeFinances.filter(f => {
      if (!isDateInRange(f.date)) return false;
      if (selectedVehicle !== 'ALL' && f.vehicleId !== selectedVehicle && f.nopol !== selectedVehicle) return false;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        const match =
          (f.description && f.description.toLowerCase().includes(kw)) ||
          (f.nopol && f.nopol.toLowerCase().includes(kw)) ||
          (f.category && f.category.toLowerCase().includes(kw));
        if (!match) return false;
      }
      return true;
    });
  }, [safeFinances, startDate, endDate, selectedVehicle, searchKeyword]);

  // 3. Filtered Maintenance
  const filteredMaintenance = useMemo(() => {
    return safeMaintenance.filter(m => {
      if (!isDateInRange(m.date)) return false;
      if (selectedVehicle !== 'ALL' && m.vehicleId !== selectedVehicle && m.nopol !== selectedVehicle) return false;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        const match =
          (m.description && m.description.toLowerCase().includes(kw)) ||
          (m.nopol && m.nopol.toLowerCase().includes(kw)) ||
          (m.workshop && m.workshop.toLowerCase().includes(kw));
        if (!match) return false;
      }
      return true;
    });
  }, [safeMaintenance, startDate, endDate, selectedVehicle, searchKeyword]);

  // 4. Filtered Timesheets
  const filteredTimesheets = useMemo(() => {
    return safeTimesheets.filter(t => {
      if (!isDateInRange(t.date)) return false;
      if (selectedVehicle !== 'ALL' && t.vehicleId !== selectedVehicle && t.nopol !== selectedVehicle) return false;
      if (selectedDriver !== 'ALL' && t.driverName !== selectedDriver && t.driverId !== selectedDriver) return false;
      if (selectedStatus !== 'ALL') {
        const att = (t.attendanceStatus || 'hadir').toLowerCase();
        if (att !== selectedStatus.toLowerCase()) return false;
      }
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        const match =
          (t.driverName && t.driverName.toLowerCase().includes(kw)) ||
          (t.nopol && t.nopol.toLowerCase().includes(kw)) ||
          (t.originLocation && t.originLocation.toLowerCase().includes(kw)) ||
          (t.destinationLocation && t.destinationLocation.toLowerCase().includes(kw));
        if (!match) return false;
      }
      return true;
    });
  }, [safeTimesheets, startDate, endDate, selectedVehicle, selectedDriver, selectedStatus, searchKeyword]);

  // 5. Filtered Tripsheets
  const filteredTripSheets = useMemo(() => {
    return safeTripSheets.filter(t => {
      const tripDate = t.departureDate || t.arrivalDate;
      if (!isDateInRange(tripDate)) return false;
      if (selectedVehicle !== 'ALL' && t.vehicleId !== selectedVehicle && t.nopol !== selectedVehicle) return false;
      if (selectedDriver !== 'ALL' && t.driverName !== selectedDriver && t.driverId !== selectedDriver) return false;
      if (selectedCompany !== 'ALL' && t.clientCompany !== selectedCompany && t.ownerCompany !== selectedCompany) return false;
      if (selectedStatus !== 'ALL' && t.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        const match =
          (t.tripNumber && t.tripNumber.toLowerCase().includes(kw)) ||
          (t.suratJalanNumber && t.suratJalanNumber.toLowerCase().includes(kw)) ||
          (t.driverName && t.driverName.toLowerCase().includes(kw)) ||
          (t.nopol && t.nopol.toLowerCase().includes(kw)) ||
          (t.clientCompany && t.clientCompany.toLowerCase().includes(kw)) ||
          (t.cargoDescription && t.cargoDescription.toLowerCase().includes(kw)) ||
          (t.originLocation && t.originLocation.toLowerCase().includes(kw)) ||
          (t.destinationLocation && t.destinationLocation.toLowerCase().includes(kw));
        if (!match) return false;
      }
      return true;
    });
  }, [safeTripSheets, startDate, endDate, selectedVehicle, selectedDriver, selectedCompany, selectedStatus, searchKeyword]);

  // 6. Filtered Equipment List
  const filteredEquipmentList = useMemo(() => {
    return safeEquipmentList.filter(e => {
      if (!isDateInRange(e.date)) return false;
      if (selectedVehicle !== 'ALL' && e.vehicleId !== selectedVehicle && e.nopol !== selectedVehicle) return false;
      if (selectedCategory !== 'ALL' && e.category !== selectedCategory && e.itemType !== selectedCategory) return false;
      if (selectedCompany !== 'ALL' && e.purchasedByCompany !== selectedCompany && e.ownerCompany !== selectedCompany) return false;
      if (selectedStatus === 'with_receipt' && !e.receiptProofUrl) return false;
      if (selectedStatus === 'no_receipt' && e.receiptProofUrl) return false;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        const match =
          (e.equipmentName && e.equipmentName.toLowerCase().includes(kw)) ||
          (e.supplierOrStore && e.supplierOrStore.toLowerCase().includes(kw)) ||
          (e.category && e.category.toLowerCase().includes(kw)) ||
          (e.nopol && e.nopol.toLowerCase().includes(kw));
        if (!match) return false;
      }
      return true;
    });
  }, [safeEquipmentList, startDate, endDate, selectedVehicle, selectedCategory, selectedCompany, selectedStatus, searchKeyword]);

  // 7. Filtered Pocket Flows (Uang Saku Driver)
  const filteredPocketFlows = useMemo(() => {
    return safePocketFlows.filter(p => {
      if (!isDateInRange(p.date)) return false;
      if (selectedVehicle !== 'ALL' && p.vehicleId !== selectedVehicle && p.nopol !== selectedVehicle) return false;
      if (selectedDriver !== 'ALL' && p.driverName !== selectedDriver && p.driverId !== selectedDriver) return false;
      if (selectedStatus !== 'ALL' && p.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        const match =
          (p.tripCode && p.tripCode.toLowerCase().includes(kw)) ||
          (p.driverName && p.driverName.toLowerCase().includes(kw)) ||
          (p.nopol && p.nopol.toLowerCase().includes(kw)) ||
          (p.originLocation && p.originLocation.toLowerCase().includes(kw)) ||
          (p.destinationLocation && p.destinationLocation.toLowerCase().includes(kw));
        if (!match) return false;
      }
      return true;
    });
  }, [safePocketFlows, startDate, endDate, selectedVehicle, selectedDriver, selectedStatus, searchKeyword]);

  // 8. Filtered Company Deposits
  const filteredCompanyDeposits = useMemo(() => {
    return safeCompanyDeposits.filter(c => {
      if (selectedCompany !== 'ALL' && c.companyName !== selectedCompany && c.id !== selectedCompany) return false;
      if (selectedStatus === 'warning' && c.currentBalance > (c.minimumBalanceWarning || 0)) return false;
      if (selectedStatus === 'normal' && c.currentBalance <= (c.minimumBalanceWarning || 0)) return false;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        const match =
          (c.companyName && c.companyName.toLowerCase().includes(kw)) ||
          (c.picName && c.picName.toLowerCase().includes(kw)) ||
          (c.picPhone && c.picPhone.toLowerCase().includes(kw)) ||
          (c.notes && c.notes.toLowerCase().includes(kw));
        if (!match) return false;
      }
      return true;
    });
  }, [safeCompanyDeposits, selectedCompany, selectedStatus, searchKeyword]);

  // 8b. Filtered Company Deposit Requests
  const filteredDepositRequests = useMemo(() => {
    return safeDepositRequests.filter((req) => {
      if (!isDateInRange(req.requestDate)) return false;
      if (selectedCompany !== 'ALL' && req.companyName !== selectedCompany && req.companyId !== selectedCompany) return false;
      if (selectedStatus !== 'ALL' && req.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        const match =
          req.requestNumber.toLowerCase().includes(kw) ||
          req.companyName.toLowerCase().includes(kw) ||
          req.companyCode.toLowerCase().includes(kw) ||
          req.purpose.toLowerCase().includes(kw) ||
          req.applicantName.toLowerCase().includes(kw) ||
          (req.notes && req.notes.toLowerCase().includes(kw));
        if (!match) return false;
      }
      return true;
    });
  }, [safeDepositRequests, startDate, endDate, selectedMonth, selectedYear, selectedCompany, selectedStatus, searchKeyword]);

  // 9. Filtered Financial Accounts
  const filteredAccounts = useMemo(() => {
    return safeAccounts.filter(a => {
      if (selectedAccount !== 'ALL' && a.id !== selectedAccount && a.accountName !== selectedAccount) return false;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        const match =
          (a.accountName && a.accountName.toLowerCase().includes(kw)) ||
          (a.accountNumber && a.accountNumber.toLowerCase().includes(kw)) ||
          (a.bankName && a.bankName.toLowerCase().includes(kw));
        if (!match) return false;
      }
      return true;
    });
  }, [safeAccounts, selectedAccount, searchKeyword]);

  // 10. Filtered Fleet Performance Breakdown
  const filteredVehiclePerformance = useMemo(() => {
    let list = safeVehicles;
    if (selectedVehicle !== 'ALL') {
      list = list.filter(v => v.id === selectedVehicle || v.nopol === selectedVehicle);
    }
    if (selectedDriver !== 'ALL') {
      list = list.filter(v => v.assignedDriver === selectedDriver);
    }
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      list = list.filter(v =>
        (v.nopol && v.nopol.toLowerCase().includes(kw)) ||
        (v.assignedDriver && v.assignedDriver.toLowerCase().includes(kw)) ||
        (v.brand && v.brand.toLowerCase().includes(kw)) ||
        (v.model && v.model.toLowerCase().includes(kw)) ||
        (v.ownerCompany && v.ownerCompany.toLowerCase().includes(kw))
      );
    }

    return list.map(v => {
      const vFuel = filteredFuelLogs.filter(f => f && (f.vehicleId === v.id || f.nopol === v.nopol));
      const vFin = filteredFinances.filter(f => f && (f.vehicleId === v.id || f.nopol === v.nopol));
      const vMnt = filteredMaintenance.filter(m => m && (m.vehicleId === v.id || m.nopol === v.nopol));
      const vTs = filteredTimesheets.filter(t => t && (t.vehicleId === v.id || t.nopol === v.nopol));
      const vEq = filteredEquipmentList.filter(e => e && (e.vehicleId === v.id || e.nopol === v.nopol) && e.type === 'expense');
      const vPocket = filteredPocketFlows.filter(p => p && (p.vehicleId === v.id || p.nopol === v.nopol));

      const fuelCost = vFuel.reduce((sum, f) => sum + (f.totalCost || 0), 0);
      const liters = vFuel.reduce((sum, f) => sum + (f.volumeLiters || 0), 0);
      const opsCost = vFin.filter(f => f.type === 'expense').reduce((sum, f) => sum + (f.amount || 0), 0);
      const srvCost = vMnt.reduce((sum, m) => sum + (m.totalCost || 0), 0);
      const eqCost = vEq.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
      const pocketCost = vPocket.reduce((sum, p) => sum + (p.actualExpense || p.totalGiven || 0), 0);
      const income = vFin.filter(f => f.type === 'income').reduce((sum, f) => sum + (f.amount || 0), 0);
      const totalCost = fuelCost + opsCost + srvCost + eqCost + pocketCost;
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
        eqCost,
        pocketCost,
        totalCost,
        income,
        net,
        km,
        trips,
        avgKmL,
        unitCostPerKm
      };
    });
  }, [
    safeVehicles,
    selectedVehicle,
    selectedDriver,
    searchKeyword,
    filteredFuelLogs,
    filteredFinances,
    filteredMaintenance,
    filteredTimesheets,
    filteredEquipmentList,
    filteredPocketFlows
  ]);

  // 11. Filtered Company Cost Summary & Per-Company Operational Resume
  const filteredCompanyCostSummary = useMemo(() => {
    let list = safeCompanyDeposits;
    if (selectedCompany !== 'ALL') {
      list = list.filter(c => c.companyName === selectedCompany || c.id === selectedCompany);
    }
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      list = list.filter(c => c.companyName.toLowerCase().includes(kw) || (c.picName && c.picName.toLowerCase().includes(kw)));
    }

    return list.map(comp => {
      // 1. Pemasukan (Deposit Masuk)
      const initialDeposit = (comp as any).startingDeposit || comp.initialDeposit || 0;
      const compTopUps = safeDepositTopUps.filter(top =>
        (top.companyId === comp.id || (top.companyName && top.companyName.toLowerCase() === comp.companyName.toLowerCase())) &&
        isDateInRange(top.date)
      );
      const topUpTotal = compTopUps.length > 0
        ? compTopUps.reduce((s, t) => s + (t.amount || 0), 0)
        : (comp.totalTopUp || 0);
      const totalDepositIn = initialDeposit + topUpTotal;

      // 2. Pengeluaran: Uang Saku & Uang Jalan Supir
      const compPockets = filteredPocketFlows.filter(p =>
        (p.sourceCompanyId === comp.id ||
         (p.sourceCompanyName && p.sourceCompanyName.toLowerCase() === comp.companyName.toLowerCase()) ||
         (p.ownerCompany && p.ownerCompany.toLowerCase() === comp.companyName.toLowerCase()))
      );
      const pocketExpense = compPockets.reduce((s, p) => s + (p.actualExpense || p.totalGiven || 0), 0);

      // 3. Pengeluaran: Biaya Perjalanan Surat Jalan DO (Tripsheet)
      const compTrips = filteredTripSheets.filter(t =>
        (t.clientCompany && t.clientCompany.toLowerCase() === comp.companyName.toLowerCase()) ||
        (t.ownerCompany && t.ownerCompany.toLowerCase() === comp.companyName.toLowerCase())
      );
      const tripExpense = compTrips.reduce((s, t) => s + (t.actualTripExpense || t.totalPocketDisbursed || 0), 0);
      const totalDistanceKm = compTrips.reduce((s, t) => s + (t.totalDistanceKm || 0), 0);
      const totalTonnage = compTrips.reduce((s, t) => s + (t.cargoTonnageTon || 0), 0);

      // 4. Pengeluaran: Belanja & Pengadaan Peralatan/Sparepart
      const compEquip = filteredEquipmentList.filter(e =>
        (e.purchasedByCompany && e.purchasedByCompany.toLowerCase() === comp.companyName.toLowerCase()) ||
        (e.ownerCompany && e.ownerCompany.toLowerCase() === comp.companyName.toLowerCase())
      );
      const equipExpense = compEquip.reduce((s, e) => s + (e.totalAmount || 0), 0);

      // 5. Total Beban Pengeluaran (Dikeluarkan Berapa)
      const operationalExpenseSum = pocketExpense + tripExpense + equipExpense;
      const totalDeducted = operationalExpenseSum > 0 ? operationalExpenseSum : (comp.totalUsed || 0);

      // 6. Sisa Saldo Akhir Deposit Berjalan
      const netDepositBalance = totalDepositIn - totalDeducted;
      const utilizationPercent = totalDepositIn > 0 ? (totalDeducted / totalDepositIn) * 100 : 0;

      // 7. Combined List of Operational Expenses for single company resume
      const allExpensesList: {
        id: string;
        date: string;
        refNo: string;
        category: 'Uang Saku Supir' | 'Tripsheet DO' | 'Belanja Peralatan';
        driverOrVehicle: string;
        description: string;
        amount: number;
        receiptProofUrl?: string;
        status?: string;
      }[] = [];

      compPockets.forEach(p => {
        allExpensesList.push({
          id: p.id,
          date: p.date,
          refNo: p.tripCode || p.id,
          category: 'Uang Saku Supir',
          driverOrVehicle: `${p.driverName || '-'} (${p.nopol || '-'})`,
          description: `Uang Saku ${p.originLocation || ''} -> ${p.destinationLocation || ''}. Makan: ${formatRupiah(p.driverAllowance || 0)}, Tol: ${formatRupiah(p.tollAllowance || 0)}`,
          amount: p.actualExpense || p.totalGiven || 0,
          receiptProofUrl: p.receiptProofUrl,
          status: p.status
        });
      });

      compTrips.forEach(t => {
        allExpensesList.push({
          id: t.id,
          date: t.departureDate,
          refNo: t.suratJalanNumber || t.tripNumber || t.id,
          category: 'Tripsheet DO',
          driverOrVehicle: `${t.driverName || '-'} (${t.nopol || '-'})`,
          description: `Surat Jalan Rute ${t.originLocation} -> ${t.destinationLocation} (${t.cargoDescription || 'Muatan'}). Jarak: ${t.totalDistanceKm || 0} KM`,
          amount: t.actualTripExpense || t.totalPocketDisbursed || 0,
          receiptProofUrl: undefined,
          status: t.status
        });
      });

      compEquip.forEach(e => {
        allExpensesList.push({
          id: e.id,
          date: e.date,
          refNo: e.receiptNumber || e.id,
          category: 'Belanja Peralatan',
          driverOrVehicle: e.nopol || 'Alokasi Pool',
          description: `${e.equipmentName} (${e.quantity} ${e.unit}) - ${e.supplierOrStore}`,
          amount: e.totalAmount || 0,
          receiptProofUrl: e.receiptProofUrl,
          status: e.condition
        });
      });

      allExpensesList.sort((a, b) => b.date.localeCompare(a.date));

      return {
        company: comp,
        initialDeposit,
        topUps: compTopUps,
        totalTopUp: topUpTotal,
        totalDepositIn,
        compPockets,
        pocketExpense,
        compTrips,
        tripExpense,
        tripsCount: compTrips.length,
        totalDistanceKm,
        totalTonnage,
        compEquip,
        equipExpense,
        totalDeducted,
        netDepositBalance,
        utilizationPercent,
        allExpensesList
      };
    });
  }, [
    safeCompanyDeposits,
    safeDepositTopUps,
    selectedCompany,
    searchKeyword,
    filteredTripSheets,
    filteredEquipmentList,
    filteredPocketFlows,
    isDateInRange
  ]);

  // 12. Filtered Outstanding Advances (Uang Muka Beredar)
  const filteredOutstandingAdvances = useMemo(() => {
    return filteredPocketFlows.filter(p => p.status === 'disbursed' || p.status === 'in_trip');
  }, [filteredPocketFlows]);

  // ============================================================
  // SUM OF MONEY EVERYWHERE MONEY APPEARS (REAL-TIME TOTALS)
  // ============================================================

  // Overview / Fleet Performance Totals
  const sumFleetFuelExpense = filteredVehiclePerformance.reduce((s, vp) => s + vp.fuelCost, 0);
  const sumFleetSrvExpense = filteredVehiclePerformance.reduce((s, vp) => s + vp.srvCost, 0);
  const sumFleetPocketExpense = filteredVehiclePerformance.reduce((s, vp) => s + vp.pocketCost, 0);
  const sumFleetEqExpense = filteredVehiclePerformance.reduce((s, vp) => s + vp.eqCost, 0);
  const sumFleetOpsExpense = filteredVehiclePerformance.reduce((s, vp) => s + vp.opsCost, 0);
  const sumFleetTotalCost = filteredVehiclePerformance.reduce((s, vp) => s + vp.totalCost, 0);
  const sumFleetIncome = filteredVehiclePerformance.reduce((s, vp) => s + vp.income, 0);
  const sumFleetNet = filteredVehiclePerformance.reduce((s, vp) => s + vp.net, 0);
  const sumFleetTrips = filteredVehiclePerformance.reduce((s, vp) => s + vp.trips, 0);
  const sumFleetKm = filteredVehiclePerformance.reduce((s, vp) => s + vp.km, 0);
  const sumFleetLiters = filteredVehiclePerformance.reduce((s, vp) => s + vp.liters, 0);
  const sumFleetCostPerKm = sumFleetKm > 0 ? sumFleetTotalCost / sumFleetKm : 0;

  // Company Deposits Totals
  const sumDepositStarting = filteredCompanyDeposits.reduce((s, c) => s + (c.startingDeposit || 0), 0);
  const sumDepositTopUp = filteredCompanyDeposits.reduce((s, c) => s + (c.totalTopUp || 0), 0);
  const sumDepositUsed = filteredCompanyDeposits.reduce((s, c) => s + (c.totalUsed || 0), 0);
  const sumDepositCurrent = filteredCompanyDeposits.reduce((s, c) => s + (c.currentBalance || 0), 0);

  // Company Deposit Requests Totals
  const sumRequestTotalAmount = filteredDepositRequests.reduce((s, r) => s + (r.amount || 0), 0);
  const sumRequestCompletedAmount = filteredDepositRequests.filter(r => r.status === 'completed').reduce((s, r) => s + (r.amount || 0), 0);
  const sumRequestApprovedAmount = filteredDepositRequests.filter(r => r.status === 'approved').reduce((s, r) => s + (r.amount || 0), 0);
  const sumRequestPendingAmount = filteredDepositRequests.filter(r => r.status === 'pending').reduce((s, r) => s + (r.amount || 0), 0);
  const sumRequestRejectedAmount = filteredDepositRequests.filter(r => r.status === 'rejected').reduce((s, r) => s + (r.amount || 0), 0);

  // Driver Pocket Totals
  const sumPocketGiven = filteredPocketFlows.reduce((s, p) => s + (p.totalGiven || 0), 0);
  const sumPocketActual = filteredPocketFlows.reduce((s, p) => s + (p.actualExpense || p.totalGiven || 0), 0);
  const sumPocketRefund = filteredPocketFlows.reduce((s, p) => s + (p.refundAmount || 0), 0);

  // Equipment Totals
  const sumEquipmentQty = filteredEquipmentList.reduce((s, e) => s + (e.quantity || 0), 0);
  const sumEquipmentCost = filteredEquipmentList.reduce((s, e) => s + (e.totalAmount || 0), 0);

  // Tripsheet Totals
  const sumTripsheetKm = filteredTripSheets.reduce((s, t) => s + (t.totalDistanceKm || 0), 0);
  const sumTripsheetTonnage = filteredTripSheets.reduce((s, t) => s + (t.cargoTonnageTon || 0), 0);
  const sumTripsheetExpense = filteredTripSheets.reduce((s, t) => s + (t.actualTripExpense || t.totalPocketDisbursed || 0), 0);

  // Timesheet Totals
  const sumTimesheetHours = filteredTimesheets.reduce((s, t) => s + (t.totalHours || 0), 0);
  const sumTimesheetOvertime = filteredTimesheets.reduce((s, t) => s + (t.overtimeHours || 0), 0);
  const sumTimesheetKm = filteredTimesheets.reduce((s, t) => s + (t.totalDistanceKm || 0), 0);

  // Fuel Logs Totals
  const sumFuelLiters = filteredFuelLogs.reduce((s, f) => s + (f.volumeLiters || 0), 0);
  const sumFuelCost = filteredFuelLogs.reduce((s, f) => s + (f.totalCost || 0), 0);
  const avgFuelPricePerLiter = sumFuelLiters > 0 ? sumFuelCost / sumFuelLiters : 0;
  const avgKmPerLiter = filteredFuelLogs.length > 0 ? (filteredFuelLogs.reduce((s, f) => s + f.calculatedKmPerLiter, 0) / filteredFuelLogs.length) : 0;

  // Company Costs & Operational Resume Totals
  const sumCompanyCostTrips = filteredCompanyCostSummary.reduce((s, c) => s + c.tripsCount, 0);
  const sumCompanyCostDepositIn = filteredCompanyCostSummary.reduce((s, c) => s + c.totalDepositIn, 0);
  const sumCompanyCostPocketExp = filteredCompanyCostSummary.reduce((s, c) => s + c.pocketExpense, 0);
  const sumCompanyCostTripExp = filteredCompanyCostSummary.reduce((s, c) => s + c.tripExpense, 0);
  const sumCompanyCostEquipExp = filteredCompanyCostSummary.reduce((s, c) => s + c.equipExpense, 0);
  const sumCompanyCostTotalDeducted = filteredCompanyCostSummary.reduce((s, c) => s + c.totalDeducted, 0);
  const sumCompanyCostNetDeposit = filteredCompanyCostSummary.reduce((s, c) => s + c.netDepositBalance, 0);

  // Cash & Advances Totals
  const sumAccountsBalance = filteredAccounts.reduce((s, a) => s + (a.currentBalance || 0), 0);
  const sumOutstandingAdvances = filteredOutstandingAdvances.reduce((s, p) => s + (p.totalGiven || 0), 0);
  const sumNetLiquidAssets = sumAccountsBalance + sumOutstandingAdvances;

  // Date Range Label for Headers & Exports
  const dateRangeLabel = useMemo(() => {
    const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    if (selectedMonth !== 'ALL' || selectedYear !== 'ALL') {
      const mStr = selectedMonth !== 'ALL' ? monthNames[parseInt(selectedMonth, 10)] : 'Semua Bulan';
      const yStr = selectedYear !== 'ALL' ? `Tahun ${selectedYear}` : 'Semua Tahun';
      return `Periode: ${mStr} ${yStr}`;
    }
    if (startDate && endDate) {
      return `${formatDateIndo(startDate)} s/d ${formatDateIndo(endDate)}`;
    } else if (startDate) {
      return `Mulai ${formatDateIndo(startDate)}`;
    } else if (endDate) {
      return `Hingga ${formatDateIndo(endDate)}`;
    }
    return 'Semua Periode Transaksi';
  }, [startDate, endDate, selectedMonth, selectedYear]);

  // Common PDF Header Styling
  const drawReportPdfHeader = (doc: jsPDF, title: string, subtitle: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(30, 58, 138); // blue-900
    doc.rect(0, 0, pageWidth, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('44S OPS_PRO - SISTEM LOGISTIK & MANAJEMEN ARMADA', 14, 10);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(219, 234, 254);
    doc.text('Laporan Resmi Finansial & Operasional Terfilter', 14, 17);

    const printDate = new Date().toLocaleString('id-ID');
    doc.text(`Filter Periode: ${dateRangeLabel} | Dicetak: ${printDate}`, pageWidth - 14, 17, { align: 'right' });

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), 14, 32);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(subtitle, 14, 38);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(14, 41, pageWidth - 14, 41);
  };

  const drawReportPdfFooter = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setDrawColor(226, 232, 240);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Dokumen audit resmi 44S Ops_pro Enterprise. Dilengkapi kalkulasi total saldo & beban.', 14, pageHeight - 7);
      doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
    }
  };

  // Export handlers with Dynamic Totals in Excel & PDF
  const handlePrint = () => {
    window.print();
  };

  const handleExportCurrentTabExcel = () => {
    const wb = XLSX.utils.book_new();
    const periodTag = startDate ? `${startDate}_to_${endDate || 'now'}` : 'Semua_Periode';

    if (activeReportTab === 'deposit') {
      const rows: any[] = filteredCompanyDeposits.map((c, i) => ({
        No: i + 1,
        'Nama Perusahaan': c.companyName,
        'PIC / Kontak': `${c.picName} (${c.picPhone})`,
        'Deposit Awal (Rp)': c.startingDeposit,
        'Total Top-Up (Rp)': c.totalTopUp || 0,
        'Total Terpakai (Rp)': c.totalUsed || 0,
        'Saldo Akhir (Rp)': c.currentBalance,
        'Warning Minimum (Rp)': c.minimumBalanceWarning || 0,
        Status: c.status.toUpperCase()
      }));
      // Add Grand Total Row
      rows.push({
        No: 'TOTAL',
        'Nama Perusahaan': `GRAND TOTAL (${filteredCompanyDeposits.length} Perusahaan)`,
        'PIC / Kontak': '-',
        'Deposit Awal (Rp)': sumDepositStarting,
        'Total Top-Up (Rp)': sumDepositTopUp,
        'Total Terpakai (Rp)': sumDepositUsed,
        'Saldo Akhir (Rp)': sumDepositCurrent,
        'Warning Minimum (Rp)': '-',
        Status: '-'
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan_Deposit');
      XLSX.writeFile(wb, `Laporan_Deposit_Perusahaan_${periodTag}.xlsx`);
    } else if (activeReportTab === 'deposit_requests') {
      const rows: any[] = filteredDepositRequests.map((r, i) => ({
        No: i + 1,
        'No. Pengajuan': r.requestNumber,
        Tanggal: formatDateIndo(r.requestDate),
        'Perusahaan Rekanan': `${r.companyName} (${r.companyCode})`,
        'Pemohon': `${r.applicantName} (${r.applicantPhone || '-'})`,
        Jabatan: r.applicantRole || 'PIC Rekanan',
        Urgensi: r.urgencyLevel ? r.urgencyLevel.toUpperCase() : 'NORMAL',
        Keperluan: r.purpose,
        'Rekening Tujuan': r.targetAccountName || 'Rekening Operasional',
        'Nominal Diajukan (Rp)': r.amount,
        Status: r.status.toUpperCase(),
        'Disetujui Oleh': r.approvedBy || '-',
        'Tanggal Realisasi': r.completedAt || '-',
        'Alasan Penolakan': r.rejectionReason || '-'
      }));
      rows.push({
        No: 'TOTAL',
        'No. Pengajuan': `GRAND TOTAL (${filteredDepositRequests.length} Pengajuan)`,
        Tanggal: '-',
        'Perusahaan Rekanan': '-',
        'Pemohon': '-',
        Jabatan: '-',
        Urgensi: '-',
        Keperluan: `Disetujui: ${formatRupiah(sumRequestApprovedAmount)} | Realisasi: ${formatRupiah(sumRequestCompletedAmount)} | Pending: ${formatRupiah(sumRequestPendingAmount)}`,
        'Rekening Tujuan': '-',
        'Nominal Diajukan (Rp)': sumRequestTotalAmount,
        Status: '-',
        'Disetujui Oleh': '-',
        'Tanggal Realisasi': '-',
        'Alasan Penolakan': '-'
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Pengajuan_Deposit');
      XLSX.writeFile(wb, `Laporan_Pengajuan_Deposit_${periodTag}.xlsx`);
    } else if (activeReportTab === 'driver_pocket') {
      const rows: any[] = filteredPocketFlows.map((p, i) => ({
        No: i + 1,
        'No. Trip / DO': p.tripCode,
        Tanggal: p.date,
        Pengemudi: p.driverName,
        Armada: p.nopol,
        Rute: `${p.originLocation} -> ${p.destinationLocation}`,
        'Sangu Diberikan (Rp)': p.totalGiven,
        'BBM Jalan (Rp)': p.fuelExpense || 0,
        'Tol / E-Toll (Rp)': p.tollExpense || 0,
        'Uang Makan/Parkir (Rp)': (p.mealAllowance || 0) + (p.parkingRetribution || 0),
        'Total Realisasi Biaya (Rp)': p.actualExpense || p.totalGiven,
        'Sisa Kembali Refund (Rp)': p.refundAmount || 0,
        Status: p.status.toUpperCase()
      }));
      rows.push({
        No: 'TOTAL',
        'No. Trip / DO': `GRAND TOTAL (${filteredPocketFlows.length} Transaksi)`,
        Tanggal: '-',
        Pengemudi: '-',
        Armada: '-',
        Rute: '-',
        'Sangu Diberikan (Rp)': sumPocketGiven,
        'BBM Jalan (Rp)': '-',
        'Tol / E-Toll (Rp)': '-',
        'Uang Makan/Parkir (Rp)': '-',
        'Total Realisasi Biaya (Rp)': sumPocketActual,
        'Sisa Kembali Refund (Rp)': sumPocketRefund,
        Status: '-'
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Uang_Saku_Driver');
      XLSX.writeFile(wb, `Laporan_Penggunaan_Uang_Driver_${periodTag}.xlsx`);
    } else if (activeReportTab === 'equipment') {
      const rows: any[] = filteredEquipmentList.map((e, i) => ({
        No: i + 1,
        Tanggal: e.date,
        'Nama Peralatan / Part': e.equipmentName,
        Kategori: e.category,
        'Alokasi Armada': e.nopol || 'Pool',
        Supplier: e.supplierOrStore,
        Jumlah: `${e.quantity} ${e.unit}`,
        'Harga Satuan (Rp)': e.unitPrice,
        'Total Biaya (Rp)': e.totalAmount,
        Rekening: e.accountName,
        'Bukti Nota': e.receiptProofUrl ? 'Ada' : 'Tidak'
      }));
      rows.push({
        No: 'TOTAL',
        Tanggal: '-',
        'Nama Peralatan / Part': `GRAND TOTAL (${filteredEquipmentList.length} Item)`,
        Kategori: '-',
        'Alokasi Armada': '-',
        Supplier: '-',
        Jumlah: `${sumEquipmentQty} Unit Total`,
        'Harga Satuan (Rp)': '-',
        'Total Biaya (Rp)': sumEquipmentCost,
        Rekening: '-',
        'Bukti Nota': '-'
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Belanja_Peralatan');
      XLSX.writeFile(wb, `Laporan_Pembelian_Peralatan_${periodTag}.xlsx`);
    } else if (activeReportTab === 'vehicle_expenses' || activeReportTab === 'overview') {
      const rows: any[] = filteredVehiclePerformance.map((vp, i) => ({
        No: i + 1,
        'No. Polisi': vp.vehicle.nopol,
        Tipe: `${vp.vehicle.brand} ${vp.vehicle.model}`,
        Pengemudi: vp.vehicle.assignedDriver,
        'Ritase (Rit)': vp.trips,
        'Jarak (KM)': vp.km,
        'BBM (Liter)': vp.liters,
        'Biaya BBM (Rp)': vp.fuelCost,
        'Biaya Servis (Rp)': vp.srvCost,
        'Biaya Saku / Jalan (Rp)': vp.pocketCost,
        'Biaya Peralatan (Rp)': vp.eqCost,
        'Biaya Operasional (Rp)': vp.opsCost,
        'Total Biaya (Rp)': vp.totalCost,
        'Pendapatan (Rp)': vp.income,
        'Laba Bersih (Rp)': vp.net,
        'Cost / KM (Rp)': Math.round(vp.unitCostPerKm)
      }));
      rows.push({
        No: 'TOTAL',
        'No. Polisi': `GRAND TOTAL (${filteredVehiclePerformance.length} Unit Armada)`,
        Tipe: '-',
        Pengemudi: '-',
        'Ritase (Rit)': sumFleetTrips,
        'Jarak (KM)': sumFleetKm,
        'BBM (Liter)': sumFleetLiters,
        'Biaya BBM (Rp)': sumFleetFuelExpense,
        'Biaya Servis (Rp)': sumFleetSrvExpense,
        'Biaya Saku / Jalan (Rp)': sumFleetPocketExpense,
        'Biaya Peralatan (Rp)': sumFleetEqExpense,
        'Biaya Operasional (Rp)': sumFleetOpsExpense,
        'Total Biaya (Rp)': sumFleetTotalCost,
        'Pendapatan (Rp)': sumFleetIncome,
        'Laba Bersih (Rp)': sumFleetNet,
        'Cost / KM (Rp)': Math.round(sumFleetCostPerKm)
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Pengeluaran_Armada');
      XLSX.writeFile(wb, `Laporan_Pengeluaran_Kendaraan_${periodTag}.xlsx`);
    } else if (activeReportTab === 'tripsheet') {
      const rows: any[] = filteredTripSheets.map((t, i) => ({
        No: i + 1,
        'No. Trip': t.tripNumber,
        'No. Surat Jalan': t.suratJalanNumber,
        Tanggal: t.departureDate,
        Supir: t.driverName,
        Armada: t.nopol,
        'Klien Tujuan': t.clientCompany,
        'Rute Asal -> Tujuan': `${t.originLocation} -> ${t.destinationLocation}`,
        'Jam Berangkat': t.departureTime || '-',
        'Jam Tiba': t.arrivalTime || '-',
        'Durasi Perjalanan': t.tripDuration || '-',
        'KM Awal': t.startOdometer,
        'KM Akhir': t.endOdometer,
        'Jarak (KM)': t.totalDistanceKm,
        'Muatan Barang': t.cargoDescription,
        'Tonase (Ton)': t.cargoTonnageTon,
        'Biaya Perjalanan (Rp)': t.actualTripExpense || t.totalPocketDisbursed,
        Status: t.status.toUpperCase()
      }));
      rows.push({
        No: 'TOTAL',
        'No. Trip': `GRAND TOTAL (${filteredTripSheets.length} Lembar DO)`,
        'No. Surat Jalan': '-',
        Tanggal: '-',
        Supir: '-',
        Armada: '-',
        'Klien Tujuan': '-',
        'Rute Asal -> Tujuan': '-',
        'Jam Berangkat': '-',
        'Jam Tiba': '-',
        'Durasi Perjalanan': '-',
        'KM Awal': '-',
        'KM Akhir': '-',
        'Jarak (KM)': sumTripsheetKm,
        'Muatan Barang': '-',
        'Tonase (Ton)': sumTripsheetTonnage,
        'Biaya Perjalanan (Rp)': sumTripsheetExpense,
        Status: '-'
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Tripsheet_Perjalanan');
      XLSX.writeFile(wb, `Laporan_Tripsheet_${periodTag}.xlsx`);
    } else if (activeReportTab === 'timesheet') {
      const rows: any[] = filteredTimesheets.map((ts, i) => ({
        No: i + 1,
        Tanggal: ts.date,
        Pengemudi: ts.driverName,
        Armada: ts.nopol,
        'Rute Jalan': `${ts.originLocation} -> ${ts.destinationLocation}`,
        'Jam Mulai': ts.startTime,
        'Jam Selesai': ts.endTime,
        'Istirahat (Menit)': ts.breakMinutes || 60,
        'Total Jam Kerja': ts.totalHours,
        'Lembur (Jam)': ts.overtimeHours,
        'Hari Kerja': ts.attendanceStatus ? ts.attendanceStatus.toUpperCase() : 'HADIR',
        Ritase: ts.tripCount,
        'Jarak (KM)': ts.totalDistanceKm
      }));
      rows.push({
        No: 'TOTAL',
        Tanggal: '-',
        Pengemudi: `GRAND TOTAL (${filteredTimesheets.length} Catatan)`,
        Armada: '-',
        'Rute Jalan': '-',
        'Jam Mulai': '-',
        'Jam Selesai': '-',
        'Istirahat (Menit)': '-',
        'Total Jam Kerja': sumTimesheetHours,
        'Lembur (Jam)': sumTimesheetOvertime,
        'Hari Kerja': '-',
        Ritase: '-',
        'Jarak (KM)': sumTimesheetKm
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Timesheet_JamKerja');
      XLSX.writeFile(wb, `Laporan_Timesheet_${periodTag}.xlsx`);
    } else if (activeReportTab === 'fuel') {
      const rows: any[] = filteredFuelLogs.map((f, i) => ({
        No: i + 1,
        Tanggal: f.date,
        'No. Polisi': f.nopol,
        Pengemudi: f.driverName,
        SPBU: `${f.fuelStationName} (${f.location})`,
        'Volume (Liter)': f.volumeLiters,
        'Harga / Liter (Rp)': f.costPerLiter,
        'Total Biaya (Rp)': f.totalCost,
        Odometer: f.odometerKm,
        'Efisiensi (KM/L)': f.calculatedKmPerLiter
      }));
      rows.push({
        No: 'TOTAL',
        Tanggal: '-',
        'No. Polisi': `GRAND TOTAL (${filteredFuelLogs.length} Pengisian)`,
        Pengemudi: '-',
        SPBU: '-',
        'Volume (Liter)': sumFuelLiters,
        'Harga / Liter (Rp)': Math.round(avgFuelPricePerLiter),
        'Total Biaya (Rp)': sumFuelCost,
        Odometer: '-',
        'Efisiensi (KM/L)': avgKmPerLiter.toFixed(2)
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Konsumsi_BBM');
      XLSX.writeFile(wb, `Laporan_Konsumsi_BBM_${periodTag}.xlsx`);
    } else if (activeReportTab === 'company_costs') {
      const isSingle = selectedCompany !== 'ALL' && filteredCompanyCostSummary.length === 1;
      if (isSingle) {
        const sc = filteredCompanyCostSummary[0];
        // Sheet 1: Resume Eksekutif
        const resumeRows = [
          { Parameter: 'Nama Perusahaan Rekanan', Nilai: sc.company.companyName },
          { Parameter: 'Kode Rekanan', Nilai: sc.company.companyCode },
          { Parameter: 'Nama PIC', Nilai: sc.company.picName },
          { Parameter: 'Kontak Telepon PIC', Nilai: sc.company.picPhone },
          { Parameter: 'Periode Filter', Nilai: dateRangeLabel },
          { Parameter: '-----------------------------', Nilai: '-----------------------------' },
          { Parameter: 'TOTAL DEPOSIT MASUK (RP)', Nilai: sc.totalDepositIn },
          { Parameter: ' - Deposit Awal / Kontrak (Rp)', Nilai: sc.initialDeposit },
          { Parameter: ' - Akumulasi Top-Up Masuk (Rp)', Nilai: sc.totalTopUp },
          { Parameter: '-----------------------------', Nilai: '-----------------------------' },
          { Parameter: 'TOTAL DANA DIKELUARKAN (RP)', Nilai: sc.totalDeducted },
          { Parameter: ' - Pengeluaran Uang Saku Supir (Rp)', Nilai: sc.pocketExpense },
          { Parameter: ' - Beban Biaya Perjalanan Tripsheet (Rp)', Nilai: sc.tripExpense },
          { Parameter: ' - Belanja Peralatan & Sparepart (Rp)', Nilai: sc.equipExpense },
          { Parameter: '-----------------------------', Nilai: '-----------------------------' },
          { Parameter: 'SISA SALDO DEPOSIT AKHIR (RP)', Nilai: sc.netDepositBalance },
          { Parameter: 'Persentase Realisasi / Penyerapan', Nilai: `${sc.utilizationPercent.toFixed(1)}%` },
          { Parameter: 'Total Ritase Perjalanan', Nilai: `${sc.tripsCount} Rit` },
          { Parameter: 'Total Jarak Tempuh', Nilai: `${sc.totalDistanceKm} KM` },
          { Parameter: 'Total Muatan Kargo', Nilai: `${sc.totalTonnage} Ton` }
        ];
        const ws1 = XLSX.utils.json_to_sheet(resumeRows);
        XLSX.utils.book_append_sheet(wb, ws1, 'Resume_Eksekutif');

        // Sheet 2: Riwayat Deposit Masuk
        const topUpRows = sc.topUps.map((t, i) => ({
          No: i + 1,
          Tanggal: t.date,
          'Nomor Bukti Transfer': t.transferProofNumber,
          'Nominal Top-Up (Rp)': t.amount,
          'Metode Pembayaran': t.paymentMethod,
          Catatan: t.notes || '-'
        }));
        const ws2 = XLSX.utils.json_to_sheet(topUpRows);
        XLSX.utils.book_append_sheet(wb, ws2, 'Riwayat_Deposit_Masuk');

        // Sheet 3: Rincian Seluruh Pengeluaran
        const expRows = sc.allExpensesList.map((e, i) => ({
          No: i + 1,
          Tanggal: e.date,
          'No Ref / DO / Kwitansi': e.refNo,
          Kategori: e.category,
          'Armada / Supir': e.driverOrVehicle,
          'Deskripsi Operasional': e.description,
          'Nominal Dikeluarkan (Rp)': e.amount
        }));
        expRows.push({
          No: 'TOTAL',
          Tanggal: '-',
          'No Ref / DO / Kwitansi': '-',
          Kategori: 'TOTAL PENGELUARAN',
          'Armada / Supir': '-',
          'Deskripsi Operasional': `Total ${sc.allExpensesList.length} Transaksi`,
          'Nominal Dikeluarkan (Rp)': sc.totalDeducted
        });
        const ws3 = XLSX.utils.json_to_sheet(expRows);
        XLSX.utils.book_append_sheet(wb, ws3, 'Rincian_Pengeluaran');

        const safeCompName = sc.company.companyName.replace(/[^a-zA-Z0-9]/g, '_');
        XLSX.writeFile(wb, `Resume_Operasional_${safeCompName}_${periodTag}.xlsx`);
      } else {
        const rows: any[] = filteredCompanyCostSummary.map((cs, i) => ({
          No: i + 1,
          'Perusahaan Rekanan': cs.company.companyName,
          'Kode Rekanan': cs.company.companyCode,
          PIC: cs.company.picName,
          'Deposit Masuk Berapa (Rp)': cs.totalDepositIn,
          'Uang Saku Supir (Rp)': cs.pocketExpense,
          'Biaya Tripsheet Rute (Rp)': cs.tripExpense,
          'Belanja Peralatan & Sparepart (Rp)': cs.equipExpense,
          'Dikeluarkan Berapa (Rp)': cs.totalDeducted,
          'Sisa Saldo Deposit (Rp)': cs.netDepositBalance,
          'Penyerapan (%)': `${cs.utilizationPercent.toFixed(1)}%`,
          'Ritase Perjalanan': `${cs.tripsCount} Rit`
        }));
        rows.push({
          No: 'TOTAL',
          'Perusahaan Rekanan': `GRAND TOTAL (${filteredCompanyCostSummary.length} Perusahaan)`,
          'Kode Rekanan': '-',
          PIC: '-',
          'Deposit Masuk Berapa (Rp)': sumCompanyCostDepositIn,
          'Uang Saku Supir (Rp)': sumCompanyCostPocketExp,
          'Biaya Tripsheet Rute (Rp)': sumCompanyCostTripExp,
          'Belanja Peralatan & Sparepart (Rp)': sumCompanyCostEquipExp,
          'Dikeluarkan Berapa (Rp)': sumCompanyCostTotalDeducted,
          'Sisa Saldo Deposit (Rp)': sumCompanyCostNetDeposit,
          'Penyerapan (%)': sumCompanyCostDepositIn > 0 ? `${((sumCompanyCostTotalDeducted / sumCompanyCostDepositIn) * 100).toFixed(1)}%` : '0%',
          'Ritase Perjalanan': `${sumCompanyCostTrips} Rit`
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Resume_Per_Perusahaan');
        XLSX.writeFile(wb, `Laporan_Resume_Perusahaan_${periodTag}.xlsx`);
      }
    } else if (activeReportTab === 'cash_advances') {
      const dataBank: any[] = filteredAccounts.map((a, i) => ({
        No: i + 1,
        'Nama Akun Rekening': a.accountName,
        'Nomor Rekening': a.accountNumber,
        'Bank / Kas': a.bankName,
        'Saldo Kas (Rp)': a.currentBalance,
        Tipe: a.type.toUpperCase()
      }));
      dataBank.push({
        No: 'TOTAL',
        'Nama Akun Rekening': `TOTAL SALDO KAS & BANK`,
        'Nomor Rekening': '-',
        'Bank / Kas': '-',
        'Saldo Kas (Rp)': sumAccountsBalance,
        Tipe: '-'
      });
      const ws1 = XLSX.utils.json_to_sheet(dataBank);
      XLSX.utils.book_append_sheet(wb, ws1, 'Saldo_Kas_Bank');

      const dataAdvances: any[] = filteredOutstandingAdvances.map((p, i) => ({
        No: i + 1,
        'No. Trip': p.tripCode,
        Tanggal: p.date,
        Pengemudi: p.driverName,
        Armada: p.nopol,
        'Uang Muka Beredar (Rp)': p.totalGiven,
        Status: p.status.toUpperCase()
      }));
      dataAdvances.push({
        No: 'TOTAL',
        'No. Trip': `TOTAL UANG MUKA BEREDAR`,
        Tanggal: '-',
        Pengemudi: '-',
        Armada: '-',
        'Uang Muka Beredar (Rp)': sumOutstandingAdvances,
        Status: '-'
      });
      const ws2 = XLSX.utils.json_to_sheet(dataAdvances);
      XLSX.utils.book_append_sheet(wb, ws2, 'Uang_Muka_Beredar');

      XLSX.writeFile(wb, `Laporan_Saldo_Kas_dan_Uang_Muka_${periodTag}.xlsx`);
    }
  };

  const handleExportCurrentTabPDF = () => {
    const doc = new jsPDF('landscape');
    const periodTag = startDate ? `${startDate}_to_${endDate || 'now'}` : 'Semua_Periode';

    if (activeReportTab === 'deposit') {
      drawReportPdfHeader(doc, 'LAPORAN DEPOSIT PERUSAHAAN REKANAN', 'Rekapitulasi Saldo Deposit, Penerimaan Top-Up, & Penggunaan Dana');
      const rows = filteredCompanyDeposits.map((c, i) => [
        i + 1,
        c.companyName,
        c.picName,
        formatRupiah(c.startingDeposit),
        formatRupiah(c.totalTopUp || 0),
        formatRupiah(c.totalUsed || 0),
        formatRupiah(c.currentBalance),
        c.status.toUpperCase()
      ]);
      rows.push([
        'TOTAL',
        `GRAND TOTAL (${filteredCompanyDeposits.length} Perusahaan)`,
        '-',
        formatRupiah(sumDepositStarting),
        formatRupiah(sumDepositTopUp),
        formatRupiah(sumDepositUsed),
        formatRupiah(sumDepositCurrent),
        '-'
      ]);
      autoTable(doc, {
        startY: 45,
        head: [['No', 'Perusahaan Rekanan', 'PIC', 'Deposit Awal', 'Total Top-Up', 'Total Terpakai', 'Saldo Akhir', 'Status']],
        body: rows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 58, 138] },
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' }
      });
      drawReportPdfFooter(doc);
      doc.save(`Laporan_Deposit_Perusahaan_${periodTag}.pdf`);
    } else if (activeReportTab === 'deposit_requests') {
      drawReportPdfHeader(doc, 'LAPORAN PENGAJUAN DEPOSIT PERUSAHAAN', 'Rekapitulasi Permohonan Plafon Deposit Masuk, Persetujuan & Realisasi Saldo');
      const rows = filteredDepositRequests.map((r, i) => [
        i + 1,
        r.requestNumber,
        formatDateIndo(r.requestDate),
        r.companyName,
        r.applicantName,
        r.purpose,
        r.targetAccountName || 'Rekening Operasional',
        formatRupiah(r.amount),
        r.status.toUpperCase()
      ]);
      rows.push([
        'TOTAL',
        `GRAND TOTAL (${filteredDepositRequests.length} Pengajuan)`,
        '-',
        '-',
        '-',
        `Disetujui: ${formatRupiah(sumRequestApprovedAmount)} | Realisasi: ${formatRupiah(sumRequestCompletedAmount)}`,
        '-',
        formatRupiah(sumRequestTotalAmount),
        '-'
      ]);
      autoTable(doc, {
        startY: 45,
        head: [['No', 'No. Pengajuan', 'Tanggal', 'Perusahaan Rekanan', 'Pemohon', 'Keperluan', 'Rekening Kas', 'Nominal', 'Status']],
        body: rows,
        styles: { fontSize: 7.5 },
        headStyles: { fillColor: [30, 58, 138] },
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' }
      });
      drawReportPdfFooter(doc);
      doc.save(`Laporan_Pengajuan_Deposit_${periodTag}.pdf`);
    } else if (activeReportTab === 'driver_pocket') {
      drawReportPdfHeader(doc, 'LAPORAN PENGGUNAAN UANG SAKU DRIVER', 'Rekonsiliasi Sangu Jalan, Realisasi Biaya Tol/BBM, & LPJ');
      const rows = filteredPocketFlows.map((p, i) => [
        i + 1,
        p.tripCode,
        formatDateIndo(p.date),
        p.driverName,
        p.nopol,
        `${p.originLocation} -> ${p.destinationLocation}`,
        formatRupiah(p.totalGiven),
        formatRupiah(p.actualExpense || p.totalGiven),
        formatRupiah(p.refundAmount || 0),
        p.status.toUpperCase()
      ]);
      rows.push([
        'TOTAL',
        `GRAND TOTAL (${filteredPocketFlows.length} Transaksi)`,
        '-',
        '-',
        '-',
        '-',
        formatRupiah(sumPocketGiven),
        formatRupiah(sumPocketActual),
        formatRupiah(sumPocketRefund),
        '-'
      ]);
      autoTable(doc, {
        startY: 45,
        head: [['No', 'No. Trip', 'Tanggal', 'Driver', 'Nopol', 'Rute', 'Sangu Cair', 'Realisasi Fisik', 'Sisa Refund', 'Status']],
        body: rows,
        styles: { fontSize: 7.5 },
        headStyles: { fillColor: [5, 150, 105] }
      });
      drawReportPdfFooter(doc);
      doc.save(`Laporan_Uang_Saku_Driver_${periodTag}.pdf`);
    } else if (activeReportTab === 'equipment') {
      drawReportPdfHeader(doc, 'LAPORAN PEMBELIAN PERALATAN & SPAREPART', 'Pengadaan Suku Cadang, Ban, Oli, Aki, Terpal & Alat Kerja');
      const rows = filteredEquipmentList.map((e, i) => [
        i + 1,
        formatDateIndo(e.date),
        e.equipmentName,
        e.category,
        e.nopol || 'Pool',
        e.supplierOrStore,
        `${e.quantity} ${e.unit}`,
        formatRupiah(e.totalAmount),
        e.receiptProofUrl ? 'ADA NOTA' : 'TIDAK'
      ]);
      rows.push([
        'TOTAL',
        `GRAND TOTAL (${filteredEquipmentList.length} Item)`,
        '-',
        '-',
        '-',
        '-',
        `${sumEquipmentQty} Unit Total`,
        formatRupiah(sumEquipmentCost),
        '-'
      ]);
      autoTable(doc, {
        startY: 45,
        head: [['No', 'Tanggal', 'Nama Peralatan / Part', 'Kategori', 'Unit Armada', 'Supplier / Toko', 'Qty', 'Total Biaya', 'Nota']],
        body: rows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [217, 119, 6] }
      });
      drawReportPdfFooter(doc);
      doc.save(`Laporan_Pembelian_Peralatan_${periodTag}.pdf`);
    } else if (activeReportTab === 'tripsheet') {
      drawReportPdfHeader(doc, 'LAPORAN TRIPSHEET & SURAT JALAN', 'Rincian Perjalanan Pengemudi, Jarak Tempuh KM, Durasi, Muatan & Biaya Rute');
      const rows = filteredTripSheets.map((ts, i) => [
        i + 1,
        ts.tripNumber,
        formatDateIndo(ts.departureDate),
        ts.driverName,
        ts.nopol,
        ts.clientCompany,
        `${ts.originLocation} -> ${ts.destinationLocation}`,
        `${formatNumber(ts.totalDistanceKm)} KM`,
        `${ts.cargoTonnageTon} Ton`,
        formatRupiah(ts.actualTripExpense || ts.totalPocketDisbursed),
        ts.status.toUpperCase()
      ]);
      rows.push([
        'TOTAL',
        `GRAND TOTAL (${filteredTripSheets.length} DO)`,
        '-',
        '-',
        '-',
        '-',
        '-',
        `${formatNumber(sumTripsheetKm)} KM`,
        `${sumTripsheetTonnage} Ton`,
        formatRupiah(sumTripsheetExpense),
        '-'
      ]);
      autoTable(doc, {
        startY: 45,
        head: [['No', 'No. Trip', 'Tanggal', 'Driver', 'Nopol', 'Klien', 'Rute', 'Jarak', 'Tonase', 'Biaya Rute', 'Status']],
        body: rows,
        styles: { fontSize: 7.5 },
        headStyles: { fillColor: [30, 58, 138] }
      });
      drawReportPdfFooter(doc);
      doc.save(`Laporan_Tripsheet_${periodTag}.pdf`);
    } else if (activeReportTab === 'timesheet') {
      drawReportPdfHeader(doc, 'LAPORAN TIMESHEET JAM KERJA PENGEMUDI', 'Rincian Jam Mulai, Selesai, Istirahat, Lembur, Hari Kerja & KM Perjalanan');
      const rows = filteredTimesheets.map((ts, i) => [
        i + 1,
        formatDateIndo(ts.date),
        ts.driverName,
        ts.nopol,
        `${ts.startTime} - ${ts.endTime}`,
        `${ts.breakMinutes || 60}m`,
        `${ts.totalHours} Jam`,
        ts.overtimeHours > 0 ? `+${ts.overtimeHours} Jam` : '-',
        ts.attendanceStatus ? ts.attendanceStatus.toUpperCase() : 'HADIR',
        `${ts.totalDistanceKm} KM`
      ]);
      rows.push([
        'TOTAL',
        `GRAND TOTAL (${filteredTimesheets.length} Catatan)`,
        '-',
        '-',
        '-',
        '-',
        `${sumTimesheetHours.toFixed(1)} Jam`,
        `+${sumTimesheetOvertime.toFixed(1)} Jam`,
        '-',
        `${formatNumber(sumTimesheetKm)} KM`
      ]);
      autoTable(doc, {
        startY: 45,
        head: [['No', 'Tanggal', 'Driver', 'Nopol', 'Jam Kerja', 'Istirahat', 'Total Jam', 'Lembur', 'Hari Kerja', 'Jarak']],
        body: rows,
        styles: { fontSize: 7.5 },
        headStyles: { fillColor: [2, 132, 199] }
      });
      drawReportPdfFooter(doc);
      doc.save(`Laporan_Timesheet_${periodTag}.pdf`);
    } else if (activeReportTab === 'fuel') {
      drawReportPdfHeader(doc, 'LAPORAN PENGISIAN BBM SOLAR & EFISIENSI', 'Catatan Transaksi SPBU, Volume Liter, Total Biaya & Rasio Konsumsi KM/L');
      const rows = filteredFuelLogs.map((fl, i) => [
        i + 1,
        formatDateIndo(fl.date),
        fl.fuelStationName,
        fl.nopol,
        fl.driverName,
        `${formatNumber(fl.odometerKm)} KM`,
        `${formatNumber(fl.volumeLiters)} L`,
        formatRupiah(fl.costPerLiter),
        formatRupiah(fl.totalCost),
        `${fl.calculatedKmPerLiter.toFixed(2)} Km/L`
      ]);
      rows.push([
        'TOTAL',
        `GRAND TOTAL (${filteredFuelLogs.length} Pengisian)`,
        '-',
        '-',
        '-',
        '-',
        `${formatNumber(sumFuelLiters)} L`,
        `${formatRupiah(avgFuelPricePerLiter)}/L`,
        formatRupiah(sumFuelCost),
        `${avgKmPerLiter.toFixed(2)} Km/L`
      ]);
      autoTable(doc, {
        startY: 45,
        head: [['No', 'Tanggal', 'SPBU', 'Nopol', 'Driver', 'Odometer', 'Solar (L)', 'Harga/L', 'Total Biaya', 'Efisiensi']],
        body: rows,
        styles: { fontSize: 7.5 },
        headStyles: { fillColor: [16, 185, 129] }
      });
      drawReportPdfFooter(doc);
      doc.save(`Laporan_BBM_Solar_${periodTag}.pdf`);
    } else if (activeReportTab === 'company_costs') {
      const isSingle = selectedCompany !== 'ALL' && filteredCompanyCostSummary.length === 1;
      if (isSingle) {
        const sc = filteredCompanyCostSummary[0];
        drawReportPdfHeader(doc, `RESUME OPERASIONAL & KEUANGAN - ${sc.company.companyName.toUpperCase()}`, `PIC: ${sc.company.picName} | Telp: ${sc.company.picPhone} | Kode: ${sc.company.companyCode}`);
        
        // Summary KPI Table
        const kpiRows = [
          ['Deposit Masuk Berapa', formatRupiah(sc.totalDepositIn), `Deposit Awal: ${formatRupiah(sc.initialDeposit)} + Top-Up: ${formatRupiah(sc.totalTopUp)}`],
          ['Dikeluarkan Berapa', formatRupiah(sc.totalDeducted), `Uang Saku: ${formatRupiah(sc.pocketExpense)} | Trips: ${formatRupiah(sc.tripExpense)} | Alat: ${formatRupiah(sc.equipExpense)}`],
          ['Sisa Saldo Deposit', formatRupiah(sc.netDepositBalance), `Realisasi Penyerapan: ${sc.utilizationPercent.toFixed(1)}% | Status: ${sc.netDepositBalance <= (sc.company.minimumBalanceWarning || 10000000) ? 'MENIPIS' : 'AMAN'}`],
          ['Kinerja Operasional Rit', `${sc.tripsCount} Rit`, `Jarak Tempuh: ${sc.totalDistanceKm} KM | Muatan Kargo: ${sc.totalTonnage} Ton`]
        ];
        autoTable(doc, {
          startY: 45,
          head: [['Indikator Finansial & Operasional', 'Nominal / Nilai', 'Keterangan Rincian']],
          body: kpiRows,
          styles: { fontSize: 8.5 },
          headStyles: { fillColor: [30, 58, 138] }
        });

        const nextY = (doc as any).lastAutoTable.finalY + 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('RINCIAN BEBAN PENGELUARAN OPERASIONAL DIKELUARKAN', 14, nextY);

        const expRows = sc.allExpensesList.slice(0, 25).map((e, i) => [
          i + 1,
          formatDateIndo(e.date),
          e.refNo,
          e.category,
          e.driverOrVehicle,
          e.description.length > 40 ? e.description.slice(0, 40) + '...' : e.description,
          formatRupiah(e.amount)
        ]);
        expRows.push([
          'TOTAL',
          '-',
          '-',
          '-',
          'TOTAL DIKELUARKAN',
          `${sc.allExpensesList.length} Transaksi`,
          formatRupiah(sc.totalDeducted)
        ]);

        autoTable(doc, {
          startY: nextY + 3,
          head: [['No', 'Tanggal', 'No Ref / DO', 'Kategori', 'Driver / Nopol', 'Deskripsi Rute / Barang', 'Nominal']],
          body: expRows,
          styles: { fontSize: 7.5 },
          headStyles: { fillColor: [225, 29, 72] }
        });

        drawReportPdfFooter(doc);
        const safeCompName = sc.company.companyName.replace(/[^a-zA-Z0-9]/g, '_');
        doc.save(`Resume_Operasional_${safeCompName}_${periodTag}.pdf`);
      } else {
        drawReportPdfHeader(doc, 'RESUME OPERASIONAL & BIAYA PER PERUSAHAAN', 'Rekapitulasi Deposit Masuk, Beban Operasional Dikeluarkan & Saldo Akhir Kontrak');
        const rows = filteredCompanyCostSummary.map((cs, i) => [
          i + 1,
          cs.company.companyName,
          formatRupiah(cs.totalDepositIn),
          formatRupiah(cs.pocketExpense),
          formatRupiah(cs.tripExpense),
          formatRupiah(cs.equipExpense),
          formatRupiah(cs.totalDeducted),
          formatRupiah(cs.netDepositBalance),
          `${cs.utilizationPercent.toFixed(1)}%`
        ]);
        rows.push([
          'TOTAL',
          `GRAND TOTAL (${filteredCompanyCostSummary.length} Perusahaan)`,
          formatRupiah(sumCompanyCostDepositIn),
          formatRupiah(sumCompanyCostPocketExp),
          formatRupiah(sumCompanyCostTripExp),
          formatRupiah(sumCompanyCostEquipExp),
          formatRupiah(sumCompanyCostTotalDeducted),
          formatRupiah(sumCompanyCostNetDeposit),
          sumCompanyCostDepositIn > 0 ? `${((sumCompanyCostTotalDeducted / sumCompanyCostDepositIn) * 100).toFixed(1)}%` : '0%'
        ]);
        autoTable(doc, {
          startY: 45,
          head: [['No', 'Perusahaan Rekanan', 'Deposit Masuk', 'Uang Saku', 'Tripsheet', 'Peralatan', 'Dikeluarkan', 'Sisa Saldo', 'Realisasi']],
          body: rows,
          styles: { fontSize: 7 },
          headStyles: { fillColor: [79, 70, 229] }
        });
        drawReportPdfFooter(doc);
        doc.save(`Laporan_Resume_Perusahaan_${periodTag}.pdf`);
      }
    } else {
      // Default to Executive & Fleet Performance PDF
      drawReportPdfHeader(doc, 'LAPORAN KINERJA & BIAYA ARMADA KENDARAAN', 'Matriks Pengeluaran Solar, Perawatan Bengkel, Uang Saku & Profitabilitas Unit');
      const rows = filteredVehiclePerformance.map((vp, i) => [
        i + 1,
        vp.vehicle.nopol,
        vp.vehicle.assignedDriver,
        `${vp.trips} Rit`,
        `${formatNumber(vp.km)} KM`,
        `${formatNumber(vp.liters)} L (${vp.avgKmL} Km/L)`,
        formatRupiah(vp.fuelCost),
        formatRupiah(vp.srvCost),
        formatRupiah(vp.pocketCost),
        formatRupiah(vp.totalCost),
        formatRupiah(vp.income),
        formatRupiah(vp.net)
      ]);
      rows.push([
        'TOTAL',
        `GRAND TOTAL (${filteredVehiclePerformance.length} Unit)`,
        '-',
        `${sumFleetTrips} Rit`,
        `${formatNumber(sumFleetKm)} KM`,
        `${formatNumber(sumFleetLiters)} L`,
        formatRupiah(sumFleetFuelExpense),
        formatRupiah(sumFleetSrvExpense),
        formatRupiah(sumFleetPocketExpense),
        formatRupiah(sumFleetTotalCost),
        formatRupiah(sumFleetIncome),
        formatRupiah(sumFleetNet)
      ]);
      autoTable(doc, {
        startY: 45,
        head: [['No', 'Nopol', 'Driver', 'Rit', 'Jarak', 'Solar', 'Biaya BBM', 'Servis', 'Saku/Tol', 'Total Biaya', 'Pendapatan', 'Laba Bersih']],
        body: rows,
        styles: { fontSize: 7.5 },
        headStyles: { fillColor: [30, 58, 138] }
      });
      drawReportPdfFooter(doc);
      doc.save(`Laporan_Kinerja_Armada_${periodTag}.pdf`);
    }
  };

  const CurrentIcon = currentReportConfig.icon;

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 1. HEADER SECTION & DROPDOWN PEMILIH LAPORAN                */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-b from-white via-slate-50/40 to-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="text-blue-600 font-bold tracking-wide uppercase text-[11px]">
                Pusat Analitik &amp; Laporan
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="font-medium text-slate-600">10 Modul Standar Terintegrasi</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5 flex items-center gap-2.5 tracking-tight">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <CurrentIcon className="w-5 h-5 text-blue-600" />
              </div>
              <span>{currentReportConfig.label}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {currentReportConfig.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* INTERACTIVE DROPDOWN SELECTOR: AKTIF KETIKA DI KLIK */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-300/80 hover:border-blue-500 shadow-2xs hover:shadow-xs transition duration-150 cursor-pointer"
                title="Klik untuk memilih jenis laporan"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="max-w-[170px] truncate sm:max-w-none">
                  Pilih Laporan: <strong className="font-extrabold text-blue-700">{currentReportConfig.label}</strong>
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
              </button>

              {/* DROPDOWN POPUP MENU */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daftar Jenis Laporan</p>
                      <p className="text-xs font-bold text-slate-800">Pilih untuk mengaktifkan laporan:</p>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full">
                      10 Laporan
                    </span>
                  </div>

                  <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-50 p-1.5 space-y-0.5">
                    {reportTabsConfig.map((item) => {
                      const IconComponent = item.icon;
                      const isSelected = activeReportTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveReportTab(item.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-start gap-3 transition cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                          }`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                                {item.label}
                              </p>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                            </div>
                            <p className={`text-[10px] line-clamp-1 mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                              {item.description}
                            </p>
                            <span className={`inline-block mt-1 text-[9px] font-semibold px-2 py-0.5 rounded-md ${
                              isSelected ? 'bg-white/20 text-blue-50' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {item.category}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Tombol Ekspor Excel & PDF */}
            <button
              onClick={handleExportCurrentTabExcel}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs hover:shadow-sm active:scale-95 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Excel</span>
            </button>
            <button
              onClick={handleExportCurrentTabPDF}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:shadow-sm active:scale-95 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. FILTER BAR: RANGE TANGGAL & FILTER PER JENIS LAPORAN     */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Filter Detail Laporan &amp; Rentang Tanggal
            </h3>
            {hasActiveFilters && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Filter Aktif
              </span>
            )}
          </div>

          {/* Quick Preset Rentang Tanggal (Clean Segmented Control) */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100/90 rounded-xl text-xs font-medium">
            <span className="text-slate-400 font-semibold text-[11px] px-2 flex items-center gap-1">
              <CalendarRange className="w-3.5 h-3.5 text-slate-500" /> Preset:
            </span>
            <button
              onClick={() => applyDatePreset('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeDatePreset === 'all' && !startDate && !endDate ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Periode
            </button>
            <button
              onClick={() => applyDatePreset('today')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeDatePreset === 'today' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => applyDatePreset('7days')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeDatePreset === '7days' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => applyDatePreset('this_month')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeDatePreset === 'this_month' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => applyDatePreset('last_month')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeDatePreset === 'last_month' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulan Lalu
            </button>
            <button
              onClick={() => applyDatePreset('this_year')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeDatePreset === 'this_year' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tahun Ini
            </button>
          </div>
        </div>

        {/* Inputs: Start Date, End Date, Month, Year, Contextual Dropdowns, Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Tanggal Mulai */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Tanggal Mulai
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActiveDatePreset('all');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-mono focus:bg-white focus:outline-hidden focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Tanggal Selesai */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Tanggal Selesai
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActiveDatePreset('all');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-mono focus:bg-white focus:outline-hidden focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Filter Bulan Periode */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Filter Bulan
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setActiveDatePreset('all');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-medium focus:bg-white focus:outline-hidden focus:border-blue-500 transition cursor-pointer"
            >
              <option value="ALL">Semua Bulan (Jan - Des)</option>
              <option value="01">Januari</option>
              <option value="02">Februari</option>
              <option value="03">Maret</option>
              <option value="04">April</option>
              <option value="05">Mei</option>
              <option value="06">Juni</option>
              <option value="07">Juli</option>
              <option value="08">Agustus</option>
              <option value="09">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
          </div>

          {/* Filter Tahun */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Filter Tahun
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setActiveDatePreset('all');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-medium focus:bg-white focus:outline-hidden focus:border-blue-500 transition cursor-pointer"
            >
              <option value="ALL">Semua Tahun</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          {/* Contextual Filter 1: Dinamis Berdasarkan Jenis Laporan */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 truncate">
              {activeReportTab === 'deposit' || activeReportTab === 'company_costs' || activeReportTab === 'deposit_requests'
                ? 'Perusahaan Klien'
                : activeReportTab === 'driver_pocket' || activeReportTab === 'timesheet'
                ? 'Pengemudi / Supir'
                : activeReportTab === 'equipment'
                ? 'Kategori Peralatan'
                : activeReportTab === 'cash_advances'
                ? 'Rekening Kas / Bank'
                : 'Unit Kendaraan (Nopol)'}
            </label>
            {activeReportTab === 'deposit' || activeReportTab === 'company_costs' || activeReportTab === 'deposit_requests' ? (
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-500 transition cursor-pointer"
              >
                <option value="ALL">Semua Perusahaan Rekanan</option>
                {distinctCompanies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : activeReportTab === 'driver_pocket' || activeReportTab === 'timesheet' ? (
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-500 transition cursor-pointer"
              >
                <option value="ALL">Semua Driver / Supir</option>
                {distinctDrivers.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            ) : activeReportTab === 'equipment' ? (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-500 transition cursor-pointer"
              >
                <option value="ALL">Semua Kategori Peralatan</option>
                {distinctCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            ) : activeReportTab === 'cash_advances' ? (
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-500 transition cursor-pointer"
              >
                <option value="ALL">Semua Rekening Kas / Bank</option>
                {safeAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.accountName} ({a.bankName})</option>
                ))}
              </select>
            ) : (
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:bg-white focus:outline-hidden focus:border-blue-500 transition cursor-pointer"
              >
                <option value="ALL">Semua Armada Kendaraan</option>
                {distinctVehicles.map(([nopol, label]) => (
                  <option key={nopol} value={nopol}>{label}</option>
                ))}
              </select>
            )}
          </div>

          {/* Contextual Filter 2 / Search Keyword */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Pencarian Kata Kunci
            </label>
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nopol, supir, nota, DO..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-500 transition"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Contextual Filters Row (Status / Armada / Reset) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Status Khusus untuk beberapa tab */}
            {activeReportTab === 'deposit' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Status Saldo:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 cursor-pointer"
                >
                  <option value="ALL">Semua Status Deposit</option>
                  <option value="normal">Aktif Normal</option>
                  <option value="warning">Deposit Menipis (&lt; Batas Minimum)</option>
                </select>
              </div>
            )}

            {activeReportTab === 'deposit_requests' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Status Pengajuan:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 cursor-pointer font-medium"
                >
                  <option value="ALL">Semua Status Pengajuan</option>
                  <option value="pending">Menunggu Review (Pending)</option>
                  <option value="approved">Disetujui (Antri Transfer)</option>
                  <option value="completed">Terealisasi (Masuk Saldo)</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>
            )}

            {activeReportTab === 'driver_pocket' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Status LPJ:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 cursor-pointer"
                >
                  <option value="ALL">Semua Status LPJ</option>
                  <option value="disbursed">On-Trip (Sangu Berjalan)</option>
                  <option value="settled">Settled (LPJ Tuntas)</option>
                  <option value="refunded">Refund (Ada Sisa Kembali)</option>
                </select>
              </div>
            )}

            {activeReportTab === 'tripsheet' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Status DO:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 cursor-pointer"
                >
                  <option value="ALL">Semua Status DO</option>
                  <option value="completed">Completed (Selesai)</option>
                  <option value="dispatched">Dispatched (Di Perjalanan)</option>
                  <option value="arrived">Arrived (Tiba di Lokasi)</option>
                </select>
              </div>
            )}

            {activeReportTab === 'timesheet' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Status Kehadiran:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 cursor-pointer"
                >
                  <option value="ALL">Semua Status Hadir</option>
                  <option value="hadir">Hadir</option>
                  <option value="lembur">Lembur</option>
                  <option value="sakit">Sakit</option>
                  <option value="izin">Izin</option>
                  <option value="alpha">Alpha</option>
                </select>
              </div>
            )}

            {activeReportTab === 'equipment' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Bukti Nota:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 cursor-pointer"
                >
                  <option value="ALL">Semua Transaksi</option>
                  <option value="with_receipt">Ada Bukti Nota Foto</option>
                  <option value="no_receipt">Tanpa Nota</option>
                </select>
              </div>
            )}

            {/* Filter Armada Sekunder jika tab utama bukan Armada */}
            {(activeReportTab === 'driver_pocket' ||
              activeReportTab === 'tripsheet' ||
              activeReportTab === 'timesheet' ||
              activeReportTab === 'equipment') && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Unit Armada:</span>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-mono cursor-pointer"
                >
                  <option value="ALL">Semua Armada</option>
                  {distinctVehicles.map(([nopol]) => (
                    <option key={nopol} value={nopol}>{nopol}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Tombol Reset Filter */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. DYNAMIC TOTALS BANNER (KETIKA ADA UANG JUMLAHKAN HASILNYA) */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-5 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                Kalkulasi Total Keuangan Terfilter ({dateRangeLabel})
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-200 mt-1">
              Akumulasi Nominal Uang Laporan:{' '}
              <span className="text-white font-bold">{currentReportConfig.label}</span>
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeReportTab === 'deposit' && (
              <>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Total Saldo Deposit</p>
                  <p className="text-base font-extrabold font-mono text-emerald-400">{formatRupiah(sumDepositCurrent)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Total Top-Up</p>
                  <p className="text-base font-extrabold font-mono text-blue-300">{formatRupiah(sumDepositTopUp)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Total Terpakai</p>
                  <p className="text-base font-extrabold font-mono text-rose-300">{formatRupiah(sumDepositUsed)}</p>
                </div>
              </>
            )}

            {activeReportTab === 'deposit_requests' && (
              <>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-amber-200 font-medium">Total Nominal Diajukan</p>
                  <p className="text-base font-extrabold font-mono text-amber-300">{formatRupiah(sumRequestTotalAmount)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-emerald-200 font-medium">Terealisasi Masuk Kas</p>
                  <p className="text-base font-extrabold font-mono text-emerald-400">{formatRupiah(sumRequestCompletedAmount)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-yellow-200 font-medium">Menunggu Verifikasi</p>
                  <p className="text-base font-extrabold font-mono text-yellow-300">{formatRupiah(sumRequestPendingAmount + sumRequestApprovedAmount)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-rose-200 font-medium">Ditolak</p>
                  <p className="text-base font-extrabold font-mono text-rose-300">{formatRupiah(sumRequestRejectedAmount)}</p>
                </div>
              </>
            )}

            {activeReportTab === 'driver_pocket' && (
              <>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Total Saku Dicairkan</p>
                  <p className="text-base font-extrabold font-mono text-blue-300">{formatRupiah(sumPocketGiven)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Total Realisasi Fisik</p>
                  <p className="text-base font-extrabold font-mono text-emerald-400">{formatRupiah(sumPocketActual)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Total Refund Sisa</p>
                  <p className="text-base font-extrabold font-mono text-purple-300">{formatRupiah(sumPocketRefund)}</p>
                </div>
              </>
            )}

            {activeReportTab === 'equipment' && (
              <>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Total Kuantitas Barang</p>
                  <p className="text-base font-extrabold font-mono text-blue-300">{sumEquipmentQty} Unit</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Total Biaya Belanja</p>
                  <p className="text-base font-extrabold font-mono text-amber-400">{formatRupiah(sumEquipmentCost)}</p>
                </div>
              </>
            )}

            {(activeReportTab === 'overview' || activeReportTab === 'vehicle_expenses') && (
              <>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Total Beban Biaya</p>
                  <p className="text-base font-extrabold font-mono text-rose-300">{formatRupiah(sumFleetTotalCost)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Total Pendapatan</p>
                  <p className="text-base font-extrabold font-mono text-emerald-400">{formatRupiah(sumFleetIncome)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Laba Bersih Armada</p>
                  <p className={`text-base font-extrabold font-mono ${sumFleetNet >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                    {formatRupiah(sumFleetNet)}
                  </p>
                </div>
              </>
            )}

            {activeReportTab === 'tripsheet' && (
              <>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Total Ritase DO</p>
                  <p className="text-base font-extrabold font-mono text-blue-300">{filteredTripSheets.length} DO</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Total Jarak Tempuh</p>
                  <p className="text-base font-extrabold font-mono text-emerald-300">{formatNumber(sumTripsheetKm)} KM</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Total Biaya Perjalanan</p>
                  <p className="text-base font-extrabold font-mono text-amber-400">{formatRupiah(sumTripsheetExpense)}</p>
                </div>
              </>
            )}

            {activeReportTab === 'fuel' && (
              <>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Total Konsumsi Solar</p>
                  <p className="text-base font-extrabold font-mono text-blue-300">{formatNumber(sumFuelLiters)} L</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Total Biaya Solar</p>
                  <p className="text-base font-extrabold font-mono text-emerald-400">{formatRupiah(sumFuelCost)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Rata-rata Harga/Liter</p>
                  <p className="text-base font-extrabold font-mono text-amber-300">{formatRupiah(avgFuelPricePerLiter)}</p>
                </div>
              </>
            )}

            {activeReportTab === 'company_costs' && (
              <>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Deposit Masuk Berapa</p>
                  <p className="text-base font-extrabold font-mono text-emerald-300">{formatRupiah(sumCompanyCostDepositIn)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Dikeluarkan Berapa</p>
                  <p className="text-base font-extrabold font-mono text-rose-300">{formatRupiah(sumCompanyCostTotalDeducted)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Sisa Saldo Deposit</p>
                  <p className="text-base font-extrabold font-mono text-blue-300">{formatRupiah(sumCompanyCostNetDeposit)}</p>
                </div>
              </>
            )}

            {activeReportTab === 'cash_advances' && (
              <>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Saldo Kas &amp; Bank</p>
                  <p className="text-base font-extrabold font-mono text-emerald-400">{formatRupiah(sumAccountsBalance)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Uang Muka Beredar</p>
                  <p className="text-base font-extrabold font-mono text-amber-400">{formatRupiah(sumOutstandingAdvances)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Total Likuiditas</p>
                  <p className="text-base font-extrabold font-mono text-blue-300">{formatRupiah(sumNetLiquidAssets)}</p>
                </div>
              </>
            )}

            {activeReportTab === 'timesheet' && (
              <>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Total Jam Kerja</p>
                  <p className="text-base font-extrabold font-mono text-blue-300">{sumTimesheetHours.toFixed(1)} Jam</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Total Jam Lembur</p>
                  <p className="text-base font-extrabold font-mono text-amber-400">+{sumTimesheetOvertime.toFixed(1)} Jam</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-blue-200 font-medium">Total Jarak Tempuh</p>
                  <p className="text-base font-extrabold font-mono text-emerald-300">{formatNumber(sumTimesheetKm)} KM</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. TAB 1: OVERVIEW & KINERJA ARMADA                          */}
      {/* ============================================================ */}
      {activeReportTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-slate-500 font-medium">BBM Solar</p>
                <Fuel className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 font-mono mt-1">{formatRupiah(sumFleetFuelExpense)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">{formatNumber(sumFleetLiters)} L Total</p>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-slate-500 font-medium">Perawatan Bengkel</p>
                <Wrench className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 font-mono mt-1">{formatRupiah(sumFleetSrvExpense)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Servis &amp; Part</p>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-slate-500 font-medium">Saku Driver / Trip</p>
                <Coins className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 font-mono mt-1">{formatRupiah(sumFleetPocketExpense)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">{filteredPocketFlows.length} Slip Sangu Jalan</p>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-slate-500 font-medium">Arus Kas Peralatan</p>
                <ShieldCheck className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 font-mono mt-1">{formatRupiah(sumFleetEqExpense)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">{filteredEquipmentList.length} Item Alat &amp; Part</p>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-slate-500 font-medium">Biaya Ops Umum</p>
                <Wallet className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 font-mono mt-1">{formatRupiah(sumFleetOpsExpense)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Tol &amp; Administrasi</p>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-slate-500 font-medium">Laba Operasional</p>
                <div className={`w-2 h-2 rounded-full ${sumFleetNet >= 0 ? 'bg-green-500' : 'bg-rose-500'}`} />
              </div>
              <h3 className={`text-lg sm:text-xl font-bold font-mono mt-1 ${sumFleetNet >= 0 ? 'text-green-700' : 'text-rose-700'}`}>
                {formatRupiah(sumFleetNet)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">{formatRupiah(sumFleetCostPerKm)}/KM</p>
            </div>
          </div>

          {/* Matriks Kinerja Armada dengan Baris Total tfoot */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Matriks Kinerja &amp; Biaya Tiap Unit Kendaraan</h3>
                <p className="text-xs text-slate-500 mt-0.5">Analisis pengeluaran solar, servis, dan profitabilitas per armada (Dilengkapi baris total)</p>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 self-start sm:self-auto">
                {filteredVehiclePerformance.length} Unit Armada Terfilter
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-4">Armada &amp; Driver</th>
                    <th className="py-3 px-4 text-center">Rit / KM</th>
                    <th className="py-3 px-4 text-center">Konsumsi Solar</th>
                    <th className="py-3 px-4 text-right">Biaya Solar</th>
                    <th className="py-3 px-4 text-right">Uang Jalan / Saku</th>
                    <th className="py-3 px-4 text-right">Biaya Servis</th>
                    <th className="py-3 px-4 text-right">Total Biaya</th>
                    <th className="py-3 px-4 text-right">Pendapatan</th>
                    <th className="py-3 px-4 text-right">Laba Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVehiclePerformance.map((vp) => (
                    <tr key={vp.vehicle.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <p className="font-mono font-bold text-slate-800">{vp.vehicle.nopol}</p>
                        <p className="text-[10px] text-blue-700 font-semibold">{vp.vehicle.ownerCompany || 'PT Transindo Logistik'}</p>
                        <p className="text-[10px] text-slate-400">Supir: {vp.vehicle.assignedDriver || '-'}</p>
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
                        {formatRupiah(vp.pocketCost || vp.opsCost)}
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
                  {filteredVehiclePerformance.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada data armada yang sesuai filter pencarian / tanggal.
                      </td>
                    </tr>
                  )}
                </tbody>
                {/* FOOTER TABEL: JUMLAHKAN SELURUH NOMINAL UANG */}
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                  <tr>
                    <td className="py-3 px-4">
                      TOTAL TERFILTER ({filteredVehiclePerformance.length} Unit)
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span>{sumFleetTrips} Rit</span>
                      <p className="text-[10px] font-mono text-slate-500">{formatNumber(sumFleetKm)} KM</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span>{formatNumber(sumFleetLiters)} L</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-800">
                      {formatRupiah(sumFleetFuelExpense)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-800">
                      {formatRupiah(sumFleetPocketExpense)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-blue-800">
                      {formatRupiah(sumFleetSrvExpense)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-800">
                      {formatRupiah(sumFleetTotalCost)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-green-800">
                      {formatRupiah(sumFleetIncome)}
                    </td>
                    <td className={`py-3 px-4 text-right font-mono ${sumFleetNet >= 0 ? 'text-green-800' : 'text-rose-800'}`}>
                      {formatRupiah(sumFleetNet)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. TAB 2: LAPORAN DEPOSIT PER PERUSAHAAN                     */}
      {/* ============================================================ */}
      {activeReportTab === 'deposit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Perusahaan Rekanan Terfilter</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{filteredCompanyDeposits.length} Perusahaan</h3>
              <p className="text-[10px] text-slate-400 mt-1">Klien deposit kontrak</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Saldo Deposit Berjalan</p>
              <h3 className="text-xl font-bold text-indigo-600 mt-1 font-mono">
                {formatRupiah(sumDepositCurrent)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Sisa dana siap operasional</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Top-Up Masuk</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-1 font-mono">
                {formatRupiah(sumDepositTopUp)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Akumulasi penambahan dana</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Penggunaan Dana</p>
              <h3 className="text-xl font-bold text-rose-600 mt-1 font-mono">
                {formatRupiah(sumDepositUsed)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Pengurangan via transaksi rute</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Status &amp; Laporan Saldo Akhir Deposit Tiap Perusahaan</h3>
                <p className="text-xs text-slate-500 mt-0.5">Pencatatan deposit awal, riwayat top-up, pengurangan dana transaksi &amp; total akhir</p>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                Total Saldo: {formatRupiah(sumDepositCurrent)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-5">Perusahaan Klien</th>
                    <th className="py-3 px-5">Kontak &amp; PIC</th>
                    <th className="py-3 px-5 text-right">Deposit Awal</th>
                    <th className="py-3 px-5 text-right">Total Top-Up</th>
                    <th className="py-3 px-5 text-right">Total Terpakai</th>
                    <th className="py-3 px-5 text-right">Saldo Akhir</th>
                    <th className="py-3 px-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCompanyDeposits.map((comp) => (
                    <tr key={comp.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-5 font-bold text-slate-800">
                        {comp.companyName}
                        {comp.notes && <p className="text-[10px] text-slate-400 font-normal">{comp.notes}</p>}
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="text-slate-700 font-medium">{comp.picName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{comp.picPhone}</p>
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-medium text-slate-600">
                        {formatRupiah(comp.startingDeposit)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-emerald-600">
                        +{formatRupiah(comp.totalTopUp || 0)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-rose-600">
                        -{formatRupiah(comp.totalUsed || 0)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-indigo-700">
                        {formatRupiah(comp.currentBalance)}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          comp.currentBalance <= (comp.minimumBalanceWarning || 0)
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {comp.currentBalance <= (comp.minimumBalanceWarning || 0) ? 'DEPOSIT MENIPIS' : 'AKTIF NORMAL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredCompanyDeposits.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada data perusahaan yang cocok dengan filter aktif.
                      </td>
                    </tr>
                  )}
                </tbody>
                {/* FOOTER TABEL: TOTAL DEPOSIT */}
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                  <tr>
                    <td colSpan={2} className="py-3.5 px-5">
                      TOTAL TERFILTER ({filteredCompanyDeposits.length} Perusahaan)
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-slate-800">
                      {formatRupiah(sumDepositStarting)}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-emerald-700">
                      +{formatRupiah(sumDepositTopUp)}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-rose-700">
                      -{formatRupiah(sumDepositUsed)}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-indigo-800 text-sm">
                      {formatRupiah(sumDepositCurrent)}
                    </td>
                    <td className="py-3.5 px-5 text-center text-slate-400 font-normal">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5B. TAB: LAPORAN PENGAJUAN DEPOSIT PER PERUSAHAAN            */}
      {/* ============================================================ */}
      {activeReportTab === 'deposit_requests' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Diajukan Terfilter</p>
              <h3 className="text-xl font-bold text-amber-600 mt-1 font-mono">
                {formatRupiah(sumRequestTotalAmount)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">{filteredDepositRequests.length} berkas pengajuan</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Terealisasi Masuk Kas</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-1 font-mono">
                {formatRupiah(sumRequestCompletedAmount)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                {filteredDepositRequests.filter(r => r.status === 'completed').length} pengajuan telah disetor
              </p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Disetujui (Antri Transfer)</p>
              <h3 className="text-xl font-bold text-blue-600 mt-1 font-mono">
                {formatRupiah(sumRequestApprovedAmount)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                {filteredDepositRequests.filter(r => r.status === 'approved').length} pengajuan siap cair
              </p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Menunggu Verifikasi (Pending)</p>
              <h3 className="text-xl font-bold text-amber-500 mt-1 font-mono">
                {formatRupiah(sumRequestPendingAmount)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                {filteredDepositRequests.filter(r => r.status === 'pending').length} pengajuan butuh review
              </p>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <SendHorizontal className="w-4 h-4 text-blue-600" />
                  Rekapitulasi Pengajuan Deposit Masuk Perusahaan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Periode: <span className="font-semibold text-slate-700">{dateRangeLabel}</span>
                  {selectedCompany !== 'ALL' && <span> • Klien: <span className="font-semibold text-blue-600">{selectedCompany}</span></span>}
                  {selectedStatus !== 'ALL' && <span> • Status: <span className="font-semibold text-slate-700 uppercase">{selectedStatus}</span></span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {filteredDepositRequests.length} Data Terpilih
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-4 text-center w-12">No</th>
                    <th className="py-3 px-4">No. Pengajuan</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Perusahaan Rekanan</th>
                    <th className="py-3 px-4">Pemohon</th>
                    <th className="py-3 px-4">Keperluan &amp; Periode</th>
                    <th className="py-3 px-4">Rekening Kas Tujuan</th>
                    <th className="py-3 px-4 text-right">Nominal Diajukan</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Keterangan / Realisasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDepositRequests.map((req, idx) => {
                    const matchedAccount = safeAccounts.find(a => a.id === req.targetAccountId);
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-800">{req.requestCode}</span>
                          <div className="mt-0.5">
                            <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                              req.urgency === 'tinggi'
                                ? 'bg-rose-100 text-rose-700'
                                : req.urgency === 'sedang'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              Urgensi {req.urgency}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                          {req.requestDate}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {req.companyName}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-slate-800 font-medium">{req.requestedBy}</p>
                          {req.requestedByRole && (
                            <p className="text-[10px] text-slate-400">{req.requestedByRole}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-slate-700 line-clamp-2">{req.purpose}</p>
                          {req.operationalPeriod && (
                            <p className="text-[10px] text-blue-600 font-mono mt-0.5">
                              Periode: {req.operationalPeriod}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {matchedAccount ? (
                            <div>
                              <p className="font-medium text-slate-800">{matchedAccount.accountName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{matchedAccount.bankName} - {matchedAccount.accountNumber}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Rekening Kas Utama</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-xs">
                          {formatRupiah(req.amount)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'approved'
                              ? 'bg-blue-100 text-blue-800'
                              : req.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {req.status === 'completed' && 'Terealisasi (Masuk Saldo)'}
                            {req.status === 'approved' && 'Disetujui (Siap Transfer)'}
                            {req.status === 'rejected' && 'Ditolak'}
                            {req.status === 'pending' && 'Menunggu Review'}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          {req.status === 'completed' && (
                            <div className="text-[11px] text-emerald-700">
                              <p className="font-semibold">Bukti: {req.transferProofRef || '-'}</p>
                              <p className="text-[10px] text-slate-400">Tgl: {req.completedDate || req.requestDate}</p>
                            </div>
                          )}
                          {req.status === 'approved' && (
                            <p className="text-[11px] text-blue-700">
                              Disetujui oleh {req.approvedBy || 'Finance'}: {req.approvalNotes || 'Siap proses transfer.'}
                            </p>
                          )}
                          {req.status === 'rejected' && (
                            <p className="text-[11px] text-rose-600">
                              Alasan: {req.rejectionReason || 'Tidak memenuhi kualifikasi.'}
                            </p>
                          )}
                          {req.status === 'pending' && (
                            <p className="text-[11px] text-slate-400 italic">
                              {req.notes || 'Belum ditinjau tim operasional/keuangan.'}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredDepositRequests.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400 text-xs">
                        Tidak ada riwayat pengajuan deposit yang sesuai dengan kriteria filter aktif.
                      </td>
                    </tr>
                  )}
                </tbody>
                {/* FOOTER TABEL: TOTAL PENGAJUAN DEPOSIT (KETIKA ADA UANG JUMLAHKAN HASILNYA) */}
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                  <tr>
                    <td colSpan={7} className="py-3.5 px-4 text-slate-800">
                      TOTAL DANA PENGAJUAN DEPOSIT TERFILTER ({filteredDepositRequests.length} Pengajuan)
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-amber-700 text-sm">
                      {formatRupiah(sumRequestTotalAmount)}
                    </td>
                    <td colSpan={2} className="py-3.5 px-4 text-xs font-normal text-slate-600">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-emerald-700 font-semibold">
                          Terealisasi: {formatRupiah(sumRequestCompletedAmount)}
                        </span>
                        <span className="text-slate-500">
                          Pending: {formatRupiah(sumRequestPendingAmount)}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. TAB 3: LAPORAN PENGGUNAAN UANG DRIVER (SAKU)              */}
      {/* ============================================================ */}
      {activeReportTab === 'driver_pocket' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Saku Dicairkan</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1 font-mono">
                {formatRupiah(sumPocketGiven)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">{filteredPocketFlows.length} transaksi sangu</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Realisasi Pengeluaran</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-1 font-mono">
                {formatRupiah(sumPocketActual)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">BBM, Tol, Parkir, Tambal</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Pengembalian Sisa (Refund)</p>
              <h3 className="text-xl font-bold text-purple-600 mt-1 font-mono">
                {formatRupiah(sumPocketRefund)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Masuk kembali ke kas pool</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Uang Muka Belum LPJ</p>
              <h3 className="text-xl font-bold text-amber-600 mt-1 font-mono">
                {formatRupiah(sumOutstandingAdvances)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">{filteredOutstandingAdvances.length} supir sedang bertugas</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Buku Pengeluaran Saku Driver &amp; Pertanggungjawaban (LPJ)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Detail pencairan sangu jalan, rincian pengeluaran fisik, dan status verifikasi nota</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Total Realisasi: {formatRupiah(sumPocketActual)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-4">No. Trip &amp; Tanggal</th>
                    <th className="py-3 px-4">Driver &amp; Nopol</th>
                    <th className="py-3 px-4">Rute Perjalanan</th>
                    <th className="py-3 px-4 text-right">Uang Saku</th>
                    <th className="py-3 px-4 text-right">Realisasi Fisik</th>
                    <th className="py-3 px-4 text-right">Sisa Kembali</th>
                    <th className="py-3 px-4 text-center">Status LPJ</th>
                    <th className="py-3 px-4 text-center">Bukti Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPocketFlows.map((pf) => (
                    <tr key={pf.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-slate-800">{pf.tripCode}</p>
                        <p className="text-[10px] text-slate-400">{formatDateIndo(pf.date)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{pf.driverName}</p>
                        <p className="font-mono text-[10px] text-slate-500">{pf.nopol}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-700">{pf.originLocation} &rarr; {pf.destinationLocation}</p>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {formatRupiah(pf.totalGiven)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        {formatRupiah(pf.actualExpense || pf.totalGiven)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-purple-700">
                        {formatRupiah(pf.refundAmount || 0)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          pf.status === 'settled'
                            ? 'bg-green-100 text-green-800'
                            : pf.status === 'refunded'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {pf.status === 'settled' ? 'SETTLED' : pf.status === 'refunded' ? 'REFUND' : 'JALAN'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          pf.receiptProofUrl ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {pf.receiptProofUrl ? 'ADA NOTA' : 'TIDAK'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredPocketFlows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada catatan uang saku yang sesuai dengan filter.
                      </td>
                    </tr>
                  )}
                </tbody>
                {/* FOOTER TABEL: TOTAL UANG SAKU */}
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                  <tr>
                    <td colSpan={3} className="py-3.5 px-4">
                      TOTAL TERFILTER ({filteredPocketFlows.length} Slip Sangu)
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-900">
                      {formatRupiah(sumPocketGiven)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-700">
                      {formatRupiah(sumPocketActual)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-purple-700">
                      {formatRupiah(sumPocketRefund)}
                    </td>
                    <td colSpan={2} className="py-3.5 px-4 text-center text-slate-400 font-normal">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. TAB 4: LAPORAN BELANJA PERALATAN & SPAREPART             */}
      {/* ============================================================ */}
      {activeReportTab === 'equipment' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Belanja Peralatan</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1 font-mono">{formatRupiah(sumEquipmentCost)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">{filteredEquipmentList.length} transaksi alat</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Ban &amp; Aki</p>
              <h3 className="text-xl font-bold text-blue-600 mt-1 font-mono">
                {formatRupiah(
                  filteredEquipmentList
                    .filter(e => e.itemType === 'ban' || e.itemType === 'aki' || e.equipmentName.toLowerCase().includes('ban') || e.equipmentName.toLowerCase().includes('aki'))
                    .reduce((s, e) => s + (e.totalAmount || 0), 0)
                )}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Penggantian roda &amp; aki</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Terpal, Rantai &amp; K3</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-1 font-mono">
                {formatRupiah(
                  filteredEquipmentList
                    .filter(e => e.itemType === 'terpal_alat' || e.equipmentName.toLowerCase().includes('terpal'))
                    .reduce((s, e) => s + (e.totalAmount || 0), 0)
                )}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Pengaman muatan kargo</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Oli Mesin &amp; Filter Part</p>
              <h3 className="text-xl font-bold text-amber-600 mt-1 font-mono">
                {formatRupiah(
                  filteredEquipmentList
                    .filter(e => e.itemType === 'oli' || e.itemType === 'sparepart')
                    .reduce((s, e) => s + (e.totalAmount || 0), 0)
                )}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Pelumas &amp; part armada</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Rekapitulasi Pengadaan Peralatan, Sparepart, Ban &amp; Oli</h3>
                <p className="text-xs text-slate-500 mt-0.5">Pencatatan pembelian barang per unit armada dan per supplier toko</p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Total Biaya: {formatRupiah(sumEquipmentCost)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-4">Tanggal &amp; Alat</th>
                    <th className="py-3 px-4">Kategori Barang</th>
                    <th className="py-3 px-4">Alokasi Armada</th>
                    <th className="py-3 px-4">Supplier / Toko</th>
                    <th className="py-3 px-4 text-center">Jumlah &amp; Satuan</th>
                    <th className="py-3 px-4 text-right">Harga Satuan</th>
                    <th className="py-3 px-4 text-right">Total Biaya</th>
                    <th className="py-3 px-4 text-center">Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEquipmentList.map((eq) => (
                    <tr key={eq.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{eq.equipmentName}</p>
                        <p className="text-[10px] text-slate-400">{formatDateIndo(eq.date)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {eq.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {eq.nopol || 'Stok Pool'}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {eq.supplierOrStore}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {eq.quantity} {eq.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatRupiah(eq.unitPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {formatRupiah(eq.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          eq.receiptProofUrl ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {eq.receiptProofUrl ? 'ADA NOTA' : 'TIDAK'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredEquipmentList.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada data pembelian peralatan pada filter yang dipilih.
                      </td>
                    </tr>
                  )}
                </tbody>
                {/* FOOTER TABEL: TOTAL BELANJA PERALATAN */}
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                  <tr>
                    <td colSpan={4} className="py-3.5 px-4">
                      TOTAL TERFILTER ({filteredEquipmentList.length} Item Barang)
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      {sumEquipmentQty} Unit Total
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 font-normal">-</td>
                    <td className="py-3.5 px-4 text-right font-mono text-amber-700 text-sm">
                      {formatRupiah(sumEquipmentCost)}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400 font-normal">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 8. TAB 5: LAPORAN PENGELUARAN KENDARAAN (FLEET COSTS)         */}
      {/* ============================================================ */}
      {activeReportTab === 'vehicle_expenses' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Laporan Total Pengeluaran Tiap Unit Kendaraan</h3>
                <p className="text-xs text-slate-500 mt-0.5">Rincian beban biaya BBM solar, servis rutin, uang saku/tol, dan peralatan per armada</p>
              </div>
              <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                Total Beban: {formatRupiah(sumFleetTotalCost)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-4">No. Polisi &amp; Tipe</th>
                    <th className="py-3 px-4">Pengemudi</th>
                    <th className="py-3 px-4 text-right">BBM Solar</th>
                    <th className="py-3 px-4 text-right">Servis Bengkel</th>
                    <th className="py-3 px-4 text-right">Saku &amp; Tol</th>
                    <th className="py-3 px-4 text-right">Peralatan</th>
                    <th className="py-3 px-4 text-right">Total Beban</th>
                    <th className="py-3 px-4 text-right">Cost / KM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVehiclePerformance.map((vp) => (
                    <tr key={vp.vehicle.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {vp.vehicle.nopol}
                        <p className="text-[10px] text-slate-400 font-normal">{vp.vehicle.brand} {vp.vehicle.model}</p>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {vp.vehicle.assignedDriver}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        {formatRupiah(vp.fuelCost)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        {formatRupiah(vp.srvCost)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        {formatRupiah(vp.pocketCost)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        {formatRupiah(vp.eqCost)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                        {formatRupiah(vp.totalCost)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-blue-700">
                        {formatRupiah(vp.unitCostPerKm)}/KM
                      </td>
                    </tr>
                  ))}
                  {filteredVehiclePerformance.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada armada yang sesuai filter.
                      </td>
                    </tr>
                  )}
                </tbody>
                {/* FOOTER TABEL: TOTAL BEBAN KENDARAAN */}
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                  <tr>
                    <td colSpan={2} className="py-3.5 px-4">
                      TOTAL BEBAN ARMADA TERFILTER ({filteredVehiclePerformance.length} Unit)
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-800">
                      {formatRupiah(sumFleetFuelExpense)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-blue-800">
                      {formatRupiah(sumFleetSrvExpense)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-800">
                      {formatRupiah(sumFleetPocketExpense)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-amber-800">
                      {formatRupiah(sumFleetEqExpense)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-rose-800 text-sm">
                      {formatRupiah(sumFleetTotalCost)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-blue-800">
                      {formatRupiah(sumFleetCostPerKm)}/KM
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 9. TAB 6: LAPORAN TRIPSHEET (SURAT JALAN & PERJALANAN)        */}
      {/* ============================================================ */}
      {activeReportTab === 'tripsheet' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Surat Jalan</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{filteredTripSheets.length} Lembar DO</h3>
              <p className="text-[10px] text-slate-400 mt-1">Dokumen ritase terbit</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Jarak Rute</p>
              <h3 className="text-xl font-bold text-blue-600 mt-1 font-mono">
                {formatNumber(sumTripsheetKm)} KM
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Jarak tempuh otomatis</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Tonase Terkirim</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-1 font-mono">
                {formatNumber(sumTripsheetTonnage)} Ton
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Volume muatan logistik</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Biaya Perjalanan</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1 font-mono">
                {formatRupiah(sumTripsheetExpense)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Uang saku &amp; realisasi jalan</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Laporan Lengkap Trip Sheet &amp; Lembar Surat Jalan</h3>
                <p className="text-xs text-slate-500 mt-0.5">Mencatat tanggal, supir, unit, perusahaan tujuan, jam berangkat-tiba, durasi, KM, muatan &amp; biaya</p>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                Total Biaya: {formatRupiah(sumTripsheetExpense)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-4">No. Trip &amp; DO</th>
                    <th className="py-3 px-4">Tanggal &amp; Supir</th>
                    <th className="py-3 px-4">Armada &amp; Klien</th>
                    <th className="py-3 px-4">Rute (Asal &rarr; Tujuan)</th>
                    <th className="py-3 px-4 text-center">Jam &amp; Durasi</th>
                    <th className="py-3 px-4 text-center">KM &amp; Jarak</th>
                    <th className="py-3 px-4">Muatan</th>
                    <th className="py-3 px-4 text-right">Biaya Rute</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTripSheets.map((ts) => (
                    <tr key={ts.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-slate-800">{ts.tripNumber}</p>
                        <p className="font-mono text-[10px] text-blue-700">{ts.suratJalanNumber}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{ts.driverName}</p>
                        <p className="text-[10px] text-slate-400">{formatDateIndo(ts.departureDate)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-slate-800">{ts.nopol}</p>
                        <p className="text-[10px] text-slate-500">{ts.clientCompany}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {ts.originLocation} &rarr; {ts.destinationLocation}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <p className="font-medium text-slate-800">{ts.departureTime || '07:00'} - {ts.arrivalTime || '16:00'}</p>
                        <p className="text-[10px] text-blue-600 font-semibold">{ts.tripDuration || '8 Jam'}</p>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <p className="font-bold text-slate-800">{ts.totalDistanceKm} KM</p>
                        <p className="text-[10px] text-slate-400">{ts.startOdometer} &rarr; {ts.endOdometer}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{ts.cargoDescription}</p>
                        <p className="text-[10px] text-slate-500">{ts.cargoTonnageTon} Ton</p>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {formatRupiah(ts.actualTripExpense || ts.totalPocketDisbursed)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-200">
                          {ts.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredTripSheets.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada catatan tripsheet yang sesuai filter.
                      </td>
                    </tr>
                  )}
                </tbody>
                {/* FOOTER TABEL: TOTAL TRIPSHEET */}
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                  <tr>
                    <td colSpan={5} className="py-3.5 px-4">
                      TOTAL TERFILTER ({filteredTripSheets.length} Lembar DO)
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      {formatNumber(sumTripsheetKm)} KM
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {formatNumber(sumTripsheetTonnage)} Ton Total
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-900 text-sm">
                      {formatRupiah(sumTripsheetExpense)}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400 font-normal">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 10. TAB 7: LAPORAN TIMESHEET (JAM KERJA SUPIR)               */}
      {/* ============================================================ */}
      {activeReportTab === 'timesheet' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Catatan Jam Kerja</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{filteredTimesheets.length} Hari Kerja</h3>
              <p className="text-[10px] text-slate-400 mt-1">Presensi driver terfilter</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Akumulasi Jam Kerja</p>
              <h3 className="text-xl font-bold text-blue-600 mt-1 font-mono">
                {sumTimesheetHours.toFixed(1)} Jam
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Total jam operasional</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Lembur Driver</p>
              <h3 className="text-xl font-bold text-amber-600 mt-1 font-mono">
                +{sumTimesheetOvertime.toFixed(1)} Jam
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Akumulasi overtime</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Jarak Dikemudikan</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-1 font-mono">
                {formatNumber(sumTimesheetKm)} KM
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Kilometer perjalanan</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Laporan Jam Kerja (Timesheet) Pengemudi</h3>
                <p className="text-xs text-slate-500 mt-0.5">Rincian jam mulai kerja, jam selesai, waktu istirahat, total jam kerja, lembur, dan absensi</p>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                Total: {sumTimesheetHours.toFixed(1)} Jam
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-4">Tanggal &amp; Supir</th>
                    <th className="py-3 px-4">Armada</th>
                    <th className="py-3 px-4">Rute Perjalanan</th>
                    <th className="py-3 px-4 text-center">Jam Kerja</th>
                    <th className="py-3 px-4 text-center">Istirahat</th>
                    <th className="py-3 px-4 text-center">Total Jam</th>
                    <th className="py-3 px-4 text-center">Lembur</th>
                    <th className="py-3 px-4 text-center">Hari Kerja</th>
                    <th className="py-3 px-4 text-right">Jarak (KM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTimesheets.map((ts) => (
                    <tr key={ts.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{formatDateIndo(ts.date)}</p>
                        <p className="text-[11px] text-blue-700">{ts.driverName}</p>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {ts.nopol}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {ts.originLocation} &rarr; {ts.destinationLocation}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {ts.startTime} - {ts.endTime}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">
                        {ts.breakMinutes || 60}m
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-blue-700">
                        {ts.totalHours} Jam
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-amber-600">
                        {ts.overtimeHours > 0 ? `+${ts.overtimeHours} Jam` : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {ts.attendanceStatus ? ts.attendanceStatus.toUpperCase() : 'HADIR'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {ts.totalDistanceKm} KM
                      </td>
                    </tr>
                  ))}
                  {filteredTimesheets.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada data timesheet yang sesuai filter.
                      </td>
                    </tr>
                  )}
                </tbody>
                {/* FOOTER TABEL: TOTAL TIMESHEET */}
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                  <tr>
                    <td colSpan={5} className="py-3.5 px-4">
                      TOTAL TERFILTER ({filteredTimesheets.length} Hari Kerja)
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-blue-800">
                      {sumTimesheetHours.toFixed(1)} Jam
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-amber-800">
                      +{sumTimesheetOvertime.toFixed(1)} Jam
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400 font-normal">-</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-900">
                      {formatNumber(sumTimesheetKm)} KM
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 11. TAB 8: LAPORAN BBM SOLAR & EFISIENSI                     */}
      {/* ============================================================ */}
      {activeReportTab === 'fuel' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Konsumsi Solar</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1 font-mono">{formatNumber(sumFuelLiters)} Liter</h3>
              <p className="text-[10px] text-slate-400 mt-1">{filteredFuelLogs.length} transaksi SPBU</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Biaya Solar</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-1 font-mono">{formatRupiah(sumFuelCost)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Beban pengisian SPBU</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Rata-rata Harga / Liter</p>
              <h3 className="text-xl font-bold text-blue-600 mt-1 font-mono">
                {formatRupiah(avgFuelPricePerLiter)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Rata-rata pembelian</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Rata-rata Rasio KM/L</p>
              <h3 className="text-xl font-bold text-indigo-600 mt-1 font-mono">
                {avgKmPerLiter.toFixed(2)} Km/L
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Efisiensi konsumsi armada</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Riwayat Transaksi &amp; Konsumsi BBM Solar</h3>
                <p className="text-xs text-slate-500 mt-0.5">Catatan pengisian SPBU, kilometer odometer, liter solar, dan kalkulasi rasio efisiensi</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Total Biaya: {formatRupiah(sumFuelCost)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-4">Tanggal &amp; SPBU</th>
                    <th className="py-3 px-4">Armada &amp; Supir</th>
                    <th className="py-3 px-4 text-center">Odometer</th>
                    <th className="py-3 px-4 text-center">Liter Solar</th>
                    <th className="py-3 px-4 text-right">Harga / Liter</th>
                    <th className="py-3 px-4 text-right">Total Biaya</th>
                    <th className="py-3 px-4 text-center">Rasio Efisiensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFuelLogs.map((fl) => (
                    <tr key={fl.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{formatDateIndo(fl.date)}</p>
                        <p className="text-[10px] text-slate-500">{fl.fuelStationName} ({fl.location})</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-slate-800">{fl.nopol}</p>
                        <p className="text-[10px] text-slate-400">{fl.driverName}</p>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {formatNumber(fl.odometerKm)} KM
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {formatNumber(fl.volumeLiters)} L
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatRupiah(fl.costPerLiter)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {formatRupiah(fl.totalCost)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {fl.calculatedKmPerLiter.toFixed(2)} Km/L
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredFuelLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada data BBM yang cocok dengan filter tanggal/kendaraan.
                      </td>
                    </tr>
                  )}
                </tbody>
                {/* FOOTER TABEL: TOTAL BBM */}
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                  <tr>
                    <td colSpan={3} className="py-3.5 px-4">
                      TOTAL TERFILTER ({filteredFuelLogs.length} Pengisian)
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-900">
                      {formatNumber(sumFuelLiters)} L Total
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {formatRupiah(avgFuelPricePerLiter)}/L
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-800 text-sm">
                      {formatRupiah(sumFuelCost)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-blue-800">
                      {avgKmPerLiter.toFixed(2)} Km/L
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 12. TAB 9: LAPORAN OPERASIONAL & RESUME PER PERUSAHAAN       */}
      {/* ============================================================ */}
      {activeReportTab === 'company_costs' && (
        <div className="space-y-6">
          {/* Check whether user selected a single company or ALL */}
          {(() => {
            const singleCompany = selectedCompany !== 'ALL'
              ? (filteredCompanyCostSummary.find(c => c.company.companyName === selectedCompany || c.company.id === selectedCompany) || (filteredCompanyCostSummary.length === 1 ? filteredCompanyCostSummary[0] : null))
              : null;

            if (singleCompany) {
              // ============================================================
              // MODE 1: RESUME OPERASIONAL LENGKAP 1 PERUSAHAAN
              // ============================================================
              return (
                <div className="space-y-6">
                  {/* Banner Profil & Selector 1 Perusahaan */}
                  <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-md border border-blue-800/40 relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                      <Building2 className="w-64 h-64 text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-blue-500/30 text-blue-200 border border-blue-400/30 flex items-center gap-1">
                            <Building className="w-3 h-3" /> Resume Operasional Perusahaan
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-slate-200">
                            Kode: {singleCompany.company.companyCode || singleCompany.company.id.slice(-6).toUpperCase()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            singleCompany.netDepositBalance <= (singleCompany.company.minimumBalanceWarning || 10000000)
                              ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                              : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                          }`}>
                            {singleCompany.netDepositBalance <= 0 ? 'DEFISIT' : singleCompany.netDepositBalance <= (singleCompany.company.minimumBalanceWarning || 10000000) ? 'DEPOSIT MENIPIS' : 'DEPOSIT AMAN'}
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                          <span>{singleCompany.company.companyName}</span>
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-200/90 font-medium pt-1">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-blue-300" /> PIC: <strong>{singleCompany.company.picName || '-'}</strong>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-blue-300" /> {singleCompany.company.picPhone || '-'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <CalendarRange className="w-3.5 h-3.5 text-blue-300" /> Periode: <strong>{dateRangeLabel}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Action & Switcher Controls */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <select
                          value={selectedCompany}
                          onChange={(e) => setSelectedCompany(e.target.value)}
                          className="bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer transition focus:outline-hidden"
                          title="Ganti Perusahaan"
                        >
                          {distinctCompanies.map(c => (
                            <option key={c} value={c} className="text-slate-900 bg-white">{c}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setSelectedCompany('ALL')}
                          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                          title="Tampilkan semua perusahaan"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Semua Perusahaan</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4 Kartu Metrik Utama: Deposit Berapa, Dikeluarkan Berapa, Sisa Saldo, Aktivitas Rit */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Kartu 1: Deposit Masuk Berapa */}
                    <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-3xl shadow-xs relative overflow-hidden group hover:border-emerald-300 transition">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Deposit Masuk</span>
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                          <Coins className="w-4 h-4" />
                        </div>
                      </div>
                      <h4 className="text-2xl font-black text-slate-900 font-mono mt-2">
                        {formatRupiah(singleCompany.totalDepositIn)}
                      </h4>
                      <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] space-y-1 text-slate-500">
                        <div className="flex justify-between">
                          <span>Deposit Awal:</span>
                          <span className="font-semibold text-slate-700 font-mono">{formatRupiah(singleCompany.initialDeposit)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Top-Up ({singleCompany.topUps.length}x):</span>
                          <span className="font-bold text-emerald-600 font-mono">+{formatRupiah(singleCompany.totalTopUp)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Kartu 2: Dikeluarkan Berapa */}
                    <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-3xl shadow-xs relative overflow-hidden group hover:border-rose-300 transition">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Dikeluarkan Berapa</span>
                        <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                          <TrendingDown className="w-4 h-4" />
                        </div>
                      </div>
                      <h4 className="text-2xl font-black text-rose-600 font-mono mt-2">
                        {formatRupiah(singleCompany.totalDeducted)}
                      </h4>
                      <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] space-y-1 text-slate-500">
                        <div className="flex justify-between">
                          <span>Penyerapan Dana:</span>
                          <span className="font-bold text-slate-800 font-mono">{singleCompany.utilizationPercent.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Transaksi:</span>
                          <span className="font-semibold text-slate-700">{singleCompany.allExpensesList.length} Pengeluaran</span>
                        </div>
                      </div>
                    </div>

                    {/* Kartu 3: Sisa Saldo Deposit */}
                    <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-3xl shadow-xs relative overflow-hidden group hover:border-blue-300 transition">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sisa Saldo Deposit</span>
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                          <Wallet className="w-4 h-4" />
                        </div>
                      </div>
                      <h4 className={`text-2xl font-black font-mono mt-2 ${
                        singleCompany.netDepositBalance <= 0
                          ? 'text-rose-600'
                          : singleCompany.netDepositBalance <= (singleCompany.company.minimumBalanceWarning || 10000000)
                          ? 'text-amber-600'
                          : 'text-indigo-700'
                      }`}>
                        {formatRupiah(singleCompany.netDepositBalance)}
                      </h4>
                      <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] space-y-1 text-slate-500">
                        <div className="flex justify-between">
                          <span>Batas Min. Saldo:</span>
                          <span className="font-mono text-slate-700">{formatRupiah(singleCompany.company.minimumBalanceWarning || 10000000)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status Likuiditas:</span>
                          <span className={`font-bold ${singleCompany.netDepositBalance <= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {singleCompany.netDepositBalance <= 0 ? 'Over-budget / Defisit' : 'Tercukupi'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Kartu 4: Kinerja Armada Proyek */}
                    <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-3xl shadow-xs relative overflow-hidden group hover:border-amber-300 transition">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Aktivitas Armada</span>
                        <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                          <Truck className="w-4 h-4" />
                        </div>
                      </div>
                      <h4 className="text-2xl font-black text-slate-900 mt-2">
                        {singleCompany.tripsCount} <span className="text-sm font-semibold text-slate-500">Ritase</span>
                      </h4>
                      <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] space-y-1 text-slate-500">
                        <div className="flex justify-between">
                          <span>Total Jarak Tempuh:</span>
                          <span className="font-semibold text-slate-800 font-mono">{formatNumber(singleCompany.totalDistanceKm)} KM</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Muatan Kargo:</span>
                          <span className="font-semibold text-slate-800 font-mono">{formatNumber(singleCompany.totalTonnage)} Ton</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Komposisi Alokasi Pengeluaran (Visual Breakdown) */}
                  <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Rincian Komposisi Dana yang Dikeluarkan
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Alokasi biaya perjalanan, operasional driver, dan pengadaan alat untuk {singleCompany.company.companyName}
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                        Total: {formatRupiah(singleCompany.totalDeducted)}
                      </span>
                    </div>

                    {/* Progress Bar Visual */}
                    {singleCompany.totalDeducted > 0 ? (
                      <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                        <div
                          style={{ width: `${(singleCompany.pocketExpense / singleCompany.totalDeducted) * 100}%` }}
                          className="bg-blue-500 transition-all"
                          title={`Uang Saku Supir: ${formatRupiah(singleCompany.pocketExpense)}`}
                        />
                        <div
                          style={{ width: `${(singleCompany.tripExpense / singleCompany.totalDeducted) * 100}%` }}
                          className="bg-indigo-500 transition-all"
                          title={`Biaya Tripsheet Rute: ${formatRupiah(singleCompany.tripExpense)}`}
                        />
                        <div
                          style={{ width: `${(singleCompany.equipExpense / singleCompany.totalDeducted) * 100}%` }}
                          className="bg-amber-500 transition-all"
                          title={`Belanja Peralatan: ${formatRupiah(singleCompany.equipExpense)}`}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-3 bg-slate-100 rounded-full" />
                    )}

                    {/* 3 Detail Segment Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                          <div>
                            <p className="text-[11px] font-bold text-slate-700">Uang Saku Driver</p>
                            <p className="text-[10px] text-slate-400">{singleCompany.compPockets.length} Transaksi Sangu</p>
                          </div>
                        </div>
                        <p className="text-xs font-mono font-bold text-blue-800">{formatRupiah(singleCompany.pocketExpense)}</p>
                      </div>

                      <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
                          <div>
                            <p className="text-[11px] font-bold text-slate-700">Biaya Rute Tripsheet</p>
                            <p className="text-[10px] text-slate-400">{singleCompany.compTrips.length} Surat Jalan DO</p>
                          </div>
                        </div>
                        <p className="text-xs font-mono font-bold text-indigo-800">{formatRupiah(singleCompany.tripExpense)}</p>
                      </div>

                      <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                          <div>
                            <p className="text-[11px] font-bold text-slate-700">Belanja Sparepart & Alat</p>
                            <p className="text-[10px] text-slate-400">{singleCompany.compEquip.length} Pembelian</p>
                          </div>
                        </div>
                        <p className="text-xs font-mono font-bold text-amber-800">{formatRupiah(singleCompany.equipExpense)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Sub-Tabs Rincian Transaksi */}
                  <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          Rincian Transaksi Operasional &amp; Pemasukan
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Pilih kategori transaksi di bawah untuk memverifikasi bukti transfer dan nota rincian
                        </p>
                      </div>

                      {/* Sub-tab navigation pill */}
                      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setSingleCompanySubTab('all_expenses')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            singleCompanySubTab === 'all_expenses'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Semua Pengeluaran ({singleCompany.allExpensesList.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSingleCompanySubTab('topups')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            singleCompanySubTab === 'topups'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Deposit Masuk ({singleCompany.topUps.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSingleCompanySubTab('pockets')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            singleCompanySubTab === 'pockets'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Uang Saku ({singleCompany.compPockets.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSingleCompanySubTab('trips')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            singleCompanySubTab === 'trips'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Tripsheet ({singleCompany.compTrips.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSingleCompanySubTab('equipment')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            singleCompanySubTab === 'equipment'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Peralatan ({singleCompany.compEquip.length})
                        </button>
                      </div>
                    </div>

                    {/* Table View Corresponding to Active Sub-Tab */}
                    <div className="overflow-x-auto">
                      {/* SUB-TAB 1: SEMUA PENGELUARAN */}
                      {singleCompanySubTab === 'all_expenses' && (
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                            <tr>
                              <th className="py-3 px-4 w-12 text-center">No</th>
                              <th className="py-3 px-4">Tanggal</th>
                              <th className="py-3 px-4">No. Ref / DO</th>
                              <th className="py-3 px-4">Kategori Beban</th>
                              <th className="py-3 px-4">Armada / Driver</th>
                              <th className="py-3 px-4">Keterangan Transaksi</th>
                              <th className="py-3 px-4 text-center">Bukti Nota</th>
                              <th className="py-3 px-4 text-right">Nominal Dikeluarkan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {singleCompany.allExpensesList.map((e, idx) => (
                              <tr key={e.id + idx} className="hover:bg-slate-50/60 transition">
                                <td className="py-3 px-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                                <td className="py-3 px-4 whitespace-nowrap text-slate-600">{formatDateIndo(e.date)}</td>
                                <td className="py-3 px-4 font-mono font-bold text-slate-800">{e.refNo}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    e.category === 'Uang Saku Supir'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : e.category === 'Tripsheet DO'
                                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}>
                                    {e.category}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-700 font-medium">{e.driverOrVehicle}</td>
                                <td className="py-3 px-4 text-slate-600 max-w-xs">{e.description}</td>
                                <td className="py-3 px-4 text-center">
                                  {e.receiptProofUrl ? (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewReceiptUrl(e.receiptProofUrl || null)}
                                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded cursor-pointer transition"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>Lihat Nota</span>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                                  {formatRupiah(e.amount)}
                                </td>
                              </tr>
                            ))}
                            {singleCompany.allExpensesList.length === 0 && (
                              <tr>
                                <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                                  Belum ada transaksi pengeluaran operasional yang tercatat untuk perusahaan ini pada periode terpilih.
                                </td>
                              </tr>
                            )}
                          </tbody>
                          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                            <tr>
                              <td colSpan={7} className="py-3.5 px-4 text-slate-800">
                                TOTAL DANA OPERASIONAL DIKELUARKAN ({singleCompany.allExpensesList.length} Transaksi)
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono text-rose-700 text-sm whitespace-nowrap">
                                {formatRupiah(singleCompany.totalDeducted)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      )}

                      {/* SUB-TAB 2: DEPOSIT MASUK */}
                      {singleCompanySubTab === 'topups' && (
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                            <tr>
                              <th className="py-3 px-4 w-12 text-center">No</th>
                              <th className="py-3 px-4">Tanggal Top-Up</th>
                              <th className="py-3 px-4">No. Bukti Transfer</th>
                              <th className="py-3 px-4">Metode / Bank Tujuan</th>
                              <th className="py-3 px-4">Catatan Transaksi</th>
                              <th className="py-3 px-4 text-center">Bukti Transfer</th>
                              <th className="py-3 px-4 text-right">Nominal Masuk</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {/* Baris Deposit Awal */}
                            <tr className="bg-emerald-50/30">
                              <td className="py-3 px-4 text-center text-emerald-600 font-bold">#</td>
                              <td className="py-3 px-4 font-semibold text-emerald-900">Deposit Awal Kontrak</td>
                              <td className="py-3 px-4 font-mono text-slate-600">SALDO-AWAL-{singleCompany.company.companyCode}</td>
                              <td className="py-3 px-4 text-slate-600">Rekening Kas Utama</td>
                              <td className="py-3 px-4 text-slate-600">Plafon deposit awal kesepakatan kerjasama</td>
                              <td className="py-3 px-4 text-center">
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">KONTRAK</span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                                {formatRupiah(singleCompany.initialDeposit)}
                              </td>
                            </tr>

                            {singleCompany.topUps.map((t, idx) => (
                              <tr key={t.id || idx} className="hover:bg-slate-50/60 transition">
                                <td className="py-3 px-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                                <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">{formatDateIndo(t.date)}</td>
                                <td className="py-3 px-4 font-mono font-bold text-slate-800">{t.transferProofNumber}</td>
                                <td className="py-3 px-4 text-slate-600">{t.paymentMethod || 'Transfer Bank'}</td>
                                <td className="py-3 px-4 text-slate-600 max-w-xs">{t.notes || '-'}</td>
                                <td className="py-3 px-4 text-center">
                                  {t.receiptProofUrl ? (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewReceiptUrl(t.receiptProofUrl || null)}
                                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-1 rounded cursor-pointer transition border border-emerald-200"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>Lihat Bukti</span>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                                  +{formatRupiah(t.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                            <tr>
                              <td colSpan={6} className="py-3.5 px-4 text-slate-800">
                                TOTAL DEPOSIT MASUK (Awal + {singleCompany.topUps.length}x Top-Up)
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono text-emerald-800 text-sm whitespace-nowrap">
                                {formatRupiah(singleCompany.totalDepositIn)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      )}

                      {/* SUB-TAB 3: UANG SAKU SUPIR */}
                      {singleCompanySubTab === 'pockets' && (
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                            <tr>
                              <th className="py-3 px-4 w-12 text-center">No</th>
                              <th className="py-3 px-4">Tanggal</th>
                              <th className="py-3 px-4">Kode Trip</th>
                              <th className="py-3 px-4">Driver / Kernet</th>
                              <th className="py-3 px-4">Armada Truk</th>
                              <th className="py-3 px-4">Rute Jalan</th>
                              <th className="py-3 px-4 text-right">Makan &amp; Saku</th>
                              <th className="py-3 px-4 text-right">Tol &amp; Parkir</th>
                              <th className="py-3 px-4 text-right">Total Dicairkan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {singleCompany.compPockets.map((p, idx) => (
                              <tr key={p.id} className="hover:bg-slate-50/60 transition">
                                <td className="py-3 px-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                                <td className="py-3 px-4 whitespace-nowrap text-slate-600">{formatDateIndo(p.date)}</td>
                                <td className="py-3 px-4 font-mono font-bold text-blue-700">{p.tripCode}</td>
                                <td className="py-3 px-4 font-medium text-slate-800">{p.driverName}</td>
                                <td className="py-3 px-4 font-mono text-slate-700">{p.nopol}</td>
                                <td className="py-3 px-4 text-slate-600">{p.originLocation} -&gt; {p.destinationLocation}</td>
                                <td className="py-3 px-4 text-right font-mono text-slate-600">{formatRupiah((p.driverAllowance || 0) + (p.helperAllowance || 0))}</td>
                                <td className="py-3 px-4 text-right font-mono text-slate-600">{formatRupiah((p.tollAllowance || 0) + (p.parkingAndWeighCost || 0))}</td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">{formatRupiah(p.actualExpense || p.totalGiven)}</td>
                              </tr>
                            ))}
                            {singleCompany.compPockets.length === 0 && (
                              <tr>
                                <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                                  Tidak ada catatan uang saku driver yang dibebankan ke perusahaan ini.
                                </td>
                              </tr>
                            )}
                          </tbody>
                          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                            <tr>
                              <td colSpan={8} className="py-3.5 px-4 text-slate-800">
                                TOTAL UANG SAKU DRIVER DIKELUARKAN
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono text-rose-800 text-sm whitespace-nowrap">
                                {formatRupiah(singleCompany.pocketExpense)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      )}

                      {/* SUB-TAB 4: TRIPSHEET SURAT JALAN */}
                      {singleCompanySubTab === 'trips' && (
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                            <tr>
                              <th className="py-3 px-4 w-12 text-center">No</th>
                              <th className="py-3 px-4">Tanggal</th>
                              <th className="py-3 px-4">No. Surat Jalan (DO)</th>
                              <th className="py-3 px-4">Driver &amp; Armada</th>
                              <th className="py-3 px-4">Rute Muat -&gt; Bongkar</th>
                              <th className="py-3 px-4 text-center">Jarak (KM)</th>
                              <th className="py-3 px-4 text-center">Muatan</th>
                              <th className="py-3 px-4 text-right">Biaya Perjalanan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {singleCompany.compTrips.map((t, idx) => (
                              <tr key={t.id} className="hover:bg-slate-50/60 transition">
                                <td className="py-3 px-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                                <td className="py-3 px-4 whitespace-nowrap text-slate-600">{formatDateIndo(t.departureDate)}</td>
                                <td className="py-3 px-4 font-mono font-bold text-indigo-700">{t.suratJalanNumber || t.tripNumber}</td>
                                <td className="py-3 px-4 text-slate-800">
                                  <span className="font-semibold">{t.driverName}</span>
                                  <span className="text-[10px] font-mono text-slate-400 block">{t.nopol}</span>
                                </td>
                                <td className="py-3 px-4 text-slate-600">{t.originLocation} -&gt; {t.destinationLocation}</td>
                                <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">{formatNumber(t.totalDistanceKm)} KM</td>
                                <td className="py-3 px-4 text-center text-slate-700">{t.cargoDescription} ({t.cargoTonnageTon || 0} Ton)</td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">{formatRupiah(t.actualTripExpense || t.totalPocketDisbursed || 0)}</td>
                              </tr>
                            ))}
                            {singleCompany.compTrips.length === 0 && (
                              <tr>
                                <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                                  Tidak ada perjalanan tripsheet untuk perusahaan ini pada periode terpilih.
                                </td>
                              </tr>
                            )}
                          </tbody>
                          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                            <tr>
                              <td colSpan={7} className="py-3.5 px-4 text-slate-800">
                                TOTAL BIAYA PERJALANAN TRIPSHEET
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono text-rose-800 text-sm whitespace-nowrap">
                                {formatRupiah(singleCompany.tripExpense)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      )}

                      {/* SUB-TAB 5: PERALATAN & SPAREPART */}
                      {singleCompanySubTab === 'equipment' && (
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                            <tr>
                              <th className="py-3 px-4 w-12 text-center">No</th>
                              <th className="py-3 px-4">Tanggal</th>
                              <th className="py-3 px-4">No. Nota</th>
                              <th className="py-3 px-4">Nama Barang / Part</th>
                              <th className="py-3 px-4">Kategori</th>
                              <th className="py-3 px-4">Armada / Lokasi</th>
                              <th className="py-3 px-4 text-center">Qty</th>
                              <th className="py-3 px-4 text-right">Total Biaya</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {singleCompany.compEquip.map((e, idx) => (
                              <tr key={e.id} className="hover:bg-slate-50/60 transition">
                                <td className="py-3 px-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                                <td className="py-3 px-4 whitespace-nowrap text-slate-600">{formatDateIndo(e.date)}</td>
                                <td className="py-3 px-4 font-mono font-bold text-slate-800">{e.receiptNumber || e.id}</td>
                                <td className="py-3 px-4 font-semibold text-slate-800">{e.equipmentName}</td>
                                <td className="py-3 px-4 text-slate-600">{e.category}</td>
                                <td className="py-3 px-4 font-mono text-slate-700">{e.nopol || 'Alokasi Pool'}</td>
                                <td className="py-3 px-4 text-center text-slate-700 font-semibold">{e.quantity} {e.unit}</td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">{formatRupiah(e.totalAmount)}</td>
                              </tr>
                            ))}
                            {singleCompany.compEquip.length === 0 && (
                              <tr>
                                <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                                  Tidak ada belanja sparepart atau peralatan yang dibebankan ke perusahaan ini.
                                </td>
                              </tr>
                            )}
                          </tbody>
                          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                            <tr>
                              <td colSpan={7} className="py-3.5 px-4 text-slate-800">
                                TOTAL BELANJA PERALATAN &amp; SPAREPART
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono text-rose-800 text-sm whitespace-nowrap">
                                {formatRupiah(singleCompany.equipExpense)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // ============================================================
            // MODE 2: REKAPITULASI RESUME SELURUH PERUSAHAAN (COMPARATIVE)
            // ============================================================
            return (
              <div className="space-y-6">
                {/* 4 Kartu Agregat Seluruh Perusahaan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-3xl shadow-xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Deposit Masuk</p>
                    <h3 className="text-2xl font-black text-emerald-600 font-mono mt-1">
                      {formatRupiah(sumCompanyCostDepositIn)}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">Akumulasi deposit seluruh rekanan</p>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-3xl shadow-xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dikeluarkan Berapa</p>
                    <h3 className="text-2xl font-black text-rose-600 font-mono mt-1">
                      {formatRupiah(sumCompanyCostTotalDeducted)}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">Total pengeluaran operasional ritase</p>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-3xl shadow-xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sisa Saldo Deposit</p>
                    <h3 className="text-2xl font-black text-indigo-700 font-mono mt-1">
                      {formatRupiah(sumCompanyCostNetDeposit)}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">Sisa dana aktif seluruh klien</p>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-3xl shadow-xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Aktivitas Rit</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">
                      {sumCompanyCostTrips} <span className="text-sm font-semibold text-slate-500">Ritase</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">{filteredCompanyCostSummary.length} perusahaan aktif</p>
                  </div>
                </div>

                {/* Tabel Resume Komparatif Antar Perusahaan */}
                <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Rekapitulasi Resume Operasional &amp; Finansial per Perusahaan
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Ringkasan deposit masuk, dana operasional dikeluarkan, dan sisa saldo kontrak tiap perusahaan
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                      Total Sisa Saldo: {formatRupiah(sumCompanyCostNetDeposit)}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                        <tr>
                          <th className="py-3 px-4">Perusahaan Rekanan</th>
                          <th className="py-3 px-4 text-right">Deposit Masuk</th>
                          <th className="py-3 px-4 text-right">Uang Saku Supir</th>
                          <th className="py-3 px-4 text-right">Biaya Tripsheet</th>
                          <th className="py-3 px-4 text-right">Belanja Alat</th>
                          <th className="py-3 px-4 text-right">Dikeluarkan Berapa</th>
                          <th className="py-3 px-4 text-right">Sisa Saldo Deposit</th>
                          <th className="py-3 px-4 text-center">Penyerapan</th>
                          <th className="py-3 px-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCompanyCostSummary.map((cs) => (
                          <tr key={cs.company.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-slate-800 text-xs">{cs.company.companyName}</p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                PIC: {cs.company.picName || '-'} | {cs.tripsCount} Ritase
                              </p>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                              {formatRupiah(cs.totalDepositIn)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                              {formatRupiah(cs.pocketExpense)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                              {formatRupiah(cs.tripExpense)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                              {formatRupiah(cs.equipExpense)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                              {formatRupiah(cs.totalDeducted)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-700">
                              {formatRupiah(cs.netDepositBalance)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                cs.utilizationPercent > 90
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : cs.utilizationPercent > 60
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {cs.utilizationPercent.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedCompany(cs.company.companyName)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-[11px] transition shadow-xs cursor-pointer border border-blue-200 hover:border-blue-600"
                                title={`Buka resume detail 1 perusahaan untuk ${cs.company.companyName}`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Lihat Resume</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredCompanyCostSummary.length === 0 && (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                              Tidak ada data perusahaan yang cocok dengan filter pencarian.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {/* FOOTER TABEL: TOTAL BIAYA PER PERUSAHAAN */}
                      <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                        <tr>
                          <td className="py-3.5 px-4">
                            TOTAL TERFILTER ({filteredCompanyCostSummary.length} Perusahaan)
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-emerald-800 text-sm">
                            {formatRupiah(sumCompanyCostDepositIn)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-800">
                            {formatRupiah(sumCompanyCostPocketExp)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-800">
                            {formatRupiah(sumCompanyCostTripExp)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-800">
                            {formatRupiah(sumCompanyCostEquipExp)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-rose-800 text-sm">
                            {formatRupiah(sumCompanyCostTotalDeducted)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-indigo-800 text-sm">
                            {formatRupiah(sumCompanyCostNetDeposit)}
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-700 font-mono">
                            {sumCompanyCostDepositIn > 0 ? `${((sumCompanyCostTotalDeducted / sumCompanyCostDepositIn) * 100).toFixed(1)}%` : '0%'}
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-400 font-normal">-</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ============================================================ */}
      {/* 13. TAB 10: LAPORAN SALDO KAS DAN UANG MUKA                  */}
      {/* ============================================================ */}
      {activeReportTab === 'cash_advances' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Kas &amp; Bank</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1 font-mono">{formatRupiah(sumAccountsBalance)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">{filteredAccounts.length} akun rekening</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Uang Muka Saku Beredar</p>
              <h3 className="text-xl font-bold text-amber-600 mt-1 font-mono">{formatRupiah(sumOutstandingAdvances)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Persekot jalan belum LPJ</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Likuiditas Kas Bersih</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-1 font-mono">{formatRupiah(sumNetLiquidAssets)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Total aset kas lancar</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Supir Belum LPJ</p>
              <h3 className="text-xl font-bold text-blue-600 mt-1">{filteredOutstandingAdvances.length} Driver</h3>
              <p className="text-[10px] text-slate-400 mt-1">Sedang bertugas di rute</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bagian A: Posisi Kas & Bank dengan Footer Total */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Posisi Saldo Kas &amp; Rekening Bank</h4>
                  <p className="text-[10px] text-slate-400">Saldo giro bank dan kas operasional pool</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {formatRupiah(sumAccountsBalance)}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Nama Akun Rekening</th>
                      <th className="py-2.5 px-4">No. Rekening</th>
                      <th className="py-2.5 px-4 text-right">Saldo Saat Ini</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAccounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {acc.accountName}
                          <p className="text-[10px] text-slate-400 font-normal">{acc.bankName}</p>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {acc.accountNumber}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                          {formatRupiah(acc.currentBalance)}
                        </td>
                      </tr>
                    ))}
                    {filteredAccounts.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-slate-400 text-xs">
                          Tidak ada rekening yang sesuai filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {/* FOOTER TABEL A: TOTAL KAS */}
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                    <tr>
                      <td colSpan={2} className="py-3 px-4">
                        TOTAL SALDO KAS &amp; BANK ({filteredAccounts.length} Akun)
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-800 text-sm">
                        {formatRupiah(sumAccountsBalance)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Bagian B: Uang Muka Beredar dengan Footer Total */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Uang Muka Beredar (Sangu Supir On-Trip)</h4>
                  <p className="text-[10px] text-slate-400">Pencairan persekot jalan yang belum diselesaikan (LPJ)</p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  {formatRupiah(sumOutstandingAdvances)}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">No. Trip &amp; Driver</th>
                      <th className="py-2.5 px-4">Armada</th>
                      <th className="py-2.5 px-4 text-right">Uang Muka</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOutstandingAdvances.map((flow) => (
                      <tr key={flow.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4">
                          <p className="font-mono font-bold text-slate-800">{flow.tripCode}</p>
                          <p className="text-[10px] text-blue-700 font-medium">{flow.driverName}</p>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {flow.nopol}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                          {formatRupiah(flow.totalGiven)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            ON-TRIP (BELUM LPJ)
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredOutstandingAdvances.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                          Seluruh uang muka driver telah diselesaikan (LPJ tuntas).
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {/* FOOTER TABEL B: TOTAL UANG MUKA */}
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                    <tr>
                      <td colSpan={2} className="py-3 px-4">
                        TOTAL UANG MUKA BEREDAR ({filteredOutstandingAdvances.length} Supir)
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-800 text-sm">
                        {formatRupiah(sumOutstandingAdvances)}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400 font-normal">-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW NOTA / BUKTI TRANSFER */}
      {previewReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-800 text-sm">Bukti Transaksi / Nota Fisik</h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewReceiptUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-50 flex items-center justify-center">
              <img
                src={previewReceiptUrl}
                alt="Bukti Transaksi"
                className="max-h-96 w-auto object-contain rounded-xl border border-slate-200 shadow-xs"
              />
            </div>
            <div className="p-3 bg-white border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewReceiptUrl(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition cursor-pointer"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
