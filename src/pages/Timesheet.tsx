import { useState, useEffect } from "react"
import {
  SelectTrigger,
  SelectItem,
  SelectContent,
  Select,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { columns } from "../components/timesheet/columns"
import { Loader2, Users, User } from "lucide-react"
import { apiFetch } from "@/lib/utils"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useWorkspace } from "@/contexts/workspace-context"
import { useAuth } from "@/contexts/auth-context"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  LancamentoCard,
  type DataType,
} from "@/components/timesheet/lancamentoCard"
import { IconButton } from "@/components/ui/icon-button-tooltip"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export function TimesheetPage() {
  const navigate = useNavigate()
  const { currentWorkspace } = useWorkspace()
  const { user } = useAuth()
  const isPermited = currentWorkspace?.isOwner || currentWorkspace?.isAdmin
  const [searchParams, setSearchParams] = useSearchParams()

  const cargoOwner = Boolean(currentWorkspace?.isOwner || currentWorkspace?.isAdmin);

  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState()
  const [loading, setLoading] = useState(true)

  // Filtros de data e projeto
  const [projectsFilter, setProjectsFilter] = useState<any[]>([])
  const [projetos, setProjetos] = useState<DataType[]>([])
  const [atividades, setAtividades] = useState<DataType[]>([])
  const [clientes, setClientes] = useState<DataType[]>([])

  const anoAtual = new Date().getFullYear().toString()
  const mesAtual = (new Date().getMonth() + 1).toString().padStart(2, "0")
  const [reload, setReload] = useState(false)

  const filterProject = searchParams.get("projeto") || "all"
  const filtroAno = searchParams.get("ano") || anoAtual
  const filtroMes = searchParams.get("mes") || mesAtual
  const escopoFiltro = (searchParams.get("escopo") as "all" | "me") || "me"

  const updateFiltros = (key: string, value: string) => {
    setSearchParams(
      (prev) => {
        const atualizado = new URLSearchParams(prev)
        atualizado.set(key, value)
        return atualizado
      },
      {replace: true}
    )
  }

  const toggleEscopo = () => {
    updateFiltros("escopo", escopoFiltro === "all" ? "me" : "all")
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const params = new URLSearchParams()

      if (currentWorkspace?.isAdmin || currentWorkspace?.isOwner) {
        params.append(
          "role",
          currentWorkspace?.isAdmin
            ? "ADMIN"
            : currentWorkspace?.isOwner
              ? "OWNER"
              : "COLAB"
        )
      }
      if (filterProject && filterProject !== "all") {
        params.append("projeto_id", filterProject)
      }
      if (filtroAno && filtroAno !== "all") {
        params.append("ano", filtroAno)
      }
      if (filtroMes && filtroMes !== "all") {
        params.append("mes", filtroMes)
      }

      params.append("cargoOwner", cargoOwner ? "true" : "false");

      if (!isPermited || escopoFiltro === "me") {
        if (user?.id) {
          params.append("from", user?.id)
        }
      } else if (escopoFiltro === "all") {
        params.append("from", "all")
      }
      const response = await apiFetch(`/lancamentos/list/?${params.toString()}`)

      if (response.error)
        throw new Error(response.message || "Erro na requisição")

      setData(Array.isArray(response.data.data) ? response.data.data : [])
      setTotal(response.data.total)
      setLoading(false)
    }

    const fetchProjects = async () => {
      try {
        const projetos = await apiFetch("/projetos/list")
        if (projetos.error) {
          throw new Error(projetos.message || "Erro ao carregar projetos")
        }
        setProjectsFilter(Array.isArray(projetos.data) ? projetos.data : [])
      } catch (err) {
        console.error(err)
      }
    }
    fetchProjects()
    fetchData()

    const LancamentoCardData = async () => {
      const response = await apiFetch("/lancamentos/new-info")
      if (!response.error) {
        setAtividades(response.data.atividades)
        setProjetos(response.data.projetos)
        setClientes(response.data.clientes)
      }
    }

    LancamentoCardData()
  }, [
    filterProject,
    filtroAno,
    filtroMes,
    user,
    isPermited,
    escopoFiltro,
    reload,
    currentWorkspace,
  ])

  const mostrarColunaUsuario = isPermited && escopoFiltro === "all"

  return (
    <>
      <PageHeader
        title="Lançamentos"
        subtitle="Seus lançamentos de horas"
        // buttons={
        //   <IconButton
        //     variant={"default"}
        //     icon={<Plus />}
        //     label="Adicionar Lançamento"
        //     onClick={() => navigate("/timesheet/new")}
        //   />
        // }
      />
      <main className="min-h-0 w-full pr-4">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize="70%" minSize="60%" className="pr-6">
            {loading ? (
              <div className="flex min-h-100 w-full flex-col items-center justify-center gap-2">
                <Loader2 className="h-10 w-10 animate-spin text-blue-950" />
                <p className="animate-pulse text-sm text-muted-foreground">
                  Carregando lançamentos...
                </p>
              </div>
            ) : (
              <DataTable
                columns={columns(mostrarColunaUsuario)}
                data={data}
                filterColumn={[
                  "dataLancamento",
                  "nomeCliente",
                  "nomeProjeto",
                  "nomeAtividade",
                ]}
                clickable
                onRowClick={(row: any) =>
                  navigate(`/timesheet/${row.lancamentoId}`)
                }
                filterPlaceholder={"Filtrar..."}
                extraFilters={
                  <>
                    {/* Seletor de usuários do Owner */}
                    {isPermited && (
                      <div className="mt-5 flex flex-col gap-1">
                        {escopoFiltro === "all" ? (
                          <IconButton
                            icon={<Users className="h-4 w-4" />}
                            label="Todos os lançamentos"
                            onClick={() => toggleEscopo()}
                          />
                        ) : (
                          <IconButton
                            icon={<User className="h-4 w-4" />}
                            label="Meus lançamentos"
                            onClick={() => toggleEscopo()}
                          />
                        )}
                      </div>
                    )}
                    {/* Seletor de ano */}
                    <div className="flex flex-col gap-1">
                      <span className="pl-1 text-xs font-medium text-muted-foreground">
                        Ano
                      </span>
                      <Select
                        value={filtroAno}
                        defaultValue="all"
                        onValueChange={(value) => {
                          updateFiltros("ano", value)
                        }}
                      >
                        <SelectTrigger className="min-w-24">
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

                    {/* Seletor de mês */}
                    <div className="flex flex-col gap-1">
                      <span className="pl-1 text-xs font-medium text-muted-foreground">
                        Mês
                      </span>
                      <Select
                        value={filtroMes}
                        defaultValue={mesAtual}
                        onValueChange={(value) => {
                          updateFiltros("mes", value)
                        }}
                        disabled={filtroAno === "all"}
                      >
                        <SelectTrigger className="min-w-24">
                          <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {meses.map((mes) => (
                              <SelectItem key={mes.value} value={mes.value}>
                                {mes.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Seletor de projetos */}
                    <div className="flex flex-col gap-1">
                      <span className="pl-1 text-xs font-medium text-muted-foreground">
                        Projetos
                      </span>
                      <Select
                        defaultValue="all"
                        onValueChange={(value) => {
                          updateFiltros("projeto", value)
                        }}
                        value={filterProject}
                      >
                        <SelectTrigger className="min-w-30">
                          <SelectValue placeholder="Projetos" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Projetos</SelectLabel>
                            <SelectItem key="all" value="all">
                              Todos os projetos
                            </SelectItem>
                            {projectsFilter.map((project: any) => (
                              <SelectItem
                                key={project.projetoId}
                                value={String(project.projetoId)}
                              >
                                {project.nomeProjeto}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                }
              />
            )}
            <div className="mt-4 flex items-center gap-2">
              <Label>Horas totais:</Label>
              <Badge variant="default" className="text-sm">{total}</Badge>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize="20%" minSize="35%" className="py-4 pl-6">
            <LancamentoCard
              projetosProp={{ data: projetos, showInfo: true }}
              atividadesProp={{ data: atividades, showInfo: true }}
              clientesProp={{ data: clientes, showInfo: true }}
              lancamentoData={null}
              onSaved={() => setReload(!reload)}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </>
  )
}
