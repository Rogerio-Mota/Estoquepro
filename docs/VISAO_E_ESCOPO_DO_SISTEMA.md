# Documento de Visao e Escopo do Sistema

## Metadados

- Produto: `EstoquePro`
- Tipo de documento: `Documento de Visao e Escopo`
- Versao: `1.0`
- Data-base: `05/05/2026`
- Status: `Atual`
- Base de validacao: codigo do backend, frontend, testes automatizados do backend e documentacao consolidada em `docs/`

## 1. Resumo executivo

O `EstoquePro` e um sistema web interno para gestao de estoque e vendas, desenhado para apoiar operacoes de varejo que precisam controlar catalogo, variacoes, movimentacoes, fornecedores, usuarios e vendas em um unico ambiente.

Na versao atual, o sistema atende o ciclo operacional essencial: provisionamento inicial do administrador pela equipe, autenticacao, consulta do painel, cadastro e manutencao de produtos, controle de variacoes, entradas e saidas de estoque, vendas com baixa automatica, alertas de estoque baixo, relatorios resumidos e gestao de usuarios e fornecedores.

Este documento consolida a visao do produto e define o escopo real entregue pelo repositorio analisado em `05/05/2026`. Ele deve ser usado como referencia executiva para alinhamento entre negocio, desenvolvimento, validacao e repasse do sistema.

## 2. Contexto e problema de negocio

Operacoes comerciais de pequeno e medio porte costumam enfrentar problemas recorrentes:

- controles paralelos em planilhas ou cadernos;
- falta de padronizacao para cadastrar produtos e suas variacoes;
- dificuldade para rastrear entradas, saidas e responsaveis;
- pouca visibilidade sobre produtos com saldo critico;
- risco de venda sem controle de estoque atualizado;
- excesso de retrabalho para transformar dados operacionais em visao gerencial.

O `EstoquePro` surge para reduzir essas friccoes com uma plataforma unica, simples para uso diario e consistente nas regras de negocio mais sensiveis.

## 3. Visao do produto

### 3.1 Declaracao de visao

Disponibilizar um sistema web confiavel e facil de operar para que a empresa consiga controlar estoque e vendas com clareza, rastreabilidade e menor dependencia de controles manuais.

### 3.2 Proposta de valor

O produto entrega valor ao combinar:

- catalogo estruturado por produto e variacao;
- controle transacional de estoque;
- historico operacional das movimentacoes;
- vendas com impacto automatico no saldo;
- separacao clara entre operacao diaria e administracao;
- acesso web centralizado para a equipe.

### 3.3 Posicionamento da versao atual

O `EstoquePro` nao se posiciona, nesta versao, como ERP completo nem como plataforma fiscal. Seu foco atual e resolver o nucleo operacional de estoque e vendas com regras bem definidas e interface objetiva.

## 4. Objetivos do sistema

### 4.1 Objetivos de negocio

- reduzir perdas e inconsistencias causadas por controle manual de estoque;
- aumentar a confiabilidade do saldo disponivel para venda;
- facilitar a reposicao a partir de alertas e historico operacional;
- padronizar o cadastro de produtos, variacoes e fornecedores;
- permitir que a gestao acompanhe rapidamente o estado atual da operacao.

### 4.2 Objetivos operacionais

- registrar entradas e saidas com responsavel e contexto;
- consolidar o estoque total por produto com base em suas variacoes;
- impedir saidas e vendas que deixariam o estoque negativo;
- dar ao usuario uma trilha clara de uso: consultar, cadastrar, movimentar e vender.

### 4.3 Objetivos de controle e qualidade

- garantir que exista ao menos um administrador principal;
- centralizar validacoes criticas no backend;
- preservar coerencia entre categoria, subcategoria e tipo de variacao;
- manter o historico das movimentacoes que alteram o saldo.

## 5. Publico-alvo e stakeholders

| Perfil | Papel no sistema | Necessidade principal |
| --- | --- | --- |
| `Administrador` | Responsavel pela administracao e tambem pela operacao quando necessario | Gerir usuarios, fornecedores, produtos e acompanhar a operacao completa |
| `Funcionario` | Responsavel pela rotina operacional | Consultar dados, registrar movimentacoes e realizar vendas conforme permissao |
| `Gestor ou proprietario` | Normalmente atua com perfil administrativo | Obter visao rapida da operacao, risco de estoque e desempenho de vendas |
| `Equipe de desenvolvimento` | Mantem e evolui o produto | Ter clareza sobre escopo real, limites e regras de negocio |

