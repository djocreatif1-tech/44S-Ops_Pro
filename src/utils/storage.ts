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
} from '../types';

import {
  INITIAL_VEHICLES,
  INITIAL_TAX_RECORDS,
  INITIAL_FUEL_LOGS,
  INITIAL_FINANCES,
  INITIAL_TIMESHEETS,
  INITIAL_MAINTENANCE,
  INITIAL_DRIVERS,
  DEFAULT_SHEETS_CONFIG,
  INITIAL_ACCOUNTS,
  DEFAULT_NOTIFICATION_CONFIG,
  INITIAL_NON_RENTAL_CATEGORIES,
  INITIAL_PAYMENT_METHODS,
  INITIAL_SERVICE_TYPES,
  INITIAL_SIM_CLASSES,
  INITIAL_USER_ACCOUNTS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_COMPANY_DEPOSITS,
  INITIAL_EQUIPMENT_CASH_FLOWS,
  INITIAL_DRIVER_POCKET_FLOWS,
  INITIAL_TRIP_SHEETS,
  INITIAL_EQUIPMENT_SUPPLIERS,
  INITIAL_EXPENSE_CATEGORIES,
  INITIAL_ADMIN_STAFF,
  INITIAL_DEPOSIT_TOPUP_RECORDS,
  INITIAL_DEPOSIT_REQUESTS,
  INITIAL_SPAREPART_INVENTORY,
  INITIAL_SPAREPART_MOVEMENTS,
  DUMMY_RECORD_IDS
} from '../data/initialData';

const STORAGE_KEYS = {
  VEHICLES: 'fleetops_vehicles_v1',
  TAXES: 'fleetops_taxes_v1',
  FUEL_LOGS: 'fleetops_fuel_logs_v1',
  FINANCES: 'fleetops_finances_v1',
  TIMESHEETS: 'fleetops_timesheets_v1',
  MAINTENANCE: 'fleetops_maintenance_v1',
  DRIVERS: 'fleetops_drivers_v1',
  CONFIG: 'fleetops_gas_config_v1',
  ACCOUNTS: 'fleetops_accounts_v1',
  NOTIF_CONFIG: 'fleetops_notif_config_v1',
  NON_RENTAL_CATEGORIES: 'fleetops_non_rental_cats_v1',
  PAYMENT_METHODS: 'fleetops_payment_methods_v1',
  SERVICE_TYPES: 'fleetops_service_types_v1',
  SIM_CLASSES: 'fleetops_sim_classes_v1',
  COMPANY_DEPOSITS: 'fleetops_company_deposits_v1',
  USER_ROLE: 'fleetops_user_role_v1',
  USERS: 'fleetops_users_v1',
  LOGS: 'fleetops_activity_logs_v1',
  AUTH_SESSION: 'fleetops_auth_session_v1',
  IS_LOCKED: 'fleetops_is_locked_v1',
  EQUIPMENT: 'fleetops_equipment_v1',
  POCKET_FLOWS: 'fleetops_pocket_flows_v1',
  TRIP_SHEETS: 'fleetops_trip_sheets_v1',
  EQUIPMENT_SUPPLIERS: 'fleetops_suppliers_v1',
  EXPENSE_CATEGORIES: 'fleetops_expense_categories_v1',
  ADMIN_STAFF: 'fleetops_admin_staff_v1',
  DEPOSIT_TOPUP_HISTORY: 'fleetops_deposit_topups_v1',
  DEPOSIT_REQUESTS: 'fleetops_deposit_requests_v1',
  SPAREPART_INVENTORY: 'fleetops_sparepart_inventory_v1',
  SPAREPART_MOVEMENTS: 'fleetops_sparepart_movements_v1'
};

const DUMMY_ID_SET = new Set(DUMMY_RECORD_IDS);
const DUMMY_COMPANIES = new Set([
  'PT Sumber Makmur Mineral',
  'PT Antar Lintas Logistik Nusantara',
  'CV Berkah Perkasa Abadi',
  'PT Cipta Bangun Konstruksi',
  'PT Sinar Surya Persada',
  'PT Krakatau Logistik Nusantara'
]);
const DUMMY_PLATES = new Set([
  'B 9482 TDE',
  'B 9104 KQA',
  'B 9812 UXA',
  'B 9231 KJD',
  'B 9550 TLA',
  'B 9773 UWB'
]);

