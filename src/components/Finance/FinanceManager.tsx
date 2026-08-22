import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  Trash2,
  Edit2,
  X,
  CreditCard,
  Building2,
  Banknote,
  ArrowRightLeft,
  Check,
  CircleDot,
  Coins,
  Truck,
  Sparkles,
  Lock
} from 'lucide-react';
import {
  OperationalFinance,
  Vehicle,
  FinanceCategory,
  TransactionType,
  FinancialAccount,
  NonRentalIncomeCategory,
  UserRole
} from '../../types';
import {
  formatRupiah,
  formatDateIndo
} from '../../utils/formatters';
import { exportFinanceToExcel, exportFinanceToPDF } from '../../utils/exportUtils';
import { ModuleFilterExportBar } from '../Common/ModuleFilterExportBar';
import { getRolePermissions } from '../../utils/permissions';
import { RoleRestrictedBanner } from '../Common/RoleRestrictedBanner';

interface FinanceManagerProps {
  finances: OperationalFinance[];
  vehicles: Vehicle[];
  accounts: FinancialAccount[];
  nonRentalCategories?: NonRentalIncomeCategory[];
  userRole?: UserRole;
  onOpenRoleMatrix?: () => void;
  onAddFinance: (fin: OperationalFinance) => void;
  onUpdateFinance?: (fin: OperationalFinance) => void;
  onDeleteFinance: (id: string) => void;
  onAddAccount: (acc: FinancialAccount) => void;
  onUpdateAccount?: (acc: FinancialAccount) => void;
  onDeleteAccount?: (id: string) => void;
  onTransferBalance: (fromAccId: string, toAccId: string, amount: number, notes: string) => void;
  onNavigateToMasterNonRental?: () => void;
}

