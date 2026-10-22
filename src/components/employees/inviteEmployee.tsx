import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useCallback } from "react"
import {
  Loader2,
  MailPlus,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Controller, useForm } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { apiFetch } from "@/lib/utils"
import { toast } from "sonner"
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field"
import { EmployeeFormSchema, type TypeEmployeeFormData } from "./inviteEmployeeUtils"
import { IconButton } from "../ui/icon-button-tooltip"

interface inviteEmployeeDialogProps {
  onSuccess: () => void
}

export function InviteEmployeeModal({
  onSuccess,
}: inviteEmployeeDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const formEmployee = useForm<TypeEmployeeFormData>({
    resolver: zodResolver(EmployeeFormSchema),
    defaultValues: {
      nome: "",
      email: ""
    }
  })

  const closeAndReset = useCallback(() => {
    setOpen(false)
    formEmployee.reset()
  }, [formEmployee])

  // Handle modal open/close with full reset
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(true)
    if (!newOpen) return closeAndReset()
  }

  async function onSubmit(values: TypeEmployeeFormData) {
    setIsLoading(true)
    try {
      const response = await apiFetch("/convite/create", {
        method: "POST",
        body: JSON.stringify(values),
      })

      if (response.error) {
        toast.error(`${response.message || "Falha ao enviar convite"}`)
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

  return (
    <>
      <Dialog modal open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <IconButton 
            variant={"default"}
            label="Convidar"
            icon={<MailPlus className="size-4" />}
          />
        </DialogTrigger>
        <DialogContent className="min-w-2.5">
          <DialogHeader className="gap-3">
            <DialogTitle>Convidar um membro para o time</DialogTitle>
          </DialogHeader>
              <form id="invite-employee-form" onSubmit={formEmployee.handleSubmit(onSubmit)}>
                <FieldGroup>
                  <Controller
                    control={formEmployee.control}
                    name="nome"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Nome</FieldLabel>
                        <Input
                          {...field}
                          placeholder="Nome enviado junto ao convite"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    control={formEmployee.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Email</FieldLabel>
                        <Input
                          {...field}
                          placeholder="john@gmail.com.br"
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

          <DialogFooter>
            <Button type="submit" form="invite-employee-form" className="cursor-pointer" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Enviar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}