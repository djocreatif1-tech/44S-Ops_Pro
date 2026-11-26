// ============================================================================
// 44S OPS_PRO ENTERPRISE - GOOGLE APPS SCRIPT GENERATOR
// File 1: Kode.gs   (Granular Single-Row Edit & Delete by ID, Non-Destructive Sync, CacheService)
// File 2: Setup.gs  (Inisialisasi 16 Sheet Bersih Tanpa Dummy, Auto-Trim Hemat Sel DB)
// File 3: Index.html (100% Identical Full React Web Application Bundle)
// ============================================================================

import { COMPILED_GAS_INDEX_HTML, getCompiledGasIndexHtml } from './gasCompiledHtml';

export const GAS_KODE_GS = `/**
 * ============================================================================
 * 1. FILE: Kode.gs
 * 44S Ops_pro Enterprise - High-Performance Google Apps Script Backend
 * (GRANULAR SINGLE-ROW CRUD — FOKUS PADA DATA YANG DIPILIH SAJA)
 * ============================================================================
 * Prinsip Keamanan & Optimasi Database:
 * 1. Granular Single-Record Edit & Delete:
 *    - Edit (upsertSingleRecord): Hanya memperbarui 1 baris dengan ID yang dipilih.
 *    - Delete (deleteRowById): Hanya menghapus 1 baris dengan ID yang dipilih.
 *    - Tidak ada perintah hapus semua data (clearContent / mass purge).
 * 2. Non-Destructive Batch Upsert: Sinkronisasi massal hanya memperbarui baris ID
 *    yang cocok atau menambah baris baru tanpa pernah mengosongkan tabel.
 * 3. CacheService (In-Memory Cache 60 Detik): Respon < 80ms saat buka dari HP/PC.
 * 4. Payload Compression Guard: Mencegah Base64 foto/nota > 40KB membebani sel Sheet.
 * 5. Auto-Trim Empty Cells: Menghapus ribuan baris/kolom kosong agar hemat kuota 10 Juta sel.
 * ============================================================================
 */

var APP_TITLE = '44S Ops_pro - Sistem Manajemen Terpadu Operasional Kendaraan & Rekening Kas';
var CACHE_KEY_ALL_DATA = '44S_OPS_CLEAN_CACHE_V8';
var CACHE_TTL_SECONDS = 60;

var SHEETS = {
  VEHICLES: '44S_Ops_Vehicles',
  TAXES: '44S_Ops_Taxes',
  FUEL: '44S_Ops_Fuel',
  FINANCE: '44S_Ops_Finance',
  POCKET_FLOWS: '44S_Ops_PocketFlows',
  EQUIPMENT_FLOWS: '44S_Ops_EquipmentFlows',
  TRIP_SHEETS: '44S_Ops_TripSheets',
  TIMESHEETS: '44S_Ops_Timesheets',
  MAINTENANCE: '44S_Ops_Maintenance',
  SPAREPARTS: '44S_Ops_Spareparts',
  SPAREPART_MOVEMENTS: '44S_Ops_SparepartMovements',
  DRIVERS: '44S_Ops_Drivers',
  ADMIN_STAFF: '44S_Ops_AdminStaff',
  SUPPLIERS: '44S_Ops_Suppliers',
  EXPENSE_CATEGORIES: '44S_Ops_ExpenseCategories',
  PAYMENT_METHODS: '44S_Ops_PaymentMethods',
  ACCOUNTS: '44S_Ops_Accounts',
  SERVICE_TYPES: '44S_Ops_ServiceTypes',
  SIM_CLASSES: '44S_Ops_SimClasses',
  NON_RENTAL_CATEGORIES: '44S_Ops_NonRentalCategories',
  COMPANY_DEPOSITS: '44S_Ops_CompanyDeposits',
  DEPOSIT_TOPUPS: '44S_Ops_DepositTopUps',
  DEPOSIT_REQUESTS: '44S_Ops_DepositRequests',
  USERS: '44S_Ops_Users',
  AUDIT_LOGS: '44S_Ops_AuditLogs',
  MASTER_REF: '44S_Ops_MasterRef',
  RECEIPT_VAULT: '44S_Ops_ReceiptVault'
};

var SHEET_SCHEMAS = {};
SHEET_SCHEMAS[SHEETS.VEHICLES] = [
  'ID Unit', 'No. Polisi', 'Merk / Model', 'Tipe Kendaraan', 'Tahun',
  'Bahan Bakar', 'No. Rangka', 'No. Mesin', 'Odometer Terkini (KM)',
  'Status Operasi', 'Supir Tetap', 'No HP Supir',
  'Jatuh Tempo Pajak 1 Thn', 'Jatuh Tempo Plat 5 Thn', 'Jatuh Tempo KIR',
  'Target Km/Liter', 'Kapasitas (Ton)', 'Catatan',
  'Perusahaan / Pemilik', 'Jatuh Tempo Asuransi', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.TAXES] = [
  'ID Pajak', 'ID Unit', 'No. Polisi', 'Jenis Dokumen',
  'Tanggal Jatuh Tempo', 'Tgl Bayar Terakhir', 'Estimasi Biaya (Rp)',
  'Denda (Rp)', 'Status', 'Samsat / Lokasi KIR', 'Keterangan',
  'Perusahaan / Pemilik', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.FUEL] = [
  'ID Log', 'Tanggal', 'No. Polisi', 'Supir', 'Jenis BBM',
  'Volume (Liter)', 'Harga per Liter (Rp)', 'Total Biaya (Rp)',
  'Odometer Saat Ini', 'Jarak Tempuh (KM)', 'Konsumsi (KM/Liter)',
  'Lokasi SPBU', 'Full Tank?', 'No. Struk', 'Catatan',
  'Perusahaan / Pemilik', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.FINANCE] = [
  'ID Transaksi', 'Tanggal', 'No. Polisi', 'Supir', 'Kategori',
  'Tipe (Debet/Kredit)', 'Jumlah (Rp)', 'Kode Trip / DO', 'Deskripsi',
  'Metode Bayar', 'Status Validasi', 'No. Kuitansi',
  'ID Akun Rekening', 'Nama Akun Rekening', 'Perusahaan / Pemilik', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.POCKET_FLOWS] = [
  'id', 'tripCode', 'date', 'driverName', 'nopol', 'ownerCompany',
  'originLocation', 'destinationLocation', 'totalGiven', 'actualExpense',
  'paymentMethod', 'status', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.EQUIPMENT_FLOWS] = [
  'id', 'date', 'type', 'equipmentName', 'category', 'nopol',
  'recipientName', 'ownerCompany', 'quantity', 'totalAmount', 'status', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.TRIP_SHEETS] = [
  'id', 'tripNumber', 'suratJalanNumber', 'departureDate', 'nopol',
  'driverName', 'ownerCompany', 'originLocation', 'destinationLocation',
  'totalPocketDisbursed', 'actualTripExpense', 'status', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.TIMESHEETS] = [
  'ID Timesheet', 'Tanggal', 'No. Polisi', 'Supir', 'Kernet',
  'Asal (Origin)', 'Tujuan (Destination)', 'Jam Mulai', 'Jam Selesai',
  'Total Jam', 'Jam Lembur', 'Muatan Barang', 'Tonase (Ton)', 'Jumlah Rit',
  'KM Awal', 'KM Akhir', 'Jarak (KM)', 'Status', 'Catatan',
  'Perusahaan / Pemilik', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.MAINTENANCE] = [
  'ID Servis', 'Tanggal Servis', 'No. Polisi', 'Odometer Servis (KM)',
  'Target Odo Berikutnya (KM)', 'Tgl Servis Berikutnya', 'Jenis Pekerjaan',
  'Nama Bengkel / Montir', 'No. SPK / WO', 'Biaya Jasa (Rp)',
  'Rincian Sparepart', 'Total Biaya (Rp)', 'Status', 'Catatan Servis',
  'Perusahaan / Pemilik', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.SPAREPARTS] = [
  'id', 'partCode', 'partName', 'category', 'condition', 'stockQty',
  'minStockAlert', 'unit', 'unitPrice', 'storageLocation', 'ownerCompany', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.SPAREPART_MOVEMENTS] = [
  'id', 'partId', 'partCode', 'partName', 'condition', 'date',
  'movementType', 'qty', 'nopol', 'driverName', 'notes', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.DRIVERS] = [
  'ID Supir', 'Nama Lengkap', 'NIK KTP', 'No. WhatsApp / HP',
  'Golongan SIM', 'No. SIM', 'Masa Berlaku SIM', 'Status Tugas',
  'Tanggal Bergabung', 'Unit Pegangan (Nopol)', 'Perusahaan / Pemilik', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.ADMIN_STAFF] = [
  'ID Staf', 'NIK / NIP', 'Nama Lengkap', 'Jabatan', 'Peran / Role',
  'Departemen', 'No. WhatsApp / HP', 'Email', 'Alamat', 'Status',
  'Tanggal Bergabung', 'Catatan', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.SUPPLIERS] = [
  'ID Supplier', 'Kode Supplier', 'Nama Supplier / Toko', 'Kategori',
  'PIC / Kontak', 'No. Telepon / WA', 'Email', 'Alamat', 'Bank',
  'No. Rekening', 'Termin Pembayaran', 'Status Aktif', 'Catatan', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.EXPENSE_CATEGORIES] = [
  'ID Kategori', 'Kode Pengeluaran', 'Nama Jenis Pengeluaran',
  'Kelompok / Grup', 'Plafon / Standar Biaya (Rp)', 'Wajib Nota?',
  'Status Aktif', 'Deskripsi', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.PAYMENT_METHODS] = [
  'ID Metode', 'Kode Metode', 'Nama Metode Pembayaran', 'Kategori',
  'ID Rekening Default', 'Nama Rekening Default', 'Wajib Bukti?',
  'Status Aktif', 'Deskripsi', 'Catatan', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.ACCOUNTS] = [
  'ID Akun', 'Nama Akun / Rekening', 'Nomor Rekening', 'Bank / Penyedia',
  'Tipe Akun', 'Saldo Awal (Rp)', 'Saldo Terkini (Rp)', 'Catatan',
  'Perusahaan / Pemilik', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.SERVICE_TYPES] = [
  'ID Jenis Servis', 'Kode Servis', 'Nama Pekerjaan Servis', 'Kategori Servis',
  'Interval KM', 'Interval Hari', 'Estimasi Biaya (Rp)', 'Suku Cadang Umum',
  'Status Aktif', 'Deskripsi', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.SIM_CLASSES] = [
  'ID Golongan SIM', 'Kode SIM', 'Nama Golongan SIM', 'Klasifikasi Kendaraan',
  'Usia Minimal', 'Masa Berlaku (Thn)', 'Armada Diizinkan', 'Status Aktif',
  'Deskripsi', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.NON_RENTAL_CATEGORIES] = [
  'ID Kategori Non-Sewa', 'Kode Kategori', 'Nama Pemasukan Non-Sewa',
  'Tarif Acuan (Rp)', 'ID Rekening Default', 'Status Aktif',
  'Deskripsi', 'Catatan', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.COMPANY_DEPOSITS] = [
  'id', 'companyName', 'contactPerson', 'phone', 'depositedAmount',
  'usedPocketMoney', 'usedFuelCost', 'remainingBalance', 'status',
  'companyCode', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.DEPOSIT_TOPUPS] = [
  'ID Top-Up', 'Tanggal', 'ID Perusahaan', 'Nama Perusahaan',
  'Jumlah Top-Up (Rp)', 'No. Bukti Transfer', 'ID Rekening Tujuan',
  'Nama Rekening Tujuan', 'Metode Pembayaran', 'Catatan', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.DEPOSIT_REQUESTS] = [
  'ID Pengajuan', 'No. Pengajuan', 'Tanggal Pengajuan', 'ID Perusahaan',
  'Kode Perusahaan', 'Nama Perusahaan', 'Jumlah Diajukan (Rp)', 'Keperluan',
  'Pemohon / PIC', 'No. HP Pemohon', 'Urgensi', 'Status',
  'Disetujui Oleh', 'Catatan', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.USERS] = [
  'id', 'username', 'name', 'email', 'phone', 'role', 'status',
  'allowedModulesJson', 'lastLogin', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.AUDIT_LOGS] = [
  'ID Log', 'Waktu Timestamp', 'User ID', 'Nama Pengguna',
  'Hak Akses (Role)', 'Modul', 'Aksi', 'Keterangan Aktivitas',
  'Detail Tambahan', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.MASTER_REF] = [
  'id', 'refType', 'code', 'name', 'category', 'companyName', 'status', 'updatedAt', 'rawJson'
];
SHEET_SCHEMAS[SHEETS.RECEIPT_VAULT] = [
  'id', 'recordId', 'fieldKey', 'chunk1', 'chunk2', 'chunk3', 'chunk4', 'updatedAt'
];

/**
 * 1. HTTP GET HANDLER
 */
function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};

  if (params.action === 'getAllData') {
    var forceRefresh = params.nocache === '1';
    return createJsonResponse(getAllSpreadsheetDataFast(forceRefresh));
  }

  if (params.action === 'ping') {
    return createJsonResponse({
      status: 'success',
      message: '44S Ops_pro Fast Cloud Engine Ready (25 Tabel Terintegrasi & Granular CRUD)',
      timestamp: new Date().toISOString()
    });
  }

  if (params.action === 'dbHealth') {
    var report = typeof getDatabaseHealthReport === 'function'
      ? getDatabaseHealthReport()
      : { status: 'success', message: 'Setup.gs siap dijalankan' };
    return createJsonResponse(report);
  }

  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * 2. HTTP POST HANDLER
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var postData = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var payload = JSON.parse(postData);
    var result = processApiAction(payload);
    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/**
 * 3. NATIVE BRIDGE UNTUK INDEX.HTML (google.script.run.runClientApi)
 */
function runClientApi(payload) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if (!payload || payload.action === 'getAllData') {
      return getAllSpreadsheetDataFast(payload && payload.forceRefresh);
    }
    return processApiAction(payload);
  } catch (err) {
    return { status: 'error', message: err.toString() };
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/**
 * Helper Sinkronisasi Indeks Master Referensi Terpadu (44S_Ops_MasterRef)
 */
function syncMasterRefIndex(ss, refType, record, isDelete) {
  try {
    if (!record) return;
    var recId = String(record.id || '').trim();
    if (!recId) return;
    var masterId = refType + ':' + recId;
    if (isDelete) {
      deleteRowById(ss, SHEETS.MASTER_REF, { id: masterId });
      return;
    }
    var refItem = {
      id: masterId,
      refType: refType,
      code: record.code || record.nikOrNip || record.companyCode || record.accountNumber || record.requestNumber || recId,
      name: record.name || record.companyName || record.accountName || record.nopol || recId,
      category: record.category || record.group || record.jobTitle || record.accountType || record.vehicleClassification || refType,
      companyName: record.companyName || record.ownerCompany || record.department || 'PT Transindo Logistik',
      status: record.status || (record.isActive === false ? 'inactive' : 'active'),
      updatedAt: new Date().toISOString()
    };
    upsertSingleRecord(ss, SHEETS.MASTER_REF, refItem);
  } catch (ignore) {}
}

/**
 * Router Aksi Backend (Fokus Pada Item yang Dipilih Saja)
 */
function processApiAction(payload) {
  var action = payload.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var itemData = payload.data !== undefined ? payload.data : payload.payload;

  if (action === 'initDatabase') {
    if (typeof setupDatabase === 'function') {
      return setupDatabase();
    }
    ensureAllSheetsReady(ss);
    return { status: 'success', message: 'Seluruh Tabel Database Utama & Master Referensi siap digunakan.' };
  }

  if (action === 'optimizeDatabase') {
    if (typeof optimizeAllDatabaseSheets === 'function') {
      var res = optimizeAllDatabaseSheets();
      invalidateFastCache();
      return res;
    }
    return { status: 'success', message: 'Optimasi sel kosong selesai.' };
  }

  // NON-DESTRUCTIVE BATCH UPSERT (Hanya menambah/memperbarui per ID, tidak pernah menghapus/mengosongkan tabel)
  if (action === 'bulkSync' || action === 'syncAll') {
    ensureAllSheetsReady(ss);
    var data = itemData || {};

    if (Array.isArray(data.vehicles)) batchUpsertSheet(ss, SHEETS.VEHICLES, data.vehicles);
    if (Array.isArray(data.taxes)) batchUpsertSheet(ss, SHEETS.TAXES, data.taxes);
    if (Array.isArray(data.fuelLogs)) batchUpsertSheet(ss, SHEETS.FUEL, data.fuelLogs);
    if (Array.isArray(data.finances)) batchUpsertSheet(ss, SHEETS.FINANCE, data.finances);
    if (Array.isArray(data.pocketFlows)) batchUpsertSheet(ss, SHEETS.POCKET_FLOWS, data.pocketFlows);
    if (Array.isArray(data.equipmentFlows || data.equipmentList)) {
      batchUpsertSheet(ss, SHEETS.EQUIPMENT_FLOWS, data.equipmentFlows || data.equipmentList);
    }
    if (Array.isArray(data.tripSheets)) batchUpsertSheet(ss, SHEETS.TRIP_SHEETS, data.tripSheets);
    if (Array.isArray(data.timesheets)) batchUpsertSheet(ss, SHEETS.TIMESHEETS, data.timesheets);
    if (Array.isArray(data.maintenance)) batchUpsertSheet(ss, SHEETS.MAINTENANCE, data.maintenance);
    if (Array.isArray(data.sparepartInventory)) batchUpsertSheet(ss, SHEETS.SPAREPARTS, data.sparepartInventory);
    if (Array.isArray(data.sparepartMovements)) batchUpsertSheet(ss, SHEETS.SPAREPART_MOVEMENTS, data.sparepartMovements);
    if (Array.isArray(data.drivers)) batchUpsertSheet(ss, SHEETS.DRIVERS, data.drivers);
    if (Array.isArray(data.adminStaff)) batchUpsertSheet(ss, SHEETS.ADMIN_STAFF, data.adminStaff);
    if (Array.isArray(data.suppliers)) batchUpsertSheet(ss, SHEETS.SUPPLIERS, data.suppliers);
    if (Array.isArray(data.expenseCategories)) batchUpsertSheet(ss, SHEETS.EXPENSE_CATEGORIES, data.expenseCategories);
    if (Array.isArray(data.paymentMethods)) batchUpsertSheet(ss, SHEETS.PAYMENT_METHODS, data.paymentMethods);
    if (Array.isArray(data.accounts)) batchUpsertSheet(ss, SHEETS.ACCOUNTS, data.accounts);
    if (Array.isArray(data.serviceTypes)) batchUpsertSheet(ss, SHEETS.SERVICE_TYPES, data.serviceTypes);
    if (Array.isArray(data.simClasses)) batchUpsertSheet(ss, SHEETS.SIM_CLASSES, data.simClasses);
    if (Array.isArray(data.nonRentalCategories)) batchUpsertSheet(ss, SHEETS.NON_RENTAL_CATEGORIES, data.nonRentalCategories);
    if (Array.isArray(data.companyDeposits)) batchUpsertSheet(ss, SHEETS.COMPANY_DEPOSITS, data.companyDeposits);
    if (Array.isArray(data.depositTopUps)) batchUpsertSheet(ss, SHEETS.DEPOSIT_TOPUPS, data.depositTopUps);
    if (Array.isArray(data.depositRequests)) batchUpsertSheet(ss, SHEETS.DEPOSIT_REQUESTS, data.depositRequests);
    if (Array.isArray(data.users)) batchUpsertSheet(ss, SHEETS.USERS, data.users);
    if (Array.isArray(data.auditLogs)) {
      batchUpsertSheet(ss, SHEETS.AUDIT_LOGS, data.auditLogs.slice(0, 250));
    }

    invalidateFastCache();
    return {
      status: 'success',
      message: 'Sinkronisasi Non-Destructive Seluruh Tabel Utama & Master Referensi selesai (Data Aman & Hemat Sel)',
      timestamp: new Date().toISOString()
    };
  }

  // GRANULAR SINGLE-RECORD CRUD MAP (Fokus hanya pada 1 ID data yang dipilih)
  var granularMap = {
    addVehicle: { sheet: SHEETS.VEHICLES, mode: 'upsert', refType: 'vehicle' },
    updateVehicle: { sheet: SHEETS.VEHICLES, mode: 'upsert', refType: 'vehicle' },
    deleteVehicle: { sheet: SHEETS.VEHICLES, mode: 'delete', refType: 'vehicle' },
    addTax: { sheet: SHEETS.TAXES, mode: 'upsert' },
    updateTax: { sheet: SHEETS.TAXES, mode: 'upsert' },
    deleteTax: { sheet: SHEETS.TAXES, mode: 'delete' },
    addFuelLog: { sheet: SHEETS.FUEL, mode: 'upsert' },
    updateFuelLog: { sheet: SHEETS.FUEL, mode: 'upsert' },
    deleteFuelLog: { sheet: SHEETS.FUEL, mode: 'delete' },
    addFinance: { sheet: SHEETS.FINANCE, mode: 'upsert' },
    updateFinance: { sheet: SHEETS.FINANCE, mode: 'upsert' },
    deleteFinance: { sheet: SHEETS.FINANCE, mode: 'delete' },
    addPocketFlow: { sheet: SHEETS.POCKET_FLOWS, mode: 'upsert' },
    updatePocketFlow: { sheet: SHEETS.POCKET_FLOWS, mode: 'upsert' },
    deletePocketFlow: { sheet: SHEETS.POCKET_FLOWS, mode: 'delete' },
    addEquipmentFlow: { sheet: SHEETS.EQUIPMENT_FLOWS, mode: 'upsert' },
    updateEquipmentFlow: { sheet: SHEETS.EQUIPMENT_FLOWS, mode: 'upsert' },
    deleteEquipmentFlow: { sheet: SHEETS.EQUIPMENT_FLOWS, mode: 'delete' },
    addTripSheet: { sheet: SHEETS.TRIP_SHEETS, mode: 'upsert' },
    updateTripSheet: { sheet: SHEETS.TRIP_SHEETS, mode: 'upsert' },
    deleteTripSheet: { sheet: SHEETS.TRIP_SHEETS, mode: 'delete' },
    addTimesheet: { sheet: SHEETS.TIMESHEETS, mode: 'upsert' },
    updateTimesheet: { sheet: SHEETS.TIMESHEETS, mode: 'upsert' },
    deleteTimesheet: { sheet: SHEETS.TIMESHEETS, mode: 'delete' },
    addMaintenance: { sheet: SHEETS.MAINTENANCE, mode: 'upsert' },
    updateMaintenance: { sheet: SHEETS.MAINTENANCE, mode: 'upsert' },
    deleteMaintenance: { sheet: SHEETS.MAINTENANCE, mode: 'delete' },
    addSparepart: { sheet: SHEETS.SPAREPARTS, mode: 'upsert' },
    updateSparepart: { sheet: SHEETS.SPAREPARTS, mode: 'upsert' },
    deleteSparepart: { sheet: SHEETS.SPAREPARTS, mode: 'delete' },
    addSparepartMovement: { sheet: SHEETS.SPAREPART_MOVEMENTS, mode: 'upsert' },
    updateSparepartMovement: { sheet: SHEETS.SPAREPART_MOVEMENTS, mode: 'upsert' },
    deleteSparepartMovement: { sheet: SHEETS.SPAREPART_MOVEMENTS, mode: 'delete' },
    addDriver: { sheet: SHEETS.DRIVERS, mode: 'upsert', refType: 'driver' },
    updateDriver: { sheet: SHEETS.DRIVERS, mode: 'upsert', refType: 'driver' },
    deleteDriver: { sheet: SHEETS.DRIVERS, mode: 'delete', refType: 'driver' },
    addAdminStaff: { sheet: SHEETS.ADMIN_STAFF, mode: 'upsert', refType: 'admin_staff' },
    updateAdminStaff: { sheet: SHEETS.ADMIN_STAFF, mode: 'upsert', refType: 'admin_staff' },
    deleteAdminStaff: { sheet: SHEETS.ADMIN_STAFF, mode: 'delete', refType: 'admin_staff' },
    addSupplier: { sheet: SHEETS.SUPPLIERS, mode: 'upsert', refType: 'supplier' },
    updateSupplier: { sheet: SHEETS.SUPPLIERS, mode: 'upsert', refType: 'supplier' },
    deleteSupplier: { sheet: SHEETS.SUPPLIERS, mode: 'delete', refType: 'supplier' },
    addExpenseCategory: { sheet: SHEETS.EXPENSE_CATEGORIES, mode: 'upsert', refType: 'expense_category' },
    updateExpenseCategory: { sheet: SHEETS.EXPENSE_CATEGORIES, mode: 'upsert', refType: 'expense_category' },
    deleteExpenseCategory: { sheet: SHEETS.EXPENSE_CATEGORIES, mode: 'delete', refType: 'expense_category' },
    addPaymentMethod: { sheet: SHEETS.PAYMENT_METHODS, mode: 'upsert', refType: 'payment_method' },
    updatePaymentMethod: { sheet: SHEETS.PAYMENT_METHODS, mode: 'upsert', refType: 'payment_method' },
    deletePaymentMethod: { sheet: SHEETS.PAYMENT_METHODS, mode: 'delete', refType: 'payment_method' },
    addAccount: { sheet: SHEETS.ACCOUNTS, mode: 'upsert', refType: 'account' },
    updateAccount: { sheet: SHEETS.ACCOUNTS, mode: 'upsert', refType: 'account' },
    deleteAccount: { sheet: SHEETS.ACCOUNTS, mode: 'delete', refType: 'account' },
    addServiceType: { sheet: SHEETS.SERVICE_TYPES, mode: 'upsert', refType: 'service_type' },
    updateServiceType: { sheet: SHEETS.SERVICE_TYPES, mode: 'upsert', refType: 'service_type' },
    deleteServiceType: { sheet: SHEETS.SERVICE_TYPES, mode: 'delete', refType: 'service_type' },
    addSimClass: { sheet: SHEETS.SIM_CLASSES, mode: 'upsert', refType: 'sim_class' },
    updateSimClass: { sheet: SHEETS.SIM_CLASSES, mode: 'upsert', refType: 'sim_class' },
    deleteSimClass: { sheet: SHEETS.SIM_CLASSES, mode: 'delete', refType: 'sim_class' },
    addNonRentalCategory: { sheet: SHEETS.NON_RENTAL_CATEGORIES, mode: 'upsert', refType: 'non_rental_category' },
    updateNonRentalCategory: { sheet: SHEETS.NON_RENTAL_CATEGORIES, mode: 'upsert', refType: 'non_rental_category' },
    deleteNonRentalCategory: { sheet: SHEETS.NON_RENTAL_CATEGORIES, mode: 'delete', refType: 'non_rental_category' },
    addCompanyDeposit: { sheet: SHEETS.COMPANY_DEPOSITS, mode: 'upsert', refType: 'company_deposit' },
    updateCompanyDeposit: { sheet: SHEETS.COMPANY_DEPOSITS, mode: 'upsert', refType: 'company_deposit' },
    deleteCompanyDeposit: { sheet: SHEETS.COMPANY_DEPOSITS, mode: 'delete', refType: 'company_deposit' },
    addDepositTopUp: { sheet: SHEETS.DEPOSIT_TOPUPS, mode: 'upsert' },
    updateDepositTopUp: { sheet: SHEETS.DEPOSIT_TOPUPS, mode: 'upsert' },
    deleteDepositTopUp: { sheet: SHEETS.DEPOSIT_TOPUPS, mode: 'delete' },
    addDepositRequest: { sheet: SHEETS.DEPOSIT_REQUESTS, mode: 'upsert' },
    updateDepositRequest: { sheet: SHEETS.DEPOSIT_REQUESTS, mode: 'upsert' },
    deleteDepositRequest: { sheet: SHEETS.DEPOSIT_REQUESTS, mode: 'delete' },
    addUser: { sheet: SHEETS.USERS, mode: 'upsert' },
    updateUser: { sheet: SHEETS.USERS, mode: 'upsert' },
    deleteUser: { sheet: SHEETS.USERS, mode: 'delete' },
    addAuditLog: { sheet: SHEETS.AUDIT_LOGS, mode: 'upsert' },
    deleteAuditLog: { sheet: SHEETS.AUDIT_LOGS, mode: 'delete' }
  };

  if (granularMap[action]) {
    var target = granularMap[action];
    if (target.mode === 'upsert') {
      var upRes = upsertSingleRecord(ss, target.sheet, itemData);
      if (target.refType) syncMasterRefIndex(ss, target.refType, itemData, false);
      invalidateFastCache();
      return { status: 'success', action: action, result: upRes };
    } else if (target.mode === 'delete') {
      var delRes = deleteRowById(ss, target.sheet, itemData);
      if (target.refType) syncMasterRefIndex(ss, target.refType, itemData, true);
      invalidateFastCache();
      return { status: 'success', action: action, result: delRes };
    }
  }

  if (action === 'payTax' && itemData) {
    if (itemData.updatedTax) upsertSingleRecord(ss, SHEETS.TAXES, itemData.updatedTax);
    if (itemData.newFinance) upsertSingleRecord(ss, SHEETS.FINANCE, itemData.newFinance);
    if (itemData.updatedAccount) upsertSingleRecord(ss, SHEETS.ACCOUNTS, itemData.updatedAccount);
    invalidateFastCache();
    return { status: 'success', action: action };
  }

  if (action === 'topUpCompanyDeposit' && itemData) {
    if (itemData.updatedDeposit) upsertSingleRecord(ss, SHEETS.COMPANY_DEPOSITS, itemData.updatedDeposit);
    if (itemData.topUpTx) upsertSingleRecord(ss, SHEETS.FINANCE, itemData.topUpTx);
    if (itemData.topUpRecord) upsertSingleRecord(ss, SHEETS.DEPOSIT_TOPUPS, itemData.topUpRecord);
    if (itemData.updatedAccount) upsertSingleRecord(ss, SHEETS.ACCOUNTS, itemData.updatedAccount);
    invalidateFastCache();
    return { status: 'success', action: action };
  }

  if (action === 'transferBalance' && itemData) {
    if (itemData.fromAccount) upsertSingleRecord(ss, SHEETS.ACCOUNTS, itemData.fromAccount);
    if (itemData.toAccount) upsertSingleRecord(ss, SHEETS.ACCOUNTS, itemData.toAccount);
    if (itemData.transferTx) upsertSingleRecord(ss, SHEETS.FINANCE, itemData.transferTx);
    invalidateFastCache();
    return { status: 'success', action: action };
  }

  if (action === 'upsertRecord') {
    var sheetName = resolveSheetName(payload.module);
    if (!sheetName) return { status: 'error', message: 'Modul tidak dikenali: ' + payload.module };
    var resUp = upsertSingleRecord(ss, sheetName, payload.record || itemData);
    invalidateFastCache();
    return { status: 'success', module: payload.module, result: resUp };
  }

  if (action === 'deleteRecord') {
    var delSheetName = resolveSheetName(payload.module);
    if (!delSheetName) return { status: 'error', message: 'Modul tidak dikenali: ' + payload.module };
    var targetDelPayload = itemData || payload;
    var resDel = deleteRowById(ss, delSheetName, targetDelPayload);
    invalidateFastCache();
    return { status: 'success', module: payload.module, result: resDel };
  }

  if (action === 'triggerAlarmEmail') {
    var sentCount = checkAndSendOperationalAlarms(payload.recipientEmail);
    return { status: 'success', emailsSent: sentCount };
  }

  return { status: 'success', message: 'Action diterima: ' + action };
}

function getAllSpreadsheetDataFast(forceRefresh) {
  var cache = CacheService.getScriptCache();
  if (!forceRefresh) {
    var cachedJson = cache.get(CACHE_KEY_ALL_DATA);
    if (cachedJson) {
      try {
        var parsed = JSON.parse(cachedJson);
        parsed.fromCache = true;
        return parsed;
      } catch (e) {}
    }
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureAllSheetsReady(ss);
  var vaultMap = loadReceiptVaultMap(ss);

  var responsePayload = {
    status: 'success',
    fromCache: false,
    timestamp: new Date().toISOString(),
    data: {
      vehicles: readSheetFast(ss, SHEETS.VEHICLES, vaultMap),
      taxes: readSheetFast(ss, SHEETS.TAXES, vaultMap),
      fuelLogs: readSheetFast(ss, SHEETS.FUEL, vaultMap),
      finances: readSheetFast(ss, SHEETS.FINANCE, vaultMap),
      pocketFlows: readSheetFast(ss, SHEETS.POCKET_FLOWS, vaultMap),
      equipmentList: readSheetFast(ss, SHEETS.EQUIPMENT_FLOWS, vaultMap),
      equipmentFlows: readSheetFast(ss, SHEETS.EQUIPMENT_FLOWS, vaultMap),
      tripSheets: readSheetFast(ss, SHEETS.TRIP_SHEETS, vaultMap),
      timesheets: readSheetFast(ss, SHEETS.TIMESHEETS, vaultMap),
      maintenance: readSheetFast(ss, SHEETS.MAINTENANCE, vaultMap),
      sparepartInventory: readSheetFast(ss, SHEETS.SPAREPARTS, vaultMap),
      sparepartMovements: readSheetFast(ss, SHEETS.SPAREPART_MOVEMENTS, vaultMap),
      drivers: readSheetFast(ss, SHEETS.DRIVERS, vaultMap),
      adminStaff: readSheetFast(ss, SHEETS.ADMIN_STAFF, vaultMap),
      suppliers: readSheetFast(ss, SHEETS.SUPPLIERS, vaultMap),
      expenseCategories: readSheetFast(ss, SHEETS.EXPENSE_CATEGORIES, vaultMap),
      paymentMethods: readSheetFast(ss, SHEETS.PAYMENT_METHODS, vaultMap),
      accounts: readSheetFast(ss, SHEETS.ACCOUNTS, vaultMap),
      serviceTypes: readSheetFast(ss, SHEETS.SERVICE_TYPES, vaultMap),
      simClasses: readSheetFast(ss, SHEETS.SIM_CLASSES, vaultMap),
      nonRentalCategories: readSheetFast(ss, SHEETS.NON_RENTAL_CATEGORIES, vaultMap),
      companyDeposits: readSheetFast(ss, SHEETS.COMPANY_DEPOSITS, vaultMap),
      depositTopUps: readSheetFast(ss, SHEETS.DEPOSIT_TOPUPS, vaultMap),
      depositRequests: readSheetFast(ss, SHEETS.DEPOSIT_REQUESTS, vaultMap),
      users: readSheetFast(ss, SHEETS.USERS, vaultMap),
      auditLogs: readSheetFast(ss, SHEETS.AUDIT_LOGS, vaultMap),
      masterRef: readSheetFast(ss, SHEETS.MASTER_REF, vaultMap)
    }
  };

  try {
    var serialized = JSON.stringify(responsePayload);
    if (serialized.length < 95000) {
      cache.put(CACHE_KEY_ALL_DATA, serialized, CACHE_TTL_SECONDS);
    }
  } catch (ignore) {}

  return responsePayload;
}

function invalidateFastCache() {
  try {
    CacheService.getScriptCache().remove(CACHE_KEY_ALL_DATA);
  } catch (ignore) {}
}

function loadReceiptVaultMap(ss) {
  var map = {};
  try {
    var sheet = ss.getSheetByName(SHEETS.RECEIPT_VAULT);
    if (!sheet || sheet.getLastRow() <= 1) return map;
    var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
    for (var i = 0; i < rows.length; i++) {
      var vKey = String(rows[i][0] || '').trim();
      if (!vKey) continue;
      var combined = String(rows[i][3] || '') + String(rows[i][4] || '') + String(rows[i][5] || '') + String(rows[i][6] || '');
      if (combined) {
        map[vKey] = combined;
      }
    }
  } catch (ignore) {}
  return map;
}

function saveToReceiptVault(ss, recordId, fieldKey, fullDataUrl) {
  try {
    if (!ss || !fullDataUrl) return fullDataUrl;
    var vaultKey = String(recordId || 'REC').trim() + '__' + String(fieldKey || 'receiptProofUrl').trim();
    var headers = SHEET_SCHEMAS[SHEETS.RECEIPT_VAULT];
    var sheet = getOrCreateSheetWithSchema(ss, SHEETS.RECEIPT_VAULT, headers);
    var c1 = fullDataUrl.substring(0, 40000);
    var c2 = fullDataUrl.substring(40000, 80000);
    var c3 = fullDataUrl.substring(80000, 120000);
    var c4 = fullDataUrl.substring(120000, 160000);
    var rowVals = [vaultKey, String(recordId || ''), String(fieldKey || ''), c1, c2, c3, c4, new Date().toISOString()];

    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0] || '').trim() === vaultKey) {
          sheet.getRange(i + 2, 1, 1, headers.length).setValues([rowVals]);
          return '[VAULT_REF:' + vaultKey + ']';
        }
      }
    }
    sheet.getRange(lastRow + 1, 1, 1, headers.length).setValues([rowVals]);
    return '[VAULT_REF:' + vaultKey + ']';
  } catch (ignore) {
    return fullDataUrl;
  }
}

function readSheetFast(ss, sheetName, vaultMap) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol < 1) return [];

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0];
  var schemaHeaders = SHEET_SCHEMAS[sheetName] || [];
  var results = [];
  var vMap = vaultMap || {};

  for (var i = 1; i < values.length; i++) {
    var row = values[i];

    // Skip completely empty rows
    var hasAnyValue = false;
    for (var k = 0; k < row.length; k++) {
      if (row[k] !== '' && row[k] !== null && row[k] !== undefined) {
        hasAnyValue = true;
        break;
      }
    }
    if (!hasAnyValue) continue;

    var parsedObj = null;
    // 1. Scan all cells in the row right-to-left for a valid JSON object string ({...})
    for (var j = row.length - 1; j >= 0; j--) {
      var cellVal = row[j];
      if (typeof cellVal === 'string') {
        var trimmed = cellVal.trim();
        if (trimmed.length > 10 && trimmed.charAt(0) === '{' && trimmed.charAt(trimmed.length - 1) === '}') {
          try {
            var candidate = JSON.parse(trimmed);
            if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
              parsedObj = candidate;
              break;
            }
          } catch (err) {}
        }
      }
    }

    // 2. Also extract column values using actual headers AND schema headers
    var colObj = {};
    for (var c = 0; c < row.length; c++) {
      var val = row[c];
      if (val === '' || val === null || val === undefined) continue;
      if (typeof val === 'string' && val.trim().charAt(0) === '{' && val.trim().charAt(val.trim().length - 1) === '}') {
        continue;
      }
      var formattedVal = (val instanceof Date)
        ? Utilities.formatDate(val, Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd')
        : val;

      var headerKey = headers[c] ? String(headers[c]).trim() : '';
      if (headerKey && headerKey !== 'rawJson') {
        colObj[headerKey] = formattedVal;
      }
      var schemaKey = schemaHeaders[c];
      if (schemaKey && schemaKey !== 'rawJson' && colObj[schemaKey] === undefined) {
        colObj[schemaKey] = formattedVal;
      }
    }

    var finalObj = parsedObj ? parsedObj : colObj;
    if (parsedObj) {
      for (var ck in colObj) {
        if (finalObj[ck] === undefined || finalObj[ck] === '' || finalObj[ck] === null) {
          finalObj[ck] = colObj[ck];
        }
      }
    }

    // Restore any chunked attachments from 44S_Ops_ReceiptVault
    var attachmentFields = ['receiptProofUrl', 'attachmentUrl', 'attachmentDataUrl', 'receiptDataUrl', 'photoUrl', 'ktpPhotoUrl', 'simPhotoUrl', 'proofImage'];
    for (var af = 0; af < attachmentFields.length; af++) {
      var aKey = attachmentFields[af];
      var aVal = finalObj[aKey];
      if (typeof aVal === 'string' && aVal.indexOf('[VAULT_REF:') === 0) {
        var refKey = aVal.replace('[VAULT_REF:', '').replace(']', '').trim();
        if (vMap[refKey]) {
          finalObj[aKey] = vMap[refKey];
        }
      }
    }

    // 3. Normalize common aliases
    if (!finalObj.id) {
      finalObj.id = finalObj.ID || finalObj.Id || (row[0] ? String(row[0]).trim() : '');
    }
    if (!finalObj.id) {
      finalObj.id = 'ROW-' + i;
      try { sheet.getRange(i + 1, 1).setValue(finalObj.id); } catch (ignore) {}
    } else {
      finalObj.id = String(finalObj.id).trim();
    }

    if (!finalObj.nopol && (finalObj.plateNumber || finalObj.No_Polisi || finalObj['No. Polisi'])) {
      finalObj.nopol = finalObj.plateNumber || finalObj.No_Polisi || finalObj['No. Polisi'];
    }
    if (!finalObj.ownerCompany && finalObj.companyName) {
      finalObj.ownerCompany = finalObj.companyName;
    }
    if (!finalObj.companyName && finalObj.ownerCompany) {
      finalObj.companyName = finalObj.ownerCompany;
    }
    if (!finalObj.name && finalObj.fullName) {
      finalObj.name = finalObj.fullName;
    }
    if (!finalObj.documentType && finalObj.taxType) {
      finalObj.documentType = finalObj.taxType;
    }
    if (finalObj.amount === undefined && finalObj.estimatedCost !== undefined) {
      finalObj.amount = finalObj.estimatedCost;
    }
    if (!finalObj.volumeLiters && finalObj.liters) {
      finalObj.volumeLiters = finalObj.liters;
    }
    if (!finalObj.fuelStation && finalObj.stationName) {
      finalObj.fuelStation = finalObj.stationName;
    }
    if (!finalObj.equipmentName && finalObj.itemName) {
      finalObj.equipmentName = finalObj.itemName;
    }
    if (finalObj.quantity === undefined && finalObj.qty !== undefined) {
      finalObj.quantity = finalObj.qty;
    }
    if (!finalObj.suratJalanNumber && finalObj.doNumber) {
      finalObj.suratJalanNumber = finalObj.doNumber;
    }

    finalObj._sheetRowIndex = i - 1;
    results.push(finalObj);
  }
  return results;
}

/**
 * Non-Destructive Batch Upsert (Tidak pernah melakukan clearContent / hapus seluruh tabel)
 * Hanya memperbarui baris yang memiliki ID sama atau menambahkan baris baru.
 */
function batchUpsertSheet(ss, sheetName, records) {
  if (!Array.isArray(records) || records.length === 0) return;
  for (var i = 0; i < records.length; i++) {
    if (records[i] && records[i].id) {
      upsertSingleRecord(ss, sheetName, records[i]);
    }
  }
}

/**
 * Fokus Edit / Tambah 1 Data Terpilih Saja Berdasarkan ID Unik
 */
function upsertSingleRecord(ss, sheetName, record) {
  if (!record || typeof record !== 'object') return { updated: false, reason: 'Data kosong' };
  var targetId = String(record.id || '').trim();
  if (!targetId) return { updated: false, reason: 'ID data kosong' };

  var headers = SHEET_SCHEMAS[sheetName] || ['id', 'rawJson'];
  var sheet = getOrCreateSheetWithSchema(ss, sheetName, headers);
  var cleanRec = sanitizeRecordForDatabase(record, ss);
  var rowValues = mapRecordToRow(cleanRec, headers);

  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), headers.length);
  if (lastRow > 1) {
    var allRows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    // Pass 1: Match by Column A ID or embedded rawJson ID
    for (var i = 0; i < allRows.length; i++) {
      var row = allRows[i];
      if (String(row[0] || '').trim() === targetId) {
        sheet.getRange(i + 2, 1, 1, headers.length).setValues([rowValues]);
        return { updated: true, mode: 'edit_single_row', id: targetId, row: i + 2 };
      }
      for (var c = row.length - 1; c >= 0; c--) {
        if (typeof row[c] === 'string' && row[c].indexOf('"id"') !== -1) {
          try {
            var parsed = JSON.parse(row[c]);
            if (parsed && String(parsed.id || '').trim() === targetId) {
              sheet.getRange(i + 2, 1, 1, headers.length).setValues([rowValues]);
              return { updated: true, mode: 'edit_single_row_json', id: targetId, row: i + 2 };
            }
          } catch (ignore) {}
        }
      }
    }

    // Pass 2: Match fallback row index ID (e.g. VEH-ROW-1 or _sheetRowIndex) for legacy rows without ID
    var rowMatch = targetId.match(/ROW-(\d+)/i);
    var fallbackIdx = rowMatch ? (parseInt(rowMatch[1], 10) - 1) : (typeof record._sheetRowIndex === 'number' ? record._sheetRowIndex : -1);
    if (fallbackIdx >= 0 && fallbackIdx < allRows.length) {
      var existingColA = String(allRows[fallbackIdx][0] || '').trim();
      if (!existingColA || existingColA === targetId || existingColA.indexOf('ROW-') !== -1) {
        sheet.getRange(fallbackIdx + 2, 1, 1, headers.length).setValues([rowValues]);
        return { updated: true, mode: 'edit_single_row_index', id: targetId, row: fallbackIdx + 2 };
      }
    }
  }

  sheet.getRange(lastRow + 1, 1, 1, headers.length).setValues([rowValues]);
  return { updated: true, mode: 'insert_single_row', id: targetId, row: lastRow + 1 };
}

/**
 * Fokus Hapus 1 Data Terpilih Saja Berdasarkan ID Unik (Tidak menyentuh baris lain)
 */
function deleteRowById(ss, sheetName, idOrPayload) {
  var targetId = '';
  var targetRowIndex = -1;
  if (idOrPayload && typeof idOrPayload === 'object') {
    targetId = String(idOrPayload.id || '').trim();
    if (typeof idOrPayload.rowIndex === 'number') {
      targetRowIndex = idOrPayload.rowIndex;
    } else if (typeof idOrPayload._sheetRowIndex === 'number') {
      targetRowIndex = idOrPayload._sheetRowIndex;
    }
  } else {
    targetId = String(idOrPayload || '').trim();
  }

  if (!targetId && targetRowIndex < 0) return { deleted: false, reason: 'ID tidak valid' };
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return { deleted: false, reason: 'Sheet belum memiliki data' };

  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var allRows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  // Pass 1: Match by Column A ID or embedded rawJson ID
  if (targetId) {
    for (var i = 0; i < allRows.length; i++) {
      var row = allRows[i];
      if (String(row[0] || '').trim() === targetId) {
        sheet.deleteRow(i + 2);
        return { deleted: true, mode: 'delete_single_row', id: targetId, row: i + 2 };
      }
      for (var c = row.length - 1; c >= 0; c--) {
        if (typeof row[c] === 'string' && row[c].indexOf('"id"') !== -1) {
          try {
            var parsed = JSON.parse(row[c]);
            if (parsed && String(parsed.id || '').trim() === targetId) {
              sheet.deleteRow(i + 2);
              return { deleted: true, mode: 'delete_single_row_json', id: targetId, row: i + 2 };
            }
          } catch (ignore) {}
        }
      }
    }
  }

  // Pass 2: Match fallback row index ID (e.g. VEH-ROW-1 or rowIndex) for legacy rows without ID in Column A
  var rowMatch = targetId ? targetId.match(/ROW-(\d+)/i) : null;
  var fallbackIdx = rowMatch ? (parseInt(rowMatch[1], 10) - 1) : targetRowIndex;
  if (fallbackIdx >= 0 && fallbackIdx < allRows.length) {
    sheet.deleteRow(fallbackIdx + 2);
    return { deleted: true, mode: 'delete_single_row_index', id: targetId, row: fallbackIdx + 2 };
  }

  return { deleted: false, id: targetId, reason: 'ID tidak ditemukan' };
}

function sanitizeRecordForDatabase(record, ss) {
  if (!record || typeof record !== 'object') return {};
  var copy = JSON.parse(JSON.stringify(record));
  delete copy._sheetRowIndex;
  var activeSs = ss || SpreadsheetApp.getActiveSpreadsheet();
  var heavyFields = ['receiptProofUrl', 'attachmentUrl', 'attachmentDataUrl', 'receiptDataUrl', 'photoUrl', 'ktpPhotoUrl', 'simPhotoUrl', 'proofImage'];

  // 1. Keep compact receipts (<= 38,000 chars / ~26 KB) directly in rawJson (1 cell, hemat penyimpanan).
  //    If any attachment exceeds 38,000 chars, store it safely in 44S_Ops_ReceiptVault without losing data.
  for (var i = 0; i < heavyFields.length; i++) {
    var key = heavyFields[i];
    if (typeof copy[key] === 'string' && copy[key].length > 38000) {
      copy[key] = saveToReceiptVault(activeSs, copy.id || 'REC', key, copy[key]);
    }
  }

  // 2. If total JSON string still approaches Google Sheets 50,000-char cell limit, offload remaining attachments to vault
  var serialized = JSON.stringify(copy);
  if (serialized.length > 46000) {
    for (var j = 0; j < heavyFields.length; j++) {
      var hKey = heavyFields[j];
      if (typeof copy[hKey] === 'string' && copy[hKey].length > 1500 && copy[hKey].indexOf('[VAULT_REF:') !== 0) {
        copy[hKey] = saveToReceiptVault(activeSs, copy.id || 'REC', hKey, copy[hKey]);
      }
    }
  }
  return copy;
}

function resolveValueForHeader(record, h) {
  if (!record || typeof record !== 'object') return '';
  if (h === 'rawJson') {
    var jsonStr = JSON.stringify(record);
    return jsonStr.length > 49500 ? jsonStr.substring(0, 49500) : jsonStr;
  }
  if (h === 'allowedModulesJson' || h === 'Modul Aktif (JSON)') {
    return JSON.stringify(record.allowedTabs || record.allowedModules || []);
  }

  // Exact match on record first (if not a JSON blob sitting in a display field)
  if (record[h] !== undefined && record[h] !== null && record[h] !== '') {
    var directVal = record[h];
    if (!(typeof directVal === 'string' && directVal.trim().charAt(0) === '{')) {
      return directVal;
    }
  }

  var map = {
    'ID Unit': record.id,
    'ID Pajak': record.id,
    'ID Log': record.id,
    'ID Transaksi': record.id,
    'ID Timesheet': record.id,
    'ID Servis': record.id,
    'ID Supir': record.id,
    'ID Akun': record.id,
    'id': record.id,

    'No. Polisi': record.nopol,
    'Unit Pegangan (Nopol)': record.assignedVehicle || record.nopol,
    'nopol': record.nopol,

    'Merk / Model': (record.brand || '') + (record.model && String(record.brand || '').indexOf(String(record.model)) === -1 ? ' ' + record.model : ''),
    'Tipe Kendaraan': record.type,
    'Tahun': record.year,
    'Bahan Bakar': record.fuelType || 'Solar Dexlite',
    'Jenis BBM': record.fuelType || 'Bio Solar',
    'No. Rangka': record.chassisNumber || '',
    'No. Mesin': record.engineNumber || '',
    'Odometer Terkini (KM)': record.currentOdometer !== undefined ? record.currentOdometer : (record.odometer || 0),
    'Odometer Saat Ini': record.odometer !== undefined ? record.odometer : (record.currentOdometer || 0),
    'Odometer Servis (KM)': record.odometerAtService !== undefined ? record.odometerAtService : (record.odometer || 0),
    'Status Operasi': record.status || 'active',
    'Status Validasi': record.status || 'approved',
    'Status Tugas': record.status || 'active',
    'Status': record.status || 'active',
    'Supir Tetap': record.assignedDriver || record.driverName || '',
    'Supir': record.driverName || record.assignedDriver || '',
    'No HP Supir': record.driverPhone || '',
    'Jatuh Tempo Pajak 1 Thn': record.stnk1YearDate || '',
    'Jatuh Tempo Plat 5 Thn': record.stnk5YearDate || '',
    'Jatuh Tempo KIR': record.kirDate || '',
    'Jatuh Tempo Asuransi': record.insuranceDate || '',
    'Target Km/Liter': record.targetKmPerLiter !== undefined ? record.targetKmPerLiter : '',
    'Kapasitas (Ton)': record.capacityTon !== undefined ? record.capacityTon : '',
    'Perusahaan / Pemilik': record.ownerCompany || record.companyName || record.purchasedByCompany || record.sourceCompanyName || '',
    'ownerCompany': record.ownerCompany || record.companyName || '',
    'companyName': record.companyName || record.ownerCompany || '',
    'Catatan': record.notes || record.description || '',
    'Keterangan': record.notes || record.description || '',
    'Catatan Servis': record.notes || record.description || '',

    // Taxes
    'ID Unit ': record.vehicleId,
    'Jenis Dokumen': record.documentType || record.taxType || record.type || '',
    'Tanggal Jatuh Tempo': record.dueDate || '',
    'Tgl Bayar Terakhir': record.lastPaymentDate || record.paidDate || '',
    'Estimasi Biaya (Rp)': record.amount !== undefined ? record.amount : (record.estimatedCost || 0),
    'Denda (Rp)': record.penaltyAmount !== undefined ? record.penaltyAmount : 0,
    'Samsat / Lokasi KIR': record.agentOrSamsat || record.samsatLocation || '',

    // Fuel
    'Tanggal': record.date || record.serviceDate || record.departureDate || '',
    'Volume (Liter)': record.volumeLiters !== undefined ? record.volumeLiters : (record.liters || 0),
    'Harga per Liter (Rp)': record.pricePerLiter !== undefined ? record.pricePerLiter : 0,
    'Total Biaya (Rp)': record.totalCost !== undefined ? record.totalCost : (record.amount || 0),
    'Jarak Tempuh (KM)': record.distanceTravelled !== undefined ? record.distanceTravelled : (record.distanceTraveled || 0),
    'Konsumsi (KM/Liter)': record.calculatedKmPerLiter !== undefined ? record.calculatedKmPerLiter : (record.kmPerLiter || ''),
    'Lokasi SPBU': record.fuelStation || record.stationName || '',
    'Full Tank?': record.isFullTank === false ? 'Tidak' : 'Ya',
    'No. Struk': record.receiptNumber || '',

    // Finance
    'Kategori': record.category || '',
    'Tipe (Debet/Kredit)': record.type || '',
    'Jumlah (Rp)': record.amount !== undefined ? record.amount : 0,
    'Kode Trip / DO': record.tripCode || record.tripRoute || '',
    'Deskripsi': record.description || record.notes || '',
    'Metode Bayar': record.paymentMethod || '',
    'No. Kuitansi': record.receiptNumber || record.referenceNo || '',
    'ID Akun Rekening': record.accountId || '',
    'Nama Akun Rekening': record.accountName || '',

    // Timesheets
    'Kernet': record.helperName || '',
    'Asal (Origin)': record.originLocation || '',
    'Tujuan (Destination)': record.destinationLocation || '',
    'Jam Mulai': record.startTime || '',
    'Jam Selesai': record.endTime || '',
    'Total Jam': record.totalHours !== undefined ? record.totalHours : 0,
    'Jam Lembur': record.overtimeHours !== undefined ? record.overtimeHours : 0,
    'Muatan Barang': record.cargoDescription || record.cargoType || '',
    'Tonase (Ton)': record.cargoTonnageTon !== undefined ? record.cargoTonnageTon : 0,
    'Jumlah Rit': record.tripCount !== undefined ? record.tripCount : 1,
    'KM Awal': record.startKm !== undefined ? record.startKm : 0,
    'KM Akhir': record.endKm !== undefined ? record.endKm : 0,
    'Jarak (KM)': record.totalDistanceKm !== undefined ? record.totalDistanceKm : 0,

    // Maintenance
    'Tanggal Servis': record.serviceDate || record.date || '',
    'Target Odo Berikutnya (KM)': record.nextServiceOdometer !== undefined ? record.nextServiceOdometer : '',
    'Tgl Servis Berikutnya': record.nextServiceDate || '',
    'Jenis Pekerjaan': record.serviceType || '',
    'Nama Bengkel / Montir': (record.workshopName || '') + (record.mechanicName ? ' / ' + record.mechanicName : ''),
    'No. SPK / WO': record.workOrderNumber || '',
    'Biaya Jasa (Rp)': record.laborCost !== undefined ? record.laborCost : 0,
    'Rincian Sparepart': Array.isArray(record.spareparts)
      ? record.spareparts.map(function(p) { return (p.name || p.partName || '') + ' (' + (p.qty || 1) + ')'; }).join(', ')
      : (record.partsReplaced || record.description || ''),

    // Drivers
    'Nama Lengkap': record.name || '',
    'NIK KTP': record.nik || record.nip || '',
    'No. WhatsApp / HP': record.phone || '',
    'Golongan SIM': record.simType || '',
    'No. SIM': record.simNumber || '',
    'Masa Berlaku SIM': record.simExpiry || record.simExpiryDate || '',
    'Tanggal Bergabung': record.joinDate || '',

    // Accounts
    'Nama Akun / Rekening': record.accountName || '',
    'Nomor Rekening': record.accountNumber || '',
    'Bank / Penyedia': record.bankOrProvider || record.bankName || '',
    'Tipe Akun': record.accountType || '',
    'Saldo Awal (Rp)': record.initialBalance !== undefined ? record.initialBalance : 0,
    'Saldo Terkini (Rp)': record.currentBalance !== undefined ? record.currentBalance : 0,

    // Company Deposits
    'contactPerson': record.picName || record.contactPerson || '',
    'phone': record.picPhone || record.phone || '',
    'depositedAmount': record.initialDeposit !== undefined ? record.initialDeposit : (record.depositedAmount || 0),
    'usedPocketMoney': record.totalTopUp !== undefined ? record.totalTopUp : (record.usedPocketMoney || 0),
    'usedFuelCost': record.totalUsed !== undefined ? record.totalUsed : (record.usedFuelCost || 0),
    'remainingBalance': record.currentBalance !== undefined ? record.currentBalance : (record.remainingBalance || 0),
    'companyCode': record.companyCode || '',

    // Audit Logs
    'Waktu Timestamp': record.timestamp || '',
    'User ID': record.userId || '',
    'Nama Pengguna': record.userName || '',
    'Hak Akses (Role)': record.userRole || '',
    'Modul': record.module || '',
    'Aksi': record.action || '',
    'Keterangan Aktivitas': record.description || record.title || '',
    'Detail Tambahan': record.targetName ? ((record.title || '') + ' [' + record.targetName + ']') : (record.title || ''),

    // Master Karyawan Administrasi (44S_Ops_AdminStaff)
    'ID Staf': record.id,
    'NIK / NIP': record.nikOrNip || record.nip || '',
    'Jabatan': record.jobTitle || '',
    'Peran / Role': record.role || record.jobTitle || '',
    'Departemen': record.department || '',
    'Email': record.email || '',
    'Alamat': record.address || '',

    // Master Supplier Peralatan & Sparepart (44S_Ops_Suppliers)
    'ID Supplier': record.id,
    'Kode Supplier': record.code || '',
    'Nama Supplier / Toko': record.name || '',
    'PIC / Kontak': record.contactPerson || '',
    'No. Telepon / WA': record.phone || '',
    'Bank': record.bankName || '',
    'No. Rekening': record.accountNumber || '',
    'Termin Pembayaran': record.paymentTerms || '',
    'Status Aktif': record.isActive === false ? 'Non-Aktif' : 'Aktif',

    // Master Jenis Pengeluaran (44S_Ops_ExpenseCategories)
    'ID Kategori': record.id,
    'Kode Pengeluaran': record.code || '',
    'Nama Jenis Pengeluaran': record.name || '',
    'Kelompok / Grup': record.group || '',
    'Plafon / Standar Biaya (Rp)': record.defaultAmount !== undefined ? record.defaultAmount : 0,
    'Wajib Nota?': record.requiresReceipt === false ? 'Tidak' : 'Ya',

    // Master Metode Pembayaran (44S_Ops_PaymentMethods)
    'ID Metode': record.id,
    'Kode Metode': record.code || '',
    'Nama Metode Pembayaran': record.name || '',
    'ID Rekening Default': record.defaultAccountId || '',
    'Nama Rekening Default': record.defaultAccountName || '',
    'Wajib Bukti?': record.requiresProof === false ? 'Tidak' : 'Ya',

    // Master Jenis Servis Bengkel (44S_Ops_ServiceTypes)
    'ID Jenis Servis': record.id,
    'Kode Servis': record.code || '',
    'Nama Pekerjaan Servis': record.name || '',
    'Kategori Servis': record.category || '',
    'Interval KM': record.defaultIntervalKm !== undefined ? record.defaultIntervalKm : 0,
    'Interval Hari': record.defaultIntervalDays !== undefined ? record.defaultIntervalDays : 0,
    'Suku Cadang Umum': Array.isArray(record.commonParts) ? record.commonParts.join(', ') : (record.commonParts || ''),

    // Master Golongan SIM Pengemudi (44S_Ops_SimClasses)
    'ID Golongan SIM': record.id,
    'Kode SIM': record.code || '',
    'Nama Golongan SIM': record.name || '',
    'Klasifikasi Kendaraan': record.vehicleClassification || '',
    'Usia Minimal': record.minAge !== undefined ? record.minAge : 20,
    'Masa Berlaku (Thn)': record.validityYears !== undefined ? record.validityYears : 5,
    'Armada Diizinkan': record.permittedVehicles || '',

    // Master Pemasukan Non-Sewa (44S_Ops_NonRentalCategories)
    'ID Kategori Non-Sewa': record.id,
    'Kode Kategori': record.code || '',
    'Nama Pemasukan Non-Sewa': record.name || '',
    'Tarif Acuan (Rp)': record.defaultAmount !== undefined ? record.defaultAmount : 0,

    // Riwayat Top-Up Deposit Perusahaan (44S_Ops_DepositTopUps)
    'ID Top-Up': record.id,
    'ID Perusahaan': record.companyId || '',
    'Nama Perusahaan': record.companyName || '',
    'Jumlah Top-Up (Rp)': record.amount !== undefined ? record.amount : 0,
    'No. Bukti Transfer': record.transferProofNumber || '',
    'ID Rekening Tujuan': record.bankAccountId || '',
    'Nama Rekening Tujuan': record.bankAccountName || '',
    'Metode Pembayaran': record.paymentMethod || '',

    // Pengajuan Deposit Perusahaan (44S_Ops_DepositRequests)
    'ID Pengajuan': record.id,
    'No. Pengajuan': record.requestNumber || '',
    'Tanggal Pengajuan': record.requestDate || record.date || '',
    'Kode Perusahaan': record.companyCode || '',
    'Jumlah Diajukan (Rp)': record.amount !== undefined ? record.amount : 0,
    'Keperluan': record.purpose || '',
    'Pemohon / PIC': record.applicantName || '',
    'No. HP Pemohon': record.applicantPhone || '',
    'Urgensi': record.urgencyLevel || 'normal',
    'Disetujui Oleh': record.approvedBy || ''
  };

  if (h === 'ID Unit' && record.vehicleId && !record.nopol && !record.brand) {
    return record.vehicleId;
  }
  if (h === 'ID Unit' && record.vehicleId && record.documentType) {
    return record.vehicleId;
  }

  var mapped = map[h];
  return (mapped !== undefined && mapped !== null) ? mapped : '';
}

function mapRecordToRow(record, headers) {
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    var h = headers[i];
    row.push(resolveValueForHeader(record, h));
  }
  return row;
}

function compactSheetCells(sheet, keepMinRows, keepCols) {
  try {
    var maxRows = sheet.getMaxRows();
    var targetRows = Math.max(sheet.getLastRow() + 3, keepMinRows || 10);
    if (maxRows > targetRows + 20) {
      sheet.deleteRows(targetRows + 1, maxRows - targetRows);
    }
    var maxCols = sheet.getMaxColumns();
    var targetCols = Math.max(sheet.getLastColumn(), keepCols || 12);
    if (maxCols > targetCols) {
      sheet.deleteColumns(targetCols + 1, maxCols - targetCols);
    }
  } catch (ignore) {}
}

function autoRepairSheetAlignment(sheet, sheetName, headers) {
  try {
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return;
    var lastCol = Math.max(sheet.getLastColumn(), headers.length);
    var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    var rawJsonColIdx = headers.indexOf('rawJson');
    var needsRewrite = false;
    var repairedRows = [];

    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var embeddedObj = null;
      var foundJsonCol = -1;

      for (var c = row.length - 1; c >= 0; c--) {
        var cell = row[c];
        if (typeof cell === 'string') {
          var trimmed = cell.trim();
          if (trimmed.length > 10 && trimmed.charAt(0) === '{' && trimmed.charAt(trimmed.length - 1) === '}') {
            try {
              var parsed = JSON.parse(trimmed);
              if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                embeddedObj = parsed;
                foundJsonCol = c;
                break;
              }
            } catch (e) {}
          }
        }
      }

      if (embeddedObj && foundJsonCol !== rawJsonColIdx) {
        needsRewrite = true;
        repairedRows.push(mapRecordToRow(sanitizeRecordForDatabase(embeddedObj), headers));
      } else if (!embeddedObj && sheetName === SHEETS.DRIVERS && typeof row[1] === 'string' && row[1].indexOf('DRV-') === 0) {
        needsRewrite = true;
        var drvObj = {
          id: row[0],
          nip: row[1],
          name: row[2],
          nik: row[1],
          phone: row[3],
          simType: row[4] || 'SIM B2 Umum',
          simNumber: '',
          simExpiry: row[5],
          assignedVehicle: row[6],
          companyName: row[7],
          status: row[8] || 'active'
        };
        repairedRows.push(mapRecordToRow(drvObj, headers));
      } else if (!embeddedObj && sheetName === SHEETS.ACCOUNTS && typeof row[5] === 'string' && typeof row[7] === 'number') {
        needsRewrite = true;
        var accObj = {
          id: row[0],
          accountName: row[1],
          accountNumber: row[2],
          bankOrProvider: row[3],
          accountType: row[4],
          companyName: row[5],
          initialBalance: row[6],
          currentBalance: row[7],
          notes: ''
        };
        repairedRows.push(mapRecordToRow(accObj, headers));
      } else if (!embeddedObj && sheetName === SHEETS.COMPANY_DEPOSITS && typeof row[8] === 'number') {
        needsRewrite = true;
        var depObj = {
          id: row[0],
          companyName: row[1],
          companyCode: row[2],
          picName: row[3],
          picPhone: row[4],
          initialDeposit: row[5],
          currentBalance: row[6],
          totalTopUp: row[7],
          totalUsed: row[8],
          status: 'active'
        };
        repairedRows.push(mapRecordToRow(depObj, headers));
      } else {
        var padded = [];
        for (var k = 0; k < headers.length; k++) {
          padded.push(k < row.length ? row[k] : '');
        }
        repairedRows.push(padded);
      }
    }

    if (needsRewrite && repairedRows.length > 0) {
      if (lastCol > headers.length) {
        sheet.getRange(2, 1, repairedRows.length, lastCol).clearContent();
      }
      sheet.getRange(2, 1, repairedRows.length, headers.length).setValues(repairedRows);
    }
  } catch (ignore) {}
}

function getOrCreateSheetWithSchema(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#0f172a')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    compactSheetCells(sheet, 15, headers.length);
  } else {
    var lastCol = Math.max(sheet.getLastColumn(), 1);
    var currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    if (currentHeaders.indexOf('rawJson') === -1 || currentHeaders.length !== headers.length || currentHeaders[0] !== headers[0]) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#0f172a')
        .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
    autoRepairSheetAlignment(sheet, sheetName, headers);
  }
  return sheet;
}

function ensureAllSheetsReady(ss) {
  for (var key in SHEETS) {
    var name = SHEETS[key];
    if (SHEET_SCHEMAS[name]) {
      getOrCreateSheetWithSchema(ss, name, SHEET_SCHEMAS[name]);
    }
  }
}

function resolveSheetName(moduleKey) {
  var map = {
    vehicles: SHEETS.VEHICLES,
    taxes: SHEETS.TAXES,
    fuel: SHEETS.FUEL,
    fuelLogs: SHEETS.FUEL,
    finance: SHEETS.FINANCE,
    finances: SHEETS.FINANCE,
    pocketFlows: SHEETS.POCKET_FLOWS,
    equipmentFlows: SHEETS.EQUIPMENT_FLOWS,
    tripSheets: SHEETS.TRIP_SHEETS,
    timesheets: SHEETS.TIMESHEETS,
    maintenance: SHEETS.MAINTENANCE,
    spareparts: SHEETS.SPAREPARTS,
    sparepartInventory: SHEETS.SPAREPARTS,
    sparepartMovements: SHEETS.SPAREPART_MOVEMENTS,
    drivers: SHEETS.DRIVERS,
    adminStaff: SHEETS.ADMIN_STAFF,
    suppliers: SHEETS.SUPPLIERS,
    equipmentSuppliers: SHEETS.SUPPLIERS,
    expenseCategories: SHEETS.EXPENSE_CATEGORIES,
    paymentMethods: SHEETS.PAYMENT_METHODS,
    accounts: SHEETS.ACCOUNTS,
    serviceTypes: SHEETS.SERVICE_TYPES,
    simClasses: SHEETS.SIM_CLASSES,
    nonRentalCategories: SHEETS.NON_RENTAL_CATEGORIES,
    companyDeposits: SHEETS.COMPANY_DEPOSITS,
    depositTopUps: SHEETS.DEPOSIT_TOPUPS,
    depositRequests: SHEETS.DEPOSIT_REQUESTS,
    users: SHEETS.USERS,
    auditLogs: SHEETS.AUDIT_LOGS,
    masterRef: SHEETS.MASTER_REF
  };
  return map[moduleKey] || null;
}

function checkAndSendOperationalAlarms(customRecipient) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var taxes = readSheetFast(ss, SHEETS.TAXES);
  var vehicles = readSheetFast(ss, SHEETS.VEHICLES);
  var today = new Date();
  var alerts = [];

  for (var i = 0; i < taxes.length; i++) {
    var t = taxes[i];
    if (t.status === 'paid' || t.status === 'Paid') continue;
    var due = new Date(t.dueDate);
    var diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    if (diffDays <= 14) {
      var veh = null;
      for (var v = 0; v < vehicles.length; v++) {
        if (vehicles[v].id === t.vehicleId) { veh = vehicles[v]; break; }
      }
      var plate = (veh && veh.nopol) ? veh.nopol : (t.nopol || t.vehicleId);
      alerts.push('• [' + plate + '] ' + (t.taxType || t.type) + ' - Jatuh Tempo: ' + t.dueDate + ' (' + diffDays + ' hari lagi)');
    }
  }

  if (alerts.length > 0) {
    var recipient = customRecipient || Session.getActiveUser().getEmail();
    if (recipient) {
      MailApp.sendEmail({
        to: recipient,
        subject: '🚨 [44S Ops_pro] Peringatan Pajak/KIR Jatuh Tempo (' + alerts.length + ' Item)',
        body: 'Halo Owner / Admin Operasional,\\n\\nBerikut daftar Pajak & Legalitas Armada yang memerlukan perhatian segera:\\n\\n' +
              alerts.join('\\n') + '\\n\\nSilakan buka dashboard 44S Ops_pro untuk menindaklanjuti.'
      });
      return alerts.length;
    }
  }
  return 0;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export const GAS_SETUP_GS = `/**
 * ============================================================================
 * 2. FILE: Setup.gs
 * 44S Ops_pro Enterprise - Database Initializer & Cell Quota Optimizer
 * (AMAN DATA RIIL — TANPA PERINTAH HAPUS SEMUA DATA)
 * ============================================================================
 * Fungsi Utama Setup.gs:
 * 1. setupDatabase()                : Menyiapkan struktur 26 Sheet Utama & Master Referensi tanpa menghapus data yang sudah ada.
 * 2. optimizeAllDatabaseSheets()    : Memangkas baris/kolom kosong di bawah data terakhir (Hemat Kuota 10 Juta Sel).
 * 3. getDatabaseHealthReport()      : Mengukur pemakaian sel database & performa anti-lemot.
 * 4. setupDailyTrigger()            : Mengaktifkan cron job harian (jam 07:00 WIB) untuk kompresi sel kosong & alarm pajak.
 * ============================================================================
 */

