import { AppSidebar } from "./components/app-sidebar"
import { Outlet } from "react-router-dom"

export function Layout() {
  return (
    <>
      <AppSidebar />
      <main className="min-h-0 flex-1 md:ml-68 md:h-screen">
        <Outlet />
      </main>
    </>
  )
}
