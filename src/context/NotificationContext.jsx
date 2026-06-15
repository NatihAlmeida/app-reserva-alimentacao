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

  const visibleNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        if (!user) return false;

        // Se a notificação for direcionada especificamente para o ID deste usuário, sempre mostra!
        if (notification.userId && notification.userId === user.id) return true;

        // Normalização de segurança para papéis (converte student/aluno para evitar divergências)
        const userRole = (user.role || 'student').toLowerCase();
        const notifAudience = (notification.audience || 'student').toLowerCase();

        if (notifAudience === 'admin' || notifAudience === 'student' || notifAudience === 'aluno') {
          const isStudentMatch = 
            (userRole === 'student' || userRole === 'aluno') && 
            (notifAudience === 'student' || notifAudience === 'aluno');
            
          const isAdminMatch = userRole === 'admin' && notifAudience === 'admin';

          if (!isStudentMatch && !isAdminMatch) return false;
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
    if (
      typeof Notification !== 'undefined' &&
      Notification.permission !== 'granted' &&
      Notification.permission !== 'denied'
    ) {
      Notification.requestPermission();
    }
  }, []);

  const addNotification = (message, type = 'info', audience = user?.role || 'student', options = {}) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      message,
      type,
      audience,
      userId: options.userId || user?.id || null, // Garante o vínculo com o usuário atual se não for passado explicitamente
      read: false,
      timestamp: new Date().toISOString(),
    };

    setNotifications((prev) => [newNotification, ...prev]);

    const userRole = (user?.role || 'student').toLowerCase();
    const notifAudience = audience.toLowerCase();
    const isStudentAudience = notifAudience === 'student' || notifAudience === 'aluno';
    const isStudentUser = userRole === 'student' || userRole === 'aluno';

    const shouldPush =
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted' &&
      ((isStudentAudience && isStudentUser) || (notifAudience === 'admin' && userRole === 'admin') || options.userId === user?.id);

    if (shouldPush) {
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