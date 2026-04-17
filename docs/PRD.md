# PRD - EstoquePro

## Metadados

- Produto: `EstoquePro`
- Tipo de documento: `PRD - Product Requirements Document`
- Versão: `1.0`
- Data-base: `08/04/2026`
- Status: `Documento vivo`
- Objetivo: consolidar a visão completa do sistema, seus módulos, regras, fluxos, requisitos e próximos passos de evolução

## 1. Resumo Executivo

O `EstoquePro` é um sistema web de gestão de estoque voltado para operações de varejo que precisam controlar catálogo, variações, movimentações, fornecedores, entradas por nota fiscal, pedidos de venda e identidade visual da empresa em uma única plataforma.

O produto foi desenhado para ser simples na operação diária, mas robusto nas regras de negócio. Ele centraliza a saúde do estoque, reduz trabalho manual, melhora a rastreabilidade das entradas e saídas e prepara a operação para crescer com mais previsibilidade.

Hoje o sistema já cobre:

- autenticação por perfil;
- dashboard operacional;
- cadastro de produtos e variações;
- entrada e saída manual de estoque;
- alerta de estoque baixo;
- cadastro de fornecedores;
- importação assistida de NF-e por XML e PDF com texto pesquisável;
- pedidos/vendas com baixa automática;
- relatórios mensais e sugestão de reposição;
- configuração visual com logo e paleta da marca.

## 2. Contexto e Problema

Operações comerciais de pequeno e médio porte costumam enfrentar os seguintes problemas:

- estoque desatualizado por excesso de controles manuais;
- dificuldade em localizar rapidamente produtos com saldo crítico;
- baixa rastreabilidade de entradas e saídas;
- tempo alto para cadastrar produtos vindos de notas fiscais;
- falta de padronização na operação entre usuários;
- pouca visibilidade sobre o que precisa ser reposto;
- necessidade de um sistema visualmente alinhado à marca da empresa.

O `EstoquePro` surge para resolver esses pontos com uma camada operacional simples para o usuário final e com regras consistentes no backend.

## 3. Visão do Produto

### 3.1 Proposta de valor

Permitir que uma empresa controle seu estoque com clareza, rapidez e segurança, usando uma interface simples e um fluxo operacional compatível com o dia a dia do varejo.

### 3.2 Posicionamento

Sistema de gestão de estoque com foco em:

- usabilidade;
- operação assistida;
- controle por variação;
- leitura de NF-e;
- pedidos com baixa automática;
- inteligência visual para reposição.

## 4. Objetivos do Produto

### 4.1 Objetivos de negócio

- reduzir perdas por falta de controle de estoque;
- diminuir o tempo de entrada de mercadorias;
- facilitar a conferência de produtos críticos;
- dar base para decisões de compra e reposição;
- padronizar processos operacionais;
- fortalecer a identidade visual da empresa dentro do sistema.

### 4.2 Objetivos do usuário

- encontrar rapidamente o que precisa fazer;
- lançar entradas e saídas sem ambiguidade;
- importar notas com o mínimo de retrabalho;
- saber o que precisa repor;
- registrar vendas e refletir isso no estoque automaticamente;
- operar o sistema sem necessidade de treinamento técnico avançado.

## 5. Escopo do Produto

### 5.1 Escopo atual

O sistema atual contempla os seguintes módulos:

- autenticação e controle de acesso;
- painel operacional;
- produtos;
- variações;
- movimentações de estoque;
- estoque baixo;
- fornecedores;
- importação de NF-e;
- pedidos/vendas;
- relatórios;
- configurações do sistema.

### 5.2 Fora do escopo atual

Os itens abaixo não fazem parte do escopo atual do produto:

- integração nativa com SEFAZ;
- emissão fiscal;
- OCR completo para PDF escaneado como imagem;
- módulo financeiro;
- módulo de compras com aprovação;
- multiempresa;
- app mobile nativo;
- integrações com marketplaces, ERP ou PDV externos.

## 6. Perfis de Usuário

