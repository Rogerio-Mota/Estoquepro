# Orientacoes de Git e seguranca

Este repositorio passou por uma limpeza de historico para remover segredos e artefatos locais que nao devem ser compartilhados.

## O que foi removido do historico

- arquivos `.env`
- bancos `*.sqlite3`
- diretorios de backup
- arquivos de cache `__pycache__`
- `node_modules`
- arquivos de midia gerados localmente

## Impacto para a equipe

A limpeza do historico altera os hashes dos commits antigos.

Se voce ja tinha o repositorio clonado antes dessa limpeza, faca uma destas opcoes:

1. Apague a copia local e clone novamente.
2. Ou atualize manualmente com cuidado:

```powershell
git fetch --all
git checkout main
git reset --hard origin/main
```

## Observacoes importantes

- Nao suba arquivos `.env` para o Git.
- Nao versione banco local, backups, cache ou `node_modules`.
- Se um segredo ja foi publicado antes, troque esse segredo mesmo apos remover o arquivo do historico.
