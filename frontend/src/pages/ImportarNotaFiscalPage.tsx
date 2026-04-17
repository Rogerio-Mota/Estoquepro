import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import EmptyState from "../components/EmptyState";
import useAuth from "../hooks/useAuth";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import {
  CATEGORY_OPTIONS,
  NUMBER_OPTIONS,
  SIZE_OPTIONS,
  getSubcategoryOptions,
  usesNumber,
  usesSize,
} from "../constants/productOptions";
import { authJsonRequest, extractCollection } from "../services/api";
import { formatCurrency, formatDateTime } from "../utils/formatters";


function buildVariacaoLabel(variacao) {
  const partes = [variacao.produto_nome, `SKU ${variacao.produto_sku}`];

  if (variacao.cor) {
    partes.push(`Cor ${variacao.cor}`);
  }
  if (variacao.tamanho) {
    partes.push(`Tam ${variacao.tamanho}`);
  }
  if (variacao.numeracao) {
    partes.push(`Num ${variacao.numeracao}`);
  }

  partes.push(`Saldo ${variacao.saldo_atual}`);
  return partes.join(" | ");
}


function buildFornecedorResolver(previewFornecedor) {
  if (!previewFornecedor) {
    return {
      modo: "manter",
      fornecedor: "",
      nome: "",
      documento: "",
      contato: "",
      telefone: "",
      email: "",
    };
  }

  return {
    modo: previewFornecedor.sugestao_modo || "manter",
    fornecedor: previewFornecedor.existente_id
      ? String(previewFornecedor.existente_id)
      : "",
    nome: previewFornecedor.cadastro_sugerido?.nome || "",
    documento: previewFornecedor.cadastro_sugerido?.documento || "",
    contato: previewFornecedor.cadastro_sugerido?.contato || "",
    telefone: previewFornecedor.cadastro_sugerido?.telefone || "",
    email: previewFornecedor.cadastro_sugerido?.email || "",
  };
}


function buildEmptyNovoProduto() {
  return {
    nome: "",
    marca: "",
    categoria: "",
    subcategoria: "",
    sku: "",
    codigo_barras: "",
    ncm: "",
    cest: "",
    cfop: "",
    unidade_comercial: "",
    preco_custo: "",
    preco_venda: "",
    estoque_minimo: "0",
    fornecedor: "",
    cor: "",
    tamanho: "",
    numeracao: "",
  };
}


function buildSuggestedNovoProduto(item) {
  return {
    nome: item.novo_produto_sugerido?.nome || item.descricao_produto || "",
    marca: item.novo_produto_sugerido?.marca || "",
    categoria: item.novo_produto_sugerido?.categoria || "",
    subcategoria: item.novo_produto_sugerido?.subcategoria || "",
    sku: item.novo_produto_sugerido?.sku || item.codigo_produto || "",
    codigo_barras: item.novo_produto_sugerido?.codigo_barras || item.codigo_barras || "",
    ncm: item.novo_produto_sugerido?.ncm || item.ncm || "",
    cest: item.novo_produto_sugerido?.cest || item.cest || "",
    cfop: item.novo_produto_sugerido?.cfop || item.cfop || "",
    unidade_comercial:
      item.novo_produto_sugerido?.unidade_comercial || item.unidade_comercial || "",
    preco_custo: item.novo_produto_sugerido?.preco_custo || "",
    preco_venda: item.novo_produto_sugerido?.preco_venda || "",
    estoque_minimo: String(item.novo_produto_sugerido?.estoque_minimo ?? 0),
    fornecedor: item.novo_produto_sugerido?.fornecedor
      ? String(item.novo_produto_sugerido.fornecedor)
      : "",
    cor: item.novo_produto_sugerido?.cor || "",
    tamanho: item.novo_produto_sugerido?.tamanho || "",
    numeracao: item.novo_produto_sugerido?.numeracao || "",
  };
}


function fillMissingNovoProdutoFields(currentValue, item) {
  const atual = currentValue || buildEmptyNovoProduto();
  const sugerido = buildSuggestedNovoProduto(item);

  return Object.fromEntries(
    Object.keys(sugerido).map((key) => [
      key,
      atual[key] === undefined || atual[key] === null || atual[key] === ""
        ? sugerido[key]
        : atual[key],
    ]),
  );
}


function buildItemMapping(item) {
  const variacao = item.variacao_sugerida_id ? String(item.variacao_sugerida_id) : "";
  const novaVariacao = {
    produto: item.produto_existente?.id ? String(item.produto_existente.id) : "",
    cor: item.nova_variacao_sugerida?.cor || "",
    tamanho: item.nova_variacao_sugerida?.tamanho || "",
    numeracao: item.nova_variacao_sugerida?.numeracao || "",
  };
  const novoProduto = buildSuggestedNovoProduto(item);

  if (item.acao_sugerida === "variacao_existente" && item.variacao_sugerida_id) {
    return {
      modo: "variacao",
      variacao,
      nova_variacao: novaVariacao,
      novo_produto: novoProduto,
    };
  }

  if (item.acao_sugerida === "nova_variacao" && item.nova_variacao_sugerida) {
    return {
      modo: "nova_variacao",
      variacao,
      nova_variacao: {
        ...novaVariacao,
        produto: item.nova_variacao_sugerida.produto
          ? String(item.nova_variacao_sugerida.produto)
          : "",
      },
      novo_produto: novoProduto,
    };
  }

  return {
    modo: "novo_produto",
    variacao,
    nova_variacao: novaVariacao,
    novo_produto: novoProduto,
  };
}


