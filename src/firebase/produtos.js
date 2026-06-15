import { db } from "./config";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Schema: produtos/{produtosID}
 *   nome (string), imagemUrl (string), disponível (boolean),
 *   temAcucarAlto (boolean), temGlutem (boolean), temLactose (boolean),
 *   criadoEm (timestamp)
 */

/** Busca todos os produtos disponíveis para o aluno */
export const buscarProdutosDisponiveis = async () => {
  try {
    const produtosRef = collection(db, "produtos");
    const q = query(produtosRef, where("disponível", "==", true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((d) => ({ produtosID: d.id, ...d.data() }));
  } catch (error) {
    console.error("Erro ao buscar produtos disponíveis:", error);
    throw error;
  }
};

/** Busca todos os produtos (admin) */
export const buscarTodosProdutos = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "produtos"));
    return querySnapshot.docs.map((d) => ({ produtosID: d.id, ...d.data() }));
  } catch (error) {
    console.error("Erro ao buscar todos os produtos:", error);
    throw error;
  }
};

/** Cadastra um novo produto */
export const cadastrarNovoProduto = async (dadosProduto) => {
  try {
    const docRef = await addDoc(collection(db, "produtos"), {
      nome: dadosProduto.nome,
      imagemUrl: dadosProduto.imagemUrl || "",
      "disponível": dadosProduto.disponivel ?? true,
      temAcucarAlto: dadosProduto.temAcucarAlto ?? false,
      temGlutem: dadosProduto.temGlutem ?? false,
      temLactose: dadosProduto.temLactose ?? false,
      criadoEm: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao cadastrar produto:", error);
    throw error;
  }
};

/** Atualiza um produto existente */
export const atualizarProduto = async (produtosID, dadosAtualizados) => {
  try {
    const produtoRef = doc(db, "produtos", produtosID);
    await updateDoc(produtoRef, {
      ...dadosAtualizados,
      // garante que o campo Firestore com acento seja atualizado corretamente
      ...(dadosAtualizados.disponivel !== undefined && {
        "disponível": dadosAtualizados.disponivel,
      }),
    });
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    throw error;
  }
};

/** Remove um produto */
export const removerProduto = async (produtosID) => {
  try {
    await deleteDoc(doc(db, "produtos", produtosID));
  } catch (error) {
    console.error("Erro ao remover produto:", error);
    throw error;
  }
};