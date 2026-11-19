import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Landmark,
  Wrench,
  Award,
  Coins,
  Building,
  Truck,
  Users,
  Briefcase,
  Receipt,
  ArrowRight
} from 'lucide-react';
import {
  PaymentMethod,
  ServiceTypeReference,
  SimClassReference,
  NonRentalIncomeCategory,
  FinancialAccount,
  OperationalFinance,
  UserRole,
  CompanyDeposit,
  DepositTopUpRecord,
  EquipmentSupplier,
  ExpenseCategoryReference,
  AdminStaff,
  Vehicle,
  Driver,
  CompanyDepositRequest
} from '../../types';
import { PaymentMethodManager } from './PaymentMethodManager';
import { CompanyAccountManager } from './CompanyAccountManager';
import { ServiceTypeManager } from './ServiceTypeManager';
import { SimClassManager } from './SimClassManager';
import { NonRentalIncomeManager } from './NonRentalIncomeManager';
import { MasterSupplierManager } from './MasterSupplierManager';
import { MasterExpenseCategoryManager } from './MasterExpenseCategoryManager';
import { MasterAdminStaffManager } from './MasterAdminStaffManager';
import { MasterDepositCompanyManager } from './MasterDepositCompanyManager';
import { DriverManager } from '../Drivers/DriverManager';
import { formatRupiah } from '../../utils/formatters';

export type MasterDataTabKey =
  | 'deposit_companies'
  | 'vehicles'
  | 'drivers'
  | 'admin_staff'
  | 'equipment_suppliers'
  | 'expense_categories'
  | 'payment_methods'
  | 'company_accounts'
  | 'service_types'
  | 'sim_classes'
  | 'non_rental';

interface MasterDataHubProps {
  initialSubTab?: MasterDataTabKey;
  paymentMethods: PaymentMethod[];
  serviceTypes: ServiceTypeReference[];
  simClasses: SimClassReference[];
  nonRentalCategories: NonRentalIncomeCategory[];
  accounts: FinancialAccount[];
  finances: OperationalFinance[];
  companies?: CompanyDeposit[];
  topUpHistory?: DepositTopUpRecord[];
  depositRequests?: CompanyDepositRequest[];
  suppliers?: EquipmentSupplier[];
  expenseCategories?: ExpenseCategoryReference[];
  adminStaff?: AdminStaff[];
  vehicles?: Vehicle[];
  drivers?: Driver[];
  userRole: UserRole;
  onAddPaymentMethod: (pm: PaymentMethod) => void;
  onUpdatePaymentMethod: (pm: PaymentMethod) => void;
  onDeletePaymentMethod: (id: string) => void;
  onAddAccount?: (acc: FinancialAccount) => void;
  onUpdateAccount?: (acc: FinancialAccount) => void;
  onDeleteAccount?: (id: string) => void;
  onAddServiceType: (st: ServiceTypeReference) => void;
  onUpdateServiceType: (st: ServiceTypeReference) => void;
  onDeleteServiceType: (id: string) => void;
  onAddSimClass: (sim: SimClassReference) => void;
  onUpdateSimClass: (sim: SimClassReference) => void;
  onDeleteSimClass: (id: string) => void;
  onAddNonRentalCategory: (cat: NonRentalIncomeCategory) => void;
  onUpdateNonRentalCategory: (cat: NonRentalIncomeCategory) => void;
  onDeleteNonRentalCategory: (id: string) => void;
  onAddCompany?: (comp: CompanyDeposit) => void;
  onUpdateCompany?: (comp: CompanyDeposit) => void;
  onDeleteCompany?: (id: string) => void;
  onTopUpDeposit?: (record: DepositTopUpRecord) => void;
  onAddDepositRequest?: (req: CompanyDepositRequest) => void;
  onUpdateDepositRequest?: (req: CompanyDepositRequest) => void;
  onDeleteDepositRequest?: (id: string) => void;
  onApproveDepositRequest?: (id: string, approverName: string) => void;
  onCompleteDepositRequest?: (req: CompanyDepositRequest, transferProofNumber: string, paymentMethod: string, receiptProofUrl?: string) => void;
  onRejectDepositRequest?: (id: string, reason: string) => void;
  onAddSupplier?: (sup: EquipmentSupplier) => void;
  onUpdateSupplier?: (sup: EquipmentSupplier) => void;
  onDeleteSupplier?: (id: string) => void;
  onAddExpenseCategory?: (cat: ExpenseCategoryReference) => void;
  onUpdateExpenseCategory?: (cat: ExpenseCategoryReference) => void;
  onDeleteExpenseCategory?: (id: string) => void;
  onAddAdminStaff?: (staff: AdminStaff) => void;
  onUpdateAdminStaff?: (staff: AdminStaff) => void;
  onDeleteAdminStaff?: (id: string) => void;
  onAddDriver?: (driver: Driver) => void;
  onUpdateDriver?: (driver: Driver) => void;
  onDeleteDriver?: (id: string) => void;
  onNavigateToVehicles?: () => void;
  onNavigateToDrivers?: () => void;
  onOpenAddFinanceModal?: (defaultPaymentMethod?: string) => void;
  onOpenRoleMatrix?: () => void;
}

