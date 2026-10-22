import { useState, useEffect } from "react"
import { apiFetch } from "@/lib/utils"
import { DataTable } from "@/components/data-table"
import { colums } from "@/components/expenses/colums"
// import SideBar from "@/components/componentes/SideBar";
import { PageHeader } from "@/components/page-header"
import { toast } from "sonner"
import { AddExpenseModal } from "@/components/expenses/addExpenseModal"
import { type DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { useWorkspace } from "@/contexts/workspace-context"

export function ExpensesPage() {
  const { currentWorkspace } = useWorkspace()
  const [despesas, setDespesas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(true)

  const [data, setData] = useState<DateRange>({
    from: addDays(new Date(), -30),
    to: new Date(),
  })

  useEffect(() => {
    const fetchDespesas = async () => {
      setLoading(true)
      const dataInicio = format(data.from ?? "", "yyyy-MM-dd")
      const dataFim = format(data.to ?? "", "yyyy-MM-dd")

      const response = await apiFetch(
        `/despesas/list/?data_inicio=${dataInicio}&data_fim=${dataFim}`
      )

      if (response.error && !response.data.length) {
        toast.error(response.message || "Erro ao carregar despesas pendentes.")
        setLoading(false)
        return
      }

      setDespesas(response.data || [])
      setLoading(false)
    }
    fetchDespesas()
  }, [data, reload, currentWorkspace])

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Gestão de Despesas"
        subtitle="Custos operacionais"
        buttons={<AddExpenseModal onRefresh={() => setReload(!reload)} />}
      />
      <main className="min-h-0 w-full pr-4">
        {/* <div className="flex flex-row gap-4 w-full items-center justify-end mb-4">
          <AddExpenseModal onRefresh={() => setReload(!reload)} />
        </div> */}
        <DataTable
          columns={colums(() => setReload(!reload))}
          data={despesas}
          clickable={false}
          filterPlaceholder="Pesquisar por despesa ou cliente"
          filterColumn={["nomeDespesa", "cliente"]}
          extraFilters={
            <>
              {/* date range igual do filtros */}
              <div className="flex w-full items-center gap-2.5">
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
                          {data?.from && data?.to && (
                            <>
                              {format(data.from, "dd/LL/yy")} - {""}
                              {format(data.to, "dd/LL/yy")}
                            </>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto min-w-125 p-0"
                        align="start"
                      >
                        <Calendar
                          required
                          fixedWeeks
                          className="w-auto"
                          mode="range"
                          selected={data}
                          onSelect={setData}
                          numberOfMonths={2}
                          defaultMonth={data?.from}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </>
          }
        />
      </main>
    </>
  )
}
