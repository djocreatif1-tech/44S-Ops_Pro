import React from 'react';
import {
  Calendar,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Building2
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';

export interface CompanyMutationSummaryItem {
  companyName: string;
  count: number;
  totalAmount?: number;
  unitLabel?: string;
}

export interface DateFilterExportBarProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onResetDateFilter: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  totalFilteredCount: number;
  totalAllCount?: number;
  moduleLabel?: string;
  companies?: string[];
  selectedCompany?: string;
  onCompanyChange?: (val: string) => void;
  companySummaries?: CompanyMutationSummaryItem[];
  children?: React.ReactNode;
}

export const ModuleFilterExportBar: React.FC<DateFilterExportBarProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onResetDateFilter,
  onExportExcel,
  onExportPDF,
  totalFilteredCount,
  totalAllCount,
  moduleLabel = 'Data',
  companies = [],
  selectedCompany = 'all',
  onCompanyChange,
  companySummaries = [],
  children
}) => {
  const isDateFiltered = Boolean(
    startDate || endDate || (selectedCompany && selectedCompany !== 'all')
  );

  // Quick Preset Helper
  const applyPreset = (preset: 'today' | '7days' | 'thisMonth' | 'lastMonth' | 'thisYear') => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (preset === 'today') {
      onStartDateChange(todayStr);
      onEndDateChange(todayStr);
    } else if (preset === '7days') {
      const past7 = new Date();
      past7.setDate(today.getDate() - 7);
      const past7Str = `${past7.getFullYear()}-${String(past7.getMonth() + 1).padStart(2, '0')}-${String(past7.getDate()).padStart(2, '0')}`;
      onStartDateChange(past7Str);
      onEndDateChange(todayStr);
    } else if (preset === 'thisMonth') {
      onStartDateChange(`${yyyy}-${mm}-01`);
      const lastDay = new Date(yyyy, today.getMonth() + 1, 0).getDate();
      onEndDateChange(`${yyyy}-${mm}-${String(lastDay).padStart(2, '0')}`);
    } else if (preset === 'lastMonth') {
      const prevMonthDate = new Date(yyyy, today.getMonth() - 1, 1);
      const prevY = prevMonthDate.getFullYear();
      const prevM = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
      const lastDayPrev = new Date(prevY, prevMonthDate.getMonth() + 1, 0).getDate();
      onStartDateChange(`${prevY}-${prevM}-01`);
      onEndDateChange(`${prevY}-${prevM}-${String(lastDayPrev).padStart(2, '0')}`);
    } else if (preset === 'thisYear') {
      onStartDateChange(`${yyyy}-01-01`);
      onEndDateChange(`${yyyy}-12-31`);
    }
  };

  const handleResetAll = () => {
    onResetDateFilter();
    if (onCompanyChange) {
      onCompanyChange('all');
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Date Range & Company Mutation Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-2 sm:gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Periode &amp; Perusahaan:</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-full sm:w-auto pl-2.5 sm:pl-3 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-700 font-medium"
                title="Tanggal Mulai"
              />
            </div>
            <span className="text-xs text-slate-400 font-medium shrink-0">s/d</span>
            <div className="relative flex-1 sm:flex-initial">
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="w-full sm:w-auto pl-2.5 sm:pl-3 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-700 font-medium"
                title="Tanggal Sampai"
              />
            </div>
          </div>

          {/* Company Filter Dropdown if companies provided */}
          {onCompanyChange && companies.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <select
                  value={selectedCompany}
                  onChange={(e) => onCompanyChange(e.target.value)}
                  className={`pl-3 pr-7 py-1.5 text-xs rounded-lg border font-bold transition cursor-pointer focus:outline-none ${
                    selectedCompany !== 'all'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                      : 'bg-indigo-50/70 text-indigo-900 border-indigo-200 hover:bg-indigo-100/80'
                  }`}
                  title="Filter Mutasi & Daftar Pengeluaran per Perusahaan"
                >
                  <option value="all" className="bg-white text-slate-800">
                    🏢 Semua Perusahaan ({companies.length})
                  </option>
                  {companies.map((comp) => (
                    <option key={comp} value={comp} className="bg-white text-slate-800">
                      🏢 Mutasi: {comp}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Quick Presets */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => applyPreset('thisMonth')}
              className="px-2 py-1 text-[11px] font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition whitespace-nowrap touch-manipulation cursor-pointer"
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => applyPreset('7days')}
              className="px-2 py-1 text-[11px] font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition whitespace-nowrap touch-manipulation cursor-pointer"
            >
              7 Hari
            </button>
            <button
              type="button"
              onClick={() => applyPreset('lastMonth')}
              className="px-2 py-1 text-[11px] font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition whitespace-nowrap touch-manipulation cursor-pointer"
            >
              Bulan Lalu
            </button>
            {isDateFiltered && (
              <button
                type="button"
                onClick={handleResetAll}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition whitespace-nowrap touch-manipulation cursor-pointer"
                title="Reset Filter Tanggal & Perusahaan"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Record Counter & Export Action Buttons */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2">
          {/* Data Counter */}
          <div className="text-[11px] sm:text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
            <span>
              <strong className="text-slate-800 font-bold">{totalFilteredCount}</strong>
              {totalAllCount !== undefined && totalAllCount !== totalFilteredCount && (
                <span className="text-slate-400">/{totalAllCount}</span>
              )}{' '}
              {moduleLabel}
              {selectedCompany && selectedCompany !== 'all' && (
                <span className="ml-1 text-indigo-700 font-bold">({selectedCompany})</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Export Excel Button */}
            <button
              type="button"
              onClick={onExportExcel}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-xs transition touch-manipulation cursor-pointer"
              title="Download Laporan Format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
              <span>Excel</span>
            </button>

            {/* Export PDF Button */}
            <button
              type="button"
              onClick={onExportPDF}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-xs transition touch-manipulation cursor-pointer"
              title="Download Laporan Format PDF Resmi"
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Per-Company Mutation & Expense Summary Chips */}
      {onCompanyChange && companySummaries.length > 0 && (
        <div className="pt-2.5 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-indigo-600" />
              <span>Klik Mutasi Pengeluaran / Data per Perusahaan:</span>
            </span>
            {selectedCompany !== 'all' && (
              <button
                type="button"
                onClick={() => onCompanyChange('all')}
                className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Tampilkan Semua Perusahaan
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => onCompanyChange('all')}
              className={`px-3 py-1.5 rounded-xl border text-left transition shrink-0 cursor-pointer ${
                selectedCompany === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="text-[11px] font-bold leading-tight">Semua Perusahaan</div>
              <div className={`text-[10px] font-mono mt-0.5 ${selectedCompany === 'all' ? 'text-emerald-300 font-bold' : 'text-slate-500'}`}>
                {companySummaries.reduce((s, c) => s + c.count, 0)} {moduleLabel}
                {companySummaries.some((c) => typeof c.totalAmount === 'number') && (
                  <> &bull; {formatRupiah(companySummaries.reduce((s, c) => s + (c.totalAmount || 0), 0))}</>
                )}
              </div>
            </button>

            {companySummaries.map((cs) => {
              const isSelected = selectedCompany === cs.companyName;
              return (
                <button
                  key={cs.companyName}
                  type="button"
                  onClick={() => onCompanyChange(isSelected ? 'all' : cs.companyName)}
                  className={`px-3 py-1.5 rounded-xl border text-left transition shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                  }`}
                >
                  <div className="text-[11px] font-bold leading-tight flex items-center gap-1">
                    <Building2 className={`w-3 h-3 ${isSelected ? 'text-indigo-200' : 'text-indigo-600'}`} />
                    <span>{cs.companyName}</span>
                  </div>
                  <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-amber-200 font-bold' : 'text-slate-500'}`}>
                    {cs.count} {cs.unitLabel || 'Data'}
                    {typeof cs.totalAmount === 'number' && (
                      <> &bull; <strong className={isSelected ? 'text-white' : 'text-slate-800'}>{formatRupiah(cs.totalAmount)}</strong></>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Optional Extra Filters Slot (e.g. Search, Status, Unit filter) */}
      {children && (
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
          {children}
        </div>
      )}
    </div>
  );
};
