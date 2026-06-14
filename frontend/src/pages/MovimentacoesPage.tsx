import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import EmptyState from "@/components/feedback/EmptyState";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/layout/PageHeader";
import PaginationControls from "@/components/navigation/PaginationControls";
import { authJsonRequest, extractCollection } from "@/services/api";
import { formatDate } from "@/utils/formatters";

const ITENS_POR_PAGINA = 6;
const PERIOD_OPTIONS = [
  { value: "dia", label: "Dia" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
];

function getMovementActionLabel(movimentacao) {
  const observacao = (movimentacao.observacao || "").toLowerCase();

  if (observacao.includes("venda") || observacao.includes("pedido")) {
    return "Venda";
  }

  if (observacao.includes("cadastro")) {
    return "Cadastro";
  }

  return movimentacao.tipo === "entrada" ? "Entrada manual" : "Saída manual";
}

function buildVariationSummary(movimentacao) {
  return [
    movimentacao.cor,
    movimentacao.tamanho ? `Tam. ${movimentacao.tamanho}` : null,
    movimentacao.numeracao ? `Num. ${movimentacao.numeracao}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
}

export default function MovimentacoesPage() {
  const navigate = useNavigate();
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [responsavelFiltro, setResponsavelFiltro] = useState("");
  const [periodo, setPeriodo] = useState("mes");
  const [paginaAtual, setPaginaAtual] = useState(1);

  useEffect(() => {
    async function carregarMovimentacoes() {
      try {
        const data = await authJsonRequest(
          `/movimentacoes/?periodo=${periodo}`,
          {},
          "Erro ao carregar movimentações.",
        );
        setMovimentacoes(extractCollection(data));
      } catch (error) {
        toast.error(error.message);
      }
    }

    carregarMovimentacoes();
  }, [periodo]);

  const responsaveis = useMemo(() => {
    return [...new Set(
      movimentacoes
        .map((movimentacao) => movimentacao.responsavel_username)
        .filter(Boolean),
    )].sort((first, second) => first.localeCompare(second, "pt-BR"));
  }, [movimentacoes]);

  const movimentacoesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return movimentacoes.filter((movimentacao) => {
      const combinaBusca =
        !termo ||
        movimentacao.produto_nome?.toLowerCase().includes(termo) ||
        movimentacao.marca?.toLowerCase().includes(termo) ||
        movimentacao.cor?.toLowerCase().includes(termo) ||
        movimentacao.observacao?.toLowerCase().includes(termo) ||
        movimentacao.fornecedor_nome?.toLowerCase().includes(termo) ||
        movimentacao.responsavel_username?.toLowerCase().includes(termo);
      const combinaTipo = !tipoFiltro || movimentacao.tipo === tipoFiltro;
      const combinaResponsavel =
        !responsavelFiltro ||
        movimentacao.responsavel_username === responsavelFiltro;

      return combinaBusca && combinaTipo && combinaResponsavel;
    });
  }, [movimentacoes, busca, tipoFiltro, responsavelFiltro]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(movimentacoesFiltradas.length / ITENS_POR_PAGINA),
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const movimentacoesPaginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;
    return movimentacoesFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [movimentacoesFiltradas, paginaSegura]);

  function resetarPagina() {
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
        title="Movimentações"
        description="Consulte o histórico de entradas e saídas e registre novos lançamentos de estoque."
        action={
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="button-primary"
              onClick={() => navigate("/nova-movimentacao")}
            >
              Nova movimentação
            </button>
          </div>
        }
      />

      <div className="page-card section-card">
        <div className="filters-grid">
          <input
            type="text"
            placeholder="Buscar"
            value={busca}
            onChange={(event) => {
              setBusca(event.target.value);
              resetarPagina();
            }}
          />

          <select
            value={periodo}
            onChange={(event) => {
              setPeriodo(event.target.value);
              resetarPagina();
            }}
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={tipoFiltro}
            onChange={(event) => {
              setTipoFiltro(event.target.value);
              resetarPagina();
            }}
          >
            <option value="">Tipos</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>

          <select
            value={responsavelFiltro}
            onChange={(event) => {
              setResponsavelFiltro(event.target.value);
              resetarPagina();
            }}
          >
            <option value="">Responsáveis</option>
            {responsaveis.map((responsavel) => (
              <option key={responsavel} value={responsavel}>
                {responsavel}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="page-card table-card">
        <div className="table-wrapper">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Tipo</th>
                <th>Qtd</th>
                <th>Responsável</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {movimentacoesPaginadas.length === 0 ? (
                <tr>
                  <td colSpan={5}>
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
                        {buildVariationSummary(movimentacao) || movimentacao.marca || "-"}
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
                    <td>
                      <div className="table-cell-primary">
                        {movimentacao.responsavel_username || "Sistema"}
                      </div>
                      <div className="table-cell-meta">
                        {movimentacao.fornecedor_nome || getMovementActionLabel(movimentacao)}
                      </div>
                    </td>
                    <td>{formatDate(movimentacao.data_referencia || movimentacao.data)}</td>
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