## 6. Escopo funcional da versao atual

### 6.1 Acesso, autenticacao e provisionamento inicial

**Objetivo**

Permitir o uso seguro do sistema desde o provisionamento inicial do administrador pela equipe ate a manutencao da sessao autenticada.

**O que esta no escopo**

- configuracao do administrador principal por comando de manutencao do backend;
- login com usuario e senha;
- autenticacao baseada em JWT;
- consulta do usuario autenticado;
- protecao de rotas privadas no frontend.

**Observacoes de escopo**

- o administrador principal e provisionado pela equipe antes da entrega ao cliente;
- a sessao do frontend e mantida em `localStorage`;
- quase todos os recursos exigem autenticacao.

### 6.2 Painel operacional

**Objetivo**

Apresentar uma leitura rapida do estado da operacao logo apos o login.

**O que esta no escopo**

- card com total de produtos;
- card com total de produtos em estoque baixo;
- card com quantidade movimentada nos ultimos 7 dias;
- atalhos para nova movimentacao e acao principal do catalogo;
- tabela resumida de produtos com estoque baixo;
- tabela resumida das ultimas movimentacoes.

**Observacoes de escopo**

- o painel atual e informativo e operacional;
- nao ha, no codigo atual, graficos analiticos nem dashboards avancados.

### 6.3 Gestao de usuarios

**Objetivo**

Controlar quem pode acessar o sistema e sob qual perfil.

**O que esta no escopo**

- listar usuarios;
- criar usuarios;
- editar usuario;
- excluir usuario;
- consultar o usuario logado.

**Observacoes de escopo**

- apenas `admin` pode gerenciar usuarios;
- o sistema permite apenas um administrador principal;
- nao e permitido excluir ou rebaixar o ultimo administrador;
- pela interface atual, o foco esta na manutencao de nome de usuario e senha.

### 6.4 Gestao de fornecedores

**Objetivo**

Manter o cadastro das fontes de abastecimento e vincular fornecedores aos produtos.

**O que esta no escopo**

- listar fornecedores;
- cadastrar fornecedor;
- editar fornecedor;
- excluir fornecedor;
- visualizar os produtos associados a cada fornecedor.

**Observacoes de escopo**

- leitura disponivel para usuarios autenticados;
- escrita restrita a `admin`;
- o backend aceita `contato` e `cidade` vazios, embora a interface atual seja mais rigida no preenchimento.

### 6.5 Catalogo de produtos

**Objetivo**

Organizar o portifolio da empresa de forma padronizada e preparada para controle de estoque.

**O que esta no escopo**

- cadastro, edicao, consulta e exclusao de produtos;
- vinculacao opcional de fornecedor;
- definicao de categoria, subcategoria, marca, SKU, preco e estoque minimo;
- calculo do estoque total por soma das variacoes;
- consulta de produtos em estoque baixo;
- filtros e busca por atributos de catalogo.

**Estrutura funcional suportada**

- categorias: `roupa`, `calcado`, `acessorio`, `perfumaria`, `geral`;
- subcategorias: `camisa`, `calca`, `bermuda`, `tenis`, `cinto`, `bijuteria`, `perfume`, `geral`.

**Observacoes de escopo**

- leitura disponivel para usuarios autenticados;
- escrita restrita a `admin`;
- o sistema valida coerencia entre categoria e subcategoria;
- o sistema impede duplicidade funcional de produto e duplicidade de SKU.

### 6.6 Variacoes de produto

**Objetivo**

Permitir que o estoque seja controlado no nivel em que a operacao realmente vende ou movimenta o item.

**O que esta no escopo**

- CRUD administrativo de variacoes na API;
- criacao de variacao inicial pelo fluxo do frontend ao cadastrar produto;
- estoque inicial opcional na criacao da variacao;
- suporte a atributos por cor, tamanho e numeracao conforme a subcategoria.

**Observacoes de escopo**

- nao existe tela dedicada no frontend para CRUD completo de variacoes apos a criacao inicial;
- o backend impede combinacoes duplicadas para o mesmo produto;
- o backend define quando a variacao exige tamanho, numeracao ou tamanho unico.

### 6.7 Movimentacoes de estoque

**Objetivo**

Registrar entradas e saidas e manter rastreabilidade sobre todas as alteracoes de saldo.

**O que esta no escopo**

