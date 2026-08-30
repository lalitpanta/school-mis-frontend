import SuperAdminSidebar from "./SuperAdminSidebar";

const SuperAdminLayout = ({ children }) => (
  <div
    className="flex h-screen overflow-hidden"
    style={{ background: "var(--bg-main)" }}
  >
    <SuperAdminSidebar />
    <main className="flex-1 overflow-y-auto">{children}</main>
  </div>
);

export default SuperAdminLayout;