### 6.1 Administrador

Responsável por configurar o sistema, cadastrar usuários, manter o catálogo, gerenciar fornecedores, importar notas, acompanhar relatórios e operar vendas quando necessário.

### 6.2 Funcionário

Responsável pela operação diária do estoque e consulta de dados permitidos. Pode registrar movimentações, consultar produtos, acompanhar alertas, importar nota e operar pedidos conforme as permissões do sistema.

### 6.3 Gestor/Proprietário

Normalmente atua com perfil de administrador, usando o sistema principalmente para acompanhar indicadores, aprovar fluxos e tomar decisões de reposição e operação.

## 7. Perfis e Permissões

### 7.1 Perfil `admin`

Pode:

- acessar todos os módulos;
- cadastrar, editar e excluir usuários;
- cadastrar, editar e excluir produtos;
- cadastrar, editar e excluir fornecedores;
- registrar e revisar movimentações;
- importar NF-e;
- criar e atualizar pedidos;
- acessar relatórios;
- alterar configurações do sistema e identidade visual.

### 7.2 Perfil `funcionario`

Pode:

- acessar o painel;
- consultar produtos, estoque e movimentações;
- registrar entradas e saídas;
- importar notas fiscais;
- consultar fornecedores;
- operar pedidos e vendas;
- acessar relatórios disponíveis.

Não pode:

- gerenciar usuários;
- alterar configurações globais do sistema;
- executar ações restritas de administração.

## 8. Módulos do Sistema

## 8.1 Autenticação e Sessão

### Objetivo

Garantir acesso seguro ao sistema e diferenciar claramente os perfis de uso.

### Funcionalidades atuais

- login com usuário e senha;
- autenticação baseada em JWT;
- recuperação dos dados do usuário logado;
- bloqueio de rotas privadas;
- exibição do perfil do usuário no cabeçalho.

### Resultado esperado

O usuário acessa apenas o que seu perfil permite e mantém uma sessão segura durante a operação.

## 8.2 Painel Operacional

- Objetivo

Apresentar uma visão rápida da operação, com destaque para status do estoque e movimentações recentes.

- Funcionalidades atuais

- cards de resumo;
- destaque para estoque baixo;
- gráfico semanal de entradas e saídas;
- bloco de prioridades;
- lista de produtos em reposição;
- últimas movimentações.

- Resultado esperado

O usuário entende o estado da operação em poucos segundos.

## 8.3 Catálogo de Produtos

- Objetivo

Organizar o portfólio da empresa por estrutura padronizada e escalável.

- Funcionalidades atuais

- cadastro de produto com nome, marca e SKU;
- categorias e subcategorias controladas;
- preço de custo e preço de venda;
- estoque mínimo;
- fornecedor vinculado;
- filtro, busca e paginação;
- status de estoque na listagem.

### Estrutura atual suportada

- categorias:
  - roupa
  - calçado
  - acessório
  - perfumaria
- subcategorias:
  - camisa
  - calça
  - bermuda
  - tênis
  - cinto
  - bijuteria masculina
  - perfume

## 8.4 Variações

- Objetivo

Permitir que um mesmo produto tenha unidades distintas por atributos como cor, tamanho e numeração.

- Funcionalidades atuais

- vínculo com produto base;
- controle por cor;
- controle por tamanho;
- controle por numeração;
- saldo individual por variação;
- regras automáticas conforme subcategoria.

### Regras atuais por tipo

- camisa, calça e bermuda usam tamanho;
- cinto usa tamanho;
- tênis usa numeração;
- bijuteria e perfume aceitam tamanho único ou vazio;
- combinações duplicadas não são permitidas.

## 8.5 Movimentações de Estoque

- Objetivo

Registrar toda entrada e saída de estoque com histórico rastreável.

- Funcionalidades atuais

- entrada manual;
- saída manual;
- histórico de movimentações;
- busca e filtro;
- vínculo por variação;
- atualização automática do saldo.

- Resultado esperado

