import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Toast 타입별 스타일
const TOAST_STYLES = {
  success: {
    bg: 'bg-success/10',
    border: 'border-success/20',
    text: 'text-success',
    icon: '✅'
  },
  error: {
    bg: 'bg-danger/10',
    border: 'border-danger/20', 
    text: 'text-danger',
    icon: '❌'
  },
  warning: {
    bg: 'bg-warning/10',
    border: 'border-warning/20',
    text: 'text-warning', 
    icon: '⚠️'
  },
  info: {
    bg: 'bg-info/10',
    border: 'border-info/20',
    text: 'text-info',
    icon: 'ℹ️'
  }
};

// 개별 Toast 컴포넌트
function ToastItem({ toast, onRemove }) {
  const [isVisible, setIsVisible] = useState(false);
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;

  useEffect(() => {
    // 마운트 시 애니메이션
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // 자동 제거
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, toast.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out mb-2
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${style.bg} ${style.border} border rounded-lg p-4 shadow-lg backdrop-blur-sm
        max-w-sm w-full
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{style.icon}</span>
        
        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4 className={`font-semibold ${style.text} mb-1`}>
              {toast.title}
            </h4>
          )}
          <p className="text-sm text-text leading-relaxed">
            {toast.message}
          </p>
        </div>

        <button
          onClick={handleClose}
          className="text-textSecondary hover:text-text transition-colors flex-shrink-0 ml-2"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Toast 컨테이너
export default function ToastContainer({ toasts, removeToast }) {
  if (!toasts.length) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <div className="pointer-events-auto">
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </div>,
    document.body
  );
}