/**
 * ============================================================================
 * 44S OPS_PRO - SETUP GOOGLE APPS SCRIPT
 * ============================================================================
 * Menyiapkan Database Multi-Sheet Otomatis (Armada, Pajak, Solar/BBM, 
 * Keuangan, Akun Rekening, Timesheet, Servis, Driver, Audit Log)
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
