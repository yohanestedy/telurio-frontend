# Telurio Frontend

Frontend Nuxt 4 untuk **Telurio Egg Farm Management System**, terhubung ke backend NestJS di `http://localhost:3000/api`.

## Stack

- Nuxt 4 + TypeScript
- Tailwind CSS
- Pinia
- VueUse
- vee-validate + zod
- dayjs
- FullCalendar Vue
- shadcn-nuxt package + `components/ui` pattern

## Environment

Salin `.env.example` bila perlu, lalu pastikan nilainya seperti berikut:

```bash
NUXT_PUBLIC_API_BASE_URL=http://localhost:3000
NUXT_PUBLIC_API_PREFIX=/api
NUXT_PORT=3001
```

## Install

```bash
npm install
```

## Run

```bash
npm run dev -- --port 3001
```

## Production Build

```bash
npm run build
node .output/server/index.mjs
```

## Struktur Utama

```text
frontend/
├── app/
│   ├── assets/css/
│   ├── components/
│   │   ├── forms/
│   │   └── ui/
│   ├── composables/
│   ├── layouts/
│   ├── middleware/
│   ├── pages/
│   │   └── orders/
│   ├── stores/
│   ├── types/
│   └── utils/
├── nuxt.config.ts
├── tailwind.config.ts
└── package.json
```

## Yang Sudah Ada

- Auth flow: login, `me`, logout, change password
- App shell role-based: sidebar desktop, topbar blur, mobile bottom nav
- Route guard global + policy map terpusat
- Fetch wrapper dengan Bearer token + error mapping backend
- Halaman inti: dashboard, calendar, orders, order detail, productions, expenses, expense categories, coops, users, customers, prices, reports, profile
- Form utama sudah memakai `vee-validate` + `zod`
- Toast, loading state, empty/error state, reusable glass cards

## Catatan

- Build produksi berhasil dengan `npm run build`.
- TypeScript dibuat `strict`, tetapi Nuxt type-check runtime dimatikan karena environment lokal belum punya `vue-tsc` yang bisa diunduh tanpa akses registry tambahan.
