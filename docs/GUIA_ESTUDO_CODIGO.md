# Guia De Estudo Do Codigo

Se voce quiser a versao aprofundada e atualizada deste material, leia tambem [docs/GUIA_ESTUDO_CODIGO_DETALHADO.md](./GUIA_ESTUDO_CODIGO_DETALHADO.md).

Este guia foi feito para estudar o `EstoquePro` usando o codigo real do projeto.

A melhor forma de aprender este sistema nao e ler arquivo por arquivo em ordem alfabetica.
O melhor caminho e estudar por fluxo.

Fluxo principal do projeto:

```text
Tela React -> chamada HTTP -> view Django -> serializer -> service -> model -> banco
```

---

## Ordem recomendada

Siga esta sequencia:

1. login e autenticacao
2. produtos e variacoes
3. movimentacao de estoque
4. pedidos de venda
5. relatorios
6. configuracao visual
7. importacao de nota fiscal

Se voce tentar comecar pela importacao de NF-e, vai parecer mais dificil do que realmente e.
Ela depende de quase tudo que vem antes.

---

## Etapa 1 - Login e autenticacao

Objetivo:

- entender como o usuario entra no sistema;
- entender onde o token e guardado;
- entender como as rotas protegidas funcionam.

Arquivos para ler nesta ordem:

1. [frontend/src/pages/Login.tsx](../frontend/src/pages/Login.tsx)
2. [frontend/src/context/AuthContext.tsx](../frontend/src/context/AuthContext.tsx)
3. [frontend/src/services/api.ts](../frontend/src/services/api.ts)
4. [frontend/src/routes/PrivateRoute.tsx](../frontend/src/routes/PrivateRoute.tsx)
5. [backend/config/urls.py](../backend/config/urls.py)
6. [backend/app/views.py](../backend/app/views.py)
7. [backend/app/permissions.py](../backend/app/permissions.py)

O que observar:

- `Login.tsx` verifica se o primeiro acesso ainda esta pendente.
- O submit chama `login(username, password)` do contexto.
- `AuthContext.tsx` chama `loginRequest()` e depois `meRequest()`.
- `api.ts` conversa com `/api/token/` e `/api/token/refresh/`.
- `PrivateRoute.tsx` bloqueia acesso sem sessao.
- `UsuarioLogadoView` devolve os dados do usuario autenticado.

Perguntas para responder depois da leitura:

- Onde o token de acesso e salvo?
- Em que momento o frontend descobre o tipo do usuario?
- O que acontece quando a API responde `401`?
- Qual a diferenca entre `jsonRequest` e `authJsonRequest`?

Resumo mental desta etapa:

```text
Login.tsx -> AuthContext.login() -> api.ts /token/ -> api.ts /usuario-logado/ -> localStorage -> PrivateRoute
```

---

## Etapa 2 - Produtos e variacoes

Objetivo:

- entender o cadastro do catalogo;
- entender as regras de categoria, subcategoria, tamanho e numeracao;
- entender onde as validacoes de negocio estao concentradas.

Arquivos para ler nesta ordem:

1. [frontend/src/pages/NovoProduto.tsx](../frontend/src/pages/NovoProduto.tsx)
2. [frontend/src/constants/productOptions.ts](../frontend/src/constants/productOptions.ts)
3. [backend/app/models.py](../backend/app/models.py)
4. [backend/app/serializers.py](../backend/app/serializers.py)
5. [backend/app/views.py](../backend/app/views.py)
6. [backend/app/services/estoque.py](../backend/app/services/estoque.py)

O que observar:

- `NovoProduto.tsx` cria primeiro o produto e depois a primeira variacao.
- O frontend decide se mostra tamanho ou numeracao com base na subcategoria.
- `Produto.clean()` valida SKU, preco, duplicidade e categoria/subcategoria.
- `Variacao.clean()` valida saldo, tamanho, numeracao e combinacoes duplicadas.
- `VariacaoSerializer.create()` delega para `criar_variacao_com_estoque_inicial()`.
- Se houver estoque inicial, o sistema ja gera uma entrada automatica.

