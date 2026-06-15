import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaShieldAlt, FaUserGraduate } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const { login, loading, validarEmailIFSC } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validação de domínio IFSC — bloqueio antes de qualquer chamada Firebase
    if (!validarEmailIFSC(email)) {
      setError(
        "Acesso restrito. Use seu e-mail institucional do IFSC " +
          "(@aluno.ifsc.edu.br ou @ifsc.edu.br)."
      );
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    const result = await login(email, password);

    if (result.success) {
      const isAdmin = result.user?.perfil === "admin";
      navigate(isAdmin ? "/admin" : "/dashboard", { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#087765,#07362e_52%,#052821)] px-4 py-8">
      <section className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-extrabold text-primary-700">Cantina do Neném</h1>
          <p className="mt-2 text-sm text-gray-500">
            Exclusivo para a comunidade IFSC
          </p>
        </div>

        {/* Seletor de perfil */}
        <div className="mb-5 grid grid-cols-2 rounded-2xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setRole("student")}
            className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition ${
              role === "student"
                ? "bg-white text-primary-700 shadow-sm"
                : "text-gray-500"
            }`}
          >
            <FaUserGraduate />
            Aluno
          </button>
          <button
            type="button"
            onClick={() => setRole("admin")}
            className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition ${
              role === "admin"
                ? "bg-white text-primary-700 shadow-sm"
                : "text-gray-500"
            }`}
          >
            <FaShieldAlt />
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="relative block">
            <FaEnvelope className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-primary-700" />
            <input
              type="email"
              className="h-14 w-full rounded-xl border-0 bg-gray-100 pl-12 pr-4 text-base text-gray-700 outline-none ring-2 ring-transparent transition placeholder:text-gray-500 focus:bg-white focus:ring-primary-200"
              placeholder="seuemail@aluno.ifsc.edu.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
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
              autoComplete="current-password"
              required
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/cadastro"
              className="text-sm font-bold text-primary-700 transition hover:text-primary-900"
            >
              Criar conta de aluno
            </Link>
            <Link
              to="/esqueci-senha"
              className="text-sm font-bold text-primary-700 transition hover:text-primary-900"
            >
              Esqueceu a senha?
            </Link>
          </div>

          {role === "admin" && (
            <Link
              to="/admin-setup"
              className="block rounded-xl bg-primary-50 p-3 text-center text-sm font-bold text-primary-800 transition hover:bg-primary-100"
            >
              Configurar acesso administrativo
            </Link>
          )}

          {/* Banner informativo de domínio */}
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
            🔒 Acesso exclusivo para e-mails{" "}
            <strong>@aluno.ifsc.edu.br</strong> e{" "}
            <strong>@ifsc.edu.br</strong>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-primary-700 text-base font-bold text-white transition hover:bg-primary-800 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Acessar"}
          </button>
        </form>
      </section>
    </main>
  );
}