import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  checkVariantBack,
  getDefaultDateRange,
  navigateTab,
  ProjectFormSchema,
  statusProjeto,
  tipoProjeto,
  type TypeProjectFormData,
} from "./addProjectUtils"
import {
  Loader2,
  Plus,
  Info,
  Users,
  Settings,
  CalendarDays,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Controller, useForm } from "react-hook-form"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxValue,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxInput,
  ComboboxList,
  ComboboxGroup,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { apiFetch } from "@/lib/utils"
import { format } from "date-fns"
import { type DateRange } from "react-day-picker"
import { ptBR } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field"

function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [value])

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || ""}
      className="w-full rounded-md border border-input p-2 text-sm"
      style={{ overflow: "hidden", resize: "none" }}
    />
  )
}
function defaultValues(initialClientId: string = ""): TypeProjectFormData {
  const range = getDefaultDateRange()
  return {
    nome_projeto: "",
    cliente_id: initialClientId,
    ref_cliente: "",
    descricao: "",
    data_inicio: range.from ?? "",
    data_fim: range.to ?? "",
    horas_previstas: "Em Aberto",
    status: "EmAndamento",
    centro_custo: "",
    solicitante: "",
    tipo: "SCC",
    equipe: [],
  }
}

type Colaborador = {
  value: string
  label: string
}

interface AddProjectDialogProps {
  onSuccess: () => void
  initialClientId?: string
}

