import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEnvelope, FaLock, FaShieldAlt, FaUserTie } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

export default function AdminSetup() {
  const { createAdminAccess } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (form.name.trim().length < 3) {
      setFeedback({ type: 'error', message: 'Informe o nome do administrador.' });
      return;
    }

    if (form.password.length < 6) {
      setFeedback({ type: 'error', message: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setFeedback({ type: 'error', message: 'As senhas não conferem.' });
      return;
    }

    const result = createAdminAccess(form);
    setFeedback({ type: result.success ? 'success' : 'error', message: result.message });

    if (result.success) {
      setTimeout(() => navigate('/login'), 700);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#087765,#07362e_52%,#052821)] px-4 py-8">
      <section className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl sm:p-8">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-primary-700 transition hover:text-primary-900"
        >
          <FaArrowLeft size={12} />
          Voltar ao login
        </Link>

        <div className="mb-7">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-gray-900">
            <FaShieldAlt className="text-primary-700" />
            Acesso administrativo
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Crie uma conta administrativa separada para gerenciar a cantina.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthInput
            icon={<FaUserTie />}
            type="text"
            placeholder="Nome do administrador"
            value={form.name}
            onChange={(value) => updateField('name', value)}
            autoComplete="name"
          />
          <AuthInput
            icon={<FaEnvelope />}
            type="email"
            placeholder="E-mail administrativo"
            value={form.email}
            onChange={(value) => updateField('email', value)}
            autoComplete="email"
          />
          <AuthInput
            icon={<FaLock />}
            type="password"
            placeholder="Senha"
            value={form.password}
            onChange={(value) => updateField('password', value)}
            autoComplete="new-password"
          />
          <AuthInput
            icon={<FaLock />}
            type="password"
            placeholder="Confirmar senha"
            value={form.confirmPassword}
            onChange={(value) => updateField('confirmPassword', value)}
            autoComplete="new-password"
          />

          {feedback.message && (
            <div
              className={`rounded-xl p-3 text-sm font-semibold ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {feedback.message}
            </div>
          )}

          <button type="submit" className="h-12 w-full rounded-xl bg-primary-700 text-base font-bold text-white transition hover:bg-primary-800">
            Criar acesso admin
          </button>
        </form>
      </section>
    </main>
  );
}

function AuthInput({ icon, onChange, ...props }) {
  return (
    <label className="relative block">
      <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-primary-700">
        {icon}
      </span>
      <input
        {...props}
        onChange={(e) => onChange(e.target.value)}
        className="h-14 w-full rounded-xl border-0 bg-gray-100 pl-12 pr-4 text-base text-gray-700 outline-none ring-2 ring-transparent transition placeholder:text-gray-500 focus:bg-white focus:ring-primary-200"
        required
      />
    </label>
  );
}
