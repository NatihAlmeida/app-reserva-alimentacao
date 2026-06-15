import { db } from "./config";
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";

/**
 * Cria ou atualiza o perfil do usuário/aluno no Firestore.
 */
export const salvarPerfilUsuario = async (uid, dadosUsuario) => {
  try {
    const usuarioRef = doc(db, "usuarios", uid);
    await setDoc(usuarioRef, {
      uid,
      nome: dadosUsuario.nome,
      email: dadosUsuario.email,
      matriculaID: dadosUsuario.matriculaID,
      curso: dadosUsuario.curso,
      perfil: dadosUsuario.perfil || "aluno",
      absences: 0,
      blocked: false,
      criadoEm: new Date(),
    });
  } catch (error) {
    console.error("Erro ao salvar perfil do usuário:", error);
    throw error;
  }
};

/**
 * Busca os dados do usuário pelo UID do Firebase Auth.
 */
export const obterPerfilUsuario = async (uid) => {
  try {
    const usuarioRef = doc(db, "usuarios", uid);
    const docSnap = await getDoc(usuarioRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Erro ao buscar perfil do usuário:", error);
    throw error;
  }
};

/**
 * Atualiza campos do perfil do usuário.
 */
export const atualizarPerfilUsuario = async (uid, dadosAtualizados) => {
  try {
    const usuarioRef = doc(db, "usuarios", uid);
    await updateDoc(usuarioRef, dadosAtualizados);
  } catch (error) {
    console.error("Erro ao atualizar perfil do usuário:", error);
    throw error;
  }
};

/**
 * Busca todos os alunos cadastrados (perfil = "aluno").
 */
export const buscarTodosAlunos = async () => {
  try {
    const usuariosRef = collection(db, "usuarios");
    const q = query(usuariosRef, where("perfil", "==", "aluno"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Erro ao buscar alunos:", error);
    // Fallback: busca tudo e filtra no frontend
    try {
      const snapshot = await getDocs(collection(db, "usuarios"));
      return snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.perfil === "aluno");
    } catch {
      throw error;
    }
  }
};

/**
 * Registra ausência de um aluno e bloqueia se atingir 2 faltas.
 * Retorna { blocked: true } se o aluno foi bloqueado nesta chamada.
 */
export const registrarAusenciaAluno = async (uid) => {
  try {
    const usuarioRef = doc(db, "usuarios", uid);
    const docSnap = await getDoc(usuarioRef);
    if (!docSnap.exists()) return { blocked: false };

    const dados = docSnap.data();
    const novasAusencias = (dados.absences || 0) + 1;
    const deveBloquear = novasAusencias >= 2;

    await updateDoc(usuarioRef, {
      absences: novasAusencias,
      blocked: deveBloquear,
    });

    return { blocked: deveBloquear, absences: novasAusencias };
  } catch (error) {
    console.error("Erro ao registrar ausência:", error);
    throw error;
  }
};

/**
 * Desbloqueia um aluno e zera as ausências.
 */
export const desbloquearAluno = async (uid) => {
  try {
    const usuarioRef = doc(db, "usuarios", uid);
    await updateDoc(usuarioRef, { blocked: false, absences: 0 });
  } catch (error) {
    console.error("Erro ao desbloquear aluno:", error);
    throw error;
  }
};
