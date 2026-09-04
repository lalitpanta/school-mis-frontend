// DashboardHeader: simplified title-only header

const DashboardHeader = ({ title = 'Dashboard' }) => {
  // Dashboard header simplified: title only. Branding and logo are shown in the main navbar.

  return (
    <div className="flex items-center justify-between mb-8 px-6 py-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', boxShadow: 'var(--shadow-card)' }}>
      <div>
        <h1 className="mis-page-title">{title}</h1>
      </div>
    </div>
  );
};

export default DashboardHeader;
