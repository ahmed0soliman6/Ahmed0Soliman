import React from 'react';
import { Locale } from '../../types/cms';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminPaginationProps {
  locale: Locale;
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (nextPage: number) => void;
}

export const AdminPagination: React.FC<AdminPaginationProps> = ({
  locale,
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems === 0 || totalPages <= 1) return null;

  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  const pages: number[] = [];
  for (let p = 1; p <= totalPages; p++) {
    pages.push(p);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
      <div className="text-slate-500 dark:text-slate-400 font-mono-tabular">
        {locale === 'ar'
          ? `عرض ${startItem}–${endItem} من أصل ${totalItems} سجل`
          : `Showing ${startItem}–${endItem} of ${totalItems} records`}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:border-[#00C2CB] transition-colors cursor-pointer disabled:cursor-not-allowed whitespace-nowrap shrink-0"
        >
          {locale === 'ar' ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
          <span>{locale === 'ar' ? 'السابق' : 'Prev'}</span>
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`min-w-[32px] h-8 px-2 rounded-lg font-mono-tabular font-semibold transition-colors cursor-pointer ${
              p === safePage
                ? 'bg-[#00C2CB] text-slate-950'
                : 'bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#00C2CB]'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:border-[#00C2CB] transition-colors cursor-pointer disabled:cursor-not-allowed whitespace-nowrap shrink-0"
        >
          <span>{locale === 'ar' ? 'التالي' : 'Next'}</span>
          {locale === 'ar' ? (
            <ChevronLeft className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};
