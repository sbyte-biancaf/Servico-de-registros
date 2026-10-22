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


  const [dataInicio, setDataInicio] = useState<Date | undefined>(addDays(new Date(), -30))
  const [dataFim, setDataFim] = useState<Date | undefined>(new Date())

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
        inicio: dataInicio,
        fim: dataFim,
      },
      cliente: formatarZZZ(filtros.cliente),
      projeto: formatarZZZ(filtros.projeto),
      colaborador: formatarZZZ(filtros.colaborador),
      atividade: formatarZZZ(filtros.atividade),
      tipoAtividade: formatarZZZ(filtros.tipoAtividade),
    }
  }, [dataFim, dataInicio, filtros])

  const buscarRegistros = useCallback(async () => {
    setLoading(true)
    try {
      // const payload = getPayload()
      // // const options: RequestInit= {
      // //   body: JSON.stringify(payload),
      // // }

      const response = await apiFetch(`/api/relatorios/registro`)
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
        
        <div className="flex flex-col gap-1.5">
          <Label>Data Início e Fim</Label>
          <div className="flex items-center gap-2">
            
            <Popover modal={false}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start px-2.5 font-normal w-67"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{dataInicio ? format(dataInicio, "dd/MM/yy") : "Início"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataInicio}
                  onSelect={setDataInicio}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <Minus className="h-4 w-4 text-muted-foreground shrink-0" />

            <Popover modal={false}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start px-2.5 font-normal w-67"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{dataFim ? format(dataFim, "dd/MM/yy") : "Fim"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataFim}
                  onSelect={setDataFim}
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
