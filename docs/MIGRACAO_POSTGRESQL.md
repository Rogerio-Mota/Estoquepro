# Configuracao do PostgreSQL

O backend utiliza PostgreSQL. Configure `DATABASE_URL` ou `POSTGRES_DB` antes de iniciar a aplicacao.

## 1. Configurar o ambiente

No backend, copie `backend/.env.example` para `backend/.env` e ajuste os valores do seu banco PostgreSQL.

Exemplo com URL unica:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/estoquepro
```

Exemplo com campos separados:

```env
POSTGRES_DB=estoquepro
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_SSLMODE=prefer
```

## 2. Aplicar as migracoes no PostgreSQL

```powershell
cd backend
.\venv\Scripts\python.exe manage.py migrate
```

## 3. Validar

```powershell
cd backend
.\venv\Scripts\python.exe manage.py check
.\venv\Scripts\python.exe manage.py runserver
```

## Observacoes

- Os arquivos enviados pela aplicacao continuam em `backend/media/`.
- Em producao, mantenha as credenciais do banco em `backend/.env` ou em variaveis de ambiente seguras.
