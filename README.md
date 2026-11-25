# Kakadu Каталог

Каталог с вариантами позиций и входом через Google. Выбор варианта сохраняется в аккаунте.

## Стек
Next.js 14 (App Router), TypeScript, Tailwind, Auth.js (Google), Prisma + SQLite.

## Запуск
```bash
npm install
cp .env.local.example .env.local
# заполнить GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
# NEXTAUTH_SECRET: openssl rand -base64 32
npx prisma db push
npm run db:seed
npm run dev
```

## Google OAuth
Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application).
Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`.

## Пуш на GitHub
```bash
git init
git add .
git commit -m "init: каталог с вариантами и Google-входом"
git branch -M main
git remote add origin https://github.com/Dedra555422/kakadu-catalog.git
git push -u origin main
```
`.env.local` и `dev.db` в `.gitignore`.
