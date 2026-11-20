import jsPDF from 'jspdf';
import {
  OperationalFinance,
  DriverPocketCashFlow,
  EquipmentCashFlow,
  DepositTopUpRecord
} from '../types';
import { formatRupiah, formatDateIndo } from './formatters';

export type PrinterTypeId =
  | 'laser_a5'
  | 'laser_a4'
  | 'dot_matrix'
  | 'thermal_80'
  | 'thermal_58';

export interface PrinterTypeConfig {
  id: PrinterTypeId;
  label: string;
  shortLabel: string;
  deviceModel: string;
  paperSizeLabel: string;
  pageCssSize: string;
  previewMaxWidthClass: string;
  defaultOrientation: 'portrait' | 'landscape';
  isThermal?: boolean;
  isDotMatrix?: boolean;
}

export const PRINTER_TYPE_OPTIONS: PrinterTypeConfig[] = [
  {
    id: 'laser_a5',
    label: 'Printer Inkjet / Laser — Kwitansi A5',
    shortLabel: 'Inkjet / Laser (Kwitansi A5)',
    deviceModel: 'HP LaserJet / Epson EcoTank (A5)',
    paperSizeLabel: 'A5 (210 × 148 mm)',
    pageCssSize: 'A5',
    previewMaxWidthClass: 'max-w-[560px]',
    defaultOrientation: 'landscape'
  },
  {
    id: 'laser_a4',
    label: 'Printer Inkjet / Laser — Kertas A4',
    shortLabel: 'Inkjet / Laser (Dokumen A4)',
    deviceModel: 'Canon PIXMA / HP OfficeJet (A4)',
    paperSizeLabel: 'A4 (210 × 297 mm)',
    pageCssSize: 'A4',
    previewMaxWidthClass: 'max-w-[640px]',
    defaultOrientation: 'portrait'
  },
  {
    id: 'dot_matrix',
    label: 'Printer Dot Matrix — Continuous Form NCR',
    shortLabel: 'Dot Matrix (Epson LX-310 / LQ-2190)',
    deviceModel: 'Epson LX-310 / LQ-2190 (Kertas Rangkap NCR)',
    paperSizeLabel: 'Continuous Form 9.5" × 5.5" (Setengah Kuarto)',
    pageCssSize: '241mm 140mm',
    previewMaxWidthClass: 'max-w-[620px]',
    defaultOrientation: 'landscape',
    isDotMatrix: true
  },
  {
    id: 'thermal_80',
    label: 'Printer Thermal Kasir — Struk Roll 80mm',
    shortLabel: 'Thermal POS 80mm (Epson TM-T82)',
    deviceModel: 'Epson TM-T82 / Xprinter 80mm Auto-Cutter',
    paperSizeLabel: 'Thermal Roll 80mm (Lebar 72mm)',
    pageCssSize: '80mm auto',
    previewMaxWidthClass: 'max-w-[340px]',
    defaultOrientation: 'portrait',
    isThermal: true
  },
  {
    id: 'thermal_58',
    label: 'Printer Thermal Portable — Struk Roll 58mm',
    shortLabel: 'Thermal Mini 58mm (Bluetooth)',
    deviceModel: 'Bluetooth Thermal Printer 58mm Lapangan',
    paperSizeLabel: 'Thermal Roll 58mm (Lebar 48mm)',
    pageCssSize: '58mm auto',
    previewMaxWidthClass: 'max-w-[270px]',
    defaultOrientation: 'portrait',
    isThermal: true
  }
];

export interface PrintPreferences {
  printerType: PrinterTypeId;
  deviceName: string;
  orientation: 'portrait' | 'landscape';
  copies: 1 | 2 | 3;
  colorMode: 'color' | 'bw';
  zoom: number;
}

const PRINT_PREF_STORAGE_KEY = '44s_ops_print_preferences_v2';

export const DEFAULT_PRINT_PREFERENCES: PrintPreferences = {
  printerType: 'laser_a5',
  deviceName: 'HP LaserJet Pro M404 Keuangan (A4/A5)',
  orientation: 'portrait',
  copies: 1,
  colorMode: 'color',
  zoom: 100
};

export const AVAILABLE_PRINTER_DEVICES: Array<{
  name: string;
  recommendedType: PrinterTypeId;
  location: string;
}> = [
  {
    name: 'HP LaserJet Pro M404 Keuangan (A4/A5)',
    recommendedType: 'laser_a5',
    location: 'Ruang Kasir & Keuangan'
  },
  {
    name: 'Epson EcoTank L3210 Admin Operasional (A4)',
    recommendedType: 'laser_a4',
    location: 'Meja Admin Operasional'
  },
  {
    name: 'Epson LX-310 Kasir Pool (Dot Matrix NCR)',
    recommendedType: 'dot_matrix',
    location: 'Loket Surat Jalan & Kas Pool'
  },
  {
    name: 'Epson LQ-2190 Wide Continuous Form',
    recommendedType: 'dot_matrix',
    location: 'Divisi Logistik & Gudang'
  },
  {
    name: 'Epson TM-T82 Thermal Receipt 80mm',
    recommendedType: 'thermal_80',
    location: 'Kasir Uang Saku Supir'
  },
  {
    name: 'Bluetooth Thermal RPP02N 58mm (Mobile)',
    recommendedType: 'thermal_58',
    location: 'Perangkat Mobile Dispatcher'
  },
  {
    name: 'Simpan sebagai PDF (Print to PDF)',
    recommendedType: 'laser_a5',
    location: 'Dokumen Digital PDF'
  }
];

export function getStoredPrintPreferences(): PrintPreferences {
  try {
    const raw = localStorage.getItem(PRINT_PREF_STORAGE_KEY);
    if (!raw) return DEFAULT_PRINT_PREFERENCES;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_PRINT_PREFERENCES;
    const validType = PRINTER_TYPE_OPTIONS.some((p) => p.id === parsed.printerType)
      ? (parsed.printerType as PrinterTypeId)
      : 'laser_a5';
    const validCopies: 1 | 2 | 3 =
      parsed.copies === 2 || parsed.copies === 3 ? parsed.copies : 1;
    const validColor: 'color' | 'bw' = parsed.colorMode === 'bw' ? 'bw' : 'color';
    const validOrientation: 'portrait' | 'landscape' =
      parsed.orientation === 'landscape' ? 'landscape' : 'portrait';
    const validZoom =
      typeof parsed.zoom === 'number' && parsed.zoom >= 75 && parsed.zoom <= 130
        ? parsed.zoom
        : 100;
    return {
      printerType: validType,
      deviceName:
        typeof parsed.deviceName === 'string' && parsed.deviceName.trim()
          ? parsed.deviceName
          : DEFAULT_PRINT_PREFERENCES.deviceName,
      orientation: validOrientation,
      copies: validCopies,
      colorMode: validColor,
      zoom: validZoom
    };
  } catch {
    return DEFAULT_PRINT_PREFERENCES;
  }
}

