import type { ColumnDef } from "@tanstack/react-table"
import type { DataTableFeatures } from "../data-table"
import { ChevronRight } from "lucide-react"
import { Button } from "../ui/button"



export const columns = (mostrarColunaUsuario: boolean = false): ColumnDef<DataTableFeatures, any>[] => {
  
  const cols: ColumnDef<DataTableFeatures, any>[] = [
    {
      accessorKey: "dataLancamento",
      header: "Data",
      cell: ({ row }) => {
        const data = new Date(row.original?.dataLancamento)
        return data.toLocaleDateString("pt-BR", { timeZone: "UTC" })
      },
    },
    ...(mostrarColunaUsuario 
      ? [
        {
          accessorKey: "nomeUsuario",
          header: "Usuário",
          cell: ({ row }: any) => (
            <span className="font-medium">
              {row.original?.nomeUsuario}
            </span>
          ),
        },
      ]
      : []),
    {
      accessorKey: "nomeCliente",
      header: "Cliente",
    },
    {
      accessorKey: "nomeProjeto",
      header: "Projeto",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original?.nomeProjeto || "Projeto s/ nome"}
        </span>
      ),
    },

    {
      accessorKey: "nomeAtividade",
      header: "Atividade",
    },

    {
      accessorKey: "periodo",
      header: "Período",
      cell: ({ row }) => {
        const inicio = row.original.horaInicio
        const fim = row.original.horaFim

        const format = (v: string) => {
          if (!v) return "--:--"
          const d = new Date(v)
          return `${d.getUTCHours().toString().padStart(2, "0")}:${d
            .getUTCMinutes()
            .toString()
            .padStart(2, "0")}`
        }

        return (
          <span className="font-mono text-sm">
            {format(inicio)} - {format(fim)}
          </span>
        )
      },
    },

    {
      accessorKey: "duracao",
      header: "Duração",
      cell: ({ row }) => {
        const inicio = new Date(row.original.horaInicio)
        const final = new Date(row.original.horaFim)
        const diff = final.getTime() - inicio.getTime()
        if (diff <= 0) return "0h"

        const hora = Math.floor(diff / 36e5)
        const minuto = Math.round((diff % 36e5) / 6e4)

        return `${hora}h${minuto > 0 ? ` ${minuto}min` : ""}`
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

  return cols
}
