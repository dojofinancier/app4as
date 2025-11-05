# Decision Log

Quick decisions that don't warrant full Architecture Decision Records (ADRs). For significant architectural decisions, see [adr/](./adr/).

## Format

Each entry should include:
- **Date:** When the decision was made
- **Decision:** What was decided
- **Reason:** Why this choice was made
- **Impact:** What files/components are affected

---

## 2025-01-04: Migration Directory Organization
**Decision:** Organize migrations into `docs/migrations/` with subdirectories (dev/manual/rls)
**Reason:** Better organization, separates development scripts from production migrations
**Impact:** All migration files moved from root `Migrations/` to organized structure
**Files:** `docs/migrations/README.md`

## 2025-01-04: Chat History Archive
**Decision:** Move chat history to `.cursor/chats/` instead of root `chats/`
**Reason:** Keep root directory clean, maintain historical context
**Impact:** 11 chat files (~20MB) moved to `.cursor/chats/`
**Files:** `.cursor/chats/README.md`

## 2025-01-04: Logger Utility Implementation
**Decision:** Create custom logger utility (`lib/utils/logger.ts`) instead of using console.log directly
**Reason:** Need production-safe logging with different log levels (debug/info/warn/error)
**Impact:** Critical payment and webhook files now use logger instead of console
**Files:** `lib/utils/logger.ts`, `app/api/webhooks/stripe/route.ts`, `lib/actions/checkout.ts`

## 2025-01-04: Environment Variable Validation
**Decision:** Add `ensureEnvValid()` call in root layout for app-wide validation
**Reason:** Fail fast on startup if critical environment variables are missing
**Impact:** App validates environment variables on startup
**Files:** `app/layout.tsx`, `lib/utils/env-validation.ts`

---

**Note:** This log is for quick reference. Significant architectural decisions should be documented as ADRs in [adr/](./adr/).

