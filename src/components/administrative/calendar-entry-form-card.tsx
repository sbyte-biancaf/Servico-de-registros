import { useEffect, useState } from "react"
import { CalendarPlus, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  // toLocalDateKey,
  type CalendarEntry,
  type CalendarEntryType,
} from "./types"
import { format } from "date-fns"

interface CalendarEntryFormCardProps {
  selectedDate?: Date
  onSave: (entry: CalendarEntry) => Promise<boolean>
}

export function CalendarEntryFormCard({
  selectedDate,
  onSave,
}: CalendarEntryFormCardProps) {
  const initialDate = format(selectedDate ?? new Date(), "yyyy-MM-dd")
  const [entryType, setEntryType] = useState<CalendarEntryType>("FERIAS")
  const [title, setTitle] = useState("Férias")
  const [startDate, setStartDate] = useState(initialDate)
  const [endDate, setEndDate] = useState(initialDate)
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!selectedDate) return

    const dateKey = format(selectedDate, "yyyy-MM-dd")
    setStartDate(dateKey)
    setEndDate(dateKey)
  }, [selectedDate])

  function handleEntryTypeChange(value: string) {
    const nextType = value as Extract<CalendarEntryType, "FERIAS" | "FALTA">
    const defaultTitle = entryType === "FERIAS" ? "Férias" : "Falta pontual"

    setEntryType(nextType)
    setTitle((currentTitle) =>
      currentTitle === defaultTitle
        ? nextType === "FERIAS"
          ? "Férias"
          : "Falta pontual"
        : currentTitle
    )
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim()) {
      setError("Informe um título para o registro.")
      return
    }

    if (!startDate || !endDate) {
      setError("Informe a data inicial e final.")
      return
    }

    if (startDate > endDate) {
      setError("A data final deve ser posterior à inicial.")
      return
    }

    setIsSaving(true)
    try {
      const didSave = await onSave({
        id: `calendar-${Date.now()}`,
        tipo: entryType,
        titulo: title.trim(),
        data_inicio: new Date(startDate),
        data_fim: new Date(endDate),
      })

      if (didSave) {
        setEntryType("FERIAS")
        setTitle("Férias")
        setError("")
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarPlus className="size-4" />
          Nova entrada
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Field>
            <FieldLabel>Tipo</FieldLabel>
            <Select value={entryType} onValueChange={handleEntryTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="p-1">
                <SelectItem value="FERIAS">
                  {calendarEntryLabels.FERIAS}
                </SelectItem>
                <SelectItem value="FALTA">
                  {calendarEntryLabels.FALTA}
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="collaborator-entry-title">Título</FieldLabel>
            <Input
              id="collaborator-entry-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={
                entryType === "FERIAS"
                  ? "Ex: Férias de verão"
                  : "Ex: Falta por consulta"
              }
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="collaborator-entry-start">
                Data inicial
              </FieldLabel>
              <Input
                id="collaborator-entry-start"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="collaborator-entry-end">
                Data final
              </FieldLabel>
              <Input
                id="collaborator-entry-end"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </Field>
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full gap-2" disabled={isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            {entryType === "FERIAS" ? "Salvar férias" : "Salvar falta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
