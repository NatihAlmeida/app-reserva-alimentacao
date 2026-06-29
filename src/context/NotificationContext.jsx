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

  const visibleNotifications = useMemo(() => {
    if (!user) return [];

    const userRole = (user.perfil || user.role || 'student').toLowerCase();
    const userId = user.uid || user.id;

    return notifications.filter((notification) => {
      const notifAudience = (notification.audience || 'student').toLowerCase();

      // Notificações direcionadas explicitamente para este usuário (ex: cancelamento enviado ao aluno)
      if (notification.userId && notification.userId === userId) return true;

      // Para admins: mostra apenas notificações geradas PELO próprio admin
      // (pedidos novos criados por ele, ações que ele executou)
      if (userRole === 'admin') {
        if (notifAudience !== 'admin') return false;
        // Filtra por adminId: somente notificações criadas por este admin
        if (notification.adminId && notification.adminId !== userId) return false;
        // Notificações sem adminId (legadas) que não têm userId específico são exibidas
        return true;
      }

      // Para alunos: mostra notificações de audiência aluno ou enviadas diretamente para ele
      const isStudentUser = userRole === 'student' || userRole === 'aluno';
      const isStudentAudience = notifAudience === 'student' || notifAudience === 'aluno';

      if (isStudentUser && isStudentAudience && !notification.userId) return true;

      return false;
    });
  }, [notifications, user]);

  const unreadCount = visibleNotifications.filter((n) => !n.read).length;

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
    if (user?.perfil !== 'admin') return Notification.permission;

    const permission = await Notification.requestPermission();
    setBrowserNotificationStatus(permission);
    return permission;
  };

  /**
   * addNotification
   * @param {string} message
   * @param {'info'|'success'|'warning'|'error'} type
   * @param {'admin'|'student'|'aluno'} audience
   * @param {object} options - { userId, adminId }
   */
  const addNotification = (message, type = 'info', audience = user?.perfil || 'student', options = {}) => {
    const userId = user?.uid || user?.id || null;
    const newNotification = {
      id: Date.now() + Math.random(),
      message,
      type,
      audience,
      // Para notificações de admin, vincula ao adminId atual
      adminId: audience === 'admin' ? (options.adminId || userId) : null,
      // Para notificações de aluno direcionadas (ex: cancelamento), vincula ao userId alvo
      userId: options.userId || null,
      read: false,
      timestamp: new Date().toISOString(),
    };

    setNotifications((prev) => [newNotification, ...prev]);

    const shouldPush =
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted' &&
      (audience === user?.perfil || options.userId === user?.id);

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
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    const visibleIds = new Set(visibleNotifications.map((n) => n.id));
    setNotifications((prev) =>
      prev.map((n) => (visibleIds.has(n.id) ? { ...n, read: true } : n))
    );
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
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