export function stripDummyRecords<T>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item: any) => {
    if (!item || typeof item !== 'object') return false;
    if (item.id && DUMMY_ID_SET.has(String(item.id))) return false;
    if (item.companyName && DUMMY_COMPANIES.has(String(item.companyName))) return false;
    if (item.nopol && DUMMY_PLATES.has(String(item.nopol))) return false;
    if (item.plateNumber && DUMMY_PLATES.has(String(item.plateNumber))) return false;
    return true;
  });
}

const REFERENCE_KEYS = new Set([
  STORAGE_KEYS.USERS,
  STORAGE_KEYS.PAYMENT_METHODS,
  STORAGE_KEYS.SERVICE_TYPES,
  STORAGE_KEYS.SIM_CLASSES
]);

function readStoredArray<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      if (REFERENCE_KEYS.has(key)) {
        return parsed;
      }
      const cleaned = stripDummyRecords<T>(parsed);
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(key, JSON.stringify(cleaned));
      }
      return cleaned;
    }
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  } catch {
    return fallback;
  }
}

function writeStoredArray<T>(key: string, data: T[]) {
  if (!Array.isArray(data)) return;
  const toSave = REFERENCE_KEYS.has(key) ? data : stripDummyRecords(data);
  localStorage.setItem(key, JSON.stringify(toSave));
}

import { normalizeAllowedModules } from './permissions';

export const isRunningInGAS = (): boolean => {
  return typeof window !== 'undefined' && Boolean((window as any).google?.script?.run);
};

export const getStoredAuthSession = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return {
          ...parsed,
          allowedTabs: normalizeAllowedModules(parsed.allowedTabs, parsed.userRole)
        };
      }
    }
    if (localStorage.getItem('fleetops_logged_out_v1') === 'true') {
      return null;
    }
    const ownerAccount = INITIAL_USER_ACCOUNTS.find((u) => u.role === 'owner') || INITIAL_USER_ACCOUNTS[0];
    const defaultSession: AuthSession = {
      userId: ownerAccount.id,
      username: ownerAccount.username,
      userName: ownerAccount.name,
      userRole: ownerAccount.role,
      email: ownerAccount.email,
      department: ownerAccount.department,
      loginTime: new Date().toISOString(),
      allowedTabs: normalizeAllowedModules(ownerAccount.allowedTabs, ownerAccount.role)
    };
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(defaultSession));
    return defaultSession;
  } catch {
    return null;
  }
};

export const saveStoredAuthSession = (session: AuthSession | null) => {
  if (session) {
    localStorage.removeItem('fleetops_logged_out_v1');
    localStorage.setItem(
      STORAGE_KEYS.AUTH_SESSION,
      JSON.stringify({
        ...session,
        allowedTabs: normalizeAllowedModules(session.allowedTabs, session.userRole, true)
      })
    );
  } else {
    localStorage.setItem('fleetops_logged_out_v1', 'true');
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  }
};

export const getStoredIsLocked = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEYS.IS_LOCKED) === 'true';
  } catch {
    return false;
  }
};

export const saveStoredIsLocked = (locked: boolean) => {
  localStorage.setItem(STORAGE_KEYS.IS_LOCKED, locked ? 'true' : 'false');
};

export const getStoredActivityLogs = (): ActivityLog[] => {
  return readStoredArray(STORAGE_KEYS.LOGS, INITIAL_ACTIVITY_LOGS);
};

export const saveStoredActivityLogs = (data: ActivityLog[]) => {
  writeStoredArray(STORAGE_KEYS.LOGS, data);
};

export const addStoredActivityLog = (log: ActivityLog): ActivityLog[] => {
  const current = getStoredActivityLogs();
  const updated = [log, ...current];
  saveStoredActivityLogs(updated);
  return updated;
};

export const clearStoredActivityLogs = () => {
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
};

export const getStoredUserAccounts = (): UserAccount[] => {
  const accounts = readStoredArray(STORAGE_KEYS.USERS, INITIAL_USER_ACCOUNTS);
  const normalized = accounts.map((u) => ({
    ...u,
    allowedTabs: normalizeAllowedModules(u.allowedTabs, u.role)
  }));
  writeStoredArray(STORAGE_KEYS.USERS, normalized);
  return normalized;
};

