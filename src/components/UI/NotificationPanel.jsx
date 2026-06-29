import { useContext } from 'react';
import { FaBell, FaCheck, FaTimes, FaTrash,FaInfoCircle,FaCheckCircle,FaExclamationTriangle,FaTimesCircle} from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../context/NotificationContext';

export default function NotificationPanel({ isOpen, onClose }) {
  const { user } = useContext(AuthContext);
  const {
    notifications,
    unreadCount,
    browserNotificationStatus,
    requestBrowserNotifications,
    markAsRead,
    removeNotification,
  } = useContext(NotificationContext);

  if (!isOpen) return null;

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Agora mesmo';
      if (diffMins < 60) return `Há ${diffMins} min`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Há ${diffHours} h`;
      
      return date.toLocaleDateString('pt-BR');
    } catch {
      return '';
    }
  };

  // Voltando os estilos idênticos ao StudentAntigo original
  const notificationConfig={
    success:{
icon:<FaCheckCircle className="text-green-600"/>,
color:"border-green-500 bg-green-50"
    },

    error:{
icon:<FaTimesCircle className="text-red-600"/>,
color:"border-red-500 bg-red-50"
    },

    warning:{
icon:<FaExclamationTriangle className="text-yellow-600"/>,
color:"border-yellow-500 bg-yellow-50"
    },

    info:{
icon:<FaInfoCircle className="text-blue-600"/>,
color:"border-blue-500 bg-blue-50"
    }

};

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <aside className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex h-20 items-center justify-between border-b px-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <FaBell className="text-gray-600" size={20} />
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-900">Notificações</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <FaTimes size={18} />
          </button>
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
            <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
              <FaBell size={36} className="mb-3 opacity-20" />
              <p className="text-sm font-medium">Você ainda não possui notificações.</p>
              <p className="text-sm font-medium">As atualizações da cantina aparecerão aqui.</p>
            </div>
          ) : (
            notifications.map((notif) => (
                <div
                  className={`
                  mb-3
                  rounded-2xl
                  border-l-4
                  shadow
                  transition
                  hover:shadow-lg
                  ${notificationConfig[notif.type]?.color}
                `}
>
                <button
                  type="button"
                  onClick={() => removeNotification(notif.id)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-red-500 transition"
                  title="Excluir"
                >
                  <FaTrash size={12} />
                </button>

                <p className="pr-4 text-[15px] leading-7 text-gray-700">
                  {notif.message || "Nova atualização no seu pedido."}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {formatTime(notif.timestamp)}
                  </span>
                  
                  {!notif.read && (
                    <button
                      type="button"
                      onClick={() => markAsRead(notif.id)}
                      className="flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline"
                    >
                      <FaCheck size={10} />
                      Marcar como lida
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}