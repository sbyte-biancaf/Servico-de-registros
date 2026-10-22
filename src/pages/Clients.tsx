import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { columns } from "@/components/clients/columns"
import { AddClientModal } from "@/components/clients/addClienteModal"
import { apiFetch } from "@/lib/utils"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
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
import { useNavigate } from "react-router-dom"

export function ClientsPage() {
  const navigate = useNavigate()
  const { currentWorkspace } = useWorkspace()

  const [statusFilter, setStatusFilter] = useState("all")

  const [data, setData] = useState<any[]>([])
  const [reload, setReload] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClientes = async () => {
      setLoading(true)
      const response = await apiFetch(
        `/clientes/list?is_active=${statusFilter}`
      )
      if (response.error) {
        toast.error(response.message || "Erro ao carregar clientes.")
        setData([])
      }

      setData(Array.isArray(response.data) ? response.data : [])
      setLoading(false)
    }

    fetchClientes()
  }, [statusFilter, reload, currentWorkspace])

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
        title="Parceiros"
        subtitle="Gerencie sua base de Parceiros."
        buttons={<AddClientModal onClientAdded={() => setReload(!reload)} />}
      />
      <main className="min-h-0 w-full pr-4">
        <DataTable
          columns={columns()}
          data={data}
          filterPlaceholder="Filtrar por Nome empresa ou Localização"
          filterColumn={["nomeCliente", "localizacao"]}
          extraFilters={
            <>
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
                <SelectTrigger className="ml-auto w-45">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Status</SelectLabel>
                    <SelectItem value="all">Ativos e Inativos</SelectItem>
                    <SelectItem value="true">Ativos</SelectItem>
                    <SelectItem value="false">Inativos</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </>
          }
          clickable
          onRowClick={(row: any) => navigate(`/clients/${row.clienteId}`)}
        />
      </main>
    </>
  )
}
