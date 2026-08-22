/**
 * ============================================================================
 * FLEETOPS PRO - SISTEM MANAJEMEN OPERASIONAL KENDARAAN & NOTIFIKASI
 * ============================================================================
 * Backend Google Apps Script yang terhubung otomatis dengan Google Spreadsheet.
 * 
 * Modul Lengkap:
 * 1. Database Multi-Sheet:
 *    - Armada_Kendaraan (Vehicles Master)
 *    - Pajak_Dokumen (Pajak STNK 1 Thn, Plat 5 Thn, KIR)
 *    - Perawatan_Servis (Servis Berkala & Penggantian Sparepart)
 *    - Log_Solar_BBM (Konsumsi BBM Solar & Efisiensi KM/L)
 *    - Keuangan_Operasional (Arus Kas Pemasukan & Pengeluaran)
 *    - Akun_Saldo_Rekening (Rekening Bank & Kas Tunai Operasional)
 *    - Timesheet_Ritase (Surat Jalan & Jam Kerja Driver)
 *    - Master_Driver (Database Supir & Masa Berlaku SIM)
 *    - Pengaturan_Notifikasi (Konfigurasi Ambang Batas Notifikasi User)
 * 2. Sistem Notifikasi Otomatis:
 *    - Pengingat Pajak STNK & Uji KIR (H-30, H-14, H-7, Overdue)
 *    - Pengingat Servis Rutin Odometer & Estimasi Tanggal Ganti Oli
 *    - Pengingat Pengisian BBM & Rekonsiliasi Konsumsi Solar Boros
 * 3. Akun Saldo Rekening Keuangan Real-Time
 * 4. Email Alert Digest & Web App Dashboard
 * ============================================================================
 */

var SHEET_NAMES = {
  VEHICLES: 'Armada_Kendaraan',
  TAXES: 'Pajak_Dokumen',
  FUEL: 'Log_Solar_BBM',
  FINANCE: 'Keuangan_Operasional',
  ACCOUNTS: 'Akun_Saldo_Rekening',
  TIMESHEET: 'Timesheet_Ritase',
  MAINTENANCE: 'Perawatan_Servis',
  DRIVERS: 'Master_Driver',
  NOTIF_CONFIG: 'Pengaturan_Notifikasi',
  NOTIF_LOGS: 'Log_Notifikasi'
};

/**
 * Endpoint GET Web App
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';
  
  if (action === 'getAllData') {
    return jsonResponse(fetchAllAppData());
  } else if (action === 'getNotifications') {
    return jsonResponse(getNotificationAlerts());
  } else if (action === 'getAccounts') {
    return jsonResponse(getFinancialAccounts());
  } else if (action === 'getSummary') {
    return jsonResponse(getDashboardSummary());
  } else if (action === 'ping') {
    return jsonResponse({ status: 'success', message: 'FleetOps Pro Apps Script Backend is ACTIVE!', timestamp: new Date().toISOString() });
  }
  
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('FleetOps Pro - Sistem Operasional & Notifikasi Armada')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Endpoint POST Web App
 */
function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : '{}';
    var payload = JSON.parse(rawData);
    var action = payload.action;
    var data = payload.data;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    switch (action) {
      case 'addFuelLog':
        return jsonResponse(insertFuelLog(ss, data));
      case 'addFinance':
        return jsonResponse(insertFinance(ss, data));
      case 'addAccount':
        return jsonResponse(insertAccount(ss, data));
      case 'updateAccountBalance':
        return jsonResponse(updateAccountBalance(ss, data));
      case 'addTimesheet':
        return jsonResponse(insertTimesheet(ss, data));
      case 'addMaintenance':
        return jsonResponse(insertMaintenance(ss, data));
      case 'addVehicle':
        return jsonResponse(insertVehicle(ss, data));
      case 'saveNotifConfig':
        return jsonResponse(saveNotifConfig(ss, data));
      case 'sendEmailAlertsNow':
        return jsonResponse(sendDailyNotificationEmail());
      default:
        return jsonResponse({ status: 'error', message: 'Aksi tidak dikenali: ' + action });
    }
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Inisialisasi Struktur Database Multi-Sheet di Google Spreadsheet
 */
function initSheetsDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Armada Kendaraan
  createOrSetupSheet(ss, SHEET_NAMES.VEHICLES, [
    'ID Unit', 'No. Polisi', 'Merk / Tipe', 'Jenis Armada', 'Tahun', 'Bahan Bakar',
    'No. Rangka', 'No. Mesin', 'Odometer Terkini (KM)', 'Status Operasi', 'Supir Tetap',
    'No HP Supir', 'Jatuh Tempo Pajak 1 Thn', 'Jatuh Tempo Plat 5 Thn', 'Jatuh Tempo KIR',
    'Target Km/Liter', 'Kapasitas (Ton)', 'Catatan'
  ], '#1e3a8a');
  
  // 2. Pajak & Dokumen Legalitas
  createOrSetupSheet(ss, SHEET_NAMES.TAXES, [
    'ID Pajak', 'ID Unit', 'No. Polisi', 'Jenis Dokumen', 'Tanggal Jatuh Tempo',
    'Tgl Bayar Terakhir', 'Estimasi Biaya (Rp)', 'Denda (Rp)', 'Status', 'Samsat / Lokasi KIR', 'Keterangan'
  ], '#b91c1c');

  // 3. Log Solar BBM
  createOrSetupSheet(ss, SHEET_NAMES.FUEL, [
    'ID Log', 'Tanggal', 'No. Polisi', 'Supir', 'Jenis BBM', 'Volume (Liter)',
    'Harga per Liter (Rp)', 'Total Biaya (Rp)', 'Odometer Saat Ini', 'Jarak Tempuh (KM)',
    'Konsumsi (KM/Liter)', 'Lokasi SPBU', 'Full Tank?', 'No. Struk', 'Catatan'
  ], '#047857');

  // 4. Keuangan Operasional
  createOrSetupSheet(ss, SHEET_NAMES.FINANCE, [
    'ID Transaksi', 'Tanggal', 'No. Polisi', 'Supir', 'Kategori', 'Tipe (Debet/Kredit)',
    'Jumlah (Rp)', 'Kode Trip / DO', 'Deskripsi', 'Metode Bayar / Rekening', 'Status Validasi', 'No. Kuitansi'
  ], '#4338ca');

  // 5. Akun Saldo Rekening
  createOrSetupSheet(ss, SHEET_NAMES.ACCOUNTS, [
    'ID Akun', 'Nama Rekening / Kas', 'Nomor Rekening', 'Atas Nama', 'Tipe (Bank/Cash/E-Wallet)',
    'Saldo Terkini (Rp)', 'Status Akun', 'Terakhir Diperbarui'
  ], '#0284c7');

  // 6. Timesheet Ritase
  createOrSetupSheet(ss, SHEET_NAMES.TIMESHEET, [
    'ID Timesheet', 'Tanggal', 'No. Polisi', 'Supir', 'Kernet', 'Asal (Origin)',
    'Tujuan (Destination)', 'Jam Mulai', 'Jam Selesai', 'Total Jam', 'Jam Lembur',
    'Muatan Barang', 'Tonase (Ton)', 'Jumlah Rit', 'KM Awal', 'KM Akhir', 'Jarak (KM)', 'Status', 'Catatan'
  ], '#d97706');

  // 7. Perawatan & Servis
  createOrSetupSheet(ss, SHEET_NAMES.MAINTENANCE, [
    'ID Servis', 'Tanggal Servis', 'No. Polisi', 'Odometer Servis (KM)', 'Target Odo Berikutnya (KM)',
    'Tgl Servis Berikutnya', 'Jenis Pekerjaan', 'Nama Bengkel / Montir', 'No. SPK / WO',
    'Biaya Jasa (Rp)', 'Rincian Sparepart', 'Total Biaya (Rp)', 'Status', 'Catatan Servis'
  ], '#0f766e');

  // 8. Master Driver
  createOrSetupSheet(ss, SHEET_NAMES.DRIVERS, [
    'ID Supir', 'Nama Lengkap', 'NIK KTP', 'No. WhatsApp / HP', 'Golongan SIM',
    'No. SIM', 'Masa Berlaku SIM', 'Status Tugas', 'Tanggal Bergabung'
  ], '#374151');

  // 9. Pengaturan Notifikasi
  createOrSetupSheet(ss, SHEET_NAMES.NOTIF_CONFIG, [
    'Parameter Pengaturan', 'Nilai Konfigurasi', 'Satuan / Keterangan'
  ], '#6b21a8');

  // Seed default settings if empty
  seedDefaultSettings(ss);

  SpreadsheetApp.flush();
  Logger.log('Inisialisasi Database & Notifikasi FleetOps Pro Berhasil!');
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
    sheet.autoResizeColumns(1, headers.length);
  }
  return sheet;
}

