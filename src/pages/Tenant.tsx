import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { ChevronLeft } from "lucide-react"
import { isDisabledStyle } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

type EntrarFormValues = {
  identificador: string
}

type CriarFormValues = {
  nomeEmpresa: string
  identificador: string
}

export function TenantPage() {
  const { user, refetchUser } = useAuth()
  const nome_completo = user?.nomeCompleto ?? ""
  const email = user?.email ?? ""
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const entrarForm = useForm<EntrarFormValues>({
    defaultValues: {
      identificador: "",
    },
  })

  const criarForm = useForm<CriarFormValues>({
    defaultValues: {
      nomeEmpresa: "",
      identificador: "",
    },
  })

  const preencheuIdentificador = entrarForm.watch("identificador")
  const preencheuNomeEmpresa = criarForm.watch("nomeEmpresa")

  const entrando =
    preencheuIdentificador.trim().length > 0 && !preencheuNomeEmpresa.trim()
  const criando = preencheuNomeEmpresa.trim().length > 0

  // Handler de entrar em empresa existente
  const handleEntrar = async (values: EntrarFormValues) => {
    setLoading(true)
    const response = await apiFetch(`/empresas/usuario/add/${email}`, {
      method: "POST",
      headers: {
        "x-workspace-id": values.identificador,
      },
    })

    if (!response.error) {
      toast.success("Vinculado à empresa com sucesso!")

      setTimeout(async () => {
        await refetchUser()
        navigate("/")
        setLoading(false)
      }, 4500)
    } else {
      toast.error(response.message ?? "Erro ao cadastrar código da empresa.")
      setLoading(false)
    }
  }

  // Handler para criar empresa
  const handleCriar = async (values: CriarFormValues) => {
    setLoading(true)
    const response = await apiFetch("/empresas/create", {
      method: "POST",
      body: JSON.stringify({
        nomeEmpresa: values.nomeEmpresa,
        identificador: values.identificador || undefined,
      }),
    })

    if (!response.error) {
      toast.success("Empresa criada com sucesso!")
      setTimeout(async () => {
        await refetchUser()
        navigate("/")
        setLoading(false)
      }, 4500)
    } else {
      toast.error(response.message ?? "Erro ao criar empresa.")
      setLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        backgroundImage: "linear-gradient(135deg, #e0f2fe 20%, #a5c3e8 70%)",
      }}
    >
      <div>
        <ChevronLeft
          className="fixed top-4 left-4 h-8 w-8 cursor-pointer"
          onClick={() => navigate(-1)}
        />
      </div>

      <div className="w-full max-w-4xl">
        <div className="mb-8 flex flex-col items-center gap-2">
          <span className="text-3xl font-bold tracking-tight text-primary">
            Olá, {nome_completo}!
          </span>
          <span className="text-2xl font-bold tracking-tight text-slate-800">
            Vincule-se a uma empresa
          </span>

          <p className="text-sm text-slate-500">
            Suporte para atuação em diferentes empresas
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Card className="rounded-2xl border-0 bg-white/90 shadow-2xl backdrop-blur-sm">
            <CardHeader className="pt-6 pb-2">
              <h2 className="text-center text-xl font-semibold text-slate-800">
                Entrar em uma empresa
              </h2>
              <p className="text-center text-sm text-muted-foreground">
                Insira o código de acesso para entrar na empresa
              </p>
            </CardHeader>
            <CardContent className="px-6 pt-4 pb-6">
              <Form {...entrarForm}>
                <form
                  id="form-entrar"
                  className="space-y-4"
                  onSubmit={entrarForm.handleSubmit(handleEntrar)}
                  noValidate
                >
                  <FormField
                    control={entrarForm.control}
                    name="identificador"
                    rules={{ required: "Código de acesso obrigatório" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código de acesso</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            disabled={criando}
                            className={isDisabledStyle(criando)}
                            placeholder="Código de acesso da empresa"
                            autoComplete="username"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  .replace(/\s/g, "_")
                                  .replace(/[^a-zA-Z0-9_]/g, "")
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pt-6 pb-2">
              <h2 className="text-center text-xl font-semibold text-slate-800">
                Criar uma empresa
              </h2>
              <p className="text-center text-sm text-muted-foreground">
                Registre uma nova empresa própria
              </p>
            </CardHeader>
            <CardContent className="px-6 pt-4 pb-6">
              <Form {...criarForm}>
                <form
                  id="form-criar"
                  className="space-y-4"
                  onSubmit={criarForm.handleSubmit(handleCriar)}
                  noValidate
                >
                  <FormField
                    control={criarForm.control}
                    name="nomeEmpresa"
                    rules={{ required: "Nome da empresa é obrigatório." }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da empresa</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            disabled={entrando}
                            className={isDisabledStyle(entrando)}
                            placeholder="Sinosbyte"
                            autoComplete="name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={criarForm.control}
                    name="identificador"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Identificador (opcional)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            disabled={entrando}
                            className={isDisabledStyle(entrando)}
                            placeholder="Código de acesso"
                            autoComplete="name"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  .replace(/\s/g, "_")
                                  .replace(/[^a-zA-Z0-9_]/g, "")
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="flex w-full justify-center">
          <Button
            type="submit"
            form={entrando ? "form-entrar" : "form-criar"}
            disabled={loading || (!entrando && !criando)}
            className="mt-4 w-full"
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  )
}
