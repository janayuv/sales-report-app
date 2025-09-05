import React from 'react';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

// Custom toast component with professional styling
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomToast = ({ toast: toastData }: { toast: any }) => {
  const { type, message, icon } = toastData;

  const getIcon = () => {
    if (icon) return icon;

    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'error':
        return <XCircle size={20} className="text-red-500" />;
      case 'warning':
        return <AlertCircle size={20} className="text-yellow-500" />;
      case 'info':
        return <Info size={20} className="text-blue-500" />;
      default:
        return <Info size={20} className="text-gray-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <div
      className={`
        ${getBackgroundColor()}
        border rounded-lg shadow-lg backdrop-blur-sm
        px-4 py-3 min-w-[300px] max-w-[500px]
        flex items-start gap-3
        animate-in slide-in-from-right-full duration-300
      `}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {message}
        </div>
      </div>

      <button
        onClick={() => toast.dismiss(toastData.id)}
        className="flex-shrink-0 ml-2 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Close notification"
      >
        <X size={16} className="text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  );
};

// Toast container component
export const ToastContainer: React.FC = () => {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
          margin: 0,
        },
        success: {
          duration: 4000,
        },
        error: {
          duration: 6000,
        },
        loading: {
          duration: Infinity,
        },
      }}
    >
      {t => <ToastBar toast={t}>{() => <CustomToast toast={t} />}</ToastBar>}
    </Toaster>
  );
};

// Toast utility functions
export const showToast = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  success: (message: string, options?: any) => {
    return toast.success(message, {
      ...options,
      type: 'success',
    });
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (message: string, options?: any) => {
    return toast.error(message, {
      ...options,
      type: 'error',
    });
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warning: (message: string, options?: any) => {
    return toast(message, {
      ...options,
      type: 'warning',
      icon: <AlertCircle size={20} className="text-yellow-500" />,
    });
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info: (message: string, options?: any) => {
    return toast(message, {
      ...options,
      type: 'info',
      icon: <Info size={20} className="text-blue-500" />,
    });
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loading: (message: string, options?: any) => {
    return toast.loading(message, {
      ...options,
      type: 'loading',
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },

  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },

  remove: (toastId: string) => {
    toast.remove(toastId);
  },
};

export default ToastContainer;
