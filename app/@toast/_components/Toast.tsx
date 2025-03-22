'use client';

import {
  VscClose,
  VscError,
  VscInfo,
  VscPass,
  VscWarning,
} from 'react-icons/vsc';

import { useEffect } from 'react';
import { useToast } from '@/app/_hooks/useToast';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  progress?: number;
}

const Toast = ({ id, message, type, progress }: ToastProps) => {
  const { dismissToast } = useToast();

  const icons = {
    info: <VscInfo className='h-6 w-6' />,
    success: <VscPass className='h-6 w-6' />,
    warning: <VscWarning className='h-6 w-6' />,
    error: <VscError className='h-6 w-6' />,
  };

  const classes = {
    info: 'alert-info',
    success: 'alert-success',
    warning: 'alert-warning',
    error: 'alert-error',
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const element = document.getElementById(`toast-${id}`);
      if (element) {
        element.classList.remove('opacity-0');
        element.classList.remove('-translate-y-2');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [id]);

  return (
    <div
      id={`toast-${id}`}
      className={`toast relative -translate-y-2 p-0 opacity-0 transition-all duration-300`}
    >
      <div className={`alert items-start ${classes[type]}`}>
        {icons[type]}
        <div className='flex flex-col gap-2'>
          <div className='flex items-center space-x-3'>
            <p className='w-64 truncate text-sm font-medium'>{message}</p>
          </div>
          {progress !== undefined && (
            <progress
              className='progress'
              value={progress}
              max='100'
            ></progress>
          )}
        </div>
        <button
          onClick={() => dismissToast(id)}
          className='rounded-full p-1 hover:bg-base-300/50'
          aria-label='Close notification'
        >
          <VscClose className='h-4 w-4' />
        </button>
      </div>
    </div>
  );
};

export default Toast;
