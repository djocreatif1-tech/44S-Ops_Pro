import React, { useState, useMemo } from 'react';
import {
  Clock,
  Plus,
  Search,
  MapPin,
  Trash2,
  Edit2,
  X,
  Lock,
  Users,
  Calendar,
  ArrowRight,
  ArrowLeftRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BarChart2,
  Coffee,
  Check
} from 'lucide-react';
import { DriverTimesheet, Vehicle, UserRole, TripSheet, Driver } from '../../types';
import { confirmDelete } from '../../utils/dialogService';
import {
  formatNumber,
  formatDateIndo
} from '../../utils/formatters';
import { exportTimesheetToExcel, exportTimesheetToPDF } from '../../utils/exportUtils';
import { ModuleFilterExportBar } from '../Common/ModuleFilterExportBar';
import { getRolePermissions } from '../../utils/permissions';
import { RoleRestrictedBanner } from '../Common/RoleRestrictedBanner';
import { TablePagination } from '../Common/TablePagination';
import { ModuleAnalyticsPanel } from '../Common/ModuleAnalyticsPanel';

interface TimesheetManagerProps {
  timesheets: DriverTimesheet[];
  vehicles: Vehicle[];
  tripSheets?: TripSheet[];
  drivers?: Driver[];
  userRole?: UserRole;
  onOpenRoleMatrix?: () => void;
  onAddTimesheet: (ts: DriverTimesheet) => void;
  onUpdateTimesheet?: (ts: DriverTimesheet) => void;
  onDeleteTimesheet: (id: string) => void;
}

