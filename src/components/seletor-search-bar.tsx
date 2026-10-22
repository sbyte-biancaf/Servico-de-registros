import { useState } from "react"
import { Check, ChevronDown, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export interface SeletorItem {
  id: string
  nome: string
  compartilhado?: boolean
  [key: string]: any
}

interface SeletorProps {
  label?: string
  items: SeletorItem[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  clearOptionLabel?: string
  small?: boolean
  className?: string
}

export function SeletorSearchBar({
  label,
  items = [],
  value,
  onValueChange,
  placeholder = "Selecione uma opção",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado.",
  disabled = false,
  clearOptionLabel = "Limpar seleção",
  small = false,
  className
}: SeletorProps) {
  const [open, setOpen] = useState(false)

  const itemSelecionado = items.find((item) => item.id === value)

  return (
    <div className={`w-full space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <span className={small ? "text-xs" : "" + "truncate"}>
                {itemSelecionado ? itemSelecionado.nome : placeholder}
              </span>
            </div>
            <ChevronDown />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          sideOffset={-31.6}
          align="start"
          className="flex p-0"
          style={{ width: "var(--radix-popover-trigger-width)" }}
        >
          <Command className="p-0">
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.nome}
                    aria-checked
                    className="w-full flex justify-between"
                    onSelect={() => {
                      onValueChange(String(item.id))
                      setOpen(false)
                    }}
                  >
                    <div className={`w-full flex items-center justify-between ${small ? "text-xs" : ""}`}>
                      {item.nome}
                      {item.compartilhado && (
                            <Share2/>
                        )}
                      {value === item.id ? <Check className="ml-auto" /> : null}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
