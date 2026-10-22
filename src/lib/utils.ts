import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Re-export fetch utilities from the centralised api-client
export { apiFetch, apiFetchRaw } from "@/lib/api-client"
export type { Resp } from "@/lib/api-client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type CookieSameSite = "Lax" | "Strict" | "None"

type CookieOptions = {
  path?: string
  maxAgeSeconds?: number
  sameSite?: CookieSameSite
  secure?: boolean
}

export const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null

  const encodedName = `${encodeURIComponent(name)}=`
  const parts = document.cookie.split("; ")

  for (const part of parts) {
    if (part.startsWith(encodedName)) {
      return decodeURIComponent(part.slice(encodedName.length))
    }
  }

  return null
}

export const setCookie = (
  name: string,
  value: string,
  options: CookieOptions = {}
) => {
  if (typeof document === "undefined") return

  const path = options.path ?? "/"
  const sameSite = options.sameSite ?? "Lax"
  const secure =
    options.secure ??
    (typeof window !== "undefined" && window.location.protocol === "https:")

  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=${path}; SameSite=${sameSite}`

  if (typeof options.maxAgeSeconds === "number") {
    cookie += `; Max-Age=${options.maxAgeSeconds}`
  }

  if (secure) cookie += "; Secure"

  document.cookie = cookie
}

export const deleteCookie = (name: string, path = "/") => {
  setCookie(name, "", { path, maxAgeSeconds: 0 })
}

export const getCurrentWorkspace = (): string | null => {
  try {
    if (typeof window === "undefined") return null
    const WORKSPACE_STORAGE_KEY = "chrono:lastWorkspaceId"
    const fromStorage = localStorage.getItem(WORKSPACE_STORAGE_KEY)
    if (fromStorage) return fromStorage
    return null
  } catch {
    return null
  }
}

export const setCurrentWorkspace = (workspaceIdentificador: string) => {
  try {
    if (typeof window === "undefined") return
    const WORKSPACE_STORAGE_KEY = "chrono:lastWorkspaceId"
    localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceIdentificador)
  } catch {
    // ignore
  }
}

export const deleteCurrentWorkspace = () => {
  try {
    if (typeof window === "undefined") return
    const WORKSPACE_STORAGE_KEY = "chrono:lastWorkspaceId"
    localStorage.removeItem(WORKSPACE_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function isDisabledStyle(isEditing: boolean): string {
  return `!w-full ${isEditing ? "border-transparent bg-slate-50 shadow-none" : ""}`
}

export function handlePriorityColor(priority: number) {
  switch (priority) {
    case 4:
      return "bg-red-400 text-white"
    case 3:
      return "bg-orange-400 text-white"
    case 2:
      return "bg-yellow-400 text-black"
    case 1:
      return "bg-green-400 text-white"
    default:
      return "bg-gray-400 text-white"
  }
}

export const statusProjetoMap: Map<string, { color: string; label: string }> =
  new Map([
    ["EmEspera", { color: "bg-gray-500", label: "Em Espera" }],
    ["Orcando", { color: "bg-amber-500", label: "Orçando" }],
    ["EmAndamento", { color: "bg-blue-600", label: "Em Andamento" }],
    ["Finalizado", { color: "bg-red-400", label: "Finalizado" }],
    ["Cancelado", { color: "bg-red-600", label: "Cancelado" }],
  ])