// ============================================================================
// GLOBAL CENTERED CRUD CONFIRMATION & NOTIFICATION DIALOG SERVICE
// Menggantikan window.confirm & window.alert bawaan browser dengan Modal
// Interaktif Modern di Tengah Aplikasi untuk seluruh operasi CRUD.
// ============================================================================

export type CrudNotifCategory = 'create' | 'update' | 'delete' | 'error' | 'warning' | 'info' | 'success';

export interface CenterConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onResolve?: (confirmed: boolean) => void;
}

export interface CenterCrudNotifState {
  id: number;
  isOpen: boolean;
  category: CrudNotifCategory;
  badgeText: string;
  title: string;
  message: string;
  autoCloseMs?: number;
}

type ConfirmListener = (state: CenterConfirmState | null) => void;
type NotifListener = (state: CenterCrudNotifState | null) => void;

let confirmListeners: ConfirmListener[] = [];
let notifListeners: NotifListener[] = [];

export function subscribeCenterConfirm(listener: ConfirmListener): () => void {
  confirmListeners.push(listener);
  return () => {
    confirmListeners = confirmListeners.filter((l) => l !== listener);
  };
}

export function subscribeCenterNotif(listener: NotifListener): () => void {
  notifListeners.push(listener);
  return () => {
    notifListeners = notifListeners.filter((l) => l !== listener);
  };
}

/**
 * Menampilkan Modal Konfirmasi Hapus Data Modern di Tengah Aplikasi
 */
export function confirmDelete(
  message: string,
  title = 'Apakah Anda Yakin Ingin Menghapus Data?',
  details = 'Tindakan ini akan menghapus data secara permanen dari aplikasi dan menyinkronkannya ke database utama.'
): Promise<boolean> {
  return new Promise((resolve) => {
    const state: CenterConfirmState = {
      isOpen: true,
      title,
      message,
      details,
      confirmLabel: 'Ya, Hapus Data',
      cancelLabel: 'Batal',
      variant: 'danger',
      onResolve: (confirmed: boolean) => {
        confirmListeners.forEach((l) => l(null));
        resolve(confirmed);
      }
    };
    confirmListeners.forEach((l) => l(state));
  });
}

/**
 * Mengklasifikasikan pesan CRUD secara otomatis (Create / Update / Delete / Error / Info)
 */
export function classifyCrudMessage(
  message: string,
  baseType: 'success' | 'info' | 'error' | 'warning' = 'success'
): { category: CrudNotifCategory; badgeText: string; title: string } {
  const lower = message.toLowerCase();

  if (
    baseType === 'error' ||
    lower.includes('gagal') ||
    lower.includes('tidak didukung') ||
    lower.includes('maksimal') ||
    lower.includes('tidak boleh') ||
    lower.includes('lebih besar') ||
    lower.includes('lebih dari') ||
    lower.includes('terlebih dahulu')
  ) {
    return {
      category: 'error',
      badgeText: 'VALIDASI & PERINGATAN SISTEM',
      title: 'Perhatian Operasional'
    };
  }

  if (lower.includes('dihapus') || lower.includes('hapus') || lower.includes('dibersihkan')) {
    return {
      category: 'delete',
      badgeText: 'CRUD • HAPUS DATA BERHASIL',
      title: 'Data Berhasil Dihapus'
    };
  }

  if (
    lower.includes('diperbarui') ||
    lower.includes('diubah') ||
    lower.includes('pembaruan') ||
    lower.includes('rekonsiliasi') ||
    lower.includes('status') ||
    lower.includes('disesuaikan')
  ) {
    return {
      category: 'update',
      badgeText: 'CRUD • UPDATE DATA BERHASIL',
      title: 'Data Berhasil Diperbarui'
    };
  }

  if (
    lower.includes('ditambahkan') ||
    lower.includes('disimpan') ||
    lower.includes('dicatat') ||
    lower.includes('didaftarkan') ||
    lower.includes('top-up') ||
    lower.includes('transfer') ||
    lower.includes('diajukan') ||
    lower.includes('dibuat')
  ) {
    return {
      category: 'create',
      badgeText: 'CRUD • SIMPAN DATA BERHASIL',
      title: 'Data Berhasil Disimpan'
    };
  }

  if (baseType === 'info' || lower.includes('sinkronisasi') || lower.includes('peran aktif')) {
    return {
      category: 'info',
      badgeText: 'SISTEM & SINKRONISASI',
      title: 'Informasi Sistem'
    };
  }

  return {
    category: 'success',
    badgeText: 'OPERASI BERHASIL',
    title: 'Proses Berhasil'
  };
}

/**
 * Menampilkan Notifikasi CRUD di Tengah Aplikasi
 */
export function showCenterCrudNotification(
  message: string,
  baseType: 'success' | 'info' | 'error' | 'warning' = 'success',
  customTitle?: string
): void {
  const meta = classifyCrudMessage(message, baseType);
  const state: CenterCrudNotifState = {
    id: Date.now(),
    isOpen: true,
    category: meta.category,
    badgeText: meta.badgeText,
    title: customTitle || meta.title,
    message,
    autoCloseMs: meta.category === 'error' ? 4000 : 2400
  };
  notifListeners.forEach((l) => l(state));
}

export function closeCenterCrudNotification(): void {
  notifListeners.forEach((l) => l(null));
}
