import { useContext } from 'react';
import { FaBell, FaCheck, FaTimes, FaTrash } from 'react-icons/fa';
import { NotificationContext } from '../../context/NotificationContext';

export default function NotificationPanel({ isOpen, onClose }) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
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
  const typeStyles = {
    success: 'bg-emerald-50 border-emerald-500 text-emerald-800',
    error: 'bg-red-50 border-red-500 text-red-800',
    info: 'bg-blue-50 border-blue-500 text-blue-800',
    warning: 'bg-amber-50 border-amber-500 text-amber-800',
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

        {notifications.length > 0 && (
          <div className="flex justify-end border-b bg-gray-50/50 px-6 py-2.5">
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
            >
              Marcar todas como lidas
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {notifications.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
              <FaBell size={36} className="mb-3 opacity-20" />
              <p className="text-sm font-medium">Nenhuma notificação por enquanto.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`relative rounded-xl border-l-4 p-4 shadow-sm transition-all ${
                  typeStyles[notif.type] || typeStyles.info
                } ${!notif.read ? 'bg-opacity-100 font-medium' : 'bg-opacity-60'}`}
              >
                <button
                  type="button"
                  onClick={() => removeNotification(notif.id)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-red-500 transition"
                  title="Excluir"
                >
                  <FaTrash size={12} />
                </button>

                <p className="text-sm leading-relaxed text-gray-800 pr-4">
                  {notif.message || 'Nova atualização no seu pedido.'}
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