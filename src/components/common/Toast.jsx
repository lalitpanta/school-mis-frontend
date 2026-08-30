import { Toaster } from 'react-hot-toast';

/**
 * Toast — renders the react-hot-toast container.
 * Place <Toast /> once at the app root.
 * Use `import toast from 'react-hot-toast'` in any component to trigger toasts.
 */
const Toast = () => (
  <Toaster
    position="top-right"
    toastOptions={{
      duration: 4000,
      style: {
        background: '#1e293b',
        color:      '#f1f5f9',
        border:     '1px solid #334155',
        borderRadius: '12px',
        fontSize:   '14px',
      },
      success: {
        iconTheme: { primary: '#6366f1', secondary: '#fff' },
      },
      error: {
        iconTheme: { primary: '#ef4444', secondary: '#fff' },
      },
    }}
  />
);

export default Toast;
