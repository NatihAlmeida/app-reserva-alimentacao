import { db } from "./config";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

/** Busca todos os produtos disponíveis (aluno) */
export const buscarProdutosDisponiveis = async () => {
  try {
    const produtosRef = collection(db, "produtos");
    const q = query(produtosRef, where("disponível", "==", true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ produtosID: d.id, ...d.data() }));
  } catch (error) {
    console.error("Erro ao buscar produtos disponíveis:", error);
    throw error;
  }
};

/** Busca todos os produtos (admin) */
export const buscarTodosProdutos = async () => {
  try {
    const snapshot = await getDocs(collection(db, "produtos"));
    return snapshot.docs.map((d) => ({ produtosID: d.id, ...d.data() }));
  } catch (error) {
    console.error("Erro ao buscar todos os produtos:", error);
    throw error;
  }
};

/** Cadastra um novo produto — alinhado ao schema da collection */
export const cadastrarNovoProduto = async (dadosProduto) => {
  try {
    const docRef = await addDoc(collection(db, "produtos"), {
      nome: dadosProduto.nome,
      descricao: dadosProduto.descricao || "",
      categoria: dadosProduto.categoria || "Salgados",
      imagemUrl: dadosProduto.imagemUrl || "",
      "disponível": dadosProduto.disponivel ?? true,
      temAcucarAlto: dadosProduto.temAcucarAlto ?? false,
      temGlutem: dadosProduto.temGlutem ?? false,
      temLactose: dadosProduto.temLactose ?? false,
      Valor: Number(dadosProduto.preco || dadosProduto.Valor || 0),
      quantidade: Number(dadosProduto.quantidade || 0),
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
    const { disponivel, preco, ...resto } = dadosAtualizados;

    await updateDoc(produtoRef, {
      ...resto,
      ...(disponivel !== undefined && { "disponível": disponivel }),
      ...(preco !== undefined && { Valor: Number(preco) }),
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