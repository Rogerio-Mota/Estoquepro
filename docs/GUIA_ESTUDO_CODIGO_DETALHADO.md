# Guia De Estudo Detalhado Do Codigo

## 1. Objetivo Deste Documento

Este guia foi feito para estudar o projeto `EstoquePro` com base na estrutura que existe hoje no repositorio.

Ele complementa o guia curto em [docs/GUIA_ESTUDO_CODIGO.md](./GUIA_ESTUDO_CODIGO.md) e serve como referencia principal para:

- onboarding de novos membros;
- estudo tecnico por fluxo;
- revisao de arquitetura;
- localizacao rapida de regras de negocio;
- preparacao para manutencao e novas features.

Se houver conflito entre este guia, o `README.md` e outros arquivos de documentacao antigos, confie primeiro no codigo.

---

## 2. Como Usar Este Guia

Nao tente ler o repositorio em ordem alfabetica.

A forma mais eficiente de aprender este sistema e:

1. entender a arquitetura geral;
2. estudar os fluxos principais em ordem;
3. validar esse entendimento nos testes;
4. repetir o caminho fazendo mudancas pequenas e observando o impacto.

Use sempre este modelo mental:

```text
Tela React
-> Context / service do frontend
-> requisicao HTTP
-> view Django
-> serializer
-> service do backend
-> model
-> banco
```

Quando um comportamento parecer "magico", quase sempre a resposta esta em um destes lugares:

1. [backend/app/services/](../backend/app/services)
2. [backend/app/models.py](../backend/app/models.py)
3. [backend/app/serializers.py](../backend/app/serializers.py)
4. [frontend/src/services/api.ts](../frontend/src/services/api.ts)
5. [frontend/src/context/](../frontend/src/context)

---

## 3. Mapa Rapido Do Projeto