export function saveStoredPrintPreferences(prefs: PrintPreferences): void {
  try {
    localStorage.setItem(PRINT_PREF_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage quota errors
  }
}

export const COPY_LABELS: string[] = [
  'LEMBAR 1 (ASLI): ARSIP KASIR / KEUANGAN',
  'LEMBAR 2 (SALINAN): PEGANGAN SUPIR / PENERIMA',
  'LEMBAR 3 (TRIPLIKAT): ARSIP AUDIT & REKONSILIASI'
];

const LEGACY_DUMMY_DRIVER_NAMES = [
  'bambang sudiro',
  'hendro wibowo',
  'agus salim',
  'slamet riyadi',
  'dedi kurniawan',
  'supriyanto'
];

const LEGACY_DUMMY_DRIVER_NIPS = [
  'drv-emp-2020-001',
  'drv-emp-2019-002',
  'drv-emp-2021-003',
  'drv-emp-2022-004',
  'drv-emp-2023-005',
  'drv-emp-2021-006'
];

const LEGACY_DUMMY_STAFF_NAMES = [
  'siti nurhaliza',
  'rina anggraini',
  'hendra kusuma',
  'budi santoso'
];

export function getRoleLevelLabel(role?: string): string {
  const normalized = (role || '').toLowerCase().trim();
  if (normalized === 'admin1') return 'Admin 1 - Operasional & Keuangan';
  if (normalized === 'admin2') return 'Admin 2 - Armada & Lapangan';
  if (normalized === 'owner') return 'Owner / Direktur Utama';
  return 'Admin Kasir Pool';
}

export function getDefaultNameForRole(role?: string): string {
  const normalized = (role || '').toLowerCase().trim();
  if (normalized === 'admin1') return 'Kharisma Sinta';
  if (normalized === 'admin2') return 'Ika Diah Yustiana';
  return 'Joko Adi Setiawan';
}

export interface AdminCashierOption {
  value: string;
  label: string;
  name: string;
  role: string;
  roleLabel: string;
}

/**
 * Mengambil daftar pilihan Kasir Pool berdasarkan Nama dari Level Role Admin di Manajemen Pengguna.
 */
export function getAdminCashierSelectOptions(activeRole?: string): AdminCashierOption[] {
  let storedUsers: Array<{ id?: string; name?: string; role?: string; status?: string }> = [];
  let sessionUser: { userId?: string; name?: string; role?: string } | null = null;

  try {
    const rawSession = sessionStorage.getItem('fleetops_auth_session_v1');
    if (rawSession) {
      sessionUser = JSON.parse(rawSession);
    }
  } catch {
    // ignore
  }

  try {
    const rawUsers = localStorage.getItem('fleetops_users_v1');
    if (rawUsers) {
      const parsed = JSON.parse(rawUsers);
      if (Array.isArray(parsed)) {
        storedUsers = parsed;
      }
    }
  } catch {
    // ignore
  }

  const effectiveRole = (sessionUser?.role || activeRole || 'owner').toLowerCase();
  const options: AdminCashierOption[] = [];
  const seenValues = new Set<string>();

  const pushOption = (name: string, role: string) => {
    const cleanName = (name || '').trim();
    if (!cleanName) return;
    const roleLabel = getRoleLevelLabel(role);
    const value = `${cleanName} (${roleLabel})`;
    if (seenValues.has(value)) return;
    seenValues.add(value);
    const roleCode =
      role === 'owner' ? 'OWNER' : role === 'admin1' ? 'ADMIN-1' : 'ADMIN-2';
    options.push({
      value,
      label: `[${roleCode}] ${cleanName} (${roleLabel})`,
      name: cleanName,
      role,
      roleLabel
    });
  };

  // 1. Prioritaskan akun sesuai sesi login / role aktif saat ini
  if (sessionUser?.name) {
    pushOption(sessionUser.name, sessionUser.role || effectiveRole);
  }
  const matchedRoleUser = storedUsers.find(
    (u) => (u.role || '').toLowerCase() === effectiveRole && u.status !== 'inactive'
  );
  if (matchedRoleUser?.name) {
    pushOption(matchedRoleUser.name, matchedRoleUser.role || effectiveRole);
  } else {
    pushOption(getDefaultNameForRole(effectiveRole), effectiveRole);
  }

  // 2. Tambahkan semua pengguna dari Manajemen Pengguna
  storedUsers.forEach((u) => {
    if (u && u.name && u.status !== 'inactive') {
      pushOption(u.name, (u.role || 'admin1').toLowerCase());
    }
  });

  // 3. Pastikan ke-3 level role standar selalu tersedia jika belum ada di daftar
  (['owner', 'admin1', 'admin2'] as const).forEach((r) => {
    const existingForRole = storedUsers.find((u) => (u.role || '').toLowerCase() === r);
    pushOption(existingForRole?.name || getDefaultNameForRole(r), r);
  });

  return options;
}

/**
 * Menentukan nama Kasir Pool / Petugas Penyerah berdasarkan Nama dari Level Role Admin aktif.
 * Menggantikan nama dummy lama (seperti Siti Nurhaliza / Rina Anggraini) dengan nama akun admin sesuai level role-nya.
 */
export function resolveAdminCashierByRole(
  rawDisbursedBy?: string,
  userRole?: string
): string {
  const options = getAdminCashierSelectOptions(userRole);
  const defaultByActiveRole = options[0]?.value || `${getDefaultNameForRole(userRole)} (${getRoleLevelLabel(userRole)})`;

  const raw = (rawDisbursedBy || '').trim();
  if (!raw || raw === '-') {
    return defaultByActiveRole;
  }

  const lower = raw.toLowerCase();
  const isLegacyDummy = LEGACY_DUMMY_STAFF_NAMES.some((dummy) => lower.includes(dummy));
  if (isLegacyDummy) {
    return defaultByActiveRole;
  }

  // Jika nilai raw hanya berisi nama user tanpa keterangan role, lengkapi dengan level role-nya
  const matchedOption = options.find(
    (opt) =>
      opt.value.toLowerCase() === lower ||
      opt.name.toLowerCase() === lower
  );
  if (matchedOption) {
    return matchedOption.value;
  }

  return raw;
}

export interface ResolvedDriverInfo {
  id: string;
  name: string;
  nip: string;
  phone: string;
  helperName: string;
  labelWithBracket: string;
  labelWithParen: string;
}

/**
 * Mengambil Nama Driver, NIP, & Kernet langsung dari Data Driver (atau Supir Tetap di Kendaraan),
 * serta membersihkan nama dummy lama seperti "Bambang Sudiro [DRV-EMP-2020-001]".
 */
export function resolveDriverFromData(params: {
  driverId?: string;
  driverName?: string;
  driverNip?: string;
  helperName?: string;
  nopol?: string;
  vehicleId?: string;
  drivers?: Array<{
    id?: string;
    nip?: string;
    name?: string;
    phone?: string;
    helperName?: string;
    assignedVehicle?: string;
  }>;
  vehicles?: Array<{
    id?: string;
    nopol?: string;
    assignedDriver?: string;
    driverPhone?: string;
  }>;
}): ResolvedDriverInfo {
  let driverList = Array.isArray(params.drivers) ? params.drivers : [];
  let vehicleList = Array.isArray(params.vehicles) ? params.vehicles : [];

  if (driverList.length === 0) {
    try {
      const raw = localStorage.getItem('fleetops_drivers_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) driverList = parsed;
      }
    } catch {
      // ignore
    }
  }

  if (vehicleList.length === 0) {
    try {
      const raw = localStorage.getItem('fleetops_vehicles_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) vehicleList = parsed;
      }
    } catch {
      // ignore
    }
  }

  // Filter hanya driver dari Data Driver yang valid (abaikan dummy jika ada data driver asli)
  const nonDummyDrivers = driverList.filter(
    (d) =>
      d &&
      d.name &&
      !LEGACY_DUMMY_DRIVER_NAMES.includes(d.name.trim().toLowerCase())
  );
  const effectiveDrivers = nonDummyDrivers.length > 0 ? nonDummyDrivers : driverList;

  const rawName = (params.driverName || '').trim();
  const rawNip = (params.driverNip || '').trim();
  const rawId = (params.driverId || '').trim();
  const rawNopol = (params.nopol || '').trim();
  const rawVehicleId = (params.vehicleId || '').trim();

  const isRawNameDummy =
    !rawName ||
    rawName === '-' ||
    rawName.toLowerCase() === 'supir armada' ||
    (LEGACY_DUMMY_DRIVER_NAMES.includes(rawName.toLowerCase()) &&
      !effectiveDrivers.some((d) => (d.name || '').trim().toLowerCase() === rawName.toLowerCase()));

  const isRawNipDummy =
    !rawNip ||
    rawNip === '-' ||
    (LEGACY_DUMMY_DRIVER_NIPS.includes(rawNip.toLowerCase()) &&
      !effectiveDrivers.some((d) => (d.nip || '').trim().toLowerCase() === rawNip.toLowerCase()));

  // 1. Cari kecocokan langsung di Data Driver (berdasarkan ID, Nama, atau Nopol)
  let matchedDriver =
    (!isRawNameDummy
      ? effectiveDrivers.find(
          (d) => (d.name || '').trim().toLowerCase() === rawName.toLowerCase()
        )
      : undefined) ||
    (rawId
      ? effectiveDrivers.find(
          (d) => (d.id || '').trim().toLowerCase() === rawId.toLowerCase()
        )
      : undefined) ||
    (rawNopol
      ? effectiveDrivers.find(
          (d) =>
            (d.assignedVehicle || '').trim().toLowerCase() === rawNopol.toLowerCase()
        )
      : undefined);

  // 2. Cari dari Kendaraan terkait jika belum ketemu
  const matchedVehicle =
    (rawVehicleId
      ? vehicleList.find((v) => (v.id || '').trim() === rawVehicleId)
      : undefined) ||
    (rawNopol
      ? vehicleList.find(
          (v) => (v.nopol || '').trim().toLowerCase() === rawNopol.toLowerCase()
        )
      : undefined) ||
    vehicleList[0];

  if (!matchedDriver && matchedVehicle?.assignedDriver) {
    const vehDriverName = matchedVehicle.assignedDriver.trim();
    if (
      vehDriverName &&
      vehDriverName !== '-' &&
      !LEGACY_DUMMY_DRIVER_NAMES.includes(vehDriverName.toLowerCase())
    ) {
      matchedDriver = effectiveDrivers.find(
        (d) => (d.name || '').trim().toLowerCase() === vehDriverName.toLowerCase()
      );
      if (!matchedDriver) {
        return {
          id: rawId || '',
          name: vehDriverName,
          nip: !isRawNipDummy ? rawNip : '',
          phone: matchedVehicle.driverPhone || '',
          helperName: params.helperName || '',
          labelWithBracket: !isRawNipDummy && rawNip ? `${vehDriverName} [${rawNip}]` : vehDriverName,
          labelWithParen: !isRawNipDummy && rawNip ? `${vehDriverName} (${rawNip})` : vehDriverName
        };
      }
    }
  }

  // 3. Fallback ke driver pertama di Data Driver
  if (!matchedDriver && effectiveDrivers.length > 0) {
    matchedDriver = effectiveDrivers[0];
  }

  const finalName =
    matchedDriver?.name?.trim() ||
    (!isRawNameDummy ? rawName : '') ||
    (matchedVehicle?.assignedDriver &&
    matchedVehicle.assignedDriver !== '-' &&
    !LEGACY_DUMMY_DRIVER_NAMES.includes(matchedVehicle.assignedDriver.trim().toLowerCase())
      ? matchedVehicle.assignedDriver.trim()
      : 'Data Driver Belum Dipilih');

  const finalNip =
    (matchedDriver?.nip || '').trim() ||
    (!isRawNipDummy ? rawNip : '');

  const finalId = matchedDriver?.id || rawId || '';
  const finalPhone = matchedDriver?.phone || matchedVehicle?.driverPhone || '';
  const finalHelper =
    params.helperName && params.helperName.toLowerCase() !== 'karno wibowo'
      ? params.helperName
      : matchedDriver?.helperName || '';

  return {
    id: finalId,
    name: finalName,
    nip: finalNip,
    phone: finalPhone,
    helperName: finalHelper,
    labelWithBracket: finalNip ? `${finalName} [${finalNip}]` : finalName,
    labelWithParen: finalNip ? `${finalName} (${finalNip})` : finalName
  };
}

const SATUAN = [
  '',
  'Satu',
  'Dua',
  'Tiga',
  'Empat',
  'Lima',
  'Enam',
  'Tujuh',
  'Delapan',
  'Sembilan',
  'Sepuluh',
  'Sebelas'
];

function terbilangCore(n: number): string {
  const num = Math.floor(Math.abs(n));
  if (num === 0) return '';
  if (num < 12) return SATUAN[num];
  if (num < 20) return `${terbilangCore(num - 10)} Belas`;
  if (num < 100) {
    const puluhan = Math.floor(num / 10);
    const sisa = num % 10;
    return `${SATUAN[puluhan]} Puluh${sisa ? ` ${terbilangCore(sisa)}` : ''}`;
  }
  if (num < 200) {
    const sisa = num - 100;
    return `Seratus${sisa ? ` ${terbilangCore(sisa)}` : ''}`;
  }
  if (num < 1000) {
    const ratusan = Math.floor(num / 100);
    const sisa = num % 100;
    return `${SATUAN[ratusan]} Ratus${sisa ? ` ${terbilangCore(sisa)}` : ''}`;
  }
  if (num < 2000) {
    const sisa = num - 1000;
    return `Seribu${sisa ? ` ${terbilangCore(sisa)}` : ''}`;
  }
  if (num < 1_000_000) {
    const ribuan = Math.floor(num / 1000);
    const sisa = num % 1000;
    return `${terbilangCore(ribuan)} Ribu${sisa ? ` ${terbilangCore(sisa)}` : ''}`;
  }
  if (num < 1_000_000_000) {
    const jutaan = Math.floor(num / 1_000_000);
    const sisa = num % 1_000_000;
    return `${terbilangCore(jutaan)} Juta${sisa ? ` ${terbilangCore(sisa)}` : ''}`;
  }
  if (num < 1_000_000_000_000) {
    const miliaran = Math.floor(num / 1_000_000_000);
    const sisa = num % 1_000_000_000;
    return `${terbilangCore(miliaran)} Miliar${sisa ? ` ${terbilangCore(sisa)}` : ''}`;
  }
  const triliunan = Math.floor(num / 1_000_000_000_000);
  const sisa = num % 1_000_000_000_000;
  return `${terbilangCore(triliunan)} Triliun${sisa ? ` ${terbilangCore(sisa)}` : ''}`;
}

export function terbilangRupiah(amount: number): string {
  const rounded = Math.round(Number(amount) || 0);
  if (rounded === 0) return 'Nol Rupiah';
  const prefix = rounded < 0 ? 'Minus ' : '';
  return `${prefix}${terbilangCore(rounded).replace(/\s+/g, ' ').trim()} Rupiah`;
}

export const PRINT_PREVIEW_EVENT = '44s:open-print-preview-dialog';

export interface OpenPrintPreviewDetail {
  elementId: string;
  documentTitle: string;
}

/**
 * Membuka jendela Print Preview baru di URL `about:blank` dengan pilihan langsung
 * Jenis Kertas: Kertas Biasa (A4 / Kwitansi A5 / NCR) dan Kertas Thermal (80mm / 58mm),
 * serta langsung memicu dialog Print Preview bawaan browser di atas halaman `about:blank`.
 */
export function openAboutBlankPrintPreview(
  elementId: string,
  documentTitle = 'Cetak Dokumen',
  prefsOverride?: Partial<PrintPreferences>
): boolean {
  const target = document.getElementById(elementId);
  if (!target) return false;

  const basePrefs = getStoredPrintPreferences();
  const prefs: PrintPreferences = {
    ...basePrefs,
    ...(prefsOverride || {})
  };

  let popupWin: Window | null = null;
  try {
    popupWin = window.open('about:blank', '_blank');
  } catch {
    popupWin = null;
  }

  if (!popupWin || !popupWin.document) {
    return false;
  }

  const headStyles = Array.from(
    document.querySelectorAll('link[rel="stylesheet"], style')
  )
    .map((node) => node.outerHTML)
    .join('\n');

  const escapedTitle = (documentTitle || 'Print Preview - 44S Ops_pro')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const initialPaperMode =
    prefs.printerType === 'thermal_80'
      ? 'thermal_80'
      : prefs.printerType === 'thermal_58'
      ? 'thermal_58'
      : prefs.printerType === 'laser_a4'
      ? 'laser_a4'
      : prefs.printerType === 'dot_matrix'
      ? 'dot_matrix'
      : 'laser_a5';

  const initialOrientation = prefs.orientation || 'portrait';
  const copiesCount = prefs.copies || 1;

  const copiesHtml = Array.from({ length: copiesCount })
    .map((_, idx) => {
      const copyHeader =
        copiesCount > 1
          ? `<div class="copy-banner">
              <span>${COPY_LABELS[idx] || `LEMBAR ${idx + 1}`}</span>
              <span>Halaman ${idx + 1} dari ${copiesCount}</span>
            </div>`
          : '';
      const pageBreakClass = idx < copiesCount - 1 ? 'page-break-after' : '';
      return `<div class="print-sheet-card ${pageBreakClass}">
        ${copyHeader}
        ${target.outerHTML}
      </div>`;
    })
    .join('\n');

  const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapedTitle}</title>
  ${headStyles}
  <style id="dynamic-page-style">
    @page {
      size: ${
        initialPaperMode === 'thermal_80'
          ? '80mm auto'
          : initialPaperMode === 'thermal_58'
          ? '58mm auto'
          : initialPaperMode === 'laser_a4'
          ? `A4 ${initialOrientation}`
          : initialPaperMode === 'dot_matrix'
          ? '241mm 140mm'
          : `A5 ${initialOrientation}`
      };
      margin: ${
        initialPaperMode === 'thermal_80' || initialPaperMode === 'thermal_58'
          ? '3mm'
          : '8mm'
      };
    }
  </style>
  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #e2e8f0;
      color: #0f172a;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .about-blank-toolbar {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #0f172a;
      color: #f8fafc;
      padding: 10px 18px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 1px solid #334155;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
    }
    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .toolbar-badge {
      background: #1e293b;
      border: 1px solid #475569;
      color: #93c5fd;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .toolbar-title {
      font-size: 13px;
      font-weight: 700;
      color: #ffffff;
    }
    .toolbar-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .paper-group {
      display: inline-flex;
      background: #1e293b;
      padding: 3px;
      border-radius: 8px;
      border: 1px solid #334155;
      gap: 4px;
    }
    .paper-btn {
      border: none;
      background: transparent;
      color: #cbd5e1;
      font-size: 11px;
      font-weight: 700;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .paper-btn:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.08);
    }
    .paper-btn.active {
      background: #2563eb;
      color: #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }
    .paper-select {
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #475569;
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-print-now {
      background: #16a34a;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 7px 14px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 6px rgba(22, 163, 74, 0.35);
    }
    .btn-print-now:hover {
      background: #15803d;
    }
    .btn-close-win {
      background: #334155;
      color: #e2e8f0;
      border: 1px solid #475569;
      border-radius: 8px;
      padding: 7px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-close-win:hover {
      background: #475569;
    }
    .preview-stage-container {
      padding: 24px 16px 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }
    .print-sheet-card {
      background: #ffffff;
      color: #000000;
      width: 100%;
      margin: 0 auto;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.14);
      border: 1px solid #cbd5e1;
      transition: max-width 0.15s ease;
    }
    body[data-paper="laser_a4"] .print-sheet-card {
      max-width: 210mm;
      padding: 6mm;
    }
    body[data-paper="laser_a5"] .print-sheet-card {
      max-width: 175mm;
      padding: 4mm;
    }
    body[data-paper="dot_matrix"] .print-sheet-card {
      max-width: 215mm;
      padding: 5mm;
      font-family: "Courier New", Courier, monospace !important;
    }
    body[data-paper="thermal_80"] .print-sheet-card {
      max-width: 78mm;
      padding: 2mm;
      font-family: "Courier New", Courier, monospace !important;
      font-size: 11px !important;
      line-height: 1.35 !important;
      border-top: 2px dashed #64748b;
      border-bottom: 3px dashed #64748b;
    }
    body[data-paper="thermal_58"] .print-sheet-card {
      max-width: 56mm;
      padding: 1.5mm;
      font-family: "Courier New", Courier, monospace !important;
      font-size: 10px !important;
      line-height: 1.3 !important;
      border-top: 2px dashed #64748b;
      border-bottom: 3px dashed #64748b;
    }
    body[data-paper="thermal_80"] .print-sheet-card *,
    body[data-paper="thermal_58"] .print-sheet-card * {
      font-family: "Courier New", Courier, monospace !important;
    }
    body[data-paper="thermal_80"] .print-sheet-card .grid-cols-2,
    body[data-paper="thermal_58"] .print-sheet-card .grid-cols-2 {
      grid-template-columns: 1fr !important;
      gap: 4px !important;
    }
    .copy-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: monospace;
      font-size: 10px;
      font-weight: bold;
      border-bottom: 1px dashed #334155;
      padding: 4px 8px;
      margin-bottom: 6px;
      color: #334155;
      background: #f8fafc;
    }
    .page-break-after {
      page-break-after: always;
      break-after: page;
    }
    .print-hide, .print\\:hidden {
      display: none !important;
    }
    @media print {
      html, body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .about-blank-toolbar {
        display: none !important;
      }
      .preview-stage-container {
        padding: 0 !important;
        display: block !important;
      }
      .print-sheet-card {
        box-shadow: none !important;
        border: none !important;
        margin: 0 auto !important;
        padding: 0 !important;
        width: 100% !important;
      }
      body[data-paper="thermal_80"] .print-sheet-card {
        max-width: 74mm !important;
      }
      body[data-paper="thermal_58"] .print-sheet-card {
        max-width: 52mm !important;
      }
      body[data-paper="laser_a5"] .print-sheet-card,
      body[data-paper="laser_a4"] .print-sheet-card,
      body[data-paper="dot_matrix"] .print-sheet-card {
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body data-paper="${initialPaperMode}" data-orientation="${initialOrientation}">
  <div class="about-blank-toolbar">
    <div class="toolbar-left">
      <span class="toolbar-badge">about:blank • Print Preview</span>
      <span class="toolbar-title">${escapedTitle}</span>
    </div>
    <div class="toolbar-controls">
      <div class="paper-group" role="group" aria-label="Pilih Jenis Kertas">
        <button type="button" id="btn-biasa" class="paper-btn ${
          initialPaperMode !== 'thermal_80' && initialPaperMode !== 'thermal_58'
            ? 'active'
            : ''
        }" onclick="setPaperCategory('biasa')">
          📄 Kertas Biasa (A4 / A5)
        </button>
        <button type="button" id="btn-thermal" class="paper-btn ${
          initialPaperMode === 'thermal_80' || initialPaperMode === 'thermal_58'
            ? 'active'
            : ''
        }" onclick="setPaperCategory('thermal')">
          🧾 Kertas Thermal (80mm / 58mm)
        </button>
      </div>

      <select id="paper-size-select" class="paper-select" onchange="setSpecificPaper(this.value)">
        <option value="laser_a4" ${initialPaperMode === 'laser_a4' ? 'selected' : ''}>Kertas Biasa — A4 (210 × 297 mm)</option>
        <option value="laser_a5" ${initialPaperMode === 'laser_a5' ? 'selected' : ''}>Kertas Biasa — Kwitansi A5 (210 × 148 mm)</option>
        <option value="dot_matrix" ${initialPaperMode === 'dot_matrix' ? 'selected' : ''}>Kertas Biasa — Continuous Form NCR</option>
        <option value="thermal_80" ${initialPaperMode === 'thermal_80' ? 'selected' : ''}>Kertas Thermal — Struk Kasir 80mm</option>
        <option value="thermal_58" ${initialPaperMode === 'thermal_58' ? 'selected' : ''}>Kertas Thermal — Struk Portable 58mm</option>
      </select>

      <select id="orientation-select" class="paper-select" onchange="setOrientation(this.value)">
        <option value="portrait" ${initialOrientation === 'portrait' ? 'selected' : ''}>Portrait (Tegak)</option>
        <option value="landscape" ${initialOrientation === 'landscape' ? 'selected' : ''}>Landscape (Mendatar)</option>
      </select>

      <button type="button" class="btn-print-now" onclick="triggerNativePrint()">
        🖨️ Cetak / Print Preview
      </button>
      <button type="button" class="btn-close-win" onclick="window.close()">
        Tutup
      </button>
    </div>
  </div>

  <div class="preview-stage-container">
    ${copiesHtml}
  </div>

  <script>
    function updatePageRule() {
      var paper = document.body.getAttribute('data-paper') || 'laser_a5';
      var orient = document.body.getAttribute('data-orientation') || 'portrait';
      var styleEl = document.getElementById('dynamic-page-style');
      var orientSelect = document.getElementById('orientation-select');
      var isThermal = paper === 'thermal_80' || paper === 'thermal_58';
      if (orientSelect) {
        orientSelect.style.display = isThermal ? 'none' : 'inline-block';
      }
      var sizeCss = 'A5 ' + orient;
      var marginCss = '8mm';
      if (paper === 'thermal_80') {
        sizeCss = '80mm auto';
        marginCss = '3mm';
      } else if (paper === 'thermal_58') {
        sizeCss = '58mm auto';
        marginCss = '3mm';
      } else if (paper === 'laser_a4') {
        sizeCss = 'A4 ' + orient;
        marginCss = '10mm';
      } else if (paper === 'dot_matrix') {
        sizeCss = '241mm 140mm';
        marginCss = '6mm 10mm';
      }
      if (styleEl) {
        styleEl.innerHTML = '@page { size: ' + sizeCss + '; margin: ' + marginCss + '; }';
      }
      var btnBiasa = document.getElementById('btn-biasa');
      var btnThermal = document.getElementById('btn-thermal');
      if (btnBiasa && btnThermal) {
        if (isThermal) {
          btnThermal.classList.add('active');
          btnBiasa.classList.remove('active');
        } else {
          btnBiasa.classList.add('active');
          btnThermal.classList.remove('active');
        }
      }
    }

    function setPaperCategory(cat) {
      var selectEl = document.getElementById('paper-size-select');
      if (cat === 'thermal') {
        document.body.setAttribute('data-paper', 'thermal_80');
        if (selectEl) selectEl.value = 'thermal_80';
      } else {
        document.body.setAttribute('data-paper', 'laser_a4');
        if (selectEl) selectEl.value = 'laser_a4';
      }
      updatePageRule();
    }

    function setSpecificPaper(val) {
      document.body.setAttribute('data-paper', val);
      updatePageRule();
    }

    function setOrientation(val) {
      document.body.setAttribute('data-orientation', val);
      updatePageRule();
    }

    function triggerNativePrint() {
      window.focus();
      window.print();
    }

    window.addEventListener('load', function() {
      updatePageRule();
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch (e) {}
      }, 280);
    });
  </script>
