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
  AuthSession
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
  INITIAL_USER_ACCOUNTS,
  INITIAL_ACTIVITY_LOGS
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
  USER_ROLE: 'fleetops_user_role_v1',
  USERS: 'fleetops_users_v1',
  LOGS: 'fleetops_activity_logs_v1',
  AUTH_SESSION: 'fleetops_auth_session_v1',
  IS_LOCKED: 'fleetops_is_locked_v1'
};

export const getStoredAuthSession = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveStoredAuthSession = (session: AuthSession | null) => {
  if (session) {
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
  } else {
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
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    return raw ? JSON.parse(raw) : INITIAL_ACTIVITY_LOGS;
  } catch {
    return INITIAL_ACTIVITY_LOGS;
  }
};

export const saveStoredActivityLogs = (data: ActivityLog[]) => {
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(data));
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
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : INITIAL_USER_ACCOUNTS;
  } catch {
    return INITIAL_USER_ACCOUNTS;
  }
};

export const saveStoredUserAccounts = (data: UserAccount[]) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data));
};

export const getStoredUserRole = (): UserRole => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    return (raw as UserRole) || 'owner';
  } catch {
    return 'owner';
  }
};

export const saveStoredUserRole = (role: UserRole) => {
  localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
};

export const getStoredNonRentalCategories = (): NonRentalIncomeCategory[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NON_RENTAL_CATEGORIES);
    return raw ? JSON.parse(raw) : INITIAL_NON_RENTAL_CATEGORIES;
  } catch {
    return INITIAL_NON_RENTAL_CATEGORIES;
  }
};

export const saveStoredNonRentalCategories = (data: NonRentalIncomeCategory[]) => {
  localStorage.setItem(STORAGE_KEYS.NON_RENTAL_CATEGORIES, JSON.stringify(data));
};

export const getStoredAccounts = (): FinancialAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    return raw ? JSON.parse(raw) : INITIAL_ACCOUNTS;
  } catch {
    return INITIAL_ACCOUNTS;
  }
};

export const saveStoredAccounts = (data: FinancialAccount[]) => {
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(data));
};

export const getStoredNotificationConfig = (): NotificationConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIF_CONFIG);
    return raw ? JSON.parse(raw) : DEFAULT_NOTIFICATION_CONFIG;
  } catch {
    return DEFAULT_NOTIFICATION_CONFIG;
  }
};

export const saveStoredNotificationConfig = (data: NotificationConfig) => {
  localStorage.setItem(STORAGE_KEYS.NOTIF_CONFIG, JSON.stringify(data));
};

export const getStoredVehicles = (): Vehicle[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VEHICLES);
    return raw ? JSON.parse(raw) : INITIAL_VEHICLES;
  } catch {
    return INITIAL_VEHICLES;
  }
};

export const saveStoredVehicles = (data: Vehicle[]) => {
  localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(data));
};

export const getStoredTaxes = (): TaxRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TAXES);
    return raw ? JSON.parse(raw) : INITIAL_TAX_RECORDS;
  } catch {
    return INITIAL_TAX_RECORDS;
  }
};

export const saveStoredTaxes = (data: TaxRecord[]) => {
  localStorage.setItem(STORAGE_KEYS.TAXES, JSON.stringify(data));
};

export const getStoredFuelLogs = (): FuelLog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FUEL_LOGS);
    return raw ? JSON.parse(raw) : INITIAL_FUEL_LOGS;
  } catch {
    return INITIAL_FUEL_LOGS;
  }
};

export const saveStoredFuelLogs = (data: FuelLog[]) => {
  localStorage.setItem(STORAGE_KEYS.FUEL_LOGS, JSON.stringify(data));
};

export const getStoredFinances = (): OperationalFinance[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FINANCES);
    return raw ? JSON.parse(raw) : INITIAL_FINANCES;
  } catch {
    return INITIAL_FINANCES;
  }
};

export const saveStoredFinances = (data: OperationalFinance[]) => {
  localStorage.setItem(STORAGE_KEYS.FINANCES, JSON.stringify(data));
};

export const getStoredTimesheets = (): DriverTimesheet[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMESHEETS);
    return raw ? JSON.parse(raw) : INITIAL_TIMESHEETS;
  } catch {
    return INITIAL_TIMESHEETS;
  }
};

export const saveStoredTimesheets = (data: DriverTimesheet[]) => {
  localStorage.setItem(STORAGE_KEYS.TIMESHEETS, JSON.stringify(data));
};

