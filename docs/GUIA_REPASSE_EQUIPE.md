# Guia De Repasse Tecnico Para A Equipe

## 1. Objetivo Deste Documento

Este material foi feito para te ajudar a apresentar o projeto para a equipe de forma estruturada, clara e tecnica.

A ideia aqui nao e apenas listar pastas. A ideia e explicar:

- como o sistema foi dividido;
- qual e a responsabilidade de cada camada;
- o que cada arquivo principal faz;
- quais arquivos concentram regra de negocio;
- quais fluxos devem ser entendidos primeiro;
- quais partes sao mais criticas para manutencao.

Este documento pode ser usado de 3 formas:

1. como roteiro de apresentacao em reuniao;
2. como documento de onboarding;
3. como mapa rapido para localizar responsabilidades no codigo.

---

## 2. Como Resumir O Projeto Em 1 Minuto

Uma forma boa de abrir a apresentacao para a equipe e esta:

> O `EstoquePro` e uma aplicacao web separada em frontend e backend. O frontend foi feito em `React + Vite + TypeScript` e cuida da interface, navegacao, estado visual e chamadas para a API. O backend foi feito em `Django + Django REST Framework + PostgreSQL` e concentra autenticacao, validacoes, regras de negocio, persistencia, relatorios, pedidos, estoque e importacao de nota fiscal. A regra mais importante do sistema mora principalmente em `backend/app/services/` e `backend/app/models.py`.

---

## 3. Arquitetura Geral

### 3.1 Visao Macro

```text
Usuario
-> Frontend React
-> service de API no frontend
-> endpoint no Django REST
-> serializer
-> service de negocio
-> model
-> banco
```

### 3.2 Regra De Ouro Do Projeto

Quando alguem perguntar "onde isso acontece de verdade?", siga esta ordem:

1. `backend/app/services/`
2. `backend/app/models.py`
3. `backend/app/serializers.py`
4. `backend/app/views.py`
5. `frontend/src/services/api.ts`
6. `frontend/src/context/`
7. `frontend/src/pages/`

### 3.3 Divisao De Responsabilidade

- `frontend`: experiencia do usuario, telas, roteamento, estado local e global, consumo da API.
- `backend`: permissao, validacao, regras de negocio, consistencia dos dados, persistencia.
- `services` do backend: comportamento real do sistema.
- `models`: estrutura do dominio e regras permanentes.
- `serializers`: contrato da API.
- `views`: entrada HTTP e orquestracao fina.

---

## 4. Estrutura Da Raiz Do Projeto

### [README.md](../README.md)

Documento principal do projeto.

Responsabilidade:

- apresentar o sistema;
- explicar stack;
- orientar execucao local;
- servir como porta de entrada para quem chega no repositorio.

### [package.json](../package.json)

Arquivo Node minimo na raiz.

Responsabilidade:

- manter dependencias de raiz muito pontuais;
- hoje esta enxuto e nao representa o frontend principal.

Observacao importante para a equipe:

- o frontend real esta em [frontend/package.json](../frontend/package.json);
- este `package.json` da raiz nao e o centro da aplicacao web.

### [package-lock.json](../package-lock.json)

Lockfile do `package.json` da raiz.

Responsabilidade:

- congelar versoes exatas instaladas para as dependencias de raiz.

### [.gitignore](../.gitignore)

Responsabilidade:

- impedir versionamento de segredos, caches, bancos locais, media, backups e dependencias.

Pontos importantes que ele protege hoje:

- `.env`
- `__pycache__`
- `*.sqlite3`
- `backend/backups/`
- `backend/tmp-test-runs/`
- `backend/media/`
- `node_modules/`

### `.vscode/`

Pasta de suporte ao editor.

Responsabilidade:

- configuracoes locais de desenvolvimento;
- nao faz parte da regra do negocio.

### `node_modules/`

Pasta gerada pelo Node.

Responsabilidade:

- conter dependencias instaladas localmente;
- nao e parte do codigo do sistema.

### [docs/](./)

Pasta de documentacao do projeto.

Arquivos mais importantes hoje:

- [docs/GUIA_ESTUDO_CODIGO.md](./GUIA_ESTUDO_CODIGO.md): guia de estudo resumido por fluxo.
- [docs/GUIA_ESTUDO_CODIGO_DETALHADO.md](./GUIA_ESTUDO_CODIGO_DETALHADO.md): estudo aprofundado do sistema.
- [docs/GUIA_REPASSE_EQUIPE.md](./GUIA_REPASSE_EQUIPE.md): este material de handoff para o time.
- [docs/ESTRUTURA_ATUAL_DO_PROJETO.md](./ESTRUTURA_ATUAL_DO_PROJETO.md): visao de estrutura.
- [docs/GLOSSARIO_TERMOS_PARA_INICIANTES.md](./GLOSSARIO_TERMOS_PARA_INICIANTES.md): apoio para onboarding.
- [docs/MIGRACAO_POSTGRESQL.md](./MIGRACAO_POSTGRESQL.md): orientacoes de banco.
- [docs/ORIENTACOES_GIT_SEGURANCA.md](./ORIENTACOES_GIT_SEGURANCA.md): historico e seguranca do repositorio.
- [docs/PRD.md](./PRD.md): referencia de produto.

---

## 5. Backend: Estrutura E Responsabilidade

O backend fica em [backend/](../backend).

Ele foi construido com `Django`, `Django REST Framework`, `Simple JWT`, `django-filter` e `PostgreSQL`.

Fluxo mental do backend:

```text
request HTTP
-> view
-> serializer
-> service
-> model
-> banco
-> serializer
-> response JSON
```

