import * as z from "zod"

export const EmployeeFormSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "Minimo de 3 caracteres!")
    .max(100, "Limite de carateres atingido!"),
  email: z
    .string()
    .trim()
    .email("Email inválido!")
})

export type TypeEmployeeFormData = z.infer<typeof EmployeeFormSchema>