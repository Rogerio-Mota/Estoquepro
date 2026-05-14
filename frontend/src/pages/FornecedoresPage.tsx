import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import EmptyState from "@/components/feedback/EmptyState";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/layout/PageHeader";
import PaginationControls from "@/components/navigation/PaginationControls";
import useAuth from "@/hooks/useAuth";
import { authJsonRequest, extractCollection } from "@/services/api";

const ITENS_POR_PAGINA = 6;

function formatarProdutos(produtos) {
  if (!produtos?.length) {
    return "Sem produtos";
  }

  return produtos.join(", ");
}

export default function FornecedoresPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fornecedores, setFornecedores] = useState([]);
  const [busca, setBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);

  useEffect(() => {
    async function carregarFornecedores() {
      try {
        const data = await authJsonRequest(
          "/fornecedores/",
          {},
          "Erro ao carregar fornecedores.",
        );
        setFornecedores(extractCollection(data));
      } catch (error) {
        toast.error(error.message);
      }
    }

    carregarFornecedores();
  }, []);

  const fornecedoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return fornecedores.filter((fornecedor) => {
      const produtos = fornecedor.produtos_fornecidos?.join(" ").toLowerCase() || "";
      return (
        fornecedor.nome?.toLowerCase().includes(termo) ||
        fornecedor.contato?.toLowerCase().includes(termo) ||
        fornecedor.cidade?.toLowerCase().includes(termo) ||
        produtos.includes(termo)
      );
    });
  }, [fornecedores, busca]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(fornecedoresFiltrados.length / ITENS_POR_PAGINA),
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const fornecedoresPaginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;
    return fornecedoresFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [fornecedoresFiltrados, paginaSegura]);

  function atualizarBusca(value) {
    setBusca(value);
    setPaginaAtual(1);
  }

  async function excluirFornecedor(id) {
    if (!window.confirm("Deseja excluir este fornecedor?")) {
      return;
    }

    try {
      await authJsonRequest(
        `/fornecedores/${id}/`,
        { method: "DELETE" },
        "Erro ao excluir fornecedor.",
      );
      setFornecedores((prevState) =>
        prevState.filter((fornecedor) => fornecedor.id !== id),
      );
      toast.success("Fornecedor excluído com sucesso.");
    } catch (error) {
      toast.error(error.message);
    }
  }

  function irParaPagina(numero) {
    if (numero < 1 || numero > totalPaginas) {
      return;
    }

    setPaginaAtual(numero);
  }

  return (
    <Layout title="Fornecedores">
      <PageHeader
        title="Fornecedores"
        action={
          user?.tipo === "admin" ? (
            <button
              type="button"
              className="button-primary"
              onClick={() => navigate("/novo-fornecedor")}
            >
              Novo fornecedor
            </button>
          ) : null
        }
      />

      <div className="page-card section-card">
        <input
          type="text"
          placeholder="Buscar fornecedor"
          value={busca}
          onChange={(event) => atualizarBusca(event.target.value)}
        />
      </div>

      <div className="page-card table-card">
        <div className="table-wrapper">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cidade</th>
                <th>Contato</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {fornecedoresPaginados.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState>Nenhum fornecedor encontrado.</EmptyState>
                  </td>
                </tr>
              ) : (
                fornecedoresPaginados.map((fornecedor) => (
                  <tr key={fornecedor.id}>
                    <td>
                      <div className="table-cell-primary">{fornecedor.nome}</div>
                      <div className="table-cell-meta">
                        {formatarProdutos(fornecedor.produtos_fornecidos)}
                      </div>
                    </td>
                    <td>{fornecedor.cidade || "-"}</td>
                    <td>{fornecedor.contato || "-"}</td>
                    <td>
                      {user?.tipo === "admin" ? (
                        <div className="table-actions">
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() =>
                              navigate(`/editar-fornecedor/${fornecedor.id}`)
                            }
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="button-danger"
                            onClick={() => excluirFornecedor(fornecedor.id)}
                          >
                            Excluir
                          </button>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
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
