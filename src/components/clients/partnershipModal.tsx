import { useState } from "react"
import { Handshake } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EmptyStyled } from "@/components/empty-comp"

interface PartnershipModalProps {
  identificadorParceiro: string
}

export function PartnershipModal({ identificadorParceiro }: PartnershipModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Badge
          className="cursor-pointer gap-1 bg-emerald-500 hover:bg-emerald-600 border-none text-white"
        >
          <Handshake className="size-5" />
          Parceiro
        </Badge>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="size-4" />
            Parceria — {identificadorParceiro}
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-48">
          <EmptyStyled />
        </div>
      </DialogContent>
    </Dialog>
  )
}
