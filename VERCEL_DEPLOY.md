# Panduan Deploy FleetOps Pro ke Vercel (100% Gratis & Otomatis)

Aplikasi **FleetOps Pro** telah dikonfigurasi secara lengkap dan siap dideploy langsung ke **Vercel** dengan fitur *Single Page Application (SPA) routing*, *asset caching*, dan *security headers*.

---

## 📋 Langkah-Langkah Deploy ke Vercel:

### Langkah 1: Push Source Code ke GitHub
Pastikan seluruh source code aplikasi sudah berada di repository GitHub Anda.
```bash
git add .
git commit -m "Siap deploy ke Vercel"
git push origin main
```

---

### Langkah 2: Hubungkan Repository ke Vercel
1. Buka [https://vercel.com](https://vercel.com) dan masuk dengan akun GitHub Anda.
2. Klik tombol **"Add New..."** di pojok kanan atas lalu pilih **"Project"**.
3. Di daftar repository GitHub Anda, cari dan klik tombol **"Import"** pada repository proyek FleetOps Pro ini.

---

### Langkah 3: Konfigurasi Build & Deploy di Vercel
Vercel akan mendeteksi `vercel.json` dan Vite secara otomatis:
- **Framework Preset**: `Vite` (Otomatis)
- **Root Directory**: `./` (Default)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

Klik tombol **"Deploy"**.

Tunggu sekitar 1–2 menit hingga proses build selesai. Anda akan langsung mendapatkan URL publik resmi seperti:  
👉 `https://fleetops-pro-xxxx.vercel.app`

---

## 🌐 Cara Menghubungkan Domain Sendiri (Custom Domain)
Jika Anda memiliki nama domain sendiri (contoh: `operasional.perusahaananda.com` atau `fleet.com`):

1. Masuk ke dashboard proyek di **Vercel** ➜ Masuk ke tab **Settings** ➜ **Domains**.
2. Ketik nama domain / subdomain yang ingin digunakan, lalu klik **Add**.
3. Vercel akan memberikan petunjuk DNS:
   - Untuk Subdomain (contoh: `fleet.perusahaan.com`):  
     Tambahkan **CNAME Record** dengan nilai `cname.vercel-dns.com` di DNS Management domain Anda.
   - Untuk Root Domain (contoh: `perusahaan.com`):  
     Tambahkan **A Record** dengan nilai `76.76.21.21`.
4. Sertifikat SSL (HTTPS) akan otomatis aktif dan gratis.
