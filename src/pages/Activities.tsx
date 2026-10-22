import { DataTable } from "@/components/data-table"
import { AddActivityModal } from "@/components/activities/addActivitieModal"
import { useState, useEffect, useMemo } from "react"
import { columns } from "@/components/activities/columns"
import { apiFetch } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { useNavigate } from "react-router-dom"
import { useWorkspace } from "@/contexts/workspace-context"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
// import { useState } from "react"

export function ActivitiesPage() {
  const navigate = useNavigate()

  const [clienteFilter, setClienteFilter] = useState("all")

  const { currentWorkspace } = useWorkspace()
  const [rawAtividades, setRawAtividades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(true)

  const clientes = useMemo(
    () =>
      Array.from(
        new Set(rawAtividades.map((a) => a.nomeCliente).filter(Boolean))
      ),
    [rawAtividades]
  )

  const atividades = useMemo(() => {
    if (clienteFilter === "all") return rawAtividades
    return rawAtividades.filter((a) => a.nomeCliente === clienteFilter)
  }, [rawAtividades, clienteFilter])

  useEffect(() => {
    const fetchAtividades = async () => {
      setLoading(true)
      try {
        const response = await apiFetch("/atividades/list")

        if (response.error) {
          throw new Error(response.message || "Erro ao buscar atividades")
        }
        const data = Array.isArray(response.data) ? response.data : []
        setRawAtividades(data)
        setClienteFilter("all")
      } catch (err) {
        console.error("Erro ao buscar atividades:", err)
        toast.error("Erro ao carregar a lista de atividades.")
      } finally {
        setLoading(false)
      }
    }
    fetchAtividades()
  }, [reload, currentWorkspace])

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    )
  }
  return (
    <>
      <PageHeader
        title="Atividades"
        subtitle="Visualize e gerencie suas atividades."
        buttons={<AddActivityModal onSuccess={() => setReload(!reload)} />}
      />
      <main className="min-h-0 w-full pr-4">
        <DataTable
          columns={columns()}
          clickable
          onRowClick={(row) => navigate(`/activities/${row.atividadeId}`)}
          data={atividades}
          filterPlaceholder="Pesquisar por atividade, projeto ou cliente"
          filterColumn={[
            "nomeCliente",
            "nomeProjeto",
            "nomeAtividade",
            "refCliente",
            "centroCusto",
            "solicitante",
            "refExterna",
          ]}
          extraFilters={
            <>
              <Select value={clienteFilter} onValueChange={setClienteFilter}>
                <SelectTrigger className="ml-auto w-45">
                  <SelectValue placeholder="Parceiros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Parceiros</SelectLabel>
                    <SelectItem key={"all-key"} value="all">
                      Todos os parceiros
                    </SelectItem>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente + "-key"} value={cliente}>
                        {cliente}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </>
          }
        />
      </main>
    </>
  )
}
