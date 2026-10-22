import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconButton } from "@/components/ui/icon-button-tooltip"
import { BriefcaseBusiness, Check } from "lucide-react"
// import { useNavigate } from "react-router-dom"
import { useWorkspace } from "@/contexts/workspace-context"

export function WorkSpaceMenu() {
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace()
  // const navigate = useNavigate()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton
            className="ml-auto"
            variant="ghost"
            icon={<BriefcaseBusiness />}
            label="Alterar empresa"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-40 p-1.5"
          align="start"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>Empresas</DropdownMenuLabel>
            {workspaces.length > 0 ? (
              workspaces.map((ws) => (
                <DropdownMenuItem
                  key={ws.id}
                  onClick={() => switchWorkspace(ws.id)}
                  className="flex items-center justify-between"
                >
                  {ws.name}
                  {currentWorkspace?.id === ws.id && <Check />}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem key="no-workspace" disabled>
                Nenhuma empresa disponível
              </DropdownMenuItem>
            )}
            {/* <DropdownMenuSeparator /> */}
            {/* <DropdownMenuItem
              className="flex items-center justify-between font-bold"
              onClick={() => navigate("/companies")}
            >
              Adicionar <Plus />
            </DropdownMenuItem> */}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
