-- EstoquePro
-- Script SQL enxuto para gerar o DER no MySQL Workbench
-- Baseado nas entidades ativas em backend/app/models.py
-- Nomes das tabelas ajustados para o dominio do sistema, sem prefixos tecnicos.
--
-- Tabelas mantidas:
-- - usuario
-- - perfil_usuario
-- - fornecedor
-- - produto
-- - variacao
-- - movimentacao
-- - pedido_venda
-- - pedido_venda_item
--
-- Tabelas removidas do DER:
-- - qualquer tabela legada de configuracao, NF-e, backup ou apoio do Django
--   que nao participa do dominio atual mostrado pelo sistema.

CREATE DATABASE IF NOT EXISTS estoquepro
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE estoquepro;

CREATE TABLE usuario (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(150) NOT NULL,
  password VARCHAR(128) NOT NULL,
  is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuario_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE perfil_usuario (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'funcionario',
  PRIMARY KEY (id),
  UNIQUE KEY uq_perfil_usuario_user_id (user_id),
  CONSTRAINT fk_perfil_usuario_user
    FOREIGN KEY (user_id) REFERENCES usuario (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT ck_perfil_usuario_tipo
    CHECK (tipo IN ('admin', 'funcionario'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE fornecedor (
  id BIGINT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  contato VARCHAR(100) NOT NULL DEFAULT '',
  cidade VARCHAR(100) NOT NULL DEFAULT '',
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE produto (
  id BIGINT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  categoria VARCHAR(20) NOT NULL,
  subcategoria VARCHAR(20) NOT NULL,
  marca VARCHAR(100) NOT NULL,
  sku VARCHAR(50) NOT NULL,
  fornecedor_id BIGINT NULL,
  preco_custo DECIMAL(10,2) NULL,
  preco_venda DECIMAL(10,2) NOT NULL,
  estoque_minimo INT UNSIGNED NOT NULL DEFAULT 0,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_produto_sku (sku),
  KEY idx_produto_fornecedor_id (fornecedor_id),
  CONSTRAINT fk_produto_fornecedor
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedor (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE variacao (
  id BIGINT NOT NULL AUTO_INCREMENT,
  produto_id BIGINT NOT NULL,
  cor VARCHAR(50) NULL,
  tamanho VARCHAR(2) NULL,
  numeracao VARCHAR(2) NULL,
  saldo_atual INT NOT NULL DEFAULT 0,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_variacao_produto_id (produto_id),
  CONSTRAINT fk_variacao_produto
    FOREIGN KEY (produto_id) REFERENCES produto (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE movimentacao (
  id BIGINT NOT NULL AUTO_INCREMENT,
  variacao_id BIGINT NOT NULL,
  tipo VARCHAR(10) NOT NULL,
  quantidade INT UNSIGNED NOT NULL,
  observacao TEXT NULL,
  fornecedor_id BIGINT NULL,
  responsavel_id INT NULL,
  data_referencia DATE NOT NULL,
  data DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_movimentacao_variacao_id (variacao_id),
  KEY idx_movimentacao_fornecedor_id (fornecedor_id),
  KEY idx_movimentacao_responsavel_id (responsavel_id),
  CONSTRAINT fk_movimentacao_variacao
    FOREIGN KEY (variacao_id) REFERENCES variacao (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_movimentacao_fornecedor
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedor (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_movimentacao_responsavel
    FOREIGN KEY (responsavel_id) REFERENCES usuario (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pedido_venda (
  id BIGINT NOT NULL AUTO_INCREMENT,
  cliente_nome VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'finalizado',
  criado_por_id INT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pedido_venda_criado_por_id (criado_por_id),
  CONSTRAINT fk_pedido_venda_criado_por
    FOREIGN KEY (criado_por_id) REFERENCES usuario (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pedido_venda_item (
  id BIGINT NOT NULL AUTO_INCREMENT,
  pedido_id BIGINT NOT NULL,
  variacao_id BIGINT NOT NULL,
  quantidade INT UNSIGNED NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,
  movimentacao_saida_id BIGINT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pedido_venda_item_pedido_variacao (pedido_id, variacao_id),
  KEY idx_pedido_venda_item_variacao_id (variacao_id),
  KEY idx_pedido_venda_item_movimentacao_saida_id (movimentacao_saida_id),
  CONSTRAINT fk_pedido_venda_item_pedido
    FOREIGN KEY (pedido_id) REFERENCES pedido_venda (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_pedido_venda_item_variacao
    FOREIGN KEY (variacao_id) REFERENCES variacao (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_pedido_venda_item_movimentacao_saida
    FOREIGN KEY (movimentacao_saida_id) REFERENCES movimentacao (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Observacoes:
-- 1. O DER ficou apenas com as tabelas do dominio atual.
-- 2. Regras como categoria/subcategoria, tamanho/numeracao e estoque negativo
--    continuam sendo validadas pelo backend.
-- 3. A antiga configuracao do sistema nao faz mais parte do dominio persistido.
-- 4. Os nomes foram simplificados para leitura no Workbench, sem prefixo app_.
