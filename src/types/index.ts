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
  ownerCompany?: string; // Nama Pemilik Kendaraan / Perusahaan Pemilik Aset
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
  receiptProofUrl?: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  nopol: string;
  driverId?: string;
  driverNip?: string;
  driverName: string;
  disbursedBy?: string;
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
  receiptProofUrl?: string;
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
  allowedTabs?: string[];
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
  allowedTabs?: string[];
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

export type PaymentMethodCategory = 
  | 'cash' 
  | 'transfer' 
  | 'etoll' 
  | 'fuel_voucher' 
  | 'qris' 
  | 'giro_cek' 
  | 'other';

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  category: PaymentMethodCategory;
  description?: string;
  defaultAccountId?: string;
  defaultAccountName?: string;
  isActive: boolean;
  requiresProof?: boolean;
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
  accountType: 'bank' | 'cash' | 'etoll' | 'other' | string;
  companyId?: string; // ID Perusahaan Pemilik Rekening / Deposit
  companyName?: string; // Nama Perusahaan Pemilik Rekening
  initialBalance: number;
  currentBalance: number;
  isActive?: boolean;
  color?: string;
  notes?: string;
  createdAt?: string;
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

export interface CompanyDeposit {
  id: string;
  companyName: string;
  companyCode: string;
  picName: string;
  picPhone: string;
  picEmail?: string;
  address?: string;
  initialDeposit: number;
  currentBalance: number;
  totalTopUp: number;
  totalUsed: number;
  minimumBalanceWarning: number;
  status: 'active' | 'warning' | 'depleted' | 'inactive';
  notes?: string;
  lastTopUpDate?: string;
  createdAt?: string;
}

export interface DepositTopUpRecord {
  id: string;
  companyId: string;
  companyName: string;
  date: string;
  amount: number;
  transferProofNumber: string;
  bankAccountId: string;
  bankAccountName: string;
  paymentMethod: string;
  receiptProofUrl?: string;
  notes?: string;
  createdAt?: string;
}

export type DepositRequestStatus = 'pending' | 'approved' | 'completed' | 'rejected';

