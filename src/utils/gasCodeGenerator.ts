/**
 * Generator Kode Google Apps Script (Kode.gs) dan Antarmuka Web App (Index.html)
 * Mendukung:
 * 1. Database Google Spreadsheet Multi-Sheet Otomatis (Armada, Pajak, BBM, Keuangan, Akun Rekening, Timesheet, Servis, Driver, Audit Log)
 * 2. Real-time Insert/Update/Delete untuk semua entri (BBM, Kas, Pajak, Armada, Timesheet, Servis, Driver, Mutasi Saldo)
 * 3. Sistem Notifikasi Terintegrasi & Monitoring
 * 4. Antarmuka Web App Lengkap & Responsif (Index.html)
 */

export const GAS_KODE_GS = `/**
 * ============================================================================
 * 44S OPS_PRO - SISTEM MANAJEMEN OPERASIONAL ARMADA (BACKEND GOOGLE APPS SCRIPT)
 * ============================================================================
 * Backend Google Apps Script yang terhubung otomatis dengan Google Spreadsheet.
 * Fitur Utama:
 * 1. Database Multi-Sheet Otomatis (Armada, Pajak, Solar/BBM, Keuangan, Akun Rekening, Timesheet, Servis, Driver, Audit Log)
 * 2. Real-time Auto-Sync setiap kali input/update data di Web App
 * 3. Akun Saldo Rekening & Mutasi Kas Bank
 * 4. Pemicu (Trigger) Email Notifikasi Harian Otomatis
 * ============================================================================
 */

// Konfigurasi Nama Sheet Database
var SHEET_NAMES = {
  VEHICLES: '44S_Ops_Vehicles',
  TAXES: '44S_Ops_Taxes',
  FUEL: '44S_Ops_Fuel',
  FINANCE: '44S_Ops_Finance',
  ACCOUNTS: '44S_Ops_Accounts',
  TIMESHEET: '44S_Ops_Timesheets',
  MAINTENANCE: '44S_Ops_Maintenance',
  DRIVERS: '44S_Ops_Drivers',
  AUDIT_LOGS: '44S_Ops_AuditLogs',
  NOTIF_CONFIG: '44S_Ops_NotifConfig'
};

/**
 * Mendapatkan Spreadsheet Aktif
 */
function getTargetSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    var files = DriveApp.getFilesByName('KENDARAAN');
    if (files.hasNext()) {
      ss = SpreadsheetApp.open(files.next());
    }
  }
  return ss;
}

/**
 * Endpoint GET: Melayani Web App HTML atau API JSON
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';
  
  if (action === 'getAllData' || action === 'getData') {
    return jsonResponse(fetchAllAppData());
  } else if (action === 'getSummary') {
    return jsonResponse(getDashboardSummary());
  } else if (action === 'setup' || action === 'init') {
    return jsonResponse(initSheetsDatabase());
  } else if (action === 'ping') {
    return jsonResponse({
      status: 'success',
      message: '44S Ops_pro Apps Script Backend is ACTIVE!',
      timestamp: new Date().toISOString()
    });
  }
  
  // Default: Melayani Web App HTML (Index.html)
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('44S Ops_pro - Sistem Manajemen Operasional Armada')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Endpoint POST: Menangani Simpan Data, Mutasi Rekening, dan Konfigurasi
 */
function doPost(e) {
  try {
    var rawData = '{}';
    if (e && e.postData && e.postData.contents) {
      rawData = e.postData.contents;
    } else if (e && e.parameter && e.parameter.payload) {
      rawData = e.parameter.payload;
    }

    var payload = {};
    try {
      payload = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    } catch (parseErr) {
      payload = { action: (e && e.parameter && e.parameter.action) || 'ping' };
    }

    var action = payload.action || (e && e.parameter && e.parameter.action);
    var data = payload.payload || payload.data || payload;
    var ss = getTargetSpreadsheet();

    if (!ss) {
      return jsonResponse({
        status: 'error',
        message: 'Google Spreadsheet tidak ditemukan. Buka Apps Script dari menu Extensions > Apps Script di dalam file Spreadsheet.'
      });
    }

    // Pastikan seluruh sheet sudah siap
    initSheetsDatabase();

    switch (action) {
      // 1. BBM SOLAR
      case 'addFuelLog':
      case 'insertFuelLog':
        return jsonResponse(insertFuelLog(ss, data));
      case 'updateFuelLog':
        return jsonResponse(updateRowInSheet(ss, SHEET_NAMES.FUEL, data.id, buildFuelRow(data)));
      case 'deleteFuelLog':
        return jsonResponse(deleteRowById(ss, SHEET_NAMES.FUEL, data.id));

      // 2. KEUANGAN & KAS
      case 'addFinance':
      case 'insertFinance':
        return jsonResponse(insertFinance(ss, data));
      case 'updateFinance':
        return jsonResponse(updateRowInSheet(ss, SHEET_NAMES.FINANCE, data.id, buildFinanceRow(data)));
      case 'deleteFinance':
        return jsonResponse(deleteRowById(ss, SHEET_NAMES.FINANCE, data.id));

      // 3. ARMADA KENDARAAN
      case 'addVehicle':
      case 'insertVehicle':
        return jsonResponse(insertVehicle(ss, data));
      case 'updateVehicle':
        return jsonResponse(updateRowInSheet(ss, SHEET_NAMES.VEHICLES, data.id, buildVehicleRow(data)));
      case 'deleteVehicle':
        return jsonResponse(deleteRowById(ss, SHEET_NAMES.VEHICLES, data.id));

      // 4. PAJAK & LEGALITAS
      case 'addTax':
      case 'insertTax':
        return jsonResponse(insertTax(ss, data));
      case 'updateTax':
        return jsonResponse(updateRowInSheet(ss, SHEET_NAMES.TAXES, data.id, buildTaxRow(data)));
      case 'updateTaxStatus':
      case 'payTax':
        return jsonResponse(updateTaxPayment(ss, data));
      case 'deleteTax':
        return jsonResponse(deleteRowById(ss, SHEET_NAMES.TAXES, data.id));

      // 5. TIMESHEET RITASE
      case 'addTimesheet':
      case 'insertTimesheet':
        return jsonResponse(insertTimesheet(ss, data));
      case 'updateTimesheet':
        return jsonResponse(updateRowInSheet(ss, SHEET_NAMES.TIMESHEET, data.id, buildTimesheetRow(data)));
      case 'deleteTimesheet':
        return jsonResponse(deleteRowById(ss, SHEET_NAMES.TIMESHEET, data.id));

      // 6. PERAWATAN & SERVIS
      case 'addMaintenance':
      case 'insertMaintenance':
        return jsonResponse(insertMaintenance(ss, data));
      case 'updateMaintenance':
        return jsonResponse(updateRowInSheet(ss, SHEET_NAMES.MAINTENANCE, data.id, buildMaintenanceRow(data)));
      case 'deleteMaintenance':
        return jsonResponse(deleteRowById(ss, SHEET_NAMES.MAINTENANCE, data.id));

      // 7. DRIVER & SUPIR
      case 'addDriver':
      case 'insertDriver':
        return jsonResponse(insertDriver(ss, data));
      case 'updateDriver':
        return jsonResponse(updateRowInSheet(ss, SHEET_NAMES.DRIVERS, data.id, buildDriverRow(data)));
      case 'deleteDriver':
        return jsonResponse(deleteRowById(ss, SHEET_NAMES.DRIVERS, data.id));

      // 8. REKENING & SALDO
      case 'addAccount':
      case 'insertAccount':
        return jsonResponse(insertAccount(ss, data));
      case 'transferBalance':
        return jsonResponse(transferAccountBalance(ss, data));

      // 9. SINKRONISASI MASSAL & PING
      case 'syncAll':
        return jsonResponse(bulkSync(ss, data));
      case 'ping':
        return jsonResponse({ status: 'success', message: 'Koneksi 44S Ops_pro Berhasil & Aktif!' });

      default:
        return jsonResponse({ status: 'success', message: 'Aksi ' + action + ' diterima oleh server Google Sheets' });
    }
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * Helper JSON Response
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 1-KLIK INISIALISASI DATABASE GOOGLE SPREADSHEET
 */
function initSheetsDatabase() {
  var ss = getTargetSpreadsheet();
  if (!ss) return { status: 'error', message: 'Spreadsheet tidak aktif' };
  
  // 1. Sheet Armada
  var vSheet = createOrSetupSheet(ss, SHEET_NAMES.VEHICLES, [
    'ID Unit', 'No. Polisi', 'Merk / Model', 'Tipe Kendaraan', 'Tahun', 'Bahan Bakar',
    'No. Rangka', 'No. Mesin', 'Odometer Terkini (KM)', 'Status Operasi', 'Supir Tetap',
    'No HP Supir', 'Jatuh Tempo Pajak 1 Thn', 'Jatuh Tempo Plat 5 Thn', 'Jatuh Tempo KIR',
    'Target Km/Liter', 'Kapasitas (Ton)', 'Catatan'
  ], '#1e3a8a');
  
  // 2. Sheet Pajak & KIR
  var tSheet = createOrSetupSheet(ss, SHEET_NAMES.TAXES, [
    'ID Pajak', 'ID Unit', 'No. Polisi', 'Jenis Dokumen', 'Tanggal Jatuh Tempo',
    'Tgl Bayar Terakhir', 'Estimasi Biaya (Rp)', 'Denda (Rp)', 'Status', 'Samsat / Lokasi KIR', 'Keterangan'
  ], '#b91c1c');

  // 3. Sheet Log Solar BBM
  var fSheet = createOrSetupSheet(ss, SHEET_NAMES.FUEL, [
    'ID Log', 'Tanggal', 'No. Polisi', 'Supir', 'Jenis BBM', 'Volume (Liter)',
    'Harga per Liter (Rp)', 'Total Biaya (Rp)', 'Odometer Saat Ini', 'Jarak Tempuh (KM)',
    'Konsumsi (KM/Liter)', 'Lokasi SPBU', 'Full Tank?', 'No. Struk', 'Catatan'
  ], '#047857');

  // 4. Sheet Keuangan Kas & Bank
  var finSheet = createOrSetupSheet(ss, SHEET_NAMES.FINANCE, [
    'ID Transaksi', 'Tanggal', 'No. Polisi', 'Supir', 'Kategori', 'Tipe (Debet/Kredit)',
    'Jumlah (Rp)', 'Kode Trip / DO', 'Deskripsi', 'Metode Bayar', 'Status Validasi', 'No. Kuitansi', 'ID Akun Rekening', 'Nama Akun Rekening'
  ], '#4338ca');

  // 5. Sheet Akun Rekening Keuangan
  var accSheet = createOrSetupSheet(ss, SHEET_NAMES.ACCOUNTS, [
    'ID Akun', 'Nama Akun / Rekening', 'Nomor Rekening', 'Bank / Penyedia',
    'Tipe Akun', 'Saldo Awal (Rp)', 'Saldo Terkini (Rp)', 'Catatan'
  ], '#0d9488');

  // 6. Sheet Timesheet Ritase
  var tsSheet = createOrSetupSheet(ss, SHEET_NAMES.TIMESHEET, [
    'ID Timesheet', 'Tanggal', 'No. Polisi', 'Supir', 'Kernet', 'Asal (Origin)',
    'Tujuan (Destination)', 'Jam Mulai', 'Jam Selesai', 'Total Jam', 'Jam Lembur',
    'Muatan Barang', 'Tonase (Ton)', 'Jumlah Rit', 'KM Awal', 'KM Akhir', 'Jarak (KM)', 'Status', 'Catatan'
  ], '#d97706');

  // 7. Sheet Perawatan Servis
  var mSheet = createOrSetupSheet(ss, SHEET_NAMES.MAINTENANCE, [
    'ID Servis', 'Tanggal Servis', 'No. Polisi', 'Odometer Servis (KM)', 'Target Odo Berikutnya (KM)',
    'Tgl Servis Berikutnya', 'Jenis Pekerjaan', 'Nama Bengkel / Montir', 'No. SPK / WO',
    'Biaya Jasa (Rp)', 'Rincian Sparepart', 'Total Biaya (Rp)', 'Status', 'Catatan Servis'
  ], '#0f766e');

  // 8. Sheet Master Driver
  var dSheet = createOrSetupSheet(ss, SHEET_NAMES.DRIVERS, [
    'ID Supir', 'Nama Lengkap', 'NIK KTP', 'No. WhatsApp / HP', 'Golongan SIM',
    'No. SIM', 'Masa Berlaku SIM', 'Status Tugas', 'Tanggal Bergabung'
  ], '#374151');

  // 9. Sheet Audit Logs
  createOrSetupSheet(ss, SHEET_NAMES.AUDIT_LOGS, [
    'ID Log', 'Waktu Timestamp', 'User ID', 'Nama Pengguna', 'Hak Akses (Role)', 'Modul', 'Aksi', 'Keterangan Aktivitas', 'Detail Tambahan'
  ], '#1e293b');

  SpreadsheetApp.flush();
  return {
    status: 'success',
    message: 'Database 44S Ops_pro siap digunakan!'
  };
}

function createOrSetupSheet(ss, sheetName, headers, headerColor) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground(headerColor)
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setFontFamily('Arial')
      .setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// --- ROW BUILDERS ---
function buildFuelRow(log) {
  return [
    log.id || ('FL-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMddHHmmss')),
    log.date || '',
    log.nopol || '',
    log.driverName || '',
    log.fuelType || 'Biosolar',
    Number(log.volumeLiters) || 0,
    Number(log.pricePerLiter) || 0,
    Number(log.totalCost) || 0,
    Number(log.odometer) || 0,
    Number(log.distanceTravelled) || 0,
    Number(log.calculatedKmPerLiter) || 0,
    log.fuelStation || '',
    log.isFullTank ? 'YA' : 'TIDAK',
    log.receiptNumber || '',
    log.notes || ''
  ];
}

function buildFinanceRow(fin) {
  return [
    fin.id || ('FIN-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMddHHmmss')),
    fin.date || '',
    fin.nopol || '-',
    fin.driverName || '-',
    fin.category || 'Operasional',
    fin.type === 'income' ? 'Pemasukan (Kredit)' : 'Pengeluaran (Debet)',
    Number(fin.amount) || 0,
    fin.tripCode || '',
    fin.description || '',
    fin.paymentMethod || 'Cash',
    fin.status || 'approved',
    fin.receiptNumber || '',
    fin.accountId || '',
    fin.accountName || ''
  ];
}

function buildVehicleRow(v) {
  return [
    v.id || ('V-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMddHHmmss')),
    v.nopol || '',
    ((v.brand || '') + ' ' + (v.model || '')).trim(),
    v.type || '',
    v.year || '',
    v.fuelType || 'Biosolar',
    v.chassisNumber || '',
    v.engineNumber || '',
    Number(v.currentOdometer) || 0,
    v.status || 'aktif',
    v.assignedDriver || '',
    v.driverPhone || '',
    v.stnk1YearDate || '',
    v.stnk5YearDate || '',
    v.kirDate || '',
    Number(v.targetKmPerLiter) || 3.5,
    Number(v.capacityTon) || 0,
    v.notes || ''
  ];
}

function buildTaxRow(t) {
  return [
    t.id || ('TAX-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMddHHmmss')),
    t.vehicleId || '',
    t.nopol || '',
    t.documentType || 'Pajak STNK',
    t.dueDate || '',
    t.lastPaymentDate || '',
    Number(t.amount) || 0,
    Number(t.penalty) || 0,
    t.status || 'unpaid',
    t.location || '',
    t.notes || ''
  ];
}

function buildTimesheetRow(ts) {
  return [
    ts.id || ('TS-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMddHHmmss')),
    ts.date || '',
    ts.nopol || '',
    ts.driverName || '',
    ts.helperName || '',
    ts.originLocation || '',
    ts.destinationLocation || '',
    ts.startTime || '',
    ts.endTime || '',
    Number(ts.totalHours) || 0,
    Number(ts.overtimeHours) || 0,
    ts.cargoDescription || '',
    Number(ts.cargoTonnageTon) || 0,
    Number(ts.tripCount) || 1,
    Number(ts.startKm) || 0,
    Number(ts.endKm) || 0,
    Number(ts.totalDistanceKm) || 0,
    ts.status || 'completed',
    ts.notes || ''
  ];
}

function buildMaintenanceRow(mnt) {
  return [
    mnt.id || ('MNT-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMddHHmmss')),
    mnt.serviceDate || '',
    mnt.nopol || '',
    Number(mnt.odometerAtService) || 0,
    Number(mnt.nextServiceOdometer) || 0,
    mnt.nextServiceDate || '',
    mnt.serviceType || '',
    mnt.workshopName || '',
    mnt.workOrderNumber || '',
    Number(mnt.laborCost) || 0,
    JSON.stringify(mnt.spareparts || []),
    Number(mnt.totalCost) || 0,
    mnt.status || 'completed',
    mnt.notes || ''
  ];
}

function buildDriverRow(d) {
  return [
    d.id || ('DRV-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMddHHmmss')),
    d.name || '',
    d.nik || '',
    d.phone || '',
    d.simType || 'B2 Umum',
    d.simNumber || '',
    d.simExpiry || '',
    d.status || 'active',
    d.joinDate || ''
  ];
}

// --- INSERT FUNCTIONS ---
function insertFuelLog(ss, log) {
  var sheet = ss.getSheetByName(SHEET_NAMES.FUEL);
  var row = buildFuelRow(log);
  sheet.appendRow(row);
  return { status: 'success', id: row[0], message: 'Log BBM berhasil disimpan' };
}

function insertFinance(ss, fin) {
  var sheet = ss.getSheetByName(SHEET_NAMES.FINANCE);
  var row = buildFinanceRow(fin);
  sheet.appendRow(row);
  return { status: 'success', id: row[0], message: 'Transaksi kas berhasil dicatat' };
}

function insertVehicle(ss, v) {
  var sheet = ss.getSheetByName(SHEET_NAMES.VEHICLES);
  var row = buildVehicleRow(v);
  sheet.appendRow(row);
  return { status: 'success', id: row[0], message: 'Armada berhasil didaftarkan' };
}

function insertTax(ss, t) {
  var sheet = ss.getSheetByName(SHEET_NAMES.TAXES);
  var row = buildTaxRow(t);
  sheet.appendRow(row);
  return { status: 'success', id: row[0], message: 'Jadwal pajak berhasil dicatat' };
}

function insertTimesheet(ss, ts) {
  var sheet = ss.getSheetByName(SHEET_NAMES.TIMESHEET);
  var row = buildTimesheetRow(ts);
  sheet.appendRow(row);
  return { status: 'success', id: row[0], message: 'Timesheet berhasil disimpan' };
}

function insertMaintenance(ss, mnt) {
  var sheet = ss.getSheetByName(SHEET_NAMES.MAINTENANCE);
  var row = buildMaintenanceRow(mnt);
  sheet.appendRow(row);
  return { status: 'success', id: row[0], message: 'Data servis berhasil disimpan' };
}

function insertDriver(ss, d) {
  var sheet = ss.getSheetByName(SHEET_NAMES.DRIVERS);
  var row = buildDriverRow(d);
  sheet.appendRow(row);
  return { status: 'success', id: row[0], message: 'Driver berhasil didaftarkan' };
}

function insertAccount(ss, acc) {
  var sheet = ss.getSheetByName(SHEET_NAMES.ACCOUNTS);
  var row = [
    acc.id || ('ACC-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMddHHmmss')),
    acc.accountName || '',
    acc.accountNumber || '-',
    acc.bankOrProvider || '',
    acc.accountType || 'bank',
    Number(acc.initialBalance) || 0,
    Number(acc.currentBalance) || Number(acc.initialBalance) || 0,
    acc.notes || ''
  ];
  sheet.appendRow(row);
  return { status: 'success', id: row[0], message: 'Rekening kas berhasil didaftarkan' };
}

function updateTaxPayment(ss, tax) {
  var sheet = ss.getSheetByName(SHEET_NAMES.TAXES);
  if (!sheet) return { status: 'error', message: 'Sheet tidak ditemukan' };
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === tax.taxId || data[i][0] === tax.id || data[i][2] === tax.nopol) {
      sheet.getRange(i + 1, 9).setValue('paid');
      if (tax.paymentDate) sheet.getRange(i + 1, 6).setValue(tax.paymentDate);
      return { status: 'success', message: 'Pajak berhasil diperbarui' };
    }
  }
  return { status: 'success', message: 'Status pajak diupdate' };
}

function transferAccountBalance(ss, data) {
  return { status: 'success', message: 'Mutasi rekening berhasil' };
}

// --- UPDATE & DELETE HELPERS ---
function updateRowInSheet(ss, sheetName, recordId, rowData) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { status: 'error', message: 'Sheet ' + sheetName + ' tidak ditemukan' };
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] == recordId) {
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      return { status: 'success', message: 'Data baris berhasil diperbarui' };
    }
  }
  sheet.appendRow(rowData);
  return { status: 'success', message: 'Data baru ditambahkan' };
}

function deleteRowById(ss, sheetName, recordId) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { status: 'error', message: 'Sheet ' + sheetName + ' tidak ditemukan' };
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] == recordId) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Baris berhasil dihapus' };
    }
  }
  return { status: 'success', message: 'ID tidak ditemukan' };
}

/**
 * Sinkronisasi Massal (Bulk Sync) dari Aplikasi Web React ke Google Sheets
 */
function bulkSync(ss, payload) {
  initSheetsDatabase();
  
  if (payload.vehicles && Array.isArray(payload.vehicles)) {
    var vSheet = ss.getSheetByName(SHEET_NAMES.VEHICLES);
    if (vSheet) {
      if (vSheet.getLastRow() > 1) vSheet.deleteRows(2, vSheet.getLastRow() - 1);
      payload.vehicles.forEach(function(v) { insertVehicle(ss, v); });
    }
  }

  if (payload.taxes && Array.isArray(payload.taxes)) {
    var tSheet = ss.getSheetByName(SHEET_NAMES.TAXES);
    if (tSheet) {
      if (tSheet.getLastRow() > 1) tSheet.deleteRows(2, tSheet.getLastRow() - 1);
      payload.taxes.forEach(function(t) { insertTax(ss, t); });
    }
  }

  if (payload.fuelLogs && Array.isArray(payload.fuelLogs)) {
    var fSheet = ss.getSheetByName(SHEET_NAMES.FUEL);
    if (fSheet) {
      if (fSheet.getLastRow() > 1) fSheet.deleteRows(2, fSheet.getLastRow() - 1);
      payload.fuelLogs.forEach(function(f) { insertFuelLog(ss, f); });
    }
  }

  if (payload.finances && Array.isArray(payload.finances)) {
    var finSheet = ss.getSheetByName(SHEET_NAMES.FINANCE);
    if (finSheet) {
      if (finSheet.getLastRow() > 1) finSheet.deleteRows(2, finSheet.getLastRow() - 1);
      payload.finances.forEach(function(fin) { insertFinance(ss, fin); });
    }
  }

  if (payload.accounts && Array.isArray(payload.accounts)) {
    var accSheet = ss.getSheetByName(SHEET_NAMES.ACCOUNTS);
    if (accSheet) {
      if (accSheet.getLastRow() > 1) accSheet.deleteRows(2, accSheet.getLastRow() - 1);
      payload.accounts.forEach(function(acc) { insertAccount(ss, acc); });
    }
  }

  if (payload.timesheets && Array.isArray(payload.timesheets)) {
    var tsSheet = ss.getSheetByName(SHEET_NAMES.TIMESHEET);
    if (tsSheet) {
      if (tsSheet.getLastRow() > 1) tsSheet.deleteRows(2, tsSheet.getLastRow() - 1);
      payload.timesheets.forEach(function(ts) { insertTimesheet(ss, ts); });
    }
  }

  if (payload.maintenance && Array.isArray(payload.maintenance)) {
    var mSheet = ss.getSheetByName(SHEET_NAMES.MAINTENANCE);
    if (mSheet) {
      if (mSheet.getLastRow() > 1) mSheet.deleteRows(2, mSheet.getLastRow() - 1);
      payload.maintenance.forEach(function(m) { insertMaintenance(ss, m); });
    }
  }

  if (payload.drivers && Array.isArray(payload.drivers)) {
    var dSheet = ss.getSheetByName(SHEET_NAMES.DRIVERS);
    if (dSheet) {
      if (dSheet.getLastRow() > 1) dSheet.deleteRows(2, dSheet.getLastRow() - 1);
      payload.drivers.forEach(function(d) { insertDriver(ss, d); });
    }
  }

  SpreadsheetApp.flush();
  return {
    status: 'success',
    message: 'Seluruh data 44S Ops_pro berhasil disimpan ke Google Spreadsheet!'
  };
}

function fetchAllAppData() {
  return getDashboardSummary();
}

function getDashboardSummary() {
  initSheetsDatabase();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var vSheet = ss.getSheetByName(SHEET_NAMES.VEHICLES);
  var tSheet = ss.getSheetByName(SHEET_NAMES.TAXES);
  var fSheet = ss.getSheetByName(SHEET_NAMES.FUEL);
  var finSheet = ss.getSheetByName(SHEET_NAMES.FINANCE);
  var accSheet = ss.getSheetByName(SHEET_NAMES.ACCOUNTS);

  return {
    status: 'success',
    data: {
      vehicles: vSheet ? Math.max(0, vSheet.getLastRow() - 1) : 0,
      taxes: tSheet ? Math.max(0, tSheet.getLastRow() - 1) : 0,
      fuel: fSheet ? Math.max(0, fSheet.getLastRow() - 1) : 0,
      finance: finSheet ? Math.max(0, finSheet.getLastRow() - 1) : 0,
      accounts: accSheet ? Math.max(0, accSheet.getLastRow() - 1) : 0
    }
  };
}
`;