export function AddProjectModal({
  onSuccess,
  initialClientId,
}: AddProjectDialogProps) {
  const anchor = useComboboxAnchor()

  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [tabValue, setTabValue] = useState("essencial")

  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [clientes, setClientes] = useState<any[]>([])

  const [selectedColaboradores, setSelectedColaboradores] = useState<
    Colaborador[]
  >([])
  const [date, setDate] = useState<DateRange | undefined>(getDefaultDateRange())

  const formProjects = useForm<TypeProjectFormData>({
    resolver: zodResolver(ProjectFormSchema),
    defaultValues: defaultValues(initialClientId)
  })

  const resetFormState = useCallback(() => {
    const range = getDefaultDateRange()
    formProjects.reset({
      ...defaultValues(initialClientId),
    })
    setSelectedColaboradores([])
    setDate(range)
  }, [initialClientId, formProjects])

  const closeAndReset = useCallback(() => {
    setOpen(false)
    formProjects.reset()
  }, [formProjects])

  // Handle modal open/close with full reset
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(true)
    if (!newOpen) return closeAndReset()
  }

  // Carregar colaboradores (não no mount, para evitar race condition com workspace)
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        resetFormState()
      }, 100)
      return
    }

    async function getFiltersData() {
      try {
        const clientes = await apiFetch("/clientes/list")
        const colabs = await apiFetch("/usuarios/list")

        if (colabs.error) {
          toast.error("Falha ao carregar dados do formulário")
          return
        }

        if (!clientes.error) setClientes(clientes.data || [])

        setColaboradores(
          (colabs.data || []).map((colab) => ({
            label: colab.nomeCompleto,
            value: colab.usuarioId,
          }))
        )
      } catch (err) {
        console.error("Erro ao buscar dados do formulário:", err)
        toast.error("Erro ao conectar com o servidor.")
      }
    }

    getFiltersData()
  }, [open, closeAndReset, resetFormState])

  async function onSubmit(values: TypeProjectFormData) {
    setIsLoading(true)
    try {
      const body = {
        ...values,
        status: values.status,
        // equipe: selectedColaboradores,
      }

      const response = await apiFetch("/projetos/create", {
        method: "POST",
        body: JSON.stringify(body),
      })

      if (response.error) {
        toast.error(`${response.message || "Falha ao salvar projeto"}`)
        return
      }

      toast.success(response.message)
      closeAndReset()
      onSuccess()
    } catch (error) {
      console.error(error)
      toast.error("Erro ao conectar com o servidor.")
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { icon: Info, label: "essencial" },
    { icon: Users, label: "equipe" },
    { icon: Settings, label: "configs" },
  ] as const

  function handleForward(): void {
    if (tabValue === tabs[tabs.length - 1].label) {
      formProjects.handleSubmit(onSubmit)()
      return
    }

    navigateTab(
      tabs.map((tab) => ({ label: tab.label })),
      tabValue,
      1,
      setTabValue
    )
  }

  function handleBack(): void {
    if (tabValue === tabs[0].label) {
      closeAndReset()
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
    <>
      <Dialog modal={false} open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="size-4" />
            Adicionar Projeto
          </Button>
        </DialogTrigger>
        <DialogContent className="min-w-2.5 min-h-128 grid-rows-[auto_minmax(0,1fr)_auto]">
          <DialogHeader className="gap-3">
            <DialogTitle> Novo Projeto </DialogTitle>
            <DialogDescription className="gap-3">
              <Tabs value={tabValue} onValueChange={setTabValue}>
                <TabsList className="w-full">
                  {tabs.map((i) => (
                    <TabsTrigger
                      className="cursor-pointer px-2"
                      value={i.label}
                    >
                      <i.icon />
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
                    control={formProjects.control}
                    name="nome_projeto"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Nome do Projeto</FieldLabel>
                        <Input
                          {...field}
                          placeholder="Ex: Sistema ERP"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    control={formProjects.control}
                    name="horas_previstas"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Horas Previstas</FieldLabel>
                        <Input
                          type="number"
                          placeholder="Em Aberto (Campo vazio)"
                          {...field}
                          aria-invalid={fieldState.invalid}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value)
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
                    control={formProjects.control}
                    name="ref_cliente"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Ticket de referência</FieldLabel>
                        <Input
                          placeholder="Ex: TIC-389045"
                          {...field}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    control={formProjects.control}
                    name="descricao"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Descrição</FieldLabel>
                        <AutoResizeTextarea
                          value={field.value || ""}
                          aria-invalid={fieldState.invalid}
                          onChange={field.onChange}
                          placeholder="Descreva brevemente o projeto"
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
            <TabsContent value="equipe">
              <form>
                <FieldGroup>
                  <Controller
                    control={formProjects.control}
                    name="solicitante"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Solicitante</FieldLabel>
                        <Input
                          placeholder="Ex: Equipe financeira"
                          {...field}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    control={formProjects.control}
                    name="equipe"
                    render={({ field, fieldState }) => (
                      <Field ref={anchor} data-invalid={fieldState.invalid}>
                        <FieldLabel>Equipe</FieldLabel>
                        <Combobox
                          multiple
                          items={colaboradores}
                          aria-invalid={fieldState.invalid}
                          itemToStringValue={(colab: Colaborador) =>
                            colab.label
                          }
                          value={selectedColaboradores}
                          onValueChange={(novosColaboradores) => {
                            setSelectedColaboradores(novosColaboradores)
                            field.onChange(
                              novosColaboradores.map((item) => item.value)
                            )
                          }}
                        >
                          <ComboboxChips>
                            <ComboboxValue>
                              {selectedColaboradores.map((item) => (
                                <ComboboxChip key={"id-" + item.value}>
                                  {item.label}
                                </ComboboxChip>
                              ))}
                            </ComboboxValue>
                            <ComboboxChipsInput placeholder="Adicionar colaborador" />
                          </ComboboxChips>
                          <ComboboxContent anchor={anchor}>
                            <ComboboxEmpty>
                              Nenhum colaborador encontrado.
                            </ComboboxEmpty>
                            <ComboboxList>
                              {(item) => (
                                <ComboboxItem
                                  key={"id-" + item.value}
                                  value={item}
                                >
                                  {item.label}
                                </ComboboxItem>
                              )}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
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
                  <Field>
                    <FieldLabel>Período do Projeto</FieldLabel>
                    <Popover>
                      <PopoverTrigger asChild className="w-full">
                        <Button
                          variant="outline"
                          id="date-picker-range"
                          className="justify-start px-2.5 font-normal"
                        >
                          {date?.from && date?.to ? (
                            <>
                              {format(date.from, "dd/LL/yy")} - {""}
                              {format(date.to, "dd/LL/yy")}
                            </>
                          ) : (
                            "Selecione o período do projeto..."
                          )}
                          <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-full min-w-116 p-0"
                        align="start"
                      >
                        <Calendar
                          className="w-full"
                          mode="range"
                          numberOfMonths={2}
                          defaultMonth={date?.from}
                          selected={date}
                          locale={ptBR}
                          onSelect={(selectedDate) => {
                            setDate(selectedDate)
                            if (selectedDate?.from) {
                              formProjects.setValue(
                                "data_inicio",
                                selectedDate.from
                              )
                            }
                            if (selectedDate?.to) {
                              formProjects.setValue("data_fim", selectedDate.to)
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>
                  <Controller
                    control={formProjects.control}
                    name="cliente_id"
                    rules={{ required: "Selecione um cliente." }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Parceiro</FieldLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o parceiro" />
                          </SelectTrigger>
                          <SelectContent>
                            {clientes.map((c) => (
                              <SelectItem
                                key={c.clienteId}
                                value={c.clienteId as string}
                              >
                                {c.nomeCliente}
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
                  {/* Novo input de data com Date Range */}
                  <Controller
                    control={formProjects.control}
                    name="tipo"
                    render={({ field, fieldState }) => (
                      <Field
                        className="flex flex-col"
                        data-invalid={fieldState.invalid}
                      >
                        <FieldLabel>Tipo do projeto</FieldLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {tipoProjeto.map((tipo) => (
                              <SelectItem key={tipo.value} value={tipo.value}>
                                {tipo.label}
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

                  <Controller
                    control={formProjects.control}
                    name="status"
                    render={({ field, fieldState }) => (
                      <Field
                        className="flex flex-col"
                        data-invalid={fieldState.invalid}
                      >
                        <FieldLabel>Status do Projeto</FieldLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusProjeto.map((status) => (
                              <SelectItem
                                key={status.value}
                                value={status.value}
                              >
                                {status.label}
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
                  {/* Centro de custo */}
                  <Controller
                    control={formProjects.control}
                    name="centro_custo"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Centro de custo</FieldLabel>
                        <Input
                          placeholder="Ex: Compras, RH"
                          {...field}
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
              variant={checkVariantBack(["configs", "equipe"], tabValue)}
            >
              {["configs", "equipe"].includes(tabValue) ? "Voltar" : "Cancelar"}
            </Button>
            <Button className="cursor-pointer" onClick={handleForward}>
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : ["essencial", "equipe"].includes(tabValue) ? (
                "Proximo"
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