export const saveStoredUserAccounts = (data: UserAccount[]) => {
  const normalized = Array.isArray(data)
    ? data.map((u) => ({
        ...u,
        allowedTabs: normalizeAllowedModules(u.allowedTabs, u.role, true)
      }))
    : [];
  writeStoredArray(STORAGE_KEYS.USERS, normalized);
};

const VALID_ROLES: UserRole[] = ['owner', 'admin1', 'admin2'];

export const getStoredUserRole = (): UserRole => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    if (raw && VALID_ROLES.includes(raw as UserRole)) {
      return raw as UserRole;
    }
    return 'owner';
  } catch {
    return 'owner';
  }
};

export const saveStoredUserRole = (role: UserRole) => {
  if (typeof role === 'string' && VALID_ROLES.includes(role)) {
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
  }
};

export const getStoredNonRentalCategories = (): NonRentalIncomeCategory[] => {
  return readStoredArray(STORAGE_KEYS.NON_RENTAL_CATEGORIES, INITIAL_NON_RENTAL_CATEGORIES);
};

export const saveStoredNonRentalCategories = (data: NonRentalIncomeCategory[]) => {
  writeStoredArray(STORAGE_KEYS.NON_RENTAL_CATEGORIES, data);
};

export const getStoredPaymentMethods = (): PaymentMethod[] => {
  return readStoredArray(STORAGE_KEYS.PAYMENT_METHODS, INITIAL_PAYMENT_METHODS);
};

export const saveStoredPaymentMethods = (data: PaymentMethod[]) => {
  writeStoredArray(STORAGE_KEYS.PAYMENT_METHODS, data);
};

export const getStoredServiceTypes = (): ServiceTypeReference[] => {
  return readStoredArray(STORAGE_KEYS.SERVICE_TYPES, INITIAL_SERVICE_TYPES);
};

export const saveStoredServiceTypes = (data: ServiceTypeReference[]) => {
  writeStoredArray(STORAGE_KEYS.SERVICE_TYPES, data);
};

export const getStoredSimClasses = (): SimClassReference[] => {
  return readStoredArray(STORAGE_KEYS.SIM_CLASSES, INITIAL_SIM_CLASSES);
};

export const saveStoredSimClasses = (data: SimClassReference[]) => {
  writeStoredArray(STORAGE_KEYS.SIM_CLASSES, data);
};

export const getStoredAccounts = (): FinancialAccount[] => {
  return readStoredArray(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
};

export const saveStoredAccounts = (data: FinancialAccount[]) => {
  writeStoredArray(STORAGE_KEYS.ACCOUNTS, data);
};

export const getStoredCompanyDeposits = (): CompanyDeposit[] => {
  return readStoredArray(STORAGE_KEYS.COMPANY_DEPOSITS, INITIAL_COMPANY_DEPOSITS);
};

export const saveStoredCompanyDeposits = (data: CompanyDeposit[]) => {
  writeStoredArray(STORAGE_KEYS.COMPANY_DEPOSITS, data);
};

export const getStoredNotificationConfig = (): NotificationConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIF_CONFIG);
    if (!raw) return DEFAULT_NOTIFICATION_CONFIG;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      typeof parsed.taxAlertDaysBefore === 'number'
    ) {
      return { ...DEFAULT_NOTIFICATION_CONFIG, ...parsed };
    }
    localStorage.setItem(STORAGE_KEYS.NOTIF_CONFIG, JSON.stringify(DEFAULT_NOTIFICATION_CONFIG));
    return DEFAULT_NOTIFICATION_CONFIG;
  } catch {
    return DEFAULT_NOTIFICATION_CONFIG;
  }
};

export const saveStoredNotificationConfig = (data: NotificationConfig) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return;
  localStorage.setItem(STORAGE_KEYS.NOTIF_CONFIG, JSON.stringify(data));
};

export const getStoredVehicles = (): Vehicle[] => {
  return readStoredArray(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES);
};

export const saveStoredVehicles = (data: Vehicle[]) => {
  writeStoredArray(STORAGE_KEYS.VEHICLES, data);
};

export const getStoredTaxes = (): TaxRecord[] => {
  return readStoredArray(STORAGE_KEYS.TAXES, INITIAL_TAX_RECORDS);
};

export const saveStoredTaxes = (data: TaxRecord[]) => {
  writeStoredArray(STORAGE_KEYS.TAXES, data);
};

export const getStoredFuelLogs = (): FuelLog[] => {
  return readStoredArray(STORAGE_KEYS.FUEL_LOGS, INITIAL_FUEL_LOGS);
};

