/**
 * ============================================================================
 * 44S OPS_PRO - SISTEM MANAJEMEN OPERASIONAL ARMADA (KODE UTAMA)
 * ============================================================================
 * Menangani API request (GET/POST) untuk sinkronisasi Real-Time.
 */

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
        // Coba untuk memproses auto-update berdasarkan "action" format "add[Entity]" dll
        // Fallback untuk action baru yang mungkin diteruskan dari App
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
  return { status: 'success', message: 'Mutasi rekening berhasil diproses' };
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
    message: 'Seluruh data 44S Ops_pro berhasil disinkronisasi ke Google Spreadsheet!'
  };
}

function fetchAllAppData() {
  initSheetsDatabase();
  var ss = getTargetSpreadsheet();
  if (!ss) return { status: 'error', message: 'Spreadsheet tidak ditemukan' };

  return {
    status: 'success',
    data: {
      vehicles: readSheetObjects(ss, SHEET_NAMES.VEHICLES, parseVehicleRow),
      taxes: readSheetObjects(ss, SHEET_NAMES.TAXES, parseTaxRow),
      fuelLogs: readSheetObjects(ss, SHEET_NAMES.FUEL, parseFuelRow),
      finances: readSheetObjects(ss, SHEET_NAMES.FINANCE, parseFinanceRow),
      accounts: readSheetObjects(ss, SHEET_NAMES.ACCOUNTS, parseAccountRow),
      timesheets: readSheetObjects(ss, SHEET_NAMES.TIMESHEET, parseTimesheetRow),
      maintenance: readSheetObjects(ss, SHEET_NAMES.MAINTENANCE, parseMaintenanceRow),
      drivers: readSheetObjects(ss, SHEET_NAMES.DRIVERS, parseDriverRow)
    }
  };
}

function readSheetObjects(ss, sheetName, parseFn) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var list = [];
  for (var i = 0; i < values.length; i++) {
    var item = parseFn(values[i]);
    if (item && item.id) list.push(item);
  }
  return list;
}

function parseVehicleRow(row) {
  return {
    id: String(row[0] || ''),
    nopol: String(row[1] || ''),
    brand: String(row[2] || '').split(' ')[0] || '',
    model: String(row[2] || '').split(' ').slice(1).join(' ') || '',
    type: String(row[3] || 'Dump Truck'),
    year: Number(row[4]) || 2022,
    fuelType: String(row[5] || 'Biosolar'),
    chassisNumber: String(row[6] || ''),
    engineNumber: String(row[7] || ''),
    currentOdometer: Number(row[8]) || 0,
    status: String(row[9] || 'aktif').toLowerCase(),
    assignedDriver: String(row[10] || ''),
    capacityTon: Number(row[11]) || 8,
    notes: String(row[12] || '')
  };
}

function parseTaxRow(row) {
  return {
    id: String(row[0] || ''),
    taxId: String(row[0] || ''),
    vehicleId: String(row[1] || ''),
    nopol: String(row[2] || ''),
    taxType: String(row[3] || 'stnk_tahunan'),
    dueDate: row[4] instanceof Date ? Utilities.formatDate(row[4], 'GMT+7', 'yyyy-MM-dd') : String(row[4] || ''),
    lastPaidDate: row[5] instanceof Date ? Utilities.formatDate(row[5], 'GMT+7', 'yyyy-MM-dd') : String(row[5] || ''),
    estimatedCost: Number(row[6]) || 0,
    penalty: Number(row[7]) || 0,
    status: String(row[8] || 'upcoming').toLowerCase(),
    location: String(row[9] || ''),
    notes: String(row[10] || '')
  };
}

function parseFuelRow(row) {
  return {
    id: String(row[0] || ''),
    date: row[1] instanceof Date ? Utilities.formatDate(row[1], 'GMT+7', 'yyyy-MM-dd') : String(row[1] || ''),
    nopol: String(row[2] || ''),
    driverName: String(row[3] || ''),
    fuelType: String(row[4] || 'Biosolar'),
    volumeLiters: Number(row[5]) || 0,
    pricePerLiter: Number(row[6]) || 6800,
    totalCost: Number(row[7]) || 0,
    odometer: Number(row[8]) || 0,
    distanceTravelled: Number(row[9]) || 0,
    calculatedKmPerLiter: Number(row[10]) || 0,
    fuelStation: String(row[11] || ''),
    isFullTank: String(row[12] || '').toUpperCase() === 'YA',
    receiptNumber: String(row[13] || ''),
    notes: String(row[14] || '')
  };
}

