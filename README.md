# ChronoTracker

Sistema de gestão de horas trabalhadas e projetos com dashboard interativo e timesheet inteligente.

## Tech Stack

- **React 19.2** - Biblioteca UI moderna
- **TypeScript** - Tipagem estática
- **Vite** - Build tool rápido e otimizado
- **Tailwind CSS v4** - Styling utilitário
- **shadcn/ui** - Componentes UI de alta qualidade
- **React Router v7** - Roteamento
- **React Hook Form** - Gerenciamento de formulários
- **TanStack React Table** - Tabelas avançadas
- **Recharts** - Gráficos e visualizações
- **Sonner** - Toast notifications
- **Radix UI** - Componentes acessíveis

## Pré-requisitos

- **Node.js** 18+ 
- **npm** ou **pnpm**
- Backend rodando localmente (porta 3000 ou configurável)

## Como Rodar Localmente

### 1. Clonar o repositório
```bash
git clone <seu-repo>
cd front_chronotracker
```

### 2. Instalar dependências
```bash
npm install
# ou
pnpm install
```

### 3. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173`

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build otimizado para produção |
| `npm run preview` | Preview da build de produção |
| `npm run lint` | Verifica erros com ESLint |
| `npm run format` | Formata código com Prettier |
| `npm run typecheck` | Verifica tipos TypeScript |

## Estrutura do Projeto

```
src/
├── pages/           # Páginas da aplicação
├── components/      # Componentes reutilizáveis
│   ├── ui/         # Componentes shadcn/ui
│   └── ...         # Componentes específicos
├── hooks/          # Custom hooks
├── lib/            # Utilitários e funções auxiliares
├── assets/         # Imagens e recursos estáticos
├── App.tsx         # Componente raiz
└── main.tsx        # Entry point
```

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_API_URL=http://localhost:3000
```

## Desenvolvendo com shadcn/ui

Para adicionar novos componentes shadcn/ui:

```bash
npx shadcn@latest add button
```

Os componentes serão instalados em `src/components/ui/`

## Troubleshooting

**Erro: "Cannot find module '@/components'"**
- Verifique se o `tsconfig.json` contém o path alias `@` apontando para `src/`

**Porta 5173 já em uso**
```bash
npm run dev -- --port 3001
```

## Suporte

Para dúvidas ou issues, abra uma issue no repositório.
