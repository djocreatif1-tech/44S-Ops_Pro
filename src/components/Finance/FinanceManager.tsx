import React, { useState, useRef, useEffect } from 'react';
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
  Lock,
  Building,
  ShieldCheck,
  AlertCircle,
  FileText,
  Eye,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Image as ImageIcon,
  Download,
  Printer,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  ShieldAlert,
  DollarSign,
  Layers,
  Landmark,
  CheckCircle,
  Wrench,
  Users
} from 'lucide-react';
import {
  OperationalFinance,
  Vehicle,
  FinanceCategory,
  TransactionType,
  FinancialAccount,
  NonRentalIncomeCategory,
  PaymentMethod,
  UserRole,
  CompanyDeposit,
  EquipmentCashFlow,
  DriverPocketCashFlow,
  Driver,
  AdminStaff
} from '../../types';
import {
  formatRupiah,
  formatDateIndo
} from '../../utils/formatters';
import { confirmDelete, showCenterCrudNotification } from '../../utils/dialogService';
import { exportFinanceToExcel, exportFinanceToPDF } from '../../utils/exportUtils';
import {
  terbilangRupiah,
  printElementById,
  downloadFinanceSlipPDF,
  resolveDriverFromData,
  resolveAdminCashierByRole,
  getAdminCashierSelectOptions
} from '../../utils/slipPrint';
import { ModuleFilterExportBar } from '../Common/ModuleFilterExportBar';
import { getRolePermissions } from '../../utils/permissions';
import { RoleRestrictedBanner } from '../Common/RoleRestrictedBanner';
import { SAMPLE_RECEIPT_IMAGE } from '../../data/initialData';
import { compressReceiptFile, resolveDisplayReceiptUrl } from '../../utils/imageCompressor';
import { TablePagination } from '../Common/TablePagination';
import { PrintOutPreviewStage } from '../Common/PrintPreviewControls';
import { EquipmentCashFlowManager } from './EquipmentCashFlowManager';
import { DriverPocketMoneyManager } from './DriverPocketMoneyManager';
import { ModuleAnalyticsPanel } from '../Common/ModuleAnalyticsPanel';
import { BarChart3, ListFilter } from 'lucide-react';

export type FinanceSubTab = 'general_cash' | 'driver_pocket' | 'equipment_cash' | 'deposits';

interface FinanceManagerProps {
  finances: OperationalFinance[];
  vehicles: Vehicle[];
  accounts: FinancialAccount[];
  companyDeposits?: CompanyDeposit[];
  nonRentalCategories?: NonRentalIncomeCategory[];
  paymentMethods?: PaymentMethod[];
  equipmentList?: EquipmentCashFlow[];
  pocketFlows?: DriverPocketCashFlow[];
  drivers?: Driver[];
  adminStaff?: AdminStaff[];
  userRole?: UserRole;
  initialSubTab?: FinanceSubTab;
  onOpenRoleMatrix?: () => void;
  onAddFinance: (fin: OperationalFinance) => void;
  onUpdateFinance?: (fin: OperationalFinance) => void;
  onDeleteFinance: (id: string) => void;
  onAddAccount: (acc: FinancialAccount) => void;
  onUpdateAccount?: (acc: FinancialAccount) => void;
  onDeleteAccount?: (id: string) => void;
  onTransferBalance: (fromAccId: string, toAccId: string, amount: number, notes: string) => void;
  onAddCompanyDeposit?: (dep: CompanyDeposit) => void;
  onUpdateCompanyDeposit?: (dep: CompanyDeposit) => void;
  onDeleteCompanyDeposit?: (id: string) => void;
  onTopUpCompanyDeposit?: (
    companyId: string,
    amount: number,
    paymentMethod: string,
    accountId: string,
    notes: string,
    receiptProofUrl?: string
  ) => void;
  onAddEquipment?: (eq: EquipmentCashFlow) => void;
  onUpdateEquipment?: (eq: EquipmentCashFlow) => void;
  onDeleteEquipment?: (id: string) => void;
  onAddPocketFlow?: (flow: DriverPocketCashFlow) => void;
  onUpdatePocketFlow?: (flow: DriverPocketCashFlow) => void;
  onDeletePocketFlow?: (id: string) => void;
  onNavigateToMasterNonRental?: () => void;
  onNavigateToMasterPaymentMethods?: () => void;
}

