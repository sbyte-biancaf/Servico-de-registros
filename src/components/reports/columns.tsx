import type { ColumnDef } from "@tanstack/react-table"
import type { DataTableFeatures } from "../data-table"
import { Badge } from "@/components/ui/badge"

const formatarData = (dateString: string | null | undefined): string => {
  if (!dateString) return ""
  try {
    return new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" })
  } catch {
    return dateString
  }
}

const formatarHorasDecimais = (
  totalDecimal: number | null | undefined
): string => {
  const valor = totalDecimal || 0
  const horas = Math.floor(valor)
  const minutos = Math.round((valor - horas) * 60)

  const horasPad = String(horas).padStart(2, "0")
  const minutosPad = String(minutos).padStart(2, "0")

  return `${horasPad}:${minutosPad}`
}

const formatarHoraInicio = (valor: any): string => {
  if (!valor) return "--:--"

  const date = valor instanceof Date ? valor : new Date(valor)

  if (isNaN(date.getTime())) return "--:--"

  const horas = String(date.getUTCHours()).padStart(2, "0")
  const minutos = String(date.getUTCMinutes()).padStart(2, "0")

  return `${horas}:${minutos}`
}

export const columns = (): ColumnDef<DataTableFeatures, any>[] => {
  return [
    // Coluna: Projeto
    {
      accessorKey: "nomeProjeto",
      header: "Projeto",
      cell: ({ row }) => {
        const projeto = row.original.nomeProjeto as string
        return (
          <Badge variant="outline" className="bg-blue-900 text-white">
            {projeto || "Sem Projeto"}
          </Badge>
        )
      },
    },

    // Cliente
    {
      accessorKey: "nomeCliente",
      header: "Cliente",
      cell: ({ row }) => {
        const cliente = row.original.nomeCliente as string
        return (
          <span>{cliente}</span>
        )
      }
    },
    {
      accessorKey: "atividade",
      header: "Atividade",
      cell: ({ row }) => {
        const atividade = row.original.nomeAtividade as string
        return (
          <span>{atividade}</span>
        )
      }
    },
    
    // Coluna: Colaborador
    {
      accessorKey: "nomeColaborador",
      header: "Colaborador",
      cell: ({ row }) => {
        const colaborador = row.original.nomeColaborador as string
        return <span>{colaborador || "-"}</span>
      },
    },
    {
      accessorKey: "ticketReferencia",
      header: "Ticket de Referência",
      cell: ({ row }) => {
        return <span>{row.original.ticketReferencia || "Sem Ticket"}</span>
      }
    },
    {
      accessorKey: "tipoAtividade",
      header: "Tipo de atividade",
      cell: ({ row }) => {
        return <span>{row.original.tipoAtividade}</span>
      }
    },
    // Centro de custo
    {
      accessorKey: "centroCusto",
      header: "Centro de custo",
      cell: ({ row }) => {
        return <span>{row.original.centroCusto ?? "-"}</span>
      }
    },

    // Solicitante
    {
      accessorKey: "solicitante",
      header: "Solicitante",
      cell: ({ row }) => {
        return <span>{row.original.solicitante ?? "-"}</span>
      }
    },

    // Coluna: Data de Lançamento
    {
      accessorKey: "dataLancamento",
      header: "Data de Lançamento",
      cell: ({ row }) => {
        const data = row.original?.dataLancamento as string
        return <span className="text-center font-medium">{formatarData(data)}</span>
      },
    },

    // Coluna: Hora de inicio
    {
      accessorKey: "horaInicio",
      header: "Hora de Início",
      cell: ({ row }) => {
        const valor = row.original.horaInicio as string
        // const horas = row.original.hora_inicio;
        return (
          <div className="text-center font-medium">
            {formatarHoraInicio(valor)}
          </div>
        )
      },
    },

    // Coluna: Hora de fim
    {
      accessorKey: "horaFim",
      header: "Hora de Fim",
      cell: ({ row }) => {
        const valor = row.original.horaFim as string
        // const horas = row.original.hora_inicio;
        return (
          <div className="text-center font-medium">
            {formatarHoraInicio(valor)}
          </div>
        )
      },
    },

    // Coluna: Duração Total
    {
      accessorKey: "duracaoTotal",
      header: "Duração Total",
      cell: ({ row }) => {
        const duracao = row.original?.duracaoTotal as number
        return (
          <div className="text-center font-medium">
            {duracao ? formatarHorasDecimais(duracao) : "0h"}
          </div>
        )
      },
    },
  ]
}

export const columnsDespesa = (): ColumnDef<DataTableFeatures, any>[] => {
  return [
    {
      accessorKey: "data",
      header: "Data",
      cell: ({ row }: any) => {
        const date = row.original.data as string
        return <span>{formatarData(date)}</span>
      },
    },
    {
      accessorKey: "nomeColaborador",
      header: "Colaborador",
      cell: ({ row }: any) => {
        return row.original.nomeColaborador
      }
    },
    {
      accessorKey: "nomeDespesa",
      header: "Despesa",
      cell: ({ row }: any) => {
        return row.original.nomeDespesa
      }
    },
    {
      accessorKey: "nomeCliente",
      header: "Cliente",
      cell: ({ row }: any) => {
        return row.original.nomeCliente
      }
    },
    {
      accessorKey: "nomeProjeto",
      header: "Projeto",
      cell: ({ row }: any) => {
        const projeto = row.original.nomeProjeto as string
        return (
          <Badge variant="outline" className="bg-blue-900 text-white">
            {projeto || "Sem Projeto"}
          </Badge>
        )
      }
    },
    {
      accessorKey: "valor",
      header: "Valor",
      cell: ({ row }: any) => {
        const valor = parseFloat(row.original.valor)

        // Isso aqui serve para fazer formatação de um float para valor monetário
        const valorFormatado = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(valor)

        return <span>{valorFormatado}</span>
      },
    },
  ]

}
