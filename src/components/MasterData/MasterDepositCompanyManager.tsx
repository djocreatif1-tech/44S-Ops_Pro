import React, { useState, useRef } from 'react';
import {
  Building,
  Plus,
  Search,
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
  UploadCloud,
  History,
  Eye,
  Building2,
  ShieldCheck,
  Clock,
  SendHorizontal,
  CheckSquare,
  XCircle,
  FileCheck2,
  DollarSign,
  TrendingUp,
  BarChart3,
  Printer,
  Download
} from 'lucide-react';
import {
  CompanyDeposit,
  DepositTopUpRecord,
  FinancialAccount,
  UserRole,
  CompanyDepositRequest,
  DepositRequestStatus,
  OperationalFinance
} from '../../types';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import {
  terbilangRupiah,
  printElementById,
  downloadDepositTopUpSlipPDF
} from '../../utils/slipPrint';
import { TablePagination } from '../Common/TablePagination';
import { ReceiptUploadField } from '../Common/ReceiptUploadField';
import { PrintOutPreviewStage } from '../Common/PrintPreviewControls';
import { confirmDelete } from '../../utils/dialogService';
import { SAMPLE_RECEIPT_IMAGE } from '../../data/initialData';
import { CompanyDepositTrendChart } from './CompanyDepositTrendChart';

interface MasterDepositCompanyManagerProps {
  companies: CompanyDeposit[];
  accounts: FinancialAccount[];
  topUpHistory?: DepositTopUpRecord[];
  depositRequests?: CompanyDepositRequest[];
  finances?: OperationalFinance[];
  userRole?: UserRole;
  onAddCompany: (company: CompanyDeposit) => void;
  onUpdateCompany: (company: CompanyDeposit) => void;
  onDeleteCompany: (id: string) => void;
  onTopUpDeposit?: (record: DepositTopUpRecord) => void;
  onAddDepositRequest?: (req: CompanyDepositRequest) => void;
  onUpdateDepositRequest?: (req: CompanyDepositRequest) => void;
  onDeleteDepositRequest?: (id: string) => void;
  onApproveDepositRequest?: (id: string, approverName: string) => void;
  onCompleteDepositRequest?: (req: CompanyDepositRequest, transferProofNumber: string, paymentMethod: string, receiptProofUrl?: string) => void;
  onRejectDepositRequest?: (id: string, reason: string) => void;
  onOpenRoleMatrix?: () => void;
}

