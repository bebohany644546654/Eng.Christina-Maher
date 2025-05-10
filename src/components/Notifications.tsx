import { toast } from '@/hooks/use-toast';

type NotificationType = 'success' | 'error' | 'warning';

export const showNotification = (message: string, type: NotificationType = 'success') => {
  toast({
    title: message,
    variant: type === 'success' ? 'default' : 'destructive'
  });
};

showNotification.info = (message: string) => showNotification(message, 'warning');
showNotification.uploaded = () => showNotification('تم الرفع بنجاح', 'success');
showNotification.error = (message: string) => showNotification(message, 'error');
showNotification.success = (message: string) => showNotification(message, 'success');
showNotification.warning = (message: string) => showNotification(message, 'warning');
showNotification.saved = () => showNotification('تم الحفظ بنجاح', 'success');
