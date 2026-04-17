# Glossario De Termos Para Iniciantes

## 1. Objetivo Deste Arquivo

Este glossario foi criado para complementar o arquivo `docs/GUIA_DETALHADO_DO_SISTEMA.md`.

A ideia aqui nao e explicar o sistema inteiro de novo. A ideia e traduzir os nomes e termos tecnicos que aparecem na documentacao e no codigo para uma linguagem mais simples.

Sempre que voce encontrar uma palavra "estranha", consulte este arquivo.

Formato de cada explicacao:

- `O que e`: significado simples do termo.
- `Para que serve`: funcao pratica do termo.
- `Exemplo no projeto`: onde isso aparece no seu sistema.

---

## 2. Termos De Estrutura Do Projeto

### projeto

**O que e:** o conjunto inteiro da aplicacao, com todos os arquivos, pastas, configuracoes e codigos.

**Para que serve:** organizar tudo o que faz o sistema existir e funcionar.

**Exemplo no projeto:** a pasta `PROJETO_MVP` inteira e o projeto.

### repositorio

**O que e:** o lugar onde o codigo do projeto fica armazenado e versionado. Muitas vezes isso e feito com Git.

**Para que serve:** acompanhar historico de mudancas, trabalho em equipe e backup do codigo.

**Exemplo no projeto:** esta pasta parece ser a copia de trabalho do seu projeto, mesmo sem uma pasta `.git` ativa no momento.

### diretorio ou pasta

**O que e:** uma pasta do sistema de arquivos.

**Para que serve:** agrupar arquivos por assunto ou responsabilidade.

**Exemplo no projeto:** `frontend/`, `backend/` e `docs/` sao diretorios.

### arquivo

**O que e:** uma unidade de conteudo guardada no computador.

**Para que serve:** guardar codigo, configuracao, imagem, documento ou banco.

**Exemplo no projeto:** `frontend/src/App.jsx` e um arquivo.

### raiz do projeto

**O que e:** a pasta principal do projeto.

**Para que serve:** ser o ponto inicial de onde todas as outras pastas saem.

**Exemplo no projeto:** `c:/Users/rogerio/OneDrive/Desktop/PROJETO_MVP`.

### frontend

**O que e:** a parte visual do sistema, aquilo que o usuario enxerga e usa na tela.

**Para que serve:** mostrar telas, formularios, tabelas, botoes e interacoes.

**Exemplo no projeto:** a pasta `frontend/` contem o app React.

### backend

**O que e:** a parte interna do sistema, onde ficam as regras de negocio, seguranca, API e acesso ao banco.

**Para que serve:** receber pedidos do frontend, validar, processar e salvar dados.

**Exemplo no projeto:** a pasta `backend/` contem o app Django.

### docs

**O que e:** abreviacao de "documentation", ou seja, documentacao.

**Para que serve:** guardar explicacoes, guias, PRD e materiais de consulta.

**Exemplo no projeto:** a pasta `docs/` guarda o PRD, o guia detalhado e este glossario.

### src

**O que e:** abreviacao de "source", que significa codigo-fonte.

**Para que serve:** concentrar os arquivos principais de codigo da aplicacao.

**Exemplo no projeto:** `frontend/src/` e onde esta o codigo React.

### public

**O que e:** pasta de arquivos publicos servidos diretamente para o navegador.

**Para que serve:** disponibilizar arquivos estaticos que nao precisam passar por processamento do React.

**Exemplo no projeto:** `frontend/public/favicon.svg`.

### assets

**O que e:** nome comum para recursos visuais como imagens, icones e arquivos graficos.

**Para que serve:** guardar materiais de apoio da interface.

**Exemplo no projeto:** `frontend/src/assets/hero.png`.

### components

**O que e:** componentes reutilizaveis da interface.

**Para que serve:** evitar repetir o mesmo bloco visual varias vezes.

**Exemplo no projeto:** `frontend/src/components/Layout.jsx` e `frontend/src/components/Sidebar.jsx`.

### pages

**O que e:** paginas completas do sistema.

**Para que serve:** representar uma tela inteira, geralmente ligada a uma rota.

**Exemplo no projeto:** `frontend/src/pages/ProdutosPage.jsx`.

### hooks

**O que e:** pasta de hooks customizados do React.

**Para que serve:** reaproveitar logicas como autenticacao, responsividade e acesso a contexto.

**Exemplo no projeto:** `frontend/src/hooks/useAuth.js`.

### context

**O que e:** pasta que guarda contextos globais do React.

**Para que serve:** compartilhar informacoes importantes entre varias telas sem passar dado manualmente por muitos niveis.

**Exemplo no projeto:** `frontend/src/context/AuthContext.jsx`.

### routes

**O que e:** pasta ligada a controle de rotas.

**Para que serve:** organizar regras de navegacao e protecao de paginas.

**Exemplo no projeto:** `frontend/src/routes/PrivateRoute.jsx`.

### services

**O que e:** pasta ou arquivo de servicos, ou seja, funcoes que executam tarefas importantes.

**Para que serve:** isolar responsabilidades.

**Exemplo no projeto:** no frontend, `frontend/src/services/api.js` fala com a API; no backend, `backend/app/services.py` guarda regras de negocio.

### utils

**O que e:** abreviacao de "utilities", ou seja, utilitarios.

**Para que serve:** concentrar funcoes auxiliares reaproveitaveis.

**Exemplo no projeto:** `frontend/src/utils/formatters.js`.

### constants

**O que e:** pasta ou arquivo de valores fixos.

**Para que serve:** guardar listas e configuracoes que nao devem ficar espalhadas no codigo.

**Exemplo no projeto:** `frontend/src/constants/productOptions.js`.

### config

**O que e:** abreviacao de "configuration", ou seja, configuracao.

**Para que serve:** concentrar arquivos que definem comportamento geral do sistema.

**Exemplo no projeto:** `backend/config/settings.py`.

### media

**O que e:** pasta de arquivos enviados pelo usuario.

**Para que serve:** guardar logos, fotos ou outros uploads sem misturar com o codigo-fonte.

**Exemplo no projeto:** `backend/media/branding/logos/`.

### migrations

**O que e:** historico de mudancas da estrutura do banco.

**Para que serve:** permitir que o banco acompanhe a evolucao dos modelos sem ser recriado do zero.

**Exemplo no projeto:** `backend/app/migrations/0008_pedidovenda_pedidovendaitem.py`.

---

## 3. Termos De Arquivos E Extensoes

### extensao de arquivo

**O que e:** a parte final do nome do arquivo, como `.py`, `.js` ou `.css`.

**Para que serve:** indicar ao sistema e aos programas qual tipo de conteudo aquele arquivo guarda.

**Exemplo no projeto:** `App.jsx` termina com `.jsx`.

### `.py`

**O que e:** extensao de arquivo Python.

**Para que serve:** guardar codigo do backend Django.

**Exemplo no projeto:** `backend/app/models.py`.

### `.js`

**O que e:** extensao de arquivo JavaScript.

**Para que serve:** guardar codigo de logica, configuracao ou servicos.

**Exemplo no projeto:** `frontend/src/services/api.js`.

### `.jsx`

**O que e:** arquivo JavaScript que tambem contem JSX.

**Para que serve:** criar componentes React com uma sintaxe parecida com HTML.

**Exemplo no projeto:** `frontend/src/App.jsx`.

### `.tsx`

**O que e:** arquivo TypeScript com JSX.

**Para que serve:** seria usado se o projeto React estivesse em TypeScript.

**Exemplo no projeto:** hoje o seu projeto nao usa `.tsx`; ele usa `.jsx`.

### `.css`

**O que e:** arquivo de estilo visual.

**Para que serve:** definir cor, espacamento, fonte, tamanho, layout e responsividade.

**Exemplo no projeto:** `frontend/src/index.css`.

### `.html`

**O que e:** arquivo base de pagina web.

**Para que serve:** dar a estrutura inicial que o navegador entende.

**Exemplo no projeto:** `frontend/index.html`.

### `.json`

**O que e:** arquivo de dados em formato texto estruturado.

**Para que serve:** guardar configuracoes e listas de forma padronizada.

**Exemplo no projeto:** `frontend/package.json`.

### `.md`

**O que e:** arquivo Markdown.

**Para que serve:** escrever documentacao com formatacao simples.

**Exemplo no projeto:** `README.md`.

### `.svg`

**O que e:** imagem vetorial.

**Para que serve:** exibir icones e logos com qualidade alta em qualquer tamanho.

**Exemplo no projeto:** `frontend/public/favicon.svg`.

### `__init__.py`

**O que e:** arquivo especial do Python.

**Para que serve:** fazer o Python tratar a pasta como um pacote importavel.

**Exemplo no projeto:** `backend/app/__init__.py`.

### `__pycache__`

**O que e:** pasta gerada automaticamente pelo Python.

**Para que serve:** guardar arquivos compilados para acelerar execucao.

**Exemplo no projeto:** `backend/app/__pycache__/`.

### `package.json`

**O que e:** arquivo central do npm para um projeto JavaScript.

**Para que serve:** guardar nome do projeto, scripts e dependencias.

**Exemplo no projeto:** `frontend/package.json`.

### `package-lock.json`

**O que e:** arquivo gerado pelo npm com as versoes exatas instaladas.

**Para que serve:** fazer instalacoes mais previsiveis e reproduziveis.

**Exemplo no projeto:** `frontend/package-lock.json`.

### `index.html`

**O que e:** nome muito comum para a pagina inicial de uma aplicacao web.

**Para que serve:** ser o ponto de entrada do navegador.

**Exemplo no projeto:** `frontend/index.html`.

### `main.jsx`

**O que e:** arquivo de entrada do React.

**Para que serve:** iniciar a aplicacao e montar o React na pagina.

**Exemplo no projeto:** `frontend/src/main.jsx`.

### `App.jsx`

**O que e:** arquivo principal da aplicacao React.

**Para que serve:** reunir providers, rotas e composicao geral do sistema.

**Exemplo no projeto:** `frontend/src/App.jsx`.

### `manage.py`

**O que e:** script principal de comandos do Django.

**Para que serve:** rodar servidor, migracoes, testes e administracao.

**Exemplo no projeto:** `backend/manage.py`.

### `vite.config.js`

**O que e:** arquivo de configuracao do Vite.

**Para que serve:** ajustar como o frontend e servido e compilado.

**Exemplo no projeto:** `frontend/vite.config.js`.

### `eslint.config.js`

**O que e:** arquivo de configuracao do ESLint.

**Para que serve:** definir regras de qualidade e consistencia do codigo.

**Exemplo no projeto:** `frontend/eslint.config.js`.

---

## 4. Termos De Web E Navegador

### navegador ou browser

**O que e:** programa que abre sites e sistemas web.

**Para que serve:** mostrar a interface do sistema para o usuario.

**Exemplo no projeto:** o usuario abre o frontend no navegador em `http://localhost:5173`.

### URL

**O que e:** o endereco de uma pagina ou recurso na web.

**Para que serve:** indicar para onde o navegador ou o frontend deve ir.

**Exemplo no projeto:** `http://127.0.0.1:8000/api`.

### rota

**O que e:** um caminho que aponta para uma tela ou recurso.

**Para que serve:** organizar navegacao e acessos.

**Exemplo no projeto:** `/produtos` e uma rota do frontend; `/api/produtos/` e uma rota da API.

### rota protegida

**O que e:** rota que exige usuario autenticado.

**Para que serve:** impedir acesso indevido a paginas internas.

**Exemplo no projeto:** `PrivateRoute.jsx` protege as telas apos login.

### favicon

**O que e:** pequeno icone que aparece na aba do navegador.

**Para que serve:** ajudar o usuario a identificar visualmente o sistema quando a pagina esta aberta.

**De onde vem o nome:** vem de "favorite icon". Antigamente era o icone exibido em favoritos do navegador, e o nome acabou ficando.

**Exemplo no projeto:** `frontend/index.html` aponta para `/favicon.svg`. Alem disso, `branding.js` consegue trocar o favicon com base na logo da empresa.

### DOM

**O que e:** representacao da pagina pelo navegador.

**Para que serve:** permitir que JavaScript e React mexam no conteudo visual da pagina.

**Exemplo no projeto:** o React monta a aplicacao no elemento `<div id="root"></div>`.

### renderizar

**O que e:** desenhar algo na tela.

**Para que serve:** mostrar componentes, textos e dados para o usuario.

**Exemplo no projeto:** `main.jsx` renderiza `<App />`.

### requisicao

**O que e:** pedido que uma parte do sistema faz para outra.

**Para que serve:** buscar, enviar, alterar ou apagar dados.

**Exemplo no projeto:** quando a tela de produtos chama a API, ela faz uma requisicao.