- registrar entrada manual de estoque;
- registrar saida manual de estoque;
- listar movimentacoes;
- filtrar movimentacoes por periodo, tipo, produto, variacao e fornecedor;
- pesquisar movimentacoes por campos textuais;
- registrar usuario responsavel, observacao, fornecedor e data de referencia quando aplicavel.

**Observacoes de escopo**

- `admin` e `funcionario` podem operar esse modulo;
- entradas exigem fornecedor e data de referencia;
- saidas so sao permitidas com saldo suficiente;
- o sistema registra automaticamente movimentacoes geradas por estoque inicial e por vendas.

### 6.8 Vendas e pedidos

**Objetivo**

Permitir o registro de vendas e refletir esse evento automaticamente no estoque.

**O que esta no escopo**

- criar venda;
- listar vendas finalizadas;
- consultar venda individual;
- registrar itens vendidos por variacao;
- calcular valor total da venda;
- gerar saida automatica de estoque para cada item.

**Observacoes de escopo**

- o fluxo atual trabalha apenas com vendas `finalizado`;
- toda venda precisa ter ao menos um item;
- a mesma variacao nao pode ser repetida em duas linhas da mesma venda;
- se qualquer item estiver sem saldo suficiente, a venda inteira e rejeitada;
- a API atual nao permite editar nem excluir vendas registradas.

### 6.9 Estoque baixo

**Objetivo**

Alertar a operacao sobre produtos que ja atingiram ou ultrapassaram o limite minimo de saldo.

**O que esta no escopo**

- endpoint dedicado para consulta de produtos em alerta;
- exibicao do alerta no painel;
- pagina especifica para consulta da lista completa.

**Observacoes de escopo**

- o calculo e feito por produto, somando todas as variacoes;
- o alerta ocorre quando `estoque_total <= estoque_minimo`.

### 6.10 Relatorios

**Objetivo**

Transformar os dados operacionais em uma visao gerencial resumida.

**O que esta no escopo**

- relatorio de vendas por `dia`, `semana` ou `mes`;
- resumo com quantidade de vendas, itens vendidos e movimentacoes de saida;
- lista de produtos mais vendidos no periodo;
- tela com combinacao de relatorio e movimentacoes do mesmo recorte;
- filtro complementar por responsavel na interface.

**Observacoes de escopo**

- o relatorio considera apenas vendas finalizadas;
- nao ha exportacao para PDF, CSV ou Excel na versao atual.

### 6.11 Configuracao visual local

**Objetivo**

Aplicar identidade visual basica no frontend.

**O que esta no escopo**

- configuracao em memoria da identidade visual no frontend;
- aplicacao de variaveis de tema e sincronizacao visual do documento.

**Observacoes de escopo**

- nao existe endpoint de backend para persistir configuracoes visuais;
- nao ha modulo administrativo completo de branding nesta versao.

## 7. Regras de negocio centrais

As regras abaixo definem a fronteira mais importante do comportamento do sistema:

1. O sistema deve manter exatamente um administrador principal ativo na operacao.
2. O sistema deve ser entregue com o administrador principal provisionado pela equipe responsavel.
3. O estoque de uma variacao nunca pode ficar negativo.
4. Toda venda validada deve gerar baixa automatica de estoque por item.
5. O estoque baixo e calculado no nivel do produto, pela soma das variacoes.
6. Um produto nao pode repetir a combinacao `nome + marca + categoria + subcategoria`.
7. O `SKU` do produto deve ser unico de forma case insensitive.
8. Categoria e subcategoria devem ser coerentes entre si.
9. Variacoes devem obedecer o tipo de atributo exigido pela subcategoria.
10. Nao se pode repetir a mesma variacao em mais de uma linha da mesma venda.

## 8. Escopo de acesso por perfil

| Capacidade | `admin` | `funcionario` |
| --- | --- | --- |
| Login e painel | Sim | Sim |
| Consultar produtos, fornecedores e variacoes | Sim | Sim |
| Criar, editar e excluir produtos | Sim | Nao |
| Criar, editar e excluir fornecedores | Sim | Nao |
| Gerenciar usuarios | Sim | Nao |
| Registrar entradas e saidas | Sim | Sim |
| Registrar e consultar vendas | Sim | Sim |
| Consultar relatorios | Sim | Sim |
| CRUD administrativo de variacoes via API | Sim | Nao |

## 9. Fora do escopo da versao atual

