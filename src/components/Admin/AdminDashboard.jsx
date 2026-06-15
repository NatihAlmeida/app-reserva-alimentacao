import { useContext, useMemo, useState } from 'react';
import {
  FaBell,
  FaBox,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaSearch,
  FaStore,
  FaUnlock,
  FaUserSlash,
  FaUsers,
} from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../context/NotificationContext';
import { ProductContext } from '../../context/ProductContext';
import Sidebar, { AdminMobileNav } from './Sidebar';
import ProductForm from './ProductForm';
import ProductList from './ProductList';

const statusLabels = {
  pendente: 'Pendente',
  preparando: 'Preparando',
  pronto: 'Pronto',
  entregue: 'Entregue',
  not_picked_up: 'Não retirada',
  cancelled: 'Cancelada',
};

const statusClasses = {
  pendente: 'bg-amber-100 text-amber-800',
  preparando: 'bg-blue-100 text-blue-800',
  pronto: 'bg-emerald-100 text-emerald-800',
  entregue: 'bg-slate-100 text-slate-700',
  not_picked_up: 'bg-orange-100 text-orange-800',
  cancelled: 'bg-red-100 text-red-700',
};

const formatCurrency = (value) => `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;
const formatDate = (value) => {
  if (!value) return 'Data não informada';
  const [day, month, year] = value.split('-');
  return day && month && year ? `${day}/${month}/${year}` : value;
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { products, reservations, updateReservationStatus, loadingProducts, loadingReservations } = useContext(ProductContext);
  const { addNotification, notifications } = useContext(NotificationContext);
  const { getStudents, unblockStudent, registerAbsence } = useContext(AuthContext);
  const [reservationSearch, setReservationSearch] = useState('');
  const [reservationStatus, setReservationStatus] = useState('all');
  const [page, setPage] = useState(1);

  const students = getStudents ? getStudents() : [];
  
  const stats = useMemo(() => {
    return {
      activeProducts: products.filter((product) => product.disponivel || product.status === 'active').length,
      totalReservations: reservations.length,
      confirmedReservations: reservations.filter((r) => ['pendente', 'preparando', 'pronto'].includes(r.status)).length,
      revenue: reservations
        .filter((r) => !['cancelled', 'not_picked_up'].includes(r.status))
        .reduce((sum, r) => sum + (Number(r.total) || 0), 0),
      pendingPickups: reservations.filter((r) => r.status === 'pronto').length,
      blockedStudents: students.filter((student) => student.blocked).length,
    };
  }, [products, reservations, students]);

  const filteredReservations = useMemo(() => {
    const term = reservationSearch.toLowerCase();
    return reservations.filter((reservation) => {
      // Procura nos produtos internos do array mapeado do Firestore
      const matchesProduct = reservation.produtos?.some(p => p.nome?.toLowerCase().includes(term));
      const matchesStudent = reservation.alunoNome?.toLowerCase().includes(term);
      
      const matchesText = matchesProduct || matchesStudent;
      const matchesStatus = reservationStatus === 'all' || reservation.status === reservationStatus;
      return matchesText && matchesStatus;
    });
  }, [reservations, reservationSearch, reservationStatus]);

  const pageSize = 6;
  const paginatedReservations = filteredReservations.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredReservations.length / pageSize));

  const markNotPickedUp = (reservation) => {
    updateReservationStatus(reservation.pedidosID || reservation.id, 'not_picked_up');
    if (registerAbsence) registerAbsence(reservation.alunoID);
    addNotification(`${reservation.alunoNome} não retirou o pedido.`, 'warning', 'admin');
  };

  const markPickedUp = (reservation) => {
    updateReservationStatus(reservation.pedidosID || reservation.id, 'entregue');
    addNotification(`Reserva de ${reservation.alunoNome} marcada como entregue.`, 'success', 'admin');
  };

  const handleUnblock = (student) => {
    if (unblockStudent) {
      unblockStudent(student.id);
      addNotification(`${student.name} foi desbloqueado.`, 'success', 'admin');
    }
  };

  if (loadingProducts || loadingReservations) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-lg font-bold text-gray-600 animate-pulse">Carregando painel do banco de dados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 lg:flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1">
        <AdminMobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-primary-700">Área administrativa</p>
              <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                Painel Administrativo
              </h1>
            </div>
            <button
              type="button"
              onClick={() => addNotification('Central administrativa sincronizada.', 'info', 'admin')}
              className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-primary-700 shadow-sm transition hover:bg-primary-50"
            >
              <FaBell />
              Notificar admin
            </button>
          </div>

          <StatsGrid stats={stats} />

          {activeTab === 'dashboard' && (
            <section className="grid gap-5 xl:grid-cols-[1fr_0.7fr]">
              <ReservationManager
                reservations={paginatedReservations}
                search={reservationSearch}
                setSearch={setReservationSearch}
                status={reservationStatus}
                setStatus={setReservationStatus}
                page={page}
                setPage={setPage}
                totalPages={totalPages}
                onPickedUp={markPickedUp}
                onNotPickedUp={markNotPickedUp}
                onStatusChange={updateReservationStatus}
              />
              <StudentsPanel students={students} onUnblock={handleUnblock} />
            </section>
          )}

          {activeTab === 'products' && <ProductList />}
          {activeTab === 'newProduct' && <ProductForm onClose={() => setActiveTab('products')} />}
          {activeTab === 'reservations' && (
            <ReservationManager
              reservations={paginatedReservations}
              search={reservationSearch}
              setSearch={setReservationSearch}
              status={reservationStatus}
              setStatus={setReservationStatus}
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              onPickedUp={markPickedUp}
              onNotPickedUp={markNotPickedUp}
              onStatusChange={updateReservationStatus}
            />
          )}
          {activeTab === 'students' && <StudentsPanel students={students} onUnblock={handleUnblock} />}
          {activeTab === 'notifications' && <AdminNotifications notifications={notifications} />}
          {activeTab === 'reports' && <Reports stats={stats} />}
        </main>
      </div>
    </div>
  );
}

function StatsGrid({ stats }) {
  return (
    <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <StatCard label="Produtos Ativos" value={stats.activeProducts} icon={<FaStore />} />
      <StatCard label="Total Pedidos" value={stats.totalReservations} icon={<FaBox />} />
      <StatCard label="Em Aberto" value={stats.confirmedReservations} icon={<FaUsers />} />
      <StatCard label="Receita Bruta" value={formatCurrency(stats.revenue)} icon={<FaChartLine />} />
      <StatCard label="Prontos p/ Retirada" value={stats.pendingPickups} icon={<FaClock />} />
      <StatCard label="Alunos Bloqueados" value={stats.blockedStudents} icon={<FaUserSlash />} />
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-gray-900">{value}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-xl text-primary-600">
          {icon}
        </div>
      </div>
    </article>
  );
}

function ReservationManager({
  reservations,
  search,
  setSearch,
  status,
  setStatus,
  page,
  setPage,
  totalPages,
  onPickedUp,
  onNotPickedUp,
  onStatusChange,
}) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Gerenciar Pedidos e Reservas</h2>
          <p className="text-sm text-gray-500">Acompanhe a linha de produção em tempo real.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
          <label className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar aluno ou produto..."
              className="h-11 w-full rounded-xl border border-gray-200 pl-10 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-primary-500"
          >
            <option value="all">Todos os Status</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {reservations.length === 0 ? (
        <p className="rounded-xl bg-gray-50 p-5 text-sm text-gray-500">Nenhum pedido encontrado.</p>
      ) : (
        <div className="space-y-3">
          {reservations.map((reservation) => (
            <ReservationRow
              key={reservation.pedidosID || reservation.id}
              reservation={reservation}
              onPickedUp={() => onPickedUp(reservation)}
              onNotPickedUp={() => onNotPickedUp(reservation)}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="btn-secondary disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-sm font-bold text-gray-500">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="btn-secondary disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    </section>
  );
}

function ReservationRow({ reservation, onPickedUp, onNotPickedUp, onStatusChange }) {
  const currentStatus = reservation.status || 'pendente';
  const idPedido = reservation.pedidosID || reservation.id;

  return (
    <article className="grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 lg:grid-cols-[1fr_1.2fr_auto] lg:items-center">
      <div className="flex items-center gap-3">
        <Avatar name={reservation.alunoNome} />
        <div className="min-w-0">
          <p className="font-extrabold text-gray-900">{reservation.alunoNome || 'Aluno'}</p>
          <p className="text-xs font-semibold text-gray-500">ID: {reservation.alunoID}</p>
        </div>
      </div>
      
      <div className="space-y-1">
        {reservation.produtos?.map((p, index) => (
          <p key={index} className="text-sm font-bold text-gray-800">
            {p.nome} <span className="text-gray-400 font-normal">({p.Quantidade || p.quantidade}x)</span>
          </p>
        ))}
        <p className="text-xs text-primary-700 font-bold">Total: {formatCurrency(reservation.total)}</p>
        <p className="text-xs text-gray-400">Agendado: {formatDate(reservation.data)} às {reservation.hora}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        {['pendente', 'preparando', 'pronto'].includes(currentStatus) && (
          <select
            value={currentStatus}
            onChange={(e) => onStatusChange(idPedido, e.target.value)}
            className="h-9 rounded-xl border border-gray-300 bg-white px-2 text-xs font-bold outline-none"
          >
            <option value="pendente">Pendente</option>
            <option value="preparando">Preparando</option>
            <option value="pronto">Pronto p/ Retirada</option>
          </select>
        )}

        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClasses[currentStatus] || 'bg-gray-100 text-gray-800'}`}>
          {statusLabels[currentStatus] || currentStatus}
        </span>

        {currentStatus === 'pronto' && (
          <>
            <button type="button" onClick={onPickedUp} className="inline-flex items-center gap-1 bg-emerald-600 text-white rounded-xl px-3 py-1.5 text-xs font-bold hover:bg-emerald-700 transition">
              <FaCheckCircle /> Entregar
            </button>
            <button type="button" onClick={onNotPickedUp} className="inline-flex items-center gap-1 bg-white border border-orange-200 text-orange-700 rounded-xl px-3 py-1.5 text-xs font-bold hover:bg-orange-50 transition">
              Não retirado
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function StudentsPanel({ students, onUnblock }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-xl font-extrabold text-gray-900">Alunos Registrados</h2>
      <div className="mt-4 space-y-3">
        {students.length === 0 ? (
          <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Nenhum aluno cadastrado.</p>
        ) : (
          students.map((student) => (
            <div key={student.id || student.uid} className="flex flex-col gap-3 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={student.nome || student.name} />
                <div>
                  <p className="font-bold text-gray-900">{student.nome || student.name}</p>
                  <p className="text-xs text-gray-500">{student.email}</p>
                  <p className="text-xs font-bold text-red-600">{student.absences || 0} ausência(s)</p>
                </div>
              </div>
              {student.blocked ? (
                <button type="button" onClick={() => onUnblock(student)} className="inline-flex items-center gap-1.5 bg-red-600 text-white font-bold text-xs px-3 py-2 rounded-xl hover:bg-red-700 transition">
                  <FaUnlock /> Desbloquear
                </button>
              ) : (
                <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  Acesso Liberado
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function AdminNotifications({ notifications }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-xl font-extrabold text-gray-900">Notificações Administrativas</h2>
      <div className="mt-4 space-y-3">
        {notifications.length === 0 ? (
          <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Nenhuma notificação emitida hoje.</p>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id} className="rounded-xl bg-primary-50 p-4 text-sm text-gray-700">
              <p className="font-semibold">{notification.message}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function Reports({ stats }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-extrabold text-gray-900">Relatórios de Desempenho</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Receita Líquida" value={formatCurrency(stats.revenue)} icon={<FaChartLine />} />
        <StatCard label="Pedidos Gerados" value={stats.totalReservations} icon={<FaBox />} />
        <StatCard label="Alunos Bloqueados" value={stats.blockedStudents} icon={<FaUserSlash />} />
      </div>
    </section>
  );
}

function Avatar({ name }) {
  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-100 text-sm font-extrabold text-primary-800">
      {(name || 'A').slice(0, 1).toUpperCase()}
    </div>
  );
}