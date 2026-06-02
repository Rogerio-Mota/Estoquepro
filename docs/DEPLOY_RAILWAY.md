# Deploy no Railway

Este projeto pode ser publicado no Railway como dois servicos do mesmo repositorio:

- `backend`: Django + Gunicorn
- `frontend`: React/Vite servido por Caddy

Os exemplos abaixo assumem estes nomes de servico no Railway:

- `backend`
- `frontend`
- `Postgres`

Se voce usar nomes diferentes, ajuste os namespaces das variaveis de referencia.

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
3. Renomeie o servico do banco para `Postgres` se quiser usar os exemplos exatamente como estao abaixo.

## 3. Variaveis do backend

No servico `backend`, configure:

```env
DJANGO_SECRET_KEY=sua-chave-forte
DJANGO_DEBUG=false
PORT=8000
DJANGO_ALLOWED_HOSTS=${{ RAILWAY_PUBLIC_DOMAIN }}
DJANGO_CORS_ALLOWED_ORIGINS=https://${{ frontend.RAILWAY_PUBLIC_DOMAIN }}
DJANGO_CSRF_TRUSTED_ORIGINS=https://${{ frontend.RAILWAY_PUBLIC_DOMAIN }},https://${{ RAILWAY_PUBLIC_DOMAIN }}
DJANGO_SERVE_STATIC=true
DJANGO_SERVE_MEDIA=true
DJANGO_SECURE_SSL_REDIRECT=true
DJANGO_SECURE_HSTS_SECONDS=3600
DATABASE_URL=${{ Postgres.DATABASE_URL }}
DJANGO_ADMIN_USERNAME=admin
DJANGO_ADMIN_PASSWORD=uma-senha-forte
```

Observacoes:

- o `start.sh` executa `collectstatic`, `migrate` e sobe o `gunicorn`;
- se `DJANGO_ADMIN_USERNAME` e `DJANGO_ADMIN_PASSWORD` estiverem definidos, o sistema cria o admin principal apenas no primeiro boot;
- `DJANGO_SERVE_MEDIA=true` serve para demonstracao, mas os uploads locais nao sao persistentes para uso serio.
- o `settings.py` adiciona automaticamente o `RAILWAY_PUBLIC_DOMAIN` em `ALLOWED_HOSTS` e `CSRF_TRUSTED_ORIGINS`, o que reduz o risco de erro no primeiro deploy;
- voce pode configurar o healthcheck do backend com o caminho `/health/`.

## 4. Variavel do frontend

No servico `frontend`, configure:

```env
VITE_API_URL=https://${{ backend.RAILWAY_PUBLIC_DOMAIN }}/api
PORT=3000
```

Essa variavel e lida no build do Vite e fica embutida no bundle final.
Como o frontend usa `Dockerfile`, alteracoes em `VITE_API_URL` exigem novo build e novo deploy.

Opcionalmente, configure o healthcheck do frontend com o caminho `/health`.

## 5. Ordem recomendada

1. Criar o banco PostgreSQL.
2. Criar os servicos `backend` e `frontend` apontando para o mesmo repositorio.
3. Definir `Root Directory` como `/backend` e `/frontend`.
4. Gerar um dominio publico para os dois servicos.
5. Configurar as variaveis do backend.
6. Configurar `VITE_API_URL` no frontend.
7. Fazer o deploy do backend e do frontend.
8. Validar login, admin e chamadas da API pelo dominio final.

## 6. Testes finais

- frontend: `https://seu-frontend.up.railway.app`
- backend admin: `https://seu-backend.up.railway.app/admin`
- api: `https://seu-backend.up.railway.app/api`
- backend health: `https://seu-backend.up.railway.app/health/`
- frontend health: `https://seu-frontend.up.railway.app/health`

## 7. Pos-deploy recomendado

- Trocar `DJANGO_SECRET_KEY` se ela tiver sido exposta em print, chat ou log.
- Trocar `DJANGO_ADMIN_PASSWORD` por uma senha forte e exclusiva.
- Se o admin inicial ja existir, redefinir a senha com:

```bash
python manage.py configurar_admin_principal --username admin --password "SuaNovaSenhaForteAqui"
```

- Validar manualmente:
  - login no frontend
  - acesso ao admin Django
  - criacao, edicao e listagem de um registro real
  - consumo da API em `api/token/` e `api/usuario-logado/`

## Referencias oficiais

- Monorepo no Railway: https://docs.railway.com/guides/monorepo
- PostgreSQL no Railway: https://docs.railway.com/databases/postgresql/
- Variaveis no Railway: https://docs.railway.com/variables
- Configurar SPA routing: https://docs.railway.com/guides/spa-routing-configuration
- Deploy React no Railway: https://docs.railway.com/guides/react
