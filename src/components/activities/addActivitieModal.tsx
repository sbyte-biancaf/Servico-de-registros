import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useEffect, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { CalendarIcon, FileText, Info, Loader2, Plus, Settings } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiFetch, handlePriorityColor } from "@/lib/utils"
import { SeletorSearchBar } from "@/components/seletor-search-bar"
import { navigateTab } from "../projects/addProjectUtils"
import { type TypeActivityFormData, ActivityFormSchema } from "./addActivityUtils"

function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  "aria-invalid": ariaInvalid,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  "aria-invalid"?: boolean
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])
  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-invalid={ariaInvalid}
      className="w-full rounded-md border border-input p-2 text-sm"
      style={{ overflow: "hidden", resize: "none" }}
    />
  )
}

type ProjectOption = { id: string; nome: string }
interface AddActivityModalProps {
  onSuccess: () => void
  projetoId?: string | number
}

const tipos = [
  { label: "Sem Tipo", value: "SCC" },
  { label: "Estimativa", value: "ESTIMATIVA" },
  { label: "Orçado", value: "ORCADO" },
  { label: "Interno", value: "INTERNO" },
  { label: "Chamado", value: "CHAMADO" },
  { label: "Estudo", value: "ESTUDO" },
]

const tabs = [
  { icon: Info, label: "essencial" },
  { icon: Settings, label: "configs" },
  { icon: FileText, label: "detalhes" },
] as const

const defaultValues = (projetoId?: string | number): TypeActivityFormData => ({
  nome_atividade: "",
  projeto_id: projetoId ? String(projetoId) : "",
  ref_cliente: "",
  prioridade: "NORMAL",
  descr_atividade: "",
  horas_previstas: "",
  data_prevista_inicio: new Date(),
  data_prevista_fim: new Date(),
  status: 1,
  tipo_atividade: "SCC",
  centro_custo: "",
  solicitante: "",
})

