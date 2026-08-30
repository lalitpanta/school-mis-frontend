// DashboardHeader: simplified title-only header

const DashboardHeader = ({ title = 'Dashboard' }) => {
  // Dashboard header simplified: title only. Branding and logo are shown in the main navbar.

  return (
    <div className="flex items-center justify-between mb-8 px-6 py-4 rounded-xl" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
      </div>
    </div>
  );
};

export default DashboardHeader;