function getModeOptions(item) {
  const options = [{ value: "variacao", label: "Usar variação existente" }];

  if (item.produto_existente) {
    options.push({ value: "nova_variacao", label: "Cadastrar nova variação" });
  }

  options.push({ value: "novo_produto", label: "Cadastrar novo produto" });
  return options;
}


function getSubcategoriaBase(item, mapping) {
  if (mapping?.modo === "novo_produto") {
    return mapping.novo_produto.subcategoria;
  }

  return item.produto_existente?.subcategoria || "";
}


function isNovaVariacaoCompleta(item, mapping) {
  const data = mapping?.nova_variacao;
  const subcategoria = getSubcategoriaBase(item, mapping);

  if (!data?.produto) {
    return false;
  }

  if (usesSize(subcategoria) && !data.tamanho) {
    return false;
  }

  if (usesNumber(subcategoria) && !data.numeracao) {
    return false;
  }

  return true;
}


function isNovoProdutoCompleto(mapping) {
  const data = mapping?.novo_produto;
  if (!data) {
    return false;
  }

  if (
    !data.nome ||
    !data.marca ||
    !data.categoria ||
    !data.subcategoria ||
    !data.sku ||
    !data.preco_venda
  ) {
    return false;
  }

  if (usesSize(data.subcategoria) && !data.tamanho) {
    return false;
  }

  if (usesNumber(data.subcategoria) && !data.numeracao) {
    return false;
  }

  return true;
}


function isItemResolvido(item, mapping) {
  if (!mapping) {
    return false;
  }

  if (mapping.modo === "variacao") {
    return Boolean(mapping.variacao);
  }

  if (mapping.modo === "nova_variacao") {
    return isNovaVariacaoCompleta(item, mapping);
  }

  return isNovoProdutoCompleto(mapping);
}


function serializeFornecedorResolver(state) {
  if (state.modo === "usar_existente") {
    return {
      modo: "usar_existente",
      fornecedor: Number(state.fornecedor),
    };
  }

  if (state.modo === "criar") {
    return {
      modo: "criar",
      nome: state.nome,
      documento: state.documento || null,
      contato: state.contato || null,
      telefone: state.telefone || null,
      email: state.email || null,
    };
  }

  return { modo: "manter" };
}


function serializeItemMapping(item, mapping) {
  if (mapping.modo === "variacao") {
    return {
      indice: item.indice,
      variacao: Number(mapping.variacao),
    };
  }

  if (mapping.modo === "nova_variacao") {
    return {
      indice: item.indice,
      nova_variacao: {
        produto: Number(mapping.nova_variacao.produto),
        cor: mapping.nova_variacao.cor || null,
        tamanho: mapping.nova_variacao.tamanho || null,
        numeracao: mapping.nova_variacao.numeracao || null,
      },
    };
  }

  return {
    indice: item.indice,
    novo_produto: {
      nome: mapping.novo_produto.nome,
      marca: mapping.novo_produto.marca,
      categoria: mapping.novo_produto.categoria,
      subcategoria: mapping.novo_produto.subcategoria,
      sku: mapping.novo_produto.sku,
      codigo_barras: mapping.novo_produto.codigo_barras || null,
      ncm: mapping.novo_produto.ncm || null,
      cest: mapping.novo_produto.cest || null,
      cfop: mapping.novo_produto.cfop || null,
      unidade_comercial: mapping.novo_produto.unidade_comercial || null,
      preco_custo: mapping.novo_produto.preco_custo || null,
      preco_venda: mapping.novo_produto.preco_venda,
      estoque_minimo: Number(mapping.novo_produto.estoque_minimo || 0),
      fornecedor: mapping.novo_produto.fornecedor
        ? Number(mapping.novo_produto.fornecedor)
        : null,
      cor: mapping.novo_produto.cor || null,
      tamanho: mapping.novo_produto.tamanho || null,
      numeracao: mapping.novo_produto.numeracao || null,
    },
  };
}


function getActionLabel(value) {
  if (value === "variacao_existente") {
    return "Vínculo sugerido com variação existente";
  }

  if (value === "nova_variacao") {
    return "Produto encontrado; falta cadastrar a variação";
  }

  return "Item novo; cadastro do produto necessário";
}


function getConfidenceLabel(value) {
  if (value === "alta") {
    return "Alta";
  }

  if (value === "media") {
    return "Média";
  }

  return "Baixa";
}


function getConfidenceBadgeClass(value) {
  if (value === "alta") {
    return "badge-success";
  }

  if (value === "media") {
    return "badge-warning";
  }

  return "badge-danger";
}


