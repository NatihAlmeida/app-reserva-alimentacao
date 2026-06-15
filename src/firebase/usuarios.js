import { db } from "./config";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

/**
 * Cria ou atualiza o perfil do usuário/aluno no Firestore.
 * Schema: usuarios/{uid}
 *   uid (string), nome (string), email (string),
 *   matriculaID (string), curso (string),
 *   perfil ("aluno" | "admin"), criadoEm (timestamp)
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