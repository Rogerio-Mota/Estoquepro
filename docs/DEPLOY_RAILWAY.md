# Deploy no Railway

Este projeto pode ser publicado no Railway como dois servicos do mesmo repositorio:

- `backend`: Django + Gunicorn
- `frontend`: React/Vite servido por Caddy

## Estrutura esperada

- backend com `Root Directory` = `/backend`
- frontend com `Root Directory` = `/frontend`
- banco PostgreSQL criado dentro do mesmo projeto Railway

## 1. Criar o projeto

1. No Railway, clique em `New Project`.
2. Escolha `Deploy from GitHub repo`.
3. Selecione o repositorio `Rogerio-Mota/Estoquepro`.
4. Crie dois servicos separados apontando para o mesmo repositorio:
   - um com `Root Directory` `/backend`
   - outro com `Root Directory` `/frontend`

Como cada pasta possui seu proprio `Dockerfile`, o Railway deve detectar e buildar cada servico automaticamente.

## 2. Criar o PostgreSQL

1. No mesmo projeto Railway, clique em `+ New`.
2. Escolha `Database` > `PostgreSQL`.
3. Apos a criacao, copie a variavel `DATABASE_URL` disponibilizada pelo Railway.

## 3. Variaveis do backend

No servico `backend`, configure:

```env
DJANGO_SECRET_KEY=sua-chave-forte
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=seu-backend.up.railway.app
DJANGO_CORS_ALLOWED_ORIGINS=https://seu-frontend.up.railway.app
DJANGO_CSRF_TRUSTED_ORIGINS=https://seu-frontend.up.railway.app,https://seu-backend.up.railway.app
DJANGO_SERVE_STATIC=true
DJANGO_SERVE_MEDIA=true
DATABASE_URL=${{Postgres.DATABASE_URL}}
DJANGO_ADMIN_USERNAME=admin
DJANGO_ADMIN_PASSWORD=uma-senha-forte
```

Observacoes:

- o `start.sh` executa `collectstatic`, `migrate` e sobe o `gunicorn`;
- se `DJANGO_ADMIN_USERNAME` e `DJANGO_ADMIN_PASSWORD` estiverem definidos, o sistema cria o admin principal apenas no primeiro boot;
- `DJANGO_SERVE_MEDIA=true` serve para demonstracao, mas os uploads locais nao sao persistentes para uso serio.

## 4. Variavel do frontend

No servico `frontend`, configure:

```env
VITE_API_URL=https://seu-backend.up.railway.app/api
```

Essa variavel e lida no build do Vite e fica embutida no bundle final.

## 5. Ordem recomendada

1. Criar o banco PostgreSQL.
2. Configurar as variaveis do backend.
3. Fazer o primeiro deploy do backend.
4. Copiar a URL publica do backend.
5. Configurar `VITE_API_URL` no frontend.
6. Fazer o deploy do frontend.
7. Voltar no backend e confirmar `CORS` e `CSRF` com a URL real do frontend.

## 6. Testes finais

- frontend: `https://seu-frontend.up.railway.app`
- backend admin: `https://seu-backend.up.railway.app/admin`
- api: `https://seu-backend.up.railway.app/api`

## Referencias oficiais

- Monorepo no Railway: https://docs.railway.com/guides/monorepo
- PostgreSQL no Railway: https://docs.railway.com/databases/postgresql/
- Variaveis no Railway: https://docs.railway.com/variables
- Configurar SPA routing: https://docs.railway.com/guides/spa-routing-configuration
- Deploy React no Railway: https://docs.railway.com/guides/react