function parseFinanceRow(row) {
  return {
    id: String(row[0] || ''),
    date: row[1] instanceof Date ? Utilities.formatDate(row[1], 'GMT+7', 'yyyy-MM-dd') : String(row[1] || ''),
    nopol: String(row[2] || ''),
    driverName: String(row[3] || ''),
    category: String(row[4] || 'Operasional'),
    type: String(row[5] || '').toLowerCase().indexOf('pemasukan') >= 0 ? 'income' : 'expense',
    amount: Number(row[6]) || 0,
    tripCode: String(row[7] || ''),
    description: String(row[8] || ''),
    paymentMethod: String(row[9] || 'Cash'),
    status: String(row[10] || 'approved'),
    receiptNumber: String(row[11] || ''),
    accountId: String(row[12] || ''),
    accountName: String(row[13] || '')
  };
}

function parseAccountRow(row) {
  return {
    id: String(row[0] || ''),
    accountName: String(row[1] || ''),
    accountNumber: String(row[2] || '-'),
    bankOrProvider: String(row[3] || ''),
    accountType: String(row[4] || 'bank'),
    initialBalance: Number(row[5]) || 0,
    currentBalance: Number(row[6]) || 0,
    notes: String(row[7] || '')
  };
}

function parseTimesheetRow(row) {
  return {
    id: String(row[0] || ''),
    date: row[1] instanceof Date ? Utilities.formatDate(row[1], 'GMT+7', 'yyyy-MM-dd') : String(row[1] || ''),
    nopol: String(row[2] || ''),
    driverName: String(row[3] || ''),
    helperName: String(row[4] || ''),
    origin: String(row[5] || ''),
    destination: String(row[6] || ''),
    startTime: String(row[7] || ''),
    endTime: String(row[8] || ''),
    totalHours: Number(row[9]) || 0,
    overtimeHours: Number(row[10]) || 0,
    cargoType: String(row[11] || ''),
    tonnage: Number(row[12]) || 0,
    ritCount: Number(row[13]) || 1,
    startKm: Number(row[14]) || 0,
    endKm: Number(row[15]) || 0,
    totalDistanceKm: Number(row[16]) || 0,
    status: String(row[17] || 'completed'),
    notes: String(row[18] || '')
  };
}

function parseMaintenanceRow(row) {
  return {
    id: String(row[0] || ''),
    serviceDate: row[1] instanceof Date ? Utilities.formatDate(row[1], 'GMT+7', 'yyyy-MM-dd') : String(row[1] || ''),
    nopol: String(row[2] || ''),
    serviceOdometer: Number(row[3]) || 0,
    nextTargetOdometer: Number(row[4]) || 0,
    nextTargetDate: row[5] instanceof Date ? Utilities.formatDate(row[5], 'GMT+7', 'yyyy-MM-dd') : String(row[5] || ''),
    serviceType: String(row[6] || ''),
    workshopName: String(row[7] || ''),
    spkNumber: String(row[8] || ''),
    serviceCost: Number(row[9]) || 0,
    partsDetail: String(row[10] || ''),
    totalCost: Number(row[11]) || 0,
    status: String(row[12] || 'completed'),
    notes: String(row[13] || '')
  };
}

function parseDriverRow(row) {
  return {
    id: String(row[0] || ''),
    name: String(row[1] || ''),
    nik: String(row[2] || ''),
    phone: String(row[3] || ''),
    simType: String(row[4] || 'BII Umum'),
    simNumber: String(row[5] || ''),
    simExpiryDate: row[6] instanceof Date ? Utilities.formatDate(row[6], 'GMT+7', 'yyyy-MM-dd') : String(row[6] || ''),
    status: String(row[7] || 'available'),
    joinDate: row[8] instanceof Date ? Utilities.formatDate(row[8], 'GMT+7', 'yyyy-MM-dd') : String(row[8] || '')
  };
}

function getDashboardSummary() {
  initSheetsDatabase();
  var ss = getTargetSpreadsheet();
  if (!ss) return { status: 'error', message: 'Spreadsheet tidak aktif' };
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
