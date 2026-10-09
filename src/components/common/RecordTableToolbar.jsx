import { useEffect, useRef, useState } from "react";
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
}) => {
  const [openPopover, setOpenPopover] = useState(null);
  const triggerRefs = useRef({});

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        !(event.target instanceof Element) ||
        !event.target.closest("[data-record-table-popover]")
      ) {
        setOpenPopover(null);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && openPopover) {
        triggerRefs.current[openPopover]?.focus();
        setOpenPopover(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openPopover]);

  const togglePopover = (name) => {
    setOpenPopover((current) => (current === name ? null : name));
  };

  const renderTrigger = (name, icon, label, className = "") => (
    <button
      ref={(element) => {
        triggerRefs.current[name] = element;
      }}
      type="button"
      data-record-table-popover
      aria-expanded={openPopover === name}
      aria-controls={`record-table-${name}-panel`}
      onClick={() => togglePopover(name)}
      className={`entity-admin-button inline-flex items-center gap-2 rounded border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 ${className}`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div
      className="entity-admin-toolbar relative z-30 flex w-full min-w-0 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 p-3"
    >
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
            className="entity-admin-input w-full rounded border border-slate-700 bg-slate-800 py-2 pl-9 pr-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </label>
        <div className="relative">
          {renderTrigger("filter", <SlidersHorizontal size={16} />, "Filter")}
          {openPopover === "filter" && (
            <div
              id="record-table-filter-panel"
              data-record-table-popover
              className="absolute left-0 top-full z-50 mt-2 grid w-64 gap-3 rounded border border-slate-700 bg-slate-900 p-3 shadow-xl"
              onClick={(event) => {
                if (event.target.closest("button")) setOpenPopover(null);
              }}
            >
              {filterContent}
            </div>
          )}
        </div>
        <div className="relative">
          {renderTrigger("columns", <Columns3 size={16} />, "Columns")}
          {openPopover === "columns" && (
            <div
              id="record-table-columns-panel"
              data-record-table-popover
              className="absolute left-0 top-full z-50 mt-2 grid w-max gap-1 rounded border border-slate-700 bg-slate-900 p-2 shadow-xl"
            >
              {columns.map((column) => (
                <label
                  key={column.key}
                  className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded px-2 py-2 text-sm text-slate-200 hover:bg-slate-800"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(column.key)}
                    disabled={
                      visibleColumns.includes(column.key) &&
                      visibleColumns.length === 1
                    }
                    onChange={() => onToggleColumn(column.key)}
                    className="accent-indigo-500"
                  />
                  {column.label}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          {renderTrigger(
            "views",
            <Bookmark size={16} />,
            "Views",
            "border-slate-700",
          )}
          {openPopover === "views" && (
            <div
              id="record-table-views-panel"
              data-record-table-popover
              className="absolute left-0 top-full z-50 mt-2 grid w-48 rounded border border-slate-700 bg-slate-900 p-1 shadow-xl"
            >
              {views.map((view) => (
                <button
                  key={view.label}
                  type="button"
                  onClick={() => {
                    view.onSelect();
                    setOpenPopover(null);
                  }}
                  className="rounded px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                >
                  {view.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <span>{recordCount} records</span>
        {rightContent}
      </div>
    </div>
  );
};

export default RecordTableToolbar;
