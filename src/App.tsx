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
  PaymentMethod,
  ServiceTypeReference,
  SimClassReference,
  UserRole,
  UserAccount,
  ActivityLog,
  ActivityLogModule,
  ActivityActionType,
  AuthSession,
  CompanyDeposit,
  EquipmentCashFlow,
  DriverPocketCashFlow,
  TripSheet,
  EquipmentSupplier,
  ExpenseCategoryReference,
  AdminStaff,
  DepositTopUpRecord,
  CompanyDepositRequest,
  SparepartInventoryItem,
  SparepartStockMovement
} from './types';
import {
  loadStoredData,
  saveStoredData,
  AppStoredData,
  loadGoogleSheetsConfig,
  saveGoogleSheetsConfig,
  syncToGoogleAppsScript,
  fetchAppDataFromGAS,
  saveStoredUserRole,
  saveStoredNonRentalCategories,
  saveStoredPaymentMethods,
  saveStoredServiceTypes,
  saveStoredSimClasses,
  saveStoredUserAccounts,
  saveStoredActivityLogs,
  saveStoredCompanyDeposits,
  clearStoredActivityLogs,
  getStoredAuthSession,
  saveStoredAuthSession,
  getStoredIsLocked,
  saveStoredIsLocked,
  saveStoredEquipment,
  saveStoredPocketFlows,
  saveStoredTripSheets,
  saveStoredEquipmentSuppliers,
  saveStoredExpenseCategories,
  saveStoredAdminStaff,
  saveStoredDepositTopUpHistory,
  saveStoredDepositRequests,
  saveStoredSparepartInventory,
  saveStoredSparepartMovements,
  isRunningInGAS,
  stripDummyRecords
} from './utils/storage';
import { generateAppNotifications } from './utils/notificationEngine';
import { formatRupiah } from './utils/formatters';
import { isTabPermitted, getRoleMeta, normalizeAllowedModules, getDefaultModulesForRole } from './utils/permissions';

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
import { DriverPocketMoneyManager } from './components/Finance/DriverPocketMoneyManager';
import { EquipmentCashFlowManager } from './components/Finance/EquipmentCashFlowManager';
import { TimesheetManager } from './components/Timesheet/TimesheetManager';
import { TripSheetManager } from './components/TripSheet/TripSheetManager';
import { MaintenanceManager } from './components/Maintenance/MaintenanceManager';
import { SparepartInventoryManager } from './components/Inventory/SparepartInventoryManager';
import { DriverManager } from './components/Drivers/DriverManager';
import { ReportsAnalytics } from './components/Reports/ReportsAnalytics';
import { MasterDataHub } from './components/MasterData/MasterDataHub';
import { PaymentMethodManager } from './components/MasterData/PaymentMethodManager';
import { ServiceTypeManager } from './components/MasterData/ServiceTypeManager';
import { SimClassManager } from './components/MasterData/SimClassManager';
import { NonRentalIncomeManager } from './components/MasterData/NonRentalIncomeManager';
import { UserManager } from './components/Users/UserManager';
import { ActivityLogManager } from './components/Logs/ActivityLogManager';

