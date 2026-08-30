import React from "react";
import ResultManagementModule from "../components/settings/ResultManagementModule";

const ResultManagement = () => {
  return (
    <div className="w-full px-4 py-6 md:px-6">
      <div className="mx-auto w-full max-w-7xl rounded-3xl border border-slate-700/70 bg-[#0f172a] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="max-h-[calc(100vh-9rem)] overflow-y-auto p-4 md:p-6">
          <ResultManagementModule moduleType="marks" />
        </div>
      </div>
    </div>
  );
};

export default ResultManagement;
