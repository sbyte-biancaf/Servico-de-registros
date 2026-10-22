import { HardHat, Hammer } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function IncompleteSection() {
    return (
    <Card className="flex gap-2 p-8 ring-0">
      <CardContent className="text-ambar-300 flex justify-center items-center gap-2">
      {/* <div className="rounded-full bg-amber-300 p-5 mb-4 flex gap-2">
      </div> */}
        <Hammer className="h-8 w-8" />{" "}
        <span className="text-xl">
          Em Desenvolvimento{" "}
          </span>
        <HardHat className="h-8 w-8" />
      <div className="text-lg font-semibold">
      </div>
      {/* <p className="text-sm text-slate-500 mt-1">
        Essa função ainda está sob desenvolvimento. Volte em breve!
      </p> */}
      </CardContent>
    </Card>
  )
}