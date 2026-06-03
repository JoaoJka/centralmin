import { useToast } from '../contexts/ToastContext';

const Toast = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 2000 }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          style={{
            background: toast.type === 'success' ? '#064e3b' : toast.type === 'error' ? '#450a0a' : '#1e3a5f',
            color: toast.type === 'success' ? '#6ee7b7' : toast.type === 'error' ? '#fca5a5' : '#93c5fd',
            padding: '12px 20px',
            borderRadius: 10,
            marginBottom: 8,
            fontSize: 13,
            fontWeight: 500,
            border: `1px solid ${toast.type === 'success' ? '#059669' : toast.type === 'error' ? '#7f1d1d' : '#2563eb'}`,
            cursor: 'pointer',
            animation: 'toastIn 0.3s ease'
          }}
        >
          {toast.message}
        </div>
      ))}
      <style>{`
        @keyframes toastIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Toast;