import React, { useRef } from 'react';
import { UploadCloud, CheckCircle2, Eye, Trash2, FileText } from 'lucide-react';
import { SAMPLE_RECEIPT_IMAGE } from '../../data/initialData';
import { showCenterCrudNotification } from '../../utils/dialogService';

interface ReceiptUploadFieldProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  label?: string;
  helperText?: string;
  required?: boolean;
  allowSample?: boolean;
}

export const ReceiptUploadField: React.FC<ReceiptUploadFieldProps> = ({
  value = '',
  onChange,
  label = 'Upload Foto Nota / Bukti Pembayaran',
  helperText = 'Format JPG, PNG, atau PDF (maks. 5 MB)',
  required = false,
  allowSample = true
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showCenterCrudNotification('Ukuran file maksimal 5 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const isPdf = value.startsWith('data:application/pdf');

  return (
    <div className="p-3 bg-slate-50/90 border border-slate-200 rounded-xl space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-slate-800 font-bold flex items-center gap-1.5 text-xs">
          <UploadCloud className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            {label}
            {required && <span className="text-rose-600 font-bold ml-1">*</span>}
          </span>
        </label>
        {allowSample && (
          <button
            type="button"
            onClick={() => onChange(SAMPLE_RECEIPT_IMAGE)}
            className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer shrink-0"
          >
            Gunakan Contoh Nota
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        <div className="flex items-center gap-3 p-2.5 bg-white border border-emerald-300 rounded-xl">
          {isPdf ? (
            <div className="w-12 h-12 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
          ) : (
            <img
              src={value}
              alt="Pratinjau Nota"
              className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
            />
          )}

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Nota / Bukti Transaksi Terlampir</span>
            </p>
            <p className="text-[10px] text-slate-400">Tersimpan dan siap diaudit tim keuangan.</p>
            <div className="mt-1 flex items-center gap-2.5">
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-slate-600 hover:text-blue-600 font-semibold inline-flex items-center gap-0.5"
              >
                <Eye className="w-3 h-3" /> Lihat
              </a>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-[10px] text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                Ganti Nota
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-[10px] text-rose-600 font-semibold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Hapus
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="p-3.5 border-2 border-dashed border-slate-300 hover:border-blue-400 bg-white hover:bg-blue-50/40 rounded-xl text-center cursor-pointer transition space-y-1"
        >
          <UploadCloud className="w-5 h-5 text-blue-500 mx-auto" />
          <p className="text-xs font-semibold text-slate-700">
            Klik di sini untuk upload foto nota / struk / bukti transfer
          </p>
          <p className="text-[10px] text-slate-400">{helperText}</p>
        </div>
      )}
    </div>
  );
};
