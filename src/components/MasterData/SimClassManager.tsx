import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Truck,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  FileSpreadsheet,
  FileText,
  UserCheck,
  AlertCircle,
  Calendar,
  Award,
  Scale
} from 'lucide-react';
import {
  SimClassReference,
  UserRole
} from '../../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { confirmDelete } from '../../utils/dialogService';

interface SimClassManagerProps {
  simClasses: SimClassReference[];
  userRole?: UserRole;
  onAddSimClass: (sim: SimClassReference) => void;
  onUpdateSimClass: (sim: SimClassReference) => void;
  onDeleteSimClass: (id: string) => void;
  onOpenRoleMatrix?: () => void;
}

export const SimClassManager: React.FC<SimClassManagerProps> = ({
  simClasses = [],
  userRole = 'owner',
  onAddSimClass,
  onUpdateSimClass,
  onDeleteSimClass,
  onOpenRoleMatrix
}) => {
  const safeSimClasses = Array.isArray(simClasses) ? simClasses : [];
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'umum' | 'perseorangan'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SimClassReference | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<SimClassReference>>({
    code: '',
    name: '',
    vehicleClassification: '',
    minAge: 20,
    validityYears: 5,
    description: '',
    permittedVehicles: '',
    requiresSpecialLicense: false,
    isActive: true
  });

  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin1' || userRole === 'admin2';

  // Filtered List
  const filteredSims = safeSimClasses.filter((item) => {
    if (!item) return false;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (item.name || '').toLowerCase().includes(q) ||
      (item.code || '').toLowerCase().includes(q) ||
      (item.vehicleClassification || '').toLowerCase().includes(q) ||
      (item.permittedVehicles || '').toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q);

    const isUmum = (item.name || '').toLowerCase().includes('umum') || item.requiresSpecialLicense;
    const matchesType =
      filterType === 'all'
        ? true
        : filterType === 'umum'
        ? isUmum
        : !isUmum;

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? item.isActive
        : !item.isActive;

    return matchesSearch && matchesType && matchesStatus;
  });

  // KPI Calculations
  const totalClasses = safeSimClasses.length;
  const activeCount = safeSimClasses.filter(s => s.isActive).length;
  const umumCount = safeSimClasses.filter(s => (s.name || '').toLowerCase().includes('umum')).length;

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      code: `SIM-${Date.now().toString().slice(-4)}`,
      name: '',
      vehicleClassification: '',
      minAge: 21,
      validityYears: 5,
      description: '',
      permittedVehicles: '',
      requiresSpecialLicense: true,
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SimClassReference) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    if (editingItem) {
      onUpdateSimClass({
        ...editingItem,
        ...(formData as SimClassReference)
      });
    } else {
      const newItem: SimClassReference = {
        id: `SIM-${Date.now().toString().slice(-6)}`,
        code: (formData.code || `SIM-${Date.now().toString().slice(-4)}`).toUpperCase(),
        name: formData.name || '',
        vehicleClassification: formData.vehicleClassification || '',
        minAge: Number(formData.minAge) || 20,
        validityYears: Number(formData.validityYears) || 5,
        description: formData.description || '',
        permittedVehicles: formData.permittedVehicles || '',
        requiresSpecialLicense: formData.requiresSpecialLicense !== false,
        isActive: formData.isActive !== false,
        createdAt: new Date().toISOString().split('T')[0]
      };
      onAddSimClass(newItem);
    }
    setIsModalOpen(false);
  };

  const handleToggleActive = (item: SimClassReference) => {
    onUpdateSimClass({
      ...item,
      isActive: !item.isActive
    });
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = filteredSims.map((item, idx) => ({
      'No': idx + 1,
      'Kode Golongan': item.code,
      'Nama Golongan SIM': item.name,
      'Klasifikasi Kendaraan': item.vehicleClassification,
      'Usia Minimal (Tahun)': item.minAge,
      'Masa Berlaku (Tahun)': item.validityYears,
      'Kendaraan yang Diizinkan': item.permittedVehicles,
      'Jenis SIM': item.requiresSpecialLicense ? 'SIM UMUM' : 'SIM PERSEORANGAN',
      'Status': item.isActive ? 'AKTIF' : 'NONAKTIF',
      'Deskripsi Ketentuan': item.description
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Master_Golongan_SIM');
    XLSX.writeFile(wb, `Master_Golongan_SIM_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(30, 58, 138); // blue-900
    doc.rect(0, 0, pageWidth, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('44S OPS_PRO - MASTER REFERENSI GOLONGAN SIM PENGEMUDI', 14, 11);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Standar Kualifikasi Lisensi Mengemudi Pengemudi Armada | Total: ${filteredSims.length} Golongan`, 14, 17);

    const bodyData = filteredSims.map((sim, idx) => [
      idx + 1,
      sim.code,
      sim.name,
      sim.vehicleClassification,
      `${sim.minAge} Tahun`,
      `${sim.validityYears} Thn`,
      sim.permittedVehicles,
      sim.isActive ? 'AKTIF' : 'NONAKTIF'
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['No', 'Kode', 'Golongan SIM', 'Klasifikasi Kendaraan & Bobot', 'Usia Min', 'Masa Berlaku', 'Unit Armada Diizinkan', 'Status']],
      body: bodyData,
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' }
    });

    doc.save(`Master_Golongan_SIM_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Master Referensi Golongan SIM
              </h2>
              <p className="text-xs text-slate-400">
                Standar kualifikasi lisensi supir (SIM A, B1, B2 Umum/Polos), batas tonase, dan jenis armada yang berhak dikemudikan
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
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Golongan SIM</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Golongan SIM</span>
            <div className="text-2xl font-bold font-mono text-slate-800 mt-0.5">{totalClasses}</div>
            <span className="text-[10px] text-indigo-600 font-semibold">{activeCount} lisensi aktif</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SIM Komersial Umum</span>
            <div className="text-2xl font-bold font-mono text-blue-700 mt-0.5">{umumCount}</div>
            <span className="text-[10px] text-slate-400">B I Umum, B II Umum, A Umum</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Masa Berlaku Standar</span>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-0.5">5 <span className="text-xs font-sans font-normal text-slate-400">Tahun</span></div>
            <span className="text-[10px] text-slate-400">Perpanjangan berkala di Satpas</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kesesuaian Regulasi</span>
            <div className="text-2xl font-bold font-mono text-purple-700 mt-0.5">UU 22/09</div>
            <span className="text-[10px] text-purple-600 font-semibold">Standar Korlantas Polri</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Scale className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari golongan SIM, nama lisensi, jenis kendaraan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-indigo-500"
          >
            <option value="all">Semua Tipe SIM</option>
            <option value="umum">Khusus Angkutan Umum</option>
            <option value="perseorangan">Perseorangan / Non-Umum</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-indigo-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Hanya Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Grid of SIM Classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSims.map((item) => {
          const isUmum = (item.name || '').toLowerCase().includes('umum') || item.requiresSpecialLicense;

          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl bg-white border transition duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between ${
                item.isActive ? 'border-slate-200/90' : 'border-slate-200/60 opacity-60 bg-slate-50/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs ${
                      isUmum
                        ? 'bg-amber-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}>
                      {item.code.replace('SIM-', '')}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 leading-tight">
                        {item.name}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.code}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    isUmum
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {isUmum ? 'Angkutan Umum' : 'Perseorangan'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-3 my-2.5 leading-relaxed">
                  {item.description || 'Tidak ada keterangan tambahan.'}
                </p>

                {/* Technical Specifications */}
                <div className="space-y-1.5 py-2.5 px-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs">
                  <div className="flex items-start justify-between text-slate-600 gap-2">
                    <span className="text-[11px] text-slate-400 shrink-0">Klasifikasi Tonase:</span>
                    <span className="font-medium text-slate-800 text-right text-[11px]">
                      {item.vehicleClassification}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px] text-slate-400">Usia Minimal Pengemudi:</span>
                    <span className="font-bold text-slate-800">
                      {item.minAge} Tahun
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px] text-slate-400">Masa Berlaku Lisensi:</span>
                    <span className="font-bold text-slate-800">
                      {item.validityYears} Tahun
                    </span>
                  </div>
                </div>

                {/* Permitted Vehicles */}
                <div className="mt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Armada yang Diizinkan:
                  </span>
                  <div className="p-2 rounded-lg bg-indigo-50/50 border border-indigo-100/70 text-[11px] text-indigo-900 font-medium">
                    {item.permittedVehicles}
                  </div>
                </div>
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
                      <ToggleRight className="w-5 h-5 text-indigo-600" />
                      <span className="text-[11px] text-indigo-700">Aktif</span>
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
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                        title="Edit Data Golongan SIM"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (await confirmDelete(`Master Golongan SIM "${item.name}"`, 'Apakah Anda Yakin Ingin Menghapus Data?', `Kode: ${item.code}`)) {
                            onDeleteSimClass(item.id);
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

      {filteredSims.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="font-bold text-slate-700 text-sm">Tidak Ada Golongan SIM Ditemukan</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Coba sesuaikan kata kunci pencarian atau ganti filter tipe SIM.
          </p>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    {editingItem ? `Edit Golongan: ${editingItem.name}` : 'Tambah Golongan SIM Baru'}
                  </h3>
                  <p className="text-[10px] text-slate-400">Atur kualifikasi bobot tonase &amp; unit yang diperbolehkan</p>
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
                  <label className="text-slate-700 font-semibold block mb-1">Kode SIM *</label>
                  <input
                    type="text"
                    required
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. SIM-B2-UMUM"
                    className="w-full bg-slate-50 font-mono uppercase border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nama Golongan SIM *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. SIM B II Umum"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Klasifikasi Kendaraan &amp; Batas Tonase *</label>
                <input
                  type="text"
                  required
                  value={formData.vehicleClassification || ''}
                  onChange={(e) => setFormData({ ...formData, vehicleClassification: e.target.value })}
                  placeholder="e.g. Truk Tronton, Wingbox, Trailer & Kontainer (> 1.000 kg tempelan)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Usia Minimal Pengemudi (Tahun) *</label>
                  <input
                    type="number"
                    required
                    value={formData.minAge || 20}
                    onChange={(e) => setFormData({ ...formData, minAge: Number(e.target.value) })}
                    placeholder="23"
                    className="w-full bg-slate-50 font-mono border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Masa Berlaku Standar (Tahun)</label>
                  <input
                    type="number"
                    value={formData.validityYears || 5}
                    onChange={(e) => setFormData({ ...formData, validityYears: Number(e.target.value) })}
                    placeholder="5"
                    className="w-full bg-slate-50 font-mono border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Daftar Armada yang Diizinkan *</label>
                <input
                  type="text"
                  required
                  value={formData.permittedVehicles || ''}
                  onChange={(e) => setFormData({ ...formData, permittedVehicles: e.target.value })}
                  placeholder="e.g. Truk Tronton Wingbox, Head Trailer Kontainer, Truk Gandeng"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Deskripsi &amp; Dasar Ketentuan Hukum</label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Uraian aturan perundang-undangan lalu lintas terkait kualifikasi SIM ini..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requiresSpecialLicense"
                    checked={formData.requiresSpecialLicense !== false}
                    onChange={(e) => setFormData({ ...formData, requiresSpecialLicense: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="requiresSpecialLicense" className="text-slate-700 font-medium cursor-pointer">
                    Termasuk lisensi komersial angkutan barang umum (SIM Umum)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActiveSim"
                    checked={formData.isActive !== false}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="isActiveSim" className="text-slate-700 font-medium cursor-pointer">
                    Aktifkan golongan SIM ini dalam pilihan pendaftaran &amp; verifikasi data pengemudi
                  </label>
                </div>
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Golongan SIM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
