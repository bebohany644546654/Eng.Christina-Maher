import { Toaster, toast } from 'sonner';

export const showNotification = {
  success: (message: string) => {
    toast.success(message, {
      duration: 4000,
      icon: '✅',
    });
  },
  error: (message: string) => {
    toast.error(message, {
      duration: 4000,
      icon: '❌',
    });
  },
  info: (message: string) => {
    toast(message, {
      duration: 4000,
      icon: 'ℹ️',
    });
  },
  warning: (message: string) => {
    toast.warning(message, {
      duration: 4000,
      icon: '⚠️',
    });
  },
  achievement: (message: string) => {
    toast.success(message, {
      duration: 5000,
      icon: '🏆',
    });
  },
  welcome: (name: string) => {
    toast.success(`أهلاً بك ${name} 👋`, {
      duration: 5000,
      icon: '👋',
    });
  },
  saved: () => {
    toast.success('تم الحفظ بنجاح', {
      duration: 3000,
      icon: '💾',
    });
  },
  uploaded: () => {
    toast.success('تم الرفع بنجاح', {
      duration: 3000,
      icon: '📤',
    });
  }
};

export const NotificationsProvider = () => {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          fontFamily: 'Tajawal, sans-serif',
          direction: 'rtl',
        },
      }}
      richColors
    />
  );
};
