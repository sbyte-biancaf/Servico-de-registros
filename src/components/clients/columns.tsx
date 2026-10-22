import type { ColumnDef } from "@tanstack/react-table"
import type { DataTableFeatures } from "../data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowUpDown /* MoreHorizontal, Trash2, Eye, Edit*/,
  ChevronRight,
  Share2,
} from "lucide-react"

export const columns = () // isGerente: boolean,
// onEdit: (cliente: any) => void,
// onDelete: (id: number) => void,
: ColumnDef<DataTableFeatures, any>[] => {
  const columns: ColumnDef<DataTableFeatures, any>[] = [
    {
      accessorKey: "nomeCliente",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Empresa <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        return (
        <div className="w-full flex items-center justify-between gap-2">
          <span>{row.original.nomeCliente}</span>
          {row.original.compartilhado && (
            <Share2 className="h-4 w-4"/>
          )}
        </div>
      )
      }
    },
    {
      header: "Localização",
      accessorKey: "localizacao",
      cell: ({ row }) => <span>{row.original.localizacao}</span>,
    },
    {
      id: "projects",
      header: "Projetos",
      cell: ({ row }) => {
        const projetos = Number(row.original.projetos) <= 9 ? `0${row.original.projetos}` : row.original.projetos
        return <span>{projetos.toString()} Ativos</span>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status as boolean
        return (
          <Badge
            variant={status ? "default" : "destructive"}
            className={
              status
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 text-white hover:bg-red-700"
            }
          >
            {status ? "Ativo" : "Inativo"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
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
  return columns
}
