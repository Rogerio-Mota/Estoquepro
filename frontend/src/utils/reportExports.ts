import { formatCurrency } from "./formatters";


const PDF_PAGE = { width: 842, height: 595 };
const SVG_WIDTH = 1400;
const SVG_PADDING = 40;
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});


function sanitizeFileName(value) {
  return String(value || "relatorio")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}


function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


function escapeXml(value) {
  return escapeHtml(value);
}


function padCell(value, width, align = "left") {
  const text = String(value ?? "");
  if (text.length >= width) {
    return text.slice(0, Math.max(0, width - 1)).padEnd(width - 1, " ") + "…";
  }

  return align === "right"
    ? text.padStart(width, " ")
    : text.padEnd(width, " ");
}


function truncateText(value, cellWidth) {
  const text = String(value ?? "");
  const maxChars = Math.max(6, Math.floor((cellWidth - 18) / 7.2));
  if (text.length <= maxChars) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxChars - 1))}…`;
}


function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}


function encodeAscii(value) {
  return new Uint8Array([...String(value)].map((char) => char.charCodeAt(0)));
}


function joinUint8Arrays(chunks) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.length;
  });

  return result;
}


function buildEmptyRows(message, columnsLength) {
  return [
    {
      isEmpty: true,
      values: [message],
      colSpan: columnsLength,
    },
  ];
}


function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Nao foi possivel preparar a logo para exportacao."));
    reader.readAsDataURL(blob);
  });
}


async function resolveExportLogoSource(logoUrl) {
  if (!logoUrl) {
    return null;
  }

  try {
    const response = await fetch(logoUrl);

    if (!response.ok) {
      throw new Error("Falha ao carregar a logo.");
    }

    return await blobToDataUrl(await response.blob());
  } catch {
    return logoUrl;
  }
}


function buildSpreadsheetHeader(model) {
  const logoMarkup = model.logoSrc
    ? `
      <div class="sheet-brand__logo-wrap">
        <img
          src="${escapeHtml(model.logoSrc)}"
          alt="${escapeHtml(`Logo de ${model.empresaNome}`)}"
          class="sheet-brand__logo"
        />
      </div>
    `
    : "";

  return `
    <header class="sheet-header">
      <div class="sheet-brand">
        ${logoMarkup}
        <div class="sheet-brand__content">
          <h1>${escapeHtml(model.empresaNome)} • ${escapeHtml(model.titulo)}</h1>
          <p>${escapeHtml(model.periodo)} • Base do pedido: últimos ${escapeHtml(model.baseDias)} dias • Gerado em ${escapeHtml(model.geradoEm)}</p>
        </div>
      </div>
    </header>
  `;
}


function buildExcelHeaderRows(model) {
  const titleText = `${model.empresaNome} - ${model.titulo}`;
  const metaText = `${model.periodo} | Base do pedido: ultimos ${model.baseDias} dias | Gerado em ${model.geradoEm}`;

  if (!model.logoSrc) {
    return `
      <tr><td colspan="8" class="sheet-header">${escapeHtml(titleText)}</td></tr>
      <tr><td colspan="8" class="sheet-meta">${escapeHtml(metaText)}</td></tr>
    `;
  }

  return `
    <tr>
      <td rowspan="2" class="sheet-brand-logo-cell">
        <img
          src="${escapeHtml(model.logoSrc)}"
          alt="${escapeHtml(`Logo de ${model.empresaNome}`)}"
          class="sheet-brand-logo"
        />
      </td>
      <td colspan="7" class="sheet-header">${escapeHtml(titleText)}</td>
    </tr>
    <tr>
      <td colspan="7" class="sheet-meta">${escapeHtml(metaText)}</td>
    </tr>
  `;
}


export function createReportExportModel({
  empresaNome,
  empresaLogoUrl,
  relatorioMensal,
  relatorioReposicao,
  diasBase,
}) {
  const geradoEm = DATE_TIME_FORMATTER.format(new Date());
  const periodo = relatorioMensal?.referencia?.label || "Período atual";
  const nomeBase = sanitizeFileName(`${empresaNome || "estoque"}-${periodo}`);
  const resumoMensal = relatorioMensal?.resumo || {};
  const itensReposicao = relatorioReposicao?.itens || [];
  const movimentacoesPorDia = (relatorioMensal?.movimentacoes_por_dia || []).filter(
    (dia) => dia.entradas || dia.saidas,
  );
  const topSaidas = relatorioMensal?.top_saidas || [];

  return {
    empresaNome: empresaNome || "EstoquePro",
    logoUrl: empresaLogoUrl || null,
    titulo: "Relatório mensal de estoque",
    periodo,
    baseDias: String(diasBase),
    geradoEm,
    nomeArquivoBase: nomeBase || "relatorio-mensal",
    resumo: [
      {
        label: "Entradas",
        value: String(resumoMensal.entradas_unidades ?? 0),
        observacao: periodo,
      },
      {
        label: "Saídas",
        value: String(resumoMensal.saidas_unidades ?? 0),
        observacao: `${resumoMensal.movimentacoes ?? 0} movimentos`,
      },
      {
        label: "Pedidos",
        value: String(resumoMensal.pedidos_finalizados ?? 0),
        observacao: "Finalizados no mês",
      },
      {
        label: "Faturamento",
        value: formatCurrency(resumoMensal.faturamento_estimado ?? 0),
        observacao: "Estimado",
      },
    ],
    tabelas: [
      {
        titulo: "Movimento do mês",
        subtitulo: periodo,
        colunas: ["Dia", "Entradas", "Saídas"],
        alinhamentos: ["left", "right", "right"],
        proporcoes: [0.42, 0.29, 0.29],
        linhas: movimentacoesPorDia.length
          ? movimentacoesPorDia.map((dia) => ({
              values: [dia.label, String(dia.entradas), String(dia.saidas)],
            }))
          : buildEmptyRows("Sem movimentos no período.", 3),
      },
      {
        titulo: "Mais saídas",
        subtitulo: "Produtos com maior giro no período",
        colunas: ["Produto", "SKU", "Qtd"],
        alinhamentos: ["left", "left", "right"],
        proporcoes: [0.5, 0.3, 0.2],
        linhas: topSaidas.length
          ? topSaidas.map((item) => ({
              values: [item.nome, item.sku, String(item.quantidade)],
            }))
          : buildEmptyRows("Sem saídas no período.", 3),
      },
      {
        titulo: "Pedido sugerido",
        subtitulo: `Base dos últimos ${diasBase} dias`,
        destaque: formatCurrency(relatorioReposicao?.resumo?.valor_total_estimado || 0),
        colunas: [
          "Produto",
          "SKU",
          "Fornecedor",
          "Atual",
          "Mínimo",
          "Saída",
          "Pedir",
          "Status",
        ],
        alinhamentos: ["left", "left", "left", "right", "right", "right", "right", "left"],
        proporcoes: [0.22, 0.12, 0.2, 0.08, 0.08, 0.08, 0.1, 0.12],
        linhas: itensReposicao.length
          ? itensReposicao.map((item) => ({
              values: [
                item.nome,
                item.sku,
                item.fornecedor_nome || "-",
                String(item.estoque_atual),
                String(item.estoque_minimo),
                String(item.saida_recente),
                String(item.sugestao_pedido),
                item.status === "urgente" ? "Urgente" : "Atenção",
              ],
            }))
          : buildEmptyRows("Nenhum item precisa de reposição no momento.", 8),
      },
    ],
  };
}


function buildSpreadsheetHtmlWithBranding(model, { includePdfHint = false } = {}) {
  const resumoRows = model.resumo
    .map((item) => (
      `<tr><td>${escapeHtml(item.label)}</td><td>${escapeHtml(item.value)}</td><td>${escapeHtml(item.observacao)}</td></tr>`
    ))
    .join("");

  const tableSections = model.tabelas.map((tabela) => {
    const headers = tabela.colunas.map((coluna) => `<th>${escapeHtml(coluna)}</th>`).join("");
    const rows = tabela.linhas.map((linha) => {
      if (linha.isEmpty) {
        return `<tr><td colspan="${linha.colSpan}">${escapeHtml(linha.values[0])}</td></tr>`;
      }

      return `<tr>${linha.values.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`;
    }).join("");

    return `
      <section class="sheet-section">
        <div class="sheet-section__header">
          <div>
            <h2>${escapeHtml(tabela.titulo)}</h2>
            <p>${escapeHtml(tabela.subtitulo || "")}</p>
          </div>
          ${tabela.destaque ? `<strong>${escapeHtml(tabela.destaque)}</strong>` : ""}
        </div>
        <table class="sheet-table">
          <thead>
            <tr>${headers}</tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </section>
    `;
  }).join("");

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(model.empresaNome)} | ${escapeHtml(model.titulo)}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            background: #f4f5f7;
            color: #111827;
            font-family: "Segoe UI", Arial, sans-serif;
            margin: 0;
            padding: 24px;
          }

          .sheet-toolbar {
            align-items: center;
            display: flex;
            gap: 12px;
            justify-content: space-between;
            margin-bottom: 18px;
          }

          .sheet-toolbar__hint {
            color: #4b5563;
            font-size: 13px;
          }

          .sheet-toolbar__actions {
            display: flex;
            gap: 8px;
          }

          .sheet-toolbar button {
            background: #111827;
            border: 0;
            border-radius: 999px;
            color: #fff;
            cursor: pointer;
            font-size: 13px;
            font-weight: 700;
            padding: 10px 16px;
          }

          .sheet {
            background: #fff;
            border: 1px solid #d1d5db;
            padding: 20px;
          }

          .sheet-header {
            border-bottom: 2px solid #111827;
            margin-bottom: 16px;
            padding-bottom: 14px;
          }

          .sheet-brand {
            align-items: center;
            display: flex;
            gap: 18px;
          }

          .sheet-brand__logo-wrap {
            align-items: center;
            border: 1px solid #d8e1eb;
            border-radius: 18px;
            display: flex;
            flex: 0 0 96px;
            height: 96px;
            justify-content: center;
            overflow: hidden;
            padding: 10px;
          }

          .sheet-brand__logo {
            display: block;
            max-height: 100%;
            max-width: 100%;
            object-fit: contain;
          }

          .sheet-brand__content {
            flex: 1;
            min-width: 0;
          }

          .sheet-header h1 {
            font-size: 24px;
            margin: 0 0 6px;
          }

          .sheet-header p {
            color: #4b5563;
            margin: 0;
          }

          .sheet-section {
            margin-top: 18px;
          }

          .sheet-section__header {
            align-items: end;
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 8px;
          }

          .sheet-section__header h2 {
            font-size: 18px;
            margin: 0 0 4px;
          }

          .sheet-section__header p {
            color: #6b7280;
            margin: 0;
          }

          .sheet-table {
            border-collapse: collapse;
            width: 100%;
          }

          .sheet-table th,
          .sheet-table td {
            border: 1px solid #111827;
            font-size: 12px;
            padding: 7px 8px;
            text-align: left;
            vertical-align: top;
          }

          .sheet-table th {
            background: #eef2f7;
            font-weight: 800;
          }

          .sheet-table tbody tr:nth-child(even) td {
            background: #f9fafb;
          }

          @media print {
            body {
              background: #fff;
              padding: 0;
            }

            .sheet-toolbar {
              display: none !important;
            }

            .sheet {
              border: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="sheet-toolbar">
          <div class="sheet-toolbar__hint">
            ${includePdfHint ? "Selecione “Salvar em PDF” no destino da impressão." : "Visual de impressão em formato de planilha."}
          </div>
          <div class="sheet-toolbar__actions">
            <button type="button" onclick="window.print()">Imprimir</button>
            <button type="button" onclick="window.close()">Fechar</button>
          </div>
        </div>

        <main class="sheet">
          <header class="sheet-header">
            <h1>${escapeHtml(model.empresaNome)} • ${escapeHtml(model.titulo)}</h1>
            <p>${escapeHtml(model.periodo)} • Base do pedido: últimos ${escapeHtml(model.baseDias)} dias • Gerado em ${escapeHtml(model.geradoEm)}</p>
          </header>

          <section class="sheet-section">
            <div class="sheet-section__header">
              <div>
                <h2>Resumo</h2>
                <p>Indicadores principais do período</p>
              </div>
            </div>
            <table class="sheet-table">
              <thead>
                <tr>
                  <th>Indicador</th>
                  <th>Valor</th>
                  <th>Observação</th>
                </tr>
              </thead>
              <tbody>
                ${resumoRows}
              </tbody>
            </table>
          </section>

          ${tableSections}
        </main>
      </body>
    </html>
  `;
}


