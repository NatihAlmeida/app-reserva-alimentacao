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
 * alunoID (string), alunoNome (string), criadoEm (timestamp),
 * data "dd-mm-yyyy" (string), hora "HH:mm" (string),
 * produtos [ { produtoID, nome, Valor (double), Quantidade (int) } ],
 * status ("pendente" | "preparando" | "pronto" | "entregue"),
 * total (double)
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

    // Sincronizado com as propriedades geradas no Context, prevenindo propriedades undefined
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

    // Gravação segura no Firestore sem propriedades nulas/indefinidas
    const docRef = await addDoc(collection(db, "pedidos"), {
      alunoID: String(idDoUsuario), 
      alunoNome: String(perfilAluno.nome || perfilAluno.name || "Estudante"),
      criadoEm: serverTimestamp(),
      data: dataFormatada,
      hora: horaFormatada,
      produtos: produtosProcessados,
      status: "pendente",
      total: Number(valorTotal || 0),
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
    
    // Tentativa robusta com ordenação nativa
    try {
      const q = query(
        pedidosRef,
        where("alunoID", "==", userUid),
        orderBy("criadoEm", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ pedidosID: d.id, ...d.data() }));
    } catch (orderError) {
      // PLANO B (Anti-Bloqueio): Se der erro de permissão/índice por causa do orderBy,
      // faz a query limpa e ordena direto na memória do JavaScript.
      console.warn("Tratando ordenação no frontend para evitar bloqueio de regras.");
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
    } catch (orderError) {
      // PLANO B (Anti-Bloqueio): Se as regras barrarem a query complexa do Admin,
      // puxa os dados limpos com a permissão concedida e ordena via código.
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
export const atualizarStatusPedido = async (pedidosID, novoStatus) => {
  try {
    await updateDoc(doc(db, "pedidos", pedidosID), { status: novoStatus });
  } catch (error) {
    console.error("Erro ao atualizar status do pedido:", error);
    throw error;
  }
};