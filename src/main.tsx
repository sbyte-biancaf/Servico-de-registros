// import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { TooltipProvider } from "./components/ui/tooltip.tsx"
import { Toaster } from "sonner"

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <App />
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </ThemeProvider>
  // </StrictMode>
)
