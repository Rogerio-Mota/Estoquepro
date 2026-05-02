-- Script MySQL 8+ para gerar as tabelas do projeto EstoquePro
-- Baseado nos modelos atuais de backend/app/models.py
-- Objetivo: criar as tabelas no MySQL Workbench e então gerar o diagrama EER

CREATE DATABASE IF NOT EXISTS estoquepro
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE estoquepro;

CREATE TABLE auth_user (
  id BIGINT NOT NULL AUTO_INCREMENT,
  password VARCHAR(128) NOT NULL,
  last_login DATETIME NULL,
  is_superuser TINYINT(1) NOT NULL DEFAULT 0,
  username VARCHAR(150) NOT NULL,
  first_name VARCHAR(150) NOT NULL DEFAULT '',
  last_name VARCHAR(150) NOT NULL DEFAULT '',
  email VARCHAR(254) NOT NULL DEFAULT '',
  is_staff TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  date_joined DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_auth_user_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE app_fornecedor (
  id BIGINT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  documento VARCHAR(18) NULL,
  contato VARCHAR(100) NULL,
  telefone VARCHAR(20) NULL,
  email VARCHAR(254) NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE app_perfilusuario (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'funcionario',
  PRIMARY KEY (id),
  UNIQUE KEY uq_app_perfilusuario_user_id (user_id),
  CONSTRAINT fk_app_perfilusuario_user
    FOREIGN KEY (user_id) REFERENCES auth_user (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT ck_app_perfilusuario_tipo
    CHECK (tipo IN ('admin', 'funcionario'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE app_configuracaosistema (
  id BIGINT NOT NULL AUTO_INCREMENT,
  nome_empresa VARCHAR(120) NOT NULL DEFAULT 'EstoquePro',
  descricao_empresa VARCHAR(160) NOT NULL DEFAULT 'Gestao inteligente de estoque',
  logo VARCHAR(100) NULL,
  cor_primaria VARCHAR(7) NOT NULL DEFAULT '#1768AC',
  cor_secundaria VARCHAR(7) NOT NULL DEFAULT '#0F4C81',
  cor_acento VARCHAR(7) NOT NULL DEFAULT '#F97316',
  atualizado_por_id BIGINT NULL,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_app_configuracaosistema_atualizado_por_id (atualizado_por_id),
  CONSTRAINT fk_app_configuracaosistema_atualizado_por
    FOREIGN KEY (atualizado_por_id) REFERENCES auth_user (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE app_produto (
  id BIGINT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  categoria VARCHAR(20) NOT NULL,
  subcategoria VARCHAR(20) NOT NULL,
  marca VARCHAR(100) NOT NULL,
  sku VARCHAR(50) NOT NULL,
  codigo_barras VARCHAR(20) NULL,
  ncm VARCHAR(8) NULL,
  cest VARCHAR(7) NULL,
  cfop VARCHAR(4) NULL,
  unidade_comercial VARCHAR(10) NULL,
  fornecedor_id BIGINT NULL,
  preco_custo DECIMAL(10,2) NULL,
  preco_venda DECIMAL(10,2) NOT NULL,
  estoque_minimo INT UNSIGNED NOT NULL DEFAULT 0,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_app_produto_sku (sku),
  KEY idx_app_produto_fornecedor_id (fornecedor_id),
  CONSTRAINT fk_app_produto_fornecedor
    FOREIGN KEY (fornecedor_id) REFERENCES app_fornecedor (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT ck_app_produto_categoria
    CHECK (categoria IN ('roupa', 'calcado', 'acessorio', 'perfumaria', 'geral')),
  CONSTRAINT ck_app_produto_subcategoria
    CHECK (subcategoria IN ('camisa', 'calca', 'bermuda', 'tenis', 'cinto', 'bijuteria', 'perfume', 'geral'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE app_variacao (
  id BIGINT NOT NULL AUTO_INCREMENT,
  produto_id BIGINT NOT NULL,
  cor VARCHAR(50) NULL,
  tamanho VARCHAR(2) NULL,
  numeracao VARCHAR(2) NULL,
  saldo_atual INT NOT NULL DEFAULT 0,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_app_variacao_produto_id (produto_id),
  CONSTRAINT fk_app_variacao_produto
    FOREIGN KEY (produto_id) REFERENCES app_produto (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT ck_app_variacao_tamanho
    CHECK (tamanho IS NULL OR tamanho IN ('PP', 'P', 'M', 'G', 'GG', 'U')),
  CONSTRAINT ck_app_variacao_numeracao
    CHECK (numeracao IS NULL OR numeracao IN ('36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE app_movimentacao (
  id BIGINT NOT NULL AUTO_INCREMENT,
  variacao_id BIGINT NOT NULL,
  tipo VARCHAR(10) NOT NULL,
  quantidade INT UNSIGNED NOT NULL,
  observacao TEXT NULL,
  responsavel_id BIGINT NULL,
  data DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_app_movimentacao_variacao_id (variacao_id),
  KEY idx_app_movimentacao_responsavel_id (responsavel_id),
  CONSTRAINT fk_app_movimentacao_variacao
    FOREIGN KEY (variacao_id) REFERENCES app_variacao (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_app_movimentacao_responsavel
    FOREIGN KEY (responsavel_id) REFERENCES auth_user (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT ck_app_movimentacao_tipo
    CHECK (tipo IN ('entrada', 'saida'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE app_pedidovenda (
  id BIGINT NOT NULL AUTO_INCREMENT,
  cliente_nome VARCHAR(120) NOT NULL,
  cliente_documento VARCHAR(18) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'rascunho',
  observacao TEXT NULL,
  criado_por_id BIGINT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_app_pedidovenda_criado_por_id (criado_por_id),
  CONSTRAINT fk_app_pedidovenda_criado_por
    FOREIGN KEY (criado_por_id) REFERENCES auth_user (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT ck_app_pedidovenda_status
    CHECK (status IN ('rascunho', 'finalizado', 'cancelado'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE app_pedidovendaitem (
  id BIGINT NOT NULL AUTO_INCREMENT,
  pedido_id BIGINT NOT NULL,
  variacao_id BIGINT NOT NULL,
  quantidade INT UNSIGNED NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,
  movimentacao_saida_id BIGINT NULL,
  movimentacao_estorno_id BIGINT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_app_pedidovendaitem_pedido_variacao (pedido_id, variacao_id),
  KEY idx_app_pedidovendaitem_variacao_id (variacao_id),
  KEY idx_app_pedidovendaitem_mov_saida_id (movimentacao_saida_id),
  KEY idx_app_pedidovendaitem_mov_estorno_id (movimentacao_estorno_id),
  CONSTRAINT fk_app_pedidovendaitem_pedido
    FOREIGN KEY (pedido_id) REFERENCES app_pedidovenda (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_app_pedidovendaitem_variacao
    FOREIGN KEY (variacao_id) REFERENCES app_variacao (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_app_pedidovendaitem_mov_saida
    FOREIGN KEY (movimentacao_saida_id) REFERENCES app_movimentacao (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_app_pedidovendaitem_mov_estorno
    FOREIGN KEY (movimentacao_estorno_id) REFERENCES app_movimentacao (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE app_importacaonotafiscal (
  id BIGINT NOT NULL AUTO_INCREMENT,
  chave_acesso VARCHAR(44) NULL,
  numero VARCHAR(20) NOT NULL DEFAULT '',
  serie VARCHAR(10) NOT NULL DEFAULT '',
  fornecedor_nome VARCHAR(150) NOT NULL DEFAULT '',
  fornecedor_documento VARCHAR(18) NOT NULL DEFAULT '',
  data_emissao DATETIME NULL,
  arquivo_nome VARCHAR(255) NOT NULL DEFAULT '',
  importado_por_id BIGINT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_app_importacaonotafiscal_chave_acesso (chave_acesso),
  KEY idx_app_importacaonotafiscal_importado_por_id (importado_por_id),
  CONSTRAINT fk_app_importacaonotafiscal_importado_por
    FOREIGN KEY (importado_por_id) REFERENCES auth_user (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE app_importacaonotafiscalitem (
  id BIGINT NOT NULL AUTO_INCREMENT,
  importacao_id BIGINT NOT NULL,
  indice INT UNSIGNED NOT NULL,
  codigo_produto VARCHAR(60) NOT NULL DEFAULT '',
  descricao_produto VARCHAR(255) NOT NULL,
  quantidade DECIMAL(12,4) NOT NULL,
  valor_unitario DECIMAL(12,4) NULL,
  variacao_id BIGINT NULL,
  movimentacao_id BIGINT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_app_importacaonotafiscalitem_importacao_indice (importacao_id, indice),
  KEY idx_app_importacaonotafiscalitem_variacao_id (variacao_id),
  KEY idx_app_importacaonotafiscalitem_movimentacao_id (movimentacao_id),
  CONSTRAINT fk_app_importacaonotafiscalitem_importacao
    FOREIGN KEY (importacao_id) REFERENCES app_importacaonotafiscal (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_app_importacaonotafiscalitem_variacao
    FOREIGN KEY (variacao_id) REFERENCES app_variacao (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_app_importacaonotafiscalitem_movimentacao
    FOREIGN KEY (movimentacao_id) REFERENCES app_movimentacao (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
