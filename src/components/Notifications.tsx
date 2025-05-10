import { Toaster, toast } from 'sonner';
import { cn } from "@/lib/utils";

// كونفيجريشن موحد للإشعارات
const BASE_NOTIFICATION_CONFIG = {
  duration: 2000,
  className: cn(
    "dark:bg-physics-dark border-2 border-physics-gold",
    "rounded-lg shadow-lg",
    "animate-in fade-in-0 zoom-in-95",
    "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
    "data-[state=open]:slide-in-from-top-2"
  ),
  position: "top-center" as const,
};

export const showNotification = {  
  success: (message: string) => {
    toast.success(message, {
      ...BASE_NOTIFICATION_CONFIG,
      icon: '✨',
      style: {
        backgroundColor: '#171E31',
        color: '#ffffff',
        border: '2px solid #4CAF50'
      },
    });
  },  
  error: (message: string) => {
    toast.error(message, {
      ...BASE_NOTIFICATION_CONFIG,
      icon: '⚠️',
      style: {
        backgroundColor: '#171E31',
        color: '#ffffff',
        border: '2px solid #FF5252'
      },
    });
  },  
  info: (message: string) => {
    toast(message, {
      ...BASE_NOTIFICATION_CONFIG,
      icon: '💡',
      style: {
        backgroundColor: '#171E31',
        color: '#ffffff',
        border: '2px solid #2196F3'
      },
    });
  },  
  warning: (message: string) => {
    toast.warning(message, {
      ...BASE_NOTIFICATION_CONFIG,
      icon: '🔔',
      style: {
        backgroundColor: '#171E31',
        color: '#ffffff',
        border: '2px solid #FFC107'
      },
    });
  },
  achievement: (message: string) => {
    toast.success(message, {
      ...BASE_NOTIFICATION_CONFIG,
      icon: '🏆',
      style: {
        backgroundColor: '#171E31',
        color: '#ffffff',
        border: '2px solid #FFD700'
      },
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
  },
  loading: (message: string) => {
    toast.loading(message, {
      ...BASE_NOTIFICATION_CONFIG,
      icon: '⏳',
      style: {
        backgroundColor: '#171E31',
        color: '#ffffff',
        border: '2px solid #9C27B0'
      },
    });
  },
  upload: {
    start: (message: string = 'جاري الرفع...') => {
      toast.loading(message, {
        ...BASE_NOTIFICATION_CONFIG,
        icon: '📤',
        style: {
          backgroundColor: '#171E31',
          color: '#ffffff',
          border: '2px solid #2196F3'
        },
      });
    },
    success: (message: string = 'تم الرفع بنجاح') => {
      toast.success(message, {
        ...BASE_NOTIFICATION_CONFIG,
        icon: '📥',
        style: {
          backgroundColor: '#171E31',
          color: '#ffffff',
          border: '2px solid #4CAF50'
        },
      });
    },
    error: (message: string = 'فشل في الرفع') => {
      toast.error(message, {
        ...BASE_NOTIFICATION_CONFIG,
        icon: '❌',
        style: {
          backgroundColor: '#171E31',
          color: '#ffffff',
          border: '2px solid #FF5252'
        },
      });
    }
  },
  offline: {
    saved: (message: string = 'تم الحفظ محلياً') => {
      toast(message, {
        ...BASE_NOTIFICATION_CONFIG,
        icon: '💾',
        style: {
          backgroundColor: '#171E31',
          color: '#ffffff',
          border: '2px solid #FF9800'
        },
      });
    },
    sync: (message: string = 'جاري المزامنة...') => {
      toast.loading(message, {
        ...BASE_NOTIFICATION_CONFIG,
        icon: '🔄',
        style: {
          backgroundColor: '#171E31',
          color: '#ffffff',
          border: '2px solid #2196F3'
        },
      });
    }
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
          backgroundColor: '#171E31',
          color: '#ffffff',
          border: '2px solid #D4AF37',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        },
        className: cn(
          "animate-in slide-in-from-top-2 fade-in-0 zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=closed]:zoom-out-95",
          "dark:bg-physics-dark"
        ),
        duration: 2000, // 2 seconds duration
      }}
      richColors
      closeButton
    />
  );
};
