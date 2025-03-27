'use client';

import React, { createContext, useEffect, useRef, useState } from 'react';

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Partial<Toast>) => string;
  dismissToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Omit<Toast, 'id'>>) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined
);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach((timeout) =>
        clearTimeout(timeout)
      );
    };
  }, []);

  const showToast = (toast: Partial<Toast>) => {
    const id = crypto.randomUUID();
    const newToast = {
      id,
      message: toast.message || '',
      type: toast.type || 'info',
      duration: toast.duration ?? 5000,
      progress: toast.progress,
    };

    setToasts((prev) => [...prev, newToast]);

    if (toast.duration !== -1) {
      timeoutsRef.current[id] = setTimeout(() => {
        dismissToast(id);
      }, toast.duration);
    }

    return id;
  };

  const dismissToast = (id: string) => {
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
      delete timeoutsRef.current[id];
    }

    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const updateToast = (id: string, updates: Partial<Omit<Toast, 'id'>>) => {
    setToasts((prev) => {
      const toastToUpdate = prev.find((toast) => toast.id === id);

      if (
        !toastToUpdate ||
        (updates.progress !== undefined &&
          toastToUpdate.progress === updates.progress) ||
        Object.keys(updates).length === 0
      ) {
        return prev;
      }

      return prev.map((toast) => {
        if (toast.id === id) {
          const updatedToast = { ...toast, ...updates };

          if (updates.progress === 100) {
            if (timeoutsRef.current[id]) {
              clearTimeout(timeoutsRef.current[id]);
            }

            timeoutsRef.current[id] = setTimeout(() => {
              dismissToast(id);
            }, 1000);
          }

          return updatedToast;
        }
        return toast;
      });
    });
  };

  return (
    <ToastContext.Provider
      value={{ toasts, showToast, dismissToast, updateToast }}
    >
      {children}
    </ToastContext.Provider>
  );
};
