import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaLock, FaRegUser } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const success = await login(email, password);

    if (success) {
      const loggedUser = JSON.parse(localStorage.getItem('user'));
      navigate(loggedUser?.role === 'admin' ? '/admin' : '/dashboard');
    } else {
      setError('E-mail ou senha inválidos');
    }

    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-primary-800 px-4 py-8">
      <section className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-primary-700">Cantina do Neném</h1>
          <p className="mt-2 text-sm text-gray-500">Faça login para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="relative block">
            <FaRegUser className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-primary-700" />
            <input
              type="email"
              className="h-14 w-full rounded-xl border-0 bg-gray-100 pl-12 pr-4 text-base text-gray-700 outline-none ring-2 ring-transparent transition placeholder:text-gray-500 focus:bg-white focus:ring-primary-200"
              placeholder="Usuário (e-mail)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="relative block">
            <FaLock className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-primary-700" />
            <input
              type="password"
              className="h-14 w-full rounded-xl border-0 bg-gray-100 pl-12 pr-4 text-base text-gray-700 outline-none ring-2 ring-transparent transition placeholder:text-gray-500 focus:bg-white focus:ring-primary-200"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <div className="flex justify-end">
            <Link
              to="/esqueci-senha"
              className="text-sm font-extrabold text-primary-700 transition hover:text-primary-900"
            >
              Esqueceu a senha?
            </Link>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-center text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-primary-700 text-base font-bold text-white transition hover:bg-primary-800 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Acessar'}
          </button>

          <p className="pt-3 text-center text-xs leading-5 text-gray-400">
            Demo: admin@cantina.com / admin123
            <br />
            Aluno: aluno@escola.com / aluno123
          </p>
        </form>
      </section>
    </main>
  );
}
