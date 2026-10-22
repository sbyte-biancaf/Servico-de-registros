import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { apiFetch, isDisabledStyle } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Edit2,
  Loader2,
  FolderKanban,
  ClipboardList,
  Clock,
  Plus,
  Check,
  SquareArrowRightEnter,
  ArrowLeft
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "../ui/badge"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { IconButton } from "@/components/ui/icon-button-tooltip"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { DeleteDialogGeral } from "../delete-dialog-geral"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { EmptyStyled } from "../empty-comp"
import { useWorkspace } from "@/contexts/workspace-context"
import { Field, FieldLabel } from "@/components/ui/field"

export function EmployeeDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const canLeave = currentWorkspace?.isOwner || currentWorkspace?.isAdmin
  const isUsuarioLogado = user?.id === id;

  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState<any>(null)
  const [colaborador, setColaborador] = useState<any>(null)
  const [projeto, setProjeto] = useState<any>(null)
  const [atividades, setAtividades] = useState<any>(null)
  const [lancamentos, setLancamentos] = useState<any>(null)

  const [activeTab, setActiveTab] = useState("detalhe")
  const [reload, setReload] = useState(true)

  const statusOptions = [
    { value: "true", label: "Ativo" },
    { value: "false", label: "Inativo" },
  ]

  const tabsConfig = [
    { name: "detalhe", icon: Edit2 },
    { name: "projetos", icon: FolderKanban },
    { name: "atividades", icon: ClipboardList },
    ...(isUsuarioLogado || canLeave ? [{ name: "lancamentos", icon: Clock }] : []),
  ]

  useEffect(() => {
    if (currentWorkspace?.isOwner || currentWorkspace?.isAdmin) {
      async function fetchstats() {
        setLoading(true)
        const response = await apiFetch(`/usuarios/stats/${id}`)

        if (!response.error) {
          setStats(response.data)
          setLoading(false)
          return
        }
      }
      fetchstats()
    }

    const loadData = async () => {
      setLoading(true)
      const response = await apiFetch(`/usuarios/list/${id}`)

      if (!response.error) {
        setColaborador(response.data)
        setProjeto(response.data.projetos)
        const listaAtividades = response.data.projetos?.flatMap((p: any) =>
          p.atividades.map((a: any) => ({ ...a, projeto_id: p.id }))
        )
        setAtividades(listaAtividades)
        setLancamentos(response.data.lancamentos)
        // setLancamentos(response.data.lancamentos || [])
        setLoading(false)
        return
      }

      toast.error(response.message)
      setLoading(false)
      return
    }
    loadData()
    // fetchInit()
  }, [id, reload, currentWorkspace?.isOwner, currentWorkspace?.isAdmin])

  const handleRemoveUser = async () => {
    setLoading(true)
    const ret = await apiFetch(`/empresas/usuario/remove/${id}`, {
      method: "DELETE",
    })

    if (ret.error) {
      toast.error(ret.message)
    } else {
      toast.success("Usuario foi retirado da sua empresa!")
    }


    setLoading(false)
    navigate("/employees")
    return
  }

  const isAtivo =
    colaborador?.isActive === true || colaborador?.isActive === "true"

  const statusValue =
    typeof colaborador?.isActive === "boolean"
      ? String(colaborador.isActive)
      : "true"

  const headerSubtitle = (
    <Badge
      className={`${isAtivo ? "bg-green-600" : "bg-red-600"} border-none text-white`}
    >
      {isAtivo ? "Ativo" : "Inativo"}
    </Badge>
  )

  if (!loading && !colaborador) {
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
        title={colaborador.nomeCompleto}
        subtitle={headerSubtitle}
        tabs={tabsConfig}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        buttons={
          <>
            {user?.id !== colaborador.id && canLeave && (
              <IconButton
                variant="destructive"
                icon={<SquareArrowRightEnter className="size-4" />}
                label="Retirar da empresa"
                onClick={() => handleRemoveUser()}
              />
            )}
          </>
        }
      />

      <main className="min-h-0 w-full pr-4 pl-1">
        {stats && (
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: Clock, label: "Horas lançadas (mensal)", value: stats.totalHorasLancadas },
              { icon: ClipboardList, label: "Lançamentos (mensal)", value: stats.totalLancamentos },
              { icon: FolderKanban, label: "Projetos", value: stats.totalProjetos },
              { icon: ClipboardList, label: "Atividades", value: stats.totalAtividades },
            ].map(({ icon: Icon, label, value }, index) => (
              <Card key={index}>
                <CardHeader className="pb-1">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Icon className="size-4" />
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-bold">{value}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <Tabs value={activeTab}>
          <TabsContent value="detalhe" className="mt-4 rounded-md border p-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Field>
                <FieldLabel className="text-sm font-medium text-slate-500">
                  Nome completo
                </FieldLabel>
                <Input
                  disabled={true}
                  value={colaborador?.nomeCompleto}
                  className={isDisabledStyle(true)}
                  onChange={(e) =>
                    setColaborador({
                      ...colaborador,
                      nomeCompleto: e.target.value,
                    })
                  }
                />
              </Field>

              <Field>
                <FieldLabel className="text-sm font-medium text-slate-500">
                  Nome de usuário
                </FieldLabel>
                <Input
                  disabled={true}
                  value={colaborador?.nomeUsuario}
                  className={isDisabledStyle(true)}
                  onChange={(e) =>
                    setColaborador({
                      ...colaborador,
                      nomeUsuario: e.target.value,
                    })
                  }
                />
              </Field>

              <Field>
                <FieldLabel className="text-sm font-medium text-slate-500">
                  E-mail
                </FieldLabel>
                <Input
                  disabled={true}
                  value={colaborador?.email}
                  className={isDisabledStyle(true)}
                  onChange={(e) =>
                    setColaborador({
                      ...colaborador,
                      email: e.target.value,
                    })
                  }
                />
              </Field>

              <Field>
                <FieldLabel className="text-sm font-medium text-slate-500">
                  Status
                </FieldLabel>
                <Select
                  disabled={true}
                  value={statusValue}
                  onValueChange={(value) =>
                    setColaborador({
                      ...colaborador,
                      isActive: value === "true",
                    })
                  }
                >
                  <SelectTrigger className={isDisabledStyle(true)}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </TabsContent>

          <TabsContent value="projetos" className="mt-4 rounded-md border p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                Projetos vinculados:
              </h3>

              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" className="h-8 gap-2">
                    <Plus className="size-4" /> Adicionar
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-62.5 p-0" align="end">
                  <Command>
                    <CommandInput placeholder="Buscar Projetos..." />
                    <CommandList>
                      <CommandEmpty>Nenhum projeto encontrado</CommandEmpty>
                      <CommandGroup>
                        {projeto.map((projeto) => {
                          const isMember = colaborador?.projetos?.some(
                            (p: any) => p.projetoId === projeto.projetoId
                          )
                          return (
                            <CommandItem
                              key={projeto.projetoId}
                              // onSelect={() => handleUpdateEquipeProjeto(projeto)}
                            >
                              <div className="mr-2 flex h-4 w-4 items-center justify-center">
                                {isMember && <Check className="h-4 w-4" />}
                              </div>
                              {projeto.projetoNome}
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              {colaborador?.projetos?.length > 0 ? (
                colaborador.projetos.map((p: any, index: number) => {
                  const projectId = p?.projeto_id ?? p?.id
                  return (
                    <div
                      key={projectId ?? index}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <span className="min-w-0 truncate text-sm font-medium">
                        {p?.projetoNome || "Projeto"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          projectId
                            ? navigate(`/projects/${projectId}`)
                            : navigate("/projects")
                        }
                        aria-label="Abrir projeto"
                        title="Abrir"
                      >
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </Button>
                    </div>
                  )
                })
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Sem projetos.
                </p>
              )}
            </div>
          </TabsContent>

          {/* Parte das atividades */}
          <TabsContent
            value="atividades"
            className="mt-4 rounded-md border p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                Atividades vinculadas:
              </h3>

              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" className="h-8 gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-62.5 p-0" align="end">
                  <Command>
                    <CommandInput placeholder="Buscar Atividades..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma Atividade encontrada</CommandEmpty>
                      <CommandGroup>
                        {atividades &&
                          atividades.map((atividade) => {
                            const isMember = atividades?.some(
                              (a: any) =>
                                a.atividadeId === atividade.atividadeId
                            )
                            return (
                              <CommandItem
                                key={atividade.atividadeId}
                                // onSelect={handleUpdateEquipeAtividade}
                              >
                                <div className="mr-2 flex h-4 w-4 items-center justify-center">
                                  {isMember && <Check className="h-4 w-4" />}
                                </div>
                                {atividade.nomeAtividade}
                              </CommandItem>
                            )
                          })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              {atividades.length > 0 ? (
                atividades.map((a: any, index: number) => {
                  const activityId = a?.atividadeId
                  return (
                    <div
                      key={activityId ?? index}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <span className="min-w-0 truncate text-sm font-medium">
                        {a?.nomeAtividade || "Atividade"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          activityId
                            ? navigate(`/activities/${activityId}`)
                            : navigate("/activities")
                        }
                        aria-label="Abrir atividade"
                        title="Abrir"
                      >
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </Button>
                    </div>
                  )
                })
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Sem atividades.
                </p>
              )}
            </div>
          </TabsContent>

          {/* Parte dos lançamentos */}
          <TabsContent value="lancamentos">
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                Ultimos Lançamentos:
              </h3>
            </div>
            {lancamentos.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {lancamentos.map((lancamento) => (
                  <Card key={lancamento.id}>
                    <CardHeader className="pb-0">
                      <CardTitle className="truncate font-medium">
                        {lancamento.projeto?.nomeProjeto
                          ? `[${lancamento.projeto.nomeProjeto}] `
                          : ""}
                        {lancamento.dataLancamento
                          ? format(
                              new Date(lancamento.dataLancamento),
                              "dd/MM/yyyy"
                            )
                          : "-"}
                        {` - ${lancamento.duracaoTotal} horas`}
                      </CardTitle>
                      <CardAction className="flex h-0 gap-1">
                        {/* <IconButton
                          icon={<Edit2 className="h-4 w-4" />}
                          label="Editar"
                          onClick={() => setLancamentoSelecionado(lancamento)}
                        /> */}
                        {isUsuarioLogado && (
                          <DeleteDialogGeral
                            endpoint={`/lancamentos/delete/${lancamento.id}`}
                            nomeEntidade="Lançamento"
                            nomeObjeto={lancamento.descricao}
                            cascata={true}
                            onSuccess={() => setReload(!reload)}
                          />
                        )}
                      </CardAction>
                    </CardHeader>
                    <CardContent className="flex justify-between text-muted-foreground">
                      <div>
                        {lancamento.atividade?.nomeAtividade ? (
                          <span className="font-medium">
                            {lancamento.atividade.nomeAtividade} -{" "}
                          </span>
                        ) : null}
                        <span>{lancamento.descricao}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyStyled />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}