export const saveStoredFuelLogs = (data: FuelLog[]) => {
  writeStoredArray(STORAGE_KEYS.FUEL_LOGS, data);
};

export const getStoredFinances = (): OperationalFinance[] => {
  const stored = readStoredArray(STORAGE_KEYS.FINANCES, INITIAL_FINANCES);
  return stored.map((item) => {
    const initialMatch = INITIAL_FINANCES.find((init) => init.id === item.id);
    if (!initialMatch) return item;
    return {
      ...initialMatch,
      ...item,
      driverId: item.driverId || initialMatch.driverId,
      driverNip: item.driverNip || initialMatch.driverNip,
      driverName: item.driverName || initialMatch.driverName,
      handoverBy: item.handoverBy || initialMatch.handoverBy,
      receivedBy: item.receivedBy || initialMatch.receivedBy,
      handoverRole: item.handoverRole || initialMatch.handoverRole
    };
  });
};

export const saveStoredFinances = (data: OperationalFinance[]) => {
  writeStoredArray(STORAGE_KEYS.FINANCES, data);
};

export const getStoredTimesheets = (): DriverTimesheet[] => {
  return readStoredArray(STORAGE_KEYS.TIMESHEETS, INITIAL_TIMESHEETS);
};

export const saveStoredTimesheets = (data: DriverTimesheet[]) => {
  writeStoredArray(STORAGE_KEYS.TIMESHEETS, data);
};

export const getStoredMaintenance = (): MaintenanceRecord[] => {
  return readStoredArray(STORAGE_KEYS.MAINTENANCE, INITIAL_MAINTENANCE);
};

export const saveStoredMaintenance = (data: MaintenanceRecord[]) => {
  writeStoredArray(STORAGE_KEYS.MAINTENANCE, data);
};

export const getStoredDrivers = (): Driver[] => {
  const stored = readStoredArray(STORAGE_KEYS.DRIVERS, INITIAL_DRIVERS);
  const merged = stored.map((d) => {
    const initialMatch = INITIAL_DRIVERS.find((init) => init.id === d.id || init.name === d.name);
    if (!initialMatch) return d;
    return {
      ...initialMatch,
      ...d,
      nip: d.nip || initialMatch.nip,
      employmentType: d.employmentType || initialMatch.employmentType,
      jobTitle: d.jobTitle || initialMatch.jobTitle,
      department: d.department || initialMatch.department,
      companyName: d.companyName || initialMatch.companyName,
      bankName: d.bankName || initialMatch.bankName,
      bankAccountNumber: d.bankAccountNumber || initialMatch.bankAccountNumber,
      helperName: d.helperName || initialMatch.helperName,
      assignedVehicle: d.assignedVehicle || initialMatch.assignedVehicle
    };
  });
  INITIAL_DRIVERS.forEach((initDriver) => {
    if (!merged.some((d) => d.id === initDriver.id || d.name === initDriver.name)) {
      merged.push(initDriver);
    }
  });
  return merged;
};

export const saveStoredDrivers = (data: Driver[]) => {
  writeStoredArray(STORAGE_KEYS.DRIVERS, data);
};

export const getStoredConfig = (): GoogleSheetsConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    const envUrl = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_APPS_SCRIPT_URL;
    
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.webAppUrl && parsed.webAppUrl.trim().length > 0) {
        return parsed;
      }
    }

    if (isRunningInGAS()) {
      return {
        ...DEFAULT_SHEETS_CONFIG,
        webAppUrl: typeof window !== 'undefined' ? window.location.href : 'GAS_NATIVE_RUNTIME',
        isConnected: true,
        autoSync: true
      };
    }
    
    if (envUrl && typeof envUrl === 'string' && envUrl.startsWith('http')) {
      return {
        ...DEFAULT_SHEETS_CONFIG,
        webAppUrl: envUrl,
        isConnected: true
      };
    }
    
    return raw ? JSON.parse(raw) : DEFAULT_SHEETS_CONFIG;
  } catch {
    return DEFAULT_SHEETS_CONFIG;
  }
};

export const saveStoredConfig = (config: GoogleSheetsConfig) => {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
};

export const loadGoogleSheetsConfig = getStoredConfig;
export const saveGoogleSheetsConfig = saveStoredConfig;