function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('🚛 44S Ops_pro Admin')
      .addItem('1. Inisialisasi Struktur 26 Sheet Database & Master Referensi (Aman Data)', 'setupDatabase')
      .addItem('2. Optimasi & Pangkas Sel Kosong (Anti-Lemot)', 'optimizeAllDatabaseSheets')
      .addSeparator()
      .addItem('3. Cek Kesehatan & Kuota Sel Database', 'showDatabaseHealthDialog')
      .addItem('4. Aktifkan Trigger Optimasi & Alarm Harian', 'setupDailyTrigger')
      .addToUi();
  } catch (ignore) {}
}

/**
 * 1. INISIALISASI STRUKTUR 26 SHEET UTAMA & MASTER REFERENSI (TANPA MENGHAPUS DATA YANG SUDAH ADA)
 */
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureAllSheetsReady(ss);

  for (var key in SHEETS) {
    var sheetName = SHEETS[key];
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) continue;

    var headers = SHEET_SCHEMAS[sheetName];
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#0f172a')
        .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
      compactSheetCells(sheet, 15, headers.length);
    }
  }

  var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName(' Sheet1');
  if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() === 0) {
    try { ss.deleteSheet(defaultSheet); } catch (ignore) {}
  }

  invalidateFastCache();
  return {
    status: 'success',
    message: '27 Sheet Database 44S Ops_pro (termasuk ReceiptVault Hemat Penyimpanan) siap digunakan (Data yang ada tetap aman).',
    health: getDatabaseHealthReport()
  };
}

