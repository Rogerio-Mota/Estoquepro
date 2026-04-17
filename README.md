# EstoquePro

Sistema web de gestao de estoque com backend em Django REST Framework e frontend em React + Vite.

O projeto foi estruturado para atender uma operacao de varejo com controle de produtos, variacoes, movimentacoes, fornecedores, usuarios, importacao de NF-e e personalizacao visual da empresa.

## Documentacao do produto

- PRD completo: `docs/PRD.md`
- Guia da estrutura atual do projeto: `docs/ESTRUTURA_ATUAL_DO_PROJETO.md`

## Visao geral

O sistema permite:

- cadastrar produtos por categoria, subcategoria, marca e SKU;
- controlar variacoes por cor, tamanho ou numeracao;
- registrar entradas e saidas de estoque com historico;
- acompanhar itens com estoque baixo;
- importar XML de NF-e para lancar entradas de forma assistida;
- gerenciar fornecedores;
- controlar acesso por perfil de usuario;
- configurar nome, descricao, logo e paleta visual da empresa.

## Principais funcionalidades

### Estoque e catalogo

- cadastro de produtos com validacoes de negocio;
- variacoes com regras por tipo de item;
- saldo consolidado por produto;
- alerta automatico para estoque baixo.

### Operacao

- entrada manual de estoque;
- saida manual de estoque;
- historico de movimentacoes;
- dashboard com indicadores e graficos operacionais.

### Importacao de NF-e

- upload de XML;
- leitura previa da nota;
- sugestao de vinculacao por SKU;
- confirmacao antes de aplicar;
- bloqueio de importacao duplicada;
- registro historico da importacao.

### Administracao

- cadastro de usuarios;
- diferenciacao entre administrador e funcionario;
- configuracao de identidade visual;
- adaptacao do tema do sistema com base na logo da empresa.

## Stack utilizada

### Backend

- Python
- Django
- Django REST Framework
- Simple JWT
- django-filter
- django-cors-headers
- PostgreSQL

### Frontend

- React
- React Router
- Vite
- React Toastify
- CSS customizado com tema dinamico

## Estrutura do projeto

```text
PROJETO_MVP/
|-- backend/
|   |-- app/
|   |   |-- models.py
|   |   |-- serializers.py
|   |   |-- services.py
|   |   |-- views.py
|   |   |-- tests.py
|   |-- config/
|   |   |-- settings.py
|   |   |-- urls.py
|   |-- .env.example
|   |-- media/
|   |-- manage.py
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- context/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- utils/
|   |-- package.json
|   |-- vite.config.js
|-- docs/
|-- README.md
```

## Requisitos

- Python 3.11+ recomendado
- Node.js 20+ recomendado
- npm 10+ recomendado

## Como executar o projeto

### 1. Backend

No PowerShell:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Se o ambiente virtual ja existir, basta ativar e seguir a partir do `pip install` ou do `migrate`.

Antes de subir o backend, crie `backend/.env` a partir de `backend/.env.example`.

### 2. Frontend

Em outro terminal:

```powershell
cd frontend
npm install
npm run dev
```

### 3. Acessos locais

- Frontend: `http://localhost:5173`
- Backend/API: `http://127.0.0.1:8000/api`
- Admin Django: `http://127.0.0.1:8000/admin`

## Criacao de usuario administrador

Para criar um superusuario do Django:

```powershell
cd backend
.\venv\Scripts\python.exe manage.py createsuperuser
```

Esse usuario ja pode acessar o admin do Django e tambem possui privilegios administrativos na aplicacao.

## Variaveis de ambiente

O backend ja possui valores padrao para desenvolvimento, mas voce pode sobrescrever:

| Variavel | Descricao | Padrao |
| --- | --- | --- |
| `DJANGO_SECRET_KEY` | Chave secreta do Django | `django-insecure-dev-only-key-change-in-production` |
| `DJANGO_DEBUG` | Ativa modo debug | `true` |
| `DJANGO_ALLOWED_HOSTS` | Hosts permitidos | `127.0.0.1,localhost` |
| `DJANGO_CORS_ALLOWED_ORIGINS` | Origens permitidas para o frontend | `http://127.0.0.1:5173,http://localhost:5173` |
| `DATABASE_URL` | URL completa do PostgreSQL | vazio |
| `POSTGRES_DB` | Nome do banco PostgreSQL | vazio |
| `POSTGRES_USER` | Usuario do PostgreSQL | vazio |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL | vazio |
| `POSTGRES_HOST` | Host do PostgreSQL | `localhost` |
| `POSTGRES_PORT` | Porta do PostgreSQL | `5432` |
| `POSTGRES_SSLMODE` | Modo SSL do PostgreSQL | vazio |
| `DB_CONN_MAX_AGE` | Reuso de conexoes Django | `60` |
| `VITE_API_URL` | URL base da API no frontend | `http://127.0.0.1:8000/api` |

O backend usa PostgreSQL. Configure `DATABASE_URL` ou os campos `POSTGRES_*` antes de iniciar a aplicacao.

## Perfis de acesso

- `admin`: acesso administrativo, incluindo usuarios e configuracoes do sistema;
- `funcionario`: operacao do estoque e consulta das informacoes permitidas.

## Principais rotas da API

### Autenticacao

- `POST /api/token/`
- `POST /api/token/refresh/`
- `GET /api/usuario-logado/`

### Recursos principais

- `GET/POST /api/produtos/`
- `GET /api/produtos/estoque-baixo/`
- `GET/POST /api/variacoes/`
- `GET /api/movimentacoes/`
- `GET/POST /api/fornecedores/`
- `GET/POST /api/usuarios/`

### Operacao de estoque

- `POST /api/entrada-estoque/`
- `POST /api/saida-estoque/`

### NF-e

- `POST /api/importacao-nota-fiscal/preview/`
- `POST /api/importacao-nota-fiscal/aplicar/`

### Configuracao visual

- `GET /api/configuracao-sistema/`
- `PATCH /api/configuracao-sistema/`

## Fluxo recomendado de uso

1. Criar o usuario administrador.
2. Acessar o sistema e configurar nome, descricao e logo da empresa.
3. Cadastrar fornecedores.
4. Cadastrar produtos e variacoes.
5. Registrar entradas iniciais ou importar NF-e.
6. Acompanhar dashboard, estoque baixo e movimentacoes.

## Validacoes e comandos uteis

- Backend

```powershell
cd backend
.\venv\Scripts\python.exe manage.py check
.\venv\Scripts\python.exe manage.py test app
```

- Frontend

```powershell
cd frontend
npm run lint
npm run build
```

## Diferenciais implementados

- tema visual dinamico baseado na identidade da empresa;
- logo e paleta persistidas no backend;
- layout simplificado com navegacao superior;
- dashboard com leitura visual rapida;
- importacao assistida de nota fiscal;
- validacoes de estoque e negocio centralizadas no backend.

## Observacoes importantes

- O banco de dados do projeto e `PostgreSQL`.
- Arquivos enviados pelo sistema, como logos, sao armazenados em `backend/media/`.
- Em desenvolvimento, o backend expoe arquivos de media automaticamente quando `DEBUG=True`.
- O frontend utiliza autenticacao JWT e guarda sessao no `localStorage`.

## Proximos passos sugeridos

- separar arquivos `.env` por ambiente;
- separar configuracoes por ambiente;
- criar pipeline de CI para lint, testes e build;
- incluir historico visual de importacoes NF-e no painel.
