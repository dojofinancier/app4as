# Documentation Guide - Recording Development Context

This guide provides best practices for recording historical development context instead of relying solely on chat history.

---

## 📚 Recommended Documentation Structure

### 1. **Architecture Decision Records (ADRs)** ⭐ RECOMMENDED
**Purpose:** Document WHY significant technical decisions were made

**Location:** `.cursor/documentation/adr/`

**Format:** One file per decision, numbered sequentially

**When to create:**
- Choosing between technical alternatives (e.g., "Why we chose Payment Intent over Checkout Session")
- Adopting a new pattern or library
- Making breaking changes
- Resolving architectural conflicts

**Template:**
```markdown
# ADR-001: Use Payment Intent instead of Checkout Session

## Status
Accepted

## Context
We needed to support guest checkout with account creation during payment...

## Decision
We chose Stripe Payment Intent because:
- Allows account creation during payment flow
- Supports metadata storage limitations workaround
- Better control over payment flow

## Consequences
- Positive: More flexible payment flow
- Negative: Requires more custom code
- Risk: Webhook complexity increased
```

---

### 2. **CHANGELOG.md** ⭐ RECOMMENDED
**Purpose:** Track WHAT changed and WHEN (chronological history)

**Location:** Root `CHANGELOG.md`

**Format:** Keep a Draftsman-style changelog

**When to update:**
- After completing a feature or phase
- After fixing a critical bug
- After major refactoring
- Before each release

**Example:**
```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Guest checkout with account creation during payment
- Dual rate system (student vs tutor rates)
- Credit bank system for cancellations

### Changed
- Payment flow migrated from Checkout Session to Payment Intent
- Cart system now supports session-based guest carts

### Fixed
- RLS policies for guest cart access
- Webhook idempotency issues

## [1.0.0] - 2025-01-XX

### Added
- Initial release
```

---

### 3. **Decision Log** (Quick Decisions)
**Purpose:** Simple log for quick decisions that don't warrant full ADR

**Location:** `.cursor/documentation/DECISION_LOG.md`

**Format:** Simple dated entries

**When to use:**
- Quick implementation choices
- Minor pattern decisions
- Configuration choices

**Example:**
```markdown
# Decision Log

Quick decisions that don't warrant full ADR documents.

## 2025-01-15: Logger Implementation
**Decision:** Use custom logger utility instead of console.log directly
**Reason:** Need production-safe logging with different log levels
**File:** `lib/utils/logger.ts`

## 2025-01-14: Migration Organization
**Decision:** Move migrations to `docs/migrations/` with subdirectories
**Reason:** Better organization, separates dev/manual/rls scripts
**Impact:** Cleaner root directory
```

---

### 4. **Implementation Summaries** (You're already doing this!)
**Purpose:** Document HOW major features were implemented

**Location:** `.cursor/documentation/` (keep current structure)

**Examples:** You already have:
- `PAYMENT_FLOW_SUMMARY.md`
- `DUAL_RATE_AND_UI_UPDATES.md`
- `WEBHOOK_ANALYSIS.md`

**Keep doing this!** These are excellent for understanding implementation details.

---

### 5. **In-Code Documentation**
**Purpose:** Document WHY in the code itself

**Best Practices:**
- Add comments explaining non-obvious business logic
- Document complex algorithms
- Explain why certain patterns were chosen
- Use JSDoc for complex functions

**Example:**
```typescript
/**
 * Calculate tutor earnings using dual rate system.
 * 
 * Why dual rate? Student pays course rate, tutor earns based on their base rate.
 * This allows flexible pricing while ensuring tutor compensation.
 * 
 * @param tutorRate - Tutor's hourly base rate
 * @param duration - Session duration in minutes (60, 90, or 120)
 * @returns Calculated earnings for the tutor
 */
export function calculateTutorEarnings(...)
```

---

## 🎯 Recommended Workflow

### For Significant Decisions:
1. Create ADR in `.cursor/documentation/adr/`
2. Reference ADR in code comments where relevant
3. Update CHANGELOG.md when decision is implemented

### For Quick Decisions:
1. Add entry to DECISION_LOG.md
2. Add brief comment in code if needed

### After Completing Features:
1. Update CHANGELOG.md
2. Create implementation summary if complex
3. Update CONSOLIDATED_ROADMAP.md status

### For Bug Fixes:
1. Document in CHANGELOG.md
2. Add comment in code explaining the bug and fix
3. Consider ADR if fix required architectural change

---

## 📁 Recommended File Structure

```
.cursor/
├── documentation/
│   ├── adr/                          # Architecture Decision Records
│   │   ├── 001-payment-intent-choice.md
│   │   ├── 002-dual-rate-system.md
│   │   └── README.md                 # ADR index
│   ├── DECISION_LOG.md               # Quick decisions log
│   ├── [existing summaries]          # Keep your current structure
│   └── DOCUMENTATION_GUIDE.md       # This file
├── CONSOLIDATED_ROADMAP.md           # Main roadmap
└── chats/                            # Historical chat archives

CHANGELOG.md                          # Root level
```

---

## 🔄 When to Use Each Method

| Decision Type | Use This | Example |
|--------------|----------|---------|
| Major architectural choice | ADR | Payment flow architecture |
| Quick implementation choice | Decision Log | Logger utility choice |
| Feature completion | CHANGELOG | Added guest checkout |
| Complex implementation | Implementation Summary | Payment flow summary |
| Non-obvious code logic | In-code comments | Dual rate calculation |

---

## 💡 Benefits Over Chat History

1. **Searchable:** Structured markdown is easier to search
2. **Organized:** Decisions grouped by topic, not time
3. **Concise:** Focused on decisions, not entire conversations
4. **Versioned:** Git history shows when decisions were made
5. **Accessible:** New team members can find decisions quickly
6. **Maintainable:** Easy to update as decisions evolve

---

## 🚀 Getting Started

1. **Create ADR directory:**
   ```bash
   mkdir -p .cursor/documentation/adr
   ```

2. **Create initial ADRs** for decisions you've already made:
   - Payment Intent choice
   - Dual rate system
   - Cart vs direct booking

3. **Start CHANGELOG.md** and backfill recent changes

4. **Create DECISION_LOG.md** for quick reference

5. **Going forward:** Use the workflow above for new decisions

---

## 📝 Template Files

See:
- `.cursor/documentation/adr/template.md` - ADR template
- `CHANGELOG.md.template` - Changelog template (if needed)

---

**Last Updated:** 2025-01-04  
**Status:** Recommended approach for future documentation