export const FinanceManager: React.FC<FinanceManagerProps> = ({
  finances = [],
  vehicles = [],
  accounts = [],
  companyDeposits = [],
  nonRentalCategories = [],
  paymentMethods = [],
  equipmentList = [],
  pocketFlows = [],
  drivers = [],
  adminStaff = [],
  userRole = 'owner',
  initialSubTab = 'general_cash',
  onOpenRoleMatrix,
  onAddFinance,
  onUpdateFinance,
  onDeleteFinance,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onTransferBalance,
  onAddCompanyDeposit,
  onUpdateCompanyDeposit,
  onDeleteCompanyDeposit,
  onTopUpCompanyDeposit,
  onAddEquipment,
  onUpdateEquipment,
  onDeleteEquipment,
  onAddPocketFlow,
  onUpdatePocketFlow,
  onDeletePocketFlow,
  onNavigateToMasterNonRental,
  onNavigateToMasterPaymentMethods
}) => {
  const safeFinances = Array.isArray(finances) ? finances : [];
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safeCompanyDeposits = Array.isArray(companyDeposits) ? companyDeposits : [];
  const safeNonRentalCategories = Array.isArray(nonRentalCategories) ? nonRentalCategories : [];
  const safePaymentMethods = Array.isArray(paymentMethods) ? paymentMethods : [];
  const safeEquipmentList = Array.isArray(equipmentList) ? equipmentList : [];
  const safePocketFlows = Array.isArray(pocketFlows) ? pocketFlows : [];
  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const safeAdminStaff = Array.isArray(adminStaff) ? adminStaff : [];

  const [activeSubTab, setActiveSubTab] = useState<FinanceSubTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const perms = getRolePermissions(userRole);
  const [cashViewMode, setCashViewMode] = useState<'transactions' | 'analytics'>('transactions');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'income_rental' | 'income_non_rental'>('all');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterReceipt, setFilterReceipt] = useState<'all' | 'has_receipt' | 'no_receipt' | 'verified'>('all');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [selectedOwnerCompany, setSelectedOwnerCompany] = useState<string>('all');

  const getFinanceOwnerCompany = (f: OperationalFinance) => {
    if (f.companyName) return f.companyName;
    const v = safeVehicles.find(veh => veh.id === f.vehicleId || veh.nopol === f.nopol);
    if (v?.ownerCompany) return v.ownerCompany;
    const acc = safeAccounts.find(a => a.id === f.accountId);
    if (acc?.companyName) return acc.companyName;
    return 'PT Transindo Logistik';
  };

  const ownerCompanies = Array.from(
    new Set([
      ...safeVehicles.map(v => v.ownerCompany).filter(Boolean),
      ...safeAccounts.map(a => a.companyName || '').filter(Boolean),
      ...safeCompanyDeposits.map(c => c.companyName).filter(Boolean),
      ...safeFinances.map(f => getFinanceOwnerCompany(f)).filter(Boolean)
    ])
  );

  const companySummaries = ownerCompanies.map((comp) => {
    const compRecs = safeFinances.filter((f) => {
      if (!f) return false;
      if (startDate && f.date < startDate) return false;
      if (endDate && f.date > endDate) return false;
      return getFinanceOwnerCompany(f) === comp;
    });
    return {
      companyName: comp,
      count: compRecs.length,
      totalExpense: compRecs.filter(r => r.type === 'expense').reduce((s, r) => s + (r.amount || 0), 0),
    };
  });
  
  // Pagination State (Next Halaman)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isEditTxModalOpen, setIsEditTxModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyDeposit | null>(null);

  // Receipt Inspection & Audit Modal
  const [inspectedReceiptTx, setInspectedReceiptTx] = useState<OperationalFinance | null>(null);
  const [receiptZoom, setReceiptZoom] = useState<number>(1);
  const [printSlipTx, setPrintSlipTx] = useState<OperationalFinance | null>(null);

  // File Upload Error Notifications
  const [formReceiptError, setFormReceiptError] = useState<string | null>(null);
  const [editFormReceiptError, setEditFormReceiptError] = useState<string | null>(null);

  // File Input Refs
  const receiptFileInputRef = useRef<HTMLInputElement>(null);
  const editReceiptFileInputRef = useRef<HTMLInputElement>(null);
  const topUpFileInputRef = useRef<HTMLInputElement>(null);

  const [selectedTx, setSelectedTx] = useState<OperationalFinance | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<FinancialAccount | null>(null);

  // Form State: Transaksi Baru
  const defaultDriverObj = safeDrivers.find(d => d.name === safeVehicles[0]?.assignedDriver) || safeDrivers[0];
  const [formData, setFormData] = useState<Partial<OperationalFinance>>({
    date: '2026-08-21',
    vehicleId: safeVehicles[0]?.id || '',
    driverId: defaultDriverObj?.id || '',
    driverName: safeVehicles[0]?.assignedDriver || defaultDriverObj?.name || '',
    driverNip: defaultDriverObj?.nip || '',
    handoverBy: safeAdminStaff[0]?.name || 'Rina Anggraini, S.E.',
    receivedBy: safeVehicles[0]?.assignedDriver || defaultDriverObj?.name || '',
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
    accountId: safeAccounts[0]?.id || '',
    companyId: '',
    companyName: '',
    receiptProofUrl: ''
  });

  // Form State: Edit Transaksi
  const [editTxData, setEditTxData] = useState<Partial<OperationalFinance>>({
    id: '',
    date: '',
    vehicleId: '',
    driverId: '',
    driverName: '',
    driverNip: '',
    handoverBy: '',
    receivedBy: '',
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
    accountId: '',
    companyId: '',
    companyName: '',
    receiptProofUrl: ''
  });

  // Form State: Top-Up Deposit Perusahaan
  const [topUpData, setTopUpData] = useState({
    companyId: safeCompanyDeposits[0]?.id || '',
    amount: 15000000,
    paymentMethod: 'Transfer Bank BCA',
    accountId: safeAccounts[0]?.id || '',
    notes: 'Top-up saldo operasional armada proyek bulanan',
    receiptProofUrl: ''
  });

  // Form State: Tambah/Edit Perusahaan Deposit
  const [companyFormData, setCompanyFormData] = useState<Partial<CompanyDeposit>>({
    companyName: '',
    companyCode: '',
    picName: '',
    picPhone: '',
    picEmail: '',
    address: '',
    initialDeposit: 25000000,
    minimumBalanceWarning: 10000000,
    notes: ''
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
    const ownerComp = getFinanceOwnerCompany(f);
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (f.nopol || '').toLowerCase().includes(q) ||
      (f.driverName || '').toLowerCase().includes(q) ||
      (f.driverNip || '').toLowerCase().includes(q) ||
      (f.handoverBy || '').toLowerCase().includes(q) ||
      (f.receivedBy || '').toLowerCase().includes(q) ||
      (f.description || '').toLowerCase().includes(q) ||
      ((f.tripCode || '').toLowerCase().includes(q)) ||
      ((f.accountName || '').toLowerCase().includes(q)) ||
      ((f.customerOrPayer || '').toLowerCase().includes(q)) ||
      ((f.companyName || '').toLowerCase().includes(q)) ||
      ((f.receiptNumber || '').toLowerCase().includes(q)) ||
      ((f.nonRentalCategoryName || '').toLowerCase().includes(q)) ||
      ownerComp.toLowerCase().includes(q);

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

    // Company Deposit Filter
    const matchesCompany =
      selectedCompanyFilter === 'all' ||
      (selectedCompanyFilter === 'internal' ? !f.companyId : f.companyId === selectedCompanyFilter);

    // Owner Company Mutation Filter
    const matchesOwnerCompany =
      selectedOwnerCompany === 'all' || ownerComp === selectedOwnerCompany;

    // Receipt Filter
    let matchesReceipt = true;
    if (filterReceipt === 'has_receipt') {
      matchesReceipt = Boolean(f.receiptProofUrl);
    } else if (filterReceipt === 'no_receipt') {
      matchesReceipt = !f.receiptProofUrl;
    } else if (filterReceipt === 'verified') {
      matchesReceipt = Boolean(f.isReceiptVerified);
    }

    // Date Range Filter
    const matchesStartDate = !startDate || f.date >= startDate;
    const matchesEndDate = !endDate || f.date <= endDate;

    return (
      matchesSearch &&
      matchesType &&
      matchesVehicle &&
      matchesAccount &&
      matchesCompany &&
      matchesOwnerCompany &&
      matchesReceipt &&
      matchesStartDate &&
      matchesEndDate
    );
  });

  // Paginated Finances for Next / Previous Pages
  const totalFilteredFinances = filteredFinances.length;
  const paginatedFinances = filteredFinances.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

  // Corporate Deposit Metrics
  const totalCompanyDeposits = safeCompanyDeposits.reduce((sum, d) => sum + (d.currentBalance || 0), 0);
  const totalCompanyTopUp = safeCompanyDeposits.reduce((sum, d) => sum + (d.totalTopUp || 0), 0);
  const totalCompanyUsed = safeCompanyDeposits.reduce((sum, d) => sum + (d.totalUsed || 0), 0);
  const lowBalanceCompanies = safeCompanyDeposits.filter(d => (d.currentBalance || 0) <= (d.minimumBalanceWarning || 0));
  const unverifiedExpensesCount = safeFinances.filter(f => f.type === 'expense' && !f.receiptProofUrl).length;
  const verifiedReceiptsCount = safeFinances.filter(f => f.type === 'expense' && f.receiptProofUrl).length;

  // Receipt Upload & Preview Handlers
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      showCenterCrudNotification('Format file tidak didukung. Harap pilih gambar/foto nota (JPG, PNG, WebP) atau PDF.', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showCenterCrudNotification('Ukuran file maksimal 10 MB.', 'error');
      return;
    }
    try {
      const dataUrl = await compressReceiptFile(file);
      if (isEdit) {
        setEditTxData(prev => ({ ...prev, receiptProofUrl: dataUrl }));
        setEditFormReceiptError(null);
      } else {
        setFormData(prev => ({ ...prev, receiptProofUrl: dataUrl }));
        setFormReceiptError(null);
      }
    } catch {
      showCenterCrudNotification('Gagal memproses file bukti nota.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleUseSampleReceipt = (isEdit = false) => {
    if (isEdit) {
      setEditTxData(prev => ({ ...prev, receiptProofUrl: SAMPLE_RECEIPT_IMAGE }));
      setEditFormReceiptError(null);
    } else {
      setFormData(prev => ({ ...prev, receiptProofUrl: SAMPLE_RECEIPT_IMAGE }));
      setFormReceiptError(null);
    }
  };

  const handleTopUpReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      showCenterCrudNotification('Format file tidak didukung. Harap pilih gambar atau PDF.', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showCenterCrudNotification('Ukuran file maksimal 10 MB.', 'error');
      return;
    }
    try {
      const dataUrl = await compressReceiptFile(file);
      setTopUpData(prev => ({ ...prev, receiptProofUrl: dataUrl }));
    } catch {
      showCenterCrudNotification('Gagal memproses file bukti transfer.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  // Vehicle Select in Form
  const handleVehicleSelectInForm = (vId: string) => {
    const v = vehicles.find(veh => veh.id === vId);
    const matchedDrv = v ? safeDrivers.find(d => d.name.toLowerCase() === v.assignedDriver.toLowerCase()) : undefined;
    setFormData({
      ...formData,
      vehicleId: vId,
      driverId: matchedDrv?.id || '',
      driverName: v ? v.assignedDriver : '',
      driverNip: matchedDrv?.nip || '',
      receivedBy: v ? v.assignedDriver : formData.receivedBy
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

    // Strict Accountability: Expense requires receipt proof
    if (formData.type === 'expense' && !formData.receiptProofUrl) {
      setFormReceiptError('Wajib melampirkan foto bukti nota / kwitansi fisik untuk setiap transaksi pengeluaran demi akuntabilitas keuangan!');
      return;
    }
    setFormReceiptError(null);

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

    let compName: string | undefined = undefined;
    if (formData.companyId) {
      const comp = safeCompanyDeposits.find(c => c.id === formData.companyId);
      compName = comp?.companyName;
    }

    const matchedDrv = safeDrivers.find(
      d => d.id === formData.driverId || d.name.toLowerCase() === (formData.driverName || '').toLowerCase()
    );

    const newFinance: OperationalFinance = {
      id: 'FIN-' + Date.now().toString().slice(-4),
      date: formData.date || '2026-08-21',
      vehicleId: formData.vehicleId || vehicles[0]?.id || '',
      nopol,
      driverId: matchedDrv?.id || formData.driverId,
      driverName: formData.driverName || 'Admin Kasir',
      driverNip: matchedDrv?.nip || formData.driverNip,
      handoverBy: formData.handoverBy || 'Rina Anggraini, S.E.',
      receivedBy: formData.receivedBy || formData.driverName || 'Admin Kasir',
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
      accountName,
      companyId: formData.companyId || undefined,
      companyName: compName,
      receiptProofUrl: formData.receiptProofUrl || undefined,
      isReceiptVerified: false
    };

    onAddFinance(newFinance);
    setIsTxModalOpen(false);
    setFormData(prev => ({
      ...prev,
      receiptProofUrl: '',
      companyId: '',
      companyName: '',
      amount: 350000,
      description: ''
    }));
  };

  // Open Edit Transaction
  const handleOpenEditTx = (fin: OperationalFinance) => {
    setSelectedTx(fin);
    const matchedDrv = safeDrivers.find(
      d => d.id === fin.driverId || d.name.toLowerCase() === (fin.driverName || '').toLowerCase()
    );
    setEditTxData({
      ...fin,
      driverId: fin.driverId || matchedDrv?.id || '',
      driverNip: fin.driverNip || matchedDrv?.nip || '',
      handoverBy: fin.handoverBy || 'Rina Anggraini, S.E.',
      receivedBy: fin.receivedBy || fin.driverName || '',
      receiptProofUrl: fin.receiptProofUrl || '',
      companyId: fin.companyId || ''
    });
    setEditFormReceiptError(null);
    setIsEditTxModalOpen(true);
  };

  // Submit Edit Transaction
  const handleEditTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx || !onUpdateFinance) return;

    if (editTxData.type === 'expense' && !editTxData.receiptProofUrl) {
      setEditFormReceiptError('Wajib melampirkan foto bukti nota / kwitansi fisik untuk setiap transaksi pengeluaran demi akuntabilitas keuangan!');
      return;
    }
    setEditFormReceiptError(null);

    const v = vehicles.find(veh => veh.id === editTxData.vehicleId);
    const nopol = v ? v.nopol : (editTxData.vehicleId === 'POOL-GENERAL' ? 'KAS OPERASIONAL POOL' : selectedTx.nopol);
    const acc = accounts.find(a => a.id === editTxData.accountId);
    const accountName = acc ? acc.accountName : selectedTx.accountName;

    let compName = selectedTx.companyName;
    if (editTxData.companyId) {
      const comp = safeCompanyDeposits.find(c => c.id === editTxData.companyId);
      compName = comp?.companyName;
    } else if (editTxData.companyId === '') {
      compName = undefined;
    }

    const matchedDrv = safeDrivers.find(
      d => d.id === editTxData.driverId || d.name.toLowerCase() === (editTxData.driverName || '').toLowerCase()
    );

    const updated: OperationalFinance = {
      ...selectedTx,
      date: editTxData.date || selectedTx.date,
      vehicleId: editTxData.vehicleId || selectedTx.vehicleId,
      nopol,
      driverId: matchedDrv?.id || editTxData.driverId,
      driverName: editTxData.driverName || selectedTx.driverName,
      driverNip: matchedDrv?.nip || editTxData.driverNip,
      handoverBy: editTxData.handoverBy || selectedTx.handoverBy,
      receivedBy: editTxData.receivedBy || editTxData.driverName || selectedTx.receivedBy,
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
      accountName,
      companyId: editTxData.companyId || undefined,
      companyName: compName,
      receiptProofUrl: editTxData.receiptProofUrl || undefined,
      isReceiptVerified: editTxData.isReceiptVerified
    };

    onUpdateFinance(updated);
    setIsEditTxModalOpen(false);
    setSelectedTx(null);
  };

  // Top-Up Submit Handler
  const handleSubmitTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpData.companyId) {
      showCenterCrudNotification('Pilih perusahaan rekanan terlebih dahulu!', 'error');
      return;
    }
    if (topUpData.amount <= 0) {
      showCenterCrudNotification('Nominal top-up deposit harus lebih besar dari Rp 0!', 'error');
      return;
    }
    if (onTopUpCompanyDeposit) {
      onTopUpCompanyDeposit(
        topUpData.companyId,
        Number(topUpData.amount),
        topUpData.paymentMethod,
        topUpData.accountId,
        topUpData.notes,
        topUpData.receiptProofUrl || SAMPLE_RECEIPT_IMAGE
      );
    }
    setIsTopUpModalOpen(false);
    setTopUpData({
      companyId: safeCompanyDeposits[0]?.id || '',
      amount: 15000000,
      paymentMethod: 'Transfer Bank BCA',
      accountId: safeAccounts[0]?.id || '',
      notes: 'Top-up saldo operasional armada proyek bulanan',
      receiptProofUrl: ''
    });
  };

  // Company Deposit Add/Edit Submit Handler
  const handleSubmitCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCompany && onUpdateCompanyDeposit) {
      onUpdateCompanyDeposit({
        ...editingCompany,
        ...companyFormData,
        minimumBalanceWarning: Number(companyFormData.minimumBalanceWarning) || 10000000
      } as CompanyDeposit);
    } else if (onAddCompanyDeposit) {
      const newDep: CompanyDeposit = {
        id: 'DEP-' + Date.now().toString().slice(-4),
        companyName: companyFormData.companyName || 'PT Rekanan Baru',
        companyCode: companyFormData.companyCode || 'PT-REK',
        picName: companyFormData.picName || '',
        picPhone: companyFormData.picPhone || '',
        picEmail: companyFormData.picEmail || '',
        address: companyFormData.address || '',
        initialDeposit: Number(companyFormData.initialDeposit) || 0,
        currentBalance: Number(companyFormData.initialDeposit) || 0,
        totalTopUp: Number(companyFormData.initialDeposit) || 0,
        totalUsed: 0,
        minimumBalanceWarning: Number(companyFormData.minimumBalanceWarning) || 10000000,
        status: 'active',
        notes: companyFormData.notes || '',
        lastTopUpDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString().slice(0, 10)
      };
      onAddCompanyDeposit(newDep);
    }
    setIsCompanyModalOpen(false);
    setEditingCompany(null);
  };

  // Verify Receipt Handler
  const handleVerifyReceipt = (tx: OperationalFinance) => {
    if (!onUpdateFinance) return;
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const verified: OperationalFinance = {
      ...tx,
      isReceiptVerified: !tx.isReceiptVerified,
      receiptVerifiedBy: !tx.isReceiptVerified ? `Auditor Keuangan (${userRole.toUpperCase()})` : undefined,
      receiptVerifiedAt: !tx.isReceiptVerified ? timestamp : undefined
    };
    onUpdateFinance(verified);
    setInspectedReceiptTx(verified);
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
      showCenterCrudNotification('Rekening asal dan tujuan tidak boleh sama!', 'error');
      return;
    }
    if (transferData.amount <= 0) {
      showCenterCrudNotification('Jumlah transfer harus lebih dari 0!', 'error');
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
          {/* Tombol Top-Up Deposit Rekanan */}
          <button
            onClick={() => {
              setTopUpData({
                companyId: safeCompanyDeposits[0]?.id || '',
                amount: 15000000,
                paymentMethod: 'Transfer Bank BCA',
                accountId: safeAccounts[0]?.id || '',
                notes: 'Top-up saldo operasional armada bulanan',
                receiptProofUrl: ''
              });
              setIsTopUpModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-medium text-xs rounded-lg shadow-xs transition"
          >
            <Coins className="w-3.5 h-3.5 text-indigo-600" />
            <span>+ Top-Up Deposit</span>
          </button>

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

      {/* Dynamic Sub-Tab Selector for Finance Modules */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2 shadow-2xs">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <button
            onClick={() => setActiveSubTab('general_cash')}
            className={`p-2.5 rounded-xl transition text-left flex items-center justify-between cursor-pointer ${
              activeSubTab === 'general_cash'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                activeSubTab === 'general_cash' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
              }`}>
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 truncate">
                <div className="text-xs font-bold truncate">Buku Kas Operasional</div>
                <div className={`text-[10px] truncate ${activeSubTab === 'general_cash' ? 'text-white/80' : 'text-slate-400'}`}>
                  Arus Kas Masuk &amp; Keluar
                </div>
              </div>
            </div>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${
              activeSubTab === 'general_cash' ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'
            }`}>
              {safeFinances.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('driver_pocket')}
            className={`p-2.5 rounded-xl transition text-left flex items-center justify-between cursor-pointer ${
              activeSubTab === 'driver_pocket'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                activeSubTab === 'driver_pocket' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
              }`}>
                <Coins className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 truncate">
                <div className="text-xs font-bold truncate">Arus Kas Saku Driver</div>
                <div className={`text-[10px] truncate ${activeSubTab === 'driver_pocket' ? 'text-white/80' : 'text-slate-400'}`}>
                  Uang Makan, Tol &amp; Sangu
                </div>
              </div>
            </div>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${
              activeSubTab === 'driver_pocket' ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'
            }`}>
              {safePocketFlows.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('equipment_cash')}
            className={`p-2.5 rounded-xl transition text-left flex items-center justify-between cursor-pointer ${
              activeSubTab === 'equipment_cash'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                activeSubTab === 'equipment_cash' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'
              }`}>
                <Wrench className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 truncate">
                <div className="text-xs font-bold truncate">Arus Kas Peralatan</div>
                <div className={`text-[10px] truncate ${activeSubTab === 'equipment_cash' ? 'text-white/80' : 'text-slate-400'}`}>
                  Terpal, Lashing, APAR &amp; Tools
                </div>
              </div>
            </div>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${
              activeSubTab === 'equipment_cash' ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'
            }`}>
              {safeEquipmentList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('deposits')}
            className={`p-2.5 rounded-xl transition text-left flex items-center justify-between cursor-pointer ${
              activeSubTab === 'deposits'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                activeSubTab === 'deposits' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
              }`}>
                <Building className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 truncate">
                <div className="text-xs font-bold truncate">Deposit &amp; Rekening Bank</div>
                <div className={`text-[10px] truncate ${activeSubTab === 'deposits' ? 'text-white/80' : 'text-slate-400'}`}>
                  Klien Deposit &amp; Kas Pool
                </div>
              </div>
            </div>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${
              activeSubTab === 'deposits' ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'
            }`}>
              {safeCompanyDeposits.length + safeAccounts.length}
            </span>
          </button>
        </div>
      </div>

      {/* 1. VIEW: ARUS KAS SAKU DRIVER UNTUK PERJALANAN */}
      {activeSubTab === 'driver_pocket' && (
        <DriverPocketMoneyManager
          pocketFlows={safePocketFlows}
          vehicles={safeVehicles}
          drivers={safeDrivers}
          adminStaff={safeAdminStaff}
          accounts={safeAccounts}
          companyDeposits={safeCompanyDeposits}
          userRole={userRole}
          onAddPocketFlow={onAddPocketFlow || (() => {})}
          onUpdatePocketFlow={onUpdatePocketFlow || (() => {})}
          onDeletePocketFlow={onDeletePocketFlow || (() => {})}
          onOpenRoleMatrix={onOpenRoleMatrix}
        />
      )}

      {/* 2. VIEW: ARUS KAS PERALATAN & PERLENGKAPAN ARMADA */}
      {activeSubTab === 'equipment_cash' && (
        <EquipmentCashFlowManager
          equipmentList={safeEquipmentList}
          vehicles={safeVehicles}
          drivers={safeDrivers}
          adminStaff={safeAdminStaff}
          accounts={safeAccounts}
          userRole={userRole}
          onAddEquipment={onAddEquipment || (() => {})}
          onUpdateEquipment={onUpdateEquipment || (() => {})}
          onDeleteEquipment={onDeleteEquipment || (() => {})}
          onOpenRoleMatrix={onOpenRoleMatrix}
        />
      )}

      {/* 3. VIEW: BUKU KAS OPERASIONAL & DEPOSIT */}
      {(activeSubTab === 'general_cash' || activeSubTab === 'deposits') && (
        <>
          {/* 0. DANA DEPOSIT PERUSAHAAN REKANAN (CORPORATE CLIENTS) */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-800">
                  Dana Deposit Perusahaan Rekanan / Klien Logistik
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Sistem Deposit Klien
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Total Saldo Deposit Tersedia:{' '}
                <span className="font-mono font-bold text-indigo-600">
                  {formatRupiah(totalCompanyDeposits)}
                </span>
                {' '}• Total Top-Up Masuk: <span className="font-mono text-slate-600">{formatRupiah(totalCompanyTopUp)}</span>
                {' '}• Terpakai Beban Armada: <span className="font-mono text-slate-600">{formatRupiah(totalCompanyUsed)}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {lowBalanceCompanies.length > 0 && (
              <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200/80 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                {lowBalanceCompanies.length} Perusahaan Saldo Waspada
              </span>
            )}
            <button
              onClick={() => {
                setEditingCompany(null);
                setCompanyFormData({
                  companyName: '',
                  companyCode: '',
                  picName: '',
                  picPhone: '',
                  picEmail: '',
                  address: '',
                  initialDeposit: 25000000,
                  minimumBalanceWarning: 10000000,
                  notes: ''
                });
                setIsCompanyModalOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-[11px] rounded-lg transition"
            >
              <Plus className="w-3 h-3 text-indigo-600" />
              <span>+ Rekanan</span>
            </button>
            <button
              onClick={() => {
                setTopUpData({
                  companyId: safeCompanyDeposits[0]?.id || '',
                  amount: 15000000,
                  paymentMethod: 'Transfer Bank BCA',
                  accountId: safeAccounts[0]?.id || '',
                  notes: 'Top-up saldo operasional armada bulanan',
                  receiptProofUrl: ''
                });
                setIsTopUpModalOpen(true);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[11px] rounded-lg shadow-xs transition"
            >
              <Coins className="w-3 h-3" />
              <span>+ Top-Up Deposit</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {safeCompanyDeposits.map((comp) => {
            const isLow = (comp.currentBalance || 0) <= (comp.minimumBalanceWarning || 0);
            const isFiltered = selectedCompanyFilter === comp.id;

            return (
              <div
                key={comp.id}
                className={`p-4 rounded-xl border transition relative group flex flex-col justify-between ${
                  isFiltered
                    ? 'border-indigo-500 bg-indigo-50/20 shadow-xs'
                    : isLow
                    ? 'border-amber-300 bg-amber-50/20 hover:border-amber-400'
                    : 'border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-indigo-200 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                          {comp.companyCode}
                        </span>
                        {isLow ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 flex items-center gap-0.5">
                            <AlertCircle className="w-2.5 h-2.5" /> Kritis
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Aman
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 mt-1 line-clamp-1" title={comp.companyName}>
                        {comp.companyName}
                      </h4>
                      <p className="text-[10px] text-slate-400">PIC: {comp.picName} ({comp.picPhone})</p>
                    </div>
                    {onUpdateCompanyDeposit && (
                      <button
                        onClick={() => {
                          setEditingCompany(comp);
                          setCompanyFormData({
                            companyName: comp.companyName,
                            companyCode: comp.companyCode,
                            picName: comp.picName,
                            picPhone: comp.picPhone,
                            picEmail: comp.picEmail,
                            address: comp.address,
                            initialDeposit: comp.initialDeposit,
                            minimumBalanceWarning: comp.minimumBalanceWarning,
                            notes: comp.notes
                          });
                          setIsCompanyModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded transition opacity-80 group-hover:opacity-100"
                        title="Edit Profil Rekanan"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-400 block">Sisa Saldo Deposit:</span>
                    <p className={`text-base font-bold font-mono ${isLow ? 'text-amber-700' : 'text-indigo-700'}`}>
                      {formatRupiah(comp.currentBalance)}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400">
                      <span>Batas Waspada:</span>
                      <span className="font-mono font-medium">{formatRupiah(comp.minimumBalanceWarning)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCompanyFilter(selectedCompanyFilter === comp.id ? 'all' : comp.id);
                    }}
                    className={`text-[10px] px-2 py-1 rounded font-medium transition ${
                      isFiltered
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {isFiltered ? '✓ Filter Aktif' : 'Lihat Beban'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTopUpData({
                        companyId: comp.id,
                        amount: 15000000,
                        paymentMethod: 'Transfer Bank BCA',
                        accountId: safeAccounts[0]?.id || '',
                        notes: `Top-up deposit untuk ${comp.companyName}`,
                        receiptProofUrl: ''
                      });
                      setIsTopUpModalOpen(true);
                    }}
                    className="text-[10px] px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded transition flex items-center gap-1"
                  >
                    <Plus className="w-2.5 h-2.5" /> Top-Up
                  </button>
                </div>
              </div>
            );
          })}
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
                        onClick={async () => {
                          if (await confirmDelete(`Akun Kas/Bank "${acc.accountName}"`, 'Apakah Anda Yakin Ingin Menghapus Data?', `Bank/Provider: ${acc.bankOrProvider} • No: ${acc.accountNumber}`)) {
                            onDeleteAccount(acc.id);
                          }
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

      {activeSubTab === 'general_cash' && (
        <>
          {/* Mode Switcher: Buku Kas Operasional vs Laporan & Analitik Kas */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-600" />
                Buku Kas Operasional &amp; Rekapitulasi Keuangan
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan transaksi harian, verifikasi nota fisik &amp; laporan analitik arus kas operasional
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setCashViewMode('transactions')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  cashViewMode === 'transactions'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Daftar Transaksi Kas</span>
              </button>
              <button
                type="button"
                onClick={() => setCashViewMode('analytics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  cashViewMode === 'analytics'
                    ? 'bg-indigo-600 text-white shadow-xs border border-indigo-700'
                    : 'text-indigo-700 hover:bg-indigo-50'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Laporan &amp; Analitik Kas</span>
              </button>
            </div>
          </div>

          {cashViewMode === 'analytics' ? (
            <ModuleAnalyticsPanel
              moduleType="finance"
              title="Laporan & Analitik Buku Kas Operasional Logistik"
              subtitle="Analisis pemasukan sewa & non-sewa vs pengeluaran operasional, laba bersih & rincian pos biaya"
              finances={safeFinances}
              vehicles={safeVehicles}
              drivers={safeDrivers}
              accounts={safeAccounts}
            />
          ) : (
            <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <p className="text-[10px] text-slate-400 mt-1">Uang Jalan, Tol, BBM, Parkir &amp; Retribusi</p>
        </div>

        {/* Card 3: Saldo Deposit Rekanan Perusahaan */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Saldo Deposit Rekanan</p>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-indigo-700 mt-2 font-mono">{formatRupiah(totalCompanyDeposits)}</h3>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">
              {safeCompanyDeposits.length} Perusahaan Klien
            </span>
            {lowBalanceCompanies.length > 0 ? (
              <span className="text-amber-600 font-semibold flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" /> {lowBalanceCompanies.length} Butuh Top-Up
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Saldo Cukup
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Akuntabilitas Bukti Nota */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Akuntabilitas Nota Fisik</p>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${unverifiedExpensesCount === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className={`text-2xl font-bold mt-2 font-mono ${unverifiedExpensesCount === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
            {unverifiedExpensesCount === 0 ? '100% Sah' : `${unverifiedExpensesCount} Kurang`}
          </h3>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">
              {verifiedReceiptsCount} Nota Terlampir
            </span>
            {unverifiedExpensesCount > 0 ? (
              <span className="text-rose-600 font-semibold flex items-center gap-0.5">
                <AlertCircle className="w-3 h-3" /> Wajib Dilengkapi
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                <Check className="w-3 h-3" /> Terverifikasi
              </span>
            )}
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
        totalFilteredCount={filteredFinances.length}
        totalAllCount={finances.length}
        moduleLabel="Transaksi"
        companies={ownerCompanies}
        selectedCompany={selectedOwnerCompany}
        onCompanyChange={(val) => {
          setSelectedOwnerCompany(val);
          setCurrentPage(1);
        }}
        companySummaries={companySummaries}
      >
        <div className="relative w-full md:w-56">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari transaksi, rekanan, supir, nopol..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
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
              onClick={() => {
                setFilterType(f.id as typeof filterType);
                setCurrentPage(1);
              }}
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

        {/* Filter Rekanan Perusahaan */}
        <select
          value={selectedCompanyFilter}
          onChange={(e) => {
            setSelectedCompanyFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 font-medium"
        >
          <option value="all">Semua Beban Dana</option>
          <option value="internal">Kas Operasional Internal (Pool)</option>
          {safeCompanyDeposits.map((d) => (
            <option key={d.id} value={d.id}>Deposit: {d.companyName} ({d.companyCode})</option>
          ))}
        </select>

        {/* Filter Bukti Nota */}
        <select
          value={filterReceipt}
          onChange={(e) => {
            setFilterReceipt(e.target.value as typeof filterReceipt);
            setCurrentPage(1);
          }}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 font-medium"
        >
          <option value="all">Semua Bukti Nota</option>
          <option value="has_receipt">✓ Ada Bukti Nota</option>
          <option value="no_receipt">⚠️ Tanpa Nota (Wajib)</option>
          <option value="verified">✓ Lulus Audit Verifikasi</option>
        </select>

        <select
          value={selectedAccountFilter}
          onChange={(e) => {
            setSelectedAccountFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 font-medium"
        >
          <option value="all">Semua Rekening / Kas</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.accountName}</option>
          ))}
        </select>

        <select
          value={selectedVehicle}
          onChange={(e) => {
            setSelectedVehicle(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 font-medium"
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
                <th className="py-3 px-5">Kategori &amp; Beban Rekanan</th>
                <th className="py-3 px-5">Akun Kas &amp; Metode</th>
                <th className="py-3 px-5 text-center">Bukti Nota &amp; Audit</th>
                <th className="py-3 px-5 text-right">Jumlah (Rp)</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedFinances.map((fin) => {
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
                        {fin.driverNip && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {fin.driverNip}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">
                        {fin.customerOrPayer ? (
                          <span className="text-slate-700 font-medium">Rekanan: {fin.customerOrPayer}</span>
                        ) : (
                          fin.driverName
                        )}
                      </p>
                      {(fin.handoverBy || fin.receivedBy) && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Serah Terima: <span className="font-medium text-slate-600">{fin.handoverBy || 'Kasir'}</span> → <span className="font-semibold text-emerald-700">{fin.receivedBy || fin.driverName}</span>
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5 flex-wrap">
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
                      {fin.companyName && (
                        <div className="mt-1 flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70 flex items-center gap-1">
                            <Building className="w-2.5 h-2.5 text-indigo-500" />
                            Beban Deposit: {fin.companyName}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1">
                        <CircleDot className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="font-semibold text-slate-800">{fin.accountName || 'Kas Utama'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{fin.paymentMethod}</p>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      {fin.receiptProofUrl ? (
                        <div className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setInspectedReceiptTx(fin);
                              setReceiptZoom(1);
                            }}
                            className="w-9 h-9 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 hover:border-blue-500 hover:scale-105 transition shrink-0 relative group shadow-2xs flex items-center justify-center"
                            title="Klik untuk audit & perbesar nota fisik"
                          >
                            {fin.receiptProofUrl.startsWith('data:application/pdf') ? (
                              <FileText className="w-4 h-4 text-rose-600" />
                            ) : (
                              <img src={fin.receiptProofUrl} alt="Bukti Nota" className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Eye className="w-3.5 h-3.5 text-white" />
                            </div>
                          </button>
                          {fin.isReceiptVerified ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5 whitespace-nowrap">
                              <CheckCircle className="w-2.5 h-2.5" /> Lulus Audit
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setInspectedReceiptTx(fin);
                                setReceiptZoom(1);
                              }}
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 flex items-center gap-0.5 whitespace-nowrap transition"
                            >
                              <Eye className="w-2.5 h-2.5" /> Cek Nota
                            </button>
                          )}
                        </div>
                      ) : fin.type === 'expense' ? (
                        <span className="px-2 py-1 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center gap-1 whitespace-nowrap mx-auto">
                          <AlertTriangle className="w-2.5 h-2.5" /> Wajib Nota
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className={`py-3.5 px-5 text-right font-mono font-bold ${isIncome ? (isNonRental ? 'text-purple-700' : 'text-green-700') : 'text-rose-700'}`}>
                      {isIncome ? '+' : '-'}{formatRupiah(fin.amount)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPrintSlipTx(fin)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200 transition"
                          title="Cetak Slip / Kwitansi Transaksi"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {fin.receiptProofUrl && (
                          <button
                            onClick={() => {
                              setInspectedReceiptTx(fin);
                              setReceiptZoom(1);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition"
                            title="Audit Bukti Nota"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
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
                            onClick={async () => {
                              if (await confirmDelete(`Transaksi ${fin.category} (${formatRupiah(fin.amount)})`, 'Apakah Anda Yakin Ingin Menghapus Data?', `${fin.description} • Tanggal: ${fin.date}`)) {
                                onDeleteFinance(fin.id);
                              }
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
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada data keuangan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination with Next / Prev */}
        <TablePagination
          currentPage={currentPage}
          totalItems={totalFilteredFinances}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 20, 50]}
          itemLabel="transaksi keuangan"
        />
      </div>
            </>
          )}
        </>
      )}
    </>
  )}

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
                  <label className="text-slate-700 font-semibold block mb-1">Referensi Karyawan Driver / PIC</label>
                  <select
                    value={formData.driverId || ''}
                    onChange={(e) => {
                      const dId = e.target.value;
                      const drv = safeDrivers.find(d => d.id === dId);
                      if (drv) {
                        setFormData({
                          ...formData,
                          driverId: drv.id,
                          driverName: drv.name,
                          driverNip: drv.nip || '',
                          receivedBy: drv.name
                        });
                      } else {
                        setFormData({
                          ...formData,
                          driverId: '',
                          driverNip: ''
                        });
                      }
                    }}
                    className="w-full bg-emerald-50/40 border border-emerald-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="">-- Pilih Karyawan Driver / Ketik Manual --</option>
                    {safeDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        [{d.nip || d.id}] {d.name} — {d.jobTitle || 'Supir Armada'} ({d.assignedVehicle || 'Pool'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 p-3 bg-emerald-50/40 border border-emerald-200/80 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      Referensi Pihak Serah Terima Transaksi (Berita Acara / Kwitansi)
                    </span>
                    {formData.driverNip && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        NIP Driver: {formData.driverNip}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 block mb-1">Nama Driver / PIC Terkait</label>
                      <input
                        type="text"
                        value={formData.driverName || ''}
                        onChange={(e) => setFormData({ ...formData, driverName: e.target.value, receivedBy: e.target.value })}
                        placeholder="Nama Karyawan Driver / PIC"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 block mb-1">Diserahkan Oleh (Kasir Pool — Level Role Admin)</label>
                      <input
                        type="text"
                        list="finance-handover-staff-list"
                        value={formData.handoverBy || resolveAdminCashierByRole('', userRole)}
                        onChange={(e) => setFormData({ ...formData, handoverBy: e.target.value })}
                        placeholder="Petugas Kasir / Keuangan"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                      />
                      <datalist id="finance-handover-staff-list">
                        {getAdminCashierSelectOptions(userRole).map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                        {safeAdminStaff.map((st) => (
                          <option key={st.id} value={st.name}>{st.role} ({st.nip})</option>
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 block mb-1">Diterima Oleh (Driver/Penerima)</label>
                      <input
                        type="text"
                        list="finance-receiver-driver-list"
                        value={formData.receivedBy || ''}
                        onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
                        placeholder="Penerima Dana / Kwitansi"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                      />
                      <datalist id="finance-receiver-driver-list">
                        {safeDrivers.map((d) => (
                          <option key={d.id} value={d.name}>[{d.nip || d.id}] {d.jobTitle || 'Driver'}</option>
                        ))}
                      </datalist>
                    </div>
                  </div>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-semibold block">Metode Pembayaran</label>
                    {onNavigateToMasterPaymentMethods && (
                      <button
                        type="button"
                        onClick={onNavigateToMasterPaymentMethods}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
                      >
                        + Kelola Master
                      </button>
                    )}
                  </div>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matchedMethod = safePaymentMethods.find(m => m.name === val);
                      if (matchedMethod && matchedMethod.defaultAccountId) {
                        setFormData({
                          ...formData,
                          paymentMethod: val,
                          accountId: matchedMethod.defaultAccountId
                        });
                      } else {
                        setFormData({ ...formData, paymentMethod: val });
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500 font-medium"
                  >
                    {safePaymentMethods && safePaymentMethods.length > 0 ? (
                      safePaymentMethods
                        .filter(m => m.isActive)
                        .map(m => (
                          <option key={m.id} value={m.name}>
                            {m.name}
                          </option>
                        ))
                    ) : (
                      <>
                        <option value="Cash / Uang Kas">Cash / Tunai Fisik</option>
                        <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                        <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                        <option value="Kartu E-Toll">Kartu E-Toll Fleet</option>
                        <option value="Kupon SPBU">Kupon SPBU BBM</option>
                      </>
                    )}
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

              {/* ALOKASI DEPOSIT UNTUK PENGELUARAN */}
              {formData.type === 'expense' && (
                <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-800 font-bold flex items-center gap-1.5 text-xs">
                      <Building className="w-4 h-4 text-indigo-600" />
                      Beban Sumber Dana / Rekanan Deposit
                    </label>
                    <span className="text-[10px] text-slate-500">Pilih jika dipotong dari deposit klien</span>
                  </div>
                  <select
                    value={formData.companyId || ''}
                    onChange={(e) => {
                      const cId = e.target.value;
                      const c = safeCompanyDeposits.find(comp => comp.id === cId);
                      setFormData({
                        ...formData,
                        companyId: cId,
                        companyName: c ? c.companyName : ''
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="">Kas Operasional Internal Fleet (Non-Deposit)</option>
                    {safeCompanyDeposits.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        🏢 Deposit: {comp.companyName} (Sisa Saldo: {formatRupiah(comp.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* UPLOAD BUKTI NOTA / KWITANSI (TERSEDIA UNTUK SEMUA TRANSAKSI) */}
              <div className={`p-3.5 rounded-xl border space-y-2 ${formData.type === 'expense' ? 'bg-amber-50/40 border-amber-200/80' : 'bg-slate-50/80 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold flex items-center gap-1.5 text-xs">
                    <UploadCloud className="w-4 h-4 text-blue-600" />
                    Upload Bukti Fisik Nota / Kwitansi / Transfer{' '}
                    {formData.type === 'expense' ? (
                      <span className="text-rose-600 font-bold">*WAJIB</span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-medium">(Opsional)</span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleUseSampleReceipt(false)}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold underline"
                  >
                    📸 Gunakan Contoh Nota Resmi
                  </button>
                </div>

                {formReceiptError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span className="font-medium">{formReceiptError}</span>
                  </div>
                )}

                <input
                  type="file"
                  ref={receiptFileInputRef}
                  accept="image/*,application/pdf"
                  onChange={(e) => handleReceiptUpload(e, false)}
                  className="hidden"
                />

                {formData.receiptProofUrl ? (
                  <div className="flex items-center gap-3 p-2.5 bg-white border border-emerald-300 rounded-lg">
                    {formData.receiptProofUrl.startsWith('data:application/pdf') ? (
                      <div className="w-14 h-14 rounded bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                    ) : (
                      <img
                        src={formData.receiptProofUrl}
                        alt="Pratinjau Nota"
                        className="w-14 h-14 object-cover rounded border border-slate-200 shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Bukti Nota Berhasil Dilampirkan
                      </p>
                      <p className="text-[10px] text-slate-400">Siap diaudit dan diverifikasi oleh tim keuangan.</p>
                      <div className="mt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => receiptFileInputRef.current?.click()}
                          className="text-[10px] text-blue-600 font-semibold hover:underline"
                        >
                          Ganti File
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, receiptProofUrl: '' })}
                          className="text-[10px] text-rose-600 font-semibold hover:underline"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => receiptFileInputRef.current?.click()}
                    className={`p-4 border-2 border-dashed bg-white/80 hover:bg-white rounded-xl text-center cursor-pointer transition space-y-1 ${formData.type === 'expense' ? 'border-amber-300 hover:border-amber-400' : 'border-slate-300 hover:border-blue-400'}`}
                  >
                    <UploadCloud className={`w-6 h-6 mx-auto ${formData.type === 'expense' ? 'text-amber-500' : 'text-blue-500'}`} />
                    <p className="text-xs font-bold text-slate-700">
                      Klik untuk unggah foto nota / struk / bukti pembayaran
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Format: Foto kamera HP, PNG, JPG, WebP, atau PDF (Maks. 5MB)
                    </p>
                  </div>
                )}
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
                  <label className="text-slate-700 font-semibold block mb-1">Referensi Karyawan Driver</label>
                  <select
                    value={editTxData.driverId || ''}
                    onChange={(e) => {
                      const dId = e.target.value;
                      const drv = safeDrivers.find(d => d.id === dId);
                      if (drv) {
                        setEditTxData({
                          ...editTxData,
                          driverId: drv.id,
                          driverName: drv.name,
                          driverNip: drv.nip || '',
                          receivedBy: drv.name
                        });
                      } else {
                        setEditTxData({ ...editTxData, driverId: '', driverNip: '' });
                      }
                    }}
                    className="w-full bg-emerald-50/40 border border-emerald-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="">-- Pilih Karyawan Driver / Manual --</option>
                    {safeDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        [{d.nip || d.id}] {d.name} ({d.assignedVehicle || 'Pool'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 p-3 bg-emerald-50/40 border border-emerald-200/80 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-1">Nama Supir / Pihak</label>
                    <input
                      type="text"
                      value={editTxData.driverName || ''}
                      onChange={(e) => setEditTxData({ ...editTxData, driverName: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-1">Diserahkan Oleh</label>
                    <input
                      type="text"
                      list="finance-handover-staff-list"
                      value={editTxData.handoverBy || ''}
                      onChange={(e) => setEditTxData({ ...editTxData, handoverBy: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-1">Diterima Oleh</label>
                    <input
                      type="text"
                      list="finance-receiver-driver-list"
                      value={editTxData.receivedBy || ''}
                      onChange={(e) => setEditTxData({ ...editTxData, receivedBy: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                    />
                  </div>
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
                    onChange={(e) => {
                      const val = e.target.value;
                      const matchedMethod = safePaymentMethods.find(m => m.name === val);
                      if (matchedMethod && matchedMethod.defaultAccountId) {
                        setEditTxData({
                          ...editTxData,
                          paymentMethod: val,
                          accountId: matchedMethod.defaultAccountId
                        });
                      } else {
                        setEditTxData({ ...editTxData, paymentMethod: val });
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500 font-medium"
                  >
                    {safePaymentMethods && safePaymentMethods.length > 0 ? (
                      safePaymentMethods.map(m => (
                        <option key={m.id} value={m.name}>
                          {m.name} {!m.isActive ? '(Non-Aktif)' : ''}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Cash / Uang Kas">Cash / Tunai Fisik</option>
                        <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                        <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                        <option value="Kartu E-Toll">Kartu E-Toll Fleet</option>
                        <option value="Kupon SPBU">Kupon SPBU BBM</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* ALOKASI DEPOSIT UNTUK EDIT PENGELUARAN */}
              {editTxData.type === 'expense' && (
                <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-800 font-bold flex items-center gap-1.5 text-xs">
                      <Building className="w-4 h-4 text-indigo-600" />
                      Beban Sumber Dana / Rekanan Deposit
                    </label>
                    <span className="text-[10px] text-slate-500">Pilih jika dialokasikan ke deposit klien</span>
                  </div>
                  <select
                    value={editTxData.companyId || ''}
                    onChange={(e) => {
                      const cId = e.target.value;
                      const c = safeCompanyDeposits.find(comp => comp.id === cId);
                      setEditTxData({
                        ...editTxData,
                        companyId: cId,
                        companyName: c ? c.companyName : ''
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="">Kas Operasional Internal Fleet (Non-Deposit)</option>
                    {safeCompanyDeposits.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        🏢 Deposit: {comp.companyName} (Sisa Saldo: {formatRupiah(comp.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* UPLOAD BUKTI NOTA / KWITANSI (EDIT SEMUA TRANSAKSI) */}
              <div className={`p-3.5 rounded-xl border space-y-2 ${editTxData.type === 'expense' ? 'bg-amber-50/40 border-amber-200/80' : 'bg-slate-50/80 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold flex items-center gap-1.5 text-xs">
                    <UploadCloud className="w-4 h-4 text-blue-600" />
                    Bukti Fisik Nota / Kwitansi / Transfer{' '}
                    {editTxData.type === 'expense' ? (
                      <span className="text-rose-600 font-bold">*WAJIB</span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-medium">(Opsional)</span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleUseSampleReceipt(true)}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold underline"
                  >
                    📸 Gunakan Contoh Nota Resmi
                  </button>
                </div>

                {editFormReceiptError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span className="font-medium">{editFormReceiptError}</span>
                  </div>
                )}

                <input
                  type="file"
                  ref={editReceiptFileInputRef}
                  accept="image/*,application/pdf"
                  onChange={(e) => handleReceiptUpload(e, true)}
                  className="hidden"
                />

                {editTxData.receiptProofUrl ? (
                  <div className="flex items-center gap-3 p-2.5 bg-white border border-emerald-300 rounded-lg">
                    {editTxData.receiptProofUrl.startsWith('data:application/pdf') ? (
                      <div className="w-14 h-14 rounded bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                    ) : (
                      <img
                        src={editTxData.receiptProofUrl}
                        alt="Pratinjau Nota"
                        className="w-14 h-14 object-cover rounded border border-slate-200 shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Bukti Nota Tersedia
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => editReceiptFileInputRef.current?.click()}
                          className="text-[10px] text-blue-600 font-semibold hover:underline"
                        >
                          Ganti File
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => setEditTxData({ ...editTxData, receiptProofUrl: '' })}
                          className="text-[10px] text-rose-600 font-semibold hover:underline"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => editReceiptFileInputRef.current?.click()}
                    className={`p-4 border-2 border-dashed bg-white/80 hover:bg-white rounded-xl text-center cursor-pointer transition space-y-1 ${editTxData.type === 'expense' ? 'border-amber-300 hover:border-amber-400' : 'border-slate-300 hover:border-blue-400'}`}
                  >
                    <UploadCloud className={`w-6 h-6 mx-auto ${editTxData.type === 'expense' ? 'text-amber-500' : 'text-blue-500'}`} />
                    <p className="text-xs font-bold text-slate-700">
                      Klik untuk unggah / ganti foto nota atau PDF
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Format: Foto kamera HP, PNG, JPG, WebP, atau PDF (Maks. 5MB)
                    </p>
                  </div>
                )}
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
      {/* Modal 4: Audit & Inspeksi Bukti Nota Fisik */}
      {inspectedReceiptTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    Inspeksi &amp; Audit Akuntabilitas Nota Fisik
                    {inspectedReceiptTx.isReceiptVerified ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Terverifikasi Lunas
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Menunggu Audit
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ID Transaksi: <span className="font-mono text-slate-600 font-semibold">{inspectedReceiptTx.id}</span> • {formatDateIndo(inspectedReceiptTx.date)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectedReceiptTx(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content: Image Preview + Metadata Side Card */}
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5 overflow-y-auto">
              {/* Left Column: Zoomable Image Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" /> Dokumen Fisik Nota
                  </span>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setReceiptZoom(prev => Math.max(0.7, prev - 0.2))}
                      className="p-1 hover:bg-white rounded text-slate-600 transition"
                      title="Perkecil"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono px-1 font-bold text-slate-600">
                      {Math.round(receiptZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setReceiptZoom(prev => Math.min(2.5, prev + 0.2))}
                      className="p-1 hover:bg-white rounded text-slate-600 transition"
                      title="Perbesar"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setReceiptZoom(1)}
                      className="p-1 hover:bg-white rounded text-slate-600 transition text-[10px] font-medium"
                      title="Reset Ukuran"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="h-72 sm:h-96 w-full border border-slate-200 rounded-xl overflow-auto bg-slate-900/5 flex items-center justify-center p-2 relative group">
                  {inspectedReceiptTx.receiptProofUrl ? (() => {
                    const resolvedUrl = resolveDisplayReceiptUrl(inspectedReceiptTx.receiptProofUrl, {
                      title: 'BUKTI NOTA TRANSAKSI KAS',
                      subtitle: inspectedReceiptTx.category,
                      receiptNumber: inspectedReceiptTx.receiptNumber || inspectedReceiptTx.id,
                      date: formatDateIndo(inspectedReceiptTx.date),
                      amountText: formatRupiah(inspectedReceiptTx.amount),
                      nopol: inspectedReceiptTx.nopol,
                      driverName: inspectedReceiptTx.driverName
                    });
                    return resolvedUrl.startsWith('data:application/pdf') ? (
                      <iframe
                        src={resolvedUrl}
                        title="Pratinjau Nota PDF"
                        className="w-full h-full rounded border border-slate-200 bg-white"
                      />
                    ) : (
                      <img
                        src={resolvedUrl}
                        alt="Nota Fisik"
                        style={{ transform: `scale(${receiptZoom})`, transformOrigin: 'center center' }}
                        className="max-h-full max-w-full object-contain rounded shadow-xs transition-transform duration-150 bg-white"
                      />
                    );
                  })() : (
                    <div className="text-center p-6 text-slate-400">
                      <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-xs font-semibold">Bukti nota belum diunggah untuk transaksi ini.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Metadata & Audit Verifier */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Rincian Keuangan
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Nominal:</span>
                      <span className={`text-base font-bold font-mono ${inspectedReceiptTx.type === 'income' ? 'text-green-700' : 'text-rose-700'}`}>
                        {inspectedReceiptTx.type === 'income' ? '+' : '-'}{formatRupiah(inspectedReceiptTx.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Kategori:</span>
                      <span className="font-semibold text-slate-800">{inspectedReceiptTx.category}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Unit Armada:</span>
                      <span className="font-mono font-bold text-slate-800">{inspectedReceiptTx.nopol}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Supir / Kasir:</span>
                      <span className="text-slate-700 font-medium">{inspectedReceiptTx.driverName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Akun Buku Kas:</span>
                      <span className="text-slate-700 font-semibold">{inspectedReceiptTx.accountName || 'Kas Utama'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">No. Nota / Kwitansi:</span>
                      <span className="font-mono font-semibold text-slate-800">{inspectedReceiptTx.receiptNumber || '-'}</span>
                    </div>
                    {inspectedReceiptTx.companyName && (
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Beban Deposit:</span>
                        <span className="font-semibold text-indigo-700 flex items-center gap-1">
                          <Building className="w-3 h-3 text-indigo-500" />
                          {inspectedReceiptTx.companyName}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Deskripsi Pengeluaran
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {inspectedReceiptTx.description || 'Tidak ada catatan tambahan.'}
                    </p>
                  </div>

                  {/* Audit Verification Badge Box */}
                  <div className={`p-3.5 rounded-xl border ${inspectedReceiptTx.isReceiptVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                    <div className="flex items-center gap-2">
                      {inspectedReceiptTx.isReceiptVerified ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-bold">
                          {inspectedReceiptTx.isReceiptVerified ? 'Telah Diverifikasi Oleh Tim Audit' : 'Menunggu Verifikasi Audit'}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {inspectedReceiptTx.isReceiptVerified ? (
                            <>
                              Oleh: <span className="font-semibold">{inspectedReceiptTx.receiptVerifiedBy}</span> pada {inspectedReceiptTx.receiptVerifiedAt}
                            </>
                          ) : (
                            'Pengeluaran sah wajib diverifikasi setelah fisik nota diperiksa kesesuaiannya dengan rincian.'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleVerifyReceipt(inspectedReceiptTx)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs ${
                        inspectedReceiptTx.isReceiptVerified
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{inspectedReceiptTx.isReceiptVerified ? 'Batalkan Status Verifikasi' : 'Verifikasi Akuntabilitas Nota'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const target = inspectedReceiptTx;
                        setInspectedReceiptTx(null);
                        setPrintSlipTx(target);
                      }}
                      className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                      title="Cetak Slip / Kwitansi Resmi"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Kwitansi</span>
                    </button>

                    {inspectedReceiptTx.receiptProofUrl && (
                      <a
                        href={inspectedReceiptTx.receiptProofUrl}
                        download={`NOTA-${inspectedReceiptTx.id}-${inspectedReceiptTx.nopol}.png`}
                        className="py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                        title="Unduh Bukti Gambar Nota"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                        <span>Unduh</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Top-Up Saldo Deposit Perusahaan Rekanan */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Top-Up Saldo Deposit Perusahaan Rekanan
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Menambah saldo cadangan operasional klien perusahaan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTopUpModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTopUp} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Pilih Perusahaan Rekanan *</label>
                <select
                  value={topUpData.companyId}
                  onChange={(e) => setTopUpData({ ...topUpData, companyId: e.target.value })}
                  className="w-full bg-indigo-50/40 border border-indigo-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-hidden focus:border-indigo-500"
                >
                  {safeCompanyDeposits.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.companyCode}] {c.companyName} (Sisa: {formatRupiah(c.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold block">Nominal Top-Up Deposit (Rp) *</label>
                  <span className="text-[10px] text-indigo-600 font-mono font-bold">{formatRupiah(topUpData.amount)}</span>
                </div>
                <input
                  type="number"
                  required
                  min="100000"
                  step="50000"
                  value={topUpData.amount}
                  onChange={(e) => setTopUpData({ ...topUpData, amount: Number(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold text-sm focus:outline-hidden focus:border-indigo-500"
                />

                {/* Quick amount suggestion chips */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[10000000, 25000000, 50000000, 100000000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTopUpData({ ...topUpData, amount: preset })}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 font-mono font-medium transition"
                    >
                      +{formatRupiah(preset)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Rekening Kas/Bank Penerima *</label>
                  <select
                    value={topUpData.accountId}
                    onChange={(e) => setTopUpData({ ...topUpData, accountId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500 font-medium"
                  >
                    {safeAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.accountName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Metode Pembayaran</label>
                  <select
                    value={topUpData.paymentMethod}
                    onChange={(e) => setTopUpData({ ...topUpData, paymentMethod: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500 font-medium"
                  >
                    <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                    <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                    <option value="Bilyet Giro / Cek Perusahaan">Bilyet Giro / Cek Perusahaan</option>
                    <option value="Cash / Setoran Tunai">Setoran Tunai Fisik</option>
                  </select>
                </div>
              </div>

              {/* Upload Bukti Transfer */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-semibold block">Bukti Transfer / Nota Setoran</label>
                  <button
                    type="button"
                    onClick={() => setTopUpData({ ...topUpData, receiptProofUrl: SAMPLE_RECEIPT_IMAGE })}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 underline font-medium"
                  >
                    📸 Gunakan Contoh Bukti
                  </button>
                </div>
                <input
                  type="file"
                  ref={topUpFileInputRef}
                  accept="image/*,application/pdf"
                  onChange={handleTopUpReceiptUpload}
                  className="hidden"
                />
                {topUpData.receiptProofUrl ? (
                  <div className="flex items-center gap-2 p-2 bg-white border border-emerald-300 rounded-lg">
                    {topUpData.receiptProofUrl.startsWith('data:application/pdf') ? (
                      <div className="w-10 h-10 rounded bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    ) : (
                      <img src={topUpData.receiptProofUrl} alt="Bukti" className="w-10 h-10 object-cover rounded" />
                    )}
                    <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Bukti transfer terlampir
                    </span>
                    <button
                      type="button"
                      onClick={() => setTopUpData({ ...topUpData, receiptProofUrl: '' })}
                      className="ml-auto text-[10px] text-rose-600 hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => topUpFileInputRef.current?.click()}
                    className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 font-medium flex items-center justify-center gap-1"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Upload Bukti Transfer Bank</span>
                  </button>
                )}
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catatan / Rincian Top-Up</label>
                <input
                  type="text"
                  placeholder="Misal: Deposit kontrak angkutan batu bara triwulan IV"
                  value={topUpData.notes}
                  onChange={(e) => setTopUpData({ ...topUpData, notes: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTopUpModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Proses Top-Up Deposit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Tambah / Edit Perusahaan Rekanan Deposit */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {editingCompany ? 'Edit Profil Perusahaan Rekanan' : 'Daftar Perusahaan Rekanan Deposit Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Master rekanan klien dengan akun deposit operasional armada</p>
                </div>
              </div>
              <button
                onClick={() => setIsCompanyModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCompany} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-slate-700 font-semibold block mb-1">Nama Perusahaan Klien *</label>
                  <input
                    type="text"
                    required
                    placeholder="PT Sumber Logistik Abadi"
                    value={companyFormData.companyName || ''}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, companyName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-bold focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Kode *</label>
                  <input
                    type="text"
                    required
                    placeholder="PT-SLA"
                    value={companyFormData.companyCode || ''}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, companyCode: e.target.value.toUpperCase() })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-hidden focus:border-indigo-500 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nama PIC Rekanan</label>
                  <input
                    type="text"
                    placeholder="Ir. H. Sudirman"
                    value={companyFormData.picName || ''}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, picName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">No. Telepon / WA PIC</label>
                  <input
                    type="text"
                    placeholder="0812-3456-7890"
                    value={companyFormData.picPhone || ''}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, picPhone: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Email Korespondensi</label>
                  <input
                    type="email"
                    placeholder="logistik@perusahaan.co.id"
                    value={companyFormData.picEmail || ''}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, picEmail: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Batas Waspada Minimum Saldo (Rp)</label>
                  <input
                    type="number"
                    min="1000000"
                    step="500000"
                    value={companyFormData.minimumBalanceWarning}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, minimumBalanceWarning: Number(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {!editingCompany && (
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Saldo Deposit Awal (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000000"
                    value={companyFormData.initialDeposit}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, initialDeposit: Number(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Alamat Kantor / Lokasi Proyek</label>
                <input
                  type="text"
                  placeholder="Kawasan Industri MM2100 Cikarang..."
                  value={companyFormData.address || ''}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, address: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catatan Kontrak / Perjanjian</label>
                <textarea
                  rows={2}
                  placeholder="Ketentuan batas pengeluaran armada, tempo invoice, nomor PO induk..."
                  value={companyFormData.notes || ''}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, notes: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-xs"
                >
                  {editingCompany ? 'Simpan Perubahan' : 'Daftarkan Rekanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cetak Slip / Kwitansi Transaksi Keuangan */}
      {printSlipTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto printable-slip-modal">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto printable-slip-card">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 print:hidden print-hide">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-emerald-600" />
                <span>Pratinjau Cetak Slip / Kwitansi Transaksi</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    printElementById(
                      'printable-finance-slip',
                      `Kwitansi_${printSlipTx.receiptNumber || printSlipTx.id}`
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Printer</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadFinanceSlipPDF(printSlipTx)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintSlipTx(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <PrintOutPreviewStage
              documentLabel={`KWITANSI KEUANGAN: ${printSlipTx.receiptNumber || printSlipTx.id}`}
            >
              {/* Printable Voucher Body */}
              <div id="printable-finance-slip" className="p-6 bg-white space-y-4 font-mono text-slate-900 text-xs">
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 gap-3">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wide">
                      {printSlipTx.companyName || 'PT TRANSINDO LOGISTIK INDONESIA'}
                    </h3>
                    <p className="text-[10px] text-slate-600">
                      44S OPS_PRO • DIVISI KEUANGAN &amp; KONTROL OPERASIONAL ARMADA
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Voucher Resmi Pencatatan Kas &amp; Rekening Perusahaan
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={`border-2 px-2.5 py-1 font-black text-xs uppercase ${
                        printSlipTx.type === 'income'
                          ? 'border-emerald-800 text-emerald-800 bg-emerald-50'
                          : 'border-rose-800 text-rose-800 bg-rose-50'
                      }`}
                    >
                      {printSlipTx.type === 'income' ? 'KWITANSI KAS MASUK' : 'KWITANSI KAS KELUAR'}
                    </div>
                    <div className="text-[11px] font-bold mt-1">
                      NO: {printSlipTx.receiptNumber || printSlipTx.tripCode || printSlipTx.id}
                    </div>
                  </div>
                </div>

                {(() => {
                  const resolvedSlipDriver = resolveDriverFromData({
                    driverId: printSlipTx.driverId,
                    driverName: printSlipTx.driverName,
                    driverNip: printSlipTx.driverNip,
                    nopol: printSlipTx.nopol,
                    vehicleId: printSlipTx.vehicleId,
                    drivers: safeDrivers,
                    vehicles
                  });
                  const resolvedSlipCashier = resolveAdminCashierByRole(
                    printSlipTx.handoverBy,
                    userRole
                  );

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-b border-slate-200 pb-3">
                        <div>
                          <span className="text-slate-500">Tanggal:</span>{' '}
                          <span className="font-bold">{formatDateIndo(printSlipTx.date)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">ID Transaksi:</span>{' '}
                          <span className="font-bold">{printSlipTx.id}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">
                            {printSlipTx.type === 'income' ? 'Diterima Dari:' : 'Dibayar Kepada:'}
                          </span>{' '}
                          <span className="font-bold">
                            {printSlipTx.customerOrPayer || resolvedSlipDriver.labelWithParen || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Unit / Nopol:</span>{' '}
                          <span className="font-bold">{printSlipTx.nopol || 'OPERASIONAL POOL'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Kategori:</span>{' '}
                          <span className="font-semibold">{printSlipTx.category}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Kode Trip / Ref:</span>{' '}
                          <span className="font-semibold">{printSlipTx.tripCode || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Diserahkan Oleh:</span>{' '}
                          <span className="font-semibold">{resolvedSlipCashier}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Diterima Oleh:</span>{' '}
                          <span className="font-semibold">{printSlipTx.receivedBy || resolvedSlipDriver.name || '-'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500">Rekening &amp; Metode:</span>{' '}
                          <span className="font-bold">
                            {printSlipTx.accountName || 'Kas Utama'} ({printSlipTx.paymentMethod})
                          </span>
                        </div>
                        {printSlipTx.companyName && (
                          <div className="col-span-2">
                            <span className="text-slate-500">Perusahaan / Beban Deposit:</span>{' '}
                            <span className="font-bold text-indigo-800">{printSlipTx.companyName}</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">
                          Untuk Pembayaran / Keterangan:
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed font-sans">
                          {printSlipTx.description || '-'}
                        </p>
                      </div>

                      <div
                        className={`p-3.5 rounded-xl border-2 space-y-1.5 ${
                          printSlipTx.type === 'income'
                            ? 'bg-emerald-50/60 border-emerald-700'
                            : 'bg-rose-50/50 border-rose-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold uppercase text-slate-700">
                            JUMLAH NOMINAL:
                          </span>
                          <span
                            className={`text-lg font-black ${
                              printSlipTx.type === 'income' ? 'text-emerald-800' : 'text-rose-800'
                            }`}
                          >
                            {printSlipTx.type === 'income' ? '+' : '-'} {formatRupiah(printSlipTx.amount)}
                          </span>
                        </div>
                        <div className="text-[11px] italic text-slate-700 border-t border-slate-300/70 pt-1.5">
                          Terbilang: <span className="font-bold"># {terbilangRupiah(printSlipTx.amount)} #</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] border-b border-slate-200 pb-2">
                        <span>
                          Status Dokumen:{' '}
                          <strong className="uppercase">
                            {printSlipTx.isReceiptVerified
                              ? `LULUS AUDIT (${printSlipTx.receiptVerifiedBy || 'Tim Audit'})`
                              : printSlipTx.status}
                          </strong>
                        </span>
                        <span>Nota Fisik: {printSlipTx.receiptProofUrl ? 'TERLAMPIR' : 'BELUM DILAMPIRKAN'}</span>
                      </div>

                      <div className="grid grid-cols-2 pt-3 text-center text-xs">
                        <div>
                          <p className="text-slate-500">
                            {printSlipTx.type === 'income' ? 'Penyetor / Pihak Terkait,' : 'Diterima Oleh (Karyawan Driver),'}
                          </p>
                          <div className="h-14"></div>
                          <p className="font-bold underline">
                            {printSlipTx.customerOrPayer || resolvedSlipDriver.labelWithParen || '(.........................)'}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Diserahkan Oleh (Kasir Pool),</p>
                          <div className="h-14"></div>
                          <p className="font-bold underline">{resolvedSlipCashier}</p>
                        </div>
                      </div>
                    </>
                  );
                })()}

                <div className="text-[9px] text-center text-slate-400 pt-2 border-t border-slate-100">
                  Dicetak melalui 44S Ops_pro • Slip Kwitansi Sah Keuangan Armada
                </div>
              </div>
            </PrintOutPreviewStage>
          </div>
        </div>
      )}
    </div>
  );
};
