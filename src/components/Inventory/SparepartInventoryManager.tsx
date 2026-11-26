import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Wrench,
  Edit2,
  Trash2,
  Printer,
  Eye,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  CheckCircle2,
  Recycle,
  Sparkles,
  Layers,
  History,
  BarChart3,
  FileSpreadsheet,
  Truck,
  UserCheck,
  MapPin,
  Tag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  SparepartInventoryItem,
  SparepartStockMovement,
  SparepartConditionType,
  SparepartCategory,
  SparepartMovementType,
  Vehicle,
  Driver,
  EquipmentSupplier,
  AdminStaff,
  UserRole
} from '../../types';
import { formatRupiah, formatNumber, formatDateIndo } from '../../utils/formatters';
import { printElementById } from '../../utils/slipPrint';
import { PrintOutPreviewStage } from '../Common/PrintPreviewControls';
import { ReceiptUploadField } from '../Common/ReceiptUploadField';
import { TablePagination } from '../Common/TablePagination';
import { getRolePermissions } from '../../utils/permissions';
import { RoleRestrictedBanner } from '../Common/RoleRestrictedBanner';
import { confirmDelete } from '../../utils/dialogService';
import { resolveDisplayReceiptUrl } from '../../utils/imageCompressor';

interface SparepartInventoryManagerProps {
  inventory: SparepartInventoryItem[];
  movements: SparepartStockMovement[];
  vehicles: Vehicle[];
  drivers: Driver[];
  suppliers?: EquipmentSupplier[];
  adminStaff?: AdminStaff[];
  userRole?: UserRole;
  onOpenRoleMatrix?: () => void;
  onAddSparepart: (item: SparepartInventoryItem) => void;
  onUpdateSparepart: (item: SparepartInventoryItem) => void;
  onDeleteSparepart: (id: string) => void;
  onRecordMovement: (movement: SparepartStockMovement, updatedItem: SparepartInventoryItem) => void;
  onDeleteMovement?: (id: string) => void;
}

const CATEGORIES: SparepartCategory[] = [
  'Mesin & Filter',
  'Ban & Velg',
  'Sistem Rem & Kopling',
  'Kelistrikan & Aki',
  'Oli & Pelumas',
  'Kaki-Kaki & Suspensi',
  'Body & Karoseri',
  'Lainnya'
];

const CONDITION_META: Record<
  SparepartConditionType,
  {
    label: string;
    shortLabel: string;
    group: 'baru' | 'bekas';
    badgeClass: string;
    desc: string;
  }
> = {
  baru: {
    label: 'Sparepart Baru (100% Original / OEM)',
    shortLabel: 'BARU (OEM)',
    group: 'baru',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    desc: 'Barang baru gress dari toko/distributor resmi belum pernah terpasang.'
  },
  bekas_layak: {
    label: 'Bekas Layak Pakai (Copotan Armada)',
    shortLabel: 'BEKAS LAYAK PAKAI',
    group: 'bekas',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    desc: 'Part bekas copotan dari unit armada yang kondisinya masih bagus & siap dipasang kembali.'
  },
  bekas_rekondisi: {
    label: 'Bekas Rekondisi / Vulkanisir Siap Pakai',
    shortLabel: 'BEKAS REKONDISI',
    group: 'bekas',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    desc: 'Part bekas yang telah diservis ulang / ban vulkanisir dan siap dipasang ke armada.'
  },
  bekas_rusak_afkir: {
    label: 'Bekas Rusak / Afkir (Karantina Scrap)',
    shortLabel: 'BEKAS AFKIR / SCRAP',
    group: 'bekas',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    desc: 'Barang bekas rusak wajib setor ke gudang untuk audit fisik & siap dijual sebagai limbah/scrap.'
  }
};

const MOVEMENT_TYPE_META: Record<
  SparepartMovementType,
  {
    label: string;
    direction: 'in' | 'out' | 'adjust';
    badgeClass: string;
  }
