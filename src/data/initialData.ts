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
  UserAccount,
  ActivityLog,
  CompanyDeposit,
  EquipmentCashFlow,
  DriverPocketCashFlow,
  TripSheet,
  DepositTopUpRecord,
  EquipmentSupplier,
  ExpenseCategoryReference,
  AdminStaff,
  CompanyDepositRequest,
  SparepartInventoryItem,
  SparepartStockMovement
} from '../types';

export const SAMPLE_RECEIPT_IMAGE = '';

/**
 * Daftar seluruh ID Data Dummy lama yang wajib dibersihkan dari LocalStorage & Google Spreadsheet
 */
export const DUMMY_RECORD_IDS: string[] = [
  'DEP-001', 'DEP-002', 'DEP-003', 'DEP-004',
  'ACC-BCA', 'ACC-MANDIRI', 'ACC-CASH', 'ACC-ETOLL', 'ACC-BRI-SINAR', 'ACC-BNI-MAJU',
  'V-001', 'V-002', 'V-003', 'V-004', 'V-005', 'V-006',
  'TAX-001', 'TAX-002', 'TAX-003', 'TAX-004', 'TAX-005', 'TAX-006',
  'FL-001', 'FL-002', 'FL-003', 'FL-004', 'FL-005', 'FL-006',
  'FIN-001', 'FIN-002', 'FIN-003', 'FIN-004', 'FIN-005', 'FIN-006', 'FIN-007', 'FIN-008', 'FIN-009', 'FIN-010',
  'TS-001', 'TS-002', 'TS-003', 'TS-004',
  'MNT-001', 'MNT-002', 'MNT-003',
  'DRV-001', 'DRV-002', 'DRV-003', 'DRV-004', 'DRV-005', 'DRV-006', 'DRV-007', 'DRV-008', 'DRV-009', 'DRV-010',
  'LOG-001', 'LOG-002', 'LOG-003', 'LOG-004', 'LOG-005', 'LOG-006', 'LOG-007', 'LOG-008', 'LOG-009', 'LOG-010',
  'EQ-001', 'EQ-002', 'EQ-003', 'EQ-004', 'EQ-005', 'EQ-006',
  'SAKU-001', 'SAKU-002', 'SAKU-003', 'SAKU-004',
  'SUP-001', 'SUP-002', 'SUP-003', 'SUP-004', 'SUP-005', 'SUP-006',
  'ADM-001', 'ADM-002', 'ADM-003', 'ADM-004', 'ADM-005',
  'TOP-202608-01', 'TOP-202608-02', 'TOP-202608-03', 'TOP-202608-04',
  'REQ-DEP-202608-01', 'REQ-DEP-202608-02', 'REQ-DEP-202608-03', 'REQ-DEP-202608-04', 'REQ-DEP-202608-05', 'REQ-DEP-202608-06',
  'INV-SP-001', 'INV-SP-002', 'INV-SP-003', 'INV-SP-004', 'INV-SP-005', 'INV-SP-006',
  'INV-SP-007', 'INV-SP-008', 'INV-SP-009', 'INV-SP-010', 'INV-SP-011', 'INV-SP-012',
  'MOV-SP-001', 'MOV-SP-002', 'MOV-SP-003', 'MOV-SP-004', 'MOV-SP-005'
];

// ============================================================================
// DATABASE UTAMA BERSIH (TANPA DATA DUMMY OPERASIONAL / TRANSAKSI)
// Seluruh data operasional mengacu langsung pada input riil & Google Spreadsheet
// ============================================================================

export const INITIAL_COMPANY_DEPOSITS: CompanyDeposit[] = [];
export const INITIAL_ACCOUNTS: FinancialAccount[] = [];
export const INITIAL_VEHICLES: Vehicle[] = [];
export const INITIAL_TAX_RECORDS: TaxRecord[] = [];
export const INITIAL_FUEL_LOGS: FuelLog[] = [];
export const INITIAL_FINANCES: OperationalFinance[] = [];
export const INITIAL_TIMESHEETS: DriverTimesheet[] = [];
export const INITIAL_MAINTENANCE: MaintenanceRecord[] = [];
export const INITIAL_DRIVERS: Driver[] = [];
export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];
export const INITIAL_EQUIPMENT_CASH_FLOWS: EquipmentCashFlow[] = [];
export const INITIAL_DRIVER_POCKET_FLOWS: DriverPocketCashFlow[] = [];
export const INITIAL_TRIP_SHEETS: TripSheet[] = [];
export const INITIAL_EQUIPMENT_SUPPLIERS: EquipmentSupplier[] = [];
export const INITIAL_ADMIN_STAFF: AdminStaff[] = [];
export const INITIAL_DEPOSIT_TOPUP_RECORDS: DepositTopUpRecord[] = [];
export const INITIAL_DEPOSIT_REQUESTS: CompanyDepositRequest[] = [];
export const INITIAL_SPAREPART_INVENTORY: SparepartInventoryItem[] = [];
export const INITIAL_SPAREPART_MOVEMENTS: SparepartStockMovement[] = [];

