import { CircleCheck, X } from "lucide-react"
import { useEffect } from "react"

type PasswordRequirementsProps = {
  password: string
  id?: string
  onValidityChange?: (isValid: boolean) => void
}

const passwordRequirements = [
  {
    label: "No mínimo 8 caracteres",
    validate: (password: string) => password.length >= 8,
  },
  {
    label: "Pelo menos 1 letra minúscula e 1 maiúscula",
    validate: (password: string) =>
      /\p{Ll}/u.test(password) && /\p{Lu}/u.test(password),
  },
  {
    label: "Pelo menos 1 símbolo",
    validate: (password: string) => /[\p{P}\p{S}]/u.test(password),
  },
]

export function PasswordRequirements({
  password,
  id,
  onValidityChange,
}: PasswordRequirementsProps) {
  const allValid = passwordRequirements.every(({ validate }) => validate(password))

  useEffect(() => {
    onValidityChange?.(allValid)
  }, [allValid, onValidityChange])

  return (
    <ul id={id} aria-label="Requisitos da senha" className="space-y-1 text-sm">
      {passwordRequirements.map(({ label, validate }) => {
        const isValid = validate(password)
        const Icon = isValid ? CircleCheck : X

        return (
          <li
            key={label}
            className={`flex items-center gap-2 ${
              isValid ? "text-green-600" : "text-red-500"
            }`}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            <span>
              <span className="sr-only">
                {isValid ? "Atendido: " : "Não atendido: "}
              </span>
              {label}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
