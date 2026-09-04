import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar as CalendarIcon,
  MessageSquare,
  Plus,
  FileText,
} from "lucide-react";
import clsx from "clsx";

const LeaveManagementPage = () => {
  const { isAdmin, token, user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    reason: "",
  });

  const [reviewData, setReviewData] = useState({
    status: "",
    admin_reply: "",
  });

  const isUserAdmin = isAdmin();

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const url = isUserAdmin ? "/v1/leave" : "/v1/leave/my";
      const res = await axiosInstance.get(url);
      if (res.data.success) {
        setLeaves(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch leaves");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date || !formData.reason) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const res = await axiosInstance.post("/v1/leave", formData);
      if (res.data.success) {
        toast.success("Leave requested successfully");
        setShowRequestModal(false);
        setFormData({ start_date: "", end_date: "", reason: "" });
        fetchLeaves();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewData.status) {
      toast.error("Please select a status");
      return;
    }

    try {
      const res = await axiosInstance.put(
        `/v1/leave/${selectedLeave.id}/status`,
        reviewData,
      );
      if (res.data.success) {
        toast.success(`Leave ${reviewData.status} successfully`);
        setShowReviewModal(false);
        setReviewData({ status: "", admin_reply: "" });
        fetchLeaves();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const openReviewModal = (leave) => {
    setSelectedLeave(leave);
    setReviewData({
      status: leave.status === "pending" ? "approved" : leave.status,
      admin_reply: leave.admin_reply || "",
    });
    setShowReviewModal(true);
  };

  const filteredLeaves = leaves.filter((l) => l.status === activeTab);

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold border border-rose-500/20">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
            Pending
          </span>
        );
    }
  };

  return (
    <div
      className="w-full px-4 py-6 md:px-6"
      style={{
        background: "var(--bg-main)",
        minHeight: "100vh",
        color: "var(--text-1)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">
              Leave Management
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {isUserAdmin
                ? "Manage and review staff leave requests"
                : "Request and track your leaves"}
            </p>
          </div>
          {!isUserAdmin && (
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg transition-all"
            >
              <Plus size={18} /> Request Leave
            </button>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div
            className="mis-card p-6 flex items-center gap-4 cursor-pointer hover:border-amber-500/30 transition-all"
            onClick={() => setActiveTab("pending")}
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {leaves.filter((l) => l.status === "pending").length}
              </div>
              <div className="text-sm font-medium text-slate-400">Pending</div>
            </div>
          </div>
          <div
            className="mis-card p-6 flex items-center gap-4 cursor-pointer hover:border-emerald-500/30 transition-all"
            onClick={() => setActiveTab("approved")}
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {leaves.filter((l) => l.status === "approved").length}
              </div>
              <div className="text-sm font-medium text-slate-400">Approved</div>
            </div>
          </div>
          <div
            className="mis-card p-6 flex items-center gap-4 cursor-pointer hover:border-rose-500/30 transition-all"
            onClick={() => setActiveTab("rejected")}
          >
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <XCircle size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {leaves.filter((l) => l.status === "rejected").length}
              </div>
              <div className="text-sm font-medium text-slate-400">Rejected</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 border-b border-slate-800 mb-6">
          {["pending", "approved", "rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "pb-3 text-sm font-semibold capitalize transition-all relative",
                activeTab === tab
                  ? "text-indigo-400"
                  : "text-slate-400 hover:text-slate-200",
              )}
            >
              {tab} Leaves
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
              )}
            </button>
          ))}
        </div>

        {/* Leave List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="col-span-full py-12 text-center mis-card">
              <FileText
                size={48}
                className="mx-auto mb-4 text-slate-600 opacity-50"
              />
              <p className="text-slate-400 font-medium">
                No {activeTab} leave requests found.
              </p>
            </div>
          ) : (
            filteredLeaves.map((leave) => (
              <div
                key={leave.id}
                className="mis-card p-5 flex flex-col hover:border-[var(--accent)] transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-bold border border-slate-700">
                      <User size={18} />
                    </div>
                    <div>
                      <h3 className="text-slate-200 font-semibold text-sm">
                        {leave.user_name || "Unknown"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {leave.user_email || "No email"}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(leave.status)}
                </div>

                <div className="flex-1 space-y-3 mb-4">
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <CalendarIcon size={14} /> <span>Duration</span>
                    </div>
                    <p className="text-sm font-medium text-slate-200">
                      {new Date(leave.start_date).toLocaleDateString()}{" "}
                      <span className="text-slate-500 mx-1">to</span>{" "}
                      {new Date(leave.end_date).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">
                      Reason
                    </p>
                    <p className="text-sm text-slate-300 line-clamp-2">
                      {leave.reason}
                    </p>
                  </div>

                  {leave.admin_reply && (
                    <div className="mt-3 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 relative">
                      <MessageSquare
                        size={12}
                        className="absolute top-3 right-3 text-indigo-500/40"
                      />
                      <p className="text-xs text-indigo-400/70 font-semibold mb-1 uppercase tracking-wider">
                        Admin Reply
                      </p>
                      <p className="text-sm text-indigo-200">
                        {leave.admin_reply}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800/60 flex justify-between items-center">
                  <span className="text-xs text-slate-500">
                    Requested: {new Date(leave.created_at).toLocaleDateString()}
                  </span>

                  {isUserAdmin && leave.status === "pending" && (
                    <button
                      onClick={() => openReviewModal(leave)}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition"
                    >
                      Review
                    </button>
                  )}
                  {isUserAdmin && leave.status !== "pending" && (
                    <button
                      onClick={() => openReviewModal(leave)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-300 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
                    >
                      Edit Reply
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Request Leave Modal (Staff) */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Request Leave</h2>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">
                  Reason for leave
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 resize-none"
                  placeholder="Provide details..."
                ></textarea>
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Leave Modal (Admin) */}
      {showReviewModal && selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">
                Review Leave Request
              </h2>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 border-b border-slate-800/60 bg-slate-900/30">
              <div className="flex gap-4 items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-200">
                    {selectedLeave.user_name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedLeave.user_email}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <p>
                  <span className="text-slate-500 w-24 inline-block">
                    Duration:
                  </span>{" "}
                  <span className="font-semibold text-white">
                    {new Date(selectedLeave.start_date).toLocaleDateString()} to{" "}
                    {new Date(selectedLeave.end_date).toLocaleDateString()}
                  </span>
                </p>
                <p className="flex items-start">
                  <span className="text-slate-500 w-24 inline-block shrink-0">
                    Reason:
                  </span>{" "}
                  <span>{selectedLeave.reason}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">
                  Action
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={clsx(
                      "flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all",
                      reviewData.status === "approved"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                        : "bg-[#1e293b] border-slate-700 text-slate-400 hover:border-slate-600",
                    )}
                  >
                    <input
                      type="radio"
                      name="status"
                      value="approved"
                      checked={reviewData.status === "approved"}
                      onChange={(e) =>
                        setReviewData({ ...reviewData, status: e.target.value })
                      }
                      className="hidden"
                    />
                    <CheckCircle size={18} />{" "}
                    <span className="font-medium">Approve</span>
                  </label>
                  <label
                    className={clsx(
                      "flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all",
                      reviewData.status === "rejected"
                        ? "bg-rose-500/10 border-rose-500 text-rose-400"
                        : "bg-[#1e293b] border-slate-700 text-slate-400 hover:border-slate-600",
                    )}
                  >
                    <input
                      type="radio"
                      name="status"
                      value="rejected"
                      checked={reviewData.status === "rejected"}
                      onChange={(e) =>
                        setReviewData({ ...reviewData, status: e.target.value })
                      }
                      className="hidden"
                    />
                    <XCircle size={18} />{" "}
                    <span className="font-medium">Reject</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">
                  Reply Message (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reviewData.admin_reply}
                  onChange={(e) =>
                    setReviewData({
                      ...reviewData,
                      admin_reply: e.target.value,
                    })
                  }
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 resize-none"
                  placeholder="Provide feedback or reason..."
                ></textarea>
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition"
                >
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagementPage;
