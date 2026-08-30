import { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import Toast from './components/common/Toast';
import { AuthProvider }  from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { ThemeProvider }  from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { RolesPermissionsProvider } from './context/RolesPermissionsContext';

function App() {
  return (
    <ThemeProvider>
      <TenantProvider>
        <SettingsProvider>
          <AuthProvider>
            <RolesPermissionsProvider>
              <AppRoutes />
              <Toast />
            </RolesPermissionsProvider>
          </AuthProvider>
        </SettingsProvider>
      </TenantProvider>
    </ThemeProvider>
  );
}


export default App;
