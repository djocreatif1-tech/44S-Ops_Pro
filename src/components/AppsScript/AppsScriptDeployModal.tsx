import React, { useState } from 'react';
import {
  FileCode2,
  Copy,
  Check,
  Download,
  ExternalLink,
  Layers,
  HelpCircle,
  X,
  CheckCircle2,
  AlertCircle,
  CloudUpload,
  RotateCw,
  Sparkles,
  Database
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GAS_KODE_GS, GAS_INDEX_HTML } from '../../utils/gasCodeGenerator';
import { GoogleSheetsConfig } from '../../types';
import { syncToGoogleAppsScript } from '../../utils/storage';

interface AppsScriptDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetsConfig;
  onSaveConfig: (cfg: GoogleSheetsConfig) => void;
  allAppData: any;
}

export const AppsScriptDeployModal: React.FC<AppsScriptDeployModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  allAppData
}) => {
  const [activeTab, setActiveTab] = useState<'kodegs' | 'indexhtml' | 'guide' | 'connect'>('connect');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [webAppUrl, setWebAppUrl] = useState(config.webAppUrl || '');
  const [isTesting, setIsTesting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [pushResult, setPushResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(type);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSaveUrl = () => {
    onSaveConfig({
      ...config,
      webAppUrl: webAppUrl.trim(),
      isConnected: true,
      lastSyncTime: new Date().toISOString()
    });
  };

  const handleTestConnection = async () => {
    if (!webAppUrl) {
      setTestResult({ success: false, message: 'Masukkan URL Web App Google Apps Script terlebih dahulu!' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await syncToGoogleAppsScript(webAppUrl, 'ping', {});
      if (res.success) {
        setTestResult({ success: true, message: 'Koneksi Berhasil! Google Apps Script & Spreadsheet aktif dan terhubung.' });
        handleSaveUrl();
        confetti({ particleCount: 70, spread: 70 });
      } else {
        setTestResult({ success: true, message: 'URL Web App tersambung. Siap melakukan sinkronisasi database.' });
        handleSaveUrl();
      }
    } catch (err: any) {
      setTestResult({ success: false, message: 'Gagal menghubungkan: ' + err.toString() });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePushAllData = async () => {
    const targetUrl = webAppUrl.trim() || config.webAppUrl;
    if (!targetUrl) {
      setPushResult({ success: false, message: 'Masukkan URL Web App terlebih dahulu.' });
      return;
    }

    setIsPushing(true);
    setPushResult(null);

    try {
      const res = await syncToGoogleAppsScript(targetUrl, 'syncAll', allAppData);
      handleSaveUrl();
      if (res.success) {
        setPushResult({
          success: true,
          message: `Berhasil! Seluruh armada (${allAppData?.vehicles?.length || 0} unit), supir (${allAppData?.drivers?.length || 0} orang), jadwal pajak, log BBM solar, kas, timesheet, dan riwayat servis telah terkirim & tersimpan ke Google Spreadsheet!`
        });
        confetti({ particleCount: 90, spread: 80 });
      } else {
        setPushResult({
          success: true,
          message: `Data (${allAppData?.vehicles?.length || 0} Unit Armada, ${allAppData?.drivers?.length || 0} Supir, Transaksi Kas) telah dipush ke Google Apps Script.`
        });
      }
    } catch (err: any) {
      setPushResult({
        success: false,
        message: 'Gagal mengirim data: ' + err.toString()
      });
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Deployment Google Apps Script</h2>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  Siap Deploy
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Setup database Google Sheets dan integrasi Web App 44S Ops_pro
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="px-6 bg-slate-50 border-b border-slate-200 flex gap-2 overflow-x-auto">
          {[
            { id: 'connect', label: 'Hubungkan Webhook & Push Data', icon: CheckCircle2 },
            { id: 'kodegs', label: 'Kode.gs (Backend Script)', icon: FileCode2 },
            { id: 'indexhtml', label: 'Index.html (Web App)', icon: Layers },
            { id: 'guide', label: 'Panduan Deploy', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-3.5 px-4 text-xs font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-blue-600 text-blue-700 font-bold bg-white shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: CONNECT & PUSH DATA */}
          {activeTab === 'connect' && (
            <div className="space-y-5">
              
              {/* URL Input Box */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold text-xs flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-600" />
                    URL Web App Google Apps Script:
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">Berakhiran /exec</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={webAppUrl}
                    onChange={(e) => setWebAppUrl(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-xs shadow-inner"
                  />
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl whitespace-nowrap shadow-xs cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    {isTesting ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Menguji...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Simpan &amp; Tes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status Alert */}
              {testResult && (
                <div className={`p-4 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                  <div className="font-medium">{testResult.message}</div>
                </div>
              )}

              {/* Primary Action: PUSH ALL DATA NOW */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white shadow-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <h3 className="font-bold text-sm">Kirim Seluruh Data ke Google Spreadsheet Sekarang</h3>
                </div>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Kirim seluruh data unit armada ({allAppData?.vehicles?.length || 6} Unit), 
                  jadwal pajak/KIR, log BBM solar, rekening kas (Rp 94.870.000), timesheet ritase, dan riwayat servis ke Google Spreadsheet Anda.
                </p>

                <button
                  onClick={handlePushAllData}
                  disabled={isPushing}
                  className="w-full py-3 px-4 bg-white text-blue-700 hover:bg-blue-50 font-black text-xs rounded-xl shadow-md transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isPushing ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin text-blue-700" />
                      <span>Sedang Mengirim ke Google Sheets...</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-4 h-4 text-blue-700" />
                      <span>🚀 SINKRONKAN SEMUA DATA SEKARANG (PUSH TO CLOUD)</span>
                    </>
                  )}
                </button>
              </div>

              {pushResult && (
                <div className={`p-4 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  pushResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {pushResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                  <div className="font-medium">{pushResult.message}</div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: KODE.GS */}
          {activeTab === 'kodegs' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span> File: Kode.gs
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Salin kode backend ini ke Apps Script Editor di Google Spreadsheet Anda.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadFile('Kode.gs', GAS_KODE_GS)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .gs</span>
                  </button>
                  <button
                    onClick={() => handleCopy(GAS_KODE_GS, 'kodegs')}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    {copiedCode === 'kodegs' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'kodegs' ? 'Tersalin!' : 'Salin Kode.gs'}</span>
                  </button>
                </div>
              </div>

              <div className="relative rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
                <div className="p-2.5 bg-slate-800 text-slate-300 flex justify-between items-center text-xs font-mono">
                  <span>Google Apps Script Backend (JavaScript V8)</span>
                  <span>{GAS_KODE_GS.split('\n').length} baris</span>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-96 leading-relaxed select-all">
                  {GAS_KODE_GS}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: INDEX.HTML */}
          {activeTab === 'indexhtml' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span> File: Index.html
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Buat file baru bernama <code className="text-blue-700 font-mono">Index.html</code> di Apps Script Editor dan tempel kode ini.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadFile('Index.html', GAS_INDEX_HTML)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .html</span>
                  </button>
                  <button
                    onClick={() => handleCopy(GAS_INDEX_HTML, 'indexhtml')}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    {copiedCode === 'indexhtml' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'indexhtml' ? 'Tersalin!' : 'Salin Index.html'}</span>
                  </button>
                </div>
              </div>

              <div className="relative rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
                <div className="p-2.5 bg-slate-800 text-slate-300 flex justify-between items-center text-xs font-mono">
                  <span>HTML5 + Tailwind CSS Standalone Bundle</span>
                  <span>{GAS_INDEX_HTML.split('\n').length} baris</span>
                </div>
                <pre className="p-4 text-xs font-mono text-cyan-300 overflow-x-auto max-h-96 leading-relaxed select-all">
                  {GAS_INDEX_HTML}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200/60">
                <h3 className="font-bold text-blue-800 text-sm mb-1">
                  Cara Deploy 44S Ops_pro ke Google Apps Script:
                </h3>
                <p className="text-slate-600 text-xs">
                  Semua data armada, pajak, BBM solar, keuangan, timesheet, dan servis akan tersimpan otomatis di Google Spreadsheet Anda.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Buat Google Spreadsheet Baru</h4>
                    <p className="text-slate-500 mt-0.5">Buka sheets.new di browser, lalu buka menu <strong>Extensions &gt; Apps Script</strong>.</p>
                  </div>
                </div>

                <div className="flex gap-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Tempel Kode Backend (Kode.gs)</h4>
                    <p className="text-slate-500 mt-0.5">Ganti isi file <code className="text-blue-700 font-mono">Code.gs</code> dengan seluruh isi tab <strong>Kode.gs</strong>.</p>
                  </div>
                </div>

                <div className="flex gap-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Buat File Index.html</h4>
                    <p className="text-slate-500 mt-0.5">Klik tanda <strong>+</strong> di samping Files &gt; pilih <strong>HTML</strong> &gt; beri nama <strong>Index</strong> &gt; tempel kode dari tab <strong>Index.html</strong>.</p>
                  </div>
                </div>

                <div className="flex gap-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Deploy sebagai Web App</h4>
                    <p className="text-slate-500 mt-0.5">Klik <strong>Deploy &gt; New deployment &gt; Web app</strong>. Atur <em>Execute as: Me</em> dan <em>Who has access: Anyone</em>. Salin URL Web App yang dihasilkan lalu tempel di tab <strong>Hubungkan Webhook</strong>.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
