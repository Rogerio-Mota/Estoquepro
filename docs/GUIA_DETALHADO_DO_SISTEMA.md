# Guia Detalhado Do Sistema

## 1. Objetivo Deste Documento

Este arquivo foi criado para servir como material de explicacao tecnica e funcional do projeto `EstoquePro`.

Ele foi pensado para ajudar voce a explicar para a equipe:

- por que cada tecnologia foi escolhida;
- como o sistema esta dividido entre `frontend` e `backend`;
- por que certos arquivos usam extensoes como `py`, `jsx`, `js`, `css` e nao `tsx`;
- o papel das principais pastas;
- o papel dos principais arquivos;
- como o fluxo do sistema acontece da tela ate o banco de dados.

---

## 2. Visao Geral Da Arquitetura

O projeto segue uma arquitetura de aplicacao web separada em duas partes principais:

1. `frontend/`
   Parte visual do sistema. E onde ficam as telas, formularios, navegacao, layout, interacoes do usuario e consumo da API.

2. `backend/`
   Parte de negocio e dados. E onde ficam as regras de estoque, validacoes, autenticacao, API REST, persistencia e processamento de nota fiscal.

Em termos praticos, o fluxo principal e este:

```text
Usuario -> Frontend React -> Requisicao HTTP -> Backend Django REST -> Regras de negocio -> Banco PostgreSQL
```

Exemplo real do projeto:

```text
Tela de "Novo Pedido" -> frontend/src/pages/PedidoFormPage.jsx
-> chama frontend/src/services/api.js
-> envia POST para /api/pedidos/
-> backend/app/views.py recebe
-> backend/app/serializers.py valida
-> backend/app/services.py aplica regra de negocio
-> backend/app/models.py grava no banco
-> PostgreSQL persiste
```

---

## 3. Tecnologias Escolhidas E O Motivo

### 3.1 Backend

#### Python

Foi escolhido porque:

- e muito produtivo para MVP;
- tem ecossistema forte para web;
- combina muito bem com Django;
- deixa regras de negocio legiveis.

#### Django

Foi escolhido porque:

- acelera a criacao de CRUDs e estrutura base;
- traz ORM nativo para trabalhar com banco;
- traz painel administrativo pronto (`/admin`);
- ajuda a manter padrao de projeto;
- tem bom suporte para autenticacao e seguranca.

#### Django REST Framework

Foi escolhido porque:

- transforma o Django em API REST de forma organizada;
- usa `serializers` para validar entrada e saida de dados;
- usa `ViewSet` e `APIView` para expor recursos;
- facilita filtros, autenticacao e permissoes.

#### Simple JWT

Foi escolhido para autenticacao via token JWT porque:

- o frontend e separado do backend;
- JWT funciona muito bem para SPA em React;
- permite sessao sem depender de template server-side do Django;
- combina com login, refresh de token e protecao de rotas.

#### django-filter

Foi escolhido porque:

- ajuda a filtrar recursos da API com menos codigo manual;
- melhora consultas em listagens como produtos, variacoes e movimentacoes.

#### django-cors-headers

Foi escolhido porque:

- em desenvolvimento o frontend roda em uma porta e o backend em outra;
- o navegador bloqueia isso por politica de seguranca sem CORS configurado;
- esse pacote libera a comunicacao controlada entre `localhost:5173` e `localhost:8000`.

#### PostgreSQL

E o banco principal porque:

- oferece melhor robustez para uso concorrente;
- se adapta melhor a producao e crescimento do sistema;
- trabalha com conexoes e transacoes de forma mais adequada;
- pode ser configurado por `DATABASE_URL` ou variaveis `POSTGRES_*`.

### 3.2 Frontend

#### React

Foi escolhido porque:

- organiza a interface em componentes reutilizaveis;
- facilita separar paginas, layout, hooks, contexto e servicos;
- permite SPA moderna com navegacao sem recarregar a pagina inteira;
- encaixa bem com consumo de API REST.

#### React Router

Foi escolhido porque:

- controla as rotas do frontend;
- permite paginas como `/produtos`, `/pedidos`, `/relatorios`;
- ajuda a proteger rotas com `PrivateRoute`.

#### Vite

Foi escolhido porque:

- sobe o frontend muito rapido em desenvolvimento;
- compila a aplicacao com performance melhor que setups antigos;
- funciona muito bem com React moderno;
- usa configuracao simples.

#### React Toastify

Foi escolhido porque:

- padroniza mensagens de sucesso e erro;
- melhora a experiencia do usuario;
- evita recriar sistema de notificacao do zero.

#### CSS customizado

Foi escolhido porque:

- o projeto tem identidade visual propria;
- precisava de tema dinamico baseado na empresa;
- o arquivo `frontend/src/index.css` centraliza o visual do sistema.

---

## 4. Por Que As Extensoes Sao Essas

### 4.1 `.py`

Usado no backend porque o backend foi feito em Python.

Exemplos:

- `backend/manage.py`
- `backend/config/settings.py`
- `backend/app/models.py`

Arquivos `.py` normalmente guardam:

- modelos;
- regras de negocio;
- views;
- serializers;
- permissoes;
- configuracoes.

### 4.2 `.jsx`

Usado no frontend para arquivos React que contem JSX.

JSX e a sintaxe parecida com HTML dentro do JavaScript, por exemplo:

```jsx
return <Layout title="Produtos">...</Layout>;
```

Por isso paginas e componentes usam `.jsx`.

Exemplos:

- `frontend/src/App.jsx`
- `frontend/src/pages/ProdutosPage.jsx`
- `frontend/src/components/Layout.jsx`

### 4.3 `.js`

Usado no frontend para arquivos JavaScript sem JSX visivel, normalmente arquivos de apoio, logica, constantes ou servicos.

Exemplos:

- `frontend/src/services/api.js`
- `frontend/src/utils/branding.js`
- `frontend/src/constants/productOptions.js`
- `frontend/vite.config.js`
- `frontend/eslint.config.js`

