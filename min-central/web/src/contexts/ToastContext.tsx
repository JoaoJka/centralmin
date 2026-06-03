import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ToastMessage, ToastType } from '../types';

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (message: string, type: ToastType) => void;
  removeToast: (id: number) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 2000 }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{ 
            background: toast.type === 'success' ? '#064e3b' : toast.type === 'error' ? '#450a0a' : '#1e3a5f',
            color: toast.type === 'success' ? '#6ee7b7' : toast.type === 'error' ? '#fca5a5' : '#93c5fd',
            padding: '12px 20px', borderRadius: 10, marginBottom: 8, fontSize: 13, fontWeight: 500,
            border: `1px solid ${toast.type === 'success' ? '#059669' : toast.type === 'error' ? '#7f1d1d' : '#2563eb'}`,
            animation: 'toastIn 0.3s ease'
          }}>
            {toast.message}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
};