function seedDefaultSettings(ss) {
  var sheet = ss.getSheetByName(SHEET_NAMES.NOTIF_CONFIG);
  if (sheet && sheet.getLastRow() <= 1) {
    var defaultSettings = [
      ['taxDaysWarning', '14', 'Batas hari peringatan pajak sebelum jatuh tempo'],
      ['taxDaysUrgent', '3', 'Batas hari darurat pajak sebelum jatuh tempo'],
      ['serviceKmWarning', '1000', 'Batas sisa KM sebelum jadwal ganti oli / servis'],
      ['serviceDaysWarning', '7', 'Batas hari sebelum tanggal servis berkala'],
      ['fuelMinKmPerLiter', '3.5', 'Batas minimum rasio konsumsi KM/L sebelum alert boros'],
      ['fuelUnloggedDaysWarning', '3', 'Batas hari armada belum ada log BBM solar'],
      ['emailNotificationEnabled', 'true', 'Kirim rekap email notifikasi harian otomatis'],
      ['recipientEmail', Session.getActiveUser().getEmail() || 'admin-fleet@company.com', 'Alamat email penerima rekap alert']
    ];
    for (var i = 0; i < defaultSettings.length; i++) {
      sheet.appendRow(defaultSettings[i]);
    }
  }

  // Seed default accounts if empty
  var accSheet = ss.getSheetByName(SHEET_NAMES.ACCOUNTS);
  if (accSheet && accSheet.getLastRow() <= 1) {
    var sampleAccounts = [
      ['ACC-BCA-01', 'BCA Operasional Logistik', '882-019-2811', 'PT Armada Perkasa', 'Bank Transfer', 145250000, 'Aktif', new Date().toISOString()],
      ['ACC-MDR-02', 'Mandiri Escrow Solar SPBU', '132-00-9821-4', 'PT Armada Perkasa', 'Bank Transfer', 48500000, 'Aktif', new Date().toISOString()],
      ['ACC-CSH-03', 'Kas Tunai Pool & Tol', 'KAS-POOL-01', 'Bendahara Pool', 'Kas Tunai', 12350000, 'Aktif', new Date().toISOString()]
    ];
    for (var j = 0; j < sampleAccounts.length; j++) {
      accSheet.appendRow(sampleAccounts[j]);
    }
  }
}

/**
 * Mesin Notifikasi Utama: Mengecek Pajak, Servis, & Solar BBM
 */
