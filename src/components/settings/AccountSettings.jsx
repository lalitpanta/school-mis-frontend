import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { getAllSettings, updateSettings } from "../../api/settingsApi";

const initial = {
  institution_name: "",
  institution_address: "",
  institution_phone: "",
  institution_email: "",
  institution_pan: "",
  invoice_prefix: "INV",
  receipt_prefix: "REC",
  invoice_title: "Fee Invoice",
  receipt_title: "Payment Receipt",
  currency: "NPR",
  tax_enabled: false,
  tax_name: "",
  tax_rate: "0",
  invoice_footer: "",
  invoice_terms: "",
};

export default function AccountSettings() {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getAllSettings()
      .then((response) => {
        const settings = response.data?.data || {};
        const invoice =
          typeof settings.invoice_config === "string"
            ? JSON.parse(settings.invoice_config)
            : settings.invoice_config;
        setForm((current) => ({ ...current, ...(invoice || {}) }));
      })
      .catch(() => setStatus("Unable to load account settings."));
  }, []);

  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      await updateSettings({ invoice_config: form });
      setStatus("Account settings saved.");
    } catch (error) {
      setStatus(
        error.response?.data?.message || "Unable to save account settings.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="acc-settings" onSubmit={save}>
      <div className="acc-section-row">
        <div>
          <div className="acc-section-title">Account Settings</div>
          <div className="acc-muted">
            Institution, invoice, receipt, and configurable tax presentation
          </div>
        </div>
        <button className="acc-btn acc-btn-primary" disabled={busy}>
          <Save size={15} /> {busy ? "Saving..." : "Save settings"}
        </button>
      </div>
      {status && <div className="acc-settings-message">{status}</div>}
      <div className="acc-settings-grid">
        {[
          ["institution_name", "Institution name"],
          ["institution_address", "Address"],
          ["institution_phone", "Phone"],
          ["institution_email", "Email"],
          ["institution_pan", "PAN"],
          ["invoice_prefix", "Invoice prefix"],
          ["receipt_prefix", "Receipt prefix"],
          ["invoice_title", "Invoice title"],
          ["receipt_title", "Receipt title"],
          ["currency", "Currency"],
        ].map(([key, label]) => (
          <label
            key={key}
            className={key === "institution_address" ? "full" : ""}
          >
            {label}
            <input
              value={form[key]}
              onChange={(event) => set(key, event.target.value)}
            />
          </label>
        ))}
        <label className="toggle">
          <input
            type="checkbox"
            checked={form.tax_enabled}
            onChange={(event) => set("tax_enabled", event.target.checked)}
          />{" "}
          Enable configured tax/levy presentation
        </label>
        <label>
          Tax/levy name
          <input
            value={form.tax_name}
            onChange={(event) => set("tax_name", event.target.value)}
            disabled={!form.tax_enabled}
          />
        </label>
        <label>
          Tax/levy rate
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.tax_rate}
            onChange={(event) => set("tax_rate", event.target.value)}
            disabled={!form.tax_enabled}
          />
        </label>
        <label className="full">
          Receipt footer
          <textarea
            value={form.invoice_footer}
            onChange={(event) => set("invoice_footer", event.target.value)}
          />
        </label>
        <label className="full">
          Terms and conditions
          <textarea
            value={form.invoice_terms}
            onChange={(event) => set("invoice_terms", event.target.value)}
          />
        </label>
      </div>
    </form>
  );
}
