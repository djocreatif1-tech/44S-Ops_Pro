import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Truck,
  Crown,
  Briefcase,
  UserCheck,
  LogOut,
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { AuthSession, UserAccount } from '../../types';
import { getRoleMeta } from '../../utils/permissions';

interface LockScreenProps {
  session: AuthSession;
  currentUser?: UserAccount;
  onUnlock: () => void;
  onLogout: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  session,
  currentUser,
  onUnlock,
  onLogout
}) => {
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const roleMeta = getRoleMeta(session.userRole);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return Crown;
      case 'admin1': return Briefcase;
      case 'admin2': return Truck;
      default: return UserCheck;
    }
  };

  const RoleIcon = getRoleIcon(session.userRole);

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanInput = (pin || '').trim();
    if (!cleanInput) {
      setErrorMessage('Silakan masukkan PIN atau Password akun Anda untuk membuka kunci.');
      return;
    }

    const validPin = String(currentUser?.pin || '').trim();
    const validPass = String(currentUser?.password || '').trim();

    if ((validPin !== '' && cleanInput === validPin) || (validPass !== '' && cleanInput === validPass)) {
      onUnlock();
    } else {
      setErrorMessage('PIN atau Password yang Anda masukkan tidak sesuai.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95">
        {/* User Card Header */}
        <div className="space-y-3">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-xl shadow-blue-500/20 mx-auto">
              {(session?.userName || 'U').charAt(0)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-amber-400">
              <RoleIcon className="w-4 h-4" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{session.userName}</h2>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 bg-blue-500/10 text-blue-300 border border-blue-400/20">
              <RoleIcon className="w-3.5 h-3.5" />
              <span>{roleMeta.title}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">{session.department || 'Operasional Fleet'}</div>
          </div>
        </div>

        {/* Lock Notice */}
        <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 text-xs text-slate-300 flex items-center justify-center gap-2">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Sesi kerja terkunci untuk keamanan operasional.</span>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Unlock */}
        <form onSubmit={handleUnlockSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 text-left">
              Masukkan PIN atau Password:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Masukkan PIN / Password Akun"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-mono tracking-widest focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Buka Kunci Layar</span>
            </button>
          </div>
        </form>

        {/* Logout / Switch link */}
        <div className="pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center justify-center gap-1.5 mx-auto transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Bukan Anda? Keluar dan Ganti Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
};
