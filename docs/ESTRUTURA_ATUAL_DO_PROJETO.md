# Estrutura Atual Do Projeto

## Objetivo

Este documento explica a estrutura real atual do `EstoquePro`, com base no código que está no repositório hoje.

Pontos importantes:

- o frontend atual usa `TypeScript` com arquivos `ts/tsx`;
- parte da documentação antiga ainda fala em `js/jsx`;
- o frontend foi validado com `npm run lint` e `npm run build`.

---

## Visão Geral

O projeto está dividido em três áreas principais:

1. `frontend/`
   Aplicação visual em React + Vite.

2. `backend/`
   API e regras de negócio em Django REST Framework.

3. `docs/`
   Documentação funcional e técnica.

Fluxo principal:

```text
Usuário -> Frontend React -> Requisição HTTP -> Backend Django -> Regras de negócio -> PostgreSQL
```

---

## Mapa Da Raiz

```text
PROJETO_MVP/
|-- .vscode/
|-- backend/
|-- docs/
|-- frontend/
|-- node_modules/
|-- package.json
|-- package-lock.json
|-- README.md
```

### O que cada item faz

#### `.vscode/`

Configuração local do editor. Hoje existe `launch.json`.

Observação:

- aponta para `localhost:8080`, mas o frontend do projeto roda pelo Vite em `localhost:5173`.

#### `backend/`

Contém:

- regras de negócio;
- autenticação;
- API;
- acesso ao banco;
- importação de NF-e;
- estoque, pedidos, relatórios e branding.

#### `docs/`

Contém a documentação do projeto:

- `PRD.md`
- `MIGRACAO_POSTGRESQL.md`
- `GUIA_DETALHADO_DO_SISTEMA.md`
- `GLOSSARIO_TERMOS_PARA_INICIANTES.md`
- `ESTRUTURA_ATUAL_DO_PROJETO.md`

#### `frontend/`

Contém a aplicação React:

- telas;
- rotas;
- login;
- chamadas para API;
- layout;
- tema visual.

#### `node_modules/` na raiz

Dependências instaladas por `npm` na raiz.

Na prática:

- não é a área principal do frontend;
- parece residual ou auxiliar, porque o app real está em `frontend/`.

#### `package.json` na raiz

Hoje contém apenas `react-toastify`.

Leitura mais segura:

- não é o centro da aplicação;
- o arquivo realmente importante do frontend é `frontend/package.json`.

#### `README.md`

Resumo principal do projeto, setup, stack e rotas.

---

## Pastas Que Normalmente Você Não Edita

Estas pastas existem no projeto, mas não são o melhor lugar para estudar a lógica:

- `node_modules/`: bibliotecas instaladas.
- `frontend/dist/`: saída do build.
- `backend/venv/`: ambiente virtual Python.
- `backend/app/__pycache__/` e `backend/config/__pycache__/`: cache do Python.
- `backend/media/`: arquivos enviados pelo sistema, principalmente logos.
- `backend/backups/`: backups e arquivos temporários de backup.
- `backend/tmp-test-runs/`: arquivos temporários de teste.

Observação importante:

- existe `backend/db.sqlite3`, mas o `settings.py` atual exige PostgreSQL;
- isso indica arquivo legado, auxiliar ou sobra de uma fase anterior.

---

## Backend

Mapa resumido:

```text
backend/
|-- .env
|-- .env.example
|-- app/
|-- backups/
|-- config/
|-- media/
|-- tmp-test-runs/
|-- venv/
|-- db.sqlite3
|-- manage.py
|-- requirements.txt
```

### Arquivos principais

#### `manage.py`

Script de comando do Django.

Serve para:

- `runserver`
- `migrate`
- `makemigrations`
- `test`
- `check`
- `createsuperuser`

#### `requirements.txt`

Lista de dependências Python do backend.

Pacotes principais:

- `Django`
- `djangorestframework`
- `djangorestframework_simplejwt`
- `django-filter`
- `django-cors-headers`
- `psycopg2-binary`

#### `.env.example`

Modelo de configuração local.

Mostra como configurar:

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_CORS_ALLOWED_ORIGINS`
- `DATABASE_URL`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`

---

## `backend/config/`

Configuração global do Django.

