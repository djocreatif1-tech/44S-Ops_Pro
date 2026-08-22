/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Vehicle,
  TaxRecord,
  FuelLog,
  OperationalFinance,
  DriverTimesheet,
  MaintenanceRecord,
  Driver,
  GoogleSheetsConfig,
  FinancialAccount,
  NotificationConfig,
  NonRentalIncomeCategory,
  UserRole,
  UserAccount,
  ActivityLog,
  ActivityLogModule,
  ActivityActionType,
  AuthSession
} from './types';
import {
  loadStoredData,
  saveStoredData,
  loadGoogleSheetsConfig,
  saveGoogleSheetsConfig,
  syncToGoogleAppsScript,
  saveStoredUserRole,
  saveStoredNonRentalCategories,
  saveStoredUserAccounts,
  saveStoredActivityLogs,
  clearStoredActivityLogs,
  getStoredAuthSession,
  saveStoredAuthSession,
  getStoredIsLocked,
  saveStoredIsLocked
} from './utils/storage';
import { generateAppNotifications } from './utils/notificationEngine';
import { formatRupiah } from './utils/formatters';
import { isTabPermitted, getRoleMeta } from './utils/permissions';

// Layout & Navigation Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/Navigation/BottomNav';

// Auth Components
import { LoginScreen } from './components/Auth/LoginScreen';
import { LockScreen } from './components/Auth/LockScreen';
import { UserProfileModal } from './components/Auth/UserProfileModal';

// Tab Views
import { DashboardOverview } from './components/Dashboard/DashboardOverview';
import { VehicleList } from './components/Vehicles/VehicleList';
import { VehicleDetailModal } from './components/Vehicles/VehicleDetailModal';
import { TaxManager } from './components/Tax/TaxManager';
import { FuelLogManager } from './components/Fuel/FuelLogManager';
import { FinanceManager } from './components/Finance/FinanceManager';
import { TimesheetManager } from './components/Timesheet/TimesheetManager';
import { MaintenanceManager } from './components/Maintenance/MaintenanceManager';
import { DriverManager } from './components/Drivers/DriverManager';
import { ReportsAnalytics } from './components/Reports/ReportsAnalytics';
import { NonRentalIncomeManager } from './components/MasterData/NonRentalIncomeManager';
import { UserManager } from './components/Users/UserManager';
import { ActivityLogManager } from './components/Logs/ActivityLogManager';

// Modals
import { AppsScriptDeployModal } from './components/AppsScript/AppsScriptDeployModal';
import { NotificationConfigModal } from './components/Notifications/NotificationConfigModal';
import { RolePermissionsModal } from './components/Common/RolePermissionsModal';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

