import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { apiFetch, isDisabledStyle } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { PartnershipModal } from "./partnershipModal"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import {
  Clock,
  Edit2,
  FolderKanban,
  Loader2,
  Receipt,
  Save,
  Share2,
  ChevronDownIcon,
  OctagonX,
  CircleCheck
} from "lucide-react"
import { IconButton } from "@/components/ui/icon-button-tooltip"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { AddProjectModal } from "../projects/addProjectModal"
import { DeleteDialogGeral } from "../delete-dialog-geral"
import { EmptyStyled } from "../empty-comp"
import { useWorkspace } from "@/contexts/workspace-context"

const formatarCNPJ = (valor: string) => {
  const v = valor.replace(/[^A-Z0-9]/gi, "").toUpperCase()
  return v
    .replace(/^([A-Z0-9]{2})([A-Z0-9])/, "$1.$2")
    .replace(/^([A-Z0-9]{2})\.([A-Z0-9]{3})([A-Z0-9])/, "$1.$2.$3")
    .replace(/\.([A-Z0-9]{3})([A-Z0-9])/, ".$1/$2")
    .replace(/([A-Z0-9]{4})([A-Z0-9])/, "$1-$2")
    .substring(0, 18)
}

export function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState("detalhe")
  const [cliente, setCliente] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [reload, setReload] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [editavel, setEditavel] = useState(false)
  const [identificadorInput, setIdentificadorInput] = useState("")
  const { currentWorkspace } = useWorkspace()
  const isOwner = currentWorkspace?.isOwner || currentWorkspace?.isAdmin

  const handleSave = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (cliente.email && !emailRegex.test(cliente.email)) {
      toast.error("Por favor, insira um e-mail válido.")
      return
    }

    const payload = {
      nome_cliente: cliente.nomeCliente,
      email: cliente.email,
      cnpj: cliente.cnpj.replace(/[^A-Z0-9]/gi, ""),
      cep: cliente.cep,
      endereco: cliente.endereco,
      cidade: cliente.cidade,
      estado: cliente.estado,
      identificador_parceiro: identificadorInput.trim() || null,
    }

    const response = await apiFetch(`/clientes/edit/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })

    if (response.error) {
      toast.error(response.message || "Erro ao salvar.")
      return
    }
    setIsEditing(false)
    setReload(!reload)
  }

  useEffect(() => {
    const fetchCliente = async () => {
      if (!id) return
      try {
        setLoading(true)
        const res = await apiFetch(`/clientes/list/${id}`)
        if (res.error) {
          setCliente(null)
        } else {
          setCliente(res.data)
          setIsActive(res.data.status)
          setEditavel(res.data.compartilhado === false)
          setIdentificadorInput(res.data.identificadorParceiro || "")
        }
      } catch (err) {
        setCliente(null)
      } finally {
        setLoading(false)
      }
    }

    fetchCliente()
  }, [id, reload])
  

  const handleInactivate = async () => {
    const res = await apiFetch(`/clientes/edit/${id}`, {
      method: "PUT",
      body: JSON.stringify({status: !isActive})
    })
    if (!res.error) {
      setReload(!reload)
    } else {
      toast.error(res?.message || "Erro ao Inativar.")
    }
  }

  const projetos = useMemo(() => {
    const list = cliente?.projetos
    return Array.isArray(list) ? list : []
  }, [cliente?.projetos])

  if (!loading && !cliente) {
    return <EmptyStyled />
  }

  if (loading)
    return (
      <div className="flex h-full w-full items-center justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    )

  const tabsConfig = [
    { name: "detalhe", icon: Edit2 },
    { name: "projetos", icon: FolderKanban },
  ]

  const cards = [
    { icon: FolderKanban, label: "Projetos", value: cliente.projetosNumero },
    {
      icon: Clock,
      label: "Total de Horas Gastas",
      value: cliente.totalHorasGastas,
    },
    {
      icon: Receipt,
      label: "Despesas Totais",
      value: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(cliente.totalDespesas),
    },
  ]

  const apiCompartilhar = (projectId: string) => {
    apiFetch(`/partner/${projectId}/${id}`, {
      method: "POST"
    })
  }

  return (
    <>
      <PageHeader
        title={`Parceiro: ${cliente?.nomeCliente || "Sem Nome"}`}
        tabs={tabsConfig}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        buttons={
          <>
            {cliente?.identificadorParceiro && (
              <PartnershipModal
                identificadorParceiro={cliente.identificadorParceiro}
              />
            )}
            {editavel && (
              !isEditing ? (
                <IconButton
                  icon={<Edit2 className="size-4" />}
                  label="Editar"
                  onClick={() => setIsEditing(true)}
                />
              ) : (
                <IconButton
                  icon={<Save className="size-4" />}
                  label="Salvar"
                  onClick={handleSave}
                />
              )
            )}
            {isOwner && (
              editavel && (
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
              )
            )}
            {editavel && (
              <DeleteDialogGeral
                endpoint={`/clientes/delete/${id}`}
                nomeEntidade="Cliente"
                nomeObjeto={cliente.nomeCliente}
                onSuccess={() => navigate("/clients")}
              />
            )}
          </>
        }
      />

      <main className="min-h-0 w-full pr-4 pl-1">
        <div className="mb-2 grid grid-cols-3 gap-4">
          {cards.map(({ icon: Icon, label, value }, index) => (
            <Card key={index}>
              <CardHeader>
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

        <Tabs value={activeTab}>
          <TabsContent value="detalhe" className="mt-4 rounded-md border p-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Field>
                <FieldLabel>Nome</FieldLabel>
                <Input
                  disabled={!isEditing}
                  value={cliente?.nomeCliente}
                  className={isDisabledStyle(isEditing)}
                  onChange={(e) =>
                    setCliente({ ...cliente, nomeCliente: e.target.value })
                  }
                />
              </Field>

              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  disabled={!isEditing}
                  value={cliente?.email}
                  type="email"
                  className={isDisabledStyle(isEditing)}
                  onChange={(e) =>
                    setCliente({ ...cliente, email: e.target.value })
                  }
                />
              </Field>

              <Field>
                <FieldLabel>Cnpj</FieldLabel>
                <Input
                  disabled={!isEditing}
                  value={cliente?.cnpj}
                  className={isDisabledStyle(isEditing)}
                  maxLength={18}
                  onChange={(e) =>
                    setCliente({
                      ...cliente,
                      cnpj: formatarCNPJ(e.target.value),
                    })
                  }
                />
              </Field>

              <Field>
                <FieldLabel>Cep</FieldLabel>
                <Input
                  disabled={!isEditing}
                  value={cliente?.cep}
                  className={isDisabledStyle(isEditing)}
                  onChange={(e) =>
                    setCliente({ ...cliente, cep: e.target.value })
                  }
                />
              </Field>

              <Field>
                <FieldLabel>Endereço</FieldLabel>
                <Input
                  disabled={!isEditing}
                  value={cliente?.endereco}
                  className={isDisabledStyle(isEditing)}
                  onChange={(e) =>
                    setCliente({ ...cliente, endereco: e.target.value })
                  }
                />
              </Field>

              <Field>
                <FieldLabel>Cidade</FieldLabel>
                <Input
                  disabled={!isEditing}
                  value={cliente?.cidade}
                  className={isDisabledStyle(isEditing)}
                  onChange={(e) =>
                    setCliente({ ...cliente, cidade: e.target.value })
                  }
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel>Estado</FieldLabel>
                <Input
                  disabled={!isEditing}
                  value={cliente?.estado}
                  maxLength={2}
                  className={isDisabledStyle(isEditing)}
                  onChange={(e) =>
                    setCliente({ ...cliente, estado: e.target.value })
                  }
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel>Identificador de Empresa</FieldLabel>
                <Input
                  disabled={!isEditing}
                  value={identificadorInput}
                  className={isDisabledStyle(isEditing)}
                  onChange={(e) => setIdentificadorInput(e.target.value)}
                />
              </Field>
            </div>
          </TabsContent>

          <TabsContent value="projetos" className="mt-4 rounded-md border p-4">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="font-bold">Total: {projetos.length}</div>
              {editavel && (
                <AddProjectModal
                  initialClientId={id}
                  onSuccess={() => setReload(!reload)}
                />
              )}
            </div>
            <div className={`items-start gap-4
              ${projetos.length > 0 ? 'grid grid-cols-3': ''}`}>
              {projetos.length > 0 ? (
                projetos.map((proj: any) => {
                  const projectId = proj?.projetoId

                  return (
                    <Collapsible
                      disabled={
                        cliente.identificadorParceiro?.length > 1 ? false : true
                      }
                      key={projectId}
                      className="rounded-2xl border bg-sidebar-accent data-[state=open]:bg-muted"
                    >
                      <div className="flex items-center px-3 py-1">
                        <Link
                          to={projectId ? `/projects/${projectId}` : "/projects"}
                          className="flex-1 truncate text-sm font-semibold text-blue-900 hover:underline"
                        >
                          {proj?.nomeProjeto || "Projeto"}
                        </Link>
                        <CollapsibleTrigger asChild>
                        {editavel && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="group h-8 w-8 shrink-0"
                          >
                            <ChevronDownIcon className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                          </Button>
                        )}
                        </CollapsibleTrigger>
                      </div>

                      <CollapsibleContent className="space-y-2">
                        <div className="p-1 px-2 pb-2">
                          <div className="flex w-full items-center gap-2 px-2">
                            <Share2 className="size-4 shrink-0 text-muted-foreground" />
                            <Label
                              htmlFor={`share-${projectId}`}
                              className="flex-1 cursor-pointer font-medium"
                            >
                              Compartilhar projeto
                            </Label>
                            <Switch
                              id={`share-${projectId}`}
                              checked={proj.compartilhado}
                              onChange={() => apiCompartilhar(projectId)}
                            />
                          </div>
                          <p className="mt-2 pl-2 text-xs text-muted-foreground">
                            As atividades vinculadas a este projeto serão
                            compartilhadas automaticamente.
                          </p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )
                })
              ) : (
                <div className="flex w-full justify-center items-center">
                  Sem projetos.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}
