export type VehicleStatus = 'active' | 'maintenance' | 'standby' | 'broken';

export type VehicleType = 
  | 'Dump Truck'
  | 'Truk Box'
  | 'Truk Tronton / Wingbox'
  | 'Truk Engkel (CDE/CDD)'
  | 'Pickup Bak / Blind Van'
  | 'Minibus / HiAce'
  | 'Mobil Operasional Kantor'
  | 'Forklift / Alat Berat';

export type FuelType = 'Bio Solar' | 'Solar Dexlite' | 'Pertamina Dex' | 'Pertalite' | 'Pertamax';

export interface Vehicle {
  id: string;
  nopol: string;
  brand: string;
  model: string;
  type: VehicleType;
  year: number;
  fuelType: FuelType;
  chassisNumber?: string;
  engineNumber?: string;
  currentOdometer: number;
  status: VehicleStatus;
  assignedDriver: string;
  driverPhone?: string;
  stnk1YearDate: string; // YYYY-MM-DD (Pajak Tahunan)
  stnk5YearDate: string; // YYYY-MM-DD (Ganti Plat)
  kirDate: string;       // YYYY-MM-DD (Uji KIR Dishub)
  insuranceDate?: string;// YYYY-MM-DD (Asuransi)
  targetKmPerLiter: number;
  capacityTon?: number;
  imageUrl?: string;
  notes?: string;
}

export type DocumentType = 
  | 'Pajak Tahunan STNK'
  | 'Pajak 5 Tahunan & Ganti Plat'
  | 'Uji Berkala KIR Dishub'
  | 'Asuransi Kendaraan'
  | 'Izin Usaha Angkutan / KPS';

export type TaxStatus = 'overdue' | 'due_soon' | 'safe' | 'paid';

export interface TaxRecord {
  id: string;
  vehicleId: string;
  nopol: string;
  documentType: DocumentType;
  dueDate: string;
  lastPaymentDate?: string;
  amount: number;
  status: TaxStatus;
  penaltyAmount?: number;
  agentOrSamsat?: string;
  notes?: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  nopol: string;
  driverName: string;
  date: string;
  fuelType: FuelType;
  volumeLiters: number;
  pricePerLiter: number;
  totalCost: number;
  odometer: number;
  lastOdometer: number;
  distanceTravelled: number;
  calculatedKmPerLiter: number;
  fuelStation: string;
  isFullTank: boolean;
  receiptNumber?: string;
  notes?: string;
  accountId?: string;
  accountName?: string;
  paymentMethod?: string;
}

export type UserRole = 
  | 'owner'       // Owner / Direktur Utama (Kelola semuanya - Full Access)
  | 'admin1'      // Admin 1 (Operasional dan Keuangan)
  | 'admin2';     // Admin 2 (Kendaraan, Pajak, Konsumsi Solar, Laporan Time Sheet)

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  status: 'active' | 'inactive';
  isActive?: boolean;
  department?: string;
  lastLogin?: string;
  lastLoginAt?: string;
  createdAt: string;
  notes?: string;
  password?: string;
  pin?: string;
}

export interface AuthSession {
  userId: string;
  userName: string;
  username?: string;
  userRole: UserRole;
  email: string;
  department?: string;
  avatarUrl?: string;
  loginTime: string;
  isRemembered?: boolean;
}

export interface NonRentalIncomeCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  defaultAmount?: number;
  isActive: boolean;
  defaultAccountId?: string;
  notes?: string;
  createdAt?: string;
}

export type FinanceCategory = 
  | 'Uang Jalan / Sangu Supir'
  | 'Biaya BBM / Solar'
  | 'Biaya E-Toll'
  | 'Parkir, Retribusi & Timbangan'
  | 'Perbaikan Darurat / Tambal Ban'
  | 'Biaya Perawatan & Sparepart'
  | 'Pajak, STNK & KIR'
  | 'Pendapatan Sewa / Ongkos Angkut'
  | 'Jasa Bongkar Muat / Handling Fee'
  | 'Penjualan Limbah / Oli & Ban Bekas'
  | 'Klaim Penggantian Asuransi'
  | 'Komisi Muatan / Fee Subkontraktor'
  | 'Jasa Derek & Servis Workshop Luar'
  | 'Sewa Lahan Parkir & Titip Muatan'
  | 'Bunga Bank & Pendapatan Finansial'
  | 'Pendapatan Lain-lain Non-Sewa'
  | 'Lain-lain';

export type TransactionType = 'expense' | 'income';

export interface FinancialAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankOrProvider: string;
  accountType: 'bank' | 'cash' | 'etoll' | 'other';
  initialBalance: number;
  currentBalance: number;
  color?: string;
  notes?: string;
}

