# Diagramas de Modelagem - EstoquePro

Arquivos atualizados com base na versão simplificada e atual do projeto:

- [diagrama_casos_de_uso.puml](./diagrama_casos_de_uso.puml)
  Diagrama de casos de uso com os atores `Visitante`, `Funcionário` e `Administrador`.

- [diagrama_classes.puml](./diagrama_classes.puml)
  Diagrama de classes com os modelos principais do domínio.

- [diagrama_sequencia_registro_venda.puml](./diagrama_sequencia_registro_venda.puml)
  Diagrama de sequência do fluxo de registro de venda com baixa automática de estoque.

- [diagrama_entidade_relacionamento.puml](./diagrama_entidade_relacionamento.puml)
  Diagrama entidade-relacionamento da estrutura atual do banco.

## Sugestão de uso

1. Abra os arquivos `.puml` em uma extensão do PlantUML no VS Code, IntelliJ ou outro renderizador compatível.
2. Exporte cada diagrama para PNG, SVG ou PDF se precisar entregar como imagem.
3. Use os quatro diagramas em conjunto:
   - Caso de uso: visão funcional
   - Classes: visão orientada a objetos
   - Sequência: visão dinâmica do fluxo
   - ER: visão do banco de dados

## Observação

Esses diagramas refletem o estado atual do projeto simplificado, principalmente os arquivos:

- `backend/app/models.py`
- `backend/app/views.py`
- `backend/app/serializers.py`
- `backend/app/services/estoque.py`
- `backend/app/services/pedidos.py`
- `frontend/src/App.tsx`
- `frontend/src/components/Sidebar.tsx`

O arquivo `mysql_workbench_diagrama_er.sql` permanece no repositório apenas como material legado e não é mais a fonte principal para a modelagem atual.
