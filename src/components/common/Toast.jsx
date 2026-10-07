import { Toaster } from "react-hot-toast";

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
        background: "var(--bg-surface)",
        color: "var(--text-primary)",
        border: "1px solid var(--border-default)",
        borderRadius: "12px",
        fontSize: "14px",
      },
      success: {
        iconTheme: { primary: "var(--accent)", secondary: "var(--text-primary)" },
      },
      error: {
        iconTheme: { primary: "var(--danger)", secondary: "var(--text-primary)" },
      },
    }}
  />
);

export default Toast;
