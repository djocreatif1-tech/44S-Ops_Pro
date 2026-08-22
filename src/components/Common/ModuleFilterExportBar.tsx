import React from 'react';
import {
  Calendar,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

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
  children
}) => {
  const isDateFiltered = Boolean(startDate || endDate);

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
      // Last day of month
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

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Date Range Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-2 sm:gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Filter Tanggal:</span>
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

          {/* Quick Presets */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => applyPreset('thisMonth')}
              className="px-2 py-1 text-[11px] font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition whitespace-nowrap touch-manipulation"
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => applyPreset('7days')}
              className="px-2 py-1 text-[11px] font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition whitespace-nowrap touch-manipulation"
            >
              7 Hari
            </button>
            <button
              type="button"
              onClick={() => applyPreset('lastMonth')}
              className="px-2 py-1 text-[11px] font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition whitespace-nowrap touch-manipulation"
            >
              Bulan Lalu
            </button>
            {isDateFiltered && (
              <button
                type="button"
                onClick={onResetDateFilter}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition whitespace-nowrap touch-manipulation"
                title="Reset Filter Tanggal"
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
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Export Excel Button */}
            <button
              type="button"
              onClick={onExportExcel}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-xs transition touch-manipulation"
              title="Download Laporan Format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
              <span>Excel</span>
            </button>

            {/* Export PDF Button */}
            <button
              type="button"
              onClick={onExportPDF}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-xs transition touch-manipulation"
              title="Download Laporan Format PDF Resmi"
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Optional Extra Filters Slot (e.g. Search, Status, Unit filter) */}
      {children && (
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
          {children}
        </div>
      )}
    </div>
  );
};
