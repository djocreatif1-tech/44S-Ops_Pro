import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  Copy,
  Palette,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  X,
  FileDown,
  FileText,
  Maximize2,
  ExternalLink,
  Receipt
} from 'lucide-react';
import {
  PRINTER_TYPE_OPTIONS,
  AVAILABLE_PRINTER_DEVICES,
  COPY_LABELS,
  PrintPreferences,
  PrinterTypeId,
  PRINT_PREVIEW_EVENT,
  OpenPrintPreviewDetail,
  getStoredPrintPreferences,
  saveStoredPrintPreferences,
  executeHardwarePrint,
  exportElementTextToFormattedPDF,
  openAboutBlankPrintPreview
} from '../../utils/slipPrint';

interface PrintOutPreviewStageProps {
  children: React.ReactNode;
  documentLabel?: string;
  onPreferencesChange?: (prefs: PrintPreferences) => void;
}

/**
 * Menampilkan toolbar pilihan Jenis Kertas (Kertas Biasa A4/A5 vs Kertas Thermal 80mm/58mm),
 * pratinjau ukuran kertas secara langsung, serta tombol Print Preview (about:blank).
 */
export const PrintOutPreviewStage: React.FC<PrintOutPreviewStageProps> = ({
  children,
  documentLabel = 'Dokumen Slip / Kwitansi',
  onPreferencesChange
}) => {
  const [prefs, setPrefs] = useState<PrintPreferences>(() =>
    getStoredPrintPreferences()
  );
  const [previewTarget, setPreviewTarget] =
    useState<OpenPrintPreviewDetail | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [printStatusMessage, setPrintStatusMessage] = useState<string | null>(
    null
  );
  const stageWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    saveStoredPrintPreferences(prefs);
    if (onPreferencesChange) {
      onPreferencesChange(prefs);
    }
  }, [prefs, onPreferencesChange]);

  useEffect(() => {
    const handleOpenPreview = (e: Event) => {
      const customEvent = e as CustomEvent<OpenPrintPreviewDetail>;
      const detail = customEvent.detail;
      if (!detail || !detail.elementId) return;

      const el = document.getElementById(detail.elementId);
      if (!el) return;

      setPreviewHtml(el.outerHTML);
      setPreviewTarget(detail);
      setPrintStatusMessage(null);
    };

    window.addEventListener(PRINT_PREVIEW_EVENT, handleOpenPreview);
    return () => {
      window.removeEventListener(PRINT_PREVIEW_EVENT, handleOpenPreview);
    };
  }, []);

  const activePrinterConfig =
    PRINTER_TYPE_OPTIONS.find((p) => p.id === prefs.printerType) ||
    PRINTER_TYPE_OPTIONS[0];

  const handleSelectDevice = (deviceName: string) => {
    const matched = AVAILABLE_PRINTER_DEVICES.find(
      (d) => d.name === deviceName
    );
    if (matched) {
      const targetConfig = PRINTER_TYPE_OPTIONS.find(
        (p) => p.id === matched.recommendedType
      );
      setPrefs((prev) => ({
        ...prev,
        deviceName,
        printerType: matched.recommendedType,
        orientation: targetConfig?.defaultOrientation || prev.orientation
      }));
    } else {
      setPrefs((prev) => ({ ...prev, deviceName }));
    }
  };

  const handleSelectPrinterType = (printerType: PrinterTypeId) => {
    const targetConfig = PRINTER_TYPE_OPTIONS.find((p) => p.id === printerType);
    const matchedDevice = AVAILABLE_PRINTER_DEVICES.find(
      (d) => d.recommendedType === printerType
    );

    setPrefs((prev) => ({
      ...prev,
      printerType,
      orientation: targetConfig?.defaultOrientation || prev.orientation,
      deviceName: matchedDevice ? matchedDevice.name : prev.deviceName
    }));
  };

  const resolveChildPrintableId = (): string | null => {
    if (previewTarget?.elementId) return previewTarget.elementId;
    if (!stageWrapperRef.current) return null;
    const childWithId = stageWrapperRef.current.querySelector('[id]');
    return childWithId ? childWithId.id : null;
  };

  const handleOpenAboutBlankDirect = () => {
    const targetId = resolveChildPrintableId();
    if (!targetId) return;
    openAboutBlankPrintPreview(targetId, documentLabel, prefs);
  };

  const handleConfirmPrint = () => {
    if (!previewTarget) return;

    if (prefs.deviceName.toLowerCase().includes('pdf')) {
      exportElementTextToFormattedPDF(
        previewTarget.elementId,
        previewTarget.documentTitle,
        prefs
      );
      setPrintStatusMessage(
        `Dokumen berhasil disimpan sebagai PDF (${activePrinterConfig.paperSizeLabel}).`
      );
      return;
    }

    setPrintStatusMessage(
      `Membuka Print Preview (about:blank) untuk ${prefs.deviceName}...`
    );

    executeHardwarePrint(
      previewTarget.elementId,
      previewTarget.documentTitle,
      prefs
    );
  };

  const isThermal = Boolean(activePrinterConfig.isThermal);
  const isThermal58 = prefs.printerType === 'thermal_58';
  const isDotMatrix = Boolean(activePrinterConfig.isDotMatrix);
  const isBW = prefs.colorMode === 'bw' || isDotMatrix || isThermal;

  return (
    <>
      {/* Bar Pemilihan Jenis Kertas (Biasa vs Thermal) & Print Preview about:blank */}
      <div className="px-4 py-2.5 bg-slate-900 text-slate-100 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs print:hidden print-hide">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-300 mr-1">
            Jenis Kertas:
          </span>
          <button
            type="button"
            onClick={() =>
              handleSelectPrinterType(
                prefs.printerType === 'laser_a4' ? 'laser_a4' : 'laser_a5'
              )
            }
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
              !isThermal
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Kertas Biasa (A4 / A5)</span>
          </button>
          <button
            type="button"
            onClick={() =>
              handleSelectPrinterType(
                prefs.printerType === 'thermal_58' ? 'thermal_58' : 'thermal_80'
              )
            }
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
              isThermal
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Kertas Thermal (80mm / 58mm)</span>
          </button>

          <select
            value={prefs.printerType}
            onChange={(e) =>
              handleSelectPrinterType(e.target.value as PrinterTypeId)
            }
            className="bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-2 py-1 text-[11px] font-semibold focus:outline-hidden focus:border-blue-500"
            title="Pilih ukuran kertas spesifik"
          >
            <option value="laser_a5">Kertas Biasa — Kwitansi A5</option>
            <option value="laser_a4">Kertas Biasa — Dokumen A4</option>
            <option value="dot_matrix">Kertas Biasa — Continuous Form NCR</option>
            <option value="thermal_80">Kertas Thermal — Struk Roll 80mm</option>
            <option value="thermal_58">Kertas Thermal — Struk Roll 58mm</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleOpenAboutBlankDirect}
          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-2xs transition"
          title="Buka jendela Print Preview di tab about:blank"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Print Preview (about:blank)</span>
        </button>
      </div>

      {/* Area Pratinjau Slip Sesuai Jenis Kertas (Thermal vs Kertas Biasa) */}
      <div
        ref={stageWrapperRef}
        className={
          isThermal
            ? 'bg-slate-200/80 py-4 px-2 flex justify-center overflow-x-auto'
            : ''
        }
      >
        <div
          className={
            isThermal58
              ? 'w-full max-w-[265px] bg-white shadow-lg border-y-2 border-dashed border-slate-400 text-[10px] leading-snug'
              : isThermal
              ? 'w-full max-w-[340px] bg-white shadow-lg border-y-2 border-dashed border-slate-400 text-[11px] leading-snug'
              : 'w-full'
          }
        >
          {children}
        </div>
      </div>

      {/* Modal Jendela Print Preview (Muncul bila popup about:blank diblokir atau untuk kustomisasi lanjutan) */}
      {previewTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-2 sm:p-4 print:hidden print-hide">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] max-h-[760px] flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* PANEL KIRI: Area Kertas Print Preview */}
            <div className="flex-1 bg-slate-700/90 flex flex-col overflow-hidden">
              {/* Top Bar Print Preview */}
              <div className="px-4 py-2.5 bg-slate-800/95 border-b border-slate-700 flex items-center justify-between text-xs text-slate-200">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-bold truncate">
                    Print Preview — {documentLabel}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-[10px] font-mono">
                    {prefs.copies} Lembar
                  </span>
                </div>

                {/* Zoom Control di Kiri Atas */}
                <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700 rounded-lg px-2 py-1">
                  <button
                    type="button"
                    onClick={() =>
                      setPrefs((prev) => ({
                        ...prev,
                        zoom: Math.max(75, prev.zoom - 10)
                      }))
                    }
                    className="p-0.5 text-slate-300 hover:text-white"
                    title="Perkecil tampilan kertas"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono font-bold text-white min-w-[38px] text-center">
                    {prefs.zoom}%
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPrefs((prev) => ({
                        ...prev,
                        zoom: Math.min(125, prev.zoom + 10)
                      }))
                    }
                    className="p-0.5 text-slate-300 hover:text-white"
                    title="Perbesar tampilan kertas"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrefs((prev) => ({ ...prev, zoom: 100 }))}
                    className="p-0.5 text-slate-400 hover:text-white ml-1"
                    title="Reset 100%"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Kanvas Simulasi Kertas Cetak */}
              <div className="flex-1 overflow-auto p-6 flex flex-col items-center">
                <div className="mb-3 flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-300 font-mono">
                  <span className="px-2 py-0.5 bg-slate-800/90 border border-slate-600 rounded">
                    Kertas: {activePrinterConfig.paperSizeLabel}
                  </span>
                  {!isThermal && (
                    <span className="px-2 py-0.5 bg-slate-800/90 border border-slate-600 rounded uppercase">
                      Orientasi: {prefs.orientation}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-slate-800/90 border border-slate-600 rounded">
                    Warna: {isBW ? 'Hitam Putih (B&W)' : 'Warna'}
                  </span>
                </div>

                {/* Render Lembar Kertas Sesuai Jumlah Rangkap */}
                <div
                  style={{
                    transform:
                      prefs.zoom !== 100
                        ? `scale(${prefs.zoom / 100})`
                        : undefined,
                    transformOrigin: 'top center'
                  }}
                  className="w-full flex flex-col items-center gap-6 transition-transform duration-150"
                >
                  {Array.from({ length: prefs.copies }).map((_, copyIdx) => (
                    <div
                      key={copyIdx}
                      className={`w-full ${
                        prefs.orientation === 'landscape' && !isThermal
                          ? 'max-w-[640px]'
                          : activePrinterConfig.previewMaxWidthClass
                      } relative bg-white text-slate-900 shadow-2xl border ${
                        isDotMatrix
                          ? 'border-slate-400 rounded-none'
                          : isThermal
                          ? 'border-slate-300 rounded-t-xs rounded-b-none border-b-4 border-b-dashed'
                          : 'border-slate-300 rounded-xs'
                      } ${isBW ? 'grayscale contrast-125' : ''}`}
                    >
                      {/* Lubang Traktor Kiri-Kanan untuk Dot Matrix */}
                      {isDotMatrix && (
                        <>
                          <div
                            aria-hidden="true"
                            className="absolute inset-y-0 left-0 w-5 bg-slate-100 border-r border-dashed border-slate-300 flex flex-col justify-around items-center py-3"
                          >
                            {Array.from({ length: 12 }).map((__, i) => (
                              <span
                                key={i}
                                className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-400"
                              />
                            ))}
                          </div>
                          <div
                            aria-hidden="true"
                            className="absolute inset-y-0 right-0 w-5 bg-slate-100 border-l border-dashed border-slate-300 flex flex-col justify-around items-center py-3"
                          >
                            {Array.from({ length: 12 }).map((__, i) => (
                              <span
                                key={i}
                                className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-400"
                              />
                            ))}
                          </div>
                        </>
                      )}

                      {/* Penanda Rangkap */}
                      {prefs.copies > 1 && (
                        <div
                          className={`bg-slate-100 border-b border-dashed border-slate-300 px-4 py-1.5 flex items-center justify-between text-[10px] font-mono font-bold text-slate-700 ${
                            isDotMatrix ? 'mx-5' : ''
                          }`}
                        >
                          <span>
                            {COPY_LABELS[copyIdx] || `LEMBAR ${copyIdx + 1}`}
                          </span>
                          <span>
                            Halaman {copyIdx + 1} dari {prefs.copies}
                          </span>
                        </div>
                      )}

                      {/* Isi Slip */}
                      <div
                        className={`${isDotMatrix ? 'px-5' : ''} ${
                          isThermal ? 'text-[11px] leading-snug' : ''
                        }`}
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PANEL KANAN: Pengaturan Cetak & Pemilihan Printer (Seperti Dialog Print Chrome/OS) */}
            <div className="w-full md:w-80 lg:w-96 bg-white text-slate-800 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200">
              <div className="p-5 space-y-4 overflow-y-auto">
                {/* Header Sidebar */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Printer className="w-4 h-4 text-blue-600" />
                      <span>Pengaturan Cetak</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Total: {prefs.copies} Lembar Kertas Siap Cetak
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewTarget(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 1. Pilih Perangkat Printer Tujuan (Destination) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Tujuan / Pilih Printer</span>
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  </label>
                  <select
                    value={prefs.deviceName}
                    onChange={(e) => handleSelectDevice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-600"
                  >
                    {AVAILABLE_PRINTER_DEVICES.map((dev) => (
                      <option key={dev.name} value={dev.name}>
                        {dev.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Pilih Jenis Printer & Ukuran Kertas */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Jenis Printer &amp; Format Kertas
                  </label>
                  <select
                    value={prefs.printerType}
                    onChange={(e) =>
                      handleSelectPrinterType(e.target.value as PrinterTypeId)
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-blue-600"
                  >
                    {PRINTER_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500">
                    Dimensi: {activePrinterConfig.paperSizeLabel}
                  </p>
                </div>

                {/* 3. Orientasi Kertas (Hanya untuk Non-Thermal) */}
                {!isThermal && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Tata Letak / Orientasi
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPrefs((prev) => ({
                            ...prev,
                            orientation: 'portrait'
                          }))
                        }
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                          prefs.orientation === 'portrait'
                            ? 'bg-blue-50 border-blue-600 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Portrait (Tegak)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPrefs((prev) => ({
                            ...prev,
                            orientation: 'landscape'
                          }))
                        }
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                          prefs.orientation === 'landscape'
                            ? 'bg-blue-50 border-blue-600 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Landscape (Mendatar)
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. Jumlah Rangkap (Copies) & Mode Warna */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Rangkap</span>
                    </label>
                    <select
                      value={prefs.copies}
                      onChange={(e) =>
                        setPrefs((prev) => ({
                          ...prev,
                          copies: (Number(e.target.value) as 1 | 2 | 3) || 1
                        }))
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-600"
                    >
                      <option value={1}>1 Lembar (Asli)</option>
                      <option value={2}>2 Rangkap</option>
                      <option value={3}>3 Rangkap (NCR)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Palette className="w-3.5 h-3.5 text-slate-400" />
                      <span>Warna</span>
                    </label>
                    <select
                      value={prefs.colorMode}
                      onChange={(e) =>
                        setPrefs((prev) => ({
                          ...prev,
                          colorMode: e.target.value === 'bw' ? 'bw' : 'color'
                        }))
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-600"
                    >
                      <option value="color">Berwarna</option>
                      <option value="bw">Hitam Putih</option>
                    </select>
                  </div>
                </div>

                {/* Status Pengiriman Cetak */}
                {printStatusMessage && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2 animate-in fade-in">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="font-semibold leading-relaxed">
                        {printStatusMessage}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        exportElementTextToFormattedPDF(
                          previewTarget.elementId,
                          previewTarget.documentTitle,
                          prefs
                        )
                      }
                      className="w-full py-1.5 px-3 bg-white hover:bg-emerald-100/60 text-emerald-700 border border-emerald-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Unduh Hasil Cetak ({activePrinterConfig.shortLabel})</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Footer Tombol Cetak & Batal */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmPrint}
                    className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Sekarang</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTarget(null)}
                    className="py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition"
                  >
                    Batal
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    exportElementTextToFormattedPDF(
                      previewTarget.elementId,
                      previewTarget.documentTitle,
                      prefs
                    )
                  }
                  className="w-full py-1.5 px-3 text-slate-600 hover:text-blue-700 hover:bg-blue-50/60 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Simpan Cetakan ke PDF ({activePrinterConfig.paperSizeLabel})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