</body>
</html>`;

  popupWin.document.open();
  popupWin.document.write(htmlContent);
  popupWin.document.close();
  return true;
}

/**
 * Ketika tombol "Cetak Printer" diklik, fungsi ini langsung mengaktifkan Print Preview
 * melalui halaman `about:blank` (dengan pilihan kertas Thermal & Biasa).
 * Bila popup diblokir browser, otomatis menampilkan dialog Print Preview internal.
 */
export function printElementById(
  elementId: string,
  documentTitle = 'Cetak Dokumen'
): void {
  const openedInAboutBlank = openAboutBlankPrintPreview(elementId, documentTitle);
  if (!openedInAboutBlank) {
    window.dispatchEvent(
      new CustomEvent<OpenPrintPreviewDetail>(PRINT_PREVIEW_EVENT, {
        detail: { elementId, documentTitle }
      })
    );
  }
}

/**
 * Menjalankan perintah cetak sesungguhnya ke printer sistem / browser melalui `about:blank`
 * (atau fallback iframe terisolasi jika popup diblokir).
 */
export function executeHardwarePrint(
  elementId: string,
  documentTitle = 'Cetak Dokumen',
  prefs: PrintPreferences
): void {
  saveStoredPrintPreferences(prefs);

  // Prioritaskan membuka about:blank dengan konfigurasi kertas yang dipilih
  if (openAboutBlankPrintPreview(elementId, documentTitle, prefs)) {
    return;
  }

  const target = document.getElementById(elementId);
  const printerConfig =
    PRINTER_TYPE_OPTIONS.find((p) => p.id === prefs.printerType) ||
    PRINTER_TYPE_OPTIONS[0];

  const isThermal = Boolean(printerConfig.isThermal);
  const isThermal58 = printerConfig.id === 'thermal_58';
  const isDotMatrix = Boolean(printerConfig.isDotMatrix);
  const isBW = prefs.colorMode === 'bw' || isDotMatrix || isThermal;

  const pageSizeCss = isThermal
    ? printerConfig.pageCssSize
    : isDotMatrix
    ? printerConfig.pageCssSize
    : `${printerConfig.pageCssSize} ${prefs.orientation}`;

  const wrapperMaxWidth = isThermal58
    ? '52mm'
    : isThermal
    ? '74mm'
    : printerConfig.id === 'laser_a5'
    ? '195mm'
    : '200mm';

  const pageMargin = isThermal ? '3mm' : isDotMatrix ? '6mm 10mm' : '10mm';

  const styleId = 'active-hardware-print-style';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.innerHTML = `
    @media print {
      @page {
        size: ${pageSizeCss};
        margin: ${pageMargin};
      }
      html, body {
        background: #ffffff !important;
        color: #000000 !important;
        ${isBW ? 'filter: grayscale(100%) contrast(115%) !important;' : ''}
      }
    }
  `;

  if (target) {
    try {
      const headStyles = Array.from(
        document.querySelectorAll('link[rel="stylesheet"], style')
      )
        .map((node) => node.outerHTML)
        .join('\n');

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.border = '0';
      iframe.style.opacity = '0.01';
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      const win = iframe.contentWindow;
      if (doc && win) {
        const escapedTitle = documentTitle
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const copiesHtml = Array.from({ length: prefs.copies })
          .map((_, idx) => {
            const copyHeader =
              prefs.copies > 1
                ? `<div class="copy-banner">
                    <span>${COPY_LABELS[idx] || `LEMBAR ${idx + 1}`}</span>
                    <span>${printerConfig.shortLabel} • ${prefs.deviceName}</span>
                  </div>`
                : '';
            const pageBreakClass =
              idx < prefs.copies - 1 ? 'page-break-after' : '';
            return `<div class="print-isolated-wrapper ${pageBreakClass}">
              ${copyHeader}
              ${target.outerHTML}
            </div>`;
          })
          .join('\n');

        doc.open();
        doc.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>${escapedTitle}</title>
  ${headStyles}
  <style>
    @page {
      size: ${pageSizeCss};
      margin: ${pageMargin};
    }
    html, body {
      background: #ffffff !important;
      color: #000000 !important;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      ${isBW ? 'filter: grayscale(100%) contrast(115%);' : ''}
    }
    .print-isolated-wrapper {
      width: 100%;
      max-width: ${wrapperMaxWidth};
      margin: 0 auto;
      ${isThermal ? 'font-size: 10px !important; line-height: 1.3 !important;' : ''}
      ${isDotMatrix ? 'font-family: "Courier New", Courier, monospace !important; letter-spacing: 0.2px;' : ''}
    }
    .copy-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: monospace;
      font-size: 9px;
      font-weight: bold;
      border-bottom: 1px dashed #334155;
      padding-bottom: 4px;
      margin-bottom: 6px;
      color: #334155;
    }
    .page-break-after {
      page-break-after: always;
      break-after: page;
      margin-bottom: 12mm;
    }
    .print-hide, .print\\:hidden {
      display: none !important;
    }
  </style>
</head>
<body>
  ${copiesHtml}
</body>
</html>`);
        doc.close();
        win.focus();
        win.print();
        setTimeout(() => {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 3000);
        return;
      }
    } catch {
      // Fallback ke window.print()
    }
  }

  try {
    window.print();
  } catch {
    // Abaikan jika diblokir oleh sandbox iframe
  }
}

