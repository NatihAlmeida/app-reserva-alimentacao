import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaEnvelope,
  FaIdCard,
  FaLock,
  FaUniversity,
  FaUser,
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";

const CURSOS = [
  "Técnico em Informática",
  "Técnico em Administração",
  "Técnico em Modelagem do Vestuário",
  "Técnico em Química",
  "Graduação em Análise e Desenvolvimento de Sistemas",
  "Graduação em Design de Moda",
  "Graduação em Processos Gerenciais",
  "Outro",
];

export default function Cadastro() {
  const { registerStudent, loading, validarEmailIFSC } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    matriculaID: "",
    curso: "",
    password: "",
    confirmPassword: "",
  });
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const updateField = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });

    // ── Validações de domínio IFSC ────────────────────────────────────────
    if (!validarEmailIFSC(form.email)) {
      setFeedback({
        type: "error",
        message:
          "Apenas e-mails institucionais do IFSC são aceitos " +
          "(@aluno.ifsc.edu.br ou @ifsc.edu.br).",
      });
      return;
    }

    // ── Validações de formulário ──────────────────────────────────────────
    if (form.nome.trim().length < 3) {
      setFeedback({ type: "error", message: "Informe seu nome completo." });
      return;
    }

    if (form.matriculaID.trim().length < 3) {
      setFeedback({
        type: "error",
        message: "Informe sua matrícula institucional.",
      });
      return;
    }

    if (!form.curso) {
      setFeedback({ type: "error", message: "Selecione seu curso." });
      return;
    }

    if (form.password.length < 6) {
      setFeedback({
        type: "error",
        message: "A senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setFeedback({ type: "error", message: "As senhas não conferem." });
      return;
    }

    const result = await registerStudent(form);

    if (result.success) {
      setFeedback({ type: "success", message: "Conta criada com sucesso!" });
      navigate("/dashboard", { replace: true });
    } else {
      setFeedback({ type: "error", message: result.message });
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
          <h1 className="text-2xl font-extrabold text-gray-900">
            Criar conta de aluno
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Use seu e-mail institucional IFSC e seus dados para reservar
            refeições sem glúten.
          </p>
        </div>

        {/* Banner de domínio */}
        <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          🔒 Apenas <strong>@aluno.ifsc.edu.br</strong> e{" "}
          <strong>@ifsc.edu.br</strong> são aceitos
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthInput
            icon={<FaUser />}
            type="text"
            placeholder="Nome completo"
            value={form.nome}
            onChange={(v) => updateField("nome", v)}
            autoComplete="name"
          />

          <AuthInput
            icon={<FaEnvelope />}
            type="email"
            placeholder="seuemail@aluno.ifsc.edu.br"
            value={form.email}
            onChange={(v) => updateField("email", v)}
            autoComplete="email"
          />

          <AuthInput
            icon={<FaIdCard />}
            type="text"
            placeholder="Matrícula (ex: 202400123)"
            value={form.matriculaID}
            onChange={(v) => updateField("matriculaID", v)}
            autoComplete="off"
          />

          {/* Campo Curso */}
          <label className="relative block">
            <FaUniversity className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-primary-700" />
            <select
              value={form.curso}
              onChange={(e) => updateField("curso", e.target.value)}
              required
              className="h-14 w-full cursor-pointer appearance-none rounded-xl border-0 bg-gray-100 pl-12 pr-4 text-base text-gray-700 outline-none ring-2 ring-transparent transition focus:bg-white focus:ring-primary-200"
            >
              <option value="">Selecione seu curso</option>
              {CURSOS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <AuthInput
            icon={<FaLock />}
            type="password"
            placeholder="Senha (mínimo 6 caracteres)"
            value={form.password}
            onChange={(v) => updateField("password", v)}
            autoComplete="new-password"
          />

          <AuthInput
            icon={<FaLock />}
            type="password"
            placeholder="Confirmar senha"
            value={form.confirmPassword}
            onChange={(v) => updateField("confirmPassword", v)}
            autoComplete="new-password"
          />

          {feedback.message && (
            <div
              className={`rounded-xl p-3 text-sm font-semibold ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {feedback.message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-primary-700 text-base font-bold text-white transition hover:bg-primary-800 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Criando conta…" : "Criar conta"}
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