Perguntas para responder:

- Por que o produto e criado separado da variacao?
- Onde fica a regra que impede numerao em categorias erradas?
- Quem decide o `saldo_atual`: o frontend ou o backend?
- O que acontece se a variacao falhar depois que o produto foi criado?

Resumo mental desta etapa:

```text
NovoProduto.tsx -> POST /produtos/ -> ProdutoSerializer -> Produto.clean()
NovoProduto.tsx -> POST /variacoes/ -> VariacaoSerializer -> criar_variacao_com_estoque_inicial()
```

---

## Etapa 3 - Movimentacao de estoque

Objetivo:

- entender como o saldo e atualizado;
- entender por que a movimentacao e o centro do historico do estoque.

Arquivos para ler nesta ordem:

1. [frontend/src/pages/NovaMovimentacao.tsx](../frontend/src/pages/NovaMovimentacao.tsx)
2. [backend/app/views.py](../backend/app/views.py)
3. [backend/app/serializers.py](../backend/app/serializers.py)
4. [backend/app/services/estoque.py](../backend/app/services/estoque.py)
5. [backend/app/models.py](../backend/app/models.py)

O que observar:

- A tela escolhe a variacao, o tipo e a quantidade.
- A view usa uma classe base para entrada e saida.
- O serializer so valida formato basico.
- A regra forte mora em `registrar_movimentacao()`.
- O service trava a variacao com `select_for_update()`.
- O saldo so muda dentro do backend.
- Toda alteracao importante de estoque vira um registro em `Movimentacao`.

Perguntas para responder:

- Onde o sistema impede saida maior que o saldo?
- Por que `registrar_movimentacao()` usa transacao?
- Por que a view nao altera `saldo_atual` diretamente?
- Como uma entrada manual difere de uma entrada gerada automaticamente?

Resumo mental desta etapa:

```text
NovaMovimentacao.tsx -> /entrada-estoque ou /saida-estoque -> BaseMovimentacaoEstoqueView -> registrar_movimentacao() -> atualiza saldo + cria historico
```

---

## Etapa 4 - Pedidos de venda

Objetivo:

- entender como pedido impacta o estoque;
- entender a diferenca entre rascunho, finalizado e cancelado.

Arquivos para ler nesta ordem:

1. [frontend/src/pages/PedidoFormPage.tsx](../frontend/src/pages/PedidoFormPage.tsx)
2. [backend/app/serializers.py](../backend/app/serializers.py)
3. [backend/app/views.py](../backend/app/views.py)
4. [backend/app/services/pedidos.py](../backend/app/services/pedidos.py)
5. [backend/app/models.py](../backend/app/models.py)

O que observar:

- O frontend monta itens com `variacao`, `quantidade` e `preco_unitario`.
- Quando o status vai para `finalizado`, o estoque e baixado.
- Quando um pedido finalizado e cancelado, o estoque e estornado.
- Pedido cancelado nao pode ser alterado.
- Pedido finalizado nao pode voltar para rascunho.
- Pedido finalizado nao pode trocar itens depois de salvo.

Perguntas para responder:

- Em que momento a baixa de estoque acontece de verdade?
- Quem cria a `Movimentacao` da saida do pedido?
- Como o sistema evita finalizar pedido sem saldo?
- Por que `PedidoVendaItem` guarda `movimentacao_saida` e `movimentacao_estorno`?

Resumo mental desta etapa:

```text
PedidoFormPage -> PedidoVendaSerializer -> salvar_pedido_venda()
finalizado -> _aplicar_estoque_pedido() -> registrar_movimentacao(saida)
cancelado -> _estornar_estoque_pedido() -> registrar_movimentacao(entrada)
```

---

## Etapa 5 - Relatorios

Objetivo:

- entender como o sistema transforma dados operacionais em visao gerencial.

Arquivos para ler:

1. [frontend/src/pages/DashboardHome.tsx](../frontend/src/pages/DashboardHome.tsx)
2. [frontend/src/pages/RelatoriosPage.tsx](../frontend/src/pages/RelatoriosPage.tsx)
3. [backend/app/views.py](../backend/app/views.py)
4. [backend/app/services/relatorios.py](../backend/app/services/relatorios.py)

