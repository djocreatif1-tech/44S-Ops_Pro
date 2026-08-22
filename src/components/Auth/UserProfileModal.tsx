import React, { useState } from 'react';
import {
  X,
  User,
  ShieldCheck,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Crown,
  Briefcase,
  Truck,
  UserCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserAccount, AuthSession } from '../../types';
import { getRoleMeta, getRolePermissions } from '../../utils/permissions';
import { formatDateIndo } from '../../utils/formatters';

interface UserProfileModalProps {
  session: AuthSession;
  userAccount?: UserAccount;
  onClose: () => void;
  onUpdateAccount: (updated: UserAccount) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  session,
  userAccount,
  onClose,
  onUpdateAccount,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'permissions'>('profile');

  // Form State
  const [name, setName] = useState(userAccount?.name || session.userName);
  const [phone, setPhone] = useState(userAccount?.phone || '');
  const [department, setDepartment] = useState(userAccount?.department || session.department || '');

  // Password / PIN
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [newPin, setNewPin] = useState(userAccount?.pin || '123456');
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const roleMeta = getRoleMeta(session.userRole);
  const permissions = getRolePermissions(session.userRole);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return Crown;
      case 'admin1': return Briefcase;
      case 'admin2': return Truck;
      default: return UserCheck;
    }
  };

  const RoleIcon = getRoleIcon(session.userRole);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAccount) return;

    const updated: UserAccount = {
      ...userAccount,
      name: name.trim(),
      phone: phone.trim(),
      department: department.trim()
    };

    onUpdateAccount(updated);
    onShowToast('Profil pengguna berhasil diperbarui!');
    onClose();
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!userAccount) return;

    if (newPass) {
      if (newPass.length < 5) {
        setErrorMsg('Password baru minimal 5 karakter.');
        return;
      }
      if (newPass !== confirmPass) {
        setErrorMsg('Konfirmasi password baru tidak cocok.');
        return;
      }
    }

    if (newPin && newPin.length < 4) {
      setErrorMsg('PIN minimal 4 - 6 digit angka.');
      return;
    }

    const updated: UserAccount = {
      ...userAccount,
      password: newPass ? newPass : userAccount.password,
      pin: newPin ? newPin : userAccount.pin
    };

    onUpdateAccount(updated);
    onShowToast('Kredensial keamanan (Password/PIN) berhasil diperbarui!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center font-bold text-2xl shadow-inner">
              {(session?.userName || 'U').charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">{session.userName}</h3>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${roleMeta.badgeClass}`}>
                  {roleMeta.shortLabel}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">{session.email}</p>
              <div className="text-[11px] text-blue-200 mt-1 flex items-center gap-1.5">
                <RoleIcon className="w-3.5 h-3.5 text-amber-300" />
                <span>{roleMeta.title}</span>
              </div>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex gap-2 mt-6 pt-4 border-t border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profil Pengguna</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                activeTab === 'security'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Keamanan &amp; PIN</span>
            </button>

            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                activeTab === 'permissions'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Hak Akses</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: Profile Info */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Departemen / Divisi</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Operasional & Keuangan"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Terdaftar (Akun)</label>
                  <input
                    type="text"
                    disabled
                    value={session.email}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-[11px] text-slate-500">
                <div className="flex justify-between">
                  <span>Sesi Masuk Terakhir:</span>
                  <span className="font-semibold text-slate-700">{session.loginTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tingkat Akses (RBAC):</span>
                  <span className="font-semibold text-blue-600">{roleMeta.title}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Security & Password */}
          {activeTab === 'security' && (
            <form onSubmit={handleSaveSecurity} className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-blue-800 text-xs">
                Perbarui Password atau PIN 6-digit untuk otorisasi transaksi dan membuka kunci layar.
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PIN Akses Cepat (4 - 6 Digit)</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Contoh: 123456"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono tracking-widest focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Digunakan untuk login cepat dan buka kunci layar.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Password Baru (Opsional)</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="Minimal 5 karakter"
                        className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                      >
                        {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ulangi Password Baru</label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Konfirmasi password"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-sm"
                >
                  Simpan Kredensial
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Role Capabilities */}
          {activeTab === 'permissions' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <RoleIcon className="w-4 h-4 text-blue-600" />
                  <span>{roleMeta.title}</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{roleMeta.description}</p>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-700 text-xs">Daftar Modul yang Diizinkan:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {roleMeta.capabilities.map((cap, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2 text-emerald-900 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {roleMeta.restrictions.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="font-bold text-slate-700 text-xs">Batasan Operasional:</div>
                  <div className="space-y-1.5">
                    {roleMeta.restrictions.map((res, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{res}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
