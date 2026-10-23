import ExcelJS from "exceljs"

export type RegistroApi = {
  empresa: { nome: string; identificador: string }
  cliente: string
  projeto: string
  atividade: string
  data: string
  qtd_horas_decimal: number
  descricao: string
  colaborador: string
  ticket_referencia: string
  tipo_atividade: string
  horaInicio: string
  horaFim: string
}

type DiaTrabalhado = { 
  horas: number; 
  obs: string[];
  entrada: string
  saidaAlmoco: string
  retornoAlmoco: string
  saida: string
}


const TEMPLATE_URL = "/SINOSBYTE-TEMPLATE-Vazio.xlsx" // arquivo dentro de public/
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

// Auxiliar para copiar estilo de uma célula para outra (preserva bordas, fontes, alinhamentos e formatos)
function copiarEstiloCelula(celulaOrigem: ExcelJS.Cell, celulaDestino: ExcelJS.Cell) {
  if (celulaOrigem.style) {
    celulaDestino.style = JSON.parse(JSON.stringify(celulaOrigem.style));
  }
}

const format = (v: string) => {
          if (!v) return "--:--"
          const d = new Date(v)
          return `${d.getUTCHours().toString().padStart(2, "0")}:${d
            .getUTCMinutes()
            .toString()
            .padStart(2, "0")}`
        }

function agruparPorColaborador(
  registros: RegistroApi[],
  mes: number,
  ano: number
) {
  const mapa = new Map<string, Map<number, DiaTrabalhado>>()

  for (const r of registros) {
    if (!r.data) continue

    const partes = r.data.includes("-") ? r.data.split("-") : r.data.split("/")
    let dia: number, m: number, a: number

    if (r.data.includes("-")) {
      [a, m, dia] = partes.map(Number)
    } else {
      [dia, m, a] = partes.map(Number)
    }

    if (m !== mes || a !== ano) continue

    const colabNome = r.colaborador || "Não informado"
    const porDia = mapa.get(colabNome) ?? new Map<number, DiaTrabalhado>()
    const item = porDia.get(dia) ?? {
      horas: 0,
      entrada: "",
      saidaAlmoco: "",
      retornoAlmoco: "",
      saida: "",
      obs: [],
    }

    item.horas += Number(r.qtd_horas_decimal) || 0

    const hInicio = format(r.horaInicio)
    const hFim = format(r.horaFim)

    // Se a entrada ainda não foi preenchida, é o 1º lançamento (Turno Manhã)
    if (!item.entrada) {
      item.entrada = hInicio
      item.saidaAlmoco = hFim
    } else {
      // Se a entrada já existe, é o 2º lançamento (Turno Tarde)
      item.retornoAlmoco = hInicio
      item.saida = hFim
    }

    if (r.descricao || r.atividade) {
      const descFormatada = r.descricao ? `${r.atividade} — ${r.descricao}` : r.atividade
      if (!item.obs.includes(descFormatada)) {
        item.obs.push(descFormatada)
      }
    }

    porDia.set(dia, item)
    mapa.set(colabNome, porDia)
  }

  return mapa
}


