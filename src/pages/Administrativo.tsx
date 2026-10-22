import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useWorkspace } from "@/contexts/workspace-context"
import { AdministrativeCalendar } from "@/components/administrative/administrative-calendar"
import { CalendarEntryDialog } from "@/components/administrative/calendar-entry-dialog"
import { CalendarEntryFormCard } from "@/components/administrative/calendar-entry-form-card"
import {
  createAdministrativeEntry,
  deleteAdministrativeEntry,
  listAdministrativeData,
  updateAdministrativeEntry,
} from "@/components/administrative/administrative-api"
import { TeamManager } from "@/components/administrative/team-manager"
import {
  isManager,
  type AdministrativeProfile,
  type CalendarEntry,
  type CalendarEntryType,
  type TeamMember,
  type WorkspaceRole,
} from "@/components/administrative/types"

function asText(value: unknown) {
  return value === undefined || value === null ? "" : String(value)
}

function normalizeWorkspaceRole(value: unknown): WorkspaceRole {
  const role = String(value ?? "").toUpperCase()
  if (role === "OWNER") return "OWNER"
  if (role === "ADMIN") return "ADMIN"
  return "COLAB"
}

function normalizeMember(source: any): TeamMember | null {
  const id = asText(source?.usuarioId ?? source?.usuario_id ?? source?.id)
  if (!id) return null

  return {
    id,
    name:
      asText(
        source?.nomeCompleto ?? source?.nome_completo ?? source?.nomeUsuario
      ) || "Colaborador",
    username: asText(source?.nomeUsuario ?? source?.nome_usuario) || undefined,
    email: asText(source?.email) || undefined,
    role: normalizeWorkspaceRole(source?.cargo ?? source?.role),
    vh: asText(source?.vh),
    responsible: asText(source?.responsible),
    projetoPrincipal: asText(source?.projetoPrincipal ?? source?.projeto_principal),
  }
}

function uniqueMembers(members: TeamMember[]) {
  return members.filter(
    (member, index, collection) =>
      collection.findIndex((candidate) => candidate.id === member.id) === index
  )
}

