import * as z from "zod"
import { type DateRange } from "react-day-picker"

export const tipoProjeto = [
  { label: "Sem Tipo", value: "SCC" },
  { label: "Estimativa", value: "ESTIMATIVA" },
  { label: "Orçado", value: "ORCADO" },
  { label: "Interno", value: "INTERNO" },
  { label: "Chamado", value: "CHAMADO" },
  { label: "Estudo", value: "ESTUDO" },
  { label: "AMS", value: "AMS" },
] as const

export const statusProjeto = [
  { label: "Em Espera", value: "EmEspera" },
  { label: "Orçando", value: "Orcando" },
  { label: "Em Andamento", value: "EmAndamento" },
  { label: "Finalizado", value: "Finalizado" },
  { label: "Cancelado", value: "Cancelado" },
] as const

export const getDefaultDateRange = (): DateRange => {
  const hoje = new Date()
  return {
    from: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
    to: new Date(new Date().setDate(new Date().getDate() + 180)),
  }
}

export const ProjectFormSchema = z
  .object({
    nome_projeto: z
      .string()
      .trim()
      .min(3, "Minimo de 3 caracteres!")
      .max(100, "Limite de carateres atingido!"),
    cliente_id: z.string(),
    ref_cliente: z.string().max(50, "Limite de carateres atingido!"),
    descricao: z.string(),
    data_inicio: z.date().or(z.string()).nonoptional(),
    data_fim: z.date().or(z.string()).nonoptional(),
    horas_previstas: z.number().or(z.enum(["Em Aberto"])),
    status: z.enum([
      "EmEspera",
      "Orcando",
      "EmAndamento",
      "Finalizado",
      "Cancelado",
    ]),
    centro_custo: z.string(),
    solicitante: z.string(),
    tipo: z.enum([
      "SCC",
      "ESTIMATIVA",
      "ORCADO",
      "INTERNO",
      "CHAMADO",
      "ESTUDO",
      "AMS"
    ]),
    equipe: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    if (new Date(data.data_inicio) > new Date(data.data_fim)) {
      ctx.addIssue({
        code: "custom",
        message: "A data fim não pode ser anterior ao início",
      })
    }

    if (data.horas_previstas !== "Em Aberto" && data.horas_previstas < 0) {
      ctx.addIssue({
        code: "custom",
        message: "Horas previstas não podem ser negativas",
      })
    }
  })

export type TypeProjectFormData = z.infer<typeof ProjectFormSchema>

export const checkVariantBack = (tabs: string[], tabValue: string) => {
  return tabs.includes(tabValue) ? "outline" : "destructive"
}

import type { Dispatch, SetStateAction } from "react";

type Tab = {
  label: string;
};

export function navigateTab(
  tabs: Tab[],
  currentTab: string,
  direction: 1 | -1,
  setTab: Dispatch<SetStateAction<string>>,
): void {
  const currentIndex = tabs.findIndex(
    (tab) => tab.label === currentTab
  );

  if (currentIndex === -1) return;

  const nextIndex = currentIndex + direction;

  if (nextIndex < 0 || nextIndex >= tabs.length) return;

  setTab(tabs[nextIndex].label);
}