### resposta

**O que e:** retorno dado apos uma requisicao.

**Para que serve:** devolver dados, confirmar sucesso ou informar erro.

**Exemplo no projeto:** o backend responde com JSON quando o frontend consulta `/api/produtos/`.

### HTTP

**O que e:** protocolo usado para comunicacao na web.

**Para que serve:** padronizar como cliente e servidor trocam informacoes.

**Exemplo no projeto:** frontend e backend conversam por HTTP localmente.

### API

**O que e:** conjunto de rotas e regras para um sistema conversar com outro.

**Para que serve:** permitir que o frontend use dados e funcoes do backend.

**Exemplo no projeto:** o Django oferece uma API em `/api/`.

### endpoint

**O que e:** uma rota especifica da API.

**Para que serve:** executar uma acao concreta.

**Exemplo no projeto:** `/api/token/` e um endpoint de login.

### REST

**O que e:** estilo comum de organizacao de APIs.

**Para que serve:** padronizar a forma de expor recursos como produtos, usuarios e pedidos.

**Exemplo no projeto:** `/api/produtos/` e `/api/fornecedores/` seguem esse estilo.

### JSON

**O que e:** formato de texto usado para troca de dados.

**Para que serve:** facilitar comunicacao entre frontend e backend.

**Exemplo no projeto:** a maioria das respostas da API vem em JSON.

### payload

**O que e:** o conteudo principal enviado em uma requisicao ou resposta.

**Para que serve:** carregar os dados que realmente interessam.

**Exemplo no projeto:** ao criar um pedido, o payload contem cliente, status e itens.

### upload

**O que e:** envio de arquivo do computador do usuario para o sistema.

**Para que serve:** subir logos, XMLs e PDFs.

**Exemplo no projeto:** a tela de configuracoes faz upload da logo; a tela de NF-e faz upload de XML e PDF.

### download

**O que e:** baixar arquivo do sistema para o computador do usuario.

**Para que serve:** exportar relatorios e outros documentos.

**Exemplo no projeto:** `reportExports.js` gera e baixa PDF e Excel.

### localStorage

**O que e:** area de armazenamento simples do navegador.

**Para que serve:** guardar dados entre uma abertura e outra da pagina.

**Exemplo no projeto:** `api.js` guarda tokens e usuario no `localStorage`.

### sessao

**O que e:** estado de login atual do usuario.

**Para que serve:** manter a pessoa autenticada enquanto usa o sistema.

**Exemplo no projeto:** `AuthContext.jsx` hidrata a sessao usando os tokens guardados.

### CORS

**O que e:** regra de seguranca do navegador para comunicacao entre origens diferentes.

**Para que serve:** controlar quando um frontend pode falar com um backend em outro endereco ou porta.

**Exemplo no projeto:** `django-cors-headers` permite o frontend em `5173` conversar com o backend em `8000`.

---

## 5. Termos De Frontend E React

### React

**O que e:** biblioteca JavaScript para construir interfaces.

**Para que serve:** montar telas em blocos reutilizaveis chamados componentes.

**Exemplo no projeto:** todo o frontend em `frontend/src/` foi feito com React.

### componente

**O que e:** bloco reutilizavel de interface.

**Para que serve:** dividir a tela em partes menores e organizadas.

**Exemplo no projeto:** `SummaryCard.jsx` e um componente.

### JSX

**O que e:** sintaxe que mistura JavaScript com uma escrita parecida com HTML.

**Para que serve:** facilitar a montagem visual de componentes React.

**Exemplo no projeto:** `return <Layout title="Produtos">...</Layout>;`.

### props

**O que e:** dados que um componente recebe de outro.

**Para que serve:** personalizar o comportamento ou a aparencia do componente.

**Exemplo no projeto:** `SummaryCard` recebe `title`, `value`, `tone` e `caption`.

### state

**O que e:** estado interno de um componente.

**Para que serve:** guardar informacoes que mudam com o uso.

**Exemplo no projeto:** a busca em `ProdutosPage.jsx` fica em estado local.

### hook

**O que e:** funcao especial do React para usar estado, efeitos e outras capacidades.

**Para que serve:** controlar comportamento dos componentes.

**Exemplo no projeto:** `useState`, `useEffect` e `useMemo`.

### custom hook

**O que e:** hook criado pela propria equipe.

**Para que serve:** reaproveitar logica em varios pontos.

**Exemplo no projeto:** `useAuth.js` e `useIsMobile.js`.

### context

**O que e:** mecanismo do React para compartilhar informacoes globalmente.

**Para que serve:** evitar passar o mesmo dado manualmente por muitos componentes.

**Exemplo no projeto:** `AuthContext` compartilha usuario e sessao.

### provider

**O que e:** componente que "fornece" um contexto para o restante da aplicacao.

**Para que serve:** permitir que varios componentes acessem os mesmos dados globais.

**Exemplo no projeto:** `AuthProvider` e `SystemConfigProvider`.

### render

**O que e:** o resultado visual que o componente mostra na tela.

**Para que serve:** apresentar a interface conforme os dados atuais.

**Exemplo no projeto:** quando a lista de produtos muda, a pagina renderiza a nova tabela.

### re-render

**O que e:** nova renderizacao de um componente.

**Para que serve:** atualizar a tela quando estado ou props mudam.

**Exemplo no projeto:** ao mudar a busca, `ProdutosPage.jsx` renderiza novamente a lista filtrada.

### `useEffect`

**O que e:** hook do React para executar efeitos colaterais.

**Para que serve:** buscar dados, ouvir eventos e sincronizar comportamento fora da renderizacao pura.

**Exemplo no projeto:** varias paginas usam `useEffect` para carregar dados da API.

### `useState`

**O que e:** hook do React para guardar estado local.

**Para que serve:** armazenar valores que mudam com a interacao do usuario.

**Exemplo no projeto:** formularios usam `useState` para campos.

### `useMemo`

**O que e:** hook do React para recalcular um valor apenas quando dependencias mudam.

**Para que serve:** evitar recalculos desnecessarios em certas situacoes.

**Exemplo no projeto:** `DashboardHome.jsx` usa `useMemo` para consolidar resumos.

### SPA

**O que e:** sigla para "Single Page Application".

**Para que serve:** manter a aplicacao em uma unica pagina principal, trocando conteudos sem recarregar tudo.

**Exemplo no projeto:** o frontend React navega entre telas sem refresh completo da pagina.

### Router

**O que e:** mecanismo que controla para qual tela a aplicacao vai.

**Para que serve:** organizar navegacao interna.

**Exemplo no projeto:** `BrowserRouter` em `App.jsx`.

### layout

**O que e:** estrutura visual base de uma tela.

**Para que serve:** manter padrao de cabecalho, menu e area principal.

**Exemplo no projeto:** `Layout.jsx` monta `Sidebar` e `Topbar`.

### pagina

**O que e:** tela inteira da aplicacao.

**Para que serve:** representar um caso de uso completo.

**Exemplo no projeto:** `RelatoriosPage.jsx`.

### StrictMode

**O que e:** modo especial do React para ajudar a identificar problemas em desenvolvimento.

**Para que serve:** alertar sobre praticas antigas ou perigosas.

**Exemplo no projeto:** `main.jsx` envolve a aplicacao com `StrictMode`.

### createRoot

**O que e:** funcao do React moderno que inicia a aplicacao na pagina.

**Para que serve:** ligar o React ao elemento HTML real.

**Exemplo no projeto:** `createRoot(document.getElementById('root'))`.

---

## 6. Termos De Backend, Django E API

### Django

**O que e:** framework web em Python.

**Para que serve:** acelerar criacao de backend, admin, modelos, rotas e seguranca.

**Exemplo no projeto:** toda a pasta `backend/` foi organizada em cima do Django.

### Django REST Framework

**O que e:** extensao do Django para construir APIs REST.

**Para que serve:** facilitar JSON, serializers, views e autenticacao de API.

**Exemplo no projeto:** `serializers.py` e `views.py` usam DRF.

### model

**O que e:** classe que representa uma tabela ou entidade do sistema.

**Para que serve:** descrever dados e validacoes.

**Exemplo no projeto:** `Produto`, `Variacao` e `PedidoVenda`.

### campo

**O que e:** atributo de um model.

**Para que serve:** guardar uma informacao especifica.

**Exemplo no projeto:** `sku`, `preco_venda` e `estoque_minimo` sao campos de `Produto`.

### registro

**O que e:** uma linha concreta de dados dentro do banco.

**Para que serve:** representar uma instancia salva.

**Exemplo no projeto:** um produto especifico salvo no banco e um registro.

### ORM

**O que e:** camada que permite falar com o banco usando classes e objetos, em vez de escrever SQL manual o tempo inteiro.

**Para que serve:** facilitar criacao, busca, atualizacao e exclusao de dados.

**Exemplo no projeto:** `Produto.objects.create(...)`.

### queryset

**O que e:** conjunto de resultados montado pelo ORM do Django.

**Para que serve:** buscar e filtrar dados do banco.

**Exemplo no projeto:** varios `queryset = ...` aparecem em `views.py`.

### serializer

**O que e:** camada que transforma objeto Python em JSON e JSON em dado validado.

**Para que serve:** validar entrada e controlar saida da API.

**Exemplo no projeto:** `ProdutoSerializer`.

### serializar

**O que e:** converter um dado de um formato interno para outro formato de transmissao.

**Para que serve:** permitir que a API envie dados de forma padronizada.

**Exemplo no projeto:** um model `Produto` e serializado para JSON.

### view

**O que e:** camada que recebe a requisicao e devolve a resposta.

**Para que serve:** conectar URL, logica e retorno da API.

**Exemplo no projeto:** `ConfiguracaoSistemaView`.

### ViewSet

**O que e:** tipo de view do DRF voltado para recursos completos.

**Para que serve:** agrupar listar, criar, editar e excluir em uma mesma classe.

**Exemplo no projeto:** `ProdutoViewSet`.

### APIView

**O que e:** tipo de view mais manual e especifica do DRF.

**Para que serve:** criar endpoints personalizados que nao sao apenas CRUD padrao.

**Exemplo no projeto:** `PrimeiroAcessoView`.

### CRUD

**O que e:** sigla para Create, Read, Update e Delete.

**Para que serve:** resumir as quatro operacoes basicas de cadastro.

**Exemplo no projeto:** produtos e fornecedores possuem CRUD.

### router

**O que e:** roteador de URLs.

**Para que serve:** criar varias rotas automaticamente para um ViewSet.

**Exemplo no projeto:** `DefaultRouter()` em `backend/app/urls.py`.

### permission

**O que e:** regra de permissao de acesso.

**Para que serve:** controlar quem pode fazer o que.

**Exemplo no projeto:** `IsAdminEmpresa`.

### autenticacao

**O que e:** processo de provar quem o usuario e.

**Para que serve:** garantir que a pessoa realmente esta logada.

**Exemplo no projeto:** login por token JWT.

### autorizacao

**O que e:** processo de verificar o que o usuario pode fazer.

**Para que serve:** diferenciar admin de funcionario.

**Exemplo no projeto:** so admin pode editar configuracoes.

### middleware

**O que e:** camada intermediaria que intercepta requisicoes e respostas.

**Para que serve:** aplicar seguranca, sessao, CORS e outros comportamentos globais.

**Exemplo no projeto:** `corsheaders.middleware.CorsMiddleware` em `settings.py`.

### migration

**O que e:** arquivo que registra uma mudanca na estrutura do banco.

**Para que serve:** manter o banco alinhado com os models.

**Exemplo no projeto:** `0005_configuracaosistema.py`.

### signal

**O que e:** mecanismo do Django para reagir automaticamente a eventos.

**Para que serve:** executar algo quando um objeto e criado ou salvo.

**Exemplo no projeto:** `signals.py` cria `PerfilUsuario` quando nasce um `User`.

### parser

**O que e:** componente que interpreta um tipo de entrada.

**Para que serve:** entender arquivos enviados ou formatos especificos de dados.

**Exemplo no projeto:** views de upload usam `MultiPartParser`.

### filter

**O que e:** filtro de dados.

**Para que serve:** retornar somente o que interessa.

**Exemplo no projeto:** produtos podem ser filtrados por categoria.

### ordering

**O que e:** ordenacao de resultados.

**Para que serve:** definir se a lista vem por nome, data, preco e assim por diante.

**Exemplo no projeto:** varias views possuem `ordering_fields`.

### action

**O que e:** rota extra dentro de um ViewSet.

**Para que serve:** criar comportamento adicional sem abrir uma view separada.

**Exemplo no projeto:** `estoque_baixo` em `ProdutoViewSet`.

### admin

**O que e:** painel administrativo do Django.

