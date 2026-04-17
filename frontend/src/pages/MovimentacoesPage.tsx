import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import EmptyState from "../components/EmptyState";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import PaginationControls from "../components/PaginationControls";
import { authJsonRequest, extractCollection } from "../services/api";
import { formatDateTime } from "../utils/formatters";

const ITENS_POR_PAGINA = 6;

function getMovementActionLabel(movimentacao) {
  const observacao = (movimentacao.observacao || "").toLowerCase();

  if (observacao.includes("estorno")) {
    return "Estorno";
  }

  if (observacao.includes("pedido")) {
    return "Pedido";
  }

  if (observacao.includes("nf-e") || observacao.includes("nota fiscal")) {
    return "Importação";
  }

  if (observacao.includes("cadastro")) {
    return "Cadastro inicial";
  }

  return movimentacao.responsavel_username ? "Ajuste manual" : "Automação";
}

function getMovementResponsibleMeta(movimentacao) {
  if (!movimentacao.responsavel_username) {
    return "Processo automático do sistema";
  }

  if (movimentacao.responsavel_tipo === "admin") {
    return "Administrador";
  }

  if (movimentacao.responsavel_tipo === "funcionario") {
    return "Funcionário";
  }

  return "Usuário interno";
}

function buildVariationSummary(movimentacao) {
  return [
    movimentacao.marca,
    movimentacao.cor,
    movimentacao.tamanho ? `Tam. ${movimentacao.tamanho}` : null,
    movimentacao.numeracao ? `Num. ${movimentacao.numeracao}` : null,
  ]
    .filter(Boolean)
    .join(" • ");
}

export default function MovimentacoesPage() {
  const navigate = useNavigate();
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);

  useEffect(() => {
    async function carregarMovimentacoes() {
      try {
        const data = await authJsonRequest(
          "/movimentacoes/",
          {},
          "Erro ao carregar movimentações.",
        );
        setMovimentacoes(extractCollection(data));
      } catch (error) {
        toast.error(error.message);
      }
    }

    carregarMovimentacoes();
  }, []);

  const movimentacoesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return movimentacoes.filter((movimentacao) => {
      const combinaBusca =
        !termo ||
        movimentacao.produto_nome?.toLowerCase().includes(termo) ||
        movimentacao.marca?.toLowerCase().includes(termo) ||
        movimentacao.cor?.toLowerCase().includes(termo) ||
        movimentacao.observacao?.toLowerCase().includes(termo) ||
        movimentacao.responsavel_username?.toLowerCase().includes(termo);
      const combinaTipo = !tipoFiltro || movimentacao.tipo === tipoFiltro;

      return combinaBusca && combinaTipo;
    });
  }, [movimentacoes, busca, tipoFiltro]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(movimentacoesFiltradas.length / ITENS_POR_PAGINA),
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const movimentacoesPaginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;
    return movimentacoesFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [movimentacoesFiltradas, paginaSegura]);

  function atualizarBusca(value) {
    setBusca(value);
    setPaginaAtual(1);
  }

  function atualizarTipo(value) {
    setTipoFiltro(value);
    setPaginaAtual(1);
  }

  function irParaPagina(numero) {
    if (numero < 1 || numero > totalPaginas) {
      return;
    }

    setPaginaAtual(numero);
  }

  return (
    <Layout title="Movimentações">
      <PageHeader
        title="Histórico operacional"
        description="Veja de forma clara o que entrou, o que saiu e quem registrou cada ação no estoque."
        action={
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="button-secondary"
              onClick={() => navigate("/novo-pedido")}
            >
              Novo pedido
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => navigate("/importar-nota-fiscal")}
            >
              Importar NF-e
            </button>
            <button
              type="button"
              className="button-primary"
              onClick={() => navigate("/nova-movimentacao")}
            >
              Ajuste manual
            </button>
          </div>
        }
      />

      <div className="page-card section-card">
        <div className="filters-grid">
          <input
            type="text"
            placeholder="Buscar por produto, detalhe ou responsável"
            value={busca}
            onChange={(event) => atualizarBusca(event.target.value)}
          />

          <select
            value={tipoFiltro}
            onChange={(event) => atualizarTipo(event.target.value)}
          >
            <option value="">Todos os tipos</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </div>
      </div>

      <div className="page-card table-card">
        <div className="table-wrapper">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Ação</th>
                <th>Responsável</th>
                <th>Tipo</th>
                <th>Quantidade</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {movimentacoesPaginadas.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState>Nenhuma movimentação encontrada.</EmptyState>
                  </td>
                </tr>
              ) : (
                movimentacoesPaginadas.map((movimentacao) => (
                  <tr key={movimentacao.id}>
                    <td>
                      <div className="table-cell-primary">
                        {movimentacao.produto_nome}
                      </div>
                      <div className="table-cell-meta">
                        {buildVariationSummary(movimentacao) || "Sem variação complementar"}
                      </div>
                    </td>
                    <td>
                      <div className="table-cell-primary">
                        {getMovementActionLabel(movimentacao)}
                      </div>
                      <div className="table-cell-meta">
                        {movimentacao.observacao || "Movimentação registrada no estoque."}
                      </div>
                    </td>
                    <td>
                      <div className="table-cell-primary">
                        {movimentacao.responsavel_username || "Sistema"}
                      </div>
                      <div className="table-cell-meta">
                        {getMovementResponsibleMeta(movimentacao)}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          movimentacao.tipo === "entrada"
                            ? "badge-success"
                            : "badge-danger"
                        }`}
                      >
                        {movimentacao.tipo === "entrada" ? "Entrada" : "Saída"}
                      </span>
                    </td>
                    <td>{movimentacao.quantidade}</td>
                    <td>{formatDateTime(movimentacao.data)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          page={paginaSegura}
          totalPages={totalPaginas}
          onChange={irParaPagina}
        />
      </div>
    </Layout>
  );
}
