import { useState, useEffect, useCallback } from 'react';

interface NotificationPermission {
  status: 'default' | 'granted' | 'denied' | 'unsupported';
  isSupported: boolean;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>({
    status: 'default',
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
  });

  useEffect(() => {
    if (!permission.isSupported) return;

    setPermission((prev) => ({
      ...prev,
      status: Notification.permission as NotificationPermission['status'],
    }));
  }, [permission.isSupported]);

  const requestPermission = useCallback(async () => {
    if (!permission.isSupported) {
      console.warn('Push notifications are not supported');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission((prev) => ({ ...prev, status: result }));
      return result === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, [permission.isSupported]);

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!permission.isSupported || permission.status !== 'granted') {
        console.warn('Notification permission not granted');
        return null;
      }

      const notification = new Notification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: 'creator-ia-notification',
        requireInteraction: false,
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    },
    [permission.isSupported, permission.status]
  );

  return {
    permission: permission.status,
    isSupported: permission.isSupported,
    requestPermission,
    showNotification,
  };
}

// Hook for local notifications (in-app)
interface LocalNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

export function useLocalNotifications() {
  const [notifications, setNotifications] = useState<LocalNotification[]>([]);

  const addNotification = useCallback(
    (notification: Omit<LocalNotification, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newNotification = { ...notification, id };
      setNotifications((prev) => [...prev, newNotification]);

      // Auto-dismiss if duration is provided
      if (notification.duration) {
        setTimeout(() => {
          removeNotification(id);
        }, notification.duration);
      }

      return id;
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  };
}
