# EstoquePro

## Equipe de Desenvolvimento

- **Carinne da Silva Borges - Lider do projeto / Documentacao e Levantamento de Requisitos**
  Responsavel pela documentacao do projeto e pelo levantamento de requisitos, atuando na organizacao das informacoes, na consolidacao das necessidades do sistema e no apoio a definicao das funcionalidades principais.

- **Rogerio Mota de Melo - Vice-lider / Back-end e Banco de Dados**
  Responsavel pela estruturacao da logica do sistema, pela modelagem e manutencao do banco de dados, pela integracao com a aplicacao e pelo suporte tecnico as funcionalidades implementadas no projeto.

- **Julio Cesar Lima dos Reis - Desenvolvimento Front-end**
  Responsavel pelo desenvolvimento da interface do usuario, contribuindo para a implementacao das telas, a organizacao visual dos componentes e a integracao da experiencia de uso com as funcionalidades do sistema.

- **Joao Pedro Strasser Santos - Desenvolvimento Front-end e Design**
  Responsavel pelas atividades de front-end e design do projeto, atuando na construcao visual das telas, na melhoria da usabilidade, na padronizacao da identidade visual e no fortalecimento da experiencia do usuario.

Sistema web de controle de estoque e vendas com backend em Django REST Framework e frontend em React + Vite.

O estado atual do projeto esta focado em catalogo, estoque, vendas, relatorios, fornecedores e usuarios. Nesta versao nao ha modulo ativo de importacao de NF-e nem endpoint persistente de configuracao visual do sistema.

## Escopo atual do sistema

O sistema permite hoje:

- cadastrar produtos com categoria, subcategoria, marca, SKU, fornecedor e estoque minimo;
- controlar variacoes por cor, tamanho e numeracao;
- registrar entradas e saidas de estoque com historico;
- acompanhar produtos com estoque baixo;
- consultar movimentacoes por periodo;
- registrar vendas por pedido;
- acompanhar relatorios de vendas por periodo;
- gerenciar fornecedores;
- gerenciar usuarios com perfis `admin` e `funcionario`;
- provisionar o administrador principal por comando de manutencao, com opcao de liberar `primeiro acesso` publico quando necessario.

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
- TypeScript
- CSS customizado

## Estrutura atual do projeto

```text
PROJETO_MVP/
|-- backend/
|   |-- app/
|   |   |-- migrations/
|   |   |-- services/
|   |   |   |-- configuracao.py
|   |   |   |-- estoque.py
|   |   |   |-- pedidos.py
|   |   |   |-- relatorios.py
|   |   |   |-- __init__.py
|   |   |-- admin.py
|   |   |-- models.py
|   |   |-- permissions.py
|   |   |-- serializers.py
|   |   |-- signals.py
|   |   |-- tests.py
|   |   |-- urls.py
|   |   |-- views.py
|   |-- backups/
|   |-- config/
|   |-- manage.py
|   |-- requirements.txt
|   |-- .env.example
|-- docs/
|   |-- README.md
|   |-- VISAO_E_ESCOPO_DO_SISTEMA.md
|   |-- mysql_workbench_diagrama_er.sql
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- app/
|   |   |-- components/
|   |   |   |-- dashboard/
|   |   |   |-- feedback/
|   |   |   |-- layout/
|   |   |   |-- navigation/
|   |   |-- constants/
|   |   |-- contexts/
|   |   |   |-- auth/
|   |   |   |-- system-config/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- styles/
|   |   |-- utils/
|   |   |-- main.tsx
|   |-- index.html
|   |-- vite.config.ts
|   |-- package.json
|   |-- .env.example
|-- .gitignore
|-- package.json
|-- package-lock.json
|-- README.md
```

> Importante: o `package.json` da raiz agora centraliza atalhos para frontend e backend, enquanto o codigo real continua em `frontend/` e `backend/`.
> Diretorios como `backend/media/`, `backend/staticfiles/`, `backend/backups/` e `backend/tmp-test-runs/` sao artefatos locais e ficam fora da estrutura principal do codigo.

## Requisitos

- Git instalado
- Python 3.12+ recomendado
- PostgreSQL 15+ recomendado
- Node.js 20+ recomendado
- npm 10+ recomendado

## Como rodar localmente

### 1. Clonar o repositorio

```powershell
git clone <URL_DO_REPOSITORIO>
cd PROJETO_MVP
```

### 2. Criar o banco PostgreSQL local

Se voce usar o usuario padrao `postgres`, basta criar o banco:

```powershell
psql -U postgres -c "CREATE DATABASE estoquepro;"
```

Se cada pessoa usar outro usuario ou senha, e so ajustar depois no arquivo `backend/.env`.

### 3. Configurar e subir o backend

No PowerShell:

```powershell
cd backend
Copy-Item .env.example .env
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Edite `backend/.env` antes de continuar.

Campos obrigatorios:

- troque `DJANGO_SECRET_KEY` por uma chave real;
- configure `POSTGRES_PASSWORD` com a senha do PostgreSQL local;
- ajuste `POSTGRES_USER`, `POSTGRES_HOST` e `POSTGRES_PORT` se necessario.

Para gerar uma chave nova rapidamente:

```powershell
python -c "from secrets import token_urlsafe; print(token_urlsafe(50))"
```

Exemplo minimo de `backend/.env`:

```env
DJANGO_SECRET_KEY=sua-chave-unica-aqui
DJANGO_DEBUG=true
ENABLE_PUBLIC_FIRST_ACCESS=false
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
DJANGO_CORS_ALLOWED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
POSTGRES_DB=estoquepro
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha_do_postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_SSLMODE=prefer
DB_CONN_MAX_AGE=60
```

Depois aplique as migracoes e suba o servidor:

```powershell
python manage.py migrate
python manage.py configurar_admin_principal --username admin
python manage.py runserver
```

### 4. Configurar e subir o frontend

Em outro terminal:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Exemplo de `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

### 5. Acessos locais

- Frontend: `http://localhost:5173`
- Backend/API: `http://127.0.0.1:8000/api`
- Admin Django: `http://127.0.0.1:8000/admin`

### 6. Primeiro acesso

- por padrao, a criacao do administrador principal e feita no backend com `python manage.py configurar_admin_principal --username admin`;
- o comando pede a senha no terminal e tambem aceita `--password` para automacao;
- se quiser liberar a criacao publica pela tela de login, defina `ENABLE_PUBLIC_FIRST_ACCESS=true` no `backend/.env`.

## Como executar o projeto depois do setup

### Backend

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver
```

### Frontend

```powershell
cd frontend
npm run dev
```

## Variaveis de ambiente

### Backend (`backend/.env`)

| Variavel | Descricao | Padrao |
| --- | --- | --- |
| `DJANGO_SECRET_KEY` | Chave secreta do Django | obrigatoria, sem padrao utilizavel |
| `DJANGO_DEBUG` | Ativa modo debug | `false` |
| `ENABLE_PUBLIC_FIRST_ACCESS` | Libera a criacao publica do admin inicial pela tela de login | `false` |
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

### Frontend (`frontend/.env`)

| Variavel | Descricao | Padrao |
| --- | --- | --- |
| `VITE_API_URL` | URL base da API | `http://127.0.0.1:8000/api` |

O backend usa PostgreSQL. Configure `DATABASE_URL` ou os campos `POSTGRES_*` antes de iniciar a aplicacao. Se `DJANGO_SECRET_KEY` continuar com o placeholder do `.env.example`, o backend nao inicia.

## Perfis de acesso

- `admin`: acesso administrativo, incluindo usuarios, fornecedores, produtos e variacoes;
- `funcionario`: operacao do estoque, vendas, relatorios e consultas permitidas.

## Principais rotas da API

### Autenticacao e sessao

- `GET /api/primeiro-acesso/`
- `POST /api/primeiro-acesso/`
- `POST /api/token/`
- `POST /api/token/refresh/`
- `GET /api/usuario-logado/`

### Recursos principais

- `GET/POST/PUT/PATCH/DELETE /api/fornecedores/`
- `GET/POST/PUT/PATCH/DELETE /api/produtos/`
- `GET /api/produtos/estoque-baixo/`
- `GET/POST/PUT/PATCH/DELETE /api/variacoes/`
- `GET /api/movimentacoes/`
- `GET/POST /api/pedidos/`
- `GET /api/pedidos/{id}/`
- `GET/POST/PUT/PATCH/DELETE /api/usuarios/`

### Operacao de estoque e relatorios

- `POST /api/entrada-estoque/`
- `POST /api/saida-estoque/`
- `GET /api/relatorios/vendas/?periodo=dia|semana|mes`

## Principais paginas do frontend

- `/login`
- `/`
- `/pedidos`
- `/novo-pedido`
- `/produtos`
- `/novo-produto`
- `/estoque-baixo`
- `/movimentacoes`
- `/nova-movimentacao`
- `/fornecedores`
- `/relatorios`
- `/usuarios`

## Fluxo recomendado de uso

1. Criar o administrador principal com `python manage.py configurar_admin_principal --username admin`.
2. Cadastrar fornecedores.
3. Cadastrar produtos e variacoes.
4. Registrar entradas iniciais de estoque.
5. Registrar vendas pelo modulo de pedidos.
6. Acompanhar dashboard, estoque baixo, movimentacoes e relatorios.

## Validacoes e comandos uteis

### Backend

```powershell
cd backend
.\venv\Scripts\python.exe manage.py check
.\venv\Scripts\python.exe manage.py test --keepdb --noinput
```

### Frontend

```powershell
cd frontend
npm run lint
npm run build
```

### Atalhos pela raiz

```powershell
npm run lint:frontend
npm run build:frontend
npm run type-check:frontend
npm run check:backend
```

## Observacoes importantes

- o banco principal do projeto e PostgreSQL;
- arquivos enviados pelo sistema, como media do Django, ficam em `backend/media/`;
- em desenvolvimento, o backend expoe arquivos de media automaticamente quando `DEBUG=True`;
- o frontend usa JWT e guarda a sessao no `localStorage`;
- a manutencao do administrador principal deve ser feita pelo comando `configurar_admin_principal`, e nao pela tela publica;
- a identidade visual exibida no frontend usa os defaults definidos em `frontend/src/utils/branding.ts`, sem endpoint de configuracao persistida nesta versao.

## Proximos passos sugeridos

- separar `.env` por ambiente;
- criar pipeline de CI para testes e build;
- expandir cobertura automatizada para frontend;
