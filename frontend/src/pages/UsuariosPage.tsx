import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import AccessNotice from "../components/AccessNotice";
import EmptyState from "../components/EmptyState";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import PaginationControls from "../components/PaginationControls";
import useAuth from "../hooks/useAuth";
import { authJsonRequest, extractCollection } from "../services/api";

const ITENS_POR_PAGINA = 6;

function getTipoLabel(tipo) {
  if (tipo === "admin") {
    return "Administrador";
  }

  if (tipo === "funcionario") {
    return "Funcionário";
  }

  return tipo || "-";
}


export default function UsuariosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [busca, setBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);

  useEffect(() => {
    async function carregarUsuarios() {
      if (user?.tipo !== "admin") {
        return;
      }

      try {
        const data = await authJsonRequest("/usuarios/", {}, "Erro ao carregar usuários.");
        setUsuarios(extractCollection(data));
      } catch (error) {
        toast.error(error.message);
      }
    }

    carregarUsuarios();
  }, [user]);

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      return (
        usuario.username?.toLowerCase().includes(termo) ||
        usuario.tipo?.toLowerCase().includes(termo)
      );
    });
  }, [usuarios, busca]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(usuariosFiltrados.length / ITENS_POR_PAGINA),
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;
    return usuariosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [paginaSegura, usuariosFiltrados]);

  function atualizarBusca(value) {
    setBusca(value);
    setPaginaAtual(1);
  }

  async function excluirUsuario(id) {
    if (!window.confirm("Deseja excluir este usuário?")) {
      return;
    }

    try {
      await authJsonRequest(`/usuarios/${id}/`, { method: "DELETE" }, "Erro ao excluir usuário.");
      setUsuarios((prevState) => prevState.filter((usuario) => usuario.id !== id));
      toast.success("Usuário excluído com sucesso.");
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

  if (user?.tipo !== "admin") {
    return (
      <Layout title="Usuários">
        <AccessNotice>Acesso restrito ao administrador.</AccessNotice>
      </Layout>
    );
  }

  return (
    <Layout title="Usuários">
      <PageHeader
        title="Gestão de usuários"
        description="Controle os perfis de acesso que podem operar o sistema."
        action={
          <button
            type="button"
            className="button-primary"
            onClick={() => navigate("/novo-usuario")}
          >
            Novo Usuário
          </button>
        }
      />

      <div className="page-card section-card">
        <input
          type="text"
          placeholder="Buscar por usuário ou perfil"
          value={busca}
          onChange={(event) => atualizarBusca(event.target.value)}
        />
      </div>

      <div className="page-card table-card">
        <div className="table-wrapper">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Perfil</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuariosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <EmptyState>Nenhum usuário encontrado.</EmptyState>
                  </td>
                </tr>
              ) : (
                usuariosPaginados.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>{usuario.username}</td>
                    <td>
                      <span
                        className={`badge ${
                          usuario.tipo === "admin"
                            ? "badge-success"
                            : "badge-warning"
                        }`}
                      >
                        {getTipoLabel(usuario.tipo)}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() => navigate(`/editar-usuario/${usuario.id}`)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="button-danger"
                          onClick={() => excluirUsuario(usuario.id)}
                        >
                          Excluir
                        </button>
                      </div>
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