Resumo pratico:

- `.jsx` = JavaScript com interface React/JSX
- `.js` = JavaScript puro de apoio

### 4.4 Por Que O Projeto Usa `.jsx` E Nao `.tsx`

`tsx` seria usado se o projeto estivesse em TypeScript com JSX.

Comparacao:

- `.jsx` = JavaScript + JSX
- `.tsx` = TypeScript + JSX

No estado atual, este projeto nao foi estruturado com TypeScript porque:

- nao existe `tsconfig.json` no codigo principal;
- os arquivos de tela e componente sao `.jsx`;
- os arquivos de apoio sao `.js`;
- a configuracao do ESLint esta apontando para `**/*.{js,jsx}`.

Ou seja:

- o frontend foi implementado em JavaScript moderno;
- nao em TypeScript.

Se um dia o time quiser tipagem estatica, o caminho seria migrar gradualmente arquivos para `.ts` e `.tsx`.

### 4.5 `.css`

Usado para estilos visuais.

Exemplos:

- `frontend/src/index.css`
- `frontend/src/App.css`

No projeto atual:

- `index.css` e o arquivo principal de estilo carregado no app;
- `App.css` existe no repositorio, mas nao aparece importado no codigo atual, entao parece ser um arquivo legado ou sobra de estrutura inicial.

### 4.6 `.html`

Usado para o HTML-base da aplicacao frontend.

Exemplo:

- `frontend/index.html`

Esse arquivo e importante porque:

- define o `<div id="root"></div>` onde o React monta a aplicacao;
- carrega `src/main.jsx`;
- define favicon e metadados iniciais.

### 4.7 `.json`

Usado para configuracoes e metadados de pacotes.

Exemplos:

- `frontend/package.json`
- `frontend/package-lock.json`
- `package.json`
- `package-lock.json`

Uso principal:

- scripts de execucao;
- lista de dependencias;
- travamento de versoes instaladas.

### 4.8 `.md`

Usado para documentacao em Markdown.

Exemplos:

- `README.md`
- `docs/PRD.md`
- este arquivo `docs/GUIA_DETALHADO_DO_SISTEMA.md`

### 4.9 `.svg`

Usado para arquivos vetoriais.

Exemplos:

- `frontend/public/favicon.svg`
- `frontend/public/icons.svg`
- `frontend/src/assets/react.svg`
- `frontend/src/assets/vite.svg`

Vantagens:

- boa qualidade em qualquer escala;
- arquivos leves;
- otimos para icones e logos.

Observacao:

- `favicon.svg` esta em uso no `frontend/index.html`;
- `icons.svg` existe em `public`, mas nao aparece referenciado no codigo atual;
- `react.svg` e `vite.svg` existem em `src/assets`, mas nao aparecem importados no app atual.

### 4.10 `.png`, `.jpg`, `.jpeg`, `.webp`

Usado para imagens raster.

Exemplos:

- logos em `backend/media/branding/logos/`
- `frontend/src/assets/hero.png`

No backend, essas imagens entram como upload do usuario.

### 4.11 `PostgreSQL`

Banco de dados relacional utilizado pela aplicacao.

Ele centraliza os dados persistentes do sistema, como usuarios, produtos, pedidos e movimentacoes.

### 4.12 `.pyc`

Arquivos compilados do Python.

Exemplo:

- pastas `__pycache__/`

Eles sao gerados automaticamente pelo Python e nao sao parte da logica de negocio.

---

## 5. Estrutura Geral Do Projeto

```text
PROJETO_MVP/
|-- backend/
|-- docs/
|-- frontend/
|-- node_modules/
|-- package.json
|-- package-lock.json
|-- README.md
```

### 5.1 Raiz Do Projeto

#### `README.md`

Documento principal do projeto.

Serve para:

- resumir o sistema;
- listar tecnologias;
- mostrar comandos de execucao;
- apresentar rotas principais;
- orientar setup rapido.

#### `docs/`

Pasta dedicada a documentacao.

Arquivos encontrados:

- `docs/PRD.md`
- `docs/GUIA_DETALHADO_DO_SISTEMA.md`
- `docs/GLOSSARIO_TERMOS_PARA_INICIANTES.md`

#### `package.json` na raiz

Existe um `package.json` na raiz com apenas `react-toastify`.

Leitura tecnica mais segura:

- o frontend operacional de fato esta em `frontend/package.json`;
- este `package.json` da raiz parece residual, auxiliar ou historico;
- nao e o centro do frontend atual.

#### `node_modules/` na raiz

Contem dependencias instaladas na raiz.

Como o frontend principal esta em `frontend/`, esta pasta da raiz nao representa a organizacao ideal final do projeto, mas existe no estado atual do repositorio.

---

## 6. Backend Em Detalhes

### 6.1 Estrutura Do Backend

```text
backend/
|-- app/
|-- config/
|-- media/
|-- venv/
|-- manage.py
```

### 6.2 Arquivos Principais Do Backend

#### `backend/manage.py`

Arquivo padrao do Django para comandos administrativos.

Ele serve para executar:

- `runserver`
- `migrate`
- `makemigrations`
- `test`
- `createsuperuser`

Sem ele, o Django nao sobe e nao administra o projeto.

#### PostgreSQL

Banco de dados da aplicacao.

Tudo o que e persistido fica nele:

- usuarios;
- produtos;
- variacoes;
- movimentacoes;
- pedidos;
- configuracoes do sistema;
- historico de importacao de NF-e.

### 6.3 Pasta `backend/config/`

Essa pasta representa a configuracao global do projeto Django.

#### `backend/config/settings.py`

Arquivo mais importante de configuracao do backend.

Ele define:

- `BASE_DIR`;
- `SECRET_KEY`;
- `DEBUG`;
- `ALLOWED_HOSTS`;
- `CORS_ALLOWED_ORIGINS`;
- `INSTALLED_APPS`;
- `MIDDLEWARE`;
- banco de dados;
- idioma;
- timezone;
- `REST_FRAMEWORK`;
- configuracao do JWT;
- `MEDIA_URL` e `MEDIA_ROOT`.

Por que ele e importante:

- centraliza o comportamento global do backend;
- determina quais apps e middlewares existem;
- define autenticacao e permissoes padrao;
- controla como a API e o armazenamento funcionam.

#### `backend/config/urls.py`

Roteador principal do backend.

Ele conecta:

- `/admin/`
- `/api/`
- `/api/token/`
- `/api/token/refresh/`

Tambem expone `media/` quando `DEBUG=True`.

#### `backend/config/asgi.py`

Entrada ASGI do projeto.

Importante para servidores e cenarios assincronos modernos.

#### `backend/config/wsgi.py`

Entrada WSGI do projeto.

Mais tradicional para deploy Django.

#### `backend/config/__init__.py`

Marca a pasta como pacote Python.

### 6.4 Pasta `backend/app/`

Essa e a aplicacao de negocio principal do sistema.

Aqui esta praticamente toda a regra do produto.

#### `backend/app/apps.py`

Define o `AppConfig` da aplicacao.

Papel principal:

- registrar a app `app`;
- carregar `signals.py` no metodo `ready()`.

Sem isso, os sinais de criacao automatica de perfil de usuario podem nao ser inicializados.

#### `backend/app/models.py`

Este e um dos arquivos mais importantes do backend.

Ele define a estrutura dos dados e varias validacoes centrais.

Modelos encontrados:

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

##### `PerfilUsuario`

Complementa o usuario padrao do Django com tipo de acesso:

- `admin`
- `funcionario`

Foi usado porque o `User` padrao do Django nao tem, por si so, a regra de papel de negocio do sistema.

##### `Fornecedor`

Representa quem fornece produtos.

Campos relevantes:

- nome;
- documento;
- contato;
- telefone;
- email;
- criado_em.

##### `Produto`

Representa o produto base do catalogo.

Campos relevantes:

- nome;
- categoria;
- subcategoria;
- marca;
- sku;
- codigo_barras;
- ncm;
- cest;
- cfop;
- unidade_comercial;
- fornecedor;
- preco_custo;
- preco_venda;
- estoque_minimo.

Tambem contem regras como:

- SKU unico;
- validacao de preco;
- relacao valida entre categoria e subcategoria;
- prevencao de duplicidade logica.

##### `Variacao`

Representa o item vendavel/estocavel real.

Exemplos:

- camisa azul tamanho M;
- tenis branco numero 42.

Campos principais:

- produto;
- cor;
- tamanho;
- numeracao;
- saldo_atual.

Esse modelo existe porque um produto pode ter varias combinacoes fisicas.

##### `PedidoVenda`

Representa um pedido de venda.

Estados:

- `rascunho`
- `finalizado`
- `cancelado`

Ele e importante porque o estoque pode ser baixado automaticamente quando o pedido vira `finalizado`.

##### `Movimentacao`

Representa entradas e saidas de estoque.

Tipos:

- `entrada`
- `saida`

Esse modelo e fundamental para rastreabilidade.

##### `PedidoVendaItem`

Representa os itens internos de um pedido.

Relaciona:

- pedido;
- variacao;
- quantidade;
- preco_unitario;
- movimentacoes ligadas a baixa e estorno.

##### `ImportacaoNotaFiscal`

Representa o cabecalho de uma importacao de NF-e.

Guarda:

- chave de acesso;
- numero;
- serie;
- fornecedor;
- data de emissao;
- arquivo importado.

##### `ImportacaoNotaFiscalItem`

Representa os itens individuais lidos da nota fiscal.

Serve para:

- historico;
- rastreabilidade;
- vinculo com variacao;
- vinculo com movimentacao gerada.

##### `ConfiguracaoSistema`

Representa o branding e configuracao visual do sistema.

Campos:

- nome da empresa;
- descricao;
- logo;
- cor primaria;
- cor secundaria;
- cor de acento;
- quem atualizou;
- quando atualizou.

Ponto importante:

- `save()` fixa `pk = 1`, ou seja, trata essa tabela como configuracao unica do sistema.

#### `backend/app/serializers.py`

Converte modelos em JSON e JSON em objetos validados.

Arquivos `serializer` existem porque a API precisa:

- validar entrada;
- controlar campos expostos;
- transformar dados para o frontend.

Serializers principais:

- `UsuarioSerializer`
- `PrimeiroAcessoSerializer`
- `UsuarioLogadoSerializer`
- `FornecedorSerializer`
- `VariacaoSerializer`
- `ProdutoSerializer`
- `MovimentacaoSerializer`
- `EntradaEstoqueSerializer`
- `SaidaEstoqueSerializer`
- serializers da importacao de nota fiscal
- `PedidoVendaItemSerializer`
- `PedidoVendaSerializer`
- `ConfiguracaoSistemaSerializer`

Papel tecnico do arquivo:

- validar formatos;
- montar payloads de resposta;
- disparar funcoes de negocio nos pontos corretos.

#### `backend/app/services.py`

Este e o coracao da regra de negocio.

Se `models.py` define a estrutura, `services.py` define o comportamento.

Por que esse arquivo e importante:

- evita colocar regra complexa nas views;
- evita concentrar tudo dentro dos serializers;
- cria uma camada de servico reutilizavel e mais organizada.

Funcoes-chave encontradas:

- `obter_configuracao_sistema`
- `existe_administrador_configurado`
- `criar_administrador_inicial`
- `parse_xml_nota_fiscal`
- `parse_pdf_nota_fiscal`
- `parse_nota_fiscal`
- `criar_variacao_com_estoque_inicial`
- `registrar_movimentacao`
- `salvar_pedido_venda`
- `gerar_relatorio_reposicao`
- `gerar_relatorio_mensal`
- `aplicar_importacao_nota_fiscal`
- `limpar_importacao_nota_fiscal`

