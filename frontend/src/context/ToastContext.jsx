import { createContext, useCallback, useContext, useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { FiCheckCircle, FiAlertTriangle, FiInfo, FiXCircle } from 'react-icons/fi';

const ToastContext = createContext(() => {});

const ICONS = { success: FiCheckCircle, danger: FiXCircle, warning: FiAlertTriangle, info: FiInfo };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((message, variant = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, variant }]);
  }, []);

  const close = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <ToastContainer position="top-end" className="p-3 slk-toasts">
        {toasts.map((t) => {
          const Icon = ICONS[t.variant] || FiInfo;
          return (
            <Toast key={t.id} onClose={() => close(t.id)} delay={4500} autohide className={`slk-toast slk-toast-${t.variant}`}>
              <Toast.Body className="d-flex align-items-start gap-2">
                <Icon className="flex-shrink-0 mt-1" />
                <span className="flex-grow-1">{t.message}</span>
                <button type="button" className="btn-close btn-close-sm" aria-label="Close" onClick={() => close(t.id)} />
              </Toast.Body>
            </Toast>
          );
        })}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
