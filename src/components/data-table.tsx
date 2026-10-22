import * as React from "react"
import {
  columnFilteringFeature,
  globalFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type RowData,
  type SortingState,
} from "@tanstack/react-table"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Button } from "./ui/button"
import { Search } from "lucide-react"

/**
 * Features utilizadas por esta DataTable.
 *
 * No TanStack Table v9, as funcionalidades são registradas
 * explicitamente através do tableFeatures().
 */
// eslint-disable-next-line
export const dataTableFeatures = tableFeatures({
  // Filtros por coluna
  columnFilteringFeature,

  // Filtro global
  globalFilteringFeature,

  // Ordenação
  rowSortingFeature,

  // Paginação
  rowPaginationFeature,

  // Seleção de linhas
  rowSelectionFeature,

  // Row models
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),

  // Filtros disponíveis
  filterFns: {
    includesString: filterFn_includesString,
  },
})

export type DataTableFeatures = typeof dataTableFeatures

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[]

  data: TData[]

  /**
   * Coluna usada pelo filtro.
   *
   * String:
   *   Filtra apenas uma coluna.
   *
   * Array:
   *   Filtra em múltiplas colunas.
   */
  filterColumn?: string | string[]

  clickable?: boolean

  filterPlaceholder?: string

  filterOff?: boolean

  extraFilters?: React.ReactNode

  meta?: any

  onRowClick?: (data: TData) => void
}

/**
 * Filtro utilizado quando filterColumn é um array.
 *
 * Exemplo:
 *
 * filterColumn={["nome", "email", "cpf"]}
 *
 * O valor digitado será procurado em qualquer uma dessas colunas.
 */
const createMultiColumnFilter = <TData extends RowData>(
  filterColumn: string[]
): FilterFn<DataTableFeatures, TData> => {
  return (row, _columnId, filterValue: string) => {
    if (!filterValue) {
      return true
    }

    const termosDePesquisa = filterValue
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean)

    const valoresCombinados = filterColumn
      .map((columnId) => {
        const value = row.getValue(columnId)
        return String(value ?? "").toLowerCase()
      }).join()

      return termosDePesquisa.every((termo) => valoresCombinados.includes(termo))

    // const normalizedFilter = filterValue.toLowerCase()

    // return filterColumn.some((columnId) => {
    //   const value = row.getValue(columnId)

    //   return String(value ?? "")
    //     .toLowerCase()
    //     .includes(normalizedFilter)
    // })
  }
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  filterColumn,
  clickable = false,
  filterOff = false,
  filterPlaceholder,
  extraFilters,
  meta,
  onRowClick,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([])

  const [globalFilter, setGlobalFilter] = React.useState("")

  const [rowSelection, setRowSelection] = React.useState({})

  const isMultiColumn = Array.isArray(filterColumn)

  /**
   * Filtro global para múltiplas colunas.
   *
   * É criado apenas quando filterColumn é um array.
   */
  const multiColumnFilter = React.useMemo(() => {
    if (!isMultiColumn) {
      return undefined
    }

    return createMultiColumnFilter<TData>(filterColumn)
  }, [filterColumn, isMultiColumn])

  /**
   * Instância da tabela TanStack Table v9.
   */
  const table = useTable({
    features: dataTableFeatures,

    data,

    columns,

    /**
     * Sorting
     */
    onSortingChange: setSorting,

    /**
     * Column filtering
     */
    onColumnFiltersChange: setColumnFilters,

    /**
     * Global filtering
     */
    onGlobalFilterChange: setGlobalFilter,

    /**
     * Row selection
     */
    onRowSelectionChange: setRowSelection,

    /**
     * Estado controlado.
     */
    state: {
      sorting,
      columnFilters,
      rowSelection,

      ...(isMultiColumn
        ? {
            globalFilter,
          }
        : {}),
    },

    /**
     * Quando filterColumn é um array, usamos nosso
     * filtro personalizado.
     *
     * Quando não é array, o filtro normal da coluna
     * é utilizado.
     */
    ...(isMultiColumn && multiColumnFilter
      ? {
          globalFilterFn: multiColumnFilter,
        }
      : {}),

    /**
     * Mantém o meta que você já utilizava no componente.
     */
    meta,
  })

  /**
   * Valor atual exibido no input.
   *
   * Multi-column:
   *   globalFilter
   *
   * Single-column:
   *   valor do filtro da coluna
   */
  const filterValue = isMultiColumn
    ? globalFilter
    : ((table
        .getColumn((filterColumn as string) ?? "")
        ?.getFilterValue() as string) ?? "")

  /**
   * Atualiza o filtro de acordo com o tipo.
   */
  const handleFilterChange = (value: string) => {
    if (isMultiColumn) {
      table.setGlobalFilter(value)
      return
    }

    table
      .getColumn((filterColumn as string) ?? "")
      ?.setFilterValue(value)
  }

  return (
    <div className="w-full">
      {/* Filtro por nome + filtros extras */}
      <div
        className={`flex items-center gap-3 pb-3 ${
          extraFilters && !filterOff
            ? "justify-between"
            : "justify-end"
        }`}
      >
        {extraFilters && (
          <div className="ml-1.5 flex items-center gap-2">
            {extraFilters}
          </div>
        )}

        {!filterOff && (
          <InputGroup className="w-fit">
            <InputGroupInput
              placeholder={filterPlaceholder || "Filtrar..."}
              value={filterValue}
              onChange={(event) =>
                handleFilterChange(event.target.value)
              }
              className="field-sizing-content min-w-[250px]"
            />

            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-sm"
                className="cursor-pointer"
              >
                <Search />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        )}
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-4 text-left"
                  >
                    {header.isPlaceholder
                      ? null
                      : (
                          <table.FlexRender
                            header={header}
                          />
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={`even:bg-zinc-100 hover:bg-accent ${
                    clickable ? "cursor-pointer" : ""
                  }`}
                  onClick={() => {
                    if (clickable && onRowClick) {
                      onRowClick(row.original)
                    }
                  }}
                >
                  {row.getAllCells().map((cell, index) => (
                    <TableCell
                      key={cell.id}
                      className={`px-4 ${
                        index === 0
                          ? "text-left font-medium"
                          : ""
                      }`}
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Rodapé da tabela */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} linha(s)
          selecionada(s).
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  )
}