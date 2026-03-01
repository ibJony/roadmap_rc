import { create } from 'zustand';
import type { Toast, ToastType } from '../types';

interface ToastState {
  currentToast: Toast | null;
  showToast: (type: ToastType, title: string, message?: string) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  dismiss: () => void;
}

export const useToastStore = create<ToastState>((set) => {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const showToast = (type: ToastType, title: string, message?: string) => {
    if (timer) clearTimeout(timer);
    const duration = type === 'error' ? 5000 : 3000;
    const toast: Toast = { id: crypto.randomUUID(), type, title, message, duration };
    set({ currentToast: toast });
    timer = setTimeout(() => set({ currentToast: null }), duration);
  };

  return {
    currentToast: null,
    showToast,
    showSuccess: (title, message) => showToast('success', title, message),
    showError: (title, message) => showToast('error', title, message),
    showWarning: (title, message) => showToast('warning', title, message),
    showInfo: (title, message) => showToast('info', title, message),
    dismiss: () => {
      if (timer) clearTimeout(timer);
      set({ currentToast: null });
    },
  };
});