export function AdministrativePage() {
  const { user } = useAuth()
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [profiles, setProfiles] = useState<AdministrativeProfile[]>([])
  const [entries, setEntries] = useState<CalendarEntry[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("")
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date>()
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<CalendarEntry>()

  const workspaceRole: WorkspaceRole = currentWorkspace?.isOwner
    ? "OWNER"
    : currentWorkspace?.isAdmin
      ? "ADMIN"
      : "COLAB"
  const currentUserId = String(user?.id ?? "current-user")
  
  const canManageTeam = isManager(workspaceRole)

  useEffect(() => {
    let cancelled = false

    async function loadAdministrativeData() {
      if (!currentWorkspace?.id) {
        if (!cancelled) {
          setMembers([])
          setProfiles([])
          setEntries([])
          setIsDataLoading(false)
        }
        return
      }

      setIsDataLoading(true)

      try {
        const [membersResponse, administrativeResponse] =
          await Promise.all([
            apiFetch("/usuarios/list?q=adm"),
            listAdministrativeData(),
          ])
        const rawMembers = Array.isArray(membersResponse.data)
          ? membersResponse.data
          : Array.isArray(membersResponse.data?.data)
            ? membersResponse.data.data
            : []
        const loadedMembers: TeamMember[] = []
        for (const source of rawMembers) {
          const member = normalizeMember(source)
          if (member) loadedMembers.push(member)
        }
        const resolvedMembers = uniqueMembers([...loadedMembers])

        if (!cancelled) {
          setMembers(resolvedMembers)
          setProfiles([])
          setEntries(administrativeResponse.data)
          if (administrativeResponse.error) {
            toast.error(
              administrativeResponse.message ||
                "Erro ao carregar dados administrativos."
            )
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados administrativos:", error)

        if (!cancelled) {
          setMembers([])
          setProfiles([])
          setEntries([])
          toast.error("Erro ao carregar dados administrativos.")
        }
      } finally {
        if (!cancelled) setIsDataLoading(false)
      }
    }

    loadAdministrativeData()

    return () => {
      cancelled = true
    }
  }, [currentWorkspace?.id])

  // const responsibleOptions = useMemo(
  //   () => members.filter((member) => member.role === "ADMIN"),
  //   [members]
  // )
  const manageableMembers = useMemo(() => {
    if (workspaceRole === "OWNER")
      return members.filter(
        (member) =>
          member.id !== currentUserId
      )
    if (workspaceRole === "ADMIN") {
      return members.filter((member) =>
        profiles.some(
          (profile) =>
            profile.usuarioId === member.id &&
            profile.responsibleId === currentUserId
        )
      )
    }

    return []
  }, [currentUserId, members, profiles, workspaceRole])

  // const activeEmployeeId = manageableMembers.some(
  //   (member) => member.id === selectedEmployeeId
  // )
  //   ? selectedEmployeeId
  //   : (manageableMembers[0]?.id ?? "")

  // const selectedEmployee = useMemo(
  //   () => members.find((member) => member.id === activeEmployeeId),
  //   [activeEmployeeId, members]
  // )
  // const selectedProfile = useMemo(
  //   () =>
  //     profiles.find((profile) => profile.usuarioId === activeEmployeeId) ??
  //     (selectedEmployee
  //       ? { employeeId: selectedEmployee.id, vhcCentavos: 0 }
  //       : undefined),
  //   [activeEmployeeId, profiles, selectedEmployee]
  // )
  // const selectedEmployeeProjects = useMemo(() => {
  //   if (!selectedEmployee) return []

  //   const hasProjectMembership = projects.some(
  //     (project) => project.memberIds.length > 0
  //   )
  //   if (!hasProjectMembership) return projects

  //   return projects.filter((project) =>
  //     project.memberIds.includes(selectedEmployee.id)
  //   )
  // }, [projects, selectedEmployee])

  const entryMemberOptions = useMemo(() => {
    if (workspaceRole === "OWNER") {
      return members.filter(
        (member) => member.role === "COLAB" || member.id === currentUserId
      )
    }
    if (workspaceRole === "ADMIN") {
      return uniqueMembers([
        ...manageableMembers,
        ...members.filter((member) => member.id === currentUserId),
      ])
    }
    return members.filter((member) => member.id === currentUserId)
  }, [currentUserId, manageableMembers, members, workspaceRole])

  const allowedEntryTypes = useMemo<CalendarEntryType[]>(() => {
    if (!canManageTeam) return ["FERIAS", "FALTA"]
    if (manageableMembers.length === 0) return ["FERIAS", "EVENTO"]
    return ["FERIAS", "FALTA", "EVENTO"]
  }, [canManageTeam, manageableMembers.length])
  const defaultEntryEmployeeId = canManageTeam
    ? manageableMembers[0]?.id
    : currentUserId

  function canManageEmployee(employeeId?: string) {
    if (!employeeId || !canManageTeam) return false
    const employee = members.find((member) => member.id === employeeId)
    if (employee?.role !== "COLAB") return false
    if (workspaceRole === "OWNER") return true

    return profiles.some(
      (profile) =>
        profile.usuarioId === employeeId &&
        profile.responsibleId === currentUserId
    )
  }

  function canEditEntry(entry: CalendarEntry) {
    if (entry.tipo === "EVENTO") return canManageTeam
    if (workspaceRole === "OWNER") return true
    if (entry.usuarioId === currentUserId) return true

    return workspaceRole === "ADMIN" && canManageEmployee(entry.usuarioId)
  }

  // reutilizavel mas tem q fazer umas alteracoes
  // async function handleProfileSave(profile: AdministrativeProfile) {
  //   if (!canManageEmployee(profile.usuarioId)) return false

  //   const hasProfile = profiles.some(
  //     (currentProfile) => currentProfile.usuarioId === profile.usuarioId
  //   )
  //   const response = hasProfile
  //     ? await updateAdministrativeProfile(profile)
  //     : await createAdministrativeProfile(profile)

  //   if (response.error) {
  //     toast.error(response.message || "Erro ao salvar configuração.")
  //     return false
  //   }

  //   const savedProfile = getReturnedProfile(response.data) ?? profile

  //   setProfiles((currentProfiles) =>
  //     hasProfile
  //       ? currentProfiles.map((currentProfile) =>
  //           currentProfile.usuarioId === profile.usuarioId
  //             ? savedProfile
  //             : currentProfile
  //         )
  //       : [...currentProfiles, savedProfile]
  //   )
  //   toast.success("Configuração atualizada")
  //   return true
  // }

  async function handleSaveEntry(entry: CalendarEntry) {
    const existingEntry = entries.find(
      (currentEntry) => currentEntry.id === entry.id
    )
    const canSaveEdit = existingEntry ? canEditEntry(existingEntry) : false

    if (existingEntry && !canSaveEdit) {
      toast.error("Você não tem permissão para alterar este registro.")
      return false
    }

    const response = existingEntry
      ? await updateAdministrativeEntry(entry)
      : await createAdministrativeEntry(entry)

    if (response.error) {
      toast.error(response.message || "Erro ao salvar registro.")
      return false
    }
    const savedEntry = response.data ?? undefined
    entry.id = savedEntry.id

    setEntries((currentEntries) =>
      existingEntry
        ? currentEntries.map((currentEntry) =>
            currentEntry.id === entry.id ? entry : currentEntry
          )
        : [...currentEntries, entry]
    )
    toast.success(existingEntry ? "Registro atualizado" : "Registro adicionado")
    return true
  }

  async function handleDeleteEntry(entryId: string) {
    const entry = entries.find((i) => i.id === entryId) as CalendarEntry
    if (!canEditEntry(entry)) {
      toast.error("Você não tem permissão para excluir este registro.")
      return false
    }

    const response = await deleteAdministrativeEntry(entryId)
    if (response.error) {
      toast.error(response.message || "Erro ao excluir registro.")
      return false
    }

    setEntries((currentEntries) =>
      currentEntries.filter((currentEntry) => currentEntry.id !== entryId)
    )
    toast.success("Registro excluído")
    return true
  }

  function handleOpenEntryDialog(entry?: CalendarEntry) {
    setEditingEntry(entry)
    setIsEntryDialogOpen(true)
  }

  if (isWorkspaceLoading || isDataLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <>
        <PageHeader title="Administrativo" />
        <main className="min-h-0 w-full pr-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Nenhuma empresa selecionada
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Selecione uma empresa para visualizar o calendário administrativo.
            </CardContent>
          </Card>
        </main>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Administrativo"
        subtitle={
          canManageTeam
            ? "Equipe, disponibilidade e agenda"
            : "Agenda do workspace"
        }
      />
      <main
        className={`grid w-full items-start gap-4 pr-4 ${
          canManageTeam
            ? "lg:grid-cols-[minmax(0,1fr)_minmax(21rem,0.55fr)]"
            : "lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.5fr)]"
        }`}
      >
        <AdministrativeCalendar
          entries={entries}
          members={members}
          selectedDay={selectedCalendarDay}
          canCreateEntry={canManageTeam}
          canEditEntry={canEditEntry}
          onSelectedDayChange={setSelectedCalendarDay}
          onCreateEntry={() => handleOpenEntryDialog()}
          onEditEntry={handleOpenEntryDialog}
        />
        {canManageTeam && (
          <div className="ml-px space-y-4">
            <TeamManager
              title={
                workspaceRole === "OWNER" 
                  ? "Colaboradores" 
                  : "Minha equipe"
              }
              members={manageableMembers}
              setSelectedMember={setSelectedEmployeeId}
            />
          </div>
        )}
        {!canManageTeam && (
          <CalendarEntryFormCard
            selectedDate={selectedCalendarDay}
            onSave={handleSaveEntry}
          />
        )}
      </main>

      <CalendarEntryDialog
        open={isEntryDialogOpen}
        onOpenChange={(open) => {
          setIsEntryDialogOpen(open)
          if (!open) setEditingEntry(undefined)
        }}
        entry={editingEntry ?? {usuarioId: selectedEmployeeId}}
        memberOptions={entryMemberOptions}
        allowedTypes={allowedEntryTypes}
        defaultEmployeeId={defaultEntryEmployeeId}
        defaultDate={selectedCalendarDay}
        onSave={handleSaveEntry}
        onDelete={handleDeleteEntry}
      />
    </>
  )
}
