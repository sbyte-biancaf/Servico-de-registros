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
import {
  SelectTrigger,
  SelectItem,
  SelectContent,
  Select,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import { setAmbienteAtivo, AMBIENTES } from "./lib/api-client"

// Início do uso de Excel
import ExcelJS from "exceljs";
import path from "node:path";

import { gerarRelatorio, type RegistroApi } from "@/lib/relatorio-excel"


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
  const anoAtual = new Date().getFullYear().toString()
  const mesAtual = (new Date().getMonth() + 1).toString().padStart(2, "0")
  
  const [filtroAno, setFiltroAno] = useState<string>(anoAtual)
  const [filtroMes, setFiltroMes] = useState<string>(mesAtual)

  const [filtroAmbiente, setFiltroAmbiente] = useState(localStorage.getItem("chrono_env") || "dev")

  const [filtros, setFiltros] = useState<Filtros>(filtrosVazios())
  const [dados, setDados] = useState<unknown[]>([])
  const [loading, setLoading] = useState(false)

  const handleTrocarAmbiente = (novoAmbiente: string) => {
    setFiltroAmbiente(novoAmbiente)
    setAmbienteAtivo(novoAmbiente as keyof typeof AMBIENTES)
    toast.success(`Ambiente alterado para: ${novoAmbiente}`)
  }

  const anos = [
    String(parseInt(anoAtual) + 2),
    String(parseInt(anoAtual) + 1),
    anoAtual,
    String(parseInt(anoAtual) - 1),
    String(parseInt(anoAtual) - 2),
  ]

  const meses = [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ]

  const formatarZZZ = (filtro: FiltroRange) => {
    if (!filtro.inicio?.trim() || !filtro.fim?.trim()) {
      return undefined
    }
    return {
      inicio: filtro.inicio.trim(),
      fim: `${filtro.fim.trim()}ZZZZZ`,
    }
  }

  const buscarRegistros = useCallback(async () => {
    if (!filtroAno || !filtroMes) {
      toast.warning("Selecione o ano e o mês.")
      return
    }

    setLoading(true)
    try {
      const anoNum = parseInt(filtroAno, 10)
      const mesNum = parseInt(filtroMes, 10)

      const primeiroDia = `${filtroAno}-${filtroMes}-01`
      const ultimoDiaDate = new Date(anoNum, mesNum, 0)
      const ultimoDia = `${filtroAno}-${filtroMes}-${String(ultimoDiaDate.getDate()).padStart(2, "0")}`

      const params = new URLSearchParams()

      params.append("data_inicio", primeiroDia)
      params.append("data_fim", ultimoDia)

      const chavesFiltros = ["projeto", "colaborador", "atividade", "tipoAtividade"] as const
      chavesFiltros.forEach((key) => {
        const zzz = formatarZZZ(filtros[key])
        if (zzz) {
          params.append(`${key}Inicio`, zzz.inicio)
          params.append(`${key}Fim`, zzz.fim)
        }
      })

      params.append(`clienteInicio`, "AREZZO")
      params.append(`clienteFim`, "AREZZOZZZ")

      const response = await apiFetch(`/api/relatorios/registro?${params.toString()}`)
      
      if (response.error) {
        throw new Error(response.message || "Erro ao buscar registros.")
      }

      const registros: RegistroApi[] = Array.isArray(response.data) ? response.data : []
      
      if (registros.length === 0) {
        toast.info("Nenhum registro encontrado para esses filtros.")
        return
      }

      await gerarRelatorio(
        registros,
        mesNum,
        anoNum
      )
      toast.success("Relatório gerado! O download começou.")
    } catch (err) {
      console.error("Erro ao buscar registros na API:", err)
      setDados([])
    } finally {
      toast.success("Registros adquiridos! Download começando")
      setLoading(false)
    }
  }, [filtroAno, filtroMes, filtros])

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
          <Label>Mês e Ano</Label>
          <div className="flex items-center gap-1.5">
            
            {/* Select de mês */}
            <Select value={filtroMes} onValueChange={setFiltroMes}>
              <SelectTrigger className="w-1/2">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {meses.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Minus className="h-4 w-4 text-muted-foreground shrink-0" />

            {/* Select de Ano */}
            <Select value={filtroAno} onValueChange={setFiltroAno}>
              <SelectTrigger className="w-1/2">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {anos.map((ano) => (
                    <SelectItem key={ano} value={ano}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

          </div>

          
        </div>

          {/* Select de ambiente */}
          <div className="flex flex-col gap-1.5">
            <Label>Ambiente</Label>
            <div className="flex items-center gap-1.5">
              <Select value={filtroAmbiente} onValueChange={handleTrocarAmbiente}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Ambiente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="dev">dev</SelectItem>
                    <SelectItem value="hom">hom</SelectItem>
                    <SelectItem value="prod">prod</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(
            [
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
