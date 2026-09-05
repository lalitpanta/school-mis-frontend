import { useEffect, useState } from "react";
import FeeManagementPage from "./FeeManagementPage";
import { getPayroll, updatePayrollStatus } from "../api/accountsApi";

const PayrollPanel = () => {
	const [payroll, setPayroll] = useState([]);
	const [error, setError] = useState("");

	const load = () => getPayroll().then((response) => setPayroll(response.data.data || [])).catch(() => setError("Unable to load payroll records."));
	useEffect(() => { load(); }, []);

	const changeStatus = async (id, status) => {
		try {
			await updatePayrollStatus(id, status);
			load();
		} catch (requestError) {
			setError(requestError.response?.data?.message || "Unable to update payroll status.");
		}
	};

	return (
		<div className="h-full overflow-y-auto p-6" style={{ color: "var(--text-1)" }}>
			<h1 className="mb-1 text-2xl font-bold">Payroll</h1>
			<p className="mb-6 text-sm" style={{ color: "var(--text-2)" }}>Manage staff payroll using the existing payroll records.</p>
			{error && <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}
			<div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border-card)", background: "var(--bg-card)" }}>
				<table className="w-full text-left text-sm"><thead><tr className="border-b" style={{ borderColor: "var(--border-card)" }}><th className="p-3">Employee</th><th className="p-3">Period</th><th className="p-3">Net salary</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody>{payroll.map((row) => <tr key={row.id} className="border-b" style={{ borderColor: "var(--border-card)" }}><td className="p-3">{row.employee_name}</td><td className="p-3">{row.pay_month || row.fiscal_year || "-"}</td><td className="p-3">NPR {Number(row.net_salary || 0).toLocaleString("en-IN")}</td><td className="p-3">{row.status}</td><td className="p-3">{row.status === "pending" && <button type="button" onClick={() => changeStatus(row.id, "paid")} className="rounded bg-indigo-600 px-2 py-1 text-xs text-white">Mark paid</button>}</td></tr>)}</tbody></table>
				{!payroll.length && <p className="p-6 text-sm" style={{ color: "var(--text-2)" }}>No payroll records are available.</p>}
			</div>
		</div>
	);
};

const FeePayrollPage = () => {
	const [activeTab, setActiveTab] = useState("fee");
	return (
		<div className="h-full">
			<div className="flex gap-2 border-b px-6 pt-4" style={{ borderColor: "var(--border-card)" }}>
				{[['fee', 'Fee Management'], ['payroll', 'Payroll']].map(([key, label]) => <button key={key} type="button" onClick={() => setActiveTab(key)} className={`border-b-2 px-3 py-2 text-sm font-medium ${activeTab === key ? "border-indigo-500 text-indigo-500" : "border-transparent"}`}>{label}</button>)}
			</div>
			{activeTab === "fee" ? <FeeManagementPage /> : <PayrollPanel />}
		</div>
	);
};

export default FeePayrollPage;