function buildExcelHtmlWithBranding(model) {
  const resumoRows = model.resumo
    .map((item) => (
      `<tr><td>${escapeHtml(item.label)}</td><td>${escapeHtml(item.value)}</td><td>${escapeHtml(item.observacao)}</td></tr>`
    ))
    .join("");

  const tableSections = model.tabelas.map((tabela) => {
    const headers = tabela.colunas.map((coluna) => `<th>${escapeHtml(coluna)}</th>`).join("");
    const rows = tabela.linhas.map((linha) => {
      if (linha.isEmpty) {
        return `<tr><td colspan="${linha.colSpan}">${escapeHtml(linha.values[0])}</td></tr>`;
      }

      return `<tr>${linha.values.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`;
    }).join("");

    return `
      <tr><td colspan="8" class="sheet-gap"></td></tr>
      <tr><td colspan="8" class="sheet-title">${escapeHtml(tabela.titulo)}</td></tr>
      <tr><td colspan="8" class="sheet-subtitle">${escapeHtml(tabela.subtitulo || "")}</td></tr>
      ${tabela.destaque ? `<tr><td colspan="8" class="sheet-highlight">${escapeHtml(tabela.destaque)}</td></tr>` : ""}
      <tr>${headers}</tr>
      ${rows}
    `;
  }).join("");

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Relatorio</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
        <![endif]-->
        <style>
          body {
            font-family: Arial, sans-serif;
          }

          table {
            border-collapse: collapse;
            width: 100%;
          }

          th,
          td {
            border: 1px solid #2f3a4a;
            padding: 6px 8px;
            vertical-align: top;
          }

          th {
            background: #e9eef5;
            font-weight: 700;
            text-align: left;
          }

          .sheet-header {
            border: none;
            font-size: 18pt;
            font-weight: 700;
          }

          .sheet-meta {
            border: none;
            color: #4b5563;
          }

          .sheet-title {
            background: #f4f7fb;
            font-size: 14pt;
            font-weight: 700;
          }

          .sheet-subtitle {
            color: #6b7280;
          }

          .sheet-highlight {
            font-weight: 700;
            text-align: right;
          }

          .sheet-gap {
            border: none;
            height: 12px;
          }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="8" class="sheet-header">${escapeHtml(model.empresaNome)} - ${escapeHtml(model.titulo)}</td></tr>
          <tr><td colspan="8" class="sheet-meta">${escapeHtml(model.periodo)} | Base do pedido: ultimos ${escapeHtml(model.baseDias)} dias | Gerado em ${escapeHtml(model.geradoEm)}</td></tr>
          <tr><td colspan="8" class="sheet-gap"></td></tr>
          <tr><td colspan="8" class="sheet-title">Resumo</td></tr>
          <tr><th>Indicador</th><th>Valor</th><th>Observacao</th><th colspan="5"></th></tr>
          ${resumoRows}
          ${tableSections}
        </table>
      </body>
    </html>
  `;
}


function openReportWindowWithAssetSync(html, { autoPrint = false } = {}) {
  const popup = window.open("", "_blank", "noopener,noreferrer");

  if (!popup) {
    throw new Error("O navegador bloqueou a janela de impressão do relatório.");
  }

  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();

  if (autoPrint) {
    window.setTimeout(() => {
      popup.focus();
      popup.print();
    }, 250);
  }
}


const _LEGACY_EXPORT_FUNCTIONS = {
  buildSpreadsheetHtml,
  buildExcelHtml,
  openReportWindow,
};
void _LEGACY_EXPORT_FUNCTIONS;


export function printReportSpreadsheet(model) {
  const html = buildSpreadsheetHtmlWithBranding(model);
  openReportWindowWithAssetSync(html, { autoPrint: true });
}


export function exportReportPdf(model) {
  const html = buildSpreadsheetHtmlWithBranding(model, { includePdfHint: true });
  openReportWindowWithAssetSync(html, { autoPrint: true });
}


export async function exportReportExcel(model) {
  const html = buildExcelHtmlWithBranding({
    ...model,
    logoSrc: await resolveExportLogoSource(model.logoUrl),
  });
  downloadBlob(
    new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" }),
    `${model.nomeArquivoBase}.xls`,
  );
}


function buildSpreadsheetHtml(model, { includePdfHint = false } = {}) {
  const preparedModel = {
    ...model,
    logoSrc: model.logoSrc || model.logoUrl || null,
  };
  const resumoRows = preparedModel.resumo
    .map((item) => (
      `<tr><td>${escapeHtml(item.label)}</td><td>${escapeHtml(item.value)}</td><td>${escapeHtml(item.observacao)}</td></tr>`
    ))
    .join("");

  const tableSections = preparedModel.tabelas.map((tabela) => {
    const headers = tabela.colunas.map((coluna) => `<th>${escapeHtml(coluna)}</th>`).join("");
    const rows = tabela.linhas.map((linha) => {
      if (linha.isEmpty) {
        return `<tr><td colspan="${linha.colSpan}">${escapeHtml(linha.values[0])}</td></tr>`;
      }

      return `<tr>${linha.values.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`;
    }).join("");

    return `
      <section class="sheet-section">
        <div class="sheet-section__header">
          <div>
            <h2>${escapeHtml(tabela.titulo)}</h2>
            <p>${escapeHtml(tabela.subtitulo || "")}</p>
          </div>
          ${tabela.destaque ? `<strong>${escapeHtml(tabela.destaque)}</strong>` : ""}
        </div>
        <table class="sheet-table">
          <thead>
            <tr>${headers}</tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </section>
    `;
  }).join("");

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(preparedModel.empresaNome)} | ${escapeHtml(preparedModel.titulo)}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            background: #f4f5f7;
            color: #111827;
            font-family: "Segoe UI", Arial, sans-serif;
            margin: 0;
            padding: 24px;
          }

          .sheet-toolbar {
            align-items: center;
            display: flex;
            gap: 12px;
            justify-content: space-between;
            margin-bottom: 18px;
          }

          .sheet-toolbar__hint {
            color: #4b5563;
            font-size: 13px;
          }

          .sheet-toolbar__actions {
            display: flex;
            gap: 8px;
          }

          .sheet-toolbar button {
            background: #111827;
            border: 0;
            border-radius: 999px;
            color: #fff;
            cursor: pointer;
            font-size: 13px;
            font-weight: 700;
            padding: 10px 16px;
          }

          .sheet {
            background: #fff;
            border: 1px solid #d1d5db;
            padding: 20px;
          }

          .sheet-header {
            border-bottom: 2px solid #111827;
            margin-bottom: 16px;
            padding-bottom: 14px;
          }

          .sheet-brand {
            align-items: center;
            display: flex;
            gap: 18px;
          }

          .sheet-brand__logo-wrap {
            align-items: center;
            border: 1px solid #d8e1eb;
            border-radius: 18px;
            display: flex;
            flex: 0 0 96px;
            height: 96px;
            justify-content: center;
            overflow: hidden;
            padding: 10px;
          }

          .sheet-brand__logo {
            display: block;
            max-height: 100%;
            max-width: 100%;
            object-fit: contain;
          }

          .sheet-brand__content {
            flex: 1;
            min-width: 0;
          }

          .sheet-header h1 {
            font-size: 24px;
            margin: 0 0 6px;
          }

          .sheet-header p {
            color: #4b5563;
            margin: 0;
          }

          .sheet-section {
            margin-top: 18px;
          }

          .sheet-section__header {
            align-items: end;
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 8px;
          }

          .sheet-section__header h2 {
            font-size: 18px;
            margin: 0 0 4px;
          }

          .sheet-section__header p {
            color: #6b7280;
            margin: 0;
          }

          .sheet-table {
            border-collapse: collapse;
            width: 100%;
          }

          .sheet-table th,
          .sheet-table td {
            border: 1px solid #111827;
            font-size: 12px;
            padding: 7px 8px;
            text-align: left;
            vertical-align: top;
          }

          .sheet-table th {
            background: #eef2f7;
            font-weight: 800;
          }

          .sheet-table tbody tr:nth-child(even) td {
            background: #f9fafb;
          }

          @media print {
            body {
              background: #fff;
              padding: 0;
            }

            .sheet-toolbar {
              display: none !important;
            }

            .sheet {
              border: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="sheet-toolbar">
          <div class="sheet-toolbar__hint">
            ${includePdfHint ? "Selecione “Salvar em PDF” no destino da impressão." : "Visual de impressão em formato de planilha."}
          </div>
          <div class="sheet-toolbar__actions">
            <button type="button" onclick="window.print()">Imprimir</button>
            <button type="button" onclick="window.close()">Fechar</button>
          </div>
        </div>

        <main class="sheet">
          ${buildSpreadsheetHeader(preparedModel)}

          <section class="sheet-section">
            <div class="sheet-section__header">
              <div>
                <h2>Resumo</h2>
                <p>Indicadores principais do período</p>
              </div>
            </div>
            <table class="sheet-table">
              <thead>
                <tr>
                  <th>Indicador</th>
                  <th>Valor</th>
                  <th>Observação</th>
                </tr>
              </thead>
              <tbody>
                ${resumoRows}
              </tbody>
            </table>
          </section>

          ${tableSections}
        </main>
      </body>
    </html>
  `;
}


function buildExcelHtml(model) {
  const preparedModel = {
    ...model,
    logoSrc: model.logoSrc || model.logoUrl || null,
  };
  const resumoRows = preparedModel.resumo
    .map((item) => (
      `<tr><td>${escapeHtml(item.label)}</td><td>${escapeHtml(item.value)}</td><td>${escapeHtml(item.observacao)}</td></tr>`
    ))
    .join("");

  const tableSections = preparedModel.tabelas.map((tabela) => {
    const headers = tabela.colunas.map((coluna) => `<th>${escapeHtml(coluna)}</th>`).join("");
    const rows = tabela.linhas.map((linha) => {
      if (linha.isEmpty) {
        return `<tr><td colspan="${linha.colSpan}">${escapeHtml(linha.values[0])}</td></tr>`;
      }

      return `<tr>${linha.values.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`;
    }).join("");

    return `
      <tr><td colspan="8" class="sheet-gap"></td></tr>
      <tr><td colspan="8" class="sheet-title">${escapeHtml(tabela.titulo)}</td></tr>
      <tr><td colspan="8" class="sheet-subtitle">${escapeHtml(tabela.subtitulo || "")}</td></tr>
      ${tabela.destaque ? `<tr><td colspan="8" class="sheet-highlight">${escapeHtml(tabela.destaque)}</td></tr>` : ""}
      <tr>${headers}</tr>
      ${rows}
    `;
  }).join("");

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Relatorio</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
        <![endif]-->
        <style>
          body {
            font-family: Arial, sans-serif;
          }

          table {
            border-collapse: collapse;
            width: 100%;
          }

          th,
          td {
            border: 1px solid #2f3a4a;
            padding: 6px 8px;
            vertical-align: top;
          }

          th {
            background: #e9eef5;
            font-weight: 700;
            text-align: left;
          }

          .sheet-header {
            border: none;
            font-size: 18pt;
            font-weight: 700;
          }

          .sheet-meta {
            border: none;
            color: #4b5563;
          }

          .sheet-title {
            background: #f4f7fb;
            font-size: 14pt;
            font-weight: 700;
          }

          .sheet-subtitle {
            color: #6b7280;
          }

          .sheet-highlight {
            font-weight: 700;
            text-align: right;
          }

          .sheet-gap {
            border: none;
            height: 12px;
          }

          .sheet-brand-logo-cell {
            border: none;
            text-align: center;
            vertical-align: middle;
            width: 110px;
          }

          .sheet-brand-logo {
            display: block;
            height: auto;
            margin: 0 auto;
            max-height: 88px;
            max-width: 88px;
          }
        </style>
      </head>
      <body>
        <table>
          ${buildExcelHeaderRows(preparedModel)}
          <tr><td colspan="8" class="sheet-gap"></td></tr>
          <tr><td colspan="8" class="sheet-title">Resumo</td></tr>
          <tr><th>Indicador</th><th>Valor</th><th>Observação</th><th colspan="5"></th></tr>
          ${resumoRows}
          ${tableSections}
        </table>
      </body>
    </html>
  `;
}


function waitForPopupAssets(popup) {
  const images = [...popup.document.images];

  if (!images.length) {
    return Promise.resolve();
  }

  return Promise.all(
    images.map((image) => {
      if (image.complete) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    }),
  );
}


function openReportWindow(html, { autoPrint = false } = {}) {
  const popup = window.open("", "_blank", "noopener,noreferrer");

  if (!popup) {
    throw new Error("O navegador bloqueou a janela de impressão do relatório.");
  }

  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();

  if (autoPrint) {
    waitForPopupAssets(popup).finally(() => {
      window.setTimeout(() => {
        popup.focus();
        popup.print();
      }, 250);
    });
  }
}


function buildSvgMarkup(model) {
  const headerHeight = 88;
  const summaryHeight = 120;
  const tableTitleHeight = 26;
  const tableHeaderHeight = 38;
  const tableRowHeight = 34;
  const sectionGap = 30;
  const innerWidth = SVG_WIDTH - SVG_PADDING * 2;
  const tableHeights = model.tabelas.map(
    (tabela) => tableTitleHeight + tableHeaderHeight + Math.max(1, tabela.linhas.length) * tableRowHeight + 20,
  );
  const svgHeight =
    SVG_PADDING * 2 +
    headerHeight +
    summaryHeight +
    tableHeights.reduce((sum, height) => sum + height + sectionGap, 0);

  const summaryCardWidth = (innerWidth - 24) / 4;
  const summaryMarkup = model.resumo.map((item, index) => {
    const x = SVG_PADDING + index * (summaryCardWidth + 8);
    const y = SVG_PADDING + headerHeight;
    return `
      <rect x="${x}" y="${y}" width="${summaryCardWidth}" height="92" rx="16" fill="#f8fafc" stroke="#d5dde7" />
      <text x="${x + 18}" y="${y + 26}" font-size="16" font-weight="700" fill="#4b5563">${escapeXml(item.label)}</text>
      <text x="${x + 18}" y="${y + 56}" font-size="26" font-weight="800" fill="#111827">${escapeXml(item.value)}</text>
      <text x="${x + 18}" y="${y + 78}" font-size="13" fill="#6b7280">${escapeXml(item.observacao)}</text>
    `;
  }).join("");

  let currentY = SVG_PADDING + headerHeight + summaryHeight;
  const sectionMarkup = model.tabelas.map((tabela) => {
    const titleY = currentY;
    const tableY = titleY + tableTitleHeight;
    const ratios = tabela.proporcoes;
    const rows = tabela.linhas;
    let columnX = SVG_PADDING;

    const headerCells = tabela.colunas.map((coluna, index) => {
      const cellWidth = innerWidth * ratios[index];
      const markup = `
        <rect x="${columnX}" y="${tableY}" width="${cellWidth}" height="${tableHeaderHeight}" fill="#e9eef5" stroke="#c8d2de" />
        <text x="${columnX + 10}" y="${tableY + 24}" font-size="14" font-weight="700" fill="#111827">${escapeXml(truncateText(coluna, cellWidth))}</text>
      `;
      columnX += cellWidth;
      return markup;
    }).join("");

    const rowMarkup = rows.map((linha, rowIndex) => {
      const rowY = tableY + tableHeaderHeight + rowIndex * tableRowHeight;

      if (linha.isEmpty) {
        return `
          <rect x="${SVG_PADDING}" y="${rowY}" width="${innerWidth}" height="${tableRowHeight}" fill="#ffffff" stroke="#d7dee7" />
          <text x="${SVG_PADDING + 10}" y="${rowY + 22}" font-size="13" fill="#6b7280">${escapeXml(linha.values[0])}</text>
        `;
      }

      let cellX = SVG_PADDING;
      return linha.values.map((value, index) => {
        const cellWidth = innerWidth * ratios[index];
        const alignment = tabela.alinhamentos?.[index] || "left";
        const text = truncateText(value, cellWidth);
        const textX = alignment === "right" ? cellX + cellWidth - 10 : cellX + 10;
        const textAnchor = alignment === "right" ? "end" : "start";
        const fill = rowIndex % 2 === 0 ? "#ffffff" : "#f8fafc";
        const markup = `
          <rect x="${cellX}" y="${rowY}" width="${cellWidth}" height="${tableRowHeight}" fill="${fill}" stroke="#d7dee7" />
          <text x="${textX}" y="${rowY + 22}" font-size="13" text-anchor="${textAnchor}" fill="#1f2937">${escapeXml(text)}</text>
        `;
        cellX += cellWidth;
        return markup;
      }).join("");
    }).join("");

    const markup = `
      <text x="${SVG_PADDING}" y="${titleY}" font-size="24" font-weight="800" fill="#111827">${escapeXml(tabela.titulo)}</text>
      <text x="${SVG_PADDING}" y="${titleY + 18}" font-size="13" fill="#6b7280">${escapeXml(tabela.subtitulo || "")}</text>
      ${tabela.destaque ? `<text x="${SVG_WIDTH - SVG_PADDING}" y="${titleY + 10}" text-anchor="end" font-size="18" font-weight="800" fill="#111827">${escapeXml(tabela.destaque)}</text>` : ""}
      ${headerCells}
      ${rowMarkup}
    `;

    currentY += tableTitleHeight + tableHeaderHeight + Math.max(1, rows.length) * tableRowHeight + sectionGap;
    return markup;
  }).join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${svgHeight}" viewBox="0 0 ${SVG_WIDTH} ${svgHeight}">
      <rect width="100%" height="100%" fill="#ffffff" />
      <text x="${SVG_PADDING}" y="${SVG_PADDING}" font-size="32" font-weight="800" fill="#111827">${escapeXml(model.empresaNome)}</text>
      <text x="${SVG_PADDING}" y="${SVG_PADDING + 34}" font-size="22" font-weight="700" fill="#111827">${escapeXml(model.titulo)}</text>
      <text x="${SVG_PADDING}" y="${SVG_PADDING + 58}" font-size="15" fill="#4b5563">${escapeXml(model.periodo)} • Base do pedido: últimos ${escapeXml(model.baseDias)} dias • Gerado em ${escapeXml(model.geradoEm)}</text>
      ${summaryMarkup}
      ${sectionMarkup}
    </svg>
  `.trim();

  return {
    svg,
    width: SVG_WIDTH,
    height: svgHeight,
  };
}


export function exportReportSvg(model) {
  const { svg } = buildSvgMarkup(model);
  downloadBlob(
    new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
    `${model.nomeArquivoBase}.svg`,
  );
}


async function renderSvgToCanvas({
  svgMarkup,
  width,
  height,
}: {
  svgMarkup: string;
  width: number;
  height: number;
}) {
  const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Não foi possível renderizar o SVG do relatório."));
      element.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Não foi possível preparar o canvas do relatório.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}


async function canvasToJpegBytes(canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("Não foi possível gerar a imagem do PDF."))),
      "image/jpeg",
      0.92,
    );
  });

  return new Uint8Array(await blob.arrayBuffer());
}