Toda movimentação impacta o estoque de forma imediata e auditável.

## 8.6 Estoque Baixo

- Objetivo

Identificar rapidamente produtos que precisam de reposição.

- Funcionalidades atuais

- endpoint dedicado para produtos com estoque baixo;
- listagem filtrável;
- leitura por categoria;
- uso desses dados no painel e nos relatórios.

- Resultado esperado

Itens críticos aparecem de forma clara antes que faltem na operação.

## 8.7 Fornecedores

- Objetivo

Centralizar a base de parceiros comerciais e conectar produtos e notas aos fornecedores corretos.

- Funcionalidades atuais

- cadastro de nome;
- documento;
- contato;
- telefone;
- e-mail;
- listagem com busca e paginação.

- Resultado esperado

A operação mantém relacionamento comercial organizado e pronto para uso em cadastro, NF-e e reposição.

## 8.8 Importação de NF-e

- Objetivo

Reduzir o retrabalho de entrada de mercadorias e iniciar o cadastro a partir da própria nota fiscal.

- Funcionalidades atuais

- upload de `XML` da NF-e;
- upload de `PDF` do DANFE com texto pesquisável;
- leitura de preview da nota;
- leitura de fornecedor;
- sugestão de vínculo de itens por SKU e atributos;
- criação assistida de fornecedor, produto e variação;
- uso de variação já existente;
- bloqueio de nota duplicada;
- bloqueio de item com quantidade fracionada;
- histórico de importação.

- Resultado esperado

O usuário importa a nota, revisa os vínculos e lança a entrada sem recadastrar tudo manualmente.

## 8.9 Pedidos e Vendas

- Objetivo

Permitir o registro de pedidos de venda com baixa automática de estoque.

- Funcionalidades atuais

- cadastro de pedido;
- cliente e documento;
- itens por variação;
- preço unitário e subtotal;
- status do pedido;
- baixa automática ao finalizar;
- estorno de estoque ao cancelar pedido finalizado;
- listagem, busca e filtro.

### Status suportados

- `rascunho`
- `finalizado`
- `cancelado`

- Resultado esperado

O pedido deixa de ser apenas administrativo e passa a refletir diretamente o estoque real.

## 8.10 Relatórios

- Objetivo

Apoiar acompanhamento gerencial e tomada de decisão operacional.

- Funcionalidades atuais

- relatório mensal;
- entradas por período;
- saídas por período;
- pedidos finalizados;
- faturamento estimado;
- produtos com mais saídas;
- relatório de reposição;
- sugestão de pedido;
- impressão.

- Resultado esperado

O gestor entende ritmo operacional, consumo e necessidade de compra.

## 8.11 Configurações do Sistema e Branding

- Objetivo

Permitir que o sistema reflita a identidade visual da empresa e centralize suas configurações básicas.

- Funcionalidades atuais

- nome da empresa;
- descrição curta;
- upload de logo;
- remoção de logo;
- cores primária, secundária e de acento;
- extração automática de paleta a partir da logo;
- preview visual antes de salvar;
- favicon e título dinâmicos;
- registro de quem atualizou e quando atualizou.

- Resultado esperado

O sistema passa a ter aparência alinhada à marca do cliente sem exigir customização manual de código.

## 9. Requisitos Funcionais

### 9.1 Autenticação e acesso

- `RF-001`: o sistema deve permitir login com usuário e senha.
- `RF-002`: o sistema deve manter sessão autenticada para rotas privadas.
- `RF-003`: o sistema deve identificar o usuário logado e seu perfil.
- `RF-004`: o sistema deve restringir telas e ações conforme o perfil.

### 9.2 Usuários

- `RF-005`: administradores devem poder cadastrar usuários.
- `RF-006`: administradores devem poder editar usuários.
- `RF-007`: administradores devem poder excluir usuários.
- `RF-008`: usuários devem possuir perfis `admin` ou `funcionario`.

### 9.3 Produtos e variações

