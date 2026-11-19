import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Vehicle,
  TaxRecord,
  FuelLog,
  OperationalFinance,
  DriverTimesheet,
  MaintenanceRecord,
  Driver,
  FinancialAccount,
  ActivityLog
} from '../types';
import { formatRupiah, formatDateIndo } from './formatters';

// Common PDF Header Styling
const drawPdfHeader = (
  doc: jsPDF,
  title: string,
  subtitle: string,
  dateRangeText: string
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header bar
  doc.setFillColor(30, 58, 138); // blue-900
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('44S OPS_PRO - SISTEM OPERASIONAL ARMADA', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(219, 234, 254);
  doc.text('Integrated Fleet Management & Financial Control System', 14, 18);

  // Print Date
  const printDate = new Date().toLocaleString('id-ID');
  doc.text(`Dicetak: ${printDate}`, pageWidth - 14, 18, { align: 'right' });

  // Subtitle & Filter Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 14, 34);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`${subtitle} | Periode Filter: ${dateRangeText}`, 14, 40);

  // Horizontal divider
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, 43, pageWidth - 14, 43);
};

// Common PDF Footer
const drawPdfFooter = (doc: jsPDF) => {
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Dokumen resmi ini dibuat secara otomatis oleh sistem 44S Ops_pro Enterprise.',
      14,
      pageHeight - 7
    );
    doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - 14, pageHeight - 7, {
      align: 'right'
    });
  }
};

/**
 * ============================================================================
 * 1. EXPORT FUEL / BBM
 * ============================================================================
 */