### 5.1 Arquivos De Raiz Do Backend

#### [backend/manage.py](../backend/manage.py)

Responsabilidade:

- ponto de entrada dos comandos do Django.

Usado para:

- subir servidor;
- rodar migracoes;
- criar superusuario;
- executar testes;
- comandos administrativos.

#### [backend/requirements.txt](../backend/requirements.txt)

Responsabilidade:

- listar dependencias Python do backend.

Dependencias mais importantes:

- `Django`
- `djangorestframework`
- `djangorestframework_simplejwt`
- `django-cors-headers`
- `django-filter`
- `psycopg2-binary`

#### [backend/.env.example](../backend/.env.example)

Responsabilidade:

- servir como modelo seguro das variaveis de ambiente locais.

Importante para a equipe:

- o `.env` real nao deve ser versionado;
- este arquivo existe so como exemplo de configuracao.

### 5.2 Pasta [backend/config/](../backend/config)

Essa pasta contem a configuracao global do projeto Django.

#### [backend/config/__init__.py](../backend/config/__init__.py)

Responsabilidade:

- marcar a pasta como pacote Python.

#### [backend/config/settings.py](../backend/config/settings.py)

E um dos arquivos mais importantes do backend.

Responsabilidade:

- configurar apps instalados;
- configurar middlewares;
- definir auth e JWT;
- configurar banco;
- configurar CORS;
- definir idioma e timezone;
- configurar `MEDIA_ROOT` e `MEDIA_URL`;
- definir permissoes padrao da API.

Quando estudar este arquivo, observe:

- `INSTALLED_APPS`
- `MIDDLEWARE`
- `REST_FRAMEWORK`
- `SIMPLE_JWT`
- configuracao do banco
- `DEBUG`
- `ALLOWED_HOSTS`

#### [backend/config/urls.py](../backend/config/urls.py)

Responsabilidade:

- roteador principal do backend.

Ele liga:

- `/admin/`
- `/api/token/`
- `/api/token/refresh/`
- `/api/`

#### [backend/config/asgi.py](../backend/config/asgi.py)

Responsabilidade:

- entrada ASGI da aplicacao.

E importante para deploys e cenarios modernos.

#### [backend/config/wsgi.py](../backend/config/wsgi.py)

Responsabilidade:

- entrada WSGI da aplicacao.

Mais comum em deploys classicos de Django.

### 5.3 Pasta [backend/app/](../backend/app)

Essa e a aplicacao de negocio principal do sistema.

#### [backend/app/__init__.py](../backend/app/__init__.py)

Responsabilidade:

- marcar a pasta como pacote Python.

#### [backend/app/apps.py](../backend/app/apps.py)

Responsabilidade:

- registrar a aplicacao Django;
- carregar `signals.py` no `ready()`.

Isso e importante porque o projeto depende de sinais para manter `PerfilUsuario` sincronizado com `User`.

#### [backend/app/models.py](../backend/app/models.py)

Arquivo central do dominio.

Responsabilidade:

- definir os modelos do banco;
- definir relacionamentos;
- aplicar validacoes de dominio com `clean()`;
- proteger consistencia dos dados.

Modelos e responsabilidade de cada um:

- `PerfilUsuario`: guarda o tipo do usuario (`admin` ou `funcionario`).
- `Fornecedor`: representa o fornecedor do catalogo.
- `Produto`: representa o item base do catalogo.
- `Variacao`: representa a unidade vendavel/estocavel real do produto.
- `PedidoVenda`: representa o cabecalho do pedido.
- `Movimentacao`: registra entradas e saidas de estoque.
- `PedidoVendaItem`: representa os itens do pedido e seus vinculos com movimentacoes.
- `ImportacaoNotaFiscal`: guarda o cabecalho da importacao de NF-e.
- `ImportacaoNotaFiscalItem`: guarda os itens importados e rastreabilidade.
- `ConfiguracaoSistema`: guarda branding e identidade visual.

Regras conceituais mais importantes daqui:

- estoque mora em `Variacao`, nao em `Produto`;
- historico de estoque mora em `Movimentacao`;
- `Produto` e `Variacao` sao entidades diferentes de proposito;
- `ConfiguracaoSistema` funciona como configuracao unica do sistema.

#### [backend/app/permissions.py](../backend/app/permissions.py)

Responsabilidade:

- centralizar regras de acesso da API.

Classes:

- `IsAdminEmpresa`
- `IsAdminOrReadOnly`
- `IsAdminOrFuncionario`

Quando a equipe quiser saber "quem pode fazer o que?", este e um dos primeiros arquivos para abrir.

#### [backend/app/serializers.py](../backend/app/serializers.py)

Responsabilidade:

- validar entrada de dados;
- transformar models em JSON;
- transformar JSON em dados validados;
- em varios casos, delegar criacao e atualizacao para services.

Serializers principais:

- `UsuarioSerializer`
- `PrimeiroAcessoSerializer`
- `UsuarioLogadoSerializer`
- `FornecedorSerializer`
- `VariacaoSerializer`
- `ProdutoSerializer`
- `MovimentacaoSerializer`
- `MovimentacaoEstoqueSerializer`
- serializers de importacao de nota fiscal
- `ImportacaoNotaFiscalSerializer`
- `PedidoVendaItemSerializer`
- `PedidoVendaSerializer`
- `ConfiguracaoSistemaSerializer`

Resumo da responsabilidade:

- se a pergunta for "esse payload esta bem formado?", olhe o serializer;
- se a pergunta for "o que o sistema faz com isso?", olhe o service.

#### [backend/app/views.py](../backend/app/views.py)

