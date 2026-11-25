# BLACK VAULT

Закрытый архив отдела. Доступ только по заявке и после одобрения администратором.

## Стек

- Next.js (App Router) + TypeScript + Tailwind
- Auth.js (next-auth v4), провайдер — только Discord
- Prisma + PostgreSQL (Supabase)

## Как работает доступ

1. Пользователь входит через Discord (scope `identify`, без email).
2. При первом входе создаётся запись со статусом `PENDING`.
3. До одобрения любые страницы архива редиректят на `/pending`.
4. Администратор в `/admin` одобряет, блокирует или меняет роль.
5. Каждое действие администратора пишется в `AdminLog`.

Роли: `OWNER` (владелец проекта), `ADMIN` (доверенное лицо), `MEMBER`.
Статусы: `PENDING`, `APPROVED`, `BLOCKED`.

## Разделы

- `SPECIAL_OKG` — Специальное ОКГ
- `REGULAR_OKG` — Обычное ОКГ

Материал: заголовок, описание, категория, ссылка на вложение.

## Настройка

### 1. Discord Developer Portal

- New Application
- OAuth2 → Redirects: `http://localhost:3000/api/auth/callback/discord` (и прод-домен)
- OAuth2 → Scopes: `identify`
- Client ID и Client Secret → в `.env.local`

### 2. Supabase

- New project → Settings → Database → Connection string
- `DATABASE_URL` — pooler, порт 6543, с `?pgbouncer=true`
- `DIRECT_URL` — порт 5432

### 3. Переменные

Скопируй `.env.local.example` в `.env.local` и заполни:

```
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=
DIRECT_URL=
```

`NEXTAUTH_SECRET` — `openssl rand -base64 32`.

### 4. Схема БД

Таблицы `User`, `Material`, `AdminLog` и enum-типы уже созданы в Supabase (SQL Editor).
Если разворачиваешь с нуля: `npx prisma db push`.

### 5. Первый администратор

После первого входа выполни в SQL Editor Supabase:

```sql
update "User" set role='OWNER', status='APPROVED' where "discordId"='ТВОЙ_DISCORD_ID';
```

Дальше второго администратора можно выдать из панели `/admin`.

## Запуск

```
npm install
npx prisma generate
npm run dev
```

## Что система НЕ обещает

Запрет копирования и водяные знаки не мешают скриншотам, фотографированию экрана
и переписыванию текста вручную. Доступ ограничивается организационно — тем, кому
выдан статус `APPROVED`.
