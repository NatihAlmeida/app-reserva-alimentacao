import { db } from "./config";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Schema: pedidos/{pedidosID}
 * alunoID, alunoNome, criadoEm, data, hora, produtos, status, total,
 * cancelledReason (string | null), cancelledAt (timestamp | null)
 */

/** Cria um pedido na cantina */
export const criarPedidoCantina = async (perfilAluno, itensCarrinho, valorTotal) => {
  try {
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString("pt-BR").replace(/\//g, "-");
    const horaFormatada = agora.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const produtosProcessados = itensCarrinho.map((item) => ({
      produtoID: String(item.produtosID || item.id || item.produtoID || ""),
      nome: String(item.nome || item.name || "Produto"),
      Valor: Number(item.preco || item.Valor || 0),
      Quantidade: Number(item.quantidade || item.Quantidade || 1),
    }));

    const idDoUsuario = perfilAluno.uid || perfilAluno.id;

    if (!idDoUsuario) {
      throw new Error("Não foi possível identificar o UID do aluno para segurança do pedido.");
    }

    const docRef = await addDoc(collection(db, "pedidos"), {
      alunoID: String(idDoUsuario),
      alunoNome: String(perfilAluno.nome || perfilAluno.name || "Estudante"),
      criadoEm: serverTimestamp(),
      data: dataFormatada,
      hora: horaFormatada,
      produtos: produtosProcessados,
      status: "pendente",
      total: Number(valorTotal || 0),
      cancelledReason: null,
      cancelledAt: null,
    });

    return docRef.id;
  } catch (error) {
    console.error("Erro ao processar pedido:", error);
    throw error;
  }
};

/** Busca pedidos de um aluno específico */
export const buscarPedidosAluno = async (userUid) => {
  try {
    const pedidosRef = collection(db, "pedidos");
    try {
      const q = query(pedidosRef, where("alunoID", "==", userUid), orderBy("criadoEm", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ pedidosID: d.id, ...d.data() }));
    } catch {
      const qSimples = query(pedidosRef, where("alunoID", "==", userUid));
      const snapshot = await getDocs(qSimples);
      return snapshot.docs
        .map((d) => ({ pedidosID: d.id, ...d.data() }))
        .sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0));
    }
  } catch (error) {
    console.error("Erro ao buscar pedidos do aluno:", error);
    throw error;
  }
};

/** Busca todos os pedidos (admin) */
export const buscarTodosPedidos = async () => {
  try {
    const pedidosRef = collection(db, "pedidos");
    try {
      const q = query(pedidosRef, orderBy("criadoEm", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ pedidosID: d.id, ...d.data() }));
    } catch {
      const snapshot = await getDocs(pedidosRef);
      return snapshot.docs
        .map((d) => ({ pedidosID: d.id, ...d.data() }))
        .sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0));
    }
  } catch (error) {
    console.error("Erro ao buscar todos os pedidos:", error);
    throw error;
  }
};

/** Atualiza o status de um pedido */
export const atualizarStatusPedido = async (pedidosID, novoStatus, extra = {}) => {
  try {
    await updateDoc(doc(db, "pedidos", pedidosID), { status: novoStatus, ...extra });
  } catch (error) {
    console.error("Erro ao atualizar status do pedido:", error);
    throw error;
  }
};

/** Cancela um pedido com motivo */
export const cancelarPedido = async (pedidosID, motivo) => {
  try {
    await updateDoc(doc(db, "pedidos", pedidosID), {
      status: "cancelled",
      cancelledReason: motivo,
      cancelledAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao cancelar pedido:", error);
    throw error;
  }
};