**Para que serve:** gerenciar dados internos rapidamente.

**Exemplo no projeto:** rota `/admin/`.

### banco de dados

**O que e:** lugar onde os dados ficam guardados de forma persistente.

**Para que serve:** salvar informacoes mesmo depois que o sistema fecha.

**Exemplo no projeto:** PostgreSQL como banco principal da aplicacao.

### JWT

**O que e:** sigla para JSON Web Token.

**Para que serve:** representar login e autenticacao em forma de token.

**Exemplo no projeto:** login retorna `access` e `refresh`.

### token

**O que e:** valor que representa autorizacao temporaria.

**Para que serve:** permitir que o frontend prove ao backend que o usuario esta autenticado.

**Exemplo no projeto:** `access_token` no `localStorage`.

### access token

**O que e:** token principal de uso rapido.

**Para que serve:** autenticar requisicoes normais do dia a dia.

**Exemplo no projeto:** enviado no cabecalho `Authorization: Bearer ...`.

### refresh token

**O que e:** token usado para renovar o access token.

**Para que serve:** evitar que o usuario precise fazer login toda hora.

**Exemplo no projeto:** `refreshTokenRequest()` em `api.js`.

### validacao

**O que e:** verificacao das regras antes de aceitar um dado.

**Para que serve:** impedir informacoes invalidas no sistema.

**Exemplo no projeto:** produto nao pode ter `preco_venda` menor que `preco_custo`.

---

## 7. Termos De Ferramentas E Ambiente

### npm

**O que e:** gerenciador de pacotes do ecossistema Node.js.

**Para que serve:** instalar bibliotecas e rodar scripts.

**Exemplo no projeto:** `npm run dev`.

### dependencia

**O que e:** biblioteca externa da qual o projeto precisa.

**Para que serve:** reaproveitar solucoes prontas em vez de escrever tudo do zero.

**Exemplo no projeto:** `react-router-dom`.

### devDependency

**O que e:** dependencia usada principalmente em desenvolvimento, nao na logica final do usuario.

**Para que serve:** lint, build e ferramentas de programacao.

**Exemplo no projeto:** `vite` e `eslint`.

### node_modules

**O que e:** pasta onde o npm instala bibliotecas.

**Para que serve:** guardar dependencias JavaScript do projeto.

**Exemplo no projeto:** `frontend/node_modules/`.

### venv

**O que e:** abreviacao comum para "virtual environment" do Python.

**Para que serve:** isolar dependencias Python do projeto.

**Exemplo no projeto:** `backend/venv/`.

### build

**O que e:** versao preparada para execucao ou deploy.

**Para que serve:** transformar o codigo de desenvolvimento em uma versao final otimizada.

**Exemplo no projeto:** `npm run build` gera a pasta `frontend/dist/`.

### dist

**O que e:** abreviacao de "distribution".

**Para que serve:** guardar a versao final compilada do frontend.

**Exemplo no projeto:** `frontend/dist/`.

### lint

**O que e:** verificacao automatica de qualidade e padrao de codigo.

**Para que serve:** encontrar erros simples e manter consistencia.

**Exemplo no projeto:** `npm run lint`.

### alias

**O que e:** apelido tecnico para um caminho ou modulo.

**Para que serve:** ajudar a resolver importacoes de forma controlada.

**Exemplo no projeto:** `vite.config.js` define aliases para `react` e `react-dom`.

### dedupe

**O que e:** estrategia para evitar duplicidade de biblioteca.

**Para que serve:** impedir que o projeto carregue mais de uma copia do React, por exemplo.

**Exemplo no projeto:** `dedupe: ["react", "react-dom"]` no Vite.

### module

**O que e:** arquivo que exporta ou importa codigo.

**Para que serve:** dividir o sistema em partes menores e organizadas.

**Exemplo no projeto:** `api.js` exporta varias funcoes.

### import

**O que e:** comando para trazer algo de outro arquivo.

**Para que serve:** reutilizar codigo.

**Exemplo no projeto:** `import Layout from "../components/Layout";`

### export

**O que e:** comando para disponibilizar algo de um arquivo para outros.

**Para que serve:** permitir reutilizacao de funcoes, componentes e valores.

**Exemplo no projeto:** `export default function App()`.

### ES Modules

**O que e:** padrao moderno de modulos JavaScript com `import` e `export`.

**Para que serve:** organizar melhor o codigo e funcionar bem com ferramentas modernas.

**Exemplo no projeto:** `frontend/package.json` usa `"type": "module"`.

### scaffold

**O que e:** estrutura inicial criada por uma ferramenta.

**Para que serve:** acelerar o inicio de um projeto.

**Exemplo no projeto:** arquivos como `react.svg` e `vite.svg` podem ser restos do scaffold inicial do Vite.

### fallback

**O que e:** plano B quando o valor principal nao existe.

**Para que serve:** evitar quebra quando alguma informacao falta.

**Exemplo no projeto:** `branding.js` cria um favicon fallback quando nao ha logo.

---

## 8. Termos Estranhos Mas Muito Usados

### favicon

**Traducao livre:** icone da aba do navegador.

**Por que o nome parece estranho:** ele vem do ingles antigo da web e ficou como termo historico.

**Para lembrar facil:** pense nele como "mini logo da pagina".

### hook

**Traducao livre:** gancho.

**Por que o nome parece estranho:** a ideia e que o React "encaixa" esse gancho no comportamento do componente.

**Para lembrar facil:** hook e uma forma de plugar comportamento em um componente.

### serializer

**Traducao livre:** serializador.

**Por que o nome parece estranho:** ele converte dados de um formato para outro de maneira padronizada.

**Para lembrar facil:** ele faz a ponte entre objeto interno e JSON da API.

### middleware

**Traducao livre:** camada do meio.

**Por que o nome parece estranho:** ele realmente fica no meio do caminho entre pedido e resposta.

**Para lembrar facil:** pense como um fiscal que confere tudo antes de deixar passar.

### router

**Traducao livre:** roteador.

**Por que o nome parece estranho:** ele decide para qual caminho cada requisicao ou tela vai.

**Para lembrar facil:** e o GPS das rotas.

### migration

**Traducao livre:** migracao.

**Por que o nome parece estranho:** ela move a estrutura do banco de um estado antigo para um novo estado.

**Para lembrar facil:** e uma atualizacao guiada do banco.

### build

**Traducao livre:** construcao ou compilacao final.

**Por que o nome parece estranho:** virou termo padrao para "gerar a versao pronta".

**Para lembrar facil:** e o empacotamento final do frontend.

### asset

**Traducao livre:** recurso.

**Por que o nome parece estranho:** na pratica quer dizer imagem, icone, fonte ou arquivo visual.

**Para lembrar facil:** asset e qualquer recurso de apoio da interface.

---

## 9. Como Explicar Esses Termos Para A Equipe Sem Ficar Muito Tecnico

Se voce quiser ensinar para iniciantes, uma boa regra e:

- `frontend` = a parte que o usuario ve.
- `backend` = a parte que processa e salva.
- `API` = a ponte entre as duas partes.
- `rota` = caminho.
- `componente` = pedaco reutilizavel da tela.
- `hook` = logica reutilizavel no React.
- `context` = informacao global compartilhada.
- `model` = estrutura dos dados.
- `serializer` = tradutor entre objeto e JSON.
- `view` = quem recebe a requisicao e responde.
- `migration` = historico das mudancas do banco.
- `favicon` = mini icone da aba do navegador.

---

## 10. Ordem Recomendada De Leitura Para Iniciantes

Se a pessoa esta comecando agora, a melhor ordem e:

1. Ler `docs/GUIA_DETALHADO_DO_SISTEMA.md`.
2. Consultar este glossario quando aparecer um nome estranho.
3. Abrir `frontend/src/App.jsx` para ver as rotas.
4. Abrir `frontend/src/services/api.js` para ver como o frontend fala com o backend.
5. Abrir `backend/app/models.py` para entender os dados.
6. Abrir `backend/app/views.py` para ver as rotas da API.
7. Abrir `backend/app/services.py` para entender as regras de negocio.

---

## 11. Fechamento

No comeco, os nomes da programacao parecem estranhos porque muitos vieram do ingles tecnico e foram mantidos por costume do mercado.

Isso e normal.

O importante e lembrar que quase todos esses nomes apontam para uma ideia simples:

- quem mostra;
- quem recebe;
- quem valida;
- quem salva;
- quem organiza;
- quem reaproveita.

Quando voce entende a funcao pratica do termo, o nome deixa de parecer complicado.

---

## 12. Termos De HTML, CSS E JavaScript Em Linguagem Simples

Esta secao existe porque muita gente entra em React antes de dominar os nomes basicos da web. Entao aqui vai uma traducao simples.

### HTML

**O que e:** a estrutura da pagina.

**Para que serve:** dizer o que existe na tela.

**Forma de pensar:** se uma pagina fosse uma casa, o HTML seria a planta e as paredes.

**Exemplo simples:**

```html
<h1>Produtos</h1>
<button>Novo Produto</button>
```

Aqui o HTML esta dizendo: existe um titulo e existe um botao.

### CSS

**O que e:** a aparencia visual da pagina.

**Para que serve:** dizer como cada coisa vai parecer.

**Forma de pensar:** se o HTML e a estrutura da casa, o CSS e a pintura, os acabamentos e a decoracao.

**Exemplo simples:**

```css
h1 {
  color: blue;
}
```

Aqui o CSS esta dizendo: o titulo deve ficar azul.

### JavaScript

**O que e:** a logica que faz a pagina reagir.

**Para que serve:** dar comportamento para a interface.

**Forma de pensar:** se o HTML e a estrutura e o CSS e a aparencia, o JavaScript e a eletrica e a automacao.

**Exemplo simples:**

```js
button.onclick = () => alert("Clicou");
```

Aqui o JavaScript esta dizendo: quando clicar no botao, faca algo.

### tag

**O que e:** cada elemento do HTML.

**Para que serve:** representar blocos como texto, botao, formulario, imagem e tabela.

**Exemplos comuns:**

- `<div>` = bloco generico
- `<h1>` = titulo principal
- `<p>` = paragrafo
- `<input>` = campo de entrada
- `<button>` = botao
- `<img>` = imagem

### atributo

**O que e:** informacao extra dentro de uma tag HTML.

**Para que serve:** configurar ou identificar o elemento.

**Exemplo simples:**

```html
<input type="text" placeholder="Digite seu nome" />
```

Aqui:

- `type` e um atributo
- `placeholder` e um atributo

### classe CSS

**O que e:** nome dado a um elemento para aplicar estilo.

**Para que serve:** permitir que o CSS encontre e estilize aquele bloco.

**Exemplo simples:**

```html
<div class="login-card"></div>
```

```css
.login-card {
  padding: 16px;
}
```

No projeto isso aparece muito, por exemplo em nomes como `page-card`, `table-card`, `summary-card`.

### id

**O que e:** identificador unico de um elemento.

**Para que serve:** encontrar aquele elemento de forma direta.

**Exemplo no projeto:** o React monta a aplicacao dentro de `id="root"` em `frontend/index.html`.

### seletor CSS

**O que e:** a forma como o CSS escolhe qual elemento vai estilizar.

**Para que serve:** dizer "aplique este estilo nesse grupo de elementos".

**Exemplos:**

- `h1` = todos os `h1`
- `.login-card` = tudo com essa classe
- `#root` = elemento com esse id

### responsivo ou responsividade

**O que e:** capacidade da interface de se adaptar a tamanhos diferentes de tela.

**Para que serve:** funcionar bem em desktop, notebook, tablet e celular.

**Exemplo no projeto:** `useIsMobile.js` detecta se a tela esta pequena para ajustar o layout.

### JavaScript moderno

**O que e:** forma atual de escrever JavaScript usando recursos novos da linguagem.

**Para que serve:** deixar o codigo mais limpo, curto e organizado.

**Exemplos comuns no projeto:**

- `import` e `export`
- arrow functions `() => {}`
- `const` e `let`
- optional chaining `obj?.campo`
- template string `` `texto ${valor}` ``

### funcao

**O que e:** bloco de codigo que executa uma tarefa.

**Para que serve:** reaproveitar logica.

**Exemplo no projeto:** `buildUrl()` em `api.js`.

### parametro

**O que e:** dado que entra em uma funcao.

**Para que serve:** permitir que a funcao trabalhe com valores diferentes.

**Exemplo simples:**

```js
function saudacao(nome) {
  return `Ola, ${nome}`;
}
```

Aqui `nome` e o parametro.

### retorno

**O que e:** valor devolvido por uma funcao.

**Para que serve:** entregar o resultado da operacao.

**Exemplo simples:**

```js
function somar(a, b) {
  return a + b;
}
```