export const TimesheetManager: React.FC<TimesheetManagerProps> = ({
  timesheets = [],
  vehicles = [],
  tripSheets = [],
  drivers = [],
  userRole = 'owner',
  onOpenRoleMatrix,
  onAddTimesheet,
  onUpdateTimesheet,
  onDeleteTimesheet
}) => {
  const safeTimesheets = Array.isArray(timesheets) ? timesheets : [];
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const safeTripSheets = Array.isArray(tripSheets) ? tripSheets : [];
  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const perms = getRolePermissions(userRole);
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'recap_driver' | 'tripsheet_comparison' | 'analytics'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getTsCompany = (ts: DriverTimesheet) => {
    const v = safeVehicles.find(veh => veh.id === ts.vehicleId || veh.nopol === ts.nopol);
    return v?.ownerCompany || 'Perusahaan Umum / Lainnya';
  };

  const companies = Array.from(
    new Set([
      ...safeVehicles.map(v => v.ownerCompany).filter(Boolean),
      ...safeTimesheets.map(ts => getTsCompany(ts)).filter(Boolean)
    ])
  );

  const companySummaries = companies.map((comp) => {
    const compTs = safeTimesheets.filter((ts) => {
      if (!ts) return false;
      if (startDate && ts.date < startDate) return false;
      if (endDate && ts.date > endDate) return false;
      return getTsCompany(ts) === comp;
    });
    return {
      companyName: comp,
      count: compTs.length,
    };
  });
  
  // Pagination State (Next Halaman)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTs, setSelectedTs] = useState<DriverTimesheet | null>(null);

  // Form State (Add)
  const [selectedVehicleId, setSelectedVehicleId] = useState(safeVehicles[0]?.id || '');
  const [date, setDate] = useState('2026-08-21');
  const [driverName, setDriverName] = useState(safeVehicles[0]?.assignedDriver || '');
  const [helperName, setHelperName] = useState('');
  const [originLocation, setOriginLocation] = useState('Quarry Rumpin, Bogor');
  const [destinationLocation, setDestinationLocation] = useState('Batching Plant Puri Indah, Jakbar');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('16:30');
  const [breakMinutes, setBreakMinutes] = useState<number>(60);
  const [attendanceStatus, setAttendanceStatus] = useState<'hadir' | 'izin' | 'sakit' | 'alpa'>('hadir');
  const [overtimeHours, setOvertimeHours] = useState<number>(1.5);
  const [cargoDescription, setCargoDescription] = useState('Pasir Pasang & Batu Split');
  const [cargoTonnageTon, setCargoTonnageTon] = useState<number>(24);
  const [tripCount, setTripCount] = useState<number>(2);
  const [startKm, setStartKm] = useState<number>(safeVehicles[0]?.currentOdometer || 0);
  const [endKm, setEndKm] = useState<number>((safeVehicles[0]?.currentOdometer || 0) + 180);
  const [status, setStatus] = useState<'completed' | 'ongoing'>('completed');
  const [notes, setNotes] = useState('');

  // Form State (Edit)
  const [editFormData, setEditFormData] = useState({
    id: '',
    vehicleId: '',
    date: '',
    driverName: '',
    helperName: '',
    originLocation: '',
    destinationLocation: '',
    startTime: '',
    endTime: '',
    breakMinutes: 60,
    attendanceStatus: 'hadir' as 'hadir' | 'izin' | 'sakit' | 'alpa',
    overtimeHours: 0,
    cargoDescription: '',
    cargoTonnageTon: 0,
    tripCount: 1,
    startKm: 0,
    endKm: 0,
    status: 'completed' as 'completed' | 'ongoing',
    notes: ''
  });

  // Handle vehicle select
  const handleVehicleSelect = (vId: string) => {
    setSelectedVehicleId(vId);
    const v = safeVehicles.find(veh => veh.id === vId);
    if (v) {
      setDriverName(v.assignedDriver);
      setStartKm(v.currentOdometer);
      setEndKm(v.currentOdometer + 150);
    }
  };

  // Auto calculate hours with break time deduction
  const calculateTotalHours = (sTime: string, eTime: string, restMins: number = 60) => {
    try {
      const [startH, startM] = sTime.split(':').map(Number);
      const [endH, endM] = eTime.split(':').map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;
      let diffMin = endMin - startMin;
      if (diffMin < 0) diffMin += 24 * 60;
      const effectiveWorkMin = Math.max(0, diffMin - restMins);
      return parseFloat((effectiveWorkMin / 60).toFixed(1));
    } catch {
      return 8.0;
    }
  };

  const totalDistance = Math.max(0, endKm - startKm);
  const totalHours = calculateTotalHours(startTime, endTime, breakMinutes);

  const editTotalDistance = Math.max(0, editFormData.endKm - editFormData.startKm);
  const editTotalHours = calculateTotalHours(editFormData.startTime, editFormData.endTime, editFormData.breakMinutes);

  // Rekap Jam Kerja Driver & Absensi
  const driverRecap = useMemo(() => {
    const recapMap: Record<string, {
      driverName: string;
      totalDays: number;
      hadirDays: number;
      leaveDays: number;
      regularHours: number;
      overtimeHours: number;
      totalHours: number;
      totalTrips: number;
      totalKm: number;
      assignedNopol: string;
    }> = {};

    safeTimesheets.forEach(ts => {
      const dName = ts.driverName || 'Supir Belum Dinamai';
      if (!recapMap[dName]) {
        recapMap[dName] = {
          driverName: dName,
          totalDays: 0,
          hadirDays: 0,
          leaveDays: 0,
          regularHours: 0,
          overtimeHours: 0,
          totalHours: 0,
          totalTrips: 0,
          totalKm: 0,
          assignedNopol: ts.nopol || '-'
        };
      }
      const entry = recapMap[dName];
      entry.totalDays += 1;
      if (ts.attendanceStatus === 'izin' || ts.attendanceStatus === 'sakit' || ts.attendanceStatus === 'alpa') {
        entry.leaveDays += 1;
      } else {
        entry.hadirDays += 1;
      }
      const reg = ts.regularHours || Math.min(8, ts.totalHours || 0);
      const ot = ts.overtimeHours || 0;
      entry.regularHours += reg;
      entry.overtimeHours += ot;
      entry.totalHours += (ts.totalHours || (reg + ot));
      entry.totalTrips += (ts.tripCount || 1);
      entry.totalKm += (ts.totalDistanceKm || 0);
    });

    return Object.values(recapMap);
  }, [safeTimesheets]);

  // Perbandingan Timesheet vs Tripsheet
  const comparisonList = useMemo(() => {
    return safeTimesheets.map(ts => {
      // Find matching tripSheet by date & driver, or date & nopol
      const matchingTrip = safeTripSheets.find(tp => 
        tp.departureDate === ts.date && 
        (tp.driverName.toLowerCase().trim() === ts.driverName.toLowerCase().trim() || tp.nopol === ts.nopol)
      );

      // Durasi trip dalam jam desimal jika ada
      let tripHours = 0;
      if (matchingTrip?.departureTime && matchingTrip?.arrivalTime) {
        try {
          const [sH, sM] = matchingTrip.departureTime.split(':').map(Number);
          const [eH, eM] = matchingTrip.arrivalTime.split(':').map(Number);
          let m = (eH * 60 + eM) - (sH * 60 + sM);
          if (m < 0) m += 24 * 60;
          tripHours = parseFloat((m / 60).toFixed(1));
        } catch {
          tripHours = 0;
        }
      }

      const kmTimesheet = ts.totalDistanceKm || 0;
      const kmTrip = matchingTrip?.totalDistanceKm || 0;
      const kmDiff = matchingTrip ? kmTimesheet - kmTrip : 0;
      const hoursDiff = matchingTrip && tripHours > 0 ? parseFloat((ts.totalHours - tripHours).toFixed(1)) : 0;

      let matchStatus: 'exact' | 'reasonable' | 'flagged' | 'no_tripsheet' = 'no_tripsheet';
      if (matchingTrip) {
        if (Math.abs(kmDiff) <= 5 && Math.abs(hoursDiff) <= 1.5) {
          matchStatus = 'exact';
        } else if (Math.abs(kmDiff) <= 25 && hoursDiff >= 0 && hoursDiff <= 3.5) {
          matchStatus = 'reasonable'; // Loading/unloading queue
        } else {
          matchStatus = 'flagged';
        }
      }

      return {
        timesheet: ts,
        trip: matchingTrip,
        tripHours,
        kmDiff,
        hoursDiff,
        matchStatus
      };
    });
  }, [safeTimesheets, safeTripSheets]);

  const filteredTimesheets = safeTimesheets.filter((ts) => {
    if (!ts) return false;
    const compName = getTsCompany(ts);
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (ts.nopol || '').toLowerCase().includes(q) ||
      (ts.driverName || '').toLowerCase().includes(q) ||
      (ts.originLocation || '').toLowerCase().includes(q) ||
      (ts.destinationLocation || '').toLowerCase().includes(q) ||
      ((ts.cargoDescription || '').toLowerCase().includes(q)) ||
      compName.toLowerCase().includes(q);
    const matchesVehicle = selectedVehicle === 'all' || ts.vehicleId === selectedVehicle || ts.nopol === selectedVehicle;
    const matchesCompany = selectedCompany === 'all' || compName === selectedCompany;

    // Date Range Filter
    const matchesStartDate = !startDate || ts.date >= startDate;
    const matchesEndDate = !endDate || ts.date <= endDate;

    return matchesSearch && matchesVehicle && matchesCompany && matchesStartDate && matchesEndDate;
  });

  // Paginated Timesheets for Next / Prev Pages
  const totalFilteredTimesheets = filteredTimesheets.length;
  const paginatedTimesheets = filteredTimesheets.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const dateRangeText = startDate && endDate
    ? `${startDate} s/d ${endDate}`
    : startDate
    ? `Mulai ${startDate}`
    : endDate
    ? `Sampai ${endDate}`
    : 'Semua Periode';

  const handleExportExcel = () => {
    exportTimesheetToExcel(filteredTimesheets, dateRangeText);
  };

  const handleExportPDF = () => {
    exportTimesheetToPDF(filteredTimesheets, dateRangeText);
  };

  // Summary Metrics
  const sumTrips = filteredTimesheets.reduce((sum, t) => sum + t.tripCount, 0);
  const sumTonnage = filteredTimesheets.reduce((sum, t) => sum + (t.cargoTonnageTon || 0), 0);
  const sumHours = filteredTimesheets.reduce((sum, t) => sum + t.totalHours, 0);
  const sumDistance = filteredTimesheets.reduce((sum, t) => sum + t.totalDistanceKm, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = vehicles.find(veh => veh.id === selectedVehicleId);
    const nopol = v ? v.nopol : 'B 0000 XX';

    const newTs: DriverTimesheet = {
      id: 'TS-' + Date.now().toString().slice(-4),
      vehicleId: selectedVehicleId,
      nopol,
      driverName,
      helperName,
      date,
      originLocation,
      destinationLocation,
      cargoDescription,
      cargoTonnageTon: Number(cargoTonnageTon) || 0,
      tripCount: Number(tripCount) || 1,
      startTime,
      endTime,
      breakMinutes: Number(breakMinutes) || 60,
      attendanceStatus,
      regularHours: Math.min(8, totalHours),
      totalHours,
      overtimeHours: Number(overtimeHours) || 0,
      startKm: Number(startKm) || 0,
      endKm: Number(endKm) || 0,
      totalDistanceKm: totalDistance,
      status,
      notes
    };

    onAddTimesheet(newTs);
    setIsModalOpen(false);
  };

  const handleOpenEdit = (ts: DriverTimesheet) => {
    setSelectedTs(ts);
    setEditFormData({
      id: ts.id,
      vehicleId: ts.vehicleId,
      date: ts.date,
      driverName: ts.driverName,
      helperName: ts.helperName || '',
      originLocation: ts.originLocation,
      destinationLocation: ts.destinationLocation,
      startTime: ts.startTime,
      endTime: ts.endTime,
      breakMinutes: ts.breakMinutes !== undefined ? ts.breakMinutes : 60,
      attendanceStatus: ts.attendanceStatus || 'hadir',
      overtimeHours: ts.overtimeHours,
      cargoDescription: ts.cargoDescription,
      cargoTonnageTon: ts.cargoTonnageTon || 0,
      tripCount: ts.tripCount,
      startKm: ts.startKm,
      endKm: ts.endKm,
      status: ts.status,
      notes: ts.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTs || !onUpdateTimesheet) return;

    const v = vehicles.find(veh => veh.id === editFormData.vehicleId);
    const nopol = v ? v.nopol : selectedTs.nopol;

    const updated: DriverTimesheet = {
      ...selectedTs,
      vehicleId: editFormData.vehicleId,
      nopol,
      driverName: editFormData.driverName,
      helperName: editFormData.helperName,
      date: editFormData.date,
      originLocation: editFormData.originLocation,
      destinationLocation: editFormData.destinationLocation,
      cargoDescription: editFormData.cargoDescription,
      cargoTonnageTon: Number(editFormData.cargoTonnageTon) || 0,
      tripCount: Number(editFormData.tripCount) || 1,
      startTime: editFormData.startTime,
      endTime: editFormData.endTime,
      breakMinutes: editFormData.breakMinutes,
      attendanceStatus: editFormData.attendanceStatus,
      regularHours: Math.min(8, editTotalHours),
      totalHours: editTotalHours,
      overtimeHours: Number(editFormData.overtimeHours) || 0,
      startKm: Number(editFormData.startKm) || 0,
      endKm: Number(editFormData.endKm) || 0,
      totalDistanceKm: editTotalDistance,
      status: editFormData.status,
      notes: editFormData.notes
    };

    onUpdateTimesheet(updated);
    setIsEditModalOpen(false);
    setSelectedTs(null);
  };

  return (
    <div className="space-y-6">
      {/* Role Restricted Banner */}
      {!perms.canAddTimesheet && (
        <RoleRestrictedBanner
          userRole={userRole}
          moduleName="Laporan Time Sheet & Ritase"
          allowedActionsText="Hanya dapat melihat ringkasan ritase"
          restrictedActionsText="Pencatatan surat jalan dan time sheet harian hanya dapat dikelola oleh Admin 2 & Owner."
          onOpenRoleModal={onOpenRoleMatrix}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Laporan Time Sheet &amp; Ritase Pengemudi
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Pencatatan rute jalan, jam operasional kerja, ritase, dan tonase muatan armada
          </p>
        </div>
        {perms.canAddTimesheet ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-xs active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Input Time Sheet</span>
          </button>
        ) : (
          <button
            disabled
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 text-slate-400 font-medium text-xs rounded-lg cursor-not-allowed border border-slate-200"
            title="Akses dibatasi sesuai peran pengguna"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Input Time Sheet (Terkunci)</span>
          </button>
        )}
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveSubTab('list')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeSubTab === 'list'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Laporan Time Sheet &amp; Ritase ({filteredTimesheets.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('recap_driver')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeSubTab === 'recap_driver'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-600" />
          <span>Rekap Jam Kerja &amp; Absensi Driver ({driverRecap.length} Supir)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tripsheet_comparison')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeSubTab === 'tripsheet_comparison'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
          <span>Perbandingan Timesheet vs Tripsheet</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
            {comparisonList.length} Baris
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeSubTab === 'analytics'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/80 rounded-t-lg'
              : 'border-transparent text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/40 rounded-t-lg'
          }`}
        >
          <BarChart2 className="w-4 h-4 text-indigo-600" />
          <span>Laporan &amp; Analitik Timesheet</span>
        </button>
      </div>

      {/* 0. Sub-Tab: Laporan & Analitik Timesheet */}
      {activeSubTab === 'analytics' && (
        <ModuleAnalyticsPanel
          moduleType="timesheet"
          title="Laporan & Analitik Jam Kerja, Absensi & Ritase Pengemudi"
          subtitle="Evaluasi jam kerja efektif, lembur (overtime), ritase pengiriman & jarak tempuh pengemudi secara periodik"
          timesheets={safeTimesheets}
          vehicles={safeVehicles}
          drivers={safeDrivers}
        />
      )}

      {/* 1. Sub-Tab: List Timesheet */}
      {activeSubTab === 'list' && (
        <div className="space-y-6">
          {/* Metrics Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Ritase</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{sumTrips} <span className="text-xs font-normal text-slate-400">Rit Perjalanan</span></h3>
              <p className="text-[10px] text-slate-400 mt-1">{filteredTimesheets.length} lembar surat jalan</p>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Tonase Muatan</p>
              <h3 className="text-xl font-bold text-blue-600 mt-1">{formatNumber(sumTonnage)} <span className="text-xs font-normal text-slate-400">Tonase (Ton)</span></h3>
              <p className="text-[10px] text-slate-400 mt-1">Volume logistik terkirim</p>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Jam Kerja</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{sumHours.toFixed(1)} <span className="text-xs font-normal text-slate-400">Jam Operasi</span></h3>
              <p className="text-[10px] text-slate-400 mt-1">Efektivitas supir &amp; armada</p>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Jarak Tempuh</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1 font-mono">{formatNumber(sumDistance)} <span className="text-xs font-normal text-slate-400">KM</span></h3>
              <p className="text-[10px] text-slate-400 mt-1">Jarak tempuh riil logistik</p>
            </div>
          </div>

          {/* Date Filter & Export Bar */}
          <ModuleFilterExportBar
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onResetDateFilter={() => { setStartDate(''); setEndDate(''); }}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            totalFilteredCount={filteredTimesheets.length}
            totalAllCount={timesheets.length}
            moduleLabel="Surat Jalan & Timesheet"
            companies={companies}
            selectedCompany={selectedCompany}
            onCompanyChange={(val) => {
              setSelectedCompany(val);
              setCurrentPage(1);
            }}
            companySummaries={companySummaries}
          >
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari Rute, Supir, Nopol, Muatan..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white"
              />
            </div>

            <select
              value={selectedVehicle}
              onChange={(e) => {
                setSelectedVehicle(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 font-medium"
            >
              <option value="all">Semua Armada</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.nopol} ({v.brand})</option>
              ))}
            </select>
          </ModuleFilterExportBar>

          {/* Timesheet Table with Full CRUD */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100 font-bold">
                  <tr>
                    <th className="py-3 px-5">Tanggal &amp; Armada</th>
                    <th className="py-3 px-5">Driver &amp; Kenek</th>
                    <th className="py-3 px-5">Rute Perjalanan</th>
                    <th className="py-3 px-5">Muatan &amp; Rit</th>
                    <th className="py-3 px-5">Odo &amp; Jarak</th>
                    <th className="py-3 px-5">Jam Kerja &amp; Istirahat</th>
                    <th className="py-3 px-5 text-center">Status</th>
                    <th className="py-3 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTimesheets.map((ts) => (
                    <tr key={ts.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-5">
                        <p className="font-bold text-slate-800">{formatDateIndo(ts.date)}</p>
                        <p className="font-mono text-[11px] text-slate-500 font-bold">{ts.nopol}</p>
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-medium text-slate-800">{ts.driverName}</p>
                        {ts.helperName && <p className="text-[10px] text-slate-400">Kenek: {ts.helperName}</p>}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{ts.originLocation} &rarr; {ts.destinationLocation}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-medium text-slate-800">{ts.cargoDescription}</p>
                        <p className="text-[10px] text-slate-500">{ts.cargoTonnageTon} Ton &bull; {ts.tripCount} Rit</p>
                      </td>
                      <td className="py-3.5 px-5 font-mono">
                        <p className="font-bold text-slate-800">{formatNumber(ts.endKm)} KM</p>
                        <p className="text-[10px] text-slate-400">+{ts.totalDistanceKm} KM</p>
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-medium text-slate-800">{ts.startTime} - {ts.endTime}</p>
                        <p className="text-[10px] text-blue-600 font-semibold">
                          {ts.totalHours} Jam {ts.overtimeHours > 0 && `(+${ts.overtimeHours} Lembur)`}
                          {ts.breakMinutes ? ` &bull; Istirahat ${ts.breakMinutes}m` : ''}
                        </p>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          ts.status === 'completed'
                            ? 'bg-green-50 text-green-700 border border-green-200/60'
                            : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                        }`}>
                          {ts.status === 'completed' ? 'SELESAI' : 'ON-TRIP'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {perms.canEditTimesheet && onUpdateTimesheet && (
                            <button
                              onClick={() => handleOpenEdit(ts)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition"
                              title="Edit Time Sheet"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {perms.canDeleteTimesheet && (
                            <button
                              onClick={() => {
                                confirmDelete(`Hapus log timesheet unit ${ts.nopol} tanggal ${ts.date}?`).then((ok) => {
                                  if (ok) onDeleteTimesheet(ts.id);
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition"
                              title="Hapus Surat Jalan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTimesheets.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Belum ada data time sheet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Pagination with Next / Prev */}
            <TablePagination
              currentPage={currentPage}
              totalItems={totalFilteredTimesheets}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
              itemLabel="catatan time sheet"
            />
          </div>
        </div>
      )}

      {/* 2. Sub-Tab: Rekap Jam Kerja & Absensi Driver */}
      {activeSubTab === 'recap_driver' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Supir Beroperasi</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{driverRecap.length} <span className="text-xs font-normal text-slate-400">Pengemudi</span></h3>
              <p className="text-[10px] text-slate-400 mt-1">Supir aktif bertugas</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Jam Kerja Normal</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-1">
                {driverRecap.reduce((s, d) => s + d.regularHours, 0).toFixed(1)} <span className="text-xs font-normal text-slate-400">Jam</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Hari kerja efektif</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Jam Lembur</p>
              <h3 className="text-xl font-bold text-amber-600 mt-1">
                {driverRecap.reduce((s, d) => s + d.overtimeHours, 0).toFixed(1)} <span className="text-xs font-normal text-slate-400">Jam Lembur</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Overtime di luar jam 8</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Ritase Supir</p>
              <h3 className="text-xl font-bold text-blue-600 mt-1">
                {driverRecap.reduce((s, d) => s + d.totalTrips, 0)} <span className="text-xs font-normal text-slate-400">Ritase</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Pengantaran kargo</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Rekapitulasi Jam Kerja &amp; Absensi Pengemudi</h3>
                <p className="text-xs text-slate-400 mt-0.5">Akumulasi hari kerja, jam normal, lembur, dan ritase per driver</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100 font-bold">
                  <tr>
                    <th className="py-3 px-5">Nama Driver</th>
                    <th className="py-3 px-5">Armada Biasa</th>
                    <th className="py-3 px-5 text-center">Hari Hadir</th>
                    <th className="py-3 px-5 text-center">Izin / Sakit / Alpa</th>
                    <th className="py-3 px-5 text-center">Jam Normal</th>
                    <th className="py-3 px-5 text-center">Jam Lembur</th>
                    <th className="py-3 px-5 text-center">Total Jam</th>
                    <th className="py-3 px-5 text-center">Rata2 Jam/Hari</th>
                    <th className="py-3 px-5 text-center">Ritase</th>
                    <th className="py-3 px-5 text-right">Total KM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {driverRecap.map((dr) => {
                    const avgHoursPerDay = dr.hadirDays > 0 ? (dr.totalHours / dr.hadirDays).toFixed(1) : '0';
                    return (
                      <tr key={dr.driverName} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-5 font-bold text-slate-800">
                          {dr.driverName}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-slate-600">
                          {dr.assignedNopol}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {dr.hadirDays} Hari
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            dr.leaveDays > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-slate-400'
                          }`}>
                            {dr.leaveDays} Hari
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center font-mono font-medium text-slate-700">
                          {dr.regularHours.toFixed(1)} Jam
                        </td>
                        <td className="py-3.5 px-5 text-center font-mono font-bold text-amber-600">
                          +{dr.overtimeHours.toFixed(1)} Jam
                        </td>
                        <td className="py-3.5 px-5 text-center font-mono font-bold text-blue-700">
                          {dr.totalHours.toFixed(1)} Jam
                        </td>
                        <td className="py-3.5 px-5 text-center font-mono text-slate-700">
                          {avgHoursPerDay} Jam/Hari
                        </td>
                        <td className="py-3.5 px-5 text-center font-bold text-slate-800">
                          {dr.totalTrips} Rit
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-800">
                          {formatNumber(dr.totalKm)} KM
                        </td>
                      </tr>
                    );
                  })}
                  {driverRecap.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        Belum ada catatan aktivitas supir
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Sub-Tab: Perbandingan Timesheet dengan Tripsheet */}
      {activeSubTab === 'tripsheet_comparison' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Dokumen Trip</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{safeTripSheets.length} <span className="text-xs font-normal text-slate-400">Surat Jalan</span></h3>
              <p className="text-[10px] text-slate-400 mt-1">Trip sheet aktif tersinkron</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Tercatat di Timesheet</p>
              <h3 className="text-xl font-bold text-blue-600 mt-1">{safeTimesheets.length} <span className="text-xs font-normal text-slate-400">Laporan</span></h3>
              <p className="text-[10px] text-slate-400 mt-1">Jam operasional supir</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Data Akurat &amp; Selaras</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-1">
                {comparisonList.filter(c => c.matchStatus === 'exact' || c.matchStatus === 'reasonable').length} <span className="text-xs font-normal text-slate-400">Sesuai</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">KM dan jam kerja konsisten</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Perlu Klarifikasi</p>
              <h3 className="text-xl font-bold text-amber-600 mt-1">
                {comparisonList.filter(c => c.matchStatus === 'flagged').length} <span className="text-xs font-normal text-slate-400">Selisih</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Selisih jam/jarak lebih batas</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Matriks Perbandingan Timesheet (Jam Kerja Supir) vs Tripsheet (Surat Jalan DO)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Audit selisih durasi jalan, waktu antri muat/bongkar, dan verifikasi kilometer riil</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100 font-bold">
                  <tr>
                    <th className="py-3 px-4">Tanggal &amp; Supir</th>
                    <th className="py-3 px-4">Timesheet (Jam Kerja)</th>
                    <th className="py-3 px-4">Tripsheet (Perjalanan DO)</th>
                    <th className="py-3 px-4 text-center">Selisih Jam (Antri/Standby)</th>
                    <th className="py-3 px-4 text-center">Selisih Jarak</th>
                    <th className="py-3 px-4 text-center">Status Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonList.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{formatDateIndo(row.timesheet.date)}</p>
                        <p className="text-[11px] text-blue-700 font-semibold">{row.timesheet.driverName}</p>
                        <p className="font-mono text-[10px] text-slate-400">{row.timesheet.nopol}</p>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">
                          {row.timesheet.startTime} - {row.timesheet.endTime} ({row.timesheet.totalHours} Jam)
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {row.timesheet.totalDistanceKm} KM &bull; Istirahat: {row.timesheet.breakMinutes || 60}m
                        </p>
                        <p className="text-[10px] text-slate-400 truncate max-w-xs">
                          {row.timesheet.originLocation} &rarr; {row.timesheet.destinationLocation}
                        </p>
                      </td>

                      <td className="py-3 px-4">
                        {row.trip ? (
                          <>
                            <p className="font-medium text-slate-800">
                              {row.trip.tripNumber} ({row.trip.suratJalanNumber})
                            </p>
                            <p className="text-[10px] text-indigo-700 font-semibold">
                              {row.trip.departureTime || '07:00'} - {row.trip.arrivalTime || '16:00'} ({row.tripHours > 0 ? `${row.tripHours} Jam` : row.trip.tripDuration || '-'})
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">{row.trip.totalDistanceKm} KM</p>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Tidak ada surat jalan terhubung</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-mono">
                        {row.trip ? (
                          <span className={`font-bold ${row.hoursDiff > 3 ? 'text-amber-600' : 'text-slate-700'}`}>
                            {row.hoursDiff > 0 ? `+${row.hoursDiff} Jam` : `${row.hoursDiff} Jam`}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-mono">
                        {row.trip ? (
                          <span className={`font-bold ${Math.abs(row.kmDiff) > 20 ? 'text-amber-600' : 'text-slate-700'}`}>
                            {row.kmDiff > 0 ? `+${row.kmDiff} KM` : `${row.kmDiff} KM`}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {row.matchStatus === 'exact' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                            SESUAI PRESISI
                          </span>
                        ) : row.matchStatus === 'reasonable' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            STANDBY WAJAR
                          </span>
                        ) : row.matchStatus === 'flagged' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            PERLU AUDIT
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            TANPA DO TRIP
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {comparisonList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Belum ada data perjalanan untuk dibandingkan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Timesheet */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Input Log Time Sheet Driver
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Armada / No. Polisi *</label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => handleVehicleSelect(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.nopol} - {v.brand} ({v.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Tanggal Operasional</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nama Supir / Driver *</label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nama Kenek / Helper</label>
                  <input
                    type="text"
                    placeholder="Opsional"
                    value={helperName}
                    onChange={(e) => setHelperName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Lokasi Asal (Origin) *</label>
                  <input
                    type="text"
                    required
                    value={originLocation}
                    onChange={(e) => setOriginLocation(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Lokasi Tujuan (Destination) *</label>
                  <input
                    type="text"
                    required
                    value={destinationLocation}
                    onChange={(e) => setDestinationLocation(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Deskripsi Muatan</label>
                  <input
                    type="text"
                    value={cargoDescription}
                    onChange={(e) => setCargoDescription(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Tonase (Ton)</label>
                    <input
                      type="number"
                      value={cargoTonnageTon}
                      onChange={(e) => setCargoTonnageTon(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Jumlah Rit</label>
                    <input
                      type="number"
                      value={tripCount}
                      onChange={(e) => setTripCount(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jam Berangkat (Start)</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jam Tiba / Selesai (End)</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jam Istirahat (Menit)</label>
                  <select
                    value={breakMinutes}
                    onChange={(e) => setBreakMinutes(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  >
                    <option value={0}>0 Menit (Tanpa Istirahat)</option>
                    <option value={30}>30 Menit</option>
                    <option value={45}>45 Menit</option>
                    <option value={60}>60 Menit (1 Jam Normal)</option>
                    <option value={90}>90 Menit (1.5 Jam)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Status Kehadiran / Absensi</label>
                  <select
                    value={attendanceStatus}
                    onChange={(e) => setAttendanceStatus(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="hadir">Hadir (Masuk Dinas)</option>
                    <option value="izin">Izin Resmi</option>
                    <option value="sakit">Sakit</option>
                    <option value="alpa">Alpa / Tanpa Keterangan</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jam Lembur (Jam)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={overtimeHours}
                    onChange={(e) => setOvertimeHours(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Status Perjalanan</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'completed' | 'ongoing')}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="completed">SELESAI (Completed)</option>
                    <option value="ongoing">ON-TRIP (Sedang Jalan)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">KM Awal (Start Odo)</label>
                  <input
                    type="number"
                    value={startKm}
                    onChange={(e) => setStartKm(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">KM Akhir (End Odo)</label>
                  <input
                    type="number"
                    value={endKm}
                    onChange={(e) => setEndKm(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Automatic Stats Preview */}
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between text-slate-700">
                <span>Total Jam: <strong>{totalHours} Jam</strong></span>
                <span>Jarak Tempuh: <strong>{totalDistance} KM</strong></span>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan hambatan rute, kendala bongkar muat, dll"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-xs"
                >
                  Simpan Time Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Timesheet (Update CRUD) */}
      {isEditModalOpen && selectedTs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                Edit Log Time Sheet &amp; Surat Jalan
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Armada / No. Polisi *</label>
                  <select
                    value={editFormData.vehicleId}
                    onChange={(e) => setEditFormData({ ...editFormData, vehicleId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.nopol} - {v.brand} ({v.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Tanggal Operasional</label>
                  <input
                    type="date"
                    required
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nama Supir *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.driverName}
                    onChange={(e) => setEditFormData({ ...editFormData, driverName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nama Kenek</label>
                  <input
                    type="text"
                    value={editFormData.helperName}
                    onChange={(e) => setEditFormData({ ...editFormData, helperName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Lokasi Asal *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.originLocation}
                    onChange={(e) => setEditFormData({ ...editFormData, originLocation: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Lokasi Tujuan *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.destinationLocation}
                    onChange={(e) => setEditFormData({ ...editFormData, destinationLocation: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Deskripsi Muatan</label>
                  <input
                    type="text"
                    value={editFormData.cargoDescription}
                    onChange={(e) => setEditFormData({ ...editFormData, cargoDescription: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Tonase (Ton)</label>
                    <input
                      type="number"
                      value={editFormData.cargoTonnageTon}
                      onChange={(e) => setEditFormData({ ...editFormData, cargoTonnageTon: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Jumlah Rit</label>
                    <input
                      type="number"
                      value={editFormData.tripCount}
                      onChange={(e) => setEditFormData({ ...editFormData, tripCount: parseInt(e.target.value, 10) || 1 })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jam Berangkat</label>
                  <input
                    type="time"
                    value={editFormData.startTime}
                    onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jam Tiba</label>
                  <input
                    type="time"
                    value={editFormData.endTime}
                    onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jam Istirahat (Menit)</label>
                  <select
                    value={editFormData.breakMinutes}
                    onChange={(e) => setEditFormData({ ...editFormData, breakMinutes: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  >
                    <option value={0}>0 Menit (Tanpa Istirahat)</option>
                    <option value={30}>30 Menit</option>
                    <option value={45}>45 Menit</option>
                    <option value={60}>60 Menit (1 Jam Normal)</option>
                    <option value={90}>90 Menit (1.5 Jam)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Status Kehadiran / Absensi</label>
                  <select
                    value={editFormData.attendanceStatus}
                    onChange={(e) => setEditFormData({ ...editFormData, attendanceStatus: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="hadir">Hadir (Masuk Dinas)</option>
                    <option value="izin">Izin Resmi</option>
                    <option value="sakit">Sakit</option>
                    <option value="alpa">Alpa / Tanpa Keterangan</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jam Lembur</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editFormData.overtimeHours}
                    onChange={(e) => setEditFormData({ ...editFormData, overtimeHours: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Status Perjalanan</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as 'completed' | 'ongoing' })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="completed">SELESAI (Completed)</option>
                    <option value="ongoing">ON-TRIP (Sedang Jalan)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">KM Awal</label>
                  <input
                    type="number"
                    value={editFormData.startKm}
                    onChange={(e) => setEditFormData({ ...editFormData, startKm: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">KM Akhir</label>
                  <input
                    type="number"
                    value={editFormData.endKm}
                    onChange={(e) => setEditFormData({ ...editFormData, endKm: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Automatic Stats Preview */}
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between text-slate-700">
                <span>Total Jam: <strong>{editTotalHours} Jam</strong></span>
                <span>Jarak Tempuh: <strong>{editTotalDistance} KM</strong></span>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catatan</label>
                <textarea
                  rows={2}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-xs"
                >
                  Perbarui Time Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
