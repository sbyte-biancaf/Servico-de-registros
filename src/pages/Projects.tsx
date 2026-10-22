import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { AddProjectModal } from "@/components/projects/addProjectModal"
import { columns } from "@/components/projects/columns"
import { apiFetch } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useWorkspace } from "@/contexts/workspace-context"

export function ProjectsPage() {
  const navigate = useNavigate()
  const { currentWorkspace } = useWorkspace()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const projetos = await apiFetch("/projetos/list")

      if (projetos.error) {
        toast.error(projetos.message || "Erro ao buscar projetos")
        setLoading(false)
        return
      }

      setData(projetos.data)
      setLoading(false)
    }

    fetchData()
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
        title="Projetos"
        subtitle="Visualize e gerencie seus projetos."
        buttons={<AddProjectModal onSuccess={() => setReload(!reload)} />}
      />
      <main className="min-h-0 w-full pr-4">
        <DataTable
          clickable
          columns={columns()}
          onRowClick={(row: any) => {
            navigate(`/projects/${row.projetoId}`)
          }}
          data={data}
          filterPlaceholder="Pesquisar por nome do projeto, referência ou cliente"
          filterColumn={["nomeProjeto", "refCliente", "nomeCliente", "centroCusto", "solicitante", "refExterna"]}
        />
      </main>
    </>
  )
}