- `RF-009`: o sistema deve permitir cadastro de produtos com SKU único.
- `RF-010`: o sistema deve permitir cadastrar variações por cor, tamanho e/ou numeração.
- `RF-011`: o sistema deve impedir combinações duplicadas de variação para o mesmo produto.
- `RF-012`: o sistema deve calcular o estoque total do produto pela soma das variações.
- `RF-013`: o sistema deve identificar quando um produto está abaixo ou no limite mínimo.

### 9.4 Estoque

- `RF-014`: o sistema deve registrar entrada manual de estoque.
- `RF-015`: o sistema deve registrar saída manual de estoque.
- `RF-016`: toda movimentação deve atualizar o saldo da variação.
- `RF-017`: o sistema não deve permitir saída acima do saldo disponível.
- `RF-018`: o sistema deve manter histórico de movimentações.

### 9.5 Fornecedores

- `RF-019`: o sistema deve permitir cadastro e edição de fornecedores.
- `RF-020`: o sistema deve permitir busca por nome, documento e contato.
- `RF-021`: o sistema deve vincular fornecedor a produto quando disponível.

### 9.6 Importação de NF-e

- `RF-022`: o sistema deve aceitar XML da NF-e.
- `RF-023`: o sistema deve aceitar PDF do DANFE com texto pesquisável.
- `RF-024`: o sistema deve gerar preview da nota antes da aplicação.
- `RF-025`: o sistema deve sugerir fornecedor da nota.
- `RF-026`: o sistema deve sugerir vínculo de item com variação existente.
- `RF-027`: o sistema deve permitir criar novo produto durante a importação.
- `RF-028`: o sistema deve permitir criar nova variação durante a importação.
- `RF-029`: o sistema deve bloquear importação duplicada da mesma nota.
- `RF-030`: o sistema deve impedir importação automática de item fracionado.
- `RF-031`: o sistema deve registrar histórico da importação aplicada.

### 9.7 Pedidos e vendas

- `RF-032`: o sistema deve permitir criar pedidos com múltiplos itens.
- `RF-033`: o sistema deve permitir salvar pedidos em rascunho.
- `RF-034`: o sistema deve baixar o estoque ao finalizar um pedido.
- `RF-035`: o sistema deve estornar o estoque ao cancelar um pedido finalizado.
- `RF-036`: o sistema deve impedir alteração de itens em pedidos já finalizados.
- `RF-037`: o sistema deve impedir retorno de pedido finalizado para rascunho.

### 9.8 Relatórios

- `RF-038`: o sistema deve disponibilizar relatório mensal por ano e mês.
- `RF-039`: o sistema deve exibir entradas, saídas e pedidos do período.
- `RF-040`: o sistema deve exibir produtos com mais saídas.
- `RF-041`: o sistema deve gerar relatório de reposição por base histórica de dias.
- `RF-042`: o sistema deve apresentar sugestão de quantidade a pedir.

### 9.9 Branding e sistema

- `RF-043`: o sistema deve permitir edição da identidade visual.
- `RF-044`: o sistema deve aplicar a paleta visual em toda a interface.
- `RF-045`: o sistema deve gerar favicon e título de navegador conforme a marca.
- `RF-046`: o sistema deve registrar a última atualização da configuração.

## 10. Regras de Negócio

### 10.1 Produtos

- o `SKU` do produto deve ser único;
- o preço de venda deve ser maior que zero;
- o preço de venda não pode ser menor que o preço de custo;
- a subcategoria deve pertencer à categoria selecionada.

### 10.2 Variações

- variação não pode ter saldo negativo;
- subcategorias com tamanho exigem tamanho;
- subcategorias com numeração exigem numeração;
- subcategorias que não usam numeração não podem receber numeração;
- não pode haver duplicidade de variação com a mesma combinação de cor, tamanho e numeração no mesmo produto.

### 10.3 Movimentações

- a quantidade deve ser maior que zero;
- saída não pode exceder o saldo disponível;
- toda movimentação precisa estar vinculada a uma variação.

### 10.4 Pedidos