/**
 * Alias kompatibilitas untuk setupCompleteFleetOpsDatabase()
 */
function setupCompleteFleetOpsDatabase() {
  return setupDatabase();
}

/**
 * 2. OPTIMASI & PENGHEMATAN SEL KOSONG DATABASE (ANTI-LEMOT)
 */
function optimizeAllDatabaseSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var trimmedRowsTotal = 0;
  var trimmedColsTotal = 0;

  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    var maxR = sheet.getMaxRows();
    var lastR = Math.max(sheet.getLastRow(), 1);
    var keepR = Math.max(lastR + 5, 10);

    if (maxR > keepR) {
      var delR = maxR - keepR;
      sheet.deleteRows(keepR + 1, delR);
      trimmedRowsTotal += delR;
    }

    var maxC = sheet.getMaxColumns();
    var lastC = Math.max(sheet.getLastColumn(), 6);
    if (maxC > lastC) {
      var delC = maxC - lastC;
      sheet.deleteColumns(lastC + 1, delC);
      trimmedColsTotal += delC;
    }
  }

  invalidateFastCache();
  return {
    status: 'success',
    trimmedRows: trimmedRowsTotal,
    trimmedCols: trimmedColsTotal,
    health: getDatabaseHealthReport()
  };
}

function getDatabaseHealthReport() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var totalCellsAllocated = 0;
  var totalActiveRows = 0;
  var sheetStats = [];

  for (var i = 0; i < sheets.length; i++) {
    var sh = sheets[i];
    var cells = sh.getMaxRows() * sh.getMaxColumns();
    var rows = Math.max(sh.getLastRow() - 1, 0);
    totalCellsAllocated += cells;
    totalActiveRows += rows;
    sheetStats.push({
      name: sh.getName(),
      records: rows,
      allocatedCells: cells
    });
  }

  var maxQuota = 10000000;
  var usagePercent = ((totalCellsAllocated / maxQuota) * 100).toFixed(4);

  return {
    status: 'success',
    totalSheets: sheets.length,
    totalActiveRecords: totalActiveRows,
    totalCellsAllocated: totalCellsAllocated,
    quotaLimit: maxQuota,
    usagePercent: usagePercent + '%',
    performanceStatus: totalCellsAllocated < 250000 ? 'SANGAT CEPAT (GRANULAR SINGLE-ROW CRUD)' : 'OPTIMAL',
    sheets: sheetStats
  };
}

