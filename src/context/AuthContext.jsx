/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState, useContext, useCallback } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "../firebase/config";
import {
  salvarPerfilUsuario,
  obterPerfilUsuario,
  atualizarPerfilUsuario,
  buscarTodosAlunos,
  registrarAusenciaAluno,
  desbloquearAluno,
} from "../firebase/usuarios";

export const AuthContext = createContext();

const DOMINIOS_PERMITIDOS = ["@aluno.ifsc.edu.br", "@ifsc.edu.br"];

export const validarEmailIFSC = (email) => {
  const normalizado = email.trim().toLowerCase();
  return DOMINIOS_PERMITIDOS.some((dominio) => normalizado.endsWith(dominio));
};

const MENSAGEM_DOMINIO_INVALIDO =
  "Apenas e-mails institucionais do IFSC são permitidos " +
  "(@aluno.ifsc.edu.br ou @ifsc.edu.br).";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);

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

  // Carrega alunos do Firestore quando admin faz login
  useEffect(() => {
    if (user?.perfil === "admin") {
      buscarTodosAlunos()
        .then(setStudents)
        .catch((err) => console.error("Erro ao carregar alunos:", err));
    }
  }, [user?.perfil]);

  const refreshStudents = useCallback(async () => {
    try {
      const lista = await buscarTodosAlunos();
      setStudents(lista);
    } catch (err) {
      console.error("Erro ao atualizar alunos:", err);
    }
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const perfil = await obterPerfilUsuario(credential.user.uid);

      if (!perfil) {
        await signOut(auth);
        return { success: false, message: "Perfil de usuário não encontrado." };
      }

      // Bloqueia login se aluno bloqueado
      if (perfil.perfil === "aluno" && perfil.blocked) {
        await signOut(auth);
        return {
          success: false,
          message: "Seu acesso está bloqueado. Solicite o desbloqueio ao administrador.",
        };
      }

      setUser(perfil);
      return { success: true, user: perfil };
    } catch (error) {
      const mensagens = {
        "auth/user-not-found": "E-mail não cadastrado.",
        "auth/wrong-password": "Senha incorreta.",
        "auth/invalid-credential": "E-mail ou senha inválidos.",
        "auth/too-many-requests": "Muitas tentativas. Aguarde e tente novamente.",
        "auth/user-disabled": "Esta conta foi desativada.",
      };
      return {
        success: false,
        message: mensagens[error.code] || "Erro ao fazer login. Tente novamente.",
      };
    } finally {
      setLoading(false);
    }
  };

  const registerStudent = async ({ nome, email, password, matriculaID, curso }) => {
    if (!validarEmailIFSC(email)) {
      return { success: false, message: MENSAGEM_DOMINIO_INVALIDO };
    }
    try {
      setLoading(true);
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const perfilAluno = {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        matriculaID: matriculaID.trim(),
        curso: curso.trim(),
        perfil: "aluno",
      };
      await salvarPerfilUsuario(credential.user.uid, perfilAluno);
      const perfilSalvo = await obterPerfilUsuario(credential.user.uid);
      setUser(perfilSalvo);
      return { success: true, user: perfilSalvo };
    } catch (error) {
      const mensagens = {
        "auth/email-already-in-use": "Este e-mail já está cadastrado.",
        "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
        "auth/invalid-email": "Formato de e-mail inválido.",
      };
      return {
        success: false,
        message: mensagens[error.code] || "Erro ao criar conta. Tente novamente.",
      };
    } finally {
      setLoading(false);
    }
  };

  const createAdminAccess = async ({ nome, email, password, matriculaID }) => {
    if (!validarEmailIFSC(email)) {
      return { success: false, message: MENSAGEM_DOMINIO_INVALIDO };
    }
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
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
        "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
      };
      return {
        success: false,
        message: mensagens[error.code] || "Erro ao criar admin.",
      };
    }
  };

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

  const changePassword = async (currentPassword, newPassword) => {
  if (!auth.currentUser)
    return {
      success: false,
      message: "Usuário não autenticado.",
    };

  try {
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    );

    await reauthenticateWithCredential(
      auth.currentUser,
      credential
    );

    await updatePassword(auth.currentUser, newPassword);

    return {
      success: true,
      message: "Senha alterada com sucesso.",
    };
  } catch (error) {
    const messages = {
      "auth/wrong-password": "Senha atual incorreta.",
      "auth/weak-password": "A nova senha deve possuir pelo menos 6 caracteres.",
      "auth/requires-recent-login":
        "Faça login novamente para alterar sua senha.",
    };

    return {
      success: false,
      message:
        messages[error.code] ||
        "Não foi possível alterar a senha.",
    };
  }
};

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  /** Registra ausência de um aluno e retorna se foi bloqueado */
  const registerAbsence = async (alunoID) => {
    try {
      const resultado = await registrarAusenciaAluno(alunoID);
      // Atualiza lista local de alunos
      setStudents((prev) =>
        prev.map((s) =>
          (s.id === alunoID || s.uid === alunoID)
            ? { ...s, absences: resultado.absences, blocked: resultado.blocked }
            : s
        )
      );
      return resultado;
    } catch (err) {
      console.error("Erro ao registrar ausência:", err);
      return { blocked: false, absences: 0 };
    }
  };

  /** Desbloqueia aluno pelo admin */
  const unblockStudent = async (studentId) => {
    try {
      await desbloquearAluno(studentId);
      setStudents((prev) =>
        prev.map((s) =>
          (s.id === studentId || s.uid === studentId)
            ? { ...s, blocked: false, absences: 0 }
            : s
        )
      );
      return true;
    } catch (err) {
      console.error("Erro ao desbloquear aluno:", err);
      return false;
    }
  };

  const getStudents = useCallback(() => students, [students]);

  const role = user?.perfil || null;

  const value = {
    user,
    firebaseUser,
    loading,
    role,
    login,
    logout,
    registerStudent,
    createAdminAccess,
    updateProfile,
    requestPasswordReset,
    validarEmailIFSC,
    getStudents,
    registerAbsence,
    unblockStudent,
    refreshStudents,
    changePassword,
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