export async function RelatorioExcel(
  template: ArrayBuffer,
  registros: RegistroApi[],
  mes: number,
  ano: number
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(template)

  const wsConsolidado = workbook.getWorksheet("Consolidado")
  
  const dadosPorColab = agruparPorColaborador(registros, mes, ano)
  const nomes = [...dadosPorColab.keys()].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  )
  if (nomes.length === 0) {
    throw new Error("Nenhum registro do mês selecionado.")
  }

  const empresa = (registros[0]?.empresa.nome ?? "").toUpperCase()

  if (wsConsolidado) {
    wsConsolidado.getCell("B4").value = mes
    wsConsolidado.getCell("E4").value = ano

    wsConsolidado.getCell("H10").value = ""
    wsConsolidado.getCell("I10").value = ""
    wsConsolidado.getCell("J10").value = ""
    wsConsolidado.getCell("K10").value = ""

    nomes.forEach((nome, i) => {
      const rowNum = 9 + i;
      const linhaModelo = wsConsolidado.getRow(9);
      const linhaAtual = wsConsolidado.getRow(rowNum);

      linhaAtual.getCell("A").value = nome;
      linhaAtual.getCell("B").value = "desenvolvedor";
      linhaAtual.getCell("C").value = "Senior";
      linhaAtual.getCell("D").value = empresa;
      linhaAtual.getCell("E").value = "squad";
      linhaAtual.getCell("F").value = "Fulano";
      linhaAtual.getCell("G").value = "100%";
      linhaAtual.getCell("H").value = 100;

      // Mantém a fórmula que puxa o total de horas da aba do colaborador correspondente (ex: 'Lucas Moraes'!H40)
      linhaAtual.getCell("I").value = { formula: `'${nome}'!G40` };
      linhaAtual.getCell("J").value = { formula: `H${rowNum}*I${rowNum}` };
      linhaAtual.getCell("K").value = { formula: `$H$4` };

      linhaAtual.eachCell({includeEmpty: true }, (celulaAlvo, colNumber) => {
        const celulamodelo = linhaModelo.getCell(colNumber);
        copiarEstiloCelula(celulamodelo, celulaAlvo)
      })
    });

    const totalRowIndex = 9 + nomes.length;
    const linhaTotal = wsConsolidado.getRow(totalRowIndex);
    linhaTotal.getCell("H").value = "TOTAL GERAL";
    linhaTotal.getCell("J").value = { formula: `SUM(J9:J${totalRowIndex - 1})` };
    linhaTotal.font = { bold: true };

  }

  const abaModelo = workbook.getWorksheet(2);

  nomes.forEach((nome, i) => {
    let wsPonto = workbook.getWorksheet(nome);

    if (!wsPonto && abaModelo) {
      wsPonto = workbook.addWorksheet(nome);
      
      abaModelo.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        const newRow = wsPonto!.getRow(rowNumber);
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const newCell = newRow.getCell(colNumber);
          newCell.value = cell.value;
          copiarEstiloCelula(cell, newCell);
        });
      });

      abaModelo.columns?.forEach((col, i) => {
        if (wsPonto!.getColumn(i + 1)) {
          wsPonto!.getColumn(i + 1).width = col.width;
        }
      });
    }

    if (wsPonto) {
      wsPonto.mergeCells("A1:H1");
      wsPonto.mergeCells("A2:H2");

      wsPonto.getCell("A1").value = { formula: `"REGISTRO DE PONTO — ${nome} — ${empresa} — " & Consolidado!$H$4 & "/" & Consolidado!$E$4` };
    
      wsPonto.getCell("B4").value = nome;
      wsPonto.getCell("E4").value = "senior";
      wsPonto.getCell("H4").value = empresa;
      wsPonto.getCell("B5").value = "aquad";
      wsPonto.getCell("E5").value = 100;

      const mapaPonto = dadosPorColab.get(nome)
      if (mapaPonto) {
        for (const [dia, { entrada, saidaAlmoco, retornoAlmoco, saida, horas, obs }] of mapaPonto) {
          const linha = wsPonto.getRow(7 + dia)

          linha.getCell("C").value = retornoAlmoco ? entrada : 0
          linha.getCell("D").value = retornoAlmoco ? saidaAlmoco : 0
          linha.getCell("E").value = retornoAlmoco ? retornoAlmoco : entrada
          linha.getCell("F").value = retornoAlmoco ? saida : saidaAlmoco
          linha.getCell("H").value = obs.join(" | ")
        }
      }
    }
  })

  workbook.removeWorksheet(2);

  return workbook.xlsx.writeBuffer()
}

export async function carregarTemplate(): Promise<ArrayBuffer> {
  const resposta = await fetch(TEMPLATE_URL)
  const tipo = resposta.headers.get("content-type") ?? ""

  // O Vite devolve o index.html (status 200) quando o arquivo não existe em public/
  if (!resposta.ok || tipo.includes("text/html")) {
    throw new Error(
      "Template não encontrado. Coloque SINOSBYTE-TEMPLATE-Vazio.xlsx na pasta public/."
    )
  }
  return resposta.arrayBuffer()
}

export function baixarXlsx(buffer: ExcelJS.Buffer, nomeArquivo: string) {
  const blob = new Blob([buffer as ArrayBuffer], { type: XLSX_MIME })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = nomeArquivo
  a.click()

  URL.revokeObjectURL(url)
}


export async function gerarRelatorio(
  registros: RegistroApi[],
  mes: number,
  ano: number
) {
  const template = await carregarTemplate()
  const buffer = await RelatorioExcel(template, registros, mes, ano)
  baixarXlsx(buffer, `relatorio_registros_${String(mes).padStart(2, "0")}-${ano}.xlsx`)
}