export function App() {
  // Authentication & Session State
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState<boolean>(false);

  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // User Role & Account State
  const [userRole, setUserRole] = useState<UserRole>('owner');
  const [currentUserId, setCurrentUserId] = useState<string>('USR-001');
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isRoleMatrixModalOpen, setIsRoleMatrixModalOpen] = useState<boolean>(false);

  // Core Data States
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [taxes, setTaxes] = useState<TaxRecord[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [finances, setFinances] = useState<OperationalFinance[]>([]);
  const [timesheets, setTimesheets] = useState<DriverTimesheet[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [nonRentalCategories, setNonRentalCategories] = useState<NonRentalIncomeCategory[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [notifConfig, setNotifConfig] = useState<NotificationConfig>({
    taxAlertDaysBefore: 30,
    serviceAlertKmBefore: 1000,
    serviceAlertDaysBefore: 14,
    fuelReminderDays: 3,
    enableTaxAlerts: true,
    enableServiceAlerts: true,
    enableFuelAlerts: true,
    enableEmailAlerts: true,
    recipientEmail: 'operasional@fleetops.co.id'
  });
  const [gasConfig, setGasConfig] = useState<GoogleSheetsConfig>({ isConnected: false });

  // Modal States
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState<Vehicle | null>(null);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState<boolean>(false);
  const [isNotifConfigOpen, setIsNotifConfigOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Initialize Data from Local Storage
  useEffect(() => {
    const initial = loadStoredData();
    setVehicles(initial.vehicles);
    setTaxes(initial.taxes);
    setFuelLogs(initial.fuelLogs);
    setFinances(initial.finances);
    setTimesheets(initial.timesheets);
    setMaintenance(initial.maintenance);
    setDrivers(initial.drivers);
    setAccounts(initial.accounts);
    setNonRentalCategories(initial.nonRentalCategories || []);
    setUserRole(initial.userRole || 'owner');
    setUsers(initial.users || []);
    setActivityLogs(initial.activityLogs || []);
    if (initial.users && initial.users.length > 0) {
      const activeUser = initial.users.find(u => u.role === initial.userRole) || initial.users[0];
      setCurrentUserId(activeUser.id);
    }
    if (initial.notifConfig) {
      setNotifConfig(initial.notifConfig);
    }

    const cfg = loadGoogleSheetsConfig();
    setGasConfig(cfg);

    // Initialize Auth Session & Lock Screen from Storage
    const savedSession = getStoredAuthSession();
    if (savedSession) {
      setAuthSession(savedSession);
      setUserRole(savedSession.userRole);
      setCurrentUserId(savedSession.userId);
    }
    const savedLock = getStoredIsLocked();
    setIsLocked(savedLock);
  }, []);

  // Sync to local storage on any state change
  const persistAll = (
    v = vehicles,
    t = taxes,
    f = fuelLogs,
    fin = finances,
    ts = timesheets,
    m = maintenance,
    d = drivers,
    acc = accounts,
    ncfg = notifConfig,
    cats = nonRentalCategories,
    role = userRole,
    usrList = users,
    logs = activityLogs
  ) => {
    saveStoredData({
      vehicles: v,
      taxes: t,
      fuelLogs: f,
      finances: fin,
      timesheets: ts,
      maintenance: m,
      drivers: d,
      accounts: acc,
      notifConfig: ncfg,
      nonRentalCategories: cats,
      userRole: role,
      users: usrList,
      activityLogs: logs
    });
  };

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Standardized Activity Logger Helper
  const createActivityLog = (
    module: ActivityLogModule,
    action: ActivityActionType,
    title: string,
    description: string,
    targetId?: string,
    targetName?: string,
    details?: Record<string, any>,
    badgeType: 'success' | 'danger' | 'warning' | 'info' | 'primary' = 'info'
  ) => {
    const activeUser = users.find(u => u.id === currentUserId) || {
      id: currentUserId || 'USR-CURRENT',
      name: userRole === 'owner' ? 'H. Hendra Wijaya' : userRole === 'admin1' ? 'Rina Anggraini, S.E.' : 'Budi Santoso, S.T.',
      role: userRole,
      department: userRole === 'owner' ? 'Direksi / Owner' : userRole === 'admin1' ? 'Operasional & Keuangan' : 'Armada & Logistik Lapangan'
    };

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const newLog: ActivityLog = {
      id: 'LOG-' + Date.now().toString().slice(-6),
      timestamp,
      module,
      action,
      title,
      description,
      targetId,
      targetName,
      userId: activeUser.id,
      userName: activeUser.name,
      userRole: activeUser.role,
      userDepartment: activeUser.department,
      details,
      badgeType
    };

    const updatedLogs = [newLog, ...activityLogs];
    setActivityLogs(updatedLogs);
    saveStoredActivityLogs(updatedLogs);
    return newLog;
  };

  // Authentication Handlers
  const handleLoginSuccess = (session: AuthSession) => {
    setAuthSession(session);
    setUserRole(session.userRole);
    setCurrentUserId(session.userId);
    saveStoredAuthSession(session);
    saveStoredUserRole(session.userRole);
    setIsLocked(false);
    saveStoredIsLocked(false);

    createActivityLog(
      'user',
      'login',
      'Masuk Sistem (Login Berhasil)',
      `Pengguna ${session.userName} (@${session.username}) berhasil masuk ke sistem dengan peran ${session.userRole.toUpperCase()}.`,
      session.userId,
      session.userName,
      { email: session.email, role: session.userRole, department: session.department },
      'success'
    );

    // If active tab is not permitted for the user's role, auto-route to dashboard
    if (!isTabPermitted(session.userRole, currentTab)) {
      setCurrentTab('dashboard');
    }
  };

  const handleLogout = () => {
    if (authSession) {
      createActivityLog(
        'user',
        'login',
        'Keluar Sistem (Logout)',
        `Pengguna ${authSession.userName} keluar dari sistem.`,
        authSession.userId,
        authSession.userName,
        undefined,
        'info'
      );
    }
    setAuthSession(null);
    saveStoredAuthSession(null);
    setIsLocked(false);
    saveStoredIsLocked(false);
    showToast('Anda telah keluar dari sistem.', 'info');
  };

  const handleLockScreen = () => {
    setIsLocked(true);
    saveStoredIsLocked(true);
    showToast('Sesi kerja telah dikunci.', 'info');
  };

  const handleUnlockScreen = () => {
    setIsLocked(false);
    saveStoredIsLocked(false);
    showToast('Layar kerja berhasil dibuka!', 'success');
  };

  // Role Switcher Handler
  const handleRoleChange = (newRole: UserRole) => {
    setUserRole(newRole);
    saveStoredUserRole(newRole);
    const matchingUser = users.find(u => u.role === newRole && u.status === 'active');
    if (matchingUser) {
      setCurrentUserId(matchingUser.id);
    }

    if (authSession) {
      const updatedSession: AuthSession = {
        ...authSession,
        userRole: newRole,
        userId: matchingUser ? matchingUser.id : authSession.userId,
        userName: matchingUser ? matchingUser.name : authSession.userName
      };
      setAuthSession(updatedSession);
      saveStoredAuthSession(updatedSession);
    }

    if (!isTabPermitted(newRole, currentTab)) {
      setCurrentTab('dashboard');
    }

    createActivityLog(
      'user',
      'login',
      'Ganti Peran Hak Akses',
      `Sesi pengguna beralih ke peran hak akses ${newRole.toUpperCase()}.`,
      undefined,
      newRole.toUpperCase(),
      undefined,
      'info'
    );
    persistAll(vehicles, taxes, fuelLogs, finances, timesheets, maintenance, drivers, accounts, notifConfig, nonRentalCategories, newRole, users);
    showToast(`Peran aktif beralih ke: ${getRoleMeta(newRole).title}`, 'info');
  };

  // Push to Google Sheets if connected
  const pushToGas = async (action: string, data: unknown) => {
    if (!gasConfig.webAppUrl || !gasConfig.isConnected) return;
    try {
      await syncToGoogleAppsScript(gasConfig.webAppUrl, action, data);
    } catch {
      // ignore
    }
  };

  // Generated Notifications
  const activeNotifications = generateAppNotifications(vehicles, taxes, maintenance, fuelLogs, notifConfig);

  // Current User Object
  const currentUser = users.find(u => u.id === currentUserId) || users.find(u => u.role === userRole) || users[0];

  // --- Handlers: Vehicles ---
  const handleAddVehicle = (v: Vehicle) => {
    const updated = [v, ...vehicles];
    setVehicles(updated);
    createActivityLog(
      'vehicle',
      'create',
      'Tambah Armada Baru',
      `Mendaftarkan unit armada baru ${v.nopol} (${v.brand} ${v.type}, Kapasitas: ${v.capacityTon} Ton).`,
      v.id,
      v.nopol,
      { brand: v.brand, type: v.type, capacityTon: v.capacityTon, year: v.year },
      'success'
    );
    persistAll(updated, taxes, fuelLogs, finances, timesheets, maintenance, drivers, accounts, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('addVehicle', v);
    showToast(`Kendaraan ${v.nopol} berhasil ditambahkan!`);
  };

  const handleUpdateVehicle = (v: Vehicle) => {
    const updated = vehicles.map(item => (item.id === v.id ? v : item));
    setVehicles(updated);
    createActivityLog(
      'vehicle',
      'update',
      'Ubah Data Armada',
      `Pembaruan spesifikasi, status, atau penugasan pengemudi pada unit ${v.nopol}.`,
      v.id,
      v.nopol,
      { odometer: v.currentOdometer, status: v.status, assignedDriver: v.assignedDriver },
      'primary'
    );
    persistAll(updated, taxes, fuelLogs, finances, timesheets, maintenance, drivers, accounts, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('updateVehicle', v);
    showToast(`Data kendaraan ${v.nopol} berhasil diperbarui!`);
  };

  const handleDeleteVehicle = (id: string) => {
    const target = vehicles.find(v => v.id === id);
    const updated = vehicles.filter(v => v.id !== id);
    setVehicles(updated);
    createActivityLog(
      'vehicle',
      'delete',
      'Hapus Unit Armada',
      `Penghapusan unit armada ${target?.nopol || id} dari sistem operasional.`,
      id,
      target?.nopol || id,
      undefined,
      'danger'
    );
    persistAll(updated, taxes, fuelLogs, finances, timesheets, maintenance, drivers, accounts, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('deleteVehicle', { id });
    showToast('Kendaraan berhasil dihapus', 'info');
  };

  // --- Handlers: Taxes ---
  const handleAddTax = (t: TaxRecord) => {
    const updated = [t, ...taxes];
    setTaxes(updated);
    createActivityLog(
      'tax',
      'create',
      'Jadwal Pajak / KIR Baru',
      `Penambahan jadwal ${t.documentType} unit ${t.nopol} jatuh tempo ${t.dueDate} (${formatRupiah(t.amount)}).`,
      t.id,
      t.nopol,
      { documentType: t.documentType, dueDate: t.dueDate, amount: t.amount },
      'success'
    );
    persistAll(vehicles, updated, fuelLogs, finances, timesheets, maintenance, drivers, accounts, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('addTax', t);
    showToast(`Jadwal pajak ${t.documentType} ${t.nopol} tersimpan!`);
  };

  const handleUpdateTax = (t: TaxRecord) => {
    const updated = taxes.map(item => (item.id === t.id ? t : item));
    setTaxes(updated);
    createActivityLog(
      'tax',
      'update',
      'Ubah Data Pajak / KIR',
      `Pembaruan data kepatuhan ${t.documentType} ${t.nopol}.`,
      t.id,
      t.nopol,
      undefined,
      'primary'
    );
    persistAll(vehicles, updated, fuelLogs, finances, timesheets, maintenance, drivers, accounts, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('updateTax', t);
    showToast('Data pajak berhasil diperbarui!');
  };

  const handleDeleteTax = (id: string) => {
    const target = taxes.find(t => t.id === id);
    const updated = taxes.filter(t => t.id !== id);
    setTaxes(updated);
    createActivityLog(
      'tax',
      'delete',
      'Hapus Jadwal Pajak',
      `Penghapusan catatan pajak ${target?.documentType || ''} unit ${target?.nopol || id}.`,
      id,
      target?.nopol || id,
      undefined,
      'danger'
    );
    persistAll(vehicles, updated, fuelLogs, finances, timesheets, maintenance, drivers, accounts, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('deleteTax', { id });
    showToast('Catatan pajak dihapus', 'info');
  };

  const handlePayTax = (taxId: string, paymentDate: string, amount: number, accountId?: string) => {
    const targetTax = taxes.find(t => t.id === taxId);
    const updatedTaxes = taxes.map(t =>
      t.id === taxId
        ? {
            ...t,
            status: 'paid' as const,
            lastPaymentDate: paymentDate,
            amount: amount || t.amount
          }
        : t
    );
    setTaxes(updatedTaxes);

    let updatedAccounts = accounts;
    let selectedAccountName = 'Kas Utama Pool';
    if (accountId) {
      updatedAccounts = accounts.map(a => {
        if (a.id === accountId) {
          selectedAccountName = a.accountName;
          return { ...a, currentBalance: a.currentBalance - (amount || targetTax?.amount || 0) };
        }
        return a;
      });
      setAccounts(updatedAccounts);
    }

    const newFinance: OperationalFinance = {
      id: 'FIN-' + Date.now().toString().slice(-4),
      date: paymentDate,
      vehicleId: targetTax?.vehicleId || '',
      nopol: targetTax?.nopol || '',
      driverName: 'Admin Pajak',
      category: targetTax?.documentType.includes('KIR') ? 'Uji KIR Dishub' : 'Pajak STNK Tahunan',
      type: 'expense',
      amount: amount || targetTax?.amount || 0,
      description: `Pembayaran ${targetTax?.documentType || 'Pajak'} ${targetTax?.nopol}`,
      paymentMethod: accountId ? 'Transfer' : 'Cash',
      status: 'approved',
      accountId: accountId || undefined,
      accountName: selectedAccountName
    };
    const updatedFinances = [newFinance, ...finances];
    setFinances(updatedFinances);

    createActivityLog(
      'tax',
      'status_change',
      'Pelunasan Pajak / KIR',
      `Pembayaran ${targetTax?.documentType || 'Pajak'} unit ${targetTax?.nopol} lunas sebesar ${formatRupiah(amount || targetTax?.amount || 0)} melalui ${selectedAccountName}.`,
      taxId,
      targetTax?.nopol,
      { amount: amount || targetTax?.amount, account: selectedAccountName, paymentDate },
      'success'
    );

    persistAll(vehicles, updatedTaxes, fuelLogs, updatedFinances, timesheets, maintenance, drivers, updatedAccounts, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('payTax', { taxId, paymentDate, amount, newFinance });
    showToast(`Pajak ${targetTax?.nopol} berhasil dibayarkan dan dicatat ke arus kas!`);
  };

  // --- Handlers: Fuel ---
  const handleAddFuelLog = (f: FuelLog) => {
    const updatedFuel = [f, ...fuelLogs];
    setFuelLogs(updatedFuel);

    // Update vehicle odometer if higher
    const updatedVehicles = vehicles.map(v => {
      if ((v.id === f.vehicleId || v.nopol === f.nopol) && f.odometer > v.currentOdometer) {
        return { ...v, currentOdometer: f.odometer };
      }
      return v;
    });
    setVehicles(updatedVehicles);

    let updatedAccounts = accounts;
    let selectedAccountName = 'Kas Operasional Solar';
    if (f.accountId) {
      updatedAccounts = accounts.map(a => {
        if (a.id === f.accountId) {
          selectedAccountName = a.accountName;
          return { ...a, currentBalance: a.currentBalance - f.totalCost };
        }
        return a;
      });
      setAccounts(updatedAccounts);
    }

    // Auto-create finance expense
    const newFinance: OperationalFinance = {
      id: 'FIN-BBM-' + Date.now().toString().slice(-4),
      date: f.date,
      vehicleId: f.vehicleId,
      nopol: f.nopol,
      driverName: f.driverName,
      category: 'Biaya BBM / Solar',
      type: 'expense',
      amount: f.totalCost,
      description: `BBM ${f.fuelType} ${f.volumeLiters} Liter @ ${formatRupiah(f.pricePerLiter)} - SPBU: ${f.fuelStation || 'Umum'}`,
      paymentMethod: f.paymentMethod || 'Cash / Uang Kas',
      status: 'approved',
      accountId: f.accountId,
      accountName: f.accountName || selectedAccountName
    };
    const updatedFinances = [newFinance, ...finances];
    setFinances(updatedFinances);

    createActivityLog(
      'fuel',
      'create',
      'Input Pengisian BBM Solar',
      `Pengisian solar ${f.nopol} oleh supir ${f.driverName} sebanyak ${f.volumeLiters}L (${formatRupiah(f.totalCost)}, Odo: ${f.odometer.toLocaleString()} KM).`,
      f.id,
      f.nopol,
      { volumeLiters: f.volumeLiters, totalCost: f.totalCost, odo: f.odometer, kmPerLiter: f.calculatedKmPerLiter },
      'success'
    );

    persistAll(updatedVehicles, taxes, updatedFuel, updatedFinances, timesheets, maintenance, drivers, updatedAccounts, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('addFuelLog', f);
    showToast(`Pengisian BBM solar ${f.nopol} (${f.volumeLiters}L) tersimpan & kas terupdate!`);
  };

  const handleUpdateFuelLog = (f: FuelLog) => {
    const updated = fuelLogs.map(item => (item.id === f.id ? f : item));
    setFuelLogs(updated);
    createActivityLog(
      'fuel',
      'update',
      'Ubah Data Pengisian Solar',
      `Pembaruan log BBM unit ${f.nopol} (${f.volumeLiters}L).`,
      f.id,
      f.nopol,
      undefined,
      'primary'
    );
    persistAll(vehicles, taxes, updated, finances, timesheets, maintenance, drivers, accounts, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('updateFuelLog', f);
    showToast('Log BBM solar berhasil diperbarui!');
  };

  const handleDeleteFuelLog = (id: string) => {
    const target = fuelLogs.find(f => f.id === id);
    const updated = fuelLogs.filter(f => f.id !== id);
    setFuelLogs(updated);
    createActivityLog(
      'fuel',
      'delete',
      'Hapus Log Pengisian Solar',
      `Penghapusan log pengisian solar unit ${target?.nopol || id}.`,
      id,
      target?.nopol || id,
      undefined,
      'danger'
    );
    persistAll(vehicles, taxes, updated, finances, timesheets, maintenance, drivers, accounts, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('deleteFuelLog', { id });
    showToast('Log BBM dihapus', 'info');
  };

  // --- Handlers: Finance ---
  const handleAddFinance = (fin: OperationalFinance) => {
    const updatedFinances = [fin, ...finances];
    setFinances(updatedFinances);

    let updatedAccounts = accounts;
    if (fin.accountId) {
      updatedAccounts = accounts.map(a => {
        if (a.id === fin.accountId) {
          const delta = fin.type === 'income' ? fin.amount : -fin.amount;
          return { ...a, currentBalance: a.currentBalance + delta };
        }
        return a;
      });
      setAccounts(updatedAccounts);
    }

    createActivityLog(
      'finance',
      'create',
      fin.type === 'income' ? 'Pemasukan Kas Baru' : 'Pengeluaran Kas Baru',
      `Pencatatan ${fin.type === 'income' ? 'pemasukan' : 'pengeluaran'} [${fin.category}] sebesar ${formatRupiah(fin.amount)} (${fin.description}).`,
      fin.id,
      fin.nopol || fin.category,
      { type: fin.type, amount: fin.amount, category: fin.category, account: fin.accountName },
      fin.type === 'income' ? 'success' : 'warning'
    );

    persistAll(vehicles, taxes, fuelLogs, updatedFinances, timesheets, maintenance, drivers, updatedAccounts, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('addFinance', fin);
    showToast(`Transaksi ${fin.category} (${formatRupiah(fin.amount)}) berhasil dicatat!`);
  };

  const handleUpdateFinance = (fin: OperationalFinance) => {
    const updated = finances.map(item => (item.id === fin.id ? fin : item));
    setFinances(updated);
    createActivityLog(
      'finance',
      'update',
      'Ubah Transaksi Kas',
      `Pembaruan catatan transaksi ${fin.category} (${formatRupiah(fin.amount)}).`,
      fin.id,
      fin.category,
      undefined,
      'primary'
    );
    persistAll(vehicles, taxes, fuelLogs, updated, timesheets, maintenance, drivers, accounts, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('updateFinance', fin);
    showToast('Data keuangan berhasil diperbarui!');
  };

  const handleDeleteFinance = (id: string) => {
    const target = finances.find(f => f.id === id);
    const updated = finances.filter(f => f.id !== id);
    setFinances(updated);
    createActivityLog(
      'finance',
      'delete',
      'Hapus Transaksi Keuangan',
      `Penghapusan catatan transaksi ${target?.category || ''} sebesar ${formatRupiah(target?.amount || 0)}.`,
      id,
      target?.category || id,
      undefined,
      'danger'
    );
    persistAll(vehicles, taxes, fuelLogs, updated, timesheets, maintenance, drivers, accounts, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('deleteFinance', { id });
    showToast('Transaksi keuangan dihapus', 'info');
  };

  // --- Handlers: Accounts (Kas & Bank) ---
  const handleAddAccount = (acc: FinancialAccount) => {
    const updatedAcc = [acc, ...accounts];
    setAccounts(updatedAcc);
    createActivityLog(
      'finance',
      'create',
      'Tambah Rekening Kas/Bank',
      `Pembuatan master rekening baru: ${acc.accountName} (Saldo awal: ${formatRupiah(acc.currentBalance)}).`,
      acc.id,
      acc.accountName,
      { balance: acc.currentBalance, type: acc.accountType },
      'success'
    );
    persistAll(vehicles, taxes, fuelLogs, finances, timesheets, maintenance, drivers, updatedAcc, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('addAccount', acc);
    showToast(`Akun rekening ${acc.accountName} berhasil ditambahkan!`);
  };

  const handleUpdateAccount = (acc: FinancialAccount) => {
    const updatedAcc = accounts.map(a => (a.id === acc.id ? acc : a));
    setAccounts(updatedAcc);
    createActivityLog(
      'finance',
      'update',
      'Ubah Data Rekening',
      `Pembaruan informasi rekening pembukuan ${acc.accountName}.`,
      acc.id,
      acc.accountName,
      undefined,
      'primary'
    );
    persistAll(vehicles, taxes, fuelLogs, finances, timesheets, maintenance, drivers, updatedAcc, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('updateAccount', acc);
    showToast(`Akun rekening ${acc.accountName} berhasil diperbarui!`);
  };

  const handleDeleteAccount = (id: string) => {
    const target = accounts.find(a => a.id === id);
    const updatedAcc = accounts.filter(a => a.id !== id);
    setAccounts(updatedAcc);
    createActivityLog(
      'finance',
      'delete',
      'Hapus Rekening Kas/Bank',
      `Penghapusan akun rekening pembukuan ${target?.accountName || id}.`,
      id,
      target?.accountName || id,
      undefined,
      'danger'
    );
    persistAll(vehicles, taxes, fuelLogs, finances, timesheets, maintenance, drivers, updatedAcc, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('deleteAccount', { id });
    showToast('Akun kas/bank berhasil dihapus', 'info');
  };

  const handleTransferBalance = (fromAccId: string, toAccId: string, amount: number, notes: string) => {
    const fromAcc = accounts.find(a => a.id === fromAccId);
    const toAcc = accounts.find(a => a.id === toAccId);

    const updatedAcc = accounts.map(a => {
      if (a.id === fromAccId) return { ...a, currentBalance: a.currentBalance - amount };
      if (a.id === toAccId) return { ...a, currentBalance: a.currentBalance + amount };
      return a;
    });
    setAccounts(updatedAcc);

    // Catat mutasi kas
    const transferTx: OperationalFinance = {
      id: 'FIN-TRF-' + Date.now().toString().slice(-4),
      date: new Date().toISOString().split('T')[0],
      vehicleId: '',
      nopol: '-',
      driverName: 'Kasir / Finance',
      category: 'Lain-lain',
      type: 'expense',
      amount: amount,
      description: `Mutasi Saldo: ${fromAcc?.accountName || fromAccId} -> ${toAcc?.accountName || toAccId} (${notes})`,
      paymentMethod: 'Transfer',
      status: 'approved',
      accountId: fromAccId,
      accountName: fromAcc?.accountName
    };
    const updatedFin = [transferTx, ...finances];
    setFinances(updatedFin);

    createActivityLog(
      'finance',
      'transfer',
      'Mutasi Saldo Kas / Bank',
      `Transfer saldo ${formatRupiah(amount)} dari ${fromAcc?.accountName || fromAccId} ke ${toAcc?.accountName || toAccId} (${notes}).`,
      fromAccId,
      `${fromAcc?.accountName || fromAccId} -> ${toAcc?.accountName || toAccId}`,
      { from: fromAcc?.accountName, to: toAcc?.accountName, amount, notes },
      'primary'
    );

    persistAll(vehicles, taxes, fuelLogs, updatedFin, timesheets, maintenance, drivers, updatedAcc, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('transferBalance', { fromAccountId: fromAccId, toAccountId: toAccId, amount, notes });
    showToast(`Transfer Rp ${amount.toLocaleString()} dari ${fromAcc?.accountName} ke ${toAcc?.accountName} berhasil!`);
  };

  // --- Handlers: Non-Rental Categories (Master Data) ---
  const handleAddNonRentalCategory = (cat: NonRentalIncomeCategory) => {
    const updated = [cat, ...nonRentalCategories];
    setNonRentalCategories(updated);
    saveStoredNonRentalCategories(updated);
    createActivityLog(
      'master_data',
      'create',
      'Tambah Master Non-Sewa',
      `Penambahan master kategori non-sewa [${cat.code}] ${cat.name} (Tarif acuan: ${formatRupiah(cat.defaultAmount || 0)}).`,
      cat.id,
      cat.name,
      { code: cat.code, defaultAmount: cat.defaultAmount },
      'success'
    );
    persistAll(vehicles, taxes, fuelLogs, finances, timesheets, maintenance, drivers, accounts, notifConfig, updated, userRole, users);
    showToast(`Kategori pemasukan non-sewa "${cat.name}" berhasil ditambahkan!`);
  };

  const handleUpdateNonRentalCategory = (cat: NonRentalIncomeCategory) => {
    const updated = nonRentalCategories.map(c => (c.id === cat.id ? cat : c));
    setNonRentalCategories(updated);
    saveStoredNonRentalCategories(updated);
    createActivityLog(
      'master_data',
      'update',
      'Ubah Master Non-Sewa',
      `Pembaruan master kategori non-sewa [${cat.code}] ${cat.name}.`,
      cat.id,
      cat.name,
      undefined,
      'primary'
    );
    persistAll(vehicles, taxes, fuelLogs, finances, timesheets, maintenance, drivers, accounts, notifConfig, updated, userRole, users);
    showToast(`Kategori "${cat.name}" berhasil diperbarui!`);
  };

  const handleDeleteNonRentalCategory = (id: string) => {
    const target = nonRentalCategories.find(c => c.id === id);
    const updated = nonRentalCategories.filter(c => c.id !== id);
    setNonRentalCategories(updated);
    saveStoredNonRentalCategories(updated);
    createActivityLog(
      'master_data',
      'delete',
      'Hapus Master Non-Sewa',
      `Penghapusan master kategori non-sewa ${target?.name || id}.`,
      id,
      target?.name || id,
      undefined,
      'danger'
    );
    persistAll(vehicles, taxes, fuelLogs, finances, timesheets, maintenance, drivers, accounts, notifConfig, updated, userRole, users);
    showToast('Kategori pemasukan non-sewa berhasil dihapus.', 'info');
  };

  const handleSaveNotificationConfig = (cfg: NotificationConfig) => {
    setNotifConfig(cfg);
    createActivityLog(
      'system',
      'update',
      'Ubah Konfigurasi Notifikasi',
      'Pembaruan ambang batas peringatan jatuh tempo pajak, servis berkala, dan email alert.',
      undefined,
      'Konfigurasi Notifikasi',
      undefined,
      'info'
    );
    persistAll(vehicles, taxes, fuelLogs, finances, timesheets, maintenance, drivers, accounts, cfg, nonRentalCategories, userRole, users);
    pushToGas('saveNotifConfig', cfg);
    showToast('Pengaturan notifikasi operasional berhasil diperbarui!');
  };

  // --- Handlers: Timesheet ---
  const handleAddTimesheet = (ts: DriverTimesheet) => {
    const updatedTs = [ts, ...timesheets];
    setTimesheets(updatedTs);

    // Update vehicle odometer if higher
    const updatedVehicles = vehicles.map(v => {
      if ((v.id === ts.vehicleId || v.nopol === ts.nopol) && ts.endKm > v.currentOdometer) {
        return { ...v, currentOdometer: ts.endKm };
      }
      return v;
    });
    setVehicles(updatedVehicles);

    createActivityLog(
      'timesheet',
      'create',
      'Catat Time Sheet Supir',
      `Ritase supir ${ts.driverName} (${ts.nopol}) rute ${ts.originLocation} -> ${ts.destinationLocation} (${ts.totalDistanceKm} KM, Muatan: ${ts.cargoTonnageTon} Ton).`,
      ts.id,
      ts.nopol,
      { driver: ts.driverName, rute: `${ts.originLocation} -> ${ts.destinationLocation}`, jarakKm: ts.totalDistanceKm, tonase: ts.cargoTonnageTon },
      'success'
    );

    persistAll(updatedVehicles, taxes, fuelLogs, finances, updatedTs, maintenance, drivers, accounts, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('addTimesheet', ts);
    showToast(`Timesheet driver ${ts.driverName} (${ts.tripCount} Rit, ${ts.totalDistanceKm} KM) tersimpan!`);
  };

  const handleUpdateTimesheet = (ts: DriverTimesheet) => {
    const updated = timesheets.map(t => (t.id === ts.id ? ts : t));
    setTimesheets(updated);
    createActivityLog(
      'timesheet',
      'update',
      'Ubah Time Sheet Supir',
      `Pembaruan catatan ritase pengemudi ${ts.driverName} (${ts.nopol}).`,
      ts.id,
      ts.nopol,
      undefined,
      'primary'
    );
    persistAll(vehicles, taxes, fuelLogs, finances, updated, maintenance, drivers, accounts, notifConfig, nonRentalCategories, userRole, users);
    showToast(`Timesheet supir ${ts.driverName} berhasil diperbarui!`);
  };

  const handleDeleteTimesheet = (id: string) => {
    const target = timesheets.find(t => t.id === id);
    const updated = timesheets.filter(t => t.id !== id);
    setTimesheets(updated);
    createActivityLog(
      'timesheet',
      'delete',
      'Hapus Time Sheet',
      `Penghapusan log ritase supir ${target?.driverName || ''} (${target?.nopol || id}).`,
      id,
      target?.nopol || id,
      undefined,
      'danger'
    );
    persistAll(vehicles, taxes, fuelLogs, finances, updated, maintenance, drivers, accounts, notifConfig, nonRentalCategories, userRole, users);
    showToast('Timesheet dihapus', 'info');
  };

  // --- Handlers: Maintenance ---
  const handleAddMaintenance = (m: MaintenanceRecord) => {
    const updatedMaint = [m, ...maintenance];
    setMaintenance(updatedMaint);

    const updatedVehicles = vehicles.map(v => {
      if (v.id === m.vehicleId || v.nopol === m.nopol) {
        return {
          ...v,
          lastServiceDate: m.serviceDate,
          lastServiceKm: m.odometerAtService,
          status: m.status === 'in_progress' ? ('in_shop' as const) : v.status
        };
      }
      return v;
    });
    setVehicles(updatedVehicles);

    let updatedAccounts = accounts;
    let selectedAccountName = 'Kas Utama Bengkel';
    if (m.accountId && m.status === 'completed') {
      updatedAccounts = accounts.map(a => {
        if (a.id === m.accountId) {
          selectedAccountName = a.accountName;
          return { ...a, currentBalance: a.currentBalance - m.totalCost };
        }
        return a;
      });
      setAccounts(updatedAccounts);
    }

    if (m.status === 'completed' && m.totalCost > 0) {
      const newFinance: OperationalFinance = {
        id: 'FIN-SRV-' + Date.now().toString().slice(-4),
        date: m.serviceDate,
        vehicleId: m.vehicleId,
        nopol: m.nopol,
        driverName: 'Mekanik Bengkel',
        category: 'Perawatan & Bengkel',
        type: 'expense',
        amount: m.totalCost,
        description: `SPK Servis Bengkel ${m.nopol} - ${m.serviceType}: ${m.workshopName}`,
        paymentMethod: m.accountId ? 'Transfer' : 'Cash',
        status: 'approved',
        accountId: m.accountId,
        accountName: selectedAccountName
      };
      setFinances([newFinance, ...finances]);
    }

    createActivityLog(
      'maintenance',
      'create',
      'SPK Servis Bengkel Baru',
      `Penerbitan SPK servis ${m.serviceType} unit ${m.nopol} di ${m.workshopName} (${formatRupiah(m.totalCost)}).`,
      m.id,
      m.nopol,
      { workshop: m.workshopName, totalCost: m.totalCost, status: m.status },
      'success'
    );

    persistAll(updatedVehicles, taxes, fuelLogs, finances, timesheets, updatedMaint, drivers, updatedAccounts, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('addMaintenance', m);
    showToast(`SPK Perawatan ${m.nopol} (${formatRupiah(m.totalCost)}) tersimpan!`);
  };

  const handleUpdateMaintenance = (m: MaintenanceRecord) => {
    const updated = maintenance.map(item => (item.id === m.id ? m : item));
    setMaintenance(updated);
    createActivityLog(
      'maintenance',
      'update',
      'Ubah SPK Perawatan',
      `Pembaruan data servis unit ${m.nopol} (${m.serviceType}).`,
      m.id,
      m.nopol,
      undefined,
      'primary'
    );
    persistAll(vehicles, taxes, fuelLogs, finances, timesheets, updated, drivers, accounts, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('updateMaintenance', m);
    showToast('Data perawatan berhasil diperbarui!');
  };

  const handleDeleteMaintenance = (id: string) => {
    const target = maintenance.find(m => m.id === id);
    const updated = maintenance.filter(m => m.id !== id);
    setMaintenance(updated);
    createActivityLog(
      'maintenance',
      'delete',
      'Hapus SPK Perawatan',
      `Penghapusan data servis bengkel ${target?.nopol || id}.`,
      id,
      target?.nopol || id,
      undefined,
      'danger'
    );
    persistAll(vehicles, taxes, fuelLogs, finances, timesheets, updated, drivers, accounts, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('deleteMaintenance', { id });
    showToast('Data perawatan dihapus', 'info');
  };

  // --- Handlers: Drivers ---
  const handleAddDriver = (d: Driver) => {
    const updated = [d, ...drivers];
    setDrivers(updated);
    createActivityLog(
      'driver',
      'create',
      'Tambah Supir Baru',
      `Pendaftaran pengemudi baru: ${d.name} (${d.simType}, No. SIM: ${d.simNumber}).`,
      d.id,
      d.name,
      { phone: d.phone, simType: d.simType, assignedVehicle: d.assignedVehicle },
      'success'
    );
    persistAll(vehicles, taxes, fuelLogs, finances, timesheets, maintenance, updated, accounts, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('addDriver', d);
    showToast(`Supir ${d.name} berhasil ditambahkan!`);
  };

  const handleUpdateDriver = (d: Driver) => {
    const updated = drivers.map(item => (item.id === d.id ? d : item));
    setDrivers(updated);
    createActivityLog(
      'driver',
      'update',
      'Ubah Data Supir',
      `Pembaruan informasi data pribadi/SIM supir ${d.name}.`,
      d.id,
      d.name,
      undefined,
      'primary'
    );
    persistAll(vehicles, taxes, fuelLogs, finances, timesheets, maintenance, updated, accounts, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('updateDriver', d);
    showToast(`Data supir ${d.name} diperbarui!`);
  };

  const handleDeleteDriver = (id: string) => {
    const target = drivers.find(item => item.id === id);
    const updated = drivers.filter(item => item.id !== id);
    setDrivers(updated);
    createActivityLog(
      'driver',
      'delete',
      'Hapus Profil Supir',
      `Penghapusan profil pengemudi ${target?.name || id} dari sistem.`,
      id,
      target?.name || id,
      undefined,
      'danger'
    );
    persistAll(vehicles, taxes, fuelLogs, finances, timesheets, maintenance, updated, accounts, notifConfig, nonRentalCategories, userRole, users);
    pushToGas('deleteDriver', { id });
    showToast('Data supir dihapus', 'info');
  };

  // --- Handlers: Users & Account Management ---
  const handleAddUserAccount = (usr: UserAccount) => {
    const updated = [usr, ...users];
    setUsers(updated);
    saveStoredUserAccounts(updated);
    createActivityLog(
      'user',
      'create',
      'Tambah Akun Staf Baru',
      `Pembuatan akun staf pengguna baru: ${usr.name} dengan peran ${usr.role.toUpperCase()} (${usr.department}).`,
      usr.id,
      usr.name,
      { email: usr.email, role: usr.role, department: usr.department },
      'success'
    );
    persistAll(vehicles, taxes, fuelLogs, finances, timesheets, maintenance, drivers, accounts, notifConfig, nonRentalCategories, userRole, updated);
    showToast(`Pengguna baru ${usr.name} (${usr.role.toUpperCase()}) berhasil dibuat!`);
  };

  const handleUpdateUserAccount = (usr: UserAccount) => {
    const updated = users.map(u => (u.id === usr.id ? usr : u));
    setUsers(updated);
    saveStoredUserAccounts(updated);

    // If current session is updated, sync session data
    if (authSession && authSession.userId === usr.id) {
      const updatedSession: AuthSession = {
        ...authSession,
        userName: usr.name,
        email: usr.email,
        department: usr.department,
        userRole: usr.role
      };
      setAuthSession(updatedSession);
      saveStoredAuthSession(updatedSession);
      setUserRole(usr.role);
    }

    createActivityLog(
      'user',
      'update',
      'Ubah Profil Akun Staf',
      `Pembaruan profil pengguna ${usr.name} (${usr.role.toUpperCase()}).`,
      usr.id,
      usr.name,
      undefined,
      'primary'
    );
    persistAll(vehicles, taxes, fuelLogs, finances, timesheets, maintenance, drivers, accounts, notifConfig, nonRentalCategories, userRole, updated);
    showToast(`Profil pengguna ${usr.name} berhasil diperbarui!`);
  };

  const handleDeleteUserAccount = (userId: string) => {
    const target = users.find(u => u.id === userId);
    const updated = users.filter(u => u.id !== userId);
    setUsers(updated);
    saveStoredUserAccounts(updated);
    createActivityLog(
      'user',
      'delete',
      'Hapus Akun Pengguna',
      `Penghapusan akun staf ${target?.name || userId} (${target?.role.toUpperCase() || '-'}).`,
      userId,
      target?.name || userId,
      undefined,
      'danger'
    );
    persistAll(vehicles, taxes, fuelLogs, finances, timesheets, maintenance, drivers, accounts, notifConfig, nonRentalCategories, userRole, updated);
    showToast(`Akun pengguna ${target?.name || ''} telah dihapus.`, 'info');
  };

  const handleSwitchUser = (usr: UserAccount) => {
    setUserRole(usr.role);
    setCurrentUserId(usr.id);
    saveStoredUserRole(usr.role);

    const newSession: AuthSession = {
      userId: usr.id,
      userName: usr.name,
      username: usr.username,
      userRole: usr.role,
      email: usr.email,
      department: usr.department,
      loginTime: new Date().toLocaleTimeString(),
      isRemembered: true
    };
    setAuthSession(newSession);
    saveStoredAuthSession(newSession);

    createActivityLog(
      'user',
      'login',
      'Ganti Sesi Akun Staf',
      `Pengguna beralih masuk ke profil: ${usr.name} (${usr.role.toUpperCase()}).`,
      usr.id,
      usr.name,
      { email: usr.email, role: usr.role },
      'info'
    );
    persistAll(vehicles, taxes, fuelLogs, finances, timesheets, maintenance, drivers, accounts, notifConfig, nonRentalCategories, usr.role, users);
    showToast(`Masuk sebagai: ${usr.name} (${getRoleMeta(usr.role).title})`);
  };

  // Activity Log Specific Handlers
  const handleClearActivityLogs = () => {
    clearStoredActivityLogs();
    setActivityLogs([]);
    showToast('Seluruh riwayat log aktivitas telah dibersihkan oleh Owner.', 'info');
  };

  const handleAddManualAuditLog = (logInput: Omit<ActivityLog, 'id' | 'timestamp'> & { timestamp?: string }) => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = logInput.timestamp || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const newLog: ActivityLog = {
      id: 'LOG-' + Date.now().toString().slice(-6),
      timestamp,
      ...logInput
    };

    const updated = [newLog, ...activityLogs];
    setActivityLogs(updated);
    saveStoredActivityLogs(updated);
    showToast('Catatan log audit operasional berhasil disimpan!');
  };

  // Manual Full Sync Trigger
  const handleManualSync = async () => {
    if (!gasConfig.webAppUrl) {
      setIsDeployModalOpen(true);
      return;
    }
    setIsSyncing(true);
    showToast('Memulai sinkronisasi seluruh modul ke Google Spreadsheet...', 'info');
    try {
      await syncToGoogleAppsScript(gasConfig.webAppUrl, 'syncAll', {
        vehicles,
        taxes,
        fuelLogs,
        finances,
        timesheets,
        maintenance,
        drivers,
        accounts,
        categories: nonRentalCategories
      });
      showToast('Sinkronisasi penuh Google Spreadsheet berhasil!');
    } catch {
      showToast('Gagal terhubung ke Apps Script. Periksa URL Web App.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // ==========================================
  // VIEW RENDER LOGIC: AUTH GUARD
  // ==========================================

  // 1. If not logged in -> Show Login Portal
  if (!authSession) {
    return (
      <LoginScreen
        users={users}
        onLoginSuccess={handleLoginSuccess}
        onShowNotification={showToast}
      />
    );
  }

  // 2. If screen locked -> Show Lock Screen
  if (isLocked) {
    return (
      <LockScreen
        session={authSession}
        currentUser={currentUser}
        onUnlock={handleUnlockScreen}
        onLogout={handleLogout}
      />
    );
  }

  // Check RBAC permission for current active tab
  const isCurrentTabAllowed = isTabPermitted(userRole, currentTab);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Toast Notification Container */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs sm:text-sm font-semibold ${
              notification.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200 shadow-rose-900/10'
                : notification.type === 'info'
                ? 'bg-blue-50 text-blue-800 border-blue-200 shadow-blue-900/10'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-900/10'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                notification.type === 'error'
                  ? 'bg-rose-500'
                  : notification.type === 'info'
                  ? 'bg-blue-500'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="leading-tight">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Global Application Header */}
      <Header
        onOpenDeployModal={() => setIsDeployModalOpen(true)}
        onOpenNotifConfig={() => setIsNotifConfigOpen(true)}
        isConnected={gasConfig.isConnected}
        isSyncing={isSyncing}
        onTriggerSync={handleManualSync}
        activeNotifCount={activeNotifications.length}
        onToggleSidebar={() => setIsMobileSidebarOpen(true)}
        userRole={userRole}
        onChangeUserRole={handleRoleChange}
        onOpenRoleMatrix={() => setIsRoleMatrixModalOpen(true)}
        authSession={authSession}
        currentUser={currentUser}
        onOpenProfile={() => setIsUserProfileModalOpen(true)}
        onLockScreen={handleLockScreen}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar & Mobile Drawer */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          userRole={userRole}
          onChangeUserRole={handleRoleChange}
          onOpenRoleMatrix={() => setIsRoleMatrixModalOpen(true)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          authSession={authSession}
          onLogout={handleLogout}
          onLockScreen={handleLockScreen}
          onOpenProfile={() => setIsUserProfileModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* RBAC Protected Fallback if Tab is forbidden for current role */}
            {!isCurrentTabAllowed ? (
              <div className="p-8 sm:p-12 bg-white rounded-3xl border border-slate-200 shadow-sm text-center max-w-2xl mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-800">Akses Modul Dibatasi</h3>
                  <p className="text-sm text-slate-500">
                    Peran akun Anda saat ini (<strong>{getRoleMeta(userRole).title}</strong>) tidak memiliki otorisasi untuk mengakses modul ini.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => setCurrentTab('dashboard')}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Dasbor Utama</span>
                  </button>
                  <button
                    onClick={() => setIsRoleMatrixModalOpen(true)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                  >
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span>Lihat Matriks Hak Akses</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {currentTab === 'dashboard' && (
                  <DashboardOverview
                    vehicles={vehicles}
                    taxes={taxes}
                    fuelLogs={fuelLogs}
                    finances={finances}
                    timesheets={timesheets}
                    maintenance={maintenance}
                    accounts={accounts}
                    notifConfig={notifConfig}
                    activityLogs={activityLogs}
                    onNavigateTab={setCurrentTab}
                    onSelectVehicleForDetail={setSelectedVehicleForDetail}
                    onOpenNotifConfig={() => setIsNotifConfigOpen(true)}
                  />
                )}

                {currentTab === 'vehicles' && (
                  <VehicleList
                    vehicles={vehicles}
                    userRole={userRole}
                    onOpenRoleMatrix={() => setIsRoleMatrixModalOpen(true)}
                    onAddVehicle={handleAddVehicle}
                    onUpdateVehicle={handleUpdateVehicle}
                    onDeleteVehicle={handleDeleteVehicle}
                    onSelectVehicleForDetail={setSelectedVehicleForDetail}
                  />
                )}

                {currentTab === 'tax' && (
                  <TaxManager
                    taxes={taxes}
                    vehicles={vehicles}
                    userRole={userRole}
                    onOpenRoleMatrix={() => setIsRoleMatrixModalOpen(true)}
                    onAddTax={handleAddTax}
                    onUpdateTax={handleUpdateTax}
                    onDeleteTax={handleDeleteTax}
                    onPayTax={handlePayTax}
                  />
                )}

                {currentTab === 'fuel' && (
                  <FuelLogManager
                    fuelLogs={fuelLogs}
                    vehicles={vehicles}
                    userRole={userRole}
                    onOpenRoleMatrix={() => setIsRoleMatrixModalOpen(true)}
                    onAddFuelLog={handleAddFuelLog}
                    onUpdateFuelLog={handleUpdateFuelLog}
                    onDeleteFuelLog={handleDeleteFuelLog}
                  />
                )}

                {currentTab === 'finance' && (
                  <FinanceManager
                    finances={finances}
                    vehicles={vehicles}
                    accounts={accounts}
                    nonRentalCategories={nonRentalCategories}
                    userRole={userRole}
                    onOpenRoleMatrix={() => setIsRoleMatrixModalOpen(true)}
                    onAddFinance={handleAddFinance}
                    onUpdateFinance={handleUpdateFinance}
                    onDeleteFinance={handleDeleteFinance}
                    onAddAccount={handleAddAccount}
                    onUpdateAccount={handleUpdateAccount}
                    onDeleteAccount={handleDeleteAccount}
                    onTransferBalance={handleTransferBalance}
                    onNavigateToMasterNonRental={() => setCurrentTab('master_non_rental')}
                  />
                )}

                {currentTab === 'master_non_rental' && (
                  <NonRentalIncomeManager
                    categories={nonRentalCategories}
                    accounts={accounts}
                    finances={finances}
                    userRole={userRole}
                    onAddCategory={handleAddNonRentalCategory}
                    onUpdateCategory={handleUpdateNonRentalCategory}
                    onDeleteCategory={handleDeleteNonRentalCategory}
                    onOpenAddFinanceModal={() => {
                      setCurrentTab('finance');
                    }}
                  />
                )}

                {currentTab === 'timesheet' && (
                  <TimesheetManager
                    timesheets={timesheets}
                    vehicles={vehicles}
                    userRole={userRole}
                    onOpenRoleMatrix={() => setIsRoleMatrixModalOpen(true)}
                    onAddTimesheet={handleAddTimesheet}
                    onUpdateTimesheet={handleUpdateTimesheet}
                    onDeleteTimesheet={handleDeleteTimesheet}
                  />
                )}

                {currentTab === 'maintenance' && (
                  <MaintenanceManager
                    maintenance={maintenance}
                    vehicles={vehicles}
                    userRole={userRole}
                    onOpenRoleMatrix={() => setIsRoleMatrixModalOpen(true)}
                    onAddMaintenance={handleAddMaintenance}
                    onUpdateMaintenance={handleUpdateMaintenance}
                    onDeleteMaintenance={handleDeleteMaintenance}
                  />
                )}

                {currentTab === 'drivers' && (
                  <DriverManager
                    drivers={drivers}
                    vehicles={vehicles}
                    userRole={userRole}
                    onOpenRoleMatrix={() => setIsRoleMatrixModalOpen(true)}
                    onAddDriver={handleAddDriver}
                    onUpdateDriver={handleUpdateDriver}
                    onDeleteDriver={handleDeleteDriver}
                  />
                )}

                {currentTab === 'reports' && (
                  <ReportsAnalytics
                    vehicles={vehicles}
                    taxes={taxes}
                    fuelLogs={fuelLogs}
                    finances={finances}
                    timesheets={timesheets}
                    maintenance={maintenance}
                  />
                )}

                {currentTab === 'users' && (
                  <UserManager
                    users={users}
                    currentUserRole={userRole}
                    currentUserId={currentUserId}
                    onAddUser={handleAddUserAccount}
                    onUpdateUser={handleUpdateUserAccount}
                    onDeleteUser={handleDeleteUserAccount}
                    onSwitchUser={handleSwitchUser}
                    onOpenRoleMatrix={() => setIsRoleMatrixModalOpen(true)}
                  />
                )}

                {currentTab === 'activity_log' && (
                  <ActivityLogManager
                    logs={activityLogs}
                    currentUserRole={userRole}
                    onClearLogs={handleClearActivityLogs}
                    onAddManualLog={handleAddManualAuditLog}
                    onOpenRoleMatrix={() => setIsRoleMatrixModalOpen(true)}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenMenu={() => setIsMobileSidebarOpen(true)}
        activeNotifCount={activeNotifications.length}
      />

      {/* User Profile & Security Modal */}
      {isUserProfileModalOpen && authSession && (
        <UserProfileModal
          session={authSession}
          userAccount={currentUser}
          onClose={() => setIsUserProfileModalOpen(false)}
          onUpdateAccount={handleUpdateUserAccount}
          onShowToast={showToast}
        />
      )}

      {/* Vehicle Comprehensive History Modal */}
      {selectedVehicleForDetail && (
        <VehicleDetailModal
          vehicle={selectedVehicleForDetail}
          taxes={taxes}
          fuelLogs={fuelLogs}
          finances={finances}
          timesheets={timesheets}
          maintenance={maintenance}
          onClose={() => setSelectedVehicleForDetail(null)}
        />
      )}

      {/* Google Apps Script Deploy Modal */}
      <AppsScriptDeployModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        config={gasConfig}
        onSaveConfig={(cfg) => {
          setGasConfig(cfg);
          saveGoogleSheetsConfig(cfg);
          showToast('Konfigurasi Google Apps Script tersimpan!');
        }}
        allAppData={{
          vehicles,
          taxes,
          fuelLogs,
          finances,
          timesheets,
          maintenance,
          drivers,
          accounts,
          categories: nonRentalCategories
        }}
      />

      {/* Notification Configuration Modal */}
      <NotificationConfigModal
        isOpen={isNotifConfigOpen}
        onClose={() => setIsNotifConfigOpen(false)}
        config={notifConfig}
        onSaveConfig={handleSaveNotificationConfig}
      />

      {/* Role Permissions & Matrix Modal */}
      <RolePermissionsModal
        isOpen={isRoleMatrixModalOpen}
        onClose={() => setIsRoleMatrixModalOpen(false)}
        currentRole={userRole}
        onSelectRole={handleRoleChange}
      />
    </div>
  );
}

export default App;