Aqui o retorno e `a + b`.

### variavel

**O que e:** nome usado para guardar um valor.

**Para que serve:** armazenar dados temporariamente.

**Exemplo no projeto:** `const API_BASE_URL = ...`

### constante

**O que e:** variavel declarada para nao ser reatribuida depois.

**Para que serve:** proteger valores que nao devem mudar durante aquela execucao.

**Exemplo no projeto:** `const STORAGE_KEYS = { ... }`

### objeto

**O que e:** estrutura que agrupa varios pares de chave e valor.

**Para que serve:** organizar dados relacionados.

**Exemplo simples:**

```js
const produto = {
  nome: "Camisa",
  sku: "CAM-001",
};
```

### array

**O que e:** lista de valores.

**Para que serve:** guardar varios itens do mesmo tipo ou do mesmo grupo.

**Exemplo no projeto:** listas de produtos, categorias, variacoes e relatorios.

### metodo

**O que e:** funcao ligada a um objeto.

**Para que serve:** executar uma acao naquele objeto.

**Exemplo simples:** `produtos.map(...)` usa o metodo `map`.

### callback

**O que e:** funcao passada para outra funcao.

**Para que serve:** dizer o que deve acontecer dentro de um processo.

**Exemplo no projeto:** `produtos.map((produto) => ...)`.

### asincrono

**O que e:** algo que nao termina imediatamente e pode levar um tempo.

**Para que serve:** lidar com tarefas como chamadas de API, leitura de arquivo e temporizadores.

**Exemplo no projeto:** buscar produtos do backend e uma operacao assincrona.

### Promise

**O que e:** objeto do JavaScript que representa algo que ainda vai terminar.

**Para que serve:** lidar com resultado futuro de operacoes assincronas.

**Exemplo no projeto:** `fetch()` retorna uma Promise.

### async/await

**O que e:** sintaxe moderna para trabalhar com codigo assincrono de forma mais legivel.

**Para que serve:** esperar uma operacao terminar sem deixar o codigo tao confuso.

**Exemplo no projeto:**

```js
const data = await authJsonRequest("/produtos/");
```

### erro ou exception

**O que e:** problema ocorrido durante a execucao.

**Para que serve:** indicar que algo falhou e precisa ser tratado.

**Exemplo no projeto:** quando a API responde erro, o frontend mostra `toast.error(...)`.

### try/catch

**O que e:** estrutura para capturar e tratar erros.

**Para que serve:** impedir que a aplicacao quebre sem mensagem util.

**Exemplo no projeto:** usado em varias paginas ao carregar dados da API.

---

## 13. Termos De Requisicao, API E Comunicacao Com O Backend Mais Detalhados

Aqui entram varios nomes que parecem abstratos no inicio, mas sao essenciais.

### cliente

**O que e:** quem faz a requisicao.

**Para que serve:** pedir dados ou enviar informacoes.

**Exemplo no projeto:** o frontend React e o cliente da API Django.

### servidor

**O que e:** quem recebe a requisicao e responde.

**Para que serve:** processar logica, acessar banco e devolver dados.

**Exemplo no projeto:** o backend Django e o servidor.

### metodo HTTP

**O que e:** verbo que diz qual tipo de acao a requisicao quer executar.

**Para que serve:** separar leitura, criacao, alteracao e exclusao.

**Os mais usados no projeto:**

- `GET` = buscar dados
- `POST` = criar ou enviar algo novo
- `PATCH` = alterar parte de um registro
- `PUT` = substituir ou atualizar um recurso completo
- `DELETE` = excluir

### `GET`

**O que e:** metodo para leitura.

**Para que serve:** buscar informacoes do sistema.

**Exemplo no projeto:** carregar produtos com `/api/produtos/`.

### `POST`

**O que e:** metodo para envio ou criacao.

**Para que serve:** criar registro ou executar uma acao.

**Exemplo no projeto:** login em `/api/token/`.

### `PATCH`

**O que e:** metodo para alterar parcialmente um registro.

**Para que serve:** mudar apenas alguns campos.

**Exemplo no projeto:** atualizar configuracao visual em `/api/configuracao-sistema/`.

### `PUT`

**O que e:** metodo para atualizar um recurso de forma mais completa.

**Para que serve:** substituir o estado de um registro ou atualizar com payload maior.

**Exemplo no projeto:** pedidos sao atualizados com `PUT` em varias telas.

### `DELETE`

**O que e:** metodo de exclusao.

**Para que serve:** apagar um recurso.

**Exemplo no projeto:** excluir produto ou limpar importacao.

### cabecalho ou header

**O que e:** informacao extra enviada junto com a requisicao.

**Para que serve:** dizer tipo de conteudo, autorizacao e outras configuracoes.

**Exemplo no projeto:** `Authorization: Bearer <token>`.

### body da requisicao

**O que e:** conteudo principal enviado junto com a requisicao.

**Para que serve:** mandar dados de formulario, JSON ou arquivo.

**Exemplo no projeto:** ao criar um pedido, os dados vao no body.

### `Content-Type`

**O que e:** cabecalho que diz o tipo de dado enviado.

**Para que serve:** ajudar o servidor a interpretar corretamente o conteudo.

**Exemplos comuns:**

- `application/json`
- `multipart/form-data`

### `Authorization`

**O que e:** cabecalho usado para passar credenciais de acesso.

**Para que serve:** provar para o backend que o usuario esta autenticado.

**Exemplo no projeto:** `authFetch()` injeta esse cabecalho automaticamente.

### Bearer

**O que e:** palavra usada no cabecalho para indicar que o valor seguinte e um token.

**Para que serve:** padronizar autenticacao por token.

**Exemplo real:**

```text
Authorization: Bearer eyJ...
```

### query string ou query params

**O que e:** parametros colocados no final da URL.

**Para que serve:** filtrar ou ajustar a resposta sem mudar a rota principal.

**Exemplo no projeto:** `/api/relatorios/mensal/?ano=2026&mes=4`

### status code

**O que e:** codigo numerico da resposta HTTP.

**Para que serve:** informar se deu certo ou errado.

**Codigos comuns no projeto:**

- `200` = sucesso
- `201` = criado com sucesso
- `400` = erro de validacao ou requsicao invalida
- `401` = nao autenticado
- `403` = sem permissao
- `404` = nao encontrado

### `200 OK`

**O que e:** resposta de sucesso para leitura ou operacao concluida.

**Exemplo no projeto:** buscar configuracao do sistema.

### `201 Created`

**O que e:** resposta de sucesso para criacao.

**Exemplo no projeto:** criar pedido ou importar nota fiscal.

### `400 Bad Request`

**O que e:** resposta de erro quando o cliente mandou algo invalido.

**Exemplo no projeto:** tentar salvar pedido finalizado sem estoque suficiente.

### `401 Unauthorized`

**O que e:** resposta quando falta autenticacao valida.

**Exemplo no projeto:** token expirado sem refresh valido.

### `403 Forbidden`

**O que e:** resposta quando a pessoa esta autenticada, mas nao tem permissao.

**Exemplo no projeto:** funcionario tentando alterar configuracoes.

### `404 Not Found`

**O que e:** resposta quando o recurso nao existe.

**Exemplo no projeto:** abrir um registro apagado ou URL inexistente.

### fetch

**O que e:** funcao nativa do navegador para fazer requisicoes HTTP.

**Para que serve:** conectar frontend e backend.

**Exemplo no projeto:** `api.js` usa `fetch` por baixo dos panos.

### `authFetch`

**O que e:** nome dado no projeto para uma versao de `fetch` com autenticacao.

**Para que serve:** enviar token automaticamente e tentar renovar sessao se necessario.

**Exemplo no projeto:** `frontend/src/services/api.js`.

### `jsonRequest`

**O que e:** helper do projeto para requisicoes JSON.

**Para que serve:** centralizar `fetch`, parse do corpo e tratamento de erro.

**Exemplo no projeto:** usado para requests publicas ou sem autenticacao.

### `authJsonRequest`

**O que e:** helper do projeto para requisicoes JSON autenticadas.

**Para que serve:** falar com a API interna com token e tratamento padrao.

**Exemplo no projeto:** quase todas as paginas protegidas usam essa funcao.

### parse

**O que e:** interpretar um dado bruto e transformalo em algo utilizavel.

**Para que serve:** converter texto em objeto, arquivo em estrutura, string em numero ou data.

**Exemplo no projeto:** o backend faz parse de XML e PDF de NF-e.

### parser de resposta

**O que e:** logica que interpreta a resposta da API.

**Para que serve:** ler JSON, texto ou resposta vazia.

**Exemplo no projeto:** `parseResponseBody()` em `api.js`.

### FormData

**O que e:** objeto do navegador para montar envio de formulario com arquivos.

**Para que serve:** mandar upload sem precisar converter tudo manualmente para JSON.

**Exemplo no projeto:** envio de logo e envio de arquivo de NF-e.

### multipart/form-data

**O que e:** formato de envio usado quando a requisicao contem arquivo.

**Para que serve:** permitir upload de binarios e campos de formulario juntos.

**Exemplo no projeto:** importacao de nota fiscal e atualizacao de logo.

### blob

**O que e:** representacao de dado binario no navegador.

**Para que serve:** lidar com arquivos gerados na memoria, como PDF e Excel.

**Exemplo no projeto:** `reportExports.js` cria blobs para download.

### URL temporaria ou object URL

**O que e:** endereco temporario criado pelo navegador para um arquivo em memoria.

**Para que serve:** visualizar arquivo antes de salvar ou baixar.

**Exemplo no projeto:** preview da logo usa `URL.createObjectURL(...)`.

---

## 14. Termos De React Mais Detalhados E Ligados Ao Seu Projeto

Aqui vamos aprofundar alguns nomes que aparecem no codigo React e costumam confundir muito no inicio.

### arvore de componentes

**O que e:** forma como os componentes ficam encaixados uns dentro dos outros.

**Para que serve:** organizar a tela em camadas.

**Exemplo simplificado do projeto:**

```text
App
-> SystemConfigProvider
-> AuthProvider
-> BrowserRouter
-> Routes
-> Pagina
-> Layout
-> Sidebar / Topbar / Conteudo
```

### componente pai

**O que e:** componente que renderiza outro componente dentro dele.

**Para que serve:** organizar hierarquia e passar dados para componentes filhos.

**Exemplo no projeto:** `Layout` e pai de muitos conteudos de pagina.

### componente filho

**O que e:** componente renderizado dentro de outro.

**Para que serve:** receber dados e montar uma parte menor da interface.

**Exemplo no projeto:** `SummaryCard` pode ser filho de `DashboardHome`.

### children

**O que e:** conteudo passado entre a abertura e o fechamento de um componente.

**Para que serve:** permitir que um componente embrulhe outros sem saber exatamente qual sera o conteudo.

**Exemplo no projeto:** `Layout({ children })`.

### controlled input

**O que e:** campo de formulario cujo valor e controlado pelo estado do React.

**Para que serve:** manter o React sabendo o que esta digitado a todo momento.

**Exemplo no projeto:** formularios de login, produto e pedido.

### evento

**O que e:** algo que acontece na interface, como clique, digitacao ou submit.

**Para que serve:** permitir que o sistema reaja ao usuario.

**Exemplo no projeto:** `onClick`, `onChange` e `onSubmit`.

### `onClick`

**O que e:** evento de clique.

**Para que serve:** executar uma acao quando o usuario clica.

**Exemplo no projeto:** botoes de salvar, excluir e navegar.

### `onChange`

**O que e:** evento disparado quando o valor de um campo muda.

**Para que serve:** atualizar o estado conforme o usuario digita ou seleciona.

**Exemplo no projeto:** campos de formulario.

### `onSubmit`

**O que e:** evento de envio do formulario.

**Para que serve:** processar os dados quando o usuario tenta salvar ou entrar.

**Exemplo no projeto:** login, pedido, produto, fornecedor e configuracoes.

### dependencia do `useEffect`

**O que e:** valor observado por um `useEffect`.

**Para que serve:** dizer quando aquele efeito deve rodar de novo.

**Exemplo simples:**

```js
useEffect(() => {
  carregar();
}, [usuario]);
```

Aqui o efeito roda de novo quando `usuario` muda.

### array de dependencias vazio

**O que e:** `[]` no final do `useEffect`.

**Para que serve:** indicar que o efeito deve rodar uma vez ao montar o componente.

**Exemplo no projeto:** varias paginas carregam dados assim na abertura da tela.

### montar componente

**O que e:** momento em que o componente aparece pela primeira vez na tela.

**Para que serve:** iniciar comportamento e efeitos.

**Exemplo no projeto:** carregar dados quando a pagina abre.

### desmontar componente