export const MasterDataHub: React.FC<MasterDataHubProps> = ({
  initialSubTab = 'payment_methods',
  paymentMethods = [],
  serviceTypes = [],
  simClasses = [],
  nonRentalCategories = [],
  accounts = [],
  finances = [],
  companies = [],
  topUpHistory = [],
  depositRequests = [],
  suppliers = [],
  expenseCategories = [],
  adminStaff = [],
  vehicles = [],
  drivers = [],
  userRole = 'owner',
  onAddPaymentMethod,
  onUpdatePaymentMethod,
  onDeletePaymentMethod,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onAddServiceType,
  onUpdateServiceType,
  onDeleteServiceType,
  onAddSimClass,
  onUpdateSimClass,
  onDeleteSimClass,
  onAddNonRentalCategory,
  onUpdateNonRentalCategory,
  onDeleteNonRentalCategory,
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
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onAddExpenseCategory,
  onUpdateExpenseCategory,
  onDeleteExpenseCategory,
  onAddAdminStaff,
  onUpdateAdminStaff,
  onDeleteAdminStaff,
  onAddDriver,
  onUpdateDriver,
  onDeleteDriver,
  onNavigateToVehicles,
  onNavigateToDrivers,
  onOpenAddFinanceModal,
  onOpenRoleMatrix
}) => {
  const [activeTab, setActiveTab] = useState<MasterDataTabKey>(initialSubTab);

  useEffect(() => {
    setActiveTab(initialSubTab);
  }, [initialSubTab]);

  const tabs: {
    key: MasterDataTabKey;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    count: number;
    colorClass: string;
    activeClass: string;
    badgeCategory: string;
  }[] = [
    {
      key: 'deposit_companies',
      label: 'Perusahaan Pemberi Deposit',
      sublabel: 'Klien Kontrak & Saldo Awal',
      icon: Building,
      count: companies.length,
      colorClass: 'text-indigo-600 bg-indigo-50',
      activeClass: 'bg-indigo-600 text-white shadow-xs',
      badgeCategory: 'Keuangan'
    },
    {
      key: 'vehicles',
      label: 'Master Kendaraan',
      sublabel: 'Nopol, Jenis, Kapasitas & Tahun',
      icon: Truck,
      count: vehicles.length,
      colorClass: 'text-blue-600 bg-blue-50',
      activeClass: 'bg-blue-600 text-white shadow-xs',
      badgeCategory: 'Armada'
    },
    {
      key: 'drivers',
      label: 'Karyawan Driver & Serah Terima',
      sublabel: 'NIP Driver, SIM, Rekening & Unit',
      icon: Users,
      count: drivers.length,
      colorClass: 'text-emerald-600 bg-emerald-50',
      activeClass: 'bg-emerald-600 text-white shadow-xs',
      badgeCategory: 'Supir'
    },
    {
      key: 'admin_staff',
      label: 'Karyawan Administrasi',
      sublabel: 'Staf Kantor, Kasir & Dispatcher',
      icon: Briefcase,
      count: adminStaff.length,
      colorClass: 'text-violet-600 bg-violet-50',
      activeClass: 'bg-violet-600 text-white shadow-xs',
      badgeCategory: 'Personalia'
    },
    {
      key: 'equipment_suppliers',
      label: 'Supplier Peralatan & Sparepart',
      sublabel: 'Toko Ban, Oli, Aki, Terpal & Alat',
      icon: Wrench,
      count: suppliers.length,
      colorClass: 'text-amber-600 bg-amber-50',
      activeClass: 'bg-amber-600 text-white shadow-xs',
      badgeCategory: 'Pengadaan'
    },
    {
      key: 'expense_categories',
      label: 'Jenis Pengeluaran',
      sublabel: 'Pos Biaya Ops, Sangu, BBM & Tol',
      icon: Receipt,
      count: expenseCategories.length,
      colorClass: 'text-rose-600 bg-rose-50',
      activeClass: 'bg-rose-600 text-white shadow-xs',
      badgeCategory: 'Biaya'
    },
    {
      key: 'payment_methods',
      label: 'Metode Pembayaran',
      sublabel: 'Cash, Transfer, E-Toll, SPBU',
      icon: CreditCard,
      count: paymentMethods.length,
      colorClass: 'text-amber-600 bg-amber-50',
      activeClass: 'bg-amber-600 text-white shadow-xs',
      badgeCategory: 'Transaksi'
    },
    {
      key: 'company_accounts',
      label: 'Rekening Perusahaan',
      sublabel: 'Bank Giro, Kas Pool & Saldo',
      icon: Landmark,
      count: accounts.length,
      colorClass: 'text-emerald-600 bg-emerald-50',
      activeClass: 'bg-emerald-600 text-white shadow-xs',
      badgeCategory: 'Kas'
    },
    {
      key: 'service_types',
      label: 'Jenis Servis Bengkel',
      sublabel: 'Interval Odo & Jadwal Servis',
      icon: Wrench,
      count: serviceTypes.length,
      colorClass: 'text-teal-600 bg-teal-50',
      activeClass: 'bg-teal-600 text-white shadow-xs',
      badgeCategory: 'Bengkel'
    },
    {
      key: 'sim_classes',
      label: 'Golongan SIM Pengemudi',
      sublabel: 'SIM A, B1, B2 Umum & Standar',
      icon: Award,
      count: simClasses.length,
      colorClass: 'text-indigo-600 bg-indigo-50',
      activeClass: 'bg-indigo-600 text-white shadow-xs',
      badgeCategory: 'Legalitas'
    },
    {
      key: 'non_rental',
      label: 'Pemasukan Non-Sewa',
      sublabel: 'Scrap, Klaim, Muatan Subkon',
      icon: Coins,
      count: nonRentalCategories.length,
      colorClass: 'text-blue-600 bg-blue-50',
      activeClass: 'bg-blue-600 text-white shadow-xs',
      badgeCategory: 'Pemasukan'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Module Selector Buttons Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-2xs">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-2 rounded-xl transition duration-150 text-left flex items-center gap-2 touch-manipulation cursor-pointer ${
                  isActive
                    ? tab.activeClass
                    : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : tab.colorClass
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold whitespace-nowrap">{tab.label}</span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Sub-Module View */}
      <div className="animate-in fade-in duration-150">
        {/* 1. Master Perusahaan Pemberi Deposit */}
        {activeTab === 'deposit_companies' && (
          <MasterDepositCompanyManager
            companies={companies}
            accounts={accounts}
            topUpHistory={topUpHistory}
            depositRequests={depositRequests}
            finances={finances}
            userRole={userRole}
            onAddCompany={onAddCompany || (() => {})}
            onUpdateCompany={onUpdateCompany || (() => {})}
            onDeleteCompany={onDeleteCompany || (() => {})}
            onTopUpDeposit={onTopUpDeposit}
            onAddDepositRequest={onAddDepositRequest}
            onUpdateDepositRequest={onUpdateDepositRequest}
            onDeleteDepositRequest={onDeleteDepositRequest}
            onApproveDepositRequest={onApproveDepositRequest}
            onCompleteDepositRequest={onCompleteDepositRequest}
            onRejectDepositRequest={onRejectDepositRequest}
            onOpenRoleMatrix={onOpenRoleMatrix}
          />
        )}

        {/* 2. Master Kendaraan Preview & Shortcut */}
        {activeTab === 'vehicles' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800">Master Data Kendaraan &amp; Armada</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {vehicles.length} Unit Terdaftar
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Nomor polisi, tipe armada, kapasitas tonase, tahun pembuatan, pemilik aset &amp; supir assigned
                </p>
              </div>
              {onNavigateToVehicles && (
                <button
                  onClick={onNavigateToVehicles}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <span>Buka Modul Kelola Kendaraan Lengkap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Nomor Polisi</th>
                    <th className="py-2.5 px-4">Tipe &amp; Model</th>
                    <th className="py-2.5 px-4">Tahun</th>
                    <th className="py-2.5 px-4">Kapasitas</th>
                    <th className="py-2.5 px-4">BBM &amp; Target</th>
                    <th className="py-2.5 px-4">Pemilik Aset Kendaraan</th>
                    <th className="py-2.5 px-4">Supir Ditugaskan</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{v.nopol}</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{v.brand} {v.model}</p>
                        <p className="text-[10px] text-slate-400">{v.type}</p>
                      </td>
                      <td className="py-3 px-4 font-mono">{v.year}</td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">{v.capacityTon || 0} Ton</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] text-slate-600">{v.fuelType}</span>
                        <p className="text-[10px] text-emerald-600 font-mono font-semibold">{v.targetKmPerLiter} KM/L</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                          {v.ownerCompany || 'PT Transindo Logistik'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{v.assignedDriver || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {v.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Master Karyawan Driver & Identitas (Full CRUD + Integrasi Serah Terima) */}
        {activeTab === 'drivers' && (
          <DriverManager
            drivers={drivers}
            vehicles={vehicles}
            simClasses={simClasses}
            userRole={userRole}
            onOpenRoleMatrix={onOpenRoleMatrix}
            onAddDriver={onAddDriver || (() => {})}
            onUpdateDriver={onUpdateDriver || (() => {})}
            onDeleteDriver={onDeleteDriver || (() => {})}
          />
        )}

        {/* 4. Master Karyawan Administrasi */}
        {activeTab === 'admin_staff' && (
          <MasterAdminStaffManager
            staffList={adminStaff}
            drivers={drivers}
            userRole={userRole}
            onAddStaff={onAddAdminStaff || (() => {})}
            onUpdateStaff={onUpdateAdminStaff || (() => {})}
            onDeleteStaff={onDeleteAdminStaff || (() => {})}
            onOpenRoleMatrix={onOpenRoleMatrix}
          />
        )}

        {/* 5. Master Supplier Peralatan & Sparepart */}
        {activeTab === 'equipment_suppliers' && (
          <MasterSupplierManager
            suppliers={suppliers}
            userRole={userRole}
            onAddSupplier={onAddSupplier || (() => {})}
            onUpdateSupplier={onUpdateSupplier || (() => {})}
            onDeleteSupplier={onDeleteSupplier || (() => {})}
            onOpenRoleMatrix={onOpenRoleMatrix}
          />
        )}

        {/* 6. Master Jenis Pengeluaran */}
        {activeTab === 'expense_categories' && (
          <MasterExpenseCategoryManager
            categories={expenseCategories}
            userRole={userRole}
            onAddCategory={onAddExpenseCategory || (() => {})}
            onUpdateCategory={onUpdateExpenseCategory || (() => {})}
            onDeleteCategory={onDeleteExpenseCategory || (() => {})}
            onOpenRoleMatrix={onOpenRoleMatrix}
          />
        )}

        {/* 7. Master Metode Pembayaran */}
        {activeTab === 'payment_methods' && (
          <PaymentMethodManager
            paymentMethods={paymentMethods}
            accounts={accounts}
            finances={finances}
            userRole={userRole}
            onAddPaymentMethod={onAddPaymentMethod}
            onUpdatePaymentMethod={onUpdatePaymentMethod}
            onDeletePaymentMethod={onDeletePaymentMethod}
            onAddAccount={onAddAccount}
            onOpenAddFinanceModal={onOpenAddFinanceModal}
            onOpenRoleMatrix={onOpenRoleMatrix}
          />
        )}

        {/* 8. Master Rekening Perusahaan */}
        {activeTab === 'company_accounts' && (
          <CompanyAccountManager
            accounts={accounts}
            companies={companies}
            userRole={userRole}
            onAddAccount={onAddAccount || (() => {})}
            onUpdateAccount={onUpdateAccount || (() => {})}
            onDeleteAccount={onDeleteAccount || (() => {})}
            onOpenRoleMatrix={onOpenRoleMatrix}
          />
        )}

        {/* 9. Master Jenis Servis Bengkel */}
        {activeTab === 'service_types' && (
          <ServiceTypeManager
            serviceTypes={serviceTypes}
            userRole={userRole}
            onAddServiceType={onAddServiceType}
            onUpdateServiceType={onUpdateServiceType}
            onDeleteServiceType={onDeleteServiceType}
            onOpenRoleMatrix={onOpenRoleMatrix}
          />
        )}

        {/* 10. Master Golongan SIM */}
        {activeTab === 'sim_classes' && (
          <SimClassManager
            simClasses={simClasses}
            userRole={userRole}
            onAddSimClass={onAddSimClass}
            onUpdateSimClass={onUpdateSimClass}
            onDeleteSimClass={onDeleteSimClass}
            onOpenRoleMatrix={onOpenRoleMatrix}
          />
        )}

        {/* 11. Master Pemasukan Non-Sewa */}
        {activeTab === 'non_rental' && (
          <NonRentalIncomeManager
            categories={nonRentalCategories}
            accounts={accounts}
            finances={finances}
            userRole={userRole}
            onAddCategory={onAddNonRentalCategory}
            onUpdateCategory={onUpdateNonRentalCategory}
            onDeleteCategory={onDeleteNonRentalCategory}
            onOpenAddFinanceModal={onOpenAddFinanceModal}
            onOpenRoleMatrix={onOpenRoleMatrix}
          />
        )}
      </div>
    </div>
  );
};