function showDatabaseHealthDialog() {
  var rep = getDatabaseHealthReport();
  var msg = 'Status Performa: ' + rep.performanceStatus + '\\n' +
            'Total Tabel Aktif: ' + rep.totalSheets + ' Sheet\\n' +
            'Total Baris Data Riil: ' + rep.totalActiveRecords + ' Record\\n' +
            'Pemakaian Sel: ' + rep.totalCellsAllocated + ' / 10.000.000 (' + rep.usagePercent + ')';
  try {
    SpreadsheetApp.getUi().alert('📊 Kesehatan Database 44S Ops_pro', msg, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (ignore) {
    Logger.log(msg);
  }
}

function setupDailyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    var fn = triggers[i].getHandlerFunction();
    if (fn === 'dailyMaintenanceAndAlarmJob') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger('dailyMaintenanceAndAlarmJob')
    .timeBased()
    .atHour(7)
    .everyDays(1)
    .create();

  return { status: 'success', message: 'Trigger Harian (07:00 WIB) untuk Optimasi Sel Kosong & Alarm Pajak aktif.' };
}

function dailyMaintenanceAndAlarmJob() {
  optimizeAllDatabaseSheets();
  checkAndSendOperationalAlarms();
}
`;

export const GAS_INDEX_HTML: string = COMPILED_GAS_INDEX_HTML || getCompiledGasIndexHtml();
export { getCompiledGasIndexHtml };
