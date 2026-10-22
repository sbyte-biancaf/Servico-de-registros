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
import { useState } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/utils"
import { useForm } from "react-hook-form"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Loader2, MapPin, Plus } from "lucide-react"
import { navigateTab } from "../projects/addProjectUtils"

interface Cliente {
  cliente_id: number
  cnpj: string
  nome_cliente: string
  email: string
  cep: string
  endereco: string
  cidade: string
  estado: string
  status: boolean
}

const clienteVazio: Cliente = {
  cliente_id: 0,
  cnpj: "",
  nome_cliente: "",
  email: "",
  cep: "",
  endereco: "",
  cidade: "",
  estado: "",
  status: true,
}

/* FORMATADORES */
const formatarCNPJ = (valor: string) => {
  const v = valor.replace(/[^A-Z0-9]/gi, "").toUpperCase()
  return v
    .replace(/^([A-Z0-9]{2})([A-Z0-9])/, "$1.$2")
    .replace(/^([A-Z0-9]{2})\.([A-Z0-9]{3})([A-Z0-9])/, "$1.$2.$3")
    .replace(/\.([A-Z0-9]{3})([A-Z0-9])/, ".$1/$2")
    .replace(/([A-Z0-9]{4})([A-Z0-9])/, "$1-$2")
    .substring(0, 18)
}

const formatarCEP = (valor: string) => {
  const v = valor.replace(/\D/g, "")
  return v.replace(/(\d{5})(\d)/, "$1-$2").substring(0, 9)
}

const tabs = [
  { icon: Building2, label: "essencial" },
  { icon: MapPin, label: "endereco" },
] as const

export function AddClientModal({
  onClientAdded,
}: {
  onClientAdded?: () => void | Promise<void>
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [tabValue, setTabValue] = useState("essencial")

  const form = useForm<Cliente>({
    defaultValues: clienteVazio,
  })

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (!newOpen) {
      form.reset(clienteVazio)
      setTabValue("essencial")
    }
  }

  function handleForward() {
    if (tabValue === tabs[tabs.length - 1].label) {
      form.handleSubmit(onSubmit)()
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

  const onSubmit = async (values: Cliente) => {
    const cnpjLimpo = values.cnpj.replace(/[^A-Z0-9]/gi, "")
    const cepLimpo = values.cep.replace(/\D/g, "")

    if (cnpjLimpo.length !== 14) {
      form.setError("cnpj", { message: "O CNPJ deve ter 14 dígitos." })
      return
    }
    if (cepLimpo.length !== 8) {
      form.setError("cep", { message: "O CEP deve ter 8 dígitos." })
      return
    }
    if (values.estado.trim().length !== 2) {
      form.setError("estado", { message: "Use 2 letras (ex: SP)." })
      return
    }

    const payload = {
      ...values,
      cnpj: cnpjLimpo,
      cep: cepLimpo,
      estado: values.estado.toUpperCase(),
    }

    const isEdit = values.cliente_id !== 0
    const endpoint = isEdit
      ? `/clientes/edit/${values.cliente_id}`
      : `/clientes/create/`
    const method = isEdit ? "PUT" : "POST"

    try {
      setIsLoading(true)
      const response = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      })

      if (response.error) {
        const msg = response.message || "Erro inesperado."
        if (msg.toLowerCase().includes("cnpj")) {
          form.setError("cnpj", { message: msg })
          toast.error("CNPJ duplicado", { description: msg })
          return
        }

        toast.error("Erro ao salvar", { description: msg })
        return
      }

      toast.success(isEdit ? "Cliente atualizado!" : "Cliente cadastrado!")
      form.reset(clienteVazio)
      await onClientAdded?.()
      setOpen(false)
    } catch (err) {
      console.error("Erro inesperado:", err)
      toast.error("Erro no servidor")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog modal open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          Adicionar Parceiro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:min-w-md min-h-128 grid-rows-[auto_minmax(0,1fr)_auto]">
        <DialogHeader className="gap-3">
          <DialogTitle> Novo Parceiro </DialogTitle>
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

        <Form {...form}>
          <Tabs value={tabValue}>
            <TabsContent value="essencial">
              <form>
                <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome_cliente"
                  rules={{ required: "Nome da empresa é obrigatório" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Parceiro</FormLabel>
                      <FormControl>
                        <Input placeholder="Paceiro LTDA." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  rules={{
                    required: "O email de contato é obrigatório",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "E-mail inválido",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="empresa@contato.com.br"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="12.3L5.A78/0001-90"
                          maxLength={18}
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(formatarCNPJ(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
              </form>
            </TabsContent>

            <TabsContent value="endereco">
              <form>
                <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="12345-123"
                          maxLength={9}
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(formatarCEP(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua dos Testes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="cidade"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Porto Alegre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="UF"
                            maxLength={2}
                            value={field.value}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value.toUpperCase().slice(0, 2)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              onClick={handleBack}
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
                "Salvar"
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
