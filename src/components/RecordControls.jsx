import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, FilterX, Search } from "lucide-react";

export const STAFF_QUICK_FILTERS = [
  { key: "ALL", label: "All officers" },
  { key: "PROGRAM_ANALYST", label: "Programme analysts" },
  { key: "DATA_PROCESSING", label: "Data processing" },
  { key: "ADMIN_OFFICER", label: "Admin officers" },
  { key: "EXECUTIVE_GD", label: "Executive (GD)" },
  { key: "ACCOUNTANT", label: "Accountants" },
  { key: "EXECUTIVE_AC", label: "Executive (Accounts)" },
  { key: "CONFIDENTIAL_SEC", label: "Confidential secretaries" },
  { key: "SPECIAL_APPOINTEES", label: "Special appointees" },
  { key: "POSTED", label: "Posted to MDAs" },
  { key: "ACTIVE", label: "Active at BIT" },
];

export function QuickFilters({ options, value, onChange, label = "Quick filters" }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5 no-print">
      {options.map((option) => (
        <button key={option.key} type="button" aria-pressed={value === option.key} onClick={() => onChange(option.key)}
          className={`px-2.5 py-1.5 rounded text-[11px] font-semibold border ${value === option.key ? "bg-emerald-700 border-emerald-700 text-white" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"}`}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function RecordFilters({ search, onSearch, children, onReset, label = "Search records" }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-y border-slate-200 py-3 no-print">
      <div className="relative flex-1 min-w-0 basis-52">
        <Search size={15} aria-hidden="true" className="absolute left-2.5 top-2.5 text-slate-400" />
        <input type="search" aria-label={label} placeholder={label} value={search} onChange={(event) => onSearch(event.target.value)}
          className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded text-xs" />
      </div>
      {children}
      {onReset && <button type="button" onClick={onReset} title="Reset filters" aria-label="Reset filters" className="p-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50"><FilterX size={16} /></button>}
    </div>
  );
}

export function Pagination({ page, lastPage, total, perPage, onPage, onPerPage, loading = false }) {
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  return (
    <nav aria-label="Record pagination" className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 py-3 no-print">
      <span aria-live="polite">{loading ? "Loading records..." : total === 0 ? "No matching records" : `Showing ${start}-${Math.min(page * perPage, total)} of ${total} records`}</span>
      <div className="flex flex-wrap items-center gap-2">
        {onPerPage && <label className="flex items-center gap-1.5">Rows
          <select aria-label="Records per page" value={perPage} onChange={(event) => onPerPage(Number(event.target.value))} className="p-1.5 border border-slate-300 rounded bg-white">
            {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>}
        <button type="button" aria-label="Previous page" title="Previous page" disabled={page <= 1 || loading} onClick={() => onPage(page - 1)} className="p-2 border border-slate-300 rounded disabled:opacity-40"><ChevronLeft size={16} /></button>
        <span>Page {page} of {Math.max(1, lastPage)}</span>
        <button type="button" aria-label="Next page" title="Next page" disabled={page >= lastPage || loading} onClick={() => onPage(page + 1)} className="p-2 border border-slate-300 rounded disabled:opacity-40"><ChevronRight size={16} /></button>
      </div>
    </nav>
  );
}

export function useRecordPage(records, scope = "") {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [position, setPosition] = useState({ key: "", page: 1 });
  const [perPage, setPerPage] = useState(25);
  const key = JSON.stringify([search, filter, scope, perPage]);
  useEffect(() => {
    setPosition({ key, page: 1 });
  }, [key]);
  const filtered = records.filter((record) => {
    const text = JSON.stringify(record).toLowerCase();
    return search.toLowerCase().trim().split(/\s+/).every((term) => text.includes(term)) && (!filter || text.includes(filter.toLowerCase()));
  });
  const lastPage = Math.max(1, Math.ceil(filtered.length / perPage));
  const page = position.key === key ? Math.min(position.page, lastPage) : 1;
  const onPage = (value) => setPosition({ key, page: value });
  return { search, setSearch, filter, setFilter, page, perPage, setPerPage, lastPage, total: filtered.length,
    rows: filtered.slice((page - 1) * perPage, page * perPage), onPage,
    reset: () => { setSearch(""); setFilter(""); onPage(1); } };
}