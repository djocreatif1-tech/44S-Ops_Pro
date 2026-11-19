import React, { useState } from 'react';
import {
  X, Copy, Check, FileCode, Sparkles, BookOpen,
  Cloud, RefreshCw, AlertCircle, CheckCircle2,
  Send, Database, ArrowUpRight, Download, ShieldCheck, Zap, Smartphone
} from 'lucide-react';
import { GAS_KODE_GS, GAS_SETUP_GS, getCompiledGasIndexHtml } from '../../utils/gasCodeGenerator';
import { GoogleSheetsConfig } from '../../types';
import { syncToGoogleAppsScript, fetchAppDataFromGAS } from '../../utils/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config?: GoogleSheetsConfig;
  gasConfig?: GoogleSheetsConfig;
  onSaveConfig: (config: GoogleSheetsConfig) => void;
  allAppData: any;
  onRestoreFromCloud?: (cloudData: any) => void;
}

export const AppsScriptDeployModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  gasConfig,
  onSaveConfig,
  allAppData,
  onRestoreFromCloud
}) => {
  const activeConfig: GoogleSheetsConfig = config || gasConfig || {
    webAppUrl: '',
    spreadsheetId: '',
    autoSync: true,
    isConnected: false
  };

  const [activeTab, setActiveTab] = useState<'kode' | 'setup' | 'html' | 'connect' | 'guide'>('kode');
  const [copiedKode, setCopiedKode] = useState(false);
  const [copiedSetup, setCopiedSetup] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  const [urlInput, setUrlInput] = useState(activeConfig.webAppUrl || '');
  const [spreadsheetInput, setSpreadsheetInput] = useState(activeConfig.spreadsheetId || '');
  const [autoSync, setAutoSync] = useState(activeConfig.autoSync ?? true);

  const [isTesting, setIsTesting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  const fullIndexHtml = getCompiledGasIndexHtml();

  const handleCopy = (text: string, type: 'kode' | 'setup' | 'html') => {
    navigator.clipboard.writeText(text);
    if (type === 'kode') {
      setCopiedKode(true);
      setTimeout(() => setCopiedKode(false), 2000);
    } else if (type === 'setup') {
      setCopiedSetup(true);
      setTimeout(() => setCopiedSetup(false), 2000);
    } else {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    }
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllFiles = () => {
    handleDownloadFile('Kode.gs', GAS_KODE_GS);
    setTimeout(() => handleDownloadFile('Setup.gs', GAS_SETUP_GS), 200);
    setTimeout(() => handleDownloadFile('Index.html', fullIndexHtml), 400);
    setStatusMsg({
      type: 'success',
      text: 'Ketiga file (Kode.gs, Setup.gs, Index.html Full React Bundle) berhasil diunduh!'
    });
  };

  const handleSaveAndTest = async () => {
    if (!urlInput.trim().startsWith('https://script.google.com/macros/s/')) {
      setStatusMsg({
        type: 'error',
        text: 'URL Web App tidak valid! Pastikan URL diawali dengan "https://script.google.com/macros/s/..." dan diakhiri "/exec"'
      });
      return;
    }

    setIsTesting(true);
    setStatusMsg({ type: 'info', text: 'Menghubungi Server Google Apps Script & menginisialisasi 16 Sheet...' });

    const res = await syncToGoogleAppsScript(urlInput.trim(), 'initDatabase', {});
    setIsTesting(false);

    if (res.success) {
      const updated: GoogleSheetsConfig = {
        ...activeConfig,
        webAppUrl: urlInput.trim(),
        spreadsheetId: spreadsheetInput.trim(),
        isConnected: true,
        autoSync,
        lastSyncTime: new Date().toLocaleString('id-ID')
      };
      onSaveConfig(updated);
      setStatusMsg({
        type: 'success',
        text: 'Koneksi Berhasil! Web App Google Apps Script terhubung & siap sinkronisasi cepat.'
      });
    } else {
      setStatusMsg({
        type: 'error',
        text: `Gagal terhubung: ${res.message}. Pastikan memilih "Anyone" (Siapa saja) pada bagian Who has access saat Deploy.`
      });
    }
  };

  const handlePushToSheets = async () => {
    if (!urlInput.trim()) {
      setStatusMsg({ type: 'error', text: 'Masukkan URL Web App Google Apps Script terlebih dahulu.' });
      return;
    }

    setIsPushing(true);
    setStatusMsg({
      type: 'info',
      text: 'Mengirim seluruh 16 modul data ke Google Spreadsheet (Mode Batch setValues Cepat)...'
    });

    const res = await syncToGoogleAppsScript(urlInput.trim(), 'bulkSync', allAppData);
    setIsPushing(false);

    if (res.success) {
      const now = new Date().toLocaleString('id-ID');
      onSaveConfig({
        ...activeConfig,
        webAppUrl: urlInput.trim(),
        spreadsheetId: spreadsheetInput.trim(),
        isConnected: true,
        autoSync,
        lastSyncTime: now
      });
      setStatusMsg({
        type: 'success',
        text: `Sinkronisasi Batch Sukses (${now})! Seluruh 16 Sheet telah diperbarui & sel kosong dipangkas otomatis.`
      });
    } else {
      setStatusMsg({
        type: 'error',
        text: 'Gagal melakukan sinkronisasi data. Periksa kembali URL Web App Anda.'
      });
    }
  };

  const handlePullFromSheets = async () => {
    if (!urlInput.trim()) {
      setStatusMsg({ type: 'error', text: 'Masukkan URL Web App terlebih dahulu.' });
      return;
    }

    setIsPulling(true);
    setStatusMsg({ type: 'info', text: 'Mengambil data terbaru dari Google Spreadsheet (Fast Cache)...' });

    const res = await fetchAppDataFromGAS(urlInput.trim());
    setIsPulling(false);

    if (res.success && res.data) {
      if (onRestoreFromCloud) {
        onRestoreFromCloud(res.data);
      }
      const now = new Date().toLocaleString('id-ID');
      onSaveConfig({
        ...activeConfig,
        webAppUrl: urlInput.trim(),
        spreadsheetId: spreadsheetInput.trim(),
        isConnected: true,
        autoSync,
        lastSyncTime: now
      });
      setStatusMsg({
        type: 'success',
        text: `Data berhasil ditarik dari Google Spreadsheet pada ${now}!`
      });
    } else {
      setStatusMsg({
        type: 'error',
        text: res.message || 'Gagal menarik data dari Spreadsheet atau Spreadsheet masih kosong.'
      });
    }
  };

  const handlePurgeDummyInSheets = async () => {
    setIsTesting(true);
    setStatusMsg({ type: 'info', text: 'Membersihkan seluruh baris data dummy dari Google Spreadsheet...' });
    const res = await syncToGoogleAppsScript(urlInput.trim() || activeConfig.webAppUrl, 'purgeDummyData', {});
    setIsTesting(false);
    if (res.success) {
      setStatusMsg({
        type: 'success',
        text: res.message || 'Seluruh data dummy di Google Spreadsheet telah dihapus bersih!'
      });
    } else {
      setStatusMsg({
        type: 'error',
        text: res.message || 'Pastikan URL Web App telah terhubung.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base">Google Apps Script Hub (Khusus Owner)</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Owner Only
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Hemat DB &amp; Anti-Lemot
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
                Paket Lengkap 3 File: <code className="text-blue-300 font-mono">Kode.gs</code>, <code className="text-emerald-300 font-mono">Setup.gs</code>, dan <code className="text-amber-300 font-mono">Index.html</code> (Mobile-Friendly)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAllFiles}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              title="Download Kode.gs, Setup.gs, dan Index.html sekaligus"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh 3 File (.gs &amp; .html)</span>
              <span className="sm:hidden">Unduh 3 File</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Mobile Scrollable) */}
        <div className="px-3 sm:px-6 pt-2.5 bg-slate-100 border-b border-slate-200 flex gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('kode')}
            className={`px-3 sm:px-4 py-2 rounded-t-xl font-bold text-xs flex items-center gap-1.5 border-t border-x transition whitespace-nowrap cursor-pointer ${
              activeTab === 'kode'
                ? 'bg-white text-blue-600 border-slate-200 shadow-2xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>1. Kode.gs (Backend Cepat)</span>
          </button>

          <button
            onClick={() => setActiveTab('setup')}
            className={`px-3 sm:px-4 py-2 rounded-t-xl font-bold text-xs flex items-center gap-1.5 border-t border-x transition whitespace-nowrap cursor-pointer ${
              activeTab === 'setup'
                ? 'bg-white text-emerald-700 border-slate-200 shadow-2xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>2. Setup.gs (Inisialisasi &amp; Hemat DB)</span>
          </button>

          <button
            onClick={() => setActiveTab('html')}
            className={`px-3 sm:px-4 py-2 rounded-t-xl font-bold text-xs flex items-center gap-1.5 border-t border-x transition whitespace-nowrap cursor-pointer ${
              activeTab === 'html'
                ? 'bg-white text-amber-700 border-slate-200 shadow-2xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>3. Index.html (Mobile Web App)</span>
          </button>

          <button
            onClick={() => setActiveTab('connect')}
            className={`px-3 sm:px-4 py-2 rounded-t-xl font-bold text-xs flex items-center gap-1.5 border-t border-x transition whitespace-nowrap cursor-pointer ${
              activeTab === 'connect'
                ? 'bg-white text-indigo-600 border-slate-200 shadow-2xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>4. Hubungkan &amp; Sync Cloud</span>
            {activeConfig.isConnected && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 sm:px-4 py-2 rounded-t-xl font-bold text-xs flex items-center gap-1.5 border-t border-x transition whitespace-nowrap cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-white text-slate-900 border-slate-200 shadow-2xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>5. Panduan Deploy</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Status Banner */}
          {statusMsg && (
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : statusMsg.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : statusMsg.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* TAB 1: KODE.GS */}
          {activeTab === 'kode' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-blue-50/70 border border-blue-100 p-3.5 rounded-xl">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-blue-600" />
                    File 1: <code className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Kode.gs</code> — Mesin Utama Anti-Lemot
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                    Dilengkapi <strong>Batch setValues()</strong> (100x lebih cepat dari appendRow), <strong>CacheService 60s</strong>, kompresi otomatis lampiran Base64, dan LockService multi-user.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownloadFile('Kode.gs', GAS_KODE_GS)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Kode.gs</span>
                  </button>
                  <button
                    onClick={() => handleCopy(GAS_KODE_GS, 'kode')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition shadow-xs cursor-pointer ${
                      copiedKode ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {copiedKode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKode ? 'Kode.gs Tersalin!' : 'Salin Kode.gs'}</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-[380px] leading-relaxed border border-slate-800">
                  <code>{GAS_KODE_GS}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: SETUP.GS */}
          {activeTab === 'setup' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-xl">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-emerald-600" />
                    File 2: <code className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Setup.gs</code> — Inisialisasi 16 Sheet &amp; Penghemat Sel Database
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                    Membuat 16 Sheet terpisah namun terintegrasi, memangkas ribuan baris/kolom kosong (hemat kuota 10 juta sel Google Sheets), mengisi Seed Data awal, dan membuat menu <strong>🚛 44S Ops_pro Admin</strong>.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownloadFile('Setup.gs', GAS_SETUP_GS)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Setup.gs</span>
                  </button>
                  <button
                    onClick={() => handleCopy(GAS_SETUP_GS, 'setup')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition shadow-xs cursor-pointer ${
                      copiedSetup ? 'bg-emerald-600 text-white' : 'bg-emerald-700 text-white hover:bg-emerald-800'
                    }`}
                  >
                    {copiedSetup ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSetup ? 'Setup.gs Tersalin!' : 'Salin Setup.gs'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-800">1. setupDatabase()</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Inisialisasi 16 tabel modul bersih tanpa data dummy &amp; menghapus baris dummy lama.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-rose-700">2. purgeDummyDataFromSpreadsheet()</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Menghapus seluruh data dummy dari Spreadsheet tanpa menyentuh data riil Anda.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-emerald-700">3. optimizeAllDatabaseSheets()</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Memangkas sel kosong tak terpakai agar file Google Sheets tetap ringan &amp; bebas lemot.</p>
                </div>
              </div>

              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-[340px] leading-relaxed border border-slate-800">
                  <code>{GAS_SETUP_GS}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: INDEX.HTML */}
          {activeTab === 'html' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-amber-50/80 border border-amber-200 p-3.5 rounded-xl">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-amber-600" />
                    File 3: <code className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">Index.html</code> — Full React Web App Bundle (100% Sama Persis)
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                    Berisi kompilasi penuh aplikasi React <strong>44S Ops_pro</strong> (Sidebar Kiri, Header, 4 Rekening Kas, 16 Modul Lengkap, Cetak Slip/Kwitansi, Analitik, &amp; Tombol Apps Script Khusus Owner). Saat di-deploy di Google Apps Script, tampilannya <strong>100% sama persis</strong> dengan aplikasi web ini.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownloadFile('Index.html', fullIndexHtml)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Index.html</span>
                  </button>
                  <button
                    onClick={() => handleCopy(fullIndexHtml, 'html')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition shadow-xs cursor-pointer ${
                      copiedHtml ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {copiedHtml ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedHtml ? 'Index.html Tersalin!' : 'Salin Index.html'}</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-[380px] leading-relaxed border border-slate-800">
                  <code>
                    {fullIndexHtml.length > 12000
                      ? `${fullIndexHtml.slice(0, 8000)}\n\n/* ... [KOMPILASI PENUH REACT APP + TAILWIND CSS (${Math.round(fullIndexHtml.length / 1024)} KB) — KLIK "SALIN INDEX.HTML" ATAU "UNDUH INDEX.HTML" UNTUK MENYALIN SELURUH KODE] ... */\n\n${fullIndexHtml.slice(-2500)}`
                      : fullIndexHtml}
                  </code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: CONNECT & SYNC */}
          {activeTab === 'connect' && (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-600 text-white">
                      Real-Time Google Sheets Sync
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-1.5">
                      Hubungkan URL Web App Google Apps Script Anda
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Setelah men-deploy <code className="font-mono font-bold">Kode.gs</code>, <code className="font-mono font-bold">Setup.gs</code>, dan <code className="font-mono font-bold">Index.html</code> sebagai Web App, tempelkan URL <code className="bg-white px-1.5 py-0.5 rounded border text-blue-700 font-mono">https://script.google.com/macros/s/.../exec</code> di bawah ini.
                    </p>
                  </div>
                  <Database className="w-8 h-8 text-blue-600 shrink-0 hidden sm:block" />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      URL Web App Google Apps Script (Wajib diakhiri <code className="text-blue-600">/exec</code>) *
                    </label>
                    <input
                      type="url"
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      URL / ID Google Spreadsheet (Opsional - Untuk Tombol Pintasan Buka Sheet)
                    </label>
                    <input
                      type="text"
                      placeholder="https://docs.google.com/spreadsheets/d/1abc.../edit"
                      value={spreadsheetInput}
                      onChange={e => setSpreadsheetInput(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoSync}
                        onChange={e => setAutoSync(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        Aktifkan Auto-Sync Hemat Bandwidth saat ada perubahan data
                      </span>
                    </label>

                    {activeConfig.lastSyncTime && (
                      <span className="text-[11px] text-slate-500">
                        Terakhir sinkron: <strong className="text-slate-700">{activeConfig.lastSyncTime}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-blue-200/60">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleSaveAndTest}
                      disabled={isTesting}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Menguji Koneksi...' : 'Simpan & Uji Koneksi'}</span>
                    </button>

                    <button
                      onClick={handlePushToSheets}
                      disabled={isPushing || !urlInput.trim()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      <Send className={`w-3.5 h-3.5 ${isPushing ? 'animate-pulse' : ''}`} />
                      <span>{isPushing ? 'Mengirim Batch...' : 'Push 16 Modul ke Spreadsheet'}</span>
                    </button>

                    <button
                      onClick={handlePullFromSheets}
                      disabled={isPulling || !urlInput.trim()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>{isPulling ? 'Menarik Data...' : 'Tarik Data dari Spreadsheet'}</span>
                    </button>

                    <button
                      onClick={handlePurgeDummyInSheets}
                      disabled={isTesting}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      <span>Hapus Data Dummy di Spreadsheet</span>
                    </button>
                  </div>

                  {spreadsheetInput && spreadsheetInput.startsWith('http') && (
                    <a
                      href={spreadsheetInput}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition"
                    >
                      <span>Buka Spreadsheet</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-700">Langkah 1</span>
                  <h5 className="font-bold text-sm text-slate-900">Buka Google Sheets &amp; Editor Apps Script</h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Buat Google Spreadsheet baru, lalu klik menu <strong>Extensions (Ekstensi) &rarr; Apps Script</strong> di bagian atas.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">Langkah 2</span>
                  <h5 className="font-bold text-sm text-slate-900">Pasang Kode.gs, Setup.gs, dan Index.html</h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    1. Tempelkan isi <strong>Kode.gs</strong> ke file <code className="bg-slate-200 px-1 rounded">Kode.gs</code>.<br />
                    2. Klik <strong>(+) &rarr; Script</strong>, beri nama <code className="bg-slate-200 px-1 rounded">Setup</code>, lalu tempelkan <strong>Setup.gs</strong>.<br />
                    3. Klik <strong>(+) &rarr; HTML</strong>, beri nama <code className="bg-slate-200 px-1 rounded">Index</code>, lalu tempelkan <strong>Index.html</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">Langkah 3</span>
                  <h5 className="font-bold text-sm text-slate-900">Jalankan Fungsi setupDatabase() di Setup.gs</h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Pilih file <strong>Setup.gs</strong>, pilih fungsi <code className="bg-slate-200 px-1 rounded">setupDatabase</code> di toolbar atas, lalu klik <strong>Run (Jalankan)</strong>. Seluruh 16 Sheet akan dibuat dan dipangkas sel kosongnya otomatis.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-700">Langkah 4</span>
                  <h5 className="font-bold text-sm text-slate-900">Deploy Sebagai Web App</h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Klik <strong>Deploy &rarr; New deployment &rarr; Web app</strong>. Pilih <em>Execute as: Me</em> dan <em>Who has access: Anyone</em>. Salin URL <code className="bg-slate-200 px-1 rounded">/exec</code> ke tab <strong>Hubungkan &amp; Sync Cloud</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Akses menu Apps Script dikunci eksklusif hanya untuk role <strong>Owner</strong>.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
          >
            Selesai &amp; Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
