import { setCookie } from "./utils"

const NO_REFRESH_ENDPOINTS = new Set([
  "/auth/login",
  "/auth/refresh-token",
  "/auth/logout",
])

let refreshInFlight: Promise<boolean> | null = null
let unauthorizedHandler: (() => void) | null = null
const WORKSPACE_STORAGE_KEY = import.meta.env.VITE_STORAGE_WK_KEY

const getWorkspaceIdFromStorage = (): string | null => {
  try {
    if (typeof window === "undefined") return null
    // Prefer localStorage (used by WorkspaceProvider) when available
    const fromStorage = localStorage.getItem(WORKSPACE_STORAGE_KEY)
    return fromStorage
  } catch {
    return null
  }
}

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler
}

export function setCurrentWorkspaceId(id?: string) {
  return id ? localStorage.setItem(WORKSPACE_STORAGE_KEY, id) : undefined
}

export interface Resp {
  error: boolean
  message: string
  data?: any
}

const readJsonSafely = async (response: Response) => {
  const contentType = response.headers.get("content-type") || ""
  if (!contentType.toLowerCase().includes("application/json")) return null
  return response.json().catch(() => null)
}

const maybeRedirectToLogin = () => {
  if (typeof window === "undefined") return
  if (window.location.pathname === "/login") return
  if (unauthorizedHandler) {
    unauthorizedHandler()
  } else {
    window.location.href = "/login"
  }
}

type AmbienteConfig = {
  url: string
  workspace: string
  _TK: string
}

export const AMBIENTES = new Map<string, AmbienteConfig>()

AMBIENTES.set('dev', { url: "http://localhost:3001", workspace: "sinoszep_00", _TK: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoiYWNjZXNzIiwidXN1YXJpb19pZCI6IjVlMDNiMDYwLTAyYTMtNGUyYi04ZTBhLThkZDhkMTQ2YzUyNCIsIm5vbWVfdXN1YXJpbyI6InNieXRlX2FkbWluIiwiaWF0IjoxNzkzMDM1ODkxfQ.YeXDJ91mQ9VMT-uCik0zIfLfXMHzpft_c9JD6dLIAdE"})
AMBIENTES.set('hom', { url: "https://api-chrono-hml.sinosbyte.com.br", workspace: "sinosbyte_rs", _TK: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoiYWNjZXNzIiwidXN1YXJpb19pZCI6IjRkYWZlYWMxLTdmZGUtNGRlNS1iYjQ0LWI4YTUyMTU1ZDE2ZiIsIm5vbWVfdXN1YXJpbyI6InNieXRlX2FkbWluIiwiaWF0IjoxNzkwODg1NjIzfQ.dKtSH_8-v1zmgF12k50zbeEzcmapKjV4mhokW3bRdyM"})
AMBIENTES.set('prod', { url: "https://api-chronotracker.sinosbyte.com.br", workspace: "sinosbyte_rs", _TK: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoiYWNjZXNzIiwidXN1YXJpb19pZCI6IjRkYWZlYWMxLTdmZGUtNGRlNS1iYjQ0LWI4YTUyMTU1ZDE2ZiIsIm5vbWVfdXN1YXJpbyI6InNieXRlX2FkbWluIiwiaWF0IjoxNzkzMDM2MjIzfQ.rwjnlNttzsO4GlF9RXV4rDmwo9szbTjzY_J2h7bNUNQ"})

export function setAmbienteAtivo(env: string) {
  localStorage.setItem("chrono_env", env || "dev")
}

const refreshSession = async (): Promise<boolean> => {
  const env = localStorage.getItem("chrono_env") || "dev"
  const envConfig = AMBIENTES.get(env)
  const targetUrl = `${envConfig?.url}/auth/refresh-token`
  try {
    const response = await fetch(targetUrl, { method: "POST", credentials: "include" })
    if (!response.ok) {
      maybeRedirectToLogin()
      return false
    }
    return true
  } catch {
    maybeRedirectToLogin()
    return false
  }
}


export const apiFetchRaw = async (
  endpoint: string,
  options: RequestInit = {},
  allowRefresh = true
): Promise<Response> => {
  const env = localStorage.getItem("chrono_env") || "dev"
  console.log(env)
  const envConfig = AMBIENTES.get(env)
  console.log(envConfig)

  const url = `${envConfig?.url}${endpoint}`

  const isFormData = options.body instanceof FormData

  const headers = new Headers(options.headers)
  if (!isFormData && options.body != null && !headers.has("content-type")) {
    headers.set("Content-Type", "application/json")
  }
  if (envConfig?.workspace && !headers.has("X-Workspace-Id")) {
    headers.set("X-Workspace-Id", envConfig.workspace)
  }
  headers.set("Authorization", "Bearer " + envConfig?._TK)
  const requestInit: RequestInit = { ...options, headers }
  const response = await fetch(url, requestInit)

  if (response.status !== 401) return response
  if (!allowRefresh) return response
  if (NO_REFRESH_ENDPOINTS.has(endpoint)) return response

  if (!refreshInFlight) {
    refreshInFlight = refreshSession().finally(() => {
      refreshInFlight = null
    })
  }

  const refreshed = await refreshInFlight
  if (!refreshed) return response

  const retryResponse = await fetch(url, requestInit)
  if (retryResponse.status === 401) {
    maybeRedirectToLogin()
  }
  return retryResponse
}

export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Resp> => {
  try {
    const response = await apiFetchRaw(endpoint, options)
    const json = await readJsonSafely(response)

    const isObject = (v: unknown): v is Record<string, any> =>
      typeof v === "object" && v !== null && !Array.isArray(v)

    const errorFromJson =
      isObject(json) && typeof json.error === "boolean" ? json.error : undefined
    const messageFromJson =
      isObject(json) && typeof json.message === "string"
        ? json.message
        : undefined

    let data: any = {}
    if (isObject(json)) {
      if ("data" in json) data = (json as any).data
      else if ("error" in json || "message" in json) data = {}
      else data = json
    } else if (json != null) {
      data = json
    }

    const isError = !response.ok || errorFromJson === true

    return {
      error: isError,
      message:
        messageFromJson ||
        (isError ? "Erro ao realizar requisição" : "Request realizada"),
      data,
    } 
  } catch (err) {
    return {
      error: true,
      message:
        err instanceof Error ? err.message : "Erro ao conectar com a API",
      data: {},
    }
  }
}