function getNotificationAlerts() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var notifications = [];
  var config = getNotifConfigMap(ss);
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Cek Pajak Kendaraan
  var taxSheet = ss.getSheetByName(SHEET_NAMES.TAXES);
  if (taxSheet && taxSheet.getLastRow() > 1) {
    var taxData = taxSheet.getDataRange().getValues();
    for (var i = 1; i < taxData.length; i++) {
      var nopol = taxData[i][2];
      var docType = taxData[i][3];
      var dueDateStr = taxData[i][4];
      var status = taxData[i][8];

      if (status !== 'Lunas' && dueDateStr) {
        var dueDate = new Date(dueDateStr);
        var diffTime = dueDate.getTime() - today.getTime();
        var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          notifications.push({
            id: 'NOTIF-TAX-OVER-' + i,
            category: 'tax',
            severity: 'overdue',
            title: 'Pajak Overdue: ' + nopol,
            message: docType + ' telah melewati jatuh tempo ' + Math.abs(diffDays) + ' hari lalu.',
            date: dueDateStr,
            nopol: nopol,
            actionUrl: '#tax'
          });
        } else if (diffDays <= Number(config.taxDaysWarning || 14)) {
          notifications.push({
            id: 'NOTIF-TAX-WARN-' + i,
            category: 'tax',
            severity: diffDays <= Number(config.taxDaysUrgent || 3) ? 'urgent' : 'warning',
            title: 'Jatuh Tempo Pajak: ' + nopol,
            message: docType + ' jatuh tempo dalam ' + diffDays + ' hari.',
            date: dueDateStr,
            nopol: nopol,
            actionUrl: '#tax'
          });
        }
      }
    }
  }

  // 2. Cek Servis Rutin & Odometer
  var maintSheet = ss.getSheetByName(SHEET_NAMES.MAINTENANCE);
  var vehSheet = ss.getSheetByName(SHEET_NAMES.VEHICLES);
  if (maintSheet && vehSheet && maintSheet.getLastRow() > 1 && vehSheet.getLastRow() > 1) {
    var maintData = maintSheet.getDataRange().getValues();
    var vehData = vehSheet.getDataRange().getValues();
    
    // Map vehicle odometers
    var vehOdoMap = {};
    for (var v = 1; v < vehData.length; v++) {
      vehOdoMap[vehData[v][1]] = Number(vehData[v][8]) || 0;
    }

    for (var m = 1; m < maintData.length; m++) {
      var mNopol = maintData[m][2];
      var nextOdo = Number(maintData[m][4]) || 0;
      var nextDateStr = maintData[m][5];
      var currOdo = vehOdoMap[mNopol] || 0;
      var kmRemaining = nextOdo - currOdo;

      if (nextOdo > 0 && kmRemaining <= Number(config.serviceKmWarning || 1000)) {
        notifications.push({
          id: 'NOTIF-SRV-KM-' + m,
          category: 'service',
          severity: kmRemaining <= 200 ? 'urgent' : 'warning',
          title: 'Jadwal Ganti Oli: ' + mNopol,
          message: 'Sisa ' + kmRemaining + ' KM menuju target servis (' + nextOdo + ' KM). Odo saat ini: ' + currOdo + ' KM.',
          date: nextDateStr,
          nopol: mNopol,
          actionUrl: '#maintenance'
        });
      }
    }
  }

  // 3. Cek Log Pengisian Bahan Bakar & Efisiensi
  var fuelSheet = ss.getSheetByName(SHEET_NAMES.FUEL);
  if (fuelSheet && fuelSheet.getLastRow() > 1) {
    var fuelData = fuelSheet.getDataRange().getValues();
    var latestFuelPerVehicle = {};

    for (var f = 1; f < fuelData.length; f++) {
      var fNopol = fuelData[f][2];
      var fDateStr = fuelData[f][1];
      var fKmLiter = Number(fuelData[f][10]) || 0;

      if (!latestFuelPerVehicle[fNopol] || new Date(fDateStr) > new Date(latestFuelPerVehicle[fNopol].date)) {
        latestFuelPerVehicle[fNopol] = { date: fDateStr, kmLiter: fKmLiter };
      }

      // Check efficiency alert
      if (fKmLiter > 0 && fKmLiter < Number(config.fuelMinKmPerLiter || 3.5)) {
        notifications.push({
          id: 'NOTIF-FUEL-EFF-' + f,
          category: 'fuel',
          severity: 'warning',
          title: 'Efisiensi Solar Rendah: ' + fNopol,
          message: 'Rasio konsumsi tercatat ' + fKmLiter.toFixed(2) + ' KM/L (di bawah batas normal ' + config.fuelMinKmPerLiter + ' KM/L).',
          date: fDateStr,
          nopol: fNopol,
          actionUrl: '#fuel'
        });
      }
    }
  }

  return {
    status: 'success',
    totalAlerts: notifications.length,
    notifications: notifications,
    timestamp: new Date().toISOString()
  };
}

function getNotifConfigMap(ss) {
  var map = {};
  var sheet = ss.getSheetByName(SHEET_NAMES.NOTIF_CONFIG);
  if (sheet && sheet.getLastRow() > 1) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      map[data[i][0]] = data[i][1];
    }
  }
  return map;
}

function saveNotifConfig(ss, configData) {
  var sheet = ss.getSheetByName(SHEET_NAMES.NOTIF_CONFIG);
  if (!sheet) return { status: 'error', message: 'Sheet config tidak ditemukan' };

  var data = sheet.getDataRange().getValues();
  for (var key in configData) {
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(configData[key]);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, configData[key], 'User custom setting']);
    }
  }
  return { status: 'success', message: 'Konfigurasi notifikasi berhasil disimpan.' };
}