Este arquivo existe porque varias regras do projeto sao complexas:

- deduzir categoria/subcategoria pela descricao da nota;
- identificar cor, tamanho e numeracao;
- bloquear importacao duplicada;
- aplicar baixa e estorno de estoque;
- consolidar relatorios;
- inferir fornecedor e produto durante importacao.

#### `backend/app/views.py`

Recebe as requisicoes HTTP da API.

Aqui esta a camada que conversa diretamente com o mundo externo.

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

Explicacao de nomenclatura:

- `ViewSet` normalmente representa um recurso REST completo com listar, criar, editar e excluir;
- `APIView` normalmente representa uma acao especifica, como `primeiro-acesso` ou `entrada-estoque`.

#### `backend/app/urls.py`

Mapeia as rotas da API da aplicacao.

Ele usa:

- `DefaultRouter` para recursos REST;
- `path()` para rotas especificas.

Rotas registradas por `router`:

- `fornecedores`
- `produtos`
- `variacoes`
- `movimentacoes`
- `pedidos`
- `usuarios`

Rotas especificas:

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

#### `backend/app/permissions.py`

Centraliza regra de acesso.

Classes encontradas:

- `IsAdminEmpresa`
- `IsAdminOrReadOnly`
- `IsAdminOrFuncionario`

Por que isso foi separado:

- melhora legibilidade;
- evita repetir condicao de permissao em todas as views;
- padroniza seguranca do sistema.

#### `backend/app/signals.py`

Usa sinais do Django para automatizar comportamento.

Neste projeto, ele cria e salva `PerfilUsuario` automaticamente quando um `User` e salvo.

Isso evita esquecer a criacao do perfil manualmente.

#### `backend/app/admin.py`

Customiza o Django Admin.

Papel:

- melhorar painel administrativo;
- definir colunas visiveis;
- filtros;
- pesquisas;
- inlines de relacao.

Isso acelera manutencao interna e apoio administrativo.

#### `backend/app/tests.py`

Arquivo de testes automatizados.

Coberturas identificadas:

- registro de movimentacao;
- primeiro acesso;
- criacao automatica de variacao com estoque inicial;
- bloqueio de produto duplicado;
- importacao de NF-e XML e PDF;
- limpeza de importacao;
- configuracao do sistema;
- pedidos com baixa e estorno;
- relatorios.

Ponto importante para explicar ao time:

- esse arquivo nao e decoracao;
- ele prova que varias regras criticas do negocio foram pensadas e validadas.

#### `backend/app/__init__.py`

Arquivo de pacote Python.

Serve para o Python tratar a pasta como modulo importavel.

### 6.5 Pasta `backend/app/migrations/`

Guarda o historico de evolucao do banco.

Arquivos encontrados:

- `0001_initial.py`
- `0002_alter_produto_preco_custo.py`
- `0003_perfilusuario.py`
- `0004_alter_fornecedor_options_alter_movimentacao_options_and_more.py`
- `0005_configuracaosistema.py`
- `0006_configuracaosistema_atualizado_por.py`
- `0007_fornecedor_documento.py`
- `0008_pedidovenda_pedidovendaitem.py`
- `0009_movimentacao_responsavel.py`
- `0010_produto_cest_produto_cfop_produto_codigo_barras_and_more.py`

Como explicar esses nomes:

- o numero inicial mostra a ordem historica;
- o restante do nome tenta resumir a alteracao feita no banco.

Exemplo:

- `0008_pedidovenda_pedidovendaitem.py` indica que nessa migracao surgiram as tabelas de pedido;
- `0009_movimentacao_responsavel.py` indica que foi adicionado responsavel na movimentacao;
- `0010_produto_cest_produto_cfop_produto_codigo_barras_and_more.py` indica ampliacao de campos fiscais/comerciais no produto.

### 6.6 Pasta `backend/media/`

Guarda arquivos enviados pelo sistema.

No estado atual, principalmente:

- logos em `backend/media/branding/logos/`

Essa separacao e correta porque:

- arquivo enviado por usuario nao deve ficar misturado com codigo-fonte;
- em desenvolvimento o Django consegue servir esses arquivos quando `DEBUG=True`.

### 6.7 Pasta `backend/venv/`

Ambiente virtual Python.

Ela existe para isolar dependencias do backend do restante da maquina.

Importante explicar para o time:

- nao e codigo da aplicacao;
- e ambiente de execucao local.

---

## 7. Frontend Em Detalhes

### 7.1 Estrutura Do Frontend

```text
frontend/
|-- public/
|-- src/
|-- node_modules/
|-- dist/
|-- eslint.config.js
|-- index.html
|-- package.json
|-- package-lock.json
|-- README.md
|-- vite.config.js
```

### 7.2 Arquivos Principais Do Frontend

#### `frontend/package.json`

Arquivo central do frontend.

Ele define:

- scripts:
  - `dev`
  - `build`
  - `lint`
  - `preview`
- dependencias:
  - `react`
  - `react-dom`
  - `react-router-dom`
  - `react-toastify`
- dependencias de desenvolvimento:
  - `vite`
  - plugin React do Vite
  - ESLint e plugins

Ponto importante:

- o campo `"type": "module"` faz o projeto usar ES Modules;
- por isso vemos `import` e `export` em vez de `require` e `module.exports`.

#### `frontend/package-lock.json`

Trava as versoes exatas instaladas pelo npm.

#### `frontend/index.html`

Base HTML carregada pelo navegador.

Elementos importantes:

- idioma `pt-BR`;
- favicon inicial;
- `<div id="root"></div>`;
- `<script type="module" src="/src/main.jsx"></script>`

Sem esse arquivo o React nao teria onde montar a aplicacao.

#### `frontend/vite.config.js`

Configuracao do Vite.

No projeto atual ele:

- ativa plugin React;
- define aliases para `react` e `react-dom`;
- faz `dedupe` de React;
- inclui `react-toastify` em `optimizeDeps`.

Isso ajuda a evitar duplicidade de React e melhora o ambiente de build/dev.

#### `frontend/eslint.config.js`

Configuracao de lint.

Pontos importantes:

- valida `js` e `jsx`;
- ignora `dist`;
- usa regras do JavaScript moderno;
- usa plugin de hooks do React;
- usa plugin de React Refresh.

Isso existe para manter qualidade e consistencia do codigo.

#### `frontend/README.md`

README especifico do frontend, mais curto, que aponta para o README principal.

### 7.3 Pasta `frontend/public/`

Arquivos estaticos servidos diretamente.

Arquivos encontrados:

- `favicon.svg`
- `icons.svg`

`favicon.svg` esta em uso.

`icons.svg` nao aparece referenciado no codigo atual, entao parece material de apoio, legado ou preparado para uso futuro.

### 7.4 Pasta `frontend/src/`

Aqui esta o codigo principal da interface.

#### `frontend/src/main.jsx`

Ponto de entrada da aplicacao React.

Ele:

- importa `index.css`;
- importa `App.jsx`;
- usa `createRoot`;
- monta o app em `#root`.

#### `frontend/src/App.jsx`

Arquivo principal de composicao da aplicacao.

Ele:

- envolve o sistema com `SystemConfigProvider`;
- envolve com `AuthProvider`;
- cria o `BrowserRouter`;
- define todas as rotas;
- registra o `ToastContainer`.

Ou seja, `App.jsx` funciona como centro de orquestracao da SPA.

#### `frontend/src/index.css`

Arquivo principal de estilos do sistema.

Pelo tamanho e uso atual, ele concentra:

- layout global;
- componentes visuais;
- login;
- dashboard;
- tabelas;
- formularios;
- responsividade;
- tema.

Esse arquivo e o CSS central da aplicacao.

#### `frontend/src/App.css`

Arquivo CSS presente no repositorio, mas nao referenciado no codigo atual.

Leitura tecnica:

- provavelmente legado de etapa inicial do projeto;
- nao parece ser parte ativa da interface hoje.

### 7.5 Pasta `frontend/src/components/`

Guarda componentes reutilizaveis da interface.

Arquivos encontrados:

- `AccessNotice.jsx`
- `EmptyState.jsx`
- `Layout.jsx`
- `PageHeader.jsx`
- `PaginationControls.jsx`
- `Sidebar.jsx`
- `SummaryCard.jsx`
- `Topbar.jsx`

#### `Layout.jsx`

Componente de casca principal das paginas internas.

Responsavel por:

- usar `Sidebar`;
- usar `Topbar`;
- lidar com comportamento mobile;
- embrulhar o conteudo das paginas.

#### `Sidebar.jsx`

Componente de navegacao principal.

Responsavel por:

- menu principal;
- menu secundario;
- exibicao da marca;
- exibicao do usuario logado;
- controle de logout;
- diferenciar itens visiveis para admin.

Ele concentra muito da experiencia de navegacao.

#### `Topbar.jsx`

Mostra o titulo da pagina no topo.

#### `PageHeader.jsx`

Cabecalho reutilizavel de paginas.

Usado para titulo e area de acao.

#### `SummaryCard.jsx`

Card pequeno de indicador.

Muito usado em dashboard e relatorios.

#### `PaginationControls.jsx`

Paginacao padrao de listagens.

#### `EmptyState.jsx`

Mensagem padrao para tabelas/listas vazias.

#### `AccessNotice.jsx`

Aviso reutilizavel para acesso restrito.

### 7.6 Pasta `frontend/src/context/`

Guarda os contextos globais do React.

Arquivos encontrados:

- `AuthContext.jsx`
- `auth-context.js`
- `SystemConfigContext.jsx`
- `system-config-context.js`

Explicacao do padrao:

- arquivos `*-context.js` guardam o objeto criado por `createContext`;
- arquivos `*Context.jsx` guardam o provider com estado, efeitos e funcoes.

Isso separa:

- definicao do contexto;
- implementacao do provider.

#### `AuthContext.jsx`

Controla:

- usuario logado;
- loading da sessao;
- login;
- logout;
- hidratacao da sessao a partir de `localStorage`.

#### `SystemConfigContext.jsx`

Controla:

- configuracao visual do sistema;
- carregamento inicial de branding;
- atualizacao de configuracao;
- aplicacao de variaveis de tema no documento;
- sincronizacao do titulo da pagina e favicon.

### 7.7 Pasta `frontend/src/hooks/`

Guarda hooks customizados.

Arquivos encontrados:

- `useAuth.js`
- `useIsMobile.js`
- `useSystemConfig.js`

Explicacao do prefixo `use`:

- em React, hooks personalizados comecam com `use`;
- isso sinaliza que encapsulam estado, contexto ou efeito.

#### `useAuth.js`

Atalho para consumir `AuthContext`.

#### `useSystemConfig.js`

Atalho para consumir `SystemConfigContext`.

Tambem garante erro claro se for usado fora do provider correto.

#### `useIsMobile.js`

Hook de responsividade.

Ele observa `matchMedia("(max-width: 900px)")`.

Ou seja, a logica de mobile nao fica espalhada em varias telas.

### 7.8 Pasta `frontend/src/routes/`

Guarda logica de rota protegida.

Arquivo encontrado:

- `PrivateRoute.jsx`

#### `PrivateRoute.jsx`

Bloqueia acesso quando nao ha sessao valida.

Papel:

- mostrar carregamento enquanto a sessao esta sendo resolvida;
- redirecionar para `/login` se nao autenticado;
- liberar acesso se autenticado.

### 7.9 Pasta `frontend/src/services/`

Guarda servicos de comunicacao com API.

Arquivo encontrado:

- `api.js`

