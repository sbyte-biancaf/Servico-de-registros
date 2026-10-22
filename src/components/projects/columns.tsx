import type { ColumnDef } from "@tanstack/react-table"
import type { DataTableFeatures } from "@/components/data-table"
import { ArrowUpDown, ChevronRight, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { statusProjetoMap } from "@/lib/utils"

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

export const columns = (): ColumnDef<DataTableFeatures, any>[] => [
  {
    accessorKey: "nomeProjeto",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Projeto
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      return (
        <div className="w-full flex items-center justify-between gap-2">
          <span>{row.original.nomeProjeto}</span>
          {row.original.compartilhado && (
            <Share2 className="h-4 w-4"/>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "nomeCliente",
    header: "Parceiro",
    cell: ({ row }) => {
      return (
        <Badge variant="outline" className="text-blue-700">
          {row.original.nomeCliente}
        </Badge>
      )
    },
  },
  //ref externo
  {
    accessorKey: "refCliente",
    header: "Ref. Externa",
    cell: ({ row }) => {
      return <span>{row.original.refCliente ?? '-'}</span>
    },
  },
  //Prazo
  {
    accessorKey: "dataPrevisao",
    header: "Prazo Final",
    cell: ({ row }) => {
      let data_fim_ = row.original.dataFim as string
      data_fim_ = new Date(data_fim_).toLocaleDateString("pt-BR", {
        timeZone: "UTC",
      })

      return (
        <span>
          {data_fim_}
        </span>
      )
    },
  },
  {
    accessorKey: "horasGastas", // essa coluna vai virar algo com produtividade para ter o acesso rapido o retante do projeto vai ter um detalhe
    header: "Horas gastas",
    cell: ({ row }) => {
      const horasGastas = row.original.horasGastas || 0
      const horasPrevistas = row.original.horasPrevistas || 0
      const ultrapassou = horasPrevistas > 0 && horasGastas > horasPrevistas
      return (
        <span
          className={`font-medium transition-colors ${ultrapassou ? "font-bold text-red-600" : "text-blue-800"}`}
        >
          {formatarHorasDecimais(horasGastas)}h
        </span>
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original?.status as string
      return (
        <Badge
          className={`${statusProjetoMap.get(status)?.color || "bg-gray-400"} border-none text-white`}
        >
          {statusProjetoMap.get(status)?.label}
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
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      return (
        <Button variant={"ghost"}>
          <ChevronRight className="size-4" />
        </Button>
      )
    },
  },
]
