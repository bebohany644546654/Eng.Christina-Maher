import { useEffect } from 'react';
import { showNotification } from '../components/Notifications';
import { Network } from '@capacitor/network';

export const useDataPersistence = (key: string, data: any, syncFunction: () => Promise<void>) => {
  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
      showNotification.error(`فشل في حفظ البيانات محلياً ❌`);
    }
  }, [key, data]);

  // Setup network status monitoring and data sync
  useEffect(() => {
    let isSyncing = false;

    const syncData = async () => {
      if (isSyncing) return;
      
      try {
        isSyncing = true;
        showNotification.info('جاري مزامنة البيانات... 🔄');
        await syncFunction();
        showNotification.success('تمت المزامنة بنجاح ✨');
      } catch (error) {
        console.error('Sync error:', error);
        showNotification.error('فشل في مزامنة البيانات ❌');
      } finally {
        isSyncing = false;
      }
    };

    const handleNetworkChange = async (status: { connected: boolean }) => {
      if (status.connected) {
        showNotification.info('متصل بالإنترنت 🌐');
        await syncData();
      } else {
        showNotification.warning('غير متصل بالإنترنت - سيتم الحفظ محلياً 📱');
      }
    };

    // Check initial network status
    Network.getStatus().then(handleNetworkChange);

    // Listen for network changes
    const networkListener = Network.addListener('networkStatusChange', handleNetworkChange);

    return () => {
      networkListener.remove();
    };
  }, [syncFunction]);
};
