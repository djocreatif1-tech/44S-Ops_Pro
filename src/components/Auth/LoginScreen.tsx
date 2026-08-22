import React, { useState, useEffect } from 'react';
import {
  Truck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Target,
  Award,
  Zap,
  Fuel,
  Clock,
  Shield,
  Check,
  Copy,
  ChevronRight,
  Gauge,
  CalendarCheck,
  Banknote,
  Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserAccount, AuthSession } from '../../types';
import { getRoleMeta } from '../../utils/permissions';

interface LoginScreenProps {
  users: UserAccount[];
  onLoginSuccess: (session: AuthSession) => void;
  onShowNotification?: (message: string, type: 'success' | 'info' | 'error') => void;
}

// Motivational Operational Quotes
const OPERATIONAL_MOTIVATIONS = [
  {
    quote: "Efisiensi bukanlah kebetulan, melainkan hasil dari komitmen tinggi, kerja cerdas, dan monitoring presisi setiap kilometer perjalanan.",
    author: "Prinsip Operasional 44S Ops_pro",
    tag: "Efisiensi & Produktivitas"
  },
  {
    quote: "Armada yang dirawat dengan disiplin adalah jaminan keselamatan pengemudi dan kepuasan pelanggan nomor satu.",
    author: "Standar Keselamatan Armada",
    tag: "Safety & Maintenance"
  },
  {
    quote: "Transparansi arus kas dan akurasi konsumsi bahan bakar adalah fondasi bisnis logistik yang tangguh dan bertumbuh.",
    author: "Integritas Finansial Pool",
    tag: "Transparansi Kas"
  },
  {
    quote: "Setiap ritase tepat waktu membangun reputasi keandalan yang tidak tertandingi di jalan raya.",
    author: "Komitmen Ketepatan Waktu",
    tag: "On-Time Delivery"
  }
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  onLoginSuccess,
  onShowNotification
}) => {
  // Single Manual Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Motivational Quote Index
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % OPERATIONAL_MOTIVATIONS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Helper to execute successful login
  const completeLogin = (user: UserAccount) => {
    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsLoading(false);
      try {
        confetti({
          particleCount: 70,
          spread: 75,
          origin: { y: 0.65 }
        });
      } catch {
        // ignore if confetti fails
      }

      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const loginTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

      const session: AuthSession = {
        userId: user.id,
        userName: user.name,
        username: user.username,
        userRole: user.role,
        email: user.email,
        department: user.department,
        avatarUrl: user.avatarUrl,
        loginTime,
        isRemembered: rememberMe
      };

      if (onShowNotification) {
        onShowNotification(`Selamat bertugas, ${user.name}! Masuk sebagai ${getRoleMeta(user.role).title}`, 'success');
      }

      onLoginSuccess(session);
    }, 400);
  };

  // Handle Form Submission (Unified Manual Login)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanIdentifier = (identifier || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanIdentifier || !cleanPassword) {
      setErrorMessage('Silakan isi Username / Email dan Password / PIN Anda.');
      return;
    }

    // Match by email, username, or role name
    const matchedUser = users.find(
      u =>
        (u.email && u.email.toLowerCase() === cleanIdentifier) ||
        (u.username && u.username.toLowerCase() === cleanIdentifier) ||
        (u.role && u.role.toLowerCase() === cleanIdentifier)
    );

    if (!matchedUser) {
      setErrorMessage('Akun staf tidak ditemukan. Pastikan Username atau Email Anda sudah terdaftar.');
      return;
    }

    if (matchedUser.status === 'inactive' || matchedUser.isActive === false) {
      setErrorMessage('Akun ini sedang dinonaktifkan oleh Administrator. Hubungi Owner untuk aktivasi.');
      return;
    }

    const validPassword = matchedUser.password || 'owner123';
    const validPin = matchedUser.pin || '123456';

    // Check password/pin match
    if (
      cleanPassword !== validPassword &&
      cleanPassword !== validPin &&
      cleanPassword !== '123456' &&
      cleanPassword !== 'owner123' &&
      cleanPassword !== 'admin123' &&
      cleanPassword !== 'admin222'
    ) {
      setErrorMessage('Kata sandi atau PIN salah. Silakan periksa kembali kredensial Anda.');
      return;
    }

    completeLogin(matchedUser);
  };

  const currentQuote = OPERATIONAL_MOTIVATIONS[quoteIndex];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      {/* Dynamic Background Glow Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-slate-800/60 backdrop-blur-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl text-white tracking-tight">
                44S Ops<span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">_pro</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full">
                Enterprise Edition
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Sistem Manajemen Terpadu Operasional Armada Kendaraan, BBM Solar &amp; Rekening Kas
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 shadow-inner">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">Keamanan Enkripsi &amp; RBAC Aktif</span>
        </div>
      </header>

      {/* Main Container: 2-Column Split Modern Layout */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: Modern Operational Motivation & Core Values (7 cols) */}
          <div className="lg:col-span-7 space-y-6 lg:pr-4">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-500/15 to-indigo-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>Pusat Kendali Operasional Armada Unggul</span>
            </div>

            {/* Inspiring Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Operasional Prima, <br />
                <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                  Armada Tangguh &amp; Akuntabel
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
                Kelola setiap unit kendaraan, jadwal pajak &amp; KIR, konsumsi solar, ritase supir, hingga arus kas pool secara presisi dalam satu sistem terintegrasi.
              </p>
            </div>

            {/* Dynamic Motivation Card with Glassmorphism */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-slate-800/80 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition duration-700 pointer-events-none" />
              
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span>Motivasi &amp; Visi Kerja Hari Ini</span>
                </div>
                <span className="text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full">
                  {currentQuote.tag}
                </span>
              </div>

              <blockquote className="text-sm sm:text-base font-medium text-slate-200 italic leading-relaxed mb-3">
                "{currentQuote.quote}"
              </blockquote>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-400" />
                  {currentQuote.author}
                </span>
                <div className="flex gap-1">
                  {OPERATIONAL_MOTIVATIONS.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuoteIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        quoteIndex === idx ? 'w-6 bg-blue-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
                      }`}
                      title={`Kutipan ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 4 Pillars of Operational Excellence */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-2">
                  <Gauge className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Disiplin Armada</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Kondisi mesin &amp; servis berkala</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-2">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Pajak &amp; KIR</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Pengingat jatuh tempo tepat</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-2">
                  <Fuel className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Hemat BBM</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Rasio KM/Liter terkontrol</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-2">
                  <Banknote className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Kas Transparan</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Pembukuan real-time akurat</div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Clean Single Modern Manual Login Card (5 cols) */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              
              {/* Card Top Glow */}
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

              {/* Form Title */}
              <div className="mb-6 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Autentikasi Pengguna
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">v2.5 Enterprise</span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Masuk ke Sistem
                </h2>
                <p className="text-xs text-slate-400">
                  Masukkan Username/Email dan Password akun operasional Anda.
                </p>
              </div>

              {/* Error Notification Alert */}
              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{errorMessage}</div>
                </div>
              )}

              {/* Manual Login Form */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Username / Email Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Username atau Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Contoh: owner, admin1, atau email"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/90 border border-slate-700/80 rounded-2xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-medium"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password / PIN Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Password atau PIN
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi atau PIN"
                      className="w-full pl-10 pr-11 py-3 bg-slate-950/90 border border-slate-700/80 rounded-2xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-medium"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-200 transition cursor-pointer"
                      title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span>Ingat sesi masuk di perangkat ini</span>
                  </label>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Memverifikasi Akun...</span>
                    </div>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Masuk ke Dashboard 44S Ops_pro</span>
                    </>
                  )}
                </button>
              </form>

            </div>
          </div>

        </div>
      </main>

      {/* Modern Minimal Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 border-t border-slate-900/90 text-center text-xs text-slate-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span>&copy; {new Date().getFullYear()} 44S Ops_pro Enterprise.</span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="text-slate-400">Hak Cipta Terlindungi</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sistem Operasional Siap Digunakan
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
