import { useContext, useMemo, useState } from 'react';
import {
  FaBox,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaPlus,
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
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Retirada',
  not_picked_up: 'Não retirada',
  expired: 'Expirada',
  blocked: 'Bloqueada',
};

const statusClasses = {
  confirmed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-slate-100 text-slate-700',
  not_picked_up: 'bg-orange-100 text-orange-800',
  expired: 'bg-orange-100 text-orange-800',
  blocked: 'bg-red-100 text-red-800',
};

const formatCurrency = (value) => `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;
const formatDate = (value) => {
  if (!value) return 'Data não informada';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { products, reservations, updateReservationStatus } = useContext(ProductContext);
  const { addNotification, notifications } = useContext(NotificationContext);
  const { getStudents, unblockStudent, registerAbsence } = useContext(AuthContext);
  const [reservationSearch, setReservationSearch] = useState('');
  const [reservationStatus, setReservationStatus] = useState('all');
  const [page, setPage] = useState(1);

  const students = getStudents();
  const stats = {
    activeProducts: products.filter((product) => product.status === 'active').length,
    totalReservations: reservations.length,
    confirmedReservations: reservations.filter((reservation) => reservation.status === 'confirmed').length,
    revenue: reservations
      .filter((reservation) => !['cancelled', 'not_picked_up'].includes(reservation.status))
      .reduce((sum, reservation) => sum + (reservation.price || 0), 0),
    pendingPickups: reservations.filter((reservation) => reservation.status === 'confirmed').length,
    blockedStudents: students.filter((student) => student.blocked).length,
  };

  const filteredReservations = useMemo(() => {
    const term = reservationSearch.toLowerCase();
    return reservations.filter((reservation) => {
      const matchesText =
        reservation.productName?.toLowerCase().includes(term) ||
        reservation.studentName?.toLowerCase().includes(term) ||
        reservation.studentEmail?.toLowerCase().includes(term);
      const matchesStatus = reservationStatus === 'all' || reservation.status === reservationStatus;
      return matchesText && matchesStatus;
    });
  }, [reservations, reservationSearch, reservationStatus]);

  const pageSize = 6;
  const paginatedReservations = filteredReservations.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredReservations.length / pageSize));

  const markNotPickedUp = (reservation) => {
    updateReservationStatus(reservation.id, 'not_picked_up');
    const updatedStudent = registerAbsence(reservation.studentId);
    addNotification(`${reservation.studentName} não retirou ${reservation.productName}.`, 'warning', 'admin');

    if (updatedStudent?.blocked) {
      updateReservationStatus(reservation.id, 'blocked');
      addNotification(
        'Your account has been temporarily blocked. Please contact the cafeteria.',
        'error',
        'student',
        { userId: reservation.studentId }
      );
    }
  };

  const markPickedUp = (reservation) => {
    updateReservationStatus(reservation.id, 'completed');
    addNotification(`Reserva de ${reservation.studentName} marcada como retirada.`, 'success', 'admin');
  };

  const handleUnblock = (student) => {
    unblockStudent(student.id);
    addNotification(`${student.name} foi desbloqueado.`, 'success', 'admin');
    addNotification('Seu acesso para reservas foi restaurado.', 'success', 'student', {
      userId: student.id,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 lg:flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1">
        <AdminMobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <>
              {/* O Dashboard mostra apenas indicadores e atalhos; gestao detalhada fica nas abas dedicadas. */}
              <StatsGrid stats={stats} />

              <DashboardOverview
                stats={stats}
                reservations={reservations}
                students={students}
                setActiveTab={setActiveTab}
              />
            </>
          )}

          {activeTab === 'products' && <ProductList />}
          {activeTab === 'newProduct' && <ProductForm />}
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
            />
          )}
          {activeTab === 'students' && <StudentsPanel students={students} onUnblock={handleUnblock} />}
          {activeTab === 'notifications' && <AdminNotifications notifications={notifications} />}
          {activeTab === 'reports' && <Reports stats={stats} />}
          {activeTab === 'settings' && <AdminSettings />}
        </main>
      </div>
    </div>
  );
}

function StatsGrid({ stats }) {
  return (
    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      <StatCard label="Produtos Ativos" value={stats.activeProducts} icon={<FaStore />} />
      <StatCard label="Total Reservas" value={stats.totalReservations} icon={<FaBox />} />
      <StatCard label="Confirmadas" value={stats.confirmedReservations} icon={<FaUsers />} />
      <StatCard label="Receita" value={formatCurrency(stats.revenue)} icon={<FaChartLine />} />
      <StatCard label="Retiradas Pendentes" value={stats.pendingPickups} icon={<FaClock />} />
      <StatCard label="Alunos Bloqueados" value={stats.blockedStudents} icon={<FaUserSlash />} />
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <article className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-primary-100 hover:shadow-md">
      <div className="flex min-h-16 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold leading-snug text-gray-500">{label}</p>
          <p className="mt-1 break-words text-2xl font-extrabold text-gray-900">{value}</p>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-50 text-lg text-primary-700">
          {icon}
        </div>
      </div>
    </article>
  );
}

function DashboardOverview({ stats, reservations, students, setActiveTab }) {
  const statusSummary = Object.entries(statusLabels)
    .map(([status, label]) => ({
      status,
      label,
      total: reservations.filter((reservation) => reservation.status === status).length,
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);
  const nonActiveReservations = Math.max(0, stats.totalReservations - stats.confirmedReservations);
  const blockedStudents = students.filter((student) => student.blocked).length;
  const completedReservations = reservations.filter((item) => item.status === 'completed').length;

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Resumo Operacional</h2>
            <p className="text-sm text-gray-500">Visao rapida da movimentacao atual da cantina.</p>
          </div>
          <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
            Hoje
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <OverviewMetric label="Reservas ativas" value={stats.confirmedReservations} tone="primary" />
          <OverviewMetric label="Finalizadas" value={completedReservations} tone="success" />
          <OverviewMetric label="Nao ativas" value={nonActiveReservations} />
        </div>

        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Reservas por status</h3>
          {statusSummary.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
              Nenhuma reserva registrada.
            </p>
          ) : (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {statusSummary.map((item) => (
                <div key={item.status} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClasses[item.status]}`}>
                      {item.label}
                    </span>
                    <span className="text-lg font-extrabold text-gray-900">{item.total}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-primary-600"
                      style={{ width: `${Math.max(8, (item.total / Math.max(1, stats.totalReservations)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-gray-900">Atalhos</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">Rapido</span>
          </div>
          <div className="mt-4 grid gap-2">
            <DashboardShortcut
              icon={<FaBox />}
              label="Ver reservas"
              description="Acompanhar retiradas e status."
              onClick={() => setActiveTab('reservations')}
            />
            <DashboardShortcut
              icon={<FaUsers />}
              label="Ver alunos"
              description={`${students.length} aluno(s), ${blockedStudents} bloqueado(s).`}
              onClick={() => setActiveTab('students')}
            />
            <DashboardShortcut
              icon={<FaPlus />}
              label="Novo produto"
              description="Cadastrar item no cardapio."
              onClick={() => setActiveTab('newProduct')}
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-extrabold text-gray-900">Saude da operacao</h2>
          <div className="mt-4 space-y-2">
            <HealthRow label="Produtos disponiveis" value={stats.activeProducts} />
            <HealthRow label="Retiradas pendentes" value={stats.pendingPickups} />
            <HealthRow label="Alunos bloqueados" value={stats.blockedStudents} tone={stats.blockedStudents > 0 ? 'warning' : 'success'} />
          </div>
        </div>
      </div>
    </section>
  );
}

function OverviewMetric({ label, value, tone = 'default' }) {
  const toneClass =
    tone === 'primary'
      ? 'bg-primary-50 text-primary-800'
      : tone === 'success'
        ? 'bg-emerald-50 text-emerald-800'
        : 'bg-gray-50 text-gray-800';

  return (
    <div className={`rounded-lg p-3 ${toneClass}`}>
      <p className="text-sm font-bold opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function DashboardShortcut({ icon, label, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-left transition hover:border-primary-100 hover:bg-primary-50"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-primary-700 shadow-sm transition group-hover:bg-primary-700 group-hover:text-white">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-extrabold text-gray-900">{label}</span>
        <span className="block text-sm leading-snug text-gray-500">{description}</span>
      </span>
    </button>
  );
}

function HealthRow({ label, value, tone = 'default' }) {
  const toneClass =
    tone === 'warning'
      ? 'bg-orange-100 text-orange-800'
      : tone === 'success'
        ? 'bg-emerald-100 text-emerald-800'
        : 'bg-gray-100 text-gray-700';

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
      <span className="text-sm font-bold text-gray-600">{label}</span>
      <span className={`rounded-full px-3 py-1 text-sm font-extrabold ${toneClass}`}>{value}</span>
    </div>
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
}) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Gerenciar Reservas</h2>
          <p className="text-sm text-gray-500">Acompanhe alunos, produtos, status e retiradas.</p>
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
              placeholder="Buscar reserva..."
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
            <option value="all">Todos</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {reservations.length === 0 ? (
        <p className="rounded-xl bg-gray-50 p-5 text-sm text-gray-500">Nenhuma reserva encontrada.</p>
      ) : (
        <div className="space-y-3">
          {reservations.map((reservation) => (
            <ReservationRow
              key={reservation.id}
              reservation={reservation}
              onPickedUp={() => onPickedUp(reservation)}
              onNotPickedUp={() => onNotPickedUp(reservation)}
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

function ReservationRow({ reservation, onPickedUp, onNotPickedUp }) {
  return (
    <article className="grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center">
      <div className="flex items-center gap-3">
        <Avatar src={reservation.studentProfilePicture} name={reservation.studentName} />
        <div className="min-w-0">
          <p className="font-extrabold text-gray-900">{reservation.studentName || 'Aluno'}</p>
          <p className="truncate text-xs text-gray-500">{reservation.studentEmail || 'E-mail não informado'}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {reservation.image && (
          <img src={reservation.image} alt={reservation.productName} className="h-14 w-14 rounded-xl object-cover" />
        )}
        <div>
          <p className="font-bold text-gray-900">{reservation.productName}</p>
          <p className="text-sm text-gray-500">
            {reservation.quantity} un • {formatCurrency(reservation.price)}
          </p>
          <p className="text-xs text-gray-500">
            {formatDate(reservation.pickupDate)} às {reservation.pickupTime || reservation.time}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            statusClasses[reservation.status] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {statusLabels[reservation.status] || 'Confirmada'}
        </span>
        {reservation.status === 'confirmed' && (
          <>
            <button type="button" onClick={onPickedUp} className="btn-secondary">
              <FaCheckCircle />
              Retirada
            </button>
            <button type="button" onClick={onNotPickedUp} className="btn-secondary text-orange-700">
              Não retirada
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
      <h2 className="text-xl font-extrabold text-gray-900">Alunos</h2>
      <div className="mt-4 space-y-3">
        {students.length === 0 ? (
          <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Nenhum aluno cadastrado.</p>
        ) : (
          students.map((student) => (
            <div key={student.id} className="flex flex-col gap-3 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Avatar src={student.profilePicture} name={student.name} />
                <div>
                  <p className="font-bold text-gray-900">{student.name}</p>
                  <p className="text-xs text-gray-500">{student.email}</p>
                  <p className="text-xs font-semibold text-gray-500">{student.absences || 0} ausência(s)</p>
                </div>
              </div>
              {student.blocked ? (
                <button type="button" onClick={() => onUnblock(student)} className="btn-primary">
                  <FaUnlock />
                  Desbloquear
                </button>
              ) : (
                <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  Liberado
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
          <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Nenhuma notificação.</p>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id} className="rounded-xl bg-primary-50 p-4 text-sm text-gray-700">
              <p className="font-semibold">{notification.message}</p>
              <p className="mt-1 text-xs text-gray-500">{new Date(notification.timestamp).toLocaleString('pt-BR')}</p>
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
      <h2 className="text-xl font-extrabold text-gray-900">Relatórios</h2>
      <p className="mt-2 text-sm text-gray-500">
        Visão resumida preparada para futura integração com banco de dados e gráficos analíticos.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Receita do período" value={formatCurrency(stats.revenue)} icon={<FaChartLine />} />
        <StatCard label="Reservas" value={stats.totalReservations} icon={<FaBox />} />
        <StatCard label="Bloqueios" value={stats.blockedStudents} icon={<FaUserSlash />} />
      </div>
    </section>
  );
}

function AdminSettings() {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-extrabold text-gray-900">Configurações</h2>
      <p className="mt-2 text-sm text-gray-500">
      </p>
    </section>
  );
}

function Avatar({ src, name }) {
  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-100 text-sm font-extrabold text-primary-800">
      {src ? <img src={src} alt={name || 'Perfil'} className="h-full w-full object-cover" /> : (name || 'A').slice(0, 1)}
    </div>
  );
}
