'use client';

import Toast from './_components/Toast';
import { useToast } from '@/app/_hooks/useToast';

export const ToastContainer = () => {
  const { toasts } = useToast();

  return (
    <div className='fixed bottom-0 right-0 z-50 flex flex-col justify-end gap-2 p-4 pt-8'>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          progress={toast.progress}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