**O que e:** momento em que o componente sai da tela.

**Para que serve:** limpar timers, listeners e outros efeitos.

**Exemplo no projeto:** alguns `useEffect` retornam uma funcao de limpeza.

### cleanup

**O que e:** limpeza feita quando um efeito precisa ser encerrado.

**Para que serve:** evitar vazamento de evento ou comportamento duplicado.

**Exemplo no projeto:** remover `matchMedia` listener em `useIsMobile.js`.

### `Navigate`

**O que e:** componente do React Router para redirecionar.

**Para que serve:** mandar o usuario para outra rota automaticamente.

**Exemplo no projeto:** `PrivateRoute` redireciona para `/login`.

### `useNavigate`

**O que e:** hook do React Router para navegar por codigo.

**Para que serve:** mudar de pagina depois de uma acao.

**Exemplo no projeto:** apos salvar um pedido, o sistema navega para `/pedidos`.

### `useParams`

**O que e:** hook que le parametros da rota.

**Para que serve:** descobrir, por exemplo, o `id` que veio na URL.

**Exemplo no projeto:** `EditarProduto` e `PedidoFormPage` usam `:id`.

### `NavLink`

**O que e:** componente de link do React Router que sabe quando esta ativo.

**Para que serve:** estilizar menu conforme a rota atual.

**Exemplo no projeto:** `Sidebar.jsx` usa `NavLink`.

### render condicional

**O que e:** mostrar uma coisa ou outra dependendo do estado.

**Para que serve:** adaptar a interface ao contexto.

**Exemplo no projeto:** se nao estiver autenticado, mostrar login; se estiver, mostrar app.

### loading

**O que e:** estado de carregamento.

**Para que serve:** avisar que uma operacao ainda esta em andamento.

**Exemplo no projeto:** login exibe "Entrando..." e paginas exibem "Carregando...".

### toast

**O que e:** notificacao pequena que aparece temporariamente na tela.

**Para que serve:** informar sucesso, erro ou aviso sem interromper a navegacao.

**Exemplo no projeto:** `toast.success(...)` e `toast.error(...)`.

### tema

**O que e:** conjunto de cores e aspectos visuais principais da interface.

**Para que serve:** manter identidade da marca e consistencia visual.

**Exemplo no projeto:** configuracoes do sistema alteram o tema da empresa.

### token CSS

**O que e:** variavel visual reutilizavel.

**Para que serve:** centralizar cores e estilos.

**Exemplo no projeto:** `branding.js` gera valores como `--primary` e `--accent`.

### variavel CSS

**O que e:** valor nomeado dentro do CSS.

**Para que serve:** reaproveitar cor, espacamento e tema.

**Exemplo simples:**

```css
:root {
  --primary: #1768AC;
}
```

### preview

**O que e:** visualizacao previa antes de confirmar algo.

**Para que serve:** permitir revisao antes de salvar ou aplicar.

**Exemplo no projeto:** preview da logo e preview da NF-e.

---

## 15. Termos De Django, Banco De Dados E Regras De Negocio Mais Detalhados

Agora vamos aprofundar os nomes do backend e do banco, porque eles costumam parecer ainda mais "tecnicos".

### tabela

**O que e:** estrutura do banco que guarda registros do mesmo tipo.

**Para que serve:** organizar os dados por assunto.

**Exemplo no projeto:** existe tabela de produtos, usuarios, pedidos e movimentacoes.

### coluna

**O que e:** cada tipo de dado guardado dentro de uma tabela.

**Para que serve:** definir quais informacoes cada registro tem.

**Exemplo no projeto:** na tabela de produto existem colunas como `nome`, `sku` e `preco_venda`.

### linha

**O que e:** cada registro individual de uma tabela.

**Para que serve:** representar um item concreto salvo no banco.

**Exemplo no projeto:** um produto especifico cadastrado e uma linha.

### chave primaria ou primary key

**O que e:** identificador principal de um registro.

**Para que serve:** diferenciar um registro de todos os outros.

**Exemplo no projeto:** quase todos os modelos tem `id` como chave primaria.

### chave estrangeira ou foreign key

**O que e:** campo que aponta para outro registro em outra tabela.

**Para que serve:** criar relacao entre entidades.

**Exemplo no projeto:** uma `Variacao` aponta para um `Produto`.

### relacionamento

**O que e:** ligacao entre tabelas.

**Para que serve:** fazer dados conversarem entre si.

**Exemplo no projeto:** produto tem varias variacoes; pedido tem varios itens.

### `ForeignKey`

**O que e:** tipo de campo do Django para relacao de muitos-para-um.

**Para que serve:** dizer que varios registros podem apontar para um mesmo registro principal.

**Exemplo no projeto:** varias `Variacao` podem apontar para um mesmo `Produto`.

### `OneToOneField`

**O que e:** tipo de campo do Django para relacao um-para-um.

**Para que serve:** ligar dois registros de forma exclusiva.

**Exemplo no projeto:** `PerfilUsuario` tem `OneToOneField` com `User`.

### `related_name`

**O que e:** nome dado pelo Django para acessar uma relacao pelo lado oposto.

**Para que serve:** tornar mais claro como navegar entre objetos relacionados.

**Exemplo no projeto:** `produto.variacoes.all()` existe por causa do `related_name="variacoes"`.

### `null=True`

**O que e:** configuracao de campo no Django.

**Para que serve:** permitir que o banco aceite valor vazio real naquele campo.

**Exemplo no projeto:** varios campos opcionais usam `null=True`.

### `blank=True`

**O que e:** configuracao de campo no Django para formularios e validacao.

**Para que serve:** permitir que o campo seja deixado em branco.

**Exemplo no projeto:** telefone de fornecedor pode ficar vazio.

### `unique=True`

**O que e:** regra que exige valor unico no banco.

**Para que serve:** impedir duplicidade daquele campo.

**Exemplo no projeto:** `sku` em `Produto`.

### `choices`

**O que e:** lista de valores permitidos para um campo.

**Para que serve:** restringir opcoes validas.

**Exemplo no projeto:** tipo de usuario, categoria, subcategoria, status do pedido.

### `TextChoices`

**O que e:** recurso do Django para declarar opcoes fixas de texto de forma organizada.

**Para que serve:** criar enums legiveis dentro do model.

**Exemplo no projeto:** `PerfilUsuario.Tipo` e `PedidoVenda.Status`.

### `Meta`

**O que e:** classe interna do model para configuracoes extras.

**Para que serve:** definir ordenacao, nomes no admin e outras opcoes.

**Exemplo no projeto:** varios modelos usam `ordering`, `verbose_name` e `verbose_name_plural`.

### `ordering`

**O que e:** ordem padrao dos resultados.

**Para que serve:** evitar listas vindo em ordem aleatoria.

**Exemplo no projeto:** produtos costumam vir ordenados por nome.

### `verbose_name`

**O que e:** nome mais amigavel para o modelo ou campo.

**Para que serve:** melhorar exibicao em interfaces como o Django Admin.

**Exemplo no projeto:** nomes em portugues nos models.

### `clean()`

**O que e:** metodo do Django para validacao personalizada do model.

**Para que serve:** aplicar regras de negocio antes de salvar.

**Exemplo no projeto:** `Produto.clean()` valida SKU, preco e combinacao categoria/subcategoria.

### `save()`

**O que e:** metodo usado para salvar o objeto no banco.

**Para que serve:** persistir dados.

**Exemplo no projeto:** varios models sobrescrevem `save()` para validar antes de gravar.

### `full_clean()`

**O que e:** validacao completa de um model antes de salvar.

**Para que serve:** garantir que todas as regras do model sejam verificadas.

**Exemplo no projeto:** varios `save()` chamam `self.full_clean()`.

### `objects`

**O que e:** gerenciador padrao do Django para consultar o banco.

**Para que serve:** criar, buscar, filtrar, atualizar e excluir registros.

**Exemplo no projeto:** `Produto.objects.filter(...)`.

### `filter()`

**O que e:** metodo para buscar registros que atendem a uma condicao.

**Para que serve:** selecionar apenas uma parte dos dados.

**Exemplo no projeto:** filtrar produtos com estoque baixo.

### `get()`

**O que e:** metodo para buscar um unico registro.

**Para que serve:** recuperar exatamente um item esperado.

**Exemplo no projeto:** buscar produto por id.

### `create()`

**O que e:** metodo para criar registro direto.

**Para que serve:** salvar novo objeto com menos passos.

**Exemplo no projeto:** varios testes usam `Model.objects.create(...)`.

### `update_or_create()`

**O que e:** metodo que atualiza se existir ou cria se nao existir.

**Para que serve:** simplificar casos de sincronizacao.

**Exemplo no projeto:** usado para perfis de usuario.

### `select_related`

**O que e:** forma de carregar relacoes simples em uma consulta so.

**Para que serve:** reduzir quantidade de consultas ao banco.

**Exemplo no projeto:** varias views carregam `produto` e `fornecedor` com `select_related`.

### `prefetch_related`

**O que e:** forma de carregar relacoes de lista em consultas complementares otimizadas.

**Para que serve:** evitar excesso de consultas quando ha conjuntos relacionados.

**Exemplo no projeto:** produtos com varias variacoes.

### `annotate`

**O que e:** adicionar campos calculados temporariamente em uma consulta.

**Para que serve:** enriquecer resultados sem mudar o model.

**Exemplo no projeto:** calcular estoque total em consultas de produto.

### `Sum`

**O que e:** funcao de agregacao do Django ORM.

**Para que serve:** somar valores de varios registros.

**Exemplo no projeto:** somar saldos das variacoes para obter estoque total.

### `Coalesce`

**O que e:** funcao que substitui valor nulo por outro valor.

**Para que serve:** evitar `null` quando se espera numero ou texto padrao.

**Exemplo no projeto:** usar `0` quando nao houver soma de estoque.

### `transaction.atomic`

**O que e:** bloco de transacao do Django.

**Para que serve:** garantir que um conjunto de operacoes no banco seja tratado como uma unidade unica.

**Forma simples de pensar:** ou tudo da certo, ou nada e gravado.

**Exemplo no projeto:** criacao do administrador inicial e varias operacoes de negocio complexas.

### `ValidationError`

**O que e:** erro de validacao.

**Para que serve:** informar que um dado que entrou nao respeita as regras.

**Exemplo no projeto:** estoque insuficiente, documento invalido ou SKU duplicado.

### regra de negocio

**O que e:** regra funcional do sistema, e nao apenas detalhe tecnico.

**Para que serve:** garantir que o sistema se comporte conforme o processo da empresa.

**Exemplo no projeto:** pedido `finalizado` baixa estoque, pedido `cancelado` pode estornar.

### camada de servico

**O que e:** camada separada do codigo onde a regra de negocio fica centralizada.

**Para que serve:** evitar colocar tudo nas views ou serializers.

**Exemplo no projeto:** `backend/app/services.py`.

### painel administrativo

**O que e:** interface pronta do Django para gerenciar dados.

**Para que serve:** facilitar manutencao interna sem precisar criar tela para tudo no frontend.

**Exemplo no projeto:** `backend/app/admin.py` personaliza esse painel.

### fixture de teste

**O que e:** dados montados para simular cenarios em teste.

**Para que serve:** validar comportamento do sistema em situacoes controladas.

**Exemplo no projeto:** `tests.py` cria usuarios, produtos e variacoes para testar regras.

---

## 16. Termos Especificos Do Dominio Do Seu Sistema

Aqui entram nomes que sao tecnicos e, ao mesmo tempo, ligados ao negocio de estoque, venda e nota fiscal.

### produto

**O que e:** item base vendido ou controlado pelo sistema.

**Para que serve:** representar o cadastro principal do catalogo.

**Exemplo no projeto:** `Produto` tem nome, marca, sku, categoria e precos.

### variacao

**O que e:** versao especifica de um produto.

**Para que serve:** controlar diferencas fisicas reais que afetam estoque.

**Exemplo no projeto:** camisa azul tamanho M, tenis branco numero 42.

### SKU

**O que e:** codigo interno de identificacao do produto.

**Para que serve:** localizar o item com precisao e evitar confusao de nome.

**Forma de pensar:** e como um "codigo de referencia" da empresa.

**Exemplo no projeto:** `CAM-001`, `TEN-777`.

### saldo atual

**O que e:** quantidade disponivel naquele momento.

**Para que serve:** mostrar quanto existe de uma variacao em estoque.

**Exemplo no projeto:** `Variacao.saldo_atual`.

### estoque minimo

**O que e:** quantidade minima considerada segura.

**Para que serve:** gerar alerta de reposicao antes de faltar mercadoria.

**Exemplo no projeto:** campo `estoque_minimo` em `Produto`.

### estoque baixo

