import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { apiFetch } from "@/lib/api-client"
import {
  Eye,
  Loader2,
  Mail,
  KeyRound,
  SendHorizontal,
  Check,
  Lock,
  LogIn,
  RefreshCwIcon,
  EyeOffIcon,
  ChevronLeft,
} from "lucide-react"
import { toast } from "sonner"
import { useNavigate, useSearchParams } from "react-router-dom"
import { IconButton } from "@/components/ui/icon-button-tooltip"
import { Label } from "@/components/ui/label"
import { Field, FieldLabel } from "@/components/ui/field"
import { PasswordRequirements } from "@/components/password-requirements"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

type Passos = "email" | "codigo" | "senha"

type EmailPassoValues = {
  email: string
}

export function PasswordReset() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get("email") || ""
  // Passos vão mostrar em que etapa do processo o usuário está
  const [step, setStep] = useState<Passos>(email ? "codigo" : "email")
  const [userEmail, setUserEmail] = useState(email)

  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSenha, setShowSenha] = useState(false)
  const [senha, setSenha] = useState({ senha: "", confirmarSenha: "" })
  const [isPasswordValid, setIsPasswordValid] = useState(false)

  const navigate = useNavigate()
  const [resendTimer, setResendTimer] = useState(35)

  const emailForm = useForm<EmailPassoValues>({
    defaultValues: { email: email },
  })

  useEffect(() => {
    let interval: any
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendTimer])

  const handleSendEmail = async () => {
    if (!userEmail.trim()) {
      toast.error("Informe um e-mail válido.")
      return
    }
    setIsLoading(true)
    try {
      const response = await apiFetch("/auth/password-reset", {
        method: "POST",
        body: JSON.stringify({ email: userEmail }),
      })

      if (response.error) return toast.error(response.message)

      toast.success("Código de verificação enviado para o seu e-mail!")

      setStep("codigo")
      setResendTimer(35)
    } catch (er) {
      console.error(er)
      toast.error("Erro ao enviar e-mail.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    try {
      const response = await apiFetch("/auth/password-reset", {
        method: "POST",
        body: JSON.stringify({ email: userEmail, reset: true }),
      })

      if (response.error) return toast.error(response.message)

      toast.success("Código de verificação enviado!")
      setResendTimer(35)
    } catch (er) {
      console.error(er)
      toast.error("Erro ao reenviar o código.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = () => {
    if (!code || code.length < 8) {
      toast.error("Preencha o código completo de 8 dígitos.")
      return
    }
    setStep("senha")
  }

  const handleResetPassword = async () => {
    if (!isPasswordValid) {
      toast.error("Senha inválida.")
      return
    }

    if (senha.senha !== senha.confirmarSenha) {
      toast.error("As senhas não coincidem.")
      return
    }

    setIsLoading(true)
    try {
      const response = await apiFetch("/auth/password-reset-verify", {
        method: "POST",
        body: JSON.stringify({
          email: userEmail,
          code: code,
          novaSenha: senha.senha,
        }),
      })

      if (response.error) return toast.error(response.message)

      toast.success(
        "Senha alterada com sucesso! Redirecionando para o login..."
      )

      setTimeout(() => {
        navigate("/login")
      }, 3000)
    } catch (er) {
      console.error(er)
      toast.error("Ocorreu um erro ao redefinir a senha.")
    } finally {
      setIsLoading(false)
    }
  }

  const stepsConfig = [
    { key: "email", label: "E-mail", icon: Mail },
    { key: "codigo", label: "Validação", icon: KeyRound },
    { key: "senha", label: "Nova Senha", icon: Lock },
  ] as const

  const getStepStatus = (stepKey: Passos) => {
    const order: Passos[] = ["email", "codigo", "senha"]
    const currentIndex = order.indexOf(step)
    const stepIndex = order.indexOf(stepKey)

    if (stepIndex < currentIndex) return "completed"
    if (stepIndex === currentIndex) return "active"
    return "pending"
  }

  return (
    <div
      // className="flex items-center justify-center min-h-screen gap-8 bg-primary"
      className="flex min-h-screen items-center justify-center gap-8 px-4"
      style={{
        backgroundImage: "linear-gradient(135deg, #e0f2fe 20%, #a5c3e8 70%)",
      }}
    >
      <Card className="min-h-50 max-w-2xl min-w-0 flex-1 space-y-2 rounded-2xl border-blue-700 shadow-xl">
        <CardHeader>
          {step === "email" && (
            <>
              <CardTitle className="text-left text-2xl">
                {"Esqueci minha senha"}
              </CardTitle>
              <CardDescription className="text-left text-lg">
                {"Digite seu e-mail para receber um código de verificação."}
              </CardDescription>
            </>
          )}
          {step === "codigo" && (
            <>
              <CardTitle className="text-left text-2xl">
                {"Código de recuperação enviado para:"}
              </CardTitle>
              <CardDescription className="text-left text-lg">
                {userEmail || emailForm.getValues("email") || "seu e-mail"}
              </CardDescription>
            </>
          )}
          {step === "senha" && (
            <>
              <CardTitle className="text-left text-2xl">
                {"Insira sua nova senha:"}
              </CardTitle>
            </>
          )}
          <CardAction>
            <IconButton
              icon={<LogIn className="size-6" />}
              label="Ir para Login"
              variant={"ghost"}
              onClick={() => navigate("/login")}
            />
          </CardAction>
        </CardHeader>

        <CardContent>
          {step === "email" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-lg font-medium">
                E-mail:
              </Label>
              <Field orientation="horizontal">
                <Input
                  onChange={(e) => setUserEmail(e.target.value)}
                  type="email"
                  id="email"
                  placeholder="Insira um email cadastrado na plataforma"
                />
                <Button disabled={isLoading} onClick={handleSendEmail}>
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Solicitar código"
                  )}
                </Button>
              </Field>
            </div>
          )}

          {step === "codigo" && (
            <Field className="px-auto flex items-center justify-center">
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="otp-verification">
                  Código de verificação:
                </FieldLabel>
                <Button
                  variant="outline"
                  disabled={resendTimer > 0 || isLoading}
                  onClick={handleResendCode}
                >
                  {isLoading ? (
                    <Loader2 className="size-6 animate-spin" />
                  ) : resendTimer > 0 ? (
                    `Reenviar em ${resendTimer}s`
                  ) : (
                    <>
                      <RefreshCwIcon /> Reenviar código
                    </>
                  )}
                </Button>
              </div>
              <InputOTP
                maxLength={8}
                id="otp-verification"
                required
                value={code}
                onChange={setCode}
              >
                <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-22 *:data-[slot=input-otp-slot]:w-17 *:data-[slot=input-otp-slot]:text-2xl">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
                <InputOTPSeparator className="mx-4" />
                <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-22 *:data-[slot=input-otp-slot]:w-17 *:data-[slot=input-otp-slot]:text-2xl">
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                  <InputOTPSlot index={6} />
                  <InputOTPSlot index={7} />
                </InputOTPGroup>
              </InputOTP>
            </Field>
          )}

          {step === "senha" && (
            <div className="space-y-4 px-2">
              <Field className="flex items-center justify-center">
                <FieldLabel htmlFor="password-input">Senha:</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="password-input"
                    aria-describedby="password-requirements"
                    type={showSenha ? "text" : "password"}
                    placeholder="Insira sua nova senha"
                    value={senha.senha}
                    onChange={(e) =>
                      setSenha((prev) => ({ ...prev, senha: e.target.value }))
                    }
                  />
                  <InputGroupAddon align="inline-end">
                    <Button
                      variant={"ghost"}
                      onClick={() => setShowSenha(!showSenha)}
                    >
                      {!showSenha ? <Eye /> : <EyeOffIcon />}
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
                <PasswordRequirements
                  id="password-requirements"
                  onValidityChange={setIsPasswordValid}
                  password={senha.senha}
                />
              </Field>
              <Field className="flex items-center justify-center">
                <FieldLabel htmlFor="confirm-password-input">
                  Confirmar Senha:
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="confirm-password-input"
                    type={showSenha ? "text" : "password"}
                    placeholder="Confirme a sua senha"
                    value={senha.confirmarSenha}
                    onChange={(e) =>
                      setSenha((prev) => ({
                        ...prev,
                        confirmarSenha: e.target.value,
                      }))
                    }
                  />
                  <InputGroupAddon align="inline-end">
                    <Button
                      variant={"ghost"}
                      onClick={() => setShowSenha(!showSenha)}
                    >
                      {!showSenha ? <Eye /> : <EyeOffIcon />}
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
                {/* <FieldDescription>Icon positioned at the end.</FieldDescription> */}
              </Field>
            </div>
          )}
        </CardContent>
        {step === "email" ? null : (
          <CardFooter className="w-full justify-between pb-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setStep(`${step === "codigo" ? "email" : "codigo"}`)
              }
            >
              <ChevronLeft size={8} />
              Voltar
            </Button>
            {step === "codigo" ? (
              <>
                <Button
                  onClick={handleVerifyCode}
                  disabled={isLoading}
                  className="ml-auto h-10"
                >
                  Verificar
                  <SendHorizontal className="mx-auto size-4" />
                </Button>
              </>
            ) : (
              <>
                <Button disabled={isLoading} onClick={handleResetPassword}>
                  {isLoading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    "Redefinir senha"
                  )}
                </Button>
              </>
            )}
          </CardFooter>
        )}
      </Card>

      {/* Stepper Vertical  */}
      <div className="relative flex shrink-0 flex-col justify-between gap-8 py-2">
        {/* Linha Vertical Conectora */}
        <div className="absolute top-4 bottom-4 left-3.25 z-0 w-0.5 bg-slate-200" />

        {stepsConfig.map((s) => {
          const status = getStepStatus(s.key)
          const StepIcon = s.icon

          return (
            <div key={s.key} className="z-10 flex items-center gap-3">
              <div
                className={`flex size-7 items-center justify-center rounded-full transition-all duration-300 ${
                  status === "completed"
                    ? "bg-primary text-white shadow-md"
                    : status === "active"
                      ? "scale-105 bg-primary text-white shadow-md ring-4 ring-white/90"
                      : "border border-slate-200 bg-white text-slate-400"
                }`}
              >
                {status === "completed" ? (
                  <Check className="size-4 stroke-3" />
                ) : (
                  <StepIcon className="size-4" />
                )}
              </div>

              <span
                className={`text-sm font-medium transition-colors ${
                  status === "active"
                    ? "font-bold text-white"
                    : status === "completed"
                      ? "font-medium text-slate-700"
                      : "text-slate-400"
                }`}
              >
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