export const getStoredEquipment = (): EquipmentCashFlow[] => {
  const stored = readStoredArray(STORAGE_KEYS.EQUIPMENT, INITIAL_EQUIPMENT_CASH_FLOWS);
  return stored.map((item) => {
    const initialMatch = INITIAL_EQUIPMENT_CASH_FLOWS.find((init) => init.id === item.id);
    if (!initialMatch) return item;
    return {
      ...initialMatch,
      ...item,
      recipientDriverId: item.recipientDriverId || initialMatch.recipientDriverId,
      recipientName: item.recipientName || initialMatch.recipientName,
      recipientNip: item.recipientNip || initialMatch.recipientNip,
      recipientRole: item.recipientRole || initialMatch.recipientRole,
      handoverBy: item.handoverBy || initialMatch.handoverBy
    };
  });
};

export const saveStoredEquipment = (data: EquipmentCashFlow[]) => {
  writeStoredArray(STORAGE_KEYS.EQUIPMENT, data);
};

export const getStoredPocketFlows = (): DriverPocketCashFlow[] => {
  const stored = readStoredArray(STORAGE_KEYS.POCKET_FLOWS, INITIAL_DRIVER_POCKET_FLOWS);
  return stored.map((item) => {
    const initialMatch = INITIAL_DRIVER_POCKET_FLOWS.find((init) => init.id === item.id);
    if (!initialMatch) return item;
    return {
      ...initialMatch,
      ...item,
      driverNip: item.driverNip || initialMatch.driverNip,
      disbursedBy: item.disbursedBy || initialMatch.disbursedBy,
      receivedBy: item.receivedBy || initialMatch.receivedBy
    };
  });
};

export const saveStoredPocketFlows = (data: DriverPocketCashFlow[]) => {
  writeStoredArray(STORAGE_KEYS.POCKET_FLOWS, data);
};

export const getStoredTripSheets = (): TripSheet[] => {
  return readStoredArray(STORAGE_KEYS.TRIP_SHEETS, INITIAL_TRIP_SHEETS);
};

export const saveStoredTripSheets = (data: TripSheet[]) => {
  writeStoredArray(STORAGE_KEYS.TRIP_SHEETS, data);
};

export const getStoredEquipmentSuppliers = (): EquipmentSupplier[] => {
  return readStoredArray(STORAGE_KEYS.EQUIPMENT_SUPPLIERS, INITIAL_EQUIPMENT_SUPPLIERS);
};

export const saveStoredEquipmentSuppliers = (data: EquipmentSupplier[]) => {
  writeStoredArray(STORAGE_KEYS.EQUIPMENT_SUPPLIERS, data);
};

export const getStoredExpenseCategories = (): ExpenseCategoryReference[] => {
  return readStoredArray(STORAGE_KEYS.EXPENSE_CATEGORIES, INITIAL_EXPENSE_CATEGORIES);
};

export const saveStoredExpenseCategories = (data: ExpenseCategoryReference[]) => {
  writeStoredArray(STORAGE_KEYS.EXPENSE_CATEGORIES, data);
};

export const getStoredAdminStaff = (): AdminStaff[] => {
  const stored = readStoredArray(STORAGE_KEYS.ADMIN_STAFF, INITIAL_ADMIN_STAFF);
  const merged = [...stored];
  INITIAL_ADMIN_STAFF.forEach((initStaff) => {
    if (!merged.some((s) => s.id === initStaff.id || s.nip === initStaff.nip)) {
      merged.push(initStaff);
    }
  });
  return merged;
};

export const saveStoredAdminStaff = (data: AdminStaff[]) => {
  writeStoredArray(STORAGE_KEYS.ADMIN_STAFF, data);
};

export const getStoredDepositTopUpHistory = (): DepositTopUpRecord[] => {
  return readStoredArray(STORAGE_KEYS.DEPOSIT_TOPUP_HISTORY, INITIAL_DEPOSIT_TOPUP_RECORDS);
};

export const saveStoredDepositTopUpHistory = (data: DepositTopUpRecord[]) => {
  writeStoredArray(STORAGE_KEYS.DEPOSIT_TOPUP_HISTORY, data);
};

export const getStoredDepositRequests = (): CompanyDepositRequest[] => {
  return readStoredArray(STORAGE_KEYS.DEPOSIT_REQUESTS, INITIAL_DEPOSIT_REQUESTS);
};

