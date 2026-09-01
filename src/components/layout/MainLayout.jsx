import Sidebar from './Sidebar';
import Navbar from './Navbar';

const MainLayout = ({ children }) => (
  <div
    className="flex h-screen overflow-hidden"
    style={{ background: 'var(--bg-main)' }}
  >
    <Sidebar />
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      <Navbar />
      <main
        className="flex-1 overflow-y-auto"
        style={{
          background: 'var(--bg-main)',
          color: 'var(--text-1)',
          padding: '1.25rem 1.5rem',
        }}
      >
        {children}
      </main>
    </div>
  </div>
);

export default MainLayout;