```text
backend/config/
|-- __init__.py
|-- asgi.py
|-- settings.py
|-- urls.py
|-- wsgi.py
```

### `settings.py`

Arquivo mais importante da configuração.

Define:

- leitura do `.env`;
- apps instaladas;
- middlewares;
- banco de dados;
- CORS;
- autenticação da API;
- JWT;
- mídia.

O que ele revela:

- o backend foi preparado para PostgreSQL;
- a API usa JWT;
- as permissões padrão exigem usuário autenticado.

### `urls.py`

Roteador principal.

Liga:

- `/admin/`
- `/api/`
- `/api/token/`
- `/api/token/refresh/`

### `asgi.py` e `wsgi.py`

Entradas de deploy do projeto Django.

---

## `backend/app/`

É a aplicação principal de negócio.

```text
backend/app/
|-- admin.py
|-- apps.py
|-- models.py
|-- permissions.py
|-- serializers.py
|-- signals.py
|-- tests.py
|-- urls.py
|-- views.py
|-- management/
|-- migrations/
|-- services/
```

### Como entender esta pasta

- `models.py` = estrutura dos dados
- `serializers.py` = validação e formato da API
- `views.py` = entrada HTTP
- `services/` = regra de negócio
- `permissions.py` = quem pode fazer o quê
- `signals.py` = automações do Django
- `tests.py` = segurança de comportamento

### `models.py`

Modelos do sistema:

- `PerfilUsuario`
- `Fornecedor`
- `Produto`
- `Variacao`
- `PedidoVenda`
- `Movimentacao`
- `PedidoVendaItem`
- `ImportacaoNotaFiscal`
- `ImportacaoNotaFiscalItem`
- `ConfiguracaoSistema`

Resumo do papel de cada um:

- `PerfilUsuario`: tipo do usuário, como `admin` e `funcionario`.
- `Fornecedor`: dados do fornecedor.
- `Produto`: cadastro base do item, com SKU, preços e estoque mínimo.
- `Variacao`: item estocável real, por cor/tamanho/numeração.
- `PedidoVenda`: pedido com status `rascunho`, `finalizado` e `cancelado`.
- `Movimentacao`: histórico formal de entrada e saída.
- `PedidoVendaItem`: itens do pedido.
- `ImportacaoNotaFiscal`: cabeçalho da importação.
- `ImportacaoNotaFiscalItem`: itens vindos da nota.
- `ConfiguracaoSistema`: branding global, nome, logo e cores.

Pontos fortes deste arquivo:

- valida categorias e subcategorias;
- impede SKU duplicado;
- impede variação duplicada;
- impede saldo negativo;
- trata `ConfiguracaoSistema` como configuração única.

### `permissions.py`

Permissões centralizadas:

- `IsAdminEmpresa`
- `IsAdminOrReadOnly`
- `IsAdminOrFuncionario`

### `signals.py`

Cria e mantém `PerfilUsuario` automaticamente quando o `User` do Django é salvo.

### `serializers.py`

Valida os dados que entram e formata os dados que saem da API.

Principais serializers:

- usuários;
- fornecedores;
- produtos;
- variações;
- movimentações;
- pedidos;
- primeiro acesso;
- importação de nota;
- configuração do sistema.

### `views.py`

Recebe as requisições HTTP.

Views principais:

- `UsuarioViewSet`
- `UsuarioLogadoView`
- `PrimeiroAcessoView`
- `ConfiguracaoSistemaView`
- `EntradaEstoqueView`
- `SaidaEstoqueView`
- `NotaFiscalImportacaoPreviewView`
- `NotaFiscalImportacaoAplicarView`
- `NotaFiscalImportacaoLimparView`
- `RelatorioMensalView`
- `RelatorioReposicaoView`
- `FornecedorViewSet`
- `ProdutoViewSet`
- `VariacaoViewSet`
- `MovimentacaoViewSet`
- `PedidoVendaViewSet`

### `urls.py`

Rotas da app:

- `fornecedores/`
- `produtos/`
- `variacoes/`
- `movimentacoes/`
- `pedidos/`
- `usuarios/`
- `primeiro-acesso/`
- `configuracao-sistema/`
- `entrada-estoque/`
- `saida-estoque/`
- `importacao-nota-fiscal/preview/`
- `importacao-nota-fiscal/aplicar/`
- `importacao-nota-fiscal/<id>/limpar/`
- `relatorios/mensal/`
- `relatorios/reposicao/`
- `usuario-logado/`