export const saveStoredDepositRequests = (data: CompanyDepositRequest[]) => {
  writeStoredArray(STORAGE_KEYS.DEPOSIT_REQUESTS, data);
};

export const getStoredSparepartInventory = (): SparepartInventoryItem[] => {
  return readStoredArray(STORAGE_KEYS.SPAREPART_INVENTORY, INITIAL_SPAREPART_INVENTORY);
};

export const saveStoredSparepartInventory = (data: SparepartInventoryItem[]) => {
  writeStoredArray(STORAGE_KEYS.SPAREPART_INVENTORY, data);
};

export const getStoredSparepartMovements = (): SparepartStockMovement[] => {
  return readStoredArray(STORAGE_KEYS.SPAREPART_MOVEMENTS, INITIAL_SPAREPART_MOVEMENTS);
};

export const saveStoredSparepartMovements = (data: SparepartStockMovement[]) => {
  writeStoredArray(STORAGE_KEYS.SPAREPART_MOVEMENTS, data);
};

export interface AppStoredData {
  vehicles: Vehicle[];
  taxes: TaxRecord[];
  fuelLogs: FuelLog[];
  finances: OperationalFinance[];
  timesheets: DriverTimesheet[];
  maintenance: MaintenanceRecord[];
  drivers: Driver[];
  accounts: FinancialAccount[];
  companyDeposits: CompanyDeposit[];
  notifConfig: NotificationConfig;
  nonRentalCategories: NonRentalIncomeCategory[];
  paymentMethods: PaymentMethod[];
  serviceTypes: ServiceTypeReference[];
  simClasses: SimClassReference[];
  userRole: UserRole;
  users: UserAccount[];
  activityLogs: ActivityLog[];
  equipment: EquipmentCashFlow[];
  pocketFlows: DriverPocketCashFlow[];
  tripSheets: TripSheet[];
  suppliers: EquipmentSupplier[];
  expenseCategories: ExpenseCategoryReference[];
  adminStaff: AdminStaff[];
  depositTopUps: DepositTopUpRecord[];
  depositRequests: CompanyDepositRequest[];
  sparepartInventory: SparepartInventoryItem[];
  sparepartMovements: SparepartStockMovement[];
}

export const loadStoredData = (): AppStoredData => {
  return {
    vehicles: getStoredVehicles(),
    taxes: getStoredTaxes(),
    fuelLogs: getStoredFuelLogs(),
    finances: getStoredFinances(),
    timesheets: getStoredTimesheets(),
    maintenance: getStoredMaintenance(),
    drivers: getStoredDrivers(),
    accounts: getStoredAccounts(),
    companyDeposits: getStoredCompanyDeposits(),
    notifConfig: getStoredNotificationConfig(),
    nonRentalCategories: getStoredNonRentalCategories(),
    paymentMethods: getStoredPaymentMethods(),
    serviceTypes: getStoredServiceTypes(),
    simClasses: getStoredSimClasses(),
    userRole: getStoredUserRole(),
    users: getStoredUserAccounts(),
    activityLogs: getStoredActivityLogs(),
    equipment: getStoredEquipment(),
    pocketFlows: getStoredPocketFlows(),
    tripSheets: getStoredTripSheets(),
    suppliers: getStoredEquipmentSuppliers(),
    expenseCategories: getStoredExpenseCategories(),
    adminStaff: getStoredAdminStaff(),
    depositTopUps: getStoredDepositTopUpHistory(),
    depositRequests: getStoredDepositRequests(),
    sparepartInventory: getStoredSparepartInventory(),
    sparepartMovements: getStoredSparepartMovements()
  };
};