function getItemStatusBadgeClass(item, mapping) {
  if (item.possui_quantidade_fracionada) {
    return "badge-danger";
  }

  return isItemResolvido(item, mapping) ? "badge-success" : "badge-warning";
}


function getItemStatusLabel(item, mapping) {
  if (item.possui_quantidade_fracionada) {
    return "Revisao obrigatoria";
  }

  if (isItemResolvido(item, mapping)) {
    return "Pronto";
  }

  if (mapping?.modo === "novo_produto") {
    return "Completar cadastro";
  }

  if (mapping?.modo === "nova_variacao") {
    return "Completar variacao";
  }

  return "Selecionar variacao";
}


function isFornecedorResolverValido(state) {
  if (state.modo === "usar_existente") {
    return Boolean(state.fornecedor);
  }

  if (state.modo === "criar") {
    return Boolean(state.nome);
  }

  return true;
}


export default function ImportarNotaFiscalPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [arquivo, setArquivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [variacoes, setVariacoes] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [mapeamentos, setMapeamentos] = useState({});
  const [fornecedorResolver, setFornecedorResolver] = useState(
    buildFornecedorResolver(null),
  );
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [limpandoImportacao, setLimpandoImportacao] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDadosBase() {
      try {
        const [variacoesData, fornecedoresData] = await Promise.all([
          authJsonRequest("/variacoes/", {}, "Erro ao carregar variações."),
          authJsonRequest("/fornecedores/", {}, "Erro ao carregar fornecedores."),
        ]);

        setVariacoes(extractCollection(variacoesData));
        setFornecedores(extractCollection(fornecedoresData));
      } catch (error) {
        toast.error(error.message);
      }
    }

    carregarDadosBase();
  }, []);

  const variacoesOrdenadas = useMemo(() => {
    return [...variacoes].sort((a, b) =>
      buildVariacaoLabel(a).localeCompare(buildVariacaoLabel(b), "pt-BR"),
    );
  }, [variacoes]);

  const fornecedoresOrdenados = useMemo(() => {
    return [...fornecedores].sort((a, b) =>
      (a.nome || "").localeCompare(b.nome || "", "pt-BR"),
    );
  }, [fornecedores]);

  const existeQuantidadeFracionada = preview?.itens?.some(
    (item) => item.possui_quantidade_fracionada,
  );
  const todosItensResolvidos = preview?.itens?.every((item) =>
    isItemResolvido(item, mapeamentos[item.indice]),
  );
  const importacaoBloqueada =
    !preview ||
    preview.itens.length === 0 ||
    preview.nota.ja_importada ||
    existeQuantidadeFracionada ||
    !isFornecedorResolverValido(fornecedorResolver) ||
    !todosItensResolvidos;
  const resumoPreview = preview?.nota?.resumo || null;
  const podeLimparImportacao =
    user?.tipo === "admin" && Boolean(preview?.nota?.importacao_existente_id);

  function handleArquivoChange(event) {
    const selectedFile = event.target.files?.[0] || null;
    setArquivo(selectedFile);
    setPreview(null);
    setMapeamentos({});
    setFornecedorResolver(buildFornecedorResolver(null));
    setErro("");
  }

  async function handlePreview() {
    if (!arquivo) {
      setErro("Selecione o arquivo da nota para continuar.");
      return;
    }

    setErro("");
    setLoadingPreview(true);

    try {
      const formData = new FormData();
      formData.append("arquivo", arquivo);

      const data = await authJsonRequest(
        "/importacao-nota-fiscal/preview/",
        {
          method: "POST",
          body: formData,
        },
        "Erro ao analisar a nota fiscal.",
      );

      const mapeamentosIniciais = {};
      data.itens.forEach((item) => {
        mapeamentosIniciais[item.indice] = buildItemMapping(item);
      });

      setPreview(data);
      setMapeamentos(mapeamentosIniciais);
      setFornecedorResolver(buildFornecedorResolver(data.fornecedor));

      if (data.nota.ja_importada) {
        toast.warning("Esta nota fiscal já foi importada anteriormente.");
      } else {
        toast.success("Arquivo analisado com sucesso.");
      }
    } catch (error) {
      setErro(error.message || "Erro ao analisar a nota fiscal.");
      toast.error(error.message || "Erro ao analisar a nota fiscal.");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleLimparImportacao() {
    if (!arquivo || !preview?.nota?.importacao_existente_id || user?.tipo !== "admin") {
      return;
    }

    const confirmou = window.confirm(
      "Essa ação vai remover a importação anterior e estornar as entradas geradas por ela. Deseja continuar?",
    );
    if (!confirmou) {
      return;
    }

    setErro("");
    setLimpandoImportacao(true);

    try {
      const data = await authJsonRequest(
        `/importacao-nota-fiscal/${preview.nota.importacao_existente_id}/limpar/`,
        {
          method: "DELETE",
        },
        "Erro ao limpar a importação anterior.",
      );

      const formData = new FormData();
      formData.append("arquivo", arquivo);

      const previewAtualizado = await authJsonRequest(
        "/importacao-nota-fiscal/preview/",
        {
          method: "POST",
          body: formData,
        },
        "Erro ao reanalisar a nota fiscal.",
      );

      const mapeamentosIniciais = {};
      previewAtualizado.itens.forEach((item) => {
        mapeamentosIniciais[item.indice] = buildItemMapping(item);
      });

      setPreview(previewAtualizado);
      setMapeamentos(mapeamentosIniciais);
      setFornecedorResolver(buildFornecedorResolver(previewAtualizado.fornecedor));

      toast.success(data?.message || "Importação anterior removida com sucesso.");
      toast.info("A nota foi reanalisada e está pronta para uma nova importação.");
    } catch (error) {
      setErro(error.message || "Erro ao limpar a importação anterior.");
      toast.error(error.message || "Erro ao limpar a importação anterior.");
    } finally {
      setLimpandoImportacao(false);
    }
  }

  function updateFornecedorResolver(field, value) {
    setFornecedorResolver((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  }

  function handleModoItemChange(indice, item, modo) {
    setMapeamentos((prevState) => {
      const atual = prevState[indice] || buildItemMapping(item);
      const proximo = { ...atual, modo };

      if (modo === "variacao" && !proximo.variacao && item.variacao_sugerida_id) {
        proximo.variacao = String(item.variacao_sugerida_id);
      }

      if (modo === "nova_variacao" && !proximo.nova_variacao.produto && item.produto_existente) {
        proximo.nova_variacao = {
          ...proximo.nova_variacao,
          produto: String(item.produto_existente.id),
        };
      }

      if (modo === "novo_produto") {
        proximo.novo_produto = fillMissingNovoProdutoFields(proximo.novo_produto, item);
      }

      return {
        ...prevState,
        [indice]: proximo,
      };
    });
  }

  function updateItemMapping(indice, section, field, value) {
    setMapeamentos((prevState) => ({
      ...prevState,
      [indice]: {
        ...prevState[indice],
        [section]: {
          ...prevState[indice][section],
          [field]: value,
        },
      },
    }));
  }

  function updateItemSimpleField(indice, field, value) {
    setMapeamentos((prevState) => ({
      ...prevState,
      [indice]: {
        ...prevState[indice],
        [field]: value,
      },
    }));
  }

  function updateNovoProdutoCategoria(indice, value) {
    setMapeamentos((prevState) => ({
      ...prevState,
      [indice]: {
        ...prevState[indice],
        novo_produto: {
          ...prevState[indice].novo_produto,
          categoria: value,
          subcategoria: "",
          tamanho: "",
          numeracao: "",
        },
      },
    }));
  }

  async function handleAplicarImportacao() {
    if (!arquivo || !preview) {
      return;
    }

    setErro("");
    setSalvando(true);

    try {
      const payload = new FormData();
      payload.append("arquivo", arquivo);
      payload.append("fornecedor", JSON.stringify(serializeFornecedorResolver(fornecedorResolver)));
      payload.append(
        "mapeamentos",
        JSON.stringify(
          preview.itens.map((item) => serializeItemMapping(item, mapeamentos[item.indice])),
        ),
      );

      const data = await authJsonRequest(
        "/importacao-nota-fiscal/aplicar/",
        {
          method: "POST",
          body: payload,
        },
        "Erro ao importar a nota fiscal.",
      );

      toast.success(`${data.itens_importados} item(ns) importado(s) com sucesso.`);
      navigate("/movimentacoes");
    } catch (error) {
      setErro(error.message || "Erro ao importar a nota fiscal.");
      toast.error(error.message || "Erro ao importar a nota fiscal.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Layout title="Importar NF-e">
      <div className="form-shell form-shell--wide">
        <PageHeader
          title="Importar nota fiscal de entrada"
        />

        {erro ? <div className="alert-error">{erro}</div> : null}
        <div className="page-card form-card" style={{ marginBottom: "20px" }}>
          <div className="form-grid" style={{ alignItems: "end" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Arquivo da nota</label>
              <input
                type="file"
                accept=".xml,.pdf,text/xml,application/xml,application/pdf"
                onChange={handleArquivoChange}
              />
              <p className="table-inline-note" style={{ marginTop: "10px" }}>
                Aceita XML da NF-e e PDF do DANFE com texto pesquisável.
              </p>
                      </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={() => navigate("/movimentacoes")}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="button-primary"
              onClick={handlePreview}
              disabled={!arquivo || loadingPreview || limpandoImportacao}
            >
              {loadingPreview ? "Analisando..." : "Analisar arquivo"}
            </button>
          </div>
        </div>

        {preview ? (
          <>
            <div className="highlight-panel" style={{ marginBottom: "20px" }}>
              <h3 className="section-title">Resumo da nota</h3>
              <div className="info-grid">
                <div className="info-card">
                  <span className="info-card__label">Número</span>
                  <strong className="info-card__value">{preview.nota.numero || "-"}</strong>
                </div>
                <div className="info-card">
                  <span className="info-card__label">Série</span>
                  <strong className="info-card__value">{preview.nota.serie || "-"}</strong>
                </div>
                <div className="info-card">
                  <span className="info-card__label">Fornecedor da nota</span>
                  <strong className="info-card__value">
                    {preview.nota.fornecedor_nome || "-"}
                  </strong>
                </div>
                <div className="info-card">
                  <span className="info-card__label">Emissão</span>
                  <strong className="info-card__value">
                    {formatDateTime(preview.nota.data_emissao)}
                  </strong>
                </div>
                <div className="info-card">
                  <span className="info-card__label">Leitura</span>
                  <strong className="info-card__value">
                    {preview.nota.tipo_arquivo === "pdf" ? "PDF" : "XML"}
                  </strong>
                </div>
              </div>

              {resumoPreview ? (
                <div className="info-grid" style={{ marginTop: "16px" }}>
                  <div className="info-card">
                    <span className="info-card__label">Itens lidos</span>
                    <strong className="info-card__value">{resumoPreview.total_itens}</strong>
                  </div>
                  <div className="info-card">
                    <span className="info-card__label">Vínculos automáticos</span>
                    <strong className="info-card__value">
                      {resumoPreview.variacoes_existentes}
                    </strong>
                  </div>
                  <div className="info-card">
                    <span className="info-card__label">Novas variações</span>
                    <strong className="info-card__value">
                      {resumoPreview.novas_variacoes}
                    </strong>
                  </div>
                  <div className="info-card">
                    <span className="info-card__label">Novos produtos</span>
                    <strong className="info-card__value">
                      {resumoPreview.novos_produtos}
                    </strong>
                  </div>
                  <div className="info-card">
                    <span className="info-card__label">Itens com alerta</span>
                    <strong className="info-card__value">
                      {resumoPreview.itens_com_aviso}
                    </strong>
                  </div>
                </div>
              ) : null}

              {preview.nota.chave_acesso ? (
                <p className="section-subtitle" style={{ marginTop: "14px", marginBottom: 0 }}>
                  Chave de acesso: {preview.nota.chave_acesso}
                </p>
              ) : null}

              {preview.nota.ja_importada ? (
                <div className="alert-error" style={{ marginTop: "16px", marginBottom: 0 }}>
                  Esta NF-e já foi importada anteriormente e não pode ser aplicada novamente.
                  {podeLimparImportacao ? (
                    <div
                      className="form-actions"
                      style={{ justifyContent: "flex-start", marginTop: "14px" }}
                    >
                      <button
                        type="button"
                        className="button-danger"
                        onClick={handleLimparImportacao}
                        disabled={limpandoImportacao}
                      >
                        {limpandoImportacao
                          ? "Limpando importação..."
                          : "Limpar importação anterior"}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {preview.nota.requer_conferencia_manual ? (
                <div className="alert-error" style={{ marginTop: "16px", marginBottom: 0 }}>
                  O PDF foi lido por extração de texto. Revise fornecedor, itens e vínculos
                  antes de concluir a entrada.
                </div>
              ) : null}

              {existeQuantidadeFracionada ? (
                <div className="alert-error" style={{ marginTop: "16px", marginBottom: 0 }}>
                  Existem itens com quantidade fracionada. Revise a nota, pois esse sistema
                  trabalha com entrada inteira por item.
                </div>
              ) : null}
            </div>

            <div className="page-card form-card" style={{ marginBottom: "20px" }}>
              <div className="section-header-inline">
                <div>
                  <h3 className="section-title">Fornecedor</h3>
                  <p className="section-subtitle">
                    Defina se a nota vai aproveitar um fornecedor existente, criar um novo
                    cadastro ou seguir sem vínculo no catálogo.
                  </p>
                </div>
              </div>

              {preview.fornecedor?.existente_id ? (
                <p className="table-inline-note" style={{ marginBottom: "14px" }}>
                  Fornecedor já encontrado no sistema: {preview.fornecedor.existente_nome}
                </p>
              ) : null}

              <div className="form-grid">
                <div>
                  <label className="form-label">Como tratar o fornecedor</label>
                  <select
                    value={fornecedorResolver.modo}
                    onChange={(event) => updateFornecedorResolver("modo", event.target.value)}
                  >
                    <option value="manter">Não vincular agora</option>
                    <option value="usar_existente">Usar fornecedor existente</option>
                    <option value="criar">Cadastrar fornecedor da nota</option>
                  </select>
                </div>

                {fornecedorResolver.modo === "usar_existente" ? (
                  <div>
                    <label className="form-label">Fornecedor existente</label>
                    <select
                      value={fornecedorResolver.fornecedor}
                      onChange={(event) =>
                        updateFornecedorResolver("fornecedor", event.target.value)
                      }
                    >
                      <option value="">Selecione o fornecedor</option>
                      {fornecedoresOrdenados.map((fornecedor) => (
                        <option key={fornecedor.id} value={fornecedor.id}>
                          {fornecedor.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>

              {fornecedorResolver.modo === "criar" ? (
                <div className="form-grid" style={{ marginTop: "16px" }}>
                  <div>
                    <label className="form-label">Nome</label>
                    <input
                      value={fornecedorResolver.nome}
                      onChange={(event) =>
                        updateFornecedorResolver("nome", event.target.value)
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Documento</label>
                    <input
                      value={fornecedorResolver.documento}
                      onChange={(event) =>
                        updateFornecedorResolver("documento", event.target.value)
                      }
                      placeholder="CPF ou CNPJ"
                    />
                  </div>
                  <div>
                    <label className="form-label">Contato</label>
                    <input
                      value={fornecedorResolver.contato}
                      onChange={(event) =>
                        updateFornecedorResolver("contato", event.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="form-label">Telefone</label>
                    <input
                      value={fornecedorResolver.telefone}
                      onChange={(event) =>
                        updateFornecedorResolver("telefone", event.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      value={fornecedorResolver.email}
                      onChange={(event) =>
                        updateFornecedorResolver("email", event.target.value)
                      }
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              {preview.itens.length === 0 ? (
                <div className="page-card table-card">
                  <EmptyState>Nenhum item encontrado na nota fiscal.</EmptyState>
                </div>
              ) : (
                preview.itens.map((item) => {
                  const mapping = mapeamentos[item.indice];
                  const subcategoriaAtual = getSubcategoriaBase(item, mapping);
                  const subcategoriasNovoProduto = getSubcategoryOptions(
                    mapping?.novo_produto?.categoria,
                  );

                  const itemStatusLabel = getItemStatusLabel(item, mapping);
                  const itemStatusBadgeClass = getItemStatusBadgeClass(item, mapping);

                  return (
                    <div key={item.indice} className="page-card form-card nf-item-card">
                      <div className="nf-item-card__header">
                        <div>
                          <span className="nf-item-card__eyebrow">Item {item.indice}</span>
                          <h3 className="section-title" style={{ marginBottom: "8px" }}>
                            {item.descricao_produto}
                          </h3>
                          <p className="table-inline-note" style={{ marginBottom: 0 }}>
                            {getActionLabel(item.acao_sugerida)}
                          </p>
                        </div>
                        <span className={`badge ${itemStatusBadgeClass}`}>{itemStatusLabel}</span>
                      </div>

                      <div className="nf-item-card__meta">
                          <span className="dashboard-chart-legend__item">
                            Código: {item.codigo_produto || "-"}
                          </span>
                          <span className="dashboard-chart-legend__item">
                            Quantidade: {item.quantidade}
                          </span>
                          <span className="dashboard-chart-legend__item">
                            Unitário: {formatCurrency(item.valor_unitario)}
                          </span>
                        </div>

                      {item.produto_existente ? (
                        <div className="nf-inline-panel">
                          <strong>Produto encontrado no catálogo:</strong> {item.produto_existente.nome}
                          {" | "}SKU {item.produto_existente.sku}
                        </div>
                      ) : null}

                      <div className="nf-item-card__badges">
                        <span className={`badge ${getConfidenceBadgeClass(item.grau_confianca)}`}>
                          Confiança {getConfidenceLabel(item.grau_confianca)}
                        </span>
                        {item.criterio_sugestao === "descricao" ? (
                          <span className="badge badge-warning">Sugestão por descrição</span>
                        ) : null}
                        {item.possui_quantidade_fracionada ? (
                          <span className="badge badge-danger">Quantidade fracionada</span>
                        ) : null}
                      </div>

                      {item.avisos?.length ? (
                        <div className="nf-inline-panel nf-inline-panel--warning">
                          <strong>Revise este item antes de concluir:</strong>
                          <div className="nf-inline-list">
                            {item.avisos.map((aviso, index) => (
                              <span key={`${item.indice}-${index}`} className="table-inline-note">
                                {aviso}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="form-grid" style={{ alignItems: "end" }}>
                        <div>
                          <label className="form-label">Resolução do item</label>
                          <select
                            value={mapping?.modo || "variacao"}
                            onChange={(event) =>
                              handleModoItemChange(item.indice, item, event.target.value)
                            }
                          >
                            {getModeOptions(item).map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {mapping?.modo === "variacao" && item.variacoes_compativeis.length > 0 ? (
                        <details className="nf-details">
                          <summary>
                            Variações compatíveis encontradas
                          </summary>
                          <div className="nf-inline-list">
                            {item.variacoes_compativeis.map((variacao) => (
                              <span key={variacao.id} className="table-inline-note">
                                {variacao.label}
                              </span>
                            ))}
                          </div>
                        </details>
                      ) : null}

                      {mapping?.modo === "variacao" ? (
                        <div className="form-grid" style={{ marginTop: "16px" }}>
                          <div>
                            <label className="form-label">Variação existente</label>
                            <select
                              value={mapping.variacao}
                              onChange={(event) =>
                                updateItemSimpleField(item.indice, "variacao", event.target.value)
                              }
                            >
                              <option value="">Selecione a variação</option>
                              {variacoesOrdenadas.map((variacao) => (
                                <option key={variacao.id} value={variacao.id}>
                                  {buildVariacaoLabel(variacao)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : null}

                      {mapping?.modo === "nova_variacao" ? (
                        <div className="nf-form-section">
                          <p className="nf-helper-text">
                            Cadastre apenas a variacao que ainda nao existe para o produto
                            localizado.
                          </p>
                          <div className="form-grid">
                            <div>
                              <label className="form-label">Produto base</label>
                              <select
                                value={mapping.nova_variacao.produto}
                                onChange={(event) =>
                                  updateItemMapping(
                                    item.indice,
                                    "nova_variacao",
                                    "produto",
                                    event.target.value,
                                  )
                                }
                              >
                                <option value="">Selecione o produto</option>
                                {item.produto_existente ? (
                                  <option value={item.produto_existente.id}>
                                    {item.produto_existente.nome} | SKU {item.produto_existente.sku}
                                  </option>
                                ) : null}
                              </select>
                            </div>
                            <div>
                              <label className="form-label">Cor</label>
                              <input
                                value={mapping.nova_variacao.cor}
                                onChange={(event) =>
                                  updateItemMapping(
                                    item.indice,
                                    "nova_variacao",
                                    "cor",
                                    event.target.value,
                                  )
                                }
                              />
                            </div>

                            {usesSize(subcategoriaAtual) ? (
                              <div>
                                <label className="form-label">Tamanho</label>
                                <select
                                  value={mapping.nova_variacao.tamanho}
                                  onChange={(event) =>
                                    updateItemMapping(
                                      item.indice,
                                      "nova_variacao",
                                      "tamanho",
                                      event.target.value,
                                    )
                                  }
                                  required
                                >
                                  {SIZE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : null}

                            {usesNumber(subcategoriaAtual) ? (
                              <div>
                                <label className="form-label">Numeração</label>
                                <select
                                  value={mapping.nova_variacao.numeracao}
                                  onChange={(event) =>
                                    updateItemMapping(
                                      item.indice,
                                      "nova_variacao",
                                      "numeracao",
                                      event.target.value,
                                    )
                                  }
                                  required
                                >
                                  {NUMBER_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      {mapping?.modo === "novo_produto" ? (
                        <div className="nf-form-section">
                          <div className="nf-inline-panel nf-inline-panel--soft">
                            Os campos abaixo foram preenchidos automaticamente com base na nota.
                            Ajuste somente o necessario.
                          </div>
                          <details className="nf-details">
                            <summary>Ver dados lidos da nota</summary>
                            <div className="info-grid">
                              <div className="info-card">
                                <span className="info-card__label">Código</span>
                                <strong className="info-card__value">{item.codigo_produto || "-"}</strong>
                              </div>
                              <div className="info-card">
                                <span className="info-card__label">Código de barras</span>
                                <strong className="info-card__value">{item.codigo_barras || "-"}</strong>
                              </div>
                              <div className="info-card">
                                <span className="info-card__label">NCM</span>
                                <strong className="info-card__value">{item.ncm || "-"}</strong>
                              </div>
                              <div className="info-card">
                                <span className="info-card__label">CEST</span>
                                <strong className="info-card__value">{item.cest || "-"}</strong>
                              </div>
                              <div className="info-card">
                                <span className="info-card__label">CFOP</span>
                                <strong className="info-card__value">{item.cfop || "-"}</strong>
                              </div>
                              <div className="info-card">
                                <span className="info-card__label">Unidade</span>
                                <strong className="info-card__value">{item.unidade_comercial || "-"}</strong>
                              </div>
                            </div>
                          </details>

                          <div className="nf-form-section__block">
                            <h4 className="nf-form-section__title">Cadastro rapido</h4>
                            <div className="form-grid">
                              <div>
                                <label className="form-label">Nome</label>
                                <input
                                  value={mapping.novo_produto.nome}
                                  onChange={(event) =>
                                    updateItemMapping(
                                      item.indice,
                                      "novo_produto",
                                      "nome",
                                      event.target.value,
                                    )
                                  }
                                  required
                                />
                              </div>
                              <div>
                                <label className="form-label">Marca</label>
                                <input
                                  value={mapping.novo_produto.marca}
                                  onChange={(event) =>
                                    updateItemMapping(
                                      item.indice,
                                      "novo_produto",
                                      "marca",
                                      event.target.value,
                                    )
                                  }
                                  required
                                />
                              </div>
                              <div>
                                <label className="form-label">Categoria</label>
                                <select
                                  value={mapping.novo_produto.categoria}
                                  onChange={(event) =>
                                    updateNovoProdutoCategoria(item.indice, event.target.value)
                                  }
                                  required
                                >
                                  <option value="">Selecione</option>
                                  {CATEGORY_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="form-label">Subcategoria</label>
                                <select
                                  value={mapping.novo_produto.subcategoria}
                                  onChange={(event) =>
                                    updateItemMapping(
                                      item.indice,
                                      "novo_produto",
                                      "subcategoria",
                                      event.target.value,
                                    )
                                  }
                                  disabled={!mapping.novo_produto.categoria}
                                  required
                                >
                                  <option value="">Selecione</option>
                                  {subcategoriasNovoProduto.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="form-label">SKU</label>
                                <input
                                  value={mapping.novo_produto.sku}
                                  onChange={(event) =>
                                    updateItemMapping(
                                      item.indice,
                                      "novo_produto",
                                      "sku",
                                      event.target.value,
                                    )
                                  }
                                  required
                                />
                              </div>
                              <div>
                                <label className="form-label">Código de barras</label>
                                <input
                                  value={mapping.novo_produto.codigo_barras}
                                  onChange={(event) =>
                                    updateItemMapping(
                                      item.indice,
                                      "novo_produto",
                                      "codigo_barras",
                                      event.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <label className="form-label">NCM</label>
                                <input
                                  value={mapping.novo_produto.ncm}
                                  onChange={(event) =>
                                    updateItemMapping(
                                      item.indice,
                                      "novo_produto",
                                      "ncm",
                                      event.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <label className="form-label">CEST</label>
                                <input
                                  value={mapping.novo_produto.cest}
                                  onChange={(event) =>
                                    updateItemMapping(
                                      item.indice,
                                      "novo_produto",
                                      "cest",
                                      event.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <label className="form-label">CFOP</label>
                                <input
                                  value={mapping.novo_produto.cfop}
                                  onChange={(event) =>
                                    updateItemMapping(
                                      item.indice,
                                      "novo_produto",
                                      "cfop",
                                      event.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <label className="form-label">Unidade comercial</label>
                                <input
                                  value={mapping.novo_produto.unidade_comercial}
                                  onChange={(event) =>
                                    updateItemMapping(
                                      item.indice,
                                      "novo_produto",
                                      "unidade_comercial",
                                      event.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <label className="form-label">Fornecedor</label>
                                <select
                                  value={mapping.novo_produto.fornecedor}
                                  onChange={(event) =>
                                    updateItemMapping(
                                      item.indice,
                                      "novo_produto",
                                      "fornecedor",
                                      event.target.value,
                                    )
                                  }
                                >
                                  <option value="">Usar o fornecedor resolvido da nota</option>
                                  {fornecedoresOrdenados.map((fornecedor) => (
                                    <option key={fornecedor.id} value={fornecedor.id}>
                                      {fornecedor.nome}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="form-label">Preço de custo</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={mapping.novo_produto.preco_custo}
                                  onChange={(event) =>
                                    updateItemMapping(
                                      item.indice,
                                      "novo_produto",
                                      "preco_custo",
                                      event.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <label className="form-label">Preço de venda</label>
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={mapping.novo_produto.preco_venda}
                                  onChange={(event) =>
                                    updateItemMapping(
                                      item.indice,
                                      "novo_produto",
                                      "preco_venda",
                                      event.target.value,
                                    )
                                  }
                                  required
                                />
                              </div>
                              <div>
                                <label className="form-label">Estoque mínimo</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={mapping.novo_produto.estoque_minimo}
                                  onChange={(event) =>
                                    updateItemMapping(
                                      item.indice,
                                      "novo_produto",
                                      "estoque_minimo",
                                      event.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>

                          <div className="nf-form-section__block">
                            <h4 className="section-title">Primeira variação do produto</h4>
                            <div className="form-grid">
                              <div>
                                <label className="form-label">Cor</label>
                                <input
                                  value={mapping.novo_produto.cor}
                                  onChange={(event) =>
                                    updateItemMapping(
                                      item.indice,
                                      "novo_produto",
                                      "cor",
                                      event.target.value,
                                    )
                                  }
                                />
                              </div>

                              {usesSize(mapping.novo_produto.subcategoria) ? (
                                <div>
                                  <label className="form-label">Tamanho</label>
                                  <select
                                    value={mapping.novo_produto.tamanho}
                                    onChange={(event) =>
                                      updateItemMapping(
                                        item.indice,
                                        "novo_produto",
                                        "tamanho",
                                        event.target.value,
                                      )
                                    }
                                    required
                                  >
                                    {SIZE_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : null}

                              {usesNumber(mapping.novo_produto.subcategoria) ? (
                                <div>
                                  <label className="form-label">Numeração</label>
                                  <select
                                    value={mapping.novo_produto.numeracao}
                                    onChange={(event) =>
                                      updateItemMapping(
                                        item.indice,
                                        "novo_produto",
                                        "numeracao",
                                        event.target.value,
                                      )
                                    }
                                    required
                                  >
                                    {NUMBER_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>

            <div className="page-card form-card" style={{ marginTop: "20px" }}>
              <div className="form-actions">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={handlePreview}
                  disabled={!arquivo || loadingPreview || limpandoImportacao}
                >
                  Reanalisar arquivo
                </button>
                <button
                  type="button"
                  className="button-primary"
                  onClick={handleAplicarImportacao}
                  disabled={importacaoBloqueada || salvando}
                >
                  {salvando ? "Importando..." : "Concluir importação"}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  );
}
