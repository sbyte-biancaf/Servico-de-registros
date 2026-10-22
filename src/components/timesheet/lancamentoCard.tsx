import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { useEffect, useState, useMemo } from "react"
import { ptBR } from "date-fns/locale"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardAction,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { useTimer } from "@/hooks/use-timer"
import {
  Play,
  Pause,
  RotateCcw,
  CalendarIcon,
  SendHorizontal,
} from "lucide-react"
import { IconButton } from "../ui/icon-button-tooltip"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"
import { SeletorSearchBar } from "../seletor-search-bar"
import { useAuth } from "@/contexts/auth-context"

export type DataType = {
  id: string
  nome: string
  projetoId?: string
  clienteId?: string
  limiteAtingido: boolean
}

export type PropType = {
  data: DataType[]
  showInfo?: boolean
}
export interface LancamentoForm {
  lancamento_id?: string
  atividade_id?: string
  projeto_id?: string
  cliente_id?: string
  data_lancamento?: Date
  hora_inicio?: string
  hora_fim?: string
  descricao?: string
}

interface LancamentoCardProps {
  lancamentoData: LancamentoForm | null
  projetosProp?: PropType
  atividadesProp?: PropType
  clientesProp?: PropType
  blocked?: boolean
  // showInfo?: boolean
  onSaved?: () => void
}

/**
 * Interface para dados de lançamento que chegam da API
 *
 * TIPOS ESPERADOS:
 * - lancamento_id: number (opcional) - ID do lançamento existente para edição
 * - colaborador_id: number (opcional) - ID do colaborador/usuário
 * - projeto_id: number (opcional) - ID do projeto selecionado
 * - atividade_id: number (opcional) - ID da atividade selecionada (deve estar vinculada ao projeto)
 * - data_lancamento: Date (opcional) - Data do lançamento
 * - hora_inicio: string (opcional) - Hora de início no formato "HH:mm"
 * - hora_fim: string (opcional) - Hora de término no formato "HH:mm"
 * - descricao: string (opcional) - Descrição/observação do lançamento
 * - type: string (opcional) - Tipo de lançamento (ex: "novo_lancamento", "editar")
 *
 * EXEMPLO DO QUE CHEGA DA API:
 * {
 *   lancamento_id: 38,
 *   colaborador_id: 17,
 *   projeto_id: 12,
 *   atividade_id: 17,
 *   data_lancamento: "2026-06-01T19:31:34.112Z",
 *   hora_inicio: "23:31",
 *   hora_fim: "23:40",
 *   descricao: "Arghh",
 *   type: "novo_lancamento"
 * }
 */