export interface CompanyDepositRequest {
  id: string;
  requestNumber: string; // e.g. "REQ-DEP-202611-001"
  companyId: string;
  companyName: string;
  companyCode: string;
  requestDate: string; // "YYYY-MM-DD"
  amount: number;
  purpose: string; // e.g. "Alokasi Operasional Armada & Ritase", "BBM Solar & E-Toll", "Cadangan Uang Saku Driver", "Pengadaan Sparepart"
  targetAccountId?: string;
  targetAccountName?: string;
  applicantName: string; // PIC / Pemohon
  applicantPhone?: string;
  applicantRole?: string;
  urgencyLevel?: 'normal' | 'urgent' | 'high';
  status: DepositRequestStatus;
  notes?: string;
  attachmentUrl?: string;
  approvedBy?: string;
  approvedAt?: string;
  completedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface OperationalFinance {
  id: string;
  date: string;
  vehicleId: string;
  nopol: string;
  driverId?: string;
  driverNip?: string;
  driverName: string;
  handoverBy?: string; // Diserahkan Oleh (Kasir / Petugas / Penyetor)
  receivedBy?: string; // Diterima Oleh (Karyawan Driver / PIC Penerima)
  handoverRole?: string; // Jabatan / Kualifikasi Penerima Serah Terima
  category: FinanceCategory | string;
  type: TransactionType;
  amount: number;
  tripCode?: string;
  description: string;
  paymentMethod: 'Transfer' | 'Cash / Uang Kas' | 'Kartu E-Toll' | 'Kupon SPBU' | string;
  status: 'approved' | 'pending' | 'settled';
  receiptNumber?: string;
  receiptProofUrl?: string; // Data URL Base64 / link gambar bukti nota wajib
  isReceiptVerified?: boolean; // Status verifikasi audit nota
  receiptVerifiedBy?: string;
  receiptVerifiedAt?: string;
  accountId?: string;
  accountName?: string;
  companyId?: string; // ID Perusahaan pemilik deposit
  companyName?: string; // Nama Perusahaan pemilik deposit
  incomeSourceType?: 'rental' | 'non_rental' | 'deposit_topup'; // Pemasukan sewa vs luar sewa vs top up deposit
  nonRentalCategoryId?: string; // ID master data pemasukan non-sewa
  nonRentalCategoryName?: string; // Nama master data kategori
  customerOrPayer?: string; // Nama pembayar / customer / rekanan
}

export interface DriverTimesheet {
  id: string;
  date: string;
  vehicleId: string;
  nopol: string;
  driverId?: string;
  driverNip?: string;
  driverName: string;
  helperName?: string;
  originLocation: string;
  destinationLocation: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  breakMinutes?: number; // Waktu istirahat dalam menit (default 60 mnt)
  regularHours?: number; // Jam kerja normal
  totalHours: number;
  overtimeHours: number;
  attendanceStatus?: 'hadir' | 'izin' | 'sakit' | 'alpa';
  cargoDescription: string;
  cargoTonnageTon: number;
  tripCount: number; // Ritase
  startKm: number;
  endKm: number;
  totalDistanceKm: number;
  status: 'ongoing' | 'completed' | 'delayed' | 'cancelled';
  notes?: string;
}

// --- Arus Kas Peralatan & Perlengkapan Armada ---
export type EquipmentCategory = 
  | 'Alat Pengikat & Terpal Muatan'
  | 'Keselamatan & K3 (APAR, P3K, Rompi)'
  | 'Tool Kit & Perkakas Supir'
  | 'Peralatan Bengkel & Workshop'
  | 'Perangkat GPS & Telematika'
  | 'Kompresor & Perlengkapan Ban'
  | 'Lainnya';

export interface EquipmentCashFlow {
  id: string;
  date: string;
  equipmentName: string;
  category: EquipmentCategory | string;
  itemType?: 'sparepart' | 'ban' | 'oli' | 'aki' | 'terpal_alat' | 'peralatan_lain';
  type: 'expense' | 'income'; // expense: pengadaan/servis, income: jual scrap alat bekas
  quantity: number;
  unit: string; // unit, set, pcs, roll, buah
  unitPrice: number;
  totalAmount: number;
  vehicleId?: string; // unit yang dialokasikan atau 'POOL-GENERAL'
  nopol?: string;
  ownerCompany?: string;
  purchasedByCompany?: string; // Beban Rekap Perusahaan Rekanan/Pemilik
  recipientDriverId?: string; // ID Karyawan Driver penerima serah terima alat
  recipientName?: string; // Nama Karyawan Driver / Mekanik penerima serah terima
  recipientNip?: string; // NIP Karyawan Driver penerima
  recipientRole?: string; // Jabatan penerima (Driver Utama / Mekanik / Koordinator)
  handoverBy?: string; // Petugas Logistik / Kasir yang menyerahkan
  supplierId?: string;
  supplierOrStore: string;
  condition: 'baru' | 'bagus' | 'perlu_servis' | 'rusak';
  accountId: string;
  accountName: string;
  paymentMethod: string;
  receiptNumber?: string;
  receiptProofUrl?: string; // Bukti nota fisik
  isReceiptVerified?: boolean;
  notes?: string;
  createdAt?: string;
}

// --- Arus Kas Saku Driver Untuk Perjalanan ---
export type PocketAllowanceStatus = 'draft' | 'disbursed' | 'in_trip' | 'settled' | 'refunded';

export interface DriverPocketCashFlow {
  id: string;
  tripSheetId?: string;
  tripCode: string;
  date: string;
  driverId?: string;
  driverNip?: string;
  driverName: string;
  driverPhone?: string;
  helperName?: string;
  disbursedBy?: string; // Petugas Kasir / Keuangan yang menyerahkan dana
  receivedBy?: string; // Pihak Karyawan Driver penerima dana
  vehicleId: string;
  nopol: string;
  ownerCompany?: string;
  originLocation: string;
  destinationLocation: string;
  // Rincian Uang Saku Perjalanan
  driverAllowance: number; // Uang saku/makan supir
  helperAllowance: number; // Uang saku kernet
  fuelAllowance: number; // Alokasi BBM jalan
  tollAllowance: number; // Alokasi Tol / E-Toll
  loadingUnloadingCost: number; // Ongkos kuli / bongkar muat
  parkingAndWeighCost: number; // Parkir, retribusi & timbangan
  emergencyFund: number; // Dana darurat jalan
  totalGiven: number; // Total uang saku dicairkan
  // Realisasi & Settle
  actualExpense: number; // Realisasi pengeluaran
  remainingBalance: number; // Sisa uang saku (totalGiven - actualExpense)
  refundAmount?: number; // Pengembalian sisa uang ke kasir
  reimburseAmount?: number; // Penggantian nombok jika aktual lebih besar
  status: PocketAllowanceStatus;
  accountId: string;
  accountName: string;
  sourceCompanyId?: string; // ID Perusahaan pemilik kas / rekening
  sourceCompanyName?: string; // Nama Perusahaan pemilik kas / rekening
  sourceAccountType?: 'bank' | 'cash' | 'etoll' | 'deposit' | string;
  paymentMethod: string;
  settlementDate?: string;
  notes?: string;
  receiptProofUrl?: string; // Kwitansi tanda terima sangu supir / nota jalan
  isReceiptVerified?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt?: string;
}

// --- Trip Sheet & Lembar Surat Jalan ---
export type TripSheetStatus = 'scheduled' | 'in_transit' | 'arrived' | 'completed' | 'settled' | 'cancelled';

export interface TripSheet {
  id: string; // e.g. TS-202608-001
  tripNumber: string; // Kode Trip Sheet
  suratJalanNumber: string; // No. Surat Jalan / Delivery Order (DO)
  departureDate: string;
  departureTime?: string; // Jam Berangkat (HH:mm)
  estimatedArrivalDate: string;
  actualArrivalDate?: string;
  arrivalTime?: string; // Jam Tiba (HH:mm)
  tripDuration?: string; // Durasi perjalanan otomatis (misal: 8 Jam 30 Menit)
  vehicleId: string;
  nopol: string;
  vehicleModel?: string;
  ownerCompany?: string;
  driverId?: string;
  driverNip?: string;
  driverName: string;
  driverPhone?: string;
  helperName?: string;
  dispatcherName?: string; // Petugas Operasional / Dispatcher yang menyerahkan SJ & DO
  clientCompany: string; // Pengirim / Klien
  recipientCompany?: string; // Penerima Kargo
  originLocation: string; // Asal / Lokasi Muat
  destinationLocation: string; // Tujuan / Bongkar
  cargoDescription: string;
  cargoTonnageTon: number;
  cargoQuantity?: string; // misal: 24 Ton / 500 Box
  startOdometer: number;
  endOdometer: number;
  totalDistanceKm: number; // Jarak tempuh otomatis (end - start)
  status: TripSheetStatus;
  // Integrasi Uang Saku Driver Perjalanan
  driverPocketMoney: number;
  helperPocketMoney: number;
  fuelBudget: number;
  tollBudget: number;
  otherTripBudget: number;
  totalPocketDisbursed: number;
  actualTripExpense?: number;
  pocketRemainingBalance?: number;
  pocketSettlementStatus: 'pending' | 'disbursed' | 'settled';
  pocketAccountId?: string;
  pocketAccountName?: string;
  notes?: string;
  tripProofUrl?: string;
  createdAt?: string;
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
  | 'Body Repair & Karoseri'
  | string;

export type ServiceCategory = 'routine' | 'preventive' | 'corrective' | 'heavy' | 'body_electrical';

export interface ServiceTypeReference {
  id: string;
  code: string;
  name: string;
  category: ServiceCategory;
  defaultIntervalKm: number;
  defaultIntervalDays: number;
  estimatedCost: number;
  description: string;
  commonParts?: string[];
  isActive: boolean;
  createdAt?: string;
}

export interface SimClassReference {
  id: string;
  code: string;
  name: string;
  vehicleClassification: string;
  minAge: number;
  validityYears: number;
  description: string;
  permittedVehicles: string;
  requiresSpecialLicense?: boolean;
  isActive: boolean;
  createdAt?: string;
}

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
  driverId?: string;
  driverNip?: string;
  driverName?: string; // Karyawan Driver yang menyerahkan unit ke bengkel
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
  receiptProofUrl?: string;
}

export interface Driver {
  id: string;
  nip?: string; // Nomor Induk Pegawai Karyawan Driver (misal: DRV-EMP-2020-001)
  name: string;
  nik: string;
  phone: string;
  simType: 'SIM A' | 'SIM B1 Umum' | 'SIM B2 Umum' | string;
  simNumber: string;
  simExpiry: string;
  status: 'active' | 'on_duty' | 'off' | 'inactive';
  employmentType?: 'Karyawan Tetap (PKWTT)' | 'Kontrak (PKWT)' | 'Mitra Ritase / Harian' | string;
  jobTitle?: string; // misal: Driver Utama Tronton, Driver Dump Truck, Co-Driver / Kernet
  department?: string; // misal: Divisi Operasional & Pengemudi
  companyName?: string; // Perusahaan penempatan armada
  bankName?: string; // Bank penerima uang saku / gaji
  bankAccountNumber?: string; // No rekening driver
  helperName?: string; // Kernet pendamping tetap
  joinDate?: string;
  assignedVehicle?: string;
  ktpAddress?: string;
  emergencyContact?: string;
}

export interface EquipmentSupplier {
  id: string;
  code: string;
  name: string;
  category: 'Sparepart Mesin' | 'Ban & Vulkanisir' | 'Oli & Pelumas' | 'Aki & Kelistrikan' | 'Terpal & Lashing' | 'Perkakas Supir & K3' | 'General Supplier' | string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  bankName?: string;
  accountNumber?: string;
  paymentTerms?: string;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
}

export interface ExpenseCategoryReference {
  id: string;
  code: string;
  name: string;
  group: 'Perjalanan & Supir' | 'Armada Kendaraan' | 'Bengkel & Sparepart' | 'Operasional & Legalitas' | 'Lainnya';
  defaultAmount?: number;
  description: string;
  isActive: boolean;
  requiresReceipt?: boolean;
  createdAt?: string;
}

export interface AdminStaff {
  id: string;
  nikOrNip: string;
  nip?: string;
  name: string;
  jobTitle: string;
  role?: string;
  department: string;
  phone: string;
  email: string;
  address: string;
  status: 'active' | 'leave' | 'inactive';
  joinDate: string;
  notes?: string;
  createdAt?: string;
}

export type NotificationCategory = 'tax' | 'service' | 'fuel' | 'finance' | 'system';

export type ActivityLogModule = 
  | 'vehicle'
  | 'tax'
  | 'fuel'
  | 'finance'
  | 'tripsheet'
  | 'equipment'
  | 'pocket_money'
  | 'maintenance'
  | 'sparepart_inventory'
  | 'timesheet'
  | 'driver'
  | 'user'
  | 'master_data'
  | 'system';

export type SparepartConditionType =
  | 'baru'
  | 'bekas_layak'
  | 'bekas_rekondisi'
  | 'bekas_rusak_afkir';

export type SparepartCategory =
  | 'Mesin & Filter'
  | 'Ban & Velg'
  | 'Sistem Rem & Kopling'
  | 'Kelistrikan & Aki'
  | 'Oli & Pelumas'
  | 'Kaki-Kaki & Suspensi'
  | 'Body & Karoseri'
  | 'Lainnya';

export interface SparepartInventoryItem {
  id: string;
  partCode: string; // SKU / Part Number OEM (misal: PN-HINO-23304)
  partName: string; // Nama suku cadang
  category: SparepartCategory | string;
  brand?: string; // Merk / OEM (Genuine Hino, Bridgestone, GS Astra, Denso, dll)
  compatibleVehicles?: string; // Model truk yang cocok
  condition: SparepartConditionType; // baru | bekas_layak | bekas_rekondisi | bekas_rusak_afkir
  stockQty: number;
  minStockWarning: number;
  unit: string; // Pcs, Set, Liter, Pasang, Unit, Lembar
  unitPrice: number; // Harga beli baru / nilai taksir part bekas
  totalValue: number; // stockQty * unitPrice
  storageLocation: string; // Lokasi Rak Gudang (misal: Gudang Pool Rak A-02, Gudang Part Bekas Rak C-01)
  originVehicleId?: string; // Khusus part bekas: ID kendaraan asal copotan
  originNopol?: string; // Khusus part bekas: Nopol unit asal copotan
  exchangedFromWorkOrder?: string; // Khusus part bekas: No. SPK Bengkel saat part dicopot
  supplierId?: string;
  supplierName?: string;
  lastUpdated: string;
  notes?: string;
  photoProofUrl?: string;
}

export type SparepartMovementType =
  | 'in_purchase' // Masuk Pembelian Sparepart Baru
  | 'in_removed_used' // Masuk Sparepart Bekas Copotan dari Armada
  | 'out_install' // Keluar Pemasangan ke Unit Armada
  | 'out_scrap_sale' // Keluar Penjualan Barang Bekas / Afkir / Scrap
  | 'adjustment'; // Penyesuaian Stok Opname Gudang

export interface SparepartStockMovement {
  id: string;
  date: string;
  partId: string;
  partCode: string;
  partName: string;
  condition: SparepartConditionType;
  movementType: SparepartMovementType;
  qty: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  vehicleId?: string;
  nopol?: string;
  driverId?: string;
  driverName?: string;
  driverNip?: string; // NIP Karyawan Driver penerima/penyerah
  mechanicOrStaffName: string; // Kepala Gudang / Mekanik Bengkel
  workOrderNumber?: string; // No. SPK / Referensi Bukti Gudang
  receiptProofUrl?: string;
  notes?: string;
}

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
  isConnected?: boolean;
}

