import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { NotificationMenu } from "./app-notification-menu"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

const routeLabels: Record<string, string> = {
  timesheet: "Lançamentos",
  employees: "Colaboradores",
  clients: "Parceiros",
  projects: "Projetos",
  activities: "Atividades",
  expenses: "Despesas",
  reports: "Relatórios",
  administrativo: "Administrativo",
  profile: "Perfil",
}

interface PageHeaderProps {
  title: string
  subtitle?: React.ReactNode
  buttons?: React.ReactNode
  tabs?: { name: string; icon: any }[]
  back?: boolean
  activeTab?: string
  onTabChange?: (tabName: string) => void
}

export function PageHeader({
  title,
  subtitle,
  tabs,
  activeTab,
  buttons,
  onTabChange,
}: PageHeaderProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const segments = pathname.split("/").filter(Boolean)
  const sectionSegment = segments[0]
  const sectionLabel = sectionSegment ? routeLabels[sectionSegment] : undefined
  const isDetailPage = segments.length > 1

  return (
    <header className="py-4 pr-4">
      <div className="flex w-full flex-row">
        <Breadcrumb className="flex w-full flex-col space-y-2">
          <BreadcrumbList className="text-1xl">
            {/* Home is always the first crumb */}
            {sectionLabel ? (
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
            ) : (
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            )}

            {/* crumb */}
            {sectionLabel && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isDetailPage ? (
                    <BreadcrumbLink href={`/${sectionSegment}`}>
                      {sectionLabel}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{title}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </>
            )}

            {/* Detail crumb */}
            {isDetailPage && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="truncate">{title.split(": ")[1]}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
          <div className="flex flex-col">
            <h1 className="flex items-center text-2xl font-bold tracking-tight">
              {isDetailPage && (
                  <ChevronLeft className="size-6 mr-2 cursor-pointer" onClick={() => navigate(-1)} />
              )}
              {title}
            </h1>
            {subtitle && (
              <p className="text-md text-muted-foreground pt-1">{subtitle}</p>
            )}
          </div>
        </Breadcrumb>

        <div className="flex w-full flex-col space-y-2">
          <div className="flex flex-row justify-end">
            {/* <NotificationMenu /> */}
          </div>
          <div
            className={`flex flex-row justify-end items-center ${buttons ? "visible gap-2" : "hidden"}`}
          >
            {buttons}
          </div>
        </div>
      </div>

      {tabs && activeTab && (
        <Tabs
          value={activeTab}
          onValueChange={onTabChange}
          className="flex w-full flex-row"
        >
          <TabsList variant="line">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <TabsTrigger key={tab.name} value={tab.name}>
                  <Icon />{" "}
                  {tab.name.charAt(0).toUpperCase() + tab.name.slice(1)}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      )}
    </header>
  )
}
