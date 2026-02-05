# Academic Management Dashboard

A Next.js academic management dashboard for tracking student performance, course enrollment, faculty workflows, and reporting insights. The UI is optimized for administrators and faculty members with responsive layouts, reusable forms, and data-rich views.

## Features
- **Dashboard** with summary cards, top students leaderboard, and enrollment analytics.
- **Student management** with search, filters, pagination, and detailed profiles.
- **Course management** with faculty assignments and enrollment counts.
- **Faculty panel** for enrollments, grade updates, and bulk actions.
- **Reporting** with CSV exports and enrollment trend charts.
- **Mock API** powered by JSON Server with optimistic UI updates.

## Tech Stack
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- React Hook Form + Zod
- ApexCharts (analytics)
- JSON Server (mock API)

## Getting Started

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   Ensure the API base URL is set:
   ```bash
   NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
   ```

3. **Run the mock API + frontend**
   ```bash
   pnpm dev:all
   ```
   - Next.js runs on `http://localhost:3000`
   - JSON Server runs on `http://localhost:4000`

4. **Run individually**
   ```bash
   pnpm mock
   pnpm dev
   ```

## Key Routes
- `/` — Dashboard
- `/students` — Student list
- `/students/new` — Create student
- `/students/[id]` — Student profile
- `/students/[id]/edit` — Edit student
- `/courses` — Course list
- `/courses/new` — Create course
- `/courses/[id]/edit` — Edit course
- `/faculty` — Faculty panel
- `/reports` — Reports & CSV export

## Architecture Decisions
- **Component structure**
  - `src/components/layout` for layout shell and headers
  - `src/components/forms` for reusable forms
  - `src/components/charts` for ApexCharts wrappers
  - `src/components/ui` for lightweight Tailwind UI primitives
- **Data layer**
  - `src/lib/api.ts` is a minimal fetch wrapper
  - `src/services/academic-api.ts` contains typed CRUD calls
  - `src/types/academic.ts` defines models (Student, Course, Faculty, Grade)
- **Optimistic updates**
  - Delete and bulk updates immediately update UI and rollback on failure
- **Mock API reset**
  - JSON Server is extended with `POST /__reset`
  - The app calls this on full page load to reset to `mock/db.json`
  - No writes persist to `db.json`

## Scripts
- `pnpm dev` — Start Next.js
- `pnpm mock` — Start JSON Server (non-persistent)
- `pnpm dev:all` — Run both together
- `pnpm build` — Production build

## Notes
- Data resets to the initial `mock/db.json` on browser refresh by design.
- ApexCharts is loaded via dynamic import to avoid SSR issues.