### `admin.py`

Customiza o Django Admin para facilitar inspeção e manutenção.

### `tests.py`

Testa regras críticas como:

- movimentação;
- primeiro acesso;
- pedidos;
- importação de NF-e;
- relatórios;
- branding.

É um ótimo arquivo para estudar o comportamento do sistema.

---

## `backend/app/services/`

É a camada de regra de negócio.

```text
backend/app/services/
|-- common.py
|-- configuracao.py
|-- estoque.py
|-- nota_fiscal.py
|-- pedidos.py
|-- relatorios.py
```

### O que cada arquivo faz

- `common.py`: normalizações e inferências usadas na importação.
- `configuracao.py`: administrador inicial e configuração do sistema.
- `estoque.py`: criação de variação com estoque inicial e registro de movimentação.
- `nota_fiscal.py`: leitura de XML/PDF, preview, aplicação e limpeza de importação.
- `pedidos.py`: salvar pedido, baixar estoque e estornar.
- `relatorios.py`: relatórios mensal e de reposição.

Se você quiser entender a regra pesada do projeto, esta pasta é uma prioridade.

### `migrations/`

Histórico de evolução do banco.

Você normalmente lê para entender a história do sistema, não para estudar regra principal.

### `management/`

Estrutura preparada para comandos customizados do Django.

Estado atual:

- existe;
- está praticamente vazia.

---

## Frontend

Mapa resumido:

```text
frontend/
|-- README.md
|-- eslint.config.js
|-- index.html
|-- package.json
|-- package-lock.json
|-- tsconfig.json
|-- tsconfig.app.json
|-- tsconfig.node.json
|-- vite.config.ts
|-- public/
|-- dist/
|-- node_modules/
|-- src/
```

### Arquivos principais

#### `package.json`

Arquivo central do frontend.

Scripts:

- `dev`
- `build`
- `type-check`
- `lint`
- `preview`

Dependências principais:

- `react`
- `react-dom`
- `react-router-dom`
- `react-toastify`

#### `vite.config.ts`

Configuração do Vite.

Hoje ele:

- ativa plugin React;
- resolve aliases de `react` e `react-dom`;
- deduplica React;
- otimiza dependências como `react-toastify`.

#### `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`

Configuração do TypeScript.

Eles confirmam que o frontend atual está em `ts/tsx`, não em `js/jsx`.

#### `eslint.config.js`

Configuração do lint.

Também confirma o padrão `src/**/*.{ts,tsx}`.

#### `index.html`

HTML base com o `<div id="root"></div>` e o favicon inicial.

Observação:

- ainda referencia `main.jsx`, embora o arquivo existente seja `main.tsx`;
- apesar disso, o build atual do frontend funcionou normalmente.

---

## `frontend/src/`

É o código-fonte do frontend.

```text
frontend/src/
|-- App.css
|-- App.tsx
|-- index.css
|-- main.tsx
|-- vite-env.d.ts
|-- assets/
|-- components/
|-- constants/
|-- context/
|-- hooks/
|-- pages/
|-- routes/
|-- services/
|-- utils/
```

### Arquivos centrais

#### `main.tsx`

Entrada do React. Monta o `<App />` no elemento `root`.

#### `App.tsx`

É o mapa principal da SPA.

Ele:

- envolve o app com `SystemConfigProvider`;
- envolve com `AuthProvider`;
- cria o `BrowserRouter`;
- define todas as rotas;
- registra o `ToastContainer`.

#### `index.css`

Arquivo principal de estilo do frontend.

#### `App.css`

Existe no projeto, mas não parece ser o centro dos estilos atuais.

#### `vite-env.d.ts`

Arquivo de apoio do Vite/TypeScript.

---

## `frontend/src/components/`

Componentes reutilizáveis:

- `AccessNotice.tsx`
- `EmptyState.tsx`
- `Layout.tsx`
- `PageHeader.tsx`
- `PaginationControls.tsx`
- `Sidebar.tsx`
- `SummaryCard.tsx`
- `Topbar.tsx`

Função resumida:

- `Layout.tsx`: casca principal das páginas.
- `Sidebar.tsx`: navegação, usuário logado, logout e branding.
- `Topbar.tsx`: título da página.
- `PageHeader.tsx`: cabeçalho reutilizável.
- `SummaryCard.tsx`: cards de resumo.
- `PaginationControls.tsx`: paginação.
- `EmptyState.tsx`: lista vazia.
- `AccessNotice.tsx`: aviso de acesso.

---

## `frontend/src/context/`

Estado global do app.

Arquivos:

- `auth-context.ts`
- `AuthContext.tsx`
- `system-config-context.ts`
- `SystemConfigContext.tsx`

Padrão usado:

- `*-context.ts` guarda o objeto de contexto;
- `*Context.tsx` guarda o provider com estado e funções.

### `AuthContext.tsx`

Controla:

- usuário logado;
- loading da sessão;
- login;
- logout;
- hidratação a partir do `localStorage`.

### `SystemConfigContext.tsx`

Controla:

- nome da empresa;
- logo;
- cores;
- aplicação do tema;
- favicon e branding global.

---

## `frontend/src/hooks/`

Hooks personalizados:

- `useAuth.ts`
- `useIsMobile.ts`
- `useSystemConfig.ts`

Uso:

- consumir contextos;
- encapsular lógica de responsividade.

---

## `frontend/src/routes/`

Arquivo encontrado:

- `PrivateRoute.tsx`

Função:

- bloquear telas privadas sem sessão válida;
- redirecionar para `/login`;
- mostrar carregamento enquanto a sessão é resolvida.

---

## `frontend/src/services/`

Arquivo encontrado:

- `api.ts`

É um dos arquivos mais importantes do frontend.

Centraliza:

- URL base da API;
- tratamento de erro;
- requests JSON;
- envio autenticado;
- refresh token;
- armazenamento da sessão;
- busca do usuário logado.

---

## `frontend/src/constants/`

Arquivo encontrado:

- `productOptions.ts`

Guarda:

- categorias;
- subcategorias;
- tamanhos;
- numerações;
- funções auxiliares para formulário.

---

## `frontend/src/utils/`

Arquivos:

- `branding.ts`
- `formatters.ts`
- `reportExports.ts`

Função de cada um:

- `branding.ts`: tema dinâmico, contraste, favicon e paleta da marca.
- `formatters.ts`: moeda, data e texto.
- `reportExports.ts`: impressão e exportação de relatórios.

---

## `frontend/src/pages/`

Páginas completas do sistema:

- `DashboardHome.tsx`
- `ProdutosPage.tsx`
- `NovoProduto.tsx`
- `EditarProduto.tsx`
- `EstoqueBaixoPage.tsx`
- `MovimentacoesPage.tsx`
- `NovaMovimentacao.tsx`
- `FornecedoresPage.tsx`
- `NovoFornecedor.tsx`
- `EditarFornecedor.tsx`
- `PedidosPage.tsx`
- `PedidoFormPage.tsx`
- `ImportarNotaFiscalPage.tsx`
- `RelatoriosPage.tsx`
- `UsuariosPage.tsx`
- `NovoUsuario.tsx`
- `EditarUsuario.tsx`
- `ConfiguracoesSistemaPage.tsx`
- `Login.tsx`
- `PrimeiroAcessoPage.tsx`

Como pensar esta pasta:

- cada arquivo representa uma tela completa;
- `novo-*` costuma ser criação;
- `editar-*` costuma ser edição;
- `*Page` costuma indicar uma página ligada a rota.

Páginas de maior peso funcional:

- `DashboardHome.tsx`
- `ProdutosPage.tsx`
- `PedidoFormPage.tsx`
- `ImportarNotaFiscalPage.tsx`
- `RelatoriosPage.tsx`
- `ConfiguracoesSistemaPage.tsx`

---

## Rotas Do Frontend

Rotas principais definidas em `App.tsx`:

- `/login`
- `/primeiro-acesso`
- `/`
- `/pedidos`
- `/novo-pedido`
- `/editar-pedido/:id`
- `/produtos`
- `/novo-produto`
- `/editar-produto/:id`
- `/estoque-baixo`
- `/movimentacoes`
- `/nova-movimentacao`
- `/importar-nota-fiscal`
- `/fornecedores`
- `/novo-fornecedor`
- `/editar-fornecedor/:id`
- `/relatorios`
- `/usuarios`
- `/novo-usuario`
- `/editar-usuario/:id`
- `/configuracoes`