export const exportFuelToExcel = (
  logs: FuelLog[],
  dateRangeText: string = 'Semua Periode'
) => {
  const data: any[] = logs.map((f, idx) => ({
    'No': idx + 1,
    'ID Log': f.id,
    'Tanggal': f.date,
    'No. Polisi': f.nopol,
    'Supir': f.driverName,
    'Jenis BBM': f.fuelType,
    'Volume (Liter)': f.volumeLiters,
    'Harga/Liter (Rp)': f.pricePerLiter,
    'Total Biaya (Rp)': f.totalCost,
    'Odometer (KM)': f.odometer,
    'Jarak Tempuh (KM)': f.distanceTravelled,
    'Efisiensi (KM/Liter)': f.calculatedKmPerLiter,
    'Lokasi SPBU': f.fuelStation,
    'Full Tank': f.isFullTank ? 'YA' : 'TIDAK',
    'No. Struk': f.receiptNumber || '-',
    'Catatan': f.notes || '-'
  }));

  const totalLiters = logs.reduce((sum, item) => sum + item.volumeLiters, 0);
  const totalCost = logs.reduce((sum, item) => sum + item.totalCost, 0);
  const totalDistance = logs.reduce((sum, item) => sum + item.distanceTravelled, 0);
  const avgKmL = logs.length > 0
    ? (logs.reduce((sum, item) => sum + item.calculatedKmPerLiter, 0) / logs.length).toFixed(2)
    : '0';

  // Summary row
  data.push({
    'No': '' as any,
    'ID Log': 'TOTAL / RATA-RATA',
    'Tanggal': `Periode: ${dateRangeText}`,
    'No. Polisi': `${logs.length} Transaksi`,
    'Supir': '',
    'Jenis BBM': '',
    'Volume (Liter)': totalLiters,
    'Harga/Liter (Rp)': '' as any,
    'Total Biaya (Rp)': totalCost,
    'Odometer (KM)': '' as any,
    'Jarak Tempuh (KM)': totalDistance,
    'Efisiensi (KM/Liter)': Number(avgKmL),
    'Lokasi SPBU': '',
    'Full Tank': '',
    'No. Struk': '',
    'Catatan': ''
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Log_BBM');

  ws['!cols'] = [
    { wch: 5 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 18 },
    { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 14 },
    { wch: 16 }, { wch: 18 }, { wch: 24 }, { wch: 10 }, { wch: 14 }, { wch: 20 }
  ];

  XLSX.writeFile(wb, `Laporan_BBM_Solar_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportFuelToPDF = (
  logs: FuelLog[],
  dateRangeText: string = 'Semua Periode'
) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  drawPdfHeader(
    doc,
    'Laporan Konsumsi BBM & Monitoring Solar Armada',
    `Total: ${logs.length} Pengisian`,
    dateRangeText
  );

  const totalLiters = logs.reduce((sum, item) => sum + item.volumeLiters, 0);
  const totalCost = logs.reduce((sum, item) => sum + item.totalCost, 0);
  const totalDistance = logs.reduce((sum, item) => sum + item.distanceTravelled, 0);
  const avgKmL = logs.length > 0
    ? (logs.reduce((sum, item) => sum + item.calculatedKmPerLiter, 0) / logs.length).toFixed(2)
    : '0';

  const bodyData = logs.map((f, idx) => [
    idx + 1,
    formatDateIndo(f.date),
    f.nopol,
    f.driverName,
    f.fuelType,
    `${f.volumeLiters} L`,
    formatRupiah(f.pricePerLiter),
    formatRupiah(f.totalCost),
    `${f.odometer.toLocaleString()} KM`,
    `${f.distanceTravelled.toLocaleString()} KM`,
    `${f.calculatedKmPerLiter} KM/L`,
    f.fuelStation
  ]);

  autoTable(doc, {
    startY: 46,
    head: [[
      'No', 'Tanggal', 'No. Polisi', 'Pengemudi', 'BBM',
      'Liter', 'Harga/L', 'Total Biaya', 'Odometer', 'Jarak', 'Rasio', 'SPBU'
    ]],
    body: bodyData,
    foot: [[
      '', 'TOTAL', '', `${logs.length} Trx`, '',
      `${totalLiters.toLocaleString()} L`, '', formatRupiah(totalCost),
      '', `${totalDistance.toLocaleString()} KM`, `Rata: ${avgKmL}`, ''
    ]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 22 },
      2: { fontStyle: 'bold', cellWidth: 22 },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right', fontStyle: 'bold' },
      8: { halign: 'right' },
      9: { halign: 'right' },
      10: { halign: 'center' }
    }
  });

  drawPdfFooter(doc);
  doc.save(`Laporan_BBM_Solar_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * ============================================================================
 * 2. EXPORT FINANCE / KEUANGAN & KAS
 * ============================================================================
 */
export const exportFinanceToExcel = (
  finances: OperationalFinance[],
  dateRangeText: string = 'Semua Periode'
) => {
  const data: any[] = finances.map((f, idx) => ({
    'No': idx + 1,
    'ID Transaksi': f.id,
    'Tanggal': f.date,
    'No. Polisi': f.nopol || '-',
    'Pengemudi / PIC': f.driverName,
    'Kategori': f.category,
    'Tipe': f.type === 'income' ? 'Pemasukan (Kredit)' : 'Pengeluaran (Debet)',
    'Jumlah (Rp)': f.amount,
    'Kode Trip / DO': f.tripCode || '-',
    'Deskripsi Transaksi': f.description,
    'Metode Pembayaran': f.paymentMethod,
    'Akun Rekening': f.accountName || f.accountId || '-',
    'No. Bukti / Kuitansi': f.receiptNumber || '-',
    'Status': f.status
  }));

  const totalIncome = finances.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
  const totalExpense = finances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
  const netMargin = totalIncome - totalExpense;

  data.push({
    'No': '' as any,
    'ID Transaksi': 'REKAP TOTAL',
    'Tanggal': `Periode: ${dateRangeText}`,
    'No. Polisi': `Pemasukan: Rp ${totalIncome.toLocaleString()}`,
    'Pengemudi / PIC': `Pengeluaran: Rp ${totalExpense.toLocaleString()}`,
    'Kategori': `Net Saldo: Rp ${netMargin.toLocaleString()}`,
    'Tipe': '',
    'Jumlah (Rp)': netMargin,
    'Kode Trip / DO': '',
    'Deskripsi Transaksi': '',
    'Metode Pembayaran': '',
    'Akun Rekening': '',
    'No. Bukti / Kuitansi': '',
    'Status': ''
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Keuangan_Operasional');

  ws['!cols'] = [
    { wch: 5 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 20 },
    { wch: 24 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 32 },
    { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 12 }
  ];

  XLSX.writeFile(wb, `Laporan_Keuangan_Operasional_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportFinanceToPDF = (
  finances: OperationalFinance[],
  dateRangeText: string = 'Semua Periode'
) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  drawPdfHeader(
    doc,
    'Laporan Arus Keuangan Operasional & Mutasi Kas Bank',
    `Total Transaksi: ${finances.length}`,
    dateRangeText
  );

  const totalIncome = finances.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
  const totalExpense = finances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
  const netMargin = totalIncome - totalExpense;

  const bodyData = finances.map((f, idx) => [
    idx + 1,
    formatDateIndo(f.date),
    f.nopol || '-',
    f.category,
    f.description,
    f.accountName || f.paymentMethod,
    f.type === 'income' ? `+${formatRupiah(f.amount)}` : `-${formatRupiah(f.amount)}`,
    f.tripCode || f.receiptNumber || '-'
  ]);

  autoTable(doc, {
    startY: 46,
    head: [[
      'No', 'Tanggal', 'No. Polisi', 'Kategori', 'Deskripsi / Uraian',
      'Akun Rekening / Metode', 'Nominal (Rp)', 'Ref / Trip'
    ]],
    body: bodyData,
    foot: [[
      '', 'RINGKASAN', '', `In: ${formatRupiah(totalIncome)}`, `Out: ${formatRupiah(totalExpense)}`,
      'NET CASHFLOW', formatRupiah(netMargin), ''
    ]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [67, 56, 202], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 22 },
      2: { fontStyle: 'bold', cellWidth: 22 },
      4: { cellWidth: 65 },
      6: { halign: 'right', fontStyle: 'bold' }
    }
  });

  drawPdfFooter(doc);
  doc.save(`Laporan_Keuangan_Operasional_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * ============================================================================
 * 3. EXPORT TAX / PAJAK & KIR
 * ============================================================================
 */
export const exportTaxToExcel = (
  taxes: TaxRecord[],
  dateRangeText: string = 'Semua Periode'
) => {
  const data: any[] = taxes.map((t, idx) => ({
    'No': idx + 1,
    'ID Pajak': t.id,
    'No. Polisi': t.nopol,
    'Jenis Dokumen': t.documentType,
    'Tanggal Jatuh Tempo': t.dueDate,
    'Tanggal Bayar Terakhir': t.lastPaymentDate || '-',
    'Estimasi Biaya (Rp)': t.amount,
    'Denda (Rp)': t.penaltyAmount || 0,
    'Total Biaya (Rp)': t.amount + (t.penaltyAmount || 0),
    'Status': t.status,
    'Lokasi Samsat / Dishub': t.agentOrSamsat || '-',
    'Keterangan': t.notes || '-'
  }));

  const totalAmount = taxes.reduce((sum, item) => sum + item.amount + (item.penaltyAmount || 0), 0);

  data.push({
    'No': '' as any,
    'ID Pajak': 'TOTAL BIAYA PAJAK',
    'No. Polisi': `Periode: ${dateRangeText}`,
    'Jenis Dokumen': `${taxes.length} Berkas`,
    'Tanggal Jatuh Tempo': '',
    'Tanggal Bayar Terakhir': '',
    'Estimasi Biaya (Rp)': totalAmount,
    'Denda (Rp)': '' as any,
    'Total Biaya (Rp)': totalAmount,
    'Status': '',
    'Lokasi Samsat / Dishub': '',
    'Keterangan': ''
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pajak_Dokumen');

  ws['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 14 }, { wch: 22 }, { wch: 16 },
    { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 22 }, { wch: 25 }
  ];

  XLSX.writeFile(wb, `Laporan_Pajak_KIR_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportTaxToPDF = (
  taxes: TaxRecord[],
  dateRangeText: string = 'Semua Periode'
) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  drawPdfHeader(
    doc,
    'Laporan Legalitas Kendaraan, Pajak STNK & Uji Berkala KIR',
    `Total Berkas: ${taxes.length} Dokumen`,
    dateRangeText
  );

  const totalAmount = taxes.reduce((sum, item) => sum + item.amount + (item.penaltyAmount || 0), 0);

  const bodyData = taxes.map((t, idx) => [
    idx + 1,
    t.nopol,
    t.documentType,
    formatDateIndo(t.dueDate),
    t.lastPaymentDate ? formatDateIndo(t.lastPaymentDate) : '-',
    formatRupiah(t.amount + (t.penaltyAmount || 0)),
    t.status === 'paid' ? 'LUNAS' : t.status === 'overdue' ? 'TERLEWAT' : 'MENDEKATI',
    t.agentOrSamsat || '-'
  ]);

  autoTable(doc, {
    startY: 46,
    head: [[
      'No', 'No. Polisi', 'Jenis Dokumen Legalitas', 'Jatuh Tempo',
      'Tgl Bayar', 'Estimasi Biaya', 'Status', 'Samsat / Lokasi KIR'
    ]],
    body: bodyData,
    foot: [[
      '', 'TOTAL BIAYA', `${taxes.length} Berkas`, '', '', formatRupiah(totalAmount), '', ''
    ]],
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [185, 28, 28], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 25 },
      2: { cellWidth: 50 },
      5: { halign: 'right', fontStyle: 'bold' },
      6: { halign: 'center' }
    }
  });

  drawPdfFooter(doc);
  doc.save(`Laporan_Pajak_KIR_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * ============================================================================
 * 4. EXPORT TIMESHEET / RITASE SUPIR
 * ============================================================================
 */
export const exportTimesheetToExcel = (
  timesheets: DriverTimesheet[],
  dateRangeText: string = 'Semua Periode'
) => {
  const data: any[] = timesheets.map((t, idx) => ({
    'No': idx + 1,
    'ID Timesheet': t.id,
    'Tanggal': t.date,
    'No. Polisi': t.nopol,
    'Pengemudi': t.driverName,
    'Kernet': t.helperName || '-',
    'Rute Asal (Origin)': t.originLocation,
    'Rute Tujuan (Destination)': t.destinationLocation,
    'Jam Kerja': `${t.startTime} - ${t.endTime} (${t.totalHours} Jam)`,
    'Lembur (Jam)': t.overtimeHours,
    'Muatan Barang': t.cargoDescription,
    'Tonase (Ton)': t.cargoTonnageTon,
    'Jumlah Rit': t.tripCount,
    'KM Awal': t.startKm,
    'KM Akhir': t.endKm,
    'Total Jarak (KM)': t.totalDistanceKm,
    'Status': t.status,
    'Catatan': t.notes || '-'
  }));

  const totalKm = timesheets.reduce((sum, item) => sum + item.totalDistanceKm, 0);
  const totalRit = timesheets.reduce((sum, item) => sum + item.tripCount, 0);
  const totalTon = timesheets.reduce((sum, item) => sum + item.cargoTonnageTon, 0);

  data.push({
    'No': '' as any,
    'ID Timesheet': 'TOTAL RITASE',
    'Tanggal': `Periode: ${dateRangeText}`,
    'No. Polisi': `${timesheets.length} Surat Jalan`,
    'Pengemudi': '',
    'Kernet': '',
    'Rute Asal (Origin)': '',
    'Rute Tujuan (Destination)': '',
    'Jam Kerja': '',
    'Lembur (Jam)': '' as any,
    'Muatan Barang': '',
    'Tonase (Ton)': totalTon,
    'Jumlah Rit': totalRit,
    'KM Awal': '' as any,
    'KM Akhir': '' as any,
    'Total Jarak (KM)': totalKm,
    'Status': '',
    'Catatan': ''
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Timesheet_Ritase');

  ws['!cols'] = [
    { wch: 5 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 18 },
    { wch: 14 }, { wch: 24 }, { wch: 24 }, { wch: 20 }, { wch: 12 },
    { wch: 22 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
    { wch: 14 }, { wch: 12 }, { wch: 20 }
  ];

  XLSX.writeFile(wb, `Laporan_Timesheet_Ritase_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportTimesheetToPDF = (
  timesheets: DriverTimesheet[],
  dateRangeText: string = 'Semua Periode'
) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  drawPdfHeader(
    doc,
    'Laporan Timesheet Pengemudi, Ritase & Distribusi Muatan',
    `Total Kegiatan: ${timesheets.length} Kali Jalan`,
    dateRangeText
  );

  const totalKm = timesheets.reduce((sum, item) => sum + item.totalDistanceKm, 0);
  const totalRit = timesheets.reduce((sum, item) => sum + item.tripCount, 0);
  const totalTon = timesheets.reduce((sum, item) => sum + item.cargoTonnageTon, 0);

  const bodyData = timesheets.map((t, idx) => [
    idx + 1,
    formatDateIndo(t.date),
    t.nopol,
    t.driverName,
    `${t.originLocation} -> ${t.destinationLocation}`,
    t.cargoDescription,
    `${t.cargoTonnageTon} Ton`,
    `${t.tripCount} Rit`,
    `${t.totalHours} Jam`,
    `${t.totalDistanceKm} KM`
  ]);

  autoTable(doc, {
    startY: 46,
    head: [[
      'No', 'Tanggal', 'No. Polisi', 'Pengemudi', 'Rute (Asal -> Tujuan)',
      'Muatan', 'Tonase', 'Rit', 'Durasi', 'Jarak Tempuh'
    ]],
    body: bodyData,
    foot: [[
      '', 'TOTAL', '', `${timesheets.length} Record`, '', '',
      `${totalTon} Ton`, `${totalRit} Rit`, '', `${totalKm.toLocaleString()} KM`
    ]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 22 },
      2: { fontStyle: 'bold', cellWidth: 22 },
      4: { cellWidth: 60 },
      6: { halign: 'right' },
      7: { halign: 'center' },
      8: { halign: 'center' },
      9: { halign: 'right', fontStyle: 'bold' }
    }
  });

  drawPdfFooter(doc);
  doc.save(`Laporan_Timesheet_Ritase_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * ============================================================================
 * 5. EXPORT MAINTENANCE / SERVIS
 * ============================================================================
 */
export const exportMaintenanceToExcel = (
  maintenance: MaintenanceRecord[],
  dateRangeText: string = 'Semua Periode'
) => {
  const data: any[] = maintenance.map((m, idx) => ({
    'No': idx + 1,
    'No. SPK / WO': m.workOrderNumber,
    'Tanggal Servis': m.serviceDate,
    'No. Polisi': m.nopol,
    'Odometer Saat Ini (KM)': m.odometerAtService,
    'Target Odo Berikutnya (KM)': m.nextServiceOdometer,
    'Tgl Servis Berikutnya': m.nextServiceDate,
    'Jenis Perawatan': m.serviceType,
    'Bengkel / Workshop': m.workshopName,
    'Biaya Jasa (Rp)': m.laborCost,
    'Rincian Sparepart': (m.spareparts || []).map(s => `${s.name} (${s.qty} ${s.unit} @ Rp${s.unitPrice})`).join('; '),
    'Total Biaya Servis (Rp)': m.totalCost,
    'Status': m.status,
    'Catatan Mekanik': m.notes || '-'
  }));

  const totalCost = maintenance.reduce((sum, item) => sum + item.totalCost, 0);

  data.push({
    'No': '' as any,
    'No. SPK / WO': 'TOTAL BIAYA PERAWATAN',
    'Tanggal Servis': `Periode: ${dateRangeText}`,
    'No. Polisi': `${maintenance.length} Servis`,
    'Odometer Saat Ini (KM)': '' as any,
    'Target Odo Berikutnya (KM)': '' as any,
    'Tgl Servis Berikutnya': '',
    'Jenis Perawatan': '',
    'Bengkel / Workshop': '',
    'Biaya Jasa (Rp)': '' as any,
    'Rincian Sparepart': '',
    'Total Biaya Servis (Rp)': totalCost,
    'Status': '',
    'Catatan Mekanik': ''
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Perawatan_Servis');

  ws['!cols'] = [
    { wch: 5 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
    { wch: 18 }, { wch: 16 }, { wch: 26 }, { wch: 22 }, { wch: 16 },
    { wch: 35 }, { wch: 20 }, { wch: 14 }, { wch: 25 }
  ];

  XLSX.writeFile(wb, `Laporan_Perawatan_Servis_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportMaintenanceToPDF = (
  maintenance: MaintenanceRecord[],
  dateRangeText: string = 'Semua Periode'
) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  drawPdfHeader(
    doc,
    'Laporan Perawatan Kendaraan, Riwayat Servis & Penggantian Sparepart',
    `Total Perawatan: ${maintenance.length} SPK`,
    dateRangeText
  );

  const totalCost = maintenance.reduce((sum, item) => sum + item.totalCost, 0);

  const bodyData = maintenance.map((m, idx) => [
    idx + 1,
    m.workOrderNumber,
    formatDateIndo(m.serviceDate),
    m.nopol,
    m.serviceType,
    m.workshopName,
    `${m.odometerAtService.toLocaleString()} KM`,
    formatRupiah(m.laborCost),
    formatRupiah(m.totalCost),
    m.status === 'completed' ? 'SELESAI' : 'DIKERJAKAN'
  ]);

  autoTable(doc, {
    startY: 46,
    head: [[
      'No', 'No. SPK', 'Tanggal', 'No. Polisi', 'Jenis Pekerjaan',
      'Bengkel', 'Odo Servis', 'Biaya Jasa', 'Total Biaya', 'Status'
    ]],
    body: bodyData,
    foot: [[
      '', 'TOTAL BIAYA', '', `${maintenance.length} SPK`, '', '', '', '',
      formatRupiah(totalCost), ''
    ]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 26 },
      3: { fontStyle: 'bold', cellWidth: 22 },
      4: { cellWidth: 50 },
      7: { halign: 'right' },
      8: { halign: 'right', fontStyle: 'bold' },
      9: { halign: 'center' }
    }
  });

  drawPdfFooter(doc);
  doc.save(`Laporan_Perawatan_Servis_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * ============================================================================
 * 6. EXPORT VEHICLES / MASTER ARMADA
 * ============================================================================
 */
export const exportVehiclesToExcel = (
  vehicles: Vehicle[],
  dateRangeText: string = 'Semua Periode'
) => {
  const data: any[] = vehicles.map((v, idx) => ({
    'No': idx + 1,
    'ID Unit': v.id,
    'No. Polisi': v.nopol,
    'Pemilik Aset / Perusahaan': v.ownerCompany || 'PT Transindo Logistik',
    'Merk / Tipe': `${v.brand} ${v.model}`,
    'Jenis Armada': v.type,
    'Tahun': v.year,
    'Bahan Bakar': v.fuelType,
    'Odometer Saat Ini (KM)': v.currentOdometer,
    'Target Km/Liter': v.targetKmPerLiter,
    'Kapasitas (Ton)': v.capacityTon || 0,
    'Pengemudi Utama': v.assignedDriver,
    'No. HP Supir': v.driverPhone || '-',
    'Status': v.status,
    'Pajak 1 Thn': v.stnk1YearDate,
    'Plat 5 Thn': v.stnk5YearDate,
    'KIR Dishub': v.kirDate,
    'Catatan': v.notes || '-'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Master_Armada');

  ws['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 14 }, { wch: 24 }, { wch: 22 }, { wch: 18 },
    { wch: 8 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
    { wch: 20 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 20 }
  ];

  XLSX.writeFile(wb, `Master_Data_Armada_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportVehiclesToPDF = (
  vehicles: Vehicle[],
  dateRangeText: string = 'Semua Periode'
) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  drawPdfHeader(
    doc,
    'Laporan Master Database Armada Kendaraan Operasional & Aset Perusahaan',
    `Total Terdaftar: ${vehicles.length} Unit Armada`,
    dateRangeText
  );

  const bodyData = vehicles.map((v, idx) => [
    idx + 1,
    v.nopol,
    v.ownerCompany || 'PT Transindo Logistik',
    `${v.brand} ${v.model}`,
    v.type,
    v.year,
    v.fuelType,
    `${v.currentOdometer.toLocaleString()} KM`,
    v.assignedDriver,
    v.stnk1YearDate ? formatDateIndo(v.stnk1YearDate) : '-',
    v.kirDate ? formatDateIndo(v.kirDate) : '-',
    v.status.toUpperCase()
  ]);

  autoTable(doc, {
    startY: 46,
    head: [[
      'No', 'No. Polisi', 'Pemilik / Perusahaan Aset', 'Merk / Model', 'Jenis', 'Tahun',
      'Bahan Bakar', 'Odometer', 'Pengemudi', 'Pajak STNK', 'KIR Dishub', 'Status'
    ]],
    body: bodyData,
    foot: [[
      '', 'TOTAL ARMADA', `${vehicles.length} UNIT`, '', '', '', '', '', '', '', '', ''
    ]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 24 },
      6: { halign: 'right' },
      10: { halign: 'center', fontStyle: 'bold' }
    }
  });

  drawPdfFooter(doc);
  doc.save(`Master_Data_Armada_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * ============================================================================
 * 7. EXPORT DRIVERS / MASTER SUPIR
 * ============================================================================
 */
export const exportDriversToExcel = (
  drivers: Driver[],
  dateRangeText: string = 'Semua Periode'
) => {
  const data: any[] = drivers.map((d, idx) => ({
    'No': idx + 1,
    'ID Supir': d.id,
    'Nama Lengkap': d.name,
    'NIK KTP': d.nik,
    'No. WhatsApp / HP': d.phone,
    'Golongan SIM': d.simType,
    'No. SIM': d.simNumber,
    'Masa Berlaku SIM': d.simExpiry,
    'Status Tugas': d.status
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Master_Driver');

  ws['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 22 }, { wch: 20 }, { wch: 18 },
    { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 14 }
  ];

  XLSX.writeFile(wb, `Master_Data_Driver_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportDriversToPDF = (
  drivers: Driver[],
  dateRangeText: string = 'Semua Periode'
) => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  drawPdfHeader(
    doc,
    'Laporan Master Awak Pengemudi & Supir Armada',
    `Total Pengemudi: ${drivers.length} Orang`,
    dateRangeText
  );

  const bodyData = drivers.map((d, idx) => [
    idx + 1,
    d.name,
    d.phone,
    d.simType,
    d.simNumber,
    formatDateIndo(d.simExpiry),
    d.status === 'active' ? 'AKTIF' : d.status === 'on_duty' ? 'SEDANG JALAN' : 'NONAKTIF'
  ]);

  autoTable(doc, {
    startY: 46,
    head: [[
      'No', 'Nama Pengemudi', 'No. WhatsApp', 'Gol SIM', 'No. SIM', 'Masa Berlaku SIM', 'Status'
    ]],
    body: bodyData,
    foot: [[
      '', 'TOTAL PENGEMUDI', `${drivers.length} Orang`, '', '', '', ''
    ]],
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [55, 65, 81], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold' },
      6: { halign: 'center', fontStyle: 'bold' }
    }
  });

  drawPdfFooter(doc);
  doc.save(`Master_Data_Driver_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * ============================================================================
 * 8. EXPORT COMPREHENSIVE EXECUTIVE REPORT / ANALITIK LENGKAP
 * ============================================================================
 */
export const exportComprehensiveReportToExcel = (
  vehicles: Vehicle[],
  taxes: TaxRecord[],
  fuelLogs: FuelLog[],
  finances: OperationalFinance[],
  timesheets: DriverTimesheet[],
  maintenance: MaintenanceRecord[],
  dateRangeText: string = 'Semua Periode'
) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Performa per Unit Kendaraan
  const vehicleSummary = vehicles.map((v, idx) => {
    const vFuel = fuelLogs.filter(f => f.vehicleId === v.id || f.nopol === v.nopol);
    const vFin = finances.filter(f => f.vehicleId === v.id || f.nopol === v.nopol);
    const vMnt = maintenance.filter(m => m.vehicleId === v.id || m.nopol === v.nopol);
    const vTs = timesheets.filter(t => t.vehicleId === v.id || t.nopol === v.nopol);

    const fuelCost = vFuel.reduce((sum, f) => sum + f.totalCost, 0);
    const fuelLiters = vFuel.reduce((sum, f) => sum + f.volumeLiters, 0);
    const opsCost = vFin.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
    const srvCost = vMnt.reduce((sum, m) => sum + m.totalCost, 0);
    const income = vFin.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
    const totalCost = fuelCost + opsCost + srvCost;
    const netMargin = income - totalCost;
    const totalKm = vTs.reduce((sum, t) => sum + t.totalDistanceKm, 0);
    const totalRit = vTs.reduce((sum, t) => sum + t.tripCount, 0);
    const costPerKm = totalKm > 0 ? totalCost / totalKm : 0;
    const avgKmL = vFuel.length > 0
      ? (vFuel.reduce((sum, f) => sum + f.calculatedKmPerLiter, 0) / vFuel.length).toFixed(2)
      : '0';

    return {
      'No': idx + 1,
      'No. Polisi': v.nopol,
      'Merk / Tipe': `${v.brand} ${v.model}`,
      'Jenis': v.type,
      'Supir': v.assignedDriver,
      'Total Rit': totalRit,
      'Jarak Tempuh (KM)': totalKm,
      'Solar (Liter)': fuelLiters,
      'Efisiensi (KM/L)': Number(avgKmL),
      'Biaya Solar (Rp)': fuelCost,
      'Biaya Operasional (Rp)': opsCost,
      'Biaya Servis (Rp)': srvCost,
      'Total Pengeluaran (Rp)': totalCost,
      'Total Pendapatan (Rp)': income,
      'Margin Bersih (Rp)': netMargin,
      'Cost / KM (Rp)': Math.round(costPerKm)
    };
  });

  const wsPerf = XLSX.utils.json_to_sheet(vehicleSummary);
  XLSX.utils.book_append_sheet(wb, wsPerf, 'Rekap_Performa_Armada');

  // Sheet 2: Log BBM
  const wsFuel = XLSX.utils.json_to_sheet(fuelLogs);
  XLSX.utils.book_append_sheet(wb, wsFuel, 'Raw_BBM');

  // Sheet 3: Keuangan
  const wsFin = XLSX.utils.json_to_sheet(finances);
  XLSX.utils.book_append_sheet(wb, wsFin, 'Raw_Keuangan');

  // Sheet 4: Servis
  const wsMnt = XLSX.utils.json_to_sheet(maintenance);
  XLSX.utils.book_append_sheet(wb, wsMnt, 'Raw_Servis');

  // Sheet 5: Timesheet
  const wsTs = XLSX.utils.json_to_sheet(timesheets);
  XLSX.utils.book_append_sheet(wb, wsTs, 'Raw_Timesheet');

  XLSX.writeFile(wb, `Laporan_Eksekutif_44S_Ops_pro_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportComprehensiveReportToPDF = (
  vehicles: Vehicle[],
  taxes: TaxRecord[],
  fuelLogs: FuelLog[],
  finances: OperationalFinance[],
  timesheets: DriverTimesheet[],
  maintenance: MaintenanceRecord[],
  dateRangeText: string = 'Semua Periode'
) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  drawPdfHeader(
    doc,
    'Laporan Eksekutif Biaya Operasional & Kinerja Armada Lengkap',
    `Rekapitulasi ${vehicles.length} Armada Kendaraan`,
    dateRangeText
  );

  const vehicleSummary = vehicles.map((v, idx) => {
    const vFuel = fuelLogs.filter(f => f.vehicleId === v.id || f.nopol === v.nopol);
    const vFin = finances.filter(f => f.vehicleId === v.id || f.nopol === v.nopol);
    const vMnt = maintenance.filter(m => m.vehicleId === v.id || m.nopol === v.nopol);
    const vTs = timesheets.filter(t => t.vehicleId === v.id || t.nopol === v.nopol);

    const fuelCost = vFuel.reduce((sum, f) => sum + f.totalCost, 0);
    const opsCost = vFin.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
    const srvCost = vMnt.reduce((sum, m) => sum + m.totalCost, 0);
    const income = vFin.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
    const totalCost = fuelCost + opsCost + srvCost;
    const net = income - totalCost;
    const km = vTs.reduce((sum, t) => sum + t.totalDistanceKm, 0);
    const trips = vTs.reduce((sum, t) => sum + t.tripCount, 0);
    const avgKmL = vFuel.length > 0
      ? (vFuel.reduce((sum, f) => sum + f.calculatedKmPerLiter, 0) / vFuel.length).toFixed(2)
      : '0';
    const costPerKm = km > 0 ? totalCost / km : 0;

    return [
      idx + 1,
      v.nopol,
      v.assignedDriver,
      `${trips} Rit`,
      `${km.toLocaleString()} KM`,
      `${avgKmL} KM/L`,
      formatRupiah(fuelCost),
      formatRupiah(srvCost),
      formatRupiah(opsCost),
      formatRupiah(totalCost),
      formatRupiah(income),
      formatRupiah(net)
    ];
  });

  const totalFuel = fuelLogs.reduce((sum, f) => sum + f.totalCost, 0);
  const totalSrv = maintenance.reduce((sum, m) => sum + m.totalCost, 0);
  const totalOps = finances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
  const grandCost = totalFuel + totalSrv + totalOps;
  const grandIncome = finances.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
  const grandMargin = grandIncome - grandCost;

  autoTable(doc, {
    startY: 46,
    head: [[
      'No', 'No. Polisi', 'Pengemudi', 'Rit', 'Jarak',
      'Efisiensi', 'Biaya Solar', 'Biaya Servis', 'Operasional', 'Total Beban', 'Pendapatan', 'Net Margin'
    ]],
    body: vehicleSummary,
    foot: [[
      '', 'GRAND TOTAL', '', '', '', '',
      formatRupiah(totalFuel), formatRupiah(totalSrv), formatRupiah(totalOps),
      formatRupiah(grandCost), formatRupiah(grandIncome), formatRupiah(grandMargin)
    ]],
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 20 },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
      9: { halign: 'right', fontStyle: 'bold' },
      10: { halign: 'right' },
      11: { halign: 'right', fontStyle: 'bold' }
    }
  });

  drawPdfFooter(doc);
  doc.save(`Laporan_Eksekutif_44S_Ops_pro_${new Date().toISOString().split('T')[0]}.pdf`);
};

// ==========================================
// EXPORT ACTIVITY AUDIT LOGS
// ==========================================

export const exportActivityLogsToExcel = (
  logs: ActivityLog[],
  dateRangeText: string = 'Semua Periode'
) => {
  const data = logs.map((l, index) => ({
    No: index + 1,
    'ID Log': l.id,
    'Waktu / Timestamp': l.timestamp,
    Modul: l.module.toUpperCase(),
    'Aksi': l.action.toUpperCase(),
    'Judul Aktivitas': l.title,
    'Keterangan & Rincian': l.description,
    'Target Terkait': l.targetName || l.targetId || '-',
    'Pengguna': l.userName,
    'Peran / Role': l.userRole.toUpperCase(),
    'Departemen': l.userDepartment || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Log_Aktivitas');

  // Auto-fit column widths
  const maxProps = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length + 3, 14)
  }));
  worksheet['!cols'] = maxProps;

  const fileName = `Log_Aktivitas_44S_Ops_pro_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export const exportActivityLogsToPDF = (
  logs: ActivityLog[],
  dateRangeText: string = 'Semua Periode'
) => {
  const doc = new jsPDF('landscape');
  drawPdfHeader(doc, 'LOG AKTIVITAS & AUDIT TRAIL OPERASIONAL', 'Rekam Jejak Transaksi & Perubahan Data Sistem', dateRangeText);

  const rows = logs.map((l, index) => [
    index + 1,
    l.timestamp,
    l.module.toUpperCase(),
    l.action.toUpperCase(),
    l.title,
    l.targetName || l.targetId || '-',
    l.userName,
    l.userRole.toUpperCase(),
    l.description
  ]);

  autoTable(doc, {
    startY: 46,
    head: [[
      'No', 'Waktu', 'Modul', 'Aksi', 'Judul Aktivitas', 'Target', 'Pengguna', 'Role', 'Keterangan Detail'
    ]],
    body: rows,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 26, fontSize: 6.5 },
      2: { fontStyle: 'bold', cellWidth: 18 },
      3: { cellWidth: 16 },
      4: { fontStyle: 'bold', cellWidth: 36 },
      5: { cellWidth: 22 },
      6: { cellWidth: 26 },
      7: { cellWidth: 16 },
      8: { cellWidth: 'auto' }
    }
  });

  drawPdfFooter(doc);
  doc.save(`Log_Aktivitas_Audit_44S_Ops_pro_${new Date().toISOString().split('T')[0]}.pdf`);
};
