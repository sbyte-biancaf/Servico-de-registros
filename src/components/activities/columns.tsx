import type { ColumnDef } from "@tanstack/react-table"
import type { DataTableFeatures } from "../data-table"
import { ArrowUpDown, Flag, ChevronRight, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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

const AtividadePrioridade = {
  BAIXA: { label: "Baixa", color: "bg-slate-500 hover:bg-slate-600"},
  NORMAL: { label: "Normal", color: "bg-blue-500 hover:bg-blue-600"},
  ALTA: { label: "Alta", color: "bg-orange-500 hover:bg-orange-600"},
  CRITICA: { label: "Crítica", color: "bg-red-600 hover:bg-red-700"},
}

// --- Definição das Colunas ---
export const columns = (): ColumnDef<DataTableFeatures, any>[] => [
  // Cliente
  {
    accessorKey: "nomeCliente",
    enableGlobalFilter: true,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto px-0 py-0 font-bold text-blue-950 hover:bg-transparent"
      >
        Cliente
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      return row.original.nomeCliente
    },
  },
  // Projeto Vinculado
  {
    accessorKey: "nomeProjeto",
    enableGlobalFilter: true,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto px-0 py-0 font-bold text-blue-950 hover:bg-transparent"
      >
        Projeto
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      return row.original.nomeProjeto
    },
  },
  // Nome da Atividade
  {
    accessorKey: "nomeAtividade",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto px-0 py-0"
      >
        Atividade
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      return (
        <div className="w-full flex items-center justify-between gap-2">
          <span>{row.original.nomeAtividade}</span>
          {row.original.compartilhado && (
            <Share2 className="h-4 w-4"/>
          )}
        </div>
      )
    },
  },
  //ref externo
  {
    accessorKey: "refCliente",
    header: "Ref. Externa",
    cell: ({ row }) => {
      return <span>{row.original.refCliente && row.original.refCliente.length > 0 ? row.original.refCliente : '-'}</span>
    },
  },
  // Prazo
  {
    accessorKey: "dataPrevisao",
    header: "Prazo",
    cell: ({ row }) => {
      let data_inicio_ = row.original.previsaoInicio as string
      let data_fim_ = row.original.previsaoFim as string
      data_inicio_ = new Date(data_inicio_).toLocaleDateString("pt-BR")
      data_fim_ = new Date(data_fim_).toLocaleDateString("pt-BR")

      return (
        <span>
          {data_inicio_} - {data_fim_}
        </span>
      )
    },
  },
  
  //horas
  {
    accessorKey: "horasPrevistas",
    header: "Horas Previstas",
    cell: ({ row }) => {
      const previsto = row.original.horasPrevistas || 0
      return <div className="text-center">{previsto}h</div>
    },
  },
  {
    accessorKey: "horas_gastas",
    header: "Horas Gastas",
    cell: ({ row }) => {
      const horasGastas = (row.original.horasGastas as number) || 0
      const horasPrevistas = row.original.horasPrevistas || 0
      const ultrapassou = horasGastas > horasPrevistas && horasPrevistas > 0
      return (
        <div
          className={`font-medium ${ultrapassou ? "font-bold text-red-600" : "text-blue-800"}`}
        >
          {formatarHorasDecimais(horasGastas)}h
        </div>
      )
    },
  },
  {
    accessorKey: "centroCusto",
    header: "Centro de custo",
    cell: ({ row }) => {
      return <span>{row.original.centroCusto ?? '-'}</span>
    }
  },
  {
    accessorKey: "solicitante",
    header: "Solicitante",
    cell: ({ row }) => {
      return <span>{row.original.solicitante ?? '-'}</span>
    }
  },
  {
    accessorKey: "prioridade",
    header: "Prioridade",
    cell: ({ row }) => {
      const prioridade = row.original.prioridade as keyof typeof AtividadePrioridade
      return (
        <Badge
          className={`${AtividadePrioridade[prioridade].color} w-fit items-center gap-1 border-none text-white shadow-sm`}
        >
          <span className="capitalize">{AtividadePrioridade[prioridade].label}</span>
        </Badge>
      )
    },
  },
  {
    accessorKey: "isActive",
    header: "Ativo",
    cell: ({ row }) => {
      const status = row.original?.isActive
      return (
        <Badge
          className={
            status
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 text-white hover:bg-red-700"
          }
        >
          {status ? "Ativo" : "Inativo"}
        </Badge>
      )
    }
  },

  // Status
  // {
  //   accessorKey: "status",
  //   header: "Status",
  //   cell: ({ row }) => {
  //     const status = row.original.status as string
  //     return (
  //       <Badge
  //         className={`${variantMap[status as keyof typeof variantMap]} border-none text-white`}
  //       >
  //         {status}
  //       </Badge>
  //     )
  //   },
  // },

  {
    accessorKey: "actions",
    header: "",
    cell: ({ row }) => {
      return (
        <Button variant={"ghost"}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      )
    },
  },
]
