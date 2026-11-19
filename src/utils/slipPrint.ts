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
 * Ketika tombol "Cetak Printer" diklik, fungsi ini membuka Jendela Print Preview
 * interaktif tempat pengguna memilih printer, ukuran kertas, orientasi, dan rangkap.
 */
export function printElementById(
  elementId: string,
  documentTitle = 'Cetak Dokumen'
): void {
  window.dispatchEvent(
    new CustomEvent<OpenPrintPreviewDetail>(PRINT_PREVIEW_EVENT, {
      detail: { elementId, documentTitle }
    })
  );
}

/**
 * Menjalankan perintah cetak sesungguhnya ke printer sistem / browser secara sinkron
 * dari dalam dialog Print Preview agar tidak diblokir oleh kebijakan user-gesture.
 */
export function executeHardwarePrint(
  elementId: string,
  documentTitle = 'Cetak Dokumen',
  prefs: PrintPreferences
): void {
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

  // Coba cetak secara sinkron di dokumen utama dengan style isolasi @media print
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

  // Selain window.print() langsung, siapkan hidden iframe yang langsung diprint sinkron
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
 * (berguna bila pengguna memilih "Simpan sebagai PDF" atau saat browser memblokir dialog OS).
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
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });
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
    fin.customerOrPayer || fin.driverName || '-',
    true
  );
  if (fin.driverName || fin.receivedBy || fin.handoverBy) {
    const driverRef = fin.driverName
      ? `${fin.driverName}${fin.driverNip ? ` [${fin.driverNip}]` : ''}`
      : fin.receivedBy || '-';
    y = drawKeyValueRow(
      doc,
      y,
      'Serah Terima (Driver/PIC)',
      `Diserahkan: ${fin.handoverBy || 'Rina Anggraini, S.E.'}  |  Diterima: ${fin.receivedBy || driverRef}`
    );
  }
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
      ? fin.handoverBy || fin.customerOrPayer || fin.driverName || '-'
      : fin.receivedBy || (fin.driverName ? `${fin.driverName}${fin.driverNip ? ` (${fin.driverNip})` : ''}` : fin.customerOrPayer || '-'),
    isIncome ? 'Diterima Oleh (Kasir),' : 'Diserahkan Oleh (Kasir),',
    isIncome ? fin.receivedBy || 'Rina Anggraini, S.E.' : fin.handoverBy || 'Rina Anggraini, S.E.'
  );

  doc.save(`Kwitansi_${voucherNo.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
}

export function downloadPocketSlipPDF(flow: DriverPocketCashFlow): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
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
    `${flow.driverName}${flow.driverNip ? ` [${flow.driverNip}]` : ''}${flow.helperName ? ` / Kernet: ${flow.helperName}` : ''}`,
    true
  );
  y = drawKeyValueRow(doc, y, 'Rute Perjalanan', `${flow.originLocation} -> ${flow.destinationLocation}`);
  y = drawKeyValueRow(doc, y, 'Sumber Kas', `${flow.accountName} (${flow.paymentMethod})`);
  if (flow.disbursedBy) {
    y = drawKeyValueRow(doc, y, 'Diserahkan Oleh', flow.disbursedBy);
  }

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
    `${flow.driverName}${flow.driverNip ? ` (${flow.driverNip})` : ''}`,
    'Diserahkan Oleh (Kasir Pool),',
    flow.disbursedBy || 'Rina Anggraini, S.E.'
  );

  doc.save(`Slip_UangSaku_${flow.tripCode.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
}

export function downloadEquipmentSlipPDF(eq: EquipmentCashFlow): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });
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
  if (eq.recipientName || eq.handoverBy) {
    y = drawKeyValueRow(
      doc,
      y,
      'Serah Terima Alat',
      `Diterima: ${eq.recipientName || '-'}${eq.recipientNip ? ` [${eq.recipientNip}]` : ''}  |  Diserahkan: ${eq.handoverBy || 'Hendra Kusuma, A.Md.'}`
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
    eq.recipientName ? 'Diterima Oleh (Karyawan Driver),' : 'Toko / Pemasok / PIC,',
    eq.recipientName
      ? `${eq.recipientName}${eq.recipientNip ? ` (${eq.recipientNip})` : ''}`
      : eq.supplierOrStore || '-',
    'Diserahkan Oleh (Logistik / Kasir),',
    eq.handoverBy || 'Rina Anggraini, S.E.'
  );

  doc.save(`Kwitansi_Peralatan_${voucherNo.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
}

export function downloadDepositTopUpSlipPDF(rec: DepositTopUpRecord): void {
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
    'Penerima / Keuangan,',
    'Rina Anggraini, S.E.'
  );

  doc.save(`Kwitansi_Deposit_${voucherNo.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
}