#### `api.js`

Arquivo muito importante do frontend.

Ele centraliza:

- URL base da API;
- armazenamento de tokens;
- `loginRequest`;
- refresh de token;
- `authFetch`;
- `authJsonRequest`;
- `jsonRequest`;
- tratamento padrao de erro.

Por que isso foi separado:

- evita repetir `fetch` e headers em todas as paginas;
- padroniza autenticacao JWT;
- facilita manutencao.

### 7.10 Pasta `frontend/src/constants/`

Guarda listas fixas e regras simples de dominio.

Arquivo encontrado:

- `productOptions.js`

#### `productOptions.js`

Centraliza:

- categorias;
- subcategorias;
- tamanhos;
- numeracoes;
- funcoes de traducao de label;
- regras como `usesSize()` e `usesNumber()`.

Isso evita duplicar listas em formularios diferentes.

### 7.11 Pasta `frontend/src/utils/`

Guarda utilitarios reutilizaveis.

Arquivos encontrados:

- `branding.js`
- `formatters.js`
- `reportExports.js`

#### `branding.js`

Utilitario especializado em identidade visual.

Ele faz:

- normalizacao de configuracao;
- montagem de tokens CSS;
- calculo de contraste;
- criacao de favicon fallback;
- extracao de paleta a partir da logo;
- aplicacao de variaveis CSS no documento.

Este arquivo existe porque o sistema tem tema dinamico por empresa.

#### `formatters.js`

Centraliza formatacao visual:

- moeda;
- data;
- data/hora;
- labels de texto.

#### `reportExports.js`

Um dos utilitarios mais sofisticados do frontend.

Responsavel por:

- montar modelo de exportacao do relatorio;
- imprimir em formato de planilha;
- exportar Excel;
- exportar PDF;
- exportar SVG;
- gerar snapshot em texto.

Motivo da separacao:

- exportacao e uma responsabilidade isolada e extensa;
- nao faz sentido deixar essa logica inteira dentro de `RelatoriosPage.jsx`.

### 7.12 Pasta `frontend/src/assets/`

Arquivos encontrados:

- `hero.png`
- `react.svg`
- `vite.svg`

No estado atual:

- esses arquivos nao aparecem importados nas telas principais;
- parecem sobras de scaffold inicial ou material visual nao usado no momento.

### 7.13 Pasta `frontend/src/pages/`

Guarda paginas completas, normalmente associadas a uma rota.

O sufixo `Page` ou o nome de tela indica que o arquivo representa uma tela inteira.

Arquivos encontrados:

- `ConfiguracoesSistemaPage.jsx`
- `DashboardHome.jsx`
- `EditarFornecedor.jsx`
- `EditarProduto.jsx`
- `EditarUsuario.jsx`
- `EstoqueBaixoPage.jsx`
- `FornecedoresPage.jsx`
- `ImportarNotaFiscalPage.jsx`
- `Login.jsx`
- `MovimentacoesPage.jsx`
- `NovaMovimentacao.jsx`
- `NovoFornecedor.jsx`
- `NovoProduto.jsx`
- `NovoUsuario.jsx`
- `PedidoFormPage.jsx`
- `PedidosPage.jsx`
- `PrimeiroAcessoPage.jsx`
- `ProdutosPage.jsx`
- `RelatoriosPage.jsx`
- `UsuariosPage.jsx`

#### `DashboardHome.jsx`

Tela inicial do sistema.

Mostra:

- resumo de produtos;
- alertas de estoque;
- movimentacoes;
- fornecedores;
- grafico da semana;
- prioridades;
- ultimas movimentacoes;
- reposicao.

#### `ProdutosPage.jsx`

Tela de listagem de produtos.

Tem:

- busca;
- filtros;
- paginacao;
- status de estoque;
- acoes de editar/excluir para admin.

#### `NovoProduto.jsx` e `EditarProduto.jsx`

Telas de formulario de produto.

Relacionam produto com:

- categoria;
- subcategoria;
- fornecedor;
- precos;
- variacoes.

#### `EstoqueBaixoPage.jsx`

Tela voltada a itens em alerta de estoque.

#### `MovimentacoesPage.jsx`

Tela de historico de entradas e saidas.

#### `NovaMovimentacao.jsx`

Tela para registrar entrada ou saida manual.

#### `FornecedoresPage.jsx`

Listagem e gestao de fornecedores.

#### `NovoFornecedor.jsx` e `EditarFornecedor.jsx`

Formularios de fornecedor.

#### `UsuariosPage.jsx`

Listagem de usuarios do sistema.

#### `NovoUsuario.jsx` e `EditarUsuario.jsx`

Formularios de usuario.

#### `Login.jsx`

Tela de autenticacao.

Tambem consulta `primeiro-acesso` para saber se precisa liberar cadastro do admin inicial.

#### `PrimeiroAcessoPage.jsx`

Tela de bootstrap do sistema.

Serve para criar o primeiro administrador.

#### `ConfiguracoesSistemaPage.jsx`

Tela de branding e configuracao visual.

Funcoes principais:

- alterar nome da empresa;
- alterar descricao;
- subir logo;
- remover logo;
- extrair paleta automaticamente da imagem;
- editar cores manualmente;
- visualizar preview antes de salvar.

#### `PedidosPage.jsx`

Tela de listagem de pedidos.

#### `PedidoFormPage.jsx`

Tela de criacao e edicao de pedidos.

Ponto de negocio importante:

- se salvar como `finalizado`, o estoque baixa automaticamente;
- se cancelar pedido finalizado, o estoque estorna.

#### `RelatoriosPage.jsx`

Tela de relatorios.

Consome:

- relatorio mensal;
- relatorio de reposicao.

Tambem permite:

- imprimir planilha;
- exportar Excel;
- exportar PDF.

#### `ImportarNotaFiscalPage.jsx`

Uma das telas mais ricas do sistema.

Ela faz:

- upload de XML ou PDF;
- preview da nota;
- sugestao de fornecedor;
- sugestao de variacao existente;
- criacao de nova variacao;
- criacao de novo produto;
- validacao antes de aplicar;
- limpeza de importacao anterior por admin.

Esse arquivo e grande porque concentra um fluxo operacional complexo.

---

## 8. Mapeamento Das Rotas Do Frontend

Rotas identificadas em `frontend/src/App.jsx`:

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

Padrao importante:

- rotas de criacao costumam usar prefixo `novo-`;
- rotas de edicao usam `editar-.../:id`;
- rotas protegidas passam por `PrivateRoute`.

---

## 9. Mapeamento Da API

Rotas principais do backend identificadas em `backend/app/urls.py` e `backend/config/urls.py`:

### Autenticacao

- `POST /api/token/`
- `POST /api/token/refresh/`
- `GET /api/usuario-logado/`

### Bootstrap

- `GET /api/primeiro-acesso/`
- `POST /api/primeiro-acesso/`

### Configuracao visual

- `GET /api/configuracao-sistema/`
- `PATCH /api/configuracao-sistema/`

### Estoque

- `POST /api/entrada-estoque/`
- `POST /api/saida-estoque/`
- `GET /api/movimentacoes/`

### NF-e

- `POST /api/importacao-nota-fiscal/preview/`
- `POST /api/importacao-nota-fiscal/aplicar/`
- `DELETE /api/importacao-nota-fiscal/<id>/limpar/`

### Relatorios

- `GET /api/relatorios/mensal/`
- `GET /api/relatorios/reposicao/`

### CRUDs REST

- `/api/fornecedores/`
- `/api/produtos/`
- `/api/variacoes/`
- `/api/pedidos/`
- `/api/usuarios/`

### Rota custom de produto

- `GET /api/produtos/estoque-baixo/`

---

## 10. Convencoes De Nome Importantes

### 10.1 Sufixo `Page`

Exemplo:

- `ProdutosPage.jsx`
- `RelatoriosPage.jsx`

Significa:

- tela completa;
- geralmente ligada a rota.

### 10.2 Prefixo `Novo` e `Editar`

Exemplo:

- `NovoProduto.jsx`
- `EditarProduto.jsx`

Significa:

- formularios especializados em criacao ou edicao.

### 10.3 Sufixo `Serializer`

Exemplo:

- `ProdutoSerializer`
- `PedidoVendaSerializer`

Significa:

- arquivo/classe responsavel pela validacao e transformacao de dados da API.

### 10.4 Sufixo `ViewSet`

Exemplo:

- `ProdutoViewSet`
- `FornecedorViewSet`

Significa:

- recurso REST mais padronizado;
- normalmente contem listagem, criacao, edicao e exclusao.

### 10.5 Sufixo `Admin`

Exemplo:

- `ProdutoAdmin`
- `MovimentacaoAdmin`

Significa:

- customizacao do Django Admin.

### 10.6 Prefixo `use`

Exemplo:

- `useAuth`
- `useIsMobile`

Significa:

- hook customizado de React.

### 10.7 Nome `Context`

Exemplo:

- `AuthContext.jsx`
- `SystemConfigContext.jsx`

Significa:

- estado global compartilhado entre varias partes da interface.

### 10.8 Nome `services`

Exemplo:

- `backend/app/services.py`
- `frontend/src/services/api.js`

Significa:

- camada de servico.

No backend:

- regra de negocio.

No frontend:

- integracao com API.

---

## 11. Modulos De Negocio E Onde Estao No Codigo

### 11.1 Autenticacao E Sessao

Backend:

- `backend/config/urls.py`
- `backend/app/views.py`
- `backend/app/permissions.py`
- `backend/app/serializers.py`
- `backend/app/signals.py`

Frontend:

- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/PrimeiroAcessoPage.jsx`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/hooks/useAuth.js`
- `frontend/src/routes/PrivateRoute.jsx`
- `frontend/src/services/api.js`

### 11.2 Produtos E Variacoes

Backend:

- `backend/app/models.py`
- `backend/app/serializers.py`
- `backend/app/views.py`
- `backend/app/services.py`

Frontend:

- `frontend/src/pages/ProdutosPage.jsx`
- `frontend/src/pages/NovoProduto.jsx`
- `frontend/src/pages/EditarProduto.jsx`
- `frontend/src/constants/productOptions.js`

### 11.3 Movimentacao De Estoque

Backend:

- `backend/app/models.py`
- `backend/app/services.py`
- `backend/app/views.py`

Frontend:

- `frontend/src/pages/MovimentacoesPage.jsx`
- `frontend/src/pages/NovaMovimentacao.jsx`
- `frontend/src/pages/EstoqueBaixoPage.jsx`

### 11.4 Fornecedores

Backend:

- `backend/app/models.py`
- `backend/app/serializers.py`
- `backend/app/views.py`

Frontend:

- `frontend/src/pages/FornecedoresPage.jsx`
- `frontend/src/pages/NovoFornecedor.jsx`
- `frontend/src/pages/EditarFornecedor.jsx`

### 11.5 NF-e

Backend:

- `backend/app/services.py`
- `backend/app/serializers.py`
- `backend/app/views.py`
- `backend/app/models.py`

Frontend:

- `frontend/src/pages/ImportarNotaFiscalPage.jsx`

### 11.6 Pedidos/Vendas

Backend:

- `backend/app/models.py`
- `backend/app/serializers.py`
- `backend/app/services.py`
- `backend/app/views.py`

Frontend:

- `frontend/src/pages/PedidosPage.jsx`
- `frontend/src/pages/PedidoFormPage.jsx`

### 11.7 Relatorios

Backend:

- `backend/app/services.py`
- `backend/app/views.py`

Frontend:

- `frontend/src/pages/RelatoriosPage.jsx`
- `frontend/src/utils/reportExports.js`

### 11.8 Branding E Tema Visual