Os itens abaixo nao devem ser apresentados como funcionalidades entregues pelo sistema nesta versao:

- importacao funcional de NF-e;
- integracao nativa com SEFAZ;
- emissao fiscal;
- configuracao visual persistida via backend;
- tela completa no frontend para manutencao de variacoes apos o cadastro inicial;
- cancelamento, estorno ou edicao de vendas registradas;
- modulo financeiro;
- modulo de compras com aprovacao;
- multiempresa ou multiloja;
- aplicativo mobile nativo;
- integracoes com ERP, marketplace, PDV ou outros sistemas externos;
- exportacao nativa de relatorios em PDF, CSV ou Excel.

## 10. Escopo nao funcional

### 10.1 Arquitetura

- backend em `Django REST Framework`;
- frontend em `React` com `Vite`;
- persistencia principal em `PostgreSQL`;
- comunicacao via API REST autenticada.

### 10.2 Seguranca e acesso

- autenticacao por JWT;
- controle de permissao por perfil;
- protecao de rotas privadas no frontend;
- quase todos os endpoints protegidos por autenticacao.

### 10.3 Integridade e consistencia

- validacoes centrais implementadas no backend;
- operacoes de estoque e venda protegidas por transacao;
- uso de `select_for_update` no fluxo de movimentacao para evitar inconsistencias concorrentes.

### 10.4 Rastreabilidade

- movimentacoes guardam tipo, quantidade, observacao, responsavel e datas;
- saidas geradas por vendas ficam ligadas aos itens do pedido.

### 10.5 Qualidade e maturidade atual

- o backend possui testes automatizados cobrindo regras centrais;
- nao foram identificados testes automatizados no frontend;
- nao foi identificada pipeline de CI no repositorio analisado.

## 11. Premissas e dependencias

- o sistema foi concebido para uso interno e autenticado;
- a operacao considera uma unica empresa no contexto atual;
- o controle de estoque depende da disciplina de cadastro e registro das movimentacoes;
- o funcionamento normal depende da disponibilidade do backend, do banco PostgreSQL e do frontend;
- a experiencia de uso depende de navegador moderno com acesso ao ambiente da aplicacao.

## 12. Restricoes e limitacoes conhecidas

- varias telas ainda aplicam parte dos filtros no frontend apos carregar a colecao completa;
- o frontend nao expoe todas as capacidades administrativas que a API ja possui, especialmente em variacoes;
- a identidade visual do sistema nao e persistida em banco nesta versao;
- nao ha trilha de cancelamento ou estorno de venda;
- a cobertura automatizada esta concentrada no backend.

## 13. Criterios de sucesso da versao atual

Considera-se que o escopo atual atende seu objetivo quando:

- a empresa consegue acessar o sistema com o administrador principal provisionado e autenticar usuarios;
- produtos, fornecedores e usuarios podem ser mantidos conforme o perfil de acesso;
- a operacao consegue registrar entradas e saidas sem permitir saldo negativo;
- as vendas sao registradas com baixa automatica no estoque;
- a equipe consegue identificar rapidamente produtos em estoque baixo;
- a gestao consegue consultar relatorios resumidos por dia, semana e mes;
- o historico de movimentacoes permite rastrear o que foi alterado e por quem.

## 14. Evolucao recomendada

As proximas evolucoes mais aderentes ao produto atual sao:

1. criar tela completa para manutencao de variacoes no frontend;
2. implementar cancelamento ou estorno controlado de vendas;
3. persistir configuracoes visuais no backend, caso branding seja requisito real;
4. adicionar exportacao de relatorios;
5. ampliar testes automatizados para frontend e criar pipeline de CI;
6. avaliar importacao de NF-e apenas quando houver escopo funcional, regra de negocio e UX definidos para isso.

## 15. Referencias relacionadas

- `README.md`
- `docs/CASOS_DE_USO_DO_SISTEMA.md`
- `docs/ESPECIFICACAO_FUNCIONAL_DO_SISTEMA.md`
- `docs/MATRIZ_DE_ACESSO_E_OPERACOES.md`
- `docs/ARQUITETURA_E_API_DO_SISTEMA.md`

## 16. Fonte de verdade

Em caso de divergencia entre documentos, a interpretacao do produto deve seguir esta ordem:

1. codigo do backend;
2. codigo do frontend;
3. testes automatizados do backend;
4. este documento;
5. demais documentos de apoio existentes em `docs/`.
