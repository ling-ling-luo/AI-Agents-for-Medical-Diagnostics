import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;

  title?: string;
  subtitle?: string;
  headerIcon?: ReactNode;

  children: ReactNode;

  footer?: ReactNode;

  maxWidthClass?: string; // e.g. "max-w-3xl"
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
}

export const BaseModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  headerIcon,
  children,
  footer,
  maxWidthClass = 'max-w-3xl',
  closeOnBackdrop = true,
  closeOnEsc = true,
}: BaseModalProps) => {
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={`bg-white rounded-none shadow-2xl ${maxWidthClass} w-full max-h-[90vh] flex flex-col slide-in border border-gray-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || subtitle || headerIcon) && (
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {headerIcon && (
                  <div className="w-12 h-12 rounded-none flex items-center justify-center border border-gray-200">
                    {headerIcon}
                  </div>
                )}
                {(title || subtitle) && (
                  <div>
                    {title && <h2 className="text-xl font-semibold text-gray-800">{title}</h2>}
                    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-none transition-colors"
                aria-label="关闭"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-8 py-5 border-t border-gray-200 flex justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
