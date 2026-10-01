import { Bookmark, Columns3, Search, SlidersHorizontal } from "lucide-react";

const RecordTableToolbar = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder,
  columns,
  visibleColumns,
  onToggleColumn,
  filterContent,
  views,
  recordCount,
  rightContent,
}) => (
  <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 p-3">
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <label className="relative min-w-55 max-w-[320px] flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="w-full rounded border border-slate-700 bg-slate-800 py-2 pl-9 pr-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
        />
      </label>
      <details className="group relative">
        <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
          <SlidersHorizontal size={16} /> Filter
        </summary>
        <div className="absolute left-0 top-full z-30 mt-2 grid w-64 gap-3 rounded border border-slate-700 bg-slate-900 p-3 shadow-xl">
          {filterContent}
        </div>
      </details>
      <details className="group relative">
        <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
          <Columns3 size={16} /> Columns
        </summary>
        <div className="absolute left-0 top-full z-30 mt-2 grid max-h-80 w-56 gap-1 overflow-y-auto rounded border border-slate-700 bg-slate-900 p-2 shadow-xl">
          {columns.map((column) => (
            <label
              key={column.key}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              <input
                type="checkbox"
                checked={visibleColumns.includes(column.key)}
                disabled={
                  visibleColumns.includes(column.key) && visibleColumns.length === 1
                }
                onChange={() => onToggleColumn(column.key)}
                className="accent-indigo-500"
              />
              {column.label}
            </label>
          ))}
        </div>
      </details>
      <details className="group relative">
        <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
          <Bookmark size={16} /> Views
        </summary>
        <div className="absolute left-0 top-full z-30 mt-2 grid w-48 rounded border border-slate-700 bg-slate-900 p-1 shadow-xl">
          {views.map((view) => (
            <button
              key={view.label}
              type="button"
              onClick={view.onSelect}
              className="rounded px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
            >
              {view.label}
            </button>
          ))}
        </div>
      </details>
    </div>
    <div className="flex items-center gap-3 text-sm text-slate-400">
      <span>{recordCount} records</span>
      {rightContent}
    </div>
  </div>
);

export default RecordTableToolbar;