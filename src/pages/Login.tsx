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
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { apiFetch } from "@/lib/api-client"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useAuth, type Invite } from "@/contexts/auth-context"
import { PasswordRequirements } from "@/components/password-requirements"

// ─── Types ────────────────────────────────────────────────────────────────────

type LoginFormValues = {
  username: string
  password: string
}

type RegisterFormValues = {
  name: string
  username: string
  email: string
  password: string
  confirmPassword: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PasswordInput({
  field,
  placeholder,
}: {
  field: React.InputHTMLAttributes<HTMLInputElement> & { value: string }
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        placeholder={placeholder ?? "••••••••"}
        {...field}
        className="pr-10"
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        onClick={() => setShow((v) => !v)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const [isRegisterPasswordValid, setIsRegisterPasswordValid] = useState(false)
  const navigate = useNavigate()
  const { login, logout } = useAuth()

  const loginPanelRef = useRef<HTMLDivElement>(null)
  const registerPanelRef = useRef<HTMLDivElement>(null)
  const [panelHeight, setPanelHeight] = useState<number | undefined>(undefined)

  const [searchParams] = useSearchParams()

  const inviteEmail = searchParams.get("email") ?? undefined
  const inviteNome = searchParams.get("nome") ?? undefined
  const novoUsuario = searchParams.get("isNewUser") ?? undefined
  const token = searchParams.get("tk") ?? undefined

  const mapErrors = {
    inviteInvalid: "Convite inválido.",
    inviteExpired: "Convite expirado.",
    inviteUnavailable: "Convite indisponível.",
    accountInactive: "Sua conta está inativa.",
    inviteAccountMismatch:
      "Ops! O convite não corresponde à conta. Faça login com a conta correta.",
  }

  const conviteInvalido = (() => {
    let found: string | undefined
    searchParams.forEach((value, key) => {
      if (mapErrors[key as keyof typeof mapErrors]) {
        found = mapErrors[key as keyof typeof mapErrors]
      }
    })
    return found ? found : undefined
  })()

  // Testa tabs inicial
  const tabInicial = inviteEmail
    ? novoUsuario === "false"
      ? "login"
      : "register"
    : "login"

  const [mode, setMode] = useState<"login" | "register">(tabInicial)

  const loginForm = useForm<LoginFormValues>({
    defaultValues: { username: inviteEmail || "", password: "" },
  })

  const defaultRegisterForm = (): RegisterFormValues => {
    if (tabInicial === "register" && inviteEmail && inviteNome) {
      return {
        name: inviteNome,
        username: "",
        email: inviteEmail,
        password: "",
        confirmPassword: "",
      }
    }
    return {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    }
  }

  const registerForm = useForm<RegisterFormValues>({
    defaultValues: defaultRegisterForm(),
  })

  useEffect(() => {
    logout()
  }, [logout])

  // Set initial panel height after mount
  useEffect(() => {
    if (conviteInvalido) {
      setTimeout(() => {
        toast.error(conviteInvalido)
      }, 700)
    }

    if (!conviteInvalido && novoUsuario) {
      setTimeout(() => {
        const resposta =
          novoUsuario === "false"
            ? "Bem-vindo! O convite sera aceito apos o login."
            : "Complete seu registro e faca login para aceitar o convite!"
        toast.success(resposta)
      }, 700)
    }

    const updateHeight = () => {
      const currentRef = mode === "login" ? loginPanelRef : registerPanelRef
      if (currentRef.current) {
        setPanelHeight(currentRef.current.scrollHeight)
      }
    }
    const timer = setTimeout(updateHeight, 50)
    return () => clearTimeout(timer)
  }, [mode, conviteInvalido, novoUsuario])

  // Switch mode, animate height, reset both forms
  const switchMode = (
    next: "login" | "register",
    registerValues?: RegisterFormValues
  ) => {
    if (registerValues) {
      loginForm.setValues({
        username: registerValues?.username,
        password: registerValues?.password,
      })
    } else {
      loginForm.reset()
    }

    registerForm.reset({
      name: inviteNome || "",
      username: "",
      email: inviteEmail || "",
      password: "",
      confirmPassword: "",
    })
    setMode(next)
  }

  const onErrorFormulario = (errors: any) => {
    const primeiraMensagemErro = Object.keys(errors)[0]
    if (primeiraMensagemErro && errors[primeiraMensagemErro]?.message) {
      toast.error(errors[primeiraMensagemErro].message)
    }
  }

  // ── Login handler ──────────────────────────────────────────────────────────

  const handleLogin = async (values: LoginFormValues) => {
    setIsLoading(true)
    const invite: Invite = {
      in: token && !conviteInvalido ? true : false,
      tk: token ?? "",
    }

    try {
      const logIn = await login(values.username, values.password, invite)

      if (logIn.error)
        return toast.error(logIn.message ?? "Credenciais inválidas.")

      if (!logIn.user?.empresas || logIn.user.empresas.length === 0)
        return navigate("/companies")

      navigate("/", { replace: true })
    } catch (er) {
      console.log(er)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Register handler ───────────────────────────────────────────────────────
  const handleRegister = async (values: RegisterFormValues) => {
    if (!isRegisterPasswordValid) {
      toast.error("Senha inválida.")
      return
    }

    if (values.password !== values.confirmPassword) {
      toast.error("As senhas não coincidem.")
      return
    }

    setIsLoading(true)
    try {
      const payload: Record<string, string> = {
        nome_completo: values.name.trim(),
        nome_usuario: values.username.trim().replace(/\s+/, ""),
        email: values.email.trim(),
        senha: values.password,
      }

      const response = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      if (!response.error) {
        toast.success("Conta criada com sucesso! Faça login para continuar.")
        switchMode("login", values)
      } else {
        toast.error(response.message ?? "Erro ao criar conta.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        backgroundImage: "linear-gradient(135deg, #e0f2fe 20%, #a5c3e8 70%)",
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo + Brand */}
        <div className="mb-4 flex items-center justify-center">
          <img
            src="/logo_sem_fundo.png"
            alt="ChronoTracker logo"
            className="w-14"
          />
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Chronotracker
          </h1>
        </div>

        {/* Tab switcher */}
        <div className="mb-4 flex rounded-3xl bg-white/60 shadow-inner backdrop-blur-sm">
          {(["login", "register"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => switchMode(tab)}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200",
                mode === tab
                  ? "bg-white text-slate-800 shadow"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab === "login" ? "Entrar" : "Registrar-se"}
            </button>
          ))}
        </div>

        <Card className="rounded-2xl border-none bg-white/90 shadow-2xl backdrop-blur-sm">
          <CardHeader className="py-1 text-center text-xl font-semibold">
            {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
          </CardHeader>

          <CardContent className="px-4 pt-1 pb-3.5">
            {/* Animated panel track */}
            <div
              className="relative overflow-hidden transition-[height] duration-500 ease-in-out"
              style={{ height: panelHeight }}
            >
              {/* ── LOGIN PANEL ── */}
              <div
                ref={loginPanelRef}
                className="absolute w-full px-1 transition-all duration-500 ease-in-out"
                style={{
                  transform:
                    mode === "login" ? "translateX(0)" : "translateX(-110%)",
                  opacity: mode === "login" ? 1 : 0,
                  pointerEvents: mode === "login" ? "auto" : "none",
                }}
              >
                <Form {...loginForm}>
                  <form
                    className="space-y-4"
                    onSubmit={loginForm.handleSubmit(
                      handleLogin,
                      onErrorFormulario
                    )}
                    noValidate
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      rules={{ required: "Nome de usuário é obrigatório" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome de usuário ou e-mail</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              autoComplete="username"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      rules={{ required: "Preencha este campo!" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex justify-between">
                            Senha
                            <Link
                              className="text-blue-700 hover:underline"
                              to="/password_reset"
                            >
                              Esqueceu sua senha ?
                            </Link>
                          </FormLabel>
                          <FormControl>
                            <PasswordInput field={field as any} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="mt-2 w-full"
                    >
                      {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Entrar"
                      )}
                    </Button>
                  </form>
                </Form>
              </div>

              {/* ── REGISTER PANEL ── */}
              <div
                ref={registerPanelRef}
                className="absolute w-full px-1 transition-all duration-500 ease-in-out"
                style={{
                  transform:
                    mode === "register" ? "translateX(0)" : "translateX(110%)",
                  opacity: mode === "register" ? 1 : 0,
                  pointerEvents: mode === "register" ? "auto" : "none",
                }}
              >
                <Form {...registerForm}>
                  <form
                    className="space-y-4"
                    onSubmit={registerForm.handleSubmit(
                      handleRegister,
                      onErrorFormulario
                    )}
                    noValidate
                  >
                    <FormField
                      control={registerForm.control}
                      name="name"
                      rules={{ required: "Nome obrigatório." }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input type="text" autoComplete="name" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="username"
                      rules={{ required: "Nome de usuário obrigatório." }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome de usuário</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              autoComplete="username"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      rules={{
                        required: "E-mail obrigatório.",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "E-mail inválido.",
                        },
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              autoComplete="email"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      rules={{
                        required: "Senha obrigatória.",
                        validate: () =>
                          isRegisterPasswordValid ||
                          "A senha deve atender a todos os requisitos indicados.",
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <PasswordInput field={field as any} />
                          </FormControl>
                          <PasswordRequirements
                            id="password-requirements"
                            onValidityChange={setIsRegisterPasswordValid}
                            password={field.value}
                          />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      rules={{
                        required: "Confirme sua senha.",
                        validate: (value) =>
                          value === registerForm.getValues("password") ||
                          "As senhas não coincidem.",
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Senha</FormLabel>
                          <FormControl>
                            <PasswordInput field={field as any} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Criar conta"
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-slate-500">
          {mode === "login" ? (
            <>
              Não tem uma conta?
              <Button
                variant={"ghost"}
                onClick={() => switchMode("register")}
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Criar conta
              </Button>
            </>
          ) : (
            <>
              Já tem uma conta?
              <Button
                variant={"ghost"}
                onClick={() => switchMode("login")}
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Fazer login
              </Button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
