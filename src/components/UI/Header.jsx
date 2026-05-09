import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../context/NotificationContext';
import {
  FaBell,
  FaClipboardList,
  FaCog,
  FaShoppingCart,
  FaSignOutAlt,
  FaUser,
} from 'react-icons/fa';
import NotificationPanel from './NotificationPanel';

export default function Header({ title, searchSlot, cartCount = 0, onCartOpen }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { logout, user } = useContext(AuthContext);
  const { unreadCount } = useContext(NotificationContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-primary-700 shadow-md">
        <div className="container-custom py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-left text-xl font-bold text-white sm:text-2xl"
              >
                {title}
              </button>
              <div className="flex items-center gap-3 lg:hidden">
                {onCartOpen && (
                  <CartButton cartCount={cartCount} onCartOpen={onCartOpen} />
                )}
                <IconActions
                  unreadCount={unreadCount}
                  showNotifications={showNotifications}
                  setShowNotifications={setShowNotifications}
                  showUserMenu={showUserMenu}
                  setShowUserMenu={setShowUserMenu}
                  user={user}
                  navigate={navigate}
                  handleLogout={handleLogout}
                />
              </div>
            </div>

            {searchSlot && <div className="w-full max-w-xl">{searchSlot}</div>}

            <div className="hidden items-center gap-3 lg:flex">
              {onCartOpen && <CartButton cartCount={cartCount} onCartOpen={onCartOpen} />}
              <IconActions
                unreadCount={unreadCount}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
                showUserMenu={showUserMenu}
                setShowUserMenu={setShowUserMenu}
                user={user}
                navigate={navigate}
                handleLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </header>

      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}

function CartButton({ cartCount, onCartOpen }) {
  return (
    <button
      type="button"
      onClick={onCartOpen}
      className="relative grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      aria-label="Abrir carrinho"
    >
      <FaShoppingCart size={17} />
      {cartCount > 0 && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
          {cartCount > 9 ? '9+' : cartCount}
        </span>
      )}
    </button>
  );
}

function IconActions({
  unreadCount,
  showNotifications,
  setShowNotifications,
  showUserMenu,
  setShowUserMenu,
  user,
  navigate,
  handleLogout,
}) {
  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Abrir notificações"
        >
          <FaBell size={17} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label={`Abrir menu de ${user?.name || 'usuário'}`}
        >
          <FaUser size={16} />
        </button>

        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white py-2 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(false);
                navigate('/minhas-reservas');
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
            >
              <FaClipboardList className="text-primary-500" />
              Minhas Reservas
            </button>
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(false);
                navigate('/configuracoes');
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
            >
              <FaCog className="text-gray-500" />
              Configurações
            </button>
            <div className="my-1 border-t" />
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(false);
                handleLogout();
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
            >
              <FaSignOutAlt />
              Sair
            </button>
          </div>
        )}
      </div>
    </>
  );
}