- cada item deve ter variação, quantidade e preço unitário;
- um pedido cancelado não pode ser alterado;
- pedido finalizado não pode voltar para rascunho;
- pedido finalizado não pode ter itens alterados;
- pedido cancelado após finalização deve gerar estorno do estoque.

### 10.5 Fornecedores

- documento de fornecedor, quando preenchido, deve ter formato compatível com CPF ou CNPJ.

### 10.6 NF-e

- o sistema deve rejeitar XML inválido;
- o sistema deve rejeitar PDF inválido;
- o sistema deve exigir mapeamento para todos os itens da nota;
- itens com quantidade fracionada não devem ser importados automaticamente;
- notas já importadas não devem ser reaplicadas.

### 10.7 Configurações

- o sistema deve manter apenas uma configuração global;
- cores devem ser válidas no formato hexadecimal.

## 11. Fluxos Principais

### 11.1 Fluxo de implantação inicial

1. Criar usuário administrador.
2. Configurar nome, logo e cores da empresa.
3. Cadastrar fornecedores.
4. Cadastrar produtos e variações iniciais.
5. Registrar saldo inicial manualmente ou importar nota fiscal.
6. Iniciar operação diária.

### 11.2 Fluxo de entrada por NF-e

1. Usuário acessa `Importar NF-e`.
2. Envia XML ou PDF.
3. Sistema lê a nota e apresenta preview.
4. Usuário define fornecedor.
5. Usuário resolve cada item:
   - vincular a variação existente;
   - criar nova variação;
   - criar novo produto.
6. Sistema valida regras da nota.
7. Sistema registra a importação.
8. Sistema cria as movimentações de entrada.
9. Estoque é atualizado.

### 11.3 Fluxo de venda

1. Usuário cria pedido.
2. Adiciona cliente e itens.
3. Salva como rascunho ou finalizado.
4. Se finalizado:
   - sistema gera saídas automáticas;
   - saldo das variações é reduzido.
5. Se cancelado após finalizado:
   - sistema gera estorno;
   - saldo retorna ao estoque.

### 11.4 Fluxo de reposição

1. Sistema identifica produtos abaixo do mínimo ou com consumo relevante.
2. Relatório de reposição calcula sugestão de pedido.
3. Gestor usa a lista para solicitar compra.

## 12. Requisitos Não Funcionais

### 12.1 Usabilidade

- a interface deve ser simples e direta;
- o sistema deve reduzir textos desnecessários;
- o painel deve destacar alertas importantes;
- o sistema deve ser responsivo para desktop e mobile.

### 12.2 Performance

- páginas principais devem carregar em tempo adequado para operação diária;
- buscas e listagens devem responder de forma fluida em volume compatível com MVP.

### 12.3 Segurança

- acesso autenticado via JWT;
- proteção de rotas privadas;
- controle de ações por perfil;
- backend como origem principal das regras de negócio.

### 12.4 Confiabilidade

- validações críticas devem acontecer no backend;
- operações sensíveis devem manter consistência de estoque;
- fluxos automáticos devem ser transacionais sempre que possível.

### 12.5 Auditabilidade

- movimentações devem manter histórico;
- importações de nota devem manter registro;
- configuração visual deve guardar última atualização.

## 13. Estrutura de Dados Principal

### Entidades centrais

- `PerfilUsuario`
- `Fornecedor`
- `Produto`
- `Variacao`
- `Movimentacao`
- `PedidoVenda`
- `PedidoVendaItem`
- `ImportacaoNotaFiscal`
- `ImportacaoNotaFiscalItem`
- `ConfiguracaoSistema`

### Relações principais

- um usuário possui um perfil;
- um fornecedor pode ter vários produtos;
- um produto possui várias variações;
- uma variação possui várias movimentações;
- um pedido possui vários itens;
- um item de pedido referencia uma variação;
- uma importação de nota possui vários itens;
- um item importado pode gerar movimentação e vínculo com variação.

## 14. Indicadores e Métricas de Sucesso