export const saveStoredData = (data: Partial<AppStoredData>) => {
  if (Array.isArray(data.vehicles)) saveStoredVehicles(data.vehicles);
  if (Array.isArray(data.taxes)) saveStoredTaxes(data.taxes);
  if (Array.isArray(data.fuelLogs)) saveStoredFuelLogs(data.fuelLogs);
  if (Array.isArray(data.finances)) saveStoredFinances(data.finances);
  if (Array.isArray(data.timesheets)) saveStoredTimesheets(data.timesheets);
  if (Array.isArray(data.maintenance)) saveStoredMaintenance(data.maintenance);
  if (Array.isArray(data.drivers)) saveStoredDrivers(data.drivers);
  if (Array.isArray(data.accounts)) saveStoredAccounts(data.accounts);
  if (Array.isArray(data.companyDeposits)) saveStoredCompanyDeposits(data.companyDeposits);
  if (data.notifConfig && typeof data.notifConfig === 'object' && !Array.isArray(data.notifConfig)) {
    saveStoredNotificationConfig(data.notifConfig);
  }
  if (Array.isArray(data.nonRentalCategories)) saveStoredNonRentalCategories(data.nonRentalCategories);
  if (Array.isArray(data.paymentMethods)) saveStoredPaymentMethods(data.paymentMethods);
  if (Array.isArray(data.serviceTypes)) saveStoredServiceTypes(data.serviceTypes);
  if (Array.isArray(data.simClasses)) saveStoredSimClasses(data.simClasses);
  if (typeof data.userRole === 'string') saveStoredUserRole(data.userRole);
  if (Array.isArray(data.users)) saveStoredUserAccounts(data.users);
  if (Array.isArray(data.activityLogs)) saveStoredActivityLogs(data.activityLogs);
  if (Array.isArray(data.equipment)) saveStoredEquipment(data.equipment);
  if (Array.isArray(data.pocketFlows)) saveStoredPocketFlows(data.pocketFlows);
  if (Array.isArray(data.tripSheets)) saveStoredTripSheets(data.tripSheets);
  if (Array.isArray(data.suppliers)) saveStoredEquipmentSuppliers(data.suppliers);
  if (Array.isArray(data.expenseCategories)) saveStoredExpenseCategories(data.expenseCategories);
  if (Array.isArray(data.adminStaff)) saveStoredAdminStaff(data.adminStaff);
  if (Array.isArray(data.depositTopUps)) saveStoredDepositTopUpHistory(data.depositTopUps);
  if (Array.isArray(data.depositRequests)) saveStoredDepositRequests(data.depositRequests);
  if (Array.isArray(data.sparepartInventory)) saveStoredSparepartInventory(data.sparepartInventory);
  if (Array.isArray(data.sparepartMovements)) saveStoredSparepartMovements(data.sparepartMovements);
};

export const resetAllToDefault = () => {
  localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(INITIAL_VEHICLES));
  localStorage.setItem(STORAGE_KEYS.TAXES, JSON.stringify(INITIAL_TAX_RECORDS));
  localStorage.setItem(STORAGE_KEYS.FUEL_LOGS, JSON.stringify(INITIAL_FUEL_LOGS));
  localStorage.setItem(STORAGE_KEYS.FINANCES, JSON.stringify(INITIAL_FINANCES));
  localStorage.setItem(STORAGE_KEYS.TIMESHEETS, JSON.stringify(INITIAL_TIMESHEETS));
  localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(INITIAL_MAINTENANCE));
  localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(INITIAL_DRIVERS));
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(INITIAL_ACCOUNTS));
  localStorage.setItem(STORAGE_KEYS.COMPANY_DEPOSITS, JSON.stringify(INITIAL_COMPANY_DEPOSITS));
  localStorage.setItem(STORAGE_KEYS.NON_RENTAL_CATEGORIES, JSON.stringify(INITIAL_NON_RENTAL_CATEGORIES));
  localStorage.setItem(STORAGE_KEYS.PAYMENT_METHODS, JSON.stringify(INITIAL_PAYMENT_METHODS));
  localStorage.setItem(STORAGE_KEYS.SERVICE_TYPES, JSON.stringify(INITIAL_SERVICE_TYPES));
  localStorage.setItem(STORAGE_KEYS.SIM_CLASSES, JSON.stringify(INITIAL_SIM_CLASSES));
  localStorage.setItem(STORAGE_KEYS.USER_ROLE, 'owner');
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USER_ACCOUNTS));
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_ACTIVITY_LOGS));
  localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(INITIAL_EQUIPMENT_CASH_FLOWS));
  localStorage.setItem(STORAGE_KEYS.POCKET_FLOWS, JSON.stringify(INITIAL_DRIVER_POCKET_FLOWS));
  localStorage.setItem(STORAGE_KEYS.TRIP_SHEETS, JSON.stringify(INITIAL_TRIP_SHEETS));
  localStorage.setItem(STORAGE_KEYS.EQUIPMENT_SUPPLIERS, JSON.stringify(INITIAL_EQUIPMENT_SUPPLIERS));
  localStorage.setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, JSON.stringify(INITIAL_EXPENSE_CATEGORIES));
  localStorage.setItem(STORAGE_KEYS.ADMIN_STAFF, JSON.stringify(INITIAL_ADMIN_STAFF));
  localStorage.setItem(STORAGE_KEYS.DEPOSIT_TOPUP_HISTORY, JSON.stringify(INITIAL_DEPOSIT_TOPUP_RECORDS));
  localStorage.setItem(STORAGE_KEYS.DEPOSIT_REQUESTS, JSON.stringify(INITIAL_DEPOSIT_REQUESTS));
  localStorage.setItem(STORAGE_KEYS.SPAREPART_INVENTORY, JSON.stringify(INITIAL_SPAREPART_INVENTORY));
  localStorage.setItem(STORAGE_KEYS.SPAREPART_MOVEMENTS, JSON.stringify(INITIAL_SPAREPART_MOVEMENTS));
};

