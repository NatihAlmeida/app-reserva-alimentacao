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
 *   alunoID (string), alunoNome (string), criadoEm (timestamp),
 *   data "dd-mm-yyyy" (string), hora "HH:mm" (string),
 *   produtos [ { produtoID, nome, Valor (double), Quantidade (int) } ],
 *   status ("pendente" | "preparando" | "pronto" | "entregue"),
 *   total (double)
 */

/** Cria um pedido na cantina */
export const criarPedidoCantina = async (perfilAluno, itensCarrinho, valorTotal) => {
  try {
    const agora = new Date();
    const dataFormatada = agora
      .toLocaleDateString("pt-BR")
      .replace(/\//g, "-");
    const horaFormatada = agora.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const produtosProcessados = itensCarrinho.map((item) => ({
      produtoID: item.produtosID,
      nome: item.nome,
      Valor: Number(item.preco || 0),
      Quantidade: Number(item.quantidade || 1),
    }));

    const docRef = await addDoc(collection(db, "pedidos"), {
      alunoID: perfilAluno.matriculaID,
      alunoNome: perfilAluno.nome,
      criadoEm: serverTimestamp(),
      data: dataFormatada,
      hora: horaFormatada,
      produtos: produtosProcessados,
      status: "pendente",
      total: Number(valorTotal),
    });

    return docRef.id;
  } catch (error) {
    console.error("Erro ao processar pedido:", error);
    throw error;
  }
};

/** Busca pedidos de um aluno específico */
export const buscarPedidosAluno = async (matriculaID) => {
  try {
    const pedidosRef = collection(db, "pedidos");
    const q = query(
      pedidosRef,
      where("alunoID", "==", matriculaID),
      orderBy("criadoEm", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ pedidosID: d.id, ...d.data() }));
  } catch (error) {
    console.error("Erro ao buscar pedidos do aluno:", error);
    throw error;
  }
};

/** Busca todos os pedidos (admin) */
export const buscarTodosPedidos = async () => {
  try {
    const q = query(
      collection(db, "pedidos"),
      orderBy("criadoEm", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ pedidosID: d.id, ...d.data() }));
  } catch (error) {
    console.error("Erro ao buscar todos os pedidos:", error);
    throw error;
  }
};

/** Atualiza o status de um pedido */
export const atualizarStatusPedido = async (pedidosID, novoStatus) => {
  try {
    await updateDoc(doc(db, "pedidos", pedidosID), { status: novoStatus });
  } catch (error) {
    console.error("Erro ao atualizar status do pedido:", error);
    throw error;
  }
};