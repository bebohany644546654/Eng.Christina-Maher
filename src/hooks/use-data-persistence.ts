import { useState, useEffect } from 'react';

export const useDataPersistence = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Check if we're online
    const handleOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
      if (navigator.onLine) {
        setIsSyncing(true);
        // Simulate sync process
        setTimeout(() => {
          setIsSyncing(false);
          setLastSyncTime(new Date());
        }, 1000);
      }
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Initial check
    handleOnlineStatus();

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  return {
    isOffline,
    isSyncing,
    lastSyncTime,
  };
};

export default useDataPersistence;