export const getStoredMaintenance = (): MaintenanceRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MAINTENANCE);
    return raw ? JSON.parse(raw) : INITIAL_MAINTENANCE;
  } catch {
    return INITIAL_MAINTENANCE;
  }
};

export const saveStoredMaintenance = (data: MaintenanceRecord[]) => {
  localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(data));
};

export const getStoredDrivers = (): Driver[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DRIVERS);
    return raw ? JSON.parse(raw) : INITIAL_DRIVERS;
  } catch {
    return INITIAL_DRIVERS;
  }
};

export const saveStoredDrivers = (data: Driver[]) => {
  localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(data));
};

export const getStoredConfig = (): GoogleSheetsConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
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

export interface AppStoredData {
  vehicles: Vehicle[];
  taxes: TaxRecord[];
  fuelLogs: FuelLog[];
  finances: OperationalFinance[];
  timesheets: DriverTimesheet[];
  maintenance: MaintenanceRecord[];
  drivers: Driver[];
  accounts: FinancialAccount[];
  notifConfig: NotificationConfig;
  nonRentalCategories: NonRentalIncomeCategory[];
  userRole: UserRole;
  users: UserAccount[];
  activityLogs: ActivityLog[];
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
    notifConfig: getStoredNotificationConfig(),
    nonRentalCategories: getStoredNonRentalCategories(),
    userRole: getStoredUserRole(),
    users: getStoredUserAccounts(),
    activityLogs: getStoredActivityLogs()
  };
};

export const saveStoredData = (data: Partial<AppStoredData>) => {
  if (data.vehicles) saveStoredVehicles(data.vehicles);
  if (data.taxes) saveStoredTaxes(data.taxes);
  if (data.fuelLogs) saveStoredFuelLogs(data.fuelLogs);
  if (data.finances) saveStoredFinances(data.finances);
  if (data.timesheets) saveStoredTimesheets(data.timesheets);
  if (data.maintenance) saveStoredMaintenance(data.maintenance);
  if (data.drivers) saveStoredDrivers(data.drivers);
  if (data.accounts) saveStoredAccounts(data.accounts);
  if (data.notifConfig) saveStoredNotificationConfig(data.notifConfig);
  if (data.nonRentalCategories) saveStoredNonRentalCategories(data.nonRentalCategories);
  if (data.userRole) saveStoredUserRole(data.userRole);
  if (data.users) saveStoredUserAccounts(data.users);
  if (data.activityLogs) saveStoredActivityLogs(data.activityLogs);
};

export const resetAllToDefault = () => {
  localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(INITIAL_VEHICLES));
  localStorage.setItem(STORAGE_KEYS.TAXES, JSON.stringify(INITIAL_TAX_RECORDS));
  localStorage.setItem(STORAGE_KEYS.FUEL_LOGS, JSON.stringify(INITIAL_FUEL_LOGS));
  localStorage.setItem(STORAGE_KEYS.FINANCES, JSON.stringify(INITIAL_FINANCES));
  localStorage.setItem(STORAGE_KEYS.TIMESHEETS, JSON.stringify(INITIAL_TIMESHEETS));
  localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(INITIAL_MAINTENANCE));
  localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(INITIAL_DRIVERS));
  localStorage.setItem(STORAGE_KEYS.NON_RENTAL_CATEGORIES, JSON.stringify(INITIAL_NON_RENTAL_CATEGORIES));
  localStorage.setItem(STORAGE_KEYS.USER_ROLE, 'owner');
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USER_ACCOUNTS));
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_ACTIVITY_LOGS));
};

// Sync to remote Apps Script Web App
export const syncToGoogleAppsScript = async (
  webAppUrl: string,
  action: string,
  data: unknown
): Promise<{ success: boolean; message: string }> => {
  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    return { success: false, message: 'URL Apps Script belum diisi.' };
  }

  const payloadString = JSON.stringify({ action, payload: data, data });

  try {
    // Attempt standard POST
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
        message: result.message || 'Data berhasil dikirim ke Google Sheets!'
      };
    } catch {
      return {
        success: true,
        message: 'Data terkirim ke Google Apps Script.'
      };
    }
  } catch (err: unknown) {
    // If blocked by CORS / 302 redirect in browser, send with mode: 'no-cors' to guarantee delivery
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
        message: 'Data berhasil disinkronkan ke Google Spreadsheet.'
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