/**
 * Menghasilkan PDF hasil cetakan sesuai format kertas & jenis printer yang dipilih
 * (mendukung Kertas Thermal 80mm / 58mm maupun Kertas Biasa A4 / A5).
 */
export function exportElementTextToFormattedPDF(
  elementId: string,
  documentTitle: string,
  prefs: PrintPreferences
): void {
  const target = document.getElementById(elementId);
  if (!target) return;

  const isThermal58 = prefs.printerType === 'thermal_58';
  const isThermal80 = prefs.printerType === 'thermal_80';
  const isThermal = isThermal58 || isThermal80;
  const isA4 = prefs.printerType === 'laser_a4';

  const format: string | [number, number] = isThermal58
    ? [58, 210]
    : isThermal80
    ? [80, 220]
    : isA4
    ? 'a4'
    : 'a5';

  const orientation = isThermal ? 'portrait' : prefs.orientation;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = isThermal ? 4 : 12;

  for (let copyIdx = 0; copyIdx < prefs.copies; copyIdx++) {
    if (copyIdx > 0) {
      doc.addPage();
    }

    let y = margin + 4;

    if (prefs.copies > 1) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(isThermal ? 6.5 : 8);
      doc.setTextColor(71, 85, 105);
      doc.text(COPY_LABELS[copyIdx] || `LEMBAR ${copyIdx + 1}`, margin, y);
      y += isThermal ? 4 : 6;
    }

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += isThermal ? 4 : 6;

    const rawLines = (target.innerText || '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    doc.setFont('courier', 'normal');
    const fontSize = isThermal58 ? 7 : isThermal80 ? 8 : 9.5;
    const lineHeight = isThermal58 ? 3.6 : isThermal80 ? 4.2 : 5.2;

    rawLines.forEach((line, idx) => {
      const isHeader = idx === 0 || line.startsWith('TOTAL') || line.startsWith('NO.');
      doc.setFont('courier', isHeader ? 'bold' : 'normal');
      doc.setFontSize(isHeader ? fontSize + 0.8 : fontSize);
      doc.setTextColor(15, 23, 42);

      const wrapped = doc.splitTextToSize(line, pageWidth - margin * 2);
      doc.text(wrapped, margin, y);
      y += wrapped.length * lineHeight;

      if (line.startsWith('NO.') || line.startsWith('Terbilang:')) {
        y += 1.5;
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.2);
        doc.line(margin, y, pageWidth - margin, y);
        y += 3.5;
      }
    });
  }

  const safeFile = documentTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${safeFile}_${prefs.printerType}.pdf`);
}

// Helper umum menggambar header kop kwitansi jsPDF
function drawVoucherHeader(
  doc: jsPDF,
  companyTitle: string,
  slipTitle: string,
  voucherNo: string,
  accentRgb: [number, number, number]
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(companyTitle.toUpperCase(), 14, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('44S Ops_pro • Sistem Operasional Armada & Kontrol Keuangan Resmi', 14, 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(slipTitle, pageWidth - 14, 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`NO: ${voucherNo}`, pageWidth - 14, 17, { align: 'right' });
}

function drawSignatures(
  doc: jsPDF,
  y: number,
  leftTitle: string,
  leftName: string,
  rightTitle: string,
  rightName: string
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const leftX = 48;
  const rightX = pageWidth - 48;

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(leftTitle, leftX, y, { align: 'center' });
  doc.text(rightTitle, rightX, y, { align: 'center' });

  doc.setDrawColor(148, 163, 184);
  doc.line(leftX - 28, y + 18, leftX + 28, y + 18);
  doc.line(rightX - 28, y + 18, rightX + 28, y + 18);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(leftName || '(.....................)', leftX, y + 23, { align: 'center' });
  doc.text(rightName || '(.....................)', rightX, y + 23, { align: 'center' });
}

function drawKeyValueRow(
  doc: jsPDF,
  y: number,
  label: string,
  value: string,
  boldValue = false
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text(label, 14, y);
  doc.text(':', 56, y);

  doc.setFont('helvetica', boldValue ? 'bold' : 'normal');
  doc.setTextColor(15, 23, 42);
  const wrapped = doc.splitTextToSize(value || '-', pageWidth - 74);
  doc.text(wrapped, 60, y);
  return y + Math.max(1, wrapped.length) * 5.2 + 1.2;
}

export function downloadFinanceSlipPDF(fin: OperationalFinance): void {
  const prefs = getStoredPrintPreferences();
  if (prefs.printerType === 'thermal_80' || prefs.printerType === 'thermal_58') {
    const el = document.getElementById('printable-finance-slip');
    if (el) {
      exportElementTextToFormattedPDF(
        'printable-finance-slip',
        `Kwitansi_${fin.receiptNumber || fin.tripCode || fin.id}`,
        prefs
      );
      return;
    }
  }

  const resolvedDriver = resolveDriverFromData({
    driverId: fin.driverId,
    driverName: fin.driverName,
    driverNip: fin.driverNip,
    nopol: fin.nopol,
    vehicleId: fin.vehicleId
  });
  const resolvedCashier = resolveAdminCashierByRole(fin.handoverBy);

  const isA4 = prefs.printerType === 'laser_a4';
  const doc = new jsPDF({
    orientation: isA4 ? prefs.orientation : 'landscape',
    unit: 'mm',
    format: isA4 ? 'a4' : 'a5'
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const isIncome = fin.type === 'income';
  const voucherNo = fin.receiptNumber || fin.tripCode || fin.id;
  const companyTitle = fin.companyName || 'PT TRANSINDO LOGISTIK INDONESIA';
  const accent: [number, number, number] = isIncome ? [22, 101, 52] : [185, 28, 28];

  drawVoucherHeader(
    doc,
    companyTitle,
    isIncome ? 'KWITANSI KAS MASUK' : 'KWITANSI KAS KELUAR',
    voucherNo,
    accent
  );

  let y = 31;
  y = drawKeyValueRow(doc, y, 'Tanggal Transaksi', formatDateIndo(fin.date));
  y = drawKeyValueRow(
    doc,
    y,
    isIncome ? 'Diterima Dari' : 'Dibayarkan Kepada',
    fin.customerOrPayer || resolvedDriver.labelWithBracket || '-',
    true
  );
  y = drawKeyValueRow(
    doc,
    y,
    'Serah Terima (Driver/PIC)',
    `Diserahkan: ${resolvedCashier}  |  Diterima: ${fin.receivedBy || resolvedDriver.labelWithBracket}`
  );
  y = drawKeyValueRow(doc, y, 'Unit / Nopol Armada', fin.nopol || 'OPERASIONAL POOL');
  y = drawKeyValueRow(doc, y, 'Kategori Pos', fin.category);
  y = drawKeyValueRow(
    doc,
    y,
    'Rekening & Metode',
    `${fin.accountName || 'Kas Utama'} (${fin.paymentMethod})`
  );
  y = drawKeyValueRow(doc, y, 'Uraian Transaksi', fin.description || '-');

  y += 1.5;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(
    `${isIncome ? '+' : '-'} ${formatRupiah(fin.amount)}`,
    18,
    y + 7
  );

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const terbilangLines = doc.splitTextToSize(
    `Terbilang: # ${terbilangRupiah(fin.amount)} #`,
    pageWidth - 36
  );
  doc.text(terbilangLines, 18, y + 13);

  const statusText = fin.isReceiptVerified
    ? `TERVERIFIKASI AUDIT (${fin.receiptVerifiedBy || 'Audit'})`
    : fin.status.toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`STATUS: ${statusText}`, pageWidth - 18, y + 7, { align: 'right' });

  drawSignatures(
    doc,
    Math.min(y + 24, 122),
    isIncome ? 'Diserahkan Oleh (Penyetor),' : 'Diterima Oleh (Driver / PIC),',
    isIncome
      ? fin.customerOrPayer || resolvedDriver.labelWithParen || '-'
      : fin.receivedBy || resolvedDriver.labelWithParen || fin.customerOrPayer || '-',
    isIncome ? 'Diterima Oleh (Kasir Pool),' : 'Diserahkan Oleh (Kasir Pool),',
    resolvedCashier
  );

  doc.save(`Kwitansi_${voucherNo.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
}

export function downloadPocketSlipPDF(flow: DriverPocketCashFlow): void {
  const prefs = getStoredPrintPreferences();
  if (prefs.printerType === 'thermal_80' || prefs.printerType === 'thermal_58') {
    const el = document.getElementById('printable-pocket-slip');
    if (el) {
      exportElementTextToFormattedPDF(
        'printable-pocket-slip',
        `Slip_UangSaku_${flow.tripCode}`,
        prefs
      );
      return;
    }
  }

  const resolvedDriver = resolveDriverFromData({
    driverId: flow.driverId,
    driverName: flow.driverName,
    driverNip: flow.driverNip,
    helperName: flow.helperName,
    nopol: flow.nopol,
    vehicleId: flow.vehicleId
  });
  const resolvedCashier = resolveAdminCashierByRole(flow.disbursedBy);

  const isA4 = prefs.printerType === 'laser_a4';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: isA4 ? 'a4' : 'a5'
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const voucherNo = `${flow.id} / ${flow.tripCode}`;
  const companyTitle = flow.sourceCompanyName || flow.ownerCompany || 'PT TRANSINDO LOGISTIK INDONESIA';

  drawVoucherHeader(
    doc,
    companyTitle,
    'SLIP UANG SAKU SUPIR',
    voucherNo,
    [30, 58, 138]
  );

  let y = 31;
  y = drawKeyValueRow(doc, y, 'Tanggal Pencairan', formatDateIndo(flow.date));
  y = drawKeyValueRow(doc, y, 'No. Polisi Unit', flow.nopol, true);
  y = drawKeyValueRow(
    doc,
    y,
    'Karyawan Driver',
    `${resolvedDriver.labelWithBracket}${resolvedDriver.helperName ? ` / Kernet: ${resolvedDriver.helperName}` : ''}`,
    true
  );
  y = drawKeyValueRow(doc, y, 'Rute Perjalanan', `${flow.originLocation} -> ${flow.destinationLocation}`);
  y = drawKeyValueRow(doc, y, 'Sumber Kas', `${flow.accountName} (${flow.paymentMethod})`);
  y = drawKeyValueRow(doc, y, 'Diserahkan Oleh', resolvedCashier);

  y += 1.5;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, y, pageWidth - 14, y);
  y += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Rincian Komponen Uang Saku:', 14, y);
  y += 4.5;

  const items: Array<[string, number]> = [
    ['Uang Makan & Saku Supir', flow.driverAllowance],
    ['Uang Saku Kernet', flow.helperAllowance],
    ['Alokasi Biaya E-Toll', flow.tollAllowance],
    ['Alokasi BBM Solar Jalan', flow.fuelAllowance],
    ['Parkir, Retribusi & Timbangan', flow.parkingAndWeighCost],
    ['Ongkos Bongkar Muat', flow.loadingUnloadingCost],
    ['Cadangan Darurat', flow.emergencyFund]
  ].filter(([, val]) => Number(val) > 0) as Array<[string, number]>;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  items.forEach(([label, val]) => {
    doc.setTextColor(71, 85, 105);
    doc.text(`• ${label}`, 16, y);
    doc.setTextColor(15, 23, 42);
    doc.text(formatRupiah(val), pageWidth - 14, y, { align: 'right' });
    y += 4.8;
  });

  y += 2;
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(147, 197, 253);
  doc.roundedRect(14, y, pageWidth - 28, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text('TOTAL DICAIRKAN:', 18, y + 6.5);
  doc.setFontSize(11);
  doc.text(formatRupiah(flow.totalGiven), pageWidth - 18, y + 6.5, { align: 'right' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const terbilangLines = doc.splitTextToSize(
    `Terbilang: # ${terbilangRupiah(flow.totalGiven)} #`,
    pageWidth - 36
  );
  doc.text(terbilangLines, 18, y + 13);

  y += 22;
  if (flow.actualExpense > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`Realisasi Lapangan: ${formatRupiah(flow.actualExpense)}`, 14, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 120, 87);
    doc.text(`Sisa Disetor: ${formatRupiah(flow.remainingBalance)}`, pageWidth - 14, y, { align: 'right' });
    y += 6.5;
  }

  drawSignatures(
    doc,
    Math.min(y + 5, 172),
    'Diterima Oleh (Karyawan Driver),',
    resolvedDriver.labelWithParen,
    'Diserahkan Oleh (Kasir Pool),',
    resolvedCashier
  );

  doc.save(`Slip_UangSaku_${flow.tripCode.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
}

export function downloadEquipmentSlipPDF(eq: EquipmentCashFlow): void {
  const prefs = getStoredPrintPreferences();
  if (prefs.printerType === 'thermal_80' || prefs.printerType === 'thermal_58') {
    const el = document.getElementById('printable-equipment-slip');
    if (el) {
      exportElementTextToFormattedPDF(
        'printable-equipment-slip',
        `Kwitansi_Peralatan_${eq.receiptNumber || eq.id}`,
        prefs
      );
      return;
    }
  }

  const resolvedRecipient = eq.recipientName
    ? resolveDriverFromData({
        driverId: eq.recipientDriverId,
        driverName: eq.recipientName,
        driverNip: eq.recipientNip,
        nopol: eq.nopol,
        vehicleId: eq.vehicleId
      })
    : null;
  const resolvedCashier = resolveAdminCashierByRole(eq.handoverBy);

  const isA4 = prefs.printerType === 'laser_a4';
  const doc = new jsPDF({
    orientation: isA4 ? prefs.orientation : 'landscape',
    unit: 'mm',
    format: isA4 ? 'a4' : 'a5'
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const isIncome = eq.type === 'income';
  const voucherNo = eq.receiptNumber || eq.id;
  const companyTitle = eq.purchasedByCompany || eq.ownerCompany || 'PT TRANSINDO LOGISTIK INDONESIA';
  const accent: [number, number, number] = isIncome ? [22, 101, 52] : [67, 56, 202];

  drawVoucherHeader(
    doc,
    companyTitle,
    isIncome ? 'KWITANSI PENJUALAN SCRAP' : 'KWITANSI BELANJA & SERAH TERIMA ALAT',
    voucherNo,
    accent
  );

  let y = 31;
  y = drawKeyValueRow(doc, y, 'Tanggal Transaksi', formatDateIndo(eq.date));
  y = drawKeyValueRow(doc, y, 'Nama Barang / Alat', `${eq.equipmentName} (${eq.category})`, true);
  y = drawKeyValueRow(doc, y, 'Volume & Harga Satuan', `${eq.quantity} ${eq.unit} x ${formatRupiah(eq.unitPrice)}`);
  y = drawKeyValueRow(doc, y, 'Toko / Supplier', eq.supplierOrStore || '-');
  y = drawKeyValueRow(doc, y, 'Alokasi Unit Armada', eq.nopol || 'KAS POOL UMUM');
  if (resolvedRecipient || eq.handoverBy) {
    y = drawKeyValueRow(
      doc,
      y,
      'Serah Terima Alat',
      `Diterima: ${resolvedRecipient ? resolvedRecipient.labelWithBracket : '-'}  |  Diserahkan: ${resolvedCashier}`
    );
  }
  y = drawKeyValueRow(doc, y, 'Rekening & Metode', `${eq.accountName} (${eq.paymentMethod})`);

  y += 1.5;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(`TOTAL: ${formatRupiah(eq.totalAmount)}`, 18, y + 7);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const terbilangLines = doc.splitTextToSize(
    `Terbilang: # ${terbilangRupiah(eq.totalAmount)} #`,
    pageWidth - 36
  );
  doc.text(terbilangLines, 18, y + 13);

  drawSignatures(
    doc,
    Math.min(y + 24, 122),
    resolvedRecipient ? 'Diterima Oleh (Karyawan Driver),' : 'Toko / Pemasok / PIC,',
    resolvedRecipient
      ? resolvedRecipient.labelWithParen
      : eq.supplierOrStore || '-',
    'Diserahkan Oleh (Logistik / Kasir Pool),',
    resolvedCashier
  );

  doc.save(`Kwitansi_Peralatan_${voucherNo.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
}

export function downloadDepositTopUpSlipPDF(rec: DepositTopUpRecord): void {
  const resolvedCashier = resolveAdminCashierByRole();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const voucherNo = rec.transferProofNumber || rec.id;

  drawVoucherHeader(
    doc,
    'PT TRANSINDO LOGISTIK INDONESIA',
    'KWITANSI PENERIMAAN DEPOSIT',
    voucherNo,
    [5, 150, 105]
  );

  let y = 32;
  y = drawKeyValueRow(doc, y, 'Tanggal Terima', formatDateIndo(rec.date));
  y = drawKeyValueRow(doc, y, 'Diterima Dari', rec.companyName, true);
  y = drawKeyValueRow(doc, y, 'Rekening Tujuan', rec.bankAccountName || '-');
  y = drawKeyValueRow(doc, y, 'Metode Pembayaran', rec.paymentMethod || '-');
  y = drawKeyValueRow(doc, y, 'Keterangan Deposit', rec.notes || 'Top-up saldo deposit operasional perusahaan');

  y += 3;
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(14, y, pageWidth - 28, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(4, 120, 87);
  doc.text(`+ ${formatRupiah(rec.amount)}`, 18, y + 8);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(6, 95, 70);
  const terbilangLines = doc.splitTextToSize(
    `Terbilang: # ${terbilangRupiah(rec.amount)} #`,
    pageWidth - 36
  );
  doc.text(terbilangLines, 18, y + 14.5);

  drawSignatures(
    doc,
    y + 28,
    'Penyetor / Rekanan,',
    rec.companyName,
    'Penerima / Kasir Pool,',
    resolvedCashier
  );

  doc.save(`Kwitansi_Deposit_${voucherNo.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
}
