import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import toast from "react-hot-toast";

const CsvImportControls = ({ onImport, disabled = false, entityLabel }) => {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);

  const importFile = async () => {
    if (!file) {
      toast.error(`Choose a CSV file to import ${entityLabel}.`);
      return;
    }
    try {
      await onImport(file);
    } finally {
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        aria-label={`Choose ${entityLabel} CSV file`}
        onChange={(event) => setFile(event.target.files?.[0] || null)}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={disabled}
        title={`Choose ${entityLabel} CSV file`}
        aria-label={`Choose ${entityLabel} CSV file`}
        className="entity-admin-button inline-flex h-10 items-center justify-center rounded-lg border border-slate-700 px-4 text-sm text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Upload size={16} />
      </button>
      <button
        type="button"
        onClick={importFile}
        disabled={disabled || !file}
        title={`Import ${entityLabel}`}
        aria-label={`Import ${entityLabel}`}
        className="entity-admin-button inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 text-sm text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download size={16} className="rotate-180" />
      </button>
    </div>
  );
};

export default CsvImportControls;