```text
PROJETO_MVP/
|-- backend/
|   |-- config/
|   `-- app/
|       |-- models.py
|       |-- serializers.py
|       |-- views.py
|       |-- permissions.py
|       |-- tests.py
|       `-- services/
|-- frontend/
|   `-- src/
|       |-- App.tsx
|       |-- services/api.ts
|       |-- context/
|       |-- routes/
|       |-- pages/
|       |-- components/
|       |-- utils/
|       `-- constants/
`-- docs/
```

Responsabilidade de cada area:

- `backend/config/`: configuracao global do Django.
- `backend/app/models.py`: estrutura dos dados e validacoes de dominio.
- `backend/app/serializers.py`: contrato da API, validacao de entrada e saida.
- `backend/app/views.py`: entrada HTTP e orquestracao fina.
- `backend/app/services/`: regra de negocio de verdade.
- `backend/app/tests.py`: documentacao executavel das regras criticas.
- `frontend/src/App.tsx`: casca principal da aplicacao e rotas.
- `frontend/src/services/api.ts`: comunicacao com a API e sessao.
- `frontend/src/context/`: estados globais de autenticacao e branding.
- `frontend/src/pages/`: telas completas.
- `frontend/src/components/`: pecas reutilizaveis.
- `frontend/src/utils/`: funcoes utilitarias mais especializadas.

---

## 4. Mapa Do Dominio

Os modelos mais importantes estao em [backend/app/models.py](../backend/app/models.py).

Entenda este desenho antes de qualquer detalhe:

- `PerfilUsuario`: define se o usuario e `admin` ou `funcionario`.
- `Fornecedor`: origem dos produtos comprados.
- `Produto`: item base do catalogo.
- `Variacao`: unidade vendavel e estocavel de um produto.
- `Movimentacao`: historico oficial de entradas e saidas.
- `PedidoVenda`: cabecalho de uma venda.
- `PedidoVendaItem`: itens do pedido e vinculos com movimentacoes de baixa e estorno.
- `ImportacaoNotaFiscal`: cabecalho de importacao da NF-e.
- `ImportacaoNotaFiscalItem`: rastreia cada item importado e suas movimentacoes.
- `ConfiguracaoSistema`: branding e identidade visual da empresa.

Relacoes mentais mais importantes:

```text
Fornecedor -> Produto -> Variacao -> Movimentacao
PedidoVenda -> PedidoVendaItem -> Variacao
ImportacaoNotaFiscal -> ImportacaoNotaFiscalItem -> Variacao / Movimentacao
User -> PerfilUsuario
ConfiguracaoSistema -> tema visual do frontend
```

Ponto decisivo para estudar bem:

- `Produto` nao representa o estoque diretamente.
- Quem tem `saldo_atual` e a `Variacao`.
- Quem conta a historia do estoque e `Movimentacao`.

---

## 5. Onde Mora Cada Tipo De Regra

### Views

Arquivos:

- [backend/app/views.py](../backend/app/views.py)

Responsabilidade:

- receber a requisicao;
- aplicar permissao;
- escolher serializer;
- chamar service;
- devolver resposta HTTP.

Pergunta que a view responde:

> "qual endpoint faz isso e para onde ele delega?"

### Serializers

Arquivos:

- [backend/app/serializers.py](../backend/app/serializers.py)

Responsabilidade:

- validar payload;
- transformar JSON em dados seguros;
- escolher como expor campos na resposta;
- em alguns casos, delegar `create()` ou `update()` para services.

Pergunta que o serializer responde:

> "esse payload esta bem formado e pode seguir?"

### Services

Arquivos:

- [backend/app/services/estoque.py](../backend/app/services/estoque.py)
- [backend/app/services/pedidos.py](../backend/app/services/pedidos.py)
- [backend/app/services/relatorios.py](../backend/app/services/relatorios.py)
- [backend/app/services/configuracao.py](../backend/app/services/configuracao.py)
- [backend/app/services/common.py](../backend/app/services/common.py)
- [backend/app/services/nota_fiscal.py](../backend/app/services/nota_fiscal.py)

Responsabilidade:

- aplicar regra de negocio;
- coordenar modelos relacionados;
- abrir transacoes quando necessario;
- reaproveitar logica entre varios endpoints.

Pergunta que o service responde:

> "qual e o comportamento real do sistema?"

### Models

Arquivos:

- [backend/app/models.py](../backend/app/models.py)

Responsabilidade:

- definir estrutura do banco;
- centralizar validacoes permanentes de dominio;
- impedir estados invalidos mesmo fora do formulario.

Pergunta que o model responde:

> "esse estado faz sentido para o negocio?"

### Frontend

Arquivos chave:

- [frontend/src/App.tsx](../frontend/src/App.tsx)
- [frontend/src/services/api.ts](../frontend/src/services/api.ts)
- [frontend/src/context/AuthContext.tsx](../frontend/src/context/AuthContext.tsx)
- [frontend/src/context/SystemConfigContext.tsx](../frontend/src/context/SystemConfigContext.tsx)

Responsabilidade:

- renderizar a interface;
- montar payloads;
- controlar estado local e global;
- guiar o usuario pelo fluxo correto;
- mostrar mensagens, filtros, tabelas e formularios.

Pergunta que o frontend responde:

> "como o usuario aciona essa regra e enxerga o resultado?"

---

## 6. Ordem Ideal De Estudo

Siga esta sequencia:

1. inicializacao da aplicacao
2. login, sessao e primeiro acesso
3. produtos e variacoes
4. movimentacao manual de estoque
5. pedidos de venda
6. relatorios
7. configuracao visual
8. importacao de nota fiscal
9. testes automatizados

Nao comece por:

- [frontend/src/pages/ImportarNotaFiscalPage.tsx](../frontend/src/pages/ImportarNotaFiscalPage.tsx)
- [backend/app/services/nota_fiscal.py](../backend/app/services/nota_fiscal.py)
- [backend/app/services/common.py](../backend/app/services/common.py)

Esses arquivos dependem de quase todo o resto.

---

## 7. Etapa 0: Inicializacao Da Aplicacao

Leia nesta ordem:

1. [frontend/src/main.tsx](../frontend/src/main.tsx)
2. [frontend/src/App.tsx](../frontend/src/App.tsx)
3. [frontend/src/routes/PrivateRoute.tsx](../frontend/src/routes/PrivateRoute.tsx)
4. [frontend/src/components/Layout.tsx](../frontend/src/components/Layout.tsx)
5. [backend/config/settings.py](../backend/config/settings.py)
6. [backend/config/urls.py](../backend/config/urls.py)
7. [backend/app/urls.py](../backend/app/urls.py)

O que esta acontecendo aqui:

- `main.tsx` monta a aplicacao React.
- `App.tsx` organiza providers, `BrowserRouter`, paginas e rotas protegidas.
- `PrivateRoute.tsx` decide se o usuario pode ver a rota.
- `Layout.tsx` define a moldura das paginas internas.
- `settings.py` liga apps, auth, JWT, CORS, banco e media.
- `config/urls.py` liga `/admin/`, `/api/token/`, `/api/token/refresh/` e `/api/`.
- `app/urls.py` distribui os recursos reais da API.

Perguntas para fechar a etapa:

- Em que arquivo a aplicacao inteira e montada?
- Qual arquivo separa rota publica de rota privada?
- Onde a API principal comeca a ser roteada?
- Onde o Django define autenticacao padrao da API?

---

## 8. Etapa 1: Login, Sessao E Primeiro Acesso

Leia nesta ordem:

1. [frontend/src/pages/Login.tsx](../frontend/src/pages/Login.tsx)
2. [frontend/src/pages/PrimeiroAcessoPage.tsx](../frontend/src/pages/PrimeiroAcessoPage.tsx)
3. [frontend/src/context/AuthContext.tsx](../frontend/src/context/AuthContext.tsx)
4. [frontend/src/hooks/useAuth.ts](../frontend/src/hooks/useAuth.ts)
5. [frontend/src/services/api.ts](../frontend/src/services/api.ts)
6. [backend/app/views.py](../backend/app/views.py)
7. [backend/app/serializers.py](../backend/app/serializers.py)
8. [backend/app/permissions.py](../backend/app/permissions.py)
9. [backend/app/signals.py](../backend/app/signals.py)

Fluxo mental:

```text
Login.tsx
-> AuthContext.login()
-> api.ts /api/token/
-> api.ts /api/usuario-logado/
-> salva sessao no frontend
-> PrivateRoute libera o sistema
```

Fluxo do primeiro acesso:

```text
Login.tsx / PrimeiroAcessoPage.tsx
-> GET /api/primeiro-acesso/
-> se pendente, libera criacao do admin inicial
-> POST /api/primeiro-acesso/
```

O que observar com calma:

- `Login.tsx` nao fala direto com a API; ele usa o contexto.
- `AuthContext.tsx` concentra `login`, `logout`, `refresh` e hidratacao da sessao.
- `api.ts` centraliza `loginRequest`, `meRequest`, `authFetch`, `authJsonRequest` e refresh de token.
- `UsuarioLogadoView` devolve o usuario real da sessao atual.
- `PrimeiroAcessoView` decide se ainda existe administrador configurado.
- `signals.py` garante que o `PerfilUsuario` seja criado junto com `User`.

Perguntas para responder:

- Onde o access token e salvo?
- Onde o refresh token e salvo?
- Em que momento o frontend descobre se o usuario e admin ou funcionario?
- O que acontece quando a API responde `401`?
- Em que ponto o sistema sabe se o primeiro acesso ainda esta pendente?

---

## 9. Etapa 2: Produtos E Variacoes

Leia nesta ordem:

1. [frontend/src/constants/productOptions.ts](../frontend/src/constants/productOptions.ts)
2. [frontend/src/pages/NovoProduto.tsx](../frontend/src/pages/NovoProduto.tsx)
3. [frontend/src/pages/EditarProduto.tsx](../frontend/src/pages/EditarProduto.tsx)
4. [frontend/src/pages/ProdutosPage.tsx](../frontend/src/pages/ProdutosPage.tsx)
5. [backend/app/models.py](../backend/app/models.py)
6. [backend/app/serializers.py](../backend/app/serializers.py)
7. [backend/app/views.py](../backend/app/views.py)
8. [backend/app/services/estoque.py](../backend/app/services/estoque.py)

Fluxo mental do cadastro:

```text
NovoProduto.tsx
-> POST /api/produtos/
-> ProdutoSerializer
-> Produto.clean()

