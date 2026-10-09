import { Trash2 } from "lucide-react";

const BulkDeleteBar = ({
  count,
  itemLabel,
  disabled = false,
  onDelete,
  onClear,
}) => {
  if (!count) return null;

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-default bg-subtle px-4 py-2 text-sm">
      <span className="text-secondary">
        {count} selected
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-danger/40 bg-danger-soft px-3 text-sm font-medium text-danger transition hover:bg-danger disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 size={16} />
          Delete selected {itemLabel}
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="text-xs text-accent hover:underline disabled:opacity-50"
        >
          Clear selection
        </button>
      </div>
    </div>
  );
};

export default BulkDeleteBar;
