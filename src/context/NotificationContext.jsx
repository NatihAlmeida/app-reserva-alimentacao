import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem('notifications');
    return stored ? JSON.parse(stored) : [];
  });

  const visibleNotifications = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          notification.audience === 'all' ||
          !notification.audience ||
          notification.audience === user?.role
      ),
    [notifications, user?.role]
  );

  const unreadCount = visibleNotifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (message, type = 'info', audience = 'all') => {
    const newNotification = {
      id: Date.now() + Math.random(),
      message,
      type,
      audience,
      read: false,
      timestamp: new Date().toISOString(),
    };

    setNotifications((prev) => [newNotification, ...prev]);

    if (
      audience !== 'admin' &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    ) {
      new Notification('Cantina do Neném', { body: message, icon: '/vite.svg' });
    }
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    const visibleIds = new Set(visibleNotifications.map((notification) => notification.id));

    setNotifications((prev) =>
      prev.map((notification) =>
        visibleIds.has(notification.id) ? { ...notification, read: true } : notification
      )
    );
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  useEffect(() => {
    if (
      typeof Notification !== 'undefined' &&
      Notification.permission !== 'granted' &&
      Notification.permission !== 'denied'
    ) {
      Notification.requestPermission();
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications: visibleNotifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