**O que e:** situacao em que o saldo ficou igual ou abaixo do minimo esperado.

**Para que serve:** avisar que o produto precisa de atencao.

**Exemplo no projeto:** rota `/api/produtos/estoque-baixo/`.

### movimentacao

**O que e:** registro de entrada ou saida de estoque.

**Para que serve:** manter historico e rastreabilidade.

**Exemplo no projeto:** `Movimentacao` guarda tipo, quantidade, data e responsavel.

### entrada de estoque

**O que e:** aumento de quantidade em estoque.

**Para que serve:** registrar recebimento, reposicao ou ajuste positivo.

**Exemplo no projeto:** importar nota fiscal ou criar variacao com estoque inicial.

### saida de estoque

**O que e:** diminuicao de quantidade em estoque.

**Para que serve:** registrar venda, perda ou ajuste negativo.

**Exemplo no projeto:** finalizar pedido gera saida automatica.

### fornecedor

**O que e:** empresa ou pessoa que fornece o produto.

**Para que serve:** dar rastreabilidade comercial e operacional.

**Exemplo no projeto:** `Fornecedor` tem nome, documento, contato e email.

### pedido de venda

**O que e:** registro de venda ou separacao de itens para um cliente.

**Para que serve:** organizar a operacao comercial e refletir no estoque.

**Exemplo no projeto:** `PedidoVenda`.

### item do pedido

**O que e:** cada linha de produto dentro de um pedido.

**Para que serve:** detalhar o que esta sendo vendido.

**Exemplo no projeto:** `PedidoVendaItem`.

### rascunho

**O que e:** estado ainda nao concluido.

**Para que serve:** permitir montar o pedido sem baixar estoque ainda.

**Exemplo no projeto:** pedido em `rascunho`.

### finalizado

**O que e:** estado concluido.

**Para que serve:** confirmar a venda e aplicar os efeitos de estoque.

**Exemplo no projeto:** pedido `finalizado` baixa estoque.

### cancelado

**O que e:** estado interrompido ou anulado.

**Para que serve:** marcar que aquela operacao nao vale mais.

**Exemplo no projeto:** pedido cancelado pode estornar o estoque.

### reposicao

**O que e:** acao de recompor estoque.

**Para que serve:** evitar ruptura e falta de mercadoria.

**Exemplo no projeto:** relatorio de reposicao sugere o que pedir.

### faturamento estimado

**O que e:** valor aproximado das vendas do periodo.

**Para que serve:** dar visao gerencial.

**Exemplo no projeto:** aparece no relatorio mensal.

### NF-e

**O que e:** Nota Fiscal Eletronica.

**Para que serve:** documentar oficialmente uma operacao comercial.

**Exemplo no projeto:** o sistema faz importacao assistida de NF-e.

### XML

**O que e:** formato de arquivo estruturado muito usado em documentos fiscais e integracoes.

**Para que serve:** transportar dados organizados em tags.

**Exemplo no projeto:** NF-e em XML pode ser importada pelo backend.

### PDF

**O que e:** formato de documento visual.

**Para que serve:** visualizar e compartilhar documentos de forma padronizada.

**Exemplo no projeto:** o sistema tambem consegue ler PDF de DANFE com texto pesquisavel.

### DANFE

**O que e:** documento auxiliar da NF-e, normalmente em PDF.

**Para que serve:** representar visualmente os dados da nota.

**Exemplo no projeto:** o backend tenta extrair dados do PDF quando possivel.

### importacao de nota fiscal

**O que e:** processo de ler uma nota e transformar seus itens em dados do sistema.

**Para que serve:** evitar cadastro manual de entrada.

**Exemplo no projeto:** `ImportarNotaFiscalPage.jsx`.

### chave de acesso

**O que e:** numero grande que identifica a NF-e de forma unica.

**Para que serve:** rastrear nota e bloquear duplicidade.

**Exemplo no projeto:** `ImportacaoNotaFiscal.chave_acesso`.

### item importado

**O que e:** cada linha da nota fiscal lida pelo sistema.

**Para que serve:** relacionar o documento fiscal com o estoque.

**Exemplo no projeto:** `ImportacaoNotaFiscalItem`.

### NCM

**O que e:** Nomenclatura Comum do Mercosul.

**Para que serve:** classificar fiscalmente o produto.

**Exemplo no projeto:** campo `ncm` em `Produto`.

### CEST

**O que e:** Codigo Especificador da Substituicao Tributaria.

**Para que serve:** classificacao fiscal usada em alguns contextos tributarios.

**Exemplo no projeto:** campo `cest` em `Produto`.

### CFOP

**O que e:** Codigo Fiscal de Operacoes e Prestacoes.

**Para que serve:** indicar o tipo fiscal da operacao da nota.

**Exemplo no projeto:** campo `cfop` em `Produto` e leitura de NF-e.

### unidade comercial

**O que e:** sigla ou forma de unidade usada comercialmente.

**Para que serve:** indicar se a venda ou compra e por unidade, caixa, pacote etc.

**Exemplo no projeto:** campo `unidade_comercial`.

### documento

**O que e:** CPF ou CNPJ no contexto do sistema.

**Para que serve:** identificar fornecedor ou cliente.

**Exemplo no projeto:** `Fornecedor.documento` e `PedidoVenda.cliente_documento`.

### branding

**O que e:** identidade visual da marca.

**Para que serve:** personalizar nome, logo e cores do sistema conforme a empresa.

**Exemplo no projeto:** `ConfiguracaoSistema` e `branding.js`.

### paleta de cores

**O que e:** conjunto principal de cores da marca.

**Para que serve:** manter consistencia visual.

**Exemplo no projeto:** cor primaria, secundaria e de acento.

### cor primaria

**O que e:** cor principal da interface.

**Para que serve:** destacar a identidade da marca.

**Exemplo no projeto:** `cor_primaria`.

### cor secundaria

**O que e:** segunda cor de apoio da marca.

**Para que serve:** complementar a cor principal.

**Exemplo no projeto:** `cor_secundaria`.

### cor de acento

**O que e:** cor usada para chamar atencao em detalhes especificos.

**Para que serve:** destacar botoes, avisos ou elementos especiais.

**Exemplo no projeto:** `cor_acento`.

### cor hexadecimal

**O que e:** forma de representar cor com codigo como `#1768AC`.

**Para que serve:** definir cor exata em CSS e configuracoes.

**Exemplo no projeto:** configuracoes visuais usam esse formato.

### logo

**O que e:** imagem principal da marca.

**Para que serve:** identificar visualmente a empresa dentro do sistema.

**Exemplo no projeto:** upload em `ConfiguracoesSistemaPage.jsx`.

### dashboard

**O que e:** painel resumido com indicadores.

**Para que serve:** permitir visao rapida do estado do sistema.

**Exemplo no projeto:** `DashboardHome.jsx`.

### relatorio

**O que e:** consolidacao de dados em formato de consulta e analise.

**Para que serve:** apoiar decisao e acompanhamento.

**Exemplo no projeto:** relatorio mensal e relatorio de reposicao.

---

## 17. Comandos E Palavras De Terminal Que Iniciantes Costumam Estranhar

Como voce tambem vai explicar o sistema para equipe, esta secao ajuda com o vocabululario fora do codigo.

### terminal

**O que e:** interface de texto para rodar comandos.

**Para que serve:** iniciar servidor, instalar dependencias e executar testes.

**Exemplo no projeto:** PowerShell rodando `npm run dev` ou `python manage.py runserver`.

### comando

**O que e:** instrucao digitada no terminal.

**Para que serve:** pedir que o sistema faca algo.

**Exemplo no projeto:** `npm run build`.

### script

**O que e:** comando nomeado dentro do `package.json`.

**Para que serve:** facilitar execucao de tarefas repetidas.

**Exemplo no projeto:** `dev`, `build`, `lint`, `preview`.

### instalar dependencias

**O que e:** baixar e preparar bibliotecas de que o projeto precisa.

**Para que serve:** permitir que o sistema rode corretamente.

**Exemplo no projeto:** `npm install`.

### subir o projeto

**O que e:** iniciar os servidores do sistema para uso local.

**Para que serve:** abrir a aplicacao em desenvolvimento.

**Exemplo no projeto:** backend com `python manage.py runserver` e frontend com `npm run dev`.

### ambiente de desenvolvimento

**O que e:** contexto local onde a equipe cria, testa e ajusta o sistema.

**Para que serve:** programar sem impactar usuarios reais.

**Exemplo no projeto:** rodar tudo em `localhost`.

### ambiente de producao

**O que e:** ambiente real usado por usuarios finais.

**Para que serve:** entregar o sistema em funcionamento para operacao real.

**Exemplo no projeto:** hoje a documentacao se concentra mais em desenvolvimento local e MVP.

### localhost

**O que e:** o proprio computador executando o sistema.

**Para que serve:** testar localmente sem depender de servidor externo.

**Exemplo no projeto:** `http://localhost:5173`.

### porta

**O que e:** numero usado para separar servicos de rede no mesmo computador.

**Para que serve:** permitir que frontend e backend rodem ao mesmo tempo.

**Exemplo no projeto:** frontend em `5173` e backend em `8000`.

### executar

**O que e:** rodar um comando ou programa.

**Para que serve:** iniciar uma acao do sistema.

**Exemplo no projeto:** executar `npm run lint`.

### compilar

**O que e:** transformar codigo em uma forma preparada para uso final.

**Para que serve:** gerar versao otimizada de execucao.

**Exemplo no projeto:** Vite compila o frontend no build.

### deploy

**O que e:** processo de publicar o sistema em ambiente acessivel para usuarios.

**Para que serve:** colocar o software no ar.

**Exemplo no projeto:** ainda nao foi detalhado na documentacao atual, mas seria o proximo passo natural apos o MVP.

### teste automatizado

**O que e:** codigo escrito para verificar se outra parte do codigo funciona.

**Para que serve:** reduzir risco de erro ao mexer no sistema.

**Exemplo no projeto:** `backend/app/tests.py`.

### lintar

**O que e:** passar o codigo pelo lint.

**Para que serve:** encontrar problemas simples e manter padrao.

**Exemplo no projeto:** `npm run lint`.

---

## 18. Como Todos Esses Termos Se Conectam Em Um Fluxo Real Do Projeto

Aqui vai um exemplo completo para juntar os nomes tecnicos com algo concreto.

### Exemplo: usuario cria um pedido

1. O usuario abre a pagina `PedidoFormPage.jsx` no frontend.
2. Essa pagina e um componente React.
3. Ela usa `useState` para guardar os dados do formulario.
4. Quando o usuario clica em salvar, acontece um evento `onSubmit`.
5. A pagina chama `authJsonRequest()` em `api.js`.
6. `authJsonRequest()` usa `fetch` para fazer uma requisicao HTTP ao backend.
7. A requisicao vai para o endpoint `/api/pedidos/`.
8. No backend, uma `view` recebe a requisicao.
9. O `serializer` valida os dados.
10. A camada de servico aplica a regra de negocio.
11. O `model` e salvo no banco PostgreSQL.
12. O backend responde com JSON e status `201`.
13. O frontend recebe a resposta.
14. Um `toast` de sucesso aparece.
15. O usuario e redirecionado para a rota `/pedidos`.

### Exemplo: usuario altera a logo da empresa

1. O usuario abre `ConfiguracoesSistemaPage.jsx`.
2. Escolhe uma imagem no input de arquivo.
3. O navegador cria uma preview usando `object URL`.
4. O frontend monta um `FormData`.
5. O `FormData` e enviado por `PATCH` para `/api/configuracao-sistema/`.
6. O backend recebe o upload com parser multipart.
7. O serializer valida os campos e a logo.
8. O model `ConfiguracaoSistema` salva os dados.
9. A logo vai para `backend/media/branding/logos/`.
10. O frontend recebe o novo `logo_url`.
11. `branding.js` aplica o novo tema e pode atualizar o favicon.

### Exemplo: usuario importa uma NF-e

1. O usuario abre `ImportarNotaFiscalPage.jsx`.
2. Faz upload de XML ou PDF.
3. O frontend envia o arquivo por `FormData`.
4. O backend faz parse do arquivo.
5. A camada de servico tenta identificar fornecedor, produto e variacao.
6. O sistema devolve um preview.
7. O usuario revisa os mapeamentos.
8. O frontend envia a confirmacao.
9. O backend cria ou vincula os registros.
10. O estoque recebe movimentacao de entrada.
11. O historico de importacao fica salvo no banco.

---

## 19. Perguntas Que Iniciantes Costumam Fazer

### "Por que quase tudo tem nome em ingles?"

Porque a maior parte das linguagens, bibliotecas e comunidades de programacao usam ingles como padrao. Mesmo quando trabalhamos em portugues, os nomes tecnicos costumam ser mantidos.

