import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import { SystemConfigProvider } from "./context/SystemConfigContext";
import PrivateRoute from "./routes/PrivateRoute";
import ConfiguracoesSistemaPage from "./pages/ConfiguracoesSistemaPage";
import DashboardHome from "./pages/DashboardHome";
import EditarFornecedor from "./pages/EditarFornecedor";
import EditarProduto from "./pages/EditarProduto";
import EditarUsuario from "./pages/EditarUsuario";
import EstoqueBaixoPage from "./pages/EstoqueBaixoPage";
import FornecedoresPage from "./pages/FornecedoresPage";
import ImportarNotaFiscalPage from "./pages/ImportarNotaFiscalPage";
import Login from "./pages/Login";
import MovimentacoesPage from "./pages/MovimentacoesPage";
import NovaMovimentacao from "./pages/NovaMovimentacao";
import NovoFornecedor from "./pages/NovoFornecedor";
import PedidoFormPage from "./pages/PedidoFormPage";
import PedidosPage from "./pages/PedidosPage";
import PrimeiroAcessoPage from "./pages/PrimeiroAcessoPage";
import NovoProduto from "./pages/NovoProduto";
import NovoUsuario from "./pages/NovoUsuario";
import ProdutosPage from "./pages/ProdutosPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import UsuariosPage from "./pages/UsuariosPage";


function ProtectedPage({ children }) {
  return <PrivateRoute>{children}</PrivateRoute>;
}


export default function App() {
  return (
    <SystemConfigProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/primeiro-acesso" element={<PrimeiroAcessoPage />} />

            <Route
              path="/"
              element={
                <ProtectedPage>
                  <DashboardHome />
                </ProtectedPage>
              }
            />
            <Route
              path="/pedidos"
              element={
                <ProtectedPage>
                  <PedidosPage />
                </ProtectedPage>
              }
            />
            <Route
              path="/novo-pedido"
              element={
                <ProtectedPage>
                  <PedidoFormPage />
                </ProtectedPage>
              }
            />
            <Route
              path="/editar-pedido/:id"
              element={
                <ProtectedPage>
                  <PedidoFormPage />
                </ProtectedPage>
              }
            />
            <Route
              path="/produtos"
              element={
                <ProtectedPage>
                  <ProdutosPage />
                </ProtectedPage>
              }
            />
            <Route
              path="/novo-produto"
              element={
                <ProtectedPage>
                  <NovoProduto />
                </ProtectedPage>
              }
            />
            <Route
              path="/editar-produto/:id"
              element={
                <ProtectedPage>
                  <EditarProduto />
                </ProtectedPage>
              }
            />
            <Route
              path="/estoque-baixo"
              element={
                <ProtectedPage>
                  <EstoqueBaixoPage />
                </ProtectedPage>
              }
            />
            <Route
              path="/movimentacoes"
              element={
                <ProtectedPage>
                  <MovimentacoesPage />
                </ProtectedPage>
              }
            />
            <Route
              path="/nova-movimentacao"
              element={
                <ProtectedPage>
                  <NovaMovimentacao />
                </ProtectedPage>
              }
            />
            <Route
              path="/importar-nota-fiscal"
              element={
                <ProtectedPage>
                  <ImportarNotaFiscalPage />
                </ProtectedPage>
              }
            />
            <Route
              path="/fornecedores"
              element={
                <ProtectedPage>
                  <FornecedoresPage />
                </ProtectedPage>
              }
            />
            <Route
              path="/novo-fornecedor"
              element={
                <ProtectedPage>
                  <NovoFornecedor />
                </ProtectedPage>
              }
            />
            <Route
              path="/editar-fornecedor/:id"
              element={
                <ProtectedPage>
                  <EditarFornecedor />
                </ProtectedPage>
              }
            />
            <Route
              path="/relatorios"
              element={
                <ProtectedPage>
                  <RelatoriosPage />
                </ProtectedPage>
              }
            />
            <Route
              path="/usuarios"
              element={
                <ProtectedPage>
                  <UsuariosPage />
                </ProtectedPage>
              }
            />
            <Route
              path="/novo-usuario"
              element={
                <ProtectedPage>
                  <NovoUsuario />
                </ProtectedPage>
              }
            />
            <Route
              path="/editar-usuario/:id"
              element={
                <ProtectedPage>
                  <EditarUsuario />
                </ProtectedPage>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <ProtectedPage>
                  <ConfiguracoesSistemaPage />
                </ProtectedPage>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <ToastContainer
            position="top-right"
            autoClose={3000}
            newestOnTop
            pauseOnFocusLoss={false}
          />
        </BrowserRouter>
      </AuthProvider>
    </SystemConfigProvider>
  );
}
