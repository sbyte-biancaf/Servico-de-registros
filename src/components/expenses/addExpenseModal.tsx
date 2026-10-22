import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/utils"
import { useForm, useWatch } from "react-hook-form"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Loader2, Plus } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Link2, Receipt } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { navigateTab } from "../projects/addProjectUtils"

interface addExpenseModalProps {
  onRefresh?: () => void
}

interface ListaLancamentos {
  id: string
  horaInicio: string
  horaFim: string
  cliente: string
  projeto: string
  atividade: string
}

interface Despesa {
  despesa_id: string
  nome_despesa: string
  descricao: string
  valor: string | number
  data_despesa: Date
  lancamento_id: string
}

const despesaVazia: Despesa = {
  despesa_id: "",
  nome_despesa: "",
  descricao: "",
  valor: "",
  data_despesa: new Date(),
  lancamento_id: ""
}

const formatarValor = (valor: string) => {
  const apenasNumeros = valor.replace(/\D/g, "");
  const valorFormatado = Number(apenasNumeros) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorFormatado);
}

const formatarHora = (valor: any): string => {
  if (!valor) return "--:--"

  const date = valor instanceof Date ? valor : new Date(valor)

  if (isNaN(date.getTime())) return "--:--"

  const horas = String(date.getUTCHours()).padStart(2, "0")
  const minutos = String(date.getUTCMinutes()).padStart(2, "0")

  return `${horas}:${minutos}`
}

const tabs = [
  { icon: Receipt, label: "essencial" },
  { icon: Link2, label: "vinculo" },
] as const

