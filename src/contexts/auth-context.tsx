import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { useNavigate } from "react-router-dom"
import { apiFetch, setUnauthorizedHandler } from "@/lib/api-client"

export interface User {
  id?: string
  apiKey: string
  email: string
  isActive: boolean
  nomeCompleto: string
  nomeUsuario: string
  empresas?: { nomeEmpresa: string; identificador: string; cargo: string }[]
}

interface LoginResult {
  error: boolean
  message: string
  user: User | null
}

export interface Invite {
  in: boolean, 
  tk: string
}

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string, invite?: Invite) => Promise<LoginResult>
  logout: () => Promise<void>
  refetchUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const normalizeUser = (data: any): User | null => {
  if (!data) return null
  const raw = data?.user ?? data
  if (!raw?.nome_usuario && !raw?.nomeUsuario && !raw?.email) return null

  const mapEmpresa = (e: any) => ({
    nomeEmpresa: e?.nomeEmpresa ?? e?.nome_empresa ?? "",
    identificador: e?.identificador ?? e?.id ?? "",
    cargo: e?.cargo ?? "",
  })

  const mapped: User = {
    id:
      raw?.id ??
      (raw?.colaborador_id ? String(raw.colaborador_id) : undefined) ??
      (raw?.usuario_id ? String(raw.usuario_id) : undefined),
    apiKey: raw.apiKey ?? "no-code",
    email: raw?.email ?? "",
    isActive: raw?.is_active ?? raw?.isActive ?? false,
    nomeCompleto: raw?.nomeCompleto ?? raw?.nome_completo ?? "",
    nomeUsuario: raw?.nomeUsuario ?? raw?.nome_usuario ?? "",
    empresas: Array.isArray(raw?.empresas)
      ? raw.empresas.map(mapEmpresa)
      : undefined,
  }

  return mapped
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  const logout = useCallback(async () => {
    await apiFetch("/auth/logout", { method: "POST" })
    setUser(null)
    if (window.location.pathname !== "/login") {
      navigate("/login", { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    setUnauthorizedHandler(logout)
  }, [logout])

  const fetchMe = useCallback(async (): Promise<User | null> => {
    const res = await apiFetch("/auth/me")
    if (res.error) return null
    return normalizeUser(res.data)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchMe().then((u) => {
      if (!cancelled) {
        setUser(u)
        setIsLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [fetchMe])

  const refetchUser = useCallback(async () => {
    const u = await fetchMe()
    console.log(u)
    setUser(u)
  }, [fetchMe])

  const login = useCallback(
    async (username: string, password: string, invite?: {in: boolean, tk: string}): Promise<LoginResult> => {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ nome_usuario: username, senha: password }),
      })
      if (res.error) return { error: true, message: res.message, user: null }
      // confirma convite
      if (invite && invite.in && invite.tk) {
        const conviteRes = await apiFetch(`/convite/aceitar/${invite?.tk}`, {method: "POST"})
        if (conviteRes.error) return { error: true, message: "Erro ao vincular convite.", user: null}
      }

      const u = await fetchMe()
      setUser(u)
      return { error: false, message: res.message, user: u }
    },
    [fetchMe]
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