### "Preciso decorar todos esses nomes?"

Nao. O importante primeiro e entender a funcao de cada um. Com o uso diario, os nomes passam a soar naturais.

### "Favicon e obrigatorio?"

Nao e obrigatorio para o sistema funcionar, mas e importante para identidade visual e experiencia do usuario.

### "Por que usar `jsx` e nao `tsx`?"

Porque este projeto foi feito em JavaScript com React. Se fosse em TypeScript, os componentes normalmente usariam `tsx`.

### "Model e a mesma coisa que tabela?"

Nao exatamente, mas estao muito ligados. O model e a representacao em codigo Python; a tabela e a estrutura correspondente no banco.

### "Serializer e a mesma coisa que model?"

Nao. O model representa os dados do sistema. O serializer valida e traduz os dados para a API.

### "View e pagina sao a mesma coisa?"

Nao. No frontend, pagina e tela visual. No backend, view e a classe ou funcao que recebe a requisicao da API.

### "Servico e API sao a mesma coisa?"

Nao. A API e a porta de comunicacao. O servico e a logica de negocio usada por dentro do sistema.

### "Backend e banco de dados sao a mesma coisa?"

Nao. O backend usa o banco, mas tambem faz validacao, autenticacao, regras e resposta da API.

---

## 20. Resumo Ultra Simples Para Ensino Rapido

Se voce precisar explicar tudo isso em linguagem bem simples para um iniciante, use este resumo:

- `frontend` = telas
- `backend` = regras
- `API` = ponte
- `banco` = memoria permanente
- `model` = formato do dado
- `serializer` = tradutor do dado
- `view` = quem atende a requisicao
- `service` = onde mora a regra
- `component` = pedaco da tela
- `hook` = logica reaproveitavel
- `context` = dado global compartilhado
- `route` = caminho
- `token` = prova de login
- `favicon` = icone da aba
- `build` = versao final pronta

---

## 21. Fechamento Final

Este glossario ficou grande de proposito: para virar material de consulta real da equipe, nao apenas uma lista curta de definicoes.

O jeito mais eficiente de usar este arquivo e:

1. ler o guia principal;
2. consultar este glossario quando aparecer nome estranho;
3. abrir o arquivo do projeto correspondente;
4. ligar o termo tecnico ao exemplo real do sistema.

Quando a equipe comeca a fazer essa ligacao entre nome tecnico e exemplo pratico, a curva de aprendizado cai muito.

---

## 22. Explicacao Aprofundada Das Camadas Do Sistema

Nesta secao a ideia nao e apenas definir palavras. A ideia e mostrar como as partes do sistema se encaixam como se voce estivesse olhando uma maquina funcionando por dentro.

### 22.1 O que realmente e o frontend

Quando falamos que o `frontend` e "a parte visual", isso pode parecer simples demais. Na pratica, o frontend faz varias funcoes ao mesmo tempo:

- mostra telas;
- captura clique, digitacao e selecao do usuario;
- organiza navegacao;
- valida algumas coisas basicas antes de enviar;
- conversa com o backend;
- mostra mensagens de erro e sucesso;
- decide o que deve aparecer conforme permissao ou estado.

No seu projeto, o frontend nao e apenas "desenho". Ele tambem toma varias decisoes de experiencia de uso.

Exemplo real:

1. O usuario abre a tela de produtos.
2. O frontend monta a tabela.
3. O frontend chama a API.
4. O frontend recebe os dados.
5. O frontend formata preco e status.
6. O frontend mostra botoes diferentes para admin e funcionario.

Ou seja:

- o backend nao desenha a tela;
- o frontend nao salva direto no banco;
- mas o frontend organiza toda a experiencia da pessoa usando o sistema.

### 22.2 O que realmente e o backend

Quando falamos que o `backend` e "a parte das regras", tambem vale aprofundar.

O backend do seu projeto faz varias tarefas ao mesmo tempo:

- recebe requisicoes do frontend;
- confere se o usuario esta autenticado;
- verifica se ele tem permissao;
- valida os dados recebidos;
- aplica regras de negocio;
- grava no banco;
- monta a resposta da API.

Exemplo real:

Se o usuario tenta finalizar um pedido sem saldo:

1. O frontend envia os dados.
2. O backend recebe.
3. O backend valida os itens.
4. O backend verifica estoque disponivel.
5. O backend percebe que nao ha saldo suficiente.
6. O backend bloqueia a operacao.
7. O backend devolve erro explicando o motivo.

Isso mostra uma ideia muito importante:

- o frontend ajuda a experiencia;
- o backend garante a regra.

Se algum dia um outro frontend fosse criado, o backend ainda seria o guardiao da regra.

### 22.3 O que realmente e a API

Muita gente ouve `API` e imagina algo muito abstrato. No seu sistema, pense assim:

- a API e a porta oficial de conversa com o backend.

Ela define:

- quais caminhos existem;
- que tipo de dado cada caminho aceita;
- quem pode usar cada caminho;
- o que acontece quando esse caminho e chamado;
- o formato da resposta.

Exemplo:

`/api/produtos/`

Esse caminho significa:

- existe um recurso chamado produtos;
- o frontend pode consultar esse recurso;
- dependendo do metodo HTTP, ele pode listar, criar, alterar ou excluir;
- o backend responde em JSON.

Entao a API e como um balcão de atendimento com regras claras.

### 22.4 O que realmente e o banco de dados

O banco de dados nao e apenas "o arquivo onde salva". Ele e a memoria permanente do sistema.

O que isso significa:

- se voce fechar o navegador, os dados continuam;
- se reiniciar o backend, os dados continuam;
- o banco preserva o historico real da operacao.

No projeto, o PostgreSQL guarda:

- usuarios;
- produtos;
- variacoes;
- fornecedores;
- movimentacoes;
- pedidos;
- importacoes;
- configuracao visual.

Forma simples de pensar:

- frontend = mostra
- backend = processa
- banco = guarda

### 22.5 Como navegador, frontend, backend e banco trabalham juntos

Fluxo resumido:

1. O navegador abre a aplicacao.
2. O React monta a tela.
3. O usuario faz alguma acao.
4. O frontend envia uma requisicao HTTP.
5. O backend recebe.
6. O backend consulta ou altera o banco.
7. O backend devolve uma resposta.
8. O frontend atualiza a interface.

Esse ciclo se repete o tempo inteiro.

### 22.6 Por que separar em camadas ajuda

Separar o sistema em camadas ajuda porque cada parte tem responsabilidade diferente.

Se tudo estivesse misturado:

- ficaria mais dificil de manter;
- ficaria mais dificil de testar;
- ficaria mais dificil de explicar;
- ficaria mais facil quebrar regra de negocio.

No seu projeto a separacao ficou assim:

- `pages` e `components` para interface;
- `api.js` para comunicacao;
- `views.py` para entrada HTTP;
- `serializers.py` para validacao/transformacao;
- `services.py` para regra de negocio;
- `models.py` para estrutura dos dados.

Isso e muito importante para explicar ao time, porque mostra que o sistema nao foi montado de forma aleatoria.

---

## 23. Comparacoes Que Mais Confundem Iniciantes

Esta talvez seja a secao mais importante para ensino. Muitas vezes o problema nao e nao saber um termo isolado. O problema e confundir um termo com outro parecido.

### 23.1 `frontend` x `backend`

**Frontend**

- aparece na tela;
- reage ao usuario;
- navega entre paginas;
- formata dados;
- chama a API.

**Backend**

- recebe requisicoes;
- aplica regras;
- valida dados;
- protege acesso;
- grava no banco.

**Resumo rapido**

- frontend = experiencia
- backend = controle

### 23.2 `pagina` x `componente`

**Pagina**

- representa uma tela inteira;
- normalmente esta ligada a uma rota;
- costuma juntar varios componentes menores.

**Componente**

- e um bloco menor reutilizavel;
- pode aparecer em varias paginas;
- normalmente resolve uma parte da interface.

**Exemplo do projeto**

- `ProdutosPage.jsx` = pagina
- `SummaryCard.jsx` = componente
- `Layout.jsx` = componente estrutural grande

**Forma facil de pensar**

- pagina = comodo inteiro
- componente = movel ou peca daquele comodo

### 23.3 `props` x `state` x `context`

Esses tres termos vivem se misturando na cabeca de quem comeca.

**Props**

- dados passados de um componente para outro;
- normalmente vem do "pai" para o "filho";
- servem para personalizar.

**State**

- dado interno do proprio componente;
- muda ao longo do uso;
- controla o comportamento daquela tela ou bloco.

**Context**

- dado global compartilhado por muitos componentes;
- evita passar a mesma informacao manualmente por varios niveis.

**Exemplo facil**

- `props` = o que o pai entrega para o filho
- `state` = o que o proprio componente guarda
- `context` = o que o sistema inteiro compartilha

**Exemplo no projeto**

- `SummaryCard` recebe `props`
- `Login.jsx` usa `state` para usuario e senha
- `AuthContext` compartilha sessao globalmente

### 23.4 `model` x `serializer` x `view` x `service`

Essa e uma das confusoes mais importantes do backend.

**Model**

- descreve os dados;
- representa entidades do sistema;
- conversa com o banco.

**Serializer**

- valida entrada;
- formata saida;
- traduz entre objeto e JSON.

**View**

- recebe a requisicao;
- escolhe o serializer;
- chama a logica;
- devolve a resposta.

**Service**

- guarda regra de negocio mais pesada;
- decide comportamento da operacao.

**Forma muito pratica de pensar**

- `model` = estrutura
- `serializer` = tradutor/validador
- `view` = atendente
- `service` = especialista da regra

**Exemplo do projeto**

Ao importar NF-e:

- o `model` guarda a importacao e os itens;
- o `serializer` valida o que veio;
- a `view` recebe o upload;
- o `service` faz parse, sugestao, vinculacao e entrada no estoque.

### 23.5 `route` x `URL` x `endpoint`

Esses termos sao parentes, mas nao iguais.

**URL**

- endereco completo.

Exemplo:

`http://127.0.0.1:8000/api/produtos/`

**Route ou rota**

- caminho que aponta para um destino dentro do sistema.

Exemplo:

- `/produtos` no frontend
- `/api/produtos/` no backend

**Endpoint**

- rota especifica de API usada para uma acao concreta.

Exemplo:

- `/api/token/`
- `/api/relatorios/reposicao/`

**Resumo**

- URL = endereco completo
- rota = caminho
- endpoint = ponto especifico da API

### 23.6 `autenticacao` x `autorizacao`

**Autenticacao**

- responde: "quem e voce?"

**Autorizacao**

- responde: "o que voce pode fazer?"

**Exemplo real**

- login com JWT = autenticacao
- saber se o usuario e admin ou funcionario = autorizacao

### 23.7 `build` x `dev`

**Dev**

- ambiente de desenvolvimento;
- mais rapido para programar;
- com recarga e diagnosticos.

**Build**

- versao final preparada para uso;
- otimizada para entrega.

**Exemplo no projeto**

- `npm run dev` = ambiente de desenvolvimento
- `npm run build` = gera versao final em `dist`

### 23.8 `upload` x `importacao`

Esses dois parecem iguais, mas nao sao.

**Upload**

- e o ato de mandar o arquivo para o sistema.

**Importacao**

- e o processo completo de ler o arquivo, interpretar os dados e transformar aquilo em registros do sistema.

**Exemplo real**

Na NF-e:

- o upload manda o XML/PDF para o backend;
- a importacao analisa, sugere produto, cria movimentacao e grava historico.

### 23.9 `arquivo` x `registro`

**Arquivo**

- existe no sistema de arquivos;
- pode ser imagem, XML, PDF, documento.

**Registro**

- existe no banco;
- representa um dado estruturado.

**Exemplo**

- `logo.png` = arquivo
- `ConfiguracaoSistema.logo` = campo que referencia esse arquivo

### 23.10 `erro tecnico` x `erro de negocio`

**Erro tecnico**

- problema de codigo, servidor, rede ou formato.

**Erro de negocio**

- regra da operacao nao permitiu a acao.

**Exemplos**

- erro tecnico: JSON invalido, falha de parser, URL errada
- erro de negocio: estoque insuficiente, SKU duplicado, usuario sem permissao

Essa diferenca e muito importante em apresentacao, porque mostra maturidade do sistema.

---

## 24. Para Que Serve Na Pratica: Funcao Real Dos Termos Mais Importantes

Esta secao foi criada para aprofundar exatamente a parte de `Para que serve`.

A ideia aqui e sair do nivel "definicao curta" e entrar no nivel:

- qual funcao real isso cumpre;
- o que quebra se isso nao existir;
- em que momento isso participa do fluxo;
- por que a equipe precisa conhecer esse termo.

