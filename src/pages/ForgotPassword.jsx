import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');
  const { requestPasswordReset } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const exists = await requestPasswordReset(email);

    setStatus(exists ? 'success' : 'error');
    setMessage(
      exists
        ? 'Enviamos as instruções de recuperação para o e-mail informado.'
        : 'Não encontramos uma conta com esse e-mail.'
    );
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-primary-800 px-4 py-8">
      <section className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl sm:p-8">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-primary-700 transition hover:text-primary-900"
        >
          <FaArrowLeft size={12} />
          Voltar ao login
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">Recuperar senha</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Informe seu e-mail para receber as instruções de acesso.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="relative block">
            <FaEnvelope className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-primary-700" />
            <input
              type="email"
              className="h-14 w-full rounded-xl border-0 bg-gray-100 pl-12 pr-4 text-base text-gray-700 outline-none ring-2 ring-transparent transition placeholder:text-gray-500 focus:bg-white focus:ring-primary-200"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          {message && (
            <div
              className={`rounded-lg p-3 text-sm font-semibold ${
                status === 'success'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            className="h-12 w-full rounded-xl bg-primary-700 text-base font-bold text-white transition hover:bg-primary-800"
          >
            Enviar instruções
          </button>
        </form>
      </section>
    </main>
  );
}
