import { useEffect, useState } from "react"
import { Check, CalendarDays, Trash2 } from "lucide-react"
import { addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { type DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  calendarEntryLabels,
  parseLocalDate,
  type CalendarEntry,
  type CalendarEntryType,
  type TeamMember,
} from "./types"

interface CalendarEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry?: Partial<CalendarEntry>
  memberOptions: TeamMember[]
  allowedTypes: CalendarEntryType[]
  defaultEmployeeId?: string
  defaultDate?: Date
  onSave: (entry: CalendarEntry) => Promise<boolean>
  onDelete?: (entry: string) => Promise<boolean>
}

function defaultTitle(type: CalendarEntryType) {
  if (type === "FERIAS") return "Férias"
  if (type === "FALTA") return "Falta pontual"
  return "Evento da empresa"
}

export function CalendarEntryDialog({
  open,
  onOpenChange,
  entry,
  memberOptions,
  allowedTypes,
  defaultEmployeeId,
  defaultDate,
  onSave,
  onDelete,
}: CalendarEntryDialogProps) {
  const [entryType, setEntryType] = useState<CalendarEntryType>("FERIAS")
  const [title, setTitle] = useState("")
  const [employeeId, setEmployeeId] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return

    const nextType =
      entry?.tipo && allowedTypes.includes(entry.tipo)
        ? entry.tipo
        : (allowedTypes[0] ?? "FERIAS")

    setEntryType(nextType)
    setTitle(entry?.titulo ?? defaultTitle(nextType))
    setEmployeeId(
      entry?.usuarioId ?? defaultEmployeeId ?? memberOptions[0]?.id ?? ""
    )
    setDateRange(
      entry && entry.data_fim && entry.data_inicio
        ? {
            from: parseLocalDate(addDays(entry.data_inicio, 1)),
            to: parseLocalDate(addDays(entry.data_fim, 1)),
          }
        : defaultDate
          ? { from: defaultDate, to: defaultDate }
          : undefined
    )
    setError("")
  }, [open, entry, memberOptions, allowedTypes, defaultEmployeeId, defaultDate])

  const isGlobalEvent = entryType === "EVENTO"

  function handleEntryTypeChange(value: string) {
    const nextType = value as CalendarEntryType
    setEntryType(nextType)
    setTitle((currentTitle) =>
      currentTitle === defaultTitle(entryType)
        ? defaultTitle(nextType)
        : currentTitle
    )
    if (nextType !== "EVENTO" && !employeeId) {
      setEmployeeId(defaultEmployeeId ?? memberOptions[0]?.id ?? "")
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Informe um título para o registro.")
      return
    }

    if (!dateRange?.from || !dateRange.to) {
      setError("Selecione a data inicial e final.")
      return
    }

    if (dateRange.from > dateRange.to) {
      setError("A data final deve ser posterior à inicial.")
      return
    }

    if (!isGlobalEvent && !employeeId) {
      setError("Selecione o colaborador.")
      return
    }

    setIsSaving(true)
    try {
      const didSave = await onSave({
        id: entry?.id ?? `calendar-${Date.now()}`,
        tipo: entryType,
        titulo: title.trim(),
        usuarioId: isGlobalEvent ? undefined : employeeId,
        data_inicio: format(dateRange.from, "yyyy-MM-dd"),
        data_fim: format(dateRange.to, "yyyy-MM-dd"),
      })
      if (didSave) onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!entry) return
    setIsSaving(true)
    try {
      const didDelete = await onDelete?.(entry?.id ?? '')
      if (didDelete) onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {entry ? "Editar registro" : "Novo registro"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <Field>
            <FieldLabel>Tipo</FieldLabel>
            <Select value={entryType} onValueChange={handleEntryTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="p-1">
                {allowedTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {calendarEntryLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {!isGlobalEvent && (
            <Field>
              <FieldLabel>Colaborador</FieldLabel>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o colaborador" />
                </SelectTrigger>
                <SelectContent className="p-1">
                  {memberOptions.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="calendar-entry-title">Título</FieldLabel>
            <Input
              id="calendar-entry-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex: Férias de verão"
            />
          </Field>

          <Field>
            <FieldLabel>Período</FieldLabel>
            <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4 shrink-0" />
              {dateRange?.from && dateRange.to
                ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
                : "Selecione o intervalo no calendário"}
            </div>
            {/* <div className="overflow-x-auto rounded-md border"> */}
              <Calendar
                className="mx-auto my-auto rounded-md border"
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                locale={ptBR}
                numberOfMonths={2}
                fixedWeeks
              />
            {/* </div> */}
          </Field>

          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          {entry && onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="gap-2 sm:mr-auto"
              disabled={isSaving}
            >
              <Trash2 className="size-4" />
              Excluir
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="outline" disabled={isSaving}>
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={handleSave} className="gap-2" disabled={isSaving}>
            <Check className="size-4" />
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
