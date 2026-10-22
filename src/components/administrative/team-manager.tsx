import { ChevronsUpDown, UsersRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { roleLabel, type AdministrativeProfile, type TeamMember } from "./types"
import { Avatar } from "../ui/avatar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible"

interface TeamManagerProps {
  title: string
  members: TeamMember[]
  setSelectedMember: (memberId: string) => void
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function TeamManager({
  title,
  members,
  setSelectedMember,
}: TeamManagerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UsersRound className="size-4" />
          {title}:
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-1 overflow-x-auto gap-4">
        {members.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum colaborador atribuído.
          </p>
        ) : (
          members.map((member) => {
            return (
              <Collapsible key={member.id}>
                <div
                  className={`flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors`}
                >
                  <Avatar className="size-9 shrink-0 items-center justify-center text-xs">
                    {initials(member.name)}
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {member.name}
                    </span>
                  </span>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-white ${
                      member.role === "ADMIN" ? "bg-yellow-500" : "bg-blue-600"
                    }`}
                  >
                    {roleLabel(member.role)}
                  </Badge>
                  <CollapsibleTrigger
                    onClick={() => setSelectedMember(member.id)}
                  >
                    <Button variant="ghost" size="icon">
                      <ChevronsUpDown />
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent className="flex flex-col gap-2 rounded-xl border px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Valor hora:</span>
                    <span className="font-medium">
                      {member.vh ?? "Sem valor hora"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Responsável:</span>
                    <span className="font-medium">
                      {member.responsible ?? "Sem Responsável"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Projeto principal:
                    </span>
                    <span className="font-medium">
                      {member.projetoPrincipal ?? "Sem Projeto"}
                    </span>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
