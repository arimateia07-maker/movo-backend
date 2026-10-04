# Movo Backend

API independente do aplicativo Movo, construída com Express, tRPC, Drizzle, Neon e Firebase Admin.

## Desenvolvimento local

1. Copie `.env.example` para `.env` e preencha as variáveis.
2. Execute `pnpm install`.
3. Execute `pnpm dev`.
4. Verifique `http://localhost:3000/api/health`.

## Banco de dados

As migrações PostgreSQL estão em `drizzle/postgres`. Execute `pnpm db:migrate` para aplicá-las no banco configurado em `DATABASE_URL`.

## Deploy

Use Node.js 20 ou o `Dockerfile`. Em serviços Node tradicionais:

- Build command: `pnpm install --frozen-lockfile && pnpm build`
- Start command: `pnpm start`
- Health check: `/api/health`

Configure `DATABASE_URL`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` e `ALLOWED_ORIGINS`. Nesta última, informe a URL pública do frontend web; múltiplas origens são separadas por vírgula.

Após o deploy, configure no projeto Expo:

```env
EXPO_PUBLIC_API_BASE_URL=https://sua-api.exemplo.com
```

Reinicie o Metro com cache limpo ou gere um novo build, pois variáveis `EXPO_PUBLIC_*` são incorporadas ao bundle.