---

## Rotas Principais Da API

- `POST /api/token/`
- `POST /api/token/refresh/`
- `GET /api/usuario-logado/`
- `GET/POST /api/primeiro-acesso/`
- `GET/PATCH /api/configuracao-sistema/`
- `POST /api/entrada-estoque/`
- `POST /api/saida-estoque/`
- `POST /api/importacao-nota-fiscal/preview/`
- `POST /api/importacao-nota-fiscal/aplicar/`
- `DELETE /api/importacao-nota-fiscal/<id>/limpar/`
- `GET /api/relatorios/mensal/`
- `GET /api/relatorios/reposicao/`
- `/api/fornecedores/`
- `/api/produtos/`
- `/api/variacoes/`
- `/api/movimentacoes/`
- `/api/pedidos/`
- `/api/usuarios/`

---

## Como As Camadas Se Conectam

### Exemplo: login

```text
Login.tsx
-> api.ts / loginRequest()
-> POST /api/token/
-> AuthContext.tsx salva a sessão
-> meRequest() busca /api/usuario-logado/
```

### Exemplo: entrada de estoque

```text
NovaMovimentacao.tsx
-> authJsonRequest()
-> POST /api/entrada-estoque/
-> views.py
-> serializers.py
-> services/estoque.py
-> models.py
```

### Exemplo: importação de nota

```text
ImportarNotaFiscalPage.tsx
-> preview da nota
-> backend lê XML ou PDF
-> usuário resolve os itens
-> backend cria fornecedor/produto/variação se necessário
-> backend registra entradas e histórico
```

---

## Pontos De Atenção

Estas observações ajudam a não se confundir:

1. Parte da documentação antiga ainda descreve o frontend como `js/jsx`.
   O código atual está em `ts/tsx`.

2. Existe `package.json` na raiz, mas o frontend operacional real está em `frontend/package.json`.

3. Existe `backend/db.sqlite3`, porém a configuração atual usa PostgreSQL.

4. `.vscode/launch.json` aponta para `localhost:8080`, enquanto o fluxo atual usa `localhost:5173`.

5. `frontend/src/assets/` e `frontend/src/App.css` parecem mais auxiliares ou legados do que centrais.

6. `backend/app/management/commands/` existe, mas está praticamente vazio.

---

## Ordem Recomendada Para Estudar

### Backend

1. `backend/config/settings.py`
2. `backend/config/urls.py`
3. `backend/app/models.py`
4. `backend/app/serializers.py`
5. `backend/app/views.py`
6. `backend/app/services/estoque.py`
7. `backend/app/services/pedidos.py`
8. `backend/app/services/nota_fiscal.py`
9. `backend/app/tests.py`

### Frontend

1. `frontend/src/main.tsx`
2. `frontend/src/App.tsx`
3. `frontend/src/services/api.ts`
4. `frontend/src/context/AuthContext.tsx`
5. `frontend/src/context/SystemConfigContext.tsx`
6. `frontend/src/components/Layout.tsx`
7. `frontend/src/components/Sidebar.tsx`
8. `frontend/src/pages/DashboardHome.tsx`
9. `frontend/src/pages/ProdutosPage.tsx`
10. `frontend/src/pages/PedidoFormPage.tsx`
11. `frontend/src/pages/ImportarNotaFiscalPage.tsx`
12. `frontend/src/pages/RelatoriosPage.tsx`
13. `frontend/src/pages/ConfiguracoesSistemaPage.tsx`

---

## Resumo Final

O projeto está bem organizado por responsabilidade:

- `models.py` define os dados;
- `serializers.py` valida e formata;
- `views.py` recebe a requisição;
- `services/` aplica a regra de negócio;
- `tests.py` protege comportamentos críticos;
- `pages/` guarda telas completas;
- `components/` guarda peças reutilizáveis;
- `context/` guarda estado global;
- `services/api.ts` centraliza a conversa com o backend.

Se você entender bem estes blocos, você já consegue navegar no projeto com bastante segurança.
