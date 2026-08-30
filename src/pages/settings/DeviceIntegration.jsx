import React, { useState, useEffect, useCallback } from "react";
import deviceApi from "../../api/deviceApi";
import DeviceList from "./tabs/DeviceList";
import DeviceSync from "./tabs/DeviceSync";
import TeacherEnrollment from "./tabs/TeacherEnrollment";
import AttendanceRecords from "./tabs/AttendanceRecords";
import DeviceSettings from "./tabs/DeviceSettings";

const DeviceIntegration = () => {
  const [activeTab, setActiveTab] = useState("devices");
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load devices on mount and on refresh
  useEffect(() => {
    loadDevices();
  }, [refreshTrigger]);

  const loadDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await deviceApi.listDevices();
      setDevices(response.devices || []);
      if (response.devices?.length > 0 && !selectedDevice) {
        setSelectedDevice(response.devices[0]);
      }
    } catch (err) {
      setError(err.message || "Failed to load devices");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleDeviceCreated = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  const handleDeviceSelected = useCallback((device) => {
    setSelectedDevice(device);
  }, []);

  const tabs = [
    { id: "devices", label: "🖥️ Devices", icon: "📱" },
    { id: "sync", label: "🔄 Sync", icon: "⚙️" },
    { id: "enrollment", label: "👥 Enrollment", icon: "📋" },
    { id: "attendance", label: "📊 Attendance", icon: "✓" },
    { id: "settings", label: "⚙️ Settings", icon: "🛠️" },
  ];

  return (
    <div className="p-6 min-h-screen" style={{ background: "var(--bg-main)" }}>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-4xl font-bold mb-2"
          style={{ color: "var(--text-1)" }}
        >
          🔐 Device Integration Module
        </h1>
        <p style={{ color: "var(--text-2)" }}>
          Manage biometric and access control devices for automatic teacher
          attendance tracking
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300">⚠️ {error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium transition-all border-b-2 ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Container */}
      <div
        className="rounded-lg shadow-lg p-6"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
        }}
      >
        {loading && !devices.length ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <p className="text-slate-600 dark:text-slate-400">
                Loading devices...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Devices Tab */}
            {activeTab === "devices" && (
              <DeviceList
                devices={devices}
                selectedDevice={selectedDevice}
                onDeviceSelected={handleDeviceSelected}
                onDeviceCreated={handleDeviceCreated}
                onRefresh={handleRefresh}
              />
            )}

            {/* Sync Tab */}
            {activeTab === "sync" && (
              <DeviceSync
                devices={devices}
                selectedDevice={selectedDevice}
                onDeviceSelected={handleDeviceSelected}
                onRefresh={handleRefresh}
              />
            )}

            {/* Enrollment Tab */}
            {activeTab === "enrollment" && (
              <TeacherEnrollment
                devices={devices}
                selectedDevice={selectedDevice}
                onDeviceSelected={handleDeviceSelected}
                onRefresh={handleRefresh}
              />
            )}

            {/* Attendance Tab */}
            {activeTab === "attendance" && (
              <AttendanceRecords
                devices={devices}
                selectedDevice={selectedDevice}
                onDeviceSelected={handleDeviceSelected}
              />
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <DeviceSettings
                devices={devices}
                selectedDevice={selectedDevice}
                onDeviceSelected={handleDeviceSelected}
                onRefresh={handleRefresh}
              />
            )}
          </>
        )}
      </div>

      {/* Footer Info */}
      <div
        className="mt-8 p-4 rounded-lg"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          ℹ️ <strong>Note:</strong> Devices are automatically synced every 5
          minutes. Manual sync can be triggered from the Sync tab. Late
          attendance is marked for punches after 10:10 AM Nepal time. Duplicate
          punches within 60 seconds are filtered automatically.
        </p>
      </div>
    </div>
  );
};

export default DeviceIntegration;