export const FinanceManager: React.FC<FinanceManagerProps> = ({
  finances = [],
  vehicles = [],
  accounts = [],
  nonRentalCategories = [],
  userRole = 'owner',
  onOpenRoleMatrix,
  onAddFinance,
  onUpdateFinance,
  onDeleteFinance,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onTransferBalance,
  onNavigateToMasterNonRental
}) => {
  const safeFinances = Array.isArray(finances) ? finances : [];
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safeNonRentalCategories = Array.isArray(nonRentalCategories) ? nonRentalCategories : [];

  const perms = getRolePermissions(userRole);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'income_rental' | 'income_non_rental'>('all');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isEditTxModalOpen, setIsEditTxModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const [selectedTx, setSelectedTx] = useState<OperationalFinance | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<FinancialAccount | null>(null);

  // Form State: Transaksi Baru
  const [formData, setFormData] = useState<Partial<OperationalFinance>>({
    date: '2026-08-21',
    vehicleId: safeVehicles[0]?.id || '',
    driverName: safeVehicles[0]?.assignedDriver || '',
    category: 'Uang Jalan / Sangu Supir',
    type: 'expense',
    incomeSourceType: 'rental',
    nonRentalCategoryId: safeNonRentalCategories[0]?.id || '',
    customerOrPayer: '',
    amount: 350000,
    tripCode: 'TRIP-202608-010',
    description: 'Uang jalan & makan pengemudi rute harian.',
    paymentMethod: 'Cash / Uang Kas',
    status: 'approved',
    receiptNumber: '',
    accountId: safeAccounts[0]?.id || ''
  });

  // Form State: Edit Transaksi
  const [editTxData, setEditTxData] = useState<Partial<OperationalFinance>>({
    id: '',
    date: '',
    vehicleId: '',
    driverName: '',
    category: 'Uang Jalan / Sangu Supir',
    type: 'expense',
    incomeSourceType: 'rental',
    nonRentalCategoryId: '',
    customerOrPayer: '',
    amount: 0,
    tripCode: '',
    description: '',
    paymentMethod: 'Cash / Uang Kas',
    status: 'approved',
    receiptNumber: '',
    accountId: ''
  });

  // Form State: Akun Baru
  const [accountFormData, setAccountFormData] = useState({
    accountName: '',
    accountNumber: '',
    bankOrProvider: 'Bank Central Asia (BCA)',
    accountType: 'bank' as 'bank' | 'cash' | 'etoll' | 'other',
    initialBalance: 0,
    notes: ''
  });

  // Form State: Edit Akun
  const [editAccountFormData, setEditAccountFormData] = useState({
    id: '',
    accountName: '',
    accountNumber: '',
    bankOrProvider: '',
    accountType: 'bank' as 'bank' | 'cash' | 'etoll' | 'other',
    currentBalance: 0,
    notes: ''
  });

  // Form State: Transfer Saldo
  const [transferData, setTransferData] = useState({
    fromAccountId: safeAccounts[0]?.id || '',
    toAccountId: safeAccounts[1]?.id || '',
    amount: 1000000,
    notes: 'Penambahan kasir operasional pool'
  });

  // Filtered Transactions
  const filteredFinances = safeFinances.filter((f) => {
    if (!f) return false;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (f.nopol || '').toLowerCase().includes(q) ||
      (f.driverName || '').toLowerCase().includes(q) ||
      (f.description || '').toLowerCase().includes(q) ||
      ((f.tripCode || '').toLowerCase().includes(q)) ||
      ((f.accountName || '').toLowerCase().includes(q)) ||
      ((f.customerOrPayer || '').toLowerCase().includes(q)) ||
      ((f.nonRentalCategoryName || '').toLowerCase().includes(q));

    let matchesType = true;
    if (filterType === 'expense') {
      matchesType = f.type === 'expense';
    } else if (filterType === 'income') {
      matchesType = f.type === 'income';
    } else if (filterType === 'income_rental') {
      matchesType = f.type === 'income' && (f.incomeSourceType === 'rental' || f.category === 'Pendapatan Sewa / Ongkos Angkut');
    } else if (filterType === 'income_non_rental') {
      matchesType = f.type === 'income' && (f.incomeSourceType === 'non_rental' || f.category !== 'Pendapatan Sewa / Ongkos Angkut');
    }

    const matchesVehicle = selectedVehicle === 'all' || f.vehicleId === selectedVehicle || f.nopol === selectedVehicle;
    const matchesAccount = selectedAccountFilter === 'all' || f.accountId === selectedAccountFilter;

    // Date Range Filter
    const matchesStartDate = !startDate || f.date >= startDate;
    const matchesEndDate = !endDate || f.date <= endDate;

    return matchesSearch && matchesType && matchesVehicle && matchesAccount && matchesStartDate && matchesEndDate;
  });

  const dateRangeText = startDate && endDate
    ? `${startDate} s/d ${endDate}`
    : startDate
    ? `Mulai ${startDate}`
    : endDate
    ? `Sampai ${endDate}`
    : 'Semua Periode';

  const handleExportExcel = () => {
    exportFinanceToExcel(filteredFinances, dateRangeText);
  };

  const handleExportPDF = () => {
    exportFinanceToPDF(filteredFinances, dateRangeText);
  };

  // Metrics
  const totalIncome = filteredFinances
    .filter((f) => f && f.type === 'income')
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  const rentalIncome = filteredFinances
    .filter((f) => f && f.type === 'income' && (f.incomeSourceType === 'rental' || f.category === 'Pendapatan Sewa / Ongkos Angkut'))
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  const nonRentalIncome = filteredFinances
    .filter((f) => f && f.type === 'income' && (f.incomeSourceType === 'non_rental' || f.category !== 'Pendapatan Sewa / Ongkos Angkut'))
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  const totalExpense = filteredFinances
    .filter((f) => f && f.type === 'expense')
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  const netProfit = totalIncome - totalExpense;

  // Total Liquidity
  const totalLiquidity = safeAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  // Vehicle Select in Form
  const handleVehicleSelectInForm = (vId: string) => {
    const v = vehicles.find(veh => veh.id === vId);
    setFormData({
      ...formData,
      vehicleId: vId,
      driverName: v ? v.assignedDriver : ''
    });
  };

  // Handle Non-Rental Category Selection
  const handleNonRentalCategorySelect = (categoryId: string) => {
    const cat = nonRentalCategories.find(c => c.id === categoryId);
    if (cat) {
      setFormData({
        ...formData,
        nonRentalCategoryId: cat.id,
        nonRentalCategoryName: cat.name,
        category: cat.name as FinanceCategory,
        amount: cat.defaultAmount && cat.defaultAmount > 0 ? cat.defaultAmount : formData.amount
      });
    }
  };

  // Submit Transaksi
  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const v = vehicles.find(veh => veh.id === formData.vehicleId);
    const nopol = v ? v.nopol : (formData.vehicleId === 'POOL-GENERAL' ? 'KAS OPERASIONAL POOL' : 'B 0000 XX');
    const acc = accounts.find(a => a.id === formData.accountId);
    const accountName = acc ? acc.accountName : 'Kas Utama';

    let catName = formData.category || 'Operasional Lainnya';
    if (formData.type === 'income') {
      if (formData.incomeSourceType === 'rental') {
        catName = 'Pendapatan Sewa / Ongkos Angkut';
      } else {
        const nrCat = nonRentalCategories.find(c => c.id === formData.nonRentalCategoryId);
        catName = nrCat ? nrCat.name : (formData.nonRentalCategoryName || 'Pemasukan Non-Sewa Lainnya');
      }
    }

    const newFinance: OperationalFinance = {
      id: 'FIN-' + Date.now().toString().slice(-4),
      date: formData.date || '2026-08-21',
      vehicleId: formData.vehicleId || vehicles[0]?.id || '',
      nopol,
      driverName: formData.driverName || 'Admin Kasir',
      category: catName as FinanceCategory,
      type: formData.type || 'expense',
      incomeSourceType: formData.type === 'income' ? (formData.incomeSourceType || 'rental') : undefined,
      nonRentalCategoryId: formData.incomeSourceType === 'non_rental' ? formData.nonRentalCategoryId : undefined,
      nonRentalCategoryName: formData.incomeSourceType === 'non_rental' ? formData.nonRentalCategoryName : undefined,
      customerOrPayer: formData.customerOrPayer,
      amount: Number(formData.amount) || 0,
      tripCode: formData.tripCode,
      description: formData.description || '',
      paymentMethod: formData.paymentMethod || 'Cash / Uang Kas',
      status: formData.status || 'approved',
      receiptNumber: formData.receiptNumber,
      accountId: formData.accountId || accounts[0]?.id || '',
      accountName
    };

    onAddFinance(newFinance);
    setIsTxModalOpen(false);
  };

  // Open Edit Transaction
  const handleOpenEditTx = (fin: OperationalFinance) => {
    setSelectedTx(fin);
    setEditTxData({
      ...fin
    });
    setIsEditTxModalOpen(true);
  };

  // Submit Edit Transaction
  const handleEditTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx || !onUpdateFinance) return;

    const v = vehicles.find(veh => veh.id === editTxData.vehicleId);
    const nopol = v ? v.nopol : (editTxData.vehicleId === 'POOL-GENERAL' ? 'KAS OPERASIONAL POOL' : selectedTx.nopol);
    const acc = accounts.find(a => a.id === editTxData.accountId);
    const accountName = acc ? acc.accountName : selectedTx.accountName;

    const updated: OperationalFinance = {
      ...selectedTx,
      date: editTxData.date || selectedTx.date,
      vehicleId: editTxData.vehicleId || selectedTx.vehicleId,
      nopol,
      driverName: editTxData.driverName || selectedTx.driverName,
      category: editTxData.category || selectedTx.category,
      type: editTxData.type || selectedTx.type,
      incomeSourceType: editTxData.incomeSourceType,
      nonRentalCategoryId: editTxData.nonRentalCategoryId,
      nonRentalCategoryName: editTxData.nonRentalCategoryName,
      customerOrPayer: editTxData.customerOrPayer,
      amount: Number(editTxData.amount) || 0,
      tripCode: editTxData.tripCode,
      description: editTxData.description || '',
      paymentMethod: editTxData.paymentMethod || selectedTx.paymentMethod,
      status: editTxData.status || selectedTx.status,
      receiptNumber: editTxData.receiptNumber,
      accountId: editTxData.accountId || selectedTx.accountId,
      accountName
    };

    onUpdateFinance(updated);
    setIsEditTxModalOpen(false);
    setSelectedTx(null);
  };

  // Submit Buat Akun Baru
  const handleSubmitAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const newAcc: FinancialAccount = {
      id: 'ACC-' + Date.now().toString().slice(-4),
      accountName: accountFormData.accountName,
      accountNumber: accountFormData.accountNumber,
      bankOrProvider: accountFormData.bankOrProvider,
      accountType: accountFormData.accountType,
      initialBalance: Number(accountFormData.initialBalance) || 0,
      currentBalance: Number(accountFormData.initialBalance) || 0,
      color: 'blue',
      notes: accountFormData.notes
    };

    onAddAccount(newAcc);
    setIsAccountModalOpen(false);
    setAccountFormData({
      accountName: '',
      accountNumber: '',
      bankOrProvider: 'Bank Central Asia (BCA)',
      accountType: 'bank',
      initialBalance: 0,
      notes: ''
    });
  };

  // Open Edit Account
  const handleOpenEditAccount = (acc: FinancialAccount) => {
    setSelectedAccount(acc);
    setEditAccountFormData({
      id: acc.id,
      accountName: acc.accountName,
      accountNumber: acc.accountNumber,
      bankOrProvider: acc.bankOrProvider,
      accountType: acc.accountType,
      currentBalance: acc.currentBalance,
      notes: acc.notes || ''
    });
    setIsEditAccountModalOpen(true);
  };

  // Submit Edit Account
  const handleEditAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !onUpdateAccount) return;

    const updated: FinancialAccount = {
      ...selectedAccount,
      accountName: editAccountFormData.accountName,
      accountNumber: editAccountFormData.accountNumber,
      bankOrProvider: editAccountFormData.bankOrProvider,
      accountType: editAccountFormData.accountType,
      currentBalance: Number(editAccountFormData.currentBalance) || 0,
      notes: editAccountFormData.notes
    };

    onUpdateAccount(updated);
    setIsEditAccountModalOpen(false);
    setSelectedAccount(null);
  };

  // Submit Transfer Saldo
  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferData.fromAccountId === transferData.toAccountId) {
      alert('Rekening asal dan tujuan tidak boleh sama!');
      return;
    }
    if (transferData.amount <= 0) {
      alert('Jumlah transfer harus lebih dari 0');
      return;
    }
    onTransferBalance(
      transferData.fromAccountId,
      transferData.toAccountId,
      transferData.amount,
      transferData.notes
    );
    setIsTransferModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Role Restricted Banner */}
      {!perms.canAddFinanceTx && (
        <RoleRestrictedBanner
          userRole={userRole}
          moduleName="Keuangan & Pembukuan Operasional"
          allowedActionsText="Hanya dapat melihat ringkasan keuangan"
          restrictedActionsText="Pencatatan uang jalan, penerimaan pendapatan, dan mutasi saldo hanya dapat dikelola oleh Admin 1 & Owner."
          onOpenRoleModal={onOpenRoleMatrix}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            Keuangan &amp; Arus Kas Operasional Logistik
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Multi-rekening kas, mutasi saldo, pencatatan uang jalan armada &amp; pendapatan jasa sewa / non-sewa
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {perms.canTransferBalance ? (
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs rounded-lg shadow-xs transition"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
              <span>Mutasi / Transfer Saldo</span>
            </button>
          ) : (
            <button
              disabled
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 text-slate-400 font-medium text-xs rounded-lg cursor-not-allowed"
              title="Akses transfer saldo terkunci"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Mutasi (Terkunci)</span>
            </button>
          )}

          {perms.canAddAccount ? (
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs rounded-lg shadow-xs transition"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>+ Akun Kas/Bank</span>
            </button>
          ) : (
            <button
              disabled
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 text-slate-400 font-medium text-xs rounded-lg cursor-not-allowed"
              title="Akses tambah rekening kas terkunci"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>+ Akun (Terkunci)</span>
            </button>
          )}

          {perms.canAddFinanceTx ? (
            <button
              onClick={() => setIsTxModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-xs active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Transaksi</span>
            </button>
          ) : (
            <button
              disabled
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 text-slate-400 font-medium text-xs rounded-lg cursor-not-allowed border border-slate-200"
              title="Akses pencatatan transaksi terkunci"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Catat Transaksi (Terkunci)</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. AKUN SALDO REKENING & KAS OPERASIONAL */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">Daftar Akun Saldo Rekening &amp; Kas Operasional</h3>
              <p className="text-[11px] text-slate-400">Total Likuiditas Kas &amp; Bank: <span className="font-mono font-bold text-blue-600">{formatRupiah(totalLiquidity)}</span></p>
            </div>
          </div>
          <span className="text-[11px] bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full font-medium self-start sm:self-auto">
            {accounts.length} Akun Aktif
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {accounts.map((acc) => {
            const isBank = acc.accountType === 'bank';
            const isCash = acc.accountType === 'cash';

            return (
              <div
                key={acc.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-xs transition relative group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isBank ? 'bg-blue-100 text-blue-700' : isCash ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isBank ? <Building2 className="w-3.5 h-3.5" /> : isCash ? <Banknote className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-1">{acc.accountName}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{acc.accountNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      isBank ? 'bg-blue-50 text-blue-600' : isCash ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {acc.accountType}
                    </span>
                    {perms.canEditAccount && onUpdateAccount && (
                      <button
                        onClick={() => handleOpenEditAccount(acc)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Edit Akun Kas"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                    {perms.canDeleteAccount && onDeleteAccount && accounts.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Hapus akun kas/bank ${acc.accountName}?`)) onDeleteAccount(acc.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Hapus Akun Kas"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Saldo Terkini:</span>
                  <p className={`text-base font-bold font-mono ${acc.currentBalance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                    {formatRupiah(acc.currentBalance)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{acc.bankOrProvider}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Pemasukan dengan Breakdown */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Total Pemasukan</p>
            <div className="w-7 h-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-green-700 mt-2 font-mono">{formatRupiah(totalIncome)}</h3>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 flex items-center gap-1">
              <Truck className="w-3 h-3 text-blue-500" />
              Sewa: <b className="text-slate-700 font-mono">{formatRupiah(rentalIncome)}</b>
            </span>
            <span className="text-purple-700 font-semibold flex items-center gap-1">
              <Coins className="w-3 h-3 text-purple-500" />
              Non-Sewa: <b className="font-mono">{formatRupiah(nonRentalIncome)}</b>
            </span>
          </div>
        </div>

        {/* Card 2: Pengeluaran */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Total Pengeluaran Ops</p>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-rose-700 mt-2 font-mono">{formatRupiah(totalExpense)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Uang Jalan, Tol, Parkir &amp; Retribusi</p>
        </div>

        {/* Card 3: Laba Bersih */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Laba Operasional Bersih</p>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <h3 className={`text-2xl font-bold mt-2 font-mono ${netProfit >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
            {formatRupiah(netProfit)}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            Margin: <span className="font-bold text-slate-700">{totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0'}%</span> dari total penerimaan
          </p>
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
        totalFilteredCount={filteredFinances.length}
        totalAllCount={finances.length}
        moduleLabel="Transaksi"
      >
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari transaksi, rekanan, supir, nopol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'expense', label: 'Pengeluaran' },
            { id: 'income', label: 'Semua Masuk' },
            { id: 'income_rental', label: 'Sewa Armada' },
            { id: 'income_non_rental', label: 'Non-Sewa' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as typeof filterType)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                filterType === f.id
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/60'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          value={selectedAccountFilter}
          onChange={(e) => setSelectedAccountFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 font-medium"
        >
          <option value="all">Semua Rekening / Kas</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.accountName}</option>
          ))}
        </select>

        <select
          value={selectedVehicle}
          onChange={(e) => setSelectedVehicle(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 font-medium"
        >
          <option value="all">Semua Armada &amp; Pool</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.nopol} ({v.brand})</option>
          ))}
        </select>
      </ModuleFilterExportBar>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100 font-bold">
              <tr>
                <th className="py-3 px-5">Tanggal &amp; Kode</th>
                <th className="py-3 px-5">Sumber &amp; Driver / Pihak</th>
                <th className="py-3 px-5">Kategori / Deskripsi</th>
                <th className="py-3 px-5">Akun Kas &amp; Metode</th>
                <th className="py-3 px-5 text-right">Jumlah (Rp)</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFinances.map((fin) => {
                const isIncome = fin.type === 'income';
                const isNonRental = isIncome && (fin.incomeSourceType === 'non_rental' || fin.category !== 'Pendapatan Sewa / Ongkos Angkut');

                return (
                  <tr key={fin.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-5">
                      <p className="font-bold text-slate-800">{formatDateIndo(fin.date)}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{fin.tripCode || '-'}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5">
                        <p className="font-mono font-bold text-slate-800">{fin.nopol}</p>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {fin.customerOrPayer ? (
                          <span className="text-slate-700 font-medium">Rekanan: {fin.customerOrPayer}</span>
                        ) : (
                          fin.driverName
                        )}
                      </p>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5">
                        {isIncome ? (
                          isNonRental ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center gap-1">
                              <Coins className="w-2.5 h-2.5" />
                              NON-SEWA
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200/60 flex items-center gap-1">
                              <Truck className="w-2.5 h-2.5" />
                              SEWA ARMADA
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                            PENGELUARAN
                          </span>
                        )}
                        <span className="font-semibold text-slate-800">{fin.category}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{fin.description}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1">
                        <CircleDot className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="font-semibold text-slate-800">{fin.accountName || 'Kas Utama'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{fin.paymentMethod}</p>
                    </td>
                    <td className={`py-3.5 px-5 text-right font-mono font-bold ${isIncome ? (isNonRental ? 'text-purple-700' : 'text-green-700') : 'text-rose-700'}`}>
                      {isIncome ? '+' : '-'}{formatRupiah(fin.amount)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {perms.canEditFinanceTx && onUpdateFinance && (
                          <button
                            onClick={() => handleOpenEditTx(fin)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition"
                            title="Edit Transaksi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {perms.canDeleteFinanceTx && (
                          <button
                            onClick={() => {
                              if (confirm(`Hapus pencatatan transaksi ${fin.category} (${formatRupiah(fin.amount)})?`)) onDeleteFinance(fin.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredFinances.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada data keuangan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Tambah Transaksi Keuangan */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Catat Transaksi Keuangan Operasional
                  </h3>
                  <p className="text-[11px] text-slate-400">Pencatatan pengeluaran armada, pendapatan sewa &amp; pemasukan non-sewa</p>
                </div>
              </div>
              <button
                onClick={() => setIsTxModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTransaction} className="p-6 space-y-4 text-xs">
              {/* Transaction Type Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Tipe Transaksi *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="expense">Pengeluaran Operasional (Debet / Keluar)</option>
                    <option value="income">Pemasukan / Pendapatan (Kredit / Masuk)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Akun Saldo Rekening / Kas *</label>
                  <select
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                    className="w-full bg-blue-50/50 border border-blue-200 text-blue-900 font-semibold rounded-lg px-3 py-2 focus:outline-hidden focus:border-blue-500"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName} (Saldo: {formatRupiah(acc.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* INCOME SPECIFIC: Choice between Sewa Armada vs Non-Sewa Master */}
              {formData.type === 'income' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <label className="text-slate-700 font-bold block text-[11px] uppercase tracking-wide">
                    Pilih Sumber Pemasukan:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        incomeSourceType: 'rental',
                        category: 'Pendapatan Sewa / Ongkos Angkut'
                      })}
                      className={`p-2.5 rounded-lg border text-left flex items-start gap-2 transition ${
                        formData.incomeSourceType === 'rental'
                          ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Truck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold">Sewa Kendaraan</p>
                        <p className="text-[10px] text-slate-400 font-normal">Tarif ongkos angkut &amp; ritase armada</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const firstCat = nonRentalCategories[0];
                        setFormData({
                          ...formData,
                          incomeSourceType: 'non_rental',
                          nonRentalCategoryId: firstCat?.id || '',
                          nonRentalCategoryName: firstCat?.name || '',
                          category: firstCat?.name || 'Jasa Bongkar Muat / Handling Fee',
                          amount: firstCat?.defaultAmount && firstCat.defaultAmount > 0 ? firstCat.defaultAmount : formData.amount
                        });
                      }}
                      className={`p-2.5 rounded-lg border text-left flex items-start gap-2 transition ${
                        formData.incomeSourceType === 'non_rental'
                          ? 'bg-purple-50 border-purple-300 text-purple-900 font-semibold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Coins className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold">Pemasukan Non-Sewa</p>
                        <p className="text-[10px] text-slate-400 font-normal">Bongkar muat, scrap oli, klaim, jasa workshop, dll</p>
                      </div>
                    </button>
                  </div>

                  {formData.incomeSourceType === 'non_rental' && (
                    <div className="pt-2 border-t border-slate-200/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-700 font-bold text-xs">Pilih Kategori Master Pemasukan Non-Sewa *</label>
                        {onNavigateToMasterNonRental && (
                          <button
                            type="button"
                            onClick={onNavigateToMasterNonRental}
                            className="text-[10px] text-purple-700 hover:underline font-semibold"
                          >
                            + Kelola Master Data
                          </button>
                        )}
                      </div>
                      <select
                        value={formData.nonRentalCategoryId}
                        onChange={(e) => handleNonRentalCategorySelect(e.target.value)}
                        className="w-full bg-white border border-purple-300 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-hidden focus:border-purple-500"
                      >
                        {nonRentalCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            [{c.code}] {c.name} {c.defaultAmount ? `(Acuan: ${formatRupiah(c.defaultAmount)})` : ''}
                          </option>
                        ))}
                      </select>

                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">Nama Pihak Pembayar / Rekanan / Pelanggan</label>
                        <input
                          type="text"
                          placeholder="Misal: CV Sumber Logam, Mandor Lapangan, Pihak Asuransi..."
                          value={formData.customerOrPayer}
                          onChange={(e) => setFormData({ ...formData, customerOrPayer: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* General Transaction Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Tanggal Transaksi *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jumlah Nominal (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold text-sm focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Unit Armada Terkait</label>
                  <select
                    value={formData.vehicleId}
                    onChange={(e) => handleVehicleSelectInForm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="POOL-GENERAL">Umum / Pool Pusat (Non-Armada)</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.nopol} - {v.brand} ({v.assignedDriver})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nama Supir / PIC Kasir</label>
                  <input
                    type="text"
                    value={formData.driverName}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {formData.type === 'expense' && (
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Kategori Pengeluaran</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as FinanceCategory })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-hidden focus:border-blue-500"
                    >
                      <option value="Uang Jalan / Sangu Supir">Uang Jalan / Sangu Supir</option>
                      <option value="Biaya Tol & E-Toll">Biaya Tol &amp; E-Toll Fleet</option>
                      <option value="Biaya Parkir & TPR / Retribusi">Biaya Parkir &amp; TPR / Retribusi</option>
                      <option value="Biaya Tambal Ban & Darurat">Biaya Tambal Ban &amp; Darurat Jalan</option>
                      <option value="Operasional Lainnya">Operasional Kantor &amp; Pool Lainnya</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Metode Pembayaran</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="Cash / Uang Kas">Cash / Tunai Fisik</option>
                    <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                    <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                    <option value="E-Toll Card Fleet">E-Toll Fleet Pass</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Kode Surat Jalan / Trip</label>
                  <input
                    type="text"
                    placeholder="TRIP-202608-012"
                    value={formData.tripCode}
                    onChange={(e) => setFormData({ ...formData, tripCode: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">No. Bukti / Nota Transaksi</label>
                  <input
                    type="text"
                    placeholder="KWT-08991"
                    value={formData.receiptNumber}
                    onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Keterangan / Rincian Transaksi</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan lengkap..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-xs"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Transaksi (Update CRUD) */}
      {isEditTxModalOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Edit Catatan Transaksi Keuangan
                  </h3>
                  <p className="text-[11px] text-slate-400">Perbarui rincian, nominal, atau akun transaksi</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditTxModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditTxSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Tipe Transaksi *</label>
                  <select
                    value={editTxData.type}
                    onChange={(e) => setEditTxData({ ...editTxData, type: e.target.value as TransactionType })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="expense">Pengeluaran Operasional</option>
                    <option value="income">Pemasukan / Pendapatan</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Akun Saldo *</label>
                  <select
                    value={editTxData.accountId}
                    onChange={(e) => setEditTxData({ ...editTxData, accountId: e.target.value })}
                    className="w-full bg-blue-50/50 border border-blue-200 text-blue-900 font-semibold rounded-lg px-3 py-2 focus:outline-hidden focus:border-blue-500"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName} (Saldo: {formatRupiah(acc.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={editTxData.date}
                    onChange={(e) => setEditTxData({ ...editTxData, date: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jumlah Nominal (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editTxData.amount}
                    onChange={(e) => setEditTxData({ ...editTxData, amount: Number(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold text-sm focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Unit Armada</label>
                  <select
                    value={editTxData.vehicleId}
                    onChange={(e) => {
                      const v = vehicles.find(veh => veh.id === e.target.value);
                      setEditTxData({
                        ...editTxData,
                        vehicleId: e.target.value,
                        driverName: v ? v.assignedDriver : editTxData.driverName
                      });
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="POOL-GENERAL">Umum / Pool Pusat</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.nopol} - {v.brand}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nama Supir / Pihak</label>
                  <input
                    type="text"
                    value={editTxData.driverName}
                    onChange={(e) => setEditTxData({ ...editTxData, driverName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Kategori</label>
                  <input
                    type="text"
                    value={editTxData.category}
                    onChange={(e) => setEditTxData({ ...editTxData, category: e.target.value as FinanceCategory })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Metode Pembayaran</label>
                  <select
                    value={editTxData.paymentMethod}
                    onChange={(e) => setEditTxData({ ...editTxData, paymentMethod: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="Cash / Uang Kas">Cash / Tunai Fisik</option>
                    <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                    <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                    <option value="E-Toll Card Fleet">E-Toll Fleet Pass</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Keterangan</label>
                <textarea
                  rows={2}
                  value={editTxData.description}
                  onChange={(e) => setEditTxData({ ...editTxData, description: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditTxModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-xs"
                >
                  Perbarui Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Tambah Akun Saldo / Kas Baru */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Tambah Akun Rekening / Kas Baru
              </h3>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAccount} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Nama Akun / Buku Kas *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Kasir Pool Jakarta, Rekening Operasional Mandiri"
                  value={accountFormData.accountName}
                  onChange={(e) => setAccountFormData({ ...accountFormData, accountName: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Tipe Akun</label>
                  <select
                    value={accountFormData.accountType}
                    onChange={(e) => setAccountFormData({ ...accountFormData, accountType: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500 font-medium"
                  >
                    <option value="bank">Bank / Rekening</option>
                    <option value="cash">Kas Fisik / Kasir</option>
                    <option value="etoll">Kartu E-Toll Fleet</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Bank / Penyedia</label>
                  <input
                    type="text"
                    placeholder="BCA, Mandiri, Kasir Pool"
                    value={accountFormData.bankOrProvider}
                    onChange={(e) => setAccountFormData({ ...accountFormData, bankOrProvider: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Nomor Rekening / No. Kartu</label>
                <input
                  type="text"
                  placeholder="882-019-2231 atau KAS-01"
                  value={accountFormData.accountNumber}
                  onChange={(e) => setAccountFormData({ ...accountFormData, accountNumber: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Saldo Awal (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={accountFormData.initialBalance}
                  onChange={(e) => setAccountFormData({ ...accountFormData, initialBalance: Number(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catatan / Keterangan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan penggunaan rekening ini..."
                  value={accountFormData.notes}
                  onChange={(e) => setAccountFormData({ ...accountFormData, notes: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-xs"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Akun Saldo / Kas (Update CRUD) */}
      {isEditAccountModalOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                Edit Akun Rekening / Kas
              </h3>
              <button
                onClick={() => setIsEditAccountModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditAccountSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Nama Akun / Buku Kas *</label>
                <input
                  type="text"
                  required
                  value={editAccountFormData.accountName}
                  onChange={(e) => setEditAccountFormData({ ...editAccountFormData, accountName: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Tipe Akun</label>
                  <select
                    value={editAccountFormData.accountType}
                    onChange={(e) => setEditAccountFormData({ ...editAccountFormData, accountType: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500 font-medium"
                  >
                    <option value="bank">Bank / Rekening</option>
                    <option value="cash">Kas Fisik / Kasir</option>
                    <option value="etoll">Kartu E-Toll Fleet</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Bank / Penyedia</label>
                  <input
                    type="text"
                    value={editAccountFormData.bankOrProvider}
                    onChange={(e) => setEditAccountFormData({ ...editAccountFormData, bankOrProvider: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Nomor Rekening</label>
                <input
                  type="text"
                  value={editAccountFormData.accountNumber}
                  onChange={(e) => setEditAccountFormData({ ...editAccountFormData, accountNumber: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Saldo Terkini (Rp)</label>
                <input
                  type="number"
                  value={editAccountFormData.currentBalance}
                  onChange={(e) => setEditAccountFormData({ ...editAccountFormData, currentBalance: Number(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catatan</label>
                <textarea
                  rows={2}
                  value={editAccountFormData.notes}
                  onChange={(e) => setEditAccountFormData({ ...editAccountFormData, notes: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditAccountModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-xs"
                >
                  Perbarui Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Transfer Saldo Antar Rekening */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                Transfer / Mutasi Saldo Antar Rekening
              </h3>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Dari Rekening / Kas Asal *</label>
                <select
                  value={transferData.fromAccountId}
                  onChange={(e) => setTransferData({ ...transferData, fromAccountId: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500 font-medium"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName} (Tersedia: {formatRupiah(acc.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Ke Rekening / Kas Tujuan *</label>
                <select
                  value={transferData.toAccountId}
                  onChange={(e) => setTransferData({ ...transferData, toAccountId: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500 font-medium"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName} ({acc.accountType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Nominal Transfer (Rp) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={transferData.amount}
                  onChange={(e) => setTransferData({ ...transferData, amount: Number(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold text-sm focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Keperluan / Keterangan Transfer</label>
                <input
                  type="text"
                  placeholder="Misal: Tarik tunai kasir pool, Top up saldo E-Toll Mandiri"
                  value={transferData.notes}
                  onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Proses Transfer Saldo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