// Sync to remote Apps Script Web App or Native GAS HtmlService Runtime
export const fetchAppDataFromGAS = async (
  webAppUrl: string
): Promise<{ success: boolean; data?: any; message?: string }> => {
  if (isRunningInGAS()) {
    return new Promise((resolve) => {
      try {
        (window as any).google.script.run
          .withSuccessHandler((res: any) => {
            if (res && res.status === 'success' && res.data) {
              resolve({
                success: true,
                data: res.data,
                message: 'Data berhasil disinkronkan dari Google Spreadsheet.'
              });
            } else {
              resolve({
                success: false,
                message: res?.message || 'Spreadsheet belum berisi data.'
              });
            }
          })
          .withFailureHandler((err: any) => {
            resolve({
              success: false,
              message: 'Gagal membaca Google Spreadsheet: ' + String(err)
            });
          })
          .runClientApi({ action: 'getAllData' });
      } catch (e) {
        resolve({ success: false, message: String(e) });
      }
    });
  }

  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    return { success: false, message: 'URL Apps Script belum diisi.' };
  }

  try {
    const url = webAppUrl.includes('?') ? `${webAppUrl}&action=getAllData` : `${webAppUrl}?action=getAllData`;
    const response = await fetch(url);
    const result = await response.json();
    if (result && result.status === 'success' && result.data) {
      return {
        success: true,
        data: result.data,
        message: 'Data berhasil disinkronkan dari Google Spreadsheet.'
      };
    }
    return {
      success: false,
      message: result?.message || 'Format data Google Sheets tidak sesuai.'
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: 'Gagal mengambil data dari Google Apps Script: ' + errorMsg
    };
  }
};

export const syncToGoogleAppsScript = async (
  webAppUrl: string,
  action: string,
  data: unknown
): Promise<{ success: boolean; message: string }> => {
  if (isRunningInGAS()) {
    return new Promise((resolve) => {
      try {
        (window as any).google.script.run
          .withSuccessHandler((res: any) => {
            resolve({
              success: !res || res.status === 'success' || res.status === 200,
              message: res?.message || 'Data berhasil disinkronkan ke Google Spreadsheet!'
            });
          })
          .withFailureHandler((err: any) => {
            resolve({
              success: false,
              message: 'Gagal menyimpan ke Google Spreadsheet: ' + String(err)
            });
          })
          .runClientApi({ action, payload: data, data });
      } catch (e) {
        resolve({ success: false, message: String(e) });
      }
    });
  }

  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    return { success: false, message: 'URL Apps Script belum diisi.' };
  }

  const payloadString = JSON.stringify({ action, payload: data, data });

  try {
    // Standard POST with text/plain (avoids CORS preflight in Apps Script)
    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: payloadString,
    });

    try {
      const result = await response.json();
      return {
        success: result.status === 'success' || result.status === 200,
        message: result.message || 'Data berhasil disinkronkan ke Google Spreadsheet!'
      };
    } catch {
      return {
        success: true,
        message: 'Data berhasil terkirim ke Google Apps Script.'
      };
    }
  } catch (err: unknown) {
    // If blocked by CORS in browser, fallback to no-cors POST to ensure data reaches Google Apps Script
    try {
      await fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: payloadString,
      });
      return {
        success: true,
        message: 'Data berhasil dikirim ke Google Spreadsheet.'
      };
    } catch (fallbackErr: unknown) {
      const errorMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      return {
        success: false,
        message: 'Gagal mengirim ke Google Apps Script: ' + errorMsg
      };
    }
  }
};
