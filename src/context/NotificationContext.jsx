/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext();

const STORAGE_KEY = 'notifications';

const getStoredNotifications = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState(getStoredNotifications);
  const [browserNotificationStatus, setBrowserNotificationStatus] = useState(() => {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  });
  const [isTabActive, setIsTabActive] = useState(() => {
    if (typeof document === 'undefined') return true;
    return document.visibilityState === 'visible' && document.hasFocus();
  });

  const visibleNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        if (!user) return false;
        if (notification.audience === 'admin' || notification.audience === 'student') {
          if (notification.audience !== user.role) return false;
        }
        if (notification.userId && notification.userId !== user.id) return false;
        return true;
      }),
    [notifications, user]
  );

  const unreadCount = visibleNotifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    const updateTabActivity = () => {
      setIsTabActive(document.visibilityState === 'visible' && document.hasFocus());
    };

    updateTabActivity();
    document.addEventListener('visibilitychange', updateTabActivity);
    window.addEventListener('focus', updateTabActivity);
    window.addEventListener('blur', updateTabActivity);

    return () => {
      document.removeEventListener('visibilitychange', updateTabActivity);
      window.removeEventListener('focus', updateTabActivity);
      window.removeEventListener('blur', updateTabActivity);
    };
  }, []);

  const requestBrowserNotifications = async () => {
    if (typeof Notification === 'undefined') {
      setBrowserNotificationStatus('unsupported');
      return 'unsupported';
    }

    // A permissao nativa e solicitada apenas por acao do admin logado.
    if (user?.role !== 'admin') return Notification.permission;

    const permission = await Notification.requestPermission();
    setBrowserNotificationStatus(permission);
    return permission;
  };

  const addNotification = (message, type = 'info', audience = user?.role || 'student', options = {}) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      message,
      type,
      audience,
      userId: options.userId || null,
      read: false,
      timestamp: new Date().toISOString(),
    };

    setNotifications((prev) => [newNotification, ...prev]);

    const isForLoggedAdmin =
      user?.role === 'admin' &&
      audience === 'admin' &&
      (!options.userId || options.userId === user.id);
    const shouldPush =
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted' &&
      isForLoggedAdmin &&
      !isTabActive;

    if (shouldPush) {
      // O push visual so aparece em segundo plano, no estilo Google Agenda.
      new Notification('Cantina do Neném', {
        body: message,
        icon: '/favicon.svg',
        tag: `cantina-${type}`,
      });
    }

    return newNotification;
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

  return (
    <NotificationContext.Provider
      value={{
        notifications: visibleNotifications,
        unreadCount,
        browserNotificationStatus,
        requestBrowserNotifications,
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
