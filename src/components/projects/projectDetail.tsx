import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { apiFetch, isDisabledStyle, statusProjetoMap } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"
import {
  Card,
  // CardContent,
  CardHeader,
  // CardTitle,
  CardAction,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import {
  ClipboardList,
  Edit2,
  Loader2,
  Save,
  Settings,
  Share2,
  Users,
  Check,
  Plus,
  Trash,
  User,
  DeleteIcon,
  OctagonX,
  CircleCheck,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Field, FieldLabel } from "@/components/ui/field"
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
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { DeleteDialogGeral } from "../delete-dialog-geral"
import { AddActivityModal } from "../activities/addActivitieModal"
import { EmptyStyled } from "../empty-comp"
import { DataTable } from "../data-table"
import { columnsActivityTab } from "./columnsActivityTab"

export function ProjectDetail() {
  const params = useParams()
  const id = params.id
  const navigate = useNavigate()

  const [projeto, setProjeto] = useState<any | null>(null)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("detalhe")
  const [isEditing, setIsEditing] = useState(false)
  const [reload, setReload] = useState(false)
  const [compartilharProjeto, setCompartilharProjeto] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [editavel, setEditavel] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      if (!id) {
        setProjeto(null)
        setLoading(false)
        return
      }

      const projRes = await apiFetch(`/projetos/list/${id}`)
      if (projRes.error) {
        setProjeto(null)
        toast.error(projRes.message || "Erro ao carregar projeto")
      } else {
        setProjeto(projRes.data)
        const atividades: any[] = projRes.data?.atividades ?? []
        setCompartilharProjeto(atividades.some((a) => a.compartilhado))
        setIsActive(projRes.data.isActive)
        setEditavel(projRes.data.compartilhado === false)
      }
      setLoading(false)
    }

    const fetchColaboradores = async () => {
      const res = await apiFetch("/usuarios/list")
      if (!res.error) setAllUsers(res.data)
    }

    fetchColaboradores()
    loadData()
  }, [id, reload])

  

  const handleInactivate = async () => {
    const res = await apiFetch(`/projetos/edit/${id}`, {
      method: "PUT",
      body: JSON.stringify({is_active: !isActive})
    })
    if (!res.error) {
      setReload(!reload)
    } else {
      toast.error(res?.message || "Erro ao Inativar.")
    }
  }

  const handleSave = async () => {
    const payload = {
      nome_projeto: projeto.nomeProjeto,
      descricao: projeto.descricao,
      // cliente_id: projeto.cliente_id ?? projeto.cliente?.id,
      data_inicio: projeto.dataInicio,
      data_fim: projeto.dataFim,
      status: projeto.status,
      horas_previstas:
        projeto.horasPrevistas === 0 ? "Em Aberto" : projeto.horasPrevistas,
      ref_cliente: projeto.refClienteProjeto,
      centro_custo: projeto.centroCusto,
      solicitante: projeto.solicitante,
      tipo: projeto.tipoProjeto,
    }

    const res = await apiFetch(`/projetos/edit/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })

    if (!res.error) {
      setIsEditing(false)
      setReload(!reload)
    } else toast.error(res?.message || "Erro ao salvar.")
  }

  const handleEquipe = async (userId: string, remove: boolean = false) => {
    const colab = allUsers.find((us) => us.usuarioId === userId)

    let newTeam: string[] = []
    let filteredEquipe: any
    if (remove) {
      filteredEquipe = projeto.equipe.filter(
        (us: any) => us.usuarioId !== userId
      )
      newTeam = filteredEquipe?.flatMap((user: any) => user.usuarioId)
    }

    const body = {
      equipe: remove
        ? newTeam
        : [...projeto.equipe.flatMap((user: any) => user.usuarioId), userId],
    }
    const response = await apiFetch(`/projetos/edit/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    })

    if (!response.error) {
      // projeto.equipe.push(colab)
      setProjeto((prev: any) => ({
        ...prev,
        equipe: remove ? filteredEquipe : [...prev.equipe, colab],
      }))
    }
  }

  const todasAtividades = (): string[] =>
    projeto?.atividades?.map((a: any) => a.atividadeId) ?? []

  const apiCompartilhar = (atividades: string[]) => {
    apiFetch(`/partner/${id}/${projeto.clienteId}`, {
      method: "POST",
      body: JSON.stringify({ atividades }),
    })
  }

  const apiRemoverCompartilhamento = (atividades?: string[]) => {
    apiFetch(`/partner/${id}/${projeto.clienteId}`, {
      method: "DELETE",
      body: JSON.stringify(atividades ? { atividades } : {}),
    })
  }

  const toggleCompartilharProjeto = (checked: boolean) => {
    const todasIds = todasAtividades()
    setCompartilharProjeto(checked)
    setProjeto((prev: any) => ({
      ...prev,
      atividades: prev.atividades.map((a: any) => ({ ...a, compartilhado: checked })),
    }))
    if (checked) apiCompartilhar(todasIds)
    else apiRemoverCompartilhamento()
  }

  const toggleAtividade = (atividadeId: string, checked: boolean) => {
    const updatedAtividades = projeto.atividades.map((a: any) =>
      a.atividadeId === atividadeId ? { ...a, compartilhado: checked } : a
    )
    setProjeto((prev: any) => ({ ...prev, atividades: updatedAtividades }))
    const ids = updatedAtividades.filter((a: any) => a.compartilhado).map((a: any) => a.atividadeId)
    if (checked) apiCompartilhar(ids)
    else apiRemoverCompartilhamento([atividadeId])
  }

  const selecionarTodasAtividades = () => {
    setProjeto((prev: any) => ({
      ...prev,
      atividades: prev.atividades.map((a: any) => ({ ...a, compartilhado: true })),
    }))
    apiCompartilhar(todasAtividades())
  }

  const tabsConfig = [
    { name: "detalhe", icon: Edit2 },
    { name: "equipe", icon: Users },
    { name: "atividades", icon: ClipboardList },
    ...(editavel ? [{ name: "configuracoes", icon: Settings }] : []),
  ]

  if (!loading && !projeto) {
    return <EmptyStyled />
  }

  if (loading)
    return (
      <div className="flex h-full w-full items-center justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    )

  return (
    <>
      <PageHeader
        title={`Projeto: ${projeto?.nomeProjeto}`}
        tabs={tabsConfig}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        subtitle={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Parceiro:</span>
            {projeto?.clienteId ? (
              <Link
                to={`/clients/${projeto.clienteId}`}
                className="text-blue-850 font-medium transition-colors hover:text-blue-800 hover:underline"
              >
                {projeto.nomeCliente}
              </Link>
            ) : (
              <span className="text-slate-500">Sem nome</span>
            )}
          </div>
        }
        buttons={
          <>
            <Badge
              className={`${statusProjetoMap.get(projeto.status)?.color} mt-1 mr-2 border-none text-white`}
            >
              {statusProjetoMap.get(projeto.status)?.label}
            </Badge>
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
              )
            )}
            {editavel && (
              <DeleteDialogGeral
                endpoint={`/projetos/delete/${id}`}
                nomeEntidade="Projeto"
                nomeObjeto={projeto?.nomeProjeto ?? ""}
                cascata={false}
                onSuccess={() => navigate("/projects")}
              />
            )}
          </>
        }
      />

      <main className="min-h-0 w-full space-y-4 pr-4 pl-1">
        <Tabs value={activeTab}>
          <TabsContent value="detalhe" className="mt-4 rounded-md border p-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Nome */}
              <Field>
                <FieldLabel htmlFor="nomeProjeto">Nome</FieldLabel>
                <Input
                  disabled={!isEditing}
                  value={projeto?.nomeProjeto}
                  className={isDisabledStyle(isEditing)}
                  onChange={(e) =>
                    setProjeto({ ...projeto, nomeProjeto: e.target.value })
                  }
                />
              </Field>

              {/* Descrição */}
              <Field>
                <FieldLabel htmlFor="descricao">Descrição</FieldLabel>
                <Input
                  disabled={!isEditing}
                  value={projeto?.descricao}
                  className={isDisabledStyle(isEditing)}
                  onChange={(e) =>
                    setProjeto({ ...projeto, descricao: e.target.value })
                  }
                />
              </Field>

              {/* Status */}
              <Field>
                <FieldLabel htmlFor="nomeProjeto">Status</FieldLabel>
                <Select
                  disabled={!isEditing}
                  value={projeto.status}
                  onValueChange={(value) =>
                    setProjeto({
                      ...projeto,
                      status: value,
                    })
                  }
                >
                  <SelectTrigger className={isDisabledStyle(isEditing)}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EmEspera">Em Espera</SelectItem>
                    <SelectItem value="Orcando">Orçando</SelectItem>
                    <SelectItem value="EmAndamento">Em Andamento</SelectItem>
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {/* Horas previstas */}
              <Field>
                <FieldLabel htmlFor="horasPrevistas">
                  Horas previstas (campo zerado para horas em aberto)
                </FieldLabel>
                <Input
                  type="number"
                  disabled={!isEditing}
                  placeholder={
                    projeto?.horasPrevistas === "Em Aberto"
                      ? "Projeto com horas em aberto"
                      : undefined
                  }
                  value={projeto?.horasPrevistas}
                  className={isDisabledStyle(isEditing)}
                  onChange={(e) =>
                    setProjeto({
                      ...projeto,
                      horasPrevistas: Number(e.target.value),
                    })
                  }
                />
              </Field>

              {/* Data início */}
              <Field>
                <FieldLabel htmlFor="status">Início</FieldLabel>
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
                      {projeto?.dataInicio ? (
                        format(new Date(projeto.dataInicio), "PPP", {
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
                        projeto?.dataInicio
                          ? new Date(projeto.dataInicio)
                          : undefined
                      }
                      onSelect={(d) =>
                        setProjeto({ ...projeto, dataInicio: d })
                      }
                    />
                  </PopoverContent>
                </Popover>
              </Field>

              {/* Data fim */}
              <Field>
                <FieldLabel htmlFor="status">Fim</FieldLabel>
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
                      {projeto?.dataFim ? (
                        format(new Date(projeto.dataFim), "PPP", {
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
                        projeto?.dataFim ? new Date(projeto.dataFim) : undefined
                      }
                      onSelect={(d) => setProjeto({ ...projeto, dataFim: d })}
                    />
                  </PopoverContent>
                </Popover>
              </Field>

              {/* Ref parceiro */}
              <Field>
                <FieldLabel htmlFor="refClientes">
                  Referência externa
                </FieldLabel>
                <Input
                  disabled={!isEditing}
                  value={projeto?.refClienteProjeto}
                  className={isDisabledStyle(isEditing)}
                  onChange={(e) =>
                    setProjeto({
                      ...projeto,
                      refClienteProjeto: e.target.value,
                    })
                  }
                />
              </Field>

              {/* campo tipo */}
              <Field>
                <FieldLabel htmlFor="tipo">Tipo: </FieldLabel>
                <Select
                  disabled={!isEditing}
                  value={projeto.tipoProjeto}
                  onValueChange={(value) =>
                    setProjeto({
                      ...projeto,
                      tipoProjeto: value,
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

              {/* Centro de custo */}
              <Field>
                <FieldLabel htmlFor="centroCusto">
                  Centro de custo
                </FieldLabel>
                <Input
                  disabled={!isEditing}
                  value={projeto?.centroCusto}
                  className={isDisabledStyle(isEditing)}
                  onChange={(e) =>
                    setProjeto({
                      ...projeto,
                      centroCusto: e.target.value,
                    })
                  }
                />
              </Field>

              {/* Solicitante */}
              <Field>
                <FieldLabel htmlFor="solicitante">
                  Solicitante
                </FieldLabel>
                <Input
                  disabled={!isEditing}
                  value={projeto?.solicitante}
                  className={isDisabledStyle(isEditing)}
                  onChange={(e) =>
                    setProjeto({
                      ...projeto,
                      solicitante: e.target.value,
                    })
                  }
                />
              </Field>
            </div>
          </TabsContent>

          {/* Tabs de atividades */}
          <TabsContent
            value="atividades"
            className=""
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Atividades vinculadas ao Projeto:
                </h3>
                {editavel && (
                  compartilharProjeto && projeto?.atividades?.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={selecionarTodasAtividades}
                    >
                      Selecionar todas
                    </Button>
                  )
                )}
              </div>
              {editavel && (
                <AddActivityModal
                  projetoId={projeto.projetoId}
                  onSuccess={() => setReload(!reload)}
                />
              )}
            </div>
            <div className="">
              <DataTable
                clickable
                columns={columnsActivityTab()}
                onRowClick={(row: any) => {
                  navigate(`/activities/${row.atividadeId}`)
                }}
                data={projeto.atividades}
                filterPlaceholder="Pesquisar por atividade"
                filterColumn={["nomeAtividade", "refClienteAtividade", "solicitante", "centroCusto", "tipo"]}
              />
              {/* {projeto?.atividades && projeto.atividades.length > 0 ? (
                projeto.atividades.map((atv: any) => {
                  const atividadeId = atv?.atividadeId
                  return (
                    <div
                      key={atividadeId}
                      className="flex items-center gap-3 rounded-md border bg-white p-3"
                    >
                      <Link
                        to={atividadeId ? `/activities/${atividadeId}` : "/activities"}
                        className="flex-1 text-sm font-medium hover:underline"
                        >
                        {atv.nomeAtividade}
                      </Link>
                        {editavel && (
                          compartilharProjeto && (
                            <Checkbox
                              checked={atv.compartilhado}
                              onCheckedChange={(checked) =>
                                toggleAtividade(atividadeId, !!checked)
                              }
                            />
                          )
                        )}
                    </div>
                  )
                })
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Sem atividades.
                </p>
              )} */}
            </div>
          </TabsContent>

          {/* Configurações */}
          <TabsContent value="configuracoes" className="mt-4 rounded-md border p-4 space-y-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold">Compartilhamento</p>
                <p className="text-xs text-muted-foreground">Controle o que o parceiro pode visualizar.</p>
              </div>
              <Separator />
              <div className="flex items-center gap-3 rounded-md border p-3">
                <Share2 className="size-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <Label htmlFor="share-project" className="cursor-pointer font-medium">
                    Compartilhar projeto com parceiro
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    As atividades marcadas abaixo serão visíveis para o parceiro.
                  </p>
                </div>
                <Switch
                  id="share-project"
                  checked={compartilharProjeto}
                  onCheckedChange={toggleCompartilharProjeto}
                />
              </div>
            </div>

            {compartilharProjeto && (
              <p className="text-xs text-muted-foreground">
                Gerencie quais atividades são visíveis na aba <strong>Atividades</strong>.
              </p>
            )}
          </TabsContent>

          {/* Equipe */}
          <TabsContent value="equipe">
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                Equipe do Projeto:
              </h3>

              <Popover>
                <PopoverTrigger asChild>
                  {editavel && (
                    <Button size="sm" className="h-8 gap-2">
                      <Plus className="size-4" /> Editar Equipe
                    </Button>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-62.5 p-0" align="end">
                  <Command>
                    <CommandInput placeholder="Buscar colaborador..." />
                    <CommandList>
                      <CommandEmpty>Nenhum encontrado.</CommandEmpty>
                      <CommandGroup>
                        {allUsers.map((colab) => {
                          const inTeam = projeto.equipe?.find(
                            (m: any) => m.usuarioId === colab.usuarioId
                          )
                          return (
                            <CommandItem
                              className="text-between flex-1"
                              key={colab.usuarioId}
                              value={colab.usuarioId}
                              onSelect={(e) => handleEquipe(e, inTeam)}
                            >
                              {colab.nomeCompleto}
                              {inTeam && <Check className="size-4" />}
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {projeto.equipe?.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {projeto.equipe.map((membro: any) => (
                  <Card key={membro.usuarioId}>
                    <CardHeader className="mb-0 pb-0">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-12">
                          <AvatarImage src={import.meta.env.VITE_ICHIGO} />
                          <AvatarFallback>
                            {membro.nomeCompleto?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm leading-tight font-medium">
                            {membro.nomeCompleto}
                          </span>
                          <span className="text-xs leading-tight text-muted-foreground">
                            Nome de usuário: {membro.nomeUsuario}
                          </span>
                        </div>
                      </div>
                      <CardAction className="flex gap-2">
                        <IconButton
                          label="Perfil"
                          icon={<User className="size-4" />}
                          onClick={() =>
                            navigate(`/employees/${membro.usuarioId}`)
                          }
                        />
                        {editavel && (
                          <IconButton
                            variant="destructive"
                            label="Remover"
                            icon={<Trash className="size-4" />}
                            onClick={() => handleEquipe(membro.usuarioId, true)}
                          />
                        )}
                      </CardAction>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum membro alocado.
              </p>
            )}
          </TabsContent>
        </Tabs>

      </main>
    </>
  )
}
