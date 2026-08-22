export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num || 0);
}

export function formatDateIndo(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getDaysDifference(targetDateStr: string): number {
  if (!targetDateStr) return 999;
  const target = new Date(targetDateStr);
  const now = new Date('2026-08-21T00:00:00'); // current mock time
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getTaxDueBadgeInfo(dueDateStr: string): {
  days: number;
  label: string;
  badgeClass: string;
  status: 'overdue' | 'urgent' | 'warning' | 'safe';
} {
  const days = getDaysDifference(dueDateStr);
  if (days < 0) {
    return {
      days,
      label: `Lewat ${Math.abs(days)} Hari`,
      badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
      status: 'overdue'
    };
  } else if (days === 0) {
    return {
      days,
      label: 'Hari Ini!',
      badgeClass: 'bg-rose-600 text-white font-bold animate-pulse',
      status: 'urgent'
    };
  } else if (days <= 14) {
    return {
      days,
      label: `Sisa ${days} Hari`,
      badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-medium',
      status: 'urgent'
    };
  } else if (days <= 30) {
    return {
      days,
      label: `Sisa ${days} Hari`,
      badgeClass: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30',
      status: 'warning'
    };
  } else {
    return {
      days,
      label: `Sisa ${days} Hari`,
      badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
      status: 'safe'
    };
  }
}

export function getVehicleStatusBadge(status: string): { label: string; badgeClass: string } {
  switch (status) {
    case 'active':
      return { label: 'Aktif Operasi', badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' };
    case 'maintenance':
      return { label: 'Dalam Servis', badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' };
    case 'standby':
      return { label: 'Standby / Pool', badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30' };
    case 'broken':
      return { label: 'Mogok / Rusak', badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30' };
    default:
      return { label: status, badgeClass: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30' };
  }
}

export function getFuelEfficiencyStatus(kmPerLiter: number, target: number): {
  status: 'good' | 'average' | 'poor';
  text: string;
  colorClass: string;
} {
  if (kmPerLiter >= target) {
    return {
      status: 'good',
      text: 'Efisien (Optimal)',
      colorClass: 'text-emerald-600 dark:text-emerald-400'
    };
  } else if (kmPerLiter >= target * 0.85) {
    return {
      status: 'average',
      text: 'Wajar (Sesuai Beban)',
      colorClass: 'text-amber-600 dark:text-amber-400'
    };
  } else {
    return {
      status: 'poor',
      text: 'Boros (Perlu Cek)',
      colorClass: 'text-rose-600 dark:text-rose-400'
    };
  }
}
