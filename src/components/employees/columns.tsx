import type { ColumnDef } from "@tanstack/react-table"
import type { DataTableFeatures } from "../data-table"

import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const columns: ColumnDef<DataTableFeatures, any>[] = [
  {
    accessorKey: "nomeCompleto",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Nome
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <span>
          {row.original.nomeCompleto}
        </span>
      )
    },
  },
  {
    accessorKey: "nomeUsuario",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Nome de usuário
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <span>
          {row.original.nomeUsuario}
        </span>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      return (
        <span>
          {row.original.email}
        </span>
      )
    },
  },

  {
    accessorKey: "cargo",
    header: "Cargo",
    cell: ({ row }) => {
      const cargo = row.original.cargo as string

      const cargoStyles = new Map<string, { color: string, label: string}>([
        [ "OWNER", { color: "bg-green-600 hover:bg-green-700", label: "Dono" } ], 
        [ "ADMIN", { color: "bg-blue-600 hover:bg-blue-700", label: "Gerente/Admin" } ],
        [ "COLAB", { color: "bg-yellow-400 hover:bg-yellow-500", label: "Colaborador" } ]
      ])

      return (
        <Badge className={`border-none text-white font-semibold ${cargoStyles.get(cargo)?.color}`}>
          {cargoStyles.get(cargo)?.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isAtivo = row.original?.isActive as boolean

      return (
        <Badge
          variant={isAtivo ? "default" : "destructive"}
          className={
            isAtivo
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 text-white hover:bg-red-700"
          }
        >
          {isAtivo ? "Ativo" : "Inativo"}
        </Badge>
      )
    },
  },
]