// Referensi Metode Pembayaran Standar (Untuk Pilihan Dropdown Form)
export const INITIAL_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'PM-001',
    code: 'CASH',
    name: 'Cash / Uang Kas',
    category: 'cash',
    description: 'Pembayaran tunai kas operasional.',
    defaultAccountId: '',
    defaultAccountName: '',
    isActive: true,
    requiresProof: true,
    notes: '',
    createdAt: '2026-01-01'
  },
  {
    id: 'PM-002',
    code: 'TRANSFER',
    name: 'Transfer Bank',
    category: 'transfer',
    description: 'Pembayaran via transfer rekening bank.',
    defaultAccountId: '',
    defaultAccountName: '',
    isActive: true,
    requiresProof: true,
    notes: '',
    createdAt: '2026-01-01'
  },
  {
    id: 'PM-003',
    code: 'ETOLL',
    name: 'Kartu E-Toll',
    category: 'etoll',
    description: 'Pembayaran menggunakan kartu E-Toll.',
    defaultAccountId: '',
    defaultAccountName: '',
    isActive: true,
    requiresProof: false,
    notes: '',
    createdAt: '2026-01-01'
  }
];

export const INITIAL_SERVICE_TYPES: ServiceTypeReference[] = [
  {
    id: 'ST-001',
    code: 'SRV-RUTIN',
    name: 'Servis Berkala & Ganti Oli',
    category: 'routine',
    defaultIntervalKm: 10000,
    defaultIntervalDays: 90,
    estimatedCost: 0,
    description: 'Perawatan berkala mesin dan pelumas.',
    commonParts: [],
    isActive: true,
    createdAt: '2026-01-01'
  }
];

export const INITIAL_SIM_CLASSES: SimClassReference[] = [];

export const INITIAL_NON_RENTAL_CATEGORIES: NonRentalIncomeCategory[] = [];
export const INITIAL_EXPENSE_CATEGORIES: ExpenseCategoryReference[] = [];

export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  taxAlertDaysBefore: 30,
  serviceAlertKmBefore: 1000,
  serviceAlertDaysBefore: 14,
  fuelReminderDays: 3,
  enableTaxAlerts: true,
  enableServiceAlerts: true,
  enableFuelAlerts: true,
  enableEmailAlerts: false,
  recipientEmail: ''
};

export const INITIAL_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'USR-001',
    name: 'Owner / Direktur Utama',
    username: 'owner',
    email: 'owner@44sops.co.id',
    password: 'owner123',
    pin: '123456',
    role: 'owner',
    allowedTabs: [
      'dashboard',
      'vehicles',
      'tax',
      'fuel',
      'timesheet',
      'tripsheet',
      'finance',
      'finance_pocket',
      'finance_equipment',
      'maintenance',
      'sparepart_inventory',
      'drivers',
      'reports',
      'master_hub',
      'users',
      'activity_log'
    ],
    phone: '-',
    status: 'active',
    isActive: true,
    avatarUrl: '',
    department: 'Direksi / Owner',
    notes: 'Akses penuh seluruh modul & konfigurasi Apps Script.',
    createdAt: '2026-01-01',
    lastLoginAt: ''
  },
  {
    id: 'USR-002',
    name: 'Admin 1 (Operasional & Keuangan)',
    username: 'admin1',
    email: 'admin1@44sops.co.id',
    password: 'admin123',
    pin: '123456',
    role: 'admin1',
    allowedTabs: [
      'dashboard',
      'tripsheet',
      'finance',
      'finance_pocket',
      'finance_equipment',
      'maintenance',
      'sparepart_inventory',
      'drivers',
      'reports',
      'master_hub',
      'activity_log'
    ],
    phone: '-',
    status: 'active',
    isActive: true,
    avatarUrl: '',
    department: 'Operasional & Keuangan',
    notes: 'Akses operasional keuangan, surat jalan, saku driver & peralatan.',
    createdAt: '2026-01-01',
    lastLoginAt: ''
  },
  {
    id: 'USR-003',
    name: 'Admin 2 (Armada, Pajak, Solar & Timesheet)',
    username: 'admin2',
    email: 'admin2@44sops.co.id',
    password: 'admin222',
    pin: '123456',
    role: 'admin2',
    allowedTabs: [
      'dashboard',
      'vehicles',
      'tax',
      'fuel',
      'timesheet',
      'tripsheet',
      'sparepart_inventory',
      'master_hub',
      'activity_log'
    ],
    phone: '-',
    status: 'active',
    isActive: true,
    avatarUrl: '',
    department: 'Armada & Logistik Lapangan',
    notes: 'Akses pengelolaan unit kendaraan, pajak/KIR, BBM solar, dan timesheet.',
    createdAt: '2026-01-01',
    lastLoginAt: ''
  }
];

export const DEFAULT_SHEETS_CONFIG: GoogleSheetsConfig = {
  webAppUrl: 'https://script.google.com/macros/s/AKfycbyi_YS56LQrDmnNZhLtrO9WhqmcVsbsBGsX7RdxJzRRvRxhSt-BMFjjH-DTkaP-O16E/exec',
  spreadsheetId: '',
  sheetNamePrefix: '44S_Ops_',
  autoSync: true,
  isConnected: true,
  lastSyncTime: ''
};

