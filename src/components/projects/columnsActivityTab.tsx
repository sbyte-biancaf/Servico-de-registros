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
export const columnsActivityTab = (): ColumnDef<DataTableFeatures, any>[] => [
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
  // Tipo de atividade
  {
    accessorKey: "tipo",
    header: "Tipo de atividade",
    cell: ({ row }) => {
      return <span>{row.original.tipo}</span>
    },
  },
  //ref externo
  {
    accessorKey: "refClienteAtividade",
    header: "Ref. Externa",
    cell: ({ row }) => {
      return <span>{row.original.refClienteAtividade && row.original.refClienteAtividade.length > 0 ? row.original.refClienteAtividade : '-'}</span>
    },
  },
  // Prazo
  {
    accessorKey: "dataPrevisao",
    header: "Prazo",
    cell: ({ row }) => {
      let data_inicio_ = row.original.dataInicio as string
      let data_fim_ = row.original.dataFim as string
      data_inicio_ = new Date(data_inicio_).toLocaleDateString("pt-BR")
      data_fim_ = new Date(data_fim_).toLocaleDateString("pt-BR")

      return (
        <span>
          {data_inicio_} - {data_fim_}
        </span>
      )
    },
  },
  {
    accessorKey: "centroCusto",
    header: "Centro de custo",
    cell: ({ row }) => {
      return <span>{row.original.centroCusto && row.original.centroCusto.length > 0 ? row.original.centroCusto : '-'}</span>
    }
  },
  {
    accessorKey: "solicitante",
    header: "Solicitante",
    cell: ({ row }) => {
      return <span>{row.original.solicitante && row.original.solicitante.length > 0 ? row.original.solicitante : '-'}</span>
    }
  },

  // 
]
