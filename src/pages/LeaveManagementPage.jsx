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
  RotateCw,
} from "lucide-react";
import clsx from "clsx";

const LeaveManagementPage = () => {
  const { isAdmin, isTenant } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    leave_type: "Other",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const [reviewData, setReviewData] = useState({
    status: "",
    admin_reply: "",
  });

  const isUserAdmin = isAdmin() || isTenant();

  useEffect(() => {
    fetchLeaves();
  }, [isUserAdmin]);

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
    if (
      !formData.start_date ||
      !formData.end_date ||
      formData.end_date < formData.start_date ||
      !formData.reason.trim()
    ) {
      toast.error("Enter a valid date range and reason");
      return;
    }

    try {
      setRequestSubmitting(true);
      const res = await axiosInstance.post("/v1/leave", formData);
      if (res.data.success) {
        toast.success("Leave requested successfully");
        setShowRequestModal(false);
        setFormData({
          leave_type: "Other",
          start_date: "",
          end_date: "",
          reason: "",
        });
        fetchLeaves();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setRequestSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewData.status) {
      toast.error("Please select a status");
      return;
    }

    try {
      setReviewSubmitting(true);
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
    } finally {
      setReviewSubmitting(false);
    }
  };

  const openReviewModal = (leave) => {
    setSelectedLeave(leave);
    setReviewData({
      status: leave.status,
      admin_reply: leave.admin_reply || "",
    });
    setShowReviewModal(true);
  };

  const filteredLeaves = leaves.filter((l) => l.status === activeTab);

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="px-2.5 py-1 rounded-full bg-success text-success text-xs font-bold border border-success">
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="px-2.5 py-1 rounded-full bg-danger-soft text-danger text-xs font-bold border border-danger">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-warning-soft text-warning text-xs font-bold border border-warning">
            Pending
          </span>
        );
    }
  };

  return (
    <div
      className="w-full px-4 py-6 md:px-6"
      style={{
        background: "var(--bg-page)",
        minHeight: "100vh",
        color: "var(--text-primary)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Leave Management
            </h1>
            <p className="text-sm text-muted mt-1">
              {isUserAdmin
                ? "Review student, teacher, and staff leave requests"
                : "Request and track your leaves"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchLeaves}
              disabled={loading}
              title="Refresh leave requests"
              aria-label="Refresh leave requests"
              className="rounded-xl border border-default p-2.5 text-muted transition hover:border-accent hover:text-primary disabled:opacity-50"
            >
              <RotateCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            {!isUserAdmin && (
              <button
                onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent text-primary font-semibold rounded-xl shadow-lg transition-all"
              >
                <Plus size={18} /> Request Leave
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div
            className="mis-card p-6 flex items-center gap-4 cursor-pointer hover:border-warning transition-all"
            onClick={() => setActiveTab("pending")}
          >
            <div className="w-12 h-12 rounded-xl bg-warning-soft text-warning flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {leaves.filter((l) => l.status === "pending").length}
              </div>
              <div className="text-sm font-medium text-muted">Pending</div>
            </div>
          </div>
          <div
            className="mis-card p-6 flex items-center gap-4 cursor-pointer hover:border-success transition-all"
            onClick={() => setActiveTab("approved")}
          >
            <div className="w-12 h-12 rounded-xl bg-success text-success flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {leaves.filter((l) => l.status === "approved").length}
              </div>
              <div className="text-sm font-medium text-muted">Approved</div>
            </div>
          </div>
          <div
            className="mis-card p-6 flex items-center gap-4 cursor-pointer hover:border-danger transition-all"
            onClick={() => setActiveTab("rejected")}
          >
            <div className="w-12 h-12 rounded-xl bg-danger-soft text-danger flex items-center justify-center">
              <XCircle size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {leaves.filter((l) => l.status === "rejected").length}
              </div>
              <div className="text-sm font-medium text-muted">Rejected</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 border-b border-default mb-6">
          {["pending", "approved", "rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "pb-3 text-sm font-semibold capitalize transition-all relative",
                activeTab === tab
                  ? "text-accent"
                  : "text-muted hover:text-primary",
              )}
            >
              {tab} Leaves
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
              )}
            </button>
          ))}
        </div>

        {/* Leave List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-accent border-t-accent rounded-full animate-spin"></div>
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="col-span-full py-12 text-center mis-card">
              <FileText
                size={48}
                className="mx-auto mb-4 text-muted opacity-50"
              />
              <p className="text-muted font-medium">
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
                    <div className="w-10 h-10 rounded-full bg-subtle flex items-center justify-center text-accent font-bold border border-default">
                      <User size={18} />
                    </div>
                    <div>
                      <h3 className="text-primary font-semibold text-sm">
                        {leave.user_name || "Unknown"}
                      </h3>
                      <p className="text-xs text-muted">
                        {leave.user_email || "No email"}
                      </p>
                      <p className="text-xs text-accent">
                        {leave.requester_type || "User"}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(leave.status)}
                </div>

                <div className="flex-1 space-y-3 mb-4">
                  <div>
                    <p className="text-xs text-muted font-semibold mb-1 uppercase tracking-wider">
                      Leave type
                    </p>
                    <p className="text-sm text-muted">
                      {leave.leave_type || "Other"}
                    </p>
                  </div>
                  <div className="bg-surface p-3 rounded-xl border border-default">
                    <div className="flex items-center gap-2 text-xs text-muted mb-1">
                      <CalendarIcon size={14} /> <span>Duration</span>
                    </div>
                    <p className="text-sm font-medium text-primary">
                      {new Date(leave.start_date).toLocaleDateString()}{" "}
                      <span className="text-muted mx-1">to</span>{" "}
                      {new Date(leave.end_date).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted font-semibold mb-1 uppercase tracking-wider">
                      Reason
                    </p>
                    <p className="text-sm text-muted line-clamp-2">
                      {leave.reason}
                    </p>
                  </div>

                  {leave.admin_reply && (
                    <div className="mt-3 p-3 rounded-xl bg-accent-soft border border-accent relative">
                      <MessageSquare
                        size={12}
                        className="absolute top-3 right-3 text-accent"
                      />
                      <p className="text-xs text-accent font-semibold mb-1 uppercase tracking-wider">
                        Admin Reply
                      </p>
                      <p className="text-sm text-accent">
                        {leave.admin_reply}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-default flex justify-between items-center">
                  <span className="text-xs text-muted">
                    Requested: {new Date(leave.created_at).toLocaleDateString()}
                  </span>

                  {isUserAdmin && leave.status === "pending" && (
                    <button
                      onClick={() => openReviewModal(leave)}
                      className="text-xs font-bold text-accent hover:text-accent px-3 py-1.5 rounded-lg bg-accent-soft hover:bg-accent-soft transition"
                    >
                      Review
                    </button>
                  )}
                  {isUserAdmin && leave.status !== "pending" && (
                    <button
                      onClick={() => openReviewModal(leave)}
                      className="text-xs font-bold text-muted hover:text-muted px-3 py-1.5 rounded-lg bg-subtle hover:bg-subtle transition"
                    >
                      Manage
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm p-4">
          <div className="bg-surface border border-default rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-default flex justify-between items-center">
              <h2 className="text-lg font-bold text-primary">Request Leave</h2>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-muted hover:text-primary"
              >
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
              <label className="block text-xs text-muted font-semibold">
                Leave Type
                <select
                  value={formData.leave_type}
                  onChange={(e) =>
                    setFormData({ ...formData, leave_type: e.target.value })
                  }
                  className="mt-1 w-full bg-subtle border border-default rounded-xl px-4 py-2 text-primary outline-none focus:border-accent"
                >
                  <option>Other</option>
                  <option>Sick leave</option>
                  <option>Personal leave</option>
                  <option>Annual leave</option>
                  <option>Family emergency</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted font-semibold mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    max={formData.end_date || undefined}
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="w-full bg-subtle border border-default rounded-xl px-4 py-2 text-primary outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted font-semibold mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    min={formData.start_date || undefined}
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="w-full bg-subtle border border-default rounded-xl px-4 py-2 text-primary outline-none focus:border-accent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted font-semibold mb-1">
                  Reason for leave
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={2000}
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  className="w-full bg-subtle border border-default rounded-xl px-4 py-3 text-primary outline-none focus:border-accent resize-none"
                  placeholder="Provide details..."
                ></textarea>
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-subtle text-primary font-medium hover:bg-subtle transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-primary font-medium hover:bg-accent transition disabled:opacity-50"
                >
                  {requestSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Leave Modal (Admin) */}
      {showReviewModal && selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm p-4">
          <div className="bg-surface border border-default rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-default flex justify-between items-center">
              <h2 className="text-lg font-bold text-primary">
                Review Leave Request
              </h2>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-muted hover:text-primary"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 border-b border-default bg-subtle">
              <div className="flex gap-4 items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-accent-soft text-accent flex items-center justify-center font-bold">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-primary">
                    {selectedLeave.user_name}
                  </h3>
                  <p className="text-xs text-muted">
                    {selectedLeave.user_email}
                  </p>
                  <p className="text-xs text-accent">
                    {selectedLeave.requester_type || "User"} ·{" "}
                    {selectedLeave.leave_type || "Other"}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted">
                <p>
                  <span className="text-muted w-24 inline-block">
                    Duration:
                  </span>{" "}
                  <span className="font-semibold text-primary">
                    {new Date(selectedLeave.start_date).toLocaleDateString()} to{" "}
                    {new Date(selectedLeave.end_date).toLocaleDateString()}
                  </span>
                </p>
                <p className="flex items-start">
                  <span className="text-muted w-24 inline-block shrink-0">
                    Reason:
                  </span>{" "}
                  <span>{selectedLeave.reason}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-muted font-semibold mb-2">
                  Action
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <label
                    className={clsx(
                      "flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all",
                      reviewData.status === "pending"
                        ? "bg-warning-soft border-warning text-warning"
                        : "bg-subtle border-default text-muted hover:border-default",
                    )}
                  >
                    <input
                      type="radio"
                      name="status"
                      value="pending"
                      checked={reviewData.status === "pending"}
                      onChange={(e) =>
                        setReviewData({ ...reviewData, status: e.target.value })
                      }
                      className="hidden"
                    />
                    <Clock size={18} />{" "}
                    <span className="font-medium">Pending</span>
                  </label>
                  <label
                    className={clsx(
                      "flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all",
                      reviewData.status === "approved"
                        ? "bg-success border-success text-success"
                        : "bg-subtle border-default text-muted hover:border-default",
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
                        ? "bg-danger-soft border-danger text-danger"
                        : "bg-subtle border-default text-muted hover:border-default",
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
                <label className="block text-xs text-muted font-semibold mb-1">
                  Reply Message (Optional)
                </label>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={reviewData.admin_reply}
                  onChange={(e) =>
                    setReviewData({
                      ...reviewData,
                      admin_reply: e.target.value,
                    })
                  }
                  className="w-full bg-subtle border border-default rounded-xl px-4 py-3 text-primary outline-none focus:border-accent resize-none"
                  placeholder="Provide feedback or reason..."
                ></textarea>
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-subtle text-primary font-medium hover:bg-subtle transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-primary font-medium hover:bg-accent transition disabled:opacity-50"
                >
                  {reviewSubmitting ? "Saving..." : "Save Review"}
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
