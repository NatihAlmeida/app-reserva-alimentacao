import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

export default function Modal({ isOpen, onClose, children, title }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          {title && <h3 className="text-xl font-bold text-gray-800">{title}</h3>}
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <FaTimes className="text-gray-500 text-xl" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}