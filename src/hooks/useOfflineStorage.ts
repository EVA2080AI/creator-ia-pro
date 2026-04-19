import { useState, useEffect, useCallback } from 'react';
import { openDB, IDBPDatabase } from 'idb';

interface OfflineStorageOptions {
  dbName: string;
  storeName: string;
  version?: number;
}

export function useOfflineStorage<T>({ dbName, storeName, version = 1 }: OfflineStorageOptions) {
  const [db, setDb] = useState<IDBPDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initDB = async () => {
      try {
        const database = await openDB(dbName, version, {
          upgrade(db) {
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName, { keyPath: 'id' });
            }
          },
        });
        setDb(database);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to open IndexedDB:', error);
      }
    };

    initDB();
  }, [dbName, storeName, version]);

  const getItem = useCallback(
    async (id: string): Promise<T | undefined> => {
      if (!db) return undefined;
      return db.get(storeName, id);
    },
    [db, storeName]
  );

  const setItem = useCallback(
    async (id: string, value: T): Promise<void> => {
      if (!db) return;
      await db.put(storeName, { id, value, timestamp: Date.now() });
    },
    [db, storeName]
  );

  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      if (!db) return;
      await db.delete(storeName, id);
    },
    [db, storeName]
  );

  const getAllItems = useCallback(async (): Promise<Array<{ id: string; value: T; timestamp: number }>> => {
    if (!db) return [];
    return db.getAll(storeName);
  }, [db, storeName]);

  const clearAll = useCallback(async (): Promise<void> => {
    if (!db) return;
    await db.clear(storeName);
  }, [db, storeName]);

  return { getItem, setItem, deleteItem, getAllItems, clearAll, isReady };
}

// Hook for syncing offline data when back online
export function useOfflineSync<T>({
  dbName,
  storeName,
  syncFn,
}: OfflineStorageOptions & { syncFn: (items: T[]) => Promise<void> }) {
  const storage = useOfflineStorage<T>({ dbName, storeName });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && storage.isReady) {
      syncOfflineData();
    }
  }, [isOnline, storage.isReady]);

  const syncOfflineData = async () => {
    if (!storage.isReady || isSyncing) return;

    setIsSyncing(true);
    try {
      const items = await storage.getAllItems();
      if (items.length > 0) {
        await syncFn(items.map((item) => item.value));
        await storage.clearAll();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const queueForSync = async (id: string, value: T) => {
    await storage.setItem(id, value);
  };

  return { isOnline, isSyncing, queueForSync, syncOfflineData };
}