Backend:

- `backend/app/models.py`
- `backend/app/serializers.py`
- `backend/app/views.py`

Frontend:

- `frontend/src/pages/ConfiguracoesSistemaPage.jsx`
- `frontend/src/context/SystemConfigContext.jsx`
- `frontend/src/utils/branding.js`

---

## 12. Por Que A Estrutura Esta Boa Para Um MVP

A estrutura atual faz sentido para um MVP porque:

- separa frontend e backend claramente;
- usa convencoes conhecidas de Django e React;
- concentra regra complexa em `services.py`;
- concentra API client em `api.js`;
- concentra tema em `branding.js`;
- usa `pages/` para telas completas e `components/` para reutilizacao;
- usa `context/` para estado global de autenticacao e configuracao;
- ja possui testes para regras criticas.

Ou seja, nao e apenas um projeto "que funciona". Ele ja mostra preocupacao com organizacao e crescimento.

---

## 13. Pontos Que Merecem Explicacao Especial Na Apresentacao

Se voce quiser enfatizar para a equipe os pontos mais fortes da estrutura, estes sao os melhores:

1. O backend nao joga toda a regra dentro da view.
   A regra pesada esta em `backend/app/services.py`, o que melhora organizacao.

2. O frontend nao espalha `fetch` por toda parte.
   A comunicacao com API esta centralizada em `frontend/src/services/api.js`.

3. O sistema tem branding dinamico real.
   `frontend/src/utils/branding.js` aplica tema, favicon e paleta a partir da configuracao.

4. O sistema tem fluxo real de primeiro acesso.
   Nao depende de criar tudo manualmente no admin antes de usar.

5. O projeto tem rastreabilidade de estoque.
   `Movimentacao` e o historico formal das entradas e saidas.

6. O projeto tem importacao de NF-e com logica de conciliacao.
   Nao e apenas upload de arquivo; existe preview, sugestao e aplicacao controlada.

7. O projeto ja possui testes para regras de negocio importantes.
   Isso aumenta confianca tecnica.

---

## 14. Observacoes Tecnicas Importantes

### 14.1 Nao ha TypeScript no app principal

Apesar de existirem pacotes como `@types/react` no `frontend/package.json`, o projeto atual:

- nao usa `.ts`;
- nao usa `.tsx`;
- nao possui `tsconfig` no codigo principal;
- esta estruturado em `js` e `jsx`.

Ou seja, o projeto e React com JavaScript moderno.

### 14.2 Nao foi encontrado arquivo padrao de dependencias do backend

No estado atual do repositorio, nao aparece:

- `requirements.txt`
- `pyproject.toml`
- `Pipfile`

Isso nao impede o sistema de funcionar localmente, mas significa que a forma de reproduzir dependencias do backend ainda esta menos formal que o ideal.

### 14.3 Existem arquivos aparentemente legados ou nao utilizados

Exemplos observados:

- `frontend/src/App.css`
- `frontend/src/assets/react.svg`
- `frontend/src/assets/vite.svg`
- `frontend/src/assets/hero.png`
- `frontend/public/icons.svg`
- `package.json` na raiz

Isso nao significa erro obrigatoriamente.

Pode significar:

- sobra de scaffold inicial;
- apoio visual futuro;
- material nao removido ainda.

---

## 15. Resumo Final Para Explicar Ao Time

Se voce quiser resumir o sistema em poucos minutos, uma boa forma seria dizer:

> O projeto foi dividido em frontend React e backend Django REST para separar interface de regras de negocio. No frontend usamos `jsx` porque a aplicacao foi feita em JavaScript com JSX, e nao em TypeScript, por isso nao existem arquivos `tsx`. No backend usamos Django para acelerar estrutura, API, autenticacao e persistencia. A regra de negocio mais pesada fica em `services.py`, os dados ficam em `models.py`, a API fica em `views.py` e `serializers.py`, e a interface se organiza em `pages`, `components`, `hooks`, `context` e `utils`. Essa estrutura facilita manutencao, crescimento e explicacao do sistema para novos membros do time.

---

## 16. Arquivos Mais Importantes Para Estudo Inicial

Se alguem da equipe precisar entender o projeto rapido, a ordem mais eficiente e:

### Backend

1. `backend/config/settings.py`
2. `backend/config/urls.py`
3. `backend/app/models.py`
4. `backend/app/serializers.py`
5. `backend/app/views.py`
6. `backend/app/services.py`
7. `backend/app/tests.py`

### Frontend

1. `frontend/src/main.jsx`
2. `frontend/src/App.jsx`
3. `frontend/src/services/api.js`
4. `frontend/src/context/AuthContext.jsx`
5. `frontend/src/context/SystemConfigContext.jsx`
6. `frontend/src/components/Layout.jsx`
7. `frontend/src/pages/DashboardHome.jsx`
8. `frontend/src/pages/ProdutosPage.jsx`
9. `frontend/src/pages/PedidoFormPage.jsx`
10. `frontend/src/pages/ImportarNotaFiscalPage.jsx`
11. `frontend/src/pages/RelatoriosPage.jsx`
12. `frontend/src/pages/ConfiguracoesSistemaPage.jsx`

---

## 17. Fechamento

O projeto `EstoquePro` nao esta organizado apenas por "tipo de arquivo". Ele esta organizado por responsabilidade.

Essa e a melhor leitura da estrutura:

- `models.py` = estrutura de dados;
- `serializers.py` = contrato da API;
- `views.py` = entrada HTTP;
- `services.py` = regra de negocio;
- `tests.py` = prova de comportamento;
- `pages/` = telas completas;
- `components/` = pecas reutilizaveis;
- `context/` = estado global;
- `hooks/` = logica reaproveitavel;
- `utils/` = funcoes auxiliares;
- `services/api.js` = comunicacao com backend.

Essa organizacao ajuda tanto na manutencao quanto na explicacao para novos membros da equipe.