function buildPdfFromImages(images) {
  const objects = [null];
  const pageReferences = [];
  let objectId = 3;

  images.forEach((image, index) => {
    const imageId = objectId;
    const contentId = objectId + 1;
    const pageId = objectId + 2;
    const contentBytes = encodeAscii(
      `q\n${PDF_PAGE.width} 0 0 ${PDF_PAGE.height} 0 0 cm\n/Im${index + 1} Do\nQ`,
    );

    objects[imageId] = joinUint8Arrays([
      encodeAscii(
        `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`,
      ),
      image.bytes,
      encodeAscii("\nendstream"),
    ]);

    objects[contentId] = joinUint8Arrays([
      encodeAscii(`<< /Length ${contentBytes.length} >>\nstream\n`),
      contentBytes,
      encodeAscii("\nendstream"),
    ]);

    objects[pageId] = encodeAscii(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_PAGE.width} ${PDF_PAGE.height}] /Resources << /ProcSet [/PDF /ImageC] /XObject << /Im${index + 1} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );

    pageReferences.push(`${pageId} 0 R`);
    objectId += 3;
  });

  objects[1] = encodeAscii("<< /Type /Catalog /Pages 2 0 R >>");
  objects[2] = encodeAscii(
    `<< /Type /Pages /Count ${images.length} /Kids [${pageReferences.join(" ")}] >>`,
  );

  const parts = [new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52, 10, 37, 226, 227, 207, 211, 10])];
  const offsets = [0];
  let currentOffset = parts[0].length;

  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = currentOffset;
    const prefix = encodeAscii(`${index} 0 obj\n`);
    const suffix = encodeAscii("\nendobj\n");
    parts.push(prefix, objects[index], suffix);
    currentOffset += prefix.length + objects[index].length + suffix.length;
  }

  const xrefOffset = currentOffset;
  const xrefHeader = encodeAscii(`xref\n0 ${objects.length}\n`);
  const xrefRows = [encodeAscii("0000000000 65535 f \n")];

  for (let index = 1; index < objects.length; index += 1) {
    xrefRows.push(encodeAscii(`${String(offsets[index]).padStart(10, "0")} 00000 n \n`));
  }

  const trailer = encodeAscii(
    `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  );

  return new Blob([...parts, xrefHeader, ...xrefRows, trailer], {
    type: "application/pdf",
  });
}


export async function exportReportPdfFile(model) {
  const { svg, width, height } = buildSvgMarkup(model);
  const sourceCanvas = await renderSvgToCanvas({
    svgMarkup: svg,
    width,
    height,
  });
  const pagePixelHeight = Math.round(width * (PDF_PAGE.height / PDF_PAGE.width));
  const pageImages = [];

  for (let offsetY = 0; offsetY < height; offsetY += pagePixelHeight) {
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = width;
    pageCanvas.height = pagePixelHeight;
    const context = pageCanvas.getContext("2d");

    if (!context) {
      throw new Error("Não foi possível preparar a página do PDF.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    context.drawImage(
      sourceCanvas,
      0,
      offsetY,
      width,
      Math.min(pagePixelHeight, height - offsetY),
      0,
      0,
      width,
      Math.min(pagePixelHeight, height - offsetY),
    );

    pageImages.push({
      width: pageCanvas.width,
      height: pageCanvas.height,
      bytes: await canvasToJpegBytes(pageCanvas),
    });
  }

  downloadBlob(buildPdfFromImages(pageImages), `${model.nomeArquivoBase}.pdf`);
}


export function buildReportTextSnapshot(model) {
  const lines = [
    `${model.empresaNome} - ${model.titulo}`,
    `${model.periodo} | Gerado em ${model.geradoEm}`,
    "",
    "RESUMO",
    ...model.resumo.map((item) => (
      `${padCell(item.label, 18)} ${padCell(item.value, 18, "right")} ${item.observacao}`
    )),
    "",
  ];

  model.tabelas.forEach((tabela) => {
    lines.push(tabela.titulo.toUpperCase());
    if (tabela.subtitulo) {
      lines.push(tabela.subtitulo);
    }

    const widths = tabela.colunas.map((coluna) => Math.max(10, coluna.length + 4));
    lines.push(
      tabela.colunas.map((coluna, index) => padCell(coluna, widths[index])).join(" | "),
    );

    tabela.linhas.forEach((linha) => {
      if (linha.isEmpty) {
        lines.push(linha.values[0]);
        return;
      }

      lines.push(
        linha.values.map((value, index) => padCell(value, widths[index], tabela.alinhamentos?.[index])).join(" | "),
      );
    });

    lines.push("");
  });

  return lines.join("\n");
}
