import { useMemo, useState } from "react"
import { apiFetch, isDisabledStyle } from "@/lib/utils"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  LogOut,
  Save,
  Edit2,
  Camera,
  Lock,
  CopyIcon,
  Loader2Icon,
} from "lucide-react"
import { SeletorSearchBar } from "@/components/seletor-search-bar"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { IconButton } from "@/components/ui/icon-button-tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import type { User } from "@/contexts/auth-context"
import { useCopyToClipboard } from "@/hooks/use-clipboard"
import { PasswordRequirements } from "../password-requirements"

export function UserProfilePage() {
  const { user, logout, refetchUser } = useAuth()
  const { copyToClipboard } = useCopyToClipboard()

  const [openDialogPwd, setOpenDialogPwd] = useState(false)
  const [senhas, setSenhas] = useState({ atual: "", nova: "", confirmar: "" })
  const [isPasswordValid, setIsPasswordValid] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [empresaSelecionada, setEmpresaSelecionada] = useState<any | null>(null)

  const [usuario, setUsuario] = useState<User | null>(user ?? null)

  const empresas = useMemo(
    () =>
      usuario?.empresas?.map((empresa) => ({
        id: empresa.identificador,
        nome: empresa.nomeEmpresa,
      })) ?? [],
    [usuario?.empresas]
  )

  const formatarCargo = (cargo: string) => {
    return cargo.charAt(0).toUpperCase() + cargo.slice(1).toLowerCase()
  }

  const handleSave = async () => {
    if (!usuario) return
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (usuario.email && !emailRegex.test(usuario.email)) {
      toast.error("Por favor, insira um e-mail valido.")
      return
    }

    const payload = {
      nome_completo: usuario.nomeCompleto.trim(),
      nome_usuario: usuario.nomeUsuario.trim(),
      email: usuario.email,
      is_active: usuario.isActive,
    }

    const response = await apiFetch(`/usuarios/edit/${usuario.id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })

    if (!response.error) {
      await refetchUser()
      setIsEditing(false)
      return
    }
    setIsEditing(false)
    toast.error(response.message || "Erro ao salvar usuario")
    return
  }

  const handleEmpresaSelect = (identificador: string) => {
    const empresa = usuario?.empresas?.find(
      (emp) => emp.identificador === identificador
    )
    if (empresa) {
      setEmpresaSelecionada(empresa)
    }
  }

  // handler deve ser alterado para chmar a mesma api que atualiza o usuario
  const handleTrocarSenha = async () => {
    if (!isPasswordValid) {
      toast.error("Senha inválida.")
      return
    }
    if (senhas.nova !== senhas.confirmar) {
      toast.error("As senhas não coincidem.")
      return
    }

    const res = await apiFetch(`/usuarios/senha`, {
      method: "PATCH",
      body: JSON.stringify({
        senha_atual: senhas.atual,
        senha_nova: senhas.nova,
      }),
    })
    if (!res.error) {
      setOpenDialogPwd(false)
      toast.success("Senha alterada!")
      setSenhas({ atual: "", nova: "", confirmar: "" })
    } else {
      toast.error(res.message || "Erro ao alterar senha.")
    }
  }

  const Iniciais = () => {
    const nome = usuario?.nomeCompleto || usuario?.nomeUsuario || undefined
    if (!nome) return "?"

    const [nome1, nome2] = nome.trim().split(" ").slice(0, 2)
    if (nome1 && nome2) {
      return (nome1[0] + nome2[0]).toUpperCase()
    }
  }

  return (
    <main className="min-h-0 w-full pt-2.5 pr-4">
      <header className="mb-2 flex rounded-xl border bg-sidebar-accent p-1.5">
        <Avatar className="group size-22">
          <AvatarImage
            src={import.meta.env.VITE_ICHIGO}
            className="object-cover opacity-100 transition-opacity hover:cursor-pointer"
          />
          <AvatarFallback>{Iniciais()}</AvatarFallback>
          <Camera className="absolute inset-0 m-auto opacity-0 transition-opacity group-hover/avatar:opacity-100" />
        </Avatar>
        <div className="ml-4 flex flex-col justify-center">
          <h1 className="text-title text-2xl font-bold tracking-tight">
            {usuario?.nomeCompleto}
          </h1>
          <div className="flex gap-1.5">
            <span className="text-muted-foreground">Nome usuário:</span>
            {usuario?.nomeUsuario}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 p-2">
          <Dialog modal open={openDialogPwd} onOpenChange={setOpenDialogPwd}>
            <DialogTrigger>
              <IconButton
                icon={<Lock className="size-4" />}
                label="Alterar Senha "
              />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alterar senha</DialogTitle>
                <DialogDescription>
                  Digite sua senha atual e confirme a nova senha:
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <Field>
                  <FieldLabel>Senha atual</FieldLabel>
                  <Input
                    type="password"
                    value={senhas.atual}
                    onChange={(e) =>
                      setSenhas({ ...senhas, atual: e.target.value })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>Nova senha</FieldLabel>
                  <Input
                    type="password"
                    value={senhas.nova}
                    onChange={(e) =>
                      setSenhas({ ...senhas, nova: e.target.value })
                    }
                  />
                  <PasswordRequirements
                    password={senhas.nova}
                    onValidityChange={setIsPasswordValid}
                  />
                </Field>
                <Field>
                  <FieldLabel>Confirmar nova senha</FieldLabel>
                  <Input
                    type="password"
                    value={senhas.confirmar}
                    onChange={(e) =>
                      setSenhas({ ...senhas, confirmar: e.target.value })
                    }
                  />
                </Field>
              </div>
              <DialogFooter>
                <DialogClose>
                  <Button variant="outline"> Cancelar</Button>
                </DialogClose>
                <Button onClick={handleTrocarSenha}>Confirmar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {!isEditing ? (
            <IconButton
              icon={<Edit2 className="h-4 w-4" />}
              label="Editar"
              onClick={() => setIsEditing(true)}
            />
          ) : (
            <IconButton
              icon={<Save className="h-4 w-4" />}
              label="Salvar"
              onClick={handleSave}
            />
          )}

          <IconButton
            variant="destructive"
            icon={<LogOut className="h-4 w-4" />}
            label="Sair da conta"
            onClick={logout}
          />
        </div>
      </header>
      <div className="rounded-lg border p-3.5 shadow-sm">
        <div>
          <h2 className="mb-2 font-semibold">Informações:</h2>
          <div className="grid w-full gap-4 px-2 md:grid-cols-2">
            <Field className="col-span-2">
              <FieldLabel htmlFor="nome_completo">Nome Completo</FieldLabel>
              <Input
                disabled={!isEditing}
                value={usuario?.nomeCompleto}
                onChange={(e) =>
                  setUsuario((prev) =>
                    prev ? { ...prev, nomeCompleto: e.target.value } : prev
                  )
                }
                className={isDisabledStyle(isEditing)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="nome_usuario">Usuario</FieldLabel>
              <Input
                disabled={!isEditing}
                value={usuario?.nomeUsuario}
                onChange={(e) =>
                  setUsuario((prev) =>
                    prev ? { ...prev, nomeUsuario: e.target.value } : prev
                  )
                }
                className={isDisabledStyle(isEditing)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="email_usuario"> E-mail</FieldLabel>
              <Input
                id="email_usuario"
                disabled={!isEditing}
                type="email"
                value={usuario?.email}
                onChange={(e) =>
                  setUsuario((prev) =>
                    prev ? { ...prev, email: e.target.value } : prev
                  )
                }
                className={isDisabledStyle(isEditing)}
              />
            </Field>
            {/*  */}
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="nome_usuario">Api Key:</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    placeholder={usuario?.apiKey}
                    className="truncate"
                    readOnly
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-xs"
                      onClick={() => {
                        copyToClipboard(
                          usuario?.apiKey as string,
                          "Api key copiada!"
                        )
                      }}
                    >
                      <CopyIcon />
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            </FieldGroup>
          </div>
        </div>

        <Separator orientation="horizontal" className="my-4" />

        <div>
          <div className="flex justify-between">
            <h2 className="mb-2 font-semibold">Empresas Criadas:</h2>
            {empresaSelecionada && (
              <Badge>Cargo: {formatarCargo(empresaSelecionada.cargo)}</Badge>
            )}
          </div>
          <SeletorSearchBar
            className="mb-3"
            items={empresas}
            value={empresaSelecionada?.identificador ?? ""}
            onValueChange={handleEmpresaSelect}
            emptyMessage="Sem empresas criadas ate o momento"
          />
          <div className="flex flex-col justify-center px-1.5">
            {empresaSelecionada && (
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="nome_empresa">
                    Nome da Empresa
                  </FieldLabel>
                  <Input
                    disabled={!isEditing}
                    value={empresaSelecionada.nomeEmpresa}
                    className={isDisabledStyle(isEditing)}
                    onChange={(e) =>
                      setEmpresaSelecionada({
                        ...empresaSelecionada,
                        nomeEmpresa: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ident_empresa">
                    Identificador da Empresa
                  </FieldLabel>
                  <Input
                    disabled={!isEditing}
                    value={empresaSelecionada.identificador || ""}
                    className={isDisabledStyle(isEditing)}
                    onChange={(e) =>
                      setEmpresaSelecionada({
                        ...empresaSelecionada,
                        identificador: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
