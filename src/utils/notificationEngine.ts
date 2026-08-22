import {
  Vehicle,
  TaxRecord,
  FuelLog,
  MaintenanceRecord,
  NotificationConfig,
  AppNotification
} from '../types';
import { getTaxDueBadgeInfo } from './formatters';

export const generateAppNotifications = (
  vehicles: Vehicle[] = [],
  taxes: TaxRecord[] = [],
  maintenance: MaintenanceRecord[] = [],
  fuelLogs: FuelLog[] = [],
  config: Partial<NotificationConfig> = {}
): AppNotification[] => {
  const notifications: AppNotification[] = [];
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const safeTaxes = Array.isArray(taxes) ? taxes : [];
  const safeMaintenance = Array.isArray(maintenance) ? maintenance : [];
  const safeFuelLogs = Array.isArray(fuelLogs) ? fuelLogs : [];
  const safeConfig: NotificationConfig = {
    taxAlertDaysBefore: config.taxAlertDaysBefore ?? 30,
    serviceAlertKmBefore: config.serviceAlertKmBefore ?? 1000,
    serviceAlertDaysBefore: config.serviceAlertDaysBefore ?? 14,
    fuelReminderDays: config.fuelReminderDays ?? 3,
    enableTaxAlerts: config.enableTaxAlerts ?? true,
    enableServiceAlerts: config.enableServiceAlerts ?? true,
    enableFuelAlerts: config.enableFuelAlerts ?? true,
    enableEmailAlerts: config.enableEmailAlerts ?? true,
    recipientEmail: config.recipientEmail ?? 'operasional@fleetops.co.id'
  };

  const today = new Date('2026-08-21'); // Base simulated date

  // 1. NOTIFIKASI PAJAK & DOKUMEN (STNK / Plat 5 Thn / KIR Dishub)
  if (safeConfig.enableTaxAlerts) {
    safeTaxes.forEach((tax) => {
      if (!tax || !tax.dueDate) return;
      const dueInfo = getTaxDueBadgeInfo(tax.dueDate);
      const dueDate = new Date(tax.dueDate);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (dueInfo.status === 'overdue') {
        notifications.push({
          id: `notif-tax-overdue-${tax.id}`,
          category: 'tax',
          type: 'tax_overdue',
          title: `Pajak / KIR Terlewat: ${tax.nopol}`,
          message: `${tax.documentType} untuk unit ${tax.nopol} telah jatuh tempo pada ${tax.dueDate} (${Math.abs(diffDays)} hari yang lalu). Segera lakukan perpanjangan!`,
          vehicleNopol: tax.nopol,
          vehicleId: tax.vehicleId,
          date: tax.dueDate,
          severity: 'high',
          read: false,
          actionTab: 'tax',
          actionLabel: 'Bayar Sekarang'
        });
      } else if (diffDays <= safeConfig.taxAlertDaysBefore && diffDays >= 0) {
        notifications.push({
          id: `notif-tax-warning-${tax.id}`,
          category: 'tax',
          type: 'tax_warning',
          title: `Pajak Segera Jatuh Tempo: ${tax.nopol}`,
          message: `${tax.documentType} unit ${tax.nopol} akan jatuh tempo dalam ${diffDays} hari (${tax.dueDate}). Siapkan berkas dan anggaran.`,
          vehicleNopol: tax.nopol,
          vehicleId: tax.vehicleId,
          date: tax.dueDate,
          severity: diffDays <= 7 ? 'high' : 'medium',
          read: false,
          actionTab: 'tax',
          actionLabel: 'Proses Berkas'
        });
      }
    });
  }

  // 2. NOTIFIKASI SERVIS RUTIN & PERAWATAN
  if (safeConfig.enableServiceAlerts) {
    safeVehicles.forEach((vehicle) => {
      if (!vehicle) return;
      // Find latest maintenance record for this vehicle
      const vehicleMaintenances = safeMaintenance.filter(m => m && (m.vehicleId === vehicle.id || m.nopol === vehicle.nopol));
      if (vehicleMaintenances.length > 0) {
        // Sort by serviceDate descending
        const sorted = [...vehicleMaintenances].sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());
        const latestMnt = sorted[0];

        if (latestMnt.nextServiceOdometer > 0) {
          const remainingKm = latestMnt.nextServiceOdometer - (vehicle.currentOdometer || 0);

          if (remainingKm <= 0) {
            notifications.push({
              id: `notif-service-overdue-${vehicle.id}`,
              category: 'service',
              type: 'service_due',
              title: `Servis Rutin Terlewat: ${vehicle.nopol}`,
              message: `Unit ${vehicle.nopol} (${vehicle.brand} ${vehicle.model}) telah mencapai ${(vehicle.currentOdometer || 0).toLocaleString()} KM, melampaui jadwal servis ${latestMnt.nextServiceOdometer.toLocaleString()} KM (+${Math.abs(remainingKm).toLocaleString()} KM). Segera bawa ke bengkel!`,
              vehicleNopol: vehicle.nopol,
              vehicleId: vehicle.id,
              date: '2026-08-21',
              severity: 'high',
              read: false,
              actionTab: 'maintenance',
              actionLabel: 'Buat SPK Servis'
            });
          } else if (remainingKm <= safeConfig.serviceAlertKmBefore) {
            notifications.push({
              id: `notif-service-warning-${vehicle.id}`,
              category: 'service',
              type: 'service_due',
              title: `Jadwal Servis Mendekati: ${vehicle.nopol}`,
              message: `Unit ${vehicle.nopol} tersisa ${remainingKm.toLocaleString()} KM menuju batas servis berikutnya (${latestMnt.nextServiceOdometer.toLocaleString()} KM).`,
              vehicleNopol: vehicle.nopol,
              vehicleId: vehicle.id,
              date: latestMnt.nextServiceDate || '2026-08-21',
              severity: remainingKm <= 500 ? 'high' : 'medium',
              read: false,
              actionTab: 'maintenance',
              actionLabel: 'Jadwalkan Servis'
            });
          }
        }

        if (latestMnt.nextServiceDate) {
          const nextDate = new Date(latestMnt.nextServiceDate);
          const diffTime = nextDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= safeConfig.serviceAlertDaysBefore && diffDays > 0) {
            // Check if not already added by KM
            const exists = notifications.some(n => n.id === `notif-service-warning-${vehicle.id}` || n.id === `notif-service-overdue-${vehicle.id}`);
            if (!exists) {
              notifications.push({
                id: `notif-service-date-${vehicle.id}`,
                category: 'service',
                type: 'service_scheduled',
                title: `Target Tanggal Servis: ${vehicle.nopol}`,
                message: `Servis berkala unit ${vehicle.nopol} dijadwalkan pada ${latestMnt.nextServiceDate} (dalam ${diffDays} hari).`,
                vehicleNopol: vehicle.nopol,
                vehicleId: vehicle.id,
                date: latestMnt.nextServiceDate,
                severity: 'medium',
                read: false,
                actionTab: 'maintenance',
                actionLabel: 'Buka Servis'
              });
            }
          }
        }
      }
    });
  }

  // 3. NOTIFIKASI PENGISIAN BAHAN BAKAR (BBM & Solar)
  if (safeConfig.enableFuelAlerts) {
    safeVehicles.forEach((vehicle) => {
      if (!vehicle) return;
      // Find fuel logs for this vehicle
      const vFuelLogs = safeFuelLogs
        .filter(f => f && (f.vehicleId === vehicle.id || f.nopol === vehicle.nopol))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (vFuelLogs.length > 0) {
        const latestLog = vFuelLogs[0];
        
        // 3a. Deteksi Anomali Konsumsi BBM (Boros)
        if (vehicle.targetKmPerLiter > 0 && latestLog.calculatedKmPerLiter > 0) {
          const efficiencyRatio = latestLog.calculatedKmPerLiter / vehicle.targetKmPerLiter;
          if (efficiencyRatio < 0.85) {
            const dropPercent = Math.round((1 - efficiencyRatio) * 100);
            notifications.push({
              id: `notif-fuel-anomaly-${vehicle.id}-${latestLog.id}`,
              category: 'fuel',
              type: 'fuel_anomaly',
              title: `Konsumsi BBM Boros: ${vehicle.nopol}`,
              message: `Efisiensi BBM unit ${vehicle.nopol} tercatat ${latestLog.calculatedKmPerLiter} KM/L (${dropPercent}% di bawah standar ${vehicle.targetKmPerLiter} KM/L). Periksa injektor, filter solar, atau beban muatan.`,
              vehicleNopol: vehicle.nopol,
              vehicleId: vehicle.id,
              date: latestLog.date,
              severity: 'medium',
              read: false,
              actionTab: 'fuel',
              actionLabel: 'Analisis BBM'
            });
          }
        }

        // 3b. Pengingat Pengisian BBM jika kendaraan aktif belum mengisi dalam sekian hari
        if (vehicle.status === 'active') {
          const logDate = new Date(latestLog.date);
          const diffDays = Math.ceil((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= safeConfig.fuelReminderDays) {
            notifications.push({
              id: `notif-fuel-reminder-${vehicle.id}`,
              category: 'fuel',
              type: 'fuel_reminder',
              title: `Pengingat Isi BBM: ${vehicle.nopol}`,
              message: `Unit ${vehicle.nopol} (${vehicle.assignedDriver}) belum mencatat pengisian BBM dalam ${diffDays} hari terakhir (terakhir: ${latestLog.date} di ${(latestLog.odometer || 0).toLocaleString()} KM).`,
              vehicleNopol: vehicle.nopol,
              vehicleId: vehicle.id,
              date: '2026-08-21',
              severity: 'low',
              read: false,
              actionTab: 'fuel',
              actionLabel: 'Catat BBM'
            });
          }
        }
      } else if (vehicle.status === 'active') {
        // No fuel log at all
        notifications.push({
          id: `notif-fuel-empty-${vehicle.id}`,
          category: 'fuel',
          type: 'fuel_reminder',
          title: `Belum Ada Log BBM: ${vehicle.nopol}`,
          message: `Unit ${vehicle.nopol} aktif beroperasi tetapi belum memiliki catatan riwayat pengisian BBM.`,
          vehicleNopol: vehicle.nopol,
          vehicleId: vehicle.id,
          date: '2026-08-21',
          severity: 'info',
          read: false,
          actionTab: 'fuel',
          actionLabel: 'Input Log BBM'
        });
      }
    });
  }

  // Sort: High severity first, then medium, then low/info
  const severityRank = { high: 0, medium: 1, low: 2, info: 3 };
  return notifications.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
};
