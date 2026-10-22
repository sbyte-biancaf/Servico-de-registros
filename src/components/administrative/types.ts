import { format } from "date-fns"

export type WorkspaceRole = "OWNER" | "ADMIN" | "COLAB"

export type CalendarEntryType = "FERIAS" | "FALTA" | "EVENTO"

export interface TeamMember {
  id: string
  name: string
  username?: string
  email?: string
  role: WorkspaceRole
  vh: string
  responsible: string
  projetoPrincipal: string
}

export interface ProjectOption {
  id: string
  name: string
  memberIds: string[]
}

export interface AdministrativeProfile {
  usuarioId: string
  responsibleId?: string
  primaryProjectId?: string
  vhcCentavos: number
}

export interface CalendarEntry {
  id: string
  tipo: CalendarEntryType
  titulo: string
  data_inicio: Date | string
  data_fim: Date | string
  usuarioId?: string
}

export const calendarEntryLabels: Record<CalendarEntryType, string> = {
  FERIAS: "Férias",
  FALTA: "Falta",
  EVENTO: "Evento",
}

export const calendarEntryDotClasses: Record<CalendarEntryType, string> = {
  FERIAS: "bg-sky-500",
  FALTA: "bg-rose-500",
  EVENTO: "bg-amber-500",
}

export function isManager(role: WorkspaceRole) {
  return role === "OWNER" || role === "ADMIN"
}

export function roleLabel(role: WorkspaceRole) {
  if (role === "OWNER") return "Owner"
  if (role === "ADMIN") return "Admin"
  return "Colaborador"
}

// export function toLocalDateKey(date: Date) {
//   const year = date.getFullYear()
//   const month = String(date.getMonth() + 1).padStart(2, "0")
//   const day = String(date.getDate() + 1).padStart(2, "0")

//   return `${year}-${month}-${day}`
// }

export function parseLocalDate(value: string | Date) {
  if (value instanceof Date) {
    value = format(value, "yyyy-MM-dd")
  }

  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function isDateInRange(dateKey: string, entry: CalendarEntry) {
  return dateKey >= entry.data_inicio && dateKey <= entry.data_fim
}

export function formatVhc(vhcCentavos: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(vhcCentavos / 100)
}
