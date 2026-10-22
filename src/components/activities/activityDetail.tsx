import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { apiFetch } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"
import { toast } from "sonner"
import { isDisabledStyle, handlePriorityColor } from "@/lib/utils"
import { CalendarIcon, Edit2, Save, Loader2, CircleCheck, OctagonX } from "lucide-react"
import { DeleteDialogGeral } from "../delete-dialog-geral"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { Field, FieldLabel } from "@/components/ui/field"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button-tooltip"
import { EmptyStyled } from "../empty-comp"

export function ActivityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("detalhe")

  const [atividade, setAtividade] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [editavel, setEditavel] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      if (!id) {
        setAtividade(null)
        setLoading(false)
        return
      }

      const atividadeRes = await apiFetch(`/atividades/list/${id}`)
      if (atividadeRes.error) {
        setAtividade(null)
        toast.error(atividadeRes.message || "Erro ao carregar projeto")
      } else {
        setAtividade(atividadeRes.data)
        setIsActive(atividadeRes.data.isActive)
        setEditavel(atividadeRes.data.compartilhado === false)
      }
      setLoading(false)
    }

    loadData()
  }, [id, reload])

  const handleInactivate = async () => {
    const res = await apiFetch(`/atividades/edit/${id}`, {
      method: "PUT",
      body: JSON.stringify({is_active: !isActive})
    })
    if (!res.error) {
      setReload(!reload)
    } else {
      toast.error(res?.message || "Erro ao Inativar.")
    }
  }

  const isCentroCustoFromProjeto = Boolean(atividade?.projeto?.centroCusto)
  const isSolicitanteFromProjeto = Boolean(atividade?.projeto?.solicitante)

  const handleSave = async () => {
    const res = await apiFetch(`/atividades/edit/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        nome_atividade: atividade?.nomeAtividade,
        descr_atividade: atividade?.descrAtividade,
        tipo_atividade: atividade?.tipoAtividade,
        prioridade: atividade?.prioridade,
        data_prevista_inicio: atividade?.previsaoInicio,
        data_prevista_fim: atividade?.previsaoFim,
        horas_previstas: atividade?.horasPrevistas,
        ref_cliente: atividade?.refCliente,
        centro_custo: atividade?.centroCusto,
        solicitante: atividade?.solicitante,
      }),
    })

    if (!res.error) {
      setIsEditing(false)
      // toast.success("Atividade atualizada com sucesso")
    } else toast.error("Erro ao salvar.")
  }

  const tabsConfig = [{ name: "detalhe", icon: Edit2 }]

  if (!loading && !atividade) {
    return <EmptyStyled />
  }

  if (loading)
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="size-14 animate-spin" />
      </div>
    )

  return (
    <>
      <PageHeader
        title={`Atividade: ${atividade?.nomeAtividade}`}
        subtitle={
          <Link
            to={`/projects/${atividade?.projeto?.projetoId}`}
            className="text-blue-850 font-medium transition-colors hover:text-blue-800 hover:underline"
          >
            Projeto: {atividade?.projeto?.nomeProjeto || "Abrir"}
          </Link>
        }
        buttons={
          <>
            {editavel && (
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
              )
            )}
            {editavel && (
              isActive ? (
              <IconButton
                icon={<OctagonX className="h-4 w-4" />}
                variant={"destructive"}
                label="Inativar"
                onClick={handleInactivate}
              />
            ) : (
              <IconButton
                icon={<CircleCheck className="h-4 w-4" />}
                variant={"default"}
                label="Ativar"
                onClick={handleInactivate}
              />
            ))}
            {editavel && (
              <DeleteDialogGeral
                endpoint={`/atividades/delete/${id}`}
                nomeEntidade="Atividade"
                nomeObjeto={atividade?.nomeAtividade}
                onSuccess={() => navigate("/activities")}
              />
            )}
          </>
        }
        tabs={tabsConfig}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="min-h-0 w-full space-y-4 pr-4 pl-1">
        <Tabs value={activeTab}>
          <TabsContent value="detalhe" className="mt-4 rounded-md border p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="nomeAtividade">Atividade</FieldLabel>
                <Input
                  disabled={!isEditing}
                  value={atividade?.nomeAtividade}
                  className={isDisabledStyle(isEditing)}
                  onChange={(e) =>
                    setAtividade({
                      ...atividade,
                      nomeAtividade: e.target.value,
                    })
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="descricao">Descrição</FieldLabel>
                <Input
                  disabled={!isEditing}
                  value={atividade?.descrAtividade}
                  className={isDisabledStyle(isEditing)}
                  onChange={(e) =>
                    setAtividade({
                      ...atividade,
                      descrAtividade: e.target.value,
                    })
                  }
                />
              </Field>

              {/* campo tipo */}
              <Field>
                <FieldLabel htmlFor="tipo">Tipo: </FieldLabel>
                <Select
                  disabled={!isEditing}
                  value={atividade.tipoAtividade}
                  onValueChange={(value) =>
                    setAtividade({
                      ...atividade,
                      tipoAtividade: value,
                    })
                  }
                >
                  <SelectTrigger className={isDisabledStyle(isEditing)}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCC">Sem Tipo</SelectItem>
                    <SelectItem value="ESTIMATIVA">Estimativa</SelectItem>
                    <SelectItem value="ORCADO">Orçado</SelectItem>
                    <SelectItem value="INTERNO">Interno</SelectItem>
                    <SelectItem value="CHAMADO">Chamado</SelectItem>
                    <SelectItem value="ESTUDO">Estudo</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {/* prioridade de atividade */}
              <Field>
                <FieldLabel htmlFor="descricao">Prioridade</FieldLabel>
                <Select
                  disabled={!isEditing}
                  value={atividade.prioridade}
                  onValueChange={(value) =>
                    setAtividade({
                      ...atividade,
                      prioridade: value,
                    })
                  }
                >
                  <SelectTrigger
                    className={`${handlePriorityColor(Number(atividade.prioridade))}`}
                  >
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAIXA">Baixa</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="ALTA">Alta</SelectItem>
                    <SelectItem value="CRITICA">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="dt_previsao_fim">
                  Data prevista Inicio
                </FieldLabel>
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
                      {atividade?.previsaoInicio ? (
                        format(new Date(atividade.previsaoInicio), "PPP", {
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
                        atividade?.previsaoInicio
                          ? new Date(atividade.previsaoInicio)
                          : undefined
                      }
                      onSelect={(date) =>
                        setAtividade({
                          ...atividade,
                          previsaoInicio: date,
                        })
                      }
                    />
                  </PopoverContent>
                </Popover>
              </Field>

              <Field>
                <FieldLabel htmlFor="dt_previsao_fim">
                  Data prevista Fim
                </FieldLabel>
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
                      {atividade?.previsaoFim ? (
                        format(new Date(atividade.previsaoFim), "PPP", {
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
                        atividade?.previsaoFim
                          ? new Date(atividade.previsaoFim)
                          : undefined
                      }
                      onSelect={(date) =>
                        setAtividade({
                          ...atividade,
                          previsaoFim: date,
                        })
                      }
                    />
                  </PopoverContent>
                </Popover>
              </Field>

              <Field>
                <FieldLabel htmlFor="horas_previstas">
                  Horas previstas
                </FieldLabel>
                <Input
                  disabled={!isEditing}
                  type="number"
                  value={atividade?.horasPrevistas ?? "Em Aberto"}
                  className={isDisabledStyle(isEditing)}
                  onChange={(e) =>
                    setAtividade({
                      ...atividade,
                      horasPrevistas: e.target.value,
                    })
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="ref_cliente">
                  Referência externa
                </FieldLabel>
                <Input
                  disabled={!isEditing}
                  value={atividade?.refCliente}
                  className={isDisabledStyle(isEditing)}
                  onChange={(e) =>
                    setAtividade({
                      ...atividade,
                      refCliente: e.target.value,
                    })
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="centro_custo">
                  Centro de custo
                </FieldLabel>
                <Input
                  disabled={!isEditing || isCentroCustoFromProjeto}
                  value={atividade?.centroCusto}
                  className={isDisabledStyle(isEditing)}
                  onChange={(e) =>
                    setAtividade({
                      ...atividade,
                      centroCusto: e.target.value,
                    })
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="solicitante">
                  Solicitante
                </FieldLabel>
                <Input
                  disabled={!isEditing || isSolicitanteFromProjeto}
                  value={atividade?.solicitante}
                  className={isDisabledStyle(isEditing)}
                  onChange={(e) =>
                    setAtividade({
                      ...atividade,
                      solicitante: e.target.value,
                    })
                  }
                />
              </Field>
            </div>
          </TabsContent>
        </Tabs>
        {/* 
        {activeTab === "detalhe" && (
          <LancamentoCard
            projetosProp={{ data: [], showInfo: false }}
            atividadesProp={{ data: [], showInfo: false }}
            clientesProp={{ data: [], showInfo: false }}
            lancamentoData={{
              cliente_id: atividade?.clienteId,
              projeto_id: atividade?.projetoId,
              atividade_id: id,
            }}
            blocked={false}
          />
        )} */}
      </main>
    </>
  )
}
