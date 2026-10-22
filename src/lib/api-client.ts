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

const refreshSession = async (): Promise<boolean> => {
  const url = `${import.meta.env.VITE_LOCAL_API_URL}/auth/refresh-token`
  try {
    const response = await fetch(url, { method: "POST", credentials: "include" })
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
const WORKSPACE = "sinoszep_00"
const _TK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoiYWNjZXNzIiwidXN1YXJpb19pZCI6IjNjYmQ3MDZmLWE4YjItNDQ2NC1hMzhjLWU0NGMzMDNjYjBiMyIsIm5vbWVfdXN1YXJpbyI6InNieXRlLmJpYW5jYSIsImlhdCI6MTc5MjY4ODQ4Nn0.gV9UaLFNd56IwmqqmDO1mjyBVNbU57O9sSaP-T4_Wto"
export const apiFetchRaw = async (
  endpoint: string,
  options: RequestInit = {},
  allowRefresh = true
): Promise<Response> => {
  const metaEnvs = {
    prod: "https://api-chronotracker.sinosbyte.com.br",
    hom: "https://api-chrono-hml.sinosbyte.com.br",
    dev: "http://localhost:3001",
  }
  const env = import.meta.env.VITE_NODE_ENV as keyof typeof metaEnvs ?? "dev"

  const url = `${metaEnvs[env]}${endpoint}`
  const isFormData = options.body instanceof FormData

  const headers = new Headers(options.headers)
  if (!isFormData && options.body != null && !headers.has("content-type")) {
    headers.set("Content-Type", "application/json")
  }
  if (WORKSPACE && !headers.has("X-Workspace-Id")) {
    headers.set("X-Workspace-Id", WORKSPACE)
  }
  headers.set("Authorization", "Bearer " + _TK)

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