export const MasterDepositCompanyManager: React.FC<MasterDepositCompanyManagerProps> = ({
  companies = [],
  accounts = [],
  topUpHistory = [],
  depositRequests = [],
  finances = [],
  userRole = 'owner',
  onAddCompany,
  onUpdateCompany,
  onDeleteCompany,
  onTopUpDeposit,
  onAddDepositRequest,
  onUpdateDepositRequest,
  onDeleteDepositRequest,
  onApproveDepositRequest,
  onCompleteDepositRequest,
  onRejectDepositRequest,
  onOpenRoleMatrix
}) => {
  const safeCompanies = Array.isArray(companies) ? companies : [];
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safeTopUps = Array.isArray(topUpHistory) ? topUpHistory : [];
  const safeDepositRequests = Array.isArray(depositRequests) ? depositRequests : [];
  const safeFinances = Array.isArray(finances) ? finances : [];

  const [activeViewTab, setActiveViewTab] = useState<'companies' | 'topup_history' | 'requests' | 'chart'>('companies');
  const [selectedChartCompanyId, setSelectedChartCompanyId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [requestFilterStatus, setRequestFilterStatus] = useState<string>('all');
  const [requestCompanyFilter, setRequestCompanyFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyDeposit | null>(null);

  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [selectedCompanyForTopUp, setSelectedCompanyForTopUp] = useState<CompanyDeposit | null>(null);
  const [printTopUp, setPrintTopUp] = useState<DepositTopUpRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State: Company
  const [companyFormData, setCompanyFormData] = useState<Partial<CompanyDeposit>>({
    companyName: '',
    companyCode: '',
    picName: '',
    picPhone: '',
    picEmail: '',
    address: '',
    initialDeposit: 25000000,
    minimumBalanceWarning: 10000000,
    status: 'active',
    notes: ''
  });

  // Form State: Top-Up
  const [topUpFormData, setTopUpFormData] = useState({
    companyId: '',
    date: new Date().toISOString().slice(0, 10),
    amount: 15000000,
    transferProofNumber: 'TRF-' + Date.now().toString().slice(-5),
    bankAccountId: safeAccounts[0]?.id || '',
    paymentMethod: 'Transfer Bank BCA',
    notes: 'Top-up deposit operasional proyek bulanan',
    receiptProofUrl: SAMPLE_RECEIPT_IMAGE
  });

  // Deposit Request Form State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<CompanyDepositRequest | null>(null);
  const [requestFormData, setRequestFormData] = useState<Partial<CompanyDepositRequest>>({
    companyId: safeCompanies[0]?.id || '',
    companyName: safeCompanies[0]?.companyName || '',
    companyCode: safeCompanies[0]?.companyCode || '',
    requestDate: new Date().toISOString().slice(0, 10),
    amount: 25000000,
    purpose: 'Penambahan Kuota Deposit Operasional Proyek',
    targetAccountId: safeAccounts[0]?.id || '',
    applicantName: '',
    applicantPhone: '',
    applicantRole: 'PIC Logistik Rekanan',
    urgencyLevel: 'normal',
    notes: '',
    attachmentUrl: SAMPLE_RECEIPT_IMAGE
  });

  // Realization Modal State (Complete Request & Top-Up)
  const [isRealizeModalOpen, setIsRealizeModalOpen] = useState(false);
  const [selectedRequestForRealization, setSelectedRequestForRealization] = useState<CompanyDepositRequest | null>(null);
  const [realizeFormData, setRealizeFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    transferProofNumber: 'TRF-DEP-' + Date.now().toString().slice(-5),
    bankAccountId: safeAccounts[0]?.id || '',
    paymentMethod: 'Transfer Bank BCA',
    receiptProofUrl: SAMPLE_RECEIPT_IMAGE,
    notes: 'Realisasi penambahan saldo dari pengajuan deposit yang telah disetujui'
  });

  // Rejection Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedRequestForRejection, setSelectedRequestForRejection] = useState<CompanyDepositRequest | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  // KPI Calculations
  const totalDepositAvailable = safeCompanies.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
  const totalTopUpAll = safeCompanies.reduce((sum, c) => sum + (c.totalTopUp || 0), 0);
  const totalUsedAll = safeCompanies.reduce((sum, c) => sum + (c.totalUsed || 0), 0);
  const criticalCompaniesCount = safeCompanies.filter(
    (c) => (c.currentBalance || 0) <= (c.minimumBalanceWarning || 0)
  ).length;

  // Requests KPI Calculations
  const totalRequestAmountAll = safeDepositRequests.reduce((sum, r) => sum + (r.amount || 0), 0);
  const pendingRequests = safeDepositRequests.filter((r) => r.status === 'pending');
  const pendingRequestsCount = pendingRequests.length;
  const pendingRequestsAmount = pendingRequests.reduce((sum, r) => sum + (r.amount || 0), 0);
  const completedRequests = safeDepositRequests.filter((r) => r.status === 'completed');
  const completedRequestsAmount = completedRequests.reduce((sum, r) => sum + (r.amount || 0), 0);
  const approvedRequests = safeDepositRequests.filter((r) => r.status === 'approved');
  const rejectedRequests = safeDepositRequests.filter((r) => r.status === 'rejected');

  const filteredCompanies = safeCompanies.filter((c) => {
    if (!c) return false;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.companyName.toLowerCase().includes(q) ||
      c.companyCode.toLowerCase().includes(q) ||
      c.picName.toLowerCase().includes(q) ||
      (c.address && c.address.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'warning' && (c.currentBalance || 0) <= (c.minimumBalanceWarning || 0)) ||
      (statusFilter === 'active' && c.status === 'active') ||
      (statusFilter === 'inactive' && c.status === 'inactive');

    return matchesSearch && matchesStatus;
  });

  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Filtered Deposit Requests
  const filteredDepositRequests = safeDepositRequests.filter((req) => {
    if (!req) return false;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      req.requestNumber.toLowerCase().includes(q) ||
      req.companyName.toLowerCase().includes(q) ||
      req.companyCode.toLowerCase().includes(q) ||
      req.purpose.toLowerCase().includes(q) ||
      req.applicantName.toLowerCase().includes(q) ||
      (req.notes && req.notes.toLowerCase().includes(q));

    const matchesStatus =
      requestFilterStatus === 'all' || req.status === requestFilterStatus;

    const matchesCompany =
      requestCompanyFilter === 'all' || req.companyId === requestCompanyFilter;

    return matchesSearch && matchesStatus && matchesCompany;
  });

  const paginatedRequests = filteredDepositRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAddCompany = () => {
    setEditingCompany(null);
    setCompanyFormData({
      companyName: '',
      companyCode: 'PT-' + Date.now().toString().slice(-4),
      picName: '',
      picPhone: '',
      picEmail: '',
      address: '',
      initialDeposit: 25000000,
      minimumBalanceWarning: 10000000,
      status: 'active',
      notes: ''
    });
    setIsCompanyModalOpen(true);
  };

  const handleOpenEditCompany = (comp: CompanyDeposit) => {
    setEditingCompany(comp);
    setCompanyFormData({ ...comp });
    setIsCompanyModalOpen(true);
  };

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyFormData.companyName?.trim()) return;

    if (editingCompany) {
      onUpdateCompany({
        ...editingCompany,
        ...companyFormData,
        companyName: companyFormData.companyName.trim(),
        companyCode: companyFormData.companyCode || editingCompany.companyCode,
        picName: companyFormData.picName || '',
        picPhone: companyFormData.picPhone || '',
        picEmail: companyFormData.picEmail || '',
        address: companyFormData.address || '',
        minimumBalanceWarning: Number(companyFormData.minimumBalanceWarning) || 0,
        notes: companyFormData.notes || ''
      });
    } else {
      const initDeposit = Number(companyFormData.initialDeposit) || 0;
      const newComp: CompanyDeposit = {
        id: 'DEP-' + Date.now().toString().slice(-5),
        companyName: companyFormData.companyName.trim(),
        companyCode: companyFormData.companyCode || 'DEP-' + Date.now().toString().slice(-4),
        picName: companyFormData.picName || '',
        picPhone: companyFormData.picPhone || '',
        picEmail: companyFormData.picEmail || '',
        address: companyFormData.address || '',
        initialDeposit: initDeposit,
        currentBalance: initDeposit,
        totalTopUp: initDeposit,
        totalUsed: 0,
        minimumBalanceWarning: Number(companyFormData.minimumBalanceWarning) || 10000000,
        status: 'active',
        notes: companyFormData.notes || '',
        lastTopUpDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString().slice(0, 10)
      };
      onAddCompany(newComp);
    }

    setIsCompanyModalOpen(false);
  };

  const handleOpenTopUp = (comp?: CompanyDeposit) => {
    const targetComp = comp || safeCompanies[0];
    if (!targetComp) return;
    setSelectedCompanyForTopUp(targetComp);
    setTopUpFormData({
      companyId: targetComp.id,
      date: new Date().toISOString().slice(0, 10),
      amount: 15000000,
      transferProofNumber: 'TRF-BCA-' + Date.now().toString().slice(-5),
      bankAccountId: safeAccounts[0]?.id || '',
      paymentMethod: 'Transfer Bank BCA',
      notes: `Top-up penambahan dana deposit operasional ${targetComp.companyName}`,
      receiptProofUrl: SAMPLE_RECEIPT_IMAGE
    });
    setIsTopUpModalOpen(true);
  };

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyForTopUp || topUpFormData.amount <= 0) return;

    const acc = safeAccounts.find((a) => a.id === topUpFormData.bankAccountId) || safeAccounts[0];

    const record: DepositTopUpRecord = {
      id: 'TOP-' + Date.now().toString().slice(-6),
      companyId: selectedCompanyForTopUp.id,
      companyName: selectedCompanyForTopUp.companyName,
      date: topUpFormData.date,
      amount: Number(topUpFormData.amount),
      transferProofNumber: topUpFormData.transferProofNumber || 'TRF-' + Date.now().toString().slice(-4),
      bankAccountId: acc?.id || '',
      bankAccountName: acc?.accountName || 'Bank BCA',
      paymentMethod: topUpFormData.paymentMethod,
      receiptProofUrl: topUpFormData.receiptProofUrl,
      notes: topUpFormData.notes,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    if (onTopUpDeposit) {
      onTopUpDeposit(record);
    } else {
      // Default fallback: update company directly
      onUpdateCompany({
        ...selectedCompanyForTopUp,
        currentBalance: (selectedCompanyForTopUp.currentBalance || 0) + Number(topUpFormData.amount),
        totalTopUp: (selectedCompanyForTopUp.totalTopUp || 0) + Number(topUpFormData.amount),
        lastTopUpDate: topUpFormData.date
      });
    }

    setIsTopUpModalOpen(false);
  };

  // --- Handlers: Deposit Request ---
  const handleOpenAddRequest = (comp?: CompanyDeposit) => {
    const targetComp = comp || safeCompanies[0];
    setEditingRequest(null);
    setRequestFormData({
      companyId: targetComp?.id || '',
      companyName: targetComp?.companyName || '',
      companyCode: targetComp?.companyCode || '',
      requestDate: new Date().toISOString().slice(0, 10),
      amount: 25000000,
      purpose: 'Penambahan Kuota Deposit Operasional Proyek',
      targetAccountId: safeAccounts[0]?.id || '',
      targetAccountName: safeAccounts[0]?.accountName || '',
      applicantName: targetComp?.picName || '',
      applicantPhone: targetComp?.picPhone || '',
      applicantRole: 'PIC Logistik Rekanan',
      urgencyLevel: 'normal',
      notes: '',
      attachmentUrl: SAMPLE_RECEIPT_IMAGE
    });
    setIsRequestModalOpen(true);
  };

  const handleOpenEditRequest = (req: CompanyDepositRequest) => {
    setEditingRequest(req);
    setRequestFormData({ ...req });
    setIsRequestModalOpen(true);
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestFormData.companyId || !requestFormData.amount || Number(requestFormData.amount) <= 0) return;

    const comp = safeCompanies.find((c) => c.id === requestFormData.companyId);
    const acc = safeAccounts.find((a) => a.id === requestFormData.targetAccountId) || safeAccounts[0];

    if (editingRequest) {
      const updated: CompanyDepositRequest = {
        ...editingRequest,
        ...requestFormData,
        companyName: comp?.companyName || editingRequest.companyName,
        companyCode: comp?.companyCode || editingRequest.companyCode,
        amount: Number(requestFormData.amount),
        targetAccountId: acc?.id || '',
        targetAccountName: acc?.accountName || '',
        applicantName: requestFormData.applicantName || comp?.picName || 'PIC Rekanan'
      } as CompanyDepositRequest;

      if (onUpdateDepositRequest) {
        onUpdateDepositRequest(updated);
      }
    } else {
      const pad = (n: number) => n.toString().padStart(3, '0');
      const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, '').slice(0, 6);
      const reqNumber = `REQ-DEP-${nowStr}-${pad(safeDepositRequests.length + 1)}`;

      const newReq: CompanyDepositRequest = {
        id: 'REQ-DEP-' + Date.now().toString().slice(-6),
        requestNumber: reqNumber,
        companyId: comp?.id || '',
        companyName: comp?.companyName || 'Perusahaan Rekanan',
        companyCode: comp?.companyCode || 'DEP',
        requestDate: requestFormData.requestDate || new Date().toISOString().slice(0, 10),
        amount: Number(requestFormData.amount),
        purpose: requestFormData.purpose || 'Penambahan Kuota Deposit Operasional Proyek',
        targetAccountId: acc?.id || '',
        targetAccountName: acc?.accountName || 'Rekening Operasional Fleet',
        applicantName: requestFormData.applicantName || comp?.picName || 'PIC Rekanan',
        applicantPhone: requestFormData.applicantPhone || comp?.picPhone || '',
        applicantRole: requestFormData.applicantRole || 'PIC Logistik Rekanan',
        urgencyLevel: requestFormData.urgencyLevel || 'normal',
        status: 'pending',
        notes: requestFormData.notes || '',
        attachmentUrl: requestFormData.attachmentUrl || SAMPLE_RECEIPT_IMAGE,
        createdAt: new Date().toISOString().slice(0, 10)
      };

      if (onAddDepositRequest) {
        onAddDepositRequest(newReq);
      }
    }

    setIsRequestModalOpen(false);
  };

  const handleApproveRequest = (req: CompanyDepositRequest) => {
    if (onApproveDepositRequest) {
      onApproveDepositRequest(req.id, 'Direksi Operasional (Owner)');
    } else if (onUpdateDepositRequest) {
      onUpdateDepositRequest({
        ...req,
        status: 'approved',
        approvedBy: 'Direksi Operasional (Owner)',
        approvedAt: new Date().toLocaleString('id-ID')
      });
    }
  };

  const handleOpenRealize = (req: CompanyDepositRequest) => {
    setSelectedRequestForRealization(req);
    const acc = safeAccounts.find((a) => a.id === req.targetAccountId) || safeAccounts[0];
    setRealizeFormData({
      date: new Date().toISOString().slice(0, 10),
      transferProofNumber: 'TRF-' + Date.now().toString().slice(-5),
      bankAccountId: acc?.id || safeAccounts[0]?.id || '',
      paymentMethod: 'Transfer Bank BCA',
      receiptProofUrl: req.attachmentUrl || SAMPLE_RECEIPT_IMAGE,
      notes: `Realisasi pengajuan ${req.requestNumber} - ${req.purpose}`
    });
    setIsRealizeModalOpen(true);
  };

  const handleRealizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForRealization) return;

    if (onCompleteDepositRequest) {
      onCompleteDepositRequest(
        selectedRequestForRealization,
        realizeFormData.transferProofNumber,
        realizeFormData.paymentMethod,
        realizeFormData.receiptProofUrl
      );
    } else {
      // Fallback: manually update company & request
      const comp = safeCompanies.find((c) => c.id === selectedRequestForRealization.companyId);
      if (comp) {
        onUpdateCompany({
          ...comp,
          currentBalance: (comp.currentBalance || 0) + selectedRequestForRealization.amount,
          totalTopUp: (comp.totalTopUp || 0) + selectedRequestForRealization.amount,
          lastTopUpDate: realizeFormData.date
        });
      }
      if (onUpdateDepositRequest) {
        onUpdateDepositRequest({
          ...selectedRequestForRealization,
          status: 'completed',
          completedAt: new Date().toLocaleString('id-ID')
        });
      }
    }

    setIsRealizeModalOpen(false);
  };

  const handleOpenReject = (req: CompanyDepositRequest) => {
    setSelectedRequestForRejection(req);
    setRejectionReasonText('');
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForRejection) return;

    if (onRejectDepositRequest) {
      onRejectDepositRequest(
        selectedRequestForRejection.id,
        rejectionReasonText.trim() || 'Pengajuan belum memenuhi syarat kelengkapan administrasi.'
      );
    } else if (onUpdateDepositRequest) {
      onUpdateDepositRequest({
        ...selectedRequestForRejection,
        status: 'rejected',
        rejectionReason: rejectionReasonText.trim() || 'Pengajuan ditolak oleh manajemen.'
      });
    }

    setIsRejectModalOpen(false);
  };

  const handleDeleteRequest = async (id: string) => {
    if (await confirmDelete(`Pengajuan Deposit (${id})`, 'Apakah Anda Yakin Ingin Menghapus Data?', 'Catatan pengajuan deposit ini akan dihapus secara permanen.')) {
      if (onDeleteDepositRequest) {
        onDeleteDepositRequest(id);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTopUpFormData((prev) => ({ ...prev, receiptProofUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <p className="text-[11px] text-slate-500 font-medium">Total Saldo Deposit Tersedia</p>
          <h3 className="text-xl font-bold text-indigo-700 font-mono mt-1">{formatRupiah(totalDepositAvailable)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Akumulasi saldo siap pakai seluruh klien</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <p className="text-[11px] text-slate-500 font-medium">Total Dana Top-Up Masuk</p>
          <h3 className="text-xl font-bold text-emerald-700 font-mono mt-1">{formatRupiah(totalTopUpAll)}</h3>
          <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-0.5">
            <ArrowDownRight className="w-3 h-3" /> Dana ditransfer oleh perusahaan rekanan
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <p className="text-[11px] text-slate-500 font-medium">Total Terpakai Biaya Armada</p>
          <h3 className="text-xl font-bold text-rose-700 font-mono mt-1">{formatRupiah(totalUsedAll)}</h3>
          <p className="text-[10px] text-rose-600 mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> Dipotong untuk solar, tol &amp; sangu jalan
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <p className="text-[11px] text-slate-500 font-medium">Status Saldo Rekanan</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl font-bold text-slate-800">{safeCompanies.length} Klien</span>
            {criticalCompaniesCount > 0 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                {criticalCompaniesCount} Waspada
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Berdasarkan limit saldo minimum</p>
        </div>
      </div>

      {/* Navigation tabs & action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveViewTab('companies')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeViewTab === 'companies'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Master Perusahaan Rekanan ({safeCompanies.length})</span>
          </button>
          <button
            onClick={() => setActiveViewTab('requests')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeViewTab === 'requests'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <SendHorizontal className="w-3.5 h-3.5" />
            <span>Pengajuan Deposit ({safeDepositRequests.length})</span>
            {pendingRequestsCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                activeViewTab === 'requests' ? 'bg-amber-400 text-slate-900' : 'bg-amber-500 text-white'
              }`}>
                {pendingRequestsCount} Pending
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveViewTab('topup_history')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeViewTab === 'topup_history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Penambahan ({safeTopUps.length})</span>
          </button>
          <button
            onClick={() => setActiveViewTab('chart')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeViewTab === 'chart'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Grafik &amp; Tren Saldo</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenAddRequest()}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
          >
            <SendHorizontal className="w-3.5 h-3.5" />
            <span>+ Ajukan Deposit</span>
          </button>
          <button
            onClick={() => handleOpenTopUp()}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>+ Catat Top-Up Masuk</span>
          </button>
          <button
            onClick={handleOpenAddCompany}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Perusahaan Baru</span>
          </button>
        </div>
      </div>

      {activeViewTab === 'companies' && (
        <>
          {/* Quick Banner: Visualisasi Tren Recharts */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs border border-indigo-900/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Visualisasi Data Tren Saldo Deposit &amp; Komparasi Bulanan</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    Recharts
                  </span>
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Analisis pergerakan saldo deposit, kurva saldo berjalan, serta komparasi top-up masuk vs penggunaan saldo secara bulanan.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedChartCompanyId('ALL');
                setActiveViewTab('chart');
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shrink-0"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Buka Grafik Tren</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama perusahaan rekanan, kode, PIC, atau alamat..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-indigo-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-48 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="all">Semua Kondisi Saldo</option>
              <option value="warning">Saldo Waspada / Kritis</option>
              <option value="active">Status Aktif</option>
              <option value="inactive">Non-Aktif</option>
            </select>
          </div>

          {/* Table View */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Kode &amp; Nama Perusahaan</th>
                    <th className="py-3 px-4">Kontak PIC</th>
                    <th className="py-3 px-4">Deposit Awal</th>
                    <th className="py-3 px-4">Total Top-Up</th>
                    <th className="py-3 px-4">Terpakai</th>
                    <th className="py-3 px-4">Sisa Saldo Deposit</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCompanies.map((comp) => {
                    const isLow = (comp.currentBalance || 0) <= (comp.minimumBalanceWarning || 0);

                    return (
                      <tr key={comp.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60 inline-block mb-1">
                            {comp.companyCode}
                          </span>
                          <p className="font-bold text-slate-800 text-xs">{comp.companyName}</p>
                          {comp.address && (
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{comp.address}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-700">{comp.picName || '-'}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{comp.picPhone || '-'}</p>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{formatRupiah(comp.initialDeposit)}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                          +{formatRupiah(comp.totalTopUp)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-rose-700">-{formatRupiah(comp.totalUsed)}</td>
                        <td className="py-3 px-4">
                          <p
                            className={`text-sm font-bold font-mono ${
                              isLow ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded w-fit' : 'text-indigo-700'
                            }`}
                          >
                            {formatRupiah(comp.currentBalance)}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            Batas: {formatRupiah(comp.minimumBalanceWarning)}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isLow ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center gap-1 justify-center">
                              <AlertCircle className="w-2.5 h-2.5" /> Kritis
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1 justify-center">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Aman
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedChartCompanyId(comp.id);
                                setActiveViewTab('chart');
                              }}
                              className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Lihat Grafik Tren & Histori Saldo"
                            >
                              <TrendingUp className="w-3 h-3" /> Tren
                            </button>
                            <button
                              onClick={() => handleOpenAddRequest(comp)}
                              className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[10px] font-bold transition flex items-center gap-1"
                              title="Ajukan Penambahan Deposit untuk Rekanan Ini"
                            >
                              <SendHorizontal className="w-3 h-3" /> Ajukan
                            </button>
                            <button
                              onClick={() => handleOpenTopUp(comp)}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[10px] font-bold transition flex items-center gap-1"
                              title="Catat Top-Up Deposit"
                            >
                              <Plus className="w-3 h-3" /> Top-Up
                            </button>
                            <button
                              onClick={() => handleOpenEditCompany(comp)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Edit Profil Rekanan"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={async () => {
                                if (await confirmDelete(`Master Perusahaan "${comp.companyName}"`, 'Apakah Anda Yakin Ingin Menghapus Data?', `Kode: ${comp.companyCode} • Saldo: ${formatRupiah(comp.currentBalance)}`)) {
                                  onDeleteCompany(comp.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Rekanan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredCompanies.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada perusahaan rekanan yang sesuai
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={currentPage}
              totalItems={filteredCompanies.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[8, 16, 24]}
              itemLabel="perusahaan rekanan"
            />
          </div>
        </>
      )}

      {/* Riwayat Penambahan Deposit Masuk */}
      {activeViewTab === 'topup_history' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-xs">Riwayat Mutasi Penambahan Deposit (Top-Up Masuk)</h3>
              <p className="text-[10px] text-slate-400">Daftar transaksi transfer dana masuk dari seluruh klien logistik</p>
            </div>
            <button
              onClick={() => handleOpenTopUp()}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Tambah Bukti Transfer
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tanggal &amp; No. Bukti</th>
                  <th className="py-3 px-4">Perusahaan Pemberi</th>
                  <th className="py-3 px-4">Nominal Masuk</th>
                  <th className="py-3 px-4">Rekening Bank Tujuan</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Catatan Peruntukan</th>
                  <th className="py-3 px-4 text-center">Bukti Transfer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safeTopUps.map((top) => (
                  <tr key={top.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{formatDateIndo(top.date)}</p>
                      <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1 rounded">
                        {top.transferProofNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{top.companyName}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 text-sm">
                      +{formatRupiah(top.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-700">{top.bankAccountName}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                        {top.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-[11px] text-slate-600">{top.notes || '-'}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPrintTopUp(top)}
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold hover:bg-emerald-100 transition inline-flex items-center gap-1"
                          title="Cetak Kwitansi Penerimaan Deposit"
                        >
                          <Printer className="w-2.5 h-2.5" /> Cetak
                        </button>
                        {top.receiptProofUrl && (
                          <a
                            href={top.receiptProofUrl}
                            download={`Bukti_TopUp_${top.transferProofNumber || top.id}.png`}
                            className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200/70 rounded text-[10px] font-bold hover:bg-blue-100 transition inline-flex items-center gap-1"
                            title="Unduh Bukti Transfer"
                          >
                            <Eye className="w-2.5 h-2.5" /> Slip
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {safeTopUps.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Belum ada riwayat top-up deposit yang tercatat
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 3: Pengajuan Deposit Masing-Masing Perusahaan */}
      {activeViewTab === 'requests' && (
        <div className="space-y-4">
          {/* Mini KPI Cards for Requests */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-2xs">
              <p className="text-[11px] text-slate-500 font-medium">Total Nominal Diajukan</p>
              <h4 className="text-lg font-bold text-slate-800 font-mono mt-0.5">{formatRupiah(totalRequestAmountAll)}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">{safeDepositRequests.length} Total Berkas Pengajuan</p>
            </div>

            <div className="bg-white border border-amber-200/80 bg-amber-50/20 p-3.5 rounded-2xl shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-amber-700 font-medium">Menunggu Persetujuan</p>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  {pendingRequestsCount} Pending
                </span>
              </div>
              <h4 className="text-lg font-bold text-amber-700 font-mono mt-0.5">{formatRupiah(pendingRequestsAmount)}</h4>
              <p className="text-[10px] text-amber-600/80 mt-0.5">Memerlukan review &amp; persetujuan</p>
            </div>

            <div className="bg-white border border-blue-200/80 bg-blue-50/20 p-3.5 rounded-2xl shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-blue-700 font-medium">Disetujui (Siap Realisasi)</p>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                  {approvedRequests.length} Approved
                </span>
              </div>
              <h4 className="text-lg font-bold text-blue-700 font-mono mt-0.5">
                {formatRupiah(approvedRequests.reduce((s, r) => s + (r.amount || 0), 0))}
              </h4>
              <p className="text-[10px] text-blue-600/80 mt-0.5">Menunggu mutasi &amp; top-up saldo</p>
            </div>

            <div className="bg-white border border-emerald-200/80 bg-emerald-50/20 p-3.5 rounded-2xl shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-emerald-700 font-medium">Terealisasi (Masuk Saldo)</p>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {completedRequests.length} Selesai
                </span>
              </div>
              <h4 className="text-lg font-bold text-emerald-700 font-mono mt-0.5">{formatRupiah(completedRequestsAmount)}</h4>
              <p className="text-[10px] text-emerald-600/80 mt-0.5">Saldo deposit resmi bertambah</p>
            </div>
          </div>

          {/* Filter Bar for Requests */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari no. pengajuan, nama klien, pemohon, atau peruntukan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={requestCompanyFilter}
                onChange={(e) => setRequestCompanyFilter(e.target.value)}
                className="w-full sm:w-auto px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-hidden"
              >
                <option value="all">Semua Perusahaan Rekanan</option>
                {safeCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>

              <select
                value={requestFilterStatus}
                onChange={(e) => setRequestFilterStatus(e.target.value)}
                className="w-full sm:w-auto px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-hidden"
              >
                <option value="all">Semua Status Pengajuan</option>
                <option value="pending">Menunggu Persetujuan</option>
                <option value="approved">Disetujui (Siap Realisasi)</option>
                <option value="completed">Terealisasi (Masuk Saldo)</option>
                <option value="rejected">Ditolak</option>
              </select>

              {(searchQuery || requestFilterStatus !== 'all' || requestCompanyFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setRequestFilterStatus('all');
                    setRequestCompanyFilter('all');
                  }}
                  className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition shrink-0"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Table List of Requests */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <SendHorizontal className="w-3.5 h-3.5 text-blue-600" />
                  <span>Daftar Pengajuan Deposit Perusahaan Rekanan</span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  Monitoring permohonan penambahan plafon deposit masuk, approval direksi &amp; pencatatan saldo
                </p>
              </div>
              <button
                onClick={() => handleOpenAddRequest()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl transition flex items-center gap-1 self-start sm:self-auto shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Buat Pengajuan Baru</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">No. Pengajuan &amp; Tanggal</th>
                    <th className="py-3 px-4">Perusahaan Rekanan</th>
                    <th className="py-3 px-4">Pemohon</th>
                    <th className="py-3 px-4">Keperluan &amp; Urgensi</th>
                    <th className="py-3 px-4">Nominal Diajukan</th>
                    <th className="py-3 px-4">Rekening Tujuan Kas</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRequests.map((req) => {
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 inline-block mb-1">
                            {req.requestNumber}
                          </span>
                          <p className="font-medium text-slate-700 text-xs flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formatDateIndo(req.requestDate)}
                          </p>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{req.companyName}</p>
                          <span className="font-mono text-[10px] text-slate-400">{req.companyCode}</span>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800">{req.applicantName}</p>
                          <p className="text-[10px] text-slate-400">{req.applicantRole || 'PIC Rekanan'}</p>
                          {req.applicantPhone && (
                            <p className="text-[10px] text-slate-400 font-mono">{req.applicantPhone}</p>
                          )}
                        </td>

                        <td className="py-3 px-4 max-w-[220px]">
                          <div className="flex items-center gap-1 mb-1">
                            {req.urgencyLevel === 'urgent' ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                Mendesak
                              </span>
                            ) : req.urgencyLevel === 'high' ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                                Sangat Penting
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 text-slate-600">
                                Normal
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-slate-800 text-[11px] line-clamp-2">{req.purpose}</p>
                          {req.notes && (
                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 italic">{req.notes}</p>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <p className="text-sm font-bold font-mono text-indigo-700">
                            {formatRupiah(req.amount)}
                          </p>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-700 text-[11px]">{req.targetAccountName || 'Rekening Operasional'}</p>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {req.status === 'pending' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" /> Menunggu Review
                            </span>
                          )}
                          {req.status === 'approved' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" /> Disetujui
                            </span>
                          )}
                          {req.status === 'completed' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Terealisasi
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <div>
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                                <XCircle className="w-2.5 h-2.5" /> Ditolak
                              </span>
                              {req.rejectionReason && (
                                <p className="text-[9px] text-rose-600 mt-0.5 line-clamp-1 max-w-[140px] mx-auto">
                                  {req.rejectionReason}
                                </p>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Action: Pending -> Setujui / Realisasi / Tolak */}
                            {req.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveRequest(req)}
                                  className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[10px] font-bold transition flex items-center gap-1"
                                  title="Setujui Pengajuan Deposit"
                                >
                                  <Check className="w-3 h-3" /> Setujui
                                </button>
                                <button
                                  onClick={() => handleOpenRealize(req)}
                                  className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[10px] font-bold transition flex items-center gap-1"
                                  title="Langsung Realisasi & Masuk ke Saldo"
                                >
                                  <Coins className="w-3 h-3" /> Realisasi
                                </button>
                                <button
                                  onClick={() => handleOpenReject(req)}
                                  className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-[10px] font-bold transition flex items-center gap-1"
                                  title="Tolak Pengajuan"
                                >
                                  <X className="w-3 h-3" /> Tolak
                                </button>
                              </>
                            )}

                            {/* Action: Approved -> Realisasi / Batalkan */}
                            {req.status === 'approved' && (
                              <>
                                <button
                                  onClick={() => handleOpenRealize(req)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition flex items-center gap-1 shadow-xs"
                                  title="Realisasi Dana Masuk ke Saldo Deposit Klien"
                                >
                                  <Coins className="w-3 h-3" /> Realisasi Saldo
                                </button>
                                <button
                                  onClick={() => handleOpenReject(req)}
                                  className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-[10px] font-bold transition"
                                  title="Batalkan Persetujuan"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            )}

                            {/* Action: Completed -> Lihat info */}
                            {req.status === 'completed' && (
                              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Masuk Saldo
                              </span>
                            )}

                            {/* Edit & Delete Actions */}
                            {req.status !== 'completed' && (
                              <button
                                onClick={() => handleOpenEditRequest(req)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                                title="Edit Pengajuan"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteRequest(req.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                              title="Hapus Data Pengajuan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredDepositRequests.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        <SendHorizontal className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-medium text-xs">Belum ada data pengajuan deposit yang sesuai filter</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Klik &quot;+ Buat Pengajuan Baru&quot; untuk mengajukan penambahan deposit perusahaan rekanan
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={currentPage}
              totalItems={filteredDepositRequests.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[8, 16, 24]}
              itemLabel="pengajuan deposit"
            />
          </div>
        </div>
      )}

      {/* 4. Tab Visualisasi Data Recharts: Grafik & Tren Saldo */}
      {activeViewTab === 'chart' && (
        <CompanyDepositTrendChart
          companies={safeCompanies}
          topUpHistory={safeTopUps}
          finances={safeFinances}
          initialSelectedCompanyId={selectedChartCompanyId}
          onCompanyChange={(id) => setSelectedChartCompanyId(id)}
        />
      )}

      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {editingCompany ? 'Edit Master Perusahaan Rekanan' : 'Daftar Perusahaan Pemberi Deposit Baru'}
                  </h3>
                  <p className="text-[10px] text-slate-400">Master klien logistik dengan akun saldo deposit operasional</p>
                </div>
              </div>
              <button onClick={() => setIsCompanyModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCompanySubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Kode Perusahaan</label>
                  <input
                    type="text"
                    value={companyFormData.companyCode}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, companyCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-slate-800"
                    placeholder="PT-SMM"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Status Klien *</label>
                  <select
                    value={companyFormData.status}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, status: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                    required
                  >
                    <option value="active">Aktif Berjalan</option>
                    <option value="inactive">Non-Aktif / Kontrak Selesai</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Nama Perusahaan Rekanan *</label>
                <input
                  type="text"
                  value={companyFormData.companyName}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, companyName: e.target.value })}
                  placeholder="Misal: PT Sumber Makmur Mineral"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-hidden focus:border-indigo-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nama PIC Logistik / Finance</label>
                  <input
                    type="text"
                    value={companyFormData.picName}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, picName: e.target.value })}
                    placeholder="Misal: Ir. Bambang Trihatmojo"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nomor Telepon PIC</label>
                  <input
                    type="text"
                    value={companyFormData.picPhone}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, picPhone: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Email Perusahaan / PIC</label>
                <input
                  type="email"
                  value={companyFormData.picEmail}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, picEmail: e.target.value })}
                  placeholder="logistik@perusahaan.co.id"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {editingCompany ? 'Ubah Saldo Manual (Rp)' : 'Saldo Deposit Awal (Rp) *'}
                  </label>
                  <input
                    type="number"
                    value={companyFormData.initialDeposit || ''}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, initialDeposit: Number(e.target.value) })}
                    placeholder="25000000"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 font-mono focus:outline-hidden focus:border-indigo-500 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Batas Peringatan Minimum (Rp)</label>
                  <input
                    type="number"
                    value={companyFormData.minimumBalanceWarning || ''}
                    onChange={(e) =>
                      setCompanyFormData({ ...companyFormData, minimumBalanceWarning: Number(e.target.value) })
                    }
                    placeholder="10000000"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Alamat Kantor / Pabrik / Gudang</label>
                <textarea
                  rows={2}
                  value={companyFormData.address}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, address: e.target.value })}
                  placeholder="Kawasan Industri MM2100 Blok C-4, Cikarang Barat..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catatan Kontrak &amp; Ruang Lingkup</label>
                <input
                  type="text"
                  value={companyFormData.notes}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, notes: e.target.value })}
                  placeholder="Misal: Kontrak angkutan batubara dan semen curah proyek jalur Pantura"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingCompany ? 'Simpan Perubahan' : 'Daftarkan Rekanan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Catat Top-Up Deposit Masuk */}
      {isTopUpModalOpen && selectedCompanyForTopUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Pencatatan Deposit Masuk (Top-Up)</h3>
                  <p className="text-[10px] text-slate-500">
                    Klien: <b>{selectedCompanyForTopUp.companyName}</b>
                  </p>
                </div>
              </div>
              <button onClick={() => setIsTopUpModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTopUpSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block">Saldo Terkini Klien:</span>
                  <span className="text-base font-bold font-mono text-indigo-700">
                    {formatRupiah(selectedCompanyForTopUp.currentBalance)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Kode Rekanan:</span>
                  <span className="font-mono font-bold text-xs text-slate-700">
                    {selectedCompanyForTopUp.companyCode}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Tanggal Transfer *</label>
                  <input
                    type="date"
                    value={topUpFormData.date}
                    onChange={(e) => setTopUpFormData({ ...topUpFormData, date: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nomor Bukti Transfer Bank *</label>
                  <input
                    type="text"
                    value={topUpFormData.transferProofNumber}
                    onChange={(e) => setTopUpFormData({ ...topUpFormData, transferProofNumber: e.target.value })}
                    placeholder="TRF-BCA-98122"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Nominal Deposit Masuk (Rp) *</label>
                <input
                  type="number"
                  value={topUpFormData.amount}
                  onChange={(e) => setTopUpFormData({ ...topUpFormData, amount: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-base font-bold font-mono text-emerald-700 focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Masuk ke Rekening Kas/Bank *</label>
                  <select
                    value={topUpFormData.bankAccountId}
                    onChange={(e) => setTopUpFormData({ ...topUpFormData, bankAccountId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                    required
                  >
                    {safeAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName} ({formatRupiah(acc.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Metode Pembayaran</label>
                  <select
                    value={topUpFormData.paymentMethod}
                    onChange={(e) => setTopUpFormData({ ...topUpFormData, paymentMethod: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                  >
                    <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                    <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                    <option value="Transfer Bank BNI">Transfer Bank BNI</option>
                    <option value="Transfer Bank BRI">Transfer Bank BRI</option>
                    <option value="Bilyet Giro / Cek">Bilyet Giro / Cek</option>
                    <option value="Setoran Tunai Bank">Setoran Tunai Bank</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Upload Bukti Transfer / Mutasi Rekening</label>
                <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" />

                {topUpFormData.receiptProofUrl ? (
                  <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                    {topUpFormData.receiptProofUrl.startsWith('data:application/pdf') ? (
                      <div className="w-10 h-10 rounded bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    ) : (
                      <img src={topUpFormData.receiptProofUrl} alt="Bukti" className="w-10 h-10 object-cover rounded" />
                    )}
                    <span className="text-xs text-emerald-800 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Bukti transfer terlampir
                    </span>
                    <button
                      type="button"
                      onClick={() => setTopUpFormData({ ...topUpFormData, receiptProofUrl: '' })}
                      className="ml-auto text-[10px] text-rose-600 hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 font-medium flex items-center justify-center gap-1"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Upload Foto Struk / Screenshot M-Banking</span>
                  </button>
                )}
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catatan / Rincian Top-Up</label>
                <input
                  type="text"
                  value={topUpFormData.notes}
                  onChange={(e) => setTopUpFormData({ ...topUpFormData, notes: e.target.value })}
                  placeholder="Misal: Tambahan deposit termin 2 angkutan batubara"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTopUpModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Proses &amp; Tambah Saldo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Buat / Edit Pengajuan Deposit */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <SendHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {editingRequest ? 'Edit Pengajuan Deposit' : 'Form Pengajuan Deposit Perusahaan Rekanan'}
                  </h3>
                  <p className="text-[10px] text-slate-400">Permohonan penambahan dana plafon deposit sebelum/saat operasional jalan</p>
                </div>
              </div>
              <button onClick={() => setIsRequestModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="p-4 space-y-3.5 text-xs">
              {/* Pilih Perusahaan */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Perusahaan Rekanan Pemberi Deposit *</label>
                <select
                  required
                  value={requestFormData.companyId}
                  onChange={(e) => {
                    const c = safeCompanies.find((item) => item.id === e.target.value);
                    setRequestFormData({
                      ...requestFormData,
                      companyId: e.target.value,
                      companyName: c?.companyName || '',
                      companyCode: c?.companyCode || '',
                      applicantName: requestFormData.applicantName || c?.picName || '',
                      applicantPhone: requestFormData.applicantPhone || c?.picPhone || ''
                    });
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                >
                  <option value="">-- Pilih Perusahaan Rekanan --</option>
                  {safeCompanies.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.companyName} ({comp.companyCode}) - Saldo: {formatRupiah(comp.currentBalance)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal & Nominal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Tanggal Pengajuan *</label>
                  <input
                    type="date"
                    required
                    value={requestFormData.requestDate}
                    onChange={(e) => setRequestFormData({ ...requestFormData, requestDate: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nominal Pengajuan (Rp) *</label>
                  <input
                    type="number"
                    required
                    min={100000}
                    step={100000}
                    value={requestFormData.amount || ''}
                    onChange={(e) => setRequestFormData({ ...requestFormData, amount: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 font-mono font-bold"
                  />
                  <p className="text-[10px] text-blue-600 font-mono mt-0.5">
                    {formatRupiah(requestFormData.amount || 0)}
                  </p>
                </div>
              </div>

              {/* Keperluan / Pos Peruntukan */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Keperluan / Alokasi Pos Peruntukan *</label>
                <input
                  type="text"
                  required
                  value={requestFormData.purpose || ''}
                  onChange={(e) => setRequestFormData({ ...requestFormData, purpose: e.target.value })}
                  placeholder="Contoh: Kuota cadangan solar SPBU & saldo E-Toll rute Cigudeg - Cilegon"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                />
              </div>

              {/* Rekening Tujuan Kas Masuk & Tingkat Urgensi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Rekening Tujuan Kas Masuk *</label>
                  <select
                    value={requestFormData.targetAccountId}
                    onChange={(e) => {
                      const acc = safeAccounts.find((a) => a.id === e.target.value);
                      setRequestFormData({
                        ...requestFormData,
                        targetAccountId: e.target.value,
                        targetAccountName: acc?.accountName || ''
                      });
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                  >
                    {safeAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName} ({acc.bankName || acc.bankOrProvider})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Tingkat Urgensi</label>
                  <select
                    value={requestFormData.urgencyLevel}
                    onChange={(e) => setRequestFormData({ ...requestFormData, urgencyLevel: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                  >
                    <option value="normal">Normal (Standar 1-2 hari)</option>
                    <option value="urgent">Mendesak (Hari ini)</option>
                    <option value="high">Sangat Penting (Segera / Urgent)</option>
                  </select>
                </div>
              </div>

              {/* Data Pemohon */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nama Pemohon *</label>
                  <input
                    type="text"
                    required
                    value={requestFormData.applicantName || ''}
                    onChange={(e) => setRequestFormData({ ...requestFormData, applicantName: e.target.value })}
                    placeholder="Nama PIC"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">No. Kontak / HP</label>
                  <input
                    type="text"
                    value={requestFormData.applicantPhone || ''}
                    onChange={(e) => setRequestFormData({ ...requestFormData, applicantPhone: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Jabatan Pemohon</label>
                  <input
                    type="text"
                    value={requestFormData.applicantRole || ''}
                    onChange={(e) => setRequestFormData({ ...requestFormData, applicantRole: e.target.value })}
                    placeholder="PIC Logistik"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                  />
                </div>
              </div>

              <ReceiptUploadField
                label="Upload Lampiran Memo / PO / Nota Pengajuan"
                value={requestFormData.attachmentUrl || ''}
                onChange={(url) => setRequestFormData({ ...requestFormData, attachmentUrl: url })}
              />

              {/* Catatan */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  value={requestFormData.notes || ''}
                  onChange={(e) => setRequestFormData({ ...requestFormData, notes: e.target.value })}
                  placeholder="Misal: Nomor SPK / PO kontrak logistik terlampir"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <SendHorizontal className="w-3.5 h-3.5" />
                  <span>{editingRequest ? 'Simpan Perubahan' : 'Kirim Pengajuan Deposit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Realisasi & Top-Up Saldo */}
      {isRealizeModalOpen && selectedRequestForRealization && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Realisasi &amp; Tambah ke Saldo Deposit Klien
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Konfirmasi penerimaan transfer dana &amp; otomatis menambah saldo deposit {selectedRequestForRealization.companyName}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsRealizeModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRealizeSubmit} className="p-4 space-y-3.5 text-xs">
              <div className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-emerald-800">
                    {selectedRequestForRealization.requestNumber}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Tgl: {formatDateIndo(selectedRequestForRealization.requestDate)}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mt-1">{selectedRequestForRealization.companyName}</h4>
                <p className="text-[11px] text-slate-600 mt-0.5">{selectedRequestForRealization.purpose}</p>
                <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 font-medium">Nominal Yang Direalisasikan:</span>
                  <span className="text-base font-bold font-mono text-emerald-700">
                    {formatRupiah(selectedRequestForRealization.amount)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Tanggal Masuk / Mutasi *</label>
                  <input
                    type="date"
                    required
                    value={realizeFormData.date}
                    onChange={(e) => setRealizeFormData({ ...realizeFormData, date: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nomor Bukti Transfer Bank *</label>
                  <input
                    type="text"
                    required
                    value={realizeFormData.transferProofNumber}
                    onChange={(e) => setRealizeFormData({ ...realizeFormData, transferProofNumber: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Rekening Bank Tujuan Penerima *</label>
                  <select
                    value={realizeFormData.bankAccountId}
                    onChange={(e) => setRealizeFormData({ ...realizeFormData, bankAccountId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                  >
                    {safeAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountName} ({a.bankName || a.bankOrProvider})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Metode Pembayaran</label>
                  <select
                    value={realizeFormData.paymentMethod}
                    onChange={(e) => setRealizeFormData({ ...realizeFormData, paymentMethod: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                  >
                    <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                    <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                    <option value="Transfer Bank BNI">Transfer Bank BNI</option>
                    <option value="Transfer Bank BRI">Transfer Bank BRI</option>
                    <option value="Bilyet Giro / Cek">Bilyet Giro / Cek</option>
                    <option value="Setoran Tunai Bank">Setoran Tunai Bank</option>
                  </select>
                </div>
              </div>

              <ReceiptUploadField
                label="Upload Bukti Transfer / Nota Mutasi Rekening *"
                value={realizeFormData.receiptProofUrl}
                onChange={(url) => setRealizeFormData({ ...realizeFormData, receiptProofUrl: url })}
              />

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catatan Realisasi</label>
                <input
                  type="text"
                  value={realizeFormData.notes}
                  onChange={(e) => setRealizeFormData({ ...realizeFormData, notes: e.target.value })}
                  placeholder="Catatan verifikasi mutasi masuk"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRealizeModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Konfirmasi &amp; Tambah Saldo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Tolak Pengajuan */}
      {isRejectModalOpen && selectedRequestForRejection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-rose-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Tolak Pengajuan Deposit</h3>
                  <p className="text-[10px] text-slate-500">Berikan alasan penolakan berkas pengajuan ini</p>
                </div>
              </div>
              <button onClick={() => setIsRejectModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="p-4 space-y-3.5 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="font-mono text-[10px] text-slate-500">{selectedRequestForRejection.requestNumber}</p>
                <p className="font-bold text-slate-800 mt-0.5">{selectedRequestForRejection.companyName}</p>
                <p className="text-indigo-700 font-bold font-mono text-xs mt-0.5">
                  {formatRupiah(selectedRequestForRejection.amount)}
                </p>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Alasan Penolakan *</label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReasonText}
                  onChange={(e) => setRejectionReasonText(e.target.value)}
                  placeholder="Misal: Lampiran SPK belum lengkap, kuota plafon melebihi pagu kemitraan..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Konfirmasi Penolakan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Cetak Kwitansi Penerimaan Deposit Perusahaan */}
      {printTopUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto printable-slip-modal">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto printable-slip-card">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 print:hidden print-hide">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-emerald-600" />
                <span>Pratinjau Kwitansi Penerimaan Deposit Perusahaan</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    printElementById(
                      'printable-topup-slip',
                      `Kwitansi_Deposit_${printTopUp.transferProofNumber || printTopUp.id}`
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Printer</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadDepositTopUpSlipPDF(printTopUp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintTopUp(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <PrintOutPreviewStage
              documentLabel={`KWITANSI DEPOSIT: ${printTopUp.transferProofNumber || printTopUp.id}`}
            >
              <div id="printable-topup-slip" className="p-6 bg-white space-y-4 font-mono text-slate-900 text-xs">
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 gap-3">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wide">
                      PT TRANSINDO LOGISTIK INDONESIA
                    </h3>
                    <p className="text-[10px] text-slate-600">
                      44S OPS_PRO • DIVISI KEUANGAN &amp; KEMITRAAN DEPOSIT ARMADA
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="border-2 border-emerald-800 text-emerald-800 bg-emerald-50 px-2.5 py-1 font-black text-xs uppercase">
                      KWITANSI DEPOSIT MASUK
                    </div>
                    <div className="text-[11px] font-bold mt-1">
                      NO: {printTopUp.transferProofNumber || printTopUp.id}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-slate-500">Tanggal Terima:</span>{' '}
                    <span className="font-bold">{formatDateIndo(printTopUp.date)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">ID Record:</span>{' '}
                    <span className="font-bold">{printTopUp.id}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Telah Diterima Dari:</span>{' '}
                    <span className="font-bold text-indigo-900">{printTopUp.companyName}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Rekening Bank Tujuan:</span>{' '}
                    <span className="font-bold">{printTopUp.bankAccountName}</span> ({printTopUp.paymentMethod})
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">
                    Untuk Pembayaran / Keterangan:
                  </div>
                  <p className="text-xs text-slate-800 font-sans leading-relaxed">
                    {printTopUp.notes || 'Top-up saldo deposit operasional perusahaan rekanan.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border-2 border-emerald-700 bg-emerald-50/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-slate-700">NOMINAL DEPOSIT MASUK:</span>
                    <span className="text-lg font-black text-emerald-800">
                      + {formatRupiah(printTopUp.amount)}
                    </span>
                  </div>
                  <div className="text-[11px] italic text-slate-700 border-t border-emerald-200 pt-1.5">
                    Terbilang: <span className="font-bold"># {terbilangRupiah(printTopUp.amount)} #</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 pt-3 text-center text-xs">
                  <div>
                    <p className="text-slate-500">Penyetor / Perusahaan Rekanan,</p>
                    <div className="h-14"></div>
                    <p className="font-bold underline">{printTopUp.companyName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Penerima / Bagian Keuangan,</p>
                    <div className="h-14"></div>
                    <p className="font-bold underline">Rina Anggraini, S.E.</p>
                  </div>
                </div>

                <div className="text-[9px] text-center text-slate-400 pt-2 border-t border-slate-100">
                  Dicetak melalui 44S Ops_pro • Tanda Terima Resmi Deposit Perusahaan
                </div>
              </div>
            </PrintOutPreviewStage>
          </div>
        </div>
      )}
    </div>
  );
};
