import React, { useState } from 'react';
import {
  Coins,
  Plus,
  Search,
  Tag,
  Edit2,
  Trash2,
  Check,
  X,
  FileCheck2,
  Receipt,
  Layers,
  Sparkles
} from 'lucide-react';
import { ExpenseCategoryReference, UserRole } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { TablePagination } from '../Common/TablePagination';
import { confirmDelete } from '../../utils/dialogService';

interface MasterExpenseCategoryManagerProps {
  categories: ExpenseCategoryReference[];
  userRole?: UserRole;
  onAddCategory: (cat: ExpenseCategoryReference) => void;
  onUpdateCategory: (cat: ExpenseCategoryReference) => void;
  onDeleteCategory: (id: string) => void;
  onOpenRoleMatrix?: () => void;
}

const EXPENSE_GROUPS: ExpenseCategoryReference['group'][] = [
  'Perjalanan & Supir',
  'Armada Kendaraan',
  'Bengkel & Sparepart',
  'Operasional & Legalitas',
  'Lainnya'
];

export const MasterExpenseCategoryManager: React.FC<MasterExpenseCategoryManagerProps> = ({
  categories = [],
  userRole = 'owner',
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onOpenRoleMatrix
}) => {
  const safeCategories = Array.isArray(categories) ? categories : [];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategoryReference | null>(null);

  const [formData, setFormData] = useState<Partial<ExpenseCategoryReference>>({
    code: '',
    name: '',
    group: 'Perjalanan & Supir',
    defaultAmount: 350000,
    description: '',
    isActive: true,
    requiresReceipt: true
  });

  const filtered = safeCategories.filter((c) => {
    if (!c) return false;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q);
    const matchesGroup = selectedGroup === 'all' || c.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      code: 'BIA-' + Date.now().toString().slice(-4),
      name: '',
      group: 'Perjalanan & Supir',
      defaultAmount: 250000,
      description: '',
      isActive: true,
      requiresReceipt: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: ExpenseCategoryReference) => {
    setEditingCategory(cat);
    setFormData({ ...cat });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    if (editingCategory) {
      onUpdateCategory({
        ...editingCategory,
        ...formData,
        code: formData.code || editingCategory.code,
        name: formData.name.trim(),
        group: formData.group || 'Perjalanan & Supir',
        defaultAmount: Number(formData.defaultAmount) || 0,
        description: formData.description || '',
        isActive: formData.isActive ?? true,
        requiresReceipt: formData.requiresReceipt ?? true
      });
    } else {
      const newCat: ExpenseCategoryReference = {
        id: 'EXP-CAT-' + Date.now().toString().slice(-6),
        code: formData.code || 'BIA-' + Date.now().toString().slice(-4),
        name: formData.name.trim(),
        group: formData.group || 'Perjalanan & Supir',
        defaultAmount: Number(formData.defaultAmount) || 0,
        description: formData.description || '',
        isActive: formData.isActive ?? true,
        requiresReceipt: formData.requiresReceipt ?? true,
        createdAt: new Date().toISOString().slice(0, 10)
      };
      onAddCategory(newCat);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">Master Jenis Pengeluaran Operasional</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/70">
              {safeCategories.length} Kategori Biaya
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Daftar pos biaya operasional armada: uang jalan, solar BBM, tol, sparepart, servis bengkel &amp; pajak
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Jenis Pengeluaran</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari kode atau nama pengeluaran (misal: Uang Jalan, Solar, Tol, Ban, Servis)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-rose-500"
          />
        </div>

        <select
          value={selectedGroup}
          onChange={(e) => {
            setSelectedGroup(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-56 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-rose-500"
        >
          <option value="all">Semua Kelompok Pos Biaya</option>
          {EXPENSE_GROUPS.map((grp) => (
            <option key={grp} value={grp}>
              {grp}
            </option>
          ))}
        </select>
      </div>

      {/* Table view */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Kode &amp; Nama Pengeluaran</th>
                <th className="py-3 px-4">Kelompok Pos Biaya</th>
                <th className="py-3 px-4">Estimasi / Default</th>
                <th className="py-3 px-4">Ketentuan Bukti Nota</th>
                <th className="py-3 px-4">Deskripsi / Ruang Lingkup</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 inline-block mb-1">
                      {cat.code}
                    </span>
                    <p className="font-bold text-slate-800 text-xs">{cat.name}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/70 inline-block">
                      {cat.group}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">
                    {cat.defaultAmount ? formatRupiah(cat.defaultAmount) : '-'}
                  </td>
                  <td className="py-3 px-4">
                    {cat.requiresReceipt ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/70 flex items-center gap-1 w-fit">
                        <Receipt className="w-2.5 h-2.5" />
                        Wajib Upload Nota
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Opsional</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-[11px] text-slate-600 line-clamp-2 max-w-xs">{cat.description || '-'}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cat.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {cat.isActive ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Edit Jenis Biaya"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (await confirmDelete(`Master Jenis Pengeluaran "${cat.name}"`, 'Apakah Anda Yakin Ingin Menghapus Data?', `Kode: ${cat.code} • Kelompok: ${cat.group}`)) {
                            onDeleteCategory(cat.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Jenis Biaya"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada jenis pengeluaran yang sesuai dengan pencarian
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[8, 16, 24]}
          itemLabel="jenis pengeluaran"
        />
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {editingCategory ? 'Edit Jenis Pengeluaran' : 'Tambah Jenis Pengeluaran Baru'}
                  </h3>
                  <p className="text-[10px] text-slate-400">Master pos biaya operasional armada &amp; kas</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Kode Biaya</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-slate-800"
                    placeholder="BIA-001"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Kelompok Pos *</label>
                  <select
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                    required
                  >
                    {EXPENSE_GROUPS.map((grp) => (
                      <option key={grp} value={grp}>
                        {grp}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Nama Jenis Pengeluaran *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Misal: Uang Saku & Sangu Supir"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-hidden focus:border-rose-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Estimasi / Nominal Default (Rp)</label>
                <input
                  type="number"
                  value={formData.defaultAmount || ''}
                  onChange={(e) => setFormData({ ...formData, defaultAmount: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 font-mono focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Deskripsi / Peruntukan Biaya</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Penjelasan ruang lingkup dan ketentuan pengeluaran..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requireReceiptCheck"
                    checked={formData.requiresReceipt ?? true}
                    onChange={(e) => setFormData({ ...formData, requiresReceipt: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <label htmlFor="requireReceiptCheck" className="text-slate-700 font-medium">
                    Wajib Melampirkan Bukti Nota / Kwitansi Transaksi Fisik
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="catActiveCheck"
                    checked={formData.isActive ?? true}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <label htmlFor="catActiveCheck" className="text-slate-700 font-medium">
                    Kategori Aktif &amp; Dapat Dipilih Saat Input Pengeluaran
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingCategory ? 'Simpan Perubahan' : 'Simpan Kategori'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
