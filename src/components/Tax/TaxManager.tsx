import React, { useState } from 'react';
import {
  FileCheck2,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Building,
  Check,
  X,
  Lock,
  Edit2,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TaxRecord, Vehicle, DocumentType, UserRole } from '../../types';
import {
  formatRupiah,
  formatDateIndo,
  getTaxDueBadgeInfo
} from '../../utils/formatters';
import { exportTaxToExcel, exportTaxToPDF } from '../../utils/exportUtils';
import { ModuleFilterExportBar } from '../Common/ModuleFilterExportBar';
import { getRolePermissions } from '../../utils/permissions';
import { RoleRestrictedBanner } from '../Common/RoleRestrictedBanner';

interface TaxManagerProps {
  taxes: TaxRecord[];
  vehicles: Vehicle[];
  userRole?: UserRole;
  onOpenRoleMatrix?: () => void;
  onAddTax: (t: TaxRecord) => void;
  onUpdateTax: (t: TaxRecord) => void;
  onDeleteTax: (id: string) => void;
  onPayTax: (tax: TaxRecord, paymentDate: string, amount: number, nextDueDate: string) => void;
}

export const TaxManager: React.FC<TaxManagerProps> = ({
  taxes = [],
  vehicles = [],
  userRole = 'owner',
  onOpenRoleMatrix,
  onAddTax,
  onUpdateTax,
  onDeleteTax,
  onPayTax
}) => {
  const safeTaxes = Array.isArray(taxes) ? taxes : [];
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const perms = getRolePermissions(userRole);
  const [activeFilter, setActiveFilter] = useState<'all' | 'overdue' | 'urgent' | 'safe'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Modals
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState<TaxRecord | null>(null);

  // Pay form state
  const [paymentDate, setPaymentDate] = useState('2026-08-21');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [nextDueDate, setNextDueDate] = useState('');

  // Add form state
  const [newVehicleId, setNewVehicleId] = useState(safeVehicles[0]?.id || '');
  const [newDocType, setNewDocType] = useState<DocumentType>('Pajak Tahunan STNK');
  const [newDueDate, setNewDueDate] = useState('2027-08-20');
  const [newAmount, setNewAmount] = useState<number>(3500000);
  const [newSamsat, setNewSamsat] = useState('Samsat Induk');
  const [newNotes, setNewNotes] = useState('');

  // Edit form state
  const [editFormData, setEditFormData] = useState<{
    id: string;
    vehicleId: string;
    documentType: DocumentType;
    dueDate: string;
    amount: number;
    agentOrSamsat: string;
    notes: string;
  }>({
    id: '',
    vehicleId: '',
    documentType: 'Pajak Tahunan STNK',
    dueDate: '',
    amount: 0,
    agentOrSamsat: '',
    notes: ''
  });

  // Filter list
  const filteredTaxes = safeTaxes.filter((t) => {
    if (!t) return false;
    const info = getTaxDueBadgeInfo(t.dueDate);
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (t.nopol || '').toLowerCase().includes(q) ||
      (t.documentType || '').toLowerCase().includes(q) ||
      ((t.agentOrSamsat || '').toLowerCase().includes(q));

    if (!matchesSearch) return false;

    // Date Range Filter on dueDate
    if (startDate && t.dueDate < startDate) return false;
    if (endDate && t.dueDate > endDate) return false;

    if (activeFilter === 'overdue') return info.status === 'overdue';
    if (activeFilter === 'urgent') return info.status === 'urgent';
    if (activeFilter === 'safe') return info.status === 'safe' || t.status === 'paid';
    return true;
  });

  const dateRangeText = startDate && endDate
    ? `${startDate} s/d ${endDate}`
    : startDate
    ? `Mulai ${startDate}`
    : endDate
    ? `Sampai ${endDate}`
    : 'Semua Periode';

  const handleExportExcel = () => {
    exportTaxToExcel(filteredTaxes, dateRangeText);
  };

  const handleExportPDF = () => {
    exportTaxToPDF(filteredTaxes, dateRangeText);
  };

  const overdueCount = safeTaxes.filter(t => t && getTaxDueBadgeInfo(t.dueDate).status === 'overdue').length;
  const urgentCount = safeTaxes.filter(t => t && getTaxDueBadgeInfo(t.dueDate).status === 'urgent').length;
  const totalTaxBudget = safeTaxes.reduce((sum, t) => sum + (t?.amount || 0), 0);

  const handleOpenPay = (tax: TaxRecord) => {
    setSelectedTax(tax);
    setPayAmount(tax.amount + (tax.penaltyAmount || 0));
    setPaymentDate('2026-08-21');

    // Calculate next due date
    const d = new Date(tax.dueDate);
    if (tax.documentType.includes('KIR')) {
      d.setMonth(d.getMonth() + 6);
    } else if (tax.documentType.includes('5 Tahunan')) {
      d.setFullYear(d.getFullYear() + 5);
    } else {
      d.setFullYear(d.getFullYear() + 1);
    }
    const nextStr = d.toISOString().split('T')[0];
    setNextDueDate(nextStr);
    setIsPayModalOpen(true);
  };

  const handleOpenEdit = (tax: TaxRecord) => {
    setSelectedTax(tax);
    setEditFormData({
      id: tax.id,
      vehicleId: tax.vehicleId,
      documentType: tax.documentType,
      dueDate: tax.dueDate,
      amount: tax.amount,
      agentOrSamsat: tax.agentOrSamsat || '',
      notes: tax.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleConfirmPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTax) return;

    onPayTax(selectedTax, paymentDate, payAmount, nextDueDate);
    setIsPayModalOpen(false);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = vehicles.find(veh => veh.id === newVehicleId);
    const nopol = v ? v.nopol : 'B 0000 XX';

    const newTax: TaxRecord = {
      id: 'TAX-' + Date.now().toString().slice(-4),
      vehicleId: newVehicleId,
      nopol,
      documentType: newDocType,
      dueDate: newDueDate,
      amount: Number(newAmount) || 0,
      status: 'safe',
      agentOrSamsat: newSamsat,
      notes: newNotes
    };

    onAddTax(newTax);
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTax) return;

    const v = vehicles.find(veh => veh.id === editFormData.vehicleId);
    const nopol = v ? v.nopol : selectedTax.nopol;

    const updated: TaxRecord = {
      ...selectedTax,
      vehicleId: editFormData.vehicleId,
      nopol,
      documentType: editFormData.documentType,
      dueDate: editFormData.dueDate,
      amount: Number(editFormData.amount) || 0,
      agentOrSamsat: editFormData.agentOrSamsat,
      notes: editFormData.notes
    };

    onUpdateTax(updated);
    setIsEditModalOpen(false);
    setSelectedTax(null);
  };

  return (
    <div className="space-y-6">
      {/* Role Restricted Banner */}
      {!perms.canAddTax && (
        <RoleRestrictedBanner
          userRole={userRole}
          moduleName="Pajak & Legalitas Armada"
          allowedActionsText="Hanya dapat melihat jadwal jatuh tempo"
          restrictedActionsText="Pembayaran pajak dan input jadwal baru hanya dapat diproses oleh Admin 2 & Owner."
          onOpenRoleModal={onOpenRoleMatrix}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-blue-600" />
            Pajak &amp; Perizinan Kendaraan
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Monitoring jadwal jatuh tempo STNK, KIR, dan perizinan legalitas armada
          </p>
        </div>
        {perms.canAddTax ? (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-xs active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Jadwal Pajak</span>
          </button>
        ) : (
          <button
            disabled
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 text-slate-400 font-medium text-xs rounded-lg cursor-not-allowed border border-slate-200"
            title="Akses dibatasi sesuai peran pengguna"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Catat Jadwal (Terkunci)</span>
          </button>
        )}
      </div>

      {/* Summary Alert Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Berkas</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{taxes.length} <span className="text-sm font-normal text-slate-400">Dokumen</span></h3>
            <p className="text-[10px] text-slate-400 mt-1">Estimasi Biaya: {formatRupiah(totalTaxBudget)}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-red-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-red-600 font-medium">Pajak Overdue</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">{overdueCount} <span className="text-sm font-normal text-red-400">Unit</span></h3>
            <p className="text-[10px] text-red-500 mt-1">Perlu perpanjangan segera</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-amber-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-700 font-medium">Jatuh Tempo &lt; 14 Hari</p>
            <h3 className="text-2xl font-bold text-amber-700 mt-1">{urgentCount} <span className="text-sm font-normal text-amber-500">Berkas</span></h3>
            <p className="text-[10px] text-amber-600 mt-1">Siapkan anggaran &amp; dokumen</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Date Filter & Export Bar */}
      <ModuleFilterExportBar
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onResetDateFilter={() => { setStartDate(''); setEndDate(''); }}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        totalFilteredCount={filteredTaxes.length}
        totalAllCount={taxes.length}
        moduleLabel="Berkas Legalitas"
      >
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Nopol, jenis dokumen, Samsat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: `Semua (${taxes.length})` },
            { id: 'overdue', label: `Overdue (${overdueCount})` },
            { id: 'urgent', label: `Segera (${urgentCount})` },
            { id: 'safe', label: 'Aman' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as typeof activeFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeFilter === f.id
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/60'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </ModuleFilterExportBar>

      {/* Taxes List Table with Full CRUD Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100 font-bold">
              <tr>
                <th className="py-3 px-5">No. Polisi &amp; Unit</th>
                <th className="py-3 px-5">Jenis Dokumen</th>
                <th className="py-3 px-5">Tanggal Jatuh Tempo</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Estimasi Biaya</th>
                <th className="py-3 px-5">Lokasi Pengurusan</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTaxes.map((tax) => {
                const badgeInfo = getTaxDueBadgeInfo(tax.dueDate);
                const vehicle = vehicles.find(v => v.id === tax.vehicleId || v.nopol === tax.nopol);

                return (
                  <tr key={tax.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-5">
                      <p className="font-bold text-slate-800 font-mono">{tax.nopol}</p>
                      <p className="text-[11px] text-slate-400">{vehicle ? `${vehicle.brand} ${vehicle.model}` : '-'}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-semibold text-slate-700 block">{tax.documentType}</span>
                      {tax.notes && <span className="text-[10px] text-slate-400">{tax.notes}</span>}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-medium text-slate-700">{formatDateIndo(tax.dueDate)}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${badgeInfo.badgeClass}`}>
                        {badgeInfo.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-800">
                      {formatRupiah(tax.amount)}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{tax.agentOrSamsat || 'Samsat'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {perms.canPayTax && (
                          <button
                            onClick={() => handleOpenPay(tax)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition"
                            title="Proses Pembayaran Pajak"
                          >
                            Bayar
                          </button>
                        )}
                        {perms.canEditTax && (
                          <button
                            onClick={() => handleOpenEdit(tax)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition"
                            title="Edit Jadwal Pajak"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {perms.canDeleteTax && (
                          <button
                            onClick={() => {
                              if (confirm(`Hapus data perizinan ${tax.documentType} untuk unit ${tax.nopol}?`)) {
                                onDeleteTax(tax.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition"
                            title="Hapus Dokumen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTaxes.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada data pajak yang cocok dengan filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Tax Modal */}
      {isPayModalOpen && selectedTax && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                Proses Pembayaran Pajak: {selectedTax.nopol}
              </h3>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPay} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-slate-600">
                <p><strong>Dokumen:</strong> {selectedTax.documentType}</p>
                <p><strong>Jatuh Tempo Lama:</strong> {formatDateIndo(selectedTax.dueDate)}</p>
                <p><strong>Estimasi Pokok:</strong> {formatRupiah(selectedTax.amount)}</p>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Tanggal Pembayaran Real</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Nominal yang Dibayarkan (Rp)</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Jatuh Tempo Periode Berikutnya</label>
                <input
                  type="date"
                  required
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-xs"
                >
                  Konfirmasi Lunas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tax Modal (Update CRUD) */}
      {isEditModalOpen && selectedTax && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                Edit Jadwal Dokumen Pajak
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Pilih Kendaraan *</label>
                <select
                  value={editFormData.vehicleId}
                  onChange={(e) => setEditFormData({ ...editFormData, vehicleId: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nopol} - {v.brand} {v.model} ({v.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Jenis Dokumen Legalitas *</label>
                <select
                  value={editFormData.documentType}
                  onChange={(e) => setEditFormData({ ...editFormData, documentType: e.target.value as DocumentType })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                >
                  <option value="Pajak Tahunan STNK">Pajak Tahunan STNK (1 Tahun)</option>
                  <option value="Ganti Plat STNK (5 Tahunan)">Ganti Plat STNK (5 Tahunan)</option>
                  <option value="Uji Berkala KIR Dishub">Uji Berkala KIR Dishub (6 Bulan)</option>
                  <option value="Izin Trayek / Operasional">Izin Trayek / Operasional</option>
                  <option value="Asuransi Kendaraan">Asuransi Kendaraan</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Tanggal Jatuh Tempo *</label>
                <input
                  type="date"
                  required
                  value={editFormData.dueDate}
                  onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Estimasi Biaya (Rp)</label>
                <input
                  type="number"
                  value={editFormData.amount}
                  onChange={(e) => setEditFormData({ ...editFormData, amount: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Instansi / Lokasi Pengurusan</label>
                <input
                  type="text"
                  placeholder="Samsat Jakarta Timur / Dishub"
                  value={editFormData.agentOrSamsat}
                  onChange={(e) => setEditFormData({ ...editFormData, agentOrSamsat: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-xs"
                >
                  Perbarui Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Tax Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Catat Jadwal Pajak / KIR Baru
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Pilih Kendaraan *</label>
                <select
                  value={newVehicleId}
                  onChange={(e) => setNewVehicleId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nopol} - {v.brand} {v.model} ({v.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Jenis Dokumen Legalitas *</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value as DocumentType)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                >
                  <option value="Pajak Tahunan STNK">Pajak Tahunan STNK (1 Tahun)</option>
                  <option value="Ganti Plat STNK (5 Tahunan)">Ganti Plat STNK (5 Tahunan)</option>
                  <option value="Uji Berkala KIR Dishub">Uji Berkala KIR Dishub (6 Bulan)</option>
                  <option value="Izin Trayek / Operasional">Izin Trayek / Operasional</option>
                  <option value="Asuransi Kendaraan">Asuransi Kendaraan</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Tanggal Jatuh Tempo *</label>
                <input
                  type="date"
                  required
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Estimasi Biaya (Rp)</label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Instansi / Lokasi Pengurusan</label>
                <input
                  type="text"
                  placeholder="Contoh: Samsat Jakarta Timur / Dishub Cilincing"
                  value={newSamsat}
                  onChange={(e) => setNewSamsat(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan nomor berkas atau BPKB"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-xs"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
