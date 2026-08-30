import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Pencil,
  Mail,
  Phone,
  MapPin,
  Globe,
  Building,
  Flag,
  Plus,
  Trash2,
} from "lucide-react";
import Button from "../common/Button";
import useSettings from "../../hooks/useSettings";

const fields = [
  { name: "name", label: "School Name", required: true },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone" },
  { name: "address", label: "Address", full: true },
  { name: "website", label: "Website URL" },
  { name: "motto", label: "School Motto", full: true },
  { name: "country", label: "Country" },
  { name: "total_floors", label: "Total Floors", type: "number" },
];

const SchoolProfile = () => {
  const { school, saveSchool } = useSettings();
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState(school?.logo || null);
  const [editing, setEditing] = useState(false);
  const [blocks, setBlocks] = useState(school?.blocks || []);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ defaultValues: {} });

  useEffect(() => {
    if (school) {
      const initial = { ...school };
      if (initial.established) {
        try {
          const d = new Date(initial.established);
          if (!isNaN(d)) initial.established = d.toISOString().slice(0, 10);
        } catch {}
      }
      reset(initial);
      setLogoPreview(initial.logo || null);
      setBlocks(Array.isArray(initial.blocks) ? initial.blocks : []);
    }
  }, [school, reset]);

  const updateBlock = (index, key, value) => {
    setBlocks((current) =>
      current.map((block, idx) =>
        idx === index ? { ...block, [key]: value } : block,
      ),
    );
  };

  const addBlock = () => {
    setBlocks((current) => [...current, { block_name: "", floor_count: 1 }]);
  };

  const removeBlock = (index) => {
    setBlocks((current) => current.filter((_, idx) => idx !== index));
  };

  const onSubmit = async (data) => {
    setSaving(true);
    if (logoPreview) data.logo = logoPreview;
    if (data.total_floors !== undefined && data.total_floors !== "") {
      data.total_floors = Math.max(1, parseInt(data.total_floors, 10) || 1);
    }

    const validBlocks = blocks
      .map((block) => ({
        block_name: block.block_name?.trim(),
        floor_count: Math.max(1, parseInt(block.floor_count, 10) || 1),
      }))
      .filter((block) => block.block_name);

    data.blocks = validBlocks;
    if (validBlocks.length > 0) {
      data.total_floors = validBlocks.reduce(
        (sum, block) => sum + block.floor_count,
        0,
      );
    } else if (blocks.length === 0) {
      data.total_floors = 0;
    }

    try {
      await saveSchool(data);
      toast.success("School profile updated!");
      setEditing(false);
    } catch (err) {
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const establishedYear = school?.established
    ? new Date(school.established).getFullYear()
    : null;
  const yearsInOperation = establishedYear
    ? Math.max(0, new Date().getFullYear() - establishedYear)
    : null;
  const statusLabel =
    school?.is_active === false ? "Inactive Institution" : "Active Institution";

  return (
    <div className="rounded-2xl p-6 bg-slate-900 border border-slate-700/70 shadow-xl">
      {school && !editing ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                {school.logo ? (
                  <img
                    src={school.logo}
                    alt="School Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-slate-500 text-3xl font-bold">
                    {(school.name || "S").slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {school.name || "School Name"}
                </h2>
                <p className="text-sm text-slate-400">
                  Established{" "}
                  {school.established
                    ? new Date(school.established).toLocaleDateString()
                    : "—"}
                </p>
                <span className="inline-flex items-center px-3 py-1 mt-3 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-200 border border-emerald-500/20">
                  {statusLabel}
                </span>
              </div>
            </div>

            <div className="self-center md:self-start">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition"
              >
                <Pencil size={16} /> Edit Profile
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5">
              <div className="flex items-center gap-3 text-slate-300 mb-4">
                <Mail size={18} />
                <span className="font-semibold text-slate-200">Email</span>
              </div>
              <p className="text-white wrap-break-word">
                {school.email || "—"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5">
              <div className="flex items-center gap-3 text-slate-300 mb-4">
                <Phone size={18} />
                <span className="font-semibold text-slate-200">Phone</span>
              </div>
              <p className="text-white">{school.phone || "—"}</p>
            </div>
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5">
              <div className="flex items-center gap-3 text-slate-300 mb-4">
                <MapPin size={18} />
                <span className="font-semibold text-slate-200">Address</span>
              </div>
              <p className="text-white wrap-break-word">
                {school.address || "—"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5">
              <div className="flex items-center gap-3 text-slate-300 mb-4">
                <Globe size={18} />
                <span className="font-semibold text-slate-200">Website</span>
              </div>
              {school.website ? (
                <a
                  href={
                    school.website.startsWith("http")
                      ? school.website
                      : `https://${school.website}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-300 hover:text-sky-200 transition break-all"
                >
                  {school.website}
                </a>
              ) : (
                <p className="text-white">—</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5 text-center">
              <div className="text-slate-400 uppercase text-xs tracking-[0.16em]">
                Total Floors
              </div>
              <div className="mt-3 text-3xl font-bold text-white">
                {school.total_floors || "—"}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5 text-center">
              <div className="text-slate-400 uppercase text-xs tracking-[0.16em]">
                In Operation
              </div>
              <div className="mt-3 text-3xl font-bold text-white">
                {yearsInOperation !== null ? `${yearsInOperation} yrs` : "—"}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5 text-center">
              <div className="flex items-center justify-center gap-2 text-slate-400 uppercase text-xs tracking-[0.16em]">
                <Flag size={14} /> Country
              </div>
              <div className="mt-3 text-3xl font-bold text-white">
                {school.country || "NP"}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5">
            <div className="flex items-center gap-3 text-slate-300 mb-4">
              <Globe size={18} />
              <span className="font-semibold text-slate-200">School Motto</span>
            </div>
            <p className="text-slate-100 italic">
              {school.motto || "No motto available."}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Building size={18} /> Blocks & Floors
            </div>
            {school.blocks && school.blocks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {school.blocks.map((block, index) => (
                  <div
                    key={`${block.block_name}-${index}`}
                    className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm text-slate-400 uppercase tracking-[0.16em]">
                          Block
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {block.block_name}
                        </div>
                      </div>
                      <div className="text-xs text-slate-300">
                        {block.floor_count || block.floors?.length || 0} Floors
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(
                        block.floors ||
                        Array.from(
                          { length: block.floor_count || 0 },
                          (_, idx) => idx + 1,
                        )
                      ).map((floor) => (
                        <span
                          key={floor}
                          className="rounded-full bg-slate-700 text-slate-200 px-3 py-1 text-xs"
                        >
                          Floor {floor}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5 text-slate-300">
                No block and floor configuration has been defined yet.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Edit School Profile
              </h2>
              <p className="text-sm text-slate-400">
                Update school metadata, contact details, and block/floor
                structure.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 rounded-full bg-slate-700 text-slate-100 border border-slate-600 hover:bg-slate-600 transition"
            >
              Cancel
            </button>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {fields.map(({ name, label, type = "text", required, full }) => (
              <div key={name} className={full ? "md:col-span-2" : ""}>
                <label className="mis-label">
                  {label}
                  {required && " *"}
                </label>
                <input
                  type={type}
                  {...register(
                    name,
                    required ? { required: `${label} is required` } : {},
                  )}
                  className="mis-input"
                />
                {errors[name] && (
                  <p className="text-xs mt-1" style={{ color: "#f87171" }}>
                    {errors[name].message}
                  </p>
                )}
              </div>
            ))}

            <div>
              <label className="mis-label">Established Date</label>
              <input
                type="date"
                {...register("established")}
                className="mis-input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mis-label">Logo</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setLogoPreview(reader.result);
                    reader.readAsDataURL(file);
                  }}
                  className="text-slate-200"
                />
                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt="logo"
                    className="w-20 h-20 rounded-xl object-contain border border-slate-700"
                  />
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-slate-400 uppercase tracking-[0.16em]">
                    Blocks
                  </div>
                  <div className="text-lg font-semibold text-white">
                    Manage school blocks and floor counts
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addBlock}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700 transition"
                >
                  <Plus size={16} /> Add Block
                </button>
              </div>
              <div className="space-y-4">
                {blocks.length === 0 && (
                  <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5 text-slate-300">
                    No blocks defined yet. Add a block to start organizing
                    floors.
                  </div>
                )}
                {blocks.map((block, index) => (
                  <div
                    key={`block-${index}`}
                    className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end"
                  >
                    <div className="sm:col-span-2">
                      <label className="mis-label">Block Name</label>
                      <input
                        type="text"
                        value={block.block_name}
                        onChange={(event) =>
                          updateBlock(index, "block_name", event.target.value)
                        }
                        className="mis-input"
                      />
                    </div>
                    <div>
                      <label className="mis-label">Floors</label>
                      <input
                        type="number"
                        min="1"
                        value={block.floor_count}
                        onChange={(event) =>
                          updateBlock(index, "floor_count", event.target.value)
                        }
                        className="mis-input"
                      />
                    </div>
                    <div className="sm:col-span-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeBlock(index)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-rose-600/10 text-rose-200 border border-rose-500/20 hover:bg-rose-600/15 transition"
                      >
                        <Trash2 size={16} /> Remove Block
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col sm:flex-row sm:justify-end gap-3">
              <Button type="submit" loading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SchoolProfile;
