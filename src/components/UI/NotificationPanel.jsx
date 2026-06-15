import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../context/NotificationContext';
import { FaTrash, FaBell } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export default function NotificationPanel({ isOpen, onClose }) {
  const { user } = useContext(AuthContext);
  const {
    notifications,
    browserNotificationStatus,
    requestBrowserNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useContext(NotificationContext);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fadeIn"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform animate-slideIn">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <FaBell className="text-primary-500 text-xl" />
            <h2 className="text-xl font-bold">Notificações</h2>
          </div>
          <div className="flex space-x-2">
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary-500 hover:text-primary-600"
              >
                Marcar todas como lidas
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="overflow-y-auto h-full pb-20">
          {user?.role === 'admin' && browserNotificationStatus !== 'granted' && (
            <div className="m-4 rounded-xl border border-primary-100 bg-primary-50 p-4">
              <p className="text-sm font-bold text-gray-900">Alertas em segundo plano</p>
              <p className="mt-1 text-sm text-gray-600">
                Receba avisos do navegador quando a aba da cantina nao estiver ativa.
              </p>
              {browserNotificationStatus === 'denied' ? (
                <p className="mt-3 text-sm font-semibold text-red-600">
                  Permissao bloqueada no navegador.
                </p>
              ) : browserNotificationStatus === 'unsupported' ? (
                <p className="mt-3 text-sm font-semibold text-gray-600">
                  Este navegador nao suporta alertas nativos.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={requestBrowserNotifications}
                  className="mt-3 btn-primary"
                >
                  <FaBell />
                  Ativar alertas
                </button>
              )}
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <FaBell className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.read ? 'bg-primary-50' : ''}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-gray-800">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      {!notif.read && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notif.id);
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
