import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  Layers,
  Gauge,
  Calendar,
  AlertCircle,
  Tag
} from 'lucide-react';
import {
  ServiceTypeReference,
  ServiceCategory,
  UserRole
} from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { confirmDelete } from '../../utils/dialogService';

interface ServiceTypeManagerProps {
  serviceTypes: ServiceTypeReference[];
  userRole?: UserRole;
  onAddServiceType: (st: ServiceTypeReference) => void;
  onUpdateServiceType: (st: ServiceTypeReference) => void;
  onDeleteServiceType: (id: string) => void;
  onOpenRoleMatrix?: () => void;
}

export const ServiceTypeManager: React.FC<ServiceTypeManagerProps> = ({
  serviceTypes = [],
  userRole = 'owner',
  onAddServiceType,
  onUpdateServiceType,
  onDeleteServiceType,
  onOpenRoleMatrix
}) => {
  const safeServiceTypes = Array.isArray(serviceTypes) ? serviceTypes : [];
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceTypeReference | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ServiceTypeReference>>({
    code: '',
    name: '',
    category: 'routine',
    defaultIntervalKm: 5000,
    defaultIntervalDays: 90,
    estimatedCost: 500000,
    description: '',
    commonParts: [],
    isActive: true
  });

  const [partInput, setPartInput] = useState('');

  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin1' || userRole === 'admin2';

  const getCategoryMeta = (cat: ServiceCategory) => {
    switch (cat) {
      case 'routine':
        return {
          label: 'Servis Rutin Berkala',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dotColor: 'bg-emerald-500'
        };
      case 'preventive':
        return {
          label: 'Pemeliharaan Preventif',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
          dotColor: 'bg-blue-500'
        };
      case 'corrective':
        return {
          label: 'Perbaikan Kerusakan',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          dotColor: 'bg-amber-500'
        };
      case 'heavy':
        return {
          label: 'Perbaikan Berat / Overhaul',
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
          dotColor: 'bg-rose-500'
        };
      case 'body_electrical':
        return {
          label: 'Kelistrikan & Karoseri',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
          dotColor: 'bg-purple-500'
        };
      default:
        return {
          label: 'Servis Umum',
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
          dotColor: 'bg-slate-400'
        };
    }
  };

  // Filtered List
  const filteredTypes = safeServiceTypes.filter((item) => {
    if (!item) return false;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (item.name || '').toLowerCase().includes(q) ||
      (item.code || '').toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q) ||
      (item.commonParts || []).some(p => p.toLowerCase().includes(q));

    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? item.isActive
        : !item.isActive;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // KPI Calculations
  const totalItems = safeServiceTypes.length;
  const activeCount = safeServiceTypes.filter(s => s.isActive).length;
  const routineCount = safeServiceTypes.filter(s => s.category === 'routine').length;
  const avgIntervalKm = Math.round(
    safeServiceTypes.reduce((sum, s) => sum + (s.defaultIntervalKm || 0), 0) / (totalItems || 1)
  );

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      code: `SRV-${Date.now().toString().slice(-4)}`,
      name: '',
      category: 'routine',
      defaultIntervalKm: 5000,
      defaultIntervalDays: 90,
      estimatedCost: 750000,
      description: '',
      commonParts: ['Oli Mesin', 'Filter'],
      isActive: true
    });
    setPartInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ServiceTypeReference) => {
    setEditingItem(item);
    setFormData({ ...item });
    setPartInput('');
    setIsModalOpen(true);
  };

  const handleAddPart = () => {
    if (!partInput.trim()) return;
    const currentParts = formData.commonParts || [];
    if (!currentParts.includes(partInput.trim())) {
      setFormData({
        ...formData,
        commonParts: [...currentParts, partInput.trim()]
      });
    }
    setPartInput('');
  };

  const handleRemovePart = (partToRemove: string) => {
    setFormData({
      ...formData,
      commonParts: (formData.commonParts || []).filter(p => p !== partToRemove)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    if (editingItem) {
      onUpdateServiceType({
        ...editingItem,
        ...(formData as ServiceTypeReference)
      });
    } else {
      const newItem: ServiceTypeReference = {
        id: `ST-${Date.now().toString().slice(-6)}`,
        code: (formData.code || `SRV-${Date.now().toString().slice(-4)}`).toUpperCase(),
        name: formData.name || '',
        category: formData.category || 'routine',
        defaultIntervalKm: Number(formData.defaultIntervalKm) || 5000,
        defaultIntervalDays: Number(formData.defaultIntervalDays) || 90,
        estimatedCost: Number(formData.estimatedCost) || 0,
        description: formData.description || '',
        commonParts: formData.commonParts || [],
        isActive: formData.isActive !== false,
        createdAt: new Date().toISOString().split('T')[0]
      };
      onAddServiceType(newItem);
    }
    setIsModalOpen(false);
  };

  const handleToggleActive = (item: ServiceTypeReference) => {
    onUpdateServiceType({
      ...item,
      isActive: !item.isActive
    });
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = filteredTypes.map((item, idx) => ({
      'No': idx + 1,
      'Kode Servis': item.code,
      'Nama Jenis Servis': item.name,
      'Kategori': getCategoryMeta(item.category).label,
      'Interval KM': item.defaultIntervalKm,
      'Interval Hari': item.defaultIntervalDays,
      'Estimasi Biaya Standar (Rp)': item.estimatedCost,
      'Sparepart Rekomendasi': (item.commonParts || []).join(', '),
      'Status': item.isActive ? 'AKTIF' : 'NONAKTIF',
      'Deskripsi': item.description
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Master_Jenis_Servis');
    XLSX.writeFile(wb, `Master_Jenis_Servis_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(15, 118, 110);
    doc.rect(0, 0, pageWidth, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('44S OPS_PRO - MASTER REFERENSI JENIS SERVIS & PEMELIHARAAN', 14, 11);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Standar Intervensi Bengkel & Pemeliharaan Armada | Total: ${filteredTypes.length} Jenis Pekerjaan`, 14, 17);

    const bodyData = filteredTypes.map((st, idx) => [
      idx + 1,
      st.code,
      st.name,
      getCategoryMeta(st.category).label,
      `${formatNumber(st.defaultIntervalKm)} KM / ${st.defaultIntervalDays} Hari`,
      formatRupiah(st.estimatedCost),
      (st.commonParts || []).slice(0, 3).join(', '),
      st.isActive ? 'AKTIF' : 'NONAKTIF'
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['No', 'Kode', 'Jenis Servis / Pemeliharaan', 'Kategori', 'Interval Standar', 'Est. Biaya', 'Sparepart Rekomendasi', 'Status']],
      body: bodyData,
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold' }
    });

    doc.save(`Master_Jenis_Servis_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 border border-teal-200 rounded-xl text-teal-700">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Master Referensi Jenis Servis &amp; Pemeliharaan
              </h2>
              <p className="text-xs text-slate-400">
                Katalog pekerjaan bengkel, interval KM berkala, estimasi biaya standar &amp; sparepart armada
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition shadow-2xs"
            title="Download Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition shadow-2xs"
            title="Download PDF"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>PDF</span>
          </button>
          {isOwnerOrAdmin && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jenis Servis</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Jenis Servis</span>
            <div className="text-2xl font-bold font-mono text-slate-800 mt-0.5">{totalItems}</div>
            <span className="text-[10px] text-teal-600 font-semibold">{activeCount} siap digunakan</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Servis Rutin Berkala</span>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-0.5">{routineCount}</div>
            <span className="text-[10px] text-slate-400">Ganti oli, filter &amp; pelumasan</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rata-rata Interval</span>
            <div className="text-2xl font-bold font-mono text-blue-700 mt-0.5">{formatNumber(avgIntervalKm)} <span className="text-xs font-sans font-normal text-slate-400">KM</span></div>
            <span className="text-[10px] text-slate-400">Pemicu jadwal reminder otomatis</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Gauge className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status Operasional</span>
            <div className="text-2xl font-bold font-mono text-slate-800 mt-0.5">100%</div>
            <span className="text-[10px] text-emerald-600 font-semibold">Tersinkron ke SPK &amp; Bengkel</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode servis, nama pekerjaan, sparepart..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-teal-500 focus:bg-white transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-teal-500"
          >
            <option value="all">Semua Kategori</option>
            <option value="routine">Servis Rutin Berkala</option>
            <option value="preventive">Pemeliharaan Preventif</option>
            <option value="corrective">Perbaikan Kerusakan</option>
            <option value="heavy">Perbaikan Berat / Overhaul</option>
            <option value="body_electrical">Kelistrikan &amp; Karoseri</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-teal-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Hanya Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Grid of Service Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTypes.map((item) => {
          const catMeta = getCategoryMeta(item.category);

          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl bg-white border transition duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between ${
                item.isActive ? 'border-slate-200/90' : 'border-slate-200/60 opacity-60 bg-slate-50/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/70">
                      {item.code}
                    </span>
                    <h3 className="font-bold text-sm text-slate-800 mt-1 leading-snug">
                      {item.name}
                    </h3>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${catMeta.badgeColor}`}>
                    {catMeta.label}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-3.5 leading-relaxed">
                  {item.description || 'Tidak ada catatan teknis tambahan.'}
                </p>

                {/* Technical Specifications */}
                <div className="space-y-1.5 py-2.5 px-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-teal-600" /> Interval Odometer:
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatNumber(item.defaultIntervalKm)} KM
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-600" /> Interval Kalender:
                    </span>
                    <span className="font-bold text-slate-800">
                      {item.defaultIntervalDays} Hari
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-600" /> Est. Biaya Servis:
                    </span>
                    <span className="font-mono font-bold text-emerald-700">
                      {formatRupiah(item.estimatedCost)}
                    </span>
                  </div>
                </div>

                {/* Common Parts Tags */}
                {item.commonParts && item.commonParts.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Suku Cadang Terkait:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.commonParts.map((part, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200/60"
                        >
                          <Tag className="w-2.5 h-2.5 text-slate-400" />
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleToggleActive(item)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
                  title={item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {item.isActive ? (
                    <>
                      <ToggleRight className="w-5 h-5 text-teal-600" />
                      <span className="text-[11px] text-teal-700">Aktif</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-5 h-5 text-slate-400" />
                      <span className="text-[11px] text-slate-400">Nonaktif</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  {isOwnerOrAdmin && (
                    <>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition"
                        title="Edit Data Jenis Servis"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (await confirmDelete(`Master Jenis Servis "${item.name}"`, 'Apakah Anda Yakin Ingin Menghapus Data?', `Kode: ${item.code} • Kategori: ${item.category}`)) {
                            onDeleteServiceType(item.id);
                          }
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Hapus Data"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTypes.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="font-bold text-slate-700 text-sm">Tidak Ada Jenis Servis Ditemukan</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Coba sesuaikan kata kunci pencarian atau filter status untuk menemukan jenis servis yang diinginkan.
          </p>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 rounded-xl text-teal-600">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    {editingItem ? `Edit Jenis Servis: ${editingItem.name}` : 'Tambah Master Jenis Servis Baru'}
                  </h3>
                  <p className="text-[10px] text-slate-400">Atur parameter interval dan suku cadang rekomendasi</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Kode Servis *</label>
                  <input
                    type="text"
                    required
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. SRV-OLI-MESIN"
                    className="w-full bg-slate-50 font-mono uppercase border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-teal-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Kategori Pekerjaan *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ServiceCategory })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-teal-500 focus:bg-white font-medium"
                  >
                    <option value="routine">Servis Rutin Berkala</option>
                    <option value="preventive">Pemeliharaan Preventif</option>
                    <option value="corrective">Perbaikan Kerusakan</option>
                    <option value="heavy">Perbaikan Berat / Overhaul</option>
                    <option value="body_electrical">Kelistrikan &amp; Karoseri</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Nama Jenis Servis / Pemeliharaan *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ganti Oli Mesin & Filter Oli"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Interval KM *</label>
                  <input
                    type="number"
                    required
                    value={formData.defaultIntervalKm || 0}
                    onChange={(e) => setFormData({ ...formData, defaultIntervalKm: Number(e.target.value) })}
                    placeholder="5000"
                    className="w-full bg-slate-50 font-mono border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-teal-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Interval Hari *</label>
                  <input
                    type="number"
                    required
                    value={formData.defaultIntervalDays || 0}
                    onChange={(e) => setFormData({ ...formData, defaultIntervalDays: Number(e.target.value) })}
                    placeholder="90"
                    className="w-full bg-slate-50 font-mono border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-teal-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Est. Biaya Standar</label>
                  <input
                    type="number"
                    value={formData.estimatedCost || 0}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
                    placeholder="750000"
                    className="w-full bg-slate-50 font-mono border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Suku Cadang / Sparepart Rekomendasi</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={partInput}
                    onChange={(e) => setPartInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPart();
                      }
                    }}
                    placeholder="Ketik nama part & tekan enter..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-teal-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddPart}
                    className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold rounded-xl border border-teal-200"
                  >
                    Tambah Part
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-slate-50 rounded-xl border border-slate-200/70">
                  {(formData.commonParts || []).length > 0 ? (
                    formData.commonParts?.map((part, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-medium shadow-2xs"
                      >
                        {part}
                        <button
                          type="button"
                          onClick={() => handleRemovePart(part)}
                          className="text-slate-400 hover:text-rose-600 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Belum ada suku cadang ditambahkan</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Deskripsi &amp; Prosedur Teknis</label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Catatan standar SOP pengerjaan di bengkel..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive !== false}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <label htmlFor="isActive" className="text-slate-700 font-medium cursor-pointer">
                  Aktifkan jenis servis ini dalam form SPK &amp; jadwal perawatan
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs transition"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Jenis Servis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
