import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useAuth } from "@/contexts/auth-context"
import { setCurrentWorkspaceId } from "@/lib/api-client"
import { setCurrentWorkspace, deleteCurrentWorkspace } from "@/lib/utils"

export interface Workspace {
  id: string
  name: string
  isAdmin?: boolean
  isOwner?: boolean
}

interface WorkspaceContextValue {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  switchWorkspace: (id: string) => void
  isLoading: boolean
}

const STORAGE_KEY = import.meta.env.VITE_STORAGE_WK_KEY
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading: authIsLoading } = useAuth()
  const [currentWorkspace, setCurrentWs] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const workspaces = useMemo<(Workspace & {role: string})[]>(
    () =>
        (user?.empresas ?? []).map((e) => ({
          id: e.identificador,
          name: e.nomeEmpresa,
          role: e.cargo,
        }))
    , [user]
  )

  // Sync workspace when user changes (login / logout / refetch)
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentWs(null)
      setCurrentWorkspaceId(undefined)
      // só limpa o storage após o auth ter carregado (logout real, não carregamento inicial)
      if (!authIsLoading) {
        localStorage.removeItem(STORAGE_KEY)
        deleteCurrentWorkspace()
      }
      setIsLoading(false)
      return
    }

    if (workspaces.length === 0) {
      setCurrentWorkspaceId(undefined)
      return
    }

    const savedId = localStorage.getItem(STORAGE_KEY)
    const restored = workspaces.find((w) => w.id === savedId) ?? workspaces[0]
    
    setCurrentWs({
      ...restored, 
      isAdmin: restored.role === "ADMIN", 
      isOwner: restored.role === "OWNER"
    })
    setCurrentWorkspaceId(restored.id)
    setCurrentWorkspace(restored.id)
    setIsLoading(false)
  }, [user, workspaces, isAuthenticated, authIsLoading])

  const switchWorkspace = useCallback(
    (id: string) => {
      const found = workspaces.find((w) => w.id === id)
      if (!found) return
      setCurrentWs({
        ...found,
        isAdmin: found.role === "ADMIN",
        isOwner: found.role === "OWNER",
      })
      setCurrentWorkspaceId(found.id)
      localStorage.setItem(STORAGE_KEY, found.id)
      setCurrentWorkspace(found.id)
    },
    [workspaces]
  )

  return (
    <WorkspaceContext.Provider
      value={{ workspaces, currentWorkspace, switchWorkspace, isLoading }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>")
  return ctx
}