### 24.1 `frontend`

**Para que serve na pratica:**

O frontend serve para transformar regras e dados em experiencia de uso.

Na pratica ele faz tudo isso ao mesmo tempo:

- mostra a tela para o usuario;
- organiza botoes, tabelas, campos e menus;
- coleta o que o usuario digitou;
- decide o que deve ficar visivel;
- mostra mensagens de erro e sucesso;
- chama o backend na hora certa;
- atualiza a tela quando a resposta chega.

Sem frontend, o usuario ate poderia acessar a API por ferramentas tecnicas, mas nao teria uma interface amigavel para operar o sistema.

No seu projeto, o frontend serve especialmente para:

- facilitar cadastro de produtos;
- permitir login de forma amigavel;
- exibir o painel de estoque;
- orientar a importacao de NF-e;
- mostrar relatorios;
- aplicar identidade visual da empresa.

### 24.2 `backend`

**Para que serve na pratica:**

O backend serve para ser a parte confiavel e central do sistema.

Ele nao existe apenas para "guardar dados". Ele existe para garantir que o sistema so aceite operacoes corretas.

Na pratica ele:

- recebe o pedido do frontend;
- confere quem esta fazendo a acao;
- valida os dados;
- aplica a regra de negocio;
- consulta e altera o banco;
- devolve a resposta padronizada.

Sem backend, o frontend ficaria sem controle real, sem seguranca e sem persistencia confiavel.

No seu projeto, o backend e quem garante coisas como:

- nao vender sem estoque;
- nao duplicar SKU indevidamente;
- so admin alterar configuracoes;
- importacao de nota fiscal nao entrar em duplicidade;
- relatorios sairem de dados corretos.

### 24.3 `API`

**Para que serve na pratica:**

A API serve para padronizar a conversa entre frontend e backend.

Ela evita que cada tela "invente um jeito" diferente de pedir dados.

Na pratica a API define:

- quais caminhos existem;
- o que cada caminho recebe;
- o que cada caminho devolve;
- quais erros podem acontecer;
- quem pode acessar cada rota.

Sem API organizada, o frontend teria muita dificuldade para conversar com o backend de forma previsivel.

No seu projeto, a API serve para:

- login e refresh de token;
- CRUD de produtos, usuarios e fornecedores;
- registrar entradas e saidas;
- importar NF-e;
- gerar relatorios;
- carregar configuracao visual.

### 24.4 `rota`

**Para que serve na pratica:**

A rota serve para separar os caminhos e responsabilidades do sistema.

Pense nela como o endereco de uma acao ou de uma tela.

Na pratica, a rota:

- organiza navegacao;
- permite chegar na tela certa;
- permite chegar no recurso certo da API;
- ajuda a dividir o sistema em responsabilidades claras.

Sem rotas, tudo ficaria misturado e o sistema nao saberia qual tela abrir ou qual regra executar.

No seu projeto:

- `/produtos` serve para abrir a tela de produtos;
- `/api/produtos/` serve para consultar ou alterar produtos no backend.

### 24.5 `componente`

**Para que serve na pratica:**

O componente serve para quebrar a interface em pecas reutilizaveis.

Isso e importante porque, sem componentes, cada tela precisaria repetir muito codigo visual.

Na pratica, o componente serve para:

- evitar repeticao;
- manter padrao visual;
- facilitar manutencao;
- permitir reutilizacao em varias telas;
- separar preocupacoes.

Exemplo pratico:

`SummaryCard` serve para mostrar indicadores em varios lugares sem reescrever card, classe CSS, estrutura HTML e comportamento toda vez.

Se o visual desse card mudar, a equipe altera em um lugar so.

### 24.6 `hook`

**Para que serve na pratica:**

O hook serve para reaproveitar comportamento, e nao apenas interface.

Enquanto componente reaproveita "bloco visual", o hook reaproveita "bloco de logica".

Na pratica, um hook pode servir para:

- guardar estado;
- ouvir eventos;
- acessar contexto;
- controlar carregamento;
- detectar responsividade;
- encapsular uma regra do frontend.

No seu projeto:

- `useAuth` serve para entregar sessao e acoes de login/logout sem repetir o acesso ao contexto;
- `useIsMobile` serve para detectar quando a tela esta em largura de celular;
- `useSystemConfig` serve para acessar branding global.

Sem hooks, boa parte dessa logica ficaria duplicada em varias paginas.

### 24.7 `context`

**Para que serve na pratica:**

O context serve para compartilhar dados importantes entre muitas partes do app sem ter que passar manualmente por varios componentes.

Na pratica ele e muito util para dados "globais", como:

- usuario logado;
- permissao;
- configuracao da empresa;
- tema;
- idioma;
- preferencias globais.

No seu projeto:

- `AuthContext` serve para disponibilizar usuario, loading, login e logout em todo o app;
- `SystemConfigContext` serve para disponibilizar nome da empresa, logo, cores e funcoes de atualizacao.

Sem context, voce teria que passar esses dados tela por tela, componente por componente, o que deixaria o codigo muito mais confuso.

### 24.8 `state`

**Para que serve na pratica:**

O state serve para guardar aquilo que muda durante o uso da tela.

Na pratica ele e usado para:

- texto digitado;
- filtros;
- item selecionado;
- loading;
- erro;
- dados recebidos da API.

Sem state, a interface nao conseguiria reagir corretamente ao que o usuario faz.

No seu projeto, state serve para:

- guardar login e senha;
- guardar lista de produtos;
- guardar filtros e pagina atual;
- guardar preview de importacao;
- guardar formulario de pedido.

### 24.9 `props`

**Para que serve na pratica:**

Props servem para um componente pai configurar um componente filho.

Na pratica elas permitem:

- reaproveitar componente com conteudos diferentes;
- deixar o componente mais generico;
- separar quem fornece dado e quem apenas exibe.

Sem props, cada componente teria que ser rigido e muito menos reaproveitavel.

No seu projeto:

- `SummaryCard` recebe `title`, `value`, `tone` e `caption`;
- `Layout` recebe `title`, `children` e `showTopbar`.

Isso faz o mesmo componente funcionar em varios contextos.

### 24.10 `model`

**Para que serve na pratica:**

O model serve para dizer quais dados existem de verdade no sistema.

Ele nao e so "um arquivo do Django". Ele define a espinha dorsal do negocio.

Na pratica o model serve para:

- definir campos;
- definir relacoes;
- definir validacoes;
- representar entidades reais;
- conversar com o banco.

Sem model, o sistema nao teria uma estrutura clara para produtos, variacoes, pedidos e movimentacoes.

No seu projeto:

- `Produto` serve para representar o cadastro principal do item;
- `Variacao` serve para representar o item estocavel real;
- `Movimentacao` serve para representar historico de entrada e saida;
- `PedidoVenda` serve para representar a venda.

### 24.11 `serializer`

**Para que serve na pratica:**

O serializer serve para ser o "tradutor e fiscal" entre o mundo externo e o mundo interno.

Ele pega aquilo que veio de fora e pergunta:

- isso tem o formato certo?
- isso tem os campos obrigatorios?
- isso respeita as regras da API?
- isso pode ser convertido para o formato que o backend espera?

E no caminho contrario ele pega o objeto interno e transforma em uma resposta que o frontend consegue usar.

Na pratica, o serializer serve para:

- validar entrada;
- limpar e organizar dados;
- padronizar JSON de resposta;
- proteger campos que nao devem sair;
- montar campos derivados quando necessario.

Sem serializer, a API ficaria baguncada, insegura e com validacao espalhada.

No seu projeto:

- `ProdutoSerializer` serve para expor produto com estoque total e status;
- `PedidoVendaSerializer` serve para validar itens, status e total da venda;
- `ConfiguracaoSistemaSerializer` serve para devolver `logo_url` e tratar upload/remocao da logo.

### 24.12 `view`

**Para que serve na pratica:**

A view serve para ser a porta de entrada da requisicao.

Ela e quem recebe o pedido HTTP e organiza o primeiro nivel da resposta.

Na pratica a view serve para:

- receber a requisicao;
- escolher o serializer;
- verificar permissao;
- chamar a logica correta;
- devolver `Response(...)`.

Sem view, a URL nao teria quem atendesse a requisicao.

No seu projeto:

- `ProdutoViewSet` atende operacoes de produto;
- `ConfiguracaoSistemaView` atende leitura e atualizacao do branding;
- `NotaFiscalImportacaoPreviewView` atende a etapa de analise da nota.

### 24.13 `service`

**Para que serve na pratica:**

O service serve para guardar a regra de negocio que seria complexa demais para ficar na view ou no serializer.

Na pratica ele serve para:

- centralizar comportamento complexo;
- reaproveitar logica em mais de um ponto;
- deixar views menores;
- separar "receber requisicao" de "decidir como o negocio funciona".

Sem service, arquivos como `views.py` ficariam enormes e confusos.

No seu projeto, `services.py` serve para:

- registrar movimentacao;
- criar variacao com estoque inicial;
- parsear XML e PDF;
- aplicar importacao de NF-e;
- limpar importacao;
- gerar relatorios;
- salvar pedido com baixa ou estorno.

### 24.14 `migration`

**Para que serve na pratica:**

A migration serve para atualizar a estrutura do banco de forma controlada.

Na pratica ela funciona como um historico tecnico da evolucao dos dados.

Ela serve para:

- criar tabelas novas;
- adicionar colunas;
- alterar campos;
- manter o banco alinhado com o codigo;
- permitir que o sistema evolua sem recriar tudo do zero.

Sem migration, cada mudanca em model viraria uma bagunca manual no banco.

No seu projeto, as migrations mostram claramente quando surgiram:

- perfil de usuario;
- configuracao do sistema;
- pedidos de venda;
- campos fiscais no produto.

### 24.15 `middleware`

**Para que serve na pratica:**

O middleware serve para aplicar comportamento global em todas ou quase todas as requisicoes.

Na pratica ele age antes e depois da view.

Ele serve para:

- seguranca;
- sessao;
- autenticacao;
- CORS;
- tratamento padrao de request/response.

Sem middleware, varias regras globais teriam que ser repetidas em cada rota.

No seu projeto, um caso importante e o middleware de CORS, que permite o frontend local conversar com o backend local.

### 24.16 `token` e `JWT`

**Para que serve na pratica:**

O token serve para representar a prova de que o usuario fez login.

Em vez de enviar usuario e senha em toda requisicao, o frontend envia esse token.

Na pratica, o token serve para:

- manter a sessao;
- autenticar chamadas protegidas;
- evitar repetir login a cada clique;
- separar autenticacao do corpo da requisicao.

No seu projeto:

- o `access token` serve para chamar a API no dia a dia;
- o `refresh token` serve para renovar a sessao quando o access expira.

Sem token, o frontend teria que reautenticar o usuario de forma muito mais inconveniente.

### 24.17 `favicon`

**Para que serve na pratica:**

O favicon serve para identificar visualmente a aba do sistema no navegador.

Parece pequeno, mas cumpre varias funcoes:

- ajuda o usuario a reconhecer rapidamente a aba certa;
- reforca identidade visual;
- deixa o sistema com aparencia mais profissional;
- acompanha favoritos e atalhos do navegador.

No seu projeto ele tem ainda uma funcao extra interessante:

- pode acompanhar a identidade visual configurada pela empresa.

Ou seja, aqui o favicon nao e so "um desenho pequeno". Ele participa da personalizacao do sistema.

### 24.18 `build`

**Para que serve na pratica:**

O build serve para transformar o frontend de desenvolvimento em uma versao pronta para entrega.

Na pratica ele:

- junta arquivos;
- otimiza recursos;
- gera versao mais leve;
- prepara a pasta final para deploy.

Sem build, a versao de producao ficaria menos otimizada e mais dependente do ambiente de desenvolvimento.

No seu projeto, o resultado vai para `frontend/dist/`.

### 24.19 `public`

**Para que serve na pratica:**

A pasta `public` serve para guardar arquivos estaticos que precisam existir de forma direta e previsivel.

Na pratica ela e util quando voce quer:

- um favicon fixo inicial;
- um arquivo acessivel por caminho direto;
- um recurso estatico que nao precisa passar pelo bundle principal.

No seu projeto:

- o `favicon.svg` inicial esta em `frontend/public/`.

### 24.20 `assets`

**Para que serve na pratica:**

`assets` serve para organizar recursos visuais usados pelo frontend.

Na pratica isso ajuda a:

- centralizar imagens;
- separar codigo de recursos visuais;
- manter o projeto mais organizado.

Mesmo quando algum asset nao esta em uso agora, ele normalmente representa material visual de apoio ou resquicio de scaffold.