/**
 * Kirim Email Rekap Notifikasi Otomatis
 */
function sendDailyNotificationEmail() {
  var alertRes = getNotificationAlerts();
  var notifs = alertRes.notifications || [];
  if (notifs.length === 0) return { status: 'success', message: 'Tidak ada notifikasi aktif.' };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var config = getNotifConfigMap(ss);
  var recipient = config.recipientEmail || Session.getActiveUser().getEmail();

  var emailBody = '<h2>FleetOps Pro - Rekap Pengingat Operasional Armada</h2>' +
    '<p>Berikut daftar pengingat yang memerlukan tindak lanjut hari ini:</p><ul>';

  for (var i = 0; i < notifs.length; i++) {
    var item = notifs[i];
    var badgeColor = item.severity === 'overdue' || item.severity === 'urgent' ? '#dc2626' : '#d97706';
    emailBody += '<li style="margin-bottom: 8px;">' +
      '<strong style="color:' + badgeColor + '">[' + item.category.toUpperCase() + '] ' + item.title + '</strong>: ' +
      item.message + ' (Tanggal: ' + item.date + ')' +
      '</li>';
  }
  emailBody += '</ul><br><p>Akses dasbor aplikasi untuk melakukan tindak lanjut.</p>';

  MailApp.sendEmail({
    to: recipient,
    subject: '[FleetOps Pro] ' + notifs.length + ' Peringatan Operasional Kendaraan Perlu Tindak Lanjut',
    htmlBody: emailBody
  });

  return { status: 'success', message: 'Email notifikasi berhasil dikirim ke ' + recipient };
}

/**
 * Pasang Trigger Harian Otomatis Jam 07:00 Pagi
 */
function setupDailyNotificationTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'sendDailyNotificationEmail') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger('sendDailyNotificationEmail')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();

  Logger.log('Trigger notifikasi harian jam 07:00 berhasil diaktifkan!');
}

/**
 * Akun Saldo Rekening Management
 */
function getFinancialAccounts() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.ACCOUNTS);
  if (!sheet || sheet.getLastRow() <= 1) return { status: 'success', accounts: [] };

  var data = sheet.getDataRange().getValues();
  var accounts = [];
  for (var i = 1; i < data.length; i++) {
    accounts.push({
      id: data[i][0],
      name: data[i][1],
      accountNumber: data[i][2],
      holderName: data[i][3],
      type: data[i][4],
      currentBalance: Number(data[i][5]) || 0,
      status: data[i][6],
      updatedAt: data[i][7]
    });
  }
  return { status: 'success', accounts: accounts };
}

function insertAccount(ss, acc) {
  var sheet = ss.getSheetByName(SHEET_NAMES.ACCOUNTS);
  var row = [
    acc.id || ('ACC-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMddHHmmss')),
    acc.name,
    acc.accountNumber || '-',
    acc.holderName || '-',
    acc.type || 'Bank Transfer',
    Number(acc.currentBalance) || 0,
    acc.status || 'Aktif',
    new Date().toISOString()
  ];
  sheet.appendRow(row);
  return { status: 'success', id: row[0] };
}

function updateAccountBalance(ss, data) {
  var sheet = ss.getSheetByName(SHEET_NAMES.ACCOUNTS);
  var sheetData = sheet.getDataRange().getValues();
  for (var i = 1; i < sheetData.length; i++) {
    if (sheetData[i][0] === data.accountId || sheetData[i][1] === data.accountName) {
      sheet.getRange(i + 1, 6).setValue(Number(data.newBalance));
      sheet.getRange(i + 1, 8).setValue(new Date().toISOString());
      return { status: 'success', message: 'Saldo berhasil diperbarui.' };
    }
  }
  return { status: 'error', message: 'Akun rekening tidak ditemukan.' };
}

/**
 * Operasional Insert Log Functions
 */
function insertFuelLog(ss, log) {
  var sheet = ss.getSheetByName(SHEET_NAMES.FUEL);
  var row = [
    log.id || ('FL-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMddHHmmss')),
    log.date,
    log.nopol,
    log.driverName,
    log.fuelType,
    log.volumeLiters,
    log.pricePerLiter,
    log.totalCost,
    log.odometer,
    log.distanceTravelled,
    log.calculatedKmPerLiter,
    log.fuelStation,
    log.isFullTank ? 'YA' : 'TIDAK',
    log.receiptNumber || '',
    log.notes || ''
  ];
  sheet.appendRow(row);
  return { status: 'success', id: row[0] };
}