> = {
  in_purchase: {
    label: 'Masuk - Pembelian Baru',
    direction: 'in',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  in_removed_used: {
    label: 'Masuk - Copotan Bekas Armada',
    direction: 'in',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  out_install: {
    label: 'Keluar - Dipasang ke Armada',
    direction: 'out',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  },
  out_scrap_sale: {
    label: 'Keluar - Jual Limbah / Scrap',
    direction: 'out',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  adjustment: {
    label: 'Penyesuaian Stok Opname',
    direction: 'adjust',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300'
  }
};

const CHART_COLORS = ['#10b981', '#2563eb', '#f59e0b', '#e11d48', '#8b5cf6', '#06b6d4', '#64748b'];

export const SparepartInventoryManager: React.FC<SparepartInventoryManagerProps> = ({
  inventory = [],
  movements = [],
  vehicles = [],
  drivers = [],
  suppliers = [],
  adminStaff = [],
  userRole = 'owner',
  onOpenRoleMatrix,
  onAddSparepart,
  onUpdateSparepart,
  onDeleteSparepart,
  onRecordMovement,
  onDeleteMovement
}) => {
  const safeInventory = Array.isArray(inventory) ? inventory : [];
  const safeMovements = Array.isArray(movements) ? movements : [];
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];
  const safeStaff = Array.isArray(adminStaff) ? adminStaff : [];

  const perms = getRolePermissions(userRole);
  const canModify = perms.canAddMaintenance || perms.canAddFinanceTx || userRole === 'owner' || userRole === 'admin1' || userRole === 'admin2';

  // Active Sub-Tab: 'all' | 'baru' | 'bekas' | 'movements' | 'analytics'
  const [activeTab, setActiveTab] = useState<'all' | 'baru' | 'bekas' | 'movements' | 'analytics'>('all');
  const [usedSubFilter, setUsedSubFilter] = useState<'all_used' | 'bekas_layak' | 'bekas_rekondisi' | 'bekas_rusak_afkir'>('all_used');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);

  const getItemCompany = (item: SparepartInventoryItem) => {
    if (item.originVehicleId || item.originNopol) {
      const v = safeVehicles.find(veh => veh.id === item.originVehicleId || veh.nopol === item.originNopol);
      if (v?.ownerCompany) return v.ownerCompany;
    }
    return 'Gudang Pusat / Multi-Perusahaan';
  };

  const getMovementCompany = (mov: SparepartStockMovement) => {
    if (mov.vehicleId || mov.nopol) {
      const v = safeVehicles.find(veh => veh.id === mov.vehicleId || veh.nopol === mov.nopol);
      if (v?.ownerCompany) return v.ownerCompany;
    }
    return 'Gudang Pusat / Pool Umum';
  };

  const companies = useMemo(() => {
    return Array.from(
      new Set([
        ...safeVehicles.map(v => v.ownerCompany).filter(Boolean),
        ...safeMovements.map(m => getMovementCompany(m)).filter(Boolean)
      ])
    );
  }, [safeVehicles, safeMovements]);

  const companyMovementStats = useMemo(() => {
    return companies.map((comp) => {
      const compMovs = safeMovements.filter(m => getMovementCompany(m) === comp);
      const totalInstallExpense = compMovs
        .filter(m => m.movementType === 'out_install' || m.movementType === 'in_purchase')
        .reduce((s, m) => s + (m.totalValue || 0), 0);
      const totalUsedRecovered = compMovs
        .filter(m => m.movementType === 'in_removed_used' || m.movementType === 'in_recondition')
        .reduce((s, m) => s + (m.totalValue || 0), 0);
      return {
        companyName: comp,
        movementCount: compMovs.length,
        totalInstallExpense,
        totalUsedRecovered,
      };
    });
  }, [companies, safeMovements]);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<SparepartInventoryItem | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState<boolean>(false);
  const [selectedPartForPrint, setSelectedPartForPrint] = useState<SparepartInventoryItem | null>(null);
  const [selectedMovementForPrint, setSelectedMovementForPrint] = useState<SparepartStockMovement | null>(null);
  const [inspectedProofUrl, setInspectedProofUrl] = useState<{ title: string; url: string } | null>(null);
  const [isAnalyticsPrintOpen, setIsAnalyticsPrintOpen] = useState<boolean>(false);

  // Form State: Add/Edit Sparepart
  const [formData, setFormData] = useState<{
    partCode: string;
    partName: string;
    category: string;
    brand: string;
    compatibleVehicles: string;
    condition: SparepartConditionType;
    stockQty: number;
    minStockWarning: number;
    unit: string;
    unitPrice: number;
    storageLocation: string;
    originVehicleId: string;
    originNopol: string;
    exchangedFromWorkOrder: string;
    supplierId: string;
    supplierName: string;
    notes: string;
    photoProofUrl: string;
  }>({
    partCode: 'PN-' + Date.now().toString().slice(-5),
    partName: '',
    category: 'Mesin & Filter',
    brand: '',
    compatibleVehicles: 'Semua Unit Armada',
    condition: 'baru',
    stockQty: 1,
    minStockWarning: 2,
    unit: 'Pcs',
    unitPrice: 0,
    storageLocation: 'Gudang Pool Utama - Rak A-01',
    originVehicleId: '',
    originNopol: '',
    exchangedFromWorkOrder: '',
    supplierId: '',
    supplierName: '',
    notes: '',
    photoProofUrl: ''
  });

  // Form State: Record Stock Movement (Masuk / Keluar / Pemasangan / Copotan Bekas)
  const [movForm, setMovForm] = useState<{
    date: string;
    partId: string;
    movementType: SparepartMovementType;
    qty: number;
    unitPrice: number;
    vehicleId: string;
    driverId: string;
    driverName: string;
    driverNip: string;
    mechanicOrStaffName: string;
    workOrderNumber: string;
    receiptProofUrl: string;
    notes: string;
  }>({
    date: new Date().toISOString().slice(0, 10),
    partId: safeInventory[0]?.id || '',
    movementType: 'out_install',
    qty: 1,
    unitPrice: safeInventory[0]?.unitPrice || 0,
    vehicleId: safeVehicles[0]?.id || '',
    driverId: safeDrivers[0]?.id || '',
    driverName: safeDrivers[0]?.name || '',
    driverNip: safeDrivers[0]?.nip || '',
    mechanicOrStaffName: safeStaff.find(s => s.department.toLowerCase().includes('gudang') || s.department.toLowerCase().includes('logistik'))?.name || 'Hendra Kusuma, A.Md.T. (Kepala Gudang)',
    workOrderNumber: 'SPK-' + new Date().toISOString().slice(0, 7).replace('-', '') + '-' + Date.now().toString().slice(-3),
    receiptProofUrl: '',
    notes: ''
  });

  // KPI Summaries
  const kpiStats = useMemo(() => {
    const newParts = safeInventory.filter(i => i.condition === 'baru');
    const usedLayakParts = safeInventory.filter(i => i.condition === 'bekas_layak');
    const usedReconParts = safeInventory.filter(i => i.condition === 'bekas_rekondisi');
    const usedScrapParts = safeInventory.filter(i => i.condition === 'bekas_rusak_afkir');
    const allUsedParts = safeInventory.filter(i => i.condition !== 'baru');

    const totalNewValue = newParts.reduce((s, i) => s + (i.stockQty * i.unitPrice), 0);
    const totalUsedValue = allUsedParts.reduce((s, i) => s + (i.stockQty * i.unitPrice), 0);
    const totalNewUnits = newParts.reduce((s, i) => s + i.stockQty, 0);
    const totalUsedUnits = allUsedParts.reduce((s, i) => s + i.stockQty, 0);

    const lowStockItems = safeInventory.filter(
      i => i.condition !== 'bekas_rusak_afkir' && i.stockQty <= i.minStockWarning
    );

    return {
      totalSkus: safeInventory.length,
      newSkus: newParts.length,
      usedSkus: allUsedParts.length,
      usedLayakCount: usedLayakParts.length,
      usedReconCount: usedReconParts.length,
      usedScrapCount: usedScrapParts.length,
      totalNewValue,
      totalUsedValue,
      grandTotalValue: totalNewValue + totalUsedValue,
      totalNewUnits,
      totalUsedUnits,
      lowStockCount: lowStockItems.length
    };
  }, [safeInventory]);

  // Filtered Inventory Items
  const filteredInventory = useMemo(() => {
    return safeInventory.filter(item => {
      if (activeTab === 'baru' && item.condition !== 'baru') return false;
      if (activeTab === 'bekas') {
        if (item.condition === 'baru') return false;
        if (usedSubFilter !== 'all_used' && item.condition !== usedSubFilter) return false;
      }
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (selectedCompany !== 'all') {
        const itemComp = getItemCompany(item);
        const hasMovForComp = safeMovements.some(m => m.partId === item.id && getMovementCompany(m) === selectedCompany);
        if (itemComp !== selectedCompany && !hasMovForComp) return false;
      }
      if (onlyLowStock && (item.condition === 'bekas_rusak_afkir' || item.stockQty > item.minStockWarning)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = (item.partCode || '').toLowerCase().includes(q);
        const matchName = (item.partName || '').toLowerCase().includes(q);
        const matchBrand = (item.brand || '').toLowerCase().includes(q);
        const matchLoc = (item.storageLocation || '').toLowerCase().includes(q);
        const matchOrigin = (item.originNopol || '').toLowerCase().includes(q);
        const matchCompat = (item.compatibleVehicles || '').toLowerCase().includes(q);
        return matchCode || matchName || matchBrand || matchLoc || matchOrigin || matchCompat;
      }
      return true;
    });
  }, [safeInventory, safeMovements, activeTab, usedSubFilter, selectedCategory, selectedCompany, onlyLowStock, searchQuery]);

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    return safeMovements.filter(mov => {
      const movComp = getMovementCompany(mov);
      if (selectedCompany !== 'all' && movComp !== selectedCompany) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (mov.partCode || '').toLowerCase().includes(q) ||
        (mov.partName || '').toLowerCase().includes(q) ||
        (mov.nopol || '').toLowerCase().includes(q) ||
        (mov.driverName || '').toLowerCase().includes(q) ||
        (mov.workOrderNumber || '').toLowerCase().includes(q) ||
        (mov.mechanicOrStaffName || '').toLowerCase().includes(q) ||
        movComp.toLowerCase().includes(q)
      );
    });
  }, [safeMovements, selectedCompany, searchQuery]);

  // Analytics Data
  const categoryBreakdownData = useMemo(() => {
    const map: Record<string, { category: string; nilaiBaru: number; nilaiBekas: number; qtyBaru: number; qtyBekas: number }> = {};
    safeInventory.forEach(item => {
      const cat = item.category || 'Lainnya';
      if (!map[cat]) {
        map[cat] = { category: cat, nilaiBaru: 0, nilaiBekas: 0, qtyBaru: 0, qtyBekas: 0 };
      }
      const val = item.stockQty * item.unitPrice;
      if (item.condition === 'baru') {
        map[cat].nilaiBaru += val;
        map[cat].qtyBaru += item.stockQty;
      } else {
        map[cat].nilaiBekas += val;
        map[cat].qtyBekas += item.stockQty;
      }
    });
    return Object.values(map);
  }, [safeInventory]);

  const conditionPieData = useMemo(() => {
    return [
      {
        name: 'Sparepart Baru (OEM)',
        value: safeInventory.filter(i => i.condition === 'baru').reduce((s, i) => s + i.stockQty * i.unitPrice, 0)
      },
      {
        name: 'Bekas Layak Pakai (Copotan)',
        value: safeInventory.filter(i => i.condition === 'bekas_layak').reduce((s, i) => s + i.stockQty * i.unitPrice, 0)
      },
      {
        name: 'Bekas Rekondisi / Vulkanisir',
        value: safeInventory.filter(i => i.condition === 'bekas_rekondisi').reduce((s, i) => s + i.stockQty * i.unitPrice, 0)
      },
      {
        name: 'Bekas Rusak / Afkir Scrap',
        value: safeInventory.filter(i => i.condition === 'bekas_rusak_afkir').reduce((s, i) => s + i.stockQty * i.unitPrice, 0)
      }
    ].filter(d => d.value > 0);
  }, [safeInventory]);

  const openAddModal = (presetCondition: SparepartConditionType = 'baru') => {
    setEditingItem(null);
    const prefix = presetCondition === 'baru' ? 'PN-' : presetCondition === 'bekas_rekondisi' ? 'RECON-' : presetCondition === 'bekas_rusak_afkir' ? 'SCRAP-' : 'USED-';
    setFormData({
      partCode: prefix + Date.now().toString().slice(-5),
      partName: '',
      category: 'Mesin & Filter',
      brand: '',
      compatibleVehicles: 'Semua Unit Armada',
      condition: presetCondition,
      stockQty: 1,
      minStockWarning: presetCondition === 'bekas_rusak_afkir' ? 0 : 2,
      unit: 'Pcs',
      unitPrice: 0,
      storageLocation: presetCondition === 'baru' ? 'Gudang Pool Utama - Rak A-01' : 'Gudang Part Bekas - Rak C-01',
      originVehicleId: safeVehicles[0]?.id || '',
      originNopol: safeVehicles[0]?.nopol || '',
      exchangedFromWorkOrder: '',
      supplierId: safeSuppliers[0]?.id || '',
      supplierName: safeSuppliers[0]?.name || '',
      notes: '',
      photoProofUrl: ''
    });
    setIsItemModalOpen(true);
  };

  const openEditModal = (item: SparepartInventoryItem) => {
    setEditingItem(item);
    setFormData({
      partCode: item.partCode,
      partName: item.partName,
      category: item.category,
      brand: item.brand || '',
      compatibleVehicles: item.compatibleVehicles || '',
      condition: item.condition,
      stockQty: item.stockQty,
      minStockWarning: item.minStockWarning,
      unit: item.unit,
      unitPrice: item.unitPrice,
      storageLocation: item.storageLocation,
      originVehicleId: item.originVehicleId || '',
      originNopol: item.originNopol || '',
      exchangedFromWorkOrder: item.exchangedFromWorkOrder || '',
      supplierId: item.supplierId || '',
      supplierName: item.supplierName || '',
      notes: item.notes || '',
      photoProofUrl: item.photoProofUrl || ''
    });
    setIsItemModalOpen(true);
  };

  const openMovementModalForPart = (part?: SparepartInventoryItem, defaultType?: SparepartMovementType) => {
    const targetPart = part || safeInventory[0];
    if (!targetPart) return;
    const autoType: SparepartMovementType =
      defaultType ||
      (targetPart.condition === 'bekas_rusak_afkir'
        ? 'in_removed_used'
        : 'out_install');

    const defaultVehicle = safeVehicles[0];
    const assignedDriver = safeDrivers.find(d => d.name === defaultVehicle?.assignedDriver) || safeDrivers[0];

    setMovForm({
      date: new Date().toISOString().slice(0, 10),
      partId: targetPart.id,
      movementType: autoType,
      qty: 1,
      unitPrice: targetPart.unitPrice,
      vehicleId: defaultVehicle?.id || '',
      driverId: assignedDriver?.id || '',
      driverName: assignedDriver?.name || '',
      driverNip: assignedDriver?.nip || '',
      mechanicOrStaffName: 'Hendra Kusuma, A.Md.T. (Kepala Gudang)',
      workOrderNumber: 'SPK-' + new Date().toISOString().slice(0, 7).replace('-', '') + '-' + Date.now().toString().slice(-3),
      receiptProofUrl: '',
      notes: ''
    });
    setIsMovementModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const isUsed = formData.condition !== 'baru';
    const selectedVeh = safeVehicles.find(v => v.id === formData.originVehicleId);
    const selectedSup = safeSuppliers.find(s => s.id === formData.supplierId);

    const payload: SparepartInventoryItem = {
      id: editingItem ? editingItem.id : 'INV-SP-' + Date.now().toString().slice(-5),
      partCode: formData.partCode.trim().toUpperCase(),
      partName: formData.partName.trim(),
      category: formData.category,
      brand: formData.brand.trim() || undefined,
      compatibleVehicles: formData.compatibleVehicles.trim() || undefined,
      condition: formData.condition,
      stockQty: Number(formData.stockQty) || 0,
      minStockWarning: Number(formData.minStockWarning) || 0,
      unit: formData.unit || 'Pcs',
      unitPrice: Number(formData.unitPrice) || 0,
      totalValue: (Number(formData.stockQty) || 0) * (Number(formData.unitPrice) || 0),
      storageLocation: formData.storageLocation.trim() || 'Gudang Pool Utama',
      originVehicleId: isUsed ? formData.originVehicleId || undefined : undefined,
      originNopol: isUsed ? (selectedVeh?.nopol || formData.originNopol || undefined) : undefined,
      exchangedFromWorkOrder: isUsed ? (formData.exchangedFromWorkOrder.trim() || undefined) : undefined,
      supplierId: formData.supplierId || undefined,
      supplierName: selectedSup?.name || formData.supplierName || undefined,
      lastUpdated: new Date().toISOString().slice(0, 10),
      notes: formData.notes.trim() || undefined,
      photoProofUrl: formData.photoProofUrl || undefined
    };

    if (editingItem) {
      onUpdateSparepart(payload);
    } else {
      onAddSparepart(payload);
      confetti({ particleCount: 55, spread: 60, origin: { y: 0.7 } });
    }
    setIsItemModalOpen(false);
  };

  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPart = safeInventory.find(p => p.id === movForm.partId);
    if (!targetPart) return;

    const qtyNum = Math.max(1, Number(movForm.qty) || 1);
    const meta = MOVEMENT_TYPE_META[movForm.movementType];
    let newStockQty = targetPart.stockQty;
    if (meta.direction === 'in') {
      newStockQty = targetPart.stockQty + qtyNum;
    } else if (meta.direction === 'out') {
      newStockQty = Math.max(0, targetPart.stockQty - qtyNum);
    } else {
      newStockQty = qtyNum;
    }

    const selectedVeh = safeVehicles.find(v => v.id === movForm.vehicleId);
    const selectedDrv = safeDrivers.find(d => d.id === movForm.driverId || d.name === movForm.driverName);

    const newMovement: SparepartStockMovement = {
      id: 'MOV-SP-' + Date.now().toString().slice(-5),
      date: movForm.date,
      partId: targetPart.id,
      partCode: targetPart.partCode,
      partName: targetPart.partName,
      condition: targetPart.condition,
      movementType: movForm.movementType,
      qty: qtyNum,
      unit: targetPart.unit,
      unitPrice: Number(movForm.unitPrice) || targetPart.unitPrice,
      totalAmount: qtyNum * (Number(movForm.unitPrice) || targetPart.unitPrice),
      vehicleId: selectedVeh?.id || undefined,
      nopol: selectedVeh?.nopol || undefined,
      driverId: selectedDrv?.id || undefined,
      driverName: selectedDrv?.name || movForm.driverName || undefined,
      driverNip: selectedDrv?.nip || movForm.driverNip || undefined,
      mechanicOrStaffName: movForm.mechanicOrStaffName.trim() || 'Kepala Gudang Sparepart',
      workOrderNumber: movForm.workOrderNumber.trim() || undefined,
      receiptProofUrl: movForm.receiptProofUrl || undefined,
      notes: movForm.notes.trim() || undefined
    };

    const updatedItem: SparepartInventoryItem = {
      ...targetPart,
      stockQty: newStockQty,
      totalValue: newStockQty * targetPart.unitPrice,
      lastUpdated: movForm.date,
      originNopol:
        movForm.movementType === 'in_removed_used' && selectedVeh?.nopol
          ? selectedVeh.nopol
          : targetPart.originNopol,
      exchangedFromWorkOrder:
        movForm.movementType === 'in_removed_used' && movForm.workOrderNumber
          ? movForm.workOrderNumber
          : targetPart.exchangedFromWorkOrder
    };

    onRecordMovement(newMovement, updatedItem);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    setIsMovementModalOpen(false);
  };

  const handleExportInventoryCSV = () => {
    const headers = [
      'Kode Part / SKU',
      'Nama Sparepart',
      'Kondisi (Baru/Bekas)',
      'Kategori',
      'Merk / Brand',
      'Stok Saat Ini',
      'Satuan',
      'Harga Satuan / Taksir (Rp)',
      'Total Nilai (Rp)',
      'Lokasi Rak Gudang',
      'Asal Copotan Nopol (Part Bekas)',
      'No. SPK Copotan',
      'Supplier',
      'Update Terakhir'
    ];
    const rows = filteredInventory.map(item => [
      `"${item.partCode}"`,
      `"${(item.partName || '').replace(/"/g, '""')}"`,
      `"${CONDITION_META[item.condition]?.shortLabel || item.condition}"`,
      `"${item.category}"`,
      `"${item.brand || '-'}"`,
      item.stockQty,
      `"${item.unit}"`,
      item.unitPrice,
      item.stockQty * item.unitPrice,
      `"${item.storageLocation}"`,
      `"${item.originNopol || '-'}"`,
      `"${item.exchangedFromWorkOrder || '-'}"`,
      `"${item.supplierName || '-'}"`,
      `"${item.lastUpdated}"`
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventory_Sparepart_Baru_Bekas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination calculation
  const activeListLength = activeTab === 'movements' ? filteredMovements.length : filteredInventory.length;
  const paginatedInventory = filteredInventory.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedMovements = filteredMovements.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Role Banner if needed */}
      {!canModify && (
        <RoleRestrictedBanner
          userRole={userRole}
          moduleName="Inventory Gudang Sparepart (Baru & Bekas)"
          onOpenRoleMatrix={onOpenRoleMatrix}
        />
      )}

      {/* Top Module Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Inventory Gudang Sparepart (Baru &amp; Bekas)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  BARU (OEM) &amp; COPOTAN BEKAS
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Pencatatan stok suku cadang baru (original/OEM), sparepart bekas layak pakai (copotan armada), ban vulkanisir/rekondisi, hingga karantina part bekas afkir &amp; serah terima ke Karyawan Driver.
              </p>
            </div>
          </div>

          {canModify && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openAddModal('baru')}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Sparepart Baru</span>
              </button>
              <button
                type="button"
                onClick={() => openAddModal('bekas_layak')}
                className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Recycle className="w-4 h-4" />
                <span>+ Record Part Bekas / Copotan</span>
              </button>
              <button
                type="button"
                onClick={() => openMovementModalForPart()}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4 text-amber-400" />
                <span>Catat Mutasi / Serah Terima Part</span>
              </button>
            </div>
          )}
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          {/* Card 1: Total Nilai & SKU */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Nilai Gudang (Baru+Bekas)
              </span>
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-black text-slate-900">
                {formatRupiah(kpiStats.grandTotalValue)}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Total <strong>{kpiStats.totalSkus} SKU</strong> terdaftar di gudang pool
              </div>
            </div>
          </div>

          {/* Card 2: Sparepart Baru */}
          <div
            onClick={() => {
              setActiveTab('baru');
              setCurrentPage(1);
            }}
            className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 hover:border-emerald-400 transition cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Stok Sparepart Baru (OEM)
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-black text-emerald-950">
                {formatRupiah(kpiStats.totalNewValue)}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                <strong>{kpiStats.newSkus} SKU Baru</strong> ({formatNumber(kpiStats.totalNewUnits)} unit/item siap pasang)
              </div>
            </div>
          </div>

          {/* Card 3: Sparepart Bekas & Copotan */}
          <div
            onClick={() => {
              setActiveTab('bekas');
              setUsedSubFilter('all_used');
              setCurrentPage(1);
            }}
            className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 hover:border-blue-400 transition cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                Stok Sparepart Bekas &amp; Copotan
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Recycle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-black text-blue-950">
                {formatRupiah(kpiStats.totalUsedValue)}
              </div>
              <div className="text-[11px] text-blue-700 font-semibold mt-0.5">
                <strong>{kpiStats.usedLayakCount} Layak</strong> &bull; <strong>{kpiStats.usedReconCount} Rekondisi</strong> &bull; <strong>{kpiStats.usedScrapCount} Afkir</strong>
              </div>
            </div>
          </div>

          {/* Card 4: Peringatan Stok Minimum & Riwayat Mutasi */}
          <div
            onClick={() => {
              setOnlyLowStock(!onlyLowStock);
              if (activeTab === 'movements' || activeTab === 'analytics') setActiveTab('all');
              setCurrentPage(1);
            }}
            className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
              onlyLowStock
                ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400/40'
                : 'bg-amber-50/70 border-amber-200 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                Alert Stok Minimum &amp; Mutasi
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-black text-amber-950">
                {kpiStats.lowStockCount} Item Menipis
              </div>
              <div className="text-[11px] text-amber-800 font-semibold mt-0.5">
                {onlyLowStock ? 'Menampilkan stok menipis saja (Klik reset)' : `${safeMovements.length} transaksi mutasi & serah terima`}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semua Stok ({safeInventory.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('baru');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'baru'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sparepart Baru ({kpiStats.newSkus})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('bekas');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'bekas'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <Recycle className="w-3.5 h-3.5" />
              <span>Sparepart Bekas &amp; Copotan ({kpiStats.usedSkus})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('movements');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'movements'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat Mutasi &amp; Serah Terima ({safeMovements.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('analytics');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>📊 Laporan &amp; Analitik Inventory</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportInventoryCSV}
              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Unduh Excel/CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAnalyticsPrintOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Preview Cetak Laporan Stok</span>
            </button>
          </div>
        </div>

        {/* Sub-filter bar when viewing Sparepart Bekas */}
        {activeTab === 'bekas' && (
          <div className="mt-3 p-3 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <Recycle className="w-4 h-4 text-blue-600" />
              <span>Filter Klasifikasi Sparepart Bekas:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all_used', label: `Semua Bekas (${kpiStats.usedSkus})` },
                { id: 'bekas_layak', label: `Bekas Layak Pakai / Copotan (${kpiStats.usedLayakCount})` },
                { id: 'bekas_rekondisi', label: `Bekas Rekondisi / Vulkanisir (${kpiStats.usedReconCount})` },
                { id: 'bekas_rusak_afkir', label: `Bekas Rusak / Afkir Scrap (${kpiStats.usedScrapCount})` }
              ].map(sub => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    setUsedSubFilter(sub.id as any);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    usedSubFilter === sub.id
                      ? 'bg-blue-700 text-white shadow-2xs'
                      : 'bg-white text-blue-800 border border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search, Company & Category Filter Bar */}
        <div className="space-y-3 mt-4">
          {activeTab !== 'analytics' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={
                    activeTab === 'movements'
                      ? 'Cari kode part, nama sparepart, Nopol, Driver, PT, atau No. SPK...'
                      : 'Cari kode SKU/Part Number, nama sparepart, merk, lokasi rak, atau Nopol asal...'
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className={activeTab === 'movements' ? 'md:col-span-7' : 'md:col-span-3'}>
                <select
                  value={selectedCompany}
                  onChange={e => {
                    setSelectedCompany(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 text-xs sm:text-sm font-bold text-indigo-900 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="all">🏢 Semua Perusahaan Armada</option>
                  {companies.map(comp => (
                    <option key={comp} value={comp}>
                      🏢 {comp}
                    </option>
                  ))}
                </select>
              </div>

              {activeTab !== 'movements' && (
                <>
                  <div className="md:col-span-2">
                    <select
                      value={selectedCategory}
                      onChange={e => {
                        setSelectedCategory(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-hidden focus:border-blue-500"
                    >
                      <option value="all">Semua Kategori</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setOnlyLowStock(!onlyLowStock);
                        setCurrentPage(1);
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        onlyLowStock
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{onlyLowStock ? 'Stok Menipis' : 'Cek Stok Tipis'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Quick-Switch Mutasi Pemakaian Sparepart Per Perusahaan */}
          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Mutasi Pemakaian Part per Perusahaan:
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedCompany('all');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border cursor-pointer ${
                selectedCompany === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Semua Perusahaan ({safeMovements.length} Mutasi)
            </button>
            {companyMovementStats.map(stat => {
              const isActive = selectedCompany === stat.companyName;
              return (
                <button
                  key={stat.companyName}
                  type="button"
                  onClick={() => {
                    setSelectedCompany(isActive ? 'all' : stat.companyName);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                  }`}
                >
                  <span>🏢 {stat.companyName}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {stat.movementCount} mutasi
                  </span>
                  {stat.totalInstallExpense > 0 && (
                    <span className={`font-mono text-[10px] ${isActive ? 'text-amber-200' : 'text-rose-600'}`}>
                      {formatRupiah(stat.totalInstallExpense)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB VIEW 1, 2, 3: DAFTAR STOK SPAREPART BARU & BEKAS     */}
      {/* ======================================================== */}
      {(activeTab === 'all' || activeTab === 'baru' || activeTab === 'bekas') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Kode SKU &amp; Nama Sparepart</th>
                  <th className="py-3.5 px-3">Kondisi (Baru / Bekas)</th>
                  <th className="py-3.5 px-3">Asal Barang / Copotan Armada</th>
                  <th className="py-3.5 px-3">Lokasi Rak Gudang</th>
                  <th className="py-3.5 px-3 text-center">Stok Tersedia</th>
                  <th className="py-3.5 px-3 text-right">Harga / Taksir</th>
                  <th className="py-3.5 px-3 text-right">Total Nilai</th>
                  <th className="py-3.5 px-4 text-center">Aksi Gudang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedInventory.map(item => {
                  const condMeta = CONDITION_META[item.condition] || CONDITION_META.baru;
                  const isLow = item.condition !== 'bekas_rusak_afkir' && item.stockQty <= item.minStockWarning;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/90 transition">
                      {/* SKU & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                              item.condition === 'baru'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.condition === 'bekas_layak'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : item.condition === 'bekas_rekondisi'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {item.condition === 'baru' ? <Sparkles className="w-4 h-4" /> : <Recycle className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                                {item.partCode}
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {item.category}
                              </span>
                            </div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm mt-1">
                              {item.partName}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Merk: <strong>{item.brand || '-'}</strong> &bull; Unit: {item.compatibleVehicles || 'Semua Armada'}
                            </div>
                            {item.notes && (
                              <div className="text-[11px] text-slate-400 italic mt-0.5 line-clamp-1">
                                &ldquo;{item.notes}&rdquo;
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Kondisi */}
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${condMeta.badgeClass}`}>
                          {item.condition === 'baru' ? <CheckCircle2 className="w-3 h-3" /> : <Recycle className="w-3 h-3" />}
                          <span>{condMeta.shortLabel}</span>
                        </span>
                      </td>

                      {/* Asal Barang / Copotan */}
                      <td className="py-3.5 px-3">
                        {item.condition === 'baru' ? (
                          <div>
                            <div className="text-[11px] font-bold text-slate-800">
                              Supplier: {item.supplierName || 'Toko Sparepart Resmi'}
                            </div>
                            <div className="text-[10px] text-emerald-700 font-medium">
                              Pengadaan Suku Cadang Baru
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-bold">
                              <Truck className="w-3 h-3 text-blue-600" />
                              <span>Copotan: {item.originNopol || 'Armada Pool'}</span>
                            </div>
                            {item.exchangedFromWorkOrder && (
                              <div className="text-[10px] font-mono text-slate-500">
                                Eks SPK: <strong>{item.exchangedFromWorkOrder}</strong>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Lokasi Rak */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1 text-slate-700 font-semibold text-xs">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.storageLocation}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Update: {formatDateIndo(item.lastUpdated)}
                        </div>
                      </td>

                      {/* Stok */}
                      <td className="py-3.5 px-3 text-center">
                        <div className={`inline-flex flex-col items-center px-3 py-1 rounded-xl border ${
                          isLow ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}>
                          <span className="text-sm font-black">
                            {formatNumber(item.stockQty)} <span className="text-[11px] font-semibold">{item.unit}</span>
                          </span>
                          {isLow ? (
                            <span className="text-[9px] font-bold text-rose-600 uppercase">
                              Min: {item.minStockWarning} (Menipis!)
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-400">
                              Batas Min: {item.minStockWarning}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Harga Satuan */}
                      <td className="py-3.5 px-3 text-right font-semibold text-slate-700">
                        <div>{formatRupiah(item.unitPrice)}</div>
                        <div className="text-[10px] text-slate-400">per {item.unit}</div>
                      </td>

                      {/* Total Nilai */}
                      <td className="py-3.5 px-3 text-right font-black text-slate-900">
                        {formatRupiah(item.stockQty * item.unitPrice)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1">
                          {canModify && (
                            <button
                              type="button"
                              onClick={() => openMovementModalForPart(item)}
                              title="Catat Barang Masuk / Keluar / Pasang ke Armada"
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Wrench className="w-3 h-3" />
                              <span>Mutasi</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedPartForPrint(item)}
                            title="Cetak Kartu Stok Gudang Sparepart"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {item.photoProofUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setInspectedProofUrl({
                                  title: `Foto / Nota Sparepart: ${item.partName} (${item.partCode})`,
                                  url: item.photoProofUrl!
                                })
                              }
                              title="Lihat Foto Fisik / Nota"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canModify && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                title="Edit Data Sparepart"
                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (await confirmDelete(`Sparepart "${item.partName}" (${item.partCode})`, 'Apakah Anda Yakin Ingin Menghapus Data?', `Kondisi: ${item.condition.toUpperCase()} • Stok: ${item.currentStock} ${item.unit}`)) {
                                    onDeleteSparepart(item.id);
                                  }
                                }}
                                title="Hapus Sparepart"
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {paginatedInventory.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                      Tidak ada item sparepart yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={currentPage}
            totalItems={activeListLength}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={size => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB VIEW 4: RIWAYAT MUTASI & SERAH TERIMA SPAREPART      */}
      {/* ======================================================== */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Log Mutasi Masuk / Keluar &amp; Berita Acara Serah Terima Suku Cadang
              </h3>
              <p className="text-xs text-slate-500">
                Mencatat pembelian part baru, penerimaan part bekas copotan dari truk, pengeluaran part untuk dipasang ke armada, hingga penjualan scrap.
              </p>
            </div>
            {canModify && (
              <button
                type="button"
                onClick={() => openMovementModalForPart()}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Mutasi Baru</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Tanggal &amp; No. Ref/SPK</th>
                  <th className="py-3.5 px-3">Jenis Mutasi</th>
                  <th className="py-3.5 px-3">Sparepart &amp; Kondisi</th>
                  <th className="py-3.5 px-3 text-center">Qty Mutasi</th>
                  <th className="py-3.5 px-3 text-right">Nilai Transaksi</th>
                  <th className="py-3.5 px-3">Armada &amp; Serah Terima Driver</th>
                  <th className="py-3.5 px-4 text-center">Cetak / Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedMovements.map(mov => {
                  const mMeta = MOVEMENT_TYPE_META[mov.movementType] || MOVEMENT_TYPE_META.out_install;
                  const cMeta = CONDITION_META[mov.condition] || CONDITION_META.baru;

                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/90 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{formatDateIndo(mov.date)}</div>
                        <div className="font-mono text-[11px] text-blue-700 font-semibold mt-0.5">
                          Ref: {mov.workOrderNumber || mov.id}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${mMeta.badgeClass}`}>
                          {mMeta.direction === 'in' ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          <span>{mMeta.label}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900">{mov.partName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-700">
                            {mov.partCode}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${cMeta.badgeClass}`}>
                            {cMeta.shortLabel}
                          </span>
                        </div>
                        {mov.notes && (
                          <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                            {mov.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`text-sm font-black ${
                            mMeta.direction === 'in' ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {mMeta.direction === 'in' ? '+' : '-'}
                          {formatNumber(mov.qty)} {mov.unit}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                        <div>{formatRupiah(mov.totalAmount)}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          @{formatRupiah(mov.unitPrice)}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        {mov.nopol ? (
                          <div className="space-y-0.5">
                            <div className="inline-flex items-center gap-1 font-bold text-slate-900">
                              <Truck className="w-3.5 h-3.5 text-blue-600" />
                              <span>{mov.nopol}</span>
                            </div>
                            {mov.driverName && (
                              <div className="text-[11px] text-slate-700 flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-emerald-600" />
                                <span>
                                  Driver: <strong>{mov.driverName}</strong>{' '}
                                  {mov.driverNip ? `[${mov.driverNip}]` : ''}
                                </span>
                              </div>
                            )}
                            <div className="text-[10px] text-slate-500">
                              Petugas: {mov.mechanicOrStaffName}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-600">
                            <div>Gudang Internal Pool</div>
                            <div className="text-[10px] text-slate-400">
                              Petugas: {mov.mechanicOrStaffName}
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedMovementForPrint(mov)}
                            title="Cetak Bukti Serah Terima Gudang Sparepart"
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Slip Bukti</span>
                          </button>
                          {mov.receiptProofUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setInspectedProofUrl({
                                  title: `Bukti Nota / Foto Serah Terima: ${mov.partName}`,
                                  url: mov.receiptProofUrl!
                                })
                              }
                              title="Lihat Lampiran Nota/Foto"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canModify && onDeleteMovement && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (await confirmDelete(`Log Mutasi Sparepart "${mov.partName}"`, 'Apakah Anda Yakin Ingin Menghapus Data?', `Ref: ${mov.workOrderNumber || mov.id} • Qty: ${mov.qty} ${mov.unit}`)) {
                                  onDeleteMovement(mov.id);
                                }
                              }}
                              title="Hapus Log Mutasi"
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={currentPage}
            totalItems={activeListLength}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={size => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB VIEW 5: LAPORAN & ANALITIK INVENTORY SPAREPART       */}
      {/* ======================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Bar Chart: Nilai Stok Baru vs Bekas per Kategori */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Perbandingan Nilai Stok Sparepart Baru vs Bekas per Kategori
                  </h3>
                  <p className="text-xs text-slate-500">
                    Distribusi valuasi aset suku cadang baru (OEM) dan nilai taksir part bekas/rekondisi
                  </p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBreakdownData} margin={{ top: 10, right: 15, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="category" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                    <YAxis tickFormatter={v => `${Math.round(v / 1000000)}Jt`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: any) => formatRupiah(Number(value) || 0)} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="nilaiBaru" name="Nilai Sparepart Baru (OEM)" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="nilaiBekas" name="Nilai Sparepart Bekas & Rekondisi" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart: Komposisi Kondisi Sparepart */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Proporsi Nilai Berdasarkan Status Kondisi Part
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Rasio nilai persediaan Baru, Bekas Layak Pakai, Rekondisi, dan Afkir/Scrap
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={conditionPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={82}
                      label={({ name, percent }) => `${name.split(' ')[0]} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {conditionPieData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatRupiah(Number(value) || 0)} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tabel Rekapitulasi Mutasi & Pengeluaran Pemakaian Sparepart Masing-Masing Perusahaan */}
          <div className="bg-white rounded-3xl border border-indigo-200/80 p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  🏢 Rekapitulasi Mutasi &amp; Pengeluaran Sparepart Masing-Masing Perusahaan
                </h3>
                <p className="text-xs text-slate-500">
                  Rincian nilai pengeluaran pemasangan suku cadang baru/bekas ke armada dan nilai part bekas copotan yang masuk kembali ke gudang per perusahaan
                </p>
              </div>
              {selectedCompany !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCompany('all')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold hover:bg-indigo-100 transition cursor-pointer"
                >
                  Tampilkan Semua Perusahaan
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-indigo-50/70 text-indigo-950 font-bold uppercase text-[11px] border-b border-indigo-100">
                    <th className="py-3 px-4">Nama Perusahaan Pemilik Armada</th>
                    <th className="py-3 px-3 text-center">Jumlah Transaksi Mutasi</th>
                    <th className="py-3 px-3 text-right">Pengeluaran Pemasangan Part (Rp)</th>
                    <th className="py-3 px-3 text-right">Nilai Part Bekas Copotan Masuk (Rp)</th>
                    <th className="py-3 px-4 text-center">Aksi Filter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companyMovementStats.map(stat => {
                    const isSelected = selectedCompany === stat.companyName;
                    return (
                      <tr key={stat.companyName} className={isSelected ? 'bg-indigo-50/50 font-semibold' : 'hover:bg-slate-50'}>
                        <td className="py-3 px-4 font-bold text-slate-900">🏢 {stat.companyName}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                          {stat.movementCount} transaksi
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                          {formatRupiah(stat.totalInstallExpense)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-blue-700">
                          {formatRupiah(stat.totalUsedRecovered)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCompany(isSelected ? 'all' : stat.companyName);
                              setActiveTab('movements');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition cursor-pointer"
                          >
                            Lihat Rincian Mutasi
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabel Rekapitulasi Kategori Baru vs Bekas */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Tabel Rekapitulasi Valuasi Gudang per Kategori Suku Cadang
                </h3>
                <p className="text-xs text-slate-500">
                  Ringkasan jumlah stok fisik dan nilai rupiah untuk audit gudang peralatan &amp; sparepart
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAnalyticsPrintOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Rekapitulasi Gudang</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                    <th className="py-3 px-4">Kategori Suku Cadang</th>
                    <th className="py-3 px-3 text-center">Qty Part Baru</th>
                    <th className="py-3 px-3 text-right">Nilai Part Baru</th>
                    <th className="py-3 px-3 text-center">Qty Part Bekas</th>
                    <th className="py-3 px-3 text-right">Nilai Taksir Part Bekas</th>
                    <th className="py-3 px-4 text-right">Total Nilai Kategori</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categoryBreakdownData.map(row => (
                    <tr key={row.category} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{row.category}</td>
                      <td className="py-3 px-3 text-center font-semibold text-emerald-700">
                        {formatNumber(row.qtyBaru)} item
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-emerald-800">
                        {formatRupiah(row.nilaiBaru)}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-blue-700">
                        {formatNumber(row.qtyBekas)} item
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-blue-800">
                        {formatRupiah(row.nilaiBekas)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {formatRupiah(row.nilaiBaru + row.nilaiBekas)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: TAMBAH / EDIT SPAREPART BARU & BEKAS            */}
      {/* ======================================================== */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base">
                  {editingItem
                    ? `Edit Data Inventory Sparepart (${editingItem.partCode})`
                    : 'Tambah / Record Sparepart Baru & Bekas ke Gudang'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              {/* Pilihan Kondisi: Baru vs Bekas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Status Kondisi Sparepart *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(CONDITION_META) as SparepartConditionType[]).map(condKey => {
                    const meta = CONDITION_META[condKey];
                    const selected = formData.condition === condKey;
                    return (
                      <button
                        key={condKey}
                        type="button"
                        onClick={() =>
                          setFormData(prev => ({
                            ...prev,
                            condition: condKey,
                            storageLocation:
                              condKey === 'baru'
                                ? 'Gudang Pool Utama - Rak A-01'
                                : condKey === 'bekas_rusak_afkir'
                                ? 'Gudang Karantina Scrap - Blok F-01'
                                : 'Gudang Part Bekas - Rak C-01'
                          }))
                        }
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                          selected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center justify-between">
                          <span>{meta.shortLabel}</span>
                          {selected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <div className={`text-[10px] mt-0.5 ${selected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {meta.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kode SKU / Part Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.partCode}
                    onChange={e => setFormData({ ...formData, partCode: e.target.value })}
                    placeholder="Contoh: PN-HINO-15607"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Suku Cadang / Sparepart *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.partName}
                    onChange={e => setFormData({ ...formData, partName: e.target.value })}
                    placeholder="Contoh: Filter Oli Mesin Hino 500 / Ban Copotan 11.00-R20"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Merk / Brand OEM</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Bridgestone / Hino HOP / GS"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Peruntukan Unit Armada
                  </label>
                  <input
                    type="text"
                    value={formData.compatibleVehicles}
                    onChange={e => setFormData({ ...formData, compatibleVehicles: e.target.value })}
                    placeholder="Hino 500, Fuso Canter, dll"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Khusus Sparepart Bekas: Unit Asal Copotan & No SPK */}
              {formData.condition !== 'baru' ? (
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 space-y-3">
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Recycle className="w-4 h-4 text-blue-600" />
                    <span>Informasi Asal Copotan Sparepart Bekas / Rekondisi</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 mb-1">
                        Unit Armada Asal Copotan (Nopol)
                      </label>
                      <select
                        value={formData.originVehicleId}
                        onChange={e => {
                          const v = safeVehicles.find(veh => veh.id === e.target.value);
                          setFormData({
                            ...formData,
                            originVehicleId: e.target.value,
                            originNopol: v?.nopol || ''
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-blue-300 bg-white text-xs font-semibold"
                      >
                        <option value="">-- Pilih Armada Asal Copotan --</option>
                        {safeVehicles.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.nopol} - {v.brand} ({v.assignedDriver || 'Tanpa Supir'})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 mb-1">
                        Nomor SPK Bengkel Saat Dicopot
                      </label>
                      <input
                        type="text"
                        value={formData.exchangedFromWorkOrder}
                        onChange={e => setFormData({ ...formData, exchangedFromWorkOrder: e.target.value })}
                        placeholder="Contoh: SPK-202608-004"
                        className="w-full px-3 py-2 rounded-xl border border-blue-300 bg-white text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supplier / Toko Pembelian Part Baru
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={e => {
                      const sup = safeSuppliers.find(s => s.id === e.target.value);
                      setFormData({
                        ...formData,
                        supplierId: e.target.value,
                        supplierName: sup?.name || ''
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  >
                    <option value="">-- Pilih Supplier Suku Cadang --</option>
                    {safeSuppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Stok *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.stockQty}
                    onChange={e => setFormData({ ...formData, stockQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan *</label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  >
                    {['Pcs', 'Set', 'Unit', 'Liter', 'Lembar', 'Pasang', 'Drum', 'Kg'].map(u => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Batas Min Alert</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.minStockWarning}
                    onChange={e => setFormData({ ...formData, minStockWarning: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {formData.condition === 'baru' ? 'Harga Beli Satuan (Rp)' : 'Nilai Taksir Satuan (Rp)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.unitPrice}
                    onChange={e => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lokasi Penyimpanan Rak Gudang *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.storageLocation}
                    onChange={e => setFormData({ ...formData, storageLocation: e.target.value })}
                    placeholder="Gudang Pool Rak A-02 / Gudang Part Bekas Rak C-01"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Kondisi Fisik / Keterangan
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Contoh: Kondisi tapak ban 70% layak pasang serep"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <ReceiptUploadField
                label="Upload Foto Fisik Sparepart (Baru/Bekas) atau Nota Pembelian"
                value={formData.photoProofUrl}
                onChange={url => setFormData({ ...formData, photoProofUrl: url })}
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  {editingItem ? 'Simpan Perubahan Sparepart' : 'Simpan ke Inventory Gudang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CATAT MUTASI KELUAR/MASUK & SERAH TERIMA PART   */}
      {/* ======================================================== */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden my-8">
            <div className="px-6 py-4 bg-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base">
                  Catat Mutasi Stok &amp; Serah Terima Sparepart Gudang
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMovementModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-indigo-900 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Item Sparepart (Baru / Bekas) *
                </label>
                <select
                  value={movForm.partId}
                  onChange={e => {
                    const p = safeInventory.find(item => item.id === e.target.value);
                    setMovForm({
                      ...movForm,
                      partId: e.target.value,
                      unitPrice: p?.unitPrice || 0
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900"
                >
                  {safeInventory.map(p => (
                    <option key={p.id} value={p.id}>
                      [{CONDITION_META[p.condition].shortLabel}] {p.partCode} - {p.partName} (Stok: {p.stockQty} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Transaksi Mutasi *
                  </label>
                  <select
                    value={movForm.movementType}
                    onChange={e => setMovForm({ ...movForm, movementType: e.target.value as SparepartMovementType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  >
                    <option value="out_install">(-) Keluar: Dipasang ke Unit Armada</option>
                    <option value="in_purchase">(+) Masuk: Pembelian Sparepart Baru</option>
                    <option value="in_removed_used">(+) Masuk: Terima Copotan Bekas Armada</option>
                    <option value="out_scrap_sale">(-) Keluar: Penjualan Limbah / Part Bekas Afkir</option>
                    <option value="adjustment">(=) Penyesuaian Stok Opname Gudang</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Mutasi *</label>
                  <input
                    type="date"
                    required
                    value={movForm.date}
                    onChange={e => setMovForm({ ...movForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jumlah (Qty) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={movForm.qty}
                    onChange={e => setMovForm({ ...movForm, qty: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harga Satuan / Nilai Taksir (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={movForm.unitPrice}
                    onChange={e => setMovForm({ ...movForm, unitPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Referensi Armada & Karyawan Driver untuk Serah Terima */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>Referensi Armada &amp; Serah Terima Karyawan Driver / Mekanik</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Unit Kendaraan Terkait (Nopol)
                    </label>
                    <select
                      value={movForm.vehicleId}
                      onChange={e => {
                        const veh = safeVehicles.find(v => v.id === e.target.value);
                        const matchedDrv = safeDrivers.find(d => d.name === veh?.assignedDriver);
                        setMovForm({
                          ...movForm,
                          vehicleId: e.target.value,
                          driverId: matchedDrv?.id || movForm.driverId,
                          driverName: matchedDrv?.name || veh?.assignedDriver || movForm.driverName,
                          driverNip: matchedDrv?.nip || movForm.driverNip
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                    >
                      <option value="">-- Gudang Pool / Tanpa Unit --</option>
                      {safeVehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.nopol} - {v.brand}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Karyawan Driver Penerima / Penyerah
                    </label>
                    <select
                      value={movForm.driverId}
                      onChange={e => {
                        const drv = safeDrivers.find(d => d.id === e.target.value);
                        setMovForm({
                          ...movForm,
                          driverId: e.target.value,
                          driverName: drv?.name || '',
                          driverNip: drv?.nip || ''
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                    >
                      <option value="">-- Pilih Karyawan Driver --</option>
                      {safeDrivers.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} [{d.nip || d.id}]
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Petugas Gudang / Mekanik Bengkel *
                    </label>
                    <input
                      type="text"
                      required
                      value={movForm.mechanicOrStaffName}
                      onChange={e => setMovForm({ ...movForm, mechanicOrStaffName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      No. SPK Bengkel / Bukti Gudang
                    </label>
                    <input
                      type="text"
                      value={movForm.workOrderNumber}
                      onChange={e => setMovForm({ ...movForm, workOrderNumber: e.target.value })}
                      placeholder="SPK-202608-015"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Mutasi / Berita Acara Serah Terima
                </label>
                <input
                  type="text"
                  value={movForm.notes}
                  onChange={e => setMovForm({ ...movForm, notes: e.target.value })}
                  placeholder="Contoh: Penggantian filter oli baru & penyerahan filter bekas ke gudang"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <ReceiptUploadField
                label="Upload Bukti Nota / Foto Serah Terima Suku Cadang"
                value={movForm.receiptProofUrl}
                onChange={url => setMovForm({ ...movForm, receiptProofUrl: url })}
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Simpan Mutasi &amp; Update Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: PRINT PREVIEW KARTU STOK SPAREPART              */}
      {/* ======================================================== */}
      {selectedPartForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base">
                  Pratinjau Cetak Kartu Stok Gudang Sparepart ({selectedPartForPrint.partCode})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    printElementById(
                      'printable-sparepart-card',
                      `Kartu_Stok_${selectedPartForPrint.partCode}`
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Printer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPartForPrint(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 max-h-[82vh] overflow-y-auto">
              <PrintOutPreviewStage
                printElementId="printable-sparepart-card"
                documentTitle={`Kartu_Stok_${selectedPartForPrint.partCode}`}
              >
                <div id="printable-sparepart-card" className="p-6 text-slate-900 font-mono text-xs space-y-4">
                  <div className="text-center border-b-2 border-slate-900 pb-3">
                    <div className="text-base font-black tracking-wide">
                      GUDANG LOGISTIK &amp; SPAREPART ARMADA - 44S OPS_PRO
                    </div>
                    <div className="text-[11px] font-bold mt-0.5">
                      KARTU STOK FISIK SUKU CADANG (BARU &amp; BEKAS)
                    </div>
                    <div className="text-[11px] mt-1 font-bold">
                      KODE SKU: {selectedPartForPrint.partCode} &bull; STATUS: {CONDITION_META[selectedPartForPrint.condition].shortLabel}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px] border-b border-slate-300 pb-3">
                    <div>
                      <div>Nama Sparepart : <strong>{selectedPartForPrint.partName}</strong></div>
                      <div>Kategori       : {selectedPartForPrint.category}</div>
                      <div>Merk / Brand   : {selectedPartForPrint.brand || '-'}</div>
                      <div>Unit Kompatibel: {selectedPartForPrint.compatibleVehicles || 'Semua Unit'}</div>
                    </div>
                    <div>
                      <div>Lokasi Rak     : <strong>{selectedPartForPrint.storageLocation}</strong></div>
                      <div>Stok Saat Ini  : <strong>{selectedPartForPrint.stockQty} {selectedPartForPrint.unit}</strong></div>
                      <div>Harga / Taksir : {formatRupiah(selectedPartForPrint.unitPrice)} / {selectedPartForPrint.unit}</div>
                      <div>Total Valuasi  : <strong>{formatRupiah(selectedPartForPrint.stockQty * selectedPartForPrint.unitPrice)}</strong></div>
                      {selectedPartForPrint.originNopol && (
                        <div>Asal Copotan   : Unit {selectedPartForPrint.originNopol} ({selectedPartForPrint.exchangedFromWorkOrder || '-'})</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="font-bold text-xs mb-2">RIWAYAT MUTASI KELUAR / MASUK ITEM INI:</div>
                    <table className="w-full border-collapse border border-slate-400 text-[10px]">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-400 p-1.5 text-left">Tanggal</th>
                          <th className="border border-slate-400 p-1.5 text-left">Jenis Mutasi</th>
                          <th className="border border-slate-400 p-1.5 text-center">Qty</th>
                          <th className="border border-slate-400 p-1.5 text-left">Unit / Driver</th>
                          <th className="border border-slate-400 p-1.5 text-left">Ref SPK / Petugas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {safeMovements
                          .filter(m => m.partId === selectedPartForPrint.id || m.partCode === selectedPartForPrint.partCode)
                          .map(m => (
                            <tr key={m.id}>
                              <td className="border border-slate-400 p-1.5">{m.date}</td>
                              <td className="border border-slate-400 p-1.5">{MOVEMENT_TYPE_META[m.movementType]?.label}</td>
                              <td className="border border-slate-400 p-1.5 text-center font-bold">
                                {MOVEMENT_TYPE_META[m.movementType]?.direction === 'in' ? '+' : '-'}
                                {m.qty} {m.unit}
                              </td>
                              <td className="border border-slate-400 p-1.5">
                                {m.nopol || '-'} {m.driverName ? `/ ${m.driverName}` : ''}
                              </td>
                              <td className="border border-slate-400 p-1.5">
                                {m.workOrderNumber || '-'} ({m.mechanicOrStaffName})
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-2 text-center pt-6 text-[11px]">
                    <div>
                      <div>Diperiksa Oleh,</div>
                      <div className="mt-12 font-bold underline">Hendra Kusuma, A.Md.T.</div>
                      <div className="text-[10px]">Kepala Gudang Sparepart</div>
                    </div>
                    <div>
                      <div>Mengetahui,</div>
                      <div className="mt-12 font-bold underline">Budi Santoso, S.T.</div>
                      <div className="text-[10px]">Koordinator Operasional &amp; Bengkel</div>
                    </div>
                  </div>
                </div>
              </PrintOutPreviewStage>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: PRINT PREVIEW BUKTI SERAH TERIMA MUTASI PART    */}
      {/* ======================================================== */}
      {selectedMovementForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base">
                  Pratinjau Slip Serah Terima Suku Cadang ({selectedMovementForPrint.id})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    printElementById(
                      'printable-sparepart-movement-slip',
                      `Bukti_Serah_Terima_Part_${selectedMovementForPrint.id}`
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Printer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMovementForPrint(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 max-h-[82vh] overflow-y-auto">
              <PrintOutPreviewStage
                printElementId="printable-sparepart-movement-slip"
                documentTitle={`Bukti_Serah_Terima_Part_${selectedMovementForPrint.id}`}
              >
                <div id="printable-sparepart-movement-slip" className="p-6 text-slate-900 font-mono text-xs space-y-4">
                  <div className="text-center border-b-2 border-slate-900 pb-3">
                    <div className="text-base font-black">
                      BERITA ACARA MUTASI &amp; SERAH TERIMA SPAREPART GUDANG
                    </div>
                    <div className="text-[11px] font-bold">
                      NO. DOKUMEN: {selectedMovementForPrint.id} / REF: {selectedMovementForPrint.workOrderNumber || '-'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <div>Tanggal Transaksi : {formatDateIndo(selectedMovementForPrint.date)}</div>
                      <div>Jenis Mutasi      : <strong>{MOVEMENT_TYPE_META[selectedMovementForPrint.movementType]?.label}</strong></div>
                      <div>Kondisi Barang    : <strong>{CONDITION_META[selectedMovementForPrint.condition]?.shortLabel}</strong></div>
                    </div>
                    <div>
                      <div>Unit Armada (Nopol): <strong>{selectedMovementForPrint.nopol || 'Gudang Pool'}</strong></div>
                      <div>Karyawan Driver    : <strong>{selectedMovementForPrint.driverName || '-'}</strong> {selectedMovementForPrint.driverNip ? `[${selectedMovementForPrint.driverNip}]` : ''}</div>
                      <div>Petugas / Mekanik  : {selectedMovementForPrint.mechanicOrStaffName}</div>
                    </div>
                  </div>

                  <div className="border-t border-b border-slate-400 py-3">
                    <div className="flex justify-between font-bold">
                      <span>
                        {selectedMovementForPrint.partCode} - {selectedMovementForPrint.partName}
                      </span>
                      <span>
                        {selectedMovementForPrint.qty} {selectedMovementForPrint.unit} x {formatRupiah(selectedMovementForPrint.unitPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-black mt-2 pt-2 border-t border-dashed border-slate-300">
                      <span>TOTAL NILAI SUKU CADANG:</span>
                      <span>{formatRupiah(selectedMovementForPrint.totalAmount)}</span>
                    </div>
                    {selectedMovementForPrint.notes && (
                      <div className="text-[11px] mt-2">
                        Catatan: {selectedMovementForPrint.notes}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 text-center pt-6 text-[11px]">
                    <div>
                      <div>Diserahkan / Diterima Driver,</div>
                      <div className="mt-12 font-bold underline">
                        {selectedMovementForPrint.driverName || 'Pengemudi / Mekanik'}
                      </div>
                    </div>
                    <div>
                      <div>Kepala Gudang Sparepart,</div>
                      <div className="mt-12 font-bold underline">
                        {selectedMovementForPrint.mechanicOrStaffName}
                      </div>
                    </div>
                  </div>
                </div>
              </PrintOutPreviewStage>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: PRINT PREVIEW LAPORAN REKAPITULASI GUDANG       */}
      {/* ======================================================== */}
      {isAnalyticsPrintOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-5xl w-full overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base">
                  Pratinjau Cetak Laporan Stok Gudang Sparepart (Baru &amp; Bekas)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    printElementById(
                      'printable-sparepart-full-report',
                      `Laporan_Inventory_Sparepart_Baru_Bekas`
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Printer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAnalyticsPrintOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 max-h-[82vh] overflow-y-auto">
              <PrintOutPreviewStage
                printElementId="printable-sparepart-full-report"
                documentTitle="Laporan_Inventory_Sparepart_Baru_Bekas"
              >
                <div id="printable-sparepart-full-report" className="p-6 text-slate-900 font-mono text-xs space-y-4">
                  <div className="text-center border-b-2 border-slate-900 pb-3">
                    <div className="text-base font-black">
                      LAPORAN POSISI STOK INVENTORY SPAREPART BARU &amp; BEKAS
                    </div>
                    <div className="text-[11px]">
                      Dicetak Tanggal: {formatDateIndo(new Date().toISOString().slice(0, 10))} &bull; Total SKU: {kpiStats.totalSkus} Item ({kpiStats.newSkus} Baru, {kpiStats.usedSkus} Bekas)
                    </div>
                    <div className="text-xs font-bold mt-1">
                      Nilai Stok Baru: {formatRupiah(kpiStats.totalNewValue)} | Nilai Stok Bekas: {formatRupiah(kpiStats.totalUsedValue)} | Total: {formatRupiah(kpiStats.grandTotalValue)}
                    </div>
                  </div>

                  <table className="w-full border-collapse border border-slate-400 text-[10px]">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-400 p-1.5 text-left">Kode SKU</th>
                        <th className="border border-slate-400 p-1.5 text-left">Nama Sparepart</th>
                        <th className="border border-slate-400 p-1.5 text-left">Status Kondisi</th>
                        <th className="border border-slate-400 p-1.5 text-left">Asal / Copotan</th>
                        <th className="border border-slate-400 p-1.5 text-left">Lokasi Rak</th>
                        <th className="border border-slate-400 p-1.5 text-center">Stok</th>
                        <th className="border border-slate-400 p-1.5 text-right">Harga/Taksir</th>
                        <th className="border border-slate-400 p-1.5 text-right">Total Nilai</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safeInventory.map(item => (
                        <tr key={item.id}>
                          <td className="border border-slate-400 p-1.5 font-bold">{item.partCode}</td>
                          <td className="border border-slate-400 p-1.5">{item.partName}</td>
                          <td className="border border-slate-400 p-1.5">{CONDITION_META[item.condition]?.shortLabel}</td>
                          <td className="border border-slate-400 p-1.5">
                            {item.condition === 'baru' ? item.supplierName || 'Supplier Baru' : `Eks ${item.originNopol || 'Armada'}`}
                          </td>
                          <td className="border border-slate-400 p-1.5">{item.storageLocation}</td>
                          <td className="border border-slate-400 p-1.5 text-center font-bold">
                            {item.stockQty} {item.unit}
                          </td>
                          <td className="border border-slate-400 p-1.5 text-right">{formatRupiah(item.unitPrice)}</td>
                          <td className="border border-slate-400 p-1.5 text-right font-bold">
                            {formatRupiah(item.stockQty * item.unitPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </PrintOutPreviewStage>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: INSPECT PHOTO / RECEIPT PROOF                   */}
      {/* ======================================================== */}
      {inspectedProofUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="text-xs sm:text-sm font-bold truncate pr-3">{inspectedProofUrl.title}</div>
              <button
                type="button"
                onClick={() => setInspectedProofUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center max-h-[75vh] overflow-y-auto">
              <img
                src={resolveDisplayReceiptUrl(inspectedProofUrl.url, {
                  title: 'BUKTI NOTA / FOTO SPAREPART',
                  subtitle: inspectedProofUrl.title
                })}
                alt={inspectedProofUrl.title}
                className="max-w-full rounded-xl border border-slate-300 shadow-sm bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