O que observar:

- O dashboard atual mistura varias chamadas simples.
- Os relatorios mais ricos vem dos services do backend.
- `gerar_relatorio_reposicao()` calcula sugestao com base em estoque minimo e saida recente.
- `gerar_relatorio_mensal()` agrega movimentacoes, pedidos finalizados e top saidas.

---

## Etapa 6 - Configuracao visual

Objetivo:

- entender como o sistema muda nome, logo, cores e tema.

Arquivos para ler:

1. [frontend/src/context/SystemConfigContext.tsx](../frontend/src/context/SystemConfigContext.tsx)
2. [frontend/src/utils/branding.ts](../frontend/src/utils/branding.ts)
3. [backend/app/serializers.py](../backend/app/serializers.py)
4. [backend/app/services/configuracao.py](../backend/app/services/configuracao.py)
5. [backend/app/models.py](../backend/app/models.py)

O que observar:

- o frontend carrega a configuracao ao iniciar;
- aplica variaveis CSS no documento;
- muda titulo da pagina, favicon e identidade visual;
- a configuracao do sistema funciona como singleton no backend.

---

## Etapa 7 - Importacao de nota fiscal

Objetivo:

- entender a parte mais avancada do sistema.

Arquivos para ler:

1. [frontend/src/pages/ImportarNotaFiscalPage.tsx](../frontend/src/pages/ImportarNotaFiscalPage.tsx)
2. [backend/app/serializers.py](../backend/app/serializers.py)
3. [backend/app/views.py](../backend/app/views.py)
4. [backend/app/services/common.py](../backend/app/services/common.py)
5. [backend/app/services/nota_fiscal.py](../backend/app/services/nota_fiscal.py)

Como estudar:

- primeiro entenda apenas o `preview`;
- depois entenda como o mapeamento escolhe `variacao existente`, `nova variacao` ou `novo produto`;
- por ultimo estude `aplicar_importacao_nota_fiscal()`.

---

## Como revisar melhor cada arquivo

Use este metodo curto:

1. identifique a responsabilidade do arquivo em uma frase;
2. liste quais entradas ele recebe;
3. liste quais saidas ele devolve;
4. marque onde ha validacao;
5. marque onde ha regra de negocio;
6. marque onde chama outro modulo.

Exemplo:

- `Login.tsx`: coleta usuario e senha, verifica primeiro acesso e chama o contexto de autenticacao.
- `registrar_movimentacao()`: recebe variacao, tipo e quantidade; valida saldo; atualiza estoque; grava historico.

---

## Melhor forma de praticar

Nao estude so lendo. Estude simulando fluxos reais.

Praticas recomendadas:

1. faca login e acompanhe no codigo cada chamada.
2. cadastre um produto com estoque inicial e siga o caminho no backend.
3. faça uma saida manual e confirme onde o saldo foi alterado.
4. crie um pedido em rascunho, finalize e depois cancele.
5. altere a configuracao visual e veja onde o tema muda.

---

## Perguntas finais para dominar o sistema

Se voce conseguir responder estas perguntas sem olhar o codigo, voce ja entende bem o projeto:

- Onde estao as regras de negocio mais importantes do sistema?
- Quais alteracoes realmente mexem no estoque?
- Como o pedido conversa com a movimentacao?
- Como o frontend sabe se o usuario e admin ou funcionario?
- Como a identidade visual chega da API ate a interface?
- Qual a diferenca entre validar no serializer e validar no model?

---

## Regra de ouro deste projeto

Se estiver em duvida sobre onde a logica "de verdade" mora, procure primeiro em:

1. `backend/app/services/`
2. `backend/app/models.py`
3. `backend/app/serializers.py`
4. `backend/app/views.py`

No frontend, pense principalmente em:

1. estado da tela
2. chamada para API
3. renderizacao

Esse projeto foi construido com o backend carregando a parte mais forte da regra de negocio.