// Modals
import { AppsScriptDeployModal } from './components/AppsScript/AppsScriptDeployModal';
import { NotificationConfigModal } from './components/Notifications/NotificationConfigModal';
import { NotificationCenterPanel } from './components/Notifications/NotificationCenterPanel';
import { RolePermissionsModal } from './components/Common/RolePermissionsModal';
import { CenterCrudDialogHub } from './components/Common/CenterCrudDialogHub';
import { showCenterCrudNotification } from './utils/dialogService';
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
  const [companyDeposits, setCompanyDeposits] = useState<CompanyDeposit[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentCashFlow[]>([]);
  const [pocketFlows, setPocketFlows] = useState<DriverPocketCashFlow[]>([]);
  const [tripSheets, setTripSheets] = useState<TripSheet[]>([]);
  const [nonRentalCategories, setNonRentalCategories] = useState<NonRentalIncomeCategory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeReference[]>([]);
  const [simClasses, setSimClasses] = useState<SimClassReference[]>([]);
  const [suppliers, setSuppliers] = useState<EquipmentSupplier[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategoryReference[]>([]);
  const [adminStaff, setAdminStaff] = useState<AdminStaff[]>([]);
  const [depositTopUps, setDepositTopUps] = useState<DepositTopUpRecord[]>([]);
  const [depositRequests, setDepositRequests] = useState<CompanyDepositRequest[]>([]);
  const [sparepartInventory, setSparepartInventory] = useState<SparepartInventoryItem[]>([]);
  const [sparepartMovements, setSparepartMovements] = useState<SparepartStockMovement[]>([]);
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
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Real-time synchronization worker (Google Spreadsheet as Primary Clean Database - Tanpa Data Dummy)
  const pullFromGas = async (silent = true) => {
    const cfg = loadGoogleSheetsConfig();
    const canSync = isRunningInGAS() || (cfg.webAppUrl && cfg.webAppUrl.startsWith('http'));
    if (!canSync) return;
    if (!silent) setIsSyncing(true);
    try {
      const res = await fetchAppDataFromGAS(cfg.webAppUrl);
      if (res.success && res.data) {
        const d = res.data;
        let hadDummyInCloud = false;
        const cleanCloudArray = <T,>(arr: unknown): T[] => {
          if (!Array.isArray(arr)) return [];
          const stripped = stripDummyRecords<T>(arr as T[]);
          if (stripped.length !== arr.length) {
            hadDummyInCloud = true;
          }
          return stripped;
        };

        if (Array.isArray(d.vehicles)) {
          const cleanVehicles = cleanCloudArray<Vehicle>(d.vehicles).map((v: any) => ({
            ...v,
            nopol: v.nopol || v.plateNumber || '-',
            brand: v.brand || '-',
            type: v.type || v.model || 'Truck',
            year: Number(v.year) || new Date().getFullYear(),
            currentOdometer: Number(v.currentOdometer ?? v.lastOdometer ?? 0),
            assignedDriver: v.assignedDriver || v.driverName || '-',
            status: v.status || 'active',
            capacityTon: Number(v.capacityTon) || 10
          }));
          setVehicles(cleanVehicles);
          saveStoredData({ vehicles: cleanVehicles });
        }
        if (Array.isArray(d.taxes)) {
          const cleanTaxes = cleanCloudArray<TaxRecord>(d.taxes);
          setTaxes(cleanTaxes);
          saveStoredData({ taxes: cleanTaxes });
        }
        if (Array.isArray(d.fuelLogs)) {
          const cleanFuel = cleanCloudArray<FuelLog>(d.fuelLogs);
          setFuelLogs(cleanFuel);
          saveStoredData({ fuelLogs: cleanFuel });
        }
        if (Array.isArray(d.finances)) {
          const cleanFinances = cleanCloudArray<OperationalFinance>(d.finances);
          setFinances(cleanFinances);
          saveStoredData({ finances: cleanFinances });
        }
        if (Array.isArray(d.accounts)) {
          const cleanAccounts = cleanCloudArray<FinancialAccount>(d.accounts);
          setAccounts(cleanAccounts);
          saveStoredData({ accounts: cleanAccounts });
        }
        if (Array.isArray((d as any).companyDeposits)) {
          const cleanDeposits = cleanCloudArray<CompanyDeposit>((d as any).companyDeposits);
          setCompanyDeposits(cleanDeposits);
          saveStoredData({ companyDeposits: cleanDeposits });
        }
        if (Array.isArray(d.timesheets)) {
          const cleanTimesheets = cleanCloudArray<DriverTimesheet>(d.timesheets);
          setTimesheets(cleanTimesheets);
          saveStoredData({ timesheets: cleanTimesheets });
        }
        if (Array.isArray(d.maintenance)) {
          const cleanMaintenance = cleanCloudArray<MaintenanceRecord>(d.maintenance);
          setMaintenance(cleanMaintenance);
          saveStoredData({ maintenance: cleanMaintenance });
        }
        if (Array.isArray(d.drivers)) {
          const cleanDrivers = cleanCloudArray<Driver>(d.drivers).map((dr: any) => ({
            ...dr,
            name: dr.name || dr.fullName || '-',
            phone: dr.phone || '-',
            simClass: dr.simClass || dr.licenseType || 'B1',
            simExpiry: dr.simExpiry || dr.licenseExpiry || '-',
            assignedVehicle: dr.assignedVehicle || dr.assignedPlateNumber || '-',
            status: dr.status || 'active'
          }));
          setDrivers(cleanDrivers);
          saveStoredData({ drivers: cleanDrivers });
        }
        if (Array.isArray((d as any).pocketFlows)) {
          const cleanPocket = cleanCloudArray<DriverPocketCashFlow>((d as any).pocketFlows);
          setPocketFlows(cleanPocket);
          saveStoredData({ pocketFlows: cleanPocket });
        }
        const eqList = (d as any).equipmentFlows || (d as any).equipmentList;
        if (Array.isArray(eqList)) {
          const cleanEq = cleanCloudArray<EquipmentCashFlow>(eqList);
          setEquipmentList(cleanEq);
          saveStoredData({ equipment: cleanEq });
        }
        if (Array.isArray((d as any).tripSheets)) {
          const cleanTrips = cleanCloudArray<TripSheet>((d as any).tripSheets);
          setTripSheets(cleanTrips);
          saveStoredData({ tripSheets: cleanTrips });
        }
        if (Array.isArray((d as any).sparepartInventory)) {
          const cleanParts = cleanCloudArray<SparepartInventoryItem>((d as any).sparepartInventory);
          setSparepartInventory(cleanParts);
          saveStoredData({ sparepartInventory: cleanParts });
        }
        if (Array.isArray((d as any).sparepartMovements)) {
          const cleanMovs = cleanCloudArray<SparepartStockMovement>((d as any).sparepartMovements);
          setSparepartMovements(cleanMovs);
          saveStoredData({ sparepartMovements: cleanMovs });
        }

        // Jika di Google Spreadsheet masih tersisa baris data dummy lama, hapus otomatis dari Spreadsheet
        if (hadDummyInCloud) {
          await syncToGoogleAppsScript(cfg.webAppUrl, 'purgeDummyData', {});
        }

        if (!silent) showToast('Data disinkronkan real-time dari database utama Google Sheets!');
      }
    } catch {
      if (!silent) showToast('Koneksi sinkronisasi gagal.', 'error');
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  const asArray = <T,>(val: unknown): T[] => (Array.isArray(val) ? (val as T[]) : []);

  // Initialize Data from Local Storage
  useEffect(() => {
    const initial = loadStoredData();
    setVehicles(asArray(initial.vehicles));
    setTaxes(asArray(initial.taxes));
    setFuelLogs(asArray(initial.fuelLogs));
    setFinances(asArray(initial.finances));
    setTimesheets(asArray(initial.timesheets));
    setMaintenance(asArray(initial.maintenance));
    setDrivers(asArray(initial.drivers));
    setAccounts(asArray(initial.accounts));
    setCompanyDeposits(asArray(initial.companyDeposits));
    setEquipmentList(asArray(initial.equipment));
    setPocketFlows(asArray(initial.pocketFlows));
    setTripSheets(asArray(initial.tripSheets));
    setNonRentalCategories(asArray(initial.nonRentalCategories));
    setPaymentMethods(asArray(initial.paymentMethods));
    setServiceTypes(asArray(initial.serviceTypes));
    setSimClasses(asArray(initial.simClasses));
    setSuppliers(asArray(initial.suppliers));
    setExpenseCategories(asArray(initial.expenseCategories));
    setAdminStaff(asArray(initial.adminStaff));
    setDepositTopUps(asArray(initial.depositTopUps));
    setDepositRequests(asArray(initial.depositRequests));
    setSparepartInventory(asArray(initial.sparepartInventory));
    setSparepartMovements(asArray(initial.sparepartMovements));
    setUserRole(initial.userRole || 'owner');
    setUsers(asArray(initial.users));
    setActivityLogs(asArray(initial.activityLogs));
    if (Array.isArray(initial.users) && initial.users.length > 0) {
      const activeUser = initial.users.find(u => u.role === initial.userRole) || initial.users[0];
      setCurrentUserId(activeUser.id);
    }
    if (initial.notifConfig && typeof initial.notifConfig === 'object' && !Array.isArray(initial.notifConfig)) {
      setNotifConfig(initial.notifConfig);
    }

    const cfg = loadGoogleSheetsConfig();
    setGasConfig(cfg);

    // Initial pull from GAS if configured or running natively inside GAS
    if (isRunningInGAS() || (cfg.webAppUrl && cfg.webAppUrl.startsWith('http'))) {
      pullFromGas(true);
    }

    // Initialize Auth Session & Lock Screen from Storage
    const savedSession = getStoredAuthSession();
    if (savedSession) {
      const storedUsers = asArray<UserAccount>(initial.users);
      const matchedUser =
        storedUsers.find((u) => u.id === savedSession.userId) ||
        storedUsers.find((u) => u.role === savedSession.userRole);
      const syncedSession: AuthSession = {
        ...savedSession,
        allowedTabs: matchedUser
          ? normalizeAllowedModules(matchedUser.allowedTabs, matchedUser.role)
          : normalizeAllowedModules(savedSession.allowedTabs, savedSession.userRole)
      };
      setAuthSession(syncedSession);
      saveStoredAuthSession(syncedSession);
      setUserRole(syncedSession.userRole);
      setCurrentUserId(matchedUser ? matchedUser.id : syncedSession.userId);
    }
    const savedLock = getStoredIsLocked();
    setIsLocked(savedLock);
  }, []);

  // Multi-Device & Multi-Tab Real-time Synchronization Listeners (HP & PC)
  useEffect(() => {
    // 1. Cross-Tab Real-time Broadcast listener
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('fleetops_realtime_sync');
        channel.onmessage = (event) => {
          if (event.data?.type === 'DATA_UPDATED') {
            const fresh = loadStoredData();
            setVehicles(asArray(fresh.vehicles));
            setTaxes(asArray(fresh.taxes));
            setFuelLogs(asArray(fresh.fuelLogs));
            setFinances(asArray(fresh.finances));
            setTimesheets(asArray(fresh.timesheets));
            setMaintenance(asArray(fresh.maintenance));
            setDrivers(asArray(fresh.drivers));
            setAccounts(asArray(fresh.accounts));
            setCompanyDeposits(asArray(fresh.companyDeposits));
            setEquipmentList(asArray(fresh.equipment));
            setPocketFlows(asArray(fresh.pocketFlows));
            setTripSheets(asArray(fresh.tripSheets));
            setNonRentalCategories(asArray(fresh.nonRentalCategories));
            setPaymentMethods(asArray(fresh.paymentMethods));
            setServiceTypes(asArray(fresh.serviceTypes));
            setSimClasses(asArray(fresh.simClasses));
            setSuppliers(asArray(fresh.suppliers));
            setExpenseCategories(asArray(fresh.expenseCategories));
            setAdminStaff(asArray(fresh.adminStaff));
            setDepositTopUps(asArray(fresh.depositTopUps));
            setDepositRequests(asArray(fresh.depositRequests));
            setSparepartInventory(asArray(fresh.sparepartInventory));
            setSparepartMovements(asArray(fresh.sparepartMovements));
            setUsers(asArray(fresh.users));
            setActivityLogs(asArray(fresh.activityLogs));
          }
        };
      }
    } catch {
      // BroadcastChannel fallback
    }

    // 2. Window Visibility Change Listener (Lightweight cloud sync only when connected)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && gasConfig.webAppUrl && gasConfig.isConnected) {
        pullFromGas(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 3. Background Real-time Polling Interval (Only when connected, every 45s to save battery & bandwidth)
    const pollInterval =
      gasConfig.webAppUrl && gasConfig.isConnected
        ? setInterval(() => {
            pullFromGas(true);
          }, 45000)
        : null;

    return () => {
      if (channel) channel.close();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [gasConfig.webAppUrl, gasConfig.isConnected]);

  // Delta-optimized persistence: only serialize modified keys to localStorage (Anti-Lemot & Hemat Memori)
  const persistAll = (overrides: Partial<AppStoredData> = {}) => {
    const keys = Object.keys(overrides);
    if (keys.length > 0) {
      saveStoredData(overrides);
    } else {
      const safeArr = <T,>(val: unknown, fallback: T[]): T[] =>
        Array.isArray(val) ? (val as T[]) : Array.isArray(fallback) ? fallback : [];

      saveStoredData({
        vehicles: safeArr(overrides.vehicles, vehicles),
        taxes: safeArr(overrides.taxes, taxes),
        fuelLogs: safeArr(overrides.fuelLogs, fuelLogs),
        finances: safeArr(overrides.finances, finances),
        timesheets: safeArr(overrides.timesheets, timesheets),
        maintenance: safeArr(overrides.maintenance, maintenance),
        drivers: safeArr(overrides.drivers, drivers),
        accounts: safeArr(overrides.accounts, accounts),
        companyDeposits: safeArr(overrides.companyDeposits, companyDeposits),
        equipment: safeArr(overrides.equipment, equipmentList),
        pocketFlows: safeArr(overrides.pocketFlows, pocketFlows),
        tripSheets: safeArr(overrides.tripSheets, tripSheets),
        suppliers: safeArr(overrides.suppliers, suppliers),
        expenseCategories: safeArr(overrides.expenseCategories, expenseCategories),
        adminStaff: safeArr(overrides.adminStaff, adminStaff),
        depositTopUps: safeArr(overrides.depositTopUps, depositTopUps),
        depositRequests: safeArr(overrides.depositRequests, depositRequests),
        sparepartInventory: safeArr(overrides.sparepartInventory, sparepartInventory),
        sparepartMovements: safeArr(overrides.sparepartMovements, sparepartMovements),
        notifConfig: overrides.notifConfig ?? notifConfig,
        nonRentalCategories: safeArr(overrides.nonRentalCategories, nonRentalCategories),
        paymentMethods: safeArr(overrides.paymentMethods, paymentMethods),
        serviceTypes: safeArr(overrides.serviceTypes, serviceTypes),
        simClasses: safeArr(overrides.simClasses, simClasses),
        userRole: overrides.userRole ?? userRole,
        users: safeArr(overrides.users, users),
        activityLogs: safeArr(overrides.activityLogs, activityLogs)
      });
    }

    // Notify other open tabs/windows on the device
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('fleetops_realtime_sync');
        bc.postMessage({ type: 'DATA_UPDATED', timestamp: Date.now() });
        bc.close();
      }
    } catch {
      // ignore
    }
  };

  // Centered CRUD Notification Helper (Appears in the center of the app for Create/Update/Delete/Sync)
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification(null);
    showCenterCrudNotification(message, type);
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

    // If active tab is not permitted for the user's role/modules, auto-route to dashboard
    if (!isTabPermitted(session.userRole, currentTab, session.allowedTabs)) {
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
    if (newRole !== 'owner') {
      setIsDeployModalOpen(false);
    }
    const matchingUser =
      users.find(u => u.role === newRole && u.status === 'active') ||
      users.find(u => u.role === newRole);
    if (matchingUser) {
      setCurrentUserId(matchingUser.id);
    }

    const nextAllowedTabs = matchingUser
      ? normalizeAllowedModules(matchingUser.allowedTabs, newRole, true)
      : getDefaultModulesForRole(newRole);

    if (authSession) {
      const updatedSession: AuthSession = {
        ...authSession,
        userRole: newRole,
        userId: matchingUser ? matchingUser.id : authSession.userId,
        userName: matchingUser ? matchingUser.name : authSession.userName,
        username: matchingUser ? matchingUser.username : authSession.username,
        email: matchingUser ? matchingUser.email : authSession.email,
        department: matchingUser ? matchingUser.department : authSession.department,
        allowedTabs: nextAllowedTabs
      };
      setAuthSession(updatedSession);
      saveStoredAuthSession(updatedSession);
    }

    if (!isTabPermitted(newRole, currentTab, nextAllowedTabs)) {
      setCurrentTab(nextAllowedTabs[0] || 'dashboard');
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
    persistAll({ userRole: newRole });
    showToast(`Peran aktif beralih ke: ${getRoleMeta(newRole).title}`, 'info');
  };

  // Push to Google Sheets if configured or running inside GAS
  const pushToGas = async (action: string, data: unknown) => {
    const targetUrl = gasConfig.webAppUrl ? gasConfig.webAppUrl.trim() : '';
    if (!isRunningInGAS() && (!targetUrl || !targetUrl.startsWith('http'))) return;
    try {
      await syncToGoogleAppsScript(targetUrl, action, data);
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
    persistAll({ vehicles: updated });
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
    persistAll({ vehicles: updated });
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
    persistAll({ vehicles: updated });
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
    persistAll({ taxes: updated });
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
    persistAll({ taxes: updated });
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
    persistAll({ taxes: updated });
    pushToGas('deleteTax', { id });
    showToast('Catatan pajak dihapus', 'info');
  };

  const handlePayTax = (
    tax: TaxRecord,
    paymentDate: string,
    amount: number,
    nextDueDate: string,
    accountId?: string,
    receiptProofUrl?: string
  ) => {
    const taxId = tax.id;
    const paidAmount = amount || tax.amount || 0;
    const proof = receiptProofUrl || tax.receiptProofUrl;
    const updatedTaxes = taxes.map(t =>
      t.id === taxId
        ? {
            ...t,
            status: 'paid' as const,
            dueDate: nextDueDate || t.dueDate,
            lastPaymentDate: paymentDate,
            amount: paidAmount,
            receiptProofUrl: proof
          }
        : t
    );
    setTaxes(updatedTaxes);

    let updatedAccounts = accounts;
    let selectedAccountName = 'Kas Utama Pool';
    const targetAccountId = accountId || accounts[0]?.id;
    if (targetAccountId) {
      updatedAccounts = accounts.map(a => {
        if (a.id === targetAccountId) {
          selectedAccountName = a.accountName;
          return { ...a, currentBalance: a.currentBalance - paidAmount };
        }
        return a;
      });
      setAccounts(updatedAccounts);
    }

    const newFinance: OperationalFinance = {
      id: 'FIN-' + Date.now().toString().slice(-4),
      date: paymentDate,
      vehicleId: tax.vehicleId || '',
      nopol: tax.nopol || '',
      driverName: 'Admin Pajak',
      category: tax.documentType.includes('KIR') ? 'Uji KIR Dishub' : 'Pajak STNK Tahunan',
      type: 'expense',
      amount: paidAmount,
      description: `Pembayaran ${tax.documentType || 'Pajak'} ${tax.nopol}`,
      paymentMethod: targetAccountId ? 'Transfer' : 'Cash',
      status: 'approved',
      accountId: targetAccountId || undefined,
      accountName: selectedAccountName,
      receiptProofUrl: proof
    };
    const updatedFinances = [newFinance, ...finances];
    setFinances(updatedFinances);

    createActivityLog(
      'tax',
      'status_change',
      'Pelunasan Pajak / KIR',
      `Pembayaran ${tax.documentType || 'Pajak'} unit ${tax.nopol} lunas sebesar ${formatRupiah(paidAmount)} melalui ${selectedAccountName}.`,
      taxId,
      tax.nopol,
      { amount: paidAmount, account: selectedAccountName, paymentDate },
      'success'
    );

    persistAll({ taxes: updatedTaxes, finances: updatedFinances, accounts: updatedAccounts });
    pushToGas('payTax', { taxId, paymentDate, amount: paidAmount, newFinance });
    showToast(`Pajak ${tax.nopol} berhasil dibayarkan dan dicatat ke arus kas!`);
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
      receiptNumber: f.receiptNumber,
      receiptProofUrl: f.receiptProofUrl,
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

    persistAll({ vehicles: updatedVehicles, fuelLogs: updatedFuel, finances: updatedFinances, accounts: updatedAccounts });
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
    persistAll({ fuelLogs: updated });
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
    persistAll({ fuelLogs: updated });
    pushToGas('deleteFuelLog', { id });
    showToast('Log BBM dihapus', 'info');
  };

  // --- Handlers: Finance ---
  const handleAddFinance = (fin: OperationalFinance) => {
    const safeAccounts = asArray<FinancialAccount>(accounts);
    const safeDeposits = asArray<CompanyDeposit>(companyDeposits);
    const updatedFinances = [fin, ...finances];
    setFinances(updatedFinances);

    let updatedAccounts = safeAccounts;
    if (fin.accountId) {
      updatedAccounts = safeAccounts.map(a => {
        if (a.id === fin.accountId) {
          const delta = fin.type === 'income' ? fin.amount : -fin.amount;
          return { ...a, currentBalance: a.currentBalance + delta };
        }
        return a;
      });
      setAccounts(updatedAccounts);
    }

    // Auto-deduct or credit Corporate Deposit balance if assigned to a company or company account
    let updatedDeposits = safeDeposits;
    const matchedAccount = safeAccounts.find(a => a.id === fin.accountId);
    const targetCompId = fin.companyId || matchedAccount?.companyId;
    const targetCompName = fin.companyName || matchedAccount?.companyName;

    if (targetCompId || targetCompName) {
      updatedDeposits = safeDeposits.map(c => {
        if ((targetCompId && c.id === targetCompId) || (targetCompName && c.companyName.toLowerCase() === targetCompName.toLowerCase())) {
          if (fin.type === 'expense') {
            return {
              ...c,
              currentBalance: c.currentBalance - fin.amount,
              totalUsed: (c.totalUsed || 0) + fin.amount
            };
          } else if (fin.type === 'income') {
            return {
              ...c,
              currentBalance: c.currentBalance + fin.amount,
              totalTopUp: (c.totalTopUp || 0) + fin.amount
            };
          }
        }
        return c;
      });
      setCompanyDeposits(updatedDeposits);
      saveStoredCompanyDeposits(updatedDeposits);
    }

    createActivityLog(
      'finance',
      'create',
      fin.type === 'income' ? 'Pemasukan Kas Baru' : 'Pengeluaran Kas Baru',
      `Pencatatan ${fin.type === 'income' ? 'pemasukan' : 'pengeluaran'} [${fin.category}] sebesar ${formatRupiah(fin.amount)} (${fin.description})${fin.companyName ? ` - Beban Deposit: ${fin.companyName}` : ''}${fin.receiptProofUrl ? ' (Bukti Nota Terlampir)' : ''}.`,
      fin.id,
      fin.nopol || fin.category,
      { type: fin.type, amount: fin.amount, category: fin.category, account: fin.accountName, company: fin.companyName, hasReceipt: Boolean(fin.receiptProofUrl) },
      fin.type === 'income' ? 'success' : 'warning'
    );

    persistAll({ finances: updatedFinances, accounts: updatedAccounts, companyDeposits: updatedDeposits });
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
    persistAll({ finances: updated });
    pushToGas('updateFinance', fin);
    showToast('Data keuangan berhasil diperbarui!');
  };

  const handleDeleteFinance = (id: string) => {
    const safeAccounts = asArray<FinancialAccount>(accounts);
    const safeDeposits = asArray<CompanyDeposit>(companyDeposits);
    const target = finances.find(f => f.id === id);
    const updated = finances.filter(f => f.id !== id);
    setFinances(updated);

    // Revert account balance
    let updatedAccounts = safeAccounts;
    if (target?.accountId && target.amount > 0) {
      updatedAccounts = safeAccounts.map(a => {
        if (a.id === target.accountId) {
          const delta = target.type === 'income' ? -target.amount : target.amount;
          return { ...a, currentBalance: a.currentBalance + delta };
        }
        return a;
      });
      setAccounts(updatedAccounts);
    }

    // Refund corporate deposit if expense or income is removed
    let updatedDeposits = safeDeposits;
    const matchedAccount = safeAccounts.find(a => a.id === target?.accountId);
    const targetCompId = target?.companyId || matchedAccount?.companyId;
    const targetCompName = target?.companyName || matchedAccount?.companyName;

    if (targetCompId || targetCompName) {
      updatedDeposits = safeDeposits.map(c => {
        if ((targetCompId && c.id === targetCompId) || (targetCompName && c.companyName.toLowerCase() === targetCompName.toLowerCase())) {
          if (target?.type === 'expense') {
            return {
              ...c,
              currentBalance: c.currentBalance + target.amount,
              totalUsed: Math.max(0, (c.totalUsed || 0) - target.amount)
            };
          } else if (target?.type === 'income') {
            return {
              ...c,
              currentBalance: c.currentBalance - target.amount,
              totalTopUp: Math.max(0, (c.totalTopUp || 0) - target.amount)
            };
          }
        }
        return c;
      });
      setCompanyDeposits(updatedDeposits);
      saveStoredCompanyDeposits(updatedDeposits);
    }

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
    persistAll({ finances: updated, accounts: updatedAccounts, companyDeposits: updatedDeposits });
    pushToGas('deleteFinance', { id });
    showToast('Transaksi keuangan dihapus', 'info');
  };

  // --- Handlers: Corporate Client Deposits ---
  const handleAddCompanyDeposit = (dep: CompanyDeposit) => {
    const safeDeposits = asArray<CompanyDeposit>(companyDeposits);
    const updated = [dep, ...safeDeposits];
    setCompanyDeposits(updated);
    createActivityLog(
      'finance',
      'create',
      'Tambah Rekanan Deposit Baru',
      `Pendaftaran rekanan klien deposit baru: ${dep.companyName} (${dep.companyCode}) dengan saldo awal ${formatRupiah(dep.initialDeposit)}.`,
      dep.id,
      dep.companyName,
      { initialDeposit: dep.initialDeposit, pic: dep.picName },
      'success'
    );
    persistAll({ companyDeposits: updated });
    pushToGas('addCompanyDeposit', dep);
    showToast(`Perusahaan rekanan ${dep.companyName} berhasil didaftarkan!`);
  };

  const handleUpdateCompanyDeposit = (dep: CompanyDeposit) => {
    const safeDeposits = asArray<CompanyDeposit>(companyDeposits);
    const updated = safeDeposits.map(c => (c.id === dep.id ? dep : c));
    setCompanyDeposits(updated);
    createActivityLog(
      'finance',
      'update',
      'Ubah Profil Rekanan Deposit',
      `Pembaruan data profil rekanan deposit: ${dep.companyName}.`,
      dep.id,
      dep.companyName,
      undefined,
      'primary'
    );
    persistAll({ companyDeposits: updated });
    pushToGas('updateCompanyDeposit', dep);
    showToast(`Data rekanan ${dep.companyName} berhasil diperbarui!`);
  };

  const handleDeleteCompanyDeposit = (id: string) => {
    const safeDeposits = asArray<CompanyDeposit>(companyDeposits);
    const target = safeDeposits.find(c => c.id === id);
    const updated = safeDeposits.filter(c => c.id !== id);
    setCompanyDeposits(updated);
    createActivityLog(
      'finance',
      'delete',
      'Hapus Rekanan Deposit',
      `Penghapusan akun rekanan deposit: ${target?.companyName || id}.`,
      id,
      target?.companyName || id,
      undefined,
      'danger'
    );
    persistAll({ companyDeposits: updated });
    pushToGas('deleteCompanyDeposit', { id });
    showToast('Rekanan deposit dihapus', 'info');
  };

  const handleTopUpCompanyDeposit = (
    companyId: string,
    amount: number,
    paymentMethod: string,
    accountId: string,
    notes: string,
    receiptProofUrl?: string
  ) => {
    const safeDeposits = asArray<CompanyDeposit>(companyDeposits);
    const safeAccounts = asArray<FinancialAccount>(accounts);
    const targetComp = safeDeposits.find(c => c.id === companyId);
    const updatedDeposits = safeDeposits.map(c => {
      if (c.id === companyId) {
        return {
          ...c,
          currentBalance: c.currentBalance + amount,
          totalTopUp: c.totalTopUp + amount,
          lastTopUpDate: new Date().toISOString().slice(0, 10)
        };
      }
      return c;
    });
    setCompanyDeposits(updatedDeposits);

    let selectedAccName = 'Kasir Utama Pool';
    const updatedAccounts = safeAccounts.map(a => {
      if (a.id === accountId) {
        selectedAccName = a.accountName;
        return { ...a, currentBalance: a.currentBalance + amount };
      }
      return a;
    });
    setAccounts(updatedAccounts);

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    // Auto-create top-up income transaction
    const topUpTx: OperationalFinance = {
      id: 'TOPUP-' + Date.now().toString().slice(-4),
      date: new Date().toISOString().slice(0, 10),
      vehicleId: 'POOL-GENERAL',
      nopol: 'KAS OPERASIONAL POOL',
      driverName: targetComp?.picName || 'PIC Rekanan',
      category: 'Top-Up Saldo Deposit Rekanan',
      type: 'income',
      incomeSourceType: 'deposit_topup',
      companyId,
      companyName: targetComp?.companyName,
      customerOrPayer: targetComp?.companyName,
      amount,
      tripCode: 'DEP-' + Date.now().toString().slice(-6),
      description: notes || `Top-up dana cadangan deposit operasional ${targetComp?.companyName}`,
      paymentMethod,
      status: 'approved',
      receiptNumber: 'SETOR-' + Date.now().toString().slice(-5),
      accountId,
      accountName: selectedAccName,
      receiptProofUrl,
      isReceiptVerified: true,
      receiptVerifiedBy: `Auditor (${userRole.toUpperCase()})`,
      receiptVerifiedAt: timestamp
    };
    const updatedFinances = [topUpTx, ...finances];
    setFinances(updatedFinances);

    createActivityLog(
      'finance',
      'create',
      'Top-Up Deposit Perusahaan',
      `Penerimaan dana top-up deposit ${targetComp?.companyName} sebesar ${formatRupiah(amount)} via ${paymentMethod} masuk ke ${selectedAccName}.`,
      topUpTx.id,
      targetComp?.companyName || 'Deposit Rekanan',
      { amount, company: targetComp?.companyName, account: selectedAccName },
      'success'
    );

    persistAll({ finances: updatedFinances, accounts: updatedAccounts, companyDeposits: updatedDeposits });
    pushToGas('topUpCompanyDeposit', { companyId, amount, paymentMethod, accountId, notes, topUpTx });
    showToast(`Top-Up ${formatRupiah(amount)} untuk ${targetComp?.companyName} berhasil diproses!`);
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
    persistAll({ accounts: updatedAcc });
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
    persistAll({ accounts: updatedAcc });
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
    persistAll({ accounts: updatedAcc });
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

    persistAll({ finances: updatedFin, accounts: updatedAcc });
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
    persistAll({ nonRentalCategories: updated });
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
    persistAll({ nonRentalCategories: updated });
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
    persistAll({ nonRentalCategories: updated });
    showToast('Kategori pemasukan non-sewa berhasil dihapus.', 'info');
  };

  // --- Handlers: Payment Methods (Master Data) ---
  const handleAddPaymentMethod = (pm: PaymentMethod) => {
    const updated = [pm, ...paymentMethods];
    setPaymentMethods(updated);
    saveStoredPaymentMethods(updated);
    createActivityLog(
      'master_data',
      'create',
      'Tambah Master Metode Pembayaran',
      `Penambahan master metode pembayaran [${pm.code}] ${pm.name} (${pm.category.toUpperCase()}).`,
      pm.id,
      pm.name,
      { code: pm.code, category: pm.category, defaultAccount: pm.defaultAccountName },
      'success'
    );
    persistAll({ paymentMethods: updated });
    showToast(`Metode pembayaran "${pm.name}" berhasil ditambahkan!`);
  };

  const handleUpdatePaymentMethod = (pm: PaymentMethod) => {
    const updated = paymentMethods.map(m => (m.id === pm.id ? pm : m));
    setPaymentMethods(updated);
    saveStoredPaymentMethods(updated);
    createActivityLog(
      'master_data',
      'update',
      'Ubah Master Metode Pembayaran',
      `Pembaruan master metode pembayaran [${pm.code}] ${pm.name} (Status: ${pm.isActive ? 'Aktif' : 'Non-Aktif'}).`,
      pm.id,
      pm.name,
      undefined,
      'primary'
    );
    persistAll({ paymentMethods: updated });
    showToast(`Metode pembayaran "${pm.name}" berhasil diperbarui!`);
  };

  const handleDeletePaymentMethod = (id: string) => {
    const target = paymentMethods.find(m => m.id === id);
    const updated = paymentMethods.filter(m => m.id !== id);
    setPaymentMethods(updated);
    saveStoredPaymentMethods(updated);
    createActivityLog(
      'master_data',
      'delete',
      'Hapus Master Metode Pembayaran',
      `Penghapusan master metode pembayaran ${target?.name || id}.`,
      id,
      target?.name || id,
      undefined,
      'danger'
    );
    persistAll({ paymentMethods: updated });
    showToast('Master metode pembayaran berhasil dihapus.', 'info');
  };

  // --- Handlers: Service & Maintenance Types (Master Data) ---
  const handleAddServiceType = (st: ServiceTypeReference) => {
    const updated = [st, ...serviceTypes];
    setServiceTypes(updated);
    saveStoredServiceTypes(updated);
    createActivityLog(
      'master_data',
      'create',
      'Tambah Master Jenis Servis',
      `Penambahan master referensi jenis servis [${st.code}] ${st.name} (Interval: ${st.defaultIntervalKm} KM / ${st.defaultIntervalDays} Hari).`,
      st.id,
      st.name,
      { code: st.code, category: st.category, defaultIntervalKm: st.defaultIntervalKm, estimatedCost: st.estimatedCost },
      'success'
    );
    persistAll({ serviceTypes: updated });
    pushToGas('addServiceType', st);
    showToast(`Master servis "${st.name}" berhasil ditambahkan!`);
  };

  const handleUpdateServiceType = (st: ServiceTypeReference) => {
    const updated = serviceTypes.map(s => (s.id === st.id ? st : s));
    setServiceTypes(updated);
    saveStoredServiceTypes(updated);
    createActivityLog(
      'master_data',
      'update',
      'Ubah Master Jenis Servis',
      `Pembaruan master referensi servis [${st.code}] ${st.name}.`,
      st.id,
      st.name,
      undefined,
      'primary'
    );
    persistAll({ serviceTypes: updated });
    pushToGas('updateServiceType', st);
    showToast(`Master servis "${st.name}" berhasil diperbarui!`);
  };

  const handleDeleteServiceType = (id: string) => {
    const target = serviceTypes.find(s => s.id === id);
    const updated = serviceTypes.filter(s => s.id !== id);
    setServiceTypes(updated);
    saveStoredServiceTypes(updated);
    createActivityLog(
      'master_data',
      'delete',
      'Hapus Master Jenis Servis',
      `Penghapusan master referensi jenis servis ${target?.name || id}.`,
      id,
      target?.name || id,
      undefined,
      'danger'
    );
    persistAll({ serviceTypes: updated });
    pushToGas('deleteServiceType', { id });
    showToast('Master jenis servis berhasil dihapus.', 'info');
  };

  // --- Handlers: Driver License SIM Classes (Master Data) ---
  const handleAddSimClass = (sc: SimClassReference) => {
    const updated = [sc, ...simClasses];
    setSimClasses(updated);
    saveStoredSimClasses(updated);
    createActivityLog(
      'master_data',
      'create',
      'Tambah Master Golongan SIM',
      `Penambahan master golongan SIM [${sc.code}] ${sc.name} (${sc.vehicleClassification}).`,
      sc.id,
      sc.name,
      { code: sc.code, minAge: sc.minAge, vehicleClassification: sc.vehicleClassification, validityYears: sc.validityYears },
      'success'
    );
    persistAll({ simClasses: updated });
    pushToGas('addSimClass', sc);
    showToast(`Golongan SIM "${sc.name}" berhasil ditambahkan!`);
  };

  const handleUpdateSimClass = (sc: SimClassReference) => {
    const updated = simClasses.map(s => (s.id === sc.id ? sc : s));
    setSimClasses(updated);
    saveStoredSimClasses(updated);
    createActivityLog(
      'master_data',
      'update',
      'Ubah Master Golongan SIM',
      `Pembaruan master golongan SIM [${sc.code}] ${sc.name}.`,
      sc.id,
      sc.name,
      undefined,
      'primary'
    );
    persistAll({ simClasses: updated });
    pushToGas('updateSimClass', sc);
    showToast(`Golongan SIM "${sc.name}" berhasil diperbarui!`);
  };

  const handleDeleteSimClass = (id: string) => {
    const target = simClasses.find(s => s.id === id);
    const updated = simClasses.filter(s => s.id !== id);
    setSimClasses(updated);
    saveStoredSimClasses(updated);
    createActivityLog(
      'master_data',
      'delete',
      'Hapus Master Golongan SIM',
      `Penghapusan master golongan SIM ${target?.name || id}.`,
      id,
      target?.name || id,
      undefined,
      'danger'
    );
    persistAll({ simClasses: updated });
    pushToGas('deleteSimClass', { id });
    showToast('Master golongan SIM berhasil dihapus.', 'info');
  };

  // --- Handlers: Master Supplier Peralatan ---
  const handleAddSupplier = (sup: EquipmentSupplier) => {
    const updated = [sup, ...suppliers];
    setSuppliers(updated);
    saveStoredEquipmentSuppliers(updated);
    createActivityLog(
      'master_data',
      'create',
      'Tambah Master Supplier Peralatan',
      `Penambahan supplier [${sup.code}] ${sup.name} (${sup.category}). Kontak: ${sup.contactPerson} (${sup.phone}).`,
      sup.id,
      sup.name,
      { code: sup.code, category: sup.category, phone: sup.phone },
      'success'
    );
    persistAll({ suppliers: updated });
    showToast(`Supplier "${sup.name}" berhasil didaftarkan!`);
  };

  const handleUpdateSupplier = (sup: EquipmentSupplier) => {
    const updated = suppliers.map(s => (s.id === sup.id ? sup : s));
    setSuppliers(updated);
    saveStoredEquipmentSuppliers(updated);
    createActivityLog(
      'master_data',
      'update',
      'Ubah Master Supplier Peralatan',
      `Pembaruan data supplier [${sup.code}] ${sup.name}.`,
      sup.id,
      sup.name,
      undefined,
      'primary'
    );
    persistAll({ suppliers: updated });
    showToast(`Data supplier "${sup.name}" berhasil diperbarui!`);
  };

  const handleDeleteSupplier = (id: string) => {
    const target = suppliers.find(s => s.id === id);
    const updated = suppliers.filter(s => s.id !== id);
    setSuppliers(updated);
    saveStoredEquipmentSuppliers(updated);
    createActivityLog(
      'master_data',
      'delete',
      'Hapus Master Supplier',
      `Penghapusan supplier ${target?.name || id}.`,
      id,
      target?.name || id,
      undefined,
      'danger'
    );
    persistAll({ suppliers: updated });
    showToast('Supplier berhasil dihapus.', 'info');
  };

  // --- Handlers: Master Jenis Pengeluaran ---
  const handleAddExpenseCategory = (cat: ExpenseCategoryReference) => {
    const updated = [cat, ...expenseCategories];
    setExpenseCategories(updated);
    saveStoredExpenseCategories(updated);
    createActivityLog(
      'master_data',
      'create',
      'Tambah Master Jenis Pengeluaran',
      `Penambahan jenis pengeluaran [${cat.code}] ${cat.name} (${cat.group}).`,
      cat.id,
      cat.name,
      { code: cat.code, group: cat.group },
      'success'
    );
    persistAll({ expenseCategories: updated });
    showToast(`Jenis pengeluaran "${cat.name}" berhasil ditambahkan!`);
  };

  const handleUpdateExpenseCategory = (cat: ExpenseCategoryReference) => {
    const updated = expenseCategories.map(c => (c.id === cat.id ? cat : c));
    setExpenseCategories(updated);
    saveStoredExpenseCategories(updated);
    createActivityLog(
      'master_data',
      'update',
      'Ubah Master Jenis Pengeluaran',
      `Pembaruan jenis pengeluaran [${cat.code}] ${cat.name}.`,
      cat.id,
      cat.name,
      undefined,
      'primary'
    );
    persistAll({ expenseCategories: updated });
    showToast(`Jenis pengeluaran "${cat.name}" berhasil diperbarui!`);
  };

  const handleDeleteExpenseCategory = (id: string) => {
    const target = expenseCategories.find(c => c.id === id);
    const updated = expenseCategories.filter(c => c.id !== id);
    setExpenseCategories(updated);
    saveStoredExpenseCategories(updated);
    createActivityLog(
      'master_data',
      'delete',
      'Hapus Master Jenis Pengeluaran',
      `Penghapusan jenis pengeluaran ${target?.name || id}.`,
      id,
      target?.name || id,
      undefined,
      'danger'
    );
    persistAll({ expenseCategories: updated });
    showToast('Jenis pengeluaran berhasil dihapus.', 'info');
  };

  // --- Handlers: Master Karyawan Administrasi ---
  const handleAddAdminStaff = (staff: AdminStaff) => {
    const updated = [staff, ...adminStaff];
    setAdminStaff(updated);
    saveStoredAdminStaff(updated);
    createActivityLog(
      'master_data',
      'create',
      'Tambah Master Karyawan Administrasi',
      `Penambahan karyawan administrasi [${staff.nikOrNip}] ${staff.name} (${staff.jobTitle} - ${staff.department}).`,
      staff.id,
      staff.name,
      { nip: staff.nikOrNip, title: staff.jobTitle, dept: staff.department },
      'success'
    );
    persistAll({ adminStaff: updated });
    showToast(`Karyawan administrasi "${staff.name}" berhasil didaftarkan!`);
  };

  const handleUpdateAdminStaff = (staff: AdminStaff) => {
    const updated = adminStaff.map(s => (s.id === staff.id ? staff : s));
    setAdminStaff(updated);
    saveStoredAdminStaff(updated);
    createActivityLog(
      'master_data',
      'update',
      'Ubah Data Karyawan Administrasi',
      `Pembaruan data karyawan [${staff.nikOrNip}] ${staff.name}.`,
      staff.id,
      staff.name,
      undefined,
      'primary'
    );
    persistAll({ adminStaff: updated });
    showToast(`Data karyawan "${staff.name}" berhasil diperbarui!`);
  };

  const handleDeleteAdminStaff = (id: string) => {
    const target = adminStaff.find(s => s.id === id);
    const updated = adminStaff.filter(s => s.id !== id);
    setAdminStaff(updated);
    saveStoredAdminStaff(updated);
    createActivityLog(
      'master_data',
      'delete',
      'Hapus Master Karyawan Administrasi',
      `Penghapusan staf administrasi ${target?.name || id}.`,
      id,
      target?.name || id,
      undefined,
      'danger'
    );
    persistAll({ adminStaff: updated });
    showToast('Karyawan administrasi berhasil dihapus.', 'info');
  };

  // --- Handlers: Riwayat & Top-Up Deposit Perusahaan ---
  const handleTopUpDepositRecord = (rec: DepositTopUpRecord) => {
    const safeDeposits = asArray<CompanyDeposit>(companyDeposits);
    const safeAccounts = asArray<FinancialAccount>(accounts);
    const updatedTopUps = [rec, ...depositTopUps];
    setDepositTopUps(updatedTopUps);
    saveStoredDepositTopUpHistory(updatedTopUps);

    // Update Company Deposit balance
    const updatedCompanies = safeDeposits.map(c => {
      if (c.id === rec.companyId) {
        const newBal = (c.currentBalance || 0) + rec.amount;
        return {
          ...c,
          currentBalance: newBal,
          totalTopUp: (c.totalTopUp || 0) + rec.amount,
          lastTopUpDate: rec.date,
          status: (newBal > (c.minimumBalanceWarning || 0) ? 'active' : c.status) as any
        };
      }
      return c;
    });
    setCompanyDeposits(updatedCompanies);
    saveStoredCompanyDeposits(updatedCompanies);

    // Update Bank Account balance if bankAccountId is provided
    let updatedAccounts = safeAccounts;
    if (rec.bankAccountId) {
      updatedAccounts = safeAccounts.map(a => {
        if (a.id === rec.bankAccountId) {
          return { ...a, currentBalance: a.currentBalance + rec.amount };
        }
        return a;
      });
      setAccounts(updatedAccounts);
    }

    createActivityLog(
      'finance',
      'pay',
      'Penerimaan Top-Up Deposit Perusahaan',
      `Penerimaan deposit dana masuk dari ${rec.companyName} sebesar ${formatRupiah(rec.amount)} (No. Bukti Transfer: ${rec.transferProofNumber}).`,
      rec.id,
      rec.companyName,
      { amount: rec.amount, proofNumber: rec.transferProofNumber, bank: rec.bankAccountName },
      'success'
    );

    persistAll({
      accounts: updatedAccounts,
      companyDeposits: updatedCompanies,
      depositTopUps: updatedTopUps
    });
    showToast(`Top-up deposit ${rec.companyName} (${formatRupiah(rec.amount)}) berhasil dicatat!`);
  };

  // --- Handlers: Pengajuan Deposit Masing-Masing Perusahaan ---
  const handleAddDepositRequest = (req: CompanyDepositRequest) => {
    const updated = [req, ...depositRequests];
    setDepositRequests(updated);
    saveStoredDepositRequests(updated);
    createActivityLog(
      'finance',
      'create',
      'Pengajuan Deposit Rekanan',
      `Pengajuan penambahan deposit baru ${req.requestNumber} oleh ${req.companyName} (${formatRupiah(req.amount)}). Keperluan: ${req.purpose}.`,
      req.id,
      req.companyName,
      { amount: req.amount, applicant: req.applicantName, urgency: req.urgencyLevel },
      'primary'
    );
    persistAll({ depositRequests: updated });
    showToast(`Pengajuan deposit ${req.requestNumber} (${formatRupiah(req.amount)}) berhasil diajukan!`);
  };

  const handleUpdateDepositRequest = (req: CompanyDepositRequest) => {
    const updated = depositRequests.map(r => (r.id === req.id ? req : r));
    setDepositRequests(updated);
    saveStoredDepositRequests(updated);
    createActivityLog(
      'finance',
      'update',
      'Ubah Pengajuan Deposit',
      `Pembaruan data berkas pengajuan deposit ${req.requestNumber} (${req.companyName}).`,
      req.id,
      req.companyName,
      undefined,
      'info'
    );
    persistAll({ depositRequests: updated });
    showToast(`Data pengajuan deposit ${req.requestNumber} diperbarui!`);
  };

  const handleDeleteDepositRequest = (id: string) => {
    const target = depositRequests.find(r => r.id === id);
    const updated = depositRequests.filter(r => r.id !== id);
    setDepositRequests(updated);
    saveStoredDepositRequests(updated);
    createActivityLog(
      'finance',
      'delete',
      'Hapus Pengajuan Deposit',
      `Penghapusan berkas pengajuan deposit ${target?.requestNumber || id} (${target?.companyName || '-'}).`,
      id,
      target?.companyName || id,
      undefined,
      'danger'
    );
    persistAll({ depositRequests: updated });
    showToast('Berkas pengajuan deposit telah dihapus.', 'info');
  };

  const handleApproveDepositRequest = (id: string, approverName: string) => {
    const target = depositRequests.find(r => r.id === id);
    if (!target) return;
    const updated = depositRequests.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: 'approved' as const,
          approvedBy: approverName,
          approvedAt: new Date().toLocaleString('id-ID')
        };
      }
      return r;
    });
    setDepositRequests(updated);
    saveStoredDepositRequests(updated);
    createActivityLog(
      'finance',
      'status_change',
      'Setujui Pengajuan Deposit',
      `Pengajuan deposit ${target.requestNumber} (${target.companyName}) sebesar ${formatRupiah(target.amount)} disetujui oleh ${approverName}.`,
      target.id,
      target.companyName,
      { status: 'approved', approvedBy: approverName },
      'success'
    );
    persistAll({ depositRequests: updated });
    showToast(`Pengajuan ${target.requestNumber} (${formatRupiah(target.amount)}) telah disetujui!`);
  };

  const handleCompleteDepositRequest = (
    req: CompanyDepositRequest,
    transferProofNumber: string,
    paymentMethod: string,
    receiptProofUrl?: string
  ) => {
    const safeDeposits = asArray<CompanyDeposit>(companyDeposits);
    const safeAccounts = asArray<FinancialAccount>(accounts);

    // 1. Mark request as completed
    const updatedRequests = depositRequests.map(r => {
      if (r.id === req.id) {
        return {
          ...r,
          status: 'completed' as const,
          completedAt: new Date().toLocaleString('id-ID')
        };
      }
      return r;
    });
    setDepositRequests(updatedRequests);
    saveStoredDepositRequests(updatedRequests);

    // 2. Create Top-Up Record
    const acc = safeAccounts.find(a => a.id === req.targetAccountId) || safeAccounts[0];
    const topUpRecord: DepositTopUpRecord = {
      id: 'TOP-REQ-' + Date.now().toString().slice(-6),
      companyId: req.companyId,
      companyName: req.companyName,
      date: new Date().toISOString().slice(0, 10),
      amount: req.amount,
      transferProofNumber: transferProofNumber || 'TRF-' + Date.now().toString().slice(-4),
      bankAccountId: acc?.id || '',
      bankAccountName: acc?.accountName || 'Bank BCA',
      paymentMethod: paymentMethod || 'Transfer Bank BCA',
      receiptProofUrl: receiptProofUrl || req.attachmentUrl,
      notes: `Realisasi pengajuan deposit ${req.requestNumber} - ${req.purpose}`,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    const updatedTopUps = [topUpRecord, ...depositTopUps];
    setDepositTopUps(updatedTopUps);
    saveStoredDepositTopUpHistory(updatedTopUps);

    // 3. Credit Company Deposit balance
    const updatedCompanies = safeDeposits.map(c => {
      if (c.id === req.companyId) {
        const newBal = (c.currentBalance || 0) + req.amount;
        return {
          ...c,
          currentBalance: newBal,
          totalTopUp: (c.totalTopUp || 0) + req.amount,
          lastTopUpDate: new Date().toISOString().slice(0, 10),
          status: (newBal > (c.minimumBalanceWarning || 0) ? 'active' : c.status) as any
        };
      }
      return c;
    });
    setCompanyDeposits(updatedCompanies);
    saveStoredCompanyDeposits(updatedCompanies);

    // 4. Credit Financial Account balance
    let updatedAccounts = safeAccounts;
    if (acc) {
      updatedAccounts = safeAccounts.map(a => {
        if (a.id === acc.id) {
          return { ...a, currentBalance: a.currentBalance + req.amount };
        }
        return a;
      });
      setAccounts(updatedAccounts);
    }

    createActivityLog(
      'finance',
      'pay',
      'Realisasi Pengajuan Deposit Masuk',
      `Realisasi transfer dana pengajuan ${req.requestNumber} dari ${req.companyName} sebesar ${formatRupiah(req.amount)} telah masuk ke rekening ${acc?.accountName || 'Kas'} dan menambah saldo deposit.`,
      req.id,
      req.companyName,
      { amount: req.amount, proofNumber: transferProofNumber, account: acc?.accountName },
      'success'
    );

    persistAll({
      accounts: updatedAccounts,
      companyDeposits: updatedCompanies,
      depositTopUps: updatedTopUps,
      depositRequests: updatedRequests
    });
    showToast(`Pengajuan ${req.requestNumber} berhasil direalisasikan! Saldo deposit ${req.companyName} bertambah ${formatRupiah(req.amount)}.`);
  };

  const handleRejectDepositRequest = (id: string, reason: string) => {
    const target = depositRequests.find(r => r.id === id);
    if (!target) return;
    const updated = depositRequests.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: 'rejected' as const,
          rejectionReason: reason
        };
      }
      return r;
    });
    setDepositRequests(updated);
    saveStoredDepositRequests(updated);
    createActivityLog(
      'finance',
      'status_change',
      'Tolak Pengajuan Deposit',
      `Penolakan pengajuan deposit ${target.requestNumber} (${target.companyName}). Alasan: ${reason}`,
      target.id,
      target.companyName,
      { status: 'rejected', reason },
      'warning'
    );
    persistAll({ depositRequests: updated });
    showToast(`Pengajuan deposit ${target.requestNumber} ditolak.`, 'info');
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
    persistAll({ notifConfig: cfg });
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

    persistAll({ vehicles: updatedVehicles, timesheets: updatedTs });
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
    persistAll({ timesheets: updated });
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
    persistAll({ timesheets: updated });
    showToast('Timesheet dihapus', 'info');
  };

  // --- Handlers: Trip Sheet (Surat Jalan & Perjalanan) ---
  const handleAddTripSheet = (ts: TripSheet) => {
    const updatedTripSheets = [ts, ...tripSheets];
    setTripSheets(updatedTripSheets);
    saveStoredTripSheets(updatedTripSheets);

    // Update vehicle odometer if end or start km is higher
    let updatedVehicles = vehicles;
    const targetKm = ts.endOdometer || ts.startOdometer;
    if (targetKm) {
      updatedVehicles = vehicles.map(v => {
        if ((v.id === ts.vehicleId || v.nopol === ts.nopol) && targetKm > v.currentOdometer) {
          return { ...v, currentOdometer: targetKm };
        }
        return v;
      });
      setVehicles(updatedVehicles);
    }

    createActivityLog(
      'tripsheet',
      'create',
      'Terbitkan Trip Sheet & Surat Jalan',
      `Penerbitan ${ts.tripNumber} (${ts.suratJalanNumber}) unit ${ts.nopol} Supir: ${ts.driverName} Rute: ${ts.originLocation} -> ${ts.destinationLocation} (Muatan: ${ts.cargoDescription}).`,
      ts.id,
      ts.tripNumber,
      {
        nopol: ts.nopol,
        driver: ts.driverName,
        origin: ts.originLocation,
        dest: ts.destinationLocation,
        pocketMoney: ts.totalPocketDisbursed
      },
      'success'
    );

    persistAll({ vehicles: updatedVehicles, tripSheets: updatedTripSheets });
    showToast(`Trip Sheet ${ts.tripNumber} (${ts.nopol}) berhasil diterbitkan!`);
  };

  const handleUpdateTripSheet = (ts: TripSheet) => {
    const updated = tripSheets.map(item => (item.id === ts.id ? ts : item));
    setTripSheets(updated);
    saveStoredTripSheets(updated);

    let updatedVehicles = vehicles;
    const targetKm = ts.endOdometer || ts.startOdometer;
    if (targetKm) {
      updatedVehicles = vehicles.map(v => {
        if ((v.id === ts.vehicleId || v.nopol === ts.nopol) && targetKm > v.currentOdometer) {
          return { ...v, currentOdometer: targetKm };
        }
        return v;
      });
      setVehicles(updatedVehicles);
    }

    createActivityLog(
      'tripsheet',
      'update',
      'Pembaruan Trip Sheet',
      `Pembaruan status/rute perjalanan ${ts.tripNumber} (${ts.nopol}) - Status: ${ts.status.toUpperCase()}.`,
      ts.id,
      ts.tripNumber,
      { status: ts.status, actualExpense: ts.actualTripExpense },
      'primary'
    );

    persistAll({ vehicles: updatedVehicles, tripSheets: updated });
    showToast(`Data Trip Sheet ${ts.tripNumber} berhasil diperbarui!`);
  };

  const handleDeleteTripSheet = (id: string) => {
    const target = tripSheets.find(t => t.id === id);
    const updated = tripSheets.filter(t => t.id !== id);
    setTripSheets(updated);
    saveStoredTripSheets(updated);

    createActivityLog(
      'tripsheet',
      'delete',
      'Hapus Trip Sheet',
      `Penghapusan trip sheet ${target?.tripNumber || id} unit ${target?.nopol || '-'}.`,
      id,
      target?.tripNumber || id,
      undefined,
      'danger'
    );

    persistAll({ tripSheets: updated });
    showToast('Trip Sheet berhasil dihapus', 'info');
  };

  // --- Handlers: Arus Kas Peralatan & Perlengkapan Armada ---
  const handleAddEquipment = (eq: EquipmentCashFlow) => {
    const safeAccounts = asArray<FinancialAccount>(accounts);
    const safeDeposits = asArray<CompanyDeposit>(companyDeposits);
    const updatedEquipment = [eq, ...equipmentList];
    setEquipmentList(updatedEquipment);
    saveStoredEquipment(updatedEquipment);

    // Potong saldo rekening jika ada transaksi pembelian
    let updatedAccounts = safeAccounts;
    if (eq.type === 'expense' && eq.accountId && eq.totalAmount > 0) {
      updatedAccounts = safeAccounts.map(acc => {
        if (acc.id === eq.accountId) {
          return { ...acc, currentBalance: acc.currentBalance - eq.totalAmount };
        }
        return acc;
      });
      setAccounts(updatedAccounts);
    }

    // Integrasi dengan master deposit: kurangi saldo deposit perusahaan jika dibeli atas beban perusahaan
    let updatedCompanies = safeDeposits;
    if (eq.type === 'expense' && eq.purchasedByCompany && eq.totalAmount > 0) {
      updatedCompanies = safeDeposits.map(c => {
        if (c.companyName.toLowerCase() === eq.purchasedByCompany?.toLowerCase() || c.id === eq.purchasedByCompany) {
          const newBal = (c.currentBalance || 0) - eq.totalAmount;
          return {
            ...c,
            currentBalance: newBal,
            totalUsed: (c.totalUsed || 0) + eq.totalAmount,
            status: (newBal <= (c.minimumBalanceWarning || 0) ? 'warning' : c.status) as any
          };
        }
        return c;
      });
      setCompanyDeposits(updatedCompanies);
      saveStoredCompanyDeposits(updatedCompanies);
    }

    // Integrasi otomatis ke Buku Kas Operasional & Laporan Terpadu
    let updatedFinances = asArray<OperationalFinance>(finances);
    if (eq.type === 'expense' && eq.totalAmount > 0) {
      const linkedFinance: OperationalFinance = {
        id: `FIN-EQP-${eq.id}`,
        date: eq.date,
        vehicleId: eq.vehicleId || 'POOL-GENERAL',
        nopol: eq.nopol || 'INVENTARIS POOL',
        driverId: eq.recipientDriverId,
        driverName: eq.recipientName || 'Logistik Peralatan',
        driverNip: eq.recipientNip,
        handoverBy: eq.handoverBy,
        receivedBy: eq.recipientName,
        category: 'Pembelian Peralatan & Perlengkapan',
        type: 'expense',
        companyName: eq.purchasedByCompany || eq.ownerCompany,
        amount: eq.totalAmount,
        description: `Belanja Peralatan [${eq.category}] ${eq.equipmentName} (${eq.quantity} ${eq.unit})${eq.supplierOrStore ? ` - Toko: ${eq.supplierOrStore}` : ''}`,
        paymentMethod: eq.paymentMethod || 'Cash / Uang Kas',
        status: 'approved',
        receiptNumber: eq.receiptNumber,
        receiptProofUrl: eq.receiptProofUrl,
        accountId: eq.accountId,
        accountName: eq.accountName
      };
      updatedFinances = [linkedFinance, ...updatedFinances.filter(f => f.id !== linkedFinance.id)];
      setFinances(updatedFinances);
    }

    createActivityLog(
      'equipment',
      'create',
      'Belanja Peralatan Armada',
      `Pembelian ${eq.equipmentName} (${eq.quantity} ${eq.unit}) kategori ${eq.category} (${formatRupiah(eq.totalAmount)}). Bukti nota: ${eq.receiptProofUrl ? 'Ada' : 'Tidak'}.`,
      eq.id,
      eq.equipmentName,
      { item: eq.equipmentName, category: eq.category, cost: eq.totalAmount },
      'success'
    );

    persistAll({
      accounts: updatedAccounts,
      companyDeposits: updatedCompanies,
      equipment: updatedEquipment,
      finances: updatedFinances
    });
    showToast(`Peralatan ${eq.equipmentName} (${formatRupiah(eq.totalAmount)}) berhasil dicatat & terintegrasi ke buku kas!`);
  };

  const handleUpdateEquipment = (eq: EquipmentCashFlow) => {
    const updated = equipmentList.map(item => (item.id === eq.id ? eq : item));
    setEquipmentList(updated);
    saveStoredEquipment(updated);

    createActivityLog(
      'equipment',
      'update',
      'Ubah Data Peralatan',
      `Pembaruan data peralatan/alat kerja ${eq.equipmentName} (${eq.category}).`,
      eq.id,
      eq.equipmentName,
      undefined,
      'primary'
    );

    persistAll({ equipment: updated });
    showToast(`Data peralatan ${eq.equipmentName} diperbarui!`);
  };

  const handleDeleteEquipment = (id: string) => {
    const safeAccounts = asArray<FinancialAccount>(accounts);
    const safeDeposits = asArray<CompanyDeposit>(companyDeposits);
    const target = equipmentList.find(e => e.id === id);
    const updated = equipmentList.filter(e => e.id !== id);
    setEquipmentList(updated);
    saveStoredEquipment(updated);

    // Kembalikan saldo kas jika menghapus transaksi pengeluaran
    let updatedAccounts = safeAccounts;
    if (target?.type === 'expense' && target.accountId && target.totalAmount > 0) {
      updatedAccounts = safeAccounts.map(a => {
        if (a.id === target.accountId) {
          return { ...a, currentBalance: a.currentBalance + target.totalAmount };
        }
        return a;
      });
      setAccounts(updatedAccounts);
    }

    // Kembalikan saldo deposit perusahaan jika ada pembebanan perusahaan
    let updatedCompanies = safeDeposits;
    if (target?.type === 'expense' && target.purchasedByCompany && target.totalAmount > 0) {
      updatedCompanies = safeDeposits.map(c => {
        if (c.companyName.toLowerCase() === target.purchasedByCompany?.toLowerCase() || c.id === target.purchasedByCompany) {
          return {
            ...c,
            currentBalance: (c.currentBalance || 0) + target.totalAmount,
            totalUsed: Math.max(0, (c.totalUsed || 0) - target.totalAmount)
          };
        }
        return c;
      });
      setCompanyDeposits(updatedCompanies);
      saveStoredCompanyDeposits(updatedCompanies);
    }

    const updatedFinances = asArray<OperationalFinance>(finances).filter(
      f => f.id !== `FIN-EQP-${id}` && !(target?.receiptNumber && f.receiptNumber === target.receiptNumber)
    );
    setFinances(updatedFinances);

    createActivityLog(
      'equipment',
      'delete',
      'Hapus Belanja Peralatan',
      `Penghapusan catatan belanja alat ${target?.equipmentName || id}.`,
      id,
      target?.equipmentName || id,
      undefined,
      'danger'
    );

    persistAll({
      accounts: updatedAccounts,
      companyDeposits: updatedCompanies,
      equipment: updated,
      finances: updatedFinances
    });
    showToast('Catatan peralatan dihapus & saldo dikembalikan', 'info');
  };

  // --- Handlers: Arus Kas Saku Driver Untuk Perjalanan ---
  const handleAddPocketFlow = (pf: DriverPocketCashFlow) => {
    const safeAccounts = asArray<FinancialAccount>(accounts);
    const safeDeposits = asArray<CompanyDeposit>(companyDeposits);
    const updatedFlows = [pf, ...asArray<DriverPocketCashFlow>(pocketFlows)];
    setPocketFlows(updatedFlows);
    saveStoredPocketFlows(updatedFlows);

    // Potong saldo rekening operasional atau deposit perusahaan pencairan uang saku
    let updatedAccounts = safeAccounts;
    let updatedCompanyDeposits = safeDeposits;

    const matchedDeposit = safeDeposits.find(
      (d) => d.id === pf.accountId || pf.accountId === `deposit_${d.id}` || (pf.sourceCompanyId && (d.id === pf.sourceCompanyId || pf.sourceCompanyId === `deposit_${d.id}`))
    );

    const matchedAccount = safeAccounts.find((a) => a.id === pf.accountId);

    if (matchedDeposit && pf.totalGiven > 0) {
      updatedCompanyDeposits = safeDeposits.map((dep) => {
        if (dep.id === matchedDeposit.id) {
          const nextBal = dep.currentBalance - pf.totalGiven;
          return {
            ...dep,
            currentBalance: nextBal,
            totalUsed: (dep.totalUsed || 0) + pf.totalGiven,
            status:
              nextBal <= 0
                ? 'depleted'
                : nextBal <= dep.minimumBalanceWarning
                ? 'warning'
                : 'active'
          };
        }
        return dep;
      });
      setCompanyDeposits(updatedCompanyDeposits);
      saveStoredCompanyDeposits(updatedCompanyDeposits);
    } else if (matchedAccount && pf.totalGiven > 0) {
      // Potong saldo rekening keuangan
      updatedAccounts = safeAccounts.map((acc) => {
        if (acc.id === matchedAccount.id) {
          return { ...acc, currentBalance: acc.currentBalance - pf.totalGiven };
        }
        return acc;
      });
      setAccounts(updatedAccounts);

      // Sinkronkan juga ke master deposit perusahaan jika rekening terkait perusahaan deposit
      const linkedDeposit = safeDeposits.find(
        (d) =>
          (matchedAccount.companyId && d.id === matchedAccount.companyId) ||
          (matchedAccount.companyName && d.companyName.toLowerCase() === matchedAccount.companyName.toLowerCase()) ||
          (pf.sourceCompanyName && d.companyName.toLowerCase() === pf.sourceCompanyName.toLowerCase())
      );

      if (linkedDeposit) {
        updatedCompanyDeposits = safeDeposits.map((dep) => {
          if (dep.id === linkedDeposit.id) {
            const nextBal = dep.currentBalance - pf.totalGiven;
            return {
              ...dep,
              currentBalance: nextBal,
              totalUsed: (dep.totalUsed || 0) + pf.totalGiven,
              status:
                nextBal <= 0
                  ? 'depleted'
                  : nextBal <= dep.minimumBalanceWarning
                  ? 'warning'
                  : 'active'
            };
          }
          return dep;
        });
        setCompanyDeposits(updatedCompanyDeposits);
        saveStoredCompanyDeposits(updatedCompanyDeposits);
      }
    }

    // Integrasi otomatis ke Buku Kas Operasional & Trip Sheet
    let updatedFinances = asArray<OperationalFinance>(finances);
    if (pf.totalGiven > 0) {
      const linkedFinance: OperationalFinance = {
        id: `FIN-SAKU-${pf.id}`,
        date: pf.date,
        vehicleId: pf.vehicleId,
        nopol: pf.nopol,
        driverId: pf.driverId,
        driverName: pf.driverName,
        driverNip: pf.driverNip,
        handoverBy: pf.disbursedBy,
        receivedBy: pf.receivedBy || pf.driverName,
        category: 'Uang Jalan & Saku Supir',
        type: 'expense',
        companyId: pf.sourceCompanyId,
        companyName: pf.sourceCompanyName || pf.ownerCompany,
        amount: pf.totalGiven,
        tripCode: pf.tripCode,
        description: `Pencairan Saku Driver (${pf.tripCode}) - Rute: ${pf.originLocation} -> ${pf.destinationLocation}`,
        paymentMethod: pf.paymentMethod || 'Cash / Uang Kas',
        status: 'approved',
        receiptNumber: pf.tripCode,
        receiptProofUrl: pf.receiptProofUrl,
        accountId: pf.accountId,
        accountName: pf.accountName
      };
      updatedFinances = [linkedFinance, ...updatedFinances.filter(f => f.id !== linkedFinance.id)];
      setFinances(updatedFinances);
    }

    let updatedTripSheets = asArray<TripSheet>(tripSheets);
    if (pf.tripCode) {
      const hasMatchingTrip = updatedTripSheets.some(t => t.tripNumber === pf.tripCode);
      if (hasMatchingTrip) {
        updatedTripSheets = updatedTripSheets.map(t =>
          t.tripNumber === pf.tripCode
            ? { ...t, totalPocketDisbursed: pf.totalGiven }
            : t
        );
        setTripSheets(updatedTripSheets);
        saveStoredTripSheets(updatedTripSheets);
      }
    }

    createActivityLog(
      'pocket_money',
      'create',
      'Pencairan Uang Saku Driver',
      `Pencairan uang saku perjalanan ${pf.tripCode} supir ${pf.driverName} (${pf.nopol}) sebesar ${formatRupiah(pf.totalGiven)} sumber kas [${pf.sourceCompanyName || pf.ownerCompany || 'Fleet'}] ${pf.accountName}.`,
      pf.id,
      pf.tripCode,
      { driver: pf.driverName, nopol: pf.nopol, amount: pf.totalGiven, company: pf.sourceCompanyName || pf.ownerCompany },
      'success'
    );

    persistAll({
      accounts: updatedAccounts,
      companyDeposits: updatedCompanyDeposits,
      pocketFlows: updatedFlows,
      finances: updatedFinances,
      tripSheets: updatedTripSheets
    });
    showToast(`Uang saku ${pf.driverName} (${formatRupiah(pf.totalGiven)}) berhasil dicairkan & terintegrasi ke Buku Kas!`);
  };

  const handleUpdatePocketFlow = (pf: DriverPocketCashFlow) => {
    const updated = asArray<DriverPocketCashFlow>(pocketFlows).map(item => (item.id === pf.id ? pf : item));
    setPocketFlows(updated);
    saveStoredPocketFlows(updated);

    createActivityLog(
      'pocket_money',
      'update',
      'Rekonsiliasi / Ubah Uang Saku',
      `Penyelesaian / update uang saku ${pf.tripCode} supir ${pf.driverName} - Status: ${pf.status.toUpperCase()}.`,
      pf.id,
      pf.tripCode,
      { status: pf.status, real: pf.actualExpense, balance: pf.remainingBalance },
      'primary'
    );

    persistAll({ pocketFlows: updated });
    showToast(`Data uang saku ${pf.tripCode} berhasil diperbarui!`);
  };

  const handleDeletePocketFlow = (id: string) => {
    const safeAccounts = asArray<FinancialAccount>(accounts);
    const safeDeposits = asArray<CompanyDeposit>(companyDeposits);
    const safeFlows = asArray<DriverPocketCashFlow>(pocketFlows);
    const target = safeFlows.find(p => p.id === id);
    const updated = safeFlows.filter(p => p.id !== id);
    setPocketFlows(updated);
    saveStoredPocketFlows(updated);

    // Kembalikan saldo kas & deposit perusahaan jika ada pembatalan uang saku
    let updatedAccounts = safeAccounts;
    let updatedCompanyDeposits = safeDeposits;

    if (target && target.totalGiven > 0) {
      const matchedDeposit = safeDeposits.find(
        (d) => d.id === target.accountId || target.accountId === `deposit_${d.id}` || (target.sourceCompanyId && (d.id === target.sourceCompanyId || target.sourceCompanyId === `deposit_${d.id}`))
      );
      const matchedAccount = safeAccounts.find((a) => a.id === target.accountId);

      if (matchedDeposit) {
        updatedCompanyDeposits = safeDeposits.map((dep) => {
          if (dep.id === matchedDeposit.id) {
            const nextBal = dep.currentBalance + target.totalGiven;
            return {
              ...dep,
              currentBalance: nextBal,
              totalUsed: Math.max(0, (dep.totalUsed || 0) - target.totalGiven),
              status: nextBal <= dep.minimumBalanceWarning ? 'warning' : 'active'
            };
          }
          return dep;
        });
        setCompanyDeposits(updatedCompanyDeposits);
        saveStoredCompanyDeposits(updatedCompanyDeposits);
      } else if (matchedAccount) {
        updatedAccounts = safeAccounts.map((acc) => {
          if (acc.id === matchedAccount.id) {
            return { ...acc, currentBalance: acc.currentBalance + target.totalGiven };
          }
          return acc;
        });
        setAccounts(updatedAccounts);

        const linkedDeposit = safeDeposits.find(
          (d) =>
            (matchedAccount.companyId && d.id === matchedAccount.companyId) ||
            (matchedAccount.companyName && d.companyName.toLowerCase() === matchedAccount.companyName.toLowerCase()) ||
            (target.sourceCompanyName && d.companyName.toLowerCase() === target.sourceCompanyName.toLowerCase())
        );

        if (linkedDeposit) {
          updatedCompanyDeposits = safeDeposits.map((dep) => {
            if (dep.id === linkedDeposit.id) {
              const nextBal = dep.currentBalance + target.totalGiven;
              return {
                ...dep,
                currentBalance: nextBal,
                totalUsed: Math.max(0, (dep.totalUsed || 0) - target.totalGiven),
                status: nextBal <= dep.minimumBalanceWarning ? 'warning' : 'active'
              };
            }
            return dep;
          });
          setCompanyDeposits(updatedCompanyDeposits);
          saveStoredCompanyDeposits(updatedCompanyDeposits);
        }
      }
    }

    const updatedFinances = asArray<OperationalFinance>(finances).filter(
      f => f.id !== `FIN-SAKU-${id}` && !(target?.tripCode && f.tripCode === target.tripCode)
    );
    setFinances(updatedFinances);

    createActivityLog(
      'pocket_money',
      'delete',
      'Hapus Uang Saku Driver',
      `Penghapusan catatan uang saku ${target?.tripCode || id} supir ${target?.driverName || '-'}.`,
      id,
      target?.tripCode || id,
      undefined,
      'danger'
    );

    persistAll({
      accounts: updatedAccounts,
      companyDeposits: updatedCompanyDeposits,
      pocketFlows: updated,
      finances: updatedFinances
    });
    showToast('Catatan uang saku dihapus & saldo dikembalikan.', 'info');
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

    let nextFinances = finances;
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
        receiptNumber: m.workOrderNumber,
        receiptProofUrl: m.receiptProofUrl,
        accountId: m.accountId,
        accountName: selectedAccountName
      };
      nextFinances = [newFinance, ...finances];
      setFinances(nextFinances);
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

    persistAll({ vehicles: updatedVehicles, finances: nextFinances, maintenance: updatedMaint, accounts: updatedAccounts });
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
    persistAll({ maintenance: updated });
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
    persistAll({ maintenance: updated });
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
    persistAll({ drivers: updated });
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
    persistAll({ drivers: updated });
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
    persistAll({ drivers: updated });
    pushToGas('deleteDriver', { id });
    showToast('Data supir dihapus', 'info');
  };

  // --- Handlers: Inventory Sparepart (Baru & Bekas) ---
  const handleAddSparepartItem = (item: SparepartInventoryItem) => {
    const updated = [item, ...sparepartInventory];
    setSparepartInventory(updated);
    saveStoredSparepartInventory(updated);
    createActivityLog(
      'sparepart_inventory',
      'create',
      `Tambah Sparepart ${item.condition === 'baru' ? 'Baru (OEM)' : 'Bekas / Copotan'}`,
      `Penambahan item inventory [${item.partCode}] ${item.partName} (${item.stockQty} ${item.unit}, Kondisi: ${item.condition.toUpperCase()}).`,
      item.id,
      item.partName,
      { partCode: item.partCode, condition: item.condition, stockQty: item.stockQty, originNopol: item.originNopol },
      'success'
    );
    persistAll({ sparepartInventory: updated });
    showToast(`Sparepart ${item.partName} berhasil disimpan ke Gudang!`);
  };

  const handleUpdateSparepartItem = (item: SparepartInventoryItem) => {
    const updated = sparepartInventory.map(p => (p.id === item.id ? item : p));
    setSparepartInventory(updated);
    saveStoredSparepartInventory(updated);
    createActivityLog(
      'sparepart_inventory',
      'update',
      'Perbarui Data Inventory Sparepart',
      `Pembaruan data/stok [${item.partCode}] ${item.partName} (Stok: ${item.stockQty} ${item.unit}).`,
      item.id,
      item.partName,
      { partCode: item.partCode, condition: item.condition, stockQty: item.stockQty },
      'primary'
    );
    persistAll({ sparepartInventory: updated });
    showToast(`Data sparepart ${item.partCode} diperbarui!`);
  };

  const handleDeleteSparepartItem = (id: string) => {
    const target = sparepartInventory.find(p => p.id === id);
    const updated = sparepartInventory.filter(p => p.id !== id);
    setSparepartInventory(updated);
    saveStoredSparepartInventory(updated);
    createActivityLog(
      'sparepart_inventory',
      'delete',
      'Hapus Item Inventory Sparepart',
      `Penghapusan item sparepart ${target?.partName || id} dari gudang.`,
      id,
      target?.partName || id,
      undefined,
      'danger'
    );
    persistAll({ sparepartInventory: updated });
    showToast(`Item sparepart ${target?.partCode || ''} dihapus.`, 'info');
  };

  const handleRecordSparepartMovement = (mov: SparepartStockMovement, updatedItem: SparepartInventoryItem) => {
    const updatedMovements = [mov, ...sparepartMovements];
    const updatedInventory = sparepartInventory.map(p => (p.id === updatedItem.id ? updatedItem : p));
    setSparepartMovements(updatedMovements);
    setSparepartInventory(updatedInventory);
    saveStoredSparepartMovements(updatedMovements);
    saveStoredSparepartInventory(updatedInventory);
    createActivityLog(
      'sparepart_inventory',
      'status_change',
      'Mutasi & Serah Terima Gudang Sparepart',
      `Mutasi ${mov.movementType} untuk [${mov.partCode}] ${mov.partName} sebanyak ${mov.qty} ${mov.unit} ${mov.nopol ? `pada unit ${mov.nopol}` : ''} ${mov.driverName ? `(Driver: ${mov.driverName})` : ''}.`,
      mov.id,
      mov.partName,
      { qty: mov.qty, nopol: mov.nopol, driverName: mov.driverName, workOrderNumber: mov.workOrderNumber },
      'info'
    );
    persistAll({ sparepartInventory: updatedInventory, sparepartMovements: updatedMovements });
    showToast(`Mutasi stok ${mov.partName} berhasil dicatat! Sisa stok: ${updatedItem.stockQty} ${updatedItem.unit}`);
  };

  const handleDeleteSparepartMovement = (id: string) => {
    const updated = sparepartMovements.filter(m => m.id !== id);
    setSparepartMovements(updated);
    saveStoredSparepartMovements(updated);
    persistAll({ sparepartMovements: updated });
    showToast('Riwayat mutasi sparepart dihapus.', 'info');
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
    persistAll({ users: updated });
    showToast(`Pengguna baru ${usr.name} (${usr.role.toUpperCase()}) berhasil dibuat!`);
  };

  const handleUpdateUserAccount = (usr: UserAccount) => {
    const normalizedUser: UserAccount = {
      ...usr,
      allowedTabs: normalizeAllowedModules(usr.allowedTabs, usr.role, true)
    };
    const updated = users.map(u => (u.id === normalizedUser.id ? normalizedUser : u));
    setUsers(updated);
    saveStoredUserAccounts(updated);

    // If current session is updated (or matches active userId), sync session data immediately
    if (authSession && (authSession.userId === normalizedUser.id || currentUserId === normalizedUser.id)) {
      const updatedSession: AuthSession = {
        ...authSession,
        userName: normalizedUser.name,
        email: normalizedUser.email,
        department: normalizedUser.department,
        userRole: normalizedUser.role,
        allowedTabs: normalizedUser.allowedTabs
      };
      setAuthSession(updatedSession);
      saveStoredAuthSession(updatedSession);
      setUserRole(normalizedUser.role);
      saveStoredUserRole(normalizedUser.role);
    }

    createActivityLog(
      'user',
      'update',
      'Ubah Profil & Modul Aktif Akun Staf',
      `Pembaruan profil & centang modul aktif pengguna ${normalizedUser.name} (${normalizedUser.role.toUpperCase()} - ${normalizedUser.allowedTabs?.length || 0} modul aktif).`,
      normalizedUser.id,
      normalizedUser.name,
      { role: normalizedUser.role, activeModulesCount: normalizedUser.allowedTabs?.length || 0 },
      'primary'
    );
    persistAll({ users: updated });
    showToast(`Profil & hak akses modul ${normalizedUser.name} berhasil diperbarui!`);
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
    persistAll({ users: updated });
    showToast(`Akun pengguna ${target?.name || ''} telah dihapus.`, 'info');
  };

  const handleSwitchUser = (usr: UserAccount) => {
    const normalizedTabs = normalizeAllowedModules(usr.allowedTabs, usr.role, true);
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
      isRemembered: true,
      allowedTabs: normalizedTabs
    };
    setAuthSession(newSession);
    saveStoredAuthSession(newSession);

    // Auto-route to permitted tab if current is not in user's active modules
    if (!isTabPermitted(usr.role, currentTab, normalizedTabs)) {
      setCurrentTab(normalizedTabs[0] || 'dashboard');
    }

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
    persistAll({ userRole: usr.role });
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

  // Manual Full Sync Trigger (Real-time 2-way synchronization)
  const handleManualSync = async () => {
    if (!gasConfig.webAppUrl) {
      if (userRole === 'owner' && (authSession?.userRole || userRole) === 'owner') {
        setIsDeployModalOpen(true);
      } else {
        showToast('Konfigurasi Apps Script hanya dapat diakses oleh Owner.', 'info');
      }
      return;
    }
    setIsSyncing(true);
    showToast('Sinkronisasi Batch seluruh 16 modul HP & PC...', 'info');
    try {
      await syncToGoogleAppsScript(gasConfig.webAppUrl, 'bulkSync', {
        vehicles,
        taxes,
        fuelLogs,
        finances,
        pocketFlows,
        equipmentFlows: equipmentList,
        tripSheets,
        timesheets,
        maintenance,
        sparepartInventory,
        sparepartMovements,
        drivers,
        accounts,
        companyDeposits,
        users,
        auditLogs: activityLogs.slice(0, 250)
      });
      await pullFromGas(true);
      showToast('Sinkronisasi cloud Google Spreadsheet berhasil (Hemat DB & Cepat)!');
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
      <>
        <CenterCrudDialogHub />
        <LoginScreen
          users={users}
          onLoginSuccess={handleLoginSuccess}
          onShowNotification={showToast}
        />
      </>
    );
  }

  // 2. If screen locked -> Show Lock Screen
  if (isLocked) {
    return (
      <>
        <CenterCrudDialogHub />
        <LockScreen
          session={authSession}
          currentUser={currentUser}
          onUnlock={handleUnlockScreen}
          onLogout={handleLogout}
        />
      </>
    );
  }

  // Check RBAC permission for current active tab
  const isCurrentTabAllowed = isTabPermitted(userRole, currentTab, authSession?.allowedTabs);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Global Centered Delete Confirmation & CRUD Notification Modal Hub */}
      <CenterCrudDialogHub />

      {/* Global Application Header */}
      <Header
        onOpenDeployModal={() => {
          if (userRole === 'owner' && (authSession?.userRole || userRole) === 'owner') {
            setIsDeployModalOpen(true);
          }
        }}
        onOpenNotifConfig={() => setIsNotifConfigOpen(true)}
        onToggleNotifPanel={() => setIsNotifPanelOpen((prev) => !prev)}
        isNotifPanelOpen={isNotifPanelOpen}
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
            {/* Collapsible Notification Center toggled by Header Bell (Alarm) Button */}
            {isNotifPanelOpen && (
              <NotificationCenterPanel
                notifications={activeNotifications}
                onNavigateTab={setCurrentTab}
                onOpenNotifConfig={() => setIsNotifConfigOpen(true)}
                onClose={() => setIsNotifPanelOpen(false)}
              />
            )}

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
                    tripSheets={tripSheets}
                    equipmentList={equipmentList}
                    pocketFlows={pocketFlows}
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
                    accounts={accounts}
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
                    drivers={drivers}
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
                    paymentMethods={paymentMethods}
                    companyDeposits={companyDeposits}
                    equipmentList={equipmentList}
                    pocketFlows={pocketFlows}
                    drivers={drivers}
                    adminStaff={adminStaff}
                    initialSubTab="general_cash"
                    userRole={userRole}
                    onOpenRoleMatrix={() => setIsRoleMatrixModalOpen(true)}
                    onAddFinance={handleAddFinance}
                    onUpdateFinance={handleUpdateFinance}
                    onDeleteFinance={handleDeleteFinance}
                    onAddAccount={handleAddAccount}
                    onUpdateAccount={handleUpdateAccount}
                    onDeleteAccount={handleDeleteAccount}
                    onTransferBalance={handleTransferBalance}
                    onAddCompanyDeposit={handleAddCompanyDeposit}
                    onUpdateCompanyDeposit={handleUpdateCompanyDeposit}
                    onDeleteCompanyDeposit={handleDeleteCompanyDeposit}
                    onTopUpCompanyDeposit={handleTopUpCompanyDeposit}
                    onAddEquipment={handleAddEquipment}
                    onUpdateEquipment={handleUpdateEquipment}
                    onDeleteEquipment={handleDeleteEquipment}
                    onAddPocketFlow={handleAddPocketFlow}
                    onUpdatePocketFlow={handleUpdatePocketFlow}
                    onDeletePocketFlow={handleDeletePocketFlow}
                    onNavigateToMasterNonRental={() => setCurrentTab('master_non_rental')}
                    onNavigateToMasterPaymentMethods={() => setCurrentTab('master_payment_methods')}
                  />
                )}

                {currentTab === 'finance_pocket' && (
                  <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Modul Terpisah &amp; Terintegrasi
                        </span>
                        <span>
                          Data <strong>Arus Kas Saku Driver</strong> tersimpan di modul mandiri &amp; otomatis terintegrasi dengan Buku Kas Operasional, Deposit Perusahaan, dan Trip Sheet.
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isTabPermitted(userRole, 'tripsheet', authSession?.allowedTabs) && (
                          <button
                            onClick={() => setCurrentTab('tripsheet')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] transition cursor-pointer"
                          >
                            Buka Trip Sheet
                          </button>
                        )}
                        {isTabPermitted(userRole, 'finance', authSession?.allowedTabs) && (
                          <button
                            onClick={() => setCurrentTab('finance')}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-semibold text-[11px] transition cursor-pointer"
                          >
                            Buka Buku Kas Operasional
                          </button>
                        )}
                      </div>
                    </div>
                    <DriverPocketMoneyManager
                      pocketFlows={pocketFlows}
                      vehicles={vehicles}
                      drivers={drivers}
                      adminStaff={adminStaff}
                      accounts={accounts}
                      companyDeposits={companyDeposits}
                      userRole={userRole}
                      onAddPocketFlow={handleAddPocketFlow}
                      onUpdatePocketFlow={handleUpdatePocketFlow}
                      onDeletePocketFlow={handleDeletePocketFlow}
                      onOpenRoleMatrix={() => setIsRoleMatrixModalOpen(true)}
                    />
                  </div>
                )}

                {currentTab === 'finance_equipment' && (
                  <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                          Modul Terpisah &amp; Terintegrasi
                        </span>
                        <span>
                          Data <strong>Arus Kas Peralatan Armada</strong> tersimpan di modul mandiri &amp; otomatis terintegrasi dengan Buku Kas Operasional, Deposit Perusahaan, dan Gudang.
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isTabPermitted(userRole, 'sparepart_inventory', authSession?.allowedTabs) && (
                          <button
                            onClick={() => setCurrentTab('sparepart_inventory')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] transition cursor-pointer"
                          >
                            Buka Inventory Sparepart
                          </button>
                        )}
                        {isTabPermitted(userRole, 'finance', authSession?.allowedTabs) && (
                          <button
                            onClick={() => setCurrentTab('finance')}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-semibold text-[11px] transition cursor-pointer"
                          >
                            Buka Buku Kas Operasional
                          </button>
                        )}
                      </div>
                    </div>
                    <EquipmentCashFlowManager
                      equipmentList={equipmentList}
                      vehicles={vehicles}
                      drivers={drivers}
                      adminStaff={adminStaff}
                      accounts={accounts}
                      userRole={userRole}
                      onAddEquipment={handleAddEquipment}
                      onUpdateEquipment={handleUpdateEquipment}
                      onDeleteEquipment={handleDeleteEquipment}
                      onOpenRoleMatrix={() => setIsRoleMatrixModalOpen(true)}
                    />
                  </div>
                )}

                {(currentTab === 'master_hub' ||
                  currentTab === 'master_payment_methods' ||
                  currentTab === 'master_company_accounts' ||
                  currentTab === 'master_service_types' ||
                  currentTab === 'master_sim_classes' ||
                  currentTab === 'master_non_rental' ||
                  currentTab === 'master_deposit_companies' ||
                  currentTab === 'master_vehicles' ||
                  currentTab === 'master_drivers' ||
                  currentTab === 'master_admin_staff' ||
                  currentTab === 'master_suppliers' ||
                  currentTab === 'master_expense_categories') && (
                  <MasterDataHub
                    initialSubTab={
                      currentTab === 'master_deposit_companies'
                        ? 'deposit_companies'
                        : currentTab === 'master_vehicles'
                        ? 'vehicles'
                        : currentTab === 'master_drivers'
                        ? 'drivers'
                        : currentTab === 'master_admin_staff'
                        ? 'admin_staff'
                        : currentTab === 'master_suppliers'
                        ? 'equipment_suppliers'
                        : currentTab === 'master_expense_categories'
                        ? 'expense_categories'
                        : currentTab === 'master_company_accounts'
                        ? 'company_accounts'
                        : currentTab === 'master_service_types'
                        ? 'service_types'
                        : currentTab === 'master_sim_classes'
                        ? 'sim_classes'
                        : currentTab === 'master_non_rental'
                        ? 'non_rental'
                        : currentTab === 'master_payment_methods'
                        ? 'payment_methods'
                        : 'deposit_companies'
                    }
                    paymentMethods={paymentMethods}
                    serviceTypes={serviceTypes}
                    simClasses={simClasses}
                    nonRentalCategories={nonRentalCategories}
                    accounts={accounts}
                    finances={finances}
                    companies={companyDeposits}
                    topUpHistory={depositTopUps}
                    depositRequests={depositRequests}
                    suppliers={suppliers}
                    expenseCategories={expenseCategories}
                    adminStaff={adminStaff}
                    vehicles={vehicles}
                    drivers={drivers}
                    userRole={userRole}
                    onAddPaymentMethod={handleAddPaymentMethod}
                    onUpdatePaymentMethod={handleUpdatePaymentMethod}
                    onDeletePaymentMethod={handleDeletePaymentMethod}
                    onAddAccount={handleAddAccount}
                    onUpdateAccount={handleUpdateAccount}
                    onDeleteAccount={handleDeleteAccount}
                    onAddServiceType={handleAddServiceType}
                    onUpdateServiceType={handleUpdateServiceType}
                    onDeleteServiceType={handleDeleteServiceType}
                    onAddSimClass={handleAddSimClass}
                    onUpdateSimClass={handleUpdateSimClass}
                    onDeleteSimClass={handleDeleteSimClass}
                    onAddNonRentalCategory={handleAddNonRentalCategory}
                    onUpdateNonRentalCategory={handleUpdateNonRentalCategory}
                    onDeleteNonRentalCategory={handleDeleteNonRentalCategory}
                    onAddCompany={handleAddCompanyDeposit}
                    onUpdateCompany={handleUpdateCompanyDeposit}
                    onDeleteCompany={handleDeleteCompanyDeposit}
                    onTopUpDeposit={handleTopUpDepositRecord}
                    onAddDepositRequest={handleAddDepositRequest}
                    onUpdateDepositRequest={handleUpdateDepositRequest}
                    onDeleteDepositRequest={handleDeleteDepositRequest}
                    onApproveDepositRequest={handleApproveDepositRequest}
                    onCompleteDepositRequest={handleCompleteDepositRequest}
                    onRejectDepositRequest={handleRejectDepositRequest}
                    onAddSupplier={handleAddSupplier}
                    onUpdateSupplier={handleUpdateSupplier}
                    onDeleteSupplier={handleDeleteSupplier}
                    onAddExpenseCategory={handleAddExpenseCategory}
                    onUpdateExpenseCategory={handleUpdateExpenseCategory}
                    onDeleteExpenseCategory={handleDeleteExpenseCategory}
                    onAddAdminStaff={handleAddAdminStaff}
                    onUpdateAdminStaff={handleUpdateAdminStaff}
                    onDeleteAdminStaff={handleDeleteAdminStaff}
                    onAddDriver={handleAddDriver}
                    onUpdateDriver={handleUpdateDriver}
                    onDeleteDriver={handleDeleteDriver}
                    onNavigateToVehicles={() => setCurrentTab('vehicles')}
                    onNavigateToDrivers={() => setCurrentTab('drivers')}
                    onOpenAddFinanceModal={() => {
                      setCurrentTab('finance');
                    }}
                    onOpenRoleMatrix={() => setIsRoleMatrixModalOpen(true)}
                  />
                )}

                {currentTab === 'timesheet' && (
                  <TimesheetManager
                    timesheets={timesheets}
                    vehicles={vehicles}
                    tripSheets={tripSheets}
                    drivers={drivers}
                    userRole={userRole}
                    onOpenRoleMatrix={() => setIsRoleMatrixModalOpen(true)}
                    onAddTimesheet={handleAddTimesheet}
                    onUpdateTimesheet={handleUpdateTimesheet}
                    onDeleteTimesheet={handleDeleteTimesheet}
                  />
                )}

                {currentTab === 'tripsheet' && (
                  <TripSheetManager
                    tripSheets={tripSheets}
                    vehicles={vehicles}
                    drivers={drivers}
                    accounts={accounts}
                    userRole={userRole}
                    onAddTripSheet={handleAddTripSheet}
                    onUpdateTripSheet={handleUpdateTripSheet}
                    onDeleteTripSheet={handleDeleteTripSheet}
                    onOpenRoleMatrix={() => setIsRoleMatrixModalOpen(true)}
                    onQuickDisbursePocketMoney={() => {
                      setCurrentTab('finance_pocket');
                    }}
                  />
                )}

                {currentTab === 'maintenance' && (
                  <MaintenanceManager
                    maintenance={maintenance}
                    vehicles={vehicles}
                    drivers={drivers}
                    serviceTypes={serviceTypes}
                    sparepartInventory={sparepartInventory}
                    userRole={userRole}
                    onOpenRoleMatrix={() => setIsRoleMatrixModalOpen(true)}
                    onNavigateToInventory={() => setCurrentTab('sparepart_inventory')}
                    onAddMaintenance={handleAddMaintenance}
                    onUpdateMaintenance={handleUpdateMaintenance}
                    onDeleteMaintenance={handleDeleteMaintenance}
                  />
                )}

                {currentTab === 'sparepart_inventory' && (
                  <SparepartInventoryManager
                    inventory={sparepartInventory}
                    movements={sparepartMovements}
                    vehicles={vehicles}
                    drivers={drivers}
                    suppliers={suppliers}
                    adminStaff={adminStaff}
                    userRole={userRole}
                    onOpenRoleMatrix={() => setIsRoleMatrixModalOpen(true)}
                    onAddSparepart={handleAddSparepartItem}
                    onUpdateSparepart={handleUpdateSparepartItem}
                    onDeleteSparepart={handleDeleteSparepartItem}
                    onRecordMovement={handleRecordSparepartMovement}
                    onDeleteMovement={handleDeleteSparepartMovement}
                  />
                )}

                {currentTab === 'drivers' && (
                  <DriverManager
                    drivers={drivers}
                    vehicles={vehicles}
                    simClasses={simClasses}
                    tripSheets={tripSheets}
                    pocketFlows={pocketFlows}
                    equipmentList={equipmentList}
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
                    tripSheets={tripSheets}
                    equipmentList={equipmentList}
                    pocketFlows={pocketFlows}
                    companyDeposits={companyDeposits}
                    depositTopUps={depositTopUps}
                    depositRequests={depositRequests}
                    accounts={accounts}
                    suppliers={suppliers}
                    drivers={drivers}
                    adminStaff={adminStaff}
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

      {/* Google Apps Script Deploy Modal - Strictly Restricted to Owner Role Only */}
      {userRole === 'owner' && (authSession?.userRole || userRole) === 'owner' && (
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
            pocketFlows,
            equipmentFlows: equipmentList,
            tripSheets,
            timesheets,
            maintenance,
            sparepartInventory,
            sparepartMovements,
            drivers,
            accounts,
            companyDeposits,
            users,
            auditLogs: activityLogs.slice(0, 250)
          }}
        />
      )}

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
