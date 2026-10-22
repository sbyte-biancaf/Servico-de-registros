import { apiFetch } from "@/lib/utils"
import {
  // toLocalDateKey,
  type AdministrativeProfile,
  type CalendarEntry,
  type CalendarEntryType,
} from "./types"
import { format } from "date-fns"

type ApiRecord = Record<string, unknown>

function asRecord(value: unknown): ApiRecord | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined
  }

  return value as ApiRecord
}

function readValue(record: ApiRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (value !== undefined && value !== null) return value
  }
}

function readString(record: ApiRecord, keys: string[]) {
  const value = readValue(record, keys)
  if (typeof value === "string" || typeof value === "number") {
    return String(value)
  }
}

function readNumber(record: ApiRecord, keys: string[]) {
  const value = readValue(record, keys)
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value !== "string") return undefined

  const normalized = value.includes(",")
    ? value.replace(/\./g, "").replace(",", ".")
    : value
  const numberValue = Number(normalized)

  return Number.isFinite(numberValue) ? numberValue : undefined
}

function readDateKey(record: ApiRecord, keys: string[]) {
  const value = readValue(record, keys)
  if (typeof value === "string") {
    const dateKey = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0]
    if (dateKey) return dateKey
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return format(value, "yyyy-MM-dd")
  }

  if (typeof value === "number" || typeof value === "string") {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return format(date, "yyyy-MM-dd")
  }
}

function normalizeEntryType(value: unknown): CalendarEntryType | undefined {
  const normalized = String(value ?? "").toUpperCase()

  if (normalized === "FERIAS" || normalized === "FÉRIAS") return "FERIAS"
  if (normalized === "FALTA") return "FALTA"
  if (normalized === "EVENTO") return "EVENTO"
}

export function normalizeAdministrativeProfile(
  value: unknown
): AdministrativeProfile | undefined {
  const record = asRecord(value)
  if (!record) return undefined

  const employeeId = readString(record, [
    "employeeId",
    "employee_id",
    "colaboradorId",
    "colaborador_id",
    "usuarioId",
    "usuario_id",
  ])
  if (!employeeId) return undefined

  const vhcCentavos = readNumber(record, ["vhcCentavos", "vhc_centavos"])
  const vhc = readNumber(record, ["vhc", "valorHora", "valor_hora"])

  return {
    usuarioId: employeeId,
    responsibleId: readString(record, [
      "responsibleId",
      "responsible_id",
      "responsavelId",
      "responsavel_id",
    ]),
    primaryProjectId: readString(record, [
      "primaryProjectId",
      "primary_project_id",
      "projetoPrincipalId",
      "projeto_principal_id",
    ]),
    vhcCentavos: vhcCentavos ?? Math.round((vhc ?? 0) * 100),
  }
}

export function normalizeAdministrativeEntry(
  value: unknown
): CalendarEntry | undefined {
  const record = asRecord(value)
  if (!record) return undefined

  const id = readString(record, [
    "id",
    "administrativoId",
    "administrativo_id",
    "entradaId",
    "entrada_id",
  ])
  const type = normalizeEntryType(readValue(record, ["type", "tipo"]))
  const title = readString(record, ["title", "titulo", "nome", "descricao"])
  const startDate = readDateKey(record, [
    "startDate",
    "start_date",
    "dataInicio",
    "data_inicio",
  ])
  const endDate = readDateKey(record, [
    "endDate",
    "end_date",
    "dataFim",
    "data_fim",
  ])

  if (!id || !type || !title || !startDate || !endDate) return undefined

  return {
    id,
    tipo: type,
    titulo: title,
    data_inicio: startDate,
    data_fim: endDate,
    usuarioId: readString(record, [
      "employeeId",
      "employee_id",
      "colaboradorId",
      "colaborador_id",
      "usuarioId",
      "usuario_id",
    ]),
  }
}

function unwrapReturnedRecord(value: unknown, keys: string[]) {
  const record = asRecord(value)
  if (!record) return value

  return readValue(record, keys) ?? value
}

export async function listAdministrativeData() {
  return await apiFetch("/administrativo/list")
}

export async function createAdministrativeEntry(entry: CalendarEntry) {
  return apiFetch("/administrativo/create", {
    method: "POST",
    body: JSON.stringify(entry),
  })
}

export async function updateAdministrativeEntry(entry: CalendarEntry) {
  return apiFetch(`/administrativo/edit/${entry.id}`, {
    method: "PUT",
    body: JSON.stringify(entry),
  })
}

export async function deleteAdministrativeEntry(entryId: string) {
  return apiFetch(`/administrativo/delete/${entryId}`, {
    method: "DELETE",
  })
}

export function getReturnedProfile(value: unknown) {
  return normalizeAdministrativeProfile(
    unwrapReturnedRecord(value, ["profile", "perfil", "data"])
  )
}
