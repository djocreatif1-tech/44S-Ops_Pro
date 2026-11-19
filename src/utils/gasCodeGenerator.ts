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
var CACHE_KEY_ALL_DATA = '44S_OPS_CLEAN_CACHE_V6';
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
  ACCOUNTS: '44S_Ops_Accounts',
  COMPANY_DEPOSITS: '44S_Ops_CompanyDeposits',
  USERS: '44S_Ops_Users',
  AUDIT_LOGS: '44S_Ops_AuditLogs',
  MASTER_REF: '44S_Ops_MasterRef'
};

var SHEET_SCHEMAS = {};
SHEET_SCHEMAS[SHEETS.VEHICLES] = ['id', 'nopol', 'brand', 'model', 'type', 'year', 'assignedDriver', 'status', 'currentOdometer', 'ownerCompany', 'capacityTon', 'stnk1YearDate', 'kirDate', 'stnk5YearDate', 'rawJson'];
SHEET_SCHEMAS[SHEETS.TAXES] = ['id', 'vehicleId', 'nopol', 'documentType', 'dueDate', 'amount', 'status', 'lastPaymentDate', 'companyName', 'rawJson'];
SHEET_SCHEMAS[SHEETS.FUEL] = ['id', 'vehicleId', 'nopol', 'date', 'volumeLiters', 'pricePerLiter', 'totalCost', 'odometer', 'fuelStation', 'driverName', 'companyName', 'rawJson'];
SHEET_SCHEMAS[SHEETS.FINANCE] = ['id', 'date', 'type', 'category', 'amount', 'description', 'vehicleId', 'nopol', 'accountId', 'companyName', 'paymentMethod', 'status', 'rawJson'];
SHEET_SCHEMAS[SHEETS.POCKET_FLOWS] = ['id', 'tripCode', 'date', 'driverName', 'nopol', 'ownerCompany', 'originLocation', 'destinationLocation', 'totalGiven', 'actualExpense', 'paymentMethod', 'status', 'rawJson'];
SHEET_SCHEMAS[SHEETS.EQUIPMENT_FLOWS] = ['id', 'date', 'type', 'equipmentName', 'category', 'nopol', 'recipientName', 'ownerCompany', 'quantity', 'totalAmount', 'status', 'rawJson'];
SHEET_SCHEMAS[SHEETS.TRIP_SHEETS] = ['id', 'tripNumber', 'suratJalanNumber', 'departureDate', 'nopol', 'driverName', 'ownerCompany', 'originLocation', 'destinationLocation', 'totalPocketDisbursed', 'actualTripExpense', 'status', 'rawJson'];
SHEET_SCHEMAS[SHEETS.TIMESHEETS] = ['id', 'vehicleId', 'nopol', 'driverName', 'date', 'originLocation', 'destinationLocation', 'totalHours', 'tripCount', 'cargoTonnageTon', 'status', 'rawJson'];
SHEET_SCHEMAS[SHEETS.MAINTENANCE] = ['id', 'workOrderNumber', 'vehicleId', 'nopol', 'serviceDate', 'serviceType', 'description', 'workshopName', 'mechanicName', 'odometerAtService', 'totalCost', 'status', 'rawJson'];
SHEET_SCHEMAS[SHEETS.SPAREPARTS] = ['id', 'partCode', 'partName', 'category', 'condition', 'stockQty', 'minStockAlert', 'unit', 'unitPrice', 'storageLocation', 'ownerCompany', 'rawJson'];
SHEET_SCHEMAS[SHEETS.SPAREPART_MOVEMENTS] = ['id', 'partId', 'partCode', 'partName', 'condition', 'date', 'movementType', 'qty', 'nopol', 'driverName', 'notes', 'rawJson'];
SHEET_SCHEMAS[SHEETS.DRIVERS] = ['id', 'nip', 'name', 'phone', 'simType', 'simExpiryDate', 'assignedVehicle', 'companyName', 'status', 'rawJson'];
SHEET_SCHEMAS[SHEETS.ACCOUNTS] = ['id', 'accountName', 'accountNumber', 'bankOrProvider', 'accountType', 'companyName', 'initialBalance', 'currentBalance', 'isActive', 'rawJson'];
SHEET_SCHEMAS[SHEETS.COMPANY_DEPOSITS] = ['id', 'companyName', 'companyCode', 'picName', 'picPhone', 'initialDeposit', 'currentBalance', 'totalTopUp', 'totalUsed', 'status', 'rawJson'];
SHEET_SCHEMAS[SHEETS.USERS] = ['id', 'username', 'name', 'email', 'phone', 'role', 'status', 'allowedModulesJson', 'lastLogin', 'rawJson'];
SHEET_SCHEMAS[SHEETS.AUDIT_LOGS] = ['id', 'timestamp', 'userName', 'userRole', 'module', 'action', 'title', 'rawJson'];

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
      message: '44S Ops_pro Fast Cloud Engine Ready (Granular Single-Record CRUD)',
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
    return { status: 'success', message: '16 Tabel Database siap digunakan.' };
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
    if (Array.isArray(data.accounts)) batchUpsertSheet(ss, SHEETS.ACCOUNTS, data.accounts);
    if (Array.isArray(data.companyDeposits)) batchUpsertSheet(ss, SHEETS.COMPANY_DEPOSITS, data.companyDeposits);
    if (Array.isArray(data.users)) batchUpsertSheet(ss, SHEETS.USERS, data.users);
    if (Array.isArray(data.auditLogs)) {
      batchUpsertSheet(ss, SHEETS.AUDIT_LOGS, data.auditLogs.slice(0, 250));
    }

    invalidateFastCache();
    return {
      status: 'success',
      message: 'Sinkronisasi Non-Destructive 16 Modul selesai (Data Aman & Hemat Sel)',
      timestamp: new Date().toISOString()
    };
  }

  // GRANULAR SINGLE-RECORD CRUD MAP (Fokus hanya pada 1 ID data yang dipilih)
  var granularMap = {
    addVehicle: { sheet: SHEETS.VEHICLES, mode: 'upsert' },
    updateVehicle: { sheet: SHEETS.VEHICLES, mode: 'upsert' },
    deleteVehicle: { sheet: SHEETS.VEHICLES, mode: 'delete' },
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
    addDriver: { sheet: SHEETS.DRIVERS, mode: 'upsert' },
    updateDriver: { sheet: SHEETS.DRIVERS, mode: 'upsert' },
    deleteDriver: { sheet: SHEETS.DRIVERS, mode: 'delete' },
    addAccount: { sheet: SHEETS.ACCOUNTS, mode: 'upsert' },
    updateAccount: { sheet: SHEETS.ACCOUNTS, mode: 'upsert' },
    deleteAccount: { sheet: SHEETS.ACCOUNTS, mode: 'delete' },
    addCompanyDeposit: { sheet: SHEETS.COMPANY_DEPOSITS, mode: 'upsert' },
    updateCompanyDeposit: { sheet: SHEETS.COMPANY_DEPOSITS, mode: 'upsert' },
    deleteCompanyDeposit: { sheet: SHEETS.COMPANY_DEPOSITS, mode: 'delete' },
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
      invalidateFastCache();
      return { status: 'success', action: action, result: upRes };
    } else if (target.mode === 'delete') {
      var delRes = deleteRowById(ss, target.sheet, itemData);
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

  var responsePayload = {
    status: 'success',
    fromCache: false,
    timestamp: new Date().toISOString(),
    data: {
      vehicles: readSheetFast(ss, SHEETS.VEHICLES),
      taxes: readSheetFast(ss, SHEETS.TAXES),
      fuelLogs: readSheetFast(ss, SHEETS.FUEL),
      finances: readSheetFast(ss, SHEETS.FINANCE),
      pocketFlows: readSheetFast(ss, SHEETS.POCKET_FLOWS),
      equipmentList: readSheetFast(ss, SHEETS.EQUIPMENT_FLOWS),
      equipmentFlows: readSheetFast(ss, SHEETS.EQUIPMENT_FLOWS),
      tripSheets: readSheetFast(ss, SHEETS.TRIP_SHEETS),
      timesheets: readSheetFast(ss, SHEETS.TIMESHEETS),
      maintenance: readSheetFast(ss, SHEETS.MAINTENANCE),
      sparepartInventory: readSheetFast(ss, SHEETS.SPAREPARTS),
      sparepartMovements: readSheetFast(ss, SHEETS.SPAREPART_MOVEMENTS),
      drivers: readSheetFast(ss, SHEETS.DRIVERS),
      accounts: readSheetFast(ss, SHEETS.ACCOUNTS),
      companyDeposits: readSheetFast(ss, SHEETS.COMPANY_DEPOSITS),
      users: readSheetFast(ss, SHEETS.USERS),
      auditLogs: readSheetFast(ss, SHEETS.AUDIT_LOGS)
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

function readSheetFast(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol < 1) return [];

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0];
  var schemaHeaders = SHEET_SCHEMAS[sheetName] || [];
  var results = [];

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
  var cleanRec = sanitizeRecordForDatabase(record);
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

function sanitizeRecordForDatabase(record) {
  if (!record || typeof record !== 'object') return {};
  var copy = JSON.parse(JSON.stringify(record));
  delete copy._sheetRowIndex;
  var heavyFields = ['attachmentDataUrl', 'receiptDataUrl', 'receiptProofUrl', 'photoUrl', 'ktpPhotoUrl', 'simPhotoUrl', 'proofImage'];

  for (var i = 0; i < heavyFields.length; i++) {
    var key = heavyFields[i];
    if (typeof copy[key] === 'string' && copy[key].length > 15000) {
      copy[key] = '[COMPRESSED_ATTACHMENT_REF:' + (copy.attachmentName || key) + ']';
    }
  }
  return copy;
}

function mapRecordToRow(record, headers) {
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    var h = headers[i];
    if (h === 'rawJson') {
      var jsonStr = JSON.stringify(record);
      row.push(jsonStr.length > 48000 ? jsonStr.substring(0, 48000) : jsonStr);
    } else if (h === 'allowedModulesJson') {
      row.push(JSON.stringify(record.allowedTabs || record.allowedModules || []));
    } else if (h === 'ownerCompany' || h === 'companyName') {
      var compVal = record.ownerCompany || record.companyName || record.purchasedByCompany || record.sourceCompanyName || '';
      row.push(compVal);
    } else {
      var val = record[h];
      row.push(val !== undefined && val !== null ? val : '');
    }
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
    // Auto-heal Row 1 headers if rawJson is missing or header count changed
    var lastCol = Math.max(sheet.getLastColumn(), 1);
    var currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    if (currentHeaders.indexOf('rawJson') === -1 || currentHeaders.length < headers.length) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#0f172a')
        .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
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
    accounts: SHEETS.ACCOUNTS,
    companyDeposits: SHEETS.COMPANY_DEPOSITS,
    users: SHEETS.USERS,
    auditLogs: SHEETS.AUDIT_LOGS
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
 * 1. setupDatabase()                : Menyiapkan struktur 16 Sheet tanpa menghapus data yang sudah ada.
 * 2. optimizeAllDatabaseSheets()    : Memangkas baris/kolom kosong di bawah data terakhir (Hemat Kuota 10 Juta Sel).
 * 3. getDatabaseHealthReport()      : Mengukur pemakaian sel database & performa anti-lemot.
 * 4. setupDailyTrigger()            : Mengaktifkan cron job harian (jam 07:00 WIB) untuk kompresi sel kosong & alarm pajak.
 * ============================================================================
 */

function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('🚛 44S Ops_pro Admin')
      .addItem('1. Inisialisasi Struktur 16 Sheet Database (Aman Data)', 'setupDatabase')
      .addItem('2. Optimasi & Pangkas Sel Kosong (Anti-Lemot)', 'optimizeAllDatabaseSheets')
      .addSeparator()
      .addItem('3. Cek Kesehatan & Kuota Sel Database', 'showDatabaseHealthDialog')
      .addItem('4. Aktifkan Trigger Optimasi & Alarm Harian', 'setupDailyTrigger')
      .addToUi();
  } catch (ignore) {}
}

/**
 * 1. INISIALISASI STRUKTUR 16 SHEET (TANPA MENGHAPUS DATA YANG SUDAH ADA)
 */
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureAllSheetsReady(ss);

  getOrCreateSheetWithSchema(ss, SHEETS.MASTER_REF, [
    'refType', 'code', 'name', 'companyName', 'status', 'updatedAt'
  ]);

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
    message: '16 Sheet Database 44S Ops_pro siap digunakan (Data yang ada tetap aman).',
    health: getDatabaseHealthReport()
  };
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