NovoProduto.tsx
-> POST /api/variacoes/
-> VariacaoSerializer
-> criar_variacao_com_estoque_inicial()
-> registrar_movimentacao() se houver estoque inicial
```

O que este modulo ensina:

- `Produto` e o item base do catalogo.
- `Variacao` e a combinacao real vendida e estocada.
- o frontend ajuda com formularios e opcoes;
- o backend decide o que e valido de verdade.

Pontos importantes para observar:

- `productOptions.ts` define categorias, subcategorias, tamanhos, numeracoes e funcoes como `usesSize()` e `usesNumber()`.
- `NovoProduto.tsx` cria produto e variacao em duas chamadas separadas.
- se a variacao falhar depois do produto, o frontend tenta limpar o produto criado para reduzir lixo.
- `Produto.clean()` valida precos, categoria, subcategoria, SKU e duplicidade logica.
- `Variacao.clean()` impede combinacoes invalidas de cor, tamanho e numeracao.
- `VariacaoSerializer.create()` nao faz tudo sozinho; ele delega para o service.
- `criar_variacao_com_estoque_inicial()` cria a variacao com saldo zero e transforma o estoque inicial em `Movimentacao`.

Perguntas para responder:

- Por que o sistema separa `Produto` de `Variacao`?
- Onde ele impede uma combinacao duplicada de variacao?
- Onde ele bloqueia estoque inicial negativo?
- Por que o estoque inicial vira historico em vez de ser so um numero salvo?

---

## 10. Etapa 3: Movimentacao Manual De Estoque

Leia nesta ordem:

1. [frontend/src/pages/NovaMovimentacao.tsx](../frontend/src/pages/NovaMovimentacao.tsx)
2. [frontend/src/pages/MovimentacoesPage.tsx](../frontend/src/pages/MovimentacoesPage.tsx)
3. [frontend/src/pages/EstoqueBaixoPage.tsx](../frontend/src/pages/EstoqueBaixoPage.tsx)
4. [backend/app/serializers.py](../backend/app/serializers.py)
5. [backend/app/views.py](../backend/app/views.py)
6. [backend/app/services/estoque.py](../backend/app/services/estoque.py)
7. [backend/app/models.py](../backend/app/models.py)

Fluxo mental:

```text
NovaMovimentacao.tsx
-> POST /api/entrada-estoque/ ou /api/saida-estoque/
-> BaseMovimentacaoEstoqueView
-> MovimentacaoEstoqueSerializer
-> registrar_movimentacao()
-> atualiza saldo_atual
-> cria Movimentacao
```

O que observar:

- o frontend escolhe o tipo e monta o payload;
- a view e fina e reaproveitavel;
- o serializer valida o formato basico;
- `registrar_movimentacao()` faz a regra forte;
- `select_for_update()` protege concorrencia;
- o saldo atual mora em `Variacao`;
- a trilha oficial do que aconteceu mora em `Movimentacao`.

Pontos que merecem atencao:

- saida maior que o saldo deve falhar no backend;
- quantidade precisa ser positiva;
- toda entrada e saida importante deixa historico;
- o mesmo service e reaproveitado por cadastro inicial, pedidos e NF-e.

Perguntas para responder:

- Onde o sistema impede uma saida sem saldo?
- Por que a view nao mexe no saldo diretamente?
- Qual a diferenca entre `saldo_atual` e `Movimentacao`?
- Por que o projeto usa transacao nesse fluxo?

---

## 11. Etapa 4: Pedidos De Venda

Leia nesta ordem:

1. [frontend/src/pages/PedidosPage.tsx](../frontend/src/pages/PedidosPage.tsx)
2. [frontend/src/pages/PedidoFormPage.tsx](../frontend/src/pages/PedidoFormPage.tsx)
3. [backend/app/models.py](../backend/app/models.py)
4. [backend/app/serializers.py](../backend/app/serializers.py)
5. [backend/app/views.py](../backend/app/views.py)
6. [backend/app/services/pedidos.py](../backend/app/services/pedidos.py)

Fluxo mental:

```text
PedidoFormPage.tsx
-> POST ou PATCH /api/pedidos/
-> PedidoVendaSerializer
-> salvar_pedido_venda()