### Métricas operacionais

- total de produtos cadastrados;
- total de fornecedores cadastrados;
- total de movimentações no período;
- total de notas importadas;
- total de pedidos finalizados;
- percentual de catálogo em alerta;
- quantidade de produtos em reposição;
- valor estimado de estoque;
- volume mensal de entradas e saídas.

### Métricas de produto

- tempo médio para lançar uma entrada via nota;
- taxa de uso do fluxo de importação assistida;
- quantidade de erros evitados por validações;
- redução de lançamentos manuais;
- assertividade da sugestão de reposição.

## 15. Critérios de Sucesso do Produto

O produto será considerado bem-sucedido quando:

- o estoque refletir com confiabilidade as movimentações reais;
- notas fiscais puderem iniciar cadastros com baixo retrabalho;
- pedidos finalizados atualizarem estoque sem intervenção manual;
- a operação identificar rapidamente produtos críticos;
- relatórios apoiarem compra e reposição;
- a experiência do usuário final for simples e clara.

## 16. Riscos e Limitações

### Riscos atuais

- PDF escaneado sem texto pesquisável pode não ser interpretado corretamente;
- crescimento de volume pode exigir banco e infraestrutura mais robustos;
- ausência de integrações externas mantém parte do fluxo ainda manual;
- inconsistências de cadastro de SKU podem afetar sugestão de vínculo na NF-e.

### Mitigações

- manter revisão humana na importação por PDF;
- reforçar cadastro padronizado de produtos e fornecedores;
- centralizar validações críticas no backend;
- evoluir progressivamente para integrações e OCR quando necessário.

## 17. Dependências do Produto

- backend em Django REST Framework;
- frontend em React + Vite;
- banco de dados PostgreSQL;
- autenticação JWT;
- armazenamento local de mídia para logos;
- navegador moderno com suporte à aplicação web responsiva.

## 18. Roadmap Sugerido

### Curto prazo

- histórico visual de importações NF-e;
- melhoria na leitura e tratamento de PDFs;
- níveis de alerta por cor para estoque baixo;
- refinamento de dashboard e cards gerenciais.

### Médio prazo

- pedido de compra a partir da sugestão de reposição;
- exportação de relatórios em PDF/Excel;
- histórico de auditoria por usuário;
- agrupamento de movimentos por período e produto;
- filtros avançados por fornecedor, marca e categoria.

### Longo prazo

- integração com marketplace, PDV ou ERP;
- OCR para PDF escaneado;
- multiempresa;
- aprovação de pedidos de compra;
- app mobile ou experiência PWA ampliada.

## 19. Itens Abertos para Evolução

- definir se haverá módulo formal de compras;
- definir se o sistema emitirá ou apenas lerá documentos fiscais;
- avaliar necessidade de múltiplos depósitos/locais de estoque;
- avaliar integração com catálogo externo e códigos de barras;
- definir política de devolução e troca no módulo de vendas.

## 20. Glossário

- `SKU`: código único do item no catálogo.
- `Variação`: desdobramento do produto por atributos como cor, tamanho ou numeração.
- `NF-e`: Nota Fiscal Eletrônica.
- `DANFE`: representação em PDF da NF-e.
- `Estoque mínimo`: quantidade de referência para disparo de alerta.
- `Rascunho`: pedido ainda sem impacto automático no estoque.
- `Finalizado`: pedido concluído com baixa automática.
- `Cancelado`: pedido invalidado, com estorno quando aplicável.

## 21. Conclusão

O `EstoquePro` já se posiciona como uma plataforma operacional completa para um cenário de varejo em fase de profissionalização. O sistema atual cobre as rotinas mais sensíveis do controle de estoque e cria uma base sólida para evoluções futuras em compras, integração e inteligência operacional.

Este PRD deve ser tratado como documento vivo e atualizado sempre que:

- novos módulos forem adicionados;
- regras de negócio forem alteradas;
- integrações externas forem incluídas;
- métricas e objetivos do produto forem refinados.
