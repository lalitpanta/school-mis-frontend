import { Download } from "lucide-react";

const CsvExportButton = ({ onExport, entityLabel, disabled = false }) => (
  <button
    type="button"
    onClick={onExport}
    disabled={disabled}
    title={`Export ${entityLabel} CSV`}
    aria-label={`Export ${entityLabel} CSV`}
    className="entity-admin-button inline-flex h-9 items-center gap-2 rounded border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <Download size={16} />
    Export CSV
  </button>
);

export default CsvExportButton;
