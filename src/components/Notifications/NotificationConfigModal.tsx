import React, { useState } from 'react';
import {
  Bell,
  X,
  FileCheck2,
  Wrench,
  Fuel,
  Mail,
  Check,
  Save,
  Sliders,
  Sparkles
} from 'lucide-react';
import { NotificationConfig } from '../../types';

interface NotificationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: NotificationConfig;
  onSaveConfig: (cfg: NotificationConfig) => void;
}

export const NotificationConfigModal: React.FC<NotificationConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig
}) => {
  const [formData, setFormData] = useState<NotificationConfig>({ ...config });
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Konfigurasi Pengingat & Notifikasi</h2>
              <p className="text-xs text-slate-400">Atur ambang batas peringatan pajak, servis rutin & BBM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* SECTION 1: PAJAK & DOKUMEN */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-rose-100 text-rose-600 rounded-md">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Pengingat Pajak STNK & KIR</h3>
                  <p className="text-[11px] text-slate-500">Notifikasi jatuh tempo PKB 1 tahunan, ganti plat & uji KIR Dishub</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableTaxAlerts}
                  onChange={(e) => setFormData({ ...formData, enableTaxAlerts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {formData.enableTaxAlerts && (
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-4">
                <label className="text-xs text-slate-600 font-medium">
                  Peringatkan jika jatuh tempo kurang dari:
                </label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={formData.taxAlertDaysBefore}
                    onChange={(e) => setFormData({ ...formData, taxAlertDaysBefore: Number(e.target.value) })}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-hidden focus:border-blue-500"
                  >
                    <option value={7}>7 Hari (1 Minggu)</option>
                    <option value={14}>14 Hari (2 Minggu)</option>
                    <option value={30}>30 Hari (1 Bulan)</option>
                    <option value={60}>60 Hari (2 Bulan)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: SERVIS RUTIN & PERAWATAN */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-100 text-amber-600 rounded-md">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Pengingat Servis & Ganti Oli</h3>
                  <p className="text-[11px] text-slate-500">Notifikasi jadwal ganti oli mesin, filter solar, dan servis berkala</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableServiceAlerts}
                  onChange={(e) => setFormData({ ...formData, enableServiceAlerts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {formData.enableServiceAlerts && (
              <div className="pt-2 border-t border-slate-200/60 space-y-2.5">
                <div className="flex items-center justify-between gap-4">
                  <label className="text-xs text-slate-600 font-medium">
                    Peringatkan saat sisa Odometer menuju servis:
                  </label>
                  <select
                    value={formData.serviceAlertKmBefore}
                    onChange={(e) => setFormData({ ...formData, serviceAlertKmBefore: Number(e.target.value) })}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-hidden focus:border-blue-500"
                  >
                    <option value={500}>&le; 500 KM</option>
                    <option value={1000}>&le; 1.000 KM (Rekomendasi)</option>
                    <option value={1500}>&le; 1.500 KM</option>
                    <option value={2000}>&le; 2.000 KM</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label className="text-xs text-slate-600 font-medium">
                    Atau jika tanggal servis berikutnya kurang dari:
                  </label>
                  <select
                    value={formData.serviceAlertDaysBefore}
                    onChange={(e) => setFormData({ ...formData, serviceAlertDaysBefore: Number(e.target.value) })}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-hidden focus:border-blue-500"
                  >
                    <option value={7}>7 Hari</option>
                    <option value={14}>14 Hari</option>
                    <option value={30}>30 Hari</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: PENGISIAN BAHAN BAKAR (BBM) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-md">
                  <Fuel className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Pengingat & Anomali BBM Solar</h3>
                  <p className="text-[11px] text-slate-500">Deteksi konsumsi boros & ingatkan unit aktif yang belum isi BBM</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableFuelAlerts}
                  onChange={(e) => setFormData({ ...formData, enableFuelAlerts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {formData.enableFuelAlerts && (
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-4">
                <label className="text-xs text-slate-600 font-medium">
                  Ingatkan unit aktif jika tidak ada isi BBM selama:
                </label>
                <select
                  value={formData.fuelReminderDays}
                  onChange={(e) => setFormData({ ...formData, fuelReminderDays: Number(e.target.value) })}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-hidden focus:border-blue-500"
                >
                  <option value={2}>2 Hari</option>
                  <option value={3}>3 Hari (Standar)</option>
                  <option value={5}>5 Hari</option>
                  <option value={7}>7 Hari</option>
                </select>
              </div>
            )}
          </div>

          {/* SECTION 4: EMAIL NOTIFIKASI OTOMATIS (GOOGLE APPS SCRIPT) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Email Digest Harian (Apps Script Trigger)</h3>
                  <p className="text-[11px] text-slate-500">Kirim rekap peringatan operasional otomatis setiap pagi</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableEmailAlerts}
                  onChange={(e) => setFormData({ ...formData, enableEmailAlerts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {formData.enableEmailAlerts && (
              <div className="pt-2 border-t border-slate-200/60">
                <label className="text-xs text-slate-600 font-medium block mb-1">
                  Email Penerima Notifikasi:
                </label>
                <input
                  type="email"
                  value={formData.recipientEmail}
                  onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                  placeholder="operasional@perusahaan.com"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium rounded-lg text-xs transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{isSaved ? 'Tersimpan!' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
