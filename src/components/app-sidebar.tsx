import {
  Clock,
  Rocket,
  ListChecks,
  Building2,
  Users,
  FileText,
  DollarSign,
  Home,
  Menu,
  Settings,
} from "lucide-react"

import { Link, useLocation } from "react-router-dom"
import { UserProfile } from "./profile/UserProfile"
import { WorkSpaceMenu } from "./workspace-modal"
import { IconButton } from "./ui/icon-button-tooltip"
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "./ui/sheet"

const navItems = [
  { id: 1, icon: Home, path: "/", label: "Inicio" },
  { id: 2, icon: Clock, path: "/timesheet", label: "Lançamentos" },
  { id: 3, icon: Users, path: "/employees", label: "Colaboradores" },
  { id: 4, icon: Building2, path: "/clients", label: "Parceiros" },
  { id: 5, icon: Rocket, path: "/projects", label: "Projetos" },
  { id: 6, icon: ListChecks, path: "/activities", label: "Atividades" },
  { id: 8, icon: DollarSign, path: "/expenses", label: "Despesas" },
  { id: 9, icon: FileText, path: "/reports", label: "Relatórios" },
  { id: 10, icon: Settings, path: "/administrativo", label: "Administrativo" },
]

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-3">
      <img
        src="/ChronosAzulFundoRemovido.png"
        alt="Logo do ChronoTracker"
        className={`${compact ? "size-8" : "h-10 w-10"} shrink-0 object-cover`}
      />
      <div className="flex min-w-0 flex-col">
        <span
          className={`${compact ? "text-sm" : "text-lg"} leading-tight font-bold text-sidebar-foreground`}
        >
          CHRONO
        </span>
        <span
          className={`${compact ? "text-xs" : "text-md"} leading-tight font-semibold text-muted-foreground`}
        >
          TRACKER
        </span>
      </div>
    </Link>
  )
}
function NavigationContent({
  closeOnNavigate = false,
}: {
  closeOnNavigate?: boolean
}) {
  const location = useLocation()

  return (
    <div className="flex-1 overflow-y-auto px-2 py-4">
      <div className="mt-2 py-0">
        <span className="ml-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Navegação
        </span>
        <div className="mt-2 space-y-1.5">
          {navItems.map((menu) => {
            const isActive = location.pathname === menu.path
            const Icon = menu.icon
            const navigationLink = (
              <Link
                to={menu.path}
                className={`flex h-8 items-center gap-2 rounded-full px-3 transition-all duration-200 ${
                  isActive
                    ? "bg-primary font-semibold text-primary-foreground shadow-md"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/95 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{menu.label}</span>
              </Link>
            )

            return closeOnNavigate ? (
              <SheetClose key={menu.id} asChild>
                {navigationLink}
              </SheetClose>
            ) : (
              <div key={menu.id}>{navigationLink}</div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function AppSidebar() {
  return (
    <>
      <aside className="fixed my-2 ml-2 hidden h-[calc(100vh-1.2rem)] w-61 flex-col rounded-xl border border-sidebar-border bg-sidebar-accent shadow-lg md:flex">
        <div className="border-b px-3 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <Brand />
            <WorkSpaceMenu />
          </div>
        </div>

        <NavigationContent />
        <UserProfile />
      </aside>

      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-sidebar-accent px-3 md:hidden">
        <Brand compact />
        <div className="ml-auto flex items-center gap-1">
          <WorkSpaceMenu />
          <Sheet>
            <SheetTrigger asChild>
              <IconButton
                icon={<Menu className="size-4" />}
                label="Abrir navegação"
              />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 max-w-[calc(100vw-1rem)] gap-0 p-0"
            >
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="border-b px-4 py-4">
                  <Brand />
                </div>
                <NavigationContent closeOnNavigate />
                <UserProfile />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  )
}