export function AddActivityModal({
  onSuccess,
  projetoId,
}: AddActivityModalProps) {
  const [open, setOpen] = useState(false)
  const [tabValue, setTabValue] = useState("essencial")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [projetos, setProjetos] = useState<ProjectOption[]>([])
  const [projetosRef, setProjetosRef] = useState<any[]>([])
  const [projetoSelecionado, setProjetoSelecionado] = useState<any>(null)
  const formActivities = useForm<
    TypeActivityFormData,
    unknown,
    TypeActivityFormData
  >({
    resolver: zodResolver(ActivityFormSchema),
    defaultValues: defaultValues(projetoId),
  })

  useEffect(() => {
    if (!open) return
    async function fetchProjects() {
      const response = await apiFetch("/projetos/list")
      if (response.error) return
      setProjetosRef(response.data || [])
      setProjetos(
        (response.data || []).map((project: any) => ({
          id: String(project.projetoId),
          nome: project.nomeProjeto,
        }))
      )
      if (projetoId) {
        const selected = response.data?.find(
          (project: any) => String(project.projetoId) === String(projetoId)
        )
        if (selected) setProjetoSelecionado(selected)
      }
    }
    fetchProjects()
  }, [open, projetoId, formActivities])

  useEffect(() => {
    if (!projetoSelecionado) return
    if (projetoSelecionado.centroCusto)
      formActivities.setValue("centro_custo", projetoSelecionado.centroCusto)
    if (projetoSelecionado.solicitante)
      formActivities.setValue("solicitante", projetoSelecionado.solicitante)
  }, [formActivities, projetoSelecionado])

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (!newOpen) {
      formActivities.reset(defaultValues(projetoId))
      setTabValue("essencial")
      setProjetoSelecionado(null)
    }
  }

  async function onSubmit(data: TypeActivityFormData) {
    setIsSubmitting(true)
    try {
      const response = await apiFetch("/atividades/create", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          horas_previstas:
            data.horas_previstas === "" ? null : data.horas_previstas,
          descr_atividade: data.descr_atividade || null,
        }),
      })
      if (response.error) {
        toast.error(response.message || "Erro ao cadastrar atividade.")
        return
      }
      toast.success("Atividade criada com sucesso!")
      setOpen(false)
      onSuccess()
    } catch {
      toast.error("Erro ao conectar com o servidor.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleForward() {
    if (tabValue === tabs[tabs.length - 1].label) {
      formActivities.handleSubmit(onSubmit)()
      return
    }
    navigateTab(
      tabs.map((tab) => ({ label: tab.label })),
      tabValue,
      1,
      setTabValue
    )
  }
  function handleBack() {
    if (tabValue === tabs[0].label) {
      setOpen(false)
      return
    }
    navigateTab(
      tabs.map((tab) => ({ label: tab.label })),
      tabValue,
      -1,
      setTabValue
    )
  }

  return (
    <Dialog modal open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          Adicionar Atividade
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-2.5 min-h-128 grid-rows-[auto_minmax(0,1fr)_auto]">
        <DialogHeader className="gap-3">
          <DialogTitle> Nova Atividade</DialogTitle>
          <DialogDescription>
            <Tabs value={tabValue} onValueChange={setTabValue}>
              <TabsList className="w-full">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.label}
                    className="cursor-pointer px-2"
                    value={tab.label}
                  >
                    <tab.icon />
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tabValue}>
          <TabsContent value="essencial">
            <form>
              <FieldGroup>
              <Controller
                control={formActivities.control}
                name="nome_atividade"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Nome da atividade</FieldLabel>
                    <Input
                      {...field}
                      placeholder="Ex: Implementar login"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={formActivities.control}
                name="projeto_id"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Projeto</FieldLabel>
                    <SeletorSearchBar
                      items={projetos}
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)
                        setProjetoSelecionado(
                          projetosRef.find(
                            (project) => String(project.projetoId) === value
                          )
                        )
                      }}
                      emptyMessage="Sem projetos criados"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={formActivities.control}
                name="prioridade"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Prioridade</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger
                        className={`w-full ${handlePriorityColor(Number(field.value))}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BAIXA">Baixa</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="ALTA">Alta</SelectItem>
                        <SelectItem value="CRITICA">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={formActivities.control}
                name="ref_cliente"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Ticket de referência</FieldLabel>
                    <Input
                      {...field}
                      placeholder="Ex: TIC-389045"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              </FieldGroup>
            </form>
          </TabsContent>

          <TabsContent value="configs">
            <form>
              <FieldGroup>
              <div className="flex gap-4">
                {(["data_prevista_inicio", "data_prevista_fim"] as const).map(
                  (name) => (
                    <Controller
                      key={name}
                      control={formActivities.control}
                      name={name}
                      render={({ field, fieldState }) => (
                        <Field className="w-full" data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            {name === "data_prevista_inicio"
                              ? "Data prevista de início"
                              : "Data prevista de fim"}
                          </FieldLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start px-2.5 font-normal"
                              >
                                {format(field.value, "dd/LL/yy")}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                locale={ptBR}
                                onSelect={(date) => date && field.onChange(date)}
                              />
                            </PopoverContent>
                          </Popover>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  )
                )}
              </div>
              <Controller
                control={formActivities.control}
                name="horas_previstas"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Horas previstas</FieldLabel>
                    <Input
                      type="number"
                      placeholder="Em aberto"
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === ""
                            ? ""
                            : Number(event.target.value)
                        )
                      }
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={formActivities.control}
                name="tipo_atividade"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Tipo de atividade</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tipos.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              </FieldGroup>
            </form>
          </TabsContent>

          <TabsContent value="detalhes">
            <form>
              <FieldGroup>
              <Controller
                control={formActivities.control}
                name="centro_custo"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Centro de custo</FieldLabel>
                    <Input
                      {...field}
                      disabled={Boolean(projetoSelecionado?.centroCusto)}
                      placeholder="Ex: Compras, RH"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={formActivities.control}
                name="solicitante"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Solicitante</FieldLabel>
                    <Input
                      {...field}
                      disabled={Boolean(projetoSelecionado?.solicitante)}
                      placeholder="Ex: Juliano Floss"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={formActivities.control}
                name="descr_atividade"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Descrição</FieldLabel>
                    <AutoResizeTextarea
                      {...field}
                      placeholder="Descreva brevemente a atividade"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              </FieldGroup>
            </form>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            onClick={handleBack}
            variant={tabValue === "essencial" ? "destructive" : "outline"}
            disabled={isSubmitting}
          >
            {tabValue === "essencial" ? "Cancelar" : "Voltar"}
          </Button>
          <Button
            className="cursor-pointer"
            onClick={handleForward}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : tabValue === "detalhes" ? (
              "Salvar"
            ) : (
              "Próximo"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
