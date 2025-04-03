import { toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type ToastType = 'success' | 'error' | 'info' | 'warning';

const toastOptions: Record<ToastType, ToastOptions> = {
  success: {
    style: { background: '#10B981', color: 'white' },
    icon: '✓',
    position: 'top-right',
    autoClose: 3000
  },
  error: {
    style: { background: '#EF4444', color: 'white' },
    icon: '✗',
    position: 'top-right',
    autoClose: 4000
  },
  info: {
    style: { background: '#3B82F6', color: 'white' },
    icon: 'ℹ',
    position: 'top-right',
    autoClose: 3000
  },
  warning: {
    style: { background: '#F59E0B', color: 'white' },
    icon: '⚠',
    position: 'top-right',
    autoClose: 4000
  }
};

export function showToast(message: string, type: ToastType = 'info') {
  toast(message, toastOptions[type]);
}