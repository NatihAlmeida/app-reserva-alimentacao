/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState, useContext } from "react"; // 💡 Adicionado useContext aqui
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase/config";
import {
  salvarPerfilUsuario,
  obterPerfilUsuario,
  atualizarPerfilUsuario,
} from "../firebase/usuarios";

export const AuthContext = createContext();

// ─── Regra de domínio IFSC ────────────────────────────────────────────────────
const DOMINIOS_PERMITIDOS = ["@aluno.ifsc.edu.br", "@ifsc.edu.br"];

export const validarEmailIFSC = (email) => {
  const normalizado = email.trim().toLowerCase();
  return DOMINIOS_PERMITIDOS.some((dominio) => normalizado.endsWith(dominio));
};

const MENSAGEM_DOMINIO_INVALIDO =
  "Apenas e-mails institucionais do IFSC são permitidos " +
  "(@aluno.ifsc.edu.br ou @ifsc.edu.br).";

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);          // perfil Firestore + uid
  const [firebaseUser, setFirebaseUser] = useState(null); // objeto Firebase Auth
  const [loading, setLoading] = useState(true);

  // Observa mudanças no estado de autenticação do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const perfil = await obterPerfilUsuario(fbUser.uid);
          setUser(perfil);
        } catch {
          setUser(null);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    // 🛠️ CORREÇÃO: Estava "!use(email)", mudei para "!validarEmailIFSC(email)"
    if (!validarEmailIFSC(email)) {
      return { success: false, message: MENSAGEM_DOMINIO_INVALIDO };
    }

    try {
      setLoading(true);
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const perfil = await obterPerfilUsuario(credential.user.uid);

      if (!perfil) {
        await signOut(auth);
        return { success: false, message: "Perfil de usuário não encontrado." };
      }

      setUser(perfil);
      return { success: true, user: perfil };
    } catch (error) {
      const mensagens = {
        "auth/user-not-found":     "E-mail não cadastrado.",
        "auth/wrong-password":     "Senha incorreta.",
        "auth/invalid-credential": "E-mail ou senha inválidos.",
        "auth/too-many-requests":  "Muitas tentativas. Aguarde e tente novamente.",
        "auth/user-disabled":      "Esta conta foi desativada.",
      };
      return {
        success: false,
        message: mensagens[error.code] || "Erro ao fazer login. Tente novamente.",
      };
    } finally {
      setLoading(false);
    }
  };

  // ── Cadastro de Aluno ─────────────────────────────────────────────────────
  const registerStudent = async ({ nome, email, password, matriculaID, curso }) => {
    if (!validarEmailIFSC(email)) {
      return { success: false, message: MENSAGEM_DOMINIO_INVALIDO };
    }

    try {
      setLoading(true);
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const perfilAluno = {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        matriculaID: matriculaID.trim(),
        curso: curso.trim(),
        perfil: "aluno", // Alinhado com a validação de rotas
      };

      await salvarPerfilUsuario(credential.user.uid, perfilAluno);
      const perfilSalvo = await obterPerfilUsuario(credential.user.uid);
      setUser(perfilSalvo);

      return { success: true, user: perfilSalvo };
    } catch (error) {
      const mensagens = {
        "auth/email-already-in-use": "Este e-mail já está cadastrado.",
        "auth/weak-password":         "A senha deve ter pelo menos 6 caracteres.",
        "auth/invalid-email":         "Formato de e-mail inválido.",
      };
      return {
        success: false,
        message: mensagens[error.code] || "Erro ao criar conta. Tente novamente.",
      };
    } finally {
      setLoading(false);
    }
  };

  // ── Criação de Admin ──────────────────────────────────────────────────────
  const createAdminAccess = async ({ nome, email, password, matriculaID }) => {
    if (!validarEmailIFSC(email)) {
      return { success: false, message: MENSAGEM_DOMINIO_INVALIDO };
    }

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await salvarPerfilUsuario(credential.user.uid, {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        matriculaID: matriculaID?.trim() || "",
        curso: "Administração",
        perfil: "admin",
      });

      return { success: true, message: "Acesso administrativo criado." };
    } catch (error) {
      const mensagens = {
        "auth/email-already-in-use": "Este e-mail já está cadastrado.",
        "auth/weak-password":         "A senha deve ter pelo menos 6 caracteres.",
      };
      return {
        success: false,
        message: mensagens[error.code] || "Erro ao criar admin.",
      };
    }
  };

  // ── Atualizar Perfil ──────────────────────────────────────────────────────
  const updateProfile = async (profileData) => {
    if (!firebaseUser) return false;
    try {
      await atualizarPerfilUsuario(firebaseUser.uid, profileData);
      setUser((prev) => ({ ...prev, ...profileData }));
      return true;
    } catch {
      return false;
    }
  };

  // ── Recuperação de Senha ──────────────────────────────────────────────────
  const requestPasswordReset = async (email) => {
    if (!validarEmailIFSC(email)) {
      return { success: false, message: MENSAGEM_DOMINIO_INVALIDO };
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error.code === "auth/user-not-found"
            ? "E-mail não encontrado."
            : "Erro ao enviar e-mail de recuperação.",
      };
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  // 💡 Mapeamento de Role amigável para o ProtectedRoute identificar se é aluno/admin
  const role = user?.perfil || null;

  const value = {
    user,
    firebaseUser,
    loading,
    role, // 💡 Adicionado a role aqui para facilitar o ProtectedRoute
    login,
    logout,
    registerStudent,
    createAdminAccess,
    updateProfile,
    requestPasswordReset,
    validarEmailIFSC,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};