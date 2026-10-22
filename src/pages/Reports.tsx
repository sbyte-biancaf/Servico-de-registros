import { PageHeader } from "@/components/page-header"
import { useState, useEffect, useCallback } from "react"
import { apiFetch, apiFetchRaw } from "@/lib/utils"
import { columns, columnsDespesa } from "@/components/reports/columns"
import { useWorkspace } from "@/contexts/workspace-context"
import * as z from "zod"

import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { type DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import {
  Download,
  CalendarIcon,
  BrushCleaning,
  Filter,
  Minus,
} from "lucide-react"
import { DataTable } from "@/components/data-table"
import { IconButton } from "@/components/ui/icon-button-tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"

type RelatorioRow = Record<string, unknown>

// Zod: valida a resposta de GET /employees/list/
const EmployeeSchema = z
  .object({
    usuarioId: z.union([z.string(), z.number()]),
    nomeCompleto: z.string(),
  })
  .passthrough()
const EmployeesResponseSchema = z.array(EmployeeSchema)
type Employee = z.infer<typeof EmployeeSchema>

// Zod: modela o formato dos filtros (mesma lógica de range inicio/fim já usada)
const FiltroRangeSchema = z.object({
  inicio: z.string(),
  fim: z.string(),
})
type FiltroRange = z.infer<typeof FiltroRangeSchema>

const FiltrosSchema = z.object({
  data: FiltroRangeSchema,
  cliente: FiltroRangeSchema,
  projeto: FiltroRangeSchema,
  colaborador: FiltroRangeSchema,
  atividade: FiltroRangeSchema,
  tipoAtividade: FiltroRangeSchema,
  colaboradoresSelecionados: z.array(z.string()),
})
type Filtros = z.infer<typeof FiltrosSchema>

type FiltrosTemp = Omit<Filtros, "data">
type FiltroRangeKey = Exclude<keyof FiltrosTemp, "colaboradoresSelecionados">

const emptyRange = (): FiltroRange => ({ inicio: "", fim: "" })

const filtrosVazios = (): Filtros => ({
  data: emptyRange(),
  cliente: emptyRange(),
  projeto: emptyRange(),
  colaborador: emptyRange(),
  atividade: emptyRange(),
  tipoAtividade: emptyRange(),
  colaboradoresSelecionados: [],
})

const filtrosTempVazios = (): FiltrosTemp => ({
  cliente: emptyRange(),
  projeto: emptyRange(),
  colaborador: emptyRange(),
  atividade: emptyRange(),
  tipoAtividade: emptyRange(),
  colaboradoresSelecionados: [],
})

export function ReportsPage() {
  const { currentWorkspace } = useWorkspace()
  const isOwner = currentWorkspace?.isOwner || currentWorkspace?.isAdmin
  const { user } = useAuth()

  const [reload, setReload] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filtros, setFiltros] = useState<Filtros>(filtrosVazios())
  const [filtrosTemp, setFiltrosTemp] =
    useState<FiltrosTemp>(filtrosTempVazios())

  const [employees, setEmployees] = useState<Employee[]>([])

  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  })
  // Dados para tabela
  const [dados, setDados] = useState<RelatorioRow[]>([])
  const [totalDespesas, setTotalDespesas] = useState(0)
  const [tipoRelatorio, setTipoRelatorio] = useState<
    "lancamentos" | "despesas"
  >("lancamentos")

  // Busca os colaboradores para o filtro de badges selecionáveis
  useEffect(() => {
    async function buscarColaboradores() {
      try {
        const response = await apiFetch("/usuarios/list/")
        if (response.error) {
          console.error(response.message || "Erro ao buscar colaboradores")
          setEmployees([])
          return
        }

        const parsed = EmployeesResponseSchema.safeParse(response.data)
        if (!parsed.success) {
          console.error("Resposta inválida de '/usuarios/list/'", parsed.error)
          setEmployees([])
          return
        }

        setEmployees(parsed.data)
      } catch (err) {
        console.error("Erro ao buscar colaboradores:", err)
        setEmployees([])
      }
    }

    buscarColaboradores()
  }, [currentWorkspace])

  const toggleColaboradorSelecionado = (usuarioId: string) => {
    setFiltrosTemp((prev) => ({
      ...prev,
      colaboradoresSelecionados: prev.colaboradoresSelecionados.includes(
        usuarioId
      )
        ? prev.colaboradoresSelecionados.filter((id) => id !== usuarioId)
        : [...prev.colaboradoresSelecionados, usuarioId],
    }))
  }

  const handleFiltros = () => {
    setFiltros((prev) => ({
      ...prev,
      cliente: filtrosTemp.cliente,
      projeto: filtrosTemp.projeto,
      colaborador: filtrosTemp.colaborador,
      atividade: filtrosTemp.atividade,
      tipoAtividade: filtrosTemp.tipoAtividade,
      colaboradoresSelecionados: filtrosTemp.colaboradoresSelecionados,
    }))
    setFiltersOpen(false)
  }

  const limparFiltros = () => {
    setFiltros(filtrosVazios())
    setFiltrosTemp(filtrosTempVazios())
  }

  const formatarZZZ = async (filtro: {
    inicio: string
    fim: string
  }): Promise<{ inicio: string; fim: string } | undefined> => {
    if (
      filtro.inicio === " " ||
      filtro.fim === " " ||
      filtro.inicio === "" ||
      filtro.fim === "" ||
      !filtro.fim ||
      !filtro.inicio
    ) {
      return undefined
    }

    const inicio = `${filtro.inicio.trim()}`
    const fim = `${filtro.fim.trim()}ZZZZZ`

    return { inicio, fim }
  }

  const endpoint = `/relatorios/list/?tipo=${tipoRelatorio}`
  const getBody = useCallback(async () => {
    const colaboradoresIds = isOwner 
      ? (filtros.colaboradoresSelecionados.length > 0 ? filtros.colaboradoresSelecionados : undefined)
      : (user?.id ? [String(user.id)] : undefined);

    return {
      data: {
        inicio: date?.from ? format(date.from, "yyyy-MM-dd") : "",
        fim: date?.to ? format(date.to, "yyyy-MM-dd") : "",
      },
      cliente: await formatarZZZ(filtros.cliente),
      projeto: await formatarZZZ(filtros.projeto),
      colaborador: await formatarZZZ(filtros.colaborador),
      atividade: await formatarZZZ(filtros.atividade),
      tipoAtividade: await formatarZZZ(filtros.tipoAtividade),
      colaboradores: colaboradoresIds,
    }
  }, [
    date?.from,
    date?.to,
    filtros,
    isOwner,
    user?.id,
  ])

  // Executa quando date ou filtros mudam
  useEffect(() => {
    async function buscarDados() {
      setDados([])

      const response = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(await getBody()),
      })
      const novoDados =
        tipoRelatorio === "despesas" ? response.data?.mapped : response.data

      setDados(Array.isArray(novoDados) ? novoDados : [])
      setTotalDespesas(response.data?.somatorio ?? 0)
    }

    buscarDados()
  }, [
    date,
    filtros,
    tipoRelatorio,
    reload,
    endpoint,
    getBody,
    currentWorkspace,
  ]) // Sem colaboradores

  //handler para baixar o excel resultante
  async function handleExport() {
    const end = "/relatorios/files/" + `?tipo=${tipoRelatorio}&filext=xlsx`

    const response = await apiFetchRaw(end, {
      method: "POST",
      body: JSON.stringify(await getBody()),
    })

    // Extrai o nome do arquivo do header
    const contentDisposition = response.headers.get("Content-Disposition")
    let filename = "relatorio.xlsx" // fallback

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
      if (filenameMatch) {
        filename = filenameMatch[1]
      }
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)

    return
  }


  

  return (
    <>
      <PageHeader
        title="Relatórios"
        subtitle="Checagem e exportação de relatórios"
        buttons={
          <>
            <IconButton
              variant={"destructive"}
              icon={<BrushCleaning />}
              onClick={limparFiltros}
              label={"Limpar Filtros"}
            />

            <IconButton
              variant={"default"}
              icon={<Download />}
              onClick={handleExport}
              label={"Exportar Relatório"}
            />

            <IconButton
              variant={"secondary"}
              icon={<Filter />}
              onClick={() => setFiltersOpen(true)}
              label={"Filtros"}
            />
          </>
        }
      ></PageHeader>

      <main className="min-h-0 w-full pr-4">
        {/* Somatório mensal */}
        {tipoRelatorio === "despesas" && (
          <div className="mb-2 flex w-full justify-end">
            <div>
              <Label>Valor Total</Label>
              <Badge variant="default" className="text-sm">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totalDespesas)}
              </Badge>
            </div>
          </div>
        )}

        <DataTable
          key={tipoRelatorio}
          columns={tipoRelatorio === "despesas" ? columnsDespesa() : columns()}
          data={dados}
          filterOff={true}
          filterColumn={
            tipoRelatorio === "despesas"
              ? ["nome_despesa"]
              : ["nome_colaborador"]
          }
        />
      </main>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>
              Refine a pesquisa de dados do relatório.
            </SheetDescription>
          </SheetHeader>

          <div className="grid flex-1 auto-rows-min gap-6 px-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <div>
                <Label className="mb-1.5" htmlFor="date-picker-range">
                  Período:{" "}
                </Label>
                <div id="date-picker-range">
                  <Popover modal={false}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start px-2.5 font-normal"
                      >
                        <CalendarIcon />
                        {date?.from && date?.to && (
                          <>
                            {format(date.from, "dd/LL/yy")} - {""}
                            {format(date.to, "dd/LL/yy")}
                          </>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto min-w-125 p-0"
                      align="start"
                    >
                      <Calendar
                        fixedWeeks
                        className="w-auto"
                        mode="range"
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                        defaultMonth={date?.from}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label>Tipo de relatório:</Label>
                <Select
                  value={tipoRelatorio}
                  onValueChange={(value) =>
                    setTipoRelatorio(value as "lancamentos" | "despesas")
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Tipo de relatório" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lancamentos">Lançamentos</SelectItem>
                    <SelectItem value="despesas">Despesas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtro por colaboradores selecionados (badges) */}
            {isOwner && (
              <div className="grid gap-3">
                <Label>Colaboradores</Label>
                <div className="flex flex-wrap gap-2">
                  {employees.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      Nenhum colaborador encontrado.
                    </span>
                  )}
                  {employees.map((employee) => {
                    const id = String(employee.usuarioId)
                    const selecionado =
                      filtrosTemp.colaboradoresSelecionados.includes(id)
                    return (
                      <Button
                        key={id}
                        variant={selecionado ? "default" : "outline"}
                        className="cursor-pointer p-2 select-none"
                        onClick={() => toggleColaboradorSelecionado(id)}
                      >
                        {employee.nomeCompleto}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )}
            
            {isOwner && 
            [
              { label: "Cliente", key: "cliente" },
              { label: "Projeto", key: "projeto" },
              { label: "Colaborador", key: "colaborador" },
              { label: "Atividade", key: "atividade" },
              { label: "Tipo de Atividade", key: "tipoAtividade" },
            ]
              .filter(
                ({ label }) =>
                  tipoRelatorio !== "despesas" ||
                  label === "Colaborador" ||
                  label === "Cliente"
              )
              .map(({ label, key }) => (
                <div key={key} className="grid gap-3">
                  <Label>{label}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="A"
                      value={filtrosTemp[key as FiltroRangeKey].inicio}
                      onChange={(e) =>
                        setFiltrosTemp((prev) => ({
                          ...prev,
                          [key]: {
                            ...prev[key as FiltroRangeKey],
                            inicio: e.target.value.toUpperCase(),
                          },
                        }))
                      }
                    />
                    <Minus className="shrink-0 text-muted-foreground" />
                    <Input
                      placeholder="Z"
                      value={filtrosTemp[key as FiltroRangeKey].fim}
                      onChange={(e) =>
                        setFiltrosTemp((prev) => ({
                          ...prev,
                          [key]: {
                            ...prev[key as FiltroRangeKey],
                            fim: e.target.value.toUpperCase(),
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
          </div>

          <SheetFooter>
            <Button type="submit" onClick={handleFiltros}>
              Filtrar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
