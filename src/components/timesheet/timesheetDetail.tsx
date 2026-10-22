import { useEffect, useState, useMemo } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { apiFetch, isDisabledStyle } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Field, FieldLabel } from "@/components/ui/field"
import { EmptyStyled } from "../empty-comp"
import {
  AlertCircle,
  ClipboardList,
  Edit2,
  Loader2,
  Receipt,
  Save,
  Users,
  Clock,
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "sonner"
import { IconButton } from "../ui/icon-button-tooltip"
import { ptBR } from "date-fns/locale/pt-BR"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { DeleteDialogGeral } from "../delete-dialog-geral"
import { IncompleteSection } from "../incomplete-section"
import { useAuth } from "@/contexts/auth-context"
import { SeletorSearchBar } from "../seletor-search-bar"

export function TimesheetDetail() {
  const params = useParams()
  const id = params.id

  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState("detalhes")
  const [lancamento, setLancamento] = useState<any | null>(null)
  const [projetos, setProjetos] = useState<any[]>([])
  const [atividades, setAtividades] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])

  const [isEditing, setIsEditing] = useState(false)
  const [reload, setReload] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const lancamentosRes = await apiFetch(`/lancamentos/list/${id}`)

      if (lancamentosRes.error) {
        toast.error(lancamentosRes.message || "Erro ao carregar lançamento")
        setLoading(false)
        return
      }

      setLancamento(lancamentosRes.data)
      setLoading(false)
    }

    const newInfoData = async () => {
      const response = await apiFetch("/lancamentos/new-info")
      if (!response.error) {
        setAtividades(response.data.atividades)
        setProjetos(response.data.projetos)
        setClientes(response.data.clientes)
      }
    }

    newInfoData()
    loadData()
  }, [id, reload])

  const formatarHoraInput = (horaString: string) => {
    if (!horaString) return ""

    if (
      typeof horaString === "string" &&
      horaString.length === 5 &&
      horaString.includes(":")
    ) {
      return horaString
    }

    const hora = new Date(horaString)
    if (!isNaN(hora.getTime())) {
      return hora.toISOString().substring(11, 16)
    }

    return typeof horaString === "string" ? horaString : ""
  }

  const handleClienteChange = (clienteId: string) => {
    setLancamento((prev) => ({
      ...prev,
      clienteId: clienteId,
      projetoId: "",
      atividadeId: "",
    }))
  }

  const handleProjetoChange = (projetoId: string) => {
    const projetoSelecionado = projetos.find((p) => p.id === projetoId)
    setLancamento((prev) => ({
      ...prev,
      projetoId,
      atividadeId: "",
      clienteId: projetoSelecionado?.clienteId || prev.clienteId,
    }))
  }

  const clienteId = lancamento?.clienteId
  const projetoId = lancamento?.projetoId
  const projetosFiltrados = useMemo(() => {
    if (!clienteId) return projetos
    return (
      projetos.filter((p) => p.clienteId === clienteId)
    )
  }, [projetos, clienteId])

  const atividadesfiltradas = useMemo(() => {
    if (!projetoId) return atividades
    return (
      atividades.filter((a) => a.projetoId === projetoId)
    )
  }, [projetoId, atividades])

  const handleSave = async () => {
    const horaInicioFormatada = formatarHoraInput(lancamento.horaInicio)
    const horaFimFormatada = formatarHoraInput(lancamento.horaFim)

    const payload = {
      descricao: lancamento.descricao,
      data_lancamento: lancamento.dataLancamento,
      hora_inicio: horaInicioFormatada,
      hora_fim: horaFimFormatada,
      status_aprovacao: lancamento.status_aprovacao,
      atividade_id: lancamento.atividadeId,
      projeto_id: lancamento.projetoId,
      cliente_id: lancamento.clienteId,
    }

    const res = await apiFetch(`/lancamentos/edit/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
    if (!res.error) {
      setIsEditing(false)
      setReload((prev) => !prev)
      // setLancamento(payload)
    } else toast.error(res.message || "Erro ao salvar")
  }

  const formatarDuracao = (horasDecimais: number | undefined) => {
    if (horasDecimais === undefined || horasDecimais === null) return "—"
    const totalMinutos = Math.round(horasDecimais * 60)
    const horas = Math.floor(totalMinutos / 60)
    const minutos = totalMinutos % 60
    return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}h`
  }

  if (loading)
    return (
      <div className="flex h-full w-full items-center justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    )

  if (!lancamento) return <EmptyStyled />

  const tabsConfig = [
    { name: "detalhes", icon: Edit2 },
    { name: "despesas", icon: ClipboardList },
  ]

  return (
    <>
      <PageHeader
        title={lancamento?.descricao || "Lançamento"}
        tabs={tabsConfig}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        subtitle={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Projeto:</span>
            <Link
              to={`/projects/${lancamento.projetoId}`}
              className="text-blue-850 font-medium transition-colors hover:text-blue-800 hover:underline"
            >
              {lancamento?.nomeProjeto}
            </Link>
          </div>
        }
        buttons={
          <>
            {user?.id === lancamento.usuarioId && (
              !isEditing ? (
              <IconButton
                icon={<Edit2 className="h-4 w-4" />}
                label="Editar"
                onClick={() => setIsEditing(true)}
              />
            ) : (
              <IconButton
                icon={<Save className="h-4 w-4" />}
                label="Salvar"
                onClick={handleSave}
              />
            ))}
            {user?.id === lancamento.usuarioId && (
              <DeleteDialogGeral
                endpoint={`/lancamentos/delete/${id}`}
                nomeEntidade="Lançamento"
                nomeObjeto={lancamento.descricao}
                cascata={true}
                onSuccess={() => navigate(-1)}
              />
            )}
          </>
        }
      />

      <main className="min-h-0 w-full space-y-4 pr-4 pl-1">
        <Tabs value={activeTab}>
          <TabsContent value="detalhes" className="mt-4 rounded-md border p-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Descrição lançamento */}
              <Field>
                <FieldLabel>Descrição</FieldLabel>
                <Input
                  disabled={!isEditing}
                  value={lancamento?.descricao ?? ""}
                  className={isDisabledStyle(isEditing)}
                  onChange={(e) => {
                    setLancamento({ ...lancamento, descricao: e.target.value })
                  }}
                />
              </Field>

              {/* Data lançamento */}
              <Field>
                <FieldLabel>Data de lançamento</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={!isEditing}
                      className={`w-full justify-start text-left font-normal ${
                        !isEditing
                          ? "border-transparent bg-slate-50 opacity-100 shadow-none"
                          : ""
                      }`}
                    >
                      {lancamento?.dataLancamento ? (
                        format(new Date(lancamento.dataLancamento), "PPP", {
                          locale: ptBR,
                        })
                      ) : (
                        <span>—</span>
                      )}
                      <CalendarIcon className="mr-2 ml-auto h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      fixedWeeks
                      locale={ptBR}
                      selected={
                        lancamento?.dataLancamento
                          ? new Date(lancamento.dataLancamento)
                          : undefined
                      }
                      onSelect={(d) => {
                        setLancamento({ ...lancamento, dataLancamento: d })
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </Field>

              {/* Hora inicio */}
              <Field>
                <FieldLabel>Hora início</FieldLabel>
                <Input
                  type="time"
                  disabled={!isEditing}
                  value={formatarHoraInput(lancamento?.horaInicio)}
                  className={isDisabledStyle(isEditing)}
                  onChange={(e) => {
                    setLancamento({
                      ...lancamento,
                      horaInicio: e.target.value,
                    })
                  }}
                />
              </Field>

              {/* Hora fim */}
              <Field>
                <FieldLabel>Hora fim</FieldLabel>
                <Input
                  type="time"
                  disabled={!isEditing}
                  value={formatarHoraInput(lancamento?.horaFim)}
                  className={isDisabledStyle(isEditing)}
                  onChange={(e) => {
                    setLancamento({ ...lancamento, horaFim: e.target.value })
                  }}
                />
              </Field>

            {/* Seletor de cliente */}
              <SeletorSearchBar
                label="Parceiro"
                items={clientes}
                value={lancamento?.clienteId}
                onValueChange={handleClienteChange}
                placeholder="Selecione um parceiro"
                searchPlaceholder="Buscar parceiro..."
                emptyMessage="Nenhum parceiro encontrado"
                disabled={!isEditing}
              />
              

            {/* Seletor de projeto */}
              <SeletorSearchBar
                label="Projeto"
                items={projetosFiltrados}
                value={lancamento?.projetoId}
                onValueChange={handleProjetoChange}
                placeholder="Selecione um projeto"
                searchPlaceholder="Buscar projeto..."
                emptyMessage="Nenhum projeto encontrado"
                disabled={!isEditing}
              />

            {/* Seletor de atividade */}
              <SeletorSearchBar
                label="Atividade"
                items={atividadesfiltradas}
                value={lancamento?.atividadeId}
                onValueChange={(value) => {
                  setLancamento({ ...lancamento, atividadeId: value })
                }}
                placeholder="Selecione uma atividade"
                searchPlaceholder="Buscar atividade..."
                emptyMessage="Nenhuma atividade encontrado"
                disabled={!isEditing}
              />
            </div>
          </TabsContent>
          <TabsContent value="despesas" className="mt-4 rounded-md border p-4">
            <IncompleteSection />
          </TabsContent>
        </Tabs>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-semibold">Dados do Lançamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Colaborador */}
              <div className="flex gap-3">
                <Users className="mt-0.5 h-6 w-6 text-slate-400" />
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-slate-400">
                    Colaborador:
                  </p>
                  <p className="text-sm font-medium">
                    {lancamento?.nomeUsuario}
                  </p>
                </div>
              </div>

              {/* Duração calculada */}
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-6 w-6 text-slate-400" />
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-slate-400">
                    Tempo Total:
                  </p>
                  <p className="text-sm font-bold text-primary">
                    {formatarDuracao(lancamento?.duracao)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