export function LancamentoCard({
  lancamentoData,
  projetosProp = {
    data: [],
    showInfo: false,
  },
  atividadesProp = {
    data: [],
    showInfo: false,
  },
  clientesProp = {
    data: [],
    showInfo: false,
  },
  blocked,
  onSaved,
}: LancamentoCardProps) {
  const { user } = useAuth()
  const storedUserId = String(user?.id ?? "")
  const [form, setForm] = useState({
    atividade_id: "",
    projeto_id: "",
    cliente_id: "",
    data_lancamento: new Date(),
    hora_inicio: "",
    hora_fim: "",
    descricao: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const projetosFiltrados = useMemo(() => {
    if (!form.cliente_id) return projetosProp.data ?? []
    return (
      projetosProp.data?.filter((p) => p.clienteId === form.cliente_id) ?? []
    )
  }, [form.cliente_id, projetosProp.data])

  const atividades = useMemo(() => {
    if (!form.projeto_id) return atividadesProp.data ?? []
    return (
      atividadesProp.data?.filter((a) => a.projetoId === form.projeto_id) ?? []
    )
  }, [form.projeto_id, atividadesProp.data])

  useEffect(() => {
    if (lancamentoData) {
      setForm({
        atividade_id: lancamentoData?.atividade_id || "",
        projeto_id: lancamentoData?.projeto_id || "",
        cliente_id: lancamentoData?.cliente_id || "",
        data_lancamento: new Date(lancamentoData.data_lancamento ?? ""),
        hora_inicio: String(lancamentoData.hora_inicio ?? ""),
        hora_fim: String(lancamentoData.hora_fim ?? ""),
        descricao: String(lancamentoData.descricao ?? ""),
      })
    }

    setIsLoading(false)
  }, [lancamentoData, atividadesProp.data, storedUserId])

  const { elapsed, running, start, pause, reset } = useTimer()

  const updateField = (field: string, value: string | number | Date) => {
    if (field === "data_lancamento") {
      value = new Date(value as string | Date)
    } else if (
      ["projeto_id", "atividade_id", "cliente_id", "colaborador_id"].includes(
        field
      )
    ) {
      value = value === "" ? "" : value
    }
    setForm((prev: any) => ({ ...prev, [field]: value }))
  }

  const handlePause = () => {
    pause()
    // const final = lancamentoData?.hora_inicio + elapsed
    const final = new Date(new Date(`1970-01-01T${form.hora_inicio}:00`).getTime() + elapsed)
    updateField("hora_fim", format(final, "HH:mm"))
  }

  const handleClienteChange = (id: string) => {
    setForm((prev) => ({
      ...prev,
      cliente_id: id,
      projeto_id: "",
      atividade_id: "",
    }))
  }

  const handleProjetoChange = (id: string) => {
    const projetoSelecionado = projetosProp.data?.find((p) => p.id === id)
    setForm((prev) => ({
      ...prev,
      projeto_id: id,
      atividade_id: "",
      cliente_id: projetoSelecionado?.clienteId || prev.cliente_id,
    }))
  }

  const handleReset = () => {
    reset()

    updateField("hora_fim", "")
    updateField("hora_inicio", "")
  }

  const handlerStart = () => {
    start()

    if (form.hora_inicio) return

    const startHour = new Date(Number(localStorage.getItem("timer_start")))
    const stringHours = String(startHour.getHours()).padStart(2, "0")
    const stringMinutes = String(startHour.getMinutes()).padStart(2, "0")
    updateField("hora_inicio", stringHours + ":" + stringMinutes)
  }

  const handleCanCount = () => {
    return !form.projeto_id || !form.atividade_id
  }

  function formatTimer(ms: number) {
    const pad = (n: number) => String(n).padStart(2, "0")

    const h = Math.floor(ms / 3_600_000)
    const m = Math.floor((ms % 3_600_000) / 60_000)
    const s = Math.floor((ms % 60_000) / 1_000)

    return `${h}:${pad(m)}:${pad(s)}`
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    const { projeto_id, atividade_id, hora_inicio, hora_fim, descricao, data_lancamento } = form
    if (
      !projeto_id ||
      !atividade_id ||
      !hora_inicio ||
      !hora_fim ||
      !descricao
    ) {
      setIsLoading(false)
      return toast.warning("Preencha os campos obrigatórios")
    }

    if (hora_inicio >= hora_fim) {
      setIsLoading(false)
      return toast.error("Hora inválida")
    }

    const isEdit = !!lancamentoData?.lancamento_id
    const endpoint = isEdit
      ? `/lancamentos/edit/${lancamentoData?.lancamento_id}`
      : "/lancamentos/create"
    const method = isEdit ? "PUT" : "POST"

    const payload = {
      ...form,
    }

    const response = await apiFetch(endpoint, {
      method: method,
      body: JSON.stringify(payload),
    })

    setIsLoading(false)

    if (!response.error) {
      const atividade = atividades.find(a => a.id ===atividade_id)
      const projeto = projetosFiltrados.find(p => p.id === projeto_id)
      
      if (atividade?.limiteAtingido && projeto?.limiteAtingido) {
        toast.warning("Atividade e Projeto com prazo ou horas excedidas! Lançamento criado")
      } else if (atividade?.limiteAtingido) {
        toast.warning("Atividade com prazo ou horas excedidas! Lançamento criado")
      } else if (projeto?.limiteAtingido) {
        toast.warning("Projeto com prazo ou horas excedidas! Lançamento criado")
      } else {
        toast.success(isEdit ? "Lançamento Atualizado" : "Lançamento Concluído")
      }
      onSaved?.()
      return
    }

    return toast.error(response.message || "Erro ao lançar atividade")
  }

  return (
    <Card className={`${blocked ? "text-muted-foreground" : ""}`}>
      {blocked && (
        <div className="absolute inset-0 z-10 rounded-md bg-muted/40 backdrop-blur-[0.5px]"></div>
      )}
      <CardHeader>
        <CardTitle>
          {lancamentoData?.descricao ? "Editar lançamento" : "Novo lançamento"}
        </CardTitle>

        <CardAction>
          <div className="flex items-center justify-center gap-2">
            <IconButton
              label="Reiniciar cronômetro"
              onClick={handleReset}
              variant={"outline"}
              icon={<RotateCcw />}
            />
            <Button
              variant={"outline"}
              onClick={handlePause}
              disabled={!running}
              size={"icon"}
              className="rounded-full hover:border-red-300 hover:bg-red-200"
            >
              <Pause className="text-red-500" />
            </Button>
            {formatTimer(elapsed)}
            <Button
              variant={"outline"}
              size={"icon"}
              onClick={handlerStart}
              disabled={handleCanCount()}
              className="rounded-full hover:border-green-300 hover:bg-green-200"
            >
              <Play className="text-green-600" />
            </Button>
          </div>
        </CardAction>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label>Data</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full">
                  {format(form.data_lancamento, "PPP", { locale: ptBR })}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-2" align="start">
                <Calendar
                  required
                  fixedWeeks
                  mode="single"
                  selected={form.data_lancamento}
                  locale={ptBR}
                  onSelect={(date) => {
                    updateField("data_lancamento", date)
                    setIsCalendarOpen(!isCalendarOpen)
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Hora de Início</Label>
            <Input
              type="time"
              value={form.hora_inicio}
              onChange={(e) => updateField("hora_inicio", e.target.value)}
            />
            <Label>Hora de Término</Label>
            <Input
              type="time"
              value={form.hora_fim}
              onChange={(e) => updateField("hora_fim", e.target.value)}
            />
          </div>

          <div className="flex flex-1 gap-4">
            {/* Seletor de clientes */}
            {clientesProp.showInfo && (
              <SeletorSearchBar
                label="Parceiro"
                items={clientesProp.data}
                value={form.cliente_id}
                onValueChange={handleClienteChange}
                placeholder="Selecione um parceiro"
                searchPlaceholder="Buscar parceiro..."
                emptyMessage="Nenhum parceiro encontrado"
              />
            )}

            {/* Seletor de projetos */}
            {projetosProp.showInfo && (
              <SeletorSearchBar
                label="Projeto"
                items={projetosFiltrados}
                value={form.projeto_id}
                onValueChange={handleProjetoChange}
                placeholder="Selecione um projeto"
                searchPlaceholder="Buscar Projeto..."
                emptyMessage="Nenhum Projeto encontrado"
              />
            )}

            
          </div>
          <div className="space-y-2">
            {/* --- seletor de atividades --- */}
            {atividadesProp.showInfo && (
              <SeletorSearchBar
                label="Atividade"
                items={atividades}
                value={form.atividade_id}
                onValueChange={(v) => updateField("atividade_id", v)}
                disabled={!form.projeto_id}
                placeholder="Selecione uma atividade"
                searchPlaceholder="Buscar Atividade..."
                emptyMessage={
                  form.projeto_id
                    ? "Nenhuma atividade para este projeto."
                    : "Selecione um projeto primeiro."
                }
              />
            )}
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Descrição"
              value={form.descricao}
              onChange={(e) => updateField("descricao", e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="padding-none">
        <Button
          className="icon-only ml-auto rounded-full"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
