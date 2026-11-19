import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Edit2,
  Trash2,
  Check,
  X,
  Layers,
  Sparkles,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { EquipmentSupplier, UserRole } from '../../types';
import { TablePagination } from '../Common/TablePagination';
import { confirmDelete } from '../../utils/dialogService';

interface MasterSupplierManagerProps {
  suppliers: EquipmentSupplier[];
  userRole?: UserRole;
  onAddSupplier: (supplier: EquipmentSupplier) => void;
  onUpdateSupplier: (supplier: EquipmentSupplier) => void;
  onDeleteSupplier: (id: string) => void;
  onOpenRoleMatrix?: () => void;
}

const SUPPLIER_CATEGORIES = [
  'Sparepart Mesin',
  'Ban & Vulkanisir',
  'Oli & Pelumas',
  'Aki & Kelistrikan',
  'Terpal & Lashing',
  'Perkakas Supir & K3',
  'General Supplier'
];

export const MasterSupplierManager: React.FC<MasterSupplierManagerProps> = ({
  suppliers = [],
  userRole = 'owner',
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onOpenRoleMatrix
}) => {
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<EquipmentSupplier | null>(null);

  const [formData, setFormData] = useState<Partial<EquipmentSupplier>>({
    code: '',
    name: '',
    category: 'Sparepart Mesin',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    bankName: 'BCA',
    accountNumber: '',
    paymentTerms: 'Tempo 30 Hari',
    isActive: true,
    notes: ''
  });

  const filtered = safeSuppliers.filter((s) => {
    if (!s) return false;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
      (s.address && s.address.toLowerCase().includes(q));
    const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      code: 'SUP-' + Date.now().toString().slice(-4),
      name: '',
      category: 'Sparepart Mesin',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      bankName: 'BCA',
      accountNumber: '',
      paymentTerms: 'Tempo 30 Hari',
      isActive: true,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup: EquipmentSupplier) => {
    setEditingSupplier(sup);
    setFormData({ ...sup });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    if (editingSupplier) {
      onUpdateSupplier({
        ...editingSupplier,
        ...formData,
        code: formData.code || editingSupplier.code,
        name: formData.name.trim(),
        category: formData.category || 'General Supplier',
        contactPerson: formData.contactPerson || '',
        phone: formData.phone || '',
        email: formData.email || '',
        address: formData.address || '',
        bankName: formData.bankName || '',
        accountNumber: formData.accountNumber || '',
        paymentTerms: formData.paymentTerms || '',
        isActive: formData.isActive ?? true,
        notes: formData.notes || ''
      });
    } else {
      const newSup: EquipmentSupplier = {
        id: 'SUP-' + Date.now().toString().slice(-6),
        code: formData.code || 'SUP-' + Date.now().toString().slice(-4),
        name: formData.name.trim(),
        category: formData.category || 'General Supplier',
        contactPerson: formData.contactPerson || '',
        phone: formData.phone || '',
        email: formData.email || '',
        address: formData.address || '',
        bankName: formData.bankName || 'BCA',
        accountNumber: formData.accountNumber || '',
        paymentTerms: formData.paymentTerms || 'Tempo 30 Hari',
        isActive: formData.isActive ?? true,
        notes: formData.notes || '',
        createdAt: new Date().toISOString().slice(0, 10)
      };
      onAddSupplier(newSup);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">Master Supplier Peralatan &amp; Sparepart</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/70">
              {safeSuppliers.length} Mitra Supplier
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Daftar distributor resmi suku cadang, ban, oli, aki, terpal, perkakas K3 &amp; bengkel rekanan
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Supplier Baru</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama supplier, kode, kontak PIC, atau alamat toko..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-amber-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-56 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-amber-500"
        >
          <option value="all">Semua Kategori Supplier</option>
          {SUPPLIER_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
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
                <th className="py-3 px-4">Kode &amp; Nama Supplier</th>
                <th className="py-3 px-4">Kategori Barang</th>
                <th className="py-3 px-4">Kontak PIC / Telp</th>
                <th className="py-3 px-4">Rekening &amp; Termin</th>
                <th className="py-3 px-4">Alamat Toko / Gudang</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((sup) => (
                <tr key={sup.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 inline-block mb-1">
                      {sup.code}
                    </span>
                    <p className="font-bold text-slate-800 text-xs">{sup.name}</p>
                    {sup.notes && <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{sup.notes}</p>}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/70 flex items-center gap-1 w-fit">
                      <Tag className="w-2.5 h-2.5" />
                      {sup.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-700">{sup.contactPerson || '-'}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{sup.phone || '-'}</p>
                    {sup.email && <p className="text-[10px] text-blue-600 truncate">{sup.email}</p>}
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-[11px] font-mono font-medium text-slate-700">
                      {sup.bankName ? `${sup.bankName}: ${sup.accountNumber}` : '-'}
                    </p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 font-semibold inline-block mt-0.5">
                      {sup.paymentTerms || 'COD'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-[11px] text-slate-600 line-clamp-2 max-w-xs">{sup.address || '-'}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sup.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {sup.isActive ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(sup)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        title="Edit Supplier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (await confirmDelete(`Master Supplier "${sup.name}"`, 'Apakah Anda Yakin Ingin Menghapus Data?', `Kode: ${sup.code} • Kategori: ${sup.category}`)) {
                            onDeleteSupplier(sup.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Supplier"
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
                    Tidak ada supplier yang sesuai dengan pencarian
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
          itemLabel="supplier"
        />
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {editingSupplier ? 'Edit Data Supplier Peralatan' : 'Tambah Supplier Baru'}
                  </h3>
                  <p className="text-[10px] text-slate-400">Master supplier suku cadang, ban, oli, aki &amp; perlengkapan</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Kode Supplier</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-slate-800"
                    placeholder="SUP-001"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Kategori Barang *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                    required
                  >
                    {SUPPLIER_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Nama Toko / Distributor / Bengkel *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Misal: PT Terpalindo Jaya Mandiri"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-hidden focus:border-amber-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nama Kontak PIC / Sales</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Misal: H. Sudrajat"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 font-mono focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Bank Rekening</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="BCA / Mandiri"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-slate-700 font-semibold block mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="123-456-7890"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Termin Pembayaran</label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                  >
                    <option value="Cash On Delivery">Cash On Delivery (COD)</option>
                    <option value="Transfer On Delivery">Transfer On Delivery</option>
                    <option value="Tempo 7 Hari">Tempo 7 Hari</option>
                    <option value="Tempo 14 Hari">Tempo 14 Hari</option>
                    <option value="Tempo 30 Hari">Tempo 30 Hari</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Email Toko (Opsional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sales@toko.com"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Alamat Toko / Gudang</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Jl. Raya Pergudangan No. 12, Cikarang..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="supplierActiveCheck"
                  checked={formData.isActive ?? true}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <label htmlFor="supplierActiveCheck" className="text-slate-700 font-medium">
                  Supplier Aktif &amp; Dapat Dipilih Saat Input Belanja Peralatan
                </label>
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
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingSupplier ? 'Simpan Perubahan' : 'Simpan Supplier'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
