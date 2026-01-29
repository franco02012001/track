'use client';

import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export default function Modal({ isOpen, onClose, title, children, size = 'md', showCloseButton = true }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto safe-area-pb"
      onClick={onClose}
    >
      <div 
        className={`bg-white dark:bg-dark-card-bg rounded-xl ${sizeClasses[size]} w-full max-h-[90vh] my-4 sm:my-8 shadow-2xl transform transition-all flex flex-col min-h-0`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200 dark:border-dark-border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-dark-card-bg dark:to-dark-card-bg">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-dark-text-primary truncate">{title}</h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 -m-2 text-gray-400 dark:text-dark-text-secondary hover:text-gray-600 dark:hover:text-slate-200 transition rounded-lg hover:bg-white dark:hover:bg-dark-hover min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}
