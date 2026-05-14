import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import PrivateRoute from "@/app/PrivateRoute";
import ConfiguracoesSistemaPage from "@/pages/ConfiguracoesSistemaPage";
import DashboardHome from "@/pages/DashboardHome";
import EditarFornecedor from "@/pages/EditarFornecedor";
import EditarProduto from "@/pages/EditarProduto";
import EditarUsuario from "@/pages/EditarUsuario";
import EstoqueBaixoPage from "@/pages/EstoqueBaixoPage";
import FornecedoresPage from "@/pages/FornecedoresPage";
import Login from "@/pages/Login";
import MovimentacoesPage from "@/pages/MovimentacoesPage";
import NovaMovimentacao from "@/pages/NovaMovimentacao";
import NovoFornecedor from "@/pages/NovoFornecedor";
import NovoProduto from "@/pages/NovoProduto";
import NovoUsuario from "@/pages/NovoUsuario";
import PedidoFormPage from "@/pages/PedidoFormPage";
import PedidosPage from "@/pages/PedidosPage";
import PrimeiroAcessoPage from "@/pages/PrimeiroAcessoPage";
import ProdutosPage from "@/pages/ProdutosPage";
import RelatoriosPage from "@/pages/RelatoriosPage";
import UsuariosPage from "@/pages/UsuariosPage";

const publicRoutes = [
  { path: "/login", element: <Login /> },
  { path: "/primeiro-acesso", element: <PrimeiroAcessoPage /> },
];

const protectedRoutes = [
  { path: "/", element: <DashboardHome /> },
  { path: "/pedidos", element: <PedidosPage /> },
  { path: "/novo-pedido", element: <PedidoFormPage /> },
  { path: "/produtos", element: <ProdutosPage /> },
  { path: "/novo-produto", element: <NovoProduto /> },
  { path: "/editar-produto/:id", element: <EditarProduto /> },
  { path: "/estoque-baixo", element: <EstoqueBaixoPage /> },
  { path: "/movimentacoes", element: <MovimentacoesPage /> },
  { path: "/nova-movimentacao", element: <NovaMovimentacao /> },
  { path: "/fornecedores", element: <FornecedoresPage /> },
  { path: "/novo-fornecedor", element: <NovoFornecedor /> },
  { path: "/editar-fornecedor/:id", element: <EditarFornecedor /> },
  { path: "/relatorios", element: <RelatoriosPage /> },
  { path: "/usuarios", element: <UsuariosPage /> },
  { path: "/novo-usuario", element: <NovoUsuario /> },
  { path: "/editar-usuario/:id", element: <EditarUsuario /> },
  { path: "/configuracoes", element: <ConfiguracoesSistemaPage /> },
];

function ProtectedPage({ children }: { children: ReactNode }) {
  return <PrivateRoute>{children}</PrivateRoute>;
}

export default function AppRoutes() {
  return (
    <Routes>
      {publicRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      {protectedRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<ProtectedPage>{route.element}</ProtectedPage>}
        />
      ))}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
