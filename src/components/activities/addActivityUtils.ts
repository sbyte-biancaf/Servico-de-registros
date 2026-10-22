import * as z from "zod"

export const ActivityFormSchema = z
  .object({
    nome_atividade: z.string().trim().min(3, "Minimo de 3 caracteres!"),
    projeto_id: z.string().min(1, "Selecione um projeto."),
    ref_cliente: z.string().max(50, "Limite de carateres atingido!"),
    prioridade: z.enum(["BAIXA", "NORMAL", "ALTA", "CRITICA"]),
    descr_atividade: z.string(),
    horas_previstas: z.number().or(z.literal("")),
    data_prevista_inicio: z.date(),
    data_prevista_fim: z.date(),
    status: z.number(),
    tipo_atividade: z.enum([
      "SCC",
      "ESTIMATIVA",
      "ORCADO",
      "INTERNO",
      "CHAMADO",
      "ESTUDO",
    ]),
    centro_custo: z.string(),
    solicitante: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.data_prevista_inicio > data.data_prevista_fim) {
      ctx.addIssue({
        code: "custom",
        path: ["data_prevista_fim"],
        message: "A data fim não pode ser anterior ao início.",
      })
    }
    if (data.horas_previstas !== "" && data.horas_previstas < 0) {
      ctx.addIssue({
        code: "custom",
        path: ["horas_previstas"],
        message: "Horas previstas não podem ser negativas.",
      })
    }
  })

export type TypeActivityFormData = z.infer<typeof ActivityFormSchema>