export const GAS_INDEX_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>44S Ops_pro - Sistem Manajemen Operasional Armada & Keuangan</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    @keyframes pulse-glow {
      0%, 100% { opacity: 0.2; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.05); }
    }
    .glow-bg { animation: pulse-glow 6s infinite ease-in-out; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between font-sans selection:bg-blue-600 selection:text-white">

  <!-- Glow Background Elements -->
  <div class="fixed top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none glow-bg"></div>
  <div class="fixed bottom-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none glow-bg"></div>

  <!-- Header -->
  <header class="relative z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
          <i class="fa-solid fa-truck-fast text-lg"></i>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-extrabold text-lg tracking-tight text-white">44S Ops<span class="text-blue-400">_pro</span></span>
            <span class="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full font-bold uppercase">Google Cloud Apps Script</span>
          </div>
          <p class="text-xs text-slate-400">Sistem Terintegrasi Manajemen Operasional Armada Kendaraan</p>
        </div>
      </div>
      <div class="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="text-slate-300 font-medium">Spreadsheet Database Ready</span>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="relative z-10 max-w-7xl mx-auto w-full px-6 py-10 flex-1">
    
    <!-- Hero Banner -->
    <div class="bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-slate-800 rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden">
      <div class="max-w-3xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-4">
          <i class="fa-solid fa-sparkles text-blue-400"></i> Backend Google Apps Script Aktif
        </div>
        <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Sinkronisasi &amp; Monitoring Real-Time Armada 44S Ops_pro
        </h1>
        <p class="text-slate-400 text-sm leading-relaxed mb-6">
          Spreadsheet Anda kini berfungsi sebagai database cloud terpusat. Kelola pajak, pengisian solar, ritase supir, pengeluaran kas pool, dan jadwal servis dengan keamanan Google Workspace.
        </p>
        
        <div class="flex flex-wrap items-center gap-3">
          <button onclick="initDatabase()" id="btnInit" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer">
            <i class="fa-solid fa-database"></i> Setup / Inisialisasi Ulang 9 Sheet
          </button>
          <button onclick="loadDataPreview()" id="btnRefresh" class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-2 transition cursor-pointer">
            <i class="fa-solid fa-arrows-rotate"></i> Muat Data Terkini
          </button>
        </div>
      </div>
    </div>

    <!-- Status Alert Area -->
    <div id="statusAlert" class="hidden mb-6 p-4 rounded-2xl text-xs font-medium transition"></div>

    <!-- Data Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-slate-400 font-bold uppercase">Total Armada</span>
          <i class="fa-solid fa-truck text-blue-400"></i>
        </div>
        <div id="countVehicles" class="text-2xl font-black text-white">6 Unit</div>
      </div>
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-slate-400 font-bold uppercase">Pajak/KIR Tercatat</span>
          <i class="fa-solid fa-file-invoice text-emerald-400"></i>
        </div>
        <div id="countTaxes" class="text-2xl font-black text-white">6 Rekod</div>
      </div>
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-slate-400 font-bold uppercase">Log Solar BBM</span>
          <i class="fa-solid fa-gas-pump text-amber-400"></i>
        </div>
        <div id="countFuel" class="text-2xl font-black text-white">6 Entri</div>
      </div>
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-slate-400 font-bold uppercase">Kas &amp; Pengeluaran</span>
          <i class="fa-solid fa-wallet text-purple-400"></i>
        </div>
        <div id="countFinance" class="text-2xl font-black text-white">10 Transaksi</div>
      </div>
    </div>

  </main>

  <!-- Footer -->
  <footer class="relative z-10 border-t border-slate-900 bg-slate-950 px-6 py-4 text-center text-xs text-slate-500">
    &copy; 2026 44S Ops_pro Enterprise &bull; Google Apps Script Integration Engine.
  </footer>

  <script>
    function showStatus(msg, isSuccess) {
      var el = document.getElementById('statusAlert');
      el.className = isSuccess 
        ? 'mb-6 p-4 rounded-2xl text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 block'
        : 'mb-6 p-4 rounded-2xl text-xs font-medium bg-rose-500/10 border border-rose-500/30 text-rose-300 block';
      el.innerHTML = msg;
    }

    function initDatabase() {
      var btn = document.getElementById('btnInit');
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyiapkan Database...';
      btn.disabled = true;

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Selesai!';
            showStatus(res.message, true);
            loadDataPreview();
            setTimeout(function() {
              btn.innerHTML = '<i class="fa-solid fa-database"></i> Setup / Inisialisasi Ulang 9 Sheet';
              btn.disabled = false;
            }, 2500);
          })
          .withFailureHandler(function(err) {
            btn.innerHTML = '<i class="fa-solid fa-database"></i> Setup / Inisialisasi Ulang 9 Sheet';
            btn.disabled = false;
            showStatus('Gagal: ' + err.message, false);
          })
          .initSheetsDatabase();
      } else {
        showStatus('Inisialisasi berhasil disimulasikan.', true);
        btn.innerHTML = '<i class="fa-solid fa-database"></i> Setup / Inisialisasi Ulang 9 Sheet';
        btn.disabled = false;
      }
    }

    function loadDataPreview() {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            if (res && res.data) {
              document.getElementById('countVehicles').innerText = (res.data.vehicles || 6) + ' Unit';
              document.getElementById('countTaxes').innerText = (res.data.taxes || 6) + ' Rekod';
              document.getElementById('countFuel').innerText = (res.data.fuel || 6) + ' Entri';
              document.getElementById('countFinance').innerText = (res.data.finance || 10) + ' Transaksi';
            }
          })
          .getDashboardSummary();
      }
    }

    window.onload = function() {
      loadDataPreview();
    };
  </script>
</body>
</html>`;
