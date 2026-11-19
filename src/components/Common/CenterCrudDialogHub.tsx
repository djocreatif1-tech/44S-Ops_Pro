import React, { useState, useEffect } from 'react';
import {
  Trash2,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  RefreshCw,
  AlertCircle,
  Sparkles,
  X,
  ShieldAlert
} from 'lucide-react';
import {
  CenterConfirmState,
  CenterCrudNotifState,
  subscribeCenterConfirm,
  subscribeCenterNotif,
  closeCenterCrudNotification
} from '../../utils/dialogService';

export const CenterCrudDialogHub: React.FC = () => {
  const [confirmState, setConfirmState] = useState<CenterConfirmState | null>(null);
  const [notifState, setNotifState] = useState<CenterCrudNotifState | null>(null);

  useEffect(() => {
    const unsubConfirm = subscribeCenterConfirm((next) => {
      setConfirmState(next);
    });
    const unsubNotif = subscribeCenterNotif((next) => {
      setNotifState(next);
    });
    return () => {
      unsubConfirm();
      unsubNotif();
    };
  }, []);

  useEffect(() => {
    if (!notifState || !notifState.isOpen) return;
    const timer = setTimeout(() => {
      closeCenterCrudNotification();
    }, notifState.autoCloseMs || 2400);
    return () => clearTimeout(timer);
  }, [notifState]);

  const getNotifTheme = (category: CenterCrudNotifState['category']) => {
    switch (category) {
      case 'create':
        return {
          barClass: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600',
          iconWrapClass: 'bg-emerald-50 border-emerald-200 text-emerald-600 ring-8 ring-emerald-50/70',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
          icon: <PlusCircle className="w-8 h-8 text-emerald-600" />
        };
      case 'update':
        return {
          barClass: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700',
          iconWrapClass: 'bg-blue-50 border-blue-200 text-blue-600 ring-8 ring-blue-50/70',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
          buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20',
          icon: <RefreshCw className="w-8 h-8 text-blue-600" />
        };
      case 'delete':
        return {
          barClass: 'bg-gradient-to-r from-rose-600 via-red-600 to-amber-600',
          iconWrapClass: 'bg-rose-50 border-rose-200 text-rose-600 ring-8 ring-rose-50/70',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
          buttonClass: 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20',
          icon: <Trash2 className="w-8 h-8 text-rose-600" />
        };
      case 'error':
      case 'warning':
        return {
          barClass: 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700',
          iconWrapClass: 'bg-rose-50 border-rose-200 text-rose-600 ring-8 ring-rose-50/70',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
          buttonClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20',
          icon: <AlertCircle className="w-8 h-8 text-rose-600" />
        };
      case 'info':
        return {
          barClass: 'bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600',
          iconWrapClass: 'bg-indigo-50 border-indigo-200 text-indigo-600 ring-8 ring-indigo-50/70',
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          buttonClass: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20',
          icon: <Sparkles className="w-8 h-8 text-indigo-600" />
        };
      default:
        return {
          barClass: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600',
          iconWrapClass: 'bg-emerald-50 border-emerald-200 text-emerald-600 ring-8 ring-emerald-50/70',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
          icon: <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        };
    }
  };

  return (
    <>
      {/* 1. MODAL KONFIRMASI HAPUS DATA DI TENGAH APLIKASI */}
      {confirmState && confirmState.isOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Top Accent Gradient Strip */}
            <div className="h-2 w-full bg-gradient-to-r from-rose-600 via-red-500 to-amber-500" />

            <div className="p-6 sm:p-7 text-center space-y-4">
              {/* Glowing Centered Trash/Warning Icon */}
              <div className="relative mx-auto w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 ring-8 ring-rose-50/60 shadow-2xs">
                <Trash2 className="w-8 h-8 text-rose-600" />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow ring-2 ring-white">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Pill Badge */}
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  <ShieldAlert className="w-3 h-3" />
                  Konfirmasi Penghapusan Data
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-2.5 leading-snug">
                  {confirmState.title}
                </h3>
              </div>

              {/* Target Item Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-slate-800 font-bold text-xs sm:text-sm leading-relaxed break-words">
                {confirmState.message}
              </div>

              {/* Details Warning */}
              {confirmState.details && (
                <p className="text-xs text-slate-500 leading-relaxed">
                  {confirmState.details}
                </p>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => confirmState.onResolve?.(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition active:scale-98 cursor-pointer"
                >
                  {confirmState.cancelLabel || 'Batal'}
                </button>
                <button
                  type="button"
                  onClick={() => confirmState.onResolve?.(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-600/25 flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                  <span>{confirmState.confirmLabel || 'Ya, Hapus Data'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MODAL NOTIFIKASI CRUD DI TENGAH APLIKASI (CREATE / UPDATE / DELETE / VALIDASI) */}
      {notifState && notifState.isOpen && (
        <div
          className="fixed inset-0 z-[115] flex items-center justify-center bg-slate-900/45 backdrop-blur-[2px] p-4 animate-in fade-in duration-150"
          onClick={() => closeCenterCrudNotification()}
        >
          {(() => {
            const theme = getNotifTheme(notifState.category);
            return (
              <div
                className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-150 text-center relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top Color Bar */}
                <div className={`h-2 w-full ${theme.barClass}`} />

                {/* Close X Button */}
                <button
                  type="button"
                  onClick={() => closeCenterCrudNotification()}
                  className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  aria-label="Tutup Notifikasi"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="p-6 sm:p-7 space-y-3.5">
                  {/* Centered Icon */}
                  <div className={`mx-auto w-16 h-16 rounded-2xl border flex items-center justify-center shadow-2xs ${theme.iconWrapClass}`}>
                    {theme.icon}
                  </div>

                  {/* CRUD Badge & Title */}
                  <div>
                    <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full border ${theme.badgeClass}`}>
                      {notifState.badgeText}
                    </span>
                    <h4 className="text-base sm:text-lg font-extrabold text-slate-900 mt-2">
                      {notifState.title}
                    </h4>
                  </div>

                  {/* CRUD Message */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">
                    {notifState.message}
                  </div>

                  {/* Centered Confirm Button */}
                  <div className="pt-1.5">
                    <button
                      type="button"
                      onClick={() => closeCenterCrudNotification()}
                      className={`w-full py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm transition shadow-md active:scale-98 cursor-pointer ${theme.buttonClass}`}
                    >
                      OK, Mengerti
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
};
