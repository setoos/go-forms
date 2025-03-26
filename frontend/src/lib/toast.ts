import { createRoot } from 'react-dom/client';

type ToastType = 'success' | 'error' | 'info';

export function showToast(message: string, type: ToastType = 'info') {
  // Create container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `
    mb-4 px-6 py-4 rounded-lg shadow-lg text-white transform transition-all duration-300
    ${type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-primary'}
    translate-x-full
  `;
  toast.textContent = message;

  // Add to container
  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-x-full');
  });

  // Remove after delay
  setTimeout(() => {
    toast.classList.add('translate-x-full');
    setTimeout(() => {
      if (container && container.contains(toast)) {
        container.removeChild(toast);
      }
    }, 300);
  }, 3000);
}