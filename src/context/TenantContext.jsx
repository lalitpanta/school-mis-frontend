import { createContext, useContext, useState, useEffect } from 'react';
import config from '../config/config';

const TenantContext = createContext(null);

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedId = localStorage.getItem(config.TENANT_KEY);
    if (savedId) {
      // You could fetch tenant details from the API here
      setTenant({ id: savedId, name: import.meta.env.VITE_APP_NAME || 'SchoolMIS' });
    }
    setLoading(false);
  }, []);

  const setTenantById = (id) => {
    localStorage.setItem(config.TENANT_KEY, id);
    setTenant((prev) => ({ ...prev, id }));
  };

  const clearTenant = () => {
    localStorage.removeItem(config.TENANT_KEY);
    setTenant(null);
  };

  return (
    <TenantContext.Provider value={{ tenant, loading, setTenantById, clearTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenantContext = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenantContext must be used inside <TenantProvider>');
  return ctx;
};

export default TenantContext;
