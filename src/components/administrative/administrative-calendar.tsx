import { useMemo, useState } from "react"
import { addDays, format, startOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarPlus, Pencil } from "lucide-react"
import { type DayButton } from "react-day-picker"
import { Badge } from "@/components/ui/badge"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { IconButton } from "@/components/ui/icon-button-tooltip"
import { cn } from "@/lib/utils"
import {
  calendarEntryDotClasses,
  calendarEntryLabels,
  // parseLocalDate,
  // toLocalDateKey,
  type CalendarEntry,
  type CalendarEntryType,
  type TeamMember,
} from "./types"

interface AdministrativeCalendarProps {
  entries: CalendarEntry[]
  members: TeamMember[]
  selectedDay?: Date
  canCreateEntry: boolean
  canEditEntry: (entry: CalendarEntry) => boolean
  onSelectedDayChange: (day?: Date) => void
  onCreateEntry: () => void
  onEditEntry: (entry: CalendarEntry) => void
}

function formatEntryPeriod(entry: CalendarEntry) {
  const start = format(addDays(entry.data_inicio, 1), "dd/MM")
  const end = format(addDays(entry.data_fim, 1), "dd/MM")

  return start === end ? start : `${start} - ${end}`
}

export function AdministrativeCalendar({
  entries,
  members,
  selectedDay,
  canCreateEntry,
  canEditEntry,
  onSelectedDayChange,
  onCreateEntry,
  onEditEntry,
}: AdministrativeCalendarProps) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))

  const entriesByDate = useMemo(() => {
    const mappedEntries = new Map<string, CalendarEntry[]>()

    if (entries?.length >= 1) {
      entries.forEach((entry) => {
        let date = addDays(new Date(entry.data_inicio), 1)
        const endDate = addDays(new Date(entry.data_fim), 1)
        while (date <= endDate) {
          const key = format(date, "yyyy-MM-dd")
          mappedEntries.set(key, [...(mappedEntries.get(key) ?? []), entry])
          date = addDays(date, 1)
        }
      })
    }

    return mappedEntries
  }, [entries])

  const records = useMemo(() => {
    if (selectedDay) {
      return entriesByDate.get(format(selectedDay, "yyyy-MM-dd")) ?? []
    }
    if (entries.length === 0) return entries

    const monthKey = format(month, "yyyy-MM")

    return entries.filter(
      (entry) =>
        format(new Date(entry.data_inicio), "yyyy-MM") <= monthKey &&
        format(new Date(entry.data_fim), "yyyy-MM") >= monthKey
    ) 
  }, [entries, entriesByDate, month, selectedDay])

  const recordsLabel = selectedDay
    ? format(selectedDay, "d 'de' MMMM", { locale: ptBR })
    : format(month, "MMMM 'de' yyyy", { locale: ptBR })

  function DayButtonWithEntries(props: React.ComponentProps<typeof DayButton>) {
    const dayEntries =
      entriesByDate.get(format(props.day.date, "yyyy-MM-dd")) ?? []
    const entryTypes = Array.from(
      new Set(dayEntries.map((entry) => entry.tipo))
    )

    return (
      <CalendarDayButton
        {...props}
        className={cn(
          props.className,
          dayEntries.length > 0 && "border-2 border-accent"
        )}
      >
        <span>{props.day.date.getDate()}</span>
        {entryTypes.length > 0 && (
          <div
            aria-hidden="true"
            className="absolute right-1 bottom-1 flex gap-0.5 opacity-100"
          >
            {entryTypes.slice(0, 3).map((type) => (
              <span
                key={type}
                className={`size-1 rounded-full ${calendarEntryDotClasses[type]}`}
              />
            ))}
          </div>
        )}
      </CalendarDayButton>
    )
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-base capitalize">
          Calendário administrativo
        </CardTitle>
        <CardAction>
          {canCreateEntry && (
            <IconButton
              icon={<CalendarPlus className="size-4" />}
              label="Adicionar registro"
              onClick={onCreateEntry}
            />
          )}
        </CardAction>
      </CardHeader>

      <CardContent className="grid min-w-0 gap-6 lg:grid-cols-[minmax(18rem,28rem)_minmax(0,1fr)]">
        <div className="w-full max-w-md min-w-0 justify-self-center rounded-md border lg:justify-self-start">
          <Calendar
            className="w-full"
            classNames={{ root: "w-full" }}
            captionLayout="label"
            mode="single"
            month={month}
            onMonthChange={(nextMonth) => {
              setMonth(nextMonth)
            }}
            selected={selectedDay}
            onSelect={onSelectedDayChange}
            locale={ptBR}
            fixedWeeks
            components={{
              DayButton: DayButtonWithEntries,
            }}
          />
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(calendarEntryLabels) as CalendarEntryType[]).map(
              (type) => (
                <Badge key={type} variant="outline" className="gap-1.5 text-xs">
                  <span
                    className={`size-2 rounded-full ${calendarEntryDotClasses[type]}`}
                  />
                  {calendarEntryLabels[type]}
                </Badge>
              )
            )}
          </div>

          <div className="flex flex-col h-full">
            <p className="mb-2 text-sm font-medium capitalize">
              {recordsLabel}
            </p>
            <div className="max-h-96 divide-y overflow-y-auto rounded-md border">
              {records.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Sem registros neste período.
                </p>
              ) : (
                records
                  .slice()
                  .sort((first, second) =>
                    first.data_inicio.localeCompare(second.data_inicio)
                  )
                  .map((entry) => {
                    const member = members.find(
                      (item) => item.id === entry.usuarioId
                    )

                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-2 px-3 py-2"
                      >
                        <span
                          aria-hidden="true"
                          className={`size-2 shrink-0 rounded-full ${calendarEntryDotClasses[entry.tipo]}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {entry.titulo}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {entry.tipo === "EVENTO"
                              ? "Workspace"
                              : (member?.name ?? "Colaborador")}{" "}
                            · {formatEntryPeriod(entry)}
                          </p>
                        </div>
                        {canEditEntry(entry) && (
                          <IconButton
                            icon={<Pencil className="size-3.5" />}
                            label="Editar registro"
                            size="icon-sm"
                            onClick={() => onEditEntry(entry)}
                          />
                        )}
                      </div>
                    )
                  })
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