function insertFinance(ss, fin) {
  var sheet = ss.getSheetByName(SHEET_NAMES.FINANCE);
  var row = [
    fin.id || ('FIN-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMddHHmmss')),
    fin.date,
    fin.nopol,
    fin.driverName,
    fin.category,
    fin.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    fin.amount,
    fin.tripCode || '',
    fin.description,
    fin.paymentMethod,
    fin.status,
    fin.receiptNumber || ''
  ];
  sheet.appendRow(row);
  return { status: 'success', id: row[0] };
}

function insertTimesheet(ss, ts) {
  var sheet = ss.getSheetByName(SHEET_NAMES.TIMESHEET);
  var row = [
    ts.id || ('TS-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMddHHmmss')),
    ts.date,
    ts.nopol,
    ts.driverName,
    ts.helperName || '',
    ts.originLocation,
    ts.destinationLocation,
    ts.startTime,
    ts.endTime,
    ts.totalHours,
    ts.overtimeHours,
    ts.cargoDescription,
    ts.cargoTonnageTon,
    ts.tripCount,
    ts.startKm,
    ts.endKm,
    ts.totalDistanceKm,
    ts.status,
    ts.notes || ''
  ];
  sheet.appendRow(row);
  return { status: 'success', id: row[0] };
}

function insertMaintenance(ss, mnt) {
  var sheet = ss.getSheetByName(SHEET_NAMES.MAINTENANCE);
  var sparepartsSummary = (mnt.spareparts || []).map(function(s) {
    return s.name + ' (' + s.qty + ' ' + s.unit + ' @ Rp' + s.unitPrice + ')';
  }).join('; ');

  var row = [
    mnt.id || ('MNT-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMddHHmmss')),
    mnt.serviceDate,
    mnt.nopol,
    mnt.odometerAtService,
    mnt.nextServiceOdometer,
    mnt.nextServiceDate,
    mnt.serviceType,
    mnt.workshopName,
    mnt.workOrderNumber,
    mnt.laborCost,
    sparepartsSummary,
    mnt.totalCost,
    mnt.status,
    mnt.notes || ''
  ];
  sheet.appendRow(row);
  return { status: 'success', id: row[0] };
}

function insertVehicle(ss, v) {
  var sheet = ss.getSheetByName(SHEET_NAMES.VEHICLES);
  var row = [
    v.id || ('V-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMddHHmmss')),
    v.nopol,
    v.brand + ' ' + v.model,
    v.type,
    v.year,
    v.fuelType,
    v.chassisNumber || '',
    v.engineNumber || '',
    v.currentOdometer,
    v.status,
    v.assignedDriver,
    v.driverPhone || '',
    v.stnk1YearDate,
    v.stnk5YearDate,
    v.kirDate,
    v.targetKmPerLiter,
    v.capacityTon || 0,
    v.notes || ''
  ];
  sheet.appendRow(row);
  return { status: 'success', id: row[0] };
}

function fetchAllAppData() {
  return {
    status: 'success',
    notifications: getNotificationAlerts(),
    accounts: getFinancialAccounts(),
    timestamp: new Date().toISOString()
  };
}

function getDashboardSummary() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var vSheet = ss.getSheetByName(SHEET_NAMES.VEHICLES);
  var fSheet = ss.getSheetByName(SHEET_NAMES.FUEL);
  var finSheet = ss.getSheetByName(SHEET_NAMES.FINANCE);
  var accSheet = ss.getSheetByName(SHEET_NAMES.ACCOUNTS);

  return {
    totalVehicles: vSheet ? Math.max(0, vSheet.getLastRow() - 1) : 0,
    totalFuelLogs: fSheet ? Math.max(0, fSheet.getLastRow() - 1) : 0,
    totalFinRecords: finSheet ? Math.max(0, finSheet.getLastRow() - 1) : 0,
    totalAccounts: accSheet ? Math.max(0, accSheet.getLastRow() - 1) : 0,
    alerts: getNotificationAlerts(),
    status: 'online'
  };
}