se status = finalizado
-> _aplicar_estoque_pedido()
-> registrar_movimentacao(saida)

se pedido finalizado for cancelado
-> _estornar_estoque_pedido()
-> registrar_movimentacao(entrada)
```

O que observar:

- `PedidoVenda` tem estados de negocio importantes: `rascunho`, `finalizado` e `cancelado`.
- `PedidoFormPage.tsx` monta os itens e faz validacoes basicas de UX.
- `PedidoVendaSerializer` valida payload e delega persistencia principal.
- `salvar_pedido_venda()` concentra o comportamento real do pedido.
- pedido finalizado baixa estoque automaticamente.
- pedido cancelado estorna estoque automaticamente.
- pedido cancelado nao pode ser alterado.
- pedido finalizado nao deve voltar para rascunho.
- pedido finalizado nao deve trocar itens livremente.

Perguntas para responder:

- Em que momento a baixa do estoque acontece de verdade?
- Quem cria a `Movimentacao` de saida do pedido?
- Por que `PedidoVendaItem` guarda `movimentacao_saida` e `movimentacao_estorno`?
- O que o sistema faz se tentar finalizar um pedido sem saldo suficiente?

---

## 12. Etapa 5: Relatorios E Leitura Gerencial

Leia nesta ordem:

1. [frontend/src/pages/DashboardHome.tsx](../frontend/src/pages/DashboardHome.tsx)
2. [frontend/src/pages/RelatoriosPage.tsx](../frontend/src/pages/RelatoriosPage.tsx)
3. [frontend/src/utils/reportExports.ts](../frontend/src/utils/reportExports.ts)
4. [backend/app/views.py](../backend/app/views.py)
5. [backend/app/services/relatorios.py](../backend/app/services/relatorios.py)

Fluxo mental:

```text
DashboardHome.tsx / RelatoriosPage.tsx
-> GET /api/relatorios/mensal/
-> GET /api/relatorios/reposicao/
-> services/relatorios.py agrega dados
-> frontend exibe e exporta
```

O que observar:

- o dashboard mistura varias visoes pequenas;
- `RelatoriosPage.tsx` trabalha com dados mais consolidados;
- `gerar_relatorio_reposicao()` olha estoque minimo e historico recente;
- `gerar_relatorio_mensal()` junta movimentacoes, pedidos finalizados e itens com maior saida;
- `reportExports.ts` transforma dados em formatos de saida como impressao, PDF e Excel.

Perguntas para responder:

- Qual a diferenca entre dashboard e relatorio?
- Em qual camada o calculo gerencial e feito?
- O frontend so mostra os dados ou tambem decide a regra do relatorio?

---

## 13. Etapa 6: Configuracao Visual E Branding

Leia nesta ordem:

1. [frontend/src/context/SystemConfigContext.tsx](../frontend/src/context/SystemConfigContext.tsx)
2. [frontend/src/hooks/useSystemConfig.ts](../frontend/src/hooks/useSystemConfig.ts)
3. [frontend/src/pages/ConfiguracoesSistemaPage.tsx](../frontend/src/pages/ConfiguracoesSistemaPage.tsx)
4. [frontend/src/utils/branding.ts](../frontend/src/utils/branding.ts)
5. [backend/app/models.py](../backend/app/models.py)
6. [backend/app/serializers.py](../backend/app/serializers.py)
7. [backend/app/views.py](../backend/app/views.py)
8. [backend/app/services/configuracao.py](../backend/app/services/configuracao.py)

Fluxo mental:

```text
App.tsx
-> SystemConfigProvider carrega configuracao
-> configuracao chega ao frontend
-> branding.ts aplica tokens CSS, titulo e favicon
-> telas passam a refletir a identidade da empresa
```

O que observar:

- `ConfiguracaoSistema` funciona como configuracao unica do sistema;
- o provider carrega essa configuracao na inicializacao;
- `branding.ts` normaliza cores, calcula contraste e aplica variaveis CSS;
- `ConfiguracoesSistemaPage.tsx` permite editar nome, descricao, logo e paleta.

Perguntas para responder:

- Onde o sistema guarda o nome da empresa?
- Em que ponto as cores viram variaveis CSS reais?
- Qual o papel do `SystemConfigContext` alem de "buscar dados"?

---

## 14. Etapa 7: Importacao De Nota Fiscal

Leia nesta ordem:

1. [frontend/src/pages/ImportarNotaFiscalPage.tsx](../frontend/src/pages/ImportarNotaFiscalPage.tsx)
2. [backend/app/serializers.py](../backend/app/serializers.py)
3. [backend/app/views.py](../backend/app/views.py)
4. [backend/app/services/common.py](../backend/app/services/common.py)
5. [backend/app/services/nota_fiscal.py](../backend/app/services/nota_fiscal.py)
6. [backend/app/models.py](../backend/app/models.py)

Como estudar sem se perder:

1. primeiro entenda o `preview`;
2. depois entenda como o frontend monta o mapeamento dos itens;
3. so depois estude a aplicacao real da importacao;
4. por ultimo veja a limpeza da importacao.

Fluxo mental:

```text
ImportarNotaFiscalPage.tsx
-> upload do XML ou PDF
-> preview no backend
-> backend sugere fornecedor, produto e variacao
-> usuario confirma ou ajusta mapeamento
-> aplicar_importacao_nota_fiscal()
-> cria/relaciona dados e registra entradas no estoque
```

O que observar:

- `common.py` ajuda a inferir categoria, subcategoria, cor, tamanho e numeracao;
- `nota_fiscal.py` lida com parsing de XML e PDF;
- o preview nao faz tudo; ele prepara decisao;
- a aplicacao real pode apontar para variacao existente, nova variacao ou novo produto;
- a entrada de estoque da nota reaproveita `registrar_movimentacao()`;
- a limpeza tenta estornar o que foi importado.

Perguntas para responder:

- Onde o backend extrai informacoes do arquivo?
- Onde ele monta as sugestoes para a tela?
- Como a mesma importacao pode resultar em criar produto novo ou usar variacao existente?
- O que significa "limpar" uma importacao no sistema?

---

## 15. Onde Validar Quando Algo Parece Errado

Use esta tabela mental:

- problema de permissao: [backend/app/permissions.py](../backend/app/permissions.py)
- problema de rota ou endpoint: [backend/config/urls.py](../backend/config/urls.py) e [backend/app/urls.py](../backend/app/urls.py)
- problema de payload: [backend/app/serializers.py](../backend/app/serializers.py)
- problema de regra de negocio: [backend/app/services/](../backend/app/services)
- problema de estado invalido de dominio: [backend/app/models.py](../backend/app/models.py)
- problema de sessao, token ou refresh: [frontend/src/services/api.ts](../frontend/src/services/api.ts) e [frontend/src/context/AuthContext.tsx](../frontend/src/context/AuthContext.tsx)
- problema de roteamento e acesso no frontend: [frontend/src/App.tsx](../frontend/src/App.tsx) e [frontend/src/routes/PrivateRoute.tsx](../frontend/src/routes/PrivateRoute.tsx)
- problema de visual, tema ou marca: [frontend/src/context/SystemConfigContext.tsx](../frontend/src/context/SystemConfigContext.tsx) e [frontend/src/utils/branding.ts](../frontend/src/utils/branding.ts)

---

## 16. Os Testes Como Documentacao Executavel

Leia [backend/app/tests.py](../backend/app/tests.py) depois das etapas principais.

Classes mais importantes:

- `RegistroMovimentacaoTests`
- `PrimeiroAcessoTests`
- `VariacaoAutomaticaTests`
- `ProdutoDuplicadoTests`
- `ImportacaoNotaFiscalTests`
- `ConfiguracaoSistemaTests`
- `PedidoVendaTests`
- `RelatoriosTests`

Como usar os testes para estudar:

1. leia o nome da classe;
2. identifique qual regra de negocio ela protege;
3. abra o service ou model relacionado;
4. tente prever o comportamento antes de ler a assercao final.

Teste bom para estudar nao serve so para "passar".
Ele mostra o contrato esperado do sistema.

---

## 17. Metodo De Leitura Arquivo Por Arquivo

Quando abrir um arquivo, responda estas perguntas:

1. Qual e a responsabilidade deste arquivo em uma frase?
2. Que entradas ele recebe?
3. Que saidas ele devolve?
4. Onde ele valida?
5. Onde ele delega?
6. O que quebra se eu mudar isso sem cuidado?

Exemplo:

- `AuthContext.tsx`: controla sessao, login, logout e hidratacao inicial do usuario.
- `registrar_movimentacao()`: valida tipo e quantidade, protege concorrencia, atualiza saldo e cria historico.
- `PedidoVendaSerializer`: valida e delega criacao ou atualizacao do pedido para a camada de service.

---

## 18. Roteiro De Estudo Em 10 Dias

### Dia 1

- leia [frontend/src/main.tsx](../frontend/src/main.tsx) e [frontend/src/App.tsx](../frontend/src/App.tsx)
- leia [backend/config/settings.py](../backend/config/settings.py) e [backend/config/urls.py](../backend/config/urls.py)

### Dia 2

- estude login, `AuthContext`, `api.ts`, `PrivateRoute`
- depois leia `UsuarioLogadoView` e `PrimeiroAcessoView`

### Dia 3

- estude `Produto`, `Variacao` e `productOptions.ts`
- depois leia `NovoProduto.tsx`

### Dia 4

- releia `ProdutoSerializer`, `VariacaoSerializer` e `services/estoque.py`
- acompanhe o fluxo de estoque inicial

### Dia 5

- estude `NovaMovimentacao.tsx`, `MovimentacaoEstoqueSerializer` e `registrar_movimentacao()`
- feche o dia lendo `RegistroMovimentacaoTests`

### Dia 6

- estude `PedidoFormPage.tsx` e `services/pedidos.py`
- entenda bem `rascunho`, `finalizado` e `cancelado`

### Dia 7

- estude `DashboardHome.tsx`, `RelatoriosPage.tsx` e `services/relatorios.py`
- veja como exportacoes sao montadas em `reportExports.ts`

### Dia 8

- estude `ConfiguracaoSistema`, `SystemConfigContext` e `branding.ts`
- altere mentalmente o nome da empresa e siga o efeito no codigo

### Dia 9

- estude o fluxo de `preview` da nota fiscal
- so depois avance para `aplicar_importacao_nota_fiscal()`

### Dia 10

- leia `tests.py` inteiro
- volte aos fluxos mais dificeis e resuma cada um com suas palavras

---

## 19. Exercicios Praticos Para Fixar

1. Explique, sem olhar, o caminho de um login do formulario ate o usuario aparecer na sidebar.
2. Cadastre mentalmente um produto com estoque inicial `5` e descreva em quais camadas isso passa.
3. Explique por que uma saida manual e um pedido finalizado usam a mesma ideia central de estoque.
4. Mostre onde o sistema impede que um pedido cancelado seja alterado.
5. Descreva como a cor da empresa sai do backend e vira tema no navegador.
6. Descreva como uma NF-e pode virar entrada em variacao existente ou criacao de produto novo.
7. Escolha uma classe de teste e explique qual regra ela protege.

---

## 20. Erros Comuns De Estudo

- comecar por arquivos grandes e avancados sem entender o fluxo basico;
- achar que a regra principal esta na view;
- olhar so para o frontend e esquecer que o backend decide o estado valido;
- confundir `Produto` com `Variacao`;
- achar que `saldo_atual` sozinho explica o estoque, sem ler `Movimentacao`;
- ignorar `tests.py`, que no seu projeto e um mapa valioso do comportamento esperado.

---

## 21. Regra De Ouro Deste Projeto

Se voce estiver em duvida sobre "onde a logica de verdade mora", siga esta ordem:

1. `backend/app/services/`
2. `backend/app/models.py`
3. `backend/app/serializers.py`
4. `backend/app/views.py`
5. `frontend/src/services/api.ts`
6. `frontend/src/context/`
7. `frontend/src/pages/`

No frontend, pense em:

- estado da tela;
- montagem do payload;
- chamada para API;
- renderizacao e feedback para o usuario.

No backend, pense em:

- permissao;
- validacao;
- regra de negocio;
- consistencia do dominio;
- persistencia.

---

## 22. Perguntas Finais Para Saber Se Voce Dominou O Sistema

Se voce responder estas perguntas sem consultar o codigo, ja esta com uma leitura madura do projeto:

- Como o sistema autentica um usuario e mantem a sessao?
- Onde o sistema decide se um usuario e admin ou funcionario?
- Qual a diferenca entre `Produto` e `Variacao`?
- O que realmente altera o estoque?
- Em que momento um pedido baixa estoque?
- Como o cancelamento de pedido conversa com `Movimentacao`?
- Onde mora a regra que define o que e uma variacao valida?
- Como o relatorio mensal e montado?
- Como a configuracao visual chega ate o navegador?
- Como a importacao de nota fiscal conversa com o restante do dominio?

---

## 23. Fechamento

Este projeto nao foi organizado apenas por tipo de arquivo. Ele foi organizado por responsabilidade.

Leitura final mais importante:

- `models.py` define o dominio;
- `serializers.py` protege o contrato da API;
- `views.py` expone os casos de uso;
- `services/` carrega a regra de negocio;
- `tests.py` prova o comportamento;
- `pages/` mostram a experiencia do usuario;
- `context/` controla estado global;
- `api.ts` concentra a conversa com o backend.

Se voce estudar por fluxo, e nao por pasta isolada, a arquitetura do projeto fica muito mais clara.
