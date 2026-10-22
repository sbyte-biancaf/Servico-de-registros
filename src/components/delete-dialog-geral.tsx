import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { apiFetch } from "@/lib/utils"
import { toast } from "sonner"
import { IconButton } from "./ui/icon-button-tooltip"

interface DeleteDialogProps {
  endpoint: string
  nomeEntidade: string
  nomeObjeto?: string
  cascata?: boolean
  onSuccess?: () => void
}

export function DeleteDialogGeral({
  endpoint,
  nomeEntidade,
  nomeObjeto,
  cascata = false,
  onSuccess,
}: DeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDeleting(true)
    // setError(null);
    try {
      const response = await apiFetch(endpoint, {
        method: "DELETE",
      })

      if (!response.error) {
        toast.success(`${nomeEntidade} removido com sucesso!`)
        setOpen(false)
        if (onSuccess) onSuccess()
      } else {
        const errorMsg = response.message || "Não foi possível excluir."
        toast.error(errorMsg)
      }
    } catch (e: any) {
      // console.error("Erro ao deletar:", e);
      toast.error("Erro de conexão com o servidor.")
      // setError(e.message);
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <IconButton
          variant="destructive"
          icon={<Trash2 className="size-4" />}
          label="Excluir"
        />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Essa ação é irreversível.</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          Excluir {nomeEntidade}:{" "}
          {nomeObjeto ? ` "${nomeObjeto}"` : ""}?
          <strong className="mt-5 block text-xs text-muted-foreground">
            {cascata &&
              `Todos os lançamentos desse ${nomeEntidade} serão excluídos!`}
          </strong>
        </AlertDialogDescription>
        <AlertDialogFooter className="flex justify-between">
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            variant="destructive"
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="size-4 animate-spin" />}
            {isDeleting ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
