import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaEnvelope } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";

export default function ForgotPassword() {
  const { requestPasswordReset, validarEmailIFSC, loading } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });

    if (!validarEmailIFSC(email)) {
      setFeedback({
        type: "error",
        message:
          "Informe um e-mail institucional do IFSC " +
          "(@aluno.ifsc.edu.br ou @ifsc.edu.br).",
      });
      return;
    }

    const result = await requestPasswordReset(email.trim().toLowerCase());

    if (result.success) {
      setFeedback({
        type: "success",
        message:
        "Enviamos um link para redefinição de senha. Caso não encontre, verifique o spam."
      });
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
            Recuperar senha
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Informe seu e-mail institucional IFSC e enviaremos um link de
            redefinição.
          </p>
        </div>

        <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          🔒 Apenas <strong>@aluno.ifsc.edu.br</strong> e{" "}
          <strong>@ifsc.edu.br</strong> são aceitos
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
            {loading ? "Enviando…" : "Enviar link de recuperação"}
          </button>
        </form>
      </section>
    </main>
  );
}