Responsabilidade:

- receber requisicoes HTTP;
- aplicar permissao;
- chamar serializer;
- delegar para services;
- devolver resposta.

Classes e papel de cada uma:

- `UsuarioViewSet`: CRUD de usuarios.
- `UsuarioLogadoView`: devolve dados do usuario autenticado.
- `PrimeiroAcessoView`: controla se o sistema ainda precisa do admin inicial.
- `ConfiguracaoSistemaView`: le e atualiza branding/configuracao do sistema.
- `BaseMovimentacaoEstoqueView`: base para entrada e saida de estoque.
- `EntradaEstoqueView`: endpoint de entrada manual.
- `SaidaEstoqueView`: endpoint de saida manual.
- `NotaFiscalImportacaoPreviewView`: gera preview de XML/PDF antes de aplicar.
- `NotaFiscalImportacaoAplicarView`: aplica a importacao no sistema.
- `NotaFiscalImportacaoLimparView`: estorna/limpa uma importacao.
- `RelatorioMensalView`: entrega relatorio mensal.
- `RelatorioReposicaoView`: entrega sugestoes de reposicao.
- `FornecedorViewSet`: CRUD de fornecedores.
- `ProdutoViewSet`: CRUD de produtos e acoes auxiliares.
- `VariacaoViewSet`: CRUD de variacoes.
- `MovimentacaoViewSet`: consulta historico de movimentacoes.
- `PedidoVendaViewSet`: CRUD de pedidos.

Mensagem importante para a equipe:

- as `views` aqui sao relativamente finas;
- a logica forte foi jogada para `services`.

#### [backend/app/urls.py](../backend/app/urls.py)

Responsabilidade:

- registrar rotas da aplicacao principal.

CRUDs registrados:

- `fornecedores`
- `produtos`
- `variacoes`
- `movimentacoes`
- `pedidos`
- `usuarios`

Rotas especiais:

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

#### [backend/app/signals.py](../backend/app/signals.py)

Responsabilidade:

- reagir a eventos de criacao/atualizacao do `User`.

Funcoes:

- `criar_perfil_usuario`
- `salvar_perfil_usuario`

Na pratica:

- quando um usuario do Django e criado, o projeto garante que exista um `PerfilUsuario`.

#### [backend/app/admin.py](../backend/app/admin.py)

Responsabilidade:

- customizar o Django Admin.

Esse arquivo melhora a operacao administrativa com:

- colunas personalizadas;
- filtros;
- buscas;
- `inlines` para relacoes;
- melhor navegacao no admin.

Classes principais:

- `PerfilUsuarioAdmin`
- `FornecedorAdmin`
- `ProdutoAdmin`
- `VariacaoAdmin`
- `MovimentacaoAdmin`
- `PedidoVendaAdmin`
- `ImportacaoNotaFiscalAdmin`
- `ConfiguracaoSistemaAdmin`

#### [backend/app/tests.py](../backend/app/tests.py)

Responsabilidade:

- proteger regras de negocio criticas;
- servir como documentacao executavel.

Classes de teste:

- `RegistroMovimentacaoTests`
- `PrimeiroAcessoTests`
- `VariacaoAutomaticaTests`
- `ProdutoDuplicadoTests`
- `ImportacaoNotaFiscalTests`
- `ConfiguracaoSistemaTests`
- `PedidoVendaTests`
- `RelatoriosTests`

Mensagem forte para a equipe:

- este arquivo nao e acessorio;
- ele mostra o comportamento esperado do sistema.

### 5.4 Pasta [backend/app/services/](../backend/app/services)

Aqui mora a maior parte da regra de negocio.

#### [backend/app/services/__init__.py](../backend/app/services/__init__.py)

Responsabilidade:

- reexportar funcoes de services;
- facilitar imports centralizados.

Nao concentra regra de negocio em si.

#### [backend/app/services/configuracao.py](../backend/app/services/configuracao.py)

Responsabilidade:

- trabalhar com configuracao global do sistema;
- verificar existencia de administrador;
- criar o administrador inicial;
- obter configuracao visual.

Funcoes principais:

- `obter_configuracao_sistema`
- `existe_administrador_configurado`
- `criar_administrador_inicial`

#### [backend/app/services/estoque.py](../backend/app/services/estoque.py)

Responsabilidade:

- criar variacao com estoque inicial;
- registrar entradas e saidas;
- manter consistencia de saldo e historico.

Funcoes principais:

- `criar_variacao_com_estoque_inicial`
- `registrar_movimentacao`

Ponto crucial para a equipe:

- o estoque nao nasce como "numero solto";
- o estoque inicial pode virar `Movimentacao`;
- esse mesmo service e reaproveitado por outros fluxos como pedidos e NF-e.

#### [backend/app/services/pedidos.py](../backend/app/services/pedidos.py)

Responsabilidade:

- validar itens de pedido;
- criar e atualizar pedidos;
- aplicar baixa de estoque na finalizacao;
- estornar estoque no cancelamento.

Funcoes principais:

- `_validar_itens_pedido`
- `_itens_pedido_sao_iguais`
- `_substituir_itens_pedido`
- `_aplicar_estoque_pedido`
- `_estornar_estoque_pedido`
- `salvar_pedido_venda`

Ponto importante:

- pedido finalizado conversa diretamente com movimentacao de estoque;
- cancelamento de pedido finalizado gera estorno.

#### [backend/app/services/relatorios.py](../backend/app/services/relatorios.py)

Responsabilidade:

- gerar leitura gerencial a partir dos dados operacionais.

Funcoes principais:

- `_resolver_periodo_mensal`
- `_serializar_produto_reposicao`
- `gerar_relatorio_reposicao`
- `gerar_relatorio_mensal`

#### [backend/app/services/common.py](../backend/app/services/common.py)

Responsabilidade:

- concentrar utilitarios e heuristicas da importacao de nota fiscal.

O que tem aqui:

- normalizacao de texto, documento e codigos;
- inferencia de categoria e subcategoria;
- inferencia de cor, tamanho e numeracao;
- busca de fornecedor e produto compativeis;
- montagem de sugestoes para o preview.

Funcoes importantes:

- `_buscar_fornecedor_existente`
- `_buscar_produto_por_codigo_produto`
- `_buscar_produto_por_descricao_produto`
- `_buscar_variacao_por_atributos`
- `_inferir_categoria_subcategoria`
- `_inferir_cor`
- `_inferir_tamanho`
- `_inferir_numeracao`
- `_montar_sugestao_item_nota`
- `formatar_variacao_para_opcao`

#### [backend/app/services/nota_fiscal.py](../backend/app/services/nota_fiscal.py)

Responsabilidade:

- fazer parsing de XML e PDF;
- construir preview de importacao;
- validar mapeamentos;
- aplicar importacao;
- limpar importacao.

Funcoes mais importantes:

- `parse_xml_nota_fiscal`
- `parse_pdf_nota_fiscal`
- `parse_nota_fiscal`
- `_construir_preview_nota`
- `_validar_mapeamentos_itens`
- `_resolver_fornecedor_importacao`
- `_resolver_variacao_importacao`
- `aplicar_importacao_nota_fiscal`
- `limpar_importacao_nota_fiscal`

Mensagem importante:

- esse e um dos modulos mais complexos do sistema;
- ele deve ser estudado por ultimo no onboarding.

### 5.5 Pasta [backend/app/migrations/](../backend/app/migrations)

Responsabilidade:

- guardar o historico de evolucao do banco.

Como explicar isso para a equipe:

- migrations nao sao o melhor lugar para entender regra de negocio;
- elas contam a historia do schema.

Leitura rapida dos arquivos:

- `0001_initial.py`: schema inicial.
- `0002_alter_produto_preco_custo.py`: ajuste em preco de custo.
- `0003_perfilusuario.py`: introducao do `PerfilUsuario`.
- `0004_...`: ajustes de opcoes e campos.
- `0005_configuracaosistema.py`: introducao de branding/configuracao.
- `0006_configuracaosistema_atualizado_por.py`: vinculo com usuario que atualizou.
- `0007_fornecedor_documento.py`: documento do fornecedor.
- `0008_pedidovenda_pedidovendaitem.py`: pedidos de venda.
- `0009_movimentacao_responsavel.py`: responsavel pela movimentacao.
- `0010_produto_...`: campos fiscais e comerciais do produto.
- `0011_`, `0012_`, `0013_`: ajustes temporarios e limpeza de campos de backup na configuracao.

### 5.6 Pastas Auxiliares Do Backend

#### `backend/app/management/`

Responsabilidade:

- estrutura para comandos customizados do Django.

Estado atual:

- existe como base de pacote;
- nao concentra comandos relevantes ainda.

#### `backend/backups/`

Responsabilidade:

- armazenar backups locais.

Importante:

- nao e parte da regra do sistema;
- nao deve ser foco de estudo funcional.

#### `backend/media/`

Responsabilidade:

- armazenar uploads, principalmente branding e logos.

Importante:

- e dado de runtime;
- nao e o lugar da regra de negocio.

#### `backend/tmp-test-runs/`

Responsabilidade:

- artefatos temporarios de execucao de testes.

Importante:

- nao e parte do codigo principal.

---

## 6. Frontend: Estrutura E Responsabilidade

O frontend fica em [frontend/](../frontend).

Ele foi construido com `React`, `React Router`, `Vite` e `TypeScript`.

Fluxo mental do frontend:

```text
rota
-> pagina
-> contexto / hooks / services
-> chamada para API
-> resposta
-> renderizacao
```

### 6.1 Arquivos De Raiz Do Frontend

#### [frontend/package.json](../frontend/package.json)

Responsabilidade:

- declarar dependencias reais do frontend;
- definir scripts de `dev`, `build`, `type-check`, `lint` e `preview`.

Dependencias centrais:

- `react`
- `react-dom`
- `react-router-dom`
- `react-toastify`

Dev dependencies centrais:

- `vite`
- `typescript`
- `eslint`
- `@vitejs/plugin-react`

#### [frontend/package-lock.json](../frontend/package-lock.json)

Responsabilidade:

- congelar versoes instaladas do frontend.

#### [frontend/index.html](../frontend/index.html)

Responsabilidade:

- HTML base da SPA;
- define `#root`;
- define o favicon inicial;
- carrega o entrypoint do app.

Ponto de atencao:

- hoje ele referencia `/src/main.jsx`, enquanto o entrypoint real versionado e [frontend/src/main.tsx](../frontend/src/main.tsx);
- vale alinhar isso para evitar confusao futuras.

#### [frontend/vite.config.ts](../frontend/vite.config.ts)

Responsabilidade:

- configurar o Vite;
- aplicar plugin React;
- forcar resolucao consistente de `react` e `react-dom`;
- evitar duplicacao dessas dependencias.

#### [frontend/eslint.config.js](../frontend/eslint.config.js)

Responsabilidade:

- padronizar qualidade de codigo no frontend;
- aplicar regras para TypeScript, React Hooks e React Refresh.

#### [frontend/tsconfig.json](../frontend/tsconfig.json)

Responsabilidade:

- arquivo raiz de referencias do TypeScript.

Ele aponta para:

- [frontend/tsconfig.app.json](../frontend/tsconfig.app.json)
- [frontend/tsconfig.node.json](../frontend/tsconfig.node.json)

#### [frontend/tsconfig.app.json](../frontend/tsconfig.app.json)

Responsabilidade:

- configurar compilacao tipada da aplicacao React.

#### [frontend/tsconfig.node.json](../frontend/tsconfig.node.json)

Responsabilidade:

- configurar o TypeScript para arquivos Node, como o `vite.config.ts`.

#### [frontend/README.md](../frontend/README.md)

Responsabilidade:

- documentacao auxiliar especifica do frontend.

#### [frontend/public/favicon.svg](../frontend/public/favicon.svg)

Responsabilidade:

- favicon inicial do app.

#### [frontend/public/icons.svg](../frontend/public/icons.svg)

Responsabilidade:

- asset SVG auxiliar.

### 6.2 Pasta [frontend/src/](../frontend/src)

#### [frontend/src/main.tsx](../frontend/src/main.tsx)

Responsabilidade:

- montar a aplicacao React no DOM;
- importar o CSS global;
- renderizar `App`.

#### [frontend/src/App.tsx](../frontend/src/App.tsx)

E o centro de orquestracao do frontend.

Responsabilidade:

- envolver a app com `SystemConfigProvider`;
- envolver a app com `AuthProvider`;
- configurar `BrowserRouter`;
- registrar todas as rotas;
- aplicar `PrivateRoute` nas paginas protegidas;
- registrar o `ToastContainer`.

Rotas importantes definidas aqui:

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

#### [frontend/src/index.css](../frontend/src/index.css)

Responsabilidade:

- CSS global da aplicacao.

Na pratica, ele concentra:

- layout global;
- formularios;
- tabelas;
- dashboard;
- tema visual;
- responsividade.

#### [frontend/src/App.css](../frontend/src/App.css)

Responsabilidade:

- arquivo de estilos legado ou auxiliar.

Ponto de atencao:

- ele nao aparece referenciado no fluxo principal atual;
- a equipe deve tratar como arquivo possivelmente residual ate segunda avaliacao.

#### [frontend/src/vite-env.d.ts](../frontend/src/vite-env.d.ts)

Responsabilidade:

- suporte de tipos do Vite para o projeto.

### 6.3 Pasta [frontend/src/context/](../frontend/src/context)

Responsabilidade:

- guardar estado global compartilhado da aplicacao.

#### [frontend/src/context/auth-context.ts](../frontend/src/context/auth-context.ts)

Responsabilidade:

- definir o objeto `AuthContext`.

#### [frontend/src/context/AuthContext.tsx](../frontend/src/context/AuthContext.tsx)

Responsabilidade:

- controlar sessao do usuario;
- expor `login`, `logout`, usuario atual e estado de carregamento;
- hidratar sessao a partir de tokens;
- buscar usuario logado apos autenticacao.

Esse arquivo e essencial para entender login e controle de acesso.

#### [frontend/src/context/system-config-context.ts](../frontend/src/context/system-config-context.ts)

Responsabilidade:

- definir o objeto `SystemConfigContext`.

#### [frontend/src/context/SystemConfigContext.tsx](../frontend/src/context/SystemConfigContext.tsx)

Responsabilidade:

- carregar configuracao visual da empresa;
- atualizar essa configuracao no estado global;
- aplicar branding no documento com ajuda de `branding.ts`.

Esse arquivo liga a API de configuracao do backend com o tema visual real do navegador.

### 6.4 Pasta [frontend/src/hooks/](../frontend/src/hooks)

Responsabilidade:

- encapsular logicas reutilizaveis.

#### [frontend/src/hooks/useAuth.ts](../frontend/src/hooks/useAuth.ts)

Responsabilidade:

- simplificar o consumo de `AuthContext`.

#### [frontend/src/hooks/useSystemConfig.ts](../frontend/src/hooks/useSystemConfig.ts)

Responsabilidade:

- simplificar o consumo de `SystemConfigContext`.

#### [frontend/src/hooks/useIsMobile.ts](../frontend/src/hooks/useIsMobile.ts)

Responsabilidade:

- detectar comportamento mobile com base em `matchMedia`.

Ele ajuda componentes como o layout e a navegacao responsiva.

### 6.5 Pasta [frontend/src/services/](../frontend/src/services)

#### [frontend/src/services/api.ts](../frontend/src/services/api.ts)

Um dos arquivos mais importantes do frontend.

Responsabilidade:

- centralizar a URL da API;
- guardar tokens;
- fazer login;
- renovar token;
- padronizar `fetch` autenticado;
- transformar respostas em JSON;
- tratar erros de rede e de auth.

Se a equipe perguntar "onde o frontend conversa com o backend?", este e o primeiro arquivo a abrir.

### 6.6 Pasta [frontend/src/constants/](../frontend/src/constants)

#### [frontend/src/constants/productOptions.ts](../frontend/src/constants/productOptions.ts)

Responsabilidade:

- centralizar listas e regras simples do catalogo.

O que guarda:

- categorias;
- subcategorias;
- tamanhos;
- numeracoes;
- funcoes como `usesSize()` e `usesNumber()`.

Esse arquivo evita espalhar listas de dominio por varios formularios.

### 6.7 Pasta [frontend/src/utils/](../frontend/src/utils)

#### [frontend/src/utils/branding.ts](../frontend/src/utils/branding.ts)

Responsabilidade:

- normalizar configuracao visual;
- gerar tokens de tema;
- calcular contraste;
- aplicar variaveis CSS;
- sincronizar `document.title` e favicon;
- gerar fallback visual para branding.

Esse e o coracao do tema dinamico do sistema.

#### [frontend/src/utils/formatters.ts](../frontend/src/utils/formatters.ts)

Responsabilidade:

- padronizar formatacao de moeda, data e texto.

#### [frontend/src/utils/reportExports.ts](../frontend/src/utils/reportExports.ts)

Responsabilidade:

- montar estrutura de exportacao de relatorios;
- imprimir planilha;
- exportar PDF;
- exportar SVG;
- exportar Excel;
- gerar snapshot textual.

Esse e um utilitario grande porque a funcionalidade de exportacao e sofisticada.

### 6.8 Pasta [frontend/src/components/](../frontend/src/components)

Responsabilidade:

- guardar pecas reutilizaveis da interface.

Arquivos e responsabilidade:

- [AccessNotice.tsx](../frontend/src/components/AccessNotice.tsx): aviso de acesso restrito.
- [EmptyState.tsx](../frontend/src/components/EmptyState.tsx): estado vazio padrao.
- [Layout.tsx](../frontend/src/components/Layout.tsx): casca principal das paginas internas.
- [PageHeader.tsx](../frontend/src/components/PageHeader.tsx): cabecalho reutilizavel de pagina.
- [PaginationControls.tsx](../frontend/src/components/PaginationControls.tsx): controle de paginacao.
- [Sidebar.tsx](../frontend/src/components/Sidebar.tsx): menu lateral, navegacao e contexto do usuario.
- [SummaryCard.tsx](../frontend/src/components/SummaryCard.tsx): card de resumo e indicadores.
- [Topbar.tsx](../frontend/src/components/Topbar.tsx): barra superior com titulo.

Mensagem importante:

- `Layout`, `Sidebar` e `Topbar` formam a moldura principal das paginas protegidas.

### 6.9 Pasta [frontend/src/pages/](../frontend/src/pages)

Esses arquivos representam as telas do sistema.

#### [frontend/src/pages/Login.tsx](../frontend/src/pages/Login.tsx)

Responsabilidade:

- tela de login;
- consultar se ainda existe primeiro acesso pendente;
- disparar autenticacao pelo `AuthContext`.

#### [frontend/src/pages/PrimeiroAcessoPage.tsx](../frontend/src/pages/PrimeiroAcessoPage.tsx)

Responsabilidade:

- tela de bootstrap do sistema;
- criar o primeiro administrador.

#### [frontend/src/pages/DashboardHome.tsx](../frontend/src/pages/DashboardHome.tsx)

Responsabilidade:

- tela inicial apos login;
- consolidar indicadores, resumos e leituras operacionais.

#### [frontend/src/pages/ProdutosPage.tsx](../frontend/src/pages/ProdutosPage.tsx)

Responsabilidade:

- listar produtos;
- permitir busca, filtro e paginacao;
- dar acesso a acoes de catalogo.

#### [frontend/src/pages/NovoProduto.tsx](../frontend/src/pages/NovoProduto.tsx)

Responsabilidade:

- cadastrar produto base;
- cadastrar a primeira variacao;
- opcionalmente iniciar estoque.

#### [frontend/src/pages/EditarProduto.tsx](../frontend/src/pages/EditarProduto.tsx)

Responsabilidade:

- carregar produto existente;
- editar seus dados;
- sincronizar alteracoes com a API.

#### [frontend/src/pages/EstoqueBaixoPage.tsx](../frontend/src/pages/EstoqueBaixoPage.tsx)

Responsabilidade:

- destacar itens abaixo do minimo ou proximos disso;
- apoiar reposicao.

#### [frontend/src/pages/MovimentacoesPage.tsx](../frontend/src/pages/MovimentacoesPage.tsx)

Responsabilidade:

- listar historico de entradas e saidas;
- servir como trilha de auditoria de estoque.

#### [frontend/src/pages/NovaMovimentacao.tsx](../frontend/src/pages/NovaMovimentacao.tsx)

Responsabilidade:

- registrar entrada manual;
- registrar saida manual.

#### [frontend/src/pages/PedidosPage.tsx](../frontend/src/pages/PedidosPage.tsx)

Responsabilidade:

- listar pedidos de venda;
- mostrar status e facilitar navegacao para criacao/edicao.

#### [frontend/src/pages/PedidoFormPage.tsx](../frontend/src/pages/PedidoFormPage.tsx)

Responsabilidade:

- criar e editar pedidos;
- controlar itens do pedido;
- salvar como rascunho, finalizar ou cancelar;
- iniciar o fluxo que impacta o estoque.

#### [frontend/src/pages/FornecedoresPage.tsx](../frontend/src/pages/FornecedoresPage.tsx)

Responsabilidade:

- listar fornecedores;
- permitir filtros, paginacao e navegacao administrativa.

#### [frontend/src/pages/NovoFornecedor.tsx](../frontend/src/pages/NovoFornecedor.tsx)

Responsabilidade:

- cadastrar fornecedor.

#### [frontend/src/pages/EditarFornecedor.tsx](../frontend/src/pages/EditarFornecedor.tsx)

Responsabilidade:

- editar fornecedor existente.

#### [frontend/src/pages/UsuariosPage.tsx](../frontend/src/pages/UsuariosPage.tsx)

Responsabilidade:

- listar usuarios do sistema;
- mostrar tipo de acesso;
- permitir manutencao administrativa.

#### [frontend/src/pages/NovoUsuario.tsx](../frontend/src/pages/NovoUsuario.tsx)

Responsabilidade:

- cadastrar novo usuario.

#### [frontend/src/pages/EditarUsuario.tsx](../frontend/src/pages/EditarUsuario.tsx)

Responsabilidade:

- editar usuario existente.

#### [frontend/src/pages/RelatoriosPage.tsx](../frontend/src/pages/RelatoriosPage.tsx)

Responsabilidade:

- consumir relatorios gerados pelo backend;
- renderizar leitura mensal e de reposicao;
- permitir exportacao.

#### [frontend/src/pages/ConfiguracoesSistemaPage.tsx](../frontend/src/pages/ConfiguracoesSistemaPage.tsx)

Responsabilidade:

- editar identidade visual da empresa;
- alterar nome, descricao, cores e logo;
- refletir isso na experiencia visual da aplicacao.

#### [frontend/src/pages/ImportarNotaFiscalPage.tsx](../frontend/src/pages/ImportarNotaFiscalPage.tsx)

Responsabilidade:

- fazer upload de XML ou PDF;
- obter preview;
- resolver fornecedor;
- resolver cada item da nota;
- aplicar importacao;
- permitir limpeza do que foi importado.

Mensagem importante:

- essa e uma das telas mais complexas do frontend;
- ela conversa com uma das partes mais complexas do backend.

### 6.10 Pasta [frontend/src/assets/](../frontend/src/assets)

Responsabilidade:

- guardar assets locais do frontend.

Arquivos atuais:

- `hero.png`
- `react.svg`
- `vite.svg`

Leitura pratica:

- alguns desses arquivos podem ser residuais do scaffold inicial;
- nao sao o centro da regra do sistema.

---

## 7. Fluxos Principais Que A Equipe Precisa Entender

### 7.1 Primeiro Acesso

```text
Login / PrimeiroAcessoPage
-> GET /api/primeiro-acesso/
-> backend verifica se ja existe admin
-> se nao existir, libera criacao do admin inicial
-> POST /api/primeiro-acesso/
```

Arquivos mais importantes:

- [frontend/src/pages/Login.tsx](../frontend/src/pages/Login.tsx)
- [frontend/src/pages/PrimeiroAcessoPage.tsx](../frontend/src/pages/PrimeiroAcessoPage.tsx)
- [backend/app/views.py](../backend/app/views.py)
- [backend/app/services/configuracao.py](../backend/app/services/configuracao.py)

### 7.2 Login E Sessao

```text
Login.tsx
-> AuthContext.login()
-> api.ts /api/token/
-> api.ts /api/usuario-logado/
-> sessao fica disponivel no frontend
-> PrivateRoute libera paginas
```

Arquivos mais importantes:

- [frontend/src/context/AuthContext.tsx](../frontend/src/context/AuthContext.tsx)
- [frontend/src/services/api.ts](../frontend/src/services/api.ts)
- [frontend/src/routes/PrivateRoute.tsx](../frontend/src/routes/PrivateRoute.tsx)
- [backend/app/views.py](../backend/app/views.py)

### 7.3 Cadastro De Produto E Variacao

```text
NovoProduto.tsx
-> POST /api/produtos/
-> ProdutoSerializer
-> Produto.clean()
-> POST /api/variacoes/
-> VariacaoSerializer
-> criar_variacao_com_estoque_inicial()
```

Arquivos mais importantes:

- [frontend/src/pages/NovoProduto.tsx](../frontend/src/pages/NovoProduto.tsx)
- [frontend/src/constants/productOptions.ts](../frontend/src/constants/productOptions.ts)
- [backend/app/models.py](../backend/app/models.py)
- [backend/app/serializers.py](../backend/app/serializers.py)
- [backend/app/services/estoque.py](../backend/app/services/estoque.py)

### 7.4 Movimentacao Manual De Estoque

```text
NovaMovimentacao.tsx
-> /api/entrada-estoque/ ou /api/saida-estoque/
-> serializer de movimentacao
-> registrar_movimentacao()
-> atualiza saldo
-> cria historico
```

Arquivos mais importantes:

- [frontend/src/pages/NovaMovimentacao.tsx](../frontend/src/pages/NovaMovimentacao.tsx)
- [backend/app/views.py](../backend/app/views.py)
- [backend/app/services/estoque.py](../backend/app/services/estoque.py)
- [backend/app/models.py](../backend/app/models.py)

### 7.5 Pedido De Venda

```text
PedidoFormPage.tsx
-> PedidoVendaSerializer
-> salvar_pedido_venda()
-> se finalizado, baixa estoque
-> se cancelado apos finalizado, estorna estoque
```

Arquivos mais importantes:

- [frontend/src/pages/PedidoFormPage.tsx](../frontend/src/pages/PedidoFormPage.tsx)
- [backend/app/serializers.py](../backend/app/serializers.py)
- [backend/app/services/pedidos.py](../backend/app/services/pedidos.py)

### 7.6 Relatorios

```text
RelatoriosPage.tsx
-> /api/relatorios/mensal/
-> /api/relatorios/reposicao/
-> services/relatorios.py agrega dados
-> reportExports.ts exporta
```

Arquivos mais importantes:

- [frontend/src/pages/RelatoriosPage.tsx](../frontend/src/pages/RelatoriosPage.tsx)
- [frontend/src/utils/reportExports.ts](../frontend/src/utils/reportExports.ts)
- [backend/app/services/relatorios.py](../backend/app/services/relatorios.py)

### 7.7 Configuracao Visual

```text
SystemConfigContext
-> busca configuracao no backend
-> branding.ts aplica variaveis CSS
-> layout e paginas refletem o tema da empresa
```

Arquivos mais importantes:

- [frontend/src/context/SystemConfigContext.tsx](../frontend/src/context/SystemConfigContext.tsx)
- [frontend/src/utils/branding.ts](../frontend/src/utils/branding.ts)
- [frontend/src/pages/ConfiguracoesSistemaPage.tsx](../frontend/src/pages/ConfiguracoesSistemaPage.tsx)
- [backend/app/services/configuracao.py](../backend/app/services/configuracao.py)

### 7.8 Importacao De Nota Fiscal

```text
ImportarNotaFiscalPage.tsx
-> preview do arquivo
-> backend interpreta XML/PDF
-> backend sugere fornecedor/produto/variacao
-> usuario confirma mapeamento
-> aplicar_importacao_nota_fiscal()
-> cria ou relaciona dados
-> registra entradas no estoque
```

Arquivos mais importantes:

- [frontend/src/pages/ImportarNotaFiscalPage.tsx](../frontend/src/pages/ImportarNotaFiscalPage.tsx)
- [backend/app/services/common.py](../backend/app/services/common.py)
- [backend/app/services/nota_fiscal.py](../backend/app/services/nota_fiscal.py)

---

## 8. O Que Dizer Quando A Equipe Perguntar "Onde Fica A Regra?"

Use estas respostas:

- autenticacao e sessao: `AuthContext.tsx`, `api.ts`, `UsuarioLogadoView`, JWT no `settings.py`
- permissao: `backend/app/permissions.py`
- dominio e validacao de estrutura: `backend/app/models.py`
- contrato da API: `backend/app/serializers.py`
- comportamento real de estoque: `backend/app/services/estoque.py`
- comportamento real de pedido: `backend/app/services/pedidos.py`
- relatorios: `backend/app/services/relatorios.py`
- importacao de nota: `backend/app/services/common.py` e `backend/app/services/nota_fiscal.py`
- branding: `SystemConfigContext.tsx`, `branding.ts`, `ConfiguracaoSistema`

---

## 9. O Que A Equipe Nao Precisa Estudar Primeiro

- `node_modules/`
- `backend/media/`
- `backend/backups/`
- `backend/tmp-test-runs/`
- `migrations/`
- arquivos de assets residuais

Essas partes podem ser entendidas depois ou apenas quando houver necessidade especifica.

---

## 10. Pontos De Atencao Tecnica

Esses pontos sao bons de mencionar no repasse para mostrar maturidade tecnica:

- o frontend principal vive em `frontend/`; o `package.json` da raiz e auxiliar/minimo.
- `frontend/index.html` ainda aponta para `/src/main.jsx`, enquanto o entrypoint real presente no repo e `src/main.tsx`.
- `frontend/src/App.css` parece nao participar do fluxo principal atual.
- pastas como `media`, `backups` e `tmp-test-runs` sao de suporte/runtime, nao de negocio.

---

## 11. Roteiro De Apresentacao Em Reuniao

### 11.1 Ordem Recomendada

1. explique o objetivo do sistema
2. mostre a divisao `frontend` e `backend`
3. mostre a raiz do projeto
4. entre no backend e explique `config`, `models`, `serializers`, `views`, `services`
5. entre no frontend e explique `App`, `context`, `api`, `pages`, `components`, `utils`
6. feche com os fluxos principais
7. mostre `tests.py` como protecao do comportamento

### 11.2 Fala Sugerida

Voce pode literalmente dizer algo assim:

> Eu construi o projeto separado em frontend e backend para manter interface e regra de negocio bem definidas. No frontend, o ponto de entrada e o `App.tsx`, que monta providers, rotas e paginas. O frontend conversa com a API por `api.ts`, e o estado global mais importante fica em `AuthContext` e `SystemConfigContext`. No backend, `views.py` recebe requisicoes, `serializers.py` valida dados, `models.py` protege o dominio e `services/` concentra a regra mais importante, como estoque, pedidos, relatorios e importacao de nota fiscal. Se voces quiserem entender o sistema rapido, estudem primeiro login, produto/variacao, movimentacao de estoque e pedido. Depois avancem para relatorios, branding e importacao de nota.

---

## 12. Ordem Ideal De Onboarding Para A Equipe

Se voce quiser passar estudo dirigido para o time, use esta ordem:

1. [frontend/src/App.tsx](../frontend/src/App.tsx)
2. [frontend/src/services/api.ts](../frontend/src/services/api.ts)
3. [frontend/src/context/AuthContext.tsx](../frontend/src/context/AuthContext.tsx)
4. [backend/config/settings.py](../backend/config/settings.py)
5. [backend/config/urls.py](../backend/config/urls.py)
6. [backend/app/models.py](../backend/app/models.py)
7. [backend/app/serializers.py](../backend/app/serializers.py)
8. [backend/app/views.py](../backend/app/views.py)
9. [backend/app/services/estoque.py](../backend/app/services/estoque.py)
10. [backend/app/services/pedidos.py](../backend/app/services/pedidos.py)
11. [backend/app/services/relatorios.py](../backend/app/services/relatorios.py)
12. [backend/app/services/nota_fiscal.py](../backend/app/services/nota_fiscal.py)
13. [backend/app/tests.py](../backend/app/tests.py)

---

## 13. Fechamento

Se voce precisar resumir toda a estrutura em uma frase final para a equipe, use esta:

> O projeto foi organizado por responsabilidade: o frontend controla experiencia e navegacao, o backend valida e aplica regra de negocio, e a pasta `services` do backend concentra a logica mais importante do sistema.

Esse e o ponto principal que vai ajudar a equipe a manter, evoluir e debugar o codigo com mais seguranca.
