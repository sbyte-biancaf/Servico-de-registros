import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { apiFetch } from "@/lib/api-client"
import { Loader2, Clock, FolderKanban, Receipt, TrendingUp, Info } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useWorkspace } from "@/contexts/workspace-context"
import { PageHeader } from "@/components/page-header"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function DashboardPage() {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<"dia" | "mes" | "ano">("dia")

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const fetch = async () => {
      setLoading(true)
      const res = await apiFetch(`/dashboard/stats?periodo=${periodo}`)
      if (!cancelled) {
        if (!res.error) setStats(res.data)
        setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [user, currentWorkspace, periodo])

  const saudacao = user?.nomeCompleto || user?.nomeUsuario || "usuário"

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  const diffPerc = Number(stats?.diferencaPercentual ?? 0)
  const prodMensal = Number(stats?.produtividadeMensal ?? 0)

  const statCards = [
    {
      icon: Clock,
      label: "Horas Hoje",
      value: stats?.horasTrabalhadasDia,
      sub: `${diffPerc >= 0 ? "+" : ""}${diffPerc}% vs ontem`,
      subColor: diffPerc >= 0 ? "text-green-600" : "text-red-500",
    },
    {
      icon: Clock,
      label: "Horas no Mês",
      value: stats?.horasTrabalhadasMes,
      sub: `${prodMensal >= 0 ? "+" : ""}${prodMensal}% vs mês anterior`,
      subColor: prodMensal >= 0 ? "text-green-600" : "text-red-500",
      info: "A produtividade mensal considera o período do primeiro dia do mês até a data atual e é comparada ao mesmo período do mês anterior."
    },
    {
      icon: FolderKanban,
      label: "Projetos",
      value: stats?.projetosAlocado?.length ?? 0,
      sub: null,
    },
    {
      icon: Receipt,
      label: "Despesas Mês",
      value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats?.despesasMes ?? 0),
      sub: null,
    },
  ]

  return (
    <main className="min-h-0 w-full pr-4">
      <PageHeader title={`Bem-vindo(a), ${saudacao}!`} />
      <Separator decorative orientation="horizontal" className="mb-4" ></Separator>

      <div className="mb-6 grid grid-cols-2 gap-3.5 pl-0.5 sm:grid-cols-4">
        {statCards.map(({ icon: Icon, label, value, sub, subColor, info }, i) => (
          <Card key={i} className="bg-sidebar-accent">
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Icon className="size-4" />
                {label}
              </CardTitle>
              { info &&(
                <Tooltip>
                  <TooltipTrigger asChild className="ml-auto"> 
                    <Button variant="ghost" size="icon">
                      <Info className = "size-4"/>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={5}>
                    <p>{info}</p>
                  </TooltipContent>
                </Tooltip>)
              }
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{value}</span>
              {sub && <p className={`mt-1 text-xs ${subColor}`}>{sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 pl-0.5 gap-4 md:grid-cols-3 mb-6">
        <Card className="bg-sidebar-accent">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="size-4" />
              Projetos Alocados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {stats?.projetosAlocado?.length > 0 ? (
              stats.projetosAlocado.map((p: any) => (
                <div key={p.id} className="rounded-md border px-3 py-1.5 text-sm font-medium">
                  {p.nome}
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">Sem projetos.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-sidebar-accent">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="size-4" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {stats?.atividadesRecentes?.length > 0 ? (
              stats.atividadesRecentes.map((a: any) => (
                <div key={a.id} className="rounded-md border px-3 py-1.5 text-sm font-medium">
                  {a.nome}
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">Sem atividades.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-sidebar-accent">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Receipt className="size-4" />
              Despesas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {stats?.despesasRecentes?.length > 0 ? (
              stats.despesasRecentes.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between rounded-md border px-3 py-1.5">
                  <div>
                    <p className="text-sm font-medium">{d.nomeDespesa}</p>
                    <p className="text-xs text-muted-foreground">{d.nomeProjeto}</p>
                  </div>
                  <span className="text-sm font-bold">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(d.valor)}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">Sem despesas.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="pl-0.5 gap-4 mb-6 grid grid-cols-1 md:grid-cols-none">
        <Card className="bg-sidebar-accent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Clock className="size-4" />
              Horas Trabalhadas
            </CardTitle>
            <Select 
              value={periodo} 
              onValueChange={(val: "dia" | "mes" | "ano") => setPeriodo(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dia">Dia</SelectItem>
                <SelectItem value="mes">Mês</SelectItem>
                <SelectItem value="ano">Ano</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.graficoHoras || []} margin={{right: 20}}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} unit="h" />
                  <RechartsTooltip
                    cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                    formatter={(value, name, item) => [item.payload.horasFormatadas, "Horas"]}
                  />
                  <Line dataKey="horas" stroke="var(--primary)" strokeWidth={2} dot={{ r: 5, fill: `var(--primary)`}} type="monotone"/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}