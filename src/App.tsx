import { Layout } from "./layout"
import { AuthProvider } from "./contexts/auth-context"
import { WorkspaceProvider } from "./contexts/workspace-context"
import { Card } from "./components/ui/card"
import { Label } from "./components/ui/label"
import { Button } from "./components/ui/button"
import { Calendar } from "./components/ui/calendar"
import { CalendarIcon, Minus, BrushCleaning, Filter, PlayIcon } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "./components/ui/popover"
import { useState, useEffect, useCallback } from "react"
import { type DateRange } from "react-day-picker"
import { addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { apiFetch, apiFetchRaw } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { getCookie, setCookie } from "@/lib/utils"

type FiltroRange = {
  inicio: string
  fim: string
}

type Filtros = {
  cliente: FiltroRange
  projeto: FiltroRange
  colaborador: FiltroRange
  atividade: FiltroRange
  tipoAtividade: FiltroRange
}

const emptyRange = (): FiltroRange => ({ inicio: "", fim: "" })

const filtrosVazios = (): Filtros => ({
  cliente: emptyRange(),
  projeto: emptyRange(),
  colaborador: emptyRange(),
  atividade: emptyRange(),
  tipoAtividade: emptyRange(),
})


export function App() {


  const [date, setDate] = useState<DateRange | undefined>({
      from: addDays(new Date(), -30),
      to: new Date(),
    })

  const [filtros, setFiltros] = useState<Filtros>(filtrosVazios())
  const [dados, setDados] = useState<unknown[]>([])
  const [loading, setLoading] = useState(false)

  const formatarZZZ = (filtro: FiltroRange) => {
    if (!filtro.inicio?.trim() || !filtro.fim?.trim()) {
      return undefined
    }
    return {
      inicio: filtro.inicio.trim(),
      fim: `${filtro.fim.trim()}ZZZZZ`,
    }
  }

  const getPayload = useCallback(() => {
    return {
      data: {
        inicio: date?.from ? format(date.from, "yyyy-MM-dd") : "",
        fim: date?.to ? format(date.to, "yyyy-MM-dd") : "",
      },
      cliente: formatarZZZ(filtros.cliente),
      projeto: formatarZZZ(filtros.projeto),
      colaborador: formatarZZZ(filtros.colaborador),
      atividade: formatarZZZ(filtros.atividade),
      tipoAtividade: formatarZZZ(filtros.tipoAtividade),
    }
  }, [date, filtros])

  const buscarRegistros = useCallback(async () => {
    setLoading(true)
    try {
      const payload = getPayload()
      const options: RequestInit= {
        method: "POST",
        // headers: {
        //   // "Content-Type": "application/json",
        //   // "x-workspace-id": "sinoszep_00",
        //   // "Cookie": "_tk = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoiYWNjZXNzIiwidXN1YXJpb19pZCI6IjNjYmQ3MDZmLWE4YjItNDQ2NC1hMzhjLWU0NGMzMDNjYjBiMyIsIm5vbWVfdXN1YXJpbyI6InNieXRlLmJpYW5jYSIsImlhdCI6MTc5MjY4ODQ4Nn0.gV9UaLFNd56IwmqqmDO1mjyBVNbU57O9sSaP-T4_Wto"
        // },
        body: JSON.stringify(payload),
      }

      const response = await apiFetch(`/api/relatorios/registro`, options)
      const resultado = response.data || []
      setDados(Array.isArray(resultado) ? resultado : [])
    } catch (err) {
      console.error("Erro ao buscar registros na API:", err)
      setDados([])
    } finally {
      toast.success("Registros adquiridos! Download começando")
      setLoading(false)
    }
  }, [getPayload])

  const handleInputChange = (field: keyof Filtros, subfield: "inicio" | "fim", value: string) => {
    setFiltros((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [subfield]: value.toUpperCase(),
      },
    }))
  }

  const limparFiltros = () => {
    setFiltros(filtrosVazios())
  }



  return (
    <main className="min-h-0 w-full pr-4 my-8">
      <h1 className="text-center text-4xl font-bold">Serviço de Registros</h1>
      <Card className="m-14 p-8 grid grid-cols-3">
        <div className="text-center">
          <Label className="mb-1.5 text-center" htmlFor="date-picker-range">
            Período:{" "}
          </Label>
                <div id="date-picker-range">
                  <Popover modal={false}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start px-2.5 font-normal w-140"
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
                      className="w-auto min-w-140 p-0"
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

          {(
            [
              { label: "Cliente", key: "cliente" },
              { label: "Projeto", key: "projeto" },
              { label: "Colaborador", key: "colaborador" },
              { label: "Atividade", key: "atividade" },
              { label: "Tipo Atividade", key: "tipoAtividade" },
            ] as const
          ).map(({ label, key }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label>{label}</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  placeholder="A"
                  value={filtros[key].inicio}
                  onChange={(e) => handleInputChange(key, "inicio", e.target.value)}
                />
                <Minus className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  placeholder="Z"
                  value={filtros[key].fim}
                  onChange={(e) => handleInputChange(key, "fim", e.target.value)}
                />
              </div>
            </div>
          ))}
      </Card>

      <div className="flex justify-center gap-4 mt-6">
        <Button variant="outline" onClick={limparFiltros} className="text-lg">
          <BrushCleaning className="mr-2 h-4 w-4" />Limpar Filtros
        </Button>
        <Button onClick={buscarRegistros} disabled={loading} className="text-lg ">
          <PlayIcon className="mr-2 h-4 w-4"/>{loading ? "Carregando..." : "Filtrar"}
        </Button>
      </div>

    </main>
  )
}

export default App