export function AddExpenseModal({ onRefresh }: addExpenseModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingLancamentos, setIsLoadingLancamentos] = useState(false)
  const [open, setOpen] = useState(false)
  const [tabValue, setTabValue] = useState("essencial")
  const [listaLancamentos, setListaLancamentos] = useState<ListaLancamentos[]>([])
  const [vinculo, setVinculo] = useState(false)

  const form = useForm<Despesa>({
    defaultValues: despesaVazia,
  })

  const dataDespesa = useWatch({
    control: form.control,
    name: "data_despesa",
  })

  useEffect(() => {
    const buscarLancamentosDia = async () => {
      if (!dataDespesa) return

      setIsLoadingLancamentos(true)
      const dataFormatada = format(dataDespesa, "yyyy-MM-dd")
      const response = await apiFetch(`/despesas/lancamentos/dia?data=${dataFormatada}`)

      if (response.error) {
        setListaLancamentos([])
        form.setValue("lancamento_id", "")
        return
      }

      const lancamentos: ListaLancamentos[] = response.data

      if (lancamentos.length === 1) {
        form.setValue("lancamento_id", lancamentos[0].id)
        setVinculo(true)
        setListaLancamentos([])
      } else if (lancamentos.length > 1) {
        setListaLancamentos(lancamentos)
        form.setValue("lancamento_id", "")
      } else {
        setListaLancamentos([])
        form.setValue("lancamento_id", "")
      }
      
      setIsLoadingLancamentos(false)  
    }
    
    buscarLancamentosDia()

  }, [dataDespesa, form])

  const onSubmit = async (values: Despesa) => {
    const valorLimpo = typeof values.valor === "string"
    ? parseFloat(values.valor.replace(/[^\d,]/g, "").replace(",", "."))
    : values.valor

    if (!valorLimpo || valorLimpo <= 0) {
      form.setError("valor", {message: "Informe um valor válido."})
      return
    }

    if (listaLancamentos.length > 1 && !values.lancamento_id) {
      form.setError("lancamento_id", { message: "Selecione qual lançamento vincular." })
      return
    }

    // Dados usuário logado - DESNECESSÁRIOS POIS AGORA VOU USAR REQ.USER
    // const usuario = localStorage.getItem("currentUser");
    // const usuarioDados = JSON.parse(usuario)
    // const colaborador_id = usuarioDados.colaborador_id;

    const payload = {
      nome_despesa: values.nome_despesa,
      descricao: values.descricao || "",
      valor: valorLimpo,
      data_despesa: values.data_despesa,
      lancamento_id: values.lancamento_id ? values.lancamento_id : undefined
    }

    try {
      setIsLoading(true)
      const response = await apiFetch("/despesas/create", {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (response.error) {
        toast.error("Erro ao salvar", {description: response.message})
        return
      }

      toast.success(response.message || "Despesa cadastrada!")
      if (onRefresh) {
        onRefresh()
      }
      setOpen(false)
    } catch (error) {
      console.log("onSubmit:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleForward() {
    // if (tabValue === tabs[tabs.length - 1].label) {
      form.handleSubmit(onSubmit)()
      return
    // }
    // navigateTab(
    //   tabs.map((tab) => ({ label: tab.label })),
    //   tabValue,
    //   1,
    //   setTabValue
    // )
  }

  // function handleBack() {
  //   if (tabValue === tabs[0].label) {
  //     setOpen(false)
  //     return
  //   }
  //   navigateTab(
  //     tabs.map((tab) => ({ label: tab.label })),
  //     tabValue,
  //     -1,
  //     setTabValue
  //   )
  // }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (!newOpen) {
      form.reset(despesaVazia)
      setListaLancamentos([])
      setTabValue("essencial")
    }
  }

  return (
    <Dialog modal open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          Nova despesa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:min-w-md min-h-128 grid-rows-[auto_minmax(0,1fr)_auto]">
        <DialogHeader className="gap-3">
          <DialogTitle> Nova Despesa</DialogTitle>
          <DialogDescription>
            {/* <Tabs value={tabValue} onValueChange={setTabValue}>
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
            </Tabs> */}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          {/* <Tabs value={tabValue}> */}
            {/* <TabsContent value="essencial"> */}
              <form>
                <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome_despesa"
                  rules={{required: "Nome da despesa é obrigatório"}}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Despesa</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Transporte" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Transporte de funcionário até local de trabalho"{...field}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="valor"
                  rules={{ required: "O valor é obrigatório" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R$ 0,00"
                          value={field.value}
                          onChange={(e) => {
                            const formatado = formatarValor(e.target.value);
                            field.onChange(formatado);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                control={form.control}
                  name="data_despesa"
                  rules={{ required: "A data da despesa é obrigatória" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Despesa</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" className="w-full justify-start text-left">
                                {field.value
                                      ? format(field.value, "PPP", {locale: ptBR}) 
                                      : "Selecione a data"}
                                <CalendarIcon className="ml-2 h-4 w-4" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              locale={ptBR}
                              fixedWeeks
                              onSelect={field.onChange}
                              
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                  )}
                  />

                  {isLoadingLancamentos && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Buscando lançamentos dessa data...
                  </p>
                  )}

                  {vinculo && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Link2 className="h-3 w-3" />
                      Lançamento vinculado automaticamente.
                    </p>
                  )}

                {listaLancamentos.length > 1 && (
                  <FormField
                    control={form.control}
                    name="lancamento_id"
                    rules={{ required: "Selecione qual lançamento vincular" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lançamento</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione o lançamento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {listaLancamentos.map((lanc) => (
                              <SelectItem key={lanc.id} value={lanc.id}>
                                {lanc.cliente}: {lanc.atividade} | {formatarHora(lanc.horaInicio)} - {formatarHora(lanc.horaFim)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                </div>
              </form>
            {/* </TabsContent> */}

            {/* <TabsContent value="vinculo"> */}
              <form>
                <div className="space-y-4">
                </div>
              </form>
            {/* </TabsContent> */}
          {/* </Tabs> */}

          <DialogFooter>
            <Button
              // onClick={handleBack}
              variant={tabValue === "essencial" ? "destructive" : "outline"}
              disabled={isLoading}
            >
              {tabValue === "essencial" ? "Cancelar" : "Voltar"}
            </Button>
            <Button
              onClick={handleForward}
              className="cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : tabValue === tabs[tabs.length - 1].label ? (
                "Salvar despesa"
              ) : (
                "Próximo"
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  )
}