export interface NotificationConfig {
  taxAlertDaysBefore: number;
  serviceAlertKmBefore: number;
  serviceAlertDaysBefore: number;
  fuelReminderDays: number;
  enableTaxAlerts: boolean;
  enableServiceAlerts: boolean;
  enableFuelAlerts: boolean;
  enableEmailAlerts: boolean;
  recipientEmail: string;
}

export interface OperationalFinance {
  id: string;
  date: string;
  vehicleId: string;
  nopol: string;
  driverName: string;
  category: FinanceCategory | string;
  type: TransactionType;
  amount: number;
  tripCode?: string;
  description: string;
  paymentMethod: 'Transfer' | 'Cash / Uang Kas' | 'Kartu E-Toll' | 'Kupon SPBU' | string;
  status: 'approved' | 'pending' | 'settled';
  receiptNumber?: string;
  accountId?: string;
  accountName?: string;
  incomeSourceType?: 'rental' | 'non_rental'; // Pemasukan sewa vs luar sewa
  nonRentalCategoryId?: string;               // ID master data pemasukan non-sewa
  nonRentalCategoryName?: string;             // Nama master data kategori
  customerOrPayer?: string;                   // Nama pembayar / customer / rekanan
}

export interface DriverTimesheet {
  id: string;
  date: string;
  vehicleId: string;
  nopol: string;
  driverName: string;
  helperName?: string;
  originLocation: string;
  destinationLocation: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  totalHours: number;
  overtimeHours: number;
  cargoDescription: string;
  cargoTonnageTon: number;
  tripCount: number; // Ritase
  startKm: number;
  endKm: number;
  totalDistanceKm: number;
  status: 'ongoing' | 'completed' | 'delayed' | 'cancelled';
  notes?: string;
}

export type ServiceType = 
  | 'Ganti Oli Mesin & Filter Oli'
  | 'Ganti Oli Gardan & Transmisi'
  | 'Ganti Filter Solar & Filter Udara'
  | 'Pemeriksaan Sistem Rem & Kopling'
  | 'Rotasi & Penggantian Ban'
  | 'Tune Up & Kalibrasi Injektor'
  | 'Kelistrikan, Aki & Starter'
  | 'Servis Kaki-kaki & Suspensi'
  | 'Overhaul / Turun Mesin'
  | 'Body Repair & Karoseri';

export interface SparepartItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  nopol: string;
  serviceDate: string;
  odometerAtService: number;
  nextServiceOdometer: number;
  nextServiceDate: string;
  serviceType: ServiceType;
  workshopName: string;
  mechanicName?: string;
  workOrderNumber: string;
  laborCost: number;
  spareparts: SparepartItem[];
  totalCost: number;
  status: 'completed' | 'in_progress' | 'scheduled';
  notes?: string;
  accountId?: string;
  accountName?: string;
}

export interface Driver {
  id: string;
  name: string;
  nik: string;
  phone: string;
  simType: 'SIM A' | 'SIM B1 Umum' | 'SIM B2 Umum';
  simNumber: string;
  simExpiry: string;
  status: 'active' | 'on_duty' | 'off';
  joinDate: string;
  assignedVehicle?: string;
}

export type NotificationCategory = 'tax' | 'service' | 'fuel' | 'finance' | 'system';

export type ActivityLogModule = 
  | 'vehicle'
  | 'tax'
  | 'fuel'
  | 'finance'
  | 'maintenance'
  | 'timesheet'
  | 'driver'
  | 'user'
  | 'master_data'
  | 'system';

export type ActivityActionType = 
  | 'create'
  | 'update'
  | 'delete'
  | 'pay'
  | 'transfer'
  | 'login'
  | 'export'
  | 'sync'
  | 'clear'
  | 'note'
  | 'status_change';

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO date-time or formatted YYYY-MM-DD HH:mm:ss
  module: ActivityLogModule;
  action: ActivityActionType;
  title: string;
  description: string;
  targetId?: string;
  targetName?: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userDepartment?: string;
  ipAddress?: string;
  details?: Record<string, any>;
  badgeType?: 'success' | 'danger' | 'warning' | 'info' | 'primary';
}

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  type: 'tax_overdue' | 'tax_warning' | 'service_due' | 'service_scheduled' | 'fuel_anomaly' | 'fuel_reminder' | 'finance_alert';
  title: string;
  message: string;
  vehicleNopol?: string;
  vehicleId?: string;
  date: string;
  severity: 'high' | 'medium' | 'low' | 'info';
  read: boolean;
  actionTab?: string;
  actionLabel?: string;
}

export interface GoogleSheetsConfig {
  webAppUrl: string;
  spreadsheetId: string;
  sheetNamePrefix?: string;
  autoSync: boolean;
  lastSyncTime?: string;
}
