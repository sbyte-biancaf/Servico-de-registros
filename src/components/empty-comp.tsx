import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { MailMinusIcon } from "lucide-react"

export function EmptyStyled() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MailMinusIcon />
          </EmptyMedia>
          <EmptyTitle>Nenhum dado encontrado</EmptyTitle>
          <EmptyDescription>Não há